/* ============================================================
   ECLYSS — Test "Scopri il tuo Elemento"
   Domande, risposte e responsi presi dal foglio "Test Eclyss"
   del database CARTE ECLYSS_calcolo.xlsx.
   Una domanda alla volta, con barra di avanzamento e responso
   finale (elemento dominante + affinità con gli altri tre).

   BILINGUE: il riquadro è marcato data-no-i18n (il motore i18n non
   può tradurre HTML che riscrive di continuo), quindi le stringhe
   IT/EN vivono qui e il testo si rigenera al cambio lingua
   mantenendo le risposte già date.
   ============================================================ */
(function () {
  var box = document.getElementById('eltestBox');
  if (!box) return;

  var LANG_KEY = 'eclyssLang';  // stessa chiave usata da js/i18n.js

  /* ── Contenuti ──────────────────────────────────────────────
     ORDINE fissa la corrispondenza risposta → elemento: in ogni
     domanda le quattro opzioni stanno sempre nell'ordine
     Silenzio, Tempo, Caos, Ombra (in entrambe le lingue). */
  var ORDINE = ['silenzio', 'tempo', 'caos', 'ombra'];

  var COLORI = { silenzio: '#7EC8FF', tempo: '#F5B942', caos: '#FF3B1F', ombra: '#A855F7' };
  var ICONE = {
    silenzio: 'assets/sigillo-silenzio.png',
    tempo: 'assets/sigillo-tempo.png',
    caos: 'assets/sigillo-caos.png',
    ombra: 'assets/sigillo-ombra.png'
  };

  var T = {
    it: {
      ui: {
        domanda: 'Domanda', indietro: '← Indietro', istinto: 'Segui l’istinto',
        tuoElemento: 'Il tuo Elemento è', poteri: 'Poteri compatibili',
        carte: 'Scopri le Carte', rifai: 'Rifai il test', sigillo: 'Sigillo'
      },
      elementi: {
        silenzio: {
          nome: 'Silenzio',
          testo: 'Sei guidato dal Silenzio. La tua forza nasce dalla lucidità, dall’empatia e dall’equilibrio. Preferisci comprendere prima di agire e trovi potere dove gli altri vedono solo calma.',
          poteri: ['Intuito', 'Protezione', 'Empatia', 'Quiete', 'Guarigione', 'Conoscenza']
        },
        tempo: {
          nome: 'Tempo',
          testo: 'Sei guidato dal Tempo. Guardi sempre oltre il presente. Crescita, trasformazione e perseveranza sono il cuore della tua essenza.',
          poteri: ['Rigenerazione', 'Resilienza', 'Coraggio', 'Evoluzione', 'Memoria']
        },
        caos: {
          nome: 'Caos',
          testo: 'Sei guidato dal Caos. Rompi gli schemi, trasformi ciò che tocchi e trovi opportunità dove gli altri vedono ostacoli.',
          poteri: ['Distorsione', 'Imprevedibilità', 'Astuzia', 'Illusione']
        },
        ombra: {
          nome: 'Ombra',
          testo: 'Sei guidato dall’Ombra. Vedi ciò che rimane nascosto. Comprendi i segreti delle persone e sai muoverti dove gli altri esitano.',
          poteri: ['Inganno', 'Dissolvenza', 'Illusione', 'Conoscenza']
        }
      },
      domande: [
        ['Quando devi prendere una decisione importante...', [
          'Rifletto a lungo prima di agire.',
          'Penso alle conseguenze future.',
          'Seguo l’istinto del momento.',
          'Valuto ciò che gli altri non stanno vedendo.']],
        ['Quale frase senti più tua?', [
          'La calma rivela la verità.',
          'Tutto cambia.',
          'Le regole esistono per essere riscritte.',
          'Ogni cosa nasconde qualcosa.']],
        ['Se possedessi un grande potere...', [
          'Lo userei per proteggere.',
          'Lo userei per migliorare il futuro.',
          'Lo userei per cambiare il mondo.',
          'Lo userei solo quando nessuno se lo aspetta.']],
        ['Cosa ti spaventa di più?', [
          'Perdere il controllo.',
          'Non avere abbastanza tempo.',
          'Vivere sempre allo stesso modo.',
          'Essere completamente compreso.']],
        ['Quando entri in una stanza...', [
          'Osservo.',
          'Analizzo.',
          'Esploro.',
          'Studio le persone.']],
        ['Il tuo punto di forza è...', [
          'La calma.',
          'La perseveranza.',
          'La creatività.',
          'L’intuito.']],
        ['Quale ambiente ti rappresenta?', [
          'Una foresta immersa nel silenzio.',
          'Un antico orologio che continua a muoversi.',
          'Una tempesta.',
          'Una città illuminata solo dalla luna.']],
        ['Quale potere sceglieresti?', [
          'Protezione',
          'Rigenerazione',
          'Distorsione',
          'Inganno']],
        ['Gli altri ti descrivono come...', [
          'Affidabile.',
          'Determinato.',
          'Imprevedibile.',
          'Misterioso.']],
        ['Quale frase ti rappresenta?', [
          '“La forza nasce dall’equilibrio.”',
          '“Ogni fine è un nuovo inizio.”',
          '“Ogni limite può essere superato.”',
          '“La verità è solo ciò che scegli di mostrare.”']]
      ]
    },

    en: {
      ui: {
        domanda: 'Question', indietro: '← Back', istinto: 'Follow your instinct',
        tuoElemento: 'Your Element is', poteri: 'Matching powers',
        carte: 'Discover the Cards', rifai: 'Take the test again', sigillo: 'Seal'
      },
      elementi: {
        silenzio: {
          nome: 'Silence',
          testo: 'You are guided by Silence. Your strength comes from clarity, empathy and balance. You would rather understand before acting, and you find power where others see only stillness.',
          poteri: ['Intuition', 'Protection', 'Empathy', 'Stillness', 'Healing', 'Knowledge']
        },
        tempo: {
          nome: 'Time',
          testo: 'You are guided by Time. You always look beyond the present. Growth, transformation and perseverance are the heart of your essence.',
          poteri: ['Regeneration', 'Resilience', 'Courage', 'Evolution', 'Memory']
        },
        caos: {
          nome: 'Chaos',
          testo: 'You are guided by Chaos. You break patterns, transform what you touch and find opportunity where others see obstacles.',
          poteri: ['Distortion', 'Unpredictability', 'Cunning', 'Illusion']
        },
        ombra: {
          nome: 'Shadow',
          testo: 'You are guided by Shadow. You see what stays hidden. You understand people’s secrets and know how to move where others hesitate.',
          poteri: ['Deception', 'Fading', 'Illusion', 'Knowledge']
        }
      },
      domande: [
        ['When you have an important decision to make...', [
          'I think it over for a long time before acting.',
          'I think about the consequences ahead.',
          'I follow the instinct of the moment.',
          'I weigh what everyone else is missing.']],
        ['Which sentence feels most like you?', [
          'Calm reveals the truth.',
          'Everything changes.',
          'Rules exist to be rewritten.',
          'Everything hides something.']],
        ['If you held great power...', [
          'I would use it to protect.',
          'I would use it to improve the future.',
          'I would use it to change the world.',
          'I would use it only when no one expects it.']],
        ['What frightens you most?', [
          'Losing control.',
          'Not having enough time.',
          'Always living the same way.',
          'Being completely understood.']],
        ['When you walk into a room...', [
          'I observe.',
          'I analyse.',
          'I explore.',
          'I study the people.']],
        ['Your strongest trait is...', [
          'Calm.',
          'Perseverance.',
          'Creativity.',
          'Intuition.']],
        ['Which place represents you?', [
          'A forest steeped in silence.',
          'An ancient clock that keeps on moving.',
          'A storm.',
          'A city lit only by the moon.']],
        ['Which power would you choose?', [
          'Protection',
          'Regeneration',
          'Distortion',
          'Deception']],
        ['Others describe you as...', [
          'Reliable.',
          'Determined.',
          'Unpredictable.',
          'Mysterious.']],
        ['Which sentence represents you?', [
          '“Strength is born from balance.”',
          '“Every ending is a new beginning.”',
          '“Every limit can be broken.”',
          '“Truth is only what you choose to show.”']]
      ]
    }
  };

  var LETTERE = ['A', 'B', 'C', 'D'];
  var risposte = [];        // indice della risposta scelta per ogni domanda
  var corrente = 0;
  var mostraRisultato = false;
  var lang = leggiLang();

  function leggiLang() {
    try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'it'; } catch (e) { return 'it'; }
  }
  function t() { return T[lang] || T.it; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render() {
    if (mostraRisultato) renderRisultato();
    else renderDomanda();
  }

  function renderDomanda() {
    var L = t(), DOMANDE = L.domande, d = DOMANDE[corrente];
    var html =
      '<div class="eltest-progress">' +
        '<div class="eltest-progress-top">' +
          '<span class="eltest-step">' + L.ui.domanda + ' ' + (corrente + 1) + '</span>' +
          '<span class="eltest-count">' + (corrente + 1) + ' / ' + DOMANDE.length + '</span>' +
        '</div>' +
        '<div class="eltest-bar"><div class="eltest-bar-fill" style="width:' +
          (corrente / DOMANDE.length * 100) + '%"></div></div>' +
      '</div>' +
      '<h3 class="eltest-q">' + esc(d[0]) + '</h3>' +
      '<div class="eltest-answers">';
    for (var i = 0; i < d[1].length; i++) {
      html += '<button type="button" class="eltest-ans" data-i="' + i + '">' +
        '<span class="eltest-ans-key">' + LETTERE[i] + '</span>' +
        '<span>' + esc(d[1][i]) + '</span></button>';
    }
    html += '</div>' +
      '<div class="eltest-nav">' +
        '<button type="button" class="eltest-back"' + (corrente === 0 ? ' hidden' : '') + '>' + L.ui.indietro + '</button>' +
        '<span class="eltest-hint">' + L.ui.istinto + '</span>' +
      '</div>';
    box.innerHTML = html;

    // La barra parte dal valore precedente e si anima al valore corrente.
    // setTimeout e non requestAnimationFrame: in una scheda in secondo piano
    // rAF resta sospeso e la barra rimarrebbe ferma al valore iniziale.
    var fill = box.querySelector('.eltest-bar-fill');
    setTimeout(function () {
      fill.style.width = ((corrente + 1) / DOMANDE.length * 100) + '%';
    }, 30);

    var btns = box.querySelectorAll('.eltest-ans');
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener('click', function () {
        risposte[corrente] = parseInt(this.getAttribute('data-i'), 10);
        corrente++;
        if (corrente >= DOMANDE.length) { mostraRisultato = true; renderRisultato(); }
        else renderDomanda();
        scrollAlBox();
      });
    }
    var back = box.querySelector('.eltest-back');
    if (back) back.addEventListener('click', function () {
      if (corrente > 0) { corrente--; renderDomanda(); scrollAlBox(); }
    });
  }

  // Riporta il riquadro in vista senza far saltare la pagina in cima
  function scrollAlBox() {
    var top = box.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * 0.5) {
      window.scrollTo({ top: window.scrollY + top - 120, behavior: 'smooth' });
    }
  }

  function renderRisultato() {
    var L = t(), ELEMENTI = L.elementi, tot = L.domande.length;
    var punti = { silenzio: 0, tempo: 0, caos: 0, ombra: 0 };
    for (var i = 0; i < risposte.length; i++) punti[ORDINE[risposte[i]]]++;

    // Vince il punteggio più alto; a parità prevale l'ordine Silenzio > Tempo > Caos > Ombra
    var vincitore = ORDINE[0];
    for (var j = 1; j < ORDINE.length; j++) {
      if (punti[ORDINE[j]] > punti[vincitore]) vincitore = ORDINE[j];
    }
    var el = ELEMENTI[vincitore];

    var html =
      '<div class="eltest-result" style="--c:' + COLORI[vincitore] + '">' +
        '<span class="eltest-result-icon el-sigillo"><img src="' + ICONE[vincitore] +
          '" alt="' + L.ui.sigillo + ' ' + esc(el.nome) + '"></span>' +
        '<div class="eltest-result-label">' + L.ui.tuoElemento + '</div>' +
        '<div class="eltest-result-name">' + esc(el.nome) + '</div>' +
        '<p class="eltest-result-text">' + esc(el.testo) + '</p>' +
        '<div class="eltest-powers-label">' + L.ui.poteri + '</div>' +
        '<div class="eltest-powers">';
    for (var p = 0; p < el.poteri.length; p++) {
      html += '<span class="eltest-power">' + esc(el.poteri[p]) + '</span>';
    }
    html += '</div><div class="eltest-scores">';
    for (var s = 0; s < ORDINE.length; s++) {
      var k = ORDINE[s], perc = Math.round(punti[k] / tot * 100);
      html +=
        '<div class="eltest-score" style="--c:' + COLORI[k] + '">' +
          '<span class="eltest-score-name">' + esc(ELEMENTI[k].nome) + '</span>' +
          '<span class="eltest-score-track"><span class="eltest-score-fill" data-w="' + perc + '"></span></span>' +
          '<span class="eltest-score-val">' + perc + '%</span>' +
        '</div>';
    }
    html += '</div>' +
        '<div class="eltest-actions">' +
          '<a href="index.html#box" class="eltest-restart is-primary">' + L.ui.carte + '</a>' +
          '<button type="button" class="eltest-restart" id="eltestRestart">' + L.ui.rifai + '</button>' +
        '</div>' +
      '</div>';
    box.innerHTML = html;

    // Le barre crescono da zero dopo il primo frame
    var fills = box.querySelectorAll('.eltest-score-fill');
    setTimeout(function () {
      for (var f = 0; f < fills.length; f++) fills[f].style.width = fills[f].getAttribute('data-w') + '%';
    }, 30);

    document.getElementById('eltestRestart').addEventListener('click', function () {
      risposte = []; corrente = 0; mostraRisultato = false; renderDomanda(); scrollAlBox();
    });
  }

  /* Cambio lingua: js/i18n.js scrive la nuova lingua in localStorage nel
     proprio handler di click. Questo script è caricato PRIMA, quindi il suo
     handler scatta per primo e leggerebbe ancora il valore vecchio: il
     controllo è rimandato di un giro di event loop. Le risposte già date
     restano, si rigenera solo il testo. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.lang-toggle')) return;
    setTimeout(function () {
      var nuova = leggiLang();
      if (nuova === lang) return;
      lang = nuova;
      render();
    }, 0);
  });

  render();
})();

/* ============================================================
   ECLYSS — Interazione della sezione "I Quattro Elementi"
   Nodi del diagramma e carte sono le due facce dello stesso
   elemento: selezionandone uno si accende anche l'altro e gli
   altri tre si spengono. Click di nuovo (o Esc) per uscire.
   ============================================================ */
(function () {
  var cards = document.querySelector('.el-cards');
  if (!cards) return;
  // Il diagramma è facoltativo: se la sezione mostra solo le carte, restano
  // comunque selezionabili invece di diventare inerti.
  var diagram = document.querySelector('.el-diagram');

  var nodi = diagram ? diagram.querySelectorAll('.el-node[data-el]') : [];
  var carte = cards.querySelectorAll('.el-card[data-el]');
  var attivo = null;

  function perOgni(lista, fn) { for (var i = 0; i < lista.length; i++) fn(lista[i]); }

  function attiva(el) {
    attivo = el;
    perOgni(nodi, function (n) { n.classList.toggle('is-active', n.getAttribute('data-el') === el); });
    perOgni(carte, function (c) { c.classList.toggle('is-active', c.getAttribute('data-el') === el); });
    if (diagram) diagram.classList.toggle('has-active', !!el);
    cards.classList.toggle('has-active', !!el);
    perOgni(nodi, function (n) {
      n.setAttribute('aria-pressed', n.getAttribute('data-el') === el ? 'true' : 'false');
    });
  }

  function scegli(el, portaInVista) {
    if (attivo === el) { attiva(null); return; }
    attiva(el);
    if (!portaInVista) return;
    // Su telefono le carte stanno una sotto l'altra, lontane dal diagramma:
    // senza questo salto il tocco sul nodo sembrerebbe non fare nulla.
    var carta = cards.querySelector('.el-card[data-el="' + el + '"]');
    if (!carta) return;
    var r = carta.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight) {
      window.scrollTo({ top: window.scrollY + r.top - 110, behavior: 'smooth' });
    }
  }

  perOgni(nodi, function (n) {
    n.setAttribute('aria-pressed', 'false');
    n.addEventListener('click', function () { scegli(n.getAttribute('data-el'), true); });
  });
  perOgni(carte, function (c) {
    c.addEventListener('click', function () { scegli(c.getAttribute('data-el'), false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && attivo) attiva(null);
  });
})();
