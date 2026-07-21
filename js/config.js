// Configurazione globale ECLYSS
window.SNIPCART_API_KEY = 'MDVjMmQ2NmItODk2Zi00OTFkLWJmN2UtNGRhNzZhMTZhZDQxNjM5MjAxNTAzODExNjAwNDYz';

// Applica la API key al div Snipcart
document.addEventListener('DOMContentLoaded', function() {
  const snipcart = document.getElementById('snipcart');
  if (snipcart) {
    snipcart.setAttribute('data-api-key', window.SNIPCART_API_KEY);
  }
});

// ── "Vai all'acquisto": apre direttamente Snipcart, bypassando checkout.html ──
// Condiviso da tutte le pagine. Copia il carrello custom (localStorage) dentro
// Snipcart e apre il carrello Snipcart pronto per il pagamento.
(function() {
  const STORAGE_KEY = 'eclyssCart';

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  // Svuota il carrello Snipcart e lo ripopola dal carrello custom, così non si
  // duplicano gli articoli se l'utente apre e chiude il pagamento più volte.
  async function syncCartToSnipcart() {
    const PRODUCTS = window.ECLYSS_PRODUCTS || {};
    const cart = loadCart();
    const state = window.Snipcart.store.getState();
    const existing = (state.cart && state.cart.items && state.cart.items.items) || [];
    for (const it of existing) {
      await window.Snipcart.api.cart.items.remove(it.uniqueId);
    }
    const entries = Object.keys(cart).filter(id => PRODUCTS[id]);
    for (const id of entries) {
      const p = PRODUCTS[id];
      await window.Snipcart.api.cart.items.add({
        id: p.id,
        name: p.name,
        price: p.price,
        url: '/index.html',
        quantity: cart[id],
        description: p.meta,
        image: p.image
      });
    }
    return entries.length;
  }

  async function openSnipcartCheckout() {
    if (!(window.Snipcart && window.Snipcart.api)) return;
    const count = await syncCartToSnipcart();
    if (count > 0) {
      await window.Snipcart.api.theme.cart.open();
      showBackButton();
    }
  }

  // ── Tasto "Torna allo shopping" ──────────────────────────────────────────────
  // Un nostro pulsante, sempre visibile e in stile ECLYSS, sopra il carrello
  // Snipcart: chiude il carrello e riporta al sito. Indipendente dai controlli
  // interni di Snipcart (che sul tema scuro erano poco evidenti).
  let backBtn = null;
  function buildBackButton() {
    if (backBtn) return backBtn;
    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'snipcartBackBtn';
    backBtn.setAttribute('aria-label', 'Torna allo shopping');
    backBtn.innerHTML = '<span aria-hidden="true">&larr;</span> Torna allo shopping';
    Object.assign(backBtn.style, {
      position: 'fixed', top: '18px', left: '18px', zIndex: '2147483000',
      display: 'none', alignItems: 'center', gap: '8px',
      padding: '11px 18px', border: '1px solid rgba(192,132,252,.55)',
      borderRadius: '999px', cursor: 'pointer',
      background: 'rgba(123,47,255,.92)', color: '#fff',
      font: '600 15px/1 Asul, system-ui, sans-serif', letterSpacing: '.5px',
      boxShadow: '0 8px 28px rgba(123,47,255,.45)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)'
    });
    backBtn.addEventListener('click', function() {
      if (window.Snipcart && window.Snipcart.api) {
        window.Snipcart.api.theme.cart.close();
      }
      hideBackButton();
    });
    document.body.appendChild(backBtn);
    return backBtn;
  }
  function showBackButton() { buildBackButton().style.display = 'inline-flex'; }
  function hideBackButton() { if (backBtn) backBtn.style.display = 'none'; }

  // Tiene il tasto sincronizzato: se il carrello viene chiuso in altri modi
  // (tasto interno di Snipcart, Esc, fine ordine), la route esce da "#/..." e
  // noi nascondiamo il pulsante.
  window.addEventListener('hashchange', function() {
    if (location.hash.indexOf('#/') === 0) showBackButton();
    else hideBackButton();
  });

  // Delegazione: qualsiasi ".cart-checkout" su qualsiasi pagina apre Snipcart.
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.cart-checkout');
    if (!btn) return;
    e.preventDefault();
    // Se Snipcart non è ancora pronto, aspetta l'evento e poi apri.
    if (window.Snipcart && window.Snipcart.api) {
      openSnipcartCheckout();
    } else {
      document.addEventListener('snipcart.ready', openSnipcartCheckout, { once: true });
    }
  });

  // Uscita dal carrello/pagamento Snipcart: il tasto Esc lo chiude sempre.
  // Il carrello Snipcart è un overlay a tutta pagina senza "clic fuori",
  // quindi diamo una via d'uscita esplicita e familiare.
  function isSnipcartOpen() {
    return document.documentElement.classList.contains('snipcart-modal--opened') ||
           !!document.querySelector('.snipcart-modal__container') ||
           (location.hash && location.hash.indexOf('/') !== -1 && !!document.querySelector('.snipcart'));
  }
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (window.Snipcart && window.Snipcart.api && isSnipcartOpen()) {
      window.Snipcart.api.theme.cart.close();
    }
  });
})();
