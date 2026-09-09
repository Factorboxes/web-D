const installButton=document.getElementById('install-button');
const card=document.getElementById('install-card');
const help=document.getElementById('install-help');
const standalone=window.matchMedia('(display-mode: standalone)');
let pendingPrompt=null;
let installed=false;
function syncInstallUI(){
  card.hidden=installed||standalone.matches||navigator.standalone===true;
  installButton.textContent=pendingPrompt?'ติดตั้งโปรแกรม':'เพิ่มลงหน้าจอ';
}
function showHelp(){
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const android=/Android/.test(navigator.userAgent);
  const steps=ios?[
    'เปิดลิงก์โปรแกรมนี้ใน Safari',
    'กดปุ่มแชร์ หรือเมนูเพิ่มเติม (…) แล้วเลือก แชร์',
    'เลือก เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)',
    'เปิด ใช้เป็นเว็บแอป (Open as Web App) หากมีตัวเลือก แล้วกด เพิ่ม'
  ]:android?[
    'เปิดลิงก์โปรแกรมนี้ใน Chrome',
    'กดเมนู ⋮ แล้วเลือก เพิ่มลงในหน้าจอหลัก หรือ ติดตั้งแอป',
    'ยืนยันการติดตั้ง แล้วเปิดจากไอคอนบนหน้าจอ'
  ]:[
    'เปิดโปรแกรมใน Chrome หรือ Edge',
    'ใช้ปุ่มติดตั้งในแถบที่อยู่ หรือเมนูของเบราว์เซอร์ หากมี',
    'หากต้องการติดตั้งบนมือถือ ให้เปิดลิงก์เดียวกันบนมือถือแล้วกด เพิ่มลงหน้าจอ'
  ];
  document.getElementById('install-help-intro').textContent=ios?'วิธีติดตั้งบน iPhone / iPad':android?'วิธีติดตั้งบน Android':'ติดตั้งผ่านเบราว์เซอร์';
  const list=document.getElementById('install-help-steps');
  list.replaceChildren(...steps.map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));
  if(!help.open)help.showModal();
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();pendingPrompt=event;syncInstallUI();
});
window.addEventListener('appinstalled',()=>{installed=true;pendingPrompt=null;if(help.open)help.close();syncInstallUI();});
standalone.addEventListener('change',syncInstallUI);
installButton.addEventListener('click',async()=>{
  if(!pendingPrompt){showHelp();return;}
  const prompt=pendingPrompt;pendingPrompt=null;installButton.disabled=true;
  try{await prompt.prompt();await prompt.userChoice;}
  catch{showHelp();}
  finally{installButton.disabled=false;syncInstallUI();}
});
syncInstallUI();
if('serviceWorker' in navigator&&window.isSecureContext){
  // Relative URLs keep the worker inside this GitHub Pages repository.
  navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:new URL('./',import.meta.url).href,updateViaCache:'none'})
    .catch(()=>{ /* Installation help and the online calculator remain available. */ });
}
