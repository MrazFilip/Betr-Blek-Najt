# Privacy Policy

**Extension:** Restyler for cernyrytir.cz
**Last updated:** 27 July 2026

## Summary

This extension collects nothing, sends nothing anywhere, and contains no
analytics, tracking or advertising. It makes no network requests of any kind.

## What the extension stores

**Your on/off choices for each style option.** Saved with Chrome's
`storage.sync` API under a single key, `siteRestylerSettings`. The value is a
list of booleans — which visual tweaks you enabled — and nothing else.

If you are signed into Chrome and have extension sync turned on, Chrome itself
copies these preferences between your own devices through your Google account.
That transfer is performed by Chrome, not by this extension, and the developer
has no access to it. Signing out of Chrome or disabling sync keeps the settings
on your device only.

**Display preferences belonging to cernyrytir.cz.** The extension reads and
writes two values that the website itself already stores in your browser's
localStorage — `PRODUCT_TABLE_PREFS` and `table_view_type` — so that the popup
can show and change how the product table is displayed (in stock, sort order,
rows per page, rows or grid). These values stay in your browser, are owned by
the website, and are never copied, transmitted or read by the developer.

## What the extension does not do

- No personal data is collected: no name, email, address, or account details.
- No browsing history, page content, form input, or keystrokes are read.
- No health, financial, location, or authentication data is accessed.
- No data is sold or shared with third parties. There are no third parties.
- No remote code is downloaded or executed. All code ships inside the extension.
- No servers are operated in connection with this extension.

## Permissions and why they exist

| Permission | Reason |
|---|---|
| `storage` | Remember which style options you switched on |
| `scripting` | Read and update the website's own display preferences shown in the popup |
| `*://cernyrytir.cz/*` | Apply styles to that one site; no other site is accessed |

## Scope

The extension runs only on `cernyrytir.cz`. On every other website it is
completely inactive.

## Affiliation

This is an unofficial, independently developed extension. It is not made by,
affiliated with, or endorsed by the operator of cernyrytir.cz.

## Removing your data

Uninstalling the extension deletes its stored settings. The website's own
localStorage values can be cleared through Chrome's site data settings for
cernyrytir.cz.

## Contact

filda.mraz@gmail.com
