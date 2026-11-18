import {queueReminders} from './community-api.mjs';
const text=s=>String(s||'').replace(/[\r\n]+/g,' ');
export async function deliverNotifications(env,send=fetch,now=Date.now()){
 await queueReminders(env.DB,new Date(now));
 if(!env.RESEND_API_KEY||!env.PUBLIC_APP_URL)return{enabled:false,sent:0};
 const origin=new URL(env.PUBLIC_APP_URL);if(origin.protocol!=='https:')throw Error('PUBLIC_APP_URL must use HTTPS');
 const timestamp=Math.floor(now/1000);
 // email_sent: 0=queued, positive=delivery lease timestamp, -1=delivered.
 // A five-minute lease handles overlapping invocations and recovers after crashes.
 const pending=(await env.DB.prepare(`SELECT n.*,p.email FROM notifications n JOIN profiles p ON p.user_id=n.user_id WHERE p.reminders=1 AND p.email!='' AND (n.email_sent=0 OR (n.email_sent>0 AND n.email_sent<?)) ORDER BY n.created LIMIT 50`).bind(timestamp-300).all()).results;
 let sent=0;
 for(const n of pending){
  const claim=await env.DB.prepare('UPDATE notifications SET email_sent=? WHERE id=? AND email_sent=?').bind(timestamp,n.id,n.email_sent).run();
  if(!claim.meta.changes)continue;
  const pickupUrl=new URL('/community#pickups',origin).href;
  const body={from:'FoodRescue Link <noreply@foodrescuelink.org>',to:[n.email],subject:'FoodRescue Link — Pickup update / 领取通知 / Aviso de recogida',text:`${text(n.kind)}: ${text(n.listing_title)}\n\nCheck your current pickup time, status and details in the app.\n请在 app 查看当前领取时间、状态及说明。\nConsulta el horario, estado y detalles actuales en la app.\n\n${pickupUrl}\n\nManage email reminders in My account.\n可在“我的账号”修改邮件提醒设置。\nGestiona los avisos por correo en Mi cuenta.`};
  const key=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(n.id));
  const idempotencyKey='notice-'+Array.from(new Uint8Array(key),v=>v.toString(16).padStart(2,'0')).join('');
  try{
   const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error('Delivery unavailable');
   await env.DB.prepare('UPDATE notifications SET email_sent=-1 WHERE id=? AND email_sent=?').bind(n.id,timestamp).run();sent++;
  }catch{await env.DB.prepare('UPDATE notifications SET email_sent=0 WHERE id=? AND email_sent=?').bind(n.id,timestamp).run();}
 }
 return{enabled:true,sent};
}
