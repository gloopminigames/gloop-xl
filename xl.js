// Gloop XL – inloggen met je Gloop-account en de kop van elke pagina.
// XL draait op twee plekken:
//  1. gloop-xl.vercel.app/ : eigen site. Inloggen gaat via de API van Gloop; de inlogcode staat op dit apparaat
//     (localStorage 'gloopxl.token').
//  2. binnen Gloop op /xl/ (zo opent XL in de Gloop-app in de app zelf): dan geldt gewoon je Gloop-login.
(()=>{
const ON_GLOOP=/^\/xl(\/|$)/.test(location.pathname);
const BASE=ON_GLOOP?'/xl/':'/';
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const GLOOP=ON_GLOOP?location.origin:LOCAL?'http://localhost:3100':'https://www.gloopie.nl';   // het adres van Gloop
const TOKEN='gloopxl.token';
const SAVES=['littlefarmisland.save.v1','sproutisle.save.v1'];               // eilanden op dit apparaat
const get=()=>{try{return localStorage.getItem(TOKEN)||'';}catch(e){return '';}};
const set=t=>{try{t?localStorage.setItem(TOKEN,t):localStorage.removeItem(TOKEN);}catch(e){}};
async function api(path,opts={}){
  const t=get();const headers={...(opts.body?{'Content-Type':'application/json'}:{}),...(t?{Authorization:'Bearer '+t}:{})};
  const r=await fetch(GLOOP+'/api/xl/'+path,{method:opts.body?'POST':(opts.method||'GET'),headers,body:opts.body?JSON.stringify(opts.body):undefined,cache:'no-store',keepalive:!!opts.keepalive,credentials:'same-origin'});
  let j={};try{j=await r.json();}catch(e){}
  if(r.status===401&&path!=='login'&&t)set('');
  if(!r.ok){const e=new Error(j.error||'Er ging iets mis. Probeer het nog eens.');e.status=r.status;throw e;}
  return j;
}
let mePromise=null;
const XL=window.XL={
  GLOOP,BASE,ON_GLOOP,
  token:get,
  // Wie is er ingelogd? null = niet ingelogd (of geen verbinding). Binnen Gloop telt ook de Gloop-login.
  me(){if(!get()&&!ON_GLOOP)return Promise.resolve(null);
    return mePromise||(mePromise=api('me').then(j=>j.user).catch(e=>{if(e.status!==401)XL.offline=true;return null;}));},
  async login(name,pin){const j=await api('login',{body:{name,pin}});set(j.token);mePromise=Promise.resolve(j.user);return j.user;},
  // Uitloggen wist ook het eiland op dit apparaat (handig op een gedeelde computer).
  async logout(){try{await api('logout',{body:{}});}catch(e){}set('');mePromise=null;try{SAVES.forEach(k=>localStorage.removeItem(k));}catch(e){}},
  sync(lfi,keepalive){return api('sync',{body:{lfi},keepalive});},
  // Inlogpagina; `back` is een pad binnen XL, bijv. 'little-farm-island'. Binnen Gloop: de inlogpagina van Gloop.
  loginUrl(back){back=XL.safeBack(back);return ON_GLOOP?'/inloggen?terug='+encodeURIComponent(BASE+back):BASE+'inloggen?terug='+encodeURIComponent(back);},
  here(){return location.pathname.startsWith(BASE)?location.pathname.slice(BASE.length):'';},
  safeBack(t){t=String(t||'').replace(/^\/+/,'');return /^[\w\-\/]*$/.test(t)&&!t.includes('//')?t:'';}
};
// Binnen Gloop loggen we in via Gloop zelf.
if(ON_GLOOP&&/^inloggen\/?$/.test(XL.here()))location.replace(XL.loginUrl(new URLSearchParams(location.search).get('terug')));
// Kop: "Ingelogd als ..." of een inlogknop.
function header(){
  const el=document.getElementById('acc');if(!el)return;
  XL.me().then(u=>{
    el.textContent='';
    if(u){
      // Naam als knop (zoals bij Gloop), met een klein menu: profiel op Gloop en (los op XL) uitloggen.
      const btn=document.createElement('button');btn.type='button';btn.className='hpill';btn.setAttribute('aria-haspopup','menu');btn.setAttribute('aria-expanded','false');
      const ini=document.createElement('span');ini.className='ini';ini.setAttribute('aria-hidden','true');ini.textContent=(u.name||'?').charAt(0).toUpperCase();
      const b=document.createElement('b');b.textContent=u.name;btn.append(ini,b);
      const menu=document.createElement('div');menu.className='acc-menu';menu.setAttribute('role','menu');menu.hidden=true;
      const prof=document.createElement('a');prof.href=GLOOP+'/profiel';prof.textContent='Mijn profiel op Gloop';prof.setAttribute('role','menuitem');menu.append(prof);
      if(u.via!=='gloop'){const out=document.createElement('button');out.type='button';out.textContent='Uitloggen';out.setAttribute('role','menuitem');
        out.onclick=async()=>{out.disabled=true;await XL.logout();location.reload();};menu.append(out);}
      const close=()=>{menu.hidden=true;btn.setAttribute('aria-expanded','false');};
      btn.onclick=e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;btn.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('a,button').focus();};
      document.addEventListener('click',e=>{if(!el.contains(e.target))close();});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){close();btn.focus();}});
      el.append(btn,menu);
    }else{const a=document.createElement('a');a.className='hpill';a.href=XL.loginUrl(XL.here());a.textContent='Inloggen';el.append(a);}
    document.querySelectorAll('[data-if-user]').forEach(n=>n.hidden=!u);
    document.querySelectorAll('[data-if-guest]').forEach(n=>n.hidden=!!u);
    document.querySelectorAll('[data-user-name]').forEach(n=>n.textContent=u?u.name:'');
  });
}
document.querySelectorAll('[data-gloop]').forEach(a=>a.href=GLOOP+(a.getAttribute('data-gloop')||'/'));
document.querySelectorAll('[data-login]').forEach(a=>a.href=XL.loginUrl(a.getAttribute('data-login')));
header();
// Logo: de ogen kijken naar je muis (net als bij Gloop).
(()=>{const logo=document.getElementById('logoWord');if(!logo)return;let raf=0;
  addEventListener('pointermove',e=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const r=logo.getBoundingClientRect();
    const dx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/400)),dy=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/300));
    logo.style.setProperty('--px',(dx*.08).toFixed(3)+'em');logo.style.setProperty('--py',(dy*.08).toFixed(3)+'em');});},{passive:true});})();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE}).catch(()=>{}));
})();
