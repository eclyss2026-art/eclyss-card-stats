// Configurazione globale ECLYSS
// La API key di Snipcart viene iniettata da:
// - Variabile d'ambiente VITE_SNIPCART_API_KEY durante il build (Netlify/CI)
// - File .env locale durante lo sviluppo (mai committare .env!)
// - Oppure settata manualmente su window.SNIPCART_API_KEY prima di loadare questo script
if (!window.SNIPCART_API_KEY && typeof window.VITE_SNIPCART_API_KEY !== 'undefined') {
  window.SNIPCART_API_KEY = window.VITE_SNIPCART_API_KEY;
}

// Link centralizzati per gli app store (modifica qui per aggiornarli ovunque)
window.STORE_LINKS = {
  appStore: 'https://apps.apple.com/it/',
  googlePlay: 'https://play.google.com/store/apps/'
};

// Applica la API key al div Snipcart
document.addEventListener('DOMContentLoaded', function() {
  const snipcart = document.getElementById('snipcart');
  if (snipcart) {
    snipcart.setAttribute('data-api-key', window.SNIPCART_API_KEY);
  }

  // Aggiorna i link agli app store su tutte le pagine
  const appStoreBtn = document.querySelector('.app-buttons a[aria-label*="App Store"]');
  const googlePlayBtn = document.querySelector('.app-buttons a[aria-label*="Google Play"]');
  if (appStoreBtn) appStoreBtn.href = window.STORE_LINKS.appStore;
  if (googlePlayBtn) googlePlayBtn.href = window.STORE_LINKS.googlePlay;
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
  // Un nostro pulsante in stile ECLYSS inserito DENTRO il carrello Snipcart,
  // subito sotto il tasto "Pagamento". Chiude il carrello e riporta al sito.
  // Snipcart usa Vue e ridisegna il DOM: un MutationObserver lo re-inserisce
  // se viene rimosso.
  let backBtn = null;
  let backObserver = null;

  function buildBackButton() {
    if (backBtn) return backBtn;
    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'snipcartBackBtn';
    backBtn.setAttribute('aria-label', 'Torna allo shopping');
    backBtn.innerHTML = '<span aria-hidden="true">&larr;</span> Torna allo shopping';
    // Bottone secondario (outline viola) a tutta larghezza, sotto "Pagamento".
    Object.assign(backBtn.style, {
      display: 'block', width: '100%', marginTop: '10px',
      padding: '13px 18px', border: '1px solid rgba(192,132,252,.5)',
      borderRadius: '6px', cursor: 'pointer',
      background: 'transparent', color: '#c9a8ff',
      font: '600 15px/1.2 Asul, system-ui, sans-serif', letterSpacing: '.5px',
      textAlign: 'center'
    });
    backBtn.addEventListener('mouseenter', function(){ backBtn.style.background = 'rgba(123,47,255,.14)'; backBtn.style.color = '#fff'; });
    backBtn.addEventListener('mouseleave', function(){ backBtn.style.background = 'transparent'; backBtn.style.color = '#c9a8ff'; });
    backBtn.addEventListener('click', function() {
      if (window.Snipcart && window.Snipcart.api) {
        window.Snipcart.api.theme.cart.close();
      }
      hideBackButton();
    });
    return backBtn;
  }

  // Bottone "Svuota carrello" — rimuove tutti gli articoli da Snipcart.
  let emptyBtn = null;
  function buildEmptyButton() {
    if (emptyBtn) return emptyBtn;
    emptyBtn = document.createElement('button');
    emptyBtn.type = 'button';
    emptyBtn.id = 'snipcartEmptyBtn';
    emptyBtn.setAttribute('aria-label', 'Svuota carrello');
    emptyBtn.innerHTML = '<span aria-hidden="true">🗑</span> Svuota carrello';
    Object.assign(emptyBtn.style, {
      display: 'block', width: '100%', marginTop: '8px',
      padding: '13px 18px', border: '1px solid rgba(192,132,252,.3)',
      borderRadius: '6px', cursor: 'pointer',
      background: 'transparent', color: '#c9a8ff',
      font: '600 15px/1.2 Asul, system-ui, sans-serif', letterSpacing: '.5px',
      textAlign: 'center', opacity: '.8'
    });
    emptyBtn.addEventListener('mouseenter', function(){ emptyBtn.style.background = 'rgba(192,132,252,.08)'; emptyBtn.style.opacity = '1'; });
    emptyBtn.addEventListener('mouseleave', function(){ emptyBtn.style.background = 'transparent'; emptyBtn.style.opacity = '.8'; });
    emptyBtn.addEventListener('click', async function() {
      if (!(window.Snipcart && window.Snipcart.api)) return;
      const state = window.Snipcart.store.getState();
      const items = (state.cart && state.cart.items && state.cart.items.items) || [];
      for (const it of items) {
        await window.Snipcart.api.cart.items.remove(it.uniqueId);
      }
    });
    return emptyBtn;
  }

  // Inserisce i pulsanti subito dopo il tasto "Pagamento", se presente.
  function injectBackButton() {
    const payBtn = document.querySelector('.snipcart button.snipcart-button-primary');
    if (!payBtn) return false;
    const b = buildBackButton();
    const e = buildEmptyButton();
    if (payBtn.nextElementSibling !== b) {
      payBtn.parentNode.insertBefore(b, payBtn.nextElementSibling);
    }
    if (b.nextElementSibling !== e) {
      payBtn.parentNode.insertBefore(e, b.nextElementSibling);
    }
    return true;
  }

  function showBackButton() {
    injectBackButton();
    // Osserva il carrello: se Vue lo ridisegna, re-inserisce il pulsante.
    if (!backObserver) {
      const root = document.getElementById('snipcart') || document.body;
      backObserver = new MutationObserver(function() {
        if (location.hash.indexOf('#/') === 0) injectBackButton();
      });
      backObserver.observe(root, { childList: true, subtree: true });
    }
  }

  function hideBackButton() {
    if (backObserver) { backObserver.disconnect(); backObserver = null; }
    if (backBtn && backBtn.parentNode) backBtn.parentNode.removeChild(backBtn);
  }

  // Tiene il tasto sincronizzato: se il carrello viene chiuso in altri modi
  // (tasto interno di Snipcart, Esc, fine ordine), la route esce da "#/..." e
  // noi nascondiamo il pulsante.
  window.addEventListener('hashchange', function() {
    if (location.hash.indexOf('#/') === 0) showBackButton();
    else hideBackButton();
  });

  // Anche i link della nav (Home, Come Funziona, L'Universo, Acquista, logo)
  // devono far uscire dal carrello: se Snipcart è aperto quando ci si clicca,
  // lo chiudiamo così la navigazione/scroll avviene sul sito, non sotto l'overlay.
  document.addEventListener('click', function(e) {
    const navLink = e.target.closest('nav a');
    if (!navLink) return;
    if (window.Snipcart && window.Snipcart.api && isSnipcartOpen()) {
      window.Snipcart.api.theme.cart.close();
      hideBackButton();
    }
  }, true);

  // Chiude il carrellino custom della nav (il dropdown), così cliccando
  // "Vai all'acquisto" non resta aperto dietro l'overlay Snipcart.
  function closeNavCart() {
    const navCart = document.querySelector('.nav-cart');
    if (navCart) navCart.classList.remove('open');
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
  }

  // Delegazione: qualsiasi ".cart-checkout" su qualsiasi pagina apre Snipcart.
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.cart-checkout');
    if (!btn) return;
    e.preventDefault();
    closeNavCart();
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
