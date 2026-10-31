// UI for the Pizza Dough Generator. All maths lives in dough.js and method.js;
// this file reads the form, renders the recipe and handles saving, the timer and the planner.
import {
  STYLES, SCHEDULES, LIMITS, computeRecipe, normaliseSettings, amount, grams,
  notesKey, legacyNotesKey, migrateSaved, toQuery, fromQuery,
} from './dough.js';
import { method, timeline, totalMinutes, approx, duration } from './method.js';

const $ = sel => document.querySelector(sel);
const form = $('#settings');

// localStorage can throw (private mode, blocked storage); never let that break the page.
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  getRaw(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
};

const STYLE_NAMES = { neapolitan: 'Neapolitan', ny: 'New York', detroit: 'Detroit', roman: 'Roman' };
const COUNT_HINT = {
  neapolitan: 'Pizzas, 25–30 cm (10–12 in) each.',
  ny: 'Pizzas, 30–35 cm (12–14 in) each.',
  detroit: 'Pans, 23×33 cm (9×13 in) each.',
  roman: 'Trays, 40×30 cm (16×12 in) each.',
};
const UNIT_WORD = { neapolitan: ['pizza', 'pizzas'], ny: ['pizza', 'pizzas'], detroit: ['Detroit pan', 'Detroit pans'], roman: ['Roman tray', 'Roman trays'] };
const PIECE_WORD = { neapolitan: 'Each dough ball', ny: 'Each dough ball', detroit: 'Dough per pan', roman: 'Dough per tray' };
const TIMER_NAMES = { poolish: 'Poolish', rest: 'Rest', fold: 'Stretch and fold', 'first-rise': 'First rise', 'cold-rise': 'Cold rise', proof: 'Proof', preheat: 'Preheat' };
// Short names for the planner summary ("Mix 14:00 · Ball 16:30 · Bake 18:30").
const PLAN_NAMES = { poolish: 'Poolish', measure: 'Mix', rise: null, proof: 'Ball', bake: 'Bake' };

let units = store.getRaw('units') === 'imperial' ? 'imperial' : 'metric';
let current = null;
let steps = [];

// --- Reading and writing the form ---------------------------------------------

function readForm() {
  const data = new FormData(form);
  return normaliseSettings({
    style: data.get('style'), count: data.get('count'), hydration: data.get('hydration'),
    oven: data.get('oven'), time: data.get('time'), roomTemp: data.get('roomTemp'),
    poolish: $('#poolish').checked,
  });
}

function writeForm(s) {
  form.querySelector(`input[name="style"][value="${s.style}"]`).checked = true;
  form.querySelector(`input[name="oven"][value="${s.oven}"]`).checked = true;
  form.querySelector(`input[name="time"][value="${s.time}"]`).checked = true;
  $('#count').value = s.count;
  $('#hydration').value = s.hydration;
  $('#room-temp').value = s.roomTemp ?? '';
  $('#poolish').checked = s.poolish;
}

function hydrationHint(h, style) {
  const { hydration: ideal, range: [lo, hi] } = STYLES[style];
  const base = `${h === ideal ? 'The usual hydration for this style' : `The usual for this style is ${ideal}%`}; ${lo}–${hi}% works well (marked on the slider).`;
  if (h < 60) return `${base} Expect a denser dough.`;
  if (h > 75) return `${base} Very sticky: wet hands and a bench scraper help.`;
  if (h > 70) return `${base} Sticky, so handle with wet hands.`;
  if (h <= 65) return `${base} Easy to handle, good for beginners.`;
  return base;
}

// --- Rendering -------------------------------------------------------------------

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = n => `${+n.toFixed(2)}%`;
const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;
const capital = s => s[0].toUpperCase() + s.slice(1);

function title(s) {
  const [one, many] = UNIT_WORD[s.style];
  return s.style === 'neapolitan' || s.style === 'ny' ? `${s.count} ${STYLE_NAMES[s.style]} ${s.count === 1 ? one : many}` : plural(s.count, [one, many]);
}

function formulaTable(rows, caption, footer = '') {
  return `<table class="formula">
    <caption>${caption}</caption>
    <thead><tr><th scope="col">Ingredient</th><th scope="col" class="num">Amount</th><th scope="col" class="num"><abbr title="Baker's percentage: weight as a share of the flour">Baker's %</abbr></th></tr></thead>
    <tbody>${rows.map(r => `<tr data-kind="${r.kind}"><th scope="row">${r.name}</th><td class="num">${r.amount}${r.grams ? `<span class="g">${r.grams}</span>` : ''}</td><td class="num">${r.pct ?? ''}</td></tr>`).join('')}</tbody>
    ${footer}
  </table>`;
}

const minutesOf = (s, time) => totalMinutes(method(computeRecipe({ ...s, time }), units));

function render({ fromUser = false } = {}) {
  const s = readForm();
  const previous = current;
  const r = computeRecipe(s);
  current = r;
  steps = method(r, units);
  const { ingredients: i, percents: p } = r;
  const showGrams = units === 'imperial';
  const row = (name, kind, g, percent) => ({ name, kind, amount: amount(g, kind, units), grams: showGrams ? grams(g) : '', pct: percent == null ? '' : pct(percent) });
  const total = totalMinutes(steps);

  $('#hydration-out').value = `${s.hydration}%`;
  $('#hydration-out').textContent = `${s.hydration}%`;
  $('#hydration-hint').textContent = hydrationHint(s.hydration, s.style);
  const [lo, hi] = STYLES[s.style].range;
  const band = $('#hydration-band');
  band.style.setProperty('--from', (lo - LIMITS.hydration[0]) / (LIMITS.hydration[1] - LIMITS.hydration[0]));
  band.style.setProperty('--to', (hi - LIMITS.hydration[0]) / (LIMITS.hydration[1] - LIMITS.hydration[0]));
  $('#count-hint').textContent = COUNT_HINT[s.style];
  $('#count-down').disabled = s.count <= LIMITS.count[0];
  $('#count-up').disabled = s.count >= LIMITS.count[1];
  // Each schedule's real length for these settings (style, poolish, room), from the method's steps.
  for (const el of document.querySelectorAll('[data-schedule]')) el.textContent = approx(minutesOf(s, el.dataset.schedule), { short: true });

  $('#recipe-title').textContent = title(s);
  $('#recipe-meta').textContent = [`${s.hydration}% hydration`, `${SCHEDULES[s.time].label.toLowerCase()} schedule`, s.oven === 'home' ? 'home oven' : 'pizza oven', s.poolish ? 'with poolish' : null, s.roomTemp != null ? `${s.roomTemp}°C room` : null].filter(Boolean).join(' · ');
  $('#recipe-total').textContent = `${capital(approx(total))}, start to oven.`;

  const totals = `<tfoot>
    <tr><th scope="row">Total dough</th><td class="num">${grams(r.total)}</td><td></td></tr>
    ${s.count > 1 ? `<tr><th scope="row">${PIECE_WORD[s.style]}</th><td class="num">${grams(r.perPiece)}</td><td></td></tr>` : ''}
  </tfoot>`;
  let html = formulaTable([
    row('Flour', 'flour', i.flour, p.flour), row('Water', 'water', i.water, p.water),
    row('Fine sea salt', 'salt', i.salt, p.salt), row('Instant yeast', 'yeast', i.yeast, p.yeast),
  ], r.poolish ? 'Whole formula' : 'Ingredients', totals);
  if (r.poolish) {
    const { poolish: pl } = r;
    html += `<div class="split">
      ${formulaTable([row('Flour', 'flour', pl.flour), row('Water', 'water', pl.water), row('Instant yeast', 'yeast', pl.yeast)], 'Poolish, the day before')}
      ${formulaTable([row('Flour', 'flour', pl.main.flour), row('Water', 'water', pl.main.water), row('Fine sea salt', 'salt', pl.main.salt), row('Instant yeast', 'yeast', pl.main.yeast)], 'Main dough, plus the poolish')}
    </div>`;
  }
  $('#formula').innerHTML = html;

  const warning = $('#oven-warning');
  warning.hidden = !r.ovenMismatch;
  warning.textContent = r.ovenMismatch ? `${STYLE_NAMES[s.style]} pizza needs a longer, gentler bake than a pizza oven gives. The method below explains; switch to "Home oven" for full baking steps.` : '';

  renderSteps();
  renderPresets();
  renderRecipeNote();

  if (fromUser && previous) changed(previous, r);
  const query = toQuery(s);
  if (location.search.slice(1) !== query) history.replaceState(null, '', `?${query}`);
}

function renderSteps() {
  const open = new Set([...document.querySelectorAll('.why-toggle[aria-expanded="true"]')].map(b => b.dataset.step));
  $('#steps').innerHTML = steps.map(step => `<li id="step-${step.id}"${step.note ? ' class="steps__note"' : ''}>
    <h4>${step.title}<span class="step__clock" data-clock="${step.id}" hidden></span></h4>
    <p>${step.text}</p>
    ${step.why ? `<button type="button" class="linkish why-toggle" data-step="${step.id}" aria-expanded="${open.has(step.id)}" aria-controls="why-${step.id}">Why?</button>
    <p class="step__why" id="why-${step.id}"${open.has(step.id) ? '' : ' hidden'}>${step.why}</p>` : ''}
    ${step.timer ? `<p class="step__timer"><button type="button" class="button button--quiet button--small" data-timer="${step.id}">Start ${step.timer.name} timer <span class="step__timer-time">(${duration(step.timer.minutes)})</span></button></p>` : ''}
  </li>`).join('');
  renderPlan();
}

$('#steps').addEventListener('click', event => {
  const why = event.target.closest('.why-toggle');
  if (why) {
    const open = why.getAttribute('aria-expanded') !== 'true';
    why.setAttribute('aria-expanded', String(open));
    $(`#why-${why.dataset.step}`).hidden = !open;
  }
  const timer = event.target.closest('[data-timer]');
  if (timer) {
    const step = steps.find(st => st.id === timer.dataset.timer);
    startTimer(step.timer.minutes, TIMER_NAMES[step.timer.name]);
  }
});

// --- Change feedback: highlight what changed, and a summary when the recipe is off-screen -------------------

let recipeVisible = true;
new IntersectionObserver(([entry]) => { recipeVisible = entry.isIntersecting; }).observe($('#formula'));

let toastTimer;
const pending = new Set();
function changed(before, after) {
  if (toQuery(before.settings) === toQuery(after.settings)) return;
  const kinds = ['flour', 'water', 'salt', 'yeast'].filter(k => grams(before.ingredients[k]) !== grams(after.ingredients[k]));
  for (const kind of kinds) for (const tr of document.querySelectorAll(`#formula tr[data-kind="${kind}"]`)) tr.classList.add('is-changed');
  if (recipeVisible) return;
  kinds.forEach(k => pending.add(k));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    const shown = ['flour', 'yeast', 'water', 'salt'].filter(k => pending.has(k)).slice(0, 2);
    pending.clear();
    const what = shown.map(k => `${amount(current.ingredients[k], k, units).split(' · ')[0]} ${k}`).join(' · ') || 'Method updated';
    const toast = $('#toast');
    toast.innerHTML = `<span>${esc(what)}</span><a href="#recipe">View recipe</a>`;
    toast.classList.add('is-on');
    clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(hideToast, 5000);
  }, 350);
}
function hideToast() {
  const toast = $('#toast');
  if (toast.matches(':focus-within, :hover')) { toast.hideTimer = setTimeout(hideToast, 2000); return; }
  toast.classList.remove('is-on');
  setTimeout(() => { if (!toast.classList.contains('is-on')) toast.textContent = ''; }, 300);
}
$('#toast').addEventListener('click', event => { if (event.target.closest('a')) { $('#toast').classList.remove('is-on'); $('#toast').textContent = ''; } });

// --- "Ready by" planner -------------------------------------------------------------------------

const readyInput = $('#ready-by');
const pad = n => String(n).padStart(2, '0');
const localValue = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const round5 = d => new Date(Math.round(d.getTime() / 300000) * 300000);
const sameDay = (a, b) => a.toDateString() === b.toDateString();

function readyBy() {
  if (!readyInput.value) return null;
  const d = new Date(readyInput.value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function renderPlan() {
  const target = readyBy();
  $('#ready-clear').hidden = !target;
  const clocks = document.querySelectorAll('[data-clock]');
  const hint = $('#ready-hint');
  if (!target) {
    clocks.forEach(c => { c.hidden = true; c.textContent = ''; });
    hint.textContent = 'When you want the first pizza in the oven. Each step then shows its time.';
    return;
  }
  const plan = timeline(steps);
  const at = minutes => round5(new Date(target.getTime() - minutes * 60000));
  const now = new Date();
  const times = plan.map(t => at(t.before));
  const showDay = !times.every(t => sameDay(t, now)) || !sameDay(target, now);
  const clock = d => d.toLocaleString('en-GB', showDay ? { weekday: 'short', hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit' });
  const summary = [];
  steps.forEach((step, n) => {
    const el = document.querySelector(`[data-clock="${step.id}"]`);
    if (step.note) { el.hidden = true; return; }
    let text = clock(times[n]);
    if (step.preheat) {
      const pre = at(step.preheat);
      text = `preheat ${clock(pre)} · bake ${clock(times[n])}`;
      summary.push([pre, `Preheat ${clock(pre)}`]);
    }
    el.textContent = text;
    el.hidden = false;
    if (PLAN_NAMES[step.id]) summary.push([times[n], `${step.id === 'proof' && current.settings.style === 'roman' ? 'Shape' : PLAN_NAMES[step.id]} ${clock(times[n])}`]);
  });
  const start = times[0];
  hint.textContent = start < now
    ? `That’s too soon: this recipe takes ${approx(totalMinutes(steps))}. Starting now, the first pizza goes in about ${clock(round5(new Date(now.getTime() + totalMinutes(steps) * 60000)))}.`
    : summary.sort((a, b) => a[0] - b[0]).map(([, text]) => text).join(' · ');
}

readyInput.addEventListener('change', () => {
  const target = readyBy();
  if (target) store.set('readyBy', localValue(target)); else store.remove('readyBy');
  renderPlan();
});
$('#ready-clear').addEventListener('click', () => { readyInput.value = ''; store.remove('readyBy'); renderPlan(); readyInput.focus(); });

// --- Copy, share, print ---------------------------------------------------------------

function recipeText() {
  const lines = [`${$('#recipe-title').textContent} — ${$('#recipe-meta').textContent}`, $('#recipe-total').textContent, ''];
  for (const table of document.querySelectorAll('#formula table')) {
    lines.push(table.caption.textContent);
    for (const tr of table.tBodies[0].rows) lines.push(`- ${tr.cells[0].textContent}: ${tr.cells[1].firstChild.textContent}${tr.cells[2].textContent ? ` (${tr.cells[2].textContent})` : ''}`);
    lines.push('');
  }
  lines.push('Method');
  const strip = html => html.replace(/<[^>]+>/g, '');
  steps.forEach((step, n) => lines.push(`${n + 1}. ${step.title}`, strip(step.text) + (step.why ? ` ${strip(step.why)}` : ''), ''));
  lines.push(location.href);
  return lines.join('\n');
}

const status = msg => { $('#status').textContent = msg; setTimeout(() => { if ($('#status').textContent === msg) $('#status').textContent = ''; }, 4000); };

async function copy(text, done) {
  try { await navigator.clipboard.writeText(text); status(done); } catch { status('Couldn’t copy automatically. Select the text and copy it instead.'); }
}

$('#copy').addEventListener('click', () => copy(recipeText(), 'Recipe copied.'));
$('#share').addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: 'Pizza dough recipe', text: $('#recipe-title').textContent, url: location.href }); } catch { /* cancelled */ }
  } else {
    copy(location.href, 'Link copied. Anyone who opens it sees this exact recipe.');
  }
});
$('#print').addEventListener('click', () => window.print());

// --- Settings events ------------------------------------------------------------------

form.addEventListener('input', event => {
  if (event.target.name === 'style') {
    // A new style starts from its usual hydration, as before.
    $('#hydration').value = STYLES[event.target.value].hydration;
  }
  if (event.target.id === 'count' && event.target.value === '') return; // let people type
  render({ fromUser: true });
});
form.addEventListener('change', event => { if (event.target.id === 'count') { $('#count').value = readForm().count; render({ fromUser: true }); } });
form.addEventListener('submit', event => event.preventDefault());
const step = delta => { $('#count').value = normaliseSettings({ ...readForm(), count: readForm().count + delta }).count; render({ fromUser: true }); };
$('#count-down').addEventListener('click', () => step(-1));
$('#count-up').addEventListener('click', () => step(1));

document.querySelectorAll('[data-units]').forEach(button => button.addEventListener('click', () => {
  units = button.dataset.units;
  store.set('units', units);
  document.querySelectorAll('[data-units]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  render();
}));

// --- Saved recipes, each with an optional note ---------------------------------------------

const loadSaved = () => (store.get('favoriteRecipes', []) || []).map(migrateSaved).filter(Boolean);
const writeSaved = list => store.set('favoriteRecipes', list);

// Notes used to be kept separately, per recipe. Move each one onto a saved recipe with the same
// settings, or into a new saved entry, once. The old notes stay in storage untouched.
function migrateNotes() {
  if (store.getRaw('notesMerged')) return;
  const notes = store.get('recipeNotes', {}) || {};
  const list = loadSaved();
  for (const [key, note] of Object.entries(notes)) {
    if (!note || typeof note !== 'string') continue;
    const [style, count, hydration, oven, time, poolish] = key.split('-');
    const settings = normaliseSettings({ style, count, hydration, oven, time, poolish: poolish === 'poolish' });
    const match = list.find(item => !item.note && (notesKey(item.settings) === key || legacyNotesKey(item.settings) === key));
    if (match) match.note = note;
    else list.push({ name: `${title(settings)} (notes)`, settings, note, savedAt: null });
  }
  if (Object.keys(notes).length) writeSaved(list.slice(0, 60));
  store.set('notesMerged', '1');
}

function renderSaved() {
  const list = loadSaved();
  $('#saved-empty').hidden = list.length > 0;
  $('#saved').innerHTML = list.map((item, index) => `<li>
    <button type="button" class="saved__load" data-load="${index}"><span class="saved__name">${esc(item.name)}</span><span class="saved__meta">${esc(title(item.settings))} · ${item.settings.hydration}% · ${esc(SCHEDULES[item.settings.time].label.toLowerCase())}${item.settings.poolish ? ' · poolish' : ''}</span>${item.note ? `<span class="saved__note">${esc(item.note)}</span>` : ''}</button>
    <button type="button" class="linkish saved__delete" data-delete="${index}" aria-label="Delete ${esc(item.name)}">Delete</button>
  </li>`).join('');
}

// The note of a saved recipe with exactly these settings, shown with the recipe (and printed with it).
function renderRecipeNote() {
  const key = notesKey(current.settings);
  const item = loadSaved().find(it => it.note && notesKey(it.settings) === key);
  const el = $('#recipe-note');
  el.hidden = !item;
  el.innerHTML = item ? `<strong>Your note${item.name ? ` · ${esc(item.name)}` : ''}</strong> ${esc(item.note)}` : '';
}

$('#save-form').addEventListener('submit', event => {
  event.preventDefault();
  const s = current.settings;
  const name = $('#save-name').value.trim() || `${title(s)}, ${new Date().toLocaleDateString('en-GB')}`;
  const note = $('#save-note').value.trim();
  // Saving under an existing name updates that entry.
  const list = loadSaved().filter(item => item.name.toLowerCase() !== name.toLowerCase());
  const replaced = list.length < loadSaved().length;
  list.unshift({ name, settings: s, note, savedAt: new Date().toISOString() });
  if (!writeSaved(list.slice(0, 60))) return status('Couldn’t save: this browser is blocking storage.');
  $('#save-name').value = '';
  $('#save-note').value = '';
  renderSaved();
  renderRecipeNote();
  savedStatus(`${replaced ? 'Updated' : 'Saved'} “${name}”.`);
});

const savedStatus = msg => { $('#saved-empty').hidden = false; $('#saved-empty').textContent = msg; setTimeout(() => { $('#saved-empty').textContent = 'Nothing saved yet. Saved recipes and notes stay in this browser.'; $('#saved-empty').hidden = loadSaved().length > 0; }, 3500); };

$('#saved').addEventListener('click', event => {
  const load = event.target.closest('[data-load]');
  const del = event.target.closest('[data-delete]');
  const list = loadSaved();
  if (load) {
    const item = list[Number(load.dataset.load)];
    writeForm(item.settings);
    render();
    status(`Loaded “${item.name}”.`);
    $('#recipe').scrollIntoView({ block: 'start' });
    $('#recipe').focus({ preventScroll: true });
  }
  if (del) {
    const [removed] = list.splice(Number(del.dataset.delete), 1);
    writeSaved(list);
    renderSaved();
    renderRecipeNote();
    savedStatus(`Deleted “${removed.name}”.`);
    $('#saved-title').parentElement.focus({ preventScroll: true });
  }
});

// --- Timer (end time kept in localStorage, so it survives reloads) ------------------------

let tick = null;
const fmt = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map(n => String(n).padStart(2, '0')).join(':');
};
const timerLabel = () => store.getRaw('timerLabel') || '';

function showRunning(running) {
  $('#timer-stop').hidden = !running;
  $('#timer-pill').hidden = !running;
  $('#tab-timer-time').hidden = !running;
  $('#tab-timer-word').className = running ? 'vh' : '';
  document.documentElement.classList.toggle('timer-running', running);
}

function finishTimer(silent = false) {
  clearInterval(tick); tick = null;
  const label = timerLabel();
  store.remove('timerEndTime');
  store.remove('timerLabel');
  $('#timer-display').textContent = '00:00:00';
  showRunning(false);
  document.title = document.title.replace(/^\(\d.*?\) |^Dough ready! /, '');
  if (silent) return;
  $('#timer-status').textContent = `Time’s up${label ? ` (${label.toLowerCase()})` : ''}: your dough is ready for the next step.`;
  document.title = `Dough ready! ${document.title}`;
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('Pizza Dough Generator', { body: `${label ? `${label}: ` : ''}your dough is ready for the next step.`, icon: 'favicon.svg' }); } catch {}
  }
}

function runTimer(end) {
  clearInterval(tick);
  showRunning(true);
  const update = () => {
    const left = end - Date.now();
    if (left <= 0) return finishTimer();
    const text = fmt(left);
    $('#timer-display').textContent = text;
    $('#timer-pill-time').textContent = text;
    $('#tab-timer-time').textContent = text;
    document.title = `(${text}) ${document.title.replace(/^\(\d.*?\) |^Dough ready! /, '')}`;
  };
  update();
  tick = setInterval(update, 1000);
}

const endsAt = end => new Date(end).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

function startTimer(minutes, label = '') {
  const end = Date.now() + minutes * 60000;
  store.set('timerEndTime', String(end));
  if (label) store.set('timerLabel', label); else store.remove('timerLabel');
  $('#timer-status').textContent = `${label ? `${label}: running` : 'Running'}. Ends at ${endsAt(end)}.`;
  runTimer(end);
  status(`${label || 'Timer'} started: ${duration(minutes)}.`);
}

function stopTimer() {
  finishTimer(true);
  $('#timer-status').textContent = 'Timer stopped.';
  status('Timer stopped.');
}

// One preset per timed step of the current recipe.
function renderPresets() {
  $('#timer-presets').innerHTML = steps.filter(st => st.timer).map(st => `<button type="button" class="button" data-timer="${st.id}">${TIMER_NAMES[st.timer.name]} <span class="presets__time">${duration(st.timer.minutes)}</span></button>`).join('');
}
$('#timer-presets').addEventListener('click', event => {
  const button = event.target.closest('[data-timer]');
  if (!button) return;
  const st = steps.find(x => x.id === button.dataset.timer);
  startTimer(st.timer.minutes, TIMER_NAMES[st.timer.name]);
});
$('#timer-form').addEventListener('submit', event => {
  event.preventDefault();
  const minutes = (Number($('#timer-hours').value) || 0) * 60 + (Number($('#timer-minutes').value) || 0);
  if (minutes < 1 || minutes > 72 * 60) { $('#timer-status').textContent = 'Choose between 1 minute and 72 hours.'; return; }
  startTimer(minutes);
});
$('#timer-stop').addEventListener('click', () => { stopTimer(); $('#timer-presets button')?.focus(); });
$('#timer-pill').addEventListener('click', () => { stopTimer(); $('#timer').focus({ preventScroll: true }); });

if ('Notification' in window && Notification.permission === 'default') {
  const notify = $('#notify');
  notify.hidden = false;
  notify.addEventListener('click', async () => {
    const result = await Notification.requestPermission();
    notify.hidden = true;
    $('#timer-status').textContent = result === 'granted' ? 'You’ll get a notification when the timer ends.' : 'Notifications are off; the tab title will change instead.';
  });
}

// The floating timer sits below the header on wide screens, never over it.
const header = $('.top');
const placePill = () => document.documentElement.style.setProperty('--header-bottom', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
addEventListener('scroll', placePill, { passive: true });
addEventListener('resize', placePill);

// --- Keep the screen awake while cooking (only where the browser supports it) ----------------

let wakeLock = null;
if ('wakeLock' in navigator) {
  const wake = $('#wake');
  $('#wake-field').hidden = false;
  const request = async () => {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch { wake.checked = false; status('This browser wouldn’t keep the screen awake.'); }
  };
  wake.addEventListener('change', async () => {
    if (wake.checked) await request();
    else { await wakeLock?.release(); wakeLock = null; }
  });
  // The browser releases the lock when the tab is hidden; take it again on return.
  document.addEventListener('visibilitychange', () => { if (wake.checked && !wakeLock && document.visibilityState === 'visible') request(); });
}

// --- Phone section bar: scrollspy -----------------------------------------------------------

const spyLinks = [...document.querySelectorAll('.tabbar a')];
const spyTargets = spyLinks.map(a => document.getElementById(a.dataset.spy));
let spyFrame = 0;
function spy() {
  spyFrame = 0;
  const line = innerHeight * 0.35;
  let active = null;
  spyTargets.forEach((el, n) => { if (el.getBoundingClientRect().top <= line) active = n; });
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && spyTargets.at(-1).getBoundingClientRect().top < innerHeight) active = spyTargets.length - 1;
  spyLinks.forEach((a, n) => { if (n === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
}
addEventListener('scroll', () => { if (!spyFrame) spyFrame = requestAnimationFrame(spy); }, { passive: true });
addEventListener('resize', spy);

// --- Wide screens: timer and saved recipes join the settings column ----------------------------

const wide = matchMedia('(min-width: 60rem)');
function arrange() {
  const side = $('#side');
  const recipe = $('#recipe');
  const timer = $('#timer');
  const saved = $('#saved-section');
  const focused = document.activeElement;
  if (wide.matches && timer.parentElement !== side) side.append(timer, saved);
  if (!wide.matches && timer.parentElement === side) recipe.after(timer, saved);
  if (focused && focused !== document.activeElement && document.contains(focused)) focused.focus({ preventScroll: true });
}
wide.addEventListener?.('change', arrange);

// --- Theme: the button shows the current theme; pressed means dark ------------------------------

const themeButton = $('#theme-toggle');
const isDark = () => document.documentElement.dataset.theme === 'dark'
  || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
const syncTheme = () => {
  const dark = isDark();
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.title = dark ? 'Dark mode is on' : 'Dark mode is off';
};
themeButton.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('theme', next);
  syncTheme();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncTheme);

// --- Start ---------------------------------------------------------------------------------

document.querySelectorAll('[data-units]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.units === units)));
const fromUrl = fromQuery(location.search);
if (fromUrl) writeForm(fromUrl);
const savedReady = store.getRaw('readyBy');
if (savedReady && new Date(savedReady) > new Date()) readyInput.value = savedReady; else store.remove('readyBy');
readyInput.min = localValue(new Date());
arrange();
syncTheme();
migrateNotes();
render();
renderSaved();
placePill();
spy();
const savedEnd = Number(store.getRaw('timerEndTime'));
if (savedEnd) {
  if (savedEnd > Date.now()) { runTimer(savedEnd); $('#timer-status').textContent = `${timerLabel() ? `${timerLabel()}: running` : 'Running'}. It kept going while the page was closed. Ends at ${endsAt(savedEnd)}.`; }
  else { finishTimer(); }
}
