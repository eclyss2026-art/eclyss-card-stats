/* ============================================================
   ECLYSS — Pagina Checkout
   Logica carrello + riepilogo ordine, estratta da checkout.html.
   Lo stato del carrello è condiviso con le altre pagine tramite
   localStorage (chiave "eclyssCart"), quindi qui viene solo letto,
   mostrato e modificato — non re-inizializzato da zero.
   ============================================================ */

// ── Menu mobile (hamburger) ────────────────────────────────────────────────────
(function() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinksPanel = document.getElementById('navLinks');
  if (!menuToggle || !navLinksPanel) return;

  function closeMenu() {
    navLinksPanel.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    const isOpen = navLinksPanel.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  }
  menuToggle.addEventListener('click', e => {
    e.stopPropagation();
    toggleMenu();
  });
  navLinksPanel.addEventListener('click', e => {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', e => {
    if (!navLinksPanel.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

(function() {
  const navCart  = document.querySelector('.nav-cart');
  const cartBtn  = document.getElementById('cartBtn');

  const STORAGE_KEY = 'eclyssCart';
  // Catalogo condiviso tra tutte le pagine: definito in js/catalogo.js
  const PRODUCTS = window.ECLYSS_PRODUCTS || {};

  function formatPrice(n) {
    return '€' + n.toFixed(2).replace('.', ',');
  }
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveCart(cart) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  let cart = loadCart();

  function setQty(productId, qty) {
    if (qty <= 0) delete cart[productId];
    else cart[productId] = qty;
    saveCart(cart);
    render();
  }

  // ── Dropdown nav (identico alle altre pagine) ──
  const cartCountEl = document.getElementById('cartCount');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooterEl = document.getElementById('cartFooter');
  const cartSubtotalEl = document.getElementById('cartSubtotal');

  // ── Riepilogo ordine a pagina intera ──
  const orderEmptyEl = document.getElementById('orderEmpty');
  const orderItemsEl = document.getElementById('orderItems');
  const orderTotalsEl = document.getElementById('orderTotals');
  const orderActionsEl = document.getElementById('orderActions');
  const orderSubtotalEl = document.getElementById('orderSubtotal');
  const orderTotalEl = document.getElementById('orderTotal');

  // Ridisegna sia il mini-carrello nella nav sia il riepilogo ordine a pagina intera,
  // a partire dallo stesso stato "cart" — vengono tenuti sincronizzati ad ogni modifica.
  function render() {
    const entries = Object.keys(cart).filter(id => PRODUCTS[id]);
    const totalCount = entries.reduce((sum, id) => sum + cart[id], 0);
    const subtotal = entries.reduce((sum, id) => sum + cart[id] * PRODUCTS[id].price, 0);

    if (cartCountEl) {
      cartCountEl.textContent = String(totalCount);
      cartCountEl.dataset.empty = totalCount === 0 ? 'true' : 'false';
    }
    if (cartEmptyEl) cartEmptyEl.hidden = entries.length > 0;
    if (cartFooterEl) cartFooterEl.hidden = entries.length === 0;
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotal);

    if (cartItemsEl) {
      cartItemsEl.innerHTML = entries.map(id => {
        const p = PRODUCTS[id];
        const qty = cart[id];
        return `<div class="cart-item" data-product-id="${id}">` +
          `<img src="${p.image}" alt="${p.name}">` +
          `<div class="cart-item-info">` +
            `<span class="cart-item-name">${p.name}</span>` +
            `<span class="cart-item-meta">${p.meta}</span>` +
            `<span class="cart-item-qty">` +
              `<button type="button" data-cart-step="-1">−</button>` +
              `<span>${qty}</span>` +
              `<button type="button" data-cart-step="1">+</button>` +
            `</span>` +
          `</div>` +
          `<div class="cart-item-right">` +
            `<span class="cart-item-price">${formatPrice(p.price * qty)}</span>` +
            `<button type="button" class="cart-item-remove" data-cart-remove>Rimuovi</button>` +
          `</div>` +
        `</div>`;
      }).join('');
    }

    // Riepilogo ordine
    if (orderEmptyEl) orderEmptyEl.hidden = entries.length > 0;
    if (orderTotalsEl) orderTotalsEl.hidden = entries.length === 0;
    if (orderActionsEl) orderActionsEl.hidden = entries.length === 0;
    if (orderSubtotalEl) orderSubtotalEl.textContent = formatPrice(subtotal);
    if (orderTotalEl) orderTotalEl.textContent = formatPrice(subtotal);

    if (orderItemsEl) {
      orderItemsEl.innerHTML = entries.map(id => {
        const p = PRODUCTS[id];
        const qty = cart[id];
        return `<div class="order-item" data-product-id="${id}">` +
          `<img src="${p.image}" alt="${p.name}">` +
          `<div class="order-item-info">` +
            `<span class="order-item-name">${p.name}</span>` +
            `<span class="order-item-meta">${p.meta}</span>` +
            `<span class="order-item-qty">` +
              `<button type="button" data-cart-step="-1">−</button>` +
              `<span>${qty}</span>` +
              `<button type="button" data-cart-step="1">+</button>` +
            `</span>` +
          `</div>` +
          `<div class="order-item-right">` +
            `<span class="order-item-price">${formatPrice(p.price * qty)}</span>` +
            `<button type="button" class="order-item-remove" data-cart-remove>Rimuovi</button>` +
          `</div>` +
        `</div>`;
      }).join('');
    }
  }

  // Delegazione eventi per i pulsanti +/- e "Rimuovi" dentro un contenitore di righe prodotto.
  function bindQtyEvents(container) {
    if (!container) return;
    container.addEventListener('click', e => {
      const row = e.target.closest('[data-product-id]');
      if (!row) return;
      e.stopPropagation();
      const id = row.dataset.productId;
      const stepBtn = e.target.closest('[data-cart-step]');
      if (stepBtn) {
        setQty(id, (cart[id] || 0) + Number(stepBtn.dataset.cartStep));
      } else if (e.target.closest('[data-cart-remove]')) {
        setQty(id, 0);
      }
    });
  }
  bindQtyEvents(cartItemsEl);
  bindQtyEvents(orderItemsEl);

  // Apertura/chiusura del mini-carrello nella nav (click fuori o Esc per chiudere).
  if (navCart && cartBtn) {
    function closeCart() {
      navCart.classList.remove('open');
      cartBtn.setAttribute('aria-expanded', 'false');
    }
    function toggleCart() {
      const isOpen = navCart.classList.toggle('open');
      cartBtn.setAttribute('aria-expanded', String(isOpen));
    }
    cartBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleCart();
    });
    document.addEventListener('click', e => {
      if (!navCart.contains(e.target)) closeCart();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeCart();
    });
  }

  // ── Conferma ordine: SOLO qui entra Snipcart, per il pagamento ──
  const confirmBtn = document.getElementById('confirmOrderBtn');
  const orderView = document.getElementById('orderView');
  const orderConfirmed = document.getElementById('orderConfirmed');

  // Copia il carrello custom dentro Snipcart, partendo da zero per non duplicare
  // gli articoli se l'utente apre e chiude il pagamento più volte.
  async function syncCartToSnipcart() {
    const state = window.Snipcart.store.getState();
    const existing = (state.cart && state.cart.items && state.cart.items.items) || [];
    for (const it of existing) {
      await window.Snipcart.api.cart.items.remove(it.uniqueId);
    }
    // URL che Snipcart usa per validare il prodotto (fa il crawl di questa pagina
    // e vi cerca la definizione .snipcart-add-item con id/prezzo). Deve essere
    // ASSOLUTO e raggiungibile: con un percorso relativo la validazione resta
    // appesa e il carrello si pianta su "Stiamo preparando il tuo carrello...".
    // Stessa logica di js/config.js — i due percorsi devono restare allineati.
    const productUrl = new URL('prodotto.html', document.baseURI).href;
    const entries = Object.keys(cart).filter(id => PRODUCTS[id]);
    for (const id of entries) {
      const p = PRODUCTS[id];
      await window.Snipcart.api.cart.items.add({
        id: p.id,
        name: p.name,
        price: p.price,
        url: productUrl,
        quantity: cart[id],
        description: p.meta,
        image: p.image
      });
    }
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const entries = Object.keys(cart).filter(id => PRODUCTS[id]);
      if (!entries.length) return;
      if (!(window.Snipcart && window.Snipcart.api)) {
        console.warn('Snipcart non ancora pronto.');
        return;
      }
      confirmBtn.disabled = true;
      try {
        await syncCartToSnipcart();
        await window.Snipcart.api.theme.cart.open();
      } catch (e) {
        console.error('Errore apertura pagamento Snipcart:', e);
      } finally {
        confirmBtn.disabled = false;
      }
    });
  }

  // Snipcart 3.2.2 usa un <select> nativo per la nazione su telefoni e tablet.
  // Il menu e' scorribile, ma non consente di cercare digitando. Questo campo
  // testuale offre la ricerca da tastiera e sincronizza la scelta con il select
  // originale, lasciando a Snipcart validazione, tasse e spedizione.
  function enhanceMobileCountrySelects() {
    if (!('HTMLDataListElement' in window)) return;

    document.querySelectorAll('#snipcart select[name="country"]').forEach(select => {
      const existingSearchId = select.dataset.eclyssCountrySearch;
      if (existingSearchId && document.getElementById(existingSearchId)) return;

      const nativeWrapper = select.closest('.snipcart-form__select-wrapper') || select.parentElement;
      if (!nativeWrapper || !nativeWrapper.parentElement) return;

      const options = Array.from(select.options).filter(option => option.value);
      const listId = 'eclyss-country-list-' + Math.random().toString(36).slice(2);
      const input = document.createElement('input');
      const list = document.createElement('datalist');

      input.type = 'text';
      input.id = listId + '-input';
      select.dataset.eclyssCountrySearch = input.id;
      input.className = 'snipcart-form__select snipcart__font--secondary snipcart__font--bold eclyss-country-search';
      input.setAttribute('list', listId);
      input.setAttribute('inputmode', 'text');
      input.setAttribute('enterkeyhint', 'done');
      input.setAttribute('autocomplete', 'country-name');
      input.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Country' : 'Nazione');
      input.placeholder = document.documentElement.lang === 'en' ? 'Type country' : 'Digita la nazione';

      list.id = listId;
      options.forEach(option => {
        const suggestion = document.createElement('option');
        suggestion.value = option.textContent.trim();
        list.appendChild(suggestion);
      });

      function normalize(value) {
        return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
      }

      function selectedLabel() {
        const selected = select.options[select.selectedIndex];
        return selected && selected.value ? selected.textContent.trim() : '';
      }

      function commitTypedCountry(allowUniquePartial) {
        const query = normalize(input.value);
        if (!query) return false;

        let matches = options.filter(option => normalize(option.textContent) === query);
        if (!matches.length && allowUniquePartial) {
          matches = options.filter(option => normalize(option.textContent).startsWith(query));
        }
        if (matches.length !== 1) return false;

        select.value = matches[0].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        input.value = matches[0].textContent.trim();
        return true;
      }

      input.value = selectedLabel();
      input.addEventListener('input', () => commitTypedCountry(false));
      input.addEventListener('change', () => commitTypedCountry(true));
      input.addEventListener('blur', () => {
        if (!commitTypedCountry(true)) input.value = selectedLabel();
      });
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        if (commitTypedCountry(true)) {
          event.preventDefault();
          input.blur();
        }
      });
      select.addEventListener('change', () => { input.value = selectedLabel(); });

      nativeWrapper.classList.add('eclyss-country-native-select');
      nativeWrapper.before(input, list);

      const label = nativeWrapper.closest('.snipcart-form__field')?.querySelector('label[for="country"]');
      if (label) label.setAttribute('for', input.id);
    });
  }

  let snipcartCountryObserver = null;
  function observeSnipcartCountrySelects() {
    const snipcartRoot = document.getElementById('snipcart');
    if (!snipcartRoot || snipcartCountryObserver) return;

    snipcartCountryObserver = new MutationObserver(enhanceMobileCountrySelects);
    snipcartCountryObserver.observe(snipcartRoot, {
      childList: true,
      subtree: true
    });
    enhanceMobileCountrySelects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeSnipcartCountrySelects, { once: true });
  } else {
    observeSnipcartCountrySelects();
  }

  // Svuota il carrello e mostra la conferma SOLO dopo un pagamento riuscito.
  document.addEventListener('snipcart.ready', () => {
    observeSnipcartCountrySelects();
    enhanceMobileCountrySelects();
    window.Snipcart.events.on('order.completed', () => {
      cart = {};
      saveCart(cart);
      render();
      if (orderView) orderView.style.display = 'none';
      if (orderConfirmed) orderConfirmed.classList.add('show');
    });
  });

  render();
})();
