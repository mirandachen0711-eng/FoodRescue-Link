(()=>{
const text=(en,zh,es)=>document.documentElement.lang.startsWith('zh')?zh:document.documentElement.lang.startsWith('es')?es:en;
let loading=false;
async function mount(){
 const form=document.getElementById('account-form');if(!form||document.getElementById('delete-account-panel')||loading)return;
 loading=true;
 const section=document.createElement('section');section.id='delete-account-panel';section.className='panel';
 const title=document.createElement('h2');title.textContent=text('Delete account','删除账号','Eliminar cuenta');
 const description=document.createElement('p');description.textContent=text('Permanently remove your account and personal profile. Your pickups will be cancelled. If you own an organization, it will close and its listings and pickups will be cancelled. This cannot be undone.','永久删除账号和个人资料，取消你的领取预约。如果你是机构所有者，机构将关闭，其食物发布和预约将取消。此操作无法撤销。','Elimina permanentemente tu cuenta y perfil. Se cancelarán tus recogidas. Si eres titular de una organización, se cerrará y se cancelarán sus publicaciones y recogidas. No se puede deshacer.');
 const status=document.createElement('p');status.setAttribute('role','status');
 const button=document.createElement('button');button.type='button';button.className='danger';button.textContent=title.textContent;button.disabled=true;
 section.append(title,description,button,status);form.closest('section').after(section);
 try{const token=await window.FoodRescueAuth.getAccessToken();const response=await fetch('/api/account/deletion-status',{headers:{Authorization:'Bearer '+token},cache:'no-store'});const result=await response.json();button.disabled=!response.ok||!result.enabled;
 if(button.disabled)status.textContent=text('Deletion is not enabled yet. No data has been deleted.','删除服务尚未启用，没有删除任何数据。','La eliminación aún no está habilitada. No se ha borrado ningún dato.');
 }catch{status.textContent=text('Unable to connect. Reload to try again.','无法连接，请刷新后重试。','No se pudo conectar. Recarga para reintentar.');}finally{loading=false;}
 button.onclick=()=>{
  const dialog=document.createElement('dialog');const heading=document.createElement('h2');heading.textContent=title.textContent;
  const label=document.createElement('label');label.textContent=text('Type DELETE to confirm','输入 DELETE 确认','Escribe DELETE para confirmar');
  const input=document.createElement('input');input.autocomplete='off';input.id='deletion-confirm';label.htmlFor=input.id;
  const warning=document.createElement('p');warning.textContent=description.textContent;
  const error=document.createElement('p');error.setAttribute('role','alert');
  const cancel=document.createElement('button');cancel.textContent=text('Cancel','取消','Cancelar');cancel.onclick=()=>dialog.close();
  const confirm=document.createElement('button');confirm.className='danger';confirm.textContent=text('Permanently delete','永久删除','Eliminar permanentemente');confirm.disabled=true;
  input.oninput=()=>confirm.disabled=input.value!=='DELETE';
  confirm.onclick=async()=>{confirm.disabled=true;cancel.disabled=true;input.disabled=true;
   try{const token=await window.FoodRescueAuth.getAccessToken();const response=await fetch('/api/account/delete',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({confirmation:input.value})});const result=await response.json();
    if(!response.ok){error.textContent=response.status===401?text('Sign out, verify your email again, then return here.','请退出并重新验证邮箱后，再返回此处。','Cierra sesión, verifica tu correo de nuevo y vuelve aquí.'):text('Deletion could not start. Please try again later.','未能开始删除，请稍后重试。','No se pudo iniciar. Inténtalo más tarde.');return;}
    dialog.close();button.disabled=true;status.textContent=result.status==='completed'?text('Your account has been deleted.','你的账号已删除。','Tu cuenta se ha eliminado.'):text('Your data has been removed. Login-account deletion is queued for retry.','个人资料已移除，登录账号的删除正在等待重试。','Tus datos se han eliminado. La eliminación del acceso está pendiente de reintento.');
    await window.FoodRescueAuth.logout();
   }catch{error.textContent=text('Connection interrupted. Reload to check your account before retrying.','连接中断，请刷新确认账号状态后重试。','Conexión interrumpida. Recarga para comprobar el estado.');}
   finally{if(dialog.open){cancel.disabled=false;input.disabled=false;confirm.disabled=input.value!=='DELETE';}}
  };
  dialog.append(heading,warning,label,input,error,cancel,confirm);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();input.focus();
 };
}
new MutationObserver(mount).observe(document.getElementById('content'),{childList:true});mount();
})();
