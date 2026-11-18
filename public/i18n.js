// UI translations only: donation titles and organization names remain as entered.
const translations = [
['COMMUNITY WORKSPACE','社区工作区','ESPACIO COMUNITARIO'],
['New Jersey · Civic edition','新泽西州 · 社区版','Nueva Jersey · Edición cívica'],
['Dining log','捐赠记录','Registro de donaciones'],['Pantry feed','食物领取','Alimentos disponibles'],['Impact engine','公益成效','Impacto comunitario'],
['A little surplus. A big difference.','一点余粮，一份大爱。','Un pequeño excedente. Una gran diferencia.'],
['Connecting good food','让优质食物','Conectamos buenos alimentos'],['with our neighbors.','惠及社区邻里。','con nuestros vecinos.'],['Peddie Dining','Peddie 餐饮部','Comedor de Peddie'],['Community partner','社区合作伙伴','Socio comunitario'],
['Workspace / ','工作区 / ','Espacio / '],['Prototype · saved on this browser','原型 · 数据保存在此浏览器','Prototipo · guardado en este navegador'],
['PEDDIE CAMPUS RESCUE NETWORK','PEDDIE 校园食物救援网络','RED DE RESCATE ALIMENTARIO DE PEDDIE'],
['Good food. A second chance.','让好食物，再获新生。','Buena comida. Otra oportunidad.'],
["Turn today's surplus into tomorrow's possibility.",'将今天的余粮，化为明天的希望。','Transforma el excedente de hoy en oportunidades para mañana.'],
['A community worth feeding.','以食物传递社区关爱。','Una comunidad que merece alimentarse bien.'],
['Find fresh surplus, reserve a batch, and bring it to your neighbors.','寻找新鲜余粮，预约领取，为邻里送去温暖。','Encuentra excedentes frescos, reserva un lote y compártelo con tus vecinos.'],
['See the difference you make.','看见每一份善意的成效。','Descubre el impacto que generas.'],
['Every completed pickup adds to a less wasteful future.','每一次完成领取，都让未来少一份浪费。','Cada recogida completada contribuye a un futuro con menos desperdicio.'],
['Ready to rescue','待领取食物','Listo para rescatar'],['Reserved for neighbors','已为邻里预留','Reservado para la comunidad'],['Food rescued','已救援食物','Alimentos rescatados'],
['Confirmed pickups only','仅统计已完成的领取','Solo recogidas confirmadas'],['Estimated meals','估算餐数','Comidas estimadas'],['Estimated emissions avoided','估算减排量','Emisiones evitadas estimadas'],
['Illustrative estimate · 1.2 lbs / meal','示例估算 · 每餐 1.2 磅','Estimación ilustrativa · 1,2 lb por comida'],['Illustrative factor · 2.5 kg / lb','示例系数 · 每磅 2.5 千克','Factor ilustrativo · 2,5 kg por libra'],
['available batches · every pound counts','批可领取 · 每一磅都很重要','lotes disponibles · cada libra cuenta'],
['Connected with Rise Food Pantry','对接 Rise Food Pantry','En colaboración con Rise Food Pantry'],['From completed community pickups','来自社区已完成的领取','De recogidas comunitarias completadas'],
['Prepared Hot','热食','Comida caliente'],['Prepared Cold','冷食','Comida fría'],['Bakery','烘焙食品','Panadería'],['Fresh Produce','新鲜蔬果','Frutas y verduras'],['Packaged','包装食品','Envasados'],
['Available for pickup','可领取','Disponible para recoger'],['Pickup window closed','领取时间已截止','Plazo de recogida cerrado'],['Reserved','已预留','Reservado'],['Picked up','已领取','Recogido'],['Available','可领取','Disponible'],['Expired','已过期','Vencido'],
['Claim batch','预约领取','Reservar lote'],['Confirm pickup','确认已领取','Confirmar recogida'],['°F logged','°F 已记录','°F registrados'],
['Small actions. Shared impact.','点滴行动，共创改变。','Pequeñas acciones. Impacto compartido.'],['Every batch you log gives good food another chance to nourish our community.','每记录一批余粮，就为社区增添一份滋养。','Cada lote registrado da a los alimentos otra oportunidad de nutrir a nuestra comunidad.'],
['Log a surplus batch','记录一批余粮','Registrar excedentes'],['A few details can make a real difference.','填写几项信息，就能带来实际改变。','Unos pocos detalles pueden marcar la diferencia.'],
['ITEM TITLE','食物名称','NOMBRE DEL ALIMENTO'],['CATEGORY','类别','CATEGORÍA'],['WEIGHT (LBS)','重量（磅）','PESO (LB)'],['HOLD TEMPERATURE (°F)','保温温度（°F）','TEMPERATURA (°F)'],['PICKUP DEADLINE · YOUR LOCAL TIME','领取截止时间 · 你的当地时间','FECHA LÍMITE · TU HORA LOCAL'],
['e.g. Grilled chicken & brown rice','例如：烤鸡和糙米饭','Ej.: pollo a la parrilla y arroz integral'],['e.g. 35','例如：35','Ej.: 35'],['Hot hold: 135°F or above','热食保温：135°F 或以上','En caliente: 135°F o más'],['Cold hold: 41°F or below','冷食保温：41°F 或以下','En frío: 41°F o menos'],
['I confirm this food was handled properly and is suitable for donation.','我确认食物已妥善处理，适合捐赠。','Confirmo que los alimentos se manipularon correctamente y son aptos para donar.'],['Publish to rescue feed','发布到领取列表','Publicar donación'],
['Campus active log','校园捐赠记录','Registro del campus'],['No batches yet. Log your first surplus batch.','暂无记录。请登记第一批余粮。','Aún no hay lotes. Registra tu primer excedente.'],
['RECIPIENT AGENCY PORTAL','接收机构入口','PORTAL DE ORGANIZACIONES RECEPTORAS'],['Rise Food Pantry & community partners','Rise Food Pantry 与社区伙伴','Rise Food Pantry y socios comunitarios'],['Good food, closer to home. Pick up at Peddie School Dining Hall.','好食物就在身边。请前往 Peddie 学校食堂领取。','Buena comida, cerca de casa. Recoge en el comedor de Peddie School.'],
['Search batches','搜索食物批次','Buscar lotes'],['Search food or category…','搜索食物或类别…','Buscar alimento o categoría…'],['Filter by status','按状态筛选','Filtrar por estado'],['All batches','全部批次','Todos los lotes'],['Food batches','食物批次','Lotes de alimentos'],['No matching batches. Try another search or filter.','没有匹配的批次。请更换关键词或筛选条件。','No hay lotes coincidentes. Prueba otra búsqueda o filtro.'],
['Temperature is outside the prototype’s holding threshold. Correct the holding conditions before publishing.','温度超出原型设定的保温范围。请改善保温条件后再发布。','La temperatura está fuera del rango del prototipo. Corrige las condiciones antes de publicar.'],
['Enter a title, positive weight, safe logged temperature, and a future pickup deadline.','请填写食物名称、正数重量、符合要求的温度，以及未来的领取截止时间。','Introduce un nombre, un peso positivo, una temperatura válida y una fecha límite futura.'],
['Batch published. It is now available in the pantry feed.','发布成功。该批食物已出现在领取列表中。','Lote publicado. Ya aparece en los alimentos disponibles.'],['Batch published for this session. Browser storage is unavailable.','已在本次会话中发布。浏览器存储不可用。','Lote publicado para esta sesión. El almacenamiento del navegador no está disponible.'],
['This pickup window has closed.','该批食物的领取时间已截止。','El plazo de recogida ha terminado.'],['Pickup confirmed. Your impact totals have been updated.','已确认领取。公益成效统计已更新。','Recogida confirmada. Tus totales de impacto se han actualizado.'],['Batch reserved for Rise Food Pantry. Confirm pickup once collected.','已为 Rise Food Pantry 预留。领取后请确认。','Lote reservado para Rise Food Pantry. Confirma la recogida cuando se complete.'],['Changes are saved for this session only.','更改仅保存在本次会话中。','Los cambios se guardan solo durante esta sesión.'],
['Weekly surplus pattern','每周余粮分布','Excedentes semanales'],['Sample planning data · pounds logged by day','规划示例数据 · 每日记录重量（磅）','Datos de ejemplo · libras registradas por día'],['DEMO WEEK','示例周','SEMANA DE EJEMPLO'],
['Sample weekly surplus: Monday 65, Tuesday 45, Wednesday 50, Thursday 75, Friday 110, Saturday 40, Sunday 55 pounds','每周余粮示例：周一 65、周二 45、周三 50、周四 75、周五 110、周六 40、周日 55 磅','Excedentes de ejemplo: lunes 65, martes 45, miércoles 50, jueves 75, viernes 110, sábado 40 y domingo 55 libras'],
['A planning opportunity for Fridays','优化周五备餐的机会','Una oportunidad para planificar los viernes'],['This sample week peaks on Friday. Compare real dining attendance and portions before adjusting preparation.','示例周的余粮在周五达到峰值。调整备餐前，请核对实际用餐人数和份量。','En esta semana de ejemplo, el máximo es el viernes. Compara la asistencia y las porciones reales antes de ajustar la preparación.'],
['Impact, with context','成效统计说明','Cómo interpretar el impacto'],['Your totals above include only batches marked as picked up in this browser.','上述统计仅包含在此浏览器中标记为已领取的批次。','Los totales solo incluyen los lotes marcados como recogidos en este navegador.'],['Meal equivalents use 1.2 lbs per meal. Emissions use an illustrative factor of 2.5 kg CO₂e per pound. These are prototype estimates, not verified measurements.','餐数按每餐 1.2 磅估算。减排量使用每磅 2.5 千克 CO₂e 的示例系数。这些是原型估算值，未经实测验证。','Las comidas se estiman a 1,2 lb por comida. Las emisiones usan un factor ilustrativo de 2,5 kg de CO₂e por libra. Son estimaciones del prototipo, no mediciones verificadas.'],['The weekly chart is sample data. No historical totals have been added to your rescue counts.','每周图表使用示例数据。救援统计未加入任何历史预设总量。','El gráfico semanal contiene datos de ejemplo. No se han añadido totales históricos a tus rescates.'],['Download rescue log','下载救援记录','Descargar registro'],
['Congressional App Challenge prototype · Peddie × Hightstown','国会应用挑战赛原型 · Peddie × Hightstown','Prototipo para Congressional App Challenge · Peddie × Hightstown'],['Made for a less wasteful tomorrow','为减少明天的浪费而设计','Por un mañana con menos desperdicio'],['Rescue overview','救援概览','Resumen de rescates'],['Main navigation','主导航','Navegación principal'],
['Mon','周一','lun'],['Tue','周二','mar'],['Wed','周三','mié'],['Thu','周四','jue'],['Fri','周五','vie'],['Sat','周六','sáb'],['Sun','周日','dom'],
['lbs','磅','lb'],['meals','餐','comidas'],['batches','批','lotes'],['kg CO₂e','千克 CO₂e','kg CO₂e'],
['Title','名称','Nombre'],['Category','类别','Categoría'],['Weight lbs','重量（磅）','Peso (lb)'],['Temperature F','温度（°F）','Temperatura (°F)'],['Pickup deadline','领取截止时间','Fecha límite de recogida'],['Status','状态','Estado'],['Claimed by','领取机构','Reservado por'],
['available','可领取','disponible'],['claimed','已预留','reservado'],['collected','已领取','recogido'],['expired','已过期','vencido']
];
let language='en';try{const saved=localStorage.getItem('foodrescue-language');if(['en','zh','es'].includes(saved))language=saved}catch{}
const locale=()=>({en:'en-US',zh:'zh-CN',es:'es-ES'}[language]);
translations.push(...window.communityTranslations);
const sortedTranslations=[...translations].sort((a,b)=>b[0].length-a[0].length);
const translationPattern=new RegExp(sortedTranslations.map(([key])=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
const translationMap=new Map(translations.map(row=>[row[0],row]));
function translate(text){return language==='en'?String(text):String(text).replace(translationPattern,key=>translationMap.get(key)[language==='zh'?1:2])}
const originals=new WeakMap();
function translatePage(){
  observer.disconnect();document.documentElement.lang=language==='zh'?'zh-CN':language;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
    if(node.parentElement.closest('script,style,[data-user-content],#language'))continue;
    const previous=originals.get(node),source=previous&&node.nodeValue===previous.output?previous.source:node.nodeValue,output=translate(source);
    originals.set(node,{source,output});if(node.nodeValue!==output)node.nodeValue=output;
  }
  document.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{for(const attr of ['placeholder','aria-label']){if(!el.hasAttribute(attr)||el.id==='language')continue;const key='source-'+attr;const previous=el.getAttribute('data-'+key),last=el.getAttribute('data-'+key+'-last'),source=previous&&el.getAttribute(attr)===last?previous:el.getAttribute(attr),output=translate(source);el.setAttribute('data-'+key,source);el.setAttribute('data-'+key+'-last',output);if(el.getAttribute(attr)!==output)el.setAttribute(attr,output)}});
  document.title='FoodRescue Link — '+translate('Good food. A second chance.');
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label']});
}
const observer=new MutationObserver(translatePage);
window.addEventListener('DOMContentLoaded',()=>{
  const selector=document.getElementById('language');selector.value=language;selector.onchange=()=>{
    const draft=[...document.querySelectorAll('input[id],select[id],textarea[id]')].filter(el=>el.id!=='language').map(el=>({id:el.id,value:el.value,checked:el.checked}));
    language=selector.value;try{localStorage.setItem('foodrescue-language',language)}catch{}
    render();for(const v of draft){const el=document.getElementById(v.id);if(el){el.value=v.value;if(el.type==='checkbox')el.checked=v.checked}}
    if(document.getElementById('role'))document.getElementById('role').dispatchEvent(new Event('change'));if(document.getElementById('category'))document.getElementById('category').dispatchEvent(new Event('change'));translatePage();  };translatePage();
});



