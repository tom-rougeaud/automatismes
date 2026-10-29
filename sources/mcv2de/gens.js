/* Maths et MCV · 2de — générateurs d’exercices (communs à l’appli et au manuel PDF).
   Chaque générateur reçoit un tirage R et renvoie un item :
   { q: énoncé HTML, a: réponse affichée, v: valeur numérique attendue (ou null), tol: tolérance,
     choices: [..] et ok: indice (pour un QCM) }.
   Les réponses sont toujours calculées, jamais écrites à la main. */
(function (root) {
  'use strict';
  /* ---------- nombres à la française ---------- */
  const NB = ' ', NBS = ' ';
  function rnd(x, d = 2) { const s = Math.sign(x) || 1, a = Math.abs(x); return s * Number(Math.round(Number(a.toFixed(10) + 'e' + d)) + 'e-' + d); }
  function fr(x, d = null) {
    let v = d == null ? rnd(x, 6) : rnd(x, d);
    let s = d == null ? String(v) : Math.abs(v).toFixed(d);
    if (d == null && /e/.test(s)) s = v.toFixed(6).replace(/0+$/, '');
    let [i, f] = s.replace('-', '').split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    return (v < 0 ? '−' : '') + i + (f ? ',' + f : '');
  }
  const eur = (x, d = 2) => fr(x, d) + NBS + '€';
  const pct = (x, d = null) => fr(x, d) + NBS + '%';
  const sg = t => (t > 0 ? '+' + NBS : t < 0 ? '−' + NBS : '') + pct(Math.abs(t));
  const cm = x => fr(rnd(x, 6));
  const frac = (n, d) => `<span class="fr"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
  const TOL = d => 0.5 * Math.pow(10, -d) + 1e-9;

  /* ---------- tirage reproductible ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    const R = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    R.int = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
    R.pick = arr => arr[Math.floor(R() * arr.length)];
    R.shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    R.sign = () => (R() < .5 ? -1 : 1);
    return R;
  }
  const qcm = (q, good, bads, R, a) => { let ch = R.shuffle([good, ...bads]); if (ch.length === 2 && ch.includes('oui') && ch.includes('non')) ch = ['oui', 'non']; return { q, choices: ch, ok: ch.indexOf(good), a: a || good, v: null }; };
  const num = (q, v, d, a) => ({ q, v, tol: TOL(d), a });

  const G = {};
  /* ======================= Chapitre 1 · Prix, marges et TVA ======================= */
  G.pctOf = R => { const t = R.pick([10, 20, 5, 25, 50, 75, 1, 15, 30, 12.5, 40]); const base = t === 12.5 ? 8 : t === 75 || t === 25 ? 4 : t === 15 || t === 30 ? 20 : t === 5 ? 20 : t === 1 ? 100 : 10; const v = base * R.int(2, 40); const r = rnd(v * t / 100); return num(`${fr(t)} % de ${fr(v)}`, r, 2, fr(r)); };
  G.prop = R => { const p = R.pick([5, 10, 15, 20, 25, 30, 40, 60, 75, 12.5, 2.5]); const tot = R.pick([40, 80, 120, 160, 200, 400]); const part = rnd(tot * p / 100); return num(`${fr(part)} sur ${fr(tot)}`, p, 1, pct(p)); };
  G.ecrit = R => { const t = R.pick([35, 8, 20, 125, 5.5, 2.1, 75, 60, 4, 150]); return R() < .5 ? num(`${fr(t / 100)} = …… %`, t, 2, pct(t)) : num(`${pct(t)} = …… (décimal)`, t / 100, 4, fr(t / 100)); };
  G.cmOf = R => { const t = R.sign() * R.pick([5, 8, 12, 15, 20, 25, 30, 40, 60, 2.5, 12.5, 2.1, 5.5]); const k = rnd(1 + t / 100, 4); return num(`${sg(t)} → CM =`, k, 4, cm(k)); };
  G.evolOf = R => { const t = R.sign() * R.pick([5, 10, 15, 20, 25, 30, 40, 50, 1, 0.5]); const k = rnd(1 + t / 100, 4); return num(`× ${cm(k)} → évolution (%)`, t, 2, sg(t)); };
  G.apply = R => { const t = R.sign() * R.pick([5, 10, 15, 20, 25, 30, 8, 12.5, 2.5]); const v = R.pick([R.int(4, 30) * 4, R.int(10, 90) + .9, R.int(2, 40) * 10]); const r = rnd(v * (1 + t / 100)); return num(`${fr(v)} ${sg(t)} =`, r, 2, fr(r)); };
  G.taux = R => { const t = R.sign() * R.pick([5, 10, 15, 20, 25, 30, 40, 2.5, 12]); const v0 = R.pick([20, 40, 50, 80, 120, 200, 250]); const v1 = rnd(v0 * (1 + t / 100)); return num(`de ${fr(v0)} à ${fr(v1)} : taux (%)`, t, 1, sg(t)); };
  G.succ = R => { const a = R.sign() * R.pick([10, 20, 5, 25, 30]), b = R.sign() * R.pick([10, 20, 5, 25, 50]); const k = rnd((1 + a / 100) * (1 + b / 100), 4), t = rnd((k - 1) * 100, 2); return num(`${sg(a)} puis ${sg(b)} : taux global (%)`, t, 2, t === 0 ? '0 %' : sg(t)); };
  G.depart = R => { const t = R.sign() * R.pick([10, 20, 25, 40, 5, 50]); const v0 = R.pick([40, 60, 80, 120, 200, 250, 30]); const v1 = rnd(v0 * (1 + t / 100)); return num(`après ${sg(t)} : ${fr(v1)} ; départ =`, v0, 2, fr(v0)); };
  G.ht2ttc = R => { const t = R.pick([20, 20, 10, 5.5]); const h = R.pick([R.int(2, 60) * 5, R.int(4, 40) * 2.5, R.int(10, 99)]); const r = rnd(h * (1 + t / 100)); return num(`${eur(h)} HT, TVA ${fr(t)} % → TTC`, r, 2, eur(r)); };
  G.ttc2ht = R => { const t = R.pick([20, 20, 10, 5.5]); const h = R.pick([R.int(2, 60) * 5, R.int(10, 99)]); const c = rnd(h * (1 + t / 100)); return num(`${eur(c)} TTC, TVA ${fr(t)} % → HT`, h, 2, eur(h)); };
  G.tva6 = R => { const c = 6 * R.int(2, 60); return num(`${eur(c, 0)} TTC (TVA 20 %) → TVA`, c / 6, 2, eur(c / 6, 0)); };
  G.marge = R => { const c = R.pick([10, 12, 16, 20, 25, 30, 40, 45, 50, 60]), m = R.pick([.25, .5, .75, 1, 1.5, .2]) * c, v = c + m; return R() < .5 ? num(`coût ${eur(c, 0)} HT, vente ${eur(v)} HT → taux de marge (%)`, rnd(m / c * 100, 1), 1, pct(rnd(m / c * 100, 1))) : num(`coût ${eur(c, 0)} HT, vente ${eur(v)} HT → taux de marque (%)`, rnd(m / v * 100, 1), 1, pct(rnd(m / v * 100, 1))); };
  G.og1 = R => { const v = R.pick([19.9, 29.9, 49.99, 99.9, 9.95, 199]); const t = R.pick([20, 30, 50]); const e = v * (1 - t / 100); const g = Math.round(e / (e < 20 ? 1 : 5)) * (e < 20 ? 1 : 5); const bads = [g * 10, Math.max(1, Math.round(g / 10))].map(x => eur(x, 0)); return qcm(`${eur(v)} − ${t} % ≈`, eur(g, 0), bads, R, `${eur(g, 0)} (exact : ${eur(e)})`); };

  /* ======================= Chapitre 2 · Statistique ======================= */
  const serie = (R, n, lo, hi) => Array.from({ length: n }, () => R.int(lo, hi));
  const sorted = a => a.slice().sort((x, y) => x - y);
  const med = a => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const quart = (a, k) => sorted(a)[Math.ceil(k * a.length / 4) - 1];
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length); };
  const liste = a => a.map(x => fr(x)).join(' ; ');
  G.moy = R => { const a = serie(R, R.int(5, 7), 8, 30); const m = rnd(mean(a), 1); return num(`Moyenne (au dixième) de : ${liste(a)}`, m, 1, fr(m)); };
  G.moyP = R => { const xs = R.shuffle([5, 10, 15, 20, 25, 30]).slice(0, 3).sort((x, y) => x - y), ns = xs.map(() => R.int(2, 12)); const m = rnd(xs.reduce((s, x, i) => s + x * ns[i], 0) / ns.reduce((s, x) => s + x, 0), 1); return num(`Moyenne pondérée (au dixième) : valeurs ${xs.join(' ; ')} avec les effectifs ${ns.join(' ; ')}`, m, 1, fr(m)); };
  G.med = R => { const a = serie(R, R.int(5, 8), 2, 40); const m = med(a); return num(`Médiane de : ${liste(a)}`, m, 1, fr(m)); };
  G.etendue = R => { const a = serie(R, 6, 5, 60); return num(`Étendue de : ${liste(a)}`, Math.max(...a) - Math.min(...a), 0, fr(Math.max(...a) - Math.min(...a))); };
  G.q1 = R => { const a = serie(R, R.int(7, 12), 1, 30); const q = quart(a, 1); return num(`Premier quartile Q<sub>1</sub> de : ${liste(a)}`, q, 0, fr(q)); };
  G.q3 = R => { const a = serie(R, R.int(7, 12), 1, 30); const q = quart(a, 3); return num(`Troisième quartile Q<sub>3</sub> de : ${liste(a)}`, q, 0, fr(q)); };
  G.eiq = R => { const a = serie(R, 8, 1, 30); const e = quart(a, 3) - quart(a, 1); return num(`Écart interquartile de : ${liste(a)}`, e, 0, fr(e)); };
  G.freq = R => { const n = R.pick([20, 25, 40, 50, 80, 200]), k = R.int(1, n - 1); const f = rnd(k / n * 100, 1); return num(`${k} clients sur ${n} : fréquence (%)`, f, 1, pct(f)); };
  G.angle = R => { const f = R.pick([10, 15, 20, 25, 30, 40, 45, 50, 5]); return num(`Fréquence ${pct(f)} → angle du secteur (°)`, f * 3.6, 0, fr(f * 3.6) + '°'); };
  G.sigma = R => { const a = serie(R, 5, 4, 20); const s = rnd(sd(a), 1); return num(`Écart type (calculatrice, au dixième) de : ${liste(a)}`, s, 1, fr(s)); };
  G.mode = R => { const m = R.int(1, 9), others = R.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== m)).slice(0, 4); const a = R.shuffle([m, m, m, ...others, others[0]]); return num(`Mode de : ${liste(a)}`, m, 0, fr(m)); };

  /* ======================= Chapitre 3 · Premier degré ======================= */
  const xs = R => R.pick([R.int(-9, 12), R.int(1, 20) / 2]);
  G.eq1 = R => { const a = R.pick([2, 3, 4, 5, 6, 8, 0.5, 1.5, 2.5]), x = R.int(1, 20); const b = rnd(a * x); return num(`${fr(a)}x = ${fr(b)} ; x =`, x, 2, fr(x)); };
  G.eq2 = R => { const a = R.pick([2, 3, 4, 5, -2, -3]), x = xs(R), b = R.int(-15, 15); const c = rnd(a * x + b); return num(`${fr(a)}x ${b < 0 ? '−' : '+'} ${fr(Math.abs(b))} = ${fr(c)} ; x =`, x, 2, fr(x)); };
  G.eq3 = R => { let a = R.int(2, 9), c = R.int(1, 8); if (a === c) a++; const x = R.int(-6, 10), b = R.int(-12, 12); const d = (a - c) * x + b; return num(`${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${c === 1 ? '' : c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)} ; x =`, x, 2, fr(x)); };
  G.ineq = R => { const a = R.pick([2, 3, 4, 5]), x0 = R.int(-5, 9), b = R.int(-10, 10), c = a * x0 + b, sgn = R.pick(['<', '≤', '>', '≥']); const ivl = { '<': `]−∞ ; ${fr(x0)}[`, '≤': `]−∞ ; ${fr(x0)}]`, '>': `]${fr(x0)} ; +∞[`, '≥': `[${fr(x0)} ; +∞[` }; const opp = { '<': '≥', '≤': '>', '>': '≤', '≥': '<' }; return qcm(`${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} ${sgn} ${fr(c)}`, ivl[sgn], [ivl[opp[sgn]], sgn === '<' || sgn === '>' ? ivl[sgn === '<' ? '≤' : '≥'] : ivl[sgn === '≤' ? '<' : '>']], R); };
  G.trad = R => { const p = R.int(3, 15), r = R.int(20, 60); return qcm(`Un article coûte x €. Avec ${p} € de livraison, je paie ${r} €.`, `x + ${p} = ${r}`, [`${p}x = ${r}`, `x − ${p} = ${r}`], R); };
  G.estSol = R => { const a = R.int(2, 6), x = R.int(1, 9), b = R.int(1, 12), c = a * x + b, t = R() < .5 ? x : x + R.pick([1, -1, 2]); return qcm(`${t} est-il solution de ${a}x + ${b} = ${c} ?`, t === x ? 'oui' : 'non', [t === x ? 'non' : 'oui'], R, t === x ? `oui : ${a} × ${t} + ${b} = ${c}` : `non : ${a} × ${t} + ${b} = ${a * t + b}`); };
  G.ivl = R => { const a = R.int(-5, 3), b = a + R.int(2, 9), k = R.int(0, 3); const A = fr(a), B = fr(b); const forms = [[`${A} ≤ x ≤ ${B}`, `[${A} ; ${B}]`], [`${A} < x < ${B}`, `]${A} ; ${B}[`], [`${A} ≤ x < ${B}`, `[${A} ; ${B}[`], [`${A} < x ≤ ${B}`, `]${A} ; ${B}]`]]; const [txt, good] = forms[k]; return qcm(txt, good, forms.filter((_, i) => i !== k).slice(0, 2).map(f => f[1]), R); };

  /* ======================= Chapitre 4 · Factures, réductions, intérêts ======================= */
  G.remise = R => { const m = R.int(4, 80) * 10, t = R.pick([2, 3, 5, 8, 10, 15]); const r = rnd(m * (1 - t / 100)); return num(`${eur(m, 0)} avec une remise de ${t} % → net`, r, 2, eur(r)); };
  G.remises2 = R => { const m = R.int(5, 60) * 20, a = R.pick([5, 10, 15]), b = R.pick([2, 3, 5]); const r = rnd(rnd(m * (1 - a / 100)) * (1 - b / 100)); return num(`${eur(m, 0)}, remise ${a} % puis remise ${b} % → net commercial`, r, 2, eur(r)); };
  G.factTTC = R => { const q = R.int(2, 12), pu = R.pick([4.5, 12, 18.6, 25, 7.2, 35]); const ht = rnd(q * pu), ttc = rnd(ht * 1.2); return num(`${q} articles à ${eur(pu)} HT, TVA 20 % → total TTC`, ttc, 2, eur(ttc)); };
  G.intA = R => { const C = R.int(2, 40) * 500, t = R.pick([1, 1.5, 2, 2.5, 3, 4]), n = R.int(1, 5); const I = rnd(C * t / 100 * n); return num(`Capital ${eur(C, 0)}, taux ${pct(t)} par an, ${n} an${n > 1 ? 's' : ''} → intérêts`, I, 2, eur(I)); };
  G.intM = R => { const C = R.int(2, 30) * 600, t = R.pick([1.5, 2, 3, 4]), m = R.pick([3, 6, 9, 4, 8]); const I = rnd(C * t / 100 * m / 12); return num(`${eur(C, 0)} à ${pct(t)} par an pendant ${m} mois → intérêts`, I, 2, eur(I)); };
  G.intJ = R => { const C = R.int(4, 40) * 900, t = R.pick([2, 3, 4]), j = R.pick([30, 60, 90, 45, 120, 180]); const I = rnd(C * t / 100 * j / 360); return num(`${eur(C, 0)} à ${pct(t)} par an pendant ${j} jours → intérêts`, I, 2, eur(I)); };
  G.valAc = R => { const C = R.int(2, 40) * 500, t = R.pick([1, 2, 2.5, 3]), n = R.int(1, 4); const A = rnd(C * (1 + t / 100 * n)); return num(`${eur(C, 0)} à ${pct(t)} par an pendant ${n} an${n > 1 ? 's' : ''} → valeur acquise`, A, 2, eur(A)); };
  G.tauxI = R => { const C = R.int(2, 40) * 500, t = R.pick([1, 1.5, 2, 2.5, 3, 4]), n = R.int(1, 4); const I = rnd(C * t / 100 * n); return num(`${eur(C, 0)} placés ${n} an${n > 1 ? 's' : ''} rapportent ${eur(I)} → taux annuel (%)`, t, 2, pct(t)); };
  G.dureeI = R => { const C = R.int(2, 40) * 600, t = R.pick([2, 3, 4]), m = R.pick([3, 6, 8, 9, 12, 18]); const I = rnd(C * t / 100 * m / 12); return num(`${eur(C, 0)} à ${pct(t)} par an rapportent ${eur(I)} → durée (mois)`, m, 0, m + ' mois'); };

  /* ======================= Chapitre 5 · Fonctions ======================= */
  const aff = (a, b) => `${a === 1 ? '' : a === -1 ? '−' : fr(a)}x` + (b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${fr(Math.abs(b))}`);
  G.imAff = R => { const a = R.pick([2, 3, -2, 0.5, 1.5, -4, 5]), b = R.int(-10, 10), x = R.int(-5, 8); const y = rnd(a * x + b); return num(`f(x) = ${aff(a, b)} ; f(${fr(x)}) =`, y, 2, fr(y)); };
  G.imCar = R => { const k = R.pick([1, 2, 3, 0.5, -1, -2]), x = R.int(-6, 6); const y = rnd(k * x * x); return num(`g(x) = ${k === 1 ? '' : k === -1 ? '−' : fr(k)}x² ; g(${fr(x)}) =`, y, 2, fr(y)); };
  G.antAff = R => { const a = R.pick([2, 3, 4, -2, 5]), b = R.int(-10, 10), x = R.int(-6, 9); const c = a * x + b; return num(`f(x) = ${aff(a, b)} ; antécédent de ${fr(c)} :`, x, 2, fr(x)); };
  G.coefDir = R => { const a = R.pick([2, 3, -1, -2, 0.5, 4, -3]), b = R.int(-6, 6), x1 = R.int(-3, 2), x2 = x1 + R.int(1, 5); const y1 = a * x1 + b, y2 = a * x2 + b; return num(`Droite passant par A(${fr(x1)} ; ${fr(y1)}) et B(${fr(x2)} ; ${fr(y2)}) : coefficient directeur`, a, 2, fr(a)); };
  G.ordOr = R => { const a = R.pick([2, 3, -1, -2, 4]), b = R.int(-8, 8), x1 = R.int(1, 4); const y1 = a * x1 + b; return num(`Droite de coefficient directeur ${fr(a)} passant par (${x1} ; ${fr(y1)}) : ordonnée à l’origine`, b, 2, fr(b)); };
  G.lin = R => { const k = R.pick([1.5, 2, 2.5, 3, 4, 0.8, 1.2]), x = R.int(2, 12); return num(`Proportionnalité : ${fr(x)} kg coûtent ${eur(rnd(k * x))}. Prix d’un kilo :`, k, 2, eur(k)); };
  G.sens = R => { const a = R.pick([2, 3, -1, -2, 0.5, -0.5, 4]), b = R.int(-9, 9); return qcm(`f(x) = ${aff(a, b)} : f est…`, a > 0 ? 'croissante' : 'décroissante', [a > 0 ? 'décroissante' : 'croissante', 'constante'], R, a > 0 ? `croissante (a = ${fr(a)} > 0)` : `décroissante (a = ${fr(a)} < 0)`); };
  G.appart = R => { const a = R.int(2, 5), b = R.int(-5, 5), x = R.int(-3, 6), ok = R() < .5, y = ok ? a * x + b : a * x + b + R.pick([1, -1, 2]); return qcm(`Le point (${fr(x)} ; ${fr(y)}) est-il sur la droite y = ${aff(a, b)} ?`, ok ? 'oui' : 'non', [ok ? 'non' : 'oui'], R, `${ok ? 'oui' : 'non'} : ${a} × ${x < 0 ? '(' + fr(x) + ')' : x}${b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}`} = ${fr(a * x + b)}`); };

  /* ======================= Chapitre 6 · Probabilités ======================= */
  const simp = (a, b) => { const g = (x, y) => y ? g(y, x % y) : x; const k = g(a, b); return [a / k, b / k]; };
  G.proba = R => { const n = R.pick([10, 20, 25, 40, 50, 100]), k = R.int(1, n - 1); const p = k / n; return num(`${k} tickets gagnants sur ${n} : probabilité de gagner (décimal)`, rnd(p, 4), 4, fr(rnd(p, 4))); };
  G.probaFr = R => { const n = R.pick([6, 8, 10, 12, 20]), k = R.int(1, n - 1); const [a, b] = simp(k, n); const it = num(`${n} enveloppes, dont ${k} contiennent un bon de réduction. P(bon), en % au dixième :`, rnd(k / n * 100, 1), 1, `${pct(rnd(k / n * 100, 1))} (${a}/${b})`); it.inp = fr(rnd(k / n * 100, 1)); return it; };
  G.contraire = R => { const p = R.pick([0.1, 0.15, 0.2, 0.25, 0.35, 0.4, 0.05, 0.12]); return num(`P(A) = ${fr(p)} ; P(non A) =`, rnd(1 - p, 4), 4, fr(rnd(1 - p, 4))); };
  G.freqObs = R => { const n = R.pick([50, 100, 200, 500, 1000]), k = R.int(Math.round(n * .05), Math.round(n * .6)); return num(`${k} succès sur ${n} essais : fréquence observée (décimal, au centième)`, rnd(k / n, 2), 2, fr(rnd(k / n, 2))); };
  G.denomb = R => { const a = R.int(2, 5), b = R.int(2, 5), c = R() < .5 ? 1 : R.int(2, 3); return num(`Menu : ${a} plats, ${b} desserts${c > 1 ? `, ${c} boissons` : ''}. Nombre de menus différents :`, a * b * c, 0, fr(a * b * c)); };
  G.de2 = R => { const s = R.int(2, 12); const k = 6 - Math.abs(7 - s); return num(`Deux dés : nombre d’issues donnant une somme de ${s} (sur 36)`, k, 0, fr(k)); };

  /* ======================= Chapitre 7 · Géométrie ======================= */
  const TRIP = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
  G.pytH = R => { const t = R.pick(TRIP), k = R.pick([1, 1, 2, 10]); return num(`Triangle rectangle, côtés de l’angle droit ${t[0] * k} cm et ${t[1] * k} cm : hypoténuse (cm)`, t[2] * k, 1, fr(t[2] * k) + ' cm'); };
  G.pytC = R => { const t = R.pick(TRIP); return num(`Triangle rectangle d’hypoténuse ${t[2]} cm, un côté ${t[0]} cm : autre côté (cm)`, t[1], 1, fr(t[1]) + ' cm'); };
  G.pytD = R => { const a = R.int(2, 9), b = R.int(2, 9); const h = rnd(Math.sqrt(a * a + b * b), 1); return num(`Côtés de l’angle droit ${a} m et ${b} m : hypoténuse (m, au dixième)`, h, 1, fr(h) + ' m'); };
  G.recip = R => { const t = R.pick(TRIP), ok = R() < .5, c = ok ? t[2] : t[2] + 1; return qcm(`Un triangle a pour côtés ${t[0]} ; ${t[1]} ; ${c}. Est-il rectangle ?`, ok ? 'oui' : 'non', [ok ? 'non' : 'oui'], R, `${ok ? 'oui' : 'non'} : ${t[0]}² + ${t[1]}² = ${t[0] * t[0] + t[1] * t[1]} et ${c}² = ${c * c}`); };
  G.thales = R => { const k = R.pick([2, 3, 4, 1.5, 2.5]), a = R.int(2, 8), b = R.int(2, 9); return num(`ABC triangle, M sur [AB], N sur [AC], (MN) parallèle à (BC). AM = ${fr(a)} cm, AB = ${fr(rnd(a * k))} cm, MN = ${fr(b)} cm. BC =`, rnd(b * k), 2, fr(rnd(b * k)) + ' cm'); };
  G.aireR = R => { const L = R.int(2, 15), l = R.pick([1.5, 2, 2.5, 3, 4, 0.8]); return num(`Rectangle ${fr(L)} m × ${fr(l)} m : aire (m²)`, rnd(L * l), 2, fr(rnd(L * l)) + ' m²'); };
  G.aireD = R => { const r = R.int(2, 15); const A = rnd(Math.PI * r * r, 1); return num(`Disque de rayon ${r} cm : aire (cm², au dixième)`, A, 1, fr(A) + ' cm²'); };
  G.volP = R => { const a = R.int(2, 12) * 5, b = R.int(2, 8) * 5, c = R.int(2, 8) * 5; return num(`Carton ${a} cm × ${b} cm × ${c} cm : volume (L)`, a * b * c / 1000, 3, fr(a * b * c / 1000) + ' L'); };
  G.volC = R => { const r = R.int(2, 10), h = R.int(5, 30); const V = rnd(Math.PI * r * r * h, 0); return num(`Cylindre r = ${r} cm, h = ${h} cm : volume (cm³, à l’unité)`, V, 0, fr(V) + ' cm³'); };
  G.agr = R => { const k = R.pick([2, 3, 0.5, 1.5]), what = R.pick(['aire', 'volume']); const A = R.int(2, 20) * (what === 'aire' ? 4 : 8); const r = rnd(A * (what === 'aire' ? k * k : k * k * k)); return num(`Rapport ${fr(k)} : ${what} de départ ${fr(A)} ${what === 'aire' ? 'cm²' : 'cm³'} → ${what === 'aire' ? 'nouvelle aire' : 'nouveau volume'}`, r, 2, fr(r) + (what === 'aire' ? ' cm²' : ' cm³')); };
  G.conv = R => { const t = R.pick([['dm³', 'L', 1], ['cm³', 'L', .001], ['m³', 'L', 1000], ['m²', 'cm²', 10000], ['cm²', 'm²', .0001], ['m', 'cm', 100]]); const v = R.pick([2, 5, 12, 250, 1500, 0.5]); return num(`${fr(v)} ${t[0]} = …… ${t[1]}`, rnd(v * t[2], 6), 6, fr(rnd(v * t[2], 6)) + ' ' + t[1]); };

  /* ======================= Chapitre 8 · Croisement de deux variables ======================= */
  const SC = [{ X: ['satisfaits', 'non satisfaits'], Y: ['en ligne', 'en boutique'], who: 'clients', all: 'clients' },
    { X: ['avec carte de fidélité', 'sans carte'], Y: ['en semaine', 'le samedi'], who: 'clients', all: 'clients' },
    { X: ['acheteurs', 'non-acheteurs'], Y: ['le matin', 'l’après-midi'], who: 'visiteurs', all: 'visiteurs' },
    { X: ['retournées', 'gardées'], Y: ['vêtements', 'chaussures'], who: 'commandes de', all: 'commandes' },
    { X: ['avec devis', 'sans devis'], Y: ['de moins de 35 ans', 'de 35 ans et plus'], who: 'visiteurs', all: 'visiteurs' }];
  /* une colonne : total T et une case k = p % de T (entiers) */
  const col = R => { for (;;) { const T = R.pick([40, 50, 60, 80, 100, 120, 150, 160, 200, 240, 250]), p = R.pick([15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85]); const k = T * p / 100; if (Number.isInteger(k)) return { T, p, k }; } };
  G.tcMarg = R => { const s = R.pick(SC), y = R.int(0, 1), a = R.int(12, 140), b = R.int(8, 120); return num(`${s.who} ${s.Y[y]} : ${a} ${s.X[0]} et ${b} ${s.X[1]}. Effectif marginal « ${s.Y[y]} » :`, a + b, 0, fr(a + b)); };
  G.tcCase = R => { const s = R.pick(SC), x = R.int(0, 1), a = R.int(15, 160), b = R.int(10, 140); return num(`Ligne « ${s.X[x]} » : ${a} ${s.Y[0]}, total ${a + b}. Case « ${s.X[x]}, ${s.Y[1]} » :`, b, 0, fr(b)); };
  G.tcPct = R => { const s = R.pick(SC), c = col(R), y = R.int(0, 1); return num(`N = ${fr(c.T)} ${s.all} ; ${c.p} % ${s.Y[y]}. Effectif « ${s.Y[y]} » :`, c.k, 0, fr(c.k)); };
  G.tcFreq = R => { const s = R.pick(SC), c = col(R), N = c.T * R.pick([2, 4, 5]), f = rnd(c.k / N * 100, 1); return num(`Case « ${s.X[0]}, ${s.Y[0]} » : ${fr(c.k)} ; effectif total N = ${fr(N)}. Fréquence (%, au dixième) :`, f, 1, pct(f)); };
  G.tcCond = R => { const s = R.pick(SC), c = col(R), y = R.int(0, 1); return num(`Parmi les ${fr(c.T)} ${s.who} ${s.Y[y]}, ${fr(c.k)} sont ${s.X[0]}. Fréquence conditionnelle (%) :`, c.p, 1, pct(c.p)); };
  G.tcSum = R => { for (;;) { const a = R.int(8, 45), b = R.int(5, 35), c = R.int(4, 30), d = 100 - a - b - c; if (d >= 3) return num(`Tableau de fréquences (4 cases, en %) : ${a} ; ${b} ; ${c} ; …… %`, d, 1, pct(d)); } };
  G.tcParmi = R => { for (;;) { const s = R.pick(SC), a = R.int(20, 120), b = R.int(10, 90), c = R.int(15, 110), d = R.int(10, 90); const colT = a + b, rowT = a + c, N = a + b + c + d; if (new Set([colT, rowT, N]).size < 3) continue;
    return qcm(`« Parmi les ${s.who} ${s.Y[0]}, la part des ${s.X[0]} » : on divise ${a} par…`, fr(colT), [fr(rowT), fr(N)], R, `${fr(colT)} (le total « ${s.Y[0]} »)`); } };
  G.tcCompare = R => { for (;;) { const A = col(R), B = col(R); if (Math.abs(A.p - B.p) < 5) continue; const best = A.p > B.p ? 'magasin A' : 'magasin B';
    return qcm(`Magasin A : ${fr(A.k)} acheteurs sur ${fr(A.T)} visiteurs. Magasin B : ${fr(B.k)} sur ${fr(B.T)}. Meilleur taux de transformation :`, best, [best === 'magasin A' ? 'magasin B' : 'magasin A'], R, `${best} (A : ${A.p} % ; B : ${B.p} %)`); } };

  /* ---------- vérification d’une réponse saisie ---------- */
  function parse(s) {
    if (s == null) return NaN;
    let t = String(s).trim().replace(/[\s  ]/g, '').replace(/[€%°]|cm³|cm²|m²|m³|cm|mois|kg|L$|m$/gi, '').replace('−', '-').replace(',', '.');
    if (/^[-+]?\d*\.?\d+\/\d+$/.test(t)) { const [a, b] = t.split('/'); return +a / +b; }
    return t === '' ? NaN : Number(t);
  }
  const check = (it, s) => { const x = parse(s); return Number.isFinite(x) && Math.abs(x - it.v) <= (it.tol == null ? 1e-6 : it.tol); };
  const make = (id, seed) => { const g = G[id]; if (!g) throw new Error('générateur inconnu : ' + id); return g(rng(seed)); };

  root.MCVG = { G, rng, make, check, parse, rnd, fr, eur, pct, sg, cm, frac };
})(typeof module !== 'undefined' ? module.exports : window);
