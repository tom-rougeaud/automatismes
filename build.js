'use strict';
/* Assemble index.html (un seul fichier, sans CDN) + manifest + service worker.  Usage : node build.js */
const fs = require('fs'), path = require('path');
const R = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');
const VERSION = 'v3';
let html = R('src/index.template.html');
/* automatismes des manuels (3ᵉ, 1re, Tle) : chaque module est isolé avec son propre fichier d’outils */
function mods() {
  const one = (d, v) => `${v}:(function(){var module={exports:{}};${R('sources/' + d + '/gens.js')}\nvar gm=module.exports;module={exports:{}};var require=function(){return gm;};${R('sources/' + d + '/auto.js')}\nreturn module.exports;})()`;
  return 'window.MCA={' + [one('auto3', 'a3'), one('auto1', 'a1'), one('autoT', 'aT')].join(',') + '};';
}
const TILES = R('tools/icon-tiles.txt');
const FAVSVG = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2B4C7E"/>' + TILES + '</svg>').replace(/'/g, '%27');
const parts = {
  FAVSVG, FAV32: fs.readFileSync(path.join(__dirname, 'favicon-32.png')).toString('base64'), LOGOTILES: TILES,
  FONTS: R('src/vendor/nunito.css') + '\n' + R('src/vendor/katex.css'),
  SHEETCSS: R('src/sheet.css'),
  APPCSS: R('src/app.css'),
  COURS: R('sources/flash/cours.json').replace(/<\/script/gi, '<\\/script'),
  KATEX: safe(R('src/vendor/katex.min.js')),
  FLASHENGINE: safe(R('sources/flash/engine_body.js')),
  MCVGENS: safe(R('sources/mcv2de/gens.js')),
  MCAMODS: safe(mods()),
  CORE: safe(R('src/core.js').replace(/\nif \(typeof module[^\n]*\n?$/, '\n')),
  APP: safe(R('src/app.js'))
};
for (const k of Object.keys(parts)) {
  const tag = '/*{{' + k + '}}*/';
  if (!html.includes(tag)) throw new Error('marqueur absent : ' + k);
  html = html.split(tag).join(parts[k].split('$').join('$')); // pas de remplacement spécial
}
const STAMP = Date.now().toString(36); // anti-cache des icônes
html = html.replace(/href="(favicon-48\.png|favicon\.ico|icon-180\.png|manifest\.webmanifest)"/g, 'href="$1?v=' + STAMP + '"');
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
fs.writeFileSync(path.join(__dirname, 'manifest.webmanifest'), JSON.stringify({
  name: 'AUTOMATHS · automatismes de maths en lycée pro', short_name: 'AUTOMATHS', description: 'Feuilles d’automatismes A4 avec corrigé, par chapitre.',
  lang: 'fr', start_url: './index.html', scope: './', display: 'standalone', orientation: 'any', background_color: '#F4F6F9', theme_color: '#2B4C7E',
  icons: [{ src: 'icon-192.png?v=' + STAMP, sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: 'icon-512.png?v=' + STAMP, sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: 'icon-maskable-512.png?v=' + STAMP, sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
}, null, 2));
fs.writeFileSync(path.join(__dirname, 'sw.js'), `/* Service worker : garde l’appli hors connexion. Aucune donnée n’est collectée. */
const CACHE = 'automatismes-${VERSION}-' + ${JSON.stringify(Date.now().toString(36))};
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'favicon-48.png', 'favicon.ico'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('automatismes-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)).catch(() => {}); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
`);
console.log('index.html :', Math.round(html.length / 1024), 'Ko');
