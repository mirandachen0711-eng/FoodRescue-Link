const categories=['Prepared Hot','Prepared Cold','Bakery','Fresh Produce','Packaged'];
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
class ApiError extends Error{constructor(message,status=400){super(message);this.status=status}}
const requireText=(v,max=200)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new ApiError('Check the required fields.');return v.trim()};
const optional=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
export async function handleApi(request,db,uid){
 try{
  if(!db)return response({error:'Service unavailable. Please try again.'},503);
  if(!uid)return response({error:'Sign in to continue.'},401);
  const path=new URL(request.url).pathname,now=new Date().toISOString();
  const profile=await db.prepare('SELECT role,name FROM profiles WHERE user_id=?').bind(uid).first();
  if(request.method==='GET'&&path==='/api/state'){
    const all=await db.prepare(`SELECT l.*,l.owner=? AS mine, l.total-COALESCE((SELECT SUM(r.quantity) FROM reservations r WHERE r.listing_id=l.id AND r.status!='cancelled'),0) AS remaining FROM listings l ORDER BY l.created DESC LIMIT 500`).bind(uid).all();
    const own=await db.prepare(`SELECT r.*,l.title,l.address,l.town,l.deadline,l.weight,l.category,l.owner=? AS publisher_owned,COALESCE((SELECT SUM(c.total*c.weight) FROM listings c WHERE c.source=r.id),0) AS redistributed_weight FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.user_id=? OR l.owner=? ORDER BY r.created DESC LIMIT 500`).bind(uid,uid,uid).all();
    const impact=await db.prepare(`SELECT COALESCE(SUM(r.quantity*l.weight),0) AS pounds FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.status='collected' AND l.source IS NULL`).first();
    return response({profile,listings:all.results.filter(l=>l.audience==='everyone'||l.mine||profile?.role==='foodbank').map(({owner,...l})=>l),reservations:own.results.map(({user_id,...r})=>({...r,mine:user_id===uid})),impact:impact.pounds});
  }
  if(request.method!=='POST')return response({error:'Not found.'},404);
  const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)throw new ApiError('Request not allowed.',403);
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))throw new ApiError('Request not allowed.',415);
  const raw=await request.text();if(raw.length>12000)throw new ApiError('Check the required fields.');let body;try{body=JSON.parse(raw)}catch{throw new ApiError('Check the required fields.')}
  if(path==='/api/profile'){
    if(!['resident','donor','foodbank'].includes(body.role))throw new ApiError('Check the required fields.');
    const name=body.role==='resident'?'':requireText(body.name,100);
    await db.prepare('INSERT INTO profiles(user_id,role,name) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,name=excluded.name').bind(uid,body.role,name).run();return response({ok:true});
  }
  if(!profile)throw new ApiError('Choose how you will use the community.',403);
  if(path==='/api/listings'){
    if(!['donor','foodbank'].includes(profile.role))throw new ApiError('Only publishers can post food.',403);
    const title=requireText(body.title,120),address=requireText(body.address,200),town=requireText(body.town,100),notes=optional(body.notes);
    const {category,audience,total,weight,temp}=body;
    if(!categories.includes(category)||!['everyone','organizations'].includes(audience)||!Number.isInteger(total)||total<1||total>10000||!Number.isFinite(weight)||weight<=0||weight>10000||body.certified!==true)throw new ApiError('Check the required fields.');
    const deadline=new Date(body.deadline);if(!Number.isFinite(deadline.getTime())||deadline<=new Date())throw new ApiError('Choose a future pickup deadline.');
    if((category==='Prepared Hot'||category==='Prepared Cold')&&(!Number.isFinite(temp)||temp< -100||temp>500||(category==='Prepared Hot'?temp<135:temp>41)))throw new ApiError('Check the holding temperature.');
    const source=body.source||null,id=crypto.randomUUID();
    const args=[id,uid,profile.name,profile.role,title,category,audience,total,weight,Number.isFinite(temp)?temp:null,deadline.toISOString(),address,town,notes,source,now];
    let result;
    if(source){
      if(profile.role!=='foodbank')throw new ApiError('Only food banks can redistribute a pickup.',403);
      result=await db.prepare(`INSERT INTO listings(id,owner,publisher,publisher_role,title,category,audience,total,weight,temp,deadline,address,town,notes,source,created) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM reservations r JOIN listings l ON l.id=r.listing_id WHERE r.id=? AND r.user_id=? AND r.status='collected' AND r.quantity*l.weight-COALESCE((SELECT SUM(c.total*c.weight) FROM listings c WHERE c.source=r.id),0)>=? AND l.deadline>=?)`).bind(...args,source,uid,total*weight,deadline.toISOString()).run();
    }else result=await db.prepare('INSERT INTO listings(id,owner,publisher,publisher_role,title,category,audience,total,weight,temp,deadline,address,town,notes,source,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...args).run();
    if(!result.meta.changes)throw new ApiError('Not enough collected food remains, or the original deadline would be exceeded.',409);return response({ok:true,id});
  }
  if(path==='/api/reserve'){
    if(!['resident','foodbank'].includes(profile.role))throw new ApiError('Choose a resident or food bank account to reserve.',403);
    const q=body.quantity;if(!Number.isInteger(q)||q<1||q>10000)throw new ApiError('Check the required fields.');
    const id=crypto.randomUUID(),code=crypto.randomUUID().slice(0,8).toUpperCase();
    const result=await db.prepare(`INSERT INTO reservations(id,listing_id,user_id,quantity,status,code,created) SELECT ?,l.id,?,?,'reserved',?,? FROM listings l WHERE l.id=? AND l.owner!=? AND l.deadline>? AND (l.audience='everyone' OR ?='foodbank') AND l.total-COALESCE((SELECT SUM(r.quantity) FROM reservations r WHERE r.listing_id=l.id AND r.status!='cancelled'),0)>=? AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.listing_id=l.id AND r.user_id=? AND r.status!='cancelled')`).bind(id,uid,q,code,now,body.listingId,uid,now,profile.role,q,uid).run();
    if(!result.meta.changes)throw new ApiError('This food is unavailable, already reserved by you, or not open to your account.',409);return response({ok:true,code});
  }
  if(path==='/api/cancel'){
    const result=await db.prepare("UPDATE reservations SET status='cancelled' WHERE id=? AND user_id=? AND status='reserved'").bind(body.id,uid).run();if(!result.meta.changes)throw new ApiError('Reservation cannot be changed.',409);return response({ok:true});
  }
  if(path==='/api/collect'){
    const result=await db.prepare(`UPDATE reservations SET status='collected' WHERE id=? AND code=? AND status='reserved' AND EXISTS(SELECT 1 FROM listings l WHERE l.id=reservations.listing_id AND l.owner=? AND l.deadline>?)`).bind(body.id,optional(body.code,20).toUpperCase(),uid,now).run();if(!result.meta.changes)throw new ApiError('Check the pickup code and deadline.',409);return response({ok:true});
  }
  return response({error:'Not found.'},404);
 }catch(e){return response({error:e instanceof ApiError?e.message:'Service unavailable. Please try again.'},e instanceof ApiError?e.status:500)}
}
