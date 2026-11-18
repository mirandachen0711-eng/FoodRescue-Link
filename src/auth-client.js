import {createClient} from '@supabase/supabase-js';

const copy={
en:{community:'HIGHTSTOWN COMMUNITY',headline:'Good food.\nFor every neighbor.',intro:'Connect with nearby food banks, find a pickup, or share food with your community.',resident:'Individuals & families',residentCopy:'Find food and manage your pickups. No income or housing information needed.',bank:'Food banks & food donors',bankCopy:'Publish available food, coordinate pickups, and redistribute to neighbors.',tagline:'A little surplus. A big difference.',welcome:'WELCOME TO FOODRESCUE LINK',title:'Sign in with your email',subtitle:'New here? Your account is created when you verify your email. No password to remember.',email:'Email address',send:'Send verification code',sentTo:'Code sent to',code:'8-digit verification code',codeHelp:'Enter the latest code from your email. It expires after 10 minutes.',verify:'Verify & continue',resend:'Send a new code',change:'Change email',privacy:'Your email is used for sign-in and is not shown on food listings. On a shared device, sign out when you finish.',footer:'Neighbors helping neighbors.',retry:'Try again',loading:'Connecting securely…',sending:'Sending your code…',sent:'Check your inbox and spam folder for your code.',verifying:'Checking your code…',invalid:'The code is invalid or expired. Try the latest code or request a new one.',rate:'Too many attempts. Please wait a minute before trying again.',network:'Unable to connect. Check your connection and try again.',unavailable:'Email sign-in is temporarily unavailable. Please try again.',wait:'You can request a new code in {n}s.',format:'Enter the 8 digits from your email.',storage:'Allow session storage in your browser to sign in.',signout:'Sign out',signingout:'Signing out…',signoutError:'Could not sign out. Check your connection and try again.',ready:'Email verified. Opening your workspace…'},
zh:{community:'HIGHTSTOWN 社区',headline:'让好食物，\n惠及每位邻里。',intro:'连接附近的食物银行，预约领取食物，或向社区分享余粮。',resident:'个人与家庭',residentCopy:'寻找食物、管理领取预约。无需提供收入或住房信息。',bank:'食物银行与捐赠方',bankCopy:'发布可领取的食物、协调领取，并向居民分发食物。',tagline:'一点余粮，一份大爱。',welcome:'欢迎来到 FOODRESCUE LINK',title:'使用邮箱登录',subtitle:'第一次使用？验证邮箱后即可创建账户，无需设置或记住密码。',email:'邮箱地址',send:'发送验证码',sentTo:'验证码已发送至',code:'8 位数字验证码',codeHelp:'请输入邮件中最新的验证码，有效期为 10 分钟。',verify:'验证并继续',resend:'重新发送验证码',change:'更换邮箱',privacy:'邮箱用于登录，不会显示在食物列表中。在公共设备上使用后，请退出登录。',footer:'邻里互助，让食物传递关爱。',retry:'重试',loading:'正在安全连接…',sending:'正在发送验证码…',sent:'请检查收件箱和垃圾邮件文件夹。',verifying:'正在验证…',invalid:'验证码错误或已过期。请输入最新验证码，或重新获取。',rate:'尝试次数过多，请等待一分钟后重试。',network:'无法连接，请检查网络后重试。',unavailable:'邮箱登录暂时不可用，请稍后重试。',wait:'{n} 秒后可重新发送。',format:'请输入邮件中的 8 位数字。',storage:'请允许浏览器使用会话存储，以完成登录。',signout:'退出登录',signingout:'正在退出…',signoutError:'退出失败，请检查网络后重试。',ready:'邮箱验证成功，正在进入工作区…'},
es:{community:'COMUNIDAD DE HIGHTSTOWN',headline:'Buena comida.\nPara cada vecino.',intro:'Conecta con bancos de alimentos cercanos, reserva una recogida o comparte alimentos con tu comunidad.',resident:'Personas y familias',residentCopy:'Encuentra alimentos y gestiona tus recogidas. No necesitas compartir datos de ingresos ni vivienda.',bank:'Bancos de alimentos y donantes',bankCopy:'Publica alimentos disponibles, coordina recogidas y distribuye a tus vecinos.',tagline:'Un pequeño excedente. Una gran diferencia.',welcome:'BIENVENIDO A FOODRESCUE LINK',title:'Accede con tu correo',subtitle:'¿Es tu primera vez? Tu cuenta se crea al verificar tu correo. Sin contraseñas que recordar.',email:'Correo electrónico',send:'Enviar código de verificación',sentTo:'Código enviado a',code:'Código de verificación de 8 dígitos',codeHelp:'Introduce el código más reciente de tu correo. Caduca en 10 minutos.',verify:'Verificar y continuar',resend:'Enviar un código nuevo',change:'Cambiar correo',privacy:'Tu correo se usa para acceder y no se muestra en las publicaciones. Cierra sesión al terminar en un dispositivo compartido.',footer:'Vecinos ayudando a vecinos.',retry:'Reintentar',loading:'Conectando de forma segura…',sending:'Enviando tu código…',sent:'Revisa tu bandeja de entrada y la carpeta de spam.',verifying:'Verificando tu código…',invalid:'El código es incorrecto o ha caducado. Usa el más reciente o solicita uno nuevo.',rate:'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',network:'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',unavailable:'El acceso por correo no está disponible temporalmente. Inténtalo más tarde.',wait:'Puedes solicitar otro código en {n}s.',format:'Introduce los 8 dígitos de tu correo.',storage:'Permite el almacenamiento de sesión del navegador para acceder.',signout:'Cerrar sesión',signingout:'Cerrando sesión…',signoutError:'No se pudo cerrar sesión. Revisa la conexión e inténtalo de nuevo.',ready:'Correo verificado. Abriendo tu espacio…'}
};
const login=!!document.getElementById('email-form');
copy.en.browse='Find nearby help without signing in';copy.zh.browse='不登录也能查看附近援助';copy.es.browse='Buscar ayuda cercana sin iniciar sesión';
const browse=location.pathname?.startsWith('/browse');
let lang='en',client,email='',busy=false,nextSend=0,messageKey='',messageError=false;
try{const saved=localStorage.getItem('foodrescue-language');if(copy[saved])lang=saved;}catch{}
const t=(key)=>copy[lang][key]||copy.en[key]||'';
const byId=id=>document.getElementById(id);
function status(key,error=false){messageKey=key;messageError=error;const el=byId('auth-status');if(el){el.textContent=t(key);el.dataset.error=String(error);}}
function cooldown(){
  if(!login)return;
  const seconds=Math.max(0,Math.ceil((nextSend-Date.now())/1000));
  byId('cooldown').textContent=seconds?t('wait').replace('{n}',seconds):'';
  byId('resend-code').disabled=busy||seconds>0||!client;
  byId('send-code').disabled=busy||seconds>0||!client;
}
function translate(){
  document.documentElement.lang=lang==='zh'?'zh-CN':lang;
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
  if(messageKey)status(messageKey,messageError);
  const out=byId('auth-signout');if(out)out.textContent=t('signout');
  cooldown();
}
function setBusy(value){busy=value;for(const id of ['verify-code','change-email']){const el=byId(id);if(el)el.disabled=value;}cooldown();}
function errorKey(error,verifying=false){
  if(error?.status===429||String(error?.code||'').includes('rate_limit'))return 'rate';
  if(verifying&&['otp_expired','otp_disabled','validation_failed'].includes(error?.code))return 'invalid';
  if(error?.status===0||error?.name==='AuthRetryableFetchError'||error instanceof TypeError)return 'network';
  return verifying&&error?.status===403?'invalid':'unavailable';
}
function showCode(){byId('email-form').hidden=true;byId('code-form').hidden=false;byId('sent-email').textContent=email;byId('otp').focus();}
function savePending(){sessionStorage.setItem('foodrescue-pending',JSON.stringify({email,nextSend}));}
function destination(){
  const value=new URLSearchParams(location.search).get('next');
  // Restrict to known app destinations; do not accept arbitrary redirect URLs.
  return /^\/community(?:\.html)?(?:#(?:resident|donor|pantry|reservations|analytics|account))?$/.test(value||'')?value:'/community';
}
async function send(){
  if(busy||Date.now()<nextSend||!client)return;
  setBusy(true);status('sending');
  try{
    const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
    if(error){status(errorKey(error),true);if(error.status===429)nextSend=Date.now()+60000;return;}
    nextSend=Date.now()+60000;savePending();showCode();byId('otp').value='';status('sent');
  }catch(error){status(errorKey(error),true);}finally{setBusy(false);}
}
async function initialize(){
  status('loading');if(login)byId('retry-setup').hidden=true;
  try{
    // Session-scoped storage survives page navigation, but not closing this tab.
    sessionStorage.setItem('foodrescue-storage-test','1');sessionStorage.removeItem('foodrescue-storage-test');
  }catch{status('storage',true);throw Error('Session storage unavailable');}
  const response=await fetch('/auth/config',{cache:'no-store'});
  if(!response.ok)throw Error('Configuration unavailable');
  const config=await response.json();
  if(config.url!=='https://ctwdvduchftekmcafciv.supabase.co'||!config.publishableKey?.startsWith('sb_publishable_'))throw Error('Invalid auth configuration');
  client=createClient(config.url,config.publishableKey,{auth:{storage:sessionStorage,storageKey:'foodrescue-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  client.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT'&&!login)location.replace('/login');
  });
  if(login){
    if(data.session){location.replace(destination());return;}
    try{const saved=JSON.parse(sessionStorage.getItem('foodrescue-pending')||'null');if(saved?.email){email=saved.email;nextSend=Number(saved.nextSend)||0;byId('email').value=email;showCode();}}catch{}
    status(email?'sent':'');cooldown();
  }else if(!data.session&&!browse){window.FoodRescueAuth.toLogin();}
  else{const el=byId('auth-email');if(el)el.textContent=data.session.user.email||'';}
  return data.session;
}
window.FoodRescueAuth={
  ready:null,
  async getAccessToken(){await this.ready;const {data,error}=await client.auth.getSession();if(error)throw error;return data.session?.access_token||null;},
  toLogin(){location.replace('/login?next='+encodeURIComponent('/community'+location.hash));},
  async expire(){await client?.auth.signOut({scope:'local'});sessionStorage.removeItem('foodrescue-auth');this.toLogin();}
};
window.FoodRescueAuth.logout=async()=>{try{await window.FoodRescueAuth.ready;const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;sessionStorage.removeItem('foodrescue-pending');location.replace('/login');}catch{const notice=byId('notice');if(notice){notice.hidden=false;notice.textContent=t('signoutError');}}};
function boot(){
  const promise=initialize();window.FoodRescueAuth.ready=promise;
  promise.catch(()=>{if(messageKey!=='storage')status('network',true);if(login)byId('retry-setup').hidden=false;});
  return promise;
}
if(login){
  byId('auth-language').value=lang;
  byId('auth-language').onchange=e=>{lang=e.target.value;try{localStorage.setItem('foodrescue-language',lang);}catch{}translate();};
  byId('email-form').onsubmit=e=>{e.preventDefault();email=byId('email').value.trim();send();};
  byId('resend-code').onclick=send;
  byId('change-email').onclick=()=>{if(busy)return;sessionStorage.removeItem('foodrescue-pending');email='';byId('otp').value='';byId('code-form').hidden=true;byId('email-form').hidden=false;byId('email').focus();status('');};
  byId('otp').oninput=e=>{e.target.value=e.target.value.replace(/[^0-9]/g,'').slice(0,8);};
  byId('code-form').onsubmit=async e=>{
    e.preventDefault();if(busy||!client)return;const token=byId('otp').value;
    if(!/^\d{8}$/.test(token)){status('format',true);return;}
    setBusy(true);status('verifying');
    try{const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});
      if(error){status(errorKey(error,true),true);byId('otp').value='';byId('otp').focus();return;}
      if(!data.session){status('unavailable',true);return;}
      byId('otp').value='';sessionStorage.removeItem('foodrescue-pending');status('ready');location.replace(destination());
    }catch(error){status(errorKey(error,true),true);}finally{setBusy(false);}
  };
  byId('retry-setup').onclick=()=>{if(client)client.auth.stopAutoRefresh();client=null;boot();};
  setInterval(cooldown,1000);translate();
}else{
  const button=byId('auth-signout');if(button){button.textContent=t('signout');button.onclick=async()=>{
    button.disabled=true;button.textContent=t('signingout');
    try{await window.FoodRescueAuth.ready;const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;
      sessionStorage.removeItem('foodrescue-pending');location.replace('/login');
    }catch{button.disabled=false;button.textContent=t('signout');const notice=byId('notice');if(notice){notice.hidden=false;notice.textContent=t('signoutError');}}
  };}
  byId('language')?.addEventListener('change',e=>{lang=e.target.value;if(button)button.textContent=t('signout');});
  // Prevent history navigation from showing a stale signed-in page after sign-out.
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
}
boot();
