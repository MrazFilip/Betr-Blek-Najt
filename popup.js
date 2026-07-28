/* Popup: renders one switch per tweak defined in tweaks.js. Auto-saves.
   Users can only toggle authored tweaks — there is no CSS input by design. */

const $ = (id) => document.getElementById(id);

/* Surface failures in the popup itself rather than only in a console the user
   would have to know to open. */
function fatal(msg) {
  const bar = document.createElement('div');
  bar.textContent = 'Restyler error: ' + msg;
  bar.style.cssText =
    'background:#b3261e;color:#fff;font:12px/1.4 system-ui;padding:8px 12px;white-space:pre-wrap';
  document.body.prepend(bar);
  console.error('[Restyler popup]', msg);
}
window.addEventListener('error', (e) => fatal(e.message));

/* NOTE: tweaks.js, defaults.js and popup.js are plain <script> tags sharing ONE
   lexical scope. Declaring any name they already declare (TWEAKS, STORAGE_KEY,
   defaultSettings, mergeSettings, buildCss) is a parse-time redeclaration
   SyntaxError that stops this entire file from running. Hence the aliases. */
const API = globalThis.SiteRestyler;
const LIST = globalThis.SiteRestylerTweaks;
if (!API || !LIST) {
  fatal('tweaks.js / defaults.js did not load — both must sit next to popup.html.');
  throw new Error('dependencies missing');
}
const KEY = API.STORAGE_KEY;
const merge = API.mergeSettings;
const makeDefaults = API.defaultSettings;

const store = chrome.storage.sync || chrome.storage.local;

let settings = null;
let savedTimer = null;

/* ---------------- persistence ---------------- */

function save() {
  store.set({ [KEY]: settings }, () => {
    if (chrome.runtime.lastError) {
      fatal('could not save: ' + chrome.runtime.lastError.message);
      return;
    }
    const el = $('saved');
    el.classList.add('show');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => el.classList.remove('show'), 900);
  });
}

function load() {
  store.get(KEY, (res) => {
    if (chrome.runtime.lastError) {
      fatal('could not read settings: ' + chrome.runtime.lastError.message);
      return;
    }
    settings = merge(res && res[KEY], LIST);
    build();
  });
}

/* ---------------- render ---------------- */

let built = false;

function build() {
  const list = $('list');

  if (!built) {
    list.textContent = '';
    for (const t of LIST) {
      const row = document.createElement('div');
      row.className = 'tweak';

      const txt = document.createElement('div');
      txt.className = 'txt';

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = t.label || t.id;
      txt.appendChild(name);

      if (t.description) {
        const desc = document.createElement('div');
        desc.className = 'desc';
        desc.textContent = t.description;
        txt.appendChild(desc);
      }

      const sw = document.createElement('label');
      sw.className = 'sw';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.dataset.id = t.id;
      box.addEventListener('change', () => {
        settings.on[t.id] = box.checked;
        save();
      });
      sw.append(box, document.createElement('i'));

      row.append(txt, sw);
      list.appendChild(row);
    }
    built = true;
  }

  sync();
}

/* Push current settings into the already-built DOM. */
function sync() {
  $('enabled').checked = settings.enabled;
  document.body.classList.toggle('disabled', !settings.enabled);
  for (const box of document.querySelectorAll('#list input[type="checkbox"]')) {
    box.checked = !!settings.on[box.dataset.id];
  }
}

/* ---------------- wiring ---------------- */

$('enabled').addEventListener('change', (e) => {
  settings.enabled = e.target.checked;
  save();
  sync();
});

$('reset').addEventListener('click', () => {
  settings = makeDefaults(LIST);
  save();
  sync();
});

/* Reflect changes made in another window. */
chrome.storage.onChanged.addListener((changes) => {
  if (changes[KEY]) {
    settings = merge(changes[KEY].newValue, LIST);
    sync();
  }
});

load();

/* ====================================================================
   Site table preferences.

   These live in the *page's* localStorage, not in extension storage, so
   every read and write goes through the content script.
   ==================================================================== */

const PREF_FIELDS = [
  { el: 'p-eshop', key: 'inStockOnlyEshop', type: 'bool' },
  { el: 'p-store', key: 'inStockOnlyStore', type: 'bool' },
  { el: 'p-sort',  key: 'sortType',         type: 'str'  },
  { el: 'p-rows',  key: 'rowsPerPage',      type: 'num'  }
];

const PREF_FALLBACK = {
  inStockOnlyEshop: true,
  inStockOnlyStore: false,
  sortType: 'p_desc',
  rowsPerPage: 12
};

/* The query string is the site's source of truth: on load the app reads these
   params and writes them into localStorage, overwriting anything we put there.
   Writing localStorage alone therefore appears to "change itself back".
   Mapping taken from a real list URL:
     ...\/mtg\/list?iso_e=true&f_f=true&iso_s=false&sort_by=p_desc&rpp=12 */
const URL_PARAM = {
  inStockOnlyEshop: 'iso_e',
  inStockOnlyStore: 'iso_s',
  sortType: 'sort_by',
  rowsPerPage: 'rpp'
};

/* Login callback junk. Re-navigating with a used OAuth code can bounce the user
   through auth again, so these are dropped from any URL we rebuild. */
const AUTH_PARAMS = ['code', 'state', 'session_state', 'iss'];

let prefsTabId = null;
let prefsTabUrl = null;
let applyingPrefs = false;   // guards against the change events we cause ourselves

function note(text) {
  $('prefs-note').textContent = text || '';
  $('prefs-note').style.display = text ? '' : 'none';
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

/* Injected into the page to read both keys. Must be self-contained — it is
   serialised and run in the tab, so it can close over nothing from here. */
function readInPage() {
  let prefs = {};
  try {
    const raw = localStorage.getItem('PRODUCT_TABLE_PREFS');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) prefs = parsed;
    }
  } catch (e) { /* corrupt JSON — treat as empty rather than throwing */ }
  return { prefs, view: localStorage.getItem('table_view_type') || null };
}

/* Merge rather than replace: the site keeps other fields in this object and
   clobbering them would break it. */
function writeInPage(patch, view) {
  let prefs = {};
  try {
    const raw = localStorage.getItem('PRODUCT_TABLE_PREFS');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) prefs = parsed;
    }
  } catch (e) { /* corrupt JSON — start clean */ }
  const next = Object.assign({}, prefs, patch || {});
  localStorage.setItem('PRODUCT_TABLE_PREFS', JSON.stringify(next));
  if (view === 'ROWS' || view === 'GRID') localStorage.setItem('table_view_type', view);
  return { prefs: next, view: localStorage.getItem('table_view_type') || null };
}

/* executeScript works even in tabs opened before the extension was reloaded,
   which runtime messaging to a content script does not. */
async function runInPage(fn, args) {
  const [out] = await chrome.scripting.executeScript({
    target: { tabId: prefsTabId },
    func: fn,
    args: args || []
  });
  return out && out.result;
}

/* True when the current page carries the table params, i.e. the query string is
   driving the table and must be updated rather than localStorage alone. */
function urlDrivesPrefs() {
  if (!prefsTabUrl) return false;
  try {
    const q = new URL(prefsTabUrl).searchParams;
    return Object.values(URL_PARAM).some((p) => q.has(p));
  } catch (e) { return false; }
}

/* Params win over localStorage when both are present, because the app will
   overwrite localStorage from them on the next load. */
function prefsFromUrl() {
  const out = {};
  if (!prefsTabUrl) return out;
  let q;
  try { q = new URL(prefsTabUrl).searchParams; } catch (e) { return out; }
  for (const f of PREF_FIELDS) {
    const raw = q.get(URL_PARAM[f.key]);
    if (raw === null) continue;
    if (f.type === 'bool') out[f.key] = raw === 'true';
    else if (f.type === 'num') { const n = parseInt(raw, 10); if (Number.isFinite(n)) out[f.key] = n; }
    else out[f.key] = raw;
  }
  return out;
}

async function loadPrefs() {
  const tab = await activeTab();
  if (!tab) { note('Nelze zjistit aktivní panel.'); return; }
  prefsTabId = tab.id;
  prefsTabUrl = tab.url || null;

  let res;
  try {
    res = await runInPage(readInPage);
  } catch (e) {
    prefsTabId = null;
    note('Otevřete stránku cernyrytir.cz — nastavení tabulky se ukládá na ní.');
    console.warn('[Restyler popup] read failed:', e.message);
    return;
  }
  if (!res) { note('Nastavení tabulky se nepodařilo načíst.'); return; }

  renderPrefs(Object.assign({}, res.prefs || {}, prefsFromUrl()), res.view);
  $('prefs-wrap').hidden = false;
  note('');
}

function renderPrefs(prefs, view) {
  applyingPrefs = true;

  for (const f of PREF_FIELDS) {
    const el = $(f.el);
    /* Fall back only when the site has no value at all, so we never silently
       overwrite something the site set to a value we didn't expect. */
    const v = prefs[f.key] !== undefined ? prefs[f.key] : PREF_FALLBACK[f.key];
    if (f.type === 'bool') {
      el.checked = !!v;
    } else {
      /* Both remaining fields are <select>. Keep a value the dropdown doesn't
         offer — the site allows rpp values outside 12/24/36/48, and snapping to
         the nearest option would misreport what the page is actually using, then
         silently change it on the next save. */
      const s = String(v);
      if (el.tagName === 'SELECT' && ![...el.options].some((o) => o.value === s)) {
        el.add(new Option(s + ' (jiné)', s));
      }
      el.value = s;
    }
  }

  $('p-view').value = view === 'GRID' ? 'GRID' : 'ROWS';

  applyingPrefs = false;
}

function collectPrefs() {
  const patch = {};
  for (const f of PREF_FIELDS) {
    const el = $(f.el);
    if (f.type === 'bool') patch[f.key] = el.checked;
    else if (f.type === 'num') {
      const n = parseInt(el.value, 10);
      patch[f.key] = Number.isFinite(n) && n > 0 ? n : PREF_FALLBACK[f.key];
    } else patch[f.key] = el.value;
  }
  return patch;
}

/* Rebuild the page URL with the chosen values. Returns null when the current
   page isn't param-driven, in which case localStorage alone is the right target. */
function urlWithPrefs(patch) {
  if (!urlDrivesPrefs()) return null;
  let u;
  try { u = new URL(prefsTabUrl); } catch (e) { return null; }
  for (const f of PREF_FIELDS) {
    u.searchParams.set(URL_PARAM[f.key], String(patch[f.key]));
  }
  for (const p of AUTH_PARAMS) u.searchParams.delete(p);
  return u.toString();
}

async function savePrefs() {
  if (applyingPrefs || prefsTabId === null) return;

  const patch = collectPrefs();

  /* Write localStorage too: table_view_type has no URL parameter, and the value
     is what the app reads on pages that carry no params. */
  try {
    await runInPage(writeInPage, [patch, $('p-view').value]);
  } catch (e) {
    note('Uložení selhalo: ' + e.message);
    return;
  }

  const el = $('saved');
  el.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => el.classList.remove('show'), 900);

  /* Navigating with updated params beats reloading: on reload the app would read
     the old query string and put the old values straight back into localStorage. */
  const next = urlWithPrefs(patch);
  if (next && next !== prefsTabUrl) {
    prefsTabUrl = next;
    chrome.tabs.update(prefsTabId, { url: next });
  } else {
    chrome.tabs.reload(prefsTabId);
  }
}

for (const f of PREF_FIELDS) {
  const el = $(f.el);
  /* 'change' not 'input' on the number field: 'input' fires per keystroke and
     each save triggers a page reload. */
  el.addEventListener('change', savePrefs);
}
$('p-view').addEventListener('change', savePrefs);

loadPrefs();
