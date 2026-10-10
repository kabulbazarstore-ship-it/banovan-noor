/* =========================================================
   BANOVAN NOOR — Shared JavaScript
   ========================================================= */

const BN = (function () {
  'use strict';

  /* =========================================================
     i18n SYSTEM
     ========================================================= */
  const I18N_SUPPORTED = ['fa', 'ps', 'en'];
  const I18N_DEFAULT = 'fa';
  let _currentLang = I18N_DEFAULT;
  let _currentDict = {};
  let _i18nReady = false;

  function getSavedLang() {
    try {
      const l = localStorage.getItem('bn_lang');
      if (l && I18N_SUPPORTED.indexOf(l) > -1) return l;
    } catch (e) {}
    return I18N_DEFAULT;
  }

  function saveLang(lang) {
    try { localStorage.setItem('bn_lang', lang); } catch (e) {}
  }

  function getNestedValue(obj, path) {
    if (!obj || !path) return null;
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return typeof cur === 'string' ? cur : null;
  }

  async function loadTranslations(lang) {
    try {
      const res = await fetch('i18n/' + lang + '.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('i18n load failed:', lang, e.message);
      return {};
    }
  }

  function applyTranslations(dict) {
    dict = dict || _currentDict;

    // textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNestedValue(dict, key);
      if (val) el.textContent = val;
    });

    // placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getNestedValue(dict, key);
      if (val) el.setAttribute('placeholder', val);
    });

    // title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = getNestedValue(dict, key);
      if (val) el.setAttribute('title', val);
    });

    // meta
    if (dict && dict._meta) {
      const dir = dict._meta.dir || 'rtl';
      const lang = dict._meta.lang || 'fa';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    }

    // عنوان صفحه
    if (dict && dict.app && dict.app.name) {
      const pageTitleEl = document.querySelector('[data-i18n-page]');
      const pageTitle = pageTitleEl ? pageTitleEl.getAttribute('data-i18n-page') : '';
      document.title = pageTitle
        ? (getNestedValue(dict, pageTitle) || pageTitle) + ' | ' + dict.app.name
        : dict.app.name + ' | BANOVAN NOOR';
    }

    // متغیرهای CSS جهت
    if (dict._meta && dict._meta.dir === 'ltr') {
      document.body.classList.add('lang-ltr');
      document.body.classList.remove('lang-rtl');
    } else {
      document.body.classList.add('lang-rtl');
      document.body.classList.remove('lang-ltr');
    }
  }

  async function switchLanguage(lang) {
    if (I18N_SUPPORTED.indexOf(lang) === -1) lang = I18N_DEFAULT;

    saveLang(lang);
    _currentLang = lang;

    // علامت‌گذاری دکمه‌های زبان
    document.querySelectorAll('.lang-btn, [data-lang]').forEach(btn => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
    });

    // بارگذاری
    const dict = await loadTranslations(lang);
    _currentDict = dict;
    applyTranslations(dict);
    _i18nReady = true;

    // رویداد سفارشی
    try {
      document.dispatchEvent(new CustomEvent('bn:language-changed', {
        detail: { lang: lang, dict: dict }
      }));
    } catch (e) {}

    return dict;
  }

  function getLang() { return _currentLang; }
  function getDict() { return _currentDict; }
  function isI18nReady() { return _i18nReady; }

  function t(key, fallback) {
    const val = getNestedValue(_currentDict, key);
    return val || fallback || key;
  }

  function initLangButtons() {
    document.querySelectorAll('.lang-btn, [data-lang]').forEach(btn => {
      if (btn._bnLangBound) return;
      btn._bnLangBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const lang = btn.dataset.lang;
        if (lang) switchLanguage(lang);
      });
    });
  }

  /* =========================================================
     THEME
     ========================================================= */
  function applySavedTheme() {
    try {
      if (localStorage.getItem('bn_theme') === 'dark') {
        document.body.classList.add('dark');
      }
    } catch (e) {}
  }

  function setupTheme(btnId) {
    applySavedTheme();
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (btn._bnThemeBound) return;
    btn._bnThemeBound = true;
    btn.addEventListener('click', function () {
      document.body.classList.toggle('dark');
      try {
        localStorage.setItem('bn_theme',
          document.body.classList.contains('dark') ? 'dark' : 'light');
      } catch (e) {}
      // رویداد
      try {
        document.dispatchEvent(new CustomEvent('bn:theme-changed', {
          detail: { theme: document.body.classList.contains('dark') ? 'dark' : 'light' }
        }));
      } catch (e) {}
    });
  }

  /* =========================================================
     GREETING
     ========================================================= */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting_morning', 'صبح بخیر');
    if (h < 17) return t('home.greeting_noon', 'ظهر بخیر');
    if (h < 20) return t('home.greeting_evening', 'شب بخیر');
    return t('home.greeting_night', 'شب آرام');
  }

  /* =========================================================
     DAILY CONTENT
     ========================================================= */
  function loadDailyContent() {
    // Greeting
    const gt = document.getElementById('greetTime');
    if (gt) gt.textContent = getGreeting();

    // Quote
    const quotes = [
      'امروز یک فرصت تازه برای یادگیری است',
      'علم، نور است و نور، راه را روشن می‌کند',
      'هر روز یک قدم به آگاهی نزدیک‌تر',
      'سلامتی، بزرگ‌ترین نعمت است',
      'دعا، آرامش قلب‌هاست',
      'آگاهی، بهترین سرمایه‌ی یک زن است',
      'هر سؤال، آغاز یک آگاهی تازه است'
    ];
    const q = document.getElementById('greetQuote');
    if (q) q.textContent = quotes[new Date().getDate() % quotes.length];

    // Tip
    const tips = [
      'نوشیدن آب گرم در دوران قاعدگی مفید است',
      'ویتامین D برای سلامت استخوان ضروری است',
      'ورزش سبک در دوران بارداری مفید است',
      'مصرف آهن در دوران قاعدگی توصیه می‌شود',
      'خواب کافی ۷ تا ۸ ساعت ضروری است',
      'میوه و سبزیجات تازه در برنامه غذایی روزانه',
      'شیر و لبنیات برای سلامت استخوان',
      'کاهش مصرف قند و نمک مفید است'
    ];
    const tEl = document.getElementById('dailyTip');
    if (tEl) tEl.textContent = tips[new Date().getDate() % tips.length];
  }

  /* =========================================================
     LOAD JSON
     ========================================================= */
  async function loadJSON(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('Load failed:', path, e.message);
      return null;
    }
  }

  /* =========================================================
     TOAST
     ========================================================= */
  function toast(msg, duration) {
    duration = duration || 2500;
    let el = document.getElementById('bn-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bn-toast';
      el.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;padding:12px 22px;border-radius:30px;' +
        'font-family:inherit;font-size:.85rem;font-weight:800;box-shadow:0 12px 30px rgba(139,92,246,.45);' +
        'z-index:9999;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;max-width:90vw;' +
        'text-align:center;overflow:hidden;text-overflow:ellipsis;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
    }, duration);
  }

  /* =========================================================
     SERVICE WORKER
     ========================================================= */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  /* =========================================================
     AUTO INIT
     ========================================================= */
  function autoInit() {
    applySavedTheme();
    _currentLang = getSavedLang();
    initLangButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */
  return {
    // i18n
    getSavedLang: getSavedLang,
    saveLang: saveLang,
    switchLanguage: switchLanguage,
    applyTranslations: applyTranslations,
    initLangButtons: initLangButtons,
    getLang: getLang,
    getDict: getDict,
    isI18nReady: isI18nReady,
    t: t,
    // theme
    applySavedTheme: applySavedTheme,
    setupTheme: setupTheme,
    // content
    getGreeting: getGreeting,
    loadDailyContent: loadDailyContent,
    loadJSON: loadJSON,
    // ui
    toast: toast,
    registerSW: registerSW
  };
})();