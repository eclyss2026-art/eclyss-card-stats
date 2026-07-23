/* ============================================================
   ECLYSS — Pagina Prodotto Principale
   Logica estratta da "eclyss_card_stats (1).html":
   sfondo stellato, nav/scroll, carrello, lattina 3D (three.js).
   ============================================================ */

// ── Stars ─────────────────────────────────────────────────────────────────────
(function() {
  const starsEl = document.getElementById('stars');
  if (!starsEl) return;
  for (let i = 0; i < 130; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() < .15 ? 2 : 1;
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--d:${2+Math.random()*4}s;--dl:${Math.random()*5}s;--lo:${.1+Math.random()*.25};--hi:${.5+Math.random()*.5}`;
    starsEl.appendChild(s);
  }
})();

// ── Smooth scroll ─────────────────────────────────────────────────────────────
// L'inquadratura di atterraggio di ogni sezione e' controllata dal suo
// scroll-margin-top nel CSS (vedi #how, che scende un po' piu' in basso).
document.querySelectorAll('a[href^="#"]:not(.skip-intro)').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── Gestione manuale dello scroll al caricamento ──────────────────────────────
// Il ripristino automatico del browser e' differito e puo' scattare DOPO i
// nostri scrollTo (la lattina ricompariva a meta' rotazione): quindi la
// posizione di partenza la decidiamo noi ('manual').
// - prima navigazione con ancora (es. index.html#how da un'altra pagina):
//   si atterra sull'ancora, riallineando a caricamento completo perche'
//   font, immagini e modelli 3D spostano il layout
// - refresh o back/forward: si torna dov'era l'utente, MA se quella posizione
//   cade dentro l'intro (scroll-stage) si riparte da 0 con la lattina a
//   rotazione zero: l'intro ha senso solo dall'inizio
(function() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const SCROLL_KEY = 'eclyssIndexScrollY';
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch (e) {}
  });

  const navEntry = performance.getEntriesByType('navigation')[0];
  const isFreshNavigation = !navEntry || navEntry.type === 'navigate';

  function position() {
    if (isFreshNavigation) {
      const t = window.location.hash && document.querySelector(window.location.hash);
      if (t) t.scrollIntoView({ behavior: 'auto' });
      return;
    }
    let saved = 0;
    try { saved = Number(sessionStorage.getItem(SCROLL_KEY)) || 0; } catch (e) {}
    const stage = document.getElementById('scroll-stage');
    const stageEnd = stage ? stage.offsetHeight - window.innerHeight : 0;
    window.scrollTo({ top: saved > stageEnd ? saved : 0, behavior: 'auto' });
  }

  // subito, per ridurre il flash; e di nuovo a layout definitivo
  position();
  if (document.readyState === 'complete') setTimeout(position, 100);
  else window.addEventListener('load', () => setTimeout(position, 100));
})();

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

// ── Voce di menu attiva: al click e durante lo scroll ─────────────────────────
(function() {
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (!navLinks.length) return;

  function setActive(link) {
    navLinks.forEach(a => a.classList.toggle('active', a === link));
  }

  navLinks.forEach(a => a.addEventListener('click', () => setActive(a)));

  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function updateActive() {
    const pos = window.scrollY + window.innerHeight / 3;
    let current = sections[0];
    sections.forEach(sec => { if (sec.offsetTop <= pos) current = sec; });
    if (current) setActive(navLinks.find(a => a.getAttribute('href') === '#' + current.id));
  }

  function updateActiveFromHash() {
    if (window.location.hash) {
      const hashLink = navLinks.find(a => a.getAttribute('href') === window.location.hash);
      if (hashLink) setActive(hashLink);
    } else {
      updateActive();
    }
  }

  updateActiveFromHash();
  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('hashchange', updateActiveFromHash);
})();

// ── Salta introduzione: scroll diretto, senza animazione, per uscire subito dallo scroll-stage ──
const skipIntroBtn = document.querySelector('.skip-intro');
if (skipIntroBtn) {
  skipIntroBtn.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(skipIntroBtn.getAttribute('href'));
    if (t) window.scrollTo({ top: t.offsetTop - 90, behavior: 'auto' });
  });
}

// ── Carrello ──────────────────────────────────────────────────────────────────
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
  function addToCart(productId, qty) {
    cart[productId] = (cart[productId] || 0) + qty;
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

  // ── Selettore quantita' + Aggiungi al carrello (sezione Box) ──
  const boxQtyStepper = document.getElementById('boxQtyStepper');
  const boxQtyValueEl = document.getElementById('boxQtyValue');
  const addToCartBtn  = document.getElementById('addToCartBtn');
  let boxQty = 1;
  const BOX_QTY_MAX = 10;

  if (boxQtyStepper && boxQtyValueEl) {
    boxQtyStepper.addEventListener('click', e => {
      const btn = e.target.closest('[data-step]');
      if (!btn) return;
      boxQty = Math.min(BOX_QTY_MAX, Math.max(1, boxQty + Number(btn.dataset.step)));
      boxQtyValueEl.textContent = String(boxQty);
    });
  }
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(addToCartBtn.dataset.productId, boxQty);
      boxQty = 1;
      if (boxQtyValueEl) boxQtyValueEl.textContent = '1';
      navCart.classList.add('open');
      cartBtn.setAttribute('aria-expanded', 'true');
    });
  }

  // ── Apertura/chiusura dropdown ──
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

// ── Three.js — REAL ECLYSS CAN (importata da index.html: rotazione da scroll) ──
(function() {
  let canvas      = document.getElementById('can-canvas');
  const loadingEl = document.getElementById('loading-indicator');
  const stage     = document.getElementById('scroll-stage');
  if (!canvas || !stage) return;

  /* Senza WebGL (browser che rifiuta il contesto grafico) la lattina ruota
     comunque: 48 fotogrammi pre-renderizzati dalla stessa scena 3D (0-23
     sigillata, 24-47 rivelata, come lo swap a 180° del percorso WebGL),
     scelti in base allo stesso progresso di scroll che guida rotazione ed
     eclissi. Rigenerabili con render-frames.html (utensile interno). */
  const FALLBACK_FRAMES = 48;
  const fallbackFrameSrc = (i) => 'assets/can-frames/frame-' + String(i).padStart(2, '0') + '.webp';
  function showStaticFallback() {
    const img = document.createElement('img');
    img.src = fallbackFrameSrc(0);
    img.alt = 'Lattina ECLYSS — Il Respiro Originario';
    img.style.cssText = 'display:block;width:min(340px,72vw);aspect-ratio:480/700;height:auto;touch-action:pan-y;';
    img.draggable = false;
    canvas.style.display = 'none';
    canvas.parentElement.appendChild(img);
    if (loadingEl) loadingEl.style.display = 'none';

    // fotogramma mostrato = base dallo scroll + giro manuale col dito
    let fbBase = 0, fbOffset = 0, fbRevealed = false;
    const FB_SWAP = FALLBACK_FRAMES / 2; // dal 24 in poi la lattina è rivelata
    function applyFallbackFrame() {
      let i = ((fbBase + fbOffset) % FALLBACK_FRAMES + FALLBACK_FRAMES) % FALLBACK_FRAMES;
      // Rivelazione irreversibile, come nel percorso 3D: una volta vista la
      // creatura non si torna ai fotogrammi sigillati (si resta almeno a 180°).
      if (i >= FB_SWAP) fbRevealed = true;
      else if (fbRevealed) i = FB_SWAP;
      img.src = fallbackFrameSrc(i);
    }
    let fbDragging = false, fbLastX = 0, fbAccum = 0;
    let fbRotationCompleted = false; // drag col dito solo dopo il giro completo da scroll
    const FB_PX_PER_FRAME = 9; // pixel di trascinamento per passare al fotogramma dopo
    img.addEventListener('pointerdown', (e) => {
      if (!fbRotationCompleted) return; // prima si completa il giro con lo scroll
      fbDragging = true; fbLastX = e.clientX;
      img.style.cursor = 'grabbing';
      try { img.setPointerCapture(e.pointerId); } catch (err) {}
    });
    img.addEventListener('pointermove', (e) => {
      if (!fbDragging) return;
      fbAccum += e.clientX - fbLastX;
      fbLastX = e.clientX;
      const step = Math.trunc(fbAccum / FB_PX_PER_FRAME);
      if (step !== 0) {
        fbAccum -= step * FB_PX_PER_FRAME;
        fbOffset += step;
        applyFallbackFrame();
      }
    });
    ['pointerup', 'pointercancel'].forEach(ev =>
      img.addEventListener(ev, () => {
        fbDragging = false;
        if (fbRotationCompleted) img.style.cursor = 'grab';
      }));

    // precarica tutti i fotogrammi: lo scroll non deve mai aspettare la rete
    const frameCache = [];
    for (let i = 0; i < FALLBACK_FRAMES; i++) {
      const im = new Image();
      im.src = fallbackFrameSrc(i);
      frameCache.push(im);
    }

    /* L'eclissi è CSS puro e vive anche senza 3D: senza questo listener --ecl
       resterebbe a 0 e sole/luna non entrerebbero mai (il percorso 3D, che
       normalmente aggiorna --ecl, qui non parte affatto). */
    const ringFb  = document.getElementById('ring-fg');
    const hintFb  = document.querySelector('.scroll-hint');
    const CIRC_FB = 2 * Math.PI * 20;
    function onScrollLite() {
      const rect = stage.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -rect.top / (stage.offsetHeight - window.innerHeight)));
      // Dopo il primo giro completo lo scroll non guida più i fotogrammi:
      // la base resta a fine giro e comanda solo il dito (fbOffset).
      if (isFinite(p) && !fbRotationCompleted) {
        fbBase = Math.min(FALLBACK_FRAMES - 1, Math.round(p * (FALLBACK_FRAMES - 1)));
        applyFallbackFrame();
      }
      if (p >= 0.995 && !fbRotationCompleted) {
        fbRotationCompleted = true;   // da qui comanda il trascinamento
        img.style.cursor = 'grab';
      }
      // come nel percorso 3D: reversibile finché non si completa, poi bloccata
      document.documentElement.style.setProperty('--ecl',
        fbRotationCompleted ? '1.0000' : (isFinite(p) ? p : 0).toFixed(4));
      if (ringFb) {
        ringFb.style.strokeDasharray  = CIRC_FB;
        ringFb.style.strokeDashoffset = CIRC_FB * (1 - p);
      }
      if (hintFb) hintFb.style.opacity = p > 0.04 ? 0 : 1;
    }
    window.addEventListener('scroll', onScrollLite, { passive: true });
    onScrollLite();
  }

  if (typeof THREE === 'undefined') { showStaticFallback(); return; }

  const W = 480, H = 700;
  // Cap del pixel ratio: oltre 2 il guadagno visivo e' nullo ma il costo GPU
  // quadruplica — sui telefoni (DPR 3+) era la causa principale dei blocchi.
  const isSmallScreen = matchMedia('(max-width: 900px)').matches;
  const pixelRatio = Math.min(devicePixelRatio, isSmallScreen ? 1.6 : 2);
  canvas.width  = W * pixelRatio;
  canvas.height = H * pixelRatio;
  // dimensioni a schermo proporzionate (mai schiacciate, mai tagliate dal riquadro hero,
  // e mai piu' larghe del viewport: su mobile la larghezza disponibile e' il vincolo)
  function applyCanvasDisplaySize() {
    // clientWidth/clientHeight riflettono la larghezza reale del layout CSS;
    // window.innerWidth puo' non coincidere (zoom/DPR) e far sbordare il canvas.
    const viewportW = document.documentElement.clientWidth;
    const viewportH = document.documentElement.clientHeight;

    // spazio verticale riservato a nav (72px) + scroll hint sotto la lattina
    const reserved = 210;
    const available = viewportH - reserved;
    const dispH = Math.max(320, Math.min(H, available));
    let dispW = Math.round(dispH * (W / H));

    const maxW = viewportW <= 900
      ? viewportW - 48   // hero-content passa sopra: la lattina resta centrata su una colonna
      : viewportW * 0.55; // due colonne affiancate: la lattina occupa la sua meta'
    if (dispW > maxW) {
      dispW = Math.round(maxW);
      canvas.style.height = Math.round(dispW * (H / W)) + 'px';
      canvas.style.width  = dispW + 'px';
      return;
    }

    canvas.style.width  = dispW + 'px';
    canvas.style.height = dispH + 'px';
  }
  applyCanvasDisplaySize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyCanvasDisplaySize, 120);
  });

  /* WebGL a volte fallisce solo in certe configurazioni (es. WebGL2 bloccato
     dai driver ma WebGL1 funzionante): si riprova con opzioni via via più
     prudenti, su un canvas nuovo a ogni tentativo — un tentativo fallito può
     "avvelenare" il canvas per quelli successivi. Solo se falliscono tutti
     si ripiega sulla foto statica. */
  const rendererAttempts = [
    (cv) => new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false }), // No antialias: risparmia GPU
    (cv) => new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false, powerPreference: 'low-power' }),
    (cv) => { // ultima spiaggia: contesto WebGL1 esplicito (salta del tutto WebGL2)
      const ctx = cv.getContext('webgl', { alpha: true }) || cv.getContext('experimental-webgl', { alpha: true });
      if (!ctx) throw new Error('nessun contesto WebGL1 disponibile');
      return new THREE.WebGLRenderer({ canvas: cv, context: ctx, alpha: true, antialias: false });
    },
  ];
  let renderer = null;
  // ?nowebgl nell'URL: simula un PC senza WebGL per collaudare il fallback foto
  if (new URLSearchParams(location.search).has('nowebgl')) rendererAttempts.length = 0;
  for (const makeRenderer of rendererAttempts) {
    try {
      renderer = makeRenderer(canvas);
      break;
    } catch (e) {
      console.warn('Tentativo WebGL fallito, riprovo con opzioni più prudenti:', e);
      const fresh = canvas.cloneNode(false);
      canvas.parentElement.replaceChild(fresh, canvas);
      canvas = fresh;
    }
  }
  if (!renderer) {
    console.error('WebGL non disponibile con nessuna configurazione, mostro la foto statica');
    showStaticFallback();
    return;
  }

  /* Su macchine con driver instabili il browser può PERDERE il contesto WebGL
     a metà sessione: il canvas resta vuoto e la lattina "scompare". In quel
     caso si passa ai fotogrammi pre-renderizzati, senza buchi visivi. */
  let contextLost = false;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (contextLost) return;
    contextLost = true;
    console.warn('Contesto WebGL perso: passo ai fotogrammi pre-renderizzati');
    showStaticFallback();
  }, false);
  renderer.setPixelRatio(pixelRatio);
  // false: la dimensione a schermo resta quella di applyCanvasDisplaySize (setSize altrimenti la sovrascrive)
  renderer.setSize(W, H, false);
  applyCanvasDisplaySize();
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  camera.position.set(0, 0.9, 7.3);

  /* ── ILLUMINAZIONE — HDRI reale di uno studio fotografico (Poly Haven, CC0).
     Niente luci finte né pannelli procedurali: la lattina riflette un vero set
     con softbox, come in uno scatto still-life professionale. ── */
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Rotazione dello studio attorno alla lattina (radianti, asse Y):
  // cambia da dove arriva la luce principale senza toccare i modelli.
  const ENV_ROTATION_Y = Math.PI / 2;

  new THREE.RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .load(
      'assets/brown_photostudio_02_1k.hdr',
      (hdr) => {
        // l'HDR viene proiettato su una sfera ruotata e da lì si genera l'environment:
        // è il modo per orientare la luce, dato che r128 non ruota le equirect direttamente
        const envScene = new THREE.Scene();
        // Ridotto a 3x1: è solo per l'illuminazione, non visibile all'utente.
        // Minimizza il carico GPU mantenendo l'effetto di illuminazione globale.
        const geo = new THREE.SphereGeometry(50, 3, 1);
        geo.scale(-1, 1, 1); // vista dall'interno senza specchiare l'immagine
        const mat = new THREE.MeshBasicMaterial({ map: hdr });
        mat.toneMapped = false;
        const sphere = new THREE.Mesh(geo, mat);
        sphere.rotation.y = ENV_ROTATION_Y;
        envScene.add(sphere);
        const envRT = pmrem.fromScene(envScene, 0);
        hdr.dispose();
        pmrem.dispose();
        scene.environment = envRT.texture;
      },
      undefined,
      (e) => { console.error('HDRI studio non caricato:', e); }
    );

  /* ── LOAD CAN MODELS (sigillata + varianti rivelate) ── */
  const canGroup = new THREE.Group();
  scene.add(canGroup);

  // Un solo disegno di lattina sigillata (mistero), condiviso; alla rivelazione mostra la
  // creatura scelta dai numeri laterali (colibrì o serpente).
  const COVERED_URL = 'assets/eclyss-can2.glb';
  const REVEALED_URLS = ['assets/eclyss-can2-v2.glb', 'assets/eclyss-can2-v3.glb'];
  let coveredRoot = null;
  const revealedRoots = new Array(REVEALED_URLS.length).fill(null);
  let activeRevealed = 0;
  let modelsLoaded = 0;
  const TOTAL_MODELS = 1; // Solo il covered: i revealed caricano lazy
  let modelLoaded  = false;
  let modelSwapped = false;
  let revealedModelsLoading = false; // Lazy load i modelli rivelati al primo interagire

  function onModelReady() {
    modelsLoaded++;
    if (modelsLoaded === TOTAL_MODELS) {
      modelLoaded = true;
      loadingEl.style.opacity = 0;
      setTimeout(() => loadingEl.style.display = 'none', 400);
    }
  }

  // Sceglie quale creatura rivelare (click sui numeri laterali). Se la lattina è già rivelata,
  // cambia subito la creatura visibile mantenendo la rotazione corrente di canGroup; se è ancora
  // sigillata, memorizza solo la scelta e si vedrà al momento della rivelazione.
  function setRevealedVariant(index) {
    if (index === activeRevealed || !revealedRoots[index]) return;
    if (modelSwapped) {
      if (revealedRoots[activeRevealed]) revealedRoots[activeRevealed].visible = false;
      activeRevealed = index;
      revealedRoots[activeRevealed].visible = true;
    } else {
      activeRevealed = index;
    }
  }

  function prepareModel(gltf) {
    const root = gltf.scene;

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center);

    const targetHeight = 3.5;
    const scaleFactor = targetHeight / size.y;
    root.scale.setScalar(scaleFactor);
    root.position.y -= 0.45;

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    root.traverse((node) => {
      if (node.isMesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((m) => {
          // filtro anisotropico al massimo: mantiene nitida la grafica sulla superficie curva
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach((slot) => {
            const tex = m[slot];
            if (tex) {
              tex.anisotropy = maxAniso;
              tex.needsUpdate = true;
            }
          });
          // La transmission su r128 rende l'etichetta semitrasparente in modo irreale: via.
          if (m.transmission !== undefined && m.transmission > 0) m.transmission = 0;
          if (m.name === 'label') {
            // vernice lucida sopra la stampa, come una vera lattina litografata
            if (m.clearcoat !== undefined) {
              m.clearcoat = 1.0;
              m.clearcoatRoughness = 0.18;
            }
          }
          // scene.environment si applica da solo a tutti i materiali PBR;
          // qui si dosa soltanto: il metallo nudo vive di riflessi,
          // l'etichetta stampata riflette meno per non slavare la grafica
          if (m.name === 'label') {
            // stampa su alluminio: metallo pieno sotto l'inchiostro, riflessi più a specchio
            m.metalness = 1.0;
            if (m.roughness !== undefined) m.roughness = Math.min(m.roughness, 0.22);
            m.envMapIntensity = 1.3;
          } else {
            if (m.roughness !== undefined) m.roughness = Math.min(m.roughness * 0.75, 0.3);
            m.envMapIntensity = 2.2;
          }
          m.needsUpdate = true;
        });
      }
    });

    return root;
  }

  const loader = new THREE.GLTFLoader();

  // Lattina sigillata — visibile all'avvio.
  loader.load(
    COVERED_URL,
    (gltf) => {
      coveredRoot = prepareModel(gltf);
      canGroup.add(coveredRoot);
      coveredRoot.visible = true;
      onModelReady();
    },
    undefined,
    (error) => {
      console.error('Errore caricamento modello (covered):', error);
      loadingEl.innerHTML = '<span style="color:#ff6b6b">Errore caricamento modello</span>';
    }
  );

  // Varianti rivelate — caricate lazy al primo interagire (click/rotazione)
  function loadRevealedModels() {
    if (revealedModelsLoading || revealedRoots[0] !== null) return; // Già caricate o in progress
    revealedModelsLoading = true;
    REVEALED_URLS.forEach((url, i) => {
      loader.load(
        url,
        (gltf) => {
          const root = prepareModel(gltf);
          canGroup.add(root);
          root.visible = false;
          revealedRoots[i] = root;
        },
        undefined,
        (error) => {
          console.error('Errore caricamento modello (revealed ' + i + '):', error);
        }
      );
    });
  }

  canGroup.rotation.x = 0.05; // slight Apple-style tilt

  /* ── NUMERI LATERALI → cambia disegno della lattina sigillata + tono dell'eclissi ── */
  const canVariantPicker = document.getElementById('canVariantPicker');
  const eclipseRing = document.querySelector('.eclipse-center-ring');
  if (canVariantPicker) {
    canVariantPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-covered]');
      if (!btn) return;
      loadRevealedModels(); // Lazy load i modelli al primo click
      setRevealedVariant(Number(btn.dataset.covered));
      canVariantPicker.querySelectorAll('[data-covered]').forEach(el => el.classList.toggle('active', el === btn));
      if (eclipseRing && btn.dataset.eclipse) {
        eclipseRing.classList.remove('eclipse-light', 'eclipse-dark');
        eclipseRing.classList.add('eclipse-' + btn.dataset.eclipse);
      }
    });
  }

  /* ── SCROLL → ROTATION ── */
  const ringFg  = document.getElementById('ring-fg');
  const hint    = document.querySelector('.scroll-hint');
  const CIRCUMF = 2 * Math.PI * 20;
  const TOTAL   = 360; // degrees
  const SWAP_DEG = 180; // swap covered -> revealed at this rotation angle
  const SWAP_PROGRESS = SWAP_DEG / TOTAL; // 0.5
  let targetRotY  = 0;
  let currentRotY = 0;

  /* Rotazione trascinando (dito o cursore): si attiva SOLO a rotazione da
     scroll completata. Da quel momento lo scroll non ruota più la lattina
     (vedi onScroll) e il comando passa interamente al trascinamento.
     touch-action:pan-y lascia libero lo scroll verticale della pagina. */
  let dragRotY = 0;
  let dragging = false, dragLastX = 0;
  let rotationCompleted = false; // diventa true al primo giro completo da scroll
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => {
    if (!rotationCompleted) return; // prima si completa il giro con lo scroll
    dragging = true; dragLastX = e.clientX;
    canvas.style.cursor = 'grabbing';
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragRotY += (e.clientX - dragLastX) * 0.012;
    dragLastX = e.clientX;
    loadRevealedModels(); // chi trascina può superare i 180°: varianti pronte
  });
  ['pointerup', 'pointercancel'].forEach(ev =>
    canvas.addEventListener(ev, () => {
      dragging = false;
      if (rotationCompleted) canvas.style.cursor = 'grab';
    }));

  function onScroll() {
    const rect = stage.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -rect.top / (stage.offsetHeight - window.innerHeight)));
    // Dopo il primo giro completo lo scroll non guida più la rotazione:
    // resta ferma a fine giro e comanda solo il dito (dragRotY).
    if (!rotationCompleted) targetRotY = (p * TOTAL * Math.PI) / 180;
    if (p >= 0.995 && !rotationCompleted) {
      rotationCompleted = true;      // da qui comanda il trascinamento
      canvas.style.cursor = 'grab';  // su desktop si vede che è afferrabile
    }

    // Eclissi: sole (da sx) e luna (da dx) scivolano al centro e tornano
    // indietro risalendo, MA una volta completa resta completa (come la
    // rotazione, che si completa nello stesso istante). Guardia anti-NaN.
    document.documentElement.style.setProperty('--ecl',
      rotationCompleted ? '1.0000' : (isFinite(p) ? p : 0).toFixed(4));

    if (ringFg) {
      ringFg.style.strokeDasharray  = CIRCUMF;
      ringFg.style.strokeDashoffset = CIRCUMF * (1 - p);
    }
    if (hint) hint.style.opacity = p > 0.04 ? 0 : 1;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── ANIMATE LOOP ── */
  const SWAP_RAD = (SWAP_PROGRESS * TOTAL * Math.PI) / 180; // soglia in radianti, sulla rotazione realmente renderizzata

  // Renderizza solo quando il canvas e' davvero in vista e la tab e' attiva:
  // fuori dall'hero la GPU resta libera per il resto della pagina.
  let canvasInView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      canvasInView = entries[0].isIntersecting;
    }).observe(canvas);
  }

  // Frame throttling: renderizza 1 frame ogni 2 (60 FPS → 30 FPS).
  // Riduce il carico GPU mantenendo l'animazione fluida visivamente.
  let frameCount = 0;

  function animate() {
    if (contextLost) return; // il fallback a fotogrammi ha preso il posto del 3D
    requestAnimationFrame(animate);
    if (!canvasInView || document.hidden) return;
    frameCount++;
    if (frameCount % 2 !== 0) return; // Salta 1 frame ogni 2

    currentRotY += (targetRotY + dragRotY - currentRotY) * 0.18;
    canGroup.rotation.y = currentRotY;

    // Lazy load i modelli rivelati quando la rotazione si avvicina (50° prima dello swap)
    if (!revealedModelsLoading && revealedRoots[0] === null && currentRotY >= (SWAP_RAD * 0.5)) {
      loadRevealedModels();
    }

    // Swap covered -> revealed (creatura scelta) sincronizzato con la rotazione visibile,
    // non con lo scroll grezzo: così non "salta" mai anche scorrendo molto in fretta.
    // Rivelazione irreversibile: come nel "peel to reveal" reale, una volta
    // strappato il sigillo la creatura resta visibile anche riscendendo
    // sotto i 180° (niente ramo di ritorno a modelSwapped=false).
    const revealedRoot = revealedRoots[activeRevealed];
    if (!modelSwapped && currentRotY >= SWAP_RAD && coveredRoot && revealedRoot) {
      modelSwapped = true;
      coveredRoot.visible = false;
      revealedRoot.visible = true;
    }

    if (modelLoaded) {
      canGroup.position.y = Math.sin(Date.now() * 0.0008) * 0.06;
    }

    renderer.render(scene, camera);
  }
  animate();
})();




/*
PANTE

    :~-._                                                 _.-~:
    : :.~^o._        ________---------________        _.o^~.:.:
     : ::.`?88booo~~~.::::::::...::::::::::::..~~oood88P'.::.:
     :  ::: `?88P .:::....         ........:::::. ?88P' :::. :
      :  :::. `? .::.            . ...........:::. P' .:::. :
       :  :::   ... ..  ...       .. .::::......::.   :::. :
       `  :' .... ..  .:::::.     . ..:::::::....:::.  `: .'
        :..    ____:::::::::.  . . ....:::::::::____  ... :
       :... `:~    ^~-:::::..  .........:::::-~^    ~::.::::
       `.::. `\   (8)  \b:::..::.:.:::::::d/  (8)   /'.::::'
        ::::.  ~-._v    |b.::::::::::::::d|    v_.-~..:::::
        `.:::::... ~~^?888b..:::::::::::d888P^~...::::::::'
         `.::::::::::....~~~ .:::::::::~~~:::::::::::::::'
          `..:::::::::::   .   ....::::    ::::::::::::,'
            `. .:::::::    .      .::::.    ::::::::'.'
              `._ .:::    .        :::::.    :::::_.'
                 `-. :    .        :::::      :,-'
                    :.   :___     .:::___   .::
          ..--~~~~--:+::. ~~^?b..:::dP^~~.::++:--~~~~--..
            ___....--`+:::.    `~8~'    .:::+'--....___
          ~~   __..---`_=:: ___gd8bg___ :==_'---..__   ~~
           -~~~  _.--~~`-.~~~~~~~~~~~~~~~,-' ~~--._ ~~~-
              -~~            ~~~~~~~~~   _ Seal _  ~~-


*/