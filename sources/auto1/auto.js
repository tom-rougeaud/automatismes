/* 1re — zones « ⚡ Automatismes » : 5 questions flash par chapitre, sans calculatrice.
   Elles réactivent les prérequis de 2de du chapitre ; la dernière porte toujours sur un intérêt simple ou une valeur acquise
   (automatismes spécifiques des spécialités sans physique-chimie). Tirage fixe dans le manuel, nouveau tirage dans l’appli. */
(function (root) {
  'use strict';
  const MC = typeof module !== 'undefined' ? require('./gens.js').MCVG : root.MCVG;
  const { fr, rnd, rng } = MC;
  const pick = (R, a) => a[Math.floor(R() * a.length)], int = (R, lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const Q = (t, v, a, d = 2, x) => ({ t, v, tol: .5 * Math.pow(10, -d) + 1e-9, a: a || fr(rnd(v, d)), ...(x ? { x } : {}) });
  const par = n => n < 0 ? `(− ${fr(-n)})` : fr(n);
  const eur = x => fr(rnd(x, 2), Number.isInteger(rnd(x, 2)) ? 0 : 2) + ' €';
  /* question d’intérêt simple ou de valeur acquise (spirale) */
  const interet = R => {
    const C = pick(R, [1000, 2000, 500, 4000]), t = pick(R, [2, 3, 5]), k = int(R, 0, 3);
    if (k === 0) return Q(`${fr(C)} € placés à ${t} % pendant 1 an : intérêts ?`, C * t / 100, eur(C * t / 100), 2, `${fr(C)} × ${t} ÷ 100 = ${eur(C * t / 100)}`);
    if (k === 1) return Q(`${fr(C)} € placés à ${t} % pendant 1 an : valeur acquise ?`, C * (1 + t / 100), eur(C * (1 + t / 100)), 2, `${fr(C)} + ${fr(C)} × ${t} ÷ 100 = ${fr(C)} + ${eur(C * t / 100)} = ${eur(C * (1 + t / 100))}`);
    if (k === 2) return Q(`${fr(C)} € placés à ${t} % pendant 6 mois : intérêts ?`, C * t / 200, eur(C * t / 200), 2, `6 mois = la moitié d’un an : ${fr(C)} × ${t} ÷ 100 ÷ 2 = ${eur(C * t / 200)}`);
    return Q(`Intérêts de ${fr(C)} € à ${t} % pendant 2 ans ?`, C * t / 50, eur(C * t / 50), 2, `${fr(C)} × ${t} ÷ 100 × 2 = ${eur(C * t / 100)} × 2 = ${eur(C * t / 50)}`);
  };
  const A = {
    c1: R => { const p = pick(R, [2, 3, 4, 5, 8]), m = pick(R, [3, 6, 9]), cf = pick(R, [300, 600, 900]), cv = pick(R, [2, 4, 5]), q = pick(R, [50, 100]), pc = pick(R, [10, 20, 25]), x = pick(R, [40, 80, 120]);
      return [Q(`Écris ${p} % en écriture décimale.`, p / 100, fr(p / 100), 2, `${p} % = ${p} ÷ 100 = ${fr(p / 100)}`), Q(`${m} mois, c’est combien d’années ?`, m / 12, fr(m / 12), 2, `${m} ÷ 12 = ${fr(m / 12)} an`), Q(`Calcule ${cf} + ${cv} × ${q}.`, cf + cv * q, null, 2, `on multiplie d’abord : ${cf} + ${cv * q} = ${cf + cv * q}`), Q(`Calcule ${pc} % de ${x} €.`, pc * x / 100, eur(pc * x / 100), 2, `${x} × ${pc} ÷ 100 = ${eur(pc * x / 100)}`), interet(R)]; },
    c2: R => { const a = pick(R, [2, 3, 5]), b = pick(R, [1, 4, 6]), x = int(R, 2, 6), a2 = pick(R, [2, 4]), s = int(R, 3, 7), lo = int(R, 1, 4), hi = lo + int(R, 2, 4);
      return [Q(`f(x) = ${a}x + ${b}. Calcule f(${x}).`, a * x + b, null, 2, `f(${x}) = ${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}`), Q(`Résous ${a2}x + 6 = ${a2 * s + 6}.`, s, null, 2, `${a2}x = ${a2 * s + 6} − 6 = ${a2 * s}, donc x = ${a2 * s} ÷ ${a2} = ${s}`), Q(`Combien de nombres entiers dans l’intervalle [${lo} ; ${hi}] ?`, hi - lo + 1, null, 2, `${Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).join(', ')} : ${hi} − ${lo} + 1 = ${hi - lo + 1}`), Q(`f(x) = ${a}x + ${b}. Quel est l’antécédent de ${a * s + b} ?`, s, null, 2, `${a}x + ${b} = ${a * s + b} donne ${a}x = ${a * s}, donc x = ${s}`), interet(R)]; },
    c3: R => { const n = pick(R, [2, 3, 4, 5]), c = pick(R, [1, 4, 9]), x2 = int(R, 1, 6);
      return [Q(`Calcule (− ${n})².`, n * n, null, 2, `(− ${n}) × (− ${n}) = ${n * n}`), Q(`Calcule − ${n}².`, -n * n, null, 2, `le carré porte sur ${n} seulement : − (${n} × ${n}) = − ${n * n}`), Q(`f(x) = x² − ${c}. Calcule f(0).`, -c, null, 2, `f(0) = 0² − ${c} = − ${c}`), Q(`Résous x − ${x2} = 0.`, x2, null, 2, `x = 0 + ${x2} = ${x2}`), interet(R)]; },
    c4: R => { const x1 = int(R, 0, 2), y1 = int(R, 1, 4), m = pick(R, [2, 3, -1, -2]), x0 = int(R, 2, 4), b = pick(R, [8, 10, 12]), d = pick(R, [2, 4, 5]);
      return [Q(`Une droite passe par (${x1} ; ${y1}) et (${x1 + 2} ; ${fr(y1 + 2 * m)}). Quelle est sa pente ?`, m, null, 2, `pente = (${fr(y1 + 2 * m)} − ${y1}) ÷ (${x1 + 2} − ${x1}) = ${fr(2 * m)} ÷ 2 = ${fr(m)}`), Q(`Calcule − 2 × ${x0} + ${b}.`, -2 * x0 + b, null, 2, `− ${2 * x0} + ${b} = ${fr(b - 2 * x0)}`), Q(`Résous − 2x + ${b} = 0.`, b / 2, null, 2, `− 2x = − ${b}, donc x = ${b} ÷ 2 = ${fr(b / 2)}`), Q(`Calcule 1 ÷ ${d}.`, 1 / d, fr(1 / d), 2, `1 ÷ ${d} = ${fr(1 / d)}`), interet(R)]; },
    c5: R => { const u0 = pick(R, [100, 120, 150]), r = pick(R, [5, 10, 15]), n = int(R, 3, 6), N = pick(R, [5, 10]), t = pick(R, [10, 20]);
      return [Q(`f(n) = ${u0} + ${r}n. Calcule f(${n}).`, u0 + r * n, null, 2, `${u0} + ${r} × ${n} = ${u0} + ${r * n} = ${u0 + r * n}`), Q(`Calcule 1 + 2 + 3 + … + ${N}.`, N * (N + 1) / 2, null, 2, `${N} × (1 + ${N}) ÷ 2 = ${N} × ${N + 1} ÷ 2 = ${N * (N + 1) / 2}`), Q(`Une hausse de ${t} % multiplie par combien ?`, 1 + t / 100, fr(1 + t / 100), 2, `1 + ${t} ÷ 100 = ${fr(1 + t / 100)}`), Q(`Calcule ${u0 + r * 2} − ${u0 + r}.`, r, null, 2, `${u0 + r * 2} − ${u0 + r} = ${r}`), interet(R)]; },
    c6: R => { const a = int(R, 10, 20), b = a + pick(R, [2, 4, 6]), c = b + pick(R, [2, 4, 6]), m = pick(R, [2, 3]), p = pick(R, [1, 5]), x = int(R, 2, 5), v = pick(R, [3.247, 5.682, 1.135]);
      return [Q(`Moyenne de ${a}, ${b} et ${c} ?`, (a + b + c) / 3, fr(rnd((a + b + c) / 3, 2)), 2, `(${a} + ${b} + ${c}) ÷ 3 = ${a + b + c} ÷ 3 = ${fr(rnd((a + b + c) / 3, 2))}`), Q(`y = ${m}x + ${p}. Calcule y pour x = ${x}.`, m * x + p, null, 2, `y = ${m} × ${x} + ${p} = ${m * x} + ${p} = ${m * x + p}`), Q(`y = ${m}x + ${p}. Pour quel x a-t-on y = ${m * (x + 1) + p} ?`, x + 1, null, 2, `${m}x = ${m * (x + 1) + p} − ${p} = ${m * (x + 1)}, donc x = ${m * (x + 1)} ÷ ${m} = ${x + 1}`), Q(`Arrondis ${fr(v)} au centième.`, rnd(v, 2), fr(rnd(v, 2)), 2, `chiffre des millièmes : ${String(v).slice(-1)}, ${+String(v).slice(-1) >= 5 ? 'on arrondit au-dessus' : 'on garde les centièmes'} : ${fr(rnd(v, 2))}`), interet(R)]; },
    c7: R => { const k = pick(R, [5, 10, 15, 20]), n = pick(R, [50, 100]), p = pick(R, [.35, .4, .65]), pc = pick(R, [25, 75, 5]);
      return [Q(`Écris ${k} ÷ ${n} en décimal.`, k / n, fr(k / n), 2, `${k} ÷ ${n} = ${fr(k / n)}`), Q(`Calcule 1 − ${fr(p)}.`, rnd(1 - p, 2), fr(rnd(1 - p, 2)), 2, `1 − ${fr(p)} = ${fr(rnd(1 - p, 2))}`), Q(`Écris ${pc} % en décimal.`, pc / 100, fr(pc / 100), 2, `${pc} ÷ 100 = ${fr(pc / 100)}`), Q(`Calcule 0,4 + 0,3 − 0,1.`, .6, '0,6', 2, '0,7 − 0,1 = 0,6'), interet(R)]; },
    c8: R => { const c = pick(R, [2, 3, 4, 5]), L = pick(R, [1.5, 2.5, 3]), r = pick(R, [1, 2, 3]), d = pick(R, [6, 8, 10]);
      return [Q(`Volume d’un cube de ${c} cm de côté (cm³) ?`, c * c * c, null, 2, `${c} × ${c} × ${c} = ${c * c * c} cm³`), Q(`${fr(L)} L, c’est combien de cm³ ?`, L * 1000, fr(L * 1000), 2, `1 L = 1 000 cm³ : ${fr(L)} × 1 000 = ${fr(L * 1000)} cm³`), Q(`Diamètre ${d} cm : quel est le rayon ?`, d / 2, null, 2, `${d} ÷ 2 = ${d / 2} cm`), Q(`Avec π ≈ 3, aire d’un disque de rayon ${r} cm ?`, 3 * r * r, null, 2, `π × r² ≈ 3 × ${r}² = 3 × ${r * r} = ${3 * r * r} cm²`), interet(R)]; }
  };
  const gen = (cid, seed) => A[cid](rng(seed));
  const API = { A, gen };
  if (typeof module !== 'undefined') module.exports = API; else root.MCVA = API;
})(typeof module !== 'undefined' ? module.exports : window);
