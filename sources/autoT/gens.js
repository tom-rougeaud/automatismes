/* Maths et MCV · 1re — outils numériques communs (nombres à la française, tirage reproductible, lecture d’une réponse).
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
