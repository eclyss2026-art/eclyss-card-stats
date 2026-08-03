/* ============================================================
   ECLYSS — Catalogo prodotti condiviso
   Unica fonte di verità per nome, prezzo, descrizione e immagine
   dei prodotti. Caricato da tutte le pagine PRIMA dello script di
   pagina (index.js, checkout.js, faq.js, entra-nel-nostro-mondo.js),
   che leggono window.ECLYSS_PRODUCTS.
   Per cambiare prezzo o testi si modifica SOLO questo file.
   ATTENZIONE: id, nome e prezzo devono restare identici a quelli dichiarati in
   prodotto.html e nel blocco .snipcart-add-item nascosto di index.html, altrimenti
   Snipcart fallisce la validazione del prodotto al checkout.
   ============================================================ */

window.ECLYSS_PRODUCTS = {
  'eclyss-box': { id: 'eclyss-box', name: 'ECLYSS “Respiro Originario” Box', meta: '4 lattine collezionabili', price: 9.96, image: 'assets/logo-magenta.png' }
};
