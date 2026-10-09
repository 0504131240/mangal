const CACHE='bbq-admin-v2';
const SHELL=['admin.html','gallery-default.js','images/logo-v2.png','images/icon-192.png','images/icon-512.png','manifest-admin.json'];

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
  if(url.pathname.startsWith('/api/')) return;

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

self.addEventListener('push',(e)=>{
  let data={};
  try{ data=e.data ? e.data.json() : {}; }catch(err){ data={body:e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(data.title||'BBQ', {
    body:data.body||'',
    icon:'images/icon-192.png',
    tag:data.tag,
    dir:'rtl',
    lang:'he',
    data:{url:data.url||'admin.html'}
  }));
});

self.addEventListener('notificationclick',(e)=>{
  e.notification.close();
  const url=new URL((e.notification.data && e.notification.data.url)||'admin.html', self.registration.scope);
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const open=list.find(c=>new URL(c.url).pathname.endsWith('/admin.html'));
    if(open){
      open.postMessage({type:'open-tab',tab:url.hash.slice(1)});
      return open.focus();
    }
    return clients.openWindow(url.href);
  }));
});
