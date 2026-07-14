/* ============================================================
   ECLYSS — Pagina Prodotto Principale
   Animazioni di reveal allo scroll (GSAP + ScrollTrigger),
   estratte da "eclyss_card_stats (1).html".
   ============================================================ */

(function() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  function revealEach(selector, vars) {
    gsap.utils.toArray(selector).forEach((el) => {
      gsap.from(el, Object.assign({
        opacity: 0, y: 34, duration: 0.85, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none reverse' }
      }, vars));
    });
  }

  // ── Section headers ──
  revealEach('.section-label', { y: 18 });
  revealEach('.section-title', { y: 32, delay: 0.06 });

  // ── Edizione 01 — ammorbidisce lo stacco netto in uscita dall'hero ──
  revealEach('.edition-media img', { opacity: 0, duration: 1 });
  revealEach('.edition-title', { y: 28 });
  revealEach('.edition-desc', { y: 22, delay: 0.1 });
  ScrollTrigger.batch('.edition-specs li', {
    start: 'top 90%',
    once: true,
    onEnter: batch => gsap.from(batch, {
      opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power2.out',
      clearProps: 'transform,opacity'
    })
  });

  // ── Come funziona ──
  revealEach('.how-lead', { y: 22 });
  revealEach('.ritual-banner', { y: 26 });
  ScrollTrigger.batch('.ritual-step', {
    start: 'top 88%',
    once: true,
    onEnter: batch => gsap.from(batch, {
      opacity: 0, y: 30, scale: 0.96, duration: 0.7, stagger: 0.12, ease: 'back.out(1.5)',
      clearProps: 'transform,opacity'
    })
  });

  // ── Box section ──
  revealEach('.box-label', { y: 18 });
  revealEach('.box-title', { y: 30, delay: 0.06 });
  revealEach('.box-desc', { y: 22, delay: 0.12 });
  revealEach('.btn-purple', { y: 20, delay: 0.18 });
  ScrollTrigger.batch('.box-feat', {
    start: 'top 90%',
    once: true,
    onEnter: batch => gsap.from(batch, {
      opacity: 0, x: 26, duration: 0.6, stagger: 0.08, ease: 'power2.out',
      clearProps: 'transform,opacity'
    })
  });
  revealEach('.box3d-wrap', { opacity: 0, scale: 0.92, duration: 1 });

  // ── Footer ──
  revealEach('.footer-mantra', { y: 16 });
  ScrollTrigger.batch('.footer-col-title, .footer-links, .social-col', {
    start: 'top 95%',
    once: true,
    onEnter: batch => gsap.from(batch, {
      opacity: 0, y: 18, duration: 0.6, stagger: 0.06, ease: 'power2.out',
      clearProps: 'transform,opacity'
    })
  });

  // ── Barra di avanzamento scroll in alto ──
  gsap.to('#scrollProgress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
