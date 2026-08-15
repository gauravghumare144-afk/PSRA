const C="pria-v6";const F=["./","./index.html","./style.css","./app.js","./manifest.json","./icon.svg","./sir-photo.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request))));