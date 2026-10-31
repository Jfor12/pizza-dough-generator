// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRecipe, normaliseSettings, amount, migrateSaved, toQuery, fromQuery, notesKey, temperatureAdjustment } from '../dough.js';
import { method, timeline, totalMinutes, approx, duration } from '../method.js';

const near = (a, b, eps = 0.05) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('matches the original calculator for the default recipe', () => {
  const r = computeRecipe({ style: 'neapolitan', count: 2, hydration: 68, time: 'quick' });
  near(r.ingredients.flour, 310);
  near(r.ingredients.water, 210.8);
  near(r.ingredients.salt, 8.68);
  near(r.ingredients.yeast, 3.1);
});

test('schedules use 1%, 0.4% and 0.2% instant yeast', () => {
  for (const [time, pct] of [['quick', 1], ['overnight', 0.4], ['long', 0.2]]) {
    near(computeRecipe({ style: 'ny', count: 1, time }).percents.yeast, pct, 1e-9);
  }
});

test('poolish: main dough gets the remainder, so totals are unchanged', () => {
  const r = computeRecipe({ style: 'neapolitan', count: 4, hydration: 68, time: 'overnight', poolish: true });
  const { poolish: p, ingredients: i } = r;
  near(p.flour, i.flour * 0.3);
  near(p.water, p.flour);
  near(p.flour + p.main.flour, i.flour);
  near(p.water + p.main.water, i.water);
  near(p.yeast + p.main.yeast, i.yeast); // old version added poolish yeast on top
  const steps = method(r, 'metric');
  assert.match(steps[0].title, /poolish/i);
  assert.ok(steps[1].text.includes(`${Math.round(p.main.flour)} g`), 'measure step uses main-dough flour, not the full amount');
  assert.ok(!steps[1].text.includes(`${Math.round(i.flour)} g`));
});

test('imperial flour uses ~125 g per cup (old version used 240)', () => {
  assert.equal(amount(500, 'flour', 'imperial'), '17.6 oz · 4 cups');
  assert.equal(amount(237, 'water', 'imperial'), '8.4 oz · 1 cup');
  assert.equal(amount(6, 'salt', 'imperial'), '1 tsp');
  assert.equal(amount(1.55, 'yeast', 'imperial'), '½ tsp');
  assert.equal(amount(310, 'flour', 'metric'), '310 g');
  assert.equal(amount(3.1, 'yeast', 'metric'), '3.1 g');
});

test('room temperature adjusts yeast 5% per degree, capped, and notes timing on the rise', () => {
  assert.deepEqual(temperatureAdjustment(null), { yeastMultiplier: 1, timing: null });
  near(temperatureAdjustment(26).yeastMultiplier, 0.8, 1e-9);
  assert.equal(temperatureAdjustment(26).timing, 'warm');
  assert.equal(temperatureAdjustment(15).timing, 'cool');
  const steps = method(computeRecipe({ time: 'quick', roomTemp: 28 }), 'metric');
  const rise = steps.find(s => /rise/i.test(s.title));
  assert.match(rise.text, /less time/);
  assert.doesNotMatch(steps.find(s => /Measure/.test(s.title)).text, /less time/);
});

test('settings are clamped and defaulted', () => {
  assert.deepEqual(normaliseSettings({ style: 'x', count: 99, hydration: 5, oven: 'x', time: 'x', roomTemp: 50 }),
    { style: 'neapolitan', count: 12, hydration: 55, oven: 'home', time: 'quick', roomTemp: 30, poolish: false });
  assert.equal(normaliseSettings({ style: 'roman' }).hydration, 80, 'missing hydration uses the style default');
  assert.equal(normaliseSettings({ roomTemp: '' }).roomTemp, null);
});

test('saved recipes from the old version are migrated', () => {
  const old = { name: 'Friday', data: { style: 'ny', pizzaCount: 3, hydration: 63, oven: 'pizza', time: 'overnight', flour: 510 }, savedAt: '2025-08-01T10:00:00Z' };
  assert.deepEqual(migrateSaved(old), { name: 'Friday', settings: { style: 'ny', count: 3, hydration: 63, oven: 'pizza', time: 'overnight', roomTemp: null, poolish: false }, note: '', savedAt: '2025-08-01T10:00:00Z' });
  assert.equal(migrateSaved(null), null);
});

test('settings round-trip through the URL', () => {
  const s = normaliseSettings({ style: 'detroit', count: 2, hydration: 74, oven: 'home', time: 'long', roomTemp: 19, poolish: true });
  assert.deepEqual(fromQuery(toQuery(s)), s);
  assert.equal(fromQuery(''), null);
});

test('notes key separates oven and schedule', () => {
  const a = normaliseSettings({ time: 'quick' });
  const b = normaliseSettings({ time: 'long' });
  assert.notEqual(notesKey(a), notesKey(b));
});

test('every combination produces a complete method with no unfilled values', () => {
  for (const style of ['neapolitan', 'ny', 'detroit', 'roman'])
    for (const time of ['quick', 'overnight', 'long'])
      for (const oven of ['home', 'pizza'])
        for (const poolish of [false, true])
          for (const units of ['metric', 'imperial']) {
            const steps = method(computeRecipe({ style, time, oven, poolish, count: 3, roomTemp: 25 }), units);
            assert.ok(steps.length >= 5);
            for (const st of steps) assert.doesNotMatch(st.text + st.title, /undefined|NaN|null|\$\{/);
          }
});

test('schedule length is worked out from the method steps, start to oven', () => {
  const total = s => totalMinutes(method(computeRecipe(s), 'metric'));
  // Quick: weigh 10 + mix and rest 25 + knead 10 + rise 150 + ball 10 + proof 45 = 250 minutes.
  assert.equal(total({ time: 'quick' }), 250);
  assert.equal(approx(total({ time: 'quick' })), 'about 4 hours');
  assert.equal(approx(total({ time: 'overnight' })), 'about 20 hours');
  assert.equal(approx(total({ time: 'long' })), 'about 2 days');
  // A poolish adds 12–16 hours up front; a warm room shortens the quick rise.
  assert.ok(total({ time: 'quick', poolish: true }) - total({ time: 'quick' }) === 14 * 60);
  assert.ok(total({ time: 'quick', roomTemp: 27 }) < total({ time: 'quick' }));
  assert.equal(approx(270), 'about 4½ hours');
  assert.equal(approx(270, { short: true }), 'about 4½ h');
});

test('timeline counts back from the bake; the preheat overlaps the proof', () => {
  const steps = method(computeRecipe({ time: 'quick', oven: 'home', style: 'neapolitan' }), 'metric');
  const plan = timeline(steps);
  const bake = steps.findIndex(s => s.id === 'bake');
  assert.equal(plan[0].before, totalMinutes(steps));
  assert.equal(plan[bake].before, 0);
  assert.equal(steps[bake].preheat, 60);
  assert.ok(steps.filter(s => s.timer).map(s => s.timer.name).join() === 'rest,first-rise,proof,preheat');
  assert.equal(duration(150), '2 h 30 min');
  assert.equal(duration(2880), '2 days');
});

test('every step leads with its action and the explanation is separate', () => {
  for (const time of ['quick', 'overnight', 'long']) for (const style of ['neapolitan', 'ny', 'detroit', 'roman']) {
    for (const step of method(computeRecipe({ style, time, poolish: true, hydration: 75 }), 'metric')) {
      assert.match(step.text, /^<strong class="lead">/, `${style}/${time}/${step.id}`);
      assert.equal(typeof step.why, 'string');
    }
  }
});

test('saved recipes keep their note', () => {
  assert.equal(migrateSaved({ name: 'A', settings: { style: 'ny' }, note: 'Try 70%' }).note, 'Try 70%');
});
