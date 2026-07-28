/* Content script. Injects the CSS for whichever tweaks are switched on,
   and re-applies instantly when the user flips a switch in the popup. */

(() => {
  const STYLE_ID = '__site_restyler_style__';
  const store = chrome.storage.sync || chrome.storage.local;
  const TWEAKS = globalThis.SiteRestylerTweaks || [];
  let styleEl = null;

  function ensureStyleEl() {
    if (styleEl && styleEl.isConnected) return styleEl;
    styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
    }
    (document.head || document.documentElement).appendChild(styleEl);
    return styleEl;
  }

  /* A tweak may claim a class on <html>. Deliberately written once per settings
     change, with NO MutationObserver: re-asserting a class the app also manages
     turns into an unbounded loop that hangs the page. <html> is safe because
     Quasar manages <body>, not the root element. */
  function applyHtmlClasses(settings) {
    const el = document.documentElement;
    for (const t of TWEAKS) {
      if (!t.htmlClass) continue;
      el.classList.toggle(t.htmlClass, settings.enabled && !!settings.on[t.id]);
    }
  }

  let current = null;

  function apply(settings) {
    current = settings;
    applyHtmlClasses(settings);

    const css = buildCss(settings, TWEAKS);
    ensureStyleEl().textContent = css;

    const active = TWEAKS.filter((t) => settings.on[t.id]).map((t) => t.id);
    console.log(
      '[Restyler]', location.hostname,
      '| enabled:', settings.enabled,
      '| active:', active.length ? active.join(', ') : '(none)',
      '| css bytes:', css.length
    );
  }

  store.get(STORAGE_KEY, (res) => {
    apply(mergeSettings(res && res[STORAGE_KEY], TWEAKS));
  });

  /* Two reasons to redo this later:
     1. keep our <style> last in <head> so stylesheets loaded after us don't
        outrank it;
     2. tweaks that read the site's own stylesheets find nothing at
        document_start, because none have loaded yet. */
  const reassert = () => {
    if (!styleEl) return;
    (document.head || document.documentElement).appendChild(styleEl);
    if (current) apply(current);
  };
  document.addEventListener('DOMContentLoaded', reassert);
  window.addEventListener('load', reassert);

  /* Live updates from the popup. */
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[STORAGE_KEY]) {
      apply(mergeSettings(changes[STORAGE_KEY].newValue, TWEAKS));
    }
  });

  /* NOTE: the site's localStorage (PRODUCT_TABLE_PREFS / table_view_type) is
     handled by the popup via chrome.scripting.executeScript, not from here.
     Doing it here would mean the prefs table silently stops working in any tab
     that was open before the extension was reloaded, since Chrome does not
     re-inject content scripts into existing tabs. */
})();
