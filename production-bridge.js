/* Nihad Abbasov Studio: Supabase production bridge for the original V6 UI.
 * Private tables are protected by Supabase RLS. No service_role in browser.
 */
(()=>{
'use strict';
const cfg=window.NA_SUPABASE_CONFIG||{};
const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url||'') &&
  cfg.publishableKey && !cfg.publishableKey.startsWith('PASTE_');
const banner=document.createElement('div');
banner.id='na-connection-banner';
banner.style.cssText='position:fixed;z-index:9999;left:12px;right:12px;bottom:10px;max-width:680px;margin:auto;border-radius:13px;padding:11px 17px;font:600 13px system-ui;box-shadow:0 7px 25px #0003;display:none;text-align:center';
document.body.appendChild(banner);
function notify(text,kind='warn'){
  banner.textContent=text;
  banner.style.background=kind==='ok'?'#e7f7ed':kind==='error'?'#ffeded':'#fff3d0';
  banner.style.color=kind==='ok'?'#14603d':kind==='error'?'#a32424':'#654b00';
  banner.style.display='block';
}
if(!configured || !window.supabase?.createClient){
  notify('Sayt hələ Supabase-ə qoşulmayıb. config.js faylını doldurun; sifarişlər qəbul edilmir.');
  // Prevent confusing local demo orders while credentials are missing.
  window.orderForm=()=>notify('Əvvəlcə config.js daxilində Supabase bağlantısını qurun.','error');
  window.openAdmin=()=>notify('Əvvəlcə Supabase bağlantısını qurun.','error');
  window.submitQuote=e=>{e?.preventDefault?.();notify('Əvvəlcə Supabase bağlantısını qurun.','error')};
  return;
}
const sb=window.supabase.createClient(cfg.url.replace(/\/$/,''),cfg.publishableKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
let isAdmin=false,publicReady=false,saveTimer=null,saving=false,needsSave=false;
const PUBLIC_FIELDS=['title','subtitle','heroTitle','heroSubtitle','heroImage','videoUrl','introSeconds',
  'phone','whatsapp','email','location','hours','instagram','behance','introEnabled','faqIntro',
  'seoTitle','seoDescription','seoImage','aiName','aiWelcome','aiEndpoint'];
function publicPayload(){
  const config={};for(const key of PUBLIC_FIELDS)if(db.config[key]!==undefined)config[key]=db.config[key];
  return {config,categories:db.categories,services:db.services,portfolio:db.portfolio,
    certificates:db.certificates,reviews:db.reviews,faqs:db.faqs};
}
function privatePayload(){
  return {tasks:db.tasks,logs:db.logs,configPrivate:{},_version:1};
}
function rowsPayload(items){return (items||[]).map(x=>({id:x.id||x.code,data:x}));}
async function assertOk(promise,label){const r=await promise;if(r.error)throw Error(label+': '+r.error.message);return r.data;}
async function replaceRows(table, items){
  const values=rowsPayload(items);
  if(values.length)await assertOk(sb.from(table).upsert(values,{onConflict:'id'}),table+' upsert');
  const existing=await assertOk(sb.from(table).select('id'),table+' select');
  const wanted=new Set(values.map(x=>x.id));
  const removed=(existing||[]).filter(x=>!wanted.has(x.id)).map(x=>x.id);
  if(removed.length)await assertOk(sb.from(table).delete().in('id',removed),table+' delete');
}
async function persist(){
  if(!isAdmin)return;
  if(saving){needsSave=true;return}
  saving=true;
  try{
    await assertOk(sb.from('studio_public').upsert({id:1,data:publicPayload(),updated_at:new Date().toISOString()}),'public catalog');
    await assertOk(sb.from('studio_private').upsert({id:1,data:privatePayload(),updated_at:new Date().toISOString()}),'private state');
    await replaceRows('studio_orders',db.orders);
    await replaceRows('studio_invoices',db.invoices);
    await replaceRows('studio_leads',db.leads);
  }catch(err){console.error('[NA Studio] Supabase sync failed',err);notify('Server yaddaşına yazma xətası: '+err.message,'error')}
  finally{saving=false;if(needsSave){needsSave=false;queueSave()}}
}
function queueSave(){if(!isAdmin)return;clearTimeout(saveTimer);saveTimer=setTimeout(persist,450)}
// Local storage no longer defines the authoritative public/admin database.
save=function(){queueSave()};
async function loadPublic(){
  const data=await assertOk(sb.from('studio_public').select('data').eq('id',1).maybeSingle(),'catalog');
  if(data?.data){
    const p=data.data;
    for(const k of ['categories','services','portfolio','certificates','reviews','faqs'])if(Array.isArray(p[k]))db[k]=p[k];
    Object.assign(db.config,p.config||{});
    publicReady=true;
  }
  db.orders=[];db.invoices=[];db.leads=[];db.logs=[];db.tasks=[];
  // The legacy local demo admin password must never be used in production.
  delete db.config.adminPass;
  renderPublic();if(typeof applySeo==='function')applySeo();
}
async function loadAdmin(){
  await loadPublic();
  const [pr,or,ir,lr]=await Promise.all([
    assertOk(sb.from('studio_private').select('data').eq('id',1).maybeSingle(),'private'),
    assertOk(sb.from('studio_orders').select('data').order('created_at',{ascending:false}).limit(1000),'orders'),
    assertOk(sb.from('studio_invoices').select('data').order('created_at',{ascending:false}).limit(1000),'invoices'),
    assertOk(sb.from('studio_leads').select('data').order('created_at',{ascending:false}).limit(1000),'leads')
  ]);
  db.tasks=pr?.data?.tasks||[];db.logs=pr?.data?.logs||[];
  db.orders=(or||[]).map(x=>x.data);db.invoices=(ir||[]).map(x=>x.data);
  db.leads=(lr||[]).map(x=>x.data);
  if(!publicReady){
    // First admin login publishes the V6 seed content; real changes thereafter are stored remotely.
    publicReady=true;await persist();
  }
  renderPublic();renderAdmin();
}
async function openRealAdmin(){
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(session){
      const admin=await assertOk(sb.rpc('studio_is_admin'),'admin role');
      if(admin){isAdmin=true;adminOn=true;await loadAdmin();$('admin').classList.add('show');renderAdmin();notify('Supabase Baş Admin hesabına qoşulub.','ok');setTimeout(()=>banner.style.display='none',4000);return}
    }
  }catch(err){console.error(err)}
  openModal('Təhlükəsiz Baş Admin girişi',`<div class="notice">Supabase Auth ilə giriş. Köhnə demo şifrəsi ləğv edilib.</div>
    <form id="supabaseAdminLogin">
    ${filed('Admin e-poçtu','naLoginEmail','','email','required')}
    ${filed('Şifrə','naLoginPassword','','password','required')}
    <button class="btn" style="width:100%">Giriş et</button></form>`);
  $('supabaseAdminLogin').onsubmit=async e=>{
    e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;
    try{
      await assertOk(sb.auth.signInWithPassword({email:bval('naLoginEmail'),password:bval('naLoginPassword')}),'login');
      const valid=await assertOk(sb.rpc('studio_is_admin'),'role');
      if(!valid){await sb.auth.signOut();throw Error('Bu hesab Baş Admin kimi icazələndirilməyib')}
      isAdmin=true;adminOn=true;closeModal();await loadAdmin();$('admin').classList.add('show');renderAdmin();
      notify('Baş Admin təhlükəsiz Supabase hesabı ilə aktivdir.','ok');setTimeout(()=>banner.style.display='none',4000);
    }catch(err){notify(err.message,'error')}finally{button.disabled=false}
  };
}
openAdmin=openRealAdmin;
adminSecurity=function(){return `<div class="admin-card"><h3>Supabase Auth — təhlükəsiz giriş</h3>
  <p>Baş Admin icazəsi Supabase studio_admins cədvəlindəki Auth istifadəçi ID-sinə əsaslanır. Köhnə demo şifrəsi istifadə olunmur.</p>
  <button class="btn" onclick="naSignOut()">Hesabdan çıx</button></div>`};
window.naSignOut=async()=>{clearTimeout(saveTimer);await persist();await sb.auth.signOut();isAdmin=false;adminOn=false;closeAdmin();await loadPublic();notify('Hesabdan çıxıldı.','ok')};
// Prevent accidental wiping of production data through the old "Reset demo" button.
resetDemo=function(){notify('Canlı bazada demo sıfırlama funksiyası söndürülüb.','error')};
// Save existing local V6 content ONLY after authenticated admin approval.
window.naImportLocal=async()=>{
  if(!isAdmin)return notify('Əvvəlcə Baş Admin olaraq daxil olun.','error');
  const raw=localStorage.getItem('na_creative_studio_v1');if(!raw)return notify('Köhnə lokal məlumat tapılmadı.');
  if(!confirm('Köhnə brauzer məlumatlarını Supabase-ə köçürmək istəyirsiniz? Hazırkı server məlumatlarını əvəz edəcək.'))return;
  const old=JSON.parse(raw);if(!old.services||!old.config)return notify('Köhnə məlumat faylı uyğun deyil.','error');
  Object.assign(db,{...old,config:{...db.config,...old.config}});delete db.config.adminPass;
  needsSave=true;await persist();renderPublic();renderAdmin();notify('Yerli məlumatların serverə köçürülməsi başladıldı.','ok')
};
// Add a visible migration option to backup admin tab.
const oldAdminBackup=adminBackup;
adminBackup=function(){return `<div class="admin-card"><h3>Supabase-ə köhnə V6 məlumatlarını köçür</h3>
  <p>Yalnız bu brauzerdə əvvəl saxlanmış məlumatlar üçündür. Əvvəl JSON backup alın.</p>
  <button class="btn" onclick="naImportLocal()">Köhnə lokal məlumatları import et</button></div>`+oldAdminBackup()};
const oldOrderForm=orderForm;
orderForm=function(id){
  if(!publicReady)return notify('Xidmət kataloqu hələ dərc edilməyib. Baş Admin ilkin kataloqu aktivləşdirməlidir.','error');
  oldOrderForm(id);
  const form=$('orderForm');if(!form)return;
  form.onsubmit=async e=>{
    e.preventDefault();let button=form.querySelector('button[type="submit"],button');
    const name=bval('oName'),phone=bval('oPhone');if(!name||!phone)return msg('Ad və telefon tələb olunur.');
    button.disabled=true;
    try{
      const code=await assertOk(sb.rpc('studio_submit_order',{
        p_service_id:id,p_name:name,p_surname:bval('oSurname'),p_phone:phone,
        p_brief:bval('oBrief'),p_ref:bval('oRef'),p_due:bval('oDue')
      }),'sifariş');
      const service=db.services.find(x=>x.id===id);
      const order={id:code,service:service.name,name,phone,price:Number(service.discount||service.price)};
      orderSuccess(order);
      notify('Sifariş serverdə saxlanıldı. Kod: '+code,'ok');setTimeout(()=>banner.style.display='none',4500);
    }catch(err){notify('Sifariş qəbul edilmədi: '+err.message,'error')}finally{button.disabled=false}
  };
};
submitQuote=async function(e){
  e.preventDefault();if(!publicReady)return notify('Sayt hələ serverdə aktivləşdirilməyib.','error');
  const name=bval('qName'),phone=bval('qPhone'),brief=bval('qBrief');
  if(!name||!phone||!brief)return msg('Ad, telefon və layihə təsviri vacibdir');
  try{
    const code=await assertOk(sb.rpc('studio_submit_lead',{
      p_name:name,p_phone:phone,p_brief:brief,p_cat:bval('qCategory'),
      p_budget:bval('qBudget'),p_due:bval('qDeadline')
    }),'təklif sorğusu');
    $('publicQuoteForm')?.reset();
    openModal('Sorğunuz qeydə alındı',`<div class="alert"><h3>${esc(code)}</h3><p>Sorğu Supabase serverində saxlanıldı. Kodunuzu qeyd edin.</p></div>`);
  }catch(err){notify('Sorğu göndərilmədi: '+err.message,'error')}
};
checkTrack=async function(){
  const id=bval('trackingInput').trim().toUpperCase(),box=$('trackingResult');if(!id)return;
  box.textContent='Sifariş serverdə yoxlanılır…';
  try{
    const obj=await assertOk(sb.rpc('studio_track',{p_code:id}),'izləmə');
    if(!obj){box.textContent='Bu kod üzrə sifariş/qaimə tapılmadı.';return}
    if(obj.kind==='invoice'){
      box.innerHTML=`<div class="admin-card"><b>Qaimə № ${esc(obj.code)}</b><p>${esc(obj.product)}</p><p>Tarix: ${esc(obj.date)}</p></div>`;return;
    }
    const ix=STAGES.indexOf(obj.status);
    box.innerHTML=`<div class="admin-card" style="margin-top:20px"><h3>${esc(obj.id)}</h3>
      <p>${esc(obj.service)}</p><p><span class="tag green">${obj.cancelled?'Ləğv edildi':esc(obj.status)}</span></p>
      <div class="timeline">${STAGES.map((t,i)=>`<div class="milestone ${i<=ix&&!obj.cancelled?'done':''}"><i>${i<=ix?'✓':i+1}</i>${esc(t)}</div>`).join('')}</div></div>`;
  }catch(err){box.textContent='İzləmə sorğusu alınmadı: '+err.message}
};
// Admin image upload: file goes to Supabase Storage, not local base64.
loadImageFile=async function(input,target){
  const file=input.files?.[0];if(!file)return;
  if(!isAdmin)return notify('Şəkil üçün Baş Admin girişi tələb olunur.','error');
  if(file.size>10*1024*1024)return msg('Şəkil 10 MB-dan kiçik olmalıdır');
  if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))return msg('Yalnız şəkil formatları qəbul olunur');
  const path=crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  try{
    await assertOk(sb.storage.from('studio-media').upload(path,file,{upsert:false,contentType:file.type}),'media upload');
    const {data:{publicUrl}}=sb.storage.from('studio-media').getPublicUrl(path);
    $(target).value=publicUrl;
    if($('servicePreview'))$('servicePreview').src=publicUrl;
    if($('galleryPreview'))$('galleryPreview').src=publicUrl;
    msg('Şəkil Supabase Storage-a yükləndi. Yadda saxla düyməsini basın.');
  }catch(err){notify(err.message,'error')}
};
// Refresh admin when tab becomes visible, allowing changes from another device.
document.addEventListener('visibilitychange',async()=>{
  if(!document.hidden && isAdmin && !saving){
    try{await loadAdmin()}catch(err){console.error(err)}
  }
});
(async()=>{
  try{await loadPublic();if(location.hash.startsWith('#track=')){openTracking(decodeURIComponent(location.hash.slice(7)))}notify('Sayt Supabase məlumat bazasına qoşuldu.','ok');setTimeout(()=>banner.style.display='none',3000)}
  catch(err){console.error(err);notify('Supabase bazası tapılmadı: schema.sql icra edin. '+err.message,'error')}
})();
})();
