// UI for the Pizza Dough Generator. All maths lives in dough.js and method.js;
// this file reads the form, renders the recipe and handles saving and the timer.
import {
  STYLES, SCHEDULES, LIMITS, computeRecipe, normaliseSettings, amount, grams,
  notesKey, legacyNotesKey, migrateSaved, toQuery, fromQuery,
} from './dough.js';
import { method } from './method.js';

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

let units = store.getRaw('units') === 'imperial' ? 'imperial' : 'metric';
let current = null;

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
  const ideal = STYLES[style].hydration;
  const base = h === ideal ? 'The usual hydration for this style.' : `The usual for this style is ${ideal}%.`;
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

function title(s) {
  const [one, many] = UNIT_WORD[s.style];
  return s.style === 'neapolitan' || s.style === 'ny' ? `${s.count} ${STYLE_NAMES[s.style]} ${s.count === 1 ? one : many}` : plural(s.count, [one, many]);
}

function formulaTable(rows, caption, footer = '') {
  return `<table class="formula">
    <caption>${caption}</caption>
    <thead><tr><th scope="col">Ingredient</th><th scope="col" class="num">Amount</th><th scope="col" class="num"><abbr title="Baker's percentage: weight as a share of the flour">Baker's %</abbr></th></tr></thead>
    <tbody>${rows.map(r => `<tr><th scope="row">${r.name}</th><td class="num">${r.amount}${r.grams ? `<span class="g">${r.grams}</span>` : ''}</td><td class="num">${r.pct ?? ''}</td></tr>`).join('')}</tbody>
    ${footer}
  </table>`;
}

function render() {
  const s = readForm();
  const r = computeRecipe(s);
  current = r;
  const { ingredients: i, percents: p } = r;
  const showGrams = units === 'imperial';
  const row = (name, kind, g, percent) => ({ name, amount: amount(g, kind, units), grams: showGrams ? grams(g) : '', pct: percent == null ? '' : pct(percent) });

  $('#hydration-out').value = `${s.hydration}%`;
  $('#hydration-out').textContent = `${s.hydration}%`;
  $('#hydration-hint').textContent = hydrationHint(s.hydration, s.style);
  $('#count-hint').textContent = COUNT_HINT[s.style];
  $('#count-down').disabled = s.count <= LIMITS.count[0];
  $('#count-up').disabled = s.count >= LIMITS.count[1];

  $('#recipe-title').textContent = title(s);
  $('#recipe-meta').textContent = [`${s.hydration}% hydration`, `${SCHEDULES[s.time].label.toLowerCase()} rise (${SCHEDULES[s.time].span})`, s.oven === 'home' ? 'home oven' : 'pizza oven', s.poolish ? 'with poolish' : null, s.roomTemp != null ? `${s.roomTemp}°C room` : null].filter(Boolean).join(' · ');

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

  $('#steps').innerHTML = method(r, units).map(step => `<li><h4>${step.title}</h4><p>${step.text}</p></li>`).join('');

  const minutes = SCHEDULES[s.time].riseMinutes;
  $('#timer-recipe').textContent = `Time the ${s.time === 'quick' ? 'first rise' : 'cold rise'} (${minutes >= 1440 ? `${minutes / 1440} days` : `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`})`;

  loadNotes();
  const query = toQuery(s);
  if (location.search.slice(1) !== query) history.replaceState(null, '', `?${query}`);
}

// --- Notes (autosaved per recipe) --------------------------------------------------

function loadNotes() {
  const all = store.get('recipeNotes', {});
  const s = current.settings;
  $('#notes').value = all[notesKey(s)] ?? all[legacyNotesKey(s)] ?? '';
}

let notesTimer;
$('#notes').addEventListener('input', () => {
  clearTimeout(notesTimer);
  notesTimer = setTimeout(() => {
    const all = store.get('recipeNotes', {});
    const value = $('#notes').value;
    if (value) all[notesKey(current.settings)] = value; else delete all[notesKey(current.settings)];
    $('#notes-status').textContent = store.set('recipeNotes', all) ? 'Saved.' : 'Couldn’t save: this browser is blocking storage.';
  }, 400);
});

// --- Copy, share, print ---------------------------------------------------------------

function recipeText() {
  const r = current;
  const lines = [`${$('#recipe-title').textContent} — ${$('#recipe-meta').textContent}`, ''];
  for (const table of document.querySelectorAll('#formula table')) {
    lines.push(table.caption.textContent);
    for (const tr of table.tBodies[0].rows) lines.push(`- ${tr.cells[0].textContent}: ${tr.cells[1].firstChild.textContent}${tr.cells[2].textContent ? ` (${tr.cells[2].textContent})` : ''}`);
    lines.push('');
  }
  lines.push('Method');
  method(r, units).forEach((step, n) => lines.push(`${n + 1}. ${step.title}`, step.text.replace(/<[^>]+>/g, ''), ''));
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
  render();
});
form.addEventListener('change', event => { if (event.target.id === 'count') { $('#count').value = readForm().count; render(); } });
form.addEventListener('submit', event => event.preventDefault());
const step = delta => { $('#count').value = normaliseSettings({ ...readForm(), count: readForm().count + delta }).count; render(); };
$('#count-down').addEventListener('click', () => step(-1));
$('#count-up').addEventListener('click', () => step(1));

document.querySelectorAll('[data-units]').forEach(button => button.addEventListener('click', () => {
  units = button.dataset.units;
  store.set('units', units);
  document.querySelectorAll('[data-units]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  render();
}));

// --- Saved recipes -----------------------------------------------------------------------

const loadSaved = () => (store.get('favoriteRecipes', []) || []).map(migrateSaved).filter(Boolean);
const writeSaved = list => store.set('favoriteRecipes', list);

function renderSaved() {
  const list = loadSaved();
  $('#saved-empty').hidden = list.length > 0;
  $('#saved').innerHTML = list.map((item, index) => `<li>
    <button type="button" class="saved__load" data-load="${index}"><span class="saved__name">${esc(item.name)}</span><span class="saved__meta">${esc(title(item.settings))} · ${item.settings.hydration}% · ${esc(SCHEDULES[item.settings.time].label.toLowerCase())}</span></button>
    <button type="button" class="linkish saved__delete" data-delete="${index}" aria-label="Delete ${esc(item.name)}">Delete</button>
  </li>`).join('');
}

$('#save-form').addEventListener('submit', event => {
  event.preventDefault();
  const s = current.settings;
  const name = $('#save-name').value.trim() || `${title(s)}, ${new Date().toLocaleDateString('en-GB')}`;
  const list = loadSaved();
  list.unshift({ name, settings: s, savedAt: new Date().toISOString() });
  if (!writeSaved(list.slice(0, 30))) return status('Couldn’t save: this browser is blocking storage.');
  $('#save-name').value = '';
  renderSaved();
  status(`Saved “${name}”.`);
});

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
    status(`Deleted “${removed.name}”.`);
  }
});

// --- Timer (end time kept in localStorage, so it survives reloads) ------------------------

let tick = null;
const fmt = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map(n => String(n).padStart(2, '0')).join(':');
};

function finishTimer(silent = false) {
  clearInterval(tick); tick = null;
  store.remove('timerEndTime');
  $('#timer-display').textContent = '00:00:00';
  $('#timer-stop').disabled = true;
  document.title = document.title.replace(/^\(\d.*?\) |^Dough ready! /, '');
  if (silent) return;
  $('#timer-status').textContent = 'Time’s up: your dough is ready for the next step.';
  document.title = `Dough ready! ${document.title}`;
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('Pizza Dough Generator', { body: 'Your dough is ready for the next step.', icon: 'favicon.svg' }); } catch {}
  }
}

function runTimer(end) {
  clearInterval(tick);
  $('#timer-stop').disabled = false;
  const update = () => {
    const left = end - Date.now();
    if (left <= 0) return finishTimer();
    $('#timer-display').textContent = fmt(left);
    document.title = `(${fmt(left)}) ${document.title.replace(/^\(\d.*?\) |^Dough ready! /, '')}`;
  };
  update();
  tick = setInterval(update, 1000);
}

function startTimer(minutes) {
  const end = Date.now() + minutes * 60000;
  store.set('timerEndTime', String(end));
  $('#timer-status').textContent = `Running. Ends at ${new Date(end).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.`;
  runTimer(end);
}

$('#timer-recipe').addEventListener('click', () => startTimer(SCHEDULES[current.settings.time].riseMinutes));
$('#timer-form').addEventListener('submit', event => {
  event.preventDefault();
  const minutes = (Number($('#timer-hours').value) || 0) * 60 + (Number($('#timer-minutes').value) || 0);
  if (minutes < 1 || minutes > 72 * 60) { $('#timer-status').textContent = 'Choose between 1 minute and 72 hours.'; return; }
  startTimer(minutes);
});
$('#timer-stop').addEventListener('click', () => { finishTimer(true); $('#timer-status').textContent = 'Timer stopped.'; });

if ('Notification' in window && Notification.permission === 'default') {
  const notify = $('#notify');
  notify.hidden = false;
  notify.addEventListener('click', async () => {
    const result = await Notification.requestPermission();
    notify.hidden = true;
    $('#timer-status').textContent = result === 'granted' ? 'You’ll get a notification when the timer ends.' : 'Notifications are off; the tab title will change instead.';
  });
}

// --- Theme --------------------------------------------------------------------------------

const themeButton = $('#theme-toggle');
const isDark = () => document.documentElement.dataset.theme === 'dark'
  || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
const syncTheme = () => {
  themeButton.textContent = isDark() ? 'Light mode' : 'Dark mode';
  themeButton.setAttribute('aria-pressed', String(isDark()));
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
syncTheme();
render();
renderSaved();
const savedEnd = Number(store.getRaw('timerEndTime'));
if (savedEnd) {
  if (savedEnd > Date.now()) { runTimer(savedEnd); $('#timer-status').textContent = 'Running. It kept going while the page was closed.'; }
  else { finishTimer(); }
}
