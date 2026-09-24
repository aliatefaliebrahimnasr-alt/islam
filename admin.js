const firebaseConfig = window.firebaseConfig || {};
const firebaseReady = Boolean(window.firebaseReady);
const DEFAULTS = window.SITE_DEFAULTS || {};
const $ = id => document.getElementById(id);
let state = JSON.parse(JSON.stringify(DEFAULTS));
let api = null;

function applyBrandMigration(cfg){
  if(!cfg||typeof cfg!=='object')return cfg;
  cfg.general=cfg.general||{}; cfg.hero=cfg.hero||{}; cfg.about=cfg.about||{};
  if(cfg.general.siteName==='مكتب الميزان')cfg.general.siteName='إسلام أبو العلا العدوي';
  if(cfg.general.metaTitle==='مكتب الميزان | محاماة واستشارات قانونية')cfg.general.metaTitle='إسلام أبو العلا العدوي للمحاماة والاستشارات القانونية';
  if(cfg.hero.cardSeal==='ميزان')cfg.hero.cardSeal='العدوي';
  if(cfg.about.personName==='المستشار / اسم المحامي')cfg.about.personName='إسلام أبو العلا العدوي';
  if(cfg.about.lead==='مكتب الميزان للمحاماة والاستشارات القانونية يقدم خدمات قانونية متكاملة للأفراد ورواد الأعمال والشركات، مع دراسة دقيقة للوقائع والمستندات قبل تحديد المسار القانوني الأنسب.')cfg.about.lead='مكتب إسلام أبو العلا العدوي للمحاماة والاستشارات القانونية يقدم خدمات قانونية متكاملة للأفراد ورواد الأعمال والشركات، مع دراسة دقيقة للوقائع والمستندات قبل تحديد المسار القانوني الأنسب.';
  return cfg;
}
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function deepMerge(base, extra){ if(!extra||typeof extra!=='object')return base; Object.keys(extra).forEach(k=>{ if(Array.isArray(extra[k]))base[k]=extra[k]; else if(extra[k]&&typeof extra[k]==='object')base[k]=deepMerge(base[k]&&typeof base[k]==='object'?base[k]:{},extra[k]); else if(extra[k]!==undefined&&extra[k]!==null)base[k]=extra[k]; }); return base; }
function getPath(obj,path){ return path.split('.').reduce((a,k)=>a?.[k],obj); }
function setPath(obj,path,value){ const keys=path.split('.'); let cur=obj; keys.slice(0,-1).forEach(k=>{ if(!cur[k]||typeof cur[k]!=='object')cur[k]={}; cur=cur[k]; }); cur[keys[keys.length-1]]=value; }
function esc(value=''){ return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function toast(msg,error=false){ const t=$('toast'); t.textContent=msg; t.className=`toast show${error?' error':''}`; clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.className='toast',2600); }
function setSaveStatus(text,type=''){ const el=$('saveStatus'); el.textContent=text; el.className=`status ${type}`.trim(); }

function renderBasicFields(){
  document.querySelectorAll('[data-path]').forEach(el=>{ const v=getPath(state,el.dataset.path); if(el.type==='checkbox')el.checked=Boolean(v); else el.value=v ?? ''; });
  $('serviceOptions').value=(state.consultation?.serviceOptions||[]).join('\n');
  renderImagePreview('logoPreview',state.general?.logoImage); renderImagePreview('aboutPreview',state.about?.image);
}
function renderImagePreview(id,src){ const img=$(id); if(!img)return; if(src){img.src=src;img.style.opacity='1'}else{img.removeAttribute('src');img.style.opacity='.25'} }

function renderStats(){
  $('statsEditor').innerHTML=(state.hero.stats||[]).map((x,i)=>`<div class="repeat-item"><b>الإحصائية ${i+1}</b><label class="field"><span>القيمة</span><input data-stat="${i}" data-key="value" value="${esc(x.value)}"></label><label class="field"><span>الوصف</span><input data-stat="${i}" data-key="label" value="${esc(x.label)}"></label></div>`).join('');
}
function renderServices(){
  $('servicesEditor').innerHTML=(state.services||[]).map((x,i)=>`<div class="repeat-item"><div class="repeat-head"><b>الخدمة ${i+1}</b><div class="mini-actions"><button class="mini delete" data-delete-service="${i}">حذف</button></div></div><div class="grid2"><label class="field"><span>اسم الخدمة</span><input data-service="${i}" data-key="title" value="${esc(x.title)}"></label><label class="switch"><input type="checkbox" data-service="${i}" data-key="featured" ${x.featured?'checked':''}>تمييز البطاقة بلون مختلف</label></div><label class="field"><span>وصف الخدمة</span><textarea data-service="${i}" data-key="body">${esc(x.body)}</textarea></label></div>`).join('');
}
function renderAdvantages(){
  $('advantagesEditor').innerHTML=(state.advantages||[]).map((x,i)=>`<div class="repeat-item"><div class="repeat-head"><b>الميزة ${i+1}</b><button class="mini delete" data-delete-advantage="${i}">حذف</button></div><div class="grid2"><label class="field"><span>العنوان</span><input data-advantage="${i}" data-key="title" value="${esc(x.title)}"></label><label class="field"><span>الوصف</span><input data-advantage="${i}" data-key="body" value="${esc(x.body)}"></label></div></div>`).join('');
}
function renderArticles(){
  $('articlesEditor').innerHTML=(state.articles||[]).map((x,i)=>`<div class="repeat-item"><div class="repeat-head"><b>المقال ${i+1}</b><button class="mini delete" data-delete-article="${i}">حذف</button></div><div class="grid2"><label class="field"><span>التصنيف</span><input data-article="${i}" data-key="category" value="${esc(x.category)}"></label><label class="field"><span>التاريخ</span><input data-article="${i}" data-key="date" value="${esc(x.date)}"></label></div><label class="field"><span>عنوان المقال</span><input data-article="${i}" data-key="title" value="${esc(x.title)}"></label><label class="field"><span>الملخص</span><textarea data-article="${i}" data-key="summary">${esc(x.summary)}</textarea></label><label class="field"><span>الرابط (اختياري)</span><input data-article="${i}" data-key="url" value="${esc(x.url||'#consultation')}"></label><div class="field"><span>صورة المقال</span><div class="image-row"><img class="image-preview" id="articlePreview${i}" src="${esc(x.image||'')}" style="opacity:${x.image?1:.25}" alt=""><button class="btn secondary file-btn">رفع صورة<input type="file" accept="image/*" data-article-image="${i}"></button><button class="btn danger" data-clear-article-image="${i}">حذف الصورة</button></div></div></div>`).join('');
}
function renderTheme(){
  const labels={navy:'اللون الكحلي الرئيسي',navy2:'الكحلي الثانوي',gold:'الذهبي الرئيسي',gold2:'الذهبي الفاتح',paper:'خلفية الصفحات',cream:'الخلفية الدافئة',ink:'لون النص'};
  $('themeEditor').innerHTML=Object.keys(labels).map(k=>`<label class="field"><span>${labels[k]}</span><div class="color-field"><input type="color" data-theme="${k}" value="${esc(state.theme[k])}"><input data-theme-text="${k}" value="${esc(state.theme[k])}"></div></label>`).join('');
  const vLabels={topbar:'الشريط العلوي',hero:'الرئيسية',about:'من نحن',services:'الخدمات',why:'لماذا نحن',articles:'المقالات',consultation:'نموذج الاستشارة',contact:'التواصل',footer:'الفوتر',whatsapp:'زر واتساب العائم'};
  $('visibilityEditor').innerHTML=Object.keys(vLabels).map(k=>`<label class="switch"><input type="checkbox" data-visible="${k}" ${state.visibility[k]!==false?'checked':''}>${vLabels[k]}</label>`).join('');
}
function renderAll(){ renderBasicFields(); renderStats(); renderServices(); renderAdvantages(); renderArticles(); renderTheme(); }

async function compressImage(file){
  if(!file.type.startsWith('image/')) throw new Error('الملف ليس صورة');
  const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
  const img=await new Promise((res,rej)=>{const x=new Image();x.onload=()=>res(x);x.onerror=rej;x.src=data});
  const max=1200, scale=Math.min(1,max/Math.max(img.width,img.height)), canvas=document.createElement('canvas'); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale); canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const result=canvas.toDataURL('image/jpeg',.78); if(result.length>900000) throw new Error('الصورة كبيرة جدًا. اختر صورة أصغر.'); return result;
}

function bindEditorEvents(){
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.dataset.path) setPath(state,el.dataset.path,el.type==='checkbox'?el.checked:el.value);
    if(el.id==='serviceOptions') state.consultation.serviceOptions=el.value.split('\n').map(x=>x.trim()).filter(Boolean);
    if(el.dataset.stat!==undefined){ state.hero.stats[+el.dataset.stat][el.dataset.key]=el.value; }
    if(el.dataset.service!==undefined){ const val=el.type==='checkbox'?el.checked:el.value; state.services[+el.dataset.service][el.dataset.key]=val; }
    if(el.dataset.advantage!==undefined) state.advantages[+el.dataset.advantage][el.dataset.key]=el.value;
    if(el.dataset.article!==undefined) state.articles[+el.dataset.article][el.dataset.key]=el.value;
    if(el.dataset.theme){ state.theme[el.dataset.theme]=el.value; const twin=document.querySelector(`[data-theme-text="${el.dataset.theme}"]`); if(twin)twin.value=el.value; }
    if(el.dataset.themeText){ state.theme[el.dataset.themeText]=el.value; const twin=document.querySelector(`[data-theme="${el.dataset.themeText}"]`); if(twin && /^#[0-9a-fA-F]{6}$/.test(el.value))twin.value=el.value; }
    if(el.dataset.visible) state.visibility[el.dataset.visible]=el.checked;
  });
  document.addEventListener('change',async e=>{
    const el=e.target;
    try{
      if(el.dataset.imagePath && el.files?.[0]){ setSaveStatus('جاري تجهيز الصورة...'); const data=await compressImage(el.files[0]); setPath(state,el.dataset.imagePath,data); renderImagePreview(el.dataset.preview,data); setSaveStatus('الصورة جاهزة للحفظ.','ok'); el.value=''; }
      if(el.dataset.articleImage!==undefined && el.files?.[0]){ setSaveStatus('جاري تجهيز الصورة...'); const i=+el.dataset.articleImage, data=await compressImage(el.files[0]); state.articles[i].image=data; renderImagePreview(`articlePreview${i}`,data); setSaveStatus('الصورة جاهزة للحفظ.','ok'); el.value=''; }
    }catch(err){ setSaveStatus(err.message||'تعذر تجهيز الصورة.','error'); }
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.deleteService!==undefined){ state.services.splice(+b.dataset.deleteService,1); renderServices(); }
    if(b.dataset.deleteAdvantage!==undefined){ state.advantages.splice(+b.dataset.deleteAdvantage,1); renderAdvantages(); }
    if(b.dataset.deleteArticle!==undefined){ state.articles.splice(+b.dataset.deleteArticle,1); renderArticles(); }
    if(b.dataset.clearImage){ setPath(state,b.dataset.clearImage,''); renderImagePreview(b.dataset.preview,''); }
    if(b.dataset.clearArticleImage!==undefined){ state.articles[+b.dataset.clearArticleImage].image=''; renderImagePreview(`articlePreview${b.dataset.clearArticleImage}`,''); }
  });
  $('addService').addEventListener('click',()=>{ state.services.push({title:'خدمة جديدة',body:'اكتب وصف الخدمة هنا.',featured:false}); renderServices(); });
  $('addAdvantage').addEventListener('click',()=>{ state.advantages.push({title:'ميزة جديدة',body:'اكتب وصف الميزة هنا.'}); renderAdvantages(); });
  $('addArticle').addEventListener('click',()=>{ state.articles.push({category:'عام',date:new Intl.DateTimeFormat('ar-EG',{dateStyle:'long'}).format(new Date()),title:'عنوان المقال',summary:'اكتب ملخص المقال هنا.',image:'',url:'#consultation'}); renderArticles(); });
}

function setupTabs(){
  const titles={general:'بيانات المكتب',home:'الرئيسية',about:'من نحن',services:'الخدمات',why:'لماذا نحن',articles:'المقالات',contact:'التواصل والفوتر',appearance:'الألوان والأقسام',requests:'طلبات الاستشارة'};
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{ document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active')); document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); document.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add('active'); $('panelTitle').textContent=titles[btn.dataset.tab]; $('savebar').classList.toggle('hidden',btn.dataset.tab==='requests'); if(btn.dataset.tab==='requests') loadRequests(); }));
}

async function loadSiteContent(){
  setSaveStatus('جاري تحميل بيانات الموقع...');
  try{ const snap=await api.get(api.ref(api.db,'siteContent')); state=applyBrandMigration(snap.exists()?deepMerge(clone(DEFAULTS),snap.val()):clone(DEFAULTS)); renderAll(); setSaveStatus(snap.exists()?'تم تحميل محتوى الموقع.':'لا توجد تعديلات محفوظة بعد؛ يتم عرض المحتوى الافتراضي.','ok'); }
  catch(e){ console.error(e); setSaveStatus('تعذر تحميل محتوى الموقع. راجع قواعد Realtime Database.','error'); }
}
async function saveSiteContent(){
  setSaveStatus('جاري حفظ التعديلات...'); $('saveBtn').disabled=true;
  try{ state.consultation.serviceOptions=$('serviceOptions').value.split('\n').map(x=>x.trim()).filter(Boolean); await api.set(api.ref(api.db,'siteContent'),state); setSaveStatus('تم حفظ جميع التعديلات ونشرها على الموقع.','ok'); toast('تم الحفظ بنجاح'); }
  catch(e){ console.error(e); setSaveStatus('تعذر الحفظ. تأكد من صلاحيات حساب الإدارة وقواعد Firebase.','error'); toast('تعذر الحفظ',true); }
  finally{$('saveBtn').disabled=false;}
}

function formatDate(timestamp){ if(!timestamp||typeof timestamp!=='number')return '—'; return new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(timestamp)); }
async function loadRequests(){
  if(!api)return; $('dashboardStatus').textContent='يتم تحديث الطلبات...';
  try{
    const snap=await api.get(api.query(api.ref(api.db,'consultations'),api.orderByChild('createdAt'))), items=[]; snap.forEach(c=>items.push({id:c.key,...c.val()})); items.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    let newItems=0,todayItems=0; const now=new Date(),tk=`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const rows=items.map(d=>{ if(d.status==='new')newItems++; if(typeof d.createdAt==='number'){const dt=new Date(d.createdAt);if(`${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`===tk)todayItems++;} return `<tr><td>${formatDate(d.createdAt)}</td><td>${esc(d.name||'—')}</td><td><a href="tel:${esc(d.phone||'')}">${esc(d.phone||'—')}</a></td><td>${esc(d.service||'—')}</td><td class="message-cell">${esc(d.message||'—')}</td><td><select class="pill-select" data-request-status="${d.id}"><option value="new" ${d.status==='new'?'selected':''}>جديد</option><option value="contacted" ${d.status==='contacted'?'selected':''}>تم التواصل</option><option value="closed" ${d.status==='closed'?'selected':''}>مغلق</option></select></td><td><button class="mini delete" data-delete-request="${d.id}">حذف</button></td></tr>`; });
    $('requestsBody').innerHTML=rows.length?rows.join(''):'<tr><td colspan="7" class="empty">لا توجد طلبات حتى الآن.</td></tr>'; $('totalCount').textContent=items.length; $('newCount').textContent=newItems; $('todayCount').textContent=todayItems; $('dashboardStatus').textContent='تم تحديث البيانات.';
  }catch(e){ console.error(e); $('dashboardStatus').textContent='تعذر تحميل الطلبات. راجع صلاحيات قاعدة البيانات.'; }
}
function bindRequestEvents(){
  $('requestsBody').addEventListener('change',async e=>{ if(!e.target.dataset.requestStatus)return; try{ await api.update(api.ref(api.db,`consultations/${e.target.dataset.requestStatus}`),{status:e.target.value}); toast('تم تحديث حالة الطلب'); loadRequests(); }catch(err){console.error(err);toast('تعذر تحديث الحالة',true);} });
  $('requestsBody').addEventListener('click',async e=>{ const b=e.target.closest('[data-delete-request]'); if(!b)return; if(!confirm('حذف هذا الطلب نهائيًا؟'))return; try{ await api.remove(api.ref(api.db,`consultations/${b.dataset.deleteRequest}`)); toast('تم حذف الطلب'); loadRequests(); }catch(err){console.error(err);toast('تعذر حذف الطلب',true);} });
}

(async function init(){
  bindEditorEvents(); setupTabs(); bindRequestEvents();
  if(!firebaseReady){ $('loginStatus').textContent='إعدادات Firebase غير مكتملة.'; $('loginStatus').className='status error'; return; }
  try{
    const appM=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'), authM=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'), dbM=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js');
    const app=appM.getApps().length?appM.getApp():appM.initializeApp(firebaseConfig), auth=authM.getAuth(app), db=dbM.getDatabase(app);
    api={...dbM,auth,db,signIn:authM.signInWithEmailAndPassword,signOut:authM.signOut,onAuthStateChanged:authM.onAuthStateChanged};
    $('loginForm').addEventListener('submit',async e=>{ e.preventDefault(); $('loginStatus').textContent='جاري تسجيل الدخول...'; $('loginStatus').className='status'; try{await api.signIn(auth,$('email').value.trim(),$('password').value);$('loginStatus').textContent='';}catch(err){console.error(err);$('loginStatus').textContent='بيانات الدخول غير صحيحة أو Email/Password غير مفعّل.';$('loginStatus').className='status error';} });
    $('logoutBtn').addEventListener('click',()=>api.signOut(auth)); $('saveBtn').addEventListener('click',saveSiteContent); $('reloadBtn').addEventListener('click',loadSiteContent); $('refreshBtn').addEventListener('click',loadRequests);
    api.onAuthStateChanged(auth,user=>{ const logged=Boolean(user); $('loginCard').classList.toggle('hidden',logged); $('dashboard').classList.toggle('visible',logged); $('logoutBtn').classList.toggle('hidden',!logged); if(logged){loadSiteContent();} });
  }catch(e){ console.error(e); $('loginStatus').textContent='تعذر تحميل Firebase. افتح اللوحة عبر استضافة Firebase أو خادم محلي مع اتصال إنترنت.'; $('loginStatus').className='status error'; }
})();
