/* 3ème Série Pro — zones « ⚡ Automatismes » : 5 questions flash par chapitre, sans calculatrice, comme la partie 1 du brevet.
   Les questions suivent la liste indicative des automatismes du DNB (Eduscol) : nombres et calculs, grandeurs et mesures,
   données et probabilités, proportionnalité, géométrie, algorithmique. Tirage fixe dans le manuel, nouveau tirage dans l’appli.
   Une question = { t, v, tol, a, x } (réponse numérique) ou { t, choices, ok, a, x } (choix). */
(function (root) {
  'use strict';
  const MC = typeof module !== 'undefined' ? require('./gens.js').MCVG : root.MCVG;
  const { fr, rnd, rng } = MC;
  const pick = (R, a) => a[Math.floor(R() * a.length)], int = (R, lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const Q = (t, v, a, d = 2, x) => ({ t, v, tol: .5 * Math.pow(10, -d) + 1e-9, a: a || fr(rnd(v, d)), ...(x ? { x } : {}) });
  const C = (t, choices, ok, a, x) => ({ t, choices, ok, a: a || choices[ok], ...(x ? { x } : {}) });
  const rot = (R, arr) => { const o = int(R, 0, arr.length - 1); return [...arr.slice(o), ...arr.slice(0, o)]; };
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = n => String(n).replace('-', '⁻').split('').map(c => SUP['0123456789'.indexOf(c)] || c).join('');

  /* ---------- nombres et calculs ---------- */
  const divis = R => { const d = pick(R, [3, 9, 5, 2]), good = pick(R, { 3: [123, 141, 201, 318], 9: [117, 243, 315, 702], 5: [135, 260, 445, 905], 2: [126, 318, 504, 770] }[d]), bad = pick(R, { 3: [125, 143, 205, 316], 9: [118, 245, 316, 703], 5: [136, 262, 447, 908], 2: [125, 317, 503, 771] }[d]); let bad2 = bad + 2; while (bad2 % d === 0 || bad2 === good) bad2++;
    const ch = rot(R, [String(good), String(bad), String(bad2)]); return C(`Lequel de ces nombres est divisible par ${d} ?`, ch, ch.indexOf(String(good)), String(good), d === 3 || d === 9 ? `somme des chiffres de ${good} : ${String(good).split('').join(' + ')} = ${String(good).split('').reduce((a, c) => a + +c, 0)}, dans la table de ${d}` : `${good} se termine par ${good % 10}`); };
  const carre = R => { const n = int(R, 4, 12); return Q(`Calcule ${n}².`, n * n, null, 2, `${n} × ${n} = ${n * n}`); };
  const fracDec = R => { const [n, d, v] = pick(R, [[1, 4, .25], [3, 4, .75], [1, 2, .5], [1, 5, .2], [2, 5, .4], [3, 10, .3], [7, 10, .7], [1, 8, .125]]); return Q(`Écris ${n}/${d} sous forme décimale.`, v, fr(v), 3, `${n} ÷ ${d} = ${fr(v)}`); };
  const pctOf = R => { const [p, x] = pick(R, [[10, 80], [25, 60], [50, 46], [20, 45], [75, 40], [10, 250], [5, 60], [30, 70]]); return Q(`Calcule ${p} % de ${x}.`, p * x / 100, null, 2, `${x} × ${p} ÷ 100 = ${fr(p * x / 100)}`); };
  const fracQ = R => { const [n, d, x] = pick(R, [[2, 3, 15], [3, 4, 20], [2, 5, 35], [3, 5, 40], [5, 6, 18], [3, 8, 24]]); return Q(`Calcule ${n}/${d} de ${x}.`, n * x / d, null, 2, `${x} ÷ ${d} × ${n} = ${x / d} × ${n} = ${n * x / d}`); };
  const prio = R => { const a = int(R, 2, 9), b = int(R, 2, 6), c = int(R, 2, 5); return Q(`Calcule ${a} + ${b} × ${c}.`, a + b * c, null, 2, `la multiplication d’abord : ${a} + ${b * c} = ${a + b * c}`); };
  const puis10 = R => { const k = int(R, 0, 2); if (k === 0) { const n = int(R, 3, 6); return Q(`Écris 10${sup(n)} en écriture décimale.`, 10 ** n, fr(10 ** n), 2, `un 1 suivi de ${n} zéros : ${fr(10 ** n)}`); } if (k === 1) { const n = int(R, 1, 3); return Q(`Écris 10${sup(-n)} en écriture décimale.`, 10 ** -n, fr(10 ** -n), 4, `1 ÷ 10${sup(n)} = ${fr(10 ** -n)}`); } const a = pick(R, [2, 3, 5]), b = pick(R, [3, 4, 2]); return Q(`Calcule 10${sup(a)} × 10${sup(b)} sous la forme 10 puissance n : n = ?`, a + b, null, 2, `on additionne les exposants : ${a} + ${b} = ${a + b}`); };
  const sci = R => { const [m, e] = pick(R, [[3.2, 3], [4.5, 2], [6, 4], [1.5, 3], [7.8, 2], [2.05, 3]]); return Q(`Écris ${fr(m)} × 10${sup(e)} en écriture décimale.`, rnd(m * 10 ** e, 6), fr(rnd(m * 10 ** e, 6)), 2, `on décale la virgule de ${e} rangs vers la droite : ${fr(rnd(m * 10 ** e, 6))}`); };
  const oppose = R => { const a = int(R, 3, 9), b = int(R, 10, 15); return Q(`Calcule ${a} − ${b}.`, a - b, null, 2, `${a} − ${b} = − (${b} − ${a}) = ${fr(a - b)}`); };
  const simp = R => { const [n, d, k] = pick(R, [[3, 5, 5], [2, 3, 6], [3, 4, 4], [4, 5, 3], [5, 7, 2], [2, 9, 4]]); const N = n * k, D = d * k, ch = rot(R, [`${n}/${d}`, `${N - 1}/${D - 1}`, `${n + 1}/${d + 1}`]); return C(`Quelle est la fraction irréductible égale à ${N}/${D} ?`, ch, ch.indexOf(`${n}/${d}`), `${n}/${d}`, `on divise le numérateur et le dénominateur par ${k} : ${N} ÷ ${k} = ${n} et ${D} ÷ ${k} = ${d}`); };
  /* ---------- calcul littéral et algorithmique ---------- */
  const subst = R => { const a = int(R, 2, 5), b = int(R, 1, 9), x = int(R, 2, 6); return Q(`Calcule 3x + ${b} pour x = ${x}.`.replace('3x', `${a}x`), a * x + b, null, 2, `${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}`); };
  const equa = R => { const a = int(R, 2, 5), x = int(R, 2, 9), b = int(R, 1, 9); return Q(`Résous ${a}x + ${b} = ${a * x + b}.`, x, null, 2, `${a}x = ${a * x + b} − ${b} = ${a * x}, donc x = ${a * x} ÷ ${a} = ${x}`); };
  const progC = R => { const n = int(R, 2, 8), m = pick(R, [2, 3, 4]), p = int(R, 1, 9); return Q(`Programme : choisir un nombre, le multiplier par ${m}, ajouter ${p}. Résultat pour ${n} ?`, n * m + p, null, 2, `${n} × ${m} = ${n * m}, puis ${n * m} + ${p} = ${n * m + p}`); };
  const deplac = R => { const a = int(R, 2, 5), b = int(R, 1, 4); return Q(`Un lutin part de x = 0. « Répéter ${a} fois : avancer de ${b} » puis « reculer de 1 ». Position finale x = ?`, a * b - 1, null, 2, `${a} × ${b} = ${a * b}, puis ${a * b} − 1 = ${a * b - 1}`); };
  /* ---------- grandeurs et mesures ---------- */
  const conv = R => { const k = int(R, 0, 3); if (k === 0) { const m = pick(R, [72, 90, 135, 150, 105]); return Q(`Convertis ${m} minutes en heures (écriture décimale).`, m / 60, fr(m / 60), 2, `${m} min = ${Math.floor(m / 60)} h ${m % 60} min = ${fr(m / 60)} h`); } if (k === 1) { const h = pick(R, [1.5, 2.5, .75, 1.25]); return Q(`Convertis ${fr(h)} h en minutes.`, h * 60, null, 2, `${fr(h)} × 60 = ${h * 60} min`); } if (k === 2) { const l = pick(R, [1.5, 2, .5, .25]); return Q(`Combien de cm³ dans ${fr(l)} L ?`, l * 1000, fr(l * 1000), 2, `1 L = 1 000 cm³ : ${fr(l)} × 1 000 = ${fr(l * 1000)} cm³`); } const c = pick(R, [3.5, 12, .8, 150]); return Q(`Convertis ${fr(c)} m en cm.`, c * 100, fr(c * 100), 2, `${fr(c)} × 100 = ${fr(c * 100)} cm`); };
  const angle = R => { const a = int(R, 3, 8) * 10, b = int(R, 2, 6) * 10 + 5; return Q(`Dans un triangle, deux angles mesurent ${a}° et ${b}°. Le troisième mesure ?`, 180 - a - b, null, 2, `180 − ${a} − ${b} = ${180 - a - b}°`); };
  const aire = R => { const k = int(R, 0, 1); if (k) { const L = int(R, 3, 9), l = int(R, 2, 6); return Q(`Aire d’un rectangle de ${L} cm sur ${l} cm, en cm² ?`, L * l, null, 2, `${L} × ${l} = ${L * l} cm²`); } const b = int(R, 3, 8) * 2, h = int(R, 2, 7); return Q(`Aire d’un triangle de base ${b} cm et de hauteur ${h} cm, en cm² ?`, b * h / 2, null, 2, `${b} × ${h} ÷ 2 = ${b * h / 2} cm²`); };
  const vitesse = R => { const [d, t] = pick(R, [[150, 2], [90, 1.5], [240, 3], [60, .5], [45, .75]]); return Q(`Un train parcourt ${d} km en ${fr(t)} h. Sa vitesse moyenne, en km/h ?`, d / t, null, 2, `${d} ÷ ${fr(t)} = ${fr(d / t)} km/h`); };
  const volume = R => { const a = int(R, 2, 5), b = int(R, 2, 4), c = int(R, 2, 5); return Q(`Volume d’un pavé de ${a} cm × ${b} cm × ${c} cm, en cm³ ?`, a * b * c, null, 2, `${a} × ${b} × ${c} = ${a * b * c} cm³`); };
  const solide = R => { const s = pick(R, [['cylindre', 'deux disques et une face courbe'], ['cône', 'un disque et un sommet'], ['pyramide', 'une base polygonale et un sommet'], ['boule', 'une seule surface courbe, sans arête']]); const ch = rot(R, ['cylindre', 'cône', 'pyramide', 'boule']); return C(`Quel solide a ${s[1]} ?`, ch, ch.indexOf(s[0]), s[0]); };
  const pyth = R => { const [a, b, c] = pick(R, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]); return Q(`Triangle rectangle de côtés de l’angle droit ${a} cm et ${b} cm. Hypoténuse, en cm ?`, c, null, 2, `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} et √${c * c} = ${c} cm`); };
  const racine = R => { const n = int(R, 4, 12); return Q(`Calcule √${n * n}.`, n, null, 2, `${n} × ${n} = ${n * n}, donc √${n * n} = ${n}`); };
  /* ---------- données, probabilités, proportionnalité ---------- */
  const moy = R => { const a = int(R, 8, 14), b = a + pick(R, [2, 4]); let c = b + pick(R, [2, 3, 4]); while ((a + b + c) % 3) c++; return Q(`Moyenne de ${a}, ${b} et ${c} ?`, (a + b + c) / 3, fr(rnd((a + b + c) / 3, 2)), 2, `(${a} + ${b} + ${c}) ÷ 3 = ${a + b + c} ÷ 3 = ${fr(rnd((a + b + c) / 3, 2))}`); };
  const med = R => { const v = Array.from({ length: 5 }, () => int(R, 2, 20)), s = v.slice().sort((x, y) => x - y); return Q(`Médiane de la série ${v.join(' ; ')} ?`, s[2], null, 2, `rangée : ${s.join(' ; ')} ; la 3e valeur est ${s[2]}`); };
  const freq = R => { const [k, n] = pick(R, [[12, 48], [9, 36], [15, 60], [6, 30], [8, 40]]); return Q(`${k} élèves sur ${n} : fréquence en % ?`, k / n * 100, null, 2, `${k} ÷ ${n} = ${fr(k / n)}, soit ${fr(k / n * 100)} %`); };
  const proba = R => { const k = int(R, 0, 1); if (k) { const f = pick(R, [6, 8, 10, 12, 20]), c = int(R, 1, 3); return Q(`On lance un dé équilibré à ${f} faces numérotées de 1 à ${f}. Probabilité d’obtenir un nombre ≤ ${c} ? (fraction ou décimal)`, c / f, `${c}/${f}`, 3, `${c} issues favorables sur ${f} : ${c}/${f}`); } const r = int(R, 2, 5), b = int(R, 3, 7); return Q(`Un sac contient ${r} billes rouges et ${b} bleues. Probabilité de tirer une rouge ? (fraction ou décimal)`, r / (r + b), `${r}/${r + b}`, 3, `${r} rouges sur ${r + b} billes : ${r}/${r + b}`); };
  const qprop = R => { const [a, b, c] = pick(R, [[3, 12, 5], [4, 10, 6], [5, 15, 7], [2, 7, 6], [6, 9, 10]]); return Q(`${a} places de cinéma coûtent ${b} €. Combien coûtent ${c} places ?`, b / a * c, null, 2, `1 place : ${b} ÷ ${a} = ${fr(b / a)} € ; ${c} places : ${fr(b / a)} × ${c} = ${fr(b / a * c)} €`); };
  const echelle = R => { const [e, d] = pick(R, [[100, 3], [1000, 5], [50, 4], [200, 2.5]]); return Q(`Sur un plan à l’échelle 1/${e}, un mur mesure ${fr(d)} cm. Longueur réelle, en cm ?`, e * d, fr(e * d), 2, `${fr(d)} × ${e} = ${fr(e * d)} cm`); };

  const A = {
    c1: [divis, carre, fracDec, pctOf, conv],
    c2: [puis10, sci, fracQ, prio, med],
    c3: [subst, equa, progC, oppose, angle],
    c4: [qprop, pctOf, vitesse, conv, fracDec],
    c5: [subst, equa, qprop, moy, pctOf],
    c6: [moy, med, freq, pctOf, conv],
    c7: [proba, freq, fracDec, simp, moy],
    c8: [carre, racine, pyth, angle, aire],
    c9: [echelle, qprop, aire, conv, fracQ],
    c10: [volume, conv, angle, deplac, solide]
  };
  /* les 5 du chapitre, puis (au-delà de 5) d’autres automatismes du brevet, tous différents */
  const POOL = [divis, carre, fracDec, pctOf, fracQ, prio, puis10, oppose, simp, subst, equa, progC, conv, angle, aire, vitesse, volume, pyth, racine, moy, med, freq, proba, qprop, echelle, solide];
  const gen = (cid, seed, n = 5) => { const R = rng(seed), own = A[cid], q = own.map(f => f(R));
    if (n > own.length) { const rest = POOL.filter(f => !own.includes(f)); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; } rest.slice(0, n - own.length).forEach(f => q.push(f(R))); }
    return q; };
  const API = { A, gen };
  if (typeof module !== 'undefined') module.exports = API; else root.MCVA = API;
})(typeof module !== 'undefined' ? module.exports : window);
