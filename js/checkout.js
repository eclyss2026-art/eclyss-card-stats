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

  // ── Conferma ordine: apre Snipcart per il pagamento ──
  const confirmBtn = document.getElementById('confirmOrderBtn');
  const orderView = document.getElementById('orderView');
  const orderConfirmed = document.getElementById('orderConfirmed');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      // Apri il checkout di Snipcart
      if (window.Snipcart && window.Snipcart.api) {
        window.Snipcart.api.modal.open();
      }

      // Dopo il pagamento, svuota il carrello e mostra conferma
      // (Snipcart farà il reset automaticamente dopo pagamento completato)
      setTimeout(() => {
        cart = {};
        saveCart(cart);
        render();
        if (orderView) orderView.style.display = 'none';
        if (orderConfirmed) orderConfirmed.classList.add('show');
      }, 500);
    });
  }

  render();
})();
