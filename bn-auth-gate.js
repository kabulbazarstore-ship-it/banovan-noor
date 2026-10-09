/* ═══════════════════════════════════════════════════════════
   BANOVAN NOOR — Auth Gate v2
   ═══════════════════════════════════════════════════════════
   • روز ۱۰-۱۱: هشدار ملایم آبی
   • روز ۱۲-۱۳: هشدار قوی نارنجی
   • روز ۱۴+: قفل کامل + مودال زیبا
   ═══════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  /* ═══ CONFIG ═══ */
  var FIRST_RUN_KEY = 'bn_first_run';
  var USER_KEY      = 'bn_user';
  var ADMIN_SESSION = 'bn_admin_session';
  var GRACE_DAYS    = 14;
  var WARN_DAY_1    = 10;   // هشدار ملایم
  var WARN_DAY_2    = 12;   // هشدار قوی
  var REDIRECT_PAGE = 'settings.html';
  var BANNER_ID     = 'bnAuthBanner';
  var MODAL_ID      = 'bnAuthGateModal';
  var CSS_ID        = 'bnAuthGateCSS';

  /* ═══ HELPERS ═══ */
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  function getFirstRun(){
    var v = lsGet(FIRST_RUN_KEY);
    if(!v){
      var now = Date.now();
      lsSet(FIRST_RUN_KEY, String(now));
      return now;
    }
    var n = parseInt(v, 10);
    return (isFinite(n) && n > 0) ? n : Date.now();
  }

  function getUser(){
    try{
      var raw = lsGet(USER_KEY);
      if(!raw) return null;
      var u = JSON.parse(raw);
      return (u && u.name && u.phone) ? u : null;
    }catch(e){ return null; }
  }

  function hasAdminSession(){
    try{
      var raw = lsGet(ADMIN_SESSION);
      if(!raw) return false;
      var s = JSON.parse(raw);
      return !!(s && s.token && s.expires && Date.now() < s.expires);
    }catch(e){ return false; }
  }

  function daysSinceInstall(){
    return Math.floor((Date.now() - getFirstRun()) / 86400000);
  }

  function daysRemaining(){
    return Math.max(0, GRACE_DAYS - daysSinceInstall());
  }

  function isSettingsPage(){
    return (location.pathname || '').toLowerCase().indexOf('settings.html') > -1;
  }

  function shouldBlock(){
    if(isSettingsPage()) return false;
    if(hasAdminSession()) return false;
    if(getUser()) return false;
    if(daysSinceInstall() < GRACE_DAYS) return false;
    return true;
  }

  function shouldWarn(){
    if(isSettingsPage()) return 0;
    if(hasAdminSession()) return 0;
    if(getUser()) return 0;
    var d = daysSinceInstall();
    if(d >= GRACE_DAYS) return 0; /* قفل کامل */
    if(d >= WARN_DAY_2) return 2; /* هشدار قوی */
    if(d >= WARN_DAY_1) return 1; /* هشدار ملایم */
    return 0;
  }

  /* ═══ INJECT CSS ═══ */
  function injectCSS(){
    if(document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = `
/* ═══ BANNER ═══ */
.bn-auth-banner{
  position:fixed;
  top:0;left:0;right:0;
  z-index:9998;
  padding:calc(8px + env(safe-area-inset-top)) 14px 8px;
  display:flex;align-items:center;gap:10px;
  font-family:Tahoma,Arial,sans-serif;
  direction:rtl;
  transform:translateY(-100%);
  transition:transform .4s cubic-bezier(.2,.8,.2,1);
  box-shadow:0 8px 24px rgba(0,0,0,.12);
  cursor:pointer;
}
.bn-auth-banner.show{transform:translateY(0)}
.bn-auth-banner.warn-1{
  background:linear-gradient(105deg,#3b82f6 0%,#1d4ed8 100%);
  color:#fff;
}
.bn-auth-banner.warn-2{
  background:linear-gradient(105deg,#f59e0b 0%,#b45309 100%);
  color:#fff;
}
.bn-auth-banner-icon{
  width:32px;height:32px;flex:0 0 32px;
  border-radius:10px;
  background:rgba(255,255,255,.22);
  border:1px solid rgba(255,255,255,.3);
  display:grid;place-items:center;
  font-size:1rem;
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}
.bn-auth-banner-text{
  flex:1;min-width:0;
  font-size:.72rem;font-weight:800;
  line-height:1.6;
  text-shadow:0 1px 4px rgba(0,0,0,.15);
}
.bn-auth-banner-text strong{
  font-weight:950;
  background:rgba(255,255,255,.22);
  padding:1px 7px;border-radius:8px;
  margin:0 3px;
  display:inline-block;
}
.bn-auth-banner-btn{
  flex:0 0 auto;
  padding:7px 13px;
  border-radius:11px;
  background:rgba(255,255,255,.24);
  border:1px solid rgba(255,255,255,.35);
  color:#fff;
  font-family:inherit;
  font-size:.68rem;
  font-weight:950;
  cursor:pointer;
  white-space:nowrap;
  backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);
  transition:transform .15s,background .2s;
}
.bn-auth-banner-btn:active{transform:scale(.94)}
.bn-auth-banner-btn:hover{background:rgba(255,255,255,.32)}
.bn-auth-banner-close{
  width:26px;height:26px;flex:0 0 26px;
  border-radius:8px;
  background:rgba(255,255,255,.16);
  border:0;
  color:#fff;
  display:grid;place-items:center;
  cursor:pointer;
  font-size:1rem;
  line-height:1;
  padding:0;
  transition:transform .15s;
}
.bn-auth-banner-close:active{transform:scale(.9)}

/* ═══ MODAL ═══ */
.bn-auth-gate{
  position:fixed;inset:0;
  z-index:99999;
  background:rgba(15,8,20,.85);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  display:flex;align-items:center;justify-content:center;
  padding:20px;
  font-family:Tahoma,Arial,sans-serif;
  direction:rtl;
  animation:bnAuthFade .3s ease;
}
@keyframes bnAuthFade{from{opacity:0}to{opacity:1}}

.bn-auth-box{
  width:100%;max-width:380px;
  background:#fff;
  border-radius:26px;
  padding:0;
  text-align:center;
  box-shadow:
    0 24px 70px rgba(219,39,119,.42),
    0 8px 24px rgba(0,0,0,.35);
  animation:bnAuthSlide .4s cubic-bezier(.2,.8,.2,1);
  position:relative;
  overflow:hidden;
}
html[data-theme="dark"] .bn-auth-box{background:#1c1c1e}
@keyframes bnAuthSlide{
  from{transform:translateY(40px) scale(.95);opacity:0}
  to{transform:translateY(0) scale(1);opacity:1}
}

/* هدر گرادیانی */
.bn-auth-header{
  position:relative;
  padding:26px 20px 20px;
  background:linear-gradient(105deg,#e11d48 0%,#db2777 42%,#a855f7 100%);
  background-size:180% 180%;
  animation:bnAuthHeroShift 14s ease infinite;
  color:#fff;
  overflow:hidden;
  isolation:isolate;
}
@keyframes bnAuthHeroShift{
  0%,100%{background-position:0% 50%}
  50%{background-position:100% 50%}
}
.bn-auth-header::before{
  content:"";position:absolute;
  width:180px;height:180px;
  top:-90px;right:-60px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.28),transparent 70%);
  pointer-events:none;
}
.bn-auth-header::after{
  content:"";position:absolute;
  width:150px;height:150px;
  bottom:-80px;left:-50px;
  border-radius:50%;
  border:1px solid rgba(255,255,255,.14);
  pointer-events:none;
}
.bn-auth-lock{
  position:relative;z-index:1;
  width:76px;height:76px;
  margin:0 auto 14px;
  border-radius:22px;
  background:rgba(255,255,255,.22);
  border:1.5px solid rgba(255,255,255,.35);
  display:grid;place-items:center;
  font-size:2rem;
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
  box-shadow:0 10px 28px rgba(0,0,0,.2);
  animation:bnAuthPulse 2.5s ease infinite;
}
@keyframes bnAuthPulse{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.06)}
}
.bn-auth-title{
  position:relative;z-index:1;
  font-size:1.15rem;font-weight:950;
  margin-bottom:6px;
  text-shadow:0 2px 10px rgba(0,0,0,.2);
  line-height:1.4;
}
.bn-auth-subtitle{
  position:relative;z-index:1;
  font-size:.7rem;font-weight:700;
  opacity:.95;
  line-height:1.8;
}

/* بدنه */
.bn-auth-body{
  padding:22px 22px 20px;
}
.bn-auth-message{
  font-size:.78rem;font-weight:700;
  color:#5f4a77;
  line-height:2;
  margin-bottom:18px;
}
html[data-theme="dark"] .bn-auth-message{color:#e4e6eb}
.bn-auth-message strong{
  color:#a832d6;font-weight:950;
  font-size:.9rem;
}
html[data-theme="dark"] .bn-auth-message strong{color:#c084fc}

/* Progress */
.bn-auth-progress{
  padding:14px;
  border-radius:14px;
  background:rgba(168,50,214,.06);
  border:1px solid rgba(168,50,214,.14);
  margin-bottom:18px;
}
html[data-theme="dark"] .bn-auth-progress{
  background:rgba(192,132,252,.10);
  border-color:rgba(192,132,252,.20);
}
.bn-auth-progress-label{
  display:flex;align-items:center;justify-content:space-between;
  font-size:.6rem;font-weight:850;
  color:#776b80;
  margin-bottom:8px;
}
html[data-theme="dark"] .bn-auth-progress-label{color:#bcaec2}
.bn-auth-progress-bar{
  height:6px;
  border-radius:10px;
  background:rgba(112,55,140,.10);
  overflow:hidden;
  position:relative;
}
html[data-theme="dark"] .bn-auth-progress-bar{
  background:rgba(255,255,255,.08);
}
.bn-auth-progress-fill{
  height:100%;
  border-radius:10px;
  background:linear-gradient(90deg,#e11d48,#db2777,#a855f7);
  width:0;
  transition:width .8s cubic-bezier(.2,.8,.2,1);
  box-shadow:0 0 12px rgba(219,39,119,.5);
}
.bn-auth-progress-value{
  font-weight:950;
  color:#a832d6;
  font-variant-numeric:tabular-nums;
  direction:ltr;
}
html[data-theme="dark"] .bn-auth-progress-value{color:#c084fc}

/* دکمه اصلی */
.bn-auth-btn{
  width:100%;height:52px;
  border-radius:14px;
  background:linear-gradient(105deg,#e11d48 0%,#db2777 42%,#a855f7 100%);
  color:#fff;
  font-family:inherit;
  font-size:.9rem;
  font-weight:950;
  display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 10px 26px rgba(219,39,119,.38);
  transition:transform .15s,box-shadow .2s;
  border:0;cursor:pointer;
  margin-bottom:10px;
}
.bn-auth-btn:hover{box-shadow:0 14px 34px rgba(219,39,119,.5)}
.bn-auth-btn:active{transform:scale(.97)}
.bn-auth-btn svg{
  width:18px;height:18px;
  fill:none;stroke:#fff;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round;
}

/* دکمه ثانویه */
.bn-auth-btn-ghost{
  width:100%;height:42px;
  border-radius:12px;
  background:transparent;
  border:1.5px solid rgba(112,55,140,.14);
  color:#776b80;
  font-family:inherit;
  font-size:.72rem;
  font-weight:850;
  display:flex;align-items:center;justify-content:center;gap:6px;
  cursor:pointer;
  transition:background .15s,border-color .15s;
}
html[data-theme="dark"] .bn-auth-btn-ghost{
  border-color:rgba(192,132,252,.20);
  color:#bcaec2;
}
.bn-auth-btn-ghost:hover{
  background:rgba(168,50,214,.06);
  border-color:rgba(168,50,214,.30);
}
.bn-auth-btn-ghost:active{transform:scale(.97)}

/* فوتر */
.bn-auth-footer{
  padding:14px 22px 20px;
  border-top:1px dashed rgba(112,55,140,.12);
  display:flex;align-items:center;justify-content:center;gap:6px;
  font-size:.58rem;font-weight:700;
  color:#9486a8;
  line-height:1.8;
}
html[data-theme="dark"] .bn-auth-footer{
  border-top-color:rgba(192,132,252,.16);
  color:#8e8e93;
}
.bn-auth-footer svg{
  width:13px;height:13px;flex:0 0 13px;
  fill:none;stroke:currentColor;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round;
}

/* ضربه کردن بدنه بدن رو تکان بده */
.bn-auth-box.shake{
  animation:bnAuthShake .5s ease;
}
@keyframes bnAuthShake{
  0%,100%{transform:translateX(0)}
  15%,45%,75%{transform:translateX(-8px)}
  30%,60%,90%{transform:translateX(8px)}
}

@media(max-width:390px){
  .bn-auth-box{max-width:340px}
  .bn-auth-title{font-size:1.05rem}
  .bn-auth-body{padding:18px 18px 16px}
  .bn-auth-header{padding:22px 18px 16px}
  .bn-auth-lock{width:68px;height:68px;font-size:1.8rem}
}
`;
    document.head.appendChild(s);
  }

  /* ═══ BANNER ═══ */
  function showBanner(level){
    if(document.getElementById(BANNER_ID)) return;

    var days = daysSinceInstall();
    var remaining = daysRemaining();

    var icon, text, btnText;
    if(level === 1){
      icon = '📅';
      text = 'مهلت شما رو به پایان است. <strong>' + remaining + ' روز</strong> برای ثبت‌نام فرصت دارید.';
      btnText = 'ثبت‌نام';
    } else {
      icon = '⚠️';
      text = 'توجه! فقط <strong>' + remaining + ' روز</strong> تا قفل شدن برنامه باقی مانده.';
      btnText = 'همین حالا';
    }

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'bn-auth-banner warn-' + level;
    banner.setAttribute('role','alert');
    banner.innerHTML =
      '<div class="bn-auth-banner-icon">' + icon + '</div>' +
      '<div class="bn-auth-banner-text">' + text + '</div>' +
      '<button class="bn-auth-banner-btn" type="button">' + btnText + '</button>' +
      '<button class="bn-auth-banner-close" type="button" aria-label="بستن">×</button>';

    document.body.appendChild(banner);

    /* نمایش با انیمیشن */
    setTimeout(function(){ banner.classList.add('show'); }, 100);

    /* دکمه ثبت‌نام */
    banner.querySelector('.bn-auth-banner-btn').addEventListener('click', function(e){
      e.stopPropagation();
      window.location.href = REDIRECT_PAGE;
    });

    /* بستن */
    banner.querySelector('.bn-auth-banner-close').addEventListener('click', function(e){
      e.stopPropagation();
      banner.classList.remove('show');
      setTimeout(function(){
        if(banner.parentNode) banner.parentNode.removeChild(banner);
      }, 400);
      /* این هشدار رو توی این جلسه دیگه نشون نده */
      try{
        sessionStorage.setItem('bn_banner_dismissed_' + level, '1');
      }catch(err){}
    });

    /* کلیک روی خود بنر */
    banner.addEventListener('click', function(e){
      if(e.target.closest('.bn-auth-banner-close')) return;
      window.location.href = REDIRECT_PAGE;
    });

    /* padding بالای body برای جا نشدن */
    document.body.style.paddingTop = '52px';
  }

  function bannerDismissed(level){
    try{
      return sessionStorage.getItem('bn_banner_dismissed_' + level) === '1';
    }catch(e){ return false; }
  }

  /* ═══ MODAL (قفل کامل) ═══ */
  function showModal(){
    if(document.getElementById(MODAL_ID)) return;

    var days = daysSinceInstall();
    var progress = Math.min(100, Math.round((days / GRACE_DAYS) * 100));

    var modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'bn-auth-gate';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML =
      '<div class="bn-auth-box" id="bnAuthBox">' +
        '<div class="bn-auth-header">' +
          '<div class="bn-auth-lock">🔐</div>' +
          '<div class="bn-auth-title">ثبت‌نام الزامی است</div>' +
          '<div class="bn-auth-subtitle">برای ادامه استفاده، لطفاً پروفایل خود را تکمیل کنید</div>' +
        '</div>' +
        '<div class="bn-auth-body">' +
          '<div class="bn-auth-message">' +
            'مهلت <strong>۱۴ روزه</strong> شما به پایان رسیده است. ' +
            'برای دسترسی به تمام بخش‌های برنامه، ثبت‌نام کنید.' +
          '</div>' +
          '<div class="bn-auth-progress">' +
            '<div class="bn-auth-progress-label">' +
              '<span>مهلت استفاده</span>' +
              '<span class="bn-auth-progress-value">' + progress + '%</span>' +
            '</div>' +
            '<div class="bn-auth-progress-bar">' +
              '<div class="bn-auth-progress-fill" id="bnAuthFill"></div>' +
            '</div>' +
          '</div>' +
          '<button class="bn-auth-btn" id="bnAuthGoBtn" type="button">' +
            '<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            'ثبت‌نام / ورود' +
          '</button>' +
          '<button class="bn-auth-btn-ghost" id="bnAuthCancelBtn" type="button">' +
            'بعداً یادآوری کن' +
          '</button>' +
        '</div>' +
        '<div class="bn-auth-footer">' +
          '<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>' +
          'اطلاعات شما فقط روی گوشی خودتان ذخیره می‌شود' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    /* پر کردن progress bar */
    setTimeout(function(){
      var fill = document.getElementById('bnAuthFill');
      if(fill) fill.style.width = progress + '%';
    }, 150);

    /* دکمه ثبت‌نام */
    document.getElementById('bnAuthGoBtn').addEventListener('click', function(e){
      e.stopPropagation();
      window.location.href = REDIRECT_PAGE;
    });

    /* دکمه بعداً */
    document.getElementById('bnAuthCancelBtn').addEventListener('click', function(e){
      e.stopPropagation();
      /* تکان دادن مودال */
      var box = document.getElementById('bnAuthBox');
      if(box){
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
      }
    });

    /* جلوگیری از بستن مودال */
    modal.addEventListener('click', function(e){
      e.stopPropagation();
      e.preventDefault();
    });
  }

  /* ═══ BLOCK CLICKS ═══ */
  function setupBlocking(){
    document.addEventListener('click', function(e){
      if(e.target.closest && e.target.closest('.bn-auth-gate')) return;
      if(e.target.closest && e.target.closest('.bn-auth-banner')) return;
      e.preventDefault();
      e.stopPropagation();
      showModal();
    }, true);

    document.addEventListener('auxclick', function(e){
      if(e.target.closest && e.target.closest('.bn-auth-gate')) return;
      if(e.target.closest && e.target.closest('.bn-auth-banner')) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);

    document.addEventListener('keydown', function(e){
      if(e.key === 'Tab' || e.key === 'Escape') return;
      if(e.target && e.target.closest && e.target.closest('.bn-auth-gate')) return;
      if(document.getElementById(MODAL_ID)){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  /* ═══ INIT ═══ */
  function init(){
    getFirstRun();
    injectCSS();

    if(shouldBlock()){
      /* قفل کامل */
      setTimeout(showModal, 400);
      setupBlocking();
      return;
    }

    var level = shouldWarn();
    if(level > 0 && !bannerDismissed(level)){
      setTimeout(function(){ showBanner(level); }, 800);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
