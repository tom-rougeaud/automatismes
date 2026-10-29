/* Automatismes — interface. Aucune donnée n’est envoyée : tout reste dans l’appareil. CC BY-NC 4.0 — Tom Rougeaud */
(function () {
  'use strict';
  var APP_VER = 'v1', PFX = 'automatismes_' + APP_VER + '_';
  var LINKS = { casier: 'https://tom-rougeaud.github.io/casier/', linkedin: 'https://linkedin.com/in/tomrougeaud' };
  var FONTS = [
    ['Trebuchet', '"Trebuchet MS","Nunito",Verdana,sans-serif', 'Trebuchet MS'], ['Nunito', '"Nunito",Arial,sans-serif', 'Nunito (intégrée)'], ['Arial', 'Arial,Helvetica,sans-serif', 'Arial'],
    ['Verdana', 'Verdana,Geneva,sans-serif', 'Verdana'], ['Georgia', 'Georgia,"Times New Roman",serif', 'Georgia'], ['Times', '"Times New Roman",Times,serif', 'Times New Roman'],
    ['Courier', '"Courier New",monospace', 'Courier New']
  ];
  var DEFAULT_TITLE = 'Automatismes de maths en lycée pro';
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  var esc = AUTO.esc;

  /* ───────── stockage local (essai / secours mémoire) ───────── */
  var store = (function () {
    var mem = {}, ok = false;
    try { var t = PFX + 'test'; localStorage.setItem(t, '1'); localStorage.removeItem(t); ok = true; } catch (e) { ok = false; }
    return {
      persistent: ok,
      get: function (k) { try { if (ok) { var v = localStorage.getItem(PFX + k); return v === null ? null : v; } } catch (e) { } return mem[k] === undefined ? null : mem[k]; },
      set: function (k, v) { try { if (ok) { localStorage.setItem(PFX + k, v); return; } } catch (e) { } mem[k] = v; },
      del: function (k) { try { if (ok) localStorage.removeItem(PFX + k); } catch (e) { } delete mem[k]; },
      clear: function () { try { if (ok) Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PFX) === 0) localStorage.removeItem(k); }); } catch (e) { } mem = {}; }
    };
  })();

  /* ───────── état ───────── */
  var cat, state, toastT = null;
  function defSheet() {
    return { title: DEFAULT_TITLE, subtitle: '', items: [], font: 'Trebuchet', size: 11, cols: 1, nom: true, date: true, classe: true, bw: false, content: 'feuille', expl: true, mode: 'auto', chapIds: [], seed: 1, level: '2de',
      gap: 5, heads: true, cons: true, lines: 2, intro: '', score: false, total: 20, scoreMode: 'equal', showPts: true };
  }
  function defState() { return { v: 3, tab: 'titres', view: 'compose', level: '2de', sel: {}, n: 12, mode: 'auto', sheet: defSheet(), openChaps: {} }; }
  function loadState() {
    var s = defState();
    try { var raw = store.get('state'); if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') { for (var k in s) if (o[k] !== undefined) s[k] = o[k]; s.sheet = sanitizeSheet(o.sheet) || defSheet(); if (o.v !== 3) { if (s.sheet.font === 'Nunito') s.sheet.font = 'Trebuchet'; if (s.sheet.title === 'Automatismes') s.sheet.title = DEFAULT_TITLE; s.v = 3; } } } } catch (e) { s = defState(); }
    return s;
  }
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { store.set('state', JSON.stringify(state)); } catch (e) { } }, 250); }
  function clampPts(v) { v = +v; return isFinite(v) ? Math.max(0, Math.min(100, Math.round(v * 4) / 4)) : 1; }
  function clampN(v, a, b, d) { v = +v; return isFinite(v) ? Math.max(a, Math.min(b, Math.round(v))) : d; }
  function sanitizeSheet(o) {
    if (!o || typeof o !== 'object') return null;
    var s = defSheet();
    s.title = String(o.title === undefined ? s.title : o.title).slice(0, 120); s.subtitle = String(o.subtitle || '').slice(0, 160);
    s.font = FONTS.some(function (f) { return f[0] === o.font; }) ? o.font : s.font;
    s.size = clampN(o.size, 8, 18, 11); s.cols = o.cols === 2 ? 2 : 1;
    s.nom = o.nom !== false; s.date = o.date !== false; s.classe = o.classe !== false; s.bw = !!o.bw; s.expl = o.expl !== false;
    s.content = ['feuille', 'both', 'corrige'].indexOf(o.content) >= 0 ? o.content : 'feuille';
    s.level = AUTO.isLevel(o.level) ? o.level : '2de';
    s.gap = clampN(o.gap, 0, 30, 5); s.score = !!o.score; s.total = clampN(o.total, 1, 1000, 20);
    s.heads = o.heads !== false; s.cons = o.cons !== false; s.showPts = o.showPts !== false;
    s.lines = clampN(o.lines, 1, 8, 2);
    s.scoreMode = o.scoreMode === 'custom' ? 'custom' : 'equal'; s.intro = String(o.intro || '').slice(0, 300);
    s.mode = o.mode === 'qcm' ? 'qcm' : 'auto'; s.seed = clampN(o.seed, 1, 2147483646, 1);
    s.chapIds = Array.isArray(o.chapIds) ? o.chapIds.filter(function (x) { return AUTO.isChap(s.level, x); }).slice(0, 20) : [];
    s.items = [];
    (Array.isArray(o.items) ? o.items : []).slice(0, 100).forEach(function (it) {
      if (!it || ['flash', 'mcv', 'auto'].indexOf(it.src) < 0 || typeof it.id !== 'string' || !AUTO.itemByKey(cat, AUTO.keyOf(s.level, it.src, it.id))) return;
      var seed = clampN(it.seed, 0, 4294967295, 1), over = {};
      if (it.o && typeof it.o === 'object') {
        if (typeof it.o.q === 'string') over.q = it.o.q.slice(0, 1500);
        if (typeof it.o.a === 'string') over.a = it.o.a.slice(0, 600);
        if (typeof it.o.e === 'string') over.e = it.o.e.slice(0, 1500);
        if (it.o.nofig) over.nofig = true;
      }
      var row = { src: it.src, id: it.id, seed: seed, o: over };
      if (it.gap !== undefined && it.gap !== null && isFinite(+it.gap)) row.gap = clampN(it.gap, 0, 40, 5);
      if (it.lines !== undefined && it.lines !== null && isFinite(+it.lines)) row.lines = clampN(it.lines, 1, 8, 2);
      if (it.size !== undefined && it.size !== null && isFinite(+it.size)) row.size = clampN(it.size, 8, 18, 11);
      if (typeof it.font === 'string' && FONTS.some(function (f) { return f[0] === it.font; })) row.font = it.font;
      if (it.pts !== undefined && it.pts !== null && isFinite(+it.pts)) row.pts = clampPts(it.pts);
      s.items.push(row);
    });
    return s;
  }

  /* ───────── petits utilitaires d’interface ───────── */
  function toast(msg, kind, ms) {
    var t = $('toast'); t.textContent = msg; t.className = 'toast on' + (kind ? ' ' + kind : '');
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'toast'; }, ms || 3200);
  }
  function openModal(id) { $(id).classList.add('on'); }
  function closeModal(id) { $(id).classList.remove('on'); }
  function download(name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function fontCss(key) { for (var i = 0; i < FONTS.length; i++) if (FONTS[i][0] === key) return FONTS[i][1]; return FONTS[0][1]; }
  function levelInfo(id) { return cat.levels.filter(function (l) { return l.id === id; })[0] || cat.levels[0]; }

  /* ───────── navigation ───────── */
  var VIEWS = ['compose', 'sheet', 'about', 'privacy'];
  function go(v) {
    if (v === 'sheet' && !state.sheet.items.length) { toast('Crée d’abord une feuille depuis « Composer ».', 'err'); v = 'compose'; }
    state.view = v; save(); render();
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + v); } catch (e) { }
  }
  function render() {
    VIEWS.forEach(function (v) { var e = $('v-' + v); if (e) e.hidden = (v !== state.view); });
    Array.prototype.forEach.call(document.querySelectorAll('nav.tabs button'), function (b) { if (b.dataset.go === state.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (state.view === 'compose') renderCompose();
    if (state.view === 'sheet') renderSheet();
    updateTop();
  }
  /* boutons figés dans l’en-tête : actifs seulement s’il y a une feuille ; hauteur d’en-tête exposée en CSS */
  function updateTop() {
    var has = !!(state && state.sheet && state.sheet.items.length);
    var ta = document.querySelector('.topacts'); if (ta) ta.hidden = state.view !== 'sheet';
    ['pdfBtn', 'printBtn', 'jsonBtn'].forEach(function (id) { var b = $(id); if (b) { b.disabled = !has; b.title = has ? '' : 'Compose d’abord une feuille de questions'; } });
    syncHH();
  }
  function syncHH() { var t = document.querySelector('.top'); if (t) document.documentElement.style.setProperty('--hh', t.offsetHeight + 'px'); }

  /* ───────── écran « Composer » ───────── */
  function selectedKeys() {
    var out = [];
    levelInfo(state.level).chapters.forEach(function (c) { c.items.forEach(function (it) { if (state.sel[it.key] && srcOk(it)) out.push(it.key); }); });
    return out;
  }
  function srcOk() { return true; }
  function renderCompose() {
    var lv = levelInfo(state.level), q = ($('search').value || '').toLowerCase().trim();
    var host = $('chaps'); host.innerHTML = '';
    lv.chapters.forEach(function (c) {
      var its = c.items.filter(function (it) { return srcOk(it) && (!q || (it.titre + ' ' + c.titre).toLowerCase().indexOf(q) >= 0); });
      if (!its.length) return;
      var nSel = its.filter(function (it) { return state.sel[it.key]; }).length;
      var d = el('details', 'chap'); d.dataset.chap = c.id;
      if (q || state.openChaps[c.id]) d.open = true;
      var s = el('summary'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = nSel === its.length; cb.indeterminate = nSel > 0 && nSel < its.length; cb.setAttribute('aria-label', 'Tout cocher : ' + c.titre);
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { its.forEach(function (it) { state.sel[it.key] = cb.checked; }); save(); renderCompose(); });
      s.appendChild(cb); s.appendChild(el('span', '', esc(c.titre))); s.appendChild(el('span', 'cnt', nSel + '/' + its.length));
      d.appendChild(s);
      d.addEventListener('toggle', function () { state.openChaps[c.id] = d.open; save(); });
      var box = el('div', 'items');
      its.forEach(function (it) {
        var l = el('label'); var i = el('input'); i.type = 'checkbox'; i.checked = !!state.sel[it.key];
        i.addEventListener('change', function () { state.sel[it.key] = i.checked; save(); updateCompose(); renderCompose(); });
        l.appendChild(i);
        l.appendChild(el('span', '', esc(it.titre)));
        box.appendChild(l);
      });
      d.appendChild(box); host.appendChild(d);
    });
    if (!host.children.length) host.innerHTML = '<p class="muted">Aucune notion ne correspond.</p>';
    $('n').value = state.n; $('nOut').textContent = state.n;
    $('mode').value = state.mode;
    updateCompose();
    var ch = $('levels'); ch.innerHTML = '';
    cat.levels.forEach(function (L) {
      var b = el('button', 'chip', esc(L.label)); b.type = 'button'; b.setAttribute('aria-pressed', L.id === state.level ? 'true' : 'false');
      b.addEventListener('click', function () { if (state.level === L.id) return; state.level = L.id; save(); renderCompose(); });
      ch.appendChild(b);
    });
  }
  function updateCompose() {
    var k = selectedKeys(); $('selInfo').textContent = k.length + ' notion' + (k.length > 1 ? 's' : '') + ' cochée' + (k.length > 1 ? 's' : '');
    $('create').disabled = !k.length;
  }
  function createSheet() {
    var keys = selectedKeys();
    if (!keys.length) { toast('Coche au moins une notion.', 'err'); return; }
    var seed = Math.floor(Math.random() * 2000000000) + 1;
    var items = AUTO.draw(keys, state.n, seed, cat).map(function (x) { x.o = {}; return x; });
    if (!items.length) { toast('Impossible de tirer des questions avec cette sélection.', 'err'); return; }
    var chapIds = [], lv = levelInfo(state.level);
    lv.chapters.forEach(function (c) { if (c.items.some(function (it) { return keys.indexOf(it.key) >= 0; })) chapIds.push(c.id); });
    var old = state.sheet;
    items = sortByChapter(items, state.level);
    state.sheet = sanitizeSheet({ level: state.level, heads: old.heads, cons: old.cons, lines: old.lines, intro: old.intro, gap: old.gap, score: old.score, total: old.total, scoreMode: old.scoreMode, showPts: old.showPts, title: old.title, subtitle: old.subtitle, font: old.font, size: old.size, cols: old.cols, nom: old.nom, date: old.date, classe: old.classe, bw: old.bw, content: old.content, expl: old.expl, mode: state.mode, seed: seed, chapIds: chapIds, items: items });
    state.sheet.chapIds = chapIds;
    if (!state.sheet.title || state.sheet.title === 'Automatismes') state.sheet.title = DEFAULT_TITLE;
    if (!state.sheet.subtitle && chapIds.length === 1) state.sheet.subtitle = shortTitle(chapIds[0]);
    save(); go('sheet');
  }
  function shortChap(t) { return String(t).replace(/^\d+ · /, '').replace(/ \(.*$/, ''); }
  function shortTitle(id) { var c = AUTO.chapDef(state.level, id); return c ? shortChap(c.titre) : 'Automatismes'; }
  function sortByChapter(items, level) {
    var a = items.map(function (it, k) { var c = AUTO.chapterOf(cat, level, it.src, it.id); return { it: it, k: k, r: c ? c.rang : 999 }; });
    a.sort(function (x, y) { return x.r - y.r || x.k - y.k; });
    return a.map(function (x) { return x.it; });
  }

  /* ───────── mise en page de la feuille (pages A4) ───────── */
  var LT = AUTO.LETTERS;
  function qView(it, mode) { var N = AUTO.makeQuestion(it.src, it.id, it.seed); return N ? AUTO.view(N, it.o, mode) : null; }
  function answerArea(v, lines) {
    var t = v.type, h = '';
    if (t === 'libre') {
      var h0 = '<div class="al"><span class="lab">' + (v.est ? 'Ton estimation :' : 'Réponse :') + '</span><span class="line"></span>' + (v.unit ? '<span class="un">' + AUTO.rt(v.unit) + '</span>' : '') + '</div>';
      for (var k = 1; k < (lines || 1); k++) h0 += '<div class="al2"><span class="line"></span></div>';
      return h0;
    }
    if (t === 'vf') return '<div class="vf"><span><i class="cb"></i> Vrai</span><span><i class="cb"></i> Faux</span></div>';
    if (t === 'qx') return '<div class="qxr"><span class="lt">Étape fausse :</span>' + (v.choices || []).map(function (c) { return '<span><i class="cb"></i>' + c.replace(/^Étape\s*/, '') + '</span>'; }).join('') + '</div>';
    if (t === 'qcm') {
      var long = (v.choices || []).some(function (c) { return AUTO.plain(c).length > 34; });
      return '<ul class="ch' + (long ? ' one' : '') + '">' + (v.choices || []).map(function (c, i) { return '<li><i class="cb"></i><span class="lt">' + LT[i] + '.</span><span>' + c + '</span></li>'; }).join('') + '</ul>';
    }
    if (t === 'assoc') {
      h = '<div class="as"><div class="col">' + v.L.map(function (x, i) { return '<div class="it"><span class="lt">' + (i + 1) + '</span><span>' + x + '</span></div>'; }).join('') + '</div><div class="col">' + v.R.map(function (x, i) { return '<div class="it"><span class="lt">' + LT[i] + '</span><span>' + x + '</span></div>'; }).join('') + '</div></div>';
      h += '<div class="asr">' + v.L.map(function (x, i) { return '<span>' + (i + 1) + ' → <i></i></span>'; }).join('') + '</div>';
      return h;
    }
    if (t === 'ordre') {
      return '<div class="or">' + (v.how ? '<div class="how">' + AUTO.esc(v.how) + '</div>' : '') + '<div class="its">' + v.D.map(function (x, i) { return '<span><span class="lt">' + LT[i] + '</span>' + x + '</span>'; }).join('') + '</div></div><div class="orr">Ordre :' + v.D.map(function () { return '<i></i>'; }).join('') + '</div>';
    }
    return '';
  }
  function ptsLabel(p) { var r = Math.round(p * 100) / 100; return String(r).replace('.', ',') + (r > 1 ? ' pts' : ' pt'); }
  function totalPts(S) {
    if (S.scoreMode !== 'custom') return S.total;
    var t = 0; S.items.forEach(function (it) { t += it.pts !== undefined ? it.pts : 1; }); return Math.round(t * 100) / 100;
  }
  /* réglages d’une question sur la feuille : espace, lignes de réponse, points, consigne, taille, police */
  function qOpts(S, it, v) {
    var c = AUTO.chapterOf(cat, S.level, it.src, it.id), n = S.items.length;
    var pts = S.score && S.showPts ? (S.scoreMode === 'custom' ? (it.pts !== undefined ? it.pts : 1) : S.total / Math.max(1, n)) : null;
    return { gap: it.gap !== undefined ? it.gap : S.gap, lines: it.lines !== undefined ? it.lines : S.lines, pts: pts, cons: S.cons, chap: c, size: it.size, font: it.font };
  }
  function insText(v) {
    if (v.type === 'qcm') return 'Une seule bonne réponse : coche-la.';
    if (v.type === 'vf') return 'Coche la bonne case.';
    if (v.type === 'qx') return 'Coche l’étape qui contient l’erreur.';
    if (v.type === 'assoc') return 'Écris la lettre qui correspond à chaque numéro.';
    if (v.type === 'ordre') return 'Écris les lettres dans le bon ordre.';
    if (v.type === 'libre' && v.est) return 'Estime : une valeur proche suffit.';
    return '';
  }
  function qBlock(v, i, o) {
    var kick = o.cons && v.titre ? v.titre : '', pts = o.pts !== null && o.pts !== undefined ? '(' + ptsLabel(o.pts) + ')' : '';
    var qh = kick || pts ? '<div class="qh"><span class="qk">' + esc(kick) + '</span>' + (pts ? '<span class="pts">' + pts + '</span>' : '') + '</div>' : '';
    var ins = o.cons ? insText(v) : '';
    return '<article class="qb t-' + v.type + '" data-i="' + i + '" style="margin-bottom:' + o.gap + 'mm' + (o.size ? ';font-size:' + o.size + 'pt' : '') + (o.font ? ';font-family:' + fontCss(o.font) : '') + '"><div class="qn">' + (i + 1) + '</div><div class="qc">' + qh +
      (o.cons && v.cons ? '<div class="qcn">' + esc(v.cons) + '</div>' : '') + '<div class="qt">' + v.qHtml + '</div>' + (v.figHtml ? '<div class="fig">' + v.figHtml + '</div>' : '') +
      (ins ? '<div class="ins">' + ins + '</div>' : '') + answerArea(v, o.lines) + '</div></article>';
  }
  function chapHead(S, c, prev) {
    if (!S.heads || !c || (prev && prev.id === c.id)) return '';
    return '<div class="chh"><span>Chapitre</span>' + esc(shortChap(c.titre)) + '</div>';
  }
  function corrAnswer(v) {
    if (v.type === 'qcm') return '<span class="lt">' + LT[v.ansIdx] + '.</span>' + v.choices[v.ansIdx];
    if (v.type === 'qx') return v.aHtml;
    return v.aHtml;
  }
  function corrBlock(v, i, expl, pts) {
    var qs = AUTO.plainSrc(v.qEdit); if (qs.length > 90) qs = qs.slice(0, 88) + '…';
    return '<article class="cr"><div class="qn">' + (i + 1) + '</div><div><div class="ca">' + corrAnswer(v) + (pts !== null && pts !== undefined ? ' <span class="pts">(' + ptsLabel(pts) + ')</span>' : '') + '</div><div class="qs">' + esc(qs) + '</div>' + (expl && v.eHtml ? '<span class="ex">' + v.eHtml + '</span>' : '') + '</div></article>';
  }
  function newPage(S, first, label) {
    var p = el('div', 'page' + (S.bw ? ' bw' : '') + (S.cols === 2 ? ' cols2' : ''));
    p.style.cssText = '--sf:' + fontCss(S.font) + ';--sz:' + S.size + 'pt;--cols:' + (label === 'corrige' ? Math.min(S.cols, 2) : S.cols);
    var n = S.items.length, head;
    var tt = label === 'corrige' ? 'Corrigé — ' + S.title : S.title;
    if (first) {
      var fields = '';
      if (label !== 'corrige' && (S.nom || S.date || S.classe)) fields = '<div class="fields">' + (S.nom ? '<span>Nom, prénom : <i></i></span>' : '') + (S.classe ? '<span>Classe : <i></i></span>' : '') + (S.date ? '<span>Date : <i></i></span>' : '') + '</div>';
      var sc = '';
      if (label !== 'corrige' && S.score) { var pp = S.total / Math.max(1, n); sc = '<div class="score"><div class="sl">Note</div><div class="sv"><i></i><span>/ ' + String(totalPts(S)).replace('.', ',') + '</span></div>' + (S.scoreMode === 'custom' ? '<div class="sp">barème par question</div>' : '<div class="sp">' + String(Math.round(pp * 100) / 100).replace('.', ',') + ' pt par question</div>') + '</div>'; }
      head = '<div class="ph first"><div class="band"><div class="bar"></div><div class="bt"><h1>' + AUTO.rtUser(tt) + '</h1>' + (S.subtitle ? '<div class="sub">' + AUTO.rtUser(S.subtitle) + '</div>' : '') + '<div class="meta">' + levelInfo(S.level).court + ' · ' + n + ' question' + (n > 1 ? 's' : '') + '</div></div>' + sc + '</div>' + fields + (label !== 'corrige' && S.intro ? '<div class="intro">' + AUTO.rtUser(S.intro) + '</div>' : '') + '</div>';
    } else head = '<div class="ph slim"><span>' + AUTO.rtUser(tt) + '</span><span>' + levelInfo(S.level).court + '</span></div>';
    p.innerHTML = head + '<div class="pb"></div><div class="pf"><span>Automatismes de maths en lycée pro · Tom Rougeaud · CC BY-NC 4.0</span><span class="pn"></span></div>';
    return p;
  }
  function overflow(pb) { return pb.scrollHeight > pb.clientHeight + 1 || pb.scrollWidth > pb.clientWidth + 1; }
  function paginate(S, blocks, label, out) {
    var m = $('measure'), page = newPage(S, true, label); m.appendChild(page); var pb = page.querySelector('.pb');
    blocks.forEach(function (html) {
      var t = document.createElement('div'); t.innerHTML = html; var b = t.firstChild; pb.appendChild(b);
      if (overflow(pb) && pb.children.length > 1) {
        pb.removeChild(b); out.push(page); page = newPage(S, false, label); m.appendChild(page); pb = page.querySelector('.pb'); pb.appendChild(b);
      }
    });
    out.push(page);
  }
  /* construit toutes les pages d’une feuille (tableau d’éléments .page, chez #measure) */
  function buildPages(S, content) {
    $('measure').innerHTML = '';
    var pages = [], blocks = [], cblocks = [], prev = null;
    S.items.forEach(function (it, k) {
      var v = qView(it, S.mode); if (!v) return;
      var o = qOpts(S, it, v), h = chapHead(S, o.chap, prev), i = blocks.length; prev = o.chap || prev;
      var wrap = function (x) { return h ? '<div class="qw">' + h + x + '</div>' : x; };
      blocks.push(wrap(qBlock(v, i, o)));
      cblocks.push(wrap(corrBlock(v, i, S.expl, S.score && S.showPts ? (S.scoreMode === 'custom' ? (it.pts !== undefined ? it.pts : 1) : S.total / Math.max(1, S.items.length)) : null)));
    });
    if (content !== 'corrige') paginate(S, blocks, 'sujet', pages);
    if (content !== 'feuille') paginate(S, cblocks, 'corrige', pages);
    var code = S.seed.toString(36).toUpperCase();
    pages.forEach(function (p, i) { p.querySelector('.pn').textContent = 'Feuille ' + code + ' · page ' + (i + 1) + ' / ' + pages.length; });
    return pages;
  }
  function currentName(suffix) { return AUTO.fileName(state.sheet.level, state.sheet.chapIds, state.sheet.items.length, suffix); }
  function contentSuffix(c) { return c === 'corrige' ? '_corrige' : c === 'both' ? '_avec-corrige' : ''; }

  /* ───────── écran « Ma feuille » ───────── */
  var prevT = null;
  function renderSheet() {
    var S = state.sheet;
    $('sTitle').value = S.title; $('sSub').value = S.subtitle; $('sFont').value = S.font; $('sSize').value = S.size; $('sSizeOut').textContent = S.size + ' pt';
    $('sCols').value = String(S.cols); $('sNom').checked = S.nom; $('sDate').checked = S.date; $('sClasse').checked = S.classe; $('sBw').checked = S.bw;
    $('sGap').value = S.gap; $('sGapOut').textContent = S.gap + ' mm'; $('sLines').value = String(S.lines);
    $('sScore').checked = S.score; $('sScoreMode').value = S.scoreMode; $('sShowPts').checked = S.showPts; syncScoreUi();
    $('sHeads').checked = S.heads; $('sCons').checked = S.cons; $('sIntro').value = S.intro;
    $('sContent').value = S.content; $('sExpl').checked = S.expl; $('sMode').value = S.mode;
    $('fileInfo').textContent = currentName(contentSuffix(S.content));
    showTab(state.tab || 'titres');
    renderList(); renderPreview();
  }
  var TABS = ['titres', 'police', 'espace', 'bareme', 'questions', 'fichier'];
  function showTab(t) {
    if (TABS.indexOf(t) < 0) t = 'titres'; state.tab = t;
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar button'), function (b) { b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('.tabpanel'), function (p) { p.hidden = p.dataset.panel !== t; });
    save();
  }
  function itemPts(S, it) { return S.scoreMode === 'custom' ? (it.pts !== undefined ? it.pts : 1) : Math.round(S.total / Math.max(1, S.items.length) * 100) / 100; }
  function syncScoreUi() {
    var S = state.sheet; $('sScoreMode').disabled = !S.score; $('sShowPts').disabled = !S.score;
    $('sTotal').disabled = !S.score || S.scoreMode === 'custom';
    $('sTotal').value = S.scoreMode === 'custom' ? totalPts(S) : S.total;
    $('ptsEqual').disabled = !S.score; $('ptsOne').disabled = !S.score;
    $('ptsHint').textContent = !S.score ? 'Active l’encart de notation (case ci-dessus) pour régler les points.' : S.scoreMode === 'custom' ? 'Barème différencié : le total de l’encart est la somme des points.' : 'Barème identique. Change les points d’une question pour passer en barème différencié.';
    renderPtsTable();
  }
  function renderPtsTable() {
    var S = state.sheet, host = $('ptsTable'); host.innerHTML = '';
    if (!S.score) return;
    S.items.forEach(function (it, i) {
      var v = qView(it, S.mode); if (!v) return; var txt = AUTO.plainSrc(v.qEdit); if (txt.length > 46) txt = txt.slice(0, 44) + '…';
      var r = el('div', 'ptsrow'); r.innerHTML = '<b>' + (i + 1) + '</b><span title="' + esc(txt) + '">' + esc(txt) + '</span><input type="number" class="ptin" min="0" max="100" step="0.25" value="' + itemPts(S, it) + '" data-i="' + i + '" aria-label="Points de la question ' + (i + 1) + '">';
      host.appendChild(r);
    });
    var t = el('div', 'ptstot', '<span>Total</span><span>' + String(totalPts(S)).replace('.', ',') + ' pts</span>'); host.appendChild(t);
  }
  /* modifie les points d’une question ; en barème identique, passe d’abord en barème différencié */
  function setPts(i, val) {
    var S = state.sheet, it = S.items[i]; if (!it) return;
    if (S.scoreMode !== 'custom') {
      var share = Math.max(0, Math.round(S.total / Math.max(1, S.items.length) * 4) / 4);
      S.items.forEach(function (x) { x.pts = share; }); S.scoreMode = 'custom'; $('sScoreMode').value = 'custom';
      toast('Barème différencié activé : le total de l’encart est maintenant la somme des points.', 'ok', 4200);
    }
    it.pts = clampPts(val);
  }
  function renderList() {
    var S = state.sheet, ul = $('qlist'); ul.innerHTML = '';
    S.items.forEach(function (it, i) {
      var v = qView(it, S.mode); if (!v) return;
      var li = el('li', 'qcard'); li.draggable = true; li.dataset.i = i;
      var txt = AUTO.plainSrc(v.qEdit); if (txt.length > 120) txt = txt.slice(0, 118) + '…';
      var edited = it.o && Object.keys(it.o).length ? ' · modifiée' : '';
      li.innerHTML = '<div class="num" title="Glisser pour déplacer">' + (i + 1) + '</div><div class="tx"><b>' + esc(v.titre || 'Question') + edited + ' · espace ' + (it.gap !== undefined ? it.gap : S.gap) + ' mm' + (it.gap !== undefined ? ' (perso)' : '') + '</b><span>' + esc(txt) + '</span></div>' +
        '<div class="acts">' + (S.score ? '<label class="ptl" title="Points de cette question">Points <input type="number" class="ptin" min="0" max="100" step="0.25" value="' + itemPts(S, it) + '" data-i="' + i + '" aria-label="Points de la question ' + (i + 1) + '"></label>' : '') +
        '<button class="ib gapb" data-a="gapm" title="Réduire l’espace sous cette question" aria-label="Réduire l’espace sous la question ' + (i + 1) + '">⇕−</button><button class="ib gapb" data-a="gapp" title="Augmenter l’espace sous cette question" aria-label="Augmenter l’espace sous la question ' + (i + 1) + '">⇕+</button>' +
        '<button class="ib" data-a="up" title="Monter" aria-label="Monter la question ' + (i + 1) + '"' + (i === 0 ? ' disabled' : '') + '>↑</button><button class="ib" data-a="down" title="Descendre" aria-label="Descendre la question ' + (i + 1) + '"' + (i === S.items.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button class="ib" data-a="edit" title="Modifier" aria-label="Modifier la question ' + (i + 1) + '">✎</button><button class="ib" data-a="redo" title="Autre question de la même notion" aria-label="Retirer la question ' + (i + 1) + '">↻</button><button class="ib" data-a="del" title="Supprimer" aria-label="Supprimer la question ' + (i + 1) + '">🗑</button></div>';
      ul.appendChild(li);
    });
    $('count').textContent = S.items.length + ' question' + (S.items.length > 1 ? 's' : '');
    renderPtsTable(); updateTop();
  }
  function schedulePreview() { clearTimeout(prevT); prevT = setTimeout(function () { renderPreview(); $('fileInfo').textContent = currentName(contentSuffix(state.sheet.content)); }, 160); save(); }
  function fitScale(box) { var w = box.clientWidth - 8; var px = 210 * 96 / 25.4; return Math.max(0.25, Math.min(1, w / px)); }
  function renderPreview() {
    var S = state.sheet, host = $('pages');
    host.innerHTML = '';
    var go2 = function () {
      var pages = buildPages(S, 'both'); /* aperçu : toujours feuille + corrigé, repérés */
      var box = $('preview'), z = fitScale(box), pxW = 210 * 96 / 25.4, pxH = 297 * 96 / 25.4;
      pages.forEach(function (p) {
        var w = el('div', 'pgwrap'); w.style.width = Math.round(pxW * z) + 'px'; w.style.height = Math.round(pxH * z) + 'px';
        p.style.transform = 'scale(' + z + ')'; w.appendChild(p); host.appendChild(w);
      });
      $('pgInfo').textContent = pages.length + ' page' + (pages.length > 1 ? 's' : '') + ' au total (feuille + corrigé)';
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go2, go2); else go2();
  }
  function move(i, j) { var a = state.sheet.items; if (j < 0 || j >= a.length) return; var t = a.splice(i, 1)[0]; a.splice(j, 0, t); save(); renderList(); renderPreview(); }

  /* édition d’une question : l’aperçu de la feuille se met à jour pendant la frappe */
  var editIdx = -1, editBackup = null, liveT = null;
  function openEdit(i) {
    var S = state.sheet, it = S.items[i], v = qView(it, S.mode); if (!v) return; editIdx = i; editBackup = JSON.stringify(it);
    $('eQ').value = v.qEdit; $('eA').value = v.aEdit; $('eE').value = v.eEdit; $('eFig').checked = !!(it.o && it.o.nofig); $('eFigRow').hidden = !v.hasFig;
    var o = qOpts(S, it, v);
    $('eGapAuto').checked = it.gap === undefined; $('eGap').value = o.gap; $('eGap').disabled = it.gap === undefined; $('eGapOut').textContent = o.gap + ' mm';
    $('eLinesAuto').checked = it.lines === undefined; $('eLines').value = o.lines; $('eLines').disabled = it.lines === undefined; $('eLinesOut').textContent = String(o.lines);
    $('eSizeAuto').checked = it.size === undefined; $('eSize').value = it.size !== undefined ? it.size : S.size; $('eSize').disabled = it.size === undefined; $('eSizeOut').textContent = $('eSize').value + ' pt';
    $('eFontAuto').checked = it.font === undefined; $('eFont').value = it.font !== undefined ? it.font : S.font; $('eFont').disabled = it.font === undefined;
    $('ePtsRow').hidden = !S.score; $('ePts').value = itemPts(S, it);
    $('ePtsHint').textContent = S.scoreMode === 'custom' ? 'Barème différencié.' : 'En changeant ce nombre, le barème devient différencié (les autres questions gardent leur part équitable).';
    $('eNum').textContent = String(i + 1);
    $('mEdit').classList.toggle('side', window.innerWidth >= 1100);
    updateEPrev(); openModal('mEdit'); setTimeout(function () { $('eQ').focus(); }, 30);
  }
  function readEdit() {
    var S = state.sheet, it = S.items[editIdx]; if (!it) return null;
    var N = AUTO.makeQuestion(it.src, it.id, it.seed), base = AUTO.view(N, null, S.mode), o = {};
    var q = $('eQ').value.slice(0, 1500), a = $('eA').value.slice(0, 600), e = $('eE').value.slice(0, 1500);
    if (q !== base.qEdit) o.q = q; if (a !== base.aEdit) o.a = a; if (e !== base.eEdit) o.e = e; if ($('eFig').checked) o.nofig = true;
    it.o = o;
    if ($('eGapAuto').checked) delete it.gap; else it.gap = clampN($('eGap').value, 0, 40, 5);
    if ($('eLinesAuto').checked) delete it.lines; else it.lines = clampN($('eLines').value, 1, 8, 2);
    if ($('eSizeAuto').checked) delete it.size; else it.size = clampN($('eSize').value, 8, 18, 11);
    if ($('eFontAuto').checked) delete it.font; else it.font = $('eFont').value;
    if (S.score) { var cur = itemPts(S, it), nv = clampPts($('ePts').value); if (S.scoreMode === 'custom' || Math.abs(nv - cur) > 0.001) setPts(editIdx, nv); }
    return it;
  }
  function updateEPrev() {
    var S = state.sheet, it = S.items[editIdx], host = $('ePrev'); if (!it || !host) return;
    var v = qView(it, S.mode); if (!v) return; var o = qOpts(S, it, v);
    var p = el('div', 'page mini' + (S.bw ? ' bw' : '') + (S.cols === 2 ? ' cols2' : '')); p.style.cssText = '--sf:' + fontCss(S.font) + ';--sz:' + S.size + 'pt';
    p.innerHTML = qBlock(v, editIdx, o) + '<div class="sep">Corrigé</div>' + corrBlock(v, editIdx, true, o.pts);
    host.innerHTML = ''; host.appendChild(p);
  }
  function liveEdit() {
    if (!readEdit()) return; updateEPrev(); clearTimeout(liveT);
    liveT = setTimeout(function () { renderList(); renderPreview(); setTimeout(function () { var q = document.querySelector('#pages article.qb[data-i="' + editIdx + '"]'); if (q && $('mEdit').classList.contains('side') && q.scrollIntoView) { try { q.scrollIntoView({ block: 'nearest' }); } catch (x) { } } }, 80); }, 300);
  }
  function saveEdit() { clearTimeout(liveT); readEdit(); editIdx = -1; editBackup = null; save(); closeModal('mEdit'); renderList(); renderPreview(); }
  function cancelEdit() {
    clearTimeout(liveT);
    if (editIdx >= 0 && editBackup) { try { state.sheet.items[editIdx] = JSON.parse(editBackup); } catch (e) { } }
    editIdx = -1; editBackup = null; closeModal('mEdit'); renderList(); renderPreview();
  }
  function resetEdit() { clearTimeout(liveT); var it = state.sheet.items[editIdx]; if (it) it.o = {}; editIdx = -1; editBackup = null; save(); closeModal('mEdit'); renderList(); renderPreview(); }

  function redo(i) {
    var S = state.sheet, it = S.items[i], used = {};
    S.items.forEach(function (x, k) { if (k !== i) { var N = AUTO.makeQuestion(x.src, x.id, x.seed); if (N) used[AUTO.signature(N)] = 1; } });
    for (var k = 1; k < 40; k++) {
      var seed = (it.seed + k * 104729 + Math.floor(Math.random() * 1e6)) >>> 0, N2 = AUTO.makeQuestion(it.src, it.id, seed);
      if (N2 && !used[AUTO.signature(N2)]) { S.items[i] = { src: it.src, id: it.id, seed: seed, o: {} }; ['gap', 'lines', 'size', 'font', 'pts'].forEach(function (k) { if (it[k] !== undefined) S.items[i][k] = it[k]; }); save(); renderList(); renderPreview(); return; }
    }
    toast('Cette notion n’a pas d’autre question différente.', 'err');
  }
  function addOne() {
    var S = state.sheet, keys = selectedKeys();
    if (!keys.length) { var lv = levelInfo(S.level); lv.chapters.forEach(function (c) { c.items.forEach(function (it) { if (S.chapIds.indexOf(c.id) >= 0) keys.push(it.key); }); }); }
    if (S.items.length >= 100) { toast('100 questions au maximum par feuille.', 'err'); return; }
    var used = {}; S.items.forEach(function (x) { var N = AUTO.makeQuestion(x.src, x.id, x.seed); if (N) used[AUTO.signature(N)] = 1; });
    var add = AUTO.draw(keys, 1, Math.floor(Math.random() * 2000000000) + 1, cat, used);
    if (!add.length) { toast('Aucune nouvelle question disponible avec cette sélection.', 'err'); return; }
    add[0].o = {}; S.items.push(add[0]); save(); renderList(); renderPreview(); $('fileInfo').textContent = currentName(contentSuffix(S.content));
  }
  function redrawAll() {
    var S = state.sheet, keys = [], seen = {};
    S.items.forEach(function (x) { var k = AUTO.keyOf(S.level, x.src, x.id); if (!seen[k]) { seen[k] = 1; keys.push(k); } });
    var seed = Math.floor(Math.random() * 2000000000) + 1;
    var items = sortByChapter(AUTO.draw(keys, S.items.length, seed, cat).map(function (x) { x.o = {}; return x; }), S.level);
    if (!items.length) return; S.items = items; S.seed = seed; save(); renderSheet();
  }

  /* ───────── impression ───────── */
  function printSheet(content) {
    var S = state.sheet; if (!S.items.length) return;
    var run = function () {
      var pages = buildPages(S, content), root = $('printRoot'); root.innerHTML = '';
      pages.forEach(function (p) { root.appendChild(p); });
      var oldTitle = document.title; document.title = currentName(contentSuffix(content)).replace(/\.pdf$/, '');
      var after = function () { document.title = oldTitle; root.innerHTML = ''; window.removeEventListener('afterprint', after); };
      window.addEventListener('afterprint', after);
      setTimeout(function () { window.print(); }, 60);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run, run); else run();
  }

  /* ───────── export PDF (pages A4 en images nettes, sans bibliothèque) ───────── */
  function cssText() { return ['css-fonts', 'css-sheet'].map(function (id) { return $(id).textContent; }).join('\n'); }
  function blobToDataURL(b) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); }); }
  function rasterize(page, scale) {
    return new Promise(function (resolve, reject) {
      var W = Math.round(210 * 96 / 25.4), H = Math.round(297 * 96 / 25.4);
      var clone = page.cloneNode(true); clone.style.transform = 'none';
      var xml = new XMLSerializer().serializeToString(clone);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '"><div xmlns="http://www.w3.org/1999/xhtml"><style>' + cssText().replace(/<\/style/gi, '<\\/style') + '</style>' + xml + '</div></foreignObject></svg>';
      var bytes = new TextEncoder().encode(svg), bin = '';
      for (var o = 0; o < bytes.length; o += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(o, o + 8192));
      var url = 'data:image/svg+xml;base64,' + btoa(bin), img = new Image(); /* adresse data: (une adresse blob: « salit » le canevas) */
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = Math.round(W * scale); c.height = Math.round(H * scale);
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { if (!b) { reject(new Error('Image vide')); return; } b.arrayBuffer().then(function (ab) { resolve({ jpg: new Uint8Array(ab), w: c.width, h: c.height }); }, reject); }, 'image/jpeg', 0.92);
        } catch (e) { reject(e); }
      };
      img.onerror = function () { reject(new Error('Rendu impossible')); };
      img.src = url;
    });
  }
  /* écrit un PDF minimal : une image JPEG par page A4 */
  function makePdf(imgs, title) {
    var enc = new TextEncoder(), chunks = [], off = 0, xref = [];
    function put(x) { var b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); off += b.length; }
    function obj(n, body) { xref[n] = off; put(n + ' 0 obj\n' + body + '\nendobj\n'); }
    var PW = 595.28, PH = 841.89, n = imgs.length;
    put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    var kids = []; for (var i = 0; i < n; i++) kids.push((5 + i * 3) + ' 0 R');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>');
    var t = title.replace(/[^\x20-\x7E]/g, '?').replace(/([()\\])/g, '\\$1');
    obj(3, '<< /Title (' + t + ') /Producer (Automatismes) /Author (Tom Rougeaud) >>');
    obj(4, '<< /Type /ProcSet >>'.replace('/Type /ProcSet', '/ProcSet [/PDF /ImageC]'));
    imgs.forEach(function (im, i) {
      var pn = 5 + i * 3, cn = pn + 1, xn = pn + 2, content = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q';
      obj(pn, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + xn + ' 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ' + cn + ' 0 R >>');
      obj(cn, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
      xref[xn] = off; put(xn + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.jpg.length + ' >>\nstream\n'); put(im.jpg); put('\nendstream\nendobj\n');
    });
    var total = 5 + n * 3, xs = off; var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) x += ('0000000000' + (xref[k] || 0)).slice(-10) + ' 00000 n \n';
    put(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xs + '\n%%EOF\n');
    return new Blob(chunks, { type: 'application/pdf' });
  }
  var pdfBusy = false;
  function exportPdf(content) {
    if (pdfBusy) return; var S = state.sheet; if (!S.items.length) return; pdfBusy = true;
    toast('Création du PDF…', '', 20000);
    var run = function () {
      var pages = buildPages(S, content), out = [], i = 0, name = currentName(contentSuffix(content));
      (function next() {
        if (i >= pages.length) { download(name, makePdf(out, name.replace(/\.pdf$/, ''))); toast('PDF enregistré : ' + name, 'ok', 4500); pdfBusy = false; return; }
        $('toast').textContent = 'Création du PDF… page ' + (i + 1) + ' / ' + pages.length;
        rasterize(pages[i], 2).then(function (im) { out.push(im); i++; setTimeout(next, 10); }, function (e) {
          pdfBusy = false; toast('Le PDF n’a pas pu être créé sur cet appareil. Utilise « Imprimer » puis « Enregistrer au format PDF ».', 'err', 7000);
        });
      })();
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run, run); else run();
  }

  /* ───────── export / import de la feuille ───────── */
  function exportJson() {
    var S = state.sheet, o = { app: 'automatismes', version: 1, sheet: S };
    download(currentName('').replace(/\.pdf$/, '.json'), new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }));
  }
  function importJson(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var o = JSON.parse(String(r.result)); if (!o || o.app !== 'automatismes' || !o.sheet) throw new Error('format');
        var s = sanitizeSheet(o.sheet); if (!s || !s.items.length) throw new Error('vide');
        state.sheet = s; save(); go('sheet'); toast('Feuille importée (' + s.items.length + ' questions).', 'ok');
      } catch (e) { toast('Ce fichier n’est pas une feuille Automatismes valide.', 'err', 5000); }
    };
    r.readAsText(file);
  }
  function clearAll() {
    if (!window.confirm('Effacer la feuille en cours et tous les réglages enregistrés sur cet appareil ?')) return;
    store.clear(); state = defState(); go('compose'); toast('Données effacées de cet appareil.', 'ok');
  }

  /* ───────── installation (PWA) ───────── */
  var deferredPrompt = null;
  function setupInstall() {
    var box = $('install'), isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
    if (standalone) return;
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; box.classList.add('on'); $('installTxt').textContent = 'Installe Automatismes sur ton écran d’accueil pour l’ouvrir comme une appli, même sans connexion.'; $('installBtn').hidden = false; });
    if (isIos) { box.classList.add('on'); $('installTxt').innerHTML = 'Pour l’installer sur iPhone ou iPad : touche <b>Partager</b> (le carré avec la flèche), puis <b>Sur l’écran d’accueil</b>.'; $('installBtn').hidden = true; }
    $('installBtn').addEventListener('click', function () { if (!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; box.classList.remove('on'); }); });
    $('installClose').addEventListener('click', function () { box.classList.remove('on'); });
    window.addEventListener('appinstalled', function () { box.classList.remove('on'); });
    try { if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href.split('/').slice(0, 3).join('/'))) navigator.serviceWorker.register('sw.js').catch(function () { }); } catch (e) { }
  }

  /* ───────── branchement des événements ───────── */
  function bind() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function (e) { e.preventDefault(); go(b.dataset.go); }); });
    $('search').addEventListener('input', renderCompose);
    $('n').addEventListener('input', function () { state.n = +this.value; $('nOut').textContent = this.value; save(); });
    $('mode').addEventListener('change', function () { state.mode = this.value; save(); });
    $('allOn').addEventListener('click', function () { levelInfo(state.level).chapters.forEach(function (c) { c.items.forEach(function (it) { if (srcOk(it)) state.sel[it.key] = true; }); }); save(); renderCompose(); });
    $('allOff').addEventListener('click', function () { state.sel = {}; save(); renderCompose(); });
    $('surprise').addEventListener('click', function () {
      var chs = levelInfo(state.level).chapters.filter(function (c) { return c.items.some(srcOk); }); state.sel = {};
      var r = AUTO.mulberry32(Math.floor(Math.random() * 2e9)), pool = AUTO.shuffle(r, chs).slice(0, 3);
      pool.forEach(function (c) { AUTO.shuffle(r, c.items.filter(srcOk)).slice(0, 4).forEach(function (it) { state.sel[it.key] = true; }); });
      save(); renderCompose();
    });
    $('create').addEventListener('click', createSheet);
    /* feuille */
    function bindS(id, key, conv, evt) { $(id).addEventListener(evt || 'input', function () { state.sheet[key] = conv(this); schedulePreview(); }); }
    bindS('sTitle', 'title', function (e) { return e.value.slice(0, 120); }); bindS('sSub', 'subtitle', function (e) { return e.value.slice(0, 160); });
    bindS('sFont', 'font', function (e) { return e.value; }, 'change');
    $('sSize').addEventListener('input', function () { state.sheet.size = +this.value; $('sSizeOut').textContent = this.value + ' pt'; schedulePreview(); });
    bindS('sCols', 'cols', function (e) { return +e.value === 2 ? 2 : 1; }, 'change');
    bindS('sNom', 'nom', function (e) { return e.checked; }, 'change'); bindS('sDate', 'date', function (e) { return e.checked; }, 'change'); bindS('sClasse', 'classe', function (e) { return e.checked; }, 'change');
    bindS('sBw', 'bw', function (e) { return e.checked; }, 'change'); bindS('sExpl', 'expl', function (e) { return e.checked; }, 'change');
    bindS('sContent', 'content', function (e) { return e.value; }, 'change');
    $('sGap').addEventListener('input', function () { state.sheet.gap = clampN(this.value, 0, 30, 5); $('sGapOut').textContent = state.sheet.gap + ' mm'; renderList(); schedulePreview(); });
    $('sScore').addEventListener('change', function () { state.sheet.score = this.checked; syncScoreUi(); renderList(); schedulePreview(); });
    $('sScoreMode').addEventListener('change', function () { state.sheet.scoreMode = this.value === 'custom' ? 'custom' : 'equal'; syncScoreUi(); renderList(); schedulePreview(); });
    $('sShowPts').addEventListener('change', function () { state.sheet.showPts = this.checked; schedulePreview(); });
    $('sHeads').addEventListener('change', function () { state.sheet.heads = this.checked; schedulePreview(); });
    $('sCons').addEventListener('change', function () { state.sheet.cons = this.checked; schedulePreview(); });
    $('sLines').addEventListener('change', function () { state.sheet.lines = clampN(this.value, 1, 8, 2); schedulePreview(); });
    $('sIntro').addEventListener('input', function () { state.sheet.intro = this.value.slice(0, 300); schedulePreview(); });
    function ptsChange(e) {
      var t = e.target; if (!t.classList || !t.classList.contains('ptin')) return;
      setPts(+t.dataset.i, t.value); save(); syncScoreUi(); Array.prototype.forEach.call(document.querySelectorAll('#qlist .ptin'), function (x) { x.value = itemPts(state.sheet, state.sheet.items[+x.dataset.i]); }); schedulePreview();
    }
    $('qlist').addEventListener('change', ptsChange); $('ptsTable').addEventListener('change', ptsChange);
    $('ptsEqual').addEventListener('click', function () { var S = state.sheet; S.scoreMode = 'equal'; S.items.forEach(function (x) { delete x.pts; }); $('sScoreMode').value = 'equal'; syncScoreUi(); renderList(); schedulePreview(); });
    $('ptsOne').addEventListener('click', function () { var S = state.sheet; S.scoreMode = 'custom'; S.items.forEach(function (x) { x.pts = 1; }); $('sScoreMode').value = 'custom'; syncScoreUi(); renderList(); schedulePreview(); });
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar button'), function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
    $('sTotal').addEventListener('input', function () { var v = Math.round(+this.value); if (isFinite(v) && v >= 1) { state.sheet.total = Math.min(1000, v); schedulePreview(); } });
    $('sMode').addEventListener('change', function () { state.sheet.mode = this.value === 'qcm' ? 'qcm' : 'auto'; save(); renderList(); schedulePreview(); });
    $('qlist').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return; var i = +b.closest('li').dataset.i, a = b.dataset.a;
      if (a === 'up') move(i, i - 1); else if (a === 'down') move(i, i + 1); else if (a === 'edit') openEdit(i); else if (a === 'redo') redo(i);
      else if (a === 'gapm' || a === 'gapp') { var itx = state.sheet.items[i], cur = itx.gap !== undefined ? itx.gap : state.sheet.gap; itx.gap = clampN(cur + (a === 'gapp' ? 3 : -3), 0, 40, cur); save(); renderList(); renderPreview(); }
      else if (a === 'del') { state.sheet.items.splice(i, 1); save(); if (!state.sheet.items.length) go('compose'); else { renderList(); renderPreview(); } }
    });
    var dragFrom = -1;
    $('qlist').addEventListener('dragstart', function (e) { var li = e.target.closest('li'); if (!li) return; dragFrom = +li.dataset.i; li.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (x) { } });
    $('qlist').addEventListener('dragend', function () { dragFrom = -1; Array.prototype.forEach.call(document.querySelectorAll('.qcard'), function (x) { x.classList.remove('drag', 'over'); }); });
    $('qlist').addEventListener('dragover', function (e) { var li = e.target.closest('li'); if (!li || dragFrom < 0) return; e.preventDefault(); Array.prototype.forEach.call(document.querySelectorAll('.qcard'), function (x) { x.classList.remove('over'); }); li.classList.add('over'); });
    $('qlist').addEventListener('drop', function (e) { var li = e.target.closest('li'); if (!li || dragFrom < 0) return; e.preventDefault(); var to = +li.dataset.i, from = dragFrom; dragFrom = -1; move(from, to); });
    $('addOne').addEventListener('click', addOne); $('redrawAll').addEventListener('click', redrawAll);
    $('pdfBtn').addEventListener('click', function () { exportPdf(state.sheet.content); });
    $('printBtn').addEventListener('click', function () { printSheet(state.sheet.content); });
    $('jsonBtn').addEventListener('click', exportJson);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function () { if (this.files && this.files[0]) importJson(this.files[0]); this.value = ''; });
    $('clearBtn').addEventListener('click', clearAll); $('clearBtn2').addEventListener('click', clearAll);
    $('eSave').addEventListener('click', saveEdit); $('eCancel').addEventListener('click', cancelEdit); $('eReset').addEventListener('click', resetEdit);
    ['eQ', 'eA', 'eE'].forEach(function (id) { $(id).addEventListener('input', liveEdit); });
    $('eFig').addEventListener('change', liveEdit);
    $('eGapAuto').addEventListener('change', function () { $('eGap').disabled = this.checked; liveEdit(); });
    $('eGap').addEventListener('input', function () { $('eGapOut').textContent = this.value + ' mm'; liveEdit(); });
    $('eLinesAuto').addEventListener('change', function () { $('eLines').disabled = this.checked; liveEdit(); });
    $('eLines').addEventListener('input', function () { $('eLinesOut').textContent = this.value; liveEdit(); });
    $('eSizeAuto').addEventListener('change', function () { $('eSize').disabled = this.checked; liveEdit(); });
    $('eSize').addEventListener('input', function () { $('eSizeOut').textContent = this.value + ' pt'; liveEdit(); });
    $('eFontAuto').addEventListener('change', function () { $('eFont').disabled = this.checked; liveEdit(); });
    $('eFont').addEventListener('change', liveEdit);
    $('ePts').addEventListener('input', liveEdit);
    Array.prototype.forEach.call(document.querySelectorAll('.modal'), function (m) { m.addEventListener('click', function (e) { if (e.target === m) { if (m.id === 'mEdit') cancelEdit(); else m.classList.remove('on'); } }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') Array.prototype.forEach.call(document.querySelectorAll('.modal.on'), function (m) { if (m.id === 'mEdit') cancelEdit(); else m.classList.remove('on'); }); });
    var rs = null; window.addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(function () { if (state.view === 'sheet') renderPreview(); }, 250); });
    $('storeInfo').textContent = store.persistent ? 'Les réglages et la feuille en cours sont enregistrés dans ce navigateur, sur cet appareil uniquement.' : 'Le stockage du navigateur est indisponible : rien ne sera conservé après fermeture de la page.';
  }

  /* ───────── démarrage ───────── */
  function start() {
    try { AUTO.init({ FE: window.FLASH_ENGINE, MC: window.MCVG.MCVG || window.MCVG, katex: window.katex, AM: window.MCA || {} }); } catch (e) { document.body.innerHTML = '<p style="padding:1rem">Erreur de chargement des questions.</p>'; return; }
    cat = AUTO.buildCatalogue(); state = loadState();
    var h = (location.hash || '').replace('#', ''); if (VIEWS.indexOf(h) >= 0) state.view = h;
    if (state.view === 'sheet' && !state.sheet.items.length) state.view = 'compose';
    FONTS.forEach(function (f) { var o = el('option'); o.value = f[0]; o.textContent = f[2]; $('sFont').appendChild(o); var o2 = el('option'); o2.value = f[0]; o2.textContent = f[2]; $('eFont').appendChild(o2); });
    bind(); setupInstall(); render(); syncHH(); window.addEventListener('resize', syncHH);
    window.__auto = { state: function () { return state; }, cat: cat, buildPages: buildPages, rasterize: rasterize, makePdf: makePdf, exportPdf: exportPdf };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
