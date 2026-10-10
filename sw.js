/* =========================================================
   BANOVAN NOOR | بانوان نور — Service Worker
   نسخه: v7 — با پشتیبانی کامل از آفلاین، کش رسانه و آپدیت هوشمند
   ========================================================= */

/* ---------- Polyfill برای Promise.allSettled ---------- */
if (!Promise.allSettled) {
  Promise.allSettled = function (promises) {
    return Promise.all(promises.map(function (p) {
      return Promise.resolve(p).then(
        function (v) { return { status: 'fulfilled', value: v }; },
        function (r) { return { status: 'rejected', reason: r }; }
      );
    }));
  };
}

/* ---------- نسخه و نام کش‌ها ---------- */
var SW_VERSION = 'v7';
var STATIC_CACHE  = 'banovan-noor-static-'  + SW_VERSION;
var RUNTIME_CACHE = 'banovan-noor-runtime-' + SW_VERSION;
var MEDIA_CACHE   = 'banovan-noor-media-v1';

/* ---------- محدودیت حجم کش رسانه ---------- */
var MEDIA_CACHE_LIMIT = 50 * 1024 * 1024; // ۵۰ مگابایت

/* ---------- فایل‌های اصلی پروژه ---------- */
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
  './guide.html',
  './admin.html',
  './notes.html',
  './offline.html',

  // صفحات بخش‌ها
  './ahkam.html',
  './audio.html',
  './childbirth.html',
  './doctors.html',
  './duas.html',
  './education.html',
  './hamraz.html',
  './health.html',
  './menstruation.html',
  './pregnancy.html',
  './women.html',

  // استایل و اسکریپت
  './styles.css',
  './assets/theme.css',
  './assets/theme.js',
  './js/bn-app.js',
  './js/bn-analytics.js',
  './js/bn-tracker.js',
  './js/bn-auth-gate.js',
  './js/bn-media-player.js',
  './js/bn-downloader.js',
  './js/firebase-config.js',
  './manifest.json',

  // i18n
  './i18n/fa.json',
  './i18n/ps.json',
  './i18n/en.json',

  // آیکون‌ها
  './assets/icon-144.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/logo.png',
  './assets/owner.jpg',
  './assets/icons/sprite.svg',
  './assets/screenshot-home.png',
  './assets/screenshot-health.png',

  // فونت‌ها
  './assets/fonts/Vazirmatn-Regular.woff2',
  './assets/fonts/Vazirmatn-Bold.woff2',
  './assets/fonts/Vazirmatn-Black.woff2',

  // داده‌های اصلی
  './data/articles/articles.json',
  './data/audio/ahkam-audio.json',
  './data/daily/daily.json',
  './data/doctors/doctors.json',

  // دعاها
  './data/duas/amal.json',
  './data/duas/duas.json',
  './data/duas/lectures.json',
  './data/duas/mahdaviat.json',
  './data/duas/ziyarat.json',

  // آموزش
  './data/education/education.json',
  './data/education/videos.json',

  // فقه
  './data/fiqh/hanafi.json',
  './data/fiqh/jafari/fayyaz.json',
  './data/fiqh/jafari/shirazi.json',
  './data/fiqh/jafari/sistani.json',

  // همراز
  './data/hamraz/categories.json',
  './data/hamraz/questions.json',

  // پزشکی (کامل)
  './data/medical/anal-health.json',
  './data/medical/anemia.json',
  './data/medical/breast-health.json',
  './data/medical/breastfeeding.json',
  './data/medical/cancer-screening.json',
  './data/medical/childbirth.json',
  './data/medical/contraception.json',
  './data/medical/fitness.json',
  './data/medical/general-health.json',
  './data/medical/gynecological.json',
  './data/medical/menopause.json',
  './data/medical/menstruation.json',
  './data/medical/mental-health.json',
  './data/medical/nutrition.json',
  './data/medical/personal-hygiene.json',
  './data/medical/pregnancy.json',
  './data/medical/skin-hair.json',
  './data/medical/sleep.json',
  './data/medical/vaginal-health.json',

  // بانوان
  './data/women/women.json'
];

/* ---------- الگوی فایل‌های رسانه ---------- */
var MEDIA_PATTERN = /\.(mp3|mp4|m4a|ogg|wav|webm|jpg|jpeg|png|gif|webp)(\?.*)?$/i;

/* =========================================================
   محدود کردن حجم کش رسانه
   ========================================================= */
function trimCache(cacheName, maxBytes) {
  return caches.open(cacheName).then(function (cache) {
    return cache.keys().then(function (keys) {
      var totalSize = 0;
      var entries = [];

      return Promise.all(keys.map(function (req) {
        return cache.match(req).then(function (res) {
          if (!res) return null;
          return res.clone().blob().then(function (blob) {
            return { req: req, size: blob.size };
          });
        });
      })).then(function (results) {
        results.forEach(function (r) {
          if (r) {
            entries.push(r);
            totalSize += r.size;
          }
        });

        if (totalSize <= maxBytes) return;

        var toDelete = [];
        var sizeToFree = totalSize - maxBytes;
        var freed = 0;

        for (var i = 0; i < entries.length && freed < sizeToFree; i++) {
          toDelete.push(entries[i].req);
          freed += entries[i].size;
        }

        return Promise.all(toDelete.map(function (req) {
          return cache.delete(req);
        }));
      });
    });
  });
}

/* =========================================================
   نصب
   ========================================================= */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return Promise.allSettled(
        APP_FILES.map(function (url) {
          return fetch(new Request(url, { cache: 'no-store' }))
            .then(function (res) {
              if (res && res.ok) return cache.put(url, res.clone());
              return null;
            })
            .catch(function () { return null; });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* =========================================================
   فعال‌سازی
   ========================================================= */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          var isCurrent = (k === STATIC_CACHE || k === RUNTIME_CACHE || k === MEDIA_CACHE);
          if (!isCurrent) return caches.delete(k);
          return null;
        })
      );
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.clients.matchAll({ type: 'window' }).then(function (clients) {
        clients.forEach(function (client) {
          try {
            client.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION });
          } catch (e) {}
        });
      });
    })
  );
});

/* =========================================================
   fetch
   ========================================================= */
self.addEventListener('fetch', function (event) {
  var req = event.request;

  if (req.method !== 'GET') return;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  if (url.origin !== self.location.origin) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* ====== ۱. رسانه ====== */
  if (MEDIA_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;

        return fetch(req).then(function (fresh) {
          if (fresh && fresh.ok && fresh.status === 200) {
            caches.open(MEDIA_CACHE).then(function (cache) {
              cache.put(req, fresh.clone())
                .then(function () { trimCache(MEDIA_CACHE, MEDIA_CACHE_LIMIT); })
                .catch(function () {});
            });
          }
          return fresh;
        }).catch(function () {
          return new Response('', { status: 503, statusText: 'Media Offline' });
        });
      })
    );
    return;
  }

  /* ====== ۲. صفحات ناوبری ====== */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (fresh) {
        if (fresh && fresh.ok) {
          caches.open(STATIC_CACHE).then(function (cache) {
            cache.put(req, fresh.clone()).catch(function () {});
          });
        }
        return fresh;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          if (cached) return cached;
          return caches.match('./offline.html').then(function(off) {
            if (off) return off;
            return caches.match('./index.html');
          });
        });
      })
    );
    return;
  }

  /* ====== ۳. بقیه فایل‌ها ====== */
  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetchPromise = fetch(req).then(function (fresh) {
        if (fresh && fresh.ok) {
          caches.open(RUNTIME_CACHE).then(function (cache) {
            cache.put(req, fresh.clone()).catch(function () {});
          });
        }
        return fresh;
      }).catch(function () { return null; });

      if (cached) return cached;

      return fetchPromise.then(function (fresh) {
        if (fresh) return fresh;
        return new Response('BANOVAN NOOR offline: فایل در دسترس نیست', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});

/* =========================================================
   پیام‌ها
   ========================================================= */
self.addEventListener('message', function (event) {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).then(function () {
        return self.clients.matchAll({ type: 'window' });
      }).then(function (clients) {
        clients.forEach(function (client) {
          try { client.postMessage({ type: 'CACHES_CLEARED' }); } catch (e) {}
        });
      })
    );
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    var d = event.data;
    event.waitUntil(
      self.registration.showNotification(d.title || 'بانوان نور', {
        body: d.body || '',
        icon: './assets/icon-192.png',
        badge: './assets/icon-144.png',
        dir: 'rtl',
        lang: 'fa',
        tag: d.tag || 'banovan-noor',
        vibrate: [200, 100, 200],
        data: { url: d.url || './' }
      })
    );
  }
});

/* =========================================================
   کلیک روی نوتیفیکیشن
   ========================================================= */
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url.indexOf(self.location.origin) === 0 && 'focus' in clients[i]) {
          return clients[i].focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/* =========================================================
   Push Notifications
   ========================================================= */
self.addEventListener('push', function (event) {
  if (!event.data) return;
  var data = {};
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'بانوان نور', {
      body: data.body || '',
      icon: './assets/icon-192.png',
      badge: './assets/icon-144.png',
      dir: 'rtl',
      lang: 'fa',
      tag: data.tag || 'banovan-noor',
      data: { url: data.url || './' }
    })
  );
});
