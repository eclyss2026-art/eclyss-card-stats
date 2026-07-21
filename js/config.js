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
    }
  }

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
})();
