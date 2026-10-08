const CACHE='bbq-admin-v1';
const SHELL=['admin.html','images/logo.png','images/icon-192.png','images/icon-512.png','manifest-admin.json'];

self.addEventListener('install',(e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',(e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',(e)=>{
  const url=new URL(e.request.url);
  if(url.origin!==location.origin || e.request.method!=='GET') return; // let Firebase/CDN requests pass through untouched

  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).catch(()=>caches.match('admin.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached=>
      cached || fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }).catch(()=>cached)
    )
  );
});
