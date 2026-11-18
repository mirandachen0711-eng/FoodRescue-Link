import {deleteAccount,deletionEnabled,deletionPending,retryDeletions} from '../lib/account-deletion.mjs';
import {createClient} from '@supabase/supabase-js';
import {communityApi} from '../lib/community-api.mjs';
import {deliverNotifications} from '../lib/notification-mail.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function authenticatedUser(request,env,clientFactory=createClient){
  const authorization=request.headers.get('Authorization')||'';
  if(!/^Bearer [^\s]+$/i.test(authorization))return null;
  const token=authorization.slice(7);
  if(token.length>16384)return null;
  const client=clientFactory(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}
  });
  const {data,error}=await client.auth.getUser(token);
  if(error){if(error.status>=500)throw new Error('Authentication unavailable');return null;}
  return data?.user?.email_confirmed_at&&data.user.id?data.user:null;
}

export async function route(request,env,verify=authenticatedUser){
  const url=new URL(request.url);
  if(url.pathname==='/auth/config'&&request.method==='GET'){
    return json({url:env.SUPABASE_URL,publishableKey:env.SUPABASE_PUBLISHABLE_KEY});
  }
  if(url.pathname.startsWith('/api/')){
    const origin=request.headers.get('Origin');
    if(origin&&origin!==url.origin)return json({error:'Request not allowed.'},403);
    try{
      if(url.pathname==='/api/public'&&request.method==='GET')return communityApi(request,env.DB,{});
      const user=await verify(request,env);
      if(!user)return json({error:'Sign in to continue.'},401);
      if(url.pathname==='/api/account/deletion-status'&&request.method==='GET')return json({enabled:deletionEnabled(env)&&!!env.SUPABASE_SERVICE_ROLE_KEY});
      if(url.pathname==='/api/account/delete')return await deleteAccount(request,env,user);
      if(deletionEnabled(env)&&await deletionPending(env.DB,user.id))return json({error:'Account deletion in progress.'},403);
      // Identity comes only from Supabase's validated user, never request headers/body.
      return await communityApi(request,env.DB,{uid:user.id,email:user.email||'',admin:user.id==='REPLACE_WITH_ADMIN_USER_ID'});
    }catch{return json({error:'Service unavailable. Please try again.'},503);}
  }
  if(!['GET','HEAD'].includes(request.method))return json({error:'Not found.'},404);
  if(url.pathname==='/watch'||url.pathname==='/watch.html')return Response.redirect(new URL('/#demo',url).href,302);
  return env.ASSETS.fetch(request);
}

export default {async scheduled(event,env,ctx){ctx.waitUntil(deliverNotifications(env));ctx.waitUntil(retryDeletions(env));},async fetch(request,env){
  const response=await route(request,env);
  const headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  headers.set('X-Frame-Options','DENY');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  // Existing community templates use inline styles; scripts remain same-origin only.
  headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://ctwdvduchftekmcafciv.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if(/text\/html/.test(headers.get('Content-Type')||''))headers.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,headers});
}};
