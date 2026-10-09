/* =========================================================
   BANOVAN NOOR — Shared JavaScript (نسخه اصلاح‌شده)
   ========================================================= */
const BN = (function () {
  'use strict';

  /* =========================================================
     HELPERS (توابع کمکی)
     ========================================================= */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // localStorage ایمن (در مرورگر Private کار می‌کنه)
  const storage = {
    get: function (key, fallback) {
      try { return localStorage.getItem(key) || fallback; }
      catch (e) { return fallback; }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, val); return true; }
      catch (e) { return false; }
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };

  /* =========================================================
     i18n SYSTEM
     ========================================================= */
  const I18N_SUPPORTED = ['fa', 'ps', 'en'];
  const I18N_DEFAULT = 'fa';
  let _currentLang = I18N_DEFAULT;
  let _currentDict = {};
  let _i18nReady = false;

  function getSavedLang() {
    const l = storage.get('bn_lang', null);
    return (l && I18N_SUPPORTED.indexOf(l) > -1) ? l : I18N_DEFAULT;
  }

  function saveLang(lang) { storage.set('bn_lang', lang); }

  function getNestedValue(obj, path) {
    if (!obj || !path) return null;
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return (typeof cur === 'string') ? cur : null;
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
    $$('[data-i18n]').forEach(function (el) {
      const val = getNestedValue(dict, el.getAttribute('data-i18n'));
      if (val) el.textContent = val;
    });

    // placeholder
    $$('[data-i18n-placeholder]').forEach(function (el) {
      const val = getNestedValue(dict, el.getAttribute('data-i18n-placeholder'));
      if (val) el.setAttribute('placeholder', val);
    });

    // title attribute
    $$('[data-i18n-title]').forEach(function (el) {
      const val = getNestedValue(dict, el.getAttribute('data-i18n-title'));
      if (val) el.setAttribute('title', val);
    });

    // جهت و زبان
    const dir = (dict._meta && dict._meta.dir) || 'rtl';
    const lang = (dict._meta && dict._meta.lang) || _currentLang;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.body.classList.toggle('lang-ltr', dir === 'ltr');
    document.body.classList.toggle('lang-rtl', dir !== 'ltr');

    // عنوان صفحه — منطق تمیزتر
    const pageTitleEl = $('[data-i18n-page]');
    const appName = (dict.app && dict.app.name) || 'بانوان نور';
    if (pageTitleEl) {
      const pageKey = pageTitleEl.getAttribute('data-i18n-page');
      const pageTitle = getNestedValue(dict, pageKey) || pageKey;
      document.title = pageTitle + ' | ' + appName;
    } else if (dict.app && dict.app.name) {
      document.title = dict.app.name + ' | BANOVAN NOOR';
    }
  }

  async function switchLanguage(lang) {
    if (I18N_SUPPORTED.indexOf(lang) === -1) lang = I18N_DEFAULT;
    if (lang === _currentLang && _i18nReady) return _currentDict;

    saveLang(lang);
    _currentLang = lang;

    // علامت‌گذاری دکمه‌ها
    $$('.lang-btn, [data-lang]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const dict = await loadTranslations(lang);
    _currentDict = dict;
    applyTranslations(dict);
    _i18nReady = true;

    // ثبت رویداد
    if (window.bnAnalytics) {
      window.bnAnalytics.track('language_changed', { lang: lang });
    }

    document.dispatchEvent(new CustomEvent('bn:language-changed', {
      detail: { lang: lang, dict: dict }
    }));

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
    $$('.lang-btn, [data-lang]').forEach(function (btn) {
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
     THEME — سازگاری با html[data-theme] و body.dark
     ========================================================= */
  function getSystemTheme() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) { return 'light'; }
  }

  function getSavedTheme() {
    const t = storage.get('bn_theme', null);
    return (t === 'dark' || t === 'light') ? t : getSystemTheme();
  }

  function applyTheme(theme) {
    if (theme !== 'dark') theme = 'light';
    // هر دو روش برای سازگاری کامل
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
    // آپدیت theme-color
    const meta = document.getElementById('themeMeta');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#8b3dff');
  }

  function applySavedTheme() { applyTheme(getSavedTheme()); }

  function setupTheme(btnId) {
    applySavedTheme();
    const btn = document.getElementById(btnId);
    if (!btn || btn._bnThemeBound) return;
    btn._bnThemeBound = true;
    btn.addEventListener('click', function () {
      const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      storage.set('bn_theme', next);
      applyTheme(next);
      document.dispatchEvent(new CustomEvent('bn:theme-changed', { detail: { theme: next } }));
      if (window.bnAnalytics) window.bnAnalytics.track('theme_changed', { theme: next });
    });
  }

  /* =========================================================
     GREETING & DAILY CONTENT
     ========================================================= */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting_morning', 'صبح بخیر');
    if (h < 17) return t('home.greeting_noon', 'ظهر بخیر');
    if (h < 20) return t('home.greeting_evening', 'شب بخیر');
    return t('home.greeting_night', 'شب آرام');
  }

  function loadDailyContent() {
    const gt = document.getElementById('greetTime');
    if (gt) gt.textContent = getGreeting();

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
     LOAD JSON (با Cache)
     ========================================================= */
  const _jsonCache = {};
  async function loadJSON(path, useCache) {
    if (useCache !== false && _jsonCache[path]) return _jsonCache[path];
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (useCache !== false) _jsonCache[path] = data;
      return data;
    } catch (e) {
      console.warn('Load failed:', path, e.message);
      return null;
    }
  }

  /* =========================================================
     TOAST (با CSS کلاس — تمیزتر)
     ========================================================= */
  function ensureToastStyles() {
    if (document.getElementById('bn-toast-styles')) return;
    const s = document.createElement('style');
    s.id = 'bn-toast-styles';
    s.textContent =
      '#bn-toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);' +
      'background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;padding:12px 22px;border-radius:30px;' +
      'font-family:inherit;font-size:.85rem;font-weight:800;box-shadow:0 12px 30px rgba(139,92,246,.45);' +
      'z-index:9999;opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;' +
      'white-space:nowrap;max-width:90vw;text-align:center;overflow:hidden;text-overflow:ellipsis}' +
      '#bn-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}';
    document.head.appendChild(s);
  }

  function toast(msg, duration) {
    duration = duration || 2500;
    ensureToastStyles();
    let el = document.getElementById('bn-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bn-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () { el.classList.add('show'); });
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, duration);
  }

  /* =========================================================
     SERVICE WORKER (با مدیریت آپدیت)
     ========================================================= */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        // بررسی آپدیت هر ۶۰ دقیقه
        setInterval(function () { reg.update().catch(function () {}); }, 60 * 60 * 1000);

        reg.addEventListener('updatefound', function () {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // آپدیت آماده‌ست
              document.dispatchEvent(new CustomEvent('bn:update-available'));
              if (window.bnAnalytics) window.bnAnalytics.track('update_available');
            }
          });
        });
      }).catch(function (e) {
        console.warn('SW register failed:', e.message);
      });
    });
  }

  /* =========================================================
     AUTO INIT
     ========================================================= */
  function autoInit() {
    applySavedTheme();
    _currentLang = getSavedLang();
    initLangButtons();

    // اگه دیکشنری از قبل لود نشده، لود کن
    if (!_i18nReady) {
      switchLanguage(_currentLang).catch(function () {});
    }
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
    // helpers
    $: $, $$: $$, escapeHtml: escapeHtml, storage: storage,
    // i18n
    getSavedLang: getSavedLang, saveLang: saveLang,
    switchLanguage: switchLanguage, applyTranslations: applyTranslations,
    initLangButtons: initLangButtons,
    getLang: getLang, getDict: getDict, isI18nReady: isI18nReady, t: t,
    // theme
    getSystemTheme: getSystemTheme, getSavedTheme: getSavedTheme,
    applyTheme: applyTheme, applySavedTheme: applySavedTheme, setupTheme: setupTheme,
    // content
    getGreeting: getGreeting, loadDailyContent: loadDailyContent, loadJSON: loadJSON,
    // ui
    toast: toast,
    // sw
    registerSW: registerSW
  };
})();
