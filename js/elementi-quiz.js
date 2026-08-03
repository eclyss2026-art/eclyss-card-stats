/* ============================================================
   ECLYSS — Test "Scopri il tuo Elemento"
   Domande, risposte e responsi presi dal foglio "Test Eclyss"
   del database CARTE ECLYSS_calcolo.xlsx.
   Una domanda alla volta, con barra di avanzamento e responso
   finale (elemento dominante + affinità con gli altri tre).
   ============================================================ */
(function () {
  var box = document.getElementById('eltestBox');
  if (!box) return;

  // Ordine fisso: determina anche l'ordine delle barre di affinità
  var ELEMENTI = {
    silenzio: {
      nome: 'Silenzio', colore: '#7EC8FF', icona: 'assets/TEMPO 2.png',
      testo: 'Sei guidato dal Silenzio. La tua forza nasce dalla lucidità, dall’empatia e dall’equilibrio. Preferisci comprendere prima di agire e trovi potere dove gli altri vedono solo calma.',
      poteri: ['Intuito', 'Protezione', 'Empatia', 'Quiete', 'Guarigione', 'Conoscenza']
    },
    tempo: {
      nome: 'Tempo', colore: '#F5B942', icona: 'assets/SILENZIO 3.png',
      testo: 'Sei guidato dal Tempo. Guardi sempre oltre il presente. Crescita, trasformazione e perseveranza sono il cuore della tua essenza.',
      poteri: ['Rigenerazione', 'Resilienza', 'Coraggio', 'Evoluzione', 'Memoria']
    },
    caos: {
      nome: 'Caos', colore: '#FF3B1F', icona: 'assets/CAOS.png',
      testo: 'Sei guidato dal Caos. Rompi gli schemi, trasformi ciò che tocchi e trovi opportunità dove gli altri vedono ostacoli.',
      poteri: ['Distorsione', 'Imprevedibilità', 'Astuzia', 'Illusione']
    },
    ombra: {
      nome: 'Ombra', colore: '#A855F7', icona: 'assets/OMBRA 3.png',
      testo: 'Sei guidato dall’Ombra. Vedi ciò che rimane nascosto. Comprendi i segreti delle persone e sai muoverti dove gli altri esitano.',
      poteri: ['Inganno', 'Dissolvenza', 'Illusione', 'Conoscenza']
    }
  };
  var ORDINE = ['silenzio', 'tempo', 'caos', 'ombra'];

  // Ogni domanda: le 4 risposte sono sempre nell'ordine Silenzio, Tempo, Caos, Ombra
  var DOMANDE = [
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
  ];

  var LETTERE = ['A', 'B', 'C', 'D'];
  var risposte = [];  // indice della risposta scelta per ogni domanda
  var corrente = 0;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderDomanda() {
    var d = DOMANDE[corrente];
    var html =
      '<div class="eltest-progress">' +
        '<div class="eltest-progress-top">' +
          '<span class="eltest-step">Domanda ' + (corrente + 1) + '</span>' +
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
        '<button type="button" class="eltest-back"' + (corrente === 0 ? ' hidden' : '') + '>&larr; Indietro</button>' +
        '<span class="eltest-hint">Segui l’istinto</span>' +
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
        if (corrente >= DOMANDE.length) renderRisultato();
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
    var punti = { silenzio: 0, tempo: 0, caos: 0, ombra: 0 };
    for (var i = 0; i < risposte.length; i++) punti[ORDINE[risposte[i]]]++;

    // Vince il punteggio più alto; a parità prevale l'ordine Silenzio > Tempo > Caos > Ombra
    var vincitore = ORDINE[0];
    for (var j = 1; j < ORDINE.length; j++) {
      if (punti[ORDINE[j]] > punti[vincitore]) vincitore = ORDINE[j];
    }
    var el = ELEMENTI[vincitore];

    var html =
      '<div class="eltest-result" style="--c:' + el.colore + '">' +
        '<div class="eltest-result-icon"><img src="' + el.icona + '" alt="Sigillo ' + esc(el.nome) + '"></div>' +
        '<div class="eltest-result-label">Il tuo Elemento è</div>' +
        '<div class="eltest-result-name">' + esc(el.nome) + '</div>' +
        '<p class="eltest-result-text">' + esc(el.testo) + '</p>' +
        '<div class="eltest-powers-label">Poteri compatibili</div>' +
        '<div class="eltest-powers">';
    for (var p = 0; p < el.poteri.length; p++) {
      html += '<span class="eltest-power">' + esc(el.poteri[p]) + '</span>';
    }
    html += '</div><div class="eltest-scores">';
    for (var s = 0; s < ORDINE.length; s++) {
      var k = ORDINE[s], perc = Math.round(punti[k] / DOMANDE.length * 100);
      html +=
        '<div class="eltest-score" style="--c:' + ELEMENTI[k].colore + '">' +
          '<span class="eltest-score-name">' + ELEMENTI[k].nome + '</span>' +
          '<span class="eltest-score-track"><span class="eltest-score-fill" data-w="' + perc + '"></span></span>' +
          '<span class="eltest-score-val">' + perc + '%</span>' +
        '</div>';
    }
    html += '</div>' +
        '<div class="eltest-actions">' +
          '<a href="index.html#box" class="eltest-restart is-primary">Scopri le Carte</a>' +
          '<button type="button" class="eltest-restart" id="eltestRestart">Rifai il test</button>' +
        '</div>' +
      '</div>';
    box.innerHTML = html;

    // Le barre crescono da zero dopo il primo frame
    var fills = box.querySelectorAll('.eltest-score-fill');
    setTimeout(function () {
      for (var f = 0; f < fills.length; f++) fills[f].style.width = fills[f].getAttribute('data-w') + '%';
    }, 30);

    document.getElementById('eltestRestart').addEventListener('click', function () {
      risposte = []; corrente = 0; renderDomanda(); scrollAlBox();
    });
  }

  renderDomanda();
})();
