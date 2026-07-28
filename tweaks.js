const TWEAKS = [
  {
    id: 'no_edition_icons',
    label: 'Skrýt ikony edic v menu',
    description: 'Odstraní obrázky ikon edic ze seznamu edic.',
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
    label: 'Lépe Čitelná Item Page',
    description: 'Upraví všechyn item karty tak, aby byly lépe čitelné.',
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
          border: 3px solid var(--q-primary) !important;
          border-radius: 1.25rem !important;
          position: relative !important;
          left: -2rem !important;
          top: 2rem !important;
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
          background-color: var(--q-primary);
          color: #fff !important;
          vertical-align: baseline !important;
          border-radius: 4px !important;
          min-height: 12px !important;
          padding: 2px 6px !important;
          font-size: 12px !important;
          font-weight: 400 !important;
          line-height: 1 !important;
          margin-left: 2.5rem !important;
        }

        .attrs-container {
          font-family: FunnelDisplay, serif !important;
          min-width: 300px !important;
          margin-left: 2.5rem !important;
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
          margin-left: 2px !important;
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
          height: 0.125rem;
          position: absolute;
          top: -1rem;
          background: var(--q-primary);
        }

        #attributes-and-controls-container .oracle-text::after {
          content: '';
          display: block;
          width: 100%;
          height: 0.125rem;
          position: absolute;
          bottom: -1rem;
          background: var(--q-primary);
        }

        .product-controls-container {
          background-color: transparent !important;
          color: #666 !important;
          min-width: 240px !important;
          padding: 16px !important;
          font-family: NotoSansVariable, serif !important;
          font-size: .85rem !important;
          margin-left: 2.5rem !important;
          font-weight: 400 !important;
          justify-content: start !important;
        }

        .tag-badge {
          margin-top: 0.5rem;
        }
      }
    `
  }
];

globalThis.SiteRestylerTweaks = TWEAKS;
