// Gloop XL – inloggen met je Gloop-account (via de API van Gloop) en de kop van elke pagina.
// De sessiecode staat alleen op dit apparaat (localStorage 'gloopxl.token').
(()=>{
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const GLOOP=LOCAL?'http://localhost:3100':'https://gloopie.vercel.app';   // het adres van Gloop
const TOKEN='gloopxl.token';
const SAVES=['littlefarmisland.save.v1','sproutisle.save.v1'];               // eilanden op dit apparaat
const get=()=>{try{return localStorage.getItem(TOKEN)||'';}catch(e){return '';}};
const set=t=>{try{t?localStorage.setItem(TOKEN,t):localStorage.removeItem(TOKEN);}catch(e){}};
async function api(path,opts={}){
  const t=get();const headers={...(opts.body?{'Content-Type':'application/json'}:{}),...(t?{Authorization:'Bearer '+t}:{})};
  const r=await fetch(GLOOP+'/api/xl/'+path,{method:opts.body?'POST':(opts.method||'GET'),headers,body:opts.body?JSON.stringify(opts.body):undefined,cache:'no-store',keepalive:!!opts.keepalive});
  let j={};try{j=await r.json();}catch(e){}
  if(r.status===401&&path!=='login')set('');
  if(!r.ok){const e=new Error(j.error||'Er ging iets mis. Probeer het nog eens.');e.status=r.status;throw e;}
  return j;
}
let mePromise=null;
const XL=window.XL={
  GLOOP,
  token:get,
  // Wie is er ingelogd? null = niet ingelogd (of geen verbinding).
  me(){if(!get())return Promise.resolve(null);return mePromise||(mePromise=api('me').then(j=>j.user).catch(e=>{if(e.status!==401)XL.offline=true;return null;}));},
  async login(name,pin){const j=await api('login',{body:{name,pin}});set(j.token);mePromise=Promise.resolve(j.user);return j.user;},
  // Uitloggen wist ook het eiland op dit apparaat (handig op een gedeelde computer).
  async logout(){try{await api('logout',{body:{}});}catch(e){}set('');mePromise=null;try{SAVES.forEach(k=>localStorage.removeItem(k));}catch(e){}},
  sync(lfi,keepalive){return api('sync',{body:{lfi},keepalive});},
  safeBack(t){return /^\/(?![\/\\])[\w\-\/]*$/.test(t||'')?t:'/';}
};
// Kop: "Ingelogd als ..." of een inlogknop.
function header(){
  const el=document.getElementById('acc');if(!el)return;
  XL.me().then(u=>{
    el.textContent='';
    if(u){el.append('Ingelogd als ');const b=document.createElement('b');b.textContent=u.name;el.append(b,' · ');
      const out=document.createElement('button');out.type='button';out.textContent='Uitloggen';
      out.onclick=async()=>{out.disabled=true;await XL.logout();location.reload();};el.append(out);}
    else{const a=document.createElement('a');a.href='/inloggen?terug='+encodeURIComponent(location.pathname);a.textContent='Inloggen';el.append(a);}
    document.querySelectorAll('[data-if-user]').forEach(n=>n.hidden=!u);
    document.querySelectorAll('[data-if-guest]').forEach(n=>n.hidden=!!u);
    document.querySelectorAll('[data-user-name]').forEach(n=>n.textContent=u?u.name:'');
  });
}
document.querySelectorAll('[data-gloop]').forEach(a=>a.href=GLOOP+(a.getAttribute('data-gloop')||'/'));
header();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
})();
