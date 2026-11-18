import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import vm from 'node:vm';
import {authenticatedUser,route} from '../src/worker.mjs';

const env={SUPABASE_URL:'https://ctwdvduchftekmcafciv.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
const request=(path,token,data,extra={})=>new Request('https://food.test'+path,{method:data?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(data?{'Content-Type':'application/json',Origin:'https://food.test'}:{}),...extra},body:data?JSON.stringify(data):undefined});
const factory=(user,error=null)=>()=>({auth:{getUser:async()=>({data:{user},error})}});
test('Only server-validated, email-confirmed tokens establish identity',async()=>{
 assert.equal(await authenticatedUser(request('/api/state',null,null,{'oai-authenticated-user-id':'forged'}),env),null);
 assert.equal(await authenticatedUser(request('/api/state','fake'),env,factory(null,{status:401})),null);
 assert.equal(await authenticatedUser(request('/api/state','pending'),env,factory({id:'u',email_confirmed_at:null})),null);
 assert.equal((await authenticatedUser(request('/api/state','valid'),env,factory({id:'u',email_confirmed_at:'2026-10-08'}))).id,'u');
 await assert.rejects(()=>authenticatedUser(request('/api/state','valid'),env,factory(null,{status:503})));
});
test('API rejects anonymous and cross-origin requests; verified accounts remain isolated',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('migrations/0001_initial.sql','utf8'));sqlite.exec(readFileSync('migrations/0002_community.sql','utf8'));
 const DB={prepare(sql){const st=sqlite.prepare(sql);let args=[];return{bind(...values){args=values;return this;},async first(){return st.get(...args)||null;},async all(){return{results:st.all(...args)};},async run(){return{meta:st.run(...args)};}};}};
 const configured={...env,DB};
 const verify=async req=>req.headers.get('Authorization')==='Bearer alice'?{id:'alice'}:req.headers.get('Authorization')==='Bearer bob'?{id:'bob'}:null;
 assert.equal((await route(request('/api/state',null,null,{'oai-authenticated-user-id':'alice'}),configured,verify)).status,401);
 assert.equal((await route(request('/api/profile','alice',{role:'foodbank',name:'Bank'}, {Origin:'https://evil.test'}),configured,verify)).status,403);
 assert.equal((await route(request('/api/profile','alice',{role:'foodbank',name:'Bank',user_id:'bob'},{'oai-authenticated-user-id':'bob'}),configured,verify)).status,200);
 assert.equal((await (await route(request('/api/state','alice'),configured,verify)).json()).profile.role,'foodbank');
 assert.equal((await (await route(request('/api/state','bob'),configured,verify)).json()).profile,null);
 assert.equal((await route(request('/api/state','alice'),configured,async()=>{throw Error('network');})).status,503);
 sqlite.close();
});

// Exercise the real UI controller with a tiny DOM and deterministic Auth transport.
// No messages are sent and no production account/session is created by these tests.
function browser({session=null,verifyError=null,search='',pending=null,loginPage=true,signoutError=null}={}){
 const elements=new Map();
 const make=id=>({id,value:'',hidden:false,disabled:false,textContent:'',dataset:{},focus(){this.focused=true;},addEventListener(){}});
 for(const id of ['email-form','code-form','email','otp','send-code','resend-code','change-email','verify-code','retry-setup','auth-status','auth-language','sent-email','cooldown'])elements.set(id,make(id));
 if(!loginPage){elements.delete('email-form');for(const id of ['auth-signout','auth-email','notice','language'])elements.set(id,make(id));}
 const values=new Map(pending?[['foodrescue-pending',JSON.stringify(pending)]]:[]);
 const storage={getItem:key=>values.get(key)||null,setItem:(key,val)=>values.set(key,val),removeItem:key=>values.delete(key)};
 const calls={send:[],verify:[],redirects:[],signout:[]};
 const auth={getSession:async()=>({data:{session},error:null}),onAuthStateChange:()=>{},signInWithOtp:async input=>{calls.send.push(input);return{error:null};},verifyOtp:async input=>{calls.verify.push(input);return{data:{session:verifyError?null:{access_token:'TEST_ONLY',user:{email:input.email}}},error:verifyError};},stopAutoRefresh(){},signOut:async input=>{calls.signout.push(input);return{error:signoutError};}};
 const context={createClient:()=>({auth}),document:{getElementById:id=>elements.get(id)||null,querySelectorAll:()=>[],documentElement:{}},localStorage:storage,sessionStorage:storage,location:{search,hash:'',replace:url=>calls.redirects.push(url)},fetch:async()=>({ok:true,json:async()=>({url:env.SUPABASE_URL,publishableKey:env.SUPABASE_PUBLISHABLE_KEY})}),URLSearchParams,Date,TypeError,Error,setInterval:()=>0,window:{addEventListener(){}}};
 vm.createContext(context);vm.runInContext(readFileSync('src/auth-client.js','utf8').replace("import {createClient} from '@supabase/supabase-js';",''),context);
 return{elements,calls,context,values,auth};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const submit={preventDefault(){}};
test('Email → code → verified session returns to the intended pickup page',async()=>{
 const b=browser({search:'?next=%2Fcommunity%23reservations'});await b.context.window.FoodRescueAuth.ready;
 b.elements.get('email').value='neighbor@example.com';b.elements.get('email-form').onsubmit(submit);await flush();
 assert.equal(b.calls.send.length,1);assert.equal(b.elements.get('code-form').hidden,false);assert.equal(b.elements.get('resend-code').disabled,true);
 b.elements.get('resend-code').onclick();await flush();assert.equal(b.calls.send.length,1);
 b.elements.get('otp').value='12345678';await b.elements.get('code-form').onsubmit(submit);
 assert.equal(b.calls.verify[0].type,'email');assert.equal(b.calls.redirects[0],'/community#reservations');assert.equal(b.values.has('foodrescue-pending'),false);assert.equal(b.elements.get('otp').value,'');
});
test('Invalid and expired code remains on the form with localized feedback',async()=>{
 const b=browser({verifyError:{status:403,code:'otp_expired'},pending:{email:'neighbor@example.com',nextSend:0}});await b.context.window.FoodRescueAuth.ready;
 b.elements.get('auth-language').onchange({target:{value:'zh'}});
 b.elements.get('otp').value='123';await b.elements.get('code-form').onsubmit(submit);assert.equal(b.calls.verify.length,0);
 b.elements.get('otp').value='12345678';await b.elements.get('code-form').onsubmit(submit);
 assert.equal(b.calls.redirects.length,0);assert.match(b.elements.get('auth-status').textContent,/过期/);assert.equal(b.elements.get('verify-code').disabled,false);
 b.elements.get('auth-language').onchange({target:{value:'es'}});assert.match(b.elements.get('auth-status').textContent,/caducado/);
 b.elements.get('change-email').onclick();assert.equal(b.elements.get('email-form').hidden,false);assert.equal(b.elements.get('code-form').hidden,true);
});
test('Existing session resumes safely; arbitrary redirect URLs are rejected',async()=>{
 const b=browser({session:{access_token:'TEST_ONLY',user:{email:'neighbor@example.com'}},search:'?next=https://evil.test'});await b.context.window.FoodRescueAuth.ready;assert.equal(b.calls.redirects[0],'/community');
});
test('Workspace requires a session and signs out the current session',async()=>{
 const anonymous=browser({loginPage:false});await anonymous.context.window.FoodRescueAuth.ready;
 assert.equal(anonymous.calls.redirects[0],'/login?next=%2Fcommunity');
 const b=browser({loginPage:false,session:{access_token:'TEST_ONLY',user:{email:'neighbor@example.com'}}});await b.context.window.FoodRescueAuth.ready;
 assert.equal(b.elements.get('auth-email').textContent,'neighbor@example.com');
 assert.equal(await b.context.window.FoodRescueAuth.getAccessToken(),'TEST_ONLY');
 await b.elements.get('auth-signout').onclick();assert.equal(b.calls.signout[0].scope,'local');assert.equal(b.calls.redirects[0],'/login');
});
test('Failed sign-out stays visible and retryable, rather than claiming success',async()=>{
 const b=browser({loginPage:false,session:{access_token:'TEST_ONLY',user:{email:'neighbor@example.com'}},signoutError:Error('network')});await b.context.window.FoodRescueAuth.ready;
 await b.elements.get('auth-signout').onclick();assert.equal(b.calls.redirects.length,0);assert.equal(b.elements.get('auth-signout').disabled,false);assert.match(b.elements.get('notice').textContent,/Could not sign out/);
});
