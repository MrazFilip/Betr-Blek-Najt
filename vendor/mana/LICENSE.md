# mana-font — third-party notice

**Package:** mana-font 1.18.0
**Upstream:** https://github.com/andrewgioia/mana
**Author:** Andrew Gioia
**Site:** https://mana.andrewgioia.com/

## Licenses

- **The Mana font** (`fonts/mana.woff2`) is licensed under the
  **SIL Open Font License 1.1** — https://scripts.sil.org/OFL
- **The Mana CSS, LESS and Sass files** (`css/mana.css`) are licensed under the
  **MIT License** — https://opensource.org/licenses/mit-license.html
- **All mana, tap and card type symbol images are copyright Wizards of the
  Coast** — https://magicthegathering.com

Attribution is greatly appreciated by the author but not required. It is given
here regardless, and in the extension's README.

## What was vendored, and what changed

Only two files from the package are shipped:

- `css/mana.css`
- `fonts/mana.woff2`

The single modification to `mana.css` is to its `@font-face` declarations:

1. Upstream declares `Mana` with `eot`, `woff`, `ttf` and `svg` sources and does
   **not** reference `woff2` at all. That was replaced with a single
   `woff2`-only source, so Chrome loads 187KB instead of the 408KB `woff`, and
   does not 404 on formats we don't ship. `font-display: block` was added —
   an icon font that falls back mid-load renders raw codepoint boxes.
2. Upstream's second `@font-face` for `MPlantin` was removed. That font is not
   bundled, so the rule could only produce failed requests.

No other CSS was altered. The unused selectors (set symbols, watermarks,
loyalty, counters) were deliberately left in place: they cost nothing at
runtime and keep the rest of the symbol set available.

Under the OFL, the font is redistributed unmodified and retains its original
name. This notice satisfies the license's requirement that the copyright and
license notice travel with the font.
