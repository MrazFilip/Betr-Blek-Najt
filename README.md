# Betr Blek Najt Restyler

Chrome extension (Manifest V3) that restyles cernyrytir.cz. All styling is
authored in code; users only get on/off switches.

> **Install the official version from the Chrome Web Store.** This repository is
> the source, intended for development. The Web Store build is reviewed by Google
> and updates itself automatically; a copy loaded unpacked from here does neither.

## Adding or changing a style

Everything lives in **`tweaks.js`**. Add an entry and a toggle appears in the
popup automatically — no other file needs editing.

```js
{
  id: 'prices',                  // unique + stable; it's the storage key
  label: 'Zvýraznit ceny',       // shown next to the switch
  description: 'Ceny tučně.',    // optional line under the label
  defaultOn: false,              // on for users who never opened the popup
  css: `
    .cena { font-weight: 700 !important; }
  `
}
```

Optional fields:

- `urlMatch` — restrict the tweak to certain pages. A string where `*` means
  "any characters", or a RegExp. Omit it and the tweak applies everywhere.
- `dynamicCss: () => string` — CSS computed at runtime, appended after `css`.
- `setup: () => cleanupFn` — for tweaks that need behaviour, not just styling.
  **Must return a cleanup function.** It runs the moment the tweak stops being
  active, so switching the toggle off genuinely undoes the behaviour instead of
  leaving a live listener behind.

Notes:

- Tweaks apply in array order, so a later entry overrides an earlier one.
- Use `!important` liberally — you're competing with the site's own stylesheet.
- Changing an `id` resets that toggle for existing users, since the id *is*
  the stored key. Rename the label freely; leave the id alone.
- Deleting a tweak silently drops any stored value for it. Nothing to clean up.

After editing, reload the extension at `chrome://extensions` and refresh the page.

## Install

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. Open cernyrytir.cz, click the icon to pick tweaks

Load from a normal folder such as `Documents\site-restyler`. Chrome's folder
picker often fails on paths under `AppData\Local\Packages\...`, reporting a
missing manifest even when it is present.

## Third-party

Mana symbols in card text are rendered with the **Mana** font by Andrew Gioia
(<https://mana.andrewgioia.com/>), vendored under `vendor/mana/`. Font: SIL OFL
1.1. CSS: MIT. Symbol designs © Wizards of the Coast. See
`vendor/mana/LICENSE.md` for the notice and the list of modifications.

Two manifest entries are both required for this, and it fails silently if either
is missing:

1. `content_scripts.css` registers `mana.css`, so its relative
   `url("../fonts/mana.woff2")` resolves against the extension root rather than
   the page.
2. `web_accessible_resources` exposes `vendor/mana/fonts/*` to the site. The
   URL resolves to `chrome-extension://<id>/…`, but the **page document** is
   what fetches the font, and pages cannot read extension resources unless
   they're declared web-accessible.

The failure mode with (2) missing is deceptive: `ms-cost` still paints the
coloured circles, so the symbols look almost right — but each glyph is a
fallback box, because only the font file failed to load.

## Files

| File | Role |
|---|---|
| `tweaks.js` | **The only file you edit.** All styles + toggle metadata |
| `defaults.js` | Settings model and CSS generator |
| `content.js` | Injects the CSS, re-applies on change |
| `popup.html` / `popup.js` | Renders one switch per tweak; auto-saves |
| `manifest.json` | MV3 config; sets which domain the extension runs on |

## Table preferences

Below the toggles the popup edits two keys in the **site's own** localStorage:

| Key | Shape |
|---|---|
| `PRODUCT_TABLE_PREFS` | `{ inStockOnlyEshop, inStockOnlyStore, sortType, rowsPerPage }` |
| `table_view_type` | `"ROWS"` or `"GRID"` |

`sortType` options: `p_desc` (cena sestupně), `p_asc` (cena vzestupně),
`a_asc` (abecedně), `a_desc` (abecedně obráceně), `i_desc` (nejnovější).

How it works: the popup runs on the extension origin and cannot reach the
page's localStorage, so it injects a small function into the tab with
`chrome.scripting.executeScript` (hence the `scripting` permission). This is
deliberately *not* done by messaging `content.js`: reloading an unpacked
extension does not re-inject content scripts into tabs that are already open,
so a messaging-based version silently fails in exactly the tab you were
testing in. `executeScript` has no such gap.

Writes **merge** into the existing object, so any field the site stores there
that the popup doesn't expose survives untouched. The page reloads after each
change, since the site only reads these values on load.

If the active tab isn't on the site, the table hides and shows a prompt — there
is no localStorage to edit from anywhere else.

To expose another field, add a row to the table in `popup.html` and an entry to
`PREF_FIELDS` in `popup.js` (`{ el, key, type }`, where type is `bool`, `num`
or `str`).

## Gotchas worth knowing

**Script scope.** `tweaks.js`, `defaults.js` and the consuming script share one
lexical scope, both in the popup and in the content script. A top-level
`const` in one file that repeats a name from another is a *parse-time*
SyntaxError that silently kills the whole file. If you add a top-level name,
make sure it's unique across all four scripts.

**Never re-assert a class the app also manages.** The first dark mode attempt
put `body--dark` on `<body>` and re-applied it from a `MutationObserver`. The
app forces `body--light`, so the two fought in an unbounded loop and the page
never finished loading. Dark mode now claims `rs-dark` on `<html>` instead —
Quasar manages `<body>`, not the root element — and writes it once per settings
change with no observer. If you add another class-based tweak, keep both of
those properties.

**How dark mode gets Quasar's real theme.** Quasar's stylesheet already
contains a full dark theme keyed on `.body--dark`. `dynamicCss` reads those
rules out of `document.styleSheets` and re-emits them scoped to
`html.rs-dark.rs-dark`. The class is doubled purely for specificity: the
originals carry two classes, so one class plus an element would lose to the
light rules. Cross-origin stylesheets throw on access and are skipped. If zero
rules are found — different build, or sheets not loaded yet — it falls back to
a hand-written palette, so the toggle always does something.

Because stylesheets haven't loaded at `document_start`, the content script
re-runs the build on `DOMContentLoaded` and `load`.

**Debugging.** The content script logs a line on every page load:

```
[Restyler] cernyrytir.cz | enabled: true | active: dark, rows | css bytes: 512
```

`css bytes: 0` means nothing is switched on (or the master switch is off).
A non-zero count with no visible change means the site's CSS is outranking
yours — add `!important` or a more specific selector.

## Settings storage

One object under `siteRestylerSettings` in `chrome.storage.sync`, falling back
to `local`: a master `enabled` boolean plus `on: { tweakId: boolean }`. Tweaks
added to `tweaks.js` later inherit their `defaultOn` value rather than
defaulting to off for existing users.
