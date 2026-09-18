/* =========================================================
   BANOVAN NOOR | بانوان نور — Service Worker
   نسخه: v1 — سازگار با http / https
   ========================================================= */

var CACHE_NAME = 'banovan-noor-v1';
var RUNTIME_CACHE = 'banovan-noor-runtime-v1';

/* ---------- فایل‌های اصلی پروژه (بر اساس ساختار واقعی) ---------- */
var APP_FILES = [
  // صفحات اصلی
  './',
  './index.html',
  './home.html',
  './start.html',
  './about.html',
  './contacts.html',
  './privacy.html',
  './settings.html',
  './search.html',
  './favorites.html',

  // صفحات بخش‌ها
  './ahkam.html',
  './childbirth.html',
  './doctors.html',
  './duas.html',
  './education.html',
  './guide.html',
  './hamraz.html',
  './health.html',
  './menstruation.html',
  './notes.html',
  './pregnancy.html',

  // استایل و اسکریپت
  './styles.css',
  './app.js',
  './manifest.json',

  // i18n
  './i18n/fa.json',
  './i18n/ps.json',
  './i18n/en.json',

  // آیکون‌ها و لوگو
  './assets/icon-72.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/logo.png',

  // فونت‌ها
  './assets/fonts/Vazirmatn-Regular.woff2',
  './assets/fonts/Vazirmatn-Bold.woff2',
  './assets/fonts/Vazirmatn-Black.woff2',

  // آیکون‌های SVG
  './assets/icons/arrow.svg',
  './assets/icons/back.svg',
  './assets/icons/bell.svg',
  './assets/icons/birth.svg',
  './assets/icons/dua.svg',
  './assets/icons/education.svg',
  './assets/icons/fiqh.svg',
  './assets/icons/hamraz.svg',
  './assets/icons/health.svg',
  './assets/icons/heart.svg',
  './assets/icons/home.svg',
  './assets/icons/info.svg',

  // دیتای اصلی
  './data/articles/articles.json',
  './data/daily/daily.json',
  './data/doctors/doctors.json',
  './data/duas/amal.json',
  './data/duas/duas.json',
  './data/education/education.json',
  './data/education/videos.json',
  './data/fiqh/hanafi.json',
  './data/fiqh/jafari/fayyaz.json',
  './data/fiqh/jafari/shirazi.json',
  './data/fiqh/jafari/sistani.json',
  './data/hamraz/categories.json',
  './data/hamraz/questions.json',
  './data/medical/anal-health.json',
  './data/medical/breast-health.json',
  './data/medical/childbirth.json',
  './data/medical/general-health.json',
  './data/medical/menstruation.json',
  './data/medical/nutrition.json',
  './data/medical/personal-hygiene.json',
  './data/medical/pregnancy.json',
  './data/medical/vaginal-health.json'
];

/* ---------- نصب: کش کردن فایل‌ها (بدون fail کل نصب) ---------- */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        APP_FILES.map(function (url) {
          return fetch(new Request(url, { cache: 'no-store' }))
            .then(function (res) {
              if (res && res.ok) return cache.put(url, res.clone());
              return null;
            })
            .catch(function () { return null; });
        })
      );
    }).then(function () { return self.skipWaiting(); })
  );
});

/* ---------- فعال‌سازی: پاک‌کردن کش‌های قدیمی ---------- */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE_NAME && k !== RUNTIME_CACHE) return caches.delete(k);
          return null;
        })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* ---------- fetch: Cache-first با به‌روزرسانی پس‌زمینه ---------- */
self.addEventListener('fetch', function (event) {
  var req = event.request;

  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  // فقط همون دامنه (نه فایل‌های خارجی)
  if (url.origin !== self.location.origin) return;

  // روی file:// یا chrome-extension:// کاری نکن
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith((async function () {
    var cache = await caches.open(CACHE_NAME);
    var cached = await cache.match(req, { ignoreSearch: false });

    if (cached) {
      // در پس‌زمینه آپدیت کن
      fetch(req).then(function (fresh) {
        if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(function () {});
      }).catch(function () {});
      return cached;
    }

    try {
      var fresh = await fetch(req);
      if (fresh && fresh.ok) {
        cache.put(req, fresh.clone()).catch(function () {});
      }
      return fresh;
    } catch (e) {
      // اگه ناوبری بود، index.html رو بده
      if (req.mode === 'navigate') {
        var idx = await cache.match('./index.html');
        if (idx) return idx;
      }
      return new Response('BANOVAN NOOR offline: فایل در دسترس نیست', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

/* ---------- پیام‌ها (برای نوتیفیکیشن یا skipWaiting) ---------- */
self.addEventListener('message', function (event) {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    var d = event.data;
    event.waitUntil(
      self.registration.showNotification(d.title || 'بانوان نور | BANOVAN NOOR', {
        body: d.body || '',
        icon: './assets/icon-192.png',
        badge: './assets/icon-72.png',
        dir: 'rtl',
        lang: 'fa',
        tag: d.tag || 'banovan-noor'
      })
    );
  }
});