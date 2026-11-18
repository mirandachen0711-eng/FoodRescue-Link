const CATEGORIES=['Prepared Hot','Prepared Cold','Bakery','Fresh Produce','Packaged'];
export const ALLERGENS=['Milk','Eggs','Fish','Shellfish','Tree nuts','Peanuts','Wheat','Soy','Sesame','Unknown'];
export const DIETARY=['Vegetarian','Vegan','No pork'];
export const INSTRUCTIONS=['Bring a bag','Use main entrance','Use side entrance','Ask at reception','Wheelchair accessible'];
class Problem extends Error{constructor(message,status=400){super(message);this.status=status;}}
const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const required=(value,max=200)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new Problem('Check the required fields.');return value.trim();};
const optional=(value,max=500)=>typeof value==='string'?value.trim().slice(0,max):'';
const integer=(v,min,max)=>{if(!Number.isInteger(v)||v<min||v>max)throw new Problem('Check the required fields.');return v;};
const choices=(v,allowed)=>{if(!Array.isArray(v)||v.some(x=>!allowed.includes(x)))throw new Problem('Check the required fields.');return JSON.stringify([...new Set(v)]);};
const rows=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const changes=result=>Number(result.meta.changes)>0;
const reserved="status IN ('reserved','collected')";
const remaining="l.total-COALESCE((SELECT SUM(r.quantity) FROM reservations r WHERE r.listing_id=l.id AND r.status IN ('reserved','collected')),0)";
export function validatePhoto(value){
 if(value==='')return '';
 if(typeof value!=='string'||value.length>140000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))throw new Problem('Choose a valid photo.');
 let bytes;try{bytes=atob(value.split(',')[1]);}catch{throw new Problem('Choose a valid photo.');}
 if(!bytes.startsWith('\xff\xd8\xff')||!bytes.endsWith('\xff\xd9'))throw new Problem('Choose a valid photo.');
 return value;
}
function listingInput(body){
 const title=required(body.title,120),category=body.category,audience=body.audience;
 if(!CATEGORIES.includes(category)||!['everyone','organizations'].includes(audience)||body.certified!==true)throw new Problem('Check the required fields.');
 const total=integer(body.total,1,10000),per_person=integer(body.per_person,1,10000),weight=Number(body.weight);
 if(!Number.isFinite(weight)||weight<=0||weight>10000||per_person>total)throw new Problem('Check the required fields.');
 const start=new Date(body.pickup_start),end=new Date(body.deadline);
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=new Date()||start>=end)throw new Problem('Choose a valid pickup time window.');
 const temp=body.temp;
 if(['Prepared Hot','Prepared Cold'].includes(category)&&(!Number.isFinite(temp)||temp< -100||temp>500||(category==='Prepared Hot'?temp<135:temp>41)))throw new Problem('Check the holding temperature.');
 return{...(body.photo===undefined?{}:{photo:validatePhoto(body.photo)}),title,category,audience,total,weight,temp:Number.isFinite(temp)?temp:null,deadline:end.toISOString(),address:required(body.address),town:required(body.town,100),notes:optional(body.notes),pickup_start:start.toISOString(),per_person,allergens:choices(body.allergens,ALLERGENS),dietary:choices(body.dietary,DIETARY),instructions:choices(body.instructions,INSTRUCTIONS)};
}
const canManage=(l,uid,org)=>!!l&&(l.org_id?l.org_id===org?.id:l.owner===uid);
async function alertReservations(db,listingId,kind,title){
 const recipients=await rows(db,"SELECT DISTINCT user_id FROM reservations WHERE listing_id=? AND status='reserved' AND assisted_label IS NULL",listingId);
 const now=new Date().toISOString();
 return recipients.map(r=>db.prepare('INSERT INTO notifications(id,user_id,kind,listing_title,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),r.user_id,kind,title,now));
}
export async function queueReminders(db,now=new Date()){
 // A deterministic ID prevents duplicate notices across page loads and scheduled runs.
 await run(db,`INSERT OR IGNORE INTO notifications(id,user_id,kind,listing_title,created)
 SELECT 'reminder:'||r.id||':'||l.deadline,r.user_id,'Pickup reminder',l.title,? FROM reservations r JOIN listings l ON l.id=r.listing_id
 WHERE r.status='reserved' AND r.assisted_label IS NULL AND l.status!='withdrawn' AND l.deadline>? AND l.pickup_start<=?`,now.toISOString(),now.toISOString(),new Date(now.getTime()+2*3600000).toISOString());
}
export async function communityApi(request,db,identity){
 try{
  if(!db)return reply({error:'Service unavailable. Please try again.'},503);
  const {uid,email='',admin=false}=identity||{},path=new URL(request.url).pathname,now=new Date().toISOString();
  if(path==='/api/public'&&request.method==='GET'){
   const listings=await rows(db,`SELECT l.id,l.photo,l.title,l.publisher,l.publisher_role,l.category,l.pickup_start,l.deadline,l.address,l.town,l.notes,l.allergens,l.dietary,l.instructions,l.per_person,${remaining} AS remaining FROM listings l JOIN organizations o ON o.id=l.org_id AND o.status='approved' WHERE l.status='active' AND l.audience='everyone' AND l.deadline>? AND ${remaining}>0 ORDER BY l.deadline LIMIT 200`,now);
   return reply({listings});
  }
  if(!uid)return reply({error:'Sign in to continue.'},401);
  const profile=await one(db,'SELECT role,name,org_id,reminders FROM profiles WHERE user_id=?',uid);
  const membership=profile?.org_id?await one(db,'SELECT * FROM members WHERE org_id=? AND user_id=?',profile.org_id,uid):null;
  const organization=membership?await one(db,'SELECT * FROM organizations WHERE id=?',membership.org_id):null;
  const org=profile?.role!=='resident'&&membership?.status==='active'&&organization?.status==='approved'?organization:null;
  const bank=org?.kind==='foodbank',staff=!!org,orgId=org?.id||'';
  if(request.method==='GET'&&path==='/api/state'){
   if(email&&profile)await run(db,'UPDATE profiles SET email=? WHERE user_id=?',email,uid);
   await queueReminders(db);
   const listings=await rows(db,`SELECT l.*,o.status AS organization_status,${remaining} AS remaining FROM listings l LEFT JOIN organizations o ON o.id=l.org_id WHERE (l.deadline>? AND l.status!='withdrawn') OR l.owner=? OR l.org_id=? ORDER BY l.created DESC LIMIT 500`,now,uid,orgId);
   const reservations=await rows(db,`SELECT r.*,l.title,l.address,l.town,l.deadline,l.pickup_start,l.weight,l.category,l.status AS listing_status,l.owner,l.org_id,l.notes,l.allergens,l.instructions,COALESCE((SELECT SUM(c.total*c.weight) FROM listings c WHERE c.source=r.id),0) AS redistributed_weight FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.user_id=? OR r.reserver_org=? OR (l.org_id IS NULL AND l.owner=?) OR l.org_id=? ORDER BY r.created DESC LIMIT 500`,uid,orgId,uid,orgId);
   const ownOrg=organization?{...organization,owner:undefined,isOwner:organization.owner===uid,membership_status:membership.status}:null;
   const team=org&&organization.owner===uid?await rows(db,'SELECT user_id,display_name,role,status FROM members WHERE org_id=? ORDER BY created',org.id):[];
   const applications=admin?await rows(db,"SELECT id,name,kind,website,phone,address,status,review_note,created FROM organizations ORDER BY created DESC LIMIT 200"):[];
   const availableOrgs=await rows(db,"SELECT id,name,kind FROM organizations WHERE status='approved' ORDER BY name LIMIT 200");
   const notices=await rows(db,'SELECT id,kind,listing_title,created,seen FROM notifications WHERE user_id=? ORDER BY created DESC LIMIT 100',uid);
   const impact=await one(db,"SELECT COALESCE(SUM(r.quantity*l.weight),0) AS pounds FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.status='collected' AND l.source IS NULL");
   return reply({profile,organization:ownOrg,team,applications,availableOrgs,notices,admin,canPublish:staff,canReserve:profile?.role==='resident'||bank,listings:listings.filter(l=>canManage(l,uid,org)||(l.organization_status==='approved'&&l.status==='active'&&(l.audience==='everyone'||bank))).map(l=>{const mine=canManage(l,uid,org);const {owner,org_id,...safe}=l;return{...safe,mine};}),reservations:reservations.map(r=>{const mine=r.user_id===uid||r.reserver_org===orgId&&!!orgId;const publisher_owned=canManage(r,uid,org);const {user_id,owner,org_id,reserver_org,code,...safe}=r;return{...safe,mine,publisher_owned,code:mine||r.assisted_label&&publisher_owned?code:undefined};}),impact:impact.pounds});
  }
  if(request.method!=='POST')return reply({error:'Not found.'},404);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)throw new Problem('Request not allowed.',403);
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))throw new Problem('Request not allowed.',415);
  const raw=await request.text();if(raw.length>(path==='/api/listings'||path==='/api/listings/update'?160000:16000))throw new Problem('Check the required fields.');let b;try{b=JSON.parse(raw);}catch{throw new Problem('Check the required fields.');}
  if(!b||typeof b!=='object'||Array.isArray(b))throw new Problem('Check the required fields.');
  if(path==='/api/profile'){
   if(!['resident','donor','foodbank'].includes(b.role))throw new Problem('Check the required fields.');
   if(b.role!=='resident'&&org&&b.role!==org.kind)throw new Problem('Use your organization account type.');
   await run(db,'INSERT INTO profiles(user_id,role,name,email,reminders) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,email=excluded.email,reminders=excluded.reminders',uid,b.role,'',email,b.reminders===true?1:0);return reply({ok:true});
  }
  if(path==='/api/organization/apply'){
   if(!profile||!['foodbank','donor'].includes(profile.role))throw new Problem('Choose an organization account first.',403);
   if(organization&&organization.status!=='rejected')throw new Problem('An organization application already exists.',409);
   const name=required(b.name,100),website=required(b.website),phone=required(b.phone,40),address=required(b.address);
   try{const url=new URL(website);if(url.protocol!=='https:'&&url.protocol!=='http:')throw 0;}catch{throw new Problem('Enter an official website URL.');}
   const id=organization?.id||crypto.randomUUID();
   await db.batch([db.prepare("INSERT INTO organizations(id,owner,name,kind,website,phone,address,status,created) VALUES(?,?,?,?,?,?,?,'pending',?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,website=excluded.website,phone=excluded.phone,address=excluded.address,status='pending',review_note='' ").bind(id,uid,name,profile.role,website,phone,address,now),db.prepare("INSERT INTO members(org_id,user_id,display_name,role,status,created) VALUES(?,?,?,'owner','active',?) ON CONFLICT(org_id,user_id) DO NOTHING").bind(id,uid,required(b.display_name,80),now),db.prepare('UPDATE profiles SET org_id=? WHERE user_id=?').bind(id,uid)]);return reply({ok:true});
  }
  if(path==='/api/organization/review'){
   if(!admin)throw new Problem('Administrator access required.',403);
   if(!['approved','rejected'].includes(b.status))throw new Problem('Check the required fields.');
   const note=required(b.note,500),application=await one(db,'SELECT * FROM organizations WHERE id=?',b.id);
   if(!application||application.status!=='pending')throw new Problem('Application is no longer pending.',409);
   await db.batch([db.prepare('UPDATE organizations SET status=?,review_note=? WHERE id=? AND status=\'pending\'').bind(b.status,note,b.id),db.prepare('INSERT INTO notifications(id,user_id,kind,listing_title,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),application.owner,b.status==='approved'?'Organization approved':'Organization declined',application.name,now)]);return reply({ok:true});
  }
  if(path==='/api/team/join'){
   if(!profile)throw new Problem('Choose how you will use the community.',403);
   if(membership&&['active','pending'].includes(membership.status))throw new Problem('Leave your current organization before joining another.',409);
   const target=await one(db,"SELECT * FROM organizations WHERE id=? AND status='approved'",b.org_id);if(!target)throw new Problem('Organization unavailable.',404);
   await db.batch([db.prepare("INSERT INTO members(org_id,user_id,display_name,role,status,created) VALUES(?,?,?,'staff','pending',?) ON CONFLICT(org_id,user_id) DO UPDATE SET display_name=excluded.display_name,status='pending'").bind(target.id,uid,required(b.display_name,80),now),db.prepare('UPDATE profiles SET org_id=?,role=? WHERE user_id=?').bind(target.id,target.kind,uid)]);return reply({ok:true});
  }
  if(path==='/api/team/review'){
   if(!org||org.owner!==uid)throw new Problem('Organization owner access required.',403);
   if(b.user_id===uid||!['active','removed'].includes(b.status))throw new Problem('Request not allowed.',403);
   if(!changes(await run(db,"UPDATE members SET status=? WHERE org_id=? AND user_id=? AND role!='owner'",b.status,org.id,b.user_id)))throw new Problem('Member not found.',404);return reply({ok:true});
  }
  if(path==='/api/team/leave'){
   if(organization?.owner===uid)throw new Problem('The organization owner cannot leave.',409);
   await db.batch([db.prepare("UPDATE members SET status='removed' WHERE user_id=? AND org_id=?").bind(uid,profile?.org_id||''),db.prepare("UPDATE profiles SET org_id=NULL,role='resident' WHERE user_id=?").bind(uid)]);return reply({ok:true});
  }
  if(path==='/api/notices/read'){await run(db,'UPDATE notifications SET seen=1 WHERE user_id=?',uid);return reply({ok:true});}
  if(!profile)throw new Problem('Choose how you will use the community.',403);
  if(path==='/api/listings'||path==='/api/listings/update'){
   if(!staff)throw new Problem('An approved organization is required.',403);
   const input=listingInput(b),keys=Object.keys(input),source=b.source||null;
   if(source){const original=await one(db,`SELECT r.*,l.deadline,l.weight,COALESCE((SELECT SUM(c.total*c.weight) FROM listings c WHERE c.source=r.id AND c.id!=?),0) AS used FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.id=?`,b.id||'',source);
    if(!bank||!original||original.status!=='collected'||!(original.user_id===uid||original.reserver_org===org.id)||input.deadline>original.deadline||original.quantity*original.weight-original.used<input.total*input.weight)throw new Problem('Redistribution exceeds the collected amount or deadline.',409);
   }
   if(path.endsWith('/update')){
    const old=await one(db,'SELECT * FROM listings WHERE id=?',b.id);if(!canManage(old,uid,org))throw new Problem('Request not allowed.',403);
    if(old.status==='withdrawn'||old.source!==source)throw new Problem('Listing cannot be changed.',409);
    const committed=await one(db,`SELECT COALESCE(SUM(quantity),0) AS quantity,MAX(quantity) AS largest FROM reservations WHERE listing_id=? AND ${reserved}`,b.id);
    if(input.total<committed.quantity||input.per_person<(committed.largest||0))throw new Problem('Keep enough portions for existing reservations.',409);
    if(old.weight!==input.weight||old.category!==input.category||old.title!==input.title){if(committed.quantity>0)throw new Problem('Keep the reserved food and portion size unchanged.',409);}
    const notices=await alertReservations(db,b.id,'Pickup details changed',input.title);
    // All checks affecting inventory are repeated in the atomic SQL write.
    const result=await run(db,`UPDATE listings SET ${keys.map(k=>k+'=?').join(',')},org_id=?,publisher=?,publisher_role=?,version=version+1 WHERE id=? AND version=? AND status!='withdrawn'
     AND ? >= COALESCE((SELECT SUM(quantity) FROM reservations WHERE listing_id=? AND ${reserved}),0)
     AND ? >= COALESCE((SELECT MAX(quantity) FROM reservations WHERE listing_id=? AND ${reserved}),0)
     AND ((title=? AND category=? AND weight=?) OR NOT EXISTS(SELECT 1 FROM reservations WHERE listing_id=? AND ${reserved}))
     AND (? IS NULL OR (SELECT r.quantity*l.weight FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.id=?) >= ? + COALESCE((SELECT SUM(total*weight) FROM listings WHERE source=? AND id!=?),0))`,...keys.map(k=>input[k]),org.id,org.name,org.kind,b.id,b.version,input.total,b.id,input.per_person,b.id,input.title,input.category,input.weight,b.id,source,source,input.total*input.weight,source,b.id);
    if(!changes(result))throw new Problem('This listing changed. Refresh and try again.',409);
    if(notices.length)await db.batch(notices);return reply({ok:true});
   }
   const id=crypto.randomUUID();
   const sql=`INSERT INTO listings(id,owner,publisher,publisher_role,org_id,source,created,${keys.join(',')}) SELECT ${Array(7+keys.length).fill('?').join(',')} ${source?"WHERE ? >= COALESCE((SELECT SUM(total*weight) FROM listings WHERE source=?),0)+?":''}`;
   const args=[id,uid,org.name,org.kind,org.id,source,now,...keys.map(k=>input[k])];
   if(source){const cap=await one(db,'SELECT r.quantity*l.weight AS amount FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.id=?',source);args.push(cap.amount,source,input.total*input.weight);}
   if(!changes(await run(db,sql,...args)))throw new Problem('Redistribution exceeds the collected amount or deadline.',409);return reply({ok:true,id});
  }
  if(path==='/api/listings/status'){
   const l=await one(db,'SELECT * FROM listings WHERE id=?',b.id);if(!canManage(l,uid,org))throw new Problem('Request not allowed.',403);
   if(l.status==='withdrawn'||!['active','paused','withdrawn'].includes(b.status))throw new Problem('Listing cannot be changed.',409);
   const notices=b.status==='withdrawn'?await alertReservations(db,b.id,'Pickup cancelled by organization',l.title):[];
   const results=await db.batch([db.prepare("UPDATE listings SET status=?,version=version+1 WHERE id=? AND status!='withdrawn'").bind(b.status,b.id),...(b.status==='withdrawn'?[db.prepare("UPDATE reservations SET status='cancelled' WHERE listing_id=? AND status='reserved'").bind(b.id)]:[]),...notices]);if(!changes(results[0]))throw new Problem('Listing cannot be changed.',409);return reply({ok:true});
  }
  if(path==='/api/reserve'||path==='/api/reserve/assisted'){
   const assisted=path.endsWith('/assisted');if(assisted?!staff:!(profile.role==='resident'||bank))throw new Problem('This account cannot reserve food.',403);
   const l=await one(db,'SELECT * FROM listings WHERE id=?',b.listingId);if(assisted&&(!canManage(l,uid,org)||l?.audience!=='everyone'))throw new Problem('Choose your own public listing.',403);
   const quantity=integer(b.quantity,1,10000),id=crypto.randomUUID(),code=crypto.randomUUID().slice(0,8).toUpperCase(),recipient=assisted?'assisted:'+id:uid,reserverOrg=!assisted&&bank?org.id:null;
   const result=await run(db,`INSERT INTO reservations(id,listing_id,user_id,quantity,status,code,created,reserver_org,assisted_label) SELECT ?,l.id,?,?,'reserved',?,?,?,? FROM listings l WHERE l.id=? AND l.status='active' AND EXISTS(SELECT 1 FROM organizations o WHERE o.id=l.org_id AND o.status='approved') AND l.deadline>? AND (l.audience='everyone' OR ?=1) AND (?=1 OR (l.owner!=? AND COALESCE(l.org_id,'')!=?)) AND l.per_person>=? AND ${remaining}>=? AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.listing_id=l.id AND (r.user_id=? OR (?!='' AND r.reserver_org=?)) AND r.status IN ('reserved','collected'))`,id,recipient,quantity,code,now,reserverOrg,assisted?required(b.label,80):null,b.listingId,now,bank?1:0,assisted?1:0,uid,orgId,quantity,quantity,recipient,reserverOrg||'',reserverOrg||'');
   if(!changes(result))throw new Problem('Food is unavailable, already reserved, or exceeds the portion limit.',409);return reply({ok:true,code});
  }
  if(path==='/api/cancel'||path==='/api/no-show'||path==='/api/collect'){
   const r=await one(db,'SELECT r.*,l.owner,l.org_id,l.deadline,l.pickup_start FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.id=?',b.id),manage=canManage(r,uid,org),mine=r&&(r.user_id===uid||r.reserver_org===orgId&&!!orgId);
   if(!r||r.status!=='reserved')throw new Problem('Reservation cannot be changed.',409);
   if(path==='/api/cancel'){
    if(!mine&&!(manage&&r.assisted_label))throw new Problem('Request not allowed.',403);
    await run(db,"UPDATE reservations SET status='cancelled' WHERE id=? AND status='reserved'",b.id);
   }else if(path==='/api/no-show'){
    if(!manage||r.deadline>now)throw new Problem('Mark a missed pickup after its deadline.',409);
    await run(db,"UPDATE reservations SET status='no_show' WHERE id=? AND status='reserved'",b.id);
   }else{
    if(!manage||r.pickup_start>now||r.deadline<=now||r.code!==optional(b.code,20).toUpperCase())throw new Problem('Check the pickup code and time window.',409);
    if(!changes(await run(db,"UPDATE reservations SET status='collected' WHERE id=? AND status='reserved'",b.id)))throw new Problem('Reservation cannot be changed.',409);
   }return reply({ok:true});
  }
  return reply({error:'Not found.'},404);
 }catch(error){return reply({error:error instanceof Problem?error.message:'Service unavailable. Please try again.'},error instanceof Problem?error.status:500);}
}
