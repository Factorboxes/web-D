const CACHE_PREFIX='factorboxes-calculator:'+self.registration.scope+':';
const CACHE_NAME=CACHE_PREFIX+'papervat9';
const SHELL='./index.html';
const FILES=[SHELL,'./styles.css?v=20260910-papervat9','./app.js?v=20260910-papervat9','./math.mjs?v=20260910-papervat9','./pwa.js?v=20260909-pwa5','./manifest.webmanifest?v=rainbow6','./thai-regular.woff','./thai-bold.woff','./icon-192.png?v=rainbow6','./icon-512.png?v=rainbow6','./apple-touch-icon.png?v=rainbow6','./icon-maskable.png?v=rainbow6'];
const urlFor=path=>new URL(path,self.registration.scope).href;
const ASSETS=new Set(FILES.map(urlFor));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const entries=await Promise.all(FILES.map(async path=>{
      const url=urlFor(path),response=await fetch(url,{cache:'reload'});
      if(!response.ok||response.redirected)throw new Error('App asset unavailable');
      return [url,response];
    }));
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(entries.map(([url,response])=>cache.put(url,response)));
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await Promise.all((await caches.keys()).filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(request.mode==='navigate'&&(url.pathname===scope.pathname||url.pathname===new URL(SHELL,scope).pathname)){
    event.respondWith((async()=>{
      try{return await fetch(request);}
      catch{return (await caches.open(CACHE_NAME)).match(urlFor(SHELL));}
    })());
  }else if(ASSETS.has(url.href)){
    event.respondWith((async()=>{
      const cached=await (await caches.open(CACHE_NAME)).match(request);
      return cached||fetch(request);
    })());
  }
});
