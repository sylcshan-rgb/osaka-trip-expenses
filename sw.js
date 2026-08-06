const CACHE_NAME = "trip-expenses-shell-v2";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(SHELL_FILES); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// App-shell files: network-first, so a new deploy shows up immediately;
// falls back to the cached copy only when offline.
// Everything else (Google Sheet CSV, exchange rates, Apps Script writes): untouched,
// the page itself keeps a localStorage fallback for that live data.
self.addEventListener("fetch", function(event){
  var url = new URL(event.request.url);
  var isShellFile = event.request.method === "GET" && url.origin === self.location.origin;

  if(!isShellFile){
    return; // let the browser handle it normally
  }

  event.respondWith(
    fetch(event.request).then(function(response){
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
      return response;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
