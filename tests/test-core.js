'use strict';
/* Teste chaque notion du catalogue sur de nombreux tirages : aucune question vide, aucune réponse manquante. */
const path = require('path');
const root = path.join(__dirname, '..');
const AUTO = require(path.join(root, 'src/core.js'));
const FE = require(path.join(root, 'sources/flash/load.js'))();
const MC = require(path.join(root, 'sources/mcv2de/gens.js')).MCVG;
const katex = require(path.join(root, 'src/vendor/katex.min.js'));
AUTO.init({ FE, MC, katex });
const cat = AUTO.buildCatalogue();
const N = +process.argv[2] || 200;
let items = 0, fails = [], total = 0, types = {};
cat.levels[0].chapters.forEach(ch => ch.items.forEach(it => {
  items++;
  for (let s = 1; s <= N; s++) {
    const seed = s * 7919 + 13;
    const q = AUTO.makeQuestion(it.src, it.id, seed);
    if (!q) { fails.push(it.key + ' seed ' + seed + ' : question nulle'); break; }
    const mode = s % 2 ? 'auto' : 'qcm';
    const v = AUTO.view(q, null, mode);
    total++; types[v.type] = (types[v.type] || 0) + 1;
    const txt = AUTO.plain(v.qHtml), ans = AUTO.plain(v.aHtml);
    let bad = null;
    if (!txt) bad = 'énoncé vide';
    else if (!ans) bad = 'réponse vide';
    else if (/NaN|undefined|Infinity|\[object/.test(txt + ans)) bad = 'valeur invalide : ' + (txt + ' => ' + ans).slice(0, 120);
    else if ((v.type === 'qcm' || v.type === 'qx') && !(v.choices && v.choices.length >= 2)) bad = 'choix manquants';
    else if (v.type === 'assoc' && !(v.L.length >= 2 && v.R.length === v.L.length)) bad = 'association incomplète';
    else if (v.type === 'ordre' && !(v.D.length >= 3)) bad = 'ordre incomplet';
    if (bad) { fails.push(it.key + ' seed ' + seed + ' : ' + bad); break; }
  }
}));
console.log('notions testées :', items, '— tirages :', total, '— types :', JSON.stringify(types));
console.log('chapitres :', cat.levels[0].chapters.map(c => c.id + '(' + c.items.length + ')').join(' '));
// tirage global
const keys = []; cat.levels[0].chapters.forEach(c => c.items.forEach(i => keys.push(i.key)));
const d = AUTO.draw(keys, 40, 42, cat);
console.log('tirage de 40 :', d.length, 'questions, doublons :', d.length - new Set(d.map(x => x.src + x.id + x.seed)).size);
const fn = AUTO.fileName('2de-pro', ['c1', 'c3'], 12);
console.log('nom de fichier :', fn);
if (fails.length) { console.log('ÉCHECS (' + fails.length + ') :'); fails.slice(0, 30).forEach(f => console.log(' -', f)); process.exit(1); }
console.log('OK');
