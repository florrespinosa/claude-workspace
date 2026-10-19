// Guarda todos los archivos de la app en el iPhone para que funcione sin internet.
// Con internet, la app pide siempre la versión nueva; sin internet usa la guardada.
const CACHE = 'mis-finanzas-v7';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'ocr/tesseract.min.js',
  'ocr/worker.min.js',
  'ocr/core/tesseract-core-simd-lstm.wasm.js',
  'ocr/core/tesseract-core-lstm.wasm.js',
  'ocr/lang/spa.traineddata.gz'
];

self.addEventListener('install', (e) => {
  // cache: 'reload' evita guardar copias viejas que el navegador tenga en memoria.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Los archivos grandes del lector de comprobantes no cambian: primero lo guardado.
  if (url.origin !== self.location.origin || url.pathname.includes('/ocr/')) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
    return;
  }
  // La app en sí: primero internet (para tener siempre lo último); si no hay, lo guardado.
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
