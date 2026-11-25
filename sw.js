const CACHE = 'borareciclar-v1';
const BASE = ['./', 'index.html', 'styles.css', 'script.js', 'manifest.json',
  'assets/illustrations/floresta-rio.svg', 'assets/icons/icone.svg',
  'assets/icons/icone-192.png', 'assets/icons/icone-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Ignora Google (mapa e formulários), áudio e requisições parciais.
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range') || url.pathname.endsWith('.mp3')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    const copia = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copia));
    return res;
  })));
});
