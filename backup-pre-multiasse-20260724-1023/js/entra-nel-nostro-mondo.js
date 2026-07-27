/* ============================================================
   ECLYSS — Pagina "Entra nel Nostro Mondo" (lore/universo)
   Logica di scroll delle ancore + mini-carrello nella nav,
   estratta da entra-nel-nostro-mondo.html.
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

// ── Smooth scroll per ancore interne (es. nav -> #lore, #codex, ecc.) ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── Carrello (stessa logica/stato del sito principale, via localStorage) ──────
(function() {
  const navCart  = document.querySelector('.nav-cart');
  const cartBtn  = document.getElementById('cartBtn');
  if (!navCart || !cartBtn) return;

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

  const cartCountEl = document.getElementById('cartCount');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooterEl = document.getElementById('cartFooter');
  const cartSubtotalEl = document.getElementById('cartSubtotal');

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
  }

  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', e => {
      const row = e.target.closest('.cart-item');
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

  // Apertura/chiusura del mini-carrello nella nav (click fuori o Esc per chiudere).
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

  render();
})();
