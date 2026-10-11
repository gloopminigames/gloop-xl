// Gloop XL – offline spelen. Werkt op gloop-xl.vercel.app/ én binnen Gloop op /xl/ (alles ten opzichte van de scope).
// Pagina's: eerst internet (dan zie je updates), anders de cache. Vaste bestanden (Three.js, lettertypen, iconen): eerst de cache.
// Iets veranderd in vendor/, fonts/ of icons/? Verhoog dan VERSIE.
const VERSIE = 'gloopxl-v7';
const SCOPE = self.registration.scope;                 // bijv. https://gloop-xl.vercel.app/ of https://www.gloopie.nl/xl/
const BASE = new URL(SCOPE).pathname;
const START = ['', 'little-farm-island', 'little-farm-island/spel', 'privacy', 'cookies', 'xl.css', 'xl.js', 'manifest.webmanifest',
  'vendor/three.r128.min.js', 'icons/icon-192.png', 'little-farm-island/icon-192.png', 'little-farm-island/icon-512.png',
  'fonts/fredoka-latin-500-normal.woff2', 'fonts/fredoka-latin-600-normal.woff2', 'fonts/fredoka-latin-700-normal.woff2',
  'fonts/nunito-latin-400-normal.woff2', 'fonts/nunito-latin-600-normal.woff2', 'fonts/nunito-latin-700-normal.woff2', 'fonts/nunito-latin-800-normal.woff2']
  .map(p => new URL(p, SCOPE).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIE).then(c => Promise.all(START.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('gloopxl-') && k !== VERSIE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Alleen XL zelf; de API (en de rest van Gloop) nooit uit de cache.
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE) || url.pathname.includes('/api/')) return;
  const rel = url.pathname.slice(BASE.length);
  const put = res => { if (res.ok && res.type === 'basic') { const k = res.clone(); caches.open(VERSIE).then(c => c.put(req, k)); } return res; };
  if (/^(vendor|fonts|icons)\//.test(rel) || /\/icon-\d+\.png$/.test(rel)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
    return;
  }
  e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' })
    .then(r => r || (req.mode === 'navigate' ? caches.match(new URL('little-farm-island/spel', SCOPE).href) : Response.error()))));
});
