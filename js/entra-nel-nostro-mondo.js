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

// Nastro infinito delle carte: touch e trackpad restano nativi; con il mouse
// si trascina la riga. Una copia della sequenza ai due lati permette di
// oltrepassare prima e ultima carta senza incontrare un fine corsa.
(function() {
  document.querySelectorAll('.cards-row').forEach(row => {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScrollLeft = 0;
    let activePointerId = null;
    let loopWidth = 0;
    let loopFrame = null;

    const originalCards = Array.from(row.children);
    const cloneCard = card => {
      const clone = card.cloneNode(true);
      clone.dataset.loopClone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    };

    if (originalCards.length > 1) {
      const beforeCards = originalCards.map(cloneCard);
      const afterCards = originalCards.map(cloneCard);
      const beforeFragment = document.createDocumentFragment();
      const afterFragment = document.createDocumentFragment();

      beforeCards.forEach(card => beforeFragment.appendChild(card));
      afterCards.forEach(card => afterFragment.appendChild(card));
      row.insertBefore(beforeFragment, row.firstChild);
      row.appendChild(afterFragment);

      const measureLoop = () => {
        const previousWidth = loopWidth;
        const nextWidth = originalCards[0].offsetLeft - beforeCards[0].offsetLeft;
        if (nextWidth <= 0) return;

        loopWidth = nextWidth;
        if (previousWidth > 0) {
          row.scrollLeft = row.scrollLeft / previousWidth * loopWidth;
        } else {
          row.scrollLeft = loopWidth;
        }
      };

      const keepInsideLoop = () => {
        loopFrame = null;
        if (!loopWidth) return;

        let shift = 0;
        while (row.scrollLeft + shift < loopWidth * .5) shift += loopWidth;
        while (row.scrollLeft + shift > loopWidth * 1.5) shift -= loopWidth;

        if (shift) {
          row.scrollLeft += shift;
          if (dragging) startScrollLeft += shift;
        }
      };

      row.addEventListener('scroll', () => {
        if (loopFrame === null) loopFrame = requestAnimationFrame(keepInsideLoop);
      }, { passive: true });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measureLoop, 120);
      }, { passive: true });

      requestAnimationFrame(measureLoop);
    }

    row.addEventListener('dragstart', event => event.preventDefault());

    row.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;

      dragging = true;
      moved = false;
      activePointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = row.scrollLeft;
      row.classList.add('is-dragging');
      row.setPointerCapture(activePointerId);
    });

    row.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      const distance = event.clientX - startX;
      if (Math.abs(distance) > 4) moved = true;
      row.scrollLeft = startScrollLeft - distance;
      event.preventDefault();
    });

    function stopDragging(event) {
      if (!dragging || event.pointerId !== activePointerId) return;

      dragging = false;
      row.classList.remove('is-dragging');
      if (row.hasPointerCapture(activePointerId)) {
        row.releasePointerCapture(activePointerId);
      }
      activePointerId = null;
    }

    row.addEventListener('pointerup', stopDragging);
    row.addEventListener('pointercancel', stopDragging);

    row.addEventListener('click', event => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }, true);

    // Il posizionamento iniziale e i salti invisibili del nastro generano eventi
    // scroll via codice: l'invito deve reagire solo a un gesto reale dell'utente.
    // Sparisce solo dopo un movimento orizzontale vero: un tap, o la rotellina
    // usata per scorrere la pagina in verticale, non contano come esplorazione.
    const hint = row.previousElementSibling;
    if (hint && hint.classList.contains('swipe-hint')) {
      const usato = () => {
        hint.classList.add('is-used');
        row.removeEventListener('pointermove', suMouse);
        row.removeEventListener('touchmove', suTocco);
        row.removeEventListener('touchstart', segnaTocco);
        row.removeEventListener('wheel', suRotella);
      };

      function suMouse() { if (moved) usato(); }
      function suRotella(event) {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) usato();
      }

      let toccoX = 0, toccoY = 0;
      function segnaTocco(event) {
        const t = event.touches[0];
        if (t) { toccoX = t.clientX; toccoY = t.clientY; }
      }
      function suTocco(event) {
        const t = event.touches[0];
        if (!t) return;
        const dx = Math.abs(t.clientX - toccoX);
        const dy = Math.abs(t.clientY - toccoY);
        if (dx > 12 && dx > dy) usato();
      }

      row.addEventListener('pointermove', suMouse, { passive: true });
      row.addEventListener('wheel', suRotella, { passive: true });
      row.addEventListener('touchstart', segnaTocco, { passive: true });
      row.addEventListener('touchmove', suTocco, { passive: true });
    }
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
// Video hero: prova l'autoplay quando il file e' pronto, quando la pagina
// torna visibile e al primo gesto dell'utente. Il video rimane trasparente
// finche' non parte davvero, lasciando visibile il poster senza pulsanti nativi.
(function() {
  const video = document.querySelector('.world-hero-bg video');
  const container = video && video.closest('.world-hero-bg');
  if (!video || !container) return;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  // Difesa esplicita: se un'estensione o una preferenza del browser reintroduce
  // i controlli, il pulsante Play tornerebbe visibile sopra al video.
  video.controls = false;
  video.removeAttribute('controls');

  // Il poster e' un livello sopra il video: si dissolve solo a riproduzione
  // confermata, quindi non c'e' mai ne' area nera ne' lampo tra i due.
  // Una volta che il video ha girato davvero non si torna piu' al poster: un
  // buffering o una pausa di sistema mostrerebbero un lampo del poster sopra a
  // un fotogramma gia' identico. Il poster serve solo al primo avvio.
  let hasPlayed = false;
  const showPoster = () => {
    if (!hasPlayed) container.classList.remove('video-is-playing');
  };
  const showVideo = () => {
    hasPlayed = true;
    container.classList.add('video-is-playing');
  };

  function tryPlayback() {
    if (document.hidden || !video.paused) return;

    // Ogni tentativo riafferma il muto: e' la condizione che rende l'autoplay
    // ammissibile, e un ritorno dalla bfcache puo' ripristinare lo stato salvato.
    video.muted = true;
    try {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(showPoster);
      }
    } catch (error) {
      showPoster();
    }
  }

  video.addEventListener('playing', showVideo);
  video.addEventListener('error', showPoster);
  video.addEventListener('loadeddata', tryPlayback);
  video.addEventListener('canplay', tryPlayback);
  // iOS puo' sospendere la riproduzione (chiamata in arrivo, risparmio energetico,
  // scheda in secondo piano): si torna al poster e si ritenta, senza mai lasciare
  // sullo schermo il fotogramma fermo con il pulsante nativo.
  video.addEventListener('pause', () => {
    if (video.ended) return;
    showPoster();
    tryPlayback();
  });
  video.addEventListener('stalled', showPoster);
  video.addEventListener('waiting', showPoster);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlayback();
  });
  window.addEventListener('pageshow', tryPlayback);

  const unlockOnFirstGesture = () => {
    document.removeEventListener('pointerdown', unlockOnFirstGesture, true);
    document.removeEventListener('touchstart', unlockOnFirstGesture, true);
    document.removeEventListener('keydown', unlockOnFirstGesture, true);
    tryPlayback();
  };

  document.addEventListener('pointerdown', unlockOnFirstGesture, true);
  document.addEventListener('touchstart', unlockOnFirstGesture, { capture: true, passive: true });
  document.addEventListener('keydown', unlockOnFirstGesture, true);

  if (video.readyState >= 2) tryPlayback();
})();
