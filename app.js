const firebaseConfig = window.firebaseConfig || {};
const firebaseReady = Boolean(window.firebaseReady);
const DEFAULTS = window.SITE_DEFAULTS || {};
let activeSiteConfig = JSON.parse(JSON.stringify(DEFAULTS));

const $ = id => document.getElementById(id);
const loader = $('pageLoader');
const year = $('year');
const menuToggle = $('menuToggle');
const mainMenu = $('mainMenu');
const backTop = $('backTop');
const form = $('consultationForm');
const submitBtn = $('submitBtn');
const statusBox = $('formStatus');

function applyBrandMigration(cfg) {
  if (!cfg || typeof cfg !== 'object') return cfg;
  cfg.general = cfg.general || {};
  cfg.hero = cfg.hero || {};
  cfg.about = cfg.about || {};
  if (cfg.general.siteName === 'مكتب الميزان') cfg.general.siteName = 'إسلام أبو العلا العدوي';
  if (cfg.general.metaTitle === 'مكتب الميزان | محاماة واستشارات قانونية') cfg.general.metaTitle = 'إسلام أبو العلا العدوي للمحاماة والاستشارات القانونية';
  if (cfg.hero.cardSeal === 'ميزان') cfg.hero.cardSeal = 'العدوي';
  if (cfg.about.personName === 'المستشار / اسم المحامي') cfg.about.personName = 'إسلام أبو العلا العدوي';
  if (cfg.about.lead === 'مكتب الميزان للمحاماة والاستشارات القانونية يقدم خدمات قانونية متكاملة للأفراد ورواد الأعمال والشركات، مع دراسة دقيقة للوقائع والمستندات قبل تحديد المسار القانوني الأنسب.') cfg.about.lead = 'مكتب إسلام أبو العلا العدوي للمحاماة والاستشارات القانونية يقدم خدمات قانونية متكاملة للأفراد ورواد الأعمال والشركات، مع دراسة دقيقة للوقائع والمستندات قبل تحديد المسار القانوني الأنسب.';
  return cfg;
}

function deepMerge(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  Object.keys(extra).forEach(key => {
    if (Array.isArray(extra[key])) base[key] = extra[key];
    else if (extra[key] && typeof extra[key] === 'object') base[key] = deepMerge(base[key] && typeof base[key] === 'object' ? base[key] : {}, extra[key]);
    else if (extra[key] !== undefined && extra[key] !== null) base[key] = extra[key];
  });
  return base;
}
function esc(value = '') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function multiline(value = '') { return esc(value).replace(/\n/g, '<br>'); }
function setText(id, value) { const el = $(id); if (el) el.textContent = value ?? ''; }
function setHTML(id, value) { const el = $(id); if (el) el.innerHTML = multiline(value ?? ''); }
function digits(value) { const map={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}; return String(value||'').replace(/[٠-٩]/g,d=>map[d]); }
function telHref(phone='') { return `tel:${digits(phone).replace(/[^+\d]/g,'')}`; }
function waHref(number='') { return `https://wa.me/${digits(number).replace(/\D/g,'')}`; }

function applyTheme(theme = {}) {
  const root = document.documentElement.style;
  const vars = { navy:'--navy', navy2:'--navy-2', gold:'--gold', gold2:'--gold-2', paper:'--paper', cream:'--cream', ink:'--ink' };
  Object.entries(vars).forEach(([key, css]) => theme[key] && root.setProperty(css, theme[key]));
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme && theme.navy) metaTheme.setAttribute('content', theme.navy);
}

function applyLogo(general) {
  document.querySelectorAll('[data-logo-mark]').forEach(el => {
    if (general.logoImage) el.innerHTML = `<img class="brand-logo-image" src="${esc(general.logoImage)}" alt="">`;
    else el.textContent = general.logoSymbol || '⚖';
  });
}

function applyVisibility(visibility = {}) {
  const map = { topbar:'topbarSection', hero:'home', about:'about', services:'services', why:'why-us', articles:'articles', consultation:'consultation', contact:'contact' };
  Object.entries(map).forEach(([key,id]) => { const el=$(id); if(el) el.classList.toggle('section-hidden', visibility[key] === false); });
  const footer = document.querySelector('[data-section="footer"]'); if (footer) footer.classList.toggle('section-hidden', visibility.footer === false);
  const wa = $('whatsappFloat'); if (wa) wa.classList.toggle('section-hidden', visibility.whatsapp === false);
}

function renderSite(cfg) {
  activeSiteConfig = cfg;
  const g = cfg.general || {}, h = cfg.hero || {}, a = cfg.about || {}, ss = cfg.servicesSection || {}, w = cfg.why || {}, ars = cfg.articlesSection || {}, co = cfg.consultation || {}, ct = cfg.contact || {}, ft = cfg.footer || {};
  applyTheme(cfg.theme || {}); applyVisibility(cfg.visibility || {}); applyLogo(g);

  document.title = g.metaTitle || `${g.siteName || ''} | ${g.siteTagline || ''}`;
  $('metaDescription')?.setAttribute('content', g.metaDescription || '');
  document.querySelectorAll('[data-site-name]').forEach(el => el.textContent = g.siteName || '');
  document.querySelectorAll('[data-site-tagline]').forEach(el => el.textContent = g.siteTagline || '');
  setText('topbarNote', g.topbarNote); setText('topPhone', `اتصل بنا: ${g.phoneDisplay || g.phone || ''}`); setText('topEmail', g.email);
  if ($('topPhone')) $('topPhone').href = telHref(g.phone); if ($('topEmail')) $('topEmail').href = `mailto:${g.email || ''}`;

  setText('heroEyebrow', h.eyebrow); setText('heroTitle', h.title); setText('heroAccent', h.titleAccent); setText('heroBody', h.body); setText('heroCardSeal', h.cardSeal); setText('heroCardTitle', h.cardTitle); setText('heroCardSubtitle', h.cardSubtitle); setText('badge1Value', h.badge1Value); setText('badge1Label', h.badge1Label); setText('badge2Value', h.badge2Value); setText('badge2Label', h.badge2Label);
  if ($('heroPrimary')) $('heroPrimary').innerHTML = `${esc(h.primaryText || 'احجز استشارة الآن')} <span>←</span>`;
  if ($('heroWhatsapp')) { $('heroWhatsapp').textContent = h.secondaryText || 'تواصل عبر واتساب'; $('heroWhatsapp').href = waHref(g.whatsapp || g.phone); }
  if ($('heroStats')) $('heroStats').innerHTML = (h.stats || []).map(s => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('');

  setText('aboutLabel', a.label); setHTML('aboutTitle', a.title); setText('aboutLead', a.lead); setText('aboutBody', a.body); setText('aboutName', a.personName); setText('aboutRole', a.personRole); setText('aboutExperience', a.experienceYears);
  const portrait = $('aboutPortrait'); if (portrait) { portrait.classList.toggle('has-image', Boolean(a.image)); portrait.style.backgroundImage = a.image ? `url("${String(a.image).replace(/"/g,'%22')}")` : ''; }

  setText('servicesLabel', ss.label); setHTML('servicesTitle', ss.title); setText('servicesBody', ss.body);
  if ($('servicesGrid')) $('servicesGrid').innerHTML = (cfg.services || []).map((s,i) => `<article class="service-card reveal visible ${s.featured ? 'featured-service' : ''}"><div class="service-icon">${String(i+1).padStart(2,'0')}</div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p><a href="#consultation">${esc(ss.linkText || 'اطلب استشارة')} <span>←</span></a></article>`).join('');

  setText('whyLabel', w.label); setHTML('whyTitle', w.title); setText('whyBody', w.body); if ($('whyCta')) $('whyCta').innerHTML = `${esc(w.ctaText || 'تحدث مع المكتب')} <span>←</span>`;
  if ($('advantagesGrid')) $('advantagesGrid').innerHTML = (cfg.advantages || []).map((x,i)=>`<div class="advantage"><span>${String(i+1).padStart(2,'0')}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div></div>`).join('');

  setText('articlesLabel', ars.label); setHTML('articlesTitle', ars.title); setText('articlesBody', ars.body);
  if ($('articlesGrid')) $('articlesGrid').innerHTML = (cfg.articles || []).map((x,i)=>`<article class="article-card reveal visible"><div class="article-cover article-cover-${['one','two','three'][i%3]} ${x.image?'has-image':''}" ${x.image?`style="background-image:url('${esc(x.image)}')"`:''}><span>${esc(x.category)}</span></div><div class="article-body"><small>${esc(x.date)}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><a href="${esc(x.url || '#consultation')}">${esc(ars.linkText || 'اقرأ المزيد')} <span>←</span></a></div></article>`).join('');

  setText('consultationLabel', co.label); setHTML('consultationTitle', co.title); setText('consultationBody', co.body); setText('consultationPrivacy', co.privacy); setText('submitText', co.submitText);
  const serviceSelect = $('service'); if (serviceSelect) serviceSelect.innerHTML = '<option value="">اختر الخدمة</option>' + (co.serviceOptions || []).map(x=>`<option>${esc(x)}</option>`).join('');

  setText('contactLabel', ct.label); setHTML('contactTitle', ct.title); setText('contactPhoneText', g.phoneDisplay || g.phone); setText('contactEmailText', g.email); setText('contactAddress', g.address);
  if ($('contactPhone')) $('contactPhone').href = telHref(g.phone); if ($('contactEmail')) $('contactEmail').href = `mailto:${g.email || ''}`;

  setText('footerSummary', ft.summary); setText('workDays', g.workDays); setText('workHours', g.workHours); setText('footerRights', ft.rights); setText('footerDesigner', ft.designer);
  if ($('footerServices')) $('footerServices').innerHTML = (cfg.services || []).slice(0,4).map(x=>`<a href="#services">${esc(x.title)}</a>`).join('');
  if ($('whatsappFloat')) $('whatsappFloat').href = waHref(g.whatsapp || g.phone);
}

async function loadRemoteSiteContent() {
  if (!firebaseReady) return;
  try {
    const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
    const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js');
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const snap = await get(ref(getDatabase(app), 'siteContent'));
    if (snap.exists()) renderSite(applyBrandMigration(deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), snap.val())));
  } catch (e) { console.warn('Site content fallback is active:', e); }
}

renderSite(applyBrandMigration(JSON.parse(JSON.stringify(DEFAULTS))));
loadRemoteSiteContent().finally(() => setTimeout(() => loader?.classList.add('hide'), 220));
setTimeout(() => loader?.classList.add('hide'), 1800);
if (year) year.textContent = new Date().getFullYear();

menuToggle?.addEventListener('click', () => { const isOpen = mainMenu?.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen))); });
mainMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mainMenu.classList.remove('open'); menuToggle?.setAttribute('aria-expanded','false'); }));
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), {threshold:.13});
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
window.addEventListener('scroll', () => backTop?.classList.toggle('show', window.scrollY > 650)); backTop?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

function setStatus(message,type=''){ if(!statusBox)return; statusBox.textContent=message; statusBox.className=`form-status ${type}`.trim(); }
function setLoading(state){ if(!submitBtn)return; submitBtn.disabled=state; submitBtn.classList.toggle('loading',state); }
function normalizeArabicDigits(value){ const map={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}; return value.replace(/[٠-٩]/g,d=>map[d]); }
form?.addEventListener('submit', async event => {
  event.preventDefault(); setStatus('');
  const name=$('name').value.trim(), phone=normalizeArabicDigits($('phone').value.trim().replace(/\s|-/g,'')), service=$('service').value, message=$('message').value.trim(), consent=$('consent').checked;
  if(name.length<3 || !/^01[0125][0-9]{8}$/.test(phone) || !service || message.length<10 || !consent){ setStatus('من فضلك راجع البيانات المطلوبة ورقم الهاتف المصري.','error'); return; }
  setLoading(true);
  try {
    if(!firebaseReady) throw new Error('Firebase config is incomplete');
    const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
    const { getDatabase, ref, push, set, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js');
    const app=getApps().length?getApp():initializeApp(firebaseConfig), db=getDatabase(app), requestRef=push(ref(db,'consultations'));
    await set(requestRef,{name,phone,service,message,consent:true,status:'new',source:'website',createdAt:serverTimestamp()});
    form.reset(); setStatus('تم إرسال طلبك بنجاح. سيتواصل معك المكتب في أقرب وقت.','success');
  } catch(error){ console.error(error); setStatus('تعذر إرسال الطلب الآن. تأكد من اتصال الإنترنت وإعداد Firebase.','error'); }
  finally{ setLoading(false); }
});
