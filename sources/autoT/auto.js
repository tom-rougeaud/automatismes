/* Terminale — zones « ⚡ Automatismes » : 5 questions flash par chapitre, sans calculatrice.
   Chaque série mêle les automatismes du programme de terminale (probabilités, suite arithmétique, second degré, dérivée)
   et les prérequis du chapitre ; la dernière question porte toujours sur un intérêt simple ou une valeur acquise
   (automatismes spécifiques des spécialités sans physique-chimie). Tirage fixe dans le manuel, nouveau tirage dans l’appli.
   Une question = { t, v, tol, a } (réponse numérique) ou { t, choices, ok, a } (choix). */
(function (root) {
  'use strict';
  const MC = typeof module !== 'undefined' ? require('./gens.js').MCVG : root.MCVG;
  const { fr, rnd, rng } = MC;
  const pick = (R, a) => a[Math.floor(R() * a.length)], int = (R, lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const Q = (t, v, a, d = 2, x) => ({ t, v, tol: .5 * Math.pow(10, -d) + 1e-9, a: a || fr(rnd(v, d)), ...(x ? { x } : {}) });
  const C = (t, choices, ok, a, x) => ({ t, choices, ok, a: a || choices[ok], ...(x ? { x } : {}) });
  const eur = x => fr(rnd(x, 2), Number.isInteger(rnd(x, 2)) ? 0 : 2) + ' €';
  const sg = n => n < 0 ? '− ' + fr(-n) : fr(n);
  const mon = (a, s) => a === 1 ? s : a === -1 ? '−' + s : fr(a) + s;           // 3x², −x…
  const poly = cs => { let o = ''; cs.forEach(([a, s]) => { if (!a) return; const m = mon(Math.abs(a), s) || fr(Math.abs(a)); o += o ? (a < 0 ? ' − ' : ' + ') + m : (a < 0 ? '−' : '') + m; }); return o || '0'; };
  /* intérêt simple ou valeur acquise (spirale 2de-1re) */
  const interet = R => {
    const c = pick(R, [1000, 2000, 500, 4000, 1500]), t = pick(R, [2, 3, 4, 5]), k = int(R, 0, 4);
    if (k === 0) return Q(`${fr(c)} € placés à ${t} % pendant 1 an, en intérêts simples : intérêts ?`, c * t / 100, eur(c * t / 100), 2, `${fr(c)} × ${t} ÷ 100 = ${eur(c * t / 100)}`);
    if (k === 1) return Q(`${fr(c)} € placés à ${t} % pendant 1 an : valeur acquise ?`, c * (1 + t / 100), eur(c * (1 + t / 100)), 2, `${fr(c)} + ${fr(c)} × ${t} ÷ 100 = ${fr(c)} + ${eur(c * t / 100)} = ${eur(c * (1 + t / 100))}`);
    if (k === 2) return Q(`${fr(c)} € placés à ${t} % pendant 6 mois, en intérêts simples : intérêts ?`, c * t / 200, eur(c * t / 200), 2, `6 mois = la moitié d’un an : ${fr(c)} × ${t} ÷ 100 ÷ 2 = ${eur(c * t / 200)}`);
    if (k === 3) return Q(`Intérêts simples de ${fr(c)} € à ${t} % pendant 3 ans ?`, c * t * 3 / 100, eur(c * t * 3 / 100), 2, `${fr(c)} × ${t} ÷ 100 × 3 = ${eur(c * t / 100)} × 3 = ${eur(c * t * 3 / 100)}`);
    return Q(`${fr(c)} € à ${t} % pendant 2 ans, en intérêts simples : valeur acquise ?`, c * (1 + 2 * t / 100), eur(c * (1 + 2 * t / 100)), 2, `intérêts : ${fr(c)} × ${t} ÷ 100 × 2 = ${eur(c * t / 50)} ; ${fr(c)} + ${eur(c * t / 50)} = ${eur(c * (1 + 2 * t / 100))}`);
  };
  /* ---------- automatismes de terminale ---------- */
  const contraire = R => { const p = pick(R, [.15, .2, .35, .4, .62, .07]); return Q(`P(A) = ${fr(p)}. Calcule P(Ā), la probabilité de l’évènement contraire.`, 1 - p, fr(rnd(1 - p, 2)), 2, `P(Ā) = 1 − ${fr(p)} = ${fr(rnd(1 - p, 2))}`); };
  const incompat = R => { const a = pick(R, [.2, .25, .3, .15]), b = pick(R, [.1, .35, .4, .45]); return Q(`A et B sont incompatibles. P(A) = ${fr(a)} et P(B) = ${fr(b)}. Calcule P(A ∪ B).`, a + b, fr(rnd(a + b, 2)), 2, `incompatibles : P(A ∪ B) = ${fr(a)} + ${fr(b)} = ${fr(rnd(a + b, 2))}`); };
  const reunion = R => { const a = pick(R, [.5, .4, .6]), b = pick(R, [.3, .35, .25]), i = pick(R, [.1, .15, .2]); return Q(`P(A) = ${fr(a)}, P(B) = ${fr(b)} et P(A ∩ B) = ${fr(i)}. Calcule P(A ∪ B).`, a + b - i, fr(rnd(a + b - i, 2)), 2, `P(A ∪ B) = ${fr(a)} + ${fr(b)} − ${fr(i)} = ${fr(rnd(a + b - i, 2))}`); };
  const inter = R => { const n = pick(R, [200, 100, 400]), k = pick(R, [20, 30, 50, 60]), e = n * k / 100; return Q(`Sur ${n} clients, ${e} ont acheté en ligne <b>et</b> en magasin. Probabilité qu’un client pris au hasard ait fait les deux ?`, k / 100, fr(k / 100), 2, `${e} ÷ ${n} = ${fr(k / 100)}`); };
  const croise = R => { const [a, b] = pick(R, [[30, 20], [45, 15], [60, 40], [24, 16], [35, 15], [18, 12]]), tot = a + b; return Q(`Une enquête : ${a} clients fidèles et ${b} clients nouveaux ont répondu. Fréquence des clients fidèles, en % ?`, a / tot * 100, fr(rnd(a / tot * 100, 1)) + ' %', 1, `${a} ÷ (${a} + ${b}) = ${a} ÷ ${tot} = ${fr(rnd(a / tot, 3))}, soit ${fr(rnd(a / tot * 100, 1))} %`); };
  const condi = R => { const nA = pick(R, [40, 50, 80]), k = pick(R, [10, 20, 30]), nAB = nA * k / 100 * 2; return Q(`${nA} clients ont la carte de fidélité ; parmi eux, ${nAB} ont acheté une promotion. P<sub>carte</sub>(promotion) = ?`, nAB / nA, fr(nAB / nA), 2, `${nAB} ÷ ${nA} = ${fr(nAB / nA)}`); };
  const arith = R => { const u0 = pick(R, [12, 20, 50, 120]), r = pick(R, [3, 5, -2, 15]), n = pick(R, [10, 20, 8]); return Q(`(uₙ) est arithmétique : u₀ = ${u0}, raison ${sg(r)}. Calcule u${String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')}.`, u0 + n * r, null, 2, `u₀ + n × r = ${u0} + ${n} × ${r < 0 ? '(' + sg(r) + ')' : fr(r)} = ${fr(u0 + n * r)}`); };
  const nbsol = R => { const up = R() < .5, yS = pick(R, [-4, -1, 0, 2, 3]), xS = pick(R, [-1, 1, 2]); const n = yS === 0 ? 1 : (up === (yS < 0)) ? 2 : 0;
    return C(`Une parabole est tournée vers le ${up ? 'haut' : 'bas'} ; son sommet est (${sg(xS)} ; ${sg(yS)}). Nombre de solutions de f(x) = 0 ?`, ['0', '1', '2'], n, undefined, yS === 0 ? 'le sommet est sur l’axe des abscisses : 1 solution' : `tournée vers le ${up ? 'haut' : 'bas'}, sommet ${yS < 0 ? 'sous' : 'au-dessus de'} l’axe des abscisses : ${n === 2 ? 'la courbe coupe l’axe deux fois, 2 solutions' : 'la courbe ne coupe pas l’axe, 0 solution'}`); };
  const fact = R => { const a = pick(R, [2, -1, 3, -2]), x1 = pick(R, [1, 2, 4]), x2 = pick(R, [-3, -1, 5]); const f = (p, q) => `${a === -1 ? '−' : fr(a)}(x ${p < 0 ? '+ ' + fr(-p) : '− ' + fr(p)})(x ${q < 0 ? '+ ' + fr(-q) : '− ' + fr(q)})`;
    const good = f(x1, x2), bad1 = f(-x1, -x2), bad2 = `(x ${x1 < 0 ? '+' : '−'} ${fr(Math.abs(x1))})(x ${x2 < 0 ? '+' : '−'} ${fr(Math.abs(x2))})`; const ch = [good, bad1, bad2], o = int(R, 0, 2), rot = [...ch.slice(o), ...ch.slice(0, o)];
    return C(`Polynôme de degré 2 : coefficient de x² égal à ${sg(a)}, racines ${sg(x1)} et ${sg(x2)}. Sa forme factorisée ?`, rot, rot.indexOf(good), undefined, `a(x − x₁)(x − x₂) avec a = ${sg(a)}, x₁ = ${sg(x1)}, x₂ = ${sg(x2)} : ${good}`); };
  const deriv = R => { const a = pick(R, [2, 3, -1, 5]), b = pick(R, [-4, 6, 1, -3]), c = pick(R, [7, -2, 10]), x = int(R, 1, 3); return Q(`f(x) = ${poly([[a, 'x²'], [b, 'x'], [c, '']])}. Calcule f′(${x}).`, 2 * a * x + b, null, 2, `f′(x) = ${poly([[2 * a, 'x'], [b, '']])} ; f′(${x}) = ${fr(2 * a)} × ${x} ${b < 0 ? '− ' + fr(-b) : '+ ' + fr(b)} = ${fr(2 * a * x + b)}`); };
  /* ---------- prérequis des chapitres ---------- */
  const coef = R => { const t = pick(R, [3, 5, 12, 20, 1.7, 2.5]), up = R() < .7; return Q(`Une ${up ? 'hausse' : 'baisse'} de ${fr(t)} % revient à multiplier par…`, up ? 1 + t / 100 : 1 - t / 100, fr(up ? 1 + t / 100 : 1 - t / 100), 4, `1 ${up ? '+' : '−'} ${fr(t)} ÷ 100 = ${fr(up ? 1 + t / 100 : 1 - t / 100)}`); };
  const puis = R => { const k = int(R, 0, 3); if (k === 0) { const n = int(R, 3, 6); return Q(`Calcule 2${'⁰¹²³⁴⁵⁶'[n]}.`, 2 ** n, null, 2, `${Array(n).fill('2').join(' × ')} = ${2 ** n}`); } if (k === 1) { const q = pick(R, [1.1, 1.2, 0.9]); return Q(`Calcule ${fr(q)}².`, q * q, fr(rnd(q * q, 2)), 2, `${fr(q)} × ${fr(q)} = ${fr(rnd(q * q, 2))}`); } if (k === 2) { const n = int(R, 2, 4); return Q(`Calcule 10${'⁰¹²³⁴'[n]}.`, 10 ** n, null, 2, `un 1 suivi de ${n} zéros : ${fr(10 ** n)}`); } const n = int(R, 1, 3); return Q(`Calcule 10⁻${'⁰¹²³'[n]} en écriture décimale.`, 10 ** -n, fr(10 ** -n), 4, `10⁻${'⁰¹²³'[n]} = 1 ÷ 10${'⁰¹²³'[n]} = ${fr(10 ** -n)}`); };
  const cube = R => { const x = pick(R, [-3, -2, 2, 3, 0.5]); return Q(`Calcule (${sg(x)})³.`, x ** 3, fr(x ** 3), 3, `(${sg(x)}) × (${sg(x)}) × (${sg(x)}) = ${fr(x ** 3)}`); };
  const moy = R => { const a = int(R, 10, 20), b = a + pick(R, [2, 4, 6]), c = b + pick(R, [2, 4, 6]); return Q(`Moyenne de ${a}, ${b} et ${c} ?`, (a + b + c) / 3, fr(rnd((a + b + c) / 3, 2)), 2, `(${a} + ${b} + ${c}) ÷ 3 = ${a + b + c} ÷ 3 = ${fr(rnd((a + b + c) / 3, 2))}`); };
  const affine = R => { const m = pick(R, [2, 3, 1.5]), p = pick(R, [4, 10, 20]), x = int(R, 2, 6); return Q(`y = ${fr(m)}x + ${p}. Calcule y pour x = ${x}.`, m * x + p, null, 2, `y = ${fr(m)} × ${x} + ${p} = ${fr(m * x)} + ${p} = ${fr(m * x + p)}`); };
  const A = {
    c1: R => [coef(R), arith(R), puis(R), contraire(R), interet(R)],
    c2: R => [coef(R), puis(R), arith(R), incompat(R), interet(R)],
    c3: R => [cube(R), deriv(R), nbsol(R), fact(R), interet(R)],
    c4: R => [puis(R), coef(R), deriv(R), inter(R), interet(R)],
    c5: R => [moy(R), affine(R), croise(R), nbsol(R), interet(R)],
    c6: R => [contraire(R), incompat(R), reunion(R), condi(R), interet(R)],
    c7: R => [puis(R), deriv(R), fact(R), arith(R), interet(R)]
  };
  const gen = (cid, seed) => A[cid](rng(seed));
  const API = { A, gen };
  if (typeof module !== 'undefined') module.exports = API; else root.MCVA = API;
})(typeof module !== 'undefined' ? module.exports : window);
