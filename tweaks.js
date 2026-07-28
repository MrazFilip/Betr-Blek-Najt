const TWEAKS = [
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
