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
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
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
  const PRODUCTS = {
    'eclyss-box': { id: 'eclyss-box', name: 'ECLYSS Box', meta: '4 lattine + carte', price: 9.96, image: 'assets/logo-magenta.png' }
  };

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
  const canvas    = document.getElementById('can-canvas');
  const loadingEl = document.getElementById('loading-indicator');
  const stage     = document.getElementById('scroll-stage');
  if (!canvas || !stage || typeof THREE === 'undefined') return;

  const W = 480, H = 700;
  const pixelRatio = Math.min(devicePixelRatio, 3.5);
  canvas.width  = W * pixelRatio;
  canvas.height = H * pixelRatio;
  // dimensioni a schermo proporzionate (mai schiacciate, mai tagliate dal riquadro hero)
  function applyCanvasDisplaySize() {
    // spazio verticale riservato a nav (72px) + scroll hint sotto la lattina
    const reserved = 210;
    const available = window.innerHeight - reserved;
    const dispH = Math.max(320, Math.min(H, available));
    const dispW = Math.round(dispH * (W / H));
    canvas.style.width  = dispW + 'px';
    canvas.style.height = dispH + 'px';
  }
  applyCanvasDisplaySize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyCanvasDisplaySize, 120);
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    console.error('WebGL non disponibile:', e);
    if (loadingEl) loadingEl.innerHTML = '<span style="color:#ff6b6b">WebGL non disponibile</span>';
    return;
  }
  renderer.setPixelRatio(pixelRatio);
  // false: la dimensione a schermo resta quella di applyCanvasDisplaySize (setSize altrimenti la sovrascrive)
  renderer.setSize(W, H, false);
  applyCanvasDisplaySize();
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

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
        const geo = new THREE.SphereGeometry(50, 64, 32);
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
  const TOTAL_MODELS = REVEALED_URLS.length + 1;
  let modelLoaded  = false;
  let modelSwapped = false;

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

  // Varianti rivelate — nascoste finché non scatta lo swap allo scroll.
  REVEALED_URLS.forEach((url, i) => {
    loader.load(
      url,
      (gltf) => {
        const root = prepareModel(gltf);
        canGroup.add(root);
        root.visible = false;
        revealedRoots[i] = root;
        onModelReady();
      },
      undefined,
      (error) => {
        console.error('Errore caricamento modello (revealed ' + i + '):', error);
        loadingEl.innerHTML = '<span style="color:#ff6b6b">Errore caricamento modello</span>';
      }
    );
  });

  canGroup.rotation.x = 0.05; // slight Apple-style tilt

  /* ── NUMERI LATERALI → cambia disegno della lattina sigillata + tono dell'eclissi ── */
  const canVariantPicker = document.getElementById('canVariantPicker');
  const eclipseRing = document.querySelector('.eclipse-center-ring');
  if (canVariantPicker) {
    canVariantPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-covered]');
      if (!btn) return;
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

  function onScroll() {
    const rect = stage.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -rect.top / (stage.offsetHeight - window.innerHeight)));
    targetRotY = (p * TOTAL * Math.PI) / 180;

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
  function animate() {
    requestAnimationFrame(animate);

    currentRotY += (targetRotY - currentRotY) * 0.18;
    canGroup.rotation.y = currentRotY;

    // Swap covered -> revealed (creatura scelta) sincronizzato con la rotazione visibile,
    // non con lo scroll grezzo: così non "salta" mai anche scorrendo molto in fretta.
    const revealedRoot = revealedRoots[activeRevealed];
    if (!modelSwapped && currentRotY >= SWAP_RAD && coveredRoot && revealedRoot) {
      modelSwapped = true;
      coveredRoot.visible = false;
      revealedRoot.visible = true;
    } else if (modelSwapped && currentRotY < SWAP_RAD && coveredRoot && revealedRoot) {
      modelSwapped = false;
      coveredRoot.visible = true;
      revealedRoot.visible = false;
    }

    if (modelLoaded) {
      canGroup.position.y = Math.sin(Date.now() * 0.0008) * 0.06;
    }

    renderer.render(scene, camera);
  }
  animate();
})();
