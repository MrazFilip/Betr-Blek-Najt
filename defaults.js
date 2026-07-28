/* Settings model + CSS generator. Shared by the popup and the content script.
   Do NOT edit this to change styling — edit tweaks.js instead. */

const STORAGE_KEY = 'siteRestylerSettings';

/* Settings are deliberately tiny: a master switch, plus one boolean per tweak.
   Users cannot author CSS; they only turn the authored tweaks on and off. */
function defaultSettings(tweaks) {
  const on = {};
  for (const t of tweaks) on[t.id] = !!t.defaultOn;
  return { enabled: true, on };
}

/* Merge stored settings over the defaults, so tweaks added to tweaks.js later
   pick up their defaultOn value instead of being treated as off. */
function mergeSettings(stored, tweaks) {
  const out = defaultSettings(tweaks);
  if (!stored || typeof stored !== 'object') return out;
  if (typeof stored.enabled === 'boolean') out.enabled = stored.enabled;
  if (stored.on && typeof stored.on === 'object') {
    for (const t of tweaks) {
      if (typeof stored.on[t.id] === 'boolean') out.on[t.id] = stored.on[t.id];
    }
  }
  return out;
}

/* NOTE: never re-assert a class on <body> from a MutationObserver to drive the
   site's theme. If the app sets that class too, the two fight in an unbounded
   loop and the page never finishes loading. A tweak may claim a class on
   <html> (htmlClass), which the app does not manage, and it is written once per
   settings change with no observer. */

function buildCss(settings, tweaks) {
  if (!settings.enabled) return '';
  const parts = [];
  for (const t of tweaks) {
    if (!settings.on[t.id]) continue;

    let css = t.css ? t.css.trim() : '';

    /* A tweak may compute CSS at runtime — e.g. by reading rules out of the
       site's own stylesheets. Must never throw the whole build. */
    if (typeof t.dynamicCss === 'function') {
      try {
        const extra = t.dynamicCss();
        if (extra) css += (css ? '\n' : '') + extra;
      } catch (e) {
        console.warn('[Restyler] dynamicCss failed for "' + t.id + '":', e.message);
      }
    }

    if (css) parts.push(`/* ${t.id} */\n${css}`);
  }
  return parts.join('\n\n');
}

globalThis.SiteRestyler = { STORAGE_KEY, defaultSettings, mergeSettings, buildCss };
