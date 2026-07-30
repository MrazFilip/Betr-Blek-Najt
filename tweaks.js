const TWEAKS = [
  {
    id: 'no_edition_icons',
    label: 'Skrýt ikony edic v menu',
    description: 'Odstraní obrázky ikon edic ze seznamu edic. Výrazně zrychlí načtení stránky.',
    defaultOn: true,

    urlMatch: 'https://cernyrytir.cz/mtg/menu*',

    css: `
      /* Hiding the whole q-img wrapper, not just the <img> inside it. Quasar
         renders these with loading="lazy", and a lazy image in a display:none
         container never becomes visible, so Chrome never requests it — this
         removes the network fetch as well as the picture.

         q-mr-sm is left out of the selector on purpose: it's a margin utility
         that could be swapped for another spacing class at any time. */
      .q-img.edition-icon {
        display: none !important;
      }
    `
  },

  {
    id: 'click_zoom',
    label: 'Klik na obrázek zvětší kartu',
    description: 'V režimu Řádky klik na obrázek kartu zvětší místo otevření detailu. Další klik ji zmenší. Odkaz zůstává na názvu karty.',
    defaultOn: true,

    /* List pages only — detail pages have no rows to zoom. */
    urlMatch: 'https://cernyrytir.cz/mtg/list*',

    css: `
      /* Only the image link is hijacked, so signal that with the cursor. The
         name link keeps the normal pointer and keeps working. */
      .product-card-rows-container a:has(> .image-container) {
        cursor: zoom-in !important;
      }
      .product-card-rows-container a.rs-zoomed {
        cursor: zoom-out !important;
      }

      /* Quasar sets width/height inline on .q-img, and inline styles beat normal
         author rules — hence !important, which outranks them. */
      a.rs-zoomed .q-img.image-container {
        width: 320px !important;
        height: 447px !important;   /* 320 / (63/88), a card's aspect ratio */
      }
      .product-card-rows-container a > .image-container {
        transition: width .15s ease, height .15s ease;
      }
    `,

    setup: () => {
      const ZOOM = 'rs-zoomed';

      const onClick = (e) => {
        const el = e.target;
        if (!el || typeof el.closest !== 'function') return;

        /* Row mode only, per the requirement. Read at click time so switching
           view in the popup takes effect without re-running setup. */
        let mode = null;
        try { mode = localStorage.getItem('table_view_type'); } catch (_) {}
        if (mode !== 'ROWS') return;

        /* Must be the image, inside the anchor that wraps it, inside a rows
           list. The name link has no .image-container, so it is untouched. */
        const box = el.closest('.q-img.image-container');
        if (!box) return;
        const link = box.closest('a');
        if (!link || !link.closest('.product-card-rows-container')) return;

        /* Capture phase + stopPropagation means Vue's own click handler never
           runs, and preventDefault stops the href navigation. */
        e.preventDefault();
        e.stopPropagation();

        const wasZoomed = link.classList.contains(ZOOM);
        /* One enlarged card at a time, otherwise the list becomes unusable. */
        for (const other of document.querySelectorAll('a.' + ZOOM)) {
          other.classList.remove(ZOOM);
        }
        if (!wasZoomed) link.classList.add(ZOOM);
      };

      document.addEventListener('click', onClick, true);
      return () => {
        document.removeEventListener('click', onClick, true);
        for (const el of document.querySelectorAll('a.' + ZOOM)) el.classList.remove(ZOOM);
      };
    }
  },

  {
    id: 'rounded',
    label: 'Zaoblené rohy karet',
    description: 'Zaoblí rohy obrázků karet.',
    defaultOn: true,
    css: `
      img.q-img__image {
        position: relative;
        height: auto !important;
        max-height: 100% !important;
        top: 50% !important;
        bottom: auto !important;
        transform: translateY(-50%) !important;
        border-radius: 1.25rem !important;
      }
    `
  },

  {
    id: 'remove_foil',
    label: 'Odstranit Efekt Foil',
    description: 'Odstraní efekt foilových karet.',
    defaultOn: true,
    css: `
      .foil-effect:before {
        all: unset !important;
      }
    `
  },

  {
    id: 'item_page',
    label: 'Lepší Detail Page',
    description: 'Upraví všechny detaily itemů tak, aby byly lépe čitelné.',
    defaultOn: true,

    /* Detail pages only. Without this the layout rules also hit the list page,
       where #images and #title mean something different. */
    urlMatch: 'https://cernyrytir.cz/mtg/detail/*',

    css: `

      @media (width >= 1024px) {
        #images {
          order: 1 !important;
          z-index: 1 !important;
        }

        .q-mr-lg {
          margin: unset !important;
        }

        #title {
          order: 2 !important;
          border-top: 3px solid var(--q-primary) !important;
          border-bottom: 3px solid var(--q-primary) !important;
          border-left: 1px solid var(--q-info) !important;
          border-right: 1px solid var(--q-info) !important;
          border-radius: 1.25rem !important;
          position: relative !important;
          left: -2rem !important;
          top: 2rem !important;
          overflow: hidden !important;
        }

        .page-title {
          font-family: FunnelDisplay, serif !important;
          font-size: 1.8rem !important;
          font-style: normal !important;
          font-weight: 700 !important;
          line-height: 150% !important;
          margin-left: 2.5rem !important;
        }
        
        .q-badge {
          display: none !important;
        }

        .attrs-container {
          font-family: FunnelDisplay, serif !important;
          min-width: 300px !important;
          margin-left: 2.5rem !important;
          position: relative !important;
        }

        .attrs-container::after {
          content: '';
          display: block;
          width: 100%;
          height: 1px;
          position: absolute;
          top: -1rem;
          background: var(--q-info);
        }

        .oracle-text {
          all: unset !important;
          font-size: 14px !important;
          font-style: normal !important;
          font-weight: 400 !important;
          line-height: 140% !important;
          position: relative !important;
          display: block !important;
          margin-top: 2rem !important;
          margin-bottom: 2rem !important;
          width: 100% !important;
        }

        #mtg-detail-container-desktop {
          margin-bottom: 3rem !important;
          display: flex !important;
        }

        #attributes-and-controls-container {
          flex-direction: column !important;
          flex: 1 !important;
          order: 3 !important;
          justify-content: space-between !important;
          display: flex !important;
        }

        #attributes-and-controls-container .oracle-text::before {
          content: '';
          display: block;
          width: 100%;
          height: 1px;
          position: absolute;
          top: -1rem;
          background: var(--q-info);
        }

        #attributes-and-controls-container .oracle-text::after {
          content: '';
          display: block;
          width: 100%;
          height: 1px;
          position: absolute;
          bottom: -1rem;
          background: var(--q-info);
        }

        .product-controls-container {
          border-radius: unset !important;
          color: #666 !important;
          min-width: 240px !important;
          padding: 16px !important;
          font-family: NotoSansVariable, serif !important;
          font-size: .85rem !important;
          font-weight: 400 !important;
          overflow: hidden;
        }

        .tag-badge {
          margin-top: 0.5rem;
        }
      }
    `
  },

  {
    id: 'mana_symbols',
    label: 'Mana symboly v oracle text',
    description: 'Nahradí mana symboly v textu karty skutečnými mana symboly.',
    defaultOn: true,

    urlMatch: 'https://cernyrytir.cz/mtg/detail/*',
    css: `
      .oracle-text {
        white-space: pre-line !important;
      }

      .oracle-text .ms-cost {
        font-size: 0.82em !important;
        margin: 0 0.06em;
        vertical-align: baseline;
        position: relative;
        top: 0.06em;
      }
    `,

    setup: () => {
      const DONE = 'data-rs-mana';
      const ORIG = 'data-rs-mana-orig';

      const loadFont = () => {
        if (globalThis.__rsManaFont) return;
        globalThis.__rsManaFont = true;

        /* Wrapped: a synchronous throw in here must not abort setup(), or the
           text would keep its raw {W} tokens instead of merely losing the font. */
        try {
          fetch(chrome.runtime.getURL('vendor/mana/fonts/mana.woff2'))
            .then((r) => {
              if (!r.ok) throw new Error('HTTP ' + r.status);
              return r.arrayBuffer();
            })
            .then((buf) => new FontFace('Mana', buf).load())
            .then((face) => {
              document.fonts.add(face);
              console.log('[Restyler] Mana font registered (' + face.status + ')');
            })
            .catch((e) => {
              globalThis.__rsManaFont = false;
              console.warn('[Restyler] Mana font failed to load:', e.message);
            });
        } catch (e) {
          globalThis.__rsManaFont = false;
          console.warn('[Restyler] Mana font could not be requested:', e.message);
        }
      };

      loadFont();

      /* The font ships one class per hybrid pair in guild order only, so
         {U/W} has to be normalised to ms-wu. */
      const PAIRS = ['wu','wb','ub','ur','br','bg','rg','rw','gw','gu'];
      const SPECIAL = { T: 'tap', Q: 'untap' };

      const className = (token) => {
        const t = token.toLowerCase();

        if (t.indexOf('/') !== -1) {
          const parts = t.split('/');
          /* hybrid-phyrexian: {W/U/P} -> ms-wup */
          if (parts.length === 3) return 'ms-' + parts.join('');
          const [a, b] = parts;
          /* phyrexian {W/P}, twobrid {2/W}, colourless hybrid {C/W} */
          if (b === 'p' || a === '2' || a === 'c') return 'ms-' + a + b;
          const joined = a + b;
          return 'ms-' + (PAIRS.indexOf(joined) !== -1 ? joined : b + a);
        }

        const up = token.toUpperCase();
        if (SPECIAL[up]) return 'ms-' + SPECIAL[up];
        return 'ms-' + t;
      };

      const make = (token) => {
        const el = document.createElement('i');
        /* ms-cost draws the rounded background; ms-shadow adds the inner bevel
           the printed symbols have. Both are mana.css's own classes. */
        el.className = 'ms ' + className(token) + ' ms-cost ms-shadow';
        el.setAttribute('aria-hidden', 'true');
        el.title = '{' + token.toUpperCase() + '}';
        return el;
      };

      const convert = (node) => {
        const text = node.textContent;
        if (!text || text.indexOf('{') === -1) return false;

        const frag = document.createDocumentFragment();
        const rx = /\{([A-Za-z0-9]{1,3}(?:\/[A-Za-z0-9]{1,3}){0,2})\}/g;
        let last = 0, m, found = false;

        while ((m = rx.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          frag.appendChild(make(m[1]));
          last = m.index + m[0].length;
          found = true;
        }
        if (!found) return false;
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));

        node.setAttribute(ORIG, text);
        node.setAttribute(DONE, '1');
        node.textContent = '';
        node.appendChild(frag);
        return true;
      };

      const sweep = () => {
        for (const el of document.querySelectorAll('.oracle-text:not([' + DONE + '])')) {
          convert(el);
        }
      };

      /* Polled rather than observed: the text arrives asynchronously and changes
         when navigating between cards in this SPA. A MutationObserver would also
         see our own edits, and is what hung the page once before. */
      sweep();
      const timer = setInterval(sweep, 500);

      return () => {
        clearInterval(timer);
        for (const el of document.querySelectorAll('[' + ORIG + ']')) {
          el.textContent = el.getAttribute(ORIG);
          el.removeAttribute(ORIG);
          el.removeAttribute(DONE);
        }
      };
    }
  }
];

globalThis.SiteRestylerTweaks = TWEAKS;
