import {createClient} from '@supabase/supabase-js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export const deletionEnabled=env=>env.ACCOUNT_DELETION_ENABLED==='true';
export const deletionPending=(db,uid)=>db.prepare('SELECT status FROM account_deletions WHERE user_id=?').bind(uid).first();
export async function removeIdentity(env,uid,factory=createClient){
 const client=factory(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(15000)})}});
 const {error}=await client.auth.admin.deleteUser(uid,false);
 if(error&&error.status!==404)throw Error('Identity deletion pending');
 await env.DB.prepare("UPDATE account_deletions SET status='completed',completed=? WHERE user_id=?").bind(new Date().toISOString(),uid).run();
}
export async function retryDeletions(env,remove=removeIdentity){
 if(!deletionEnabled(env)||!env.SUPABASE_SERVICE_ROLE_KEY)return;
 const {results}=await env.DB.prepare("SELECT user_id FROM account_deletions WHERE status='pending' ORDER BY created LIMIT 20").all();
 for(const row of results){try{await remove(env,row.user_id);}catch{await env.DB.prepare('UPDATE account_deletions SET attempts=attempts+1 WHERE user_id=?').bind(row.user_id).run();}}
 // Technical identifier retained for 24 hours to block already in-flight requests.
 await env.DB.prepare("DELETE FROM account_deletions WHERE status='completed' AND completed<?").bind(new Date(Date.now()-86400000).toISOString()).run();
}
export async function deleteAccount(request,env,user,remove=removeIdentity){
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!deletionEnabled(env)||!env.SUPABASE_SERVICE_ROLE_KEY)return reply({error:'Account deletion is not available yet. No data has been deleted.'},503);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Use JSON.'},415);
 const raw=await request.text();if(raw.length>1000)return reply({error:'Invalid confirmation.'},400);
 let body;try{body=JSON.parse(raw)}catch{return reply({error:'Invalid confirmation.'},400)}
 if(body?.confirmation!=='DELETE')return reply({error:'Type DELETE to confirm.'},400);
 if(!user?.id)return reply({error:'Sign in to continue.'},401);
 // Supabase supplies last_sign_in_at; a refreshed token alone does not prove reauthentication.
 const recent=Date.parse(user.last_sign_in_at);
 if(!Number.isFinite(recent)||recent>Date.now()+60000||Date.now()-recent>15*60000)return reply({error:'Sign out and verify your email again before deleting your account.'},401);
 const existing=await deletionPending(env.DB,user.id);if(existing)return reply({status:existing.status},existing.status==='completed'?200:202);
 const db=env.DB,uid=user.id,anon='deleted:'+crypto.randomUUID(),now=new Date().toISOString();
 const owned="SELECT id FROM organizations WHERE owner=?";
 const affected=`SELECT id FROM listings WHERE owner=? OR org_id IN (${owned})`;
 const stmt=(sql,...values)=>db.prepare(sql).bind(...values);
 await db.batch([
  stmt('INSERT INTO account_deletions(user_id,created) VALUES(?,?)',uid,now),
  stmt(`INSERT INTO notifications(id,user_id,kind,listing_title,created) SELECT 'closed:'||r.id||':'||?,r.user_id,'Pickup cancelled by organization','Food pickup',? FROM reservations r WHERE r.listing_id IN (${affected}) AND r.status='reserved' AND r.user_id!=? AND NOT EXISTS(SELECT 1 FROM account_deletions d WHERE d.user_id=r.user_id)`,anon,now,uid,uid,uid),
  stmt(`UPDATE reservations SET status=CASE WHEN status='reserved' THEN 'cancelled' ELSE status END,code='',assisted_label=NULL,user_id=CASE WHEN user_id=? THEN ? ELSE user_id END WHERE user_id=? OR listing_id IN (${affected}) OR reserver_org IN (${owned})`,uid,anon,uid,uid,uid,uid),
  stmt(`UPDATE listings SET owner=?,publisher='Removed organization',title='Removed food listing',notes='',address='',town='',photo='',status='withdrawn',version=version+1 WHERE owner=? OR org_id IN (${owned})`,anon,uid,uid),
  stmt(`UPDATE profiles SET org_id=NULL,role='resident' WHERE user_id!=? AND org_id IN (${owned}) AND NOT EXISTS(SELECT 1 FROM account_deletions d WHERE d.user_id=profiles.user_id)`,uid,uid),
  stmt(`DELETE FROM members WHERE user_id=? OR org_id IN (${owned})`,uid,uid),
  stmt("UPDATE organizations SET owner=?,name='Removed organization',website='',phone='',address='',review_note='',status='closed' WHERE owner=?",anon,uid),
  stmt('DELETE FROM notifications WHERE user_id=?',uid),
  stmt('DELETE FROM profiles WHERE user_id=?',uid)
 ]);
 try{await remove(env,uid);return reply({status:'completed'});}catch{return reply({status:'pending'},202);}
}

