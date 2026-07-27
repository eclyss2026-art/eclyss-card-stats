/* ============================================================
   ECLYSS — Internazionalizzazione IT/EN
   Traduce PER CONTENUTO: nessun data-i18n da mettere a mano.
   Il motore scorre un set di selettori "foglia" e, se l'innerHTML
   normalizzato dell'elemento è una chiave del dizionario IT→EN,
   lo sostituisce. La lingua è salvata in localStorage.
   Il dizionario vive in js/i18n-dict.js (window.ECLYSS_I18N.en).
   ============================================================ */
(function () {
  var KEY = 'eclyssLang';
  var EN = (window.ECLYSS_I18N && window.ECLYSS_I18N.en) || {};

  // Selettori "foglia" che contengono testo traducibile.
  var SEL = [
    'h1', 'h2', 'h3', 'h4',
    '.section-label', '.section-title', '.hero-sub', '.hero-quote', '.hero-title',
    '.btn-hero', '.btn-purple', '.rb-cta', '.more-tag',
    'p', 'li a', '.nav-links a', '.footer-col-title', '.footer-mantra',
    '.box-label', '.box-title', '.box-feat-text', '.spec-body',
    '.era-name', '.gstat-elem', '.gstat-ability', '.world-hero-tagline',
    '.lore-mantra', '.codex-mantra', '.app-lead', '.app-title',
    '.cart-dropdown-header', '.cart-empty', '.qty-label',
    'button:not(.qty-btn):not(.menu-toggle):not(.cart-btn):not(.lang-toggle)',
    '.faq-q', 'span', 'a', 'td', 'th', 'label', 'li',
    '.order-title', '.order-empty', '.cart-item-remove', '.cart-item-meta', '[data-i18n]'
  ].join(',');

  var curLang = 'it', obs = null, reTimer = null;
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function apply(lang) {
    curLang = lang;
    if (obs) obs.disconnect(); // non reagire alle nostre stesse modifiche
    document.documentElement.setAttribute('lang', lang);
    // <title> della pagina
    if (!document.body.getAttribute('data-it-title')) document.body.setAttribute('data-it-title', document.title);
    var itTitle = document.body.getAttribute('data-it-title');
    document.title = (lang === 'en' && EN[norm(itTitle)] != null) ? EN[norm(itTitle)] : itTitle;
    var nodes = document.querySelectorAll(SEL);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // salva la sorgente IT una sola volta
      if (el.getAttribute('data-it') === null) el.setAttribute('data-it', el.innerHTML);
      var itHTML = el.getAttribute('data-it');
      if (lang === 'en') {
        var en = EN[norm(itHTML)];
        el.innerHTML = (en != null) ? en : itHTML;
      } else {
        el.innerHTML = itHTML;
      }
    }
    // attributi tradotti (alt, aria-label, placeholder, title) via data-i18n-attr="alt|aria-label"
    var attrEls = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < attrEls.length; j++) {
      var ae = attrEls[j];
      var attrs = ae.getAttribute('data-i18n-attr').split('|');
      for (var k = 0; k < attrs.length; k++) {
        var a = attrs[k].trim();
        if (ae.getAttribute('data-it-' + a) === null) ae.setAttribute('data-it-' + a, ae.getAttribute(a) || '');
        var itVal = ae.getAttribute('data-it-' + a);
        ae.setAttribute(a, lang === 'en' && EN[norm(itVal)] != null ? EN[norm(itVal)] : itVal);
      }
    }
    // etichetta del pulsante: mostra la lingua verso cui si passa
    var btns = document.querySelectorAll('.lang-toggle');
    for (var b = 0; b < btns.length; b++) {
      btns[b].textContent = (lang === 'it') ? 'EN' : 'IT';
      btns[b].setAttribute('aria-label', lang === 'it' ? 'Switch to English' : 'Passa all’italiano');
    }
    // riprende ad osservare (scarta le mutazioni causate da noi stessi)
    if (obs) { obs.takeRecords(); obs.observe(document.body, { childList: true, subtree: true }); }
  }

  function get() { try { return localStorage.getItem(KEY) || 'it'; } catch (e) { return 'it'; } }
  function set(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.lang-toggle');
    if (!t) return;
    e.preventDefault();
    var l = get() === 'it' ? 'en' : 'it';
    set(l); apply(l);
  });

  function init() {
    apply(get());
    // Ri-traduce i contenuti generati dinamicamente (carrello, ordine, ecc.)
    if ('MutationObserver' in window) {
      obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes && muts[i].addedNodes.length) {
            clearTimeout(reTimer);
            reTimer = setTimeout(function () { apply(curLang); }, 60);
            return;
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
