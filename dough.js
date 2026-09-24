// Recipe engine: pure functions, no DOM. Everything the page shows is derived
// from `computeRecipe(settings)` and rendered by app.js.

export const STYLES = {
  neapolitan: { hydration: 68, flourPerPizza: 155, saltPercent: 2.8, flour: "'00' flour (or bread flour)" },
  ny: { hydration: 62, flourPerPizza: 170, saltPercent: 2.5, flour: 'bread flour' },
  detroit: { hydration: 72, flourPerPizza: 180, saltPercent: 2.2, flour: 'bread flour' },
  roman: { hydration: 80, flourPerPizza: 333, saltPercent: 2.5, flour: "'00' flour (or bread flour)" },
};

// Instant yeast as a share of flour weight, before the room-temperature adjustment.
export const SCHEDULES = {
  quick: { yeastPercent: 1, label: 'Quick', span: '2–4 hours', riseMinutes: 150 },
  overnight: { yeastPercent: 0.4, label: 'Overnight', span: '12–24 hours', riseMinutes: 16 * 60 },
  long: { yeastPercent: 0.2, label: 'Long', span: '2–3 days', riseMinutes: 48 * 60 },
};

export const OVENS = ['home', 'pizza'];
export const LIMITS = { count: [1, 12], hydration: [55, 80], roomTemp: [15, 30] };
export const POOLISH = { flourShare: 0.3, yeastPercent: 0.1, hours: '12–16' };
const BASE_TEMP = 22;

const clamp = (n, [min, max]) => Math.min(max, Math.max(min, n));

// Accepts anything (URL params, old saved recipes) and returns valid settings.
export function normaliseSettings(input = {}) {
  const style = STYLES[input.style] ? input.style : 'neapolitan';
  const count = clamp(Math.round(Number(input.count) || 2), LIMITS.count);
  const hydrationRaw = Number(input.hydration);
  const hydration = Number.isFinite(hydrationRaw) && hydrationRaw > 0 ? clamp(Math.round(hydrationRaw), LIMITS.hydration) : STYLES[style].hydration;
  const oven = OVENS.includes(input.oven) ? input.oven : 'home';
  const time = SCHEDULES[input.time] ? input.time : 'quick';
  const tempRaw = Number(input.roomTemp);
  const roomTemp = input.roomTemp === '' || input.roomTemp == null || !Number.isFinite(tempRaw) ? null : clamp(tempRaw, LIMITS.roomTemp);
  const poolish = input.poolish === true || input.poolish === 'true' || input.poolish === '1';
  return { style, count, hydration, oven, time, roomTemp, poolish };
}

// Warmer rooms need less yeast, cooler rooms more: 5% per degree from 22°C, capped at ±50%.
export function temperatureAdjustment(roomTemp) {
  if (roomTemp == null) return { yeastMultiplier: 1, timing: null };
  const diff = roomTemp - BASE_TEMP;
  const yeastMultiplier = clamp(1 - diff * 0.05, [0.5, 1.5]);
  const timing = diff > 3 ? 'warm' : diff < -3 ? 'cool' : null;
  return { yeastMultiplier, timing };
}

export function computeRecipe(rawSettings) {
  const s = normaliseSettings(rawSettings);
  const style = STYLES[s.style];
  const { yeastMultiplier, timing } = temperatureAdjustment(s.roomTemp);

  const flour = style.flourPerPizza * s.count;
  const water = flour * (s.hydration / 100);
  const salt = flour * (style.saltPercent / 100);
  const yeast = flour * (SCHEDULES[s.time].yeastPercent / 100) * yeastMultiplier;
  const total = flour + water + salt + yeast;

  let poolish = null;
  if (s.poolish) {
    const pFlour = flour * POOLISH.flourShare;
    const pWater = pFlour; // 100% hydration
    const pYeast = pFlour * (POOLISH.yeastPercent / 100);
    poolish = {
      flour: pFlour,
      water: pWater,
      yeast: pYeast,
      // The final dough gets what is left, so the overall formula is unchanged.
      main: { flour: flour - pFlour, water: water - pWater, salt, yeast: Math.max(0, yeast - pYeast) },
    };
  }

  return {
    settings: s,
    flourType: style.flour,
    ingredients: { flour, water, salt, yeast },
    percents: { flour: 100, water: s.hydration, salt: style.saltPercent, yeast: (yeast / flour) * 100 },
    total,
    perPiece: total / s.count,
    poolish,
    timing,
    ovenMismatch: s.oven === 'pizza' && (s.style === 'detroit' || s.style === 'roman'),
  };
}

// --- Units -------------------------------------------------------------------

const GRAMS_PER_OZ = 28.3495;
const GRAMS_PER_CUP = { flour: 125, water: 237 };
const GRAMS_PER_TSP = { salt: 6, yeast: 3.1 };

const fraction = value => {
  const quarters = Math.round(value * 4);
  const whole = Math.floor(quarters / 4);
  const part = ['', '¼', '½', '¾'][quarters % 4];
  if (!whole && !part) return '<¼';
  return `${whole || ''}${part}`;
};

export const grams = g => (g < 10 ? `${g.toFixed(1)} g` : `${Math.round(g)} g`);

// Formats an ingredient amount. Imperial shows the everyday measure;
// grams are always available because weighing is more reliable.
export function amount(g, kind, units) {
  if (units !== 'imperial') return grams(g);
  if (kind === 'flour' || kind === 'water') {
    const cups = g / GRAMS_PER_CUP[kind];
    return `${(g / GRAMS_PER_OZ).toFixed(1)} oz · ${fraction(cups)} cup${cups > 1.1 ? 's' : ''}`;
  }
  const tsp = g / GRAMS_PER_TSP[kind];
  return `${fraction(tsp)} tsp`;
}

export const temp = (c, f, units) => (units === 'imperial' ? `${f}°F (${c}°C)` : `${c}°C (${f}°F)`);
export const size = (cm, inch, units) => (units === 'imperial' ? `${inch} (${cm})` : `${cm} (${inch})`);

// Stable key for notes; includes everything that changes the recipe.
export const notesKey = s => `${s.style}-${s.count}-${s.hydration}-${s.oven}-${s.time}${s.poolish ? '-poolish' : ''}`;
// The key used before the redesign, so existing notes are still found.
export const legacyNotesKey = s => `${s.style}-${s.count}-${s.hydration}`;

// Saved recipes from the old version stored `{ name, data: { style, pizzaCount, … }, savedAt }`.
export function migrateSaved(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (entry.settings) return { name: String(entry.name || 'Saved recipe'), settings: normaliseSettings(entry.settings), savedAt: entry.savedAt || null };
  if (entry.data) {
    const d = entry.data;
    return {
      name: String(entry.name || 'Saved recipe'),
      settings: normaliseSettings({ style: d.style, count: d.pizzaCount, hydration: d.hydration, oven: d.oven, time: d.time }),
      savedAt: entry.savedAt || null,
    };
  }
  return null;
}

export const toQuery = s => new URLSearchParams({
  style: s.style, count: s.count, hydration: s.hydration, oven: s.oven, time: s.time,
  ...(s.roomTemp != null ? { temp: s.roomTemp } : {}), ...(s.poolish ? { poolish: '1' } : {}),
}).toString();

export const fromQuery = query => {
  const p = new URLSearchParams(query);
  if (!p.has('style')) return null;
  return normaliseSettings({ style: p.get('style'), count: p.get('count'), hydration: p.get('hydration'), oven: p.get('oven'), time: p.get('time'), roomTemp: p.get('temp'), poolish: p.get('poolish') });
};
