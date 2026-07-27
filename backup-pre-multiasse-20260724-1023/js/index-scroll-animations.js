/* ============================================================
   ECLYSS — Pagina Prodotto Principale
   Animazioni di scroll.
   Le animazioni di comparsa (reveal in dissolvenza/movimento) sono state
   RIMOSSE su richiesta: gli elementi restano visibili da subito, senza fade
   né trascinamento. Resta solo la barra di avanzamento in cima, che e' un
   indicatore di scroll, non un'animazione di comparsa.
   ============================================================ */

(function() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // ── Barra di avanzamento scroll in alto ──
  gsap.to('#scrollProgress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
