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

  /* ───────── niveaux et chapitres ───────── */
  var FC = {  /* correspondance des chapitres de la banque → chapitres de l’appli */
    nb: 'Calcul mental et automatismes', prop: 'Proportionnalité et pourcentages', stat: 'Statistiques', equa: 'Équations et calcul littéral',
    fonc: 'Fonctions affines et linéaires', gran: 'Grandeurs, mesures et volumes', geo: 'Géométrie et trigonométrie', metiers: 'Problèmes des métiers (plusieurs étapes)', algo: 'Algorithmique et tableur'
  };
  function T(id, titre, slg) { return { id: id, titre: titre, slug: slg || slug(titre.replace(/ \(.*$/, '')) }; }
  var COMMUN = { nb: T('nb', 'Nombres et calculs', 'nombres-calculs'), metiers: T('metiers', 'Problèmes des métiers (plusieurs étapes)', 'problemes-metiers'), algo: T('algo', 'Algorithmique et tableur', 'algorithmique-tableur'),
    geop: T('geop', 'Géométrie plane', 'geometrie-plane'), espace: T('espace', 'Géométrie dans l’espace', 'geometrie-espace') };
  function numbered(arr) { return arr.map(function (t, i) { return T('c' + (i + 1), (i + 1) + ' · ' + t, slug(t.replace(/ \(.*$/, '').split(' : ')[0])); }); }
  var LEVELS = [
    { id: 'cap', label: 'CAP', court: 'CAP', niv: 'cap',
      chaps: [COMMUN.nb, T('prop', 'Proportionnalité et pourcentages', 'proportionnalite-pourcentages'), T('stat', 'Statistiques', 'statistiques'), T('equa', 'Équations et calcul littéral', 'equations-calcul-litteral'),
        T('fonc', 'Fonctions', 'fonctions'), T('gran', 'Grandeurs, mesures et volumes', 'grandeurs-mesures-volumes'), T('geo', 'Géométrie et trigonométrie', 'geometrie-trigonometrie'), COMMUN.metiers, COMMUN.algo],
      fmap: {} },
    { id: '3pm', label: '3ᵉ Prépa-Métiers', court: '3PM', niv: '3pm', auto: 'a3',
      chaps: numbered(['Nombres entiers et arithmétique', 'Fractions, puissances de 10 et écriture scientifique', 'Calcul littéral et équations', 'Proportionnalité, pourcentages, grandeurs composées', 'Fonctions', 'Statistiques',
        'Probabilités', 'Théorème de Pythagore et trigonométrie', 'Échelles, agrandissements, réductions et Thalès', 'Espace et transformations (volumes)']).concat([COMMUN.metiers, COMMUN.algo]),
      fmap: { 'Calcul mental et automatismes': 'c2', 'Proportionnalité et pourcentages': 'c4', 'Grandeurs, mesures et volumes': 'c10', 'Géométrie et trigonométrie': 'c8', 'Statistiques': 'c6', 'Équations et calcul littéral': 'c3',
        'Fonctions affines et linéaires': 'c5', 'Problèmes des métiers (plusieurs étapes)': 'metiers', 'Algorithmique et tableur': 'algo' } },
    { id: '2de', label: '2de Bac Pro', court: '2de pro', niv: '2nde', mcv: true,
      chaps: [COMMUN.nb, T('c1', '1 · Prix, marges et TVA (pourcentages, évolutions)', 'prix-marges-tva'), T('c2', '2 · Statistiques', 'statistiques'), T('c3', '3 · Premier degré (équations, inéquations, calcul littéral)', 'premier-degre'),
        T('c4', '4 · Factures, réductions, intérêts', 'factures-interets'), T('c5', '5 · Fonctions', 'fonctions'), T('c6', '6 · Probabilités', 'probabilites'), T('c7', '7 · Géométrie, grandeurs et mesures', 'geometrie'),
        T('c8', '8 · Croisement de deux variables', 'croisement-variables'), COMMUN.metiers, COMMUN.algo],
      fmap: { 'Calcul mental et automatismes': 'nb', 'Proportionnalité et pourcentages': 'c1', 'Statistiques': 'c2', 'Équations et calcul littéral': 'c3', 'Fonctions affines et linéaires': 'c5', 'Grandeurs, mesures et volumes': 'c7',
        'Géométrie et trigonométrie': 'c7', 'Problèmes des métiers (plusieurs étapes)': 'metiers', 'Algorithmique et tableur': 'algo' } },
    { id: '1re', label: '1ʳᵉ pro', court: '1re pro', niv: '1re', auto: 'a1',
      chaps: numbered(['Calculs commerciaux et financiers', 'Résolution graphique', 'Fonctions du second degré', 'Dérivation', 'Suites numériques', 'Statistique à deux variables', 'Probabilités', 'Géométrie dans l’espace']).concat([COMMUN.geop, COMMUN.metiers]),
      fmap: { 'Évolutions et calcul économique': 'c1', 'Proportionnalité et pourcentages': 'c1', 'Statistiques et probabilités': 'c6', 'Statistiques': 'c6', 'Fonctions numériques': 'c2', 'Fonctions affines et linéaires': 'c2', 'Équations et calcul littéral': 'c3',
        'Géométrie plane': 'geop', 'Géométrie et trigonométrie': 'geop', 'Grandeurs, mesures et volumes': 'c8', 'Problèmes des métiers (plusieurs étapes)': 'metiers' } },
    { id: 'tle', label: 'Tle pro', court: 'Tle pro', niv: 'term', auto: 'aT',
      chaps: numbered(['Suites numériques', 'Calculs commerciaux et financiers', 'Fonctions polynômes de degré 3', 'Fonctions exponentielles et logarithme décimal', 'Statistique à deux variables', 'Probabilités', 'Exponentielle de base e et logarithme népérien']).concat([COMMUN.espace]),
      fmap: { 'Suites numériques': 'c1', 'Dérivation et optimisation': 'c3', 'Fonctions numériques': 'c4', 'Statistiques et probabilités': 'c6', 'Probabilités': 'c6', 'Géométrie dans l’espace': 'espace', 'Grandeurs, mesures et volumes': 'espace' } }
  ];
  (function () { var f = {}; Object.keys(FC).forEach(function (k) { f[FC[k]] = k; }); LEVELS[0].fmap = f; })();
  function levelDef(id) { return LEVELS.filter(function (l) { return l.id === id; })[0] || null; }
  function chapDef(levelId, chapId) { var l = levelDef(levelId); if (!l) return null; return l.chaps.filter(function (c) { return c.id === chapId; })[0] || null; }
  function isLevel(id) { return !!levelDef(id); }
  function isChap(levelId, chapId) { return !!chapDef(levelId, chapId); }

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

  /* consignes : une phrase qui donne le contexte des questions très courtes (générateurs de calcul rapide) */
  var CONS = {
    pctOf: 'Calcule le pourcentage d’une quantité.', prop: 'Exprime cette part en pourcentage (« a sur b »).', ecrit: 'Complète : passe de l’écriture décimale à l’écriture en pourcentage (ou l’inverse).',
    cmOf: 'Donne le coefficient multiplicateur (CM) associé à cette évolution.', evolOf: 'Donne l’évolution en pourcentage associée à ce coefficient multiplicateur (hausse ou baisse).',
    apply: 'Calcule la nouvelle valeur après cette hausse ou cette baisse.', taux: 'Calcule le taux d’évolution entre la valeur de départ et la valeur d’arrivée.',
    succ: 'Deux évolutions se suivent. Calcule le taux d’évolution global.', depart: 'Retrouve la valeur de départ, avant l’évolution.',
    ht2ttc: 'Calcule le prix TTC à partir du prix HT.', ttc2ht: 'Calcule le prix HT à partir du prix TTC.', tva6: 'Calcule le montant de la TVA contenue dans ce prix TTC.',
    marge: 'Calcule le taux demandé, en pourcentage.', og1: 'Sans calculatrice, donne un ordre de grandeur du prix après la remise.',
    moy: 'Calcule la moyenne de cette série.', moyP: 'Calcule la moyenne pondérée de cette série.', med: 'Détermine la médiane de cette série (range d’abord les valeurs).',
    etendue: 'Calcule l’étendue de cette série.', q1: 'Détermine le premier quartile de cette série.', q3: 'Détermine le troisième quartile de cette série.', eiq: 'Calcule l’écart interquartile de cette série.',
    freq: 'Calcule la fréquence, en pourcentage.', angle: 'Dans un diagramme circulaire, calcule l’angle du secteur qui correspond à cette fréquence.',
    sigma: 'Avec la calculatrice, détermine l’écart type de cette série.', mode: 'Détermine le mode (la valeur la plus fréquente) de cette série.',
    eq1: 'Résous l’équation.', eq2: 'Résous l’équation.', eq3: 'Résous l’équation.', ineq: 'Résous l’inéquation.', trad: 'Traduis ce problème par une équation, puis résous-la.',
    estSol: 'Teste si ce nombre est solution de l’équation (remplace x par ce nombre).', ivl: 'Écris cet encadrement sous la forme d’un intervalle.',
    remise: 'Calcule le prix net après la remise.', remises2: 'Calcule le net commercial après les deux remises successives.', factTTC: 'Calcule le total TTC de cette facture.',
    intA: 'Calcule les intérêts simples produits (durée en années).', intM: 'Calcule les intérêts simples produits (durée en mois).', intJ: 'Calcule les intérêts simples produits (durée en jours).',
    valAc: 'Calcule la valeur acquise (capital + intérêts).', tauxI: 'Calcule le taux d’intérêt annuel.', dureeI: 'Calcule la durée du placement, en mois.',
    imAff: 'Calcule l’image de ce nombre par la fonction.', imCar: 'Calcule l’image de ce nombre par la fonction.', antAff: 'Détermine l’antécédent de ce nombre par la fonction.',
    coefDir: 'Calcule le coefficient directeur (la pente) de la droite.', ordOr: 'Détermine l’ordonnée à l’origine de la droite (équation y = ax + b).',
    lin: 'Dans cette situation de proportionnalité, calcule le coefficient demandé.', sens: 'Indique le sens de variation de cette fonction affine (croissante ou décroissante).',
    appart: 'Ce point appartient-il à la droite ? Remplace x et y dans l’équation.',
    proba: 'Dans une situation d’équiprobabilité, calcule la probabilité de l’événement.', probaFr: 'Calcule la probabilité de l’événement.', contraire: 'Calcule la probabilité de l’événement contraire.',
    freqObs: 'Calcule la fréquence observée.', denomb: 'Dénombre les possibilités (principe multiplicatif).', de2: 'On lance deux dés à six faces. Dénombre les issues demandées.',
    pytH: 'Dans un triangle rectangle, calcule l’hypoténuse (théorème de Pythagore).', pytC: 'Dans un triangle rectangle, calcule le côté manquant (théorème de Pythagore).',
    pytD: 'Dans un triangle rectangle, calcule l’hypoténuse (valeur approchée, théorème de Pythagore).', recip: 'Avec la réciproque du théorème de Pythagore : ce triangle est-il rectangle ?',
    thales: 'Avec le théorème de Thalès, calcule la longueur demandée.', aireR: 'Calcule l’aire de cette figure.', aireD: 'Calcule l’aire de ce disque.',
    volP: 'Calcule le volume de ce solide (attention aux unités).', volC: 'Calcule le volume de ce cylindre.', agr: 'Cette figure est agrandie (ou réduite). Calcule la nouvelle aire.', conv: 'Convertis.',
    tcMarg: 'Des personnes (ou des commandes) sont classées selon deux critères dans un tableau croisé d’effectifs. L’effectif marginal d’une ligne ou d’une colonne est son total : additionne les deux nombres donnés.',
    tcCase: 'Dans un tableau croisé d’effectifs, le total d’une ligne est la somme de ses cases. Retrouve la case manquante : total − case connue.',
    tcPct: 'Dans un tableau croisé, l’effectif d’un groupe se calcule avec : pourcentage × effectif total.',
    tcFreq: 'Dans un tableau croisé, la fréquence d’une case est : effectif de la case ÷ effectif total (en pourcentage).',
    tcCond: 'Fréquence conditionnelle : effectif de la case ÷ effectif du groupe considéré (en pourcentage).',
    tcSum: 'Les quatre cases d’un tableau de fréquences (deux critères) donnent ensemble 100 %. Retrouve la quatrième case.',
    tcParmi: 'Dans un tableau croisé, lis bien « parmi les… » : par quel effectif faut-il diviser ?',
    tcCompare: 'Compare les deux taux de réussite (acheteurs ÷ visiteurs) pour choisir le meilleur.'
  };

  /* phrases trop courtes des manuels : on les complète (données et contexte) */
  var AUTOFIX = [
    [/^Intérêts de ([\d ]+ €) à ([\d,]+ %) pendant (.+?) \?$/, 'On place $1 à $2 par an pendant $3, en intérêts simples. Calcule les intérêts.'],
    [/^([\d ]+ €) placés à ([\d,]+ %) pendant (.+?) : (intérêts|valeur acquise) \?$/, function (m, a, b, c, d) { return 'On place ' + a + ' à ' + b + ' par an pendant ' + c + ', en intérêts simples. Calcule ' + (d === 'intérêts' ? 'les intérêts' : 'la valeur acquise (capital + intérêts)') + '.'; }],
    [/^Intérêts simples de ([\d ]+ €) à ([\d,]+ %) pendant (.+?) \?$/, 'On place $1 à $2 par an pendant $3, en intérêts simples. Calcule les intérêts.'],
    [/^([\d ]+ €) à ([\d,]+ %) pendant (.+?), en intérêts simples : (intérêts|valeur acquise) \?$/, function (m, a, b, c, d) { return 'On place ' + a + ' à ' + b + ' par an pendant ' + c + ', en intérêts simples. Calcule ' + (d === 'intérêts' ? 'les intérêts' : 'la valeur acquise (capital + intérêts)') + '.'; }],
    [/^([\d ]+ €) placés à ([\d,]+ %) pendant (.+?), en intérêts simples : (intérêts|valeur acquise) \?$/, function (m, a, b, c, d) { return 'On place ' + a + ' à ' + b + ' par an pendant ' + c + ', en intérêts simples. Calcule ' + (d === 'intérêts' ? 'les intérêts' : 'la valeur acquise (capital + intérêts)') + '.'; }],
    [/^Moyenne de (.+) \?$/, 'Calcule la moyenne de $1.'],
    [/^Médiane de la série (.+) \?$/, 'Calcule la médiane de la série : $1.'],
    [/^(\d+) élèves sur (\d+) : fréquence en % \?$/, 'Sur $2 élèves, $1 sont concernés. Calcule la fréquence, en pourcentage.'],
    [/^Diamètre (.+) : quel est le rayon \?$/, 'Un cercle a pour diamètre $1. Quel est son rayon ?'],
    [/^Avec π ≈ 3, aire d’un disque de rayon (.+) \?$/, 'On prend π ≈ 3. Calcule l’aire d’un disque de rayon $1.'],
    [/^Triangle rectangle de côtés de l’angle droit (.+) et (.+)\. Hypoténuse, en cm \?$/, 'Dans un triangle rectangle, les côtés de l’angle droit mesurent $1 et $2. Calcule l’hypoténuse, en cm.'],
    [/^(\d+) places de cinéma coûtent (\d+) €\. Combien coûtent (\d+) places \?$/, '$1 places de cinéma coûtent $2 € (proportionnalité). Combien coûtent $3 places ?'],
    [/^Une (hausse|baisse) de (.+) revient à multiplier par…$/, 'Une $1 de $2 revient à multiplier par quel coefficient ?']
  ];
  function fixAuto(t) { var n = String(t).replace(/[\u00a0\u202f]/g, ' '); for (var i = 0; i < AUTOFIX.length; i++) { if (AUTOFIX[i][0].test(n)) return n.replace(AUTOFIX[i][0], AUTOFIX[i][1]).replace(/, en intérêts simples, en intérêts simples/, ', en intérêts simples').replace(/(\d) (\d{3})(?!\d)/g, '$1\u202f$2'); } return String(t); }
  /* retouches de quelques énoncés de la banque Flash qui parlent d’une figure absente */
  var FLASHFIX = { cc_geo: [/chaque figure/, 'chaque forme géométrique'] };

  /* ───────── catalogue unifié (5 niveaux) ───────── */
  var AM = {};  /* modules d’automatismes des manuels : a3 (3ᵉ), a1 (1re), aT (Tle) */
  function autoSample(mod, cid, k) { try { var q = mod.gen(cid, 3)[k]; return q ? plain(q.t).slice(0, 78) : ''; } catch (e) { return ''; } }
  function buildCatalogue() {
    var levels = LEVELS.map(function (L) {
      var chaps = {}, out = L.chaps.map(function (c) { var o = { id: c.id, slug: c.slug, titre: c.titre, items: [] }; chaps[c.id] = o; return o; });
      FE.BANK.forEach(function (it) {
        if (it.niv.indexOf(L.niv) < 0) return;
        var cid = L.fmap[it.chap];
        if (!cid || !chaps[cid]) return;
        chaps[cid].items.push({ key: 'f:' + L.id + ':' + it.id, src: 'flash', id: it.id, titre: it.titre, d: it.d || 1, cours: !!it.cours, chap: cid, level: L.id });
      });
      if (L.mcv) Object.keys(MC.G).forEach(function (id) {
        var m = MCV[id]; if (!m || !chaps[m[0]]) return;
        chaps[m[0]].items.push({ key: 'm:' + L.id + ':' + id, src: 'mcv', id: id, titre: m[1], d: 1, cours: false, chap: m[0], level: L.id });
      });
      if (L.auto && AM[L.auto]) Object.keys(AM[L.auto].A).forEach(function (cid) {
        if (!chaps[cid]) return;
        var n = 0; try { n = AM[L.auto].gen(cid, 1).length; } catch (e) { n = 0; }
        for (var k = 0; k < n; k++) {
          var id = L.auto + ':' + cid + ':' + k;
          chaps[cid].items.push({ key: 'a:' + L.id + ':' + id, src: 'auto', id: id, titre: autoSample(AM[L.auto], cid, k) || ('Question ' + (k + 1)), d: 1, cours: false, chap: cid, level: L.id });
        }
      });
      return { id: L.id, label: L.label, court: L.court, chapters: out.filter(function (c) { return c.items.length; }) };
    });
    return { levels: levels };
  }
  function keyOf(levelId, src, id) { return (src === 'flash' ? 'f:' : src === 'mcv' ? 'm:' : 'a:') + levelId + ':' + id; }
  function itemByKey(cat, key) { var r = null; cat.levels.forEach(function (l) { l.chapters.forEach(function (c) { c.items.forEach(function (it) { if (it.key === key) r = it; }); }); }); return r; }
  /* chapitre d’une question dans un niveau : { id, titre, rang } */
  function chapterOf(cat, levelId, src, id) {
    var k = keyOf(levelId, src, id), res = null;
    cat.levels.forEach(function (l) { l.chapters.forEach(function (c, i) { c.items.forEach(function (it) { if (it.key === k) res = { id: c.id, titre: c.titre, rang: i }; }); }); });
    return res;
  }

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
  function makeAuto(id, seed) {
    var p = String(id).split(':'), mod = AM[p[0]]; if (!mod) return null;
    var q = mod.gen(p[1], seed >>> 0)[+p[2]]; if (!q) return null;
    var N = { src: 'auto', id: id, seed: seed, titre: '', d: 1, unit: '', qRaw: fixAuto(q.t), explRaw: q.x || '', figHtml: '', rawIsHtml: false, tags: true, ansRaw: String(q.a), numeric: false };
    if (q.choices) { N.type = 'qcm'; N.choices = q.choices.slice(); N.ans = q.ok; N.ansRaw = String(q.choices[q.ok]); }
    else { N.type = 'libre'; N.numeric = true; }
    return N;
  }
  function makeQuestion(src, id, seed) {
    try {
      var N = src === 'flash' ? makeFlash(id, seed) : src === 'mcv' ? makeMcv(id, seed) : src === 'auto' ? makeAuto(id, seed) : null;
      if (N && src === 'mcv' && CONS[id]) N.cons = CONS[id];
      if (N && src === 'flash' && FLASHFIX[id]) N.qRaw = String(N.qRaw).replace(FLASHFIX[id][0], FLASHFIX[id][1]);
      return N;
    } catch (e) { return null; }
  }

  /* rendu final d’une question (avec modifications éventuelles) → champs HTML prêts pour la page */
  function view(N, over, mode) {
    over = over || {};
    var V = { type: N.type, titre: N.titre, src: N.src, id: N.id, cons: N.cons || '' };
    var qEditable = N.rawIsHtml ? htmlToEdit(N.qRaw) : String(N.qRaw);
    V.qEdit = over.q !== undefined ? over.q : qEditable;
    V.qHtml = over.q !== undefined ? rtUser(over.q) : (N.rawIsHtml ? N.qRaw : N.tags ? rtUser(N.qRaw) : rt(N.qRaw));
    var aEdit = N.ansIsHtml ? htmlToEdit(N.mcvA ? N.mcvA : N.ansRaw) : String(N.ansRaw);
    V.aEdit = over.a !== undefined ? over.a : aEdit;
    V.aHtml = over.a !== undefined ? rtUser(over.a) : (N.ansIsHtml ? (N.mcvA ? N.mcvA : N.ansRaw) : N.tags ? rtUser(N.ansRaw) : rt(N.ansRaw));
    V.eEdit = over.e !== undefined ? over.e : String(N.explRaw || '');
    V.eHtml = N.explRaw || over.e !== undefined ? rtUser(V.eEdit) : '';
    V.figHtml = over.nofig ? '' : N.figHtml;
    V.hasFig = !!N.figHtml; V.nofig = !!over.nofig;
    V.unit = N.unit;
    var t = N.type;
    if (t === 'qcm' && mode !== 'qcm' && N.numeric) t = 'libre';
    V.type = t;
    if (t === 'qcm' || t === 'qx') V.choices = (N.choices || []).map(function (c) { return N.rawIsHtml ? c : N.tags ? rtUser(c) : rt(c); });
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
  function fileName(levelId, chapIds, n, suffix) {
    var L = levelDef(levelId) || LEVELS[2], lv = slug(L.court);
    var names = chapIds.map(function (id) { var c = chapDef(L.id, id); return c ? c.slug : (slug(id) || 'chapitre'); });
    var chap = names.length === 0 ? 'sans-chapitre' : names.length <= 3 ? names.join('+') : names.length + '-chapitres';
    return lv + '_' + chap + '_' + n + '-question' + (n > 1 ? 's' : '') + (suffix || '') + '.pdf';
  }

  return {
    init: function (o) { FE = o.FE; MC = o.MC; KX = o.katex || null; RT = {}; AM = o.AM || {}; },
    setKatex: function (k) { KX = k; RT = {}; },
    esc: esc, rt: rt, rtUser: rtUser, plain: plain, plainSrc: plainSrc, slug: slug, mulberry32: mulberry32, shuffle: shuffle,
    buildCatalogue: buildCatalogue, itemByKey: itemByKey, makeQuestion: makeQuestion, view: view, draw: draw, signature: signature,
    fileName: fileName, htmlToEdit: htmlToEdit, LEVELS: LEVELS, levelDef: levelDef, chapDef: chapDef, isLevel: isLevel, isChap: isChap, keyOf: keyOf, chapterOf: chapterOf, LETTERS: LETTERS
  };
})();
if (typeof module !== 'undefined') module.exports = AUTO;
