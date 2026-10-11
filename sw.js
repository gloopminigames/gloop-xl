// Gloop XL – offline spelen. Pagina's: eerst internet (dan zie je updates), anders de cache.
// Vaste bestanden (Three.js, lettertypen, iconen): eerst de cache.
// Iets veranderd in vendor/, fonts/ of icons/? Verhoog dan VERSIE.
const VERSIE = 'gloopxl-v2';
const START = ['/', '/little-farm-island', '/inloggen', '/privacy', '/cookies', '/xl.css', '/xl.js', '/manifest.webmanifest',
  '/vendor/three.r128.min.js', '/icons/icon-192.png', '/little-farm-island/icon-192.png', '/little-farm-island/icon-512.png',
  '/fonts/fredoka-latin-500-normal.woff2', '/fonts/fredoka-latin-600-normal.woff2', '/fonts/fredoka-latin-700-normal.woff2',
  '/fonts/nunito-latin-400-normal.woff2', '/fonts/nunito-latin-600-normal.woff2', '/fonts/nunito-latin-700-normal.woff2', '/fonts/nunito-latin-800-normal.woff2'];

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
  if (url.origin !== location.origin) return;   // de Gloop-API nooit uit de cache
  const put = res => { if (res.ok && res.type === 'basic') { const k = res.clone(); caches.open(VERSIE).then(c => c.put(req, k)); } return res; };
  if (/^\/(vendor|fonts|icons)\//.test(url.pathname) || /\/icon-\d+\.png$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
    return;
  }
  e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' })
    .then(r => r || (req.mode === 'navigate' ? caches.match('/little-farm-island') : Response.error()))));
});
