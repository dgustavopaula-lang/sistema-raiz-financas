const CACHE = "raiz-financas-interface-v1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS))
  );
});

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys().then(chaves =>
      Promise.all(
        chaves
          .filter(chave => chave.startsWith("raiz-financas-") && chave !== CACHE)
          .map(chave => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", evento => {
  const pedido = evento.request;
  const url = new URL(pedido.url);

  if (pedido.method !== "GET" || url.origin !== self.location.origin) return;
  if (!ARQUIVOS.some(arquivo =>
    url.pathname === new URL(arquivo, self.registration.scope).pathname
  )) return;

  evento.respondWith(
    caches.match(pedido).then(resposta =>
      resposta || fetch(pedido)
    )
  );
});
