// Configurazione globale ECLYSS
// API key Snipcart (per development locale)
// In produzione (Netlify): impostare la variabile d'ambiente VITE_SNIPCART_API_KEY nelle Netlify settings
window.SNIPCART_API_KEY = 'MDVjMmQ2NmItODk2Zi00OTFkLWJmN2UtNGRhNzZhMTZhZDQxNjM5MjAxNTAzODExNjAwNDYz';

// Se disponibile, usa la variabile d'ambiente da Netlify (sovrascrivi la chiave locale)
if (typeof window.VITE_SNIPCART_API_KEY !== 'undefined' && window.VITE_SNIPCART_API_KEY) {
  window.SNIPCART_API_KEY = window.VITE_SNIPCART_API_KEY;
}

// Link centralizzati per gli app store (modifica qui per aggiornarli ovunque)
window.STORE_LINKS = {
  appStore: 'https://apps.apple.com/it/',
  googlePlay: 'https://play.google.com/store/apps/'
};

// ── Campi fatturazione italiani nel checkout Snipcart ────────────────────────
// Snipcart permette "order custom fields" sovrascrivendo i template: si mette
// un <billing section="bottom"> dentro il div #snipcart PRIMA che Snipcart si
// monti. Lo iniettiamo da qui invece che nell'HTML perche' le pagine del sito
// sono cifrate con StaticCrypt: toccarle vorrebbe dire ricifrarle tutte ad
// ogni ritocco di un'etichetta, mentre config.js resta in chiaro.
//
// Tutti i campi sono SEMPRE VISIBILI e facoltativi: niente logica condizionale
// Privato/Azienda, che dipenderebbe dal DOM interno di Snipcart e andrebbe
// riverificata ad ogni loro aggiornamento. Piu' brutto, molto piu' robusto.
// I valori finiscono in customFields dell'ordine e si vedono nel dashboard.
function injectBillingFields(snipcart) {
  if (snipcart.querySelector('billing')) return;
  // Etichette secche + un titolo di sezione che spiega una volta sola che sono
  // facoltativi: ripeterlo in ogni etichetta ("per fattura a privato", "per
  // fattura ad azienda") le allungava e rendeva il blocco pesante da leggere.
  // Snipcart non ha titoli di sezione nativi: usiamo delle snipcart-label.
  // ATTENZIONE: una snipcart-label SENZA attributo "for" viene scartata in fase
  // di compilazione e non arriva nemmeno nel DOM — verificato. Il titolo e la
  // riga di spiegazione puntano quindi al primo campo.
  const FIELDS = [
    ['codiceFiscale',  'Codice Fiscale (privati)'],
    ['ragioneSociale', 'Ragione sociale (aziende)'],
    ['partitaIva',     'Partita IVA (aziende)'],
    ['codiceSdi',      'Codice Destinatario SDI o PEC (aziende)']
  ];
  const billing = document.createElement('billing');
  billing.setAttribute('section', 'bottom');
  billing.innerHTML =
    '<fieldset class="snipcart-form__set">' +
      '<div class="snipcart-form__field">' +
        '<snipcart-label class="snipcart__font--secondary snipcart__font--bold" for="codiceFiscale">' +
          'Dati per la fattura' +
        '</snipcart-label>' +
        '<snipcart-label class="snipcart__font--tiny" for="codiceFiscale">' +
          'Facoltativi: compilali solo se ti serve la fattura.' +
        '</snipcart-label>' +
      '</div>' +
      FIELDS.map(([name, label]) =>
        '<div class="snipcart-form__field">' +
          '<snipcart-label class="snipcart__font--tiny" for="' + name + '">' + label + '</snipcart-label>' +
          '<snipcart-input name="' + name + '"></snipcart-input>' +
        '</div>'
      ).join('') +
    '</fieldset>';
  snipcart.appendChild(billing);
}

// Applica la API key al div Snipcart
document.addEventListener('DOMContentLoaded', function() {
  const snipcart = document.getElementById('snipcart');
  if (snipcart) {
    snipcart.setAttribute('data-api-key', window.SNIPCART_API_KEY);
    injectBillingFields(snipcart);
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
    // URL che Snipcart usa per validare il prodotto (fa il crawl di questa pagina
    // e vi cerca la definizione .snipcart-add-item con id/prezzo). Deve essere
    // ASSOLUTO e raggiungibile: risolto rispetto alla pagina corrente, così è
    // corretto anche se il sito è deployato in una sottocartella.
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

  // ── Tasto sulla pagina di conferma ordine ────────────────────────────────────
  // La schermata "Grazie per il tuo ordine" (#/order/...) NON ha il pulsante
  // "Pagamento": il tasto qui sotto viene quindi agganciato in fondo al
  // contenitore dell'ordine. Senza, da quella pagina non c'e' modo evidente di
  // tornare al sito se non con il tasto indietro del browser.
  let orderBtn = null;
  function buildOrderButton() {
    if (orderBtn) return orderBtn;
    orderBtn = document.createElement('button');
    orderBtn.type = 'button';
    orderBtn.id = 'snipcartOrderBackBtn';
    orderBtn.setAttribute('aria-label', 'Torna al sito');
    orderBtn.innerHTML = '<span aria-hidden="true">&larr;</span> Torna al sito';
    Object.assign(orderBtn.style, {
      display: 'block', width: '100%', maxWidth: '340px', margin: '26px auto 40px',
      padding: '14px 18px', border: '1px solid rgba(192,132,252,.5)',
      borderRadius: '6px', cursor: 'pointer',
      background: 'transparent', color: '#c9a8ff',
      font: '600 15px/1.2 Asul, system-ui, sans-serif', letterSpacing: '.5px',
      textAlign: 'center'
    });
    orderBtn.addEventListener('mouseenter', function(){ orderBtn.style.background = 'rgba(123,47,255,.14)'; orderBtn.style.color = '#fff'; });
    orderBtn.addEventListener('mouseleave', function(){ orderBtn.style.background = 'transparent'; orderBtn.style.color = '#c9a8ff'; });
    orderBtn.addEventListener('click', function() {
      if (window.Snipcart && window.Snipcart.api) window.Snipcart.api.theme.cart.close();
      // Pulisce la route #/order/... : senza, riaprendo il carrello si
      // tornerebbe sulla schermata di conferma invece che sul carrello.
      history.replaceState(null, '', location.pathname + location.search);
      if (orderBtn.parentNode) orderBtn.parentNode.removeChild(orderBtn);
    });
    return orderBtn;
  }

  function injectOrderButton() {
    const box = document.querySelector('.snipcart-cart__order-container');
    if (!box) return false;
    const b = buildOrderButton();
    if (b.parentNode !== box) box.appendChild(b);
    return true;
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

  // A seconda della schermata serve un aggancio diverso: nel carrello/checkout
  // il tasto va sotto "Pagamento", nella conferma ordine in fondo al riepilogo.
  function injectButtons() {
    injectBackButton();
    injectOrderButton();
  }

  function showBackButton() {
    injectButtons();
    // Osserva il carrello: se Vue lo ridisegna, re-inserisce il pulsante.
    // L'observer sta su document.body e non su #snipcart perche' Snipcart
    // ricrea quel nodo montandosi, lasciando l'observer su un elemento staccato.
    if (!backObserver) {
      backObserver = new MutationObserver(function() {
        if (location.hash.indexOf('#/') === 0) injectButtons();
      });
      backObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  function hideBackButton() {
    if (backObserver) { backObserver.disconnect(); backObserver = null; }
    if (backBtn && backBtn.parentNode) backBtn.parentNode.removeChild(backBtn);
    if (orderBtn && orderBtn.parentNode) orderBtn.parentNode.removeChild(orderBtn);
  }

  // Dopo un pagamento Snipcart porta su #/order/... senza passare da un nostro
  // click, e chi riapre quel link ci arriva direttamente al caricamento: in
  // entrambi i casi nessuno avrebbe chiamato showBackButton(). Lo agganciamo
  // quindi anche all'avvio, se la route e' gia' dentro il carrello.
  function syncButtonsWithRoute() {
    if (location.hash.indexOf('#/') === 0) showBackButton();
  }
  if (window.Snipcart && window.Snipcart.api) syncButtonsWithRoute();
  else document.addEventListener('snipcart.ready', syncButtonsWithRoute, { once: true });

  // ── Indirizzo: campi manuali aperti di default ───────────────────────────────
  // L'autocompletamento di Snipcart usa Google Places senza restrizione di paese
  // e cerca a livello di via: digitando un comune ("Alba") restituisce strade
  // statunitensi e l'utente resta bloccato. Snipcart offre una via d'uscita, la
  // casella "Non trovo il mio indirizzo", che apre i campi manuali (via, citta',
  // paese, provincia, CAP) — ma e' nascosta e nessuno la cerca.
  // Qui la spuntiamo noi appena il form compare, cosi' i campi manuali sono
  // subito visibili. Il form e' Vue e viene ridisegnato, quindi marchiamo ogni
  // casella gia' gestita: se l'utente la ri-toglie per usare l'autocomplete,
  // non gliela riattiviamo addosso.
  const HANDLED = 'eclyssAddrDone';

  function openManualAddressFields() {
    // Ricerca su tutto il documento, non dentro #snipcart: Snipcart monta il
    // proprio DOM ricreando quel nodo, quindi un riferimento preso all'avvio
    // resta agganciato a un elemento ormai staccato.
    const boxes = document.querySelectorAll('input[id^="addressNotFound_"]');
    for (const cb of boxes) {
      if (cb.dataset[HANDLED]) continue;
      cb.dataset[HANDLED] = '1';
      // click(), non checked=true: serve l'evento per far reagire Vue.
      if (!cb.checked) cb.click();
    }
  }

  let addrObserver = null;
  function watchAddressFields() {
    openManualAddressFields();
    if (addrObserver) return;
    addrObserver = new MutationObserver(openManualAddressFields);
    addrObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Parte subito: l'observer vive sul body, quindi intercetta il form quando
  // Snipcart lo monta, senza dipendere da quando arriva "snipcart.ready".
  if (document.body) watchAddressFields();
  else document.addEventListener('DOMContentLoaded', watchAddressFields, { once: true });

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
