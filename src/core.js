/* Automatismes · feuilles imprimables — cœur : catalogue unifié, normalisation des questions, tirage.
   Fonctionne dans la page et sous Node (tests). Licence CC BY-NC 4.0 — Tom Rougeaud.
   Banques de questions de l’auteur (moteur et générateurs inchangés). */
var AUTO = (function () {
  'use strict';
  var FE = null, MC = null, KX = null;

  /* ───────── utilitaires ───────── */
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(r, arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function plain(h) { return String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ───────── texte avec formules $…$ (KaTeX) ───────── */
  var RT = {};
  function rtRaw(s, allowTags) {
    s = String(s === undefined || s === null ? '' : s);
    var key = (allowTags ? 'T|' : 'P|') + s;
    if (RT[key] !== undefined) return RT[key];
    var parts = s.split('$'), out = '';
    function txt(t) {
      var e = esc(t);
      if (allowTags) e = e.replace(/&lt;(\/?)(sub|sup|b|i|strong|em|br)\s*\/?&gt;/g, function (m, c, t2) { return t2 === 'br' ? '<br>' : '<' + c + t2 + '>'; });
      return e.replace(/\n/g, '<br>');
    }
    if (parts.length % 2 === 0) { out = txt(s); }
    else for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 0) out += txt(parts[i]);
      else {
        var html = null;
        try { if (KX) html = KX.renderToString(parts[i].replace(/(\d),(\d)/g, '$1{,}$2'), { throwOnError: false, strict: 'ignore', trust: false, output: 'html' }); } catch (e) { html = null; }
        out += html || ('<span class="tex">' + esc(parts[i]) + '</span>');
      }
    }
    RT[key] = out; return out;
  }
  function rt(s) { return rtRaw(s, false); }
  function rtUser(s) { return rtRaw(s, true); }

  /* texte lisible (sans HTML ni LaTeX) à partir d’un énoncé source : aperçus et corrigé */
  function plainSrc(s) {
    s = String(s === undefined || s === null ? '' : s);
    s = s.replace(/<[^>]+>/g, '');
    return s.replace(/\$([^$]*)\$/g, function (m, t) {
      for (var i = 0; i < 3; i++) t = t.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
      return t.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\approx/g, '≈').replace(/\\neq/g, '≠').replace(/\\leq?/g, '≤').replace(/\\geq?/g, '≥')
        .replace(/\\pi/g, 'π').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)').replace(/\\[,;! ]/g, ' ').replace(/\{,\}/g, ',').replace(/\^\{([^{}]*)\}/g, '^$1')
        .replace(/\\(text|mathrm|mathbf)\{([^{}]*)\}/g, '$2').replace(/\\([a-zA-Z]+)/g, '$1').replace(/[{}]/g, '');
    }).replace(/\s+/g, ' ').trim();
  }
  /* HTML d’un générateur Maths et MCV → texte modifiable (fractions en LaTeX, sub/sup conservés) */
  function htmlToEdit(h) {
    h = String(h);
    h = h.replace(/<span class="fr"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, function (m, a, b) { return '$\\dfrac{' + plain(a) + '}{' + plain(b) + '}$'; });
    h = h.replace(/<br\s*\/?>/g, '\n');
    h = h.replace(/<(?!\/?(sub|sup|b|i|strong|em)\b)[^>]+>/g, '');
    return h.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  /* ───────── catalogue unifié 2de pro ───────── */
  var CHAPS_2DE = [
    { id: 'c1', num: 1, slug: 'prix-marges-tva', titre: '1 · Prix, marges et TVA (pourcentages, évolutions)' },
    { id: 'c2', num: 2, slug: 'statistique', titre: '2 · Statistique' },
    { id: 'c3', num: 3, slug: 'premier-degre', titre: '3 · Premier degré (équations, inéquations, calcul littéral)' },
    { id: 'c4', num: 4, slug: 'factures-interets', titre: '4 · Factures, réductions, intérêts' },
    { id: 'c5', num: 5, slug: 'fonctions', titre: '5 · Fonctions' },
    { id: 'c6', num: 6, slug: 'probabilites', titre: '6 · Probabilités' },
    { id: 'c7', num: 7, slug: 'geometrie', titre: '7 · Géométrie, grandeurs et mesures' },
    { id: 'c8', num: 8, slug: 'croisement-variables', titre: '8 · Croisement de deux variables' },
    { id: 'metiers', num: 9, slug: 'problemes-metiers', titre: 'Problèmes des métiers (plusieurs étapes)' },
    { id: 'algo', num: 10, slug: 'algorithmique-tableur', titre: 'Algorithmique et tableur' }
  ];
  /* chapitres de Flash Maths → chapitres unifiés */
  var FLASH_CHAP = {
    'Proportionnalité et pourcentages': 'c1', 'Statistiques': 'c2',
    'Équations et calcul littéral': 'c3', 'Fonctions affines et linéaires': 'c5', 'Grandeurs, mesures et volumes': 'c7',
    'Géométrie et trigonométrie': 'c7', 'Problèmes des métiers (plusieurs étapes)': 'metiers', 'Algorithmique et tableur': 'algo'
  };
  /* générateurs Maths et MCV 2de : chapitre + intitulé */
  var MCV = {
    pctOf: ['c1', 'Pourcentage d’une quantité'], prop: ['c1', 'Calculer un pourcentage (part sur total)'], ecrit: ['c1', 'Passer de % à décimal et inversement'],
    cmOf: ['c1', 'Coefficient multiplicateur d’une évolution'], evolOf: ['c1', 'Évolution associée à un coefficient'], apply: ['c1', 'Appliquer une hausse ou une baisse'],
    taux: ['c1', 'Taux d’évolution entre deux valeurs'], succ: ['c1', 'Évolutions successives'], depart: ['c1', 'Retrouver la valeur de départ'],
    ht2ttc: ['c1', 'Du prix HT au prix TTC'], ttc2ht: ['c1', 'Du prix TTC au prix HT'], tva6: ['c1', 'Montant de la TVA (astuce ÷ 6)'],
    marge: ['c1', 'Taux de marge et taux de marque'], og1: ['c1', 'Ordre de grandeur d’un prix soldé'],
    moy: ['c2', 'Moyenne'], moyP: ['c2', 'Moyenne pondérée'], med: ['c2', 'Médiane'], etendue: ['c2', 'Étendue'], q1: ['c2', 'Premier quartile'],
    q3: ['c2', 'Troisième quartile'], eiq: ['c2', 'Écart interquartile'], freq: ['c2', 'Fréquence en pourcentage'], angle: ['c2', 'Angle d’un secteur circulaire'],
    sigma: ['c2', 'Écart type (calculatrice)'], mode: ['c2', 'Mode d’une série'],
    eq1: ['c3', 'Équation ax = b'], eq2: ['c3', 'Équation ax + b = c'], eq3: ['c3', 'Équation avec x des deux côtés'], ineq: ['c3', 'Inéquation du premier degré'],
    trad: ['c3', 'Traduire un problème par une équation'], estSol: ['c3', 'Tester si un nombre est solution'], ivl: ['c3', 'Écrire un intervalle'],
    remise: ['c4', 'Remise commerciale'], remises2: ['c4', 'Deux remises successives'], factTTC: ['c4', 'Facture : total TTC'], intA: ['c4', 'Intérêts simples (en années)'],
    intM: ['c4', 'Intérêts simples (en mois)'], intJ: ['c4', 'Intérêts simples (en jours)'], valAc: ['c4', 'Valeur acquise'], tauxI: ['c4', 'Taux d’intérêt annuel'],
    dureeI: ['c4', 'Durée d’un placement'],
    imAff: ['c5', 'Image par une fonction affine'], imCar: ['c5', 'Image par x → kx²'], antAff: ['c5', 'Antécédent par une fonction affine'],
    coefDir: ['c5', 'Coefficient directeur d’une droite'], ordOr: ['c5', 'Ordonnée à l’origine'], lin: ['c5', 'Fonction linéaire et proportionnalité'],
    sens: ['c5', 'Sens de variation d’une fonction affine'], appart: ['c5', 'Un point est-il sur la droite ?'],
    proba: ['c6', 'Probabilité (cas équiprobable)'], probaFr: ['c6', 'Probabilité en pourcentage'], contraire: ['c6', 'Événement contraire'],
    freqObs: ['c6', 'Fréquence observée'], denomb: ['c6', 'Dénombrement (menus)'], de2: ['c6', 'Deux dés : nombre d’issues'],
    pytH: ['c7', 'Pythagore : hypoténuse'], pytC: ['c7', 'Pythagore : côté de l’angle droit'], pytD: ['c7', 'Pythagore : valeur approchée'],
    recip: ['c7', 'Réciproque de Pythagore'], thales: ['c7', 'Théorème de Thalès'], aireR: ['c7', 'Aire d’un rectangle'], aireD: ['c7', 'Aire d’un disque'],
    volP: ['c7', 'Volume d’un pavé'], volC: ['c7', 'Volume d’un cylindre'], agr: ['c7', 'Agrandissement et volume'], conv: ['c7', 'Conversions d’unités'],
    tcMarg: ['c8', 'Effectif marginal'], tcCase: ['c8', 'Retrouver une case du tableau'], tcPct: ['c8', 'Effectif à partir d’un pourcentage'],
    tcFreq: ['c8', 'Fréquence d’une case'], tcCond: ['c8', 'Fréquence conditionnelle'], tcSum: ['c8', 'Compléter un tableau de fréquences'],
    tcParmi: ['c8', 'Lire « parmi les… »'], tcCompare: ['c8', 'Comparer deux taux']
  };

  function buildCatalogue() {
    var chaps = {}; var out = CHAPS_2DE.map(function (c) { var o = { id: c.id, num: c.num, slug: c.slug, titre: c.titre, items: [] }; chaps[c.id] = o; return o; });
    FE.BANK.forEach(function (it) {
      if (it.niv.indexOf('2nde') < 0) return;
      var cid = FLASH_CHAP[it.chap]; if (!cid) return;
      chaps[cid].items.push({ key: 'f:' + it.id, src: 'flash', id: it.id, titre: it.titre, d: it.d || 1, cours: !!it.cours, chap: cid });
    });
    Object.keys(MC.G).forEach(function (id) {
      var m = MCV[id]; if (!m) return;
      chaps[m[0]].items.push({ key: 'm:' + id, src: 'mcv', id: id, titre: m[1], d: 1, cours: false, chap: m[0] });
    });
    return { levels: [{ id: '2de', label: '2de Bac Pro', court: '2de pro', chapters: out.filter(function (c) { return c.items.length; }) }] };
  }
  function itemByKey(cat, key) { var r = null; cat.levels.forEach(function (l) { l.chapters.forEach(function (c) { c.items.forEach(function (it) { if (it.key === key) r = it; }); }); }); return r; }

  /* ───────── fabrication d’une question normalisée ───────── */
  var LETTERS = 'ABCDEFGH';
  function makeFlash(id, seed) {
    var q = FE.makeQuestion(id, seed >>> 0); if (!q) return null;
    var N = { src: 'flash', id: id, seed: seed, titre: q.titre || id, d: q.d || 1, type: 'qcm', unit: '', qRaw: q.q, explRaw: q.expl || '', figHtml: '', rawIsHtml: false };
    if (q.fig) { try { N.figHtml = FE.figHtml(q.fig) || ''; } catch (e) { N.figHtml = ''; } }
    var k = q.kind || (q.vf ? 'vf' : 'qcm');
    if (k === 'assoc') {
      N.type = 'assoc'; N.L = q.L.slice(); N.R = q.R.slice();
      N.match = q.L.map(function (_, i) { for (var j = 0; j < q.rk.length; j++) if (q.rk[j] === i) return j; return 0; });
      N.ansRaw = N.match.map(function (j, i) { return (i + 1) + ' → ' + LETTERS[j]; }).join(' ; ');
    } else if (k === 'ordre') {
      N.type = 'ordre'; N.D = q.D.slice(); N.how = q.how || ''; N.ansRaw = q.choices[0].t;
    } else if (k === 'slider') {
      N.type = 'libre'; N.est = true; N.unit = (q.sl && q.sl.u) || ''; N.ansRaw = q.choices[0].t;
    } else if (k === 'vf') {
      N.type = 'vf'; N.ansRaw = q.choices[q.ans].t;
    } else {
      N.choices = q.choices.map(function (c) { return c.t; }); N.ans = q.ans; N.ansRaw = q.choices[q.ans].t;
      N.numeric = (q.num !== undefined && isFinite(q.num)) || !!q.lit || q.only === 'libre';
      N.unit = q.unit || '';
      N.type = q.qx ? 'qx' : 'qcm';
      if (q.only === 'libre' || q.choices.length === 1) { N.type = 'libre'; N.choices = null; }
    }
    return N;
  }
  function makeMcv(id, seed) {
    var it = MC.make(id, seed >>> 0); if (!it) return null;
    var N = { src: 'mcv', id: id, seed: seed, titre: (MCV[id] || [0, id])[1], d: 1, unit: '', qRaw: it.q, explRaw: '', figHtml: '', rawIsHtml: true };
    if (it.choices) { N.type = 'qcm'; N.choices = it.choices.slice(); N.ans = it.ok; N.ansRaw = it.choices[it.ok]; N.numeric = false; N.mcvA = it.a; }
    else { N.type = 'libre'; N.ansRaw = it.a; N.numeric = true; }
    N.ansIsHtml = true;
    return N;
  }
  function makeQuestion(src, id, seed) { try { return src === 'flash' ? makeFlash(id, seed) : makeMcv(id, seed); } catch (e) { return null; } }

  /* rendu final d’une question (avec modifications éventuelles) → champs HTML prêts pour la page */
  function view(N, over, mode) {
    over = over || {};
    var V = { type: N.type, titre: N.titre, src: N.src, id: N.id };
    var qEditable = N.rawIsHtml ? htmlToEdit(N.qRaw) : String(N.qRaw);
    V.qEdit = over.q !== undefined ? over.q : qEditable;
    V.qHtml = over.q !== undefined ? rtUser(over.q) : (N.rawIsHtml ? N.qRaw : rt(N.qRaw));
    var aEdit = N.ansIsHtml ? htmlToEdit(N.mcvA ? N.mcvA : N.ansRaw) : String(N.ansRaw);
    V.aEdit = over.a !== undefined ? over.a : aEdit;
    V.aHtml = over.a !== undefined ? rtUser(over.a) : (N.ansIsHtml ? (N.mcvA ? N.mcvA : N.ansRaw) : rt(N.ansRaw));
    V.eEdit = over.e !== undefined ? over.e : String(N.explRaw || '');
    V.eHtml = N.explRaw || over.e !== undefined ? rtUser(V.eEdit) : '';
    V.figHtml = over.nofig ? '' : N.figHtml;
    V.hasFig = !!N.figHtml; V.nofig = !!over.nofig;
    V.unit = N.unit;
    var t = N.type;
    if (t === 'qcm' && mode !== 'qcm' && N.numeric) t = 'libre';
    V.type = t;
    if (t === 'qcm' || t === 'qx') V.choices = (N.choices || []).map(function (c) { return N.rawIsHtml ? c : rt(c); });
    if (t === 'assoc') { V.L = N.L.map(rt); V.R = N.R.map(rt); }
    if (t === 'ordre') { V.D = N.D.map(rt); V.how = N.how; }
    if (t === 'qx') V.choices = (N.choices || []).map(function (c) { return rt(c); });
    V.d = N.d;
    V.ansIdx = N.ans;
    V.est = !!N.est;
    return V;
  }

  /* ───────── tirage ───────── */
  /* choisit n questions dans les notions cochées, en alternant les notions, sans doublon */
  function draw(keys, n, baseSeed, cat, avoid) {
    var out = [], r = mulberry32(baseSeed >>> 0), pool = [], seen = {}, last = null, guard = 0;
    avoid = avoid || {};
    var items = keys.map(function (k) { return itemByKey(cat, k); }).filter(Boolean);
    if (!items.length) return out;
    while (out.length < n && guard++ < n * 40) {
      if (!pool.length) pool = shuffle(r, items);
      var idx = (pool.length > 1 && pool[0] === last) ? 1 : 0;
      var it = pool.splice(idx, 1)[0], ok = null;
      for (var k = 0; k < 30 && !ok; k++) {
        var seed = (baseSeed + out.length * 104729 + k * 7919 + guard * 31) >>> 0;
        var N = makeQuestion(it.src, it.id, seed);
        if (!N) continue;
        var sig = plain(N.rawIsHtml ? N.qRaw : rt(N.qRaw)) + '|' + (N.figHtml ? N.figHtml.length : 0);
        if (seen[sig] || avoid[sig]) continue;
        seen[sig] = 1; ok = { src: it.src, id: it.id, seed: seed };
      }
      if (ok) { out.push(ok); last = it; }
    }
    return out;
  }
  function signature(N) { return plain(N.rawIsHtml ? N.qRaw : rt(N.qRaw)) + '|' + (N.figHtml ? N.figHtml.length : 0); }

  /* nom de fichier : niveau_chapitres_nombre-questions */
  function fileName(level, chapIds, n, suffix) {
    var names = chapIds.map(function (id) { var c = CHAPS_2DE.filter(function (x) { return x.id === id; })[0]; return c ? c.slug : (slug(id) || 'chapitre'); });
    var chap = names.length === 0 ? 'sans-chapitre' : names.length <= 3 ? names.join('+') : names.length + '-chapitres';
    return level + '_' + chap + '_' + n + '-question' + (n > 1 ? 's' : '') + (suffix || '') + '.pdf';
  }

  return {
    init: function (o) { FE = o.FE; MC = o.MC; KX = o.katex || null; RT = {}; },
    setKatex: function (k) { KX = k; RT = {}; },
    esc: esc, rt: rt, rtUser: rtUser, plain: plain, plainSrc: plainSrc, slug: slug, mulberry32: mulberry32, shuffle: shuffle,
    buildCatalogue: buildCatalogue, itemByKey: itemByKey, makeQuestion: makeQuestion, view: view, draw: draw, signature: signature,
    fileName: fileName, htmlToEdit: htmlToEdit, CHAPS_2DE: CHAPS_2DE, LETTERS: LETTERS
  };
})();
if (typeof module !== 'undefined') module.exports = AUTO;
