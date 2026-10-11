/* BANOVAN NOOR | Service Worker
 * نسخه 21
 * مدیریت کش صفحات، داده‌ها، رسانه‌ها و حالت آفلاین
 */
'use strict';

var SW_VERSION = 'v21';
var STATIC_CACHE = 'banovan-noor-static-' + SW_VERSION;
var RUNTIME_CACHE = 'banovan-noor-runtime-' + SW_VERSION;
var MEDIA_CACHE = 'banovan-noor-media-' + SW_VERSION;

var MAX_MEDIA_BYTES = 200 * 1024 * 1024;

/* ═══════════════════════════════════════════════════════════
   فایل‌های اصلی برنامه
   ═══════════════════════════════════════════════════════════ */
var APP_FILES = [
  './',
  './index.html',
  './home.html',
  './about.html',
  './guide.html',
  './privacy.html',
  './settings.html',
  './contacts.html',
  './duas.html',
  './ahkam.html',
  './hamraz.html',
  './search.html',
  './admin.html',
  './manifest.json',
  './styles.css',

  /* ترجمه‌ها */
  './i18n/fa.json',
  './i18n/en.json',

  /* فایل‌های اصلی JS */
  './js/bn-app.js',
  './js/bn-media-player.js',
  './js/bn-downloader.js',
  './js/bn-analytics.js',
  './js/bn-tracker.js',
  './js/firebase-config.js',
  './js/bn-auth-gate.js',

  /* محتوای دعا و اعمال */
  './data/duas/duas.json',
  './data/duas/amal.json',
  './data/duas/lectures.json',
  './data/duas/ziyarat.json',
  './data/duas/mahdaviat.json',
  './data/duas/videos.json',

  /* احکام */
  './data/audio/ahkam-audio.json',
  './data/fiqh/hanafi.json',
  './data/fiqh/jafari/sistani.json',
  './data/fiqh/jafari/shirazi.json',
  './data/fiqh/jafari/fayyaz.json',

  /* بخش‌های دیگر */
  './data/daily/daily.json',
  './data/hamraz/categories.json',
  './data/hamraz/questions.json',
  './data/education/education.json',
  './data/women/women.json',
  './data/doctors/doctors.json',

  /* سلامت و پزشکی */
  './data/medical/pregnancy.json',
  './data/medical/childbirth.json',
  './data/medical/sleep.json',
  './data/medical/gynecological.json',
  './data/medical/skin-hair.json',
  './data/medical/nutrition.json',
  './data/medical/fitness.json',
  './data/medical/menopuse.json',
  './data/medical/contraception.json',
  './data/medical/personal-hygiene.json',
  './data/medical/mental.health.json',
  './data/medical/vaginal-health.json',
  './data/medical/general-health.json',
  './data/medical/breast-health.json',
  './data/medical/anemia.json',
  './data/medical/menstruation.json',
  './data/medical/cancer-screening.json',
  './data/medical/anal-health.json',
  './data/medical/breastfeeding.json'
];

/* ═══════════════════════════════════════════════════════════
   رسانه‌های ضروری (بقیه با MEDIA_PATTERN خودکار کش می‌شن)
   این فایل‌ها در نصب اولیه ذخیره می‌شن
   ═══════════════════════════════════════════════════════════ */
var EXISTING_MEDIA_FILES = [
  /* آیکون‌ها */
  './assets/owner.jpg',
  './assets/icon-72.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/logo.png',

  /* عکس سخنرانان */
  './assets/speakers/daneshmand.webp',
  './assets/speakers/darestani.webp',
  './assets/speakers/mehrabian.webp',
  './assets/speakers/mojtahedi.webp',
  './assets/speakers/momeni.webp',
  './assets/speakers/raefipoor.webp',
  './assets/speakers/alipanah.webp',
  './assets/speakers/ansarian.webp',
  './assets/speakers/biazar-tehrani.webp',
  './assets/speakers/gholiyan.webp',
  './assets/speakers/hosseini-ghomi.webp',
  './assets/speakers/mondegari.webp',
  './assets/speakers/panahian.webp',
  './assets/speakers/shirafkan.webp',

  /* نمونه صوتی (بقیه خودکار کش می‌شن) */
  './assets/audio/duas/02-faraj.mp3',
  './assets/audio/duas/01-ayatolkorsi.mp3'
];

var MEDIA_PATTERN =
  /\.(mp3|mp4|m4a|ogg|wav|webm|jpg|jpeg|png|gif|webp)$/i;

/* ═══════════════════════════════════════════════════════════
   نصب Service Worker و ذخیره منابع اصلی
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    var staticCache = await caches.open(STATIC_CACHE);

    console.log('[BANOVAN SW] شروع نصب نسخه', SW_VERSION);

    /* کش فایل‌های اصلی */
    var okCount = 0, failCount = 0;
    await Promise.all(APP_FILES.map(async function (url) {
      try {
        var response = await fetch(new Request(url, { cache: 'reload' }));
        if (response.ok && response.status === 200) {
          await staticCache.put(url, response.clone());
          okCount++;
        } else {
          failCount++;
          console.warn('[BANOVAN SW] فایل ذخیره نشد:', url, response.status);
        }
      } catch (error) {
        failCount++;
        console.warn('[BANOVAN SW] دریافت فایل ناموفق:', url);
      }
    }));

    console.log('[BANOVAN SW] فایل‌های اصلی:', okCount, 'موفق،', failCount, 'ناموفق');

    /* کش رسانه‌های ضروری */
    var mediaCache = await caches.open(MEDIA_CACHE);
    var mediaOk = 0;
    await Promise.all(EXISTING_MEDIA_FILES.map(async function (url) {
      try {
        var response = await fetch(new Request(url, { cache: 'reload' }));
        if (response.ok && response.status === 200) {
          await mediaCache.put(url, response.clone());
          mediaOk++;
        }
      } catch (error) {
        console.warn('[BANOVAN SW] رسانه ذخیره نشد:', url);
      }
    }));

    console.log('[BANOVAN SW] رسانه‌های ضروری:', mediaOk, 'موفق');

    await self.skipWaiting();
  })());
});

/* ═══════════════════════════════════════════════════════════
   فعال‌سازی نسخه جدید و حذف کش‌های قدیمی
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();

    await Promise.all(keys.map(function (key) {
      if (
        key.indexOf('banovan-noor-') === 0 &&
        key !== STATIC_CACHE &&
        key !== RUNTIME_CACHE &&
        key !== MEDIA_CACHE
      ) {
        console.log('[BANOVAN SW] حذف کش قدیمی:', key);
        return caches.delete(key);
      }
    }));

    await self.clients.claim();
    console.log('[BANOVAN SW] نسخه', SW_VERSION, 'فعال شد');
  })());
});

/* ═══════════════════════════════════════════════════════════
   محدودکردن حجم کش رسانه
   ═══════════════════════════════════════════════════════════ */
async function trimMediaCache() {
  var cache = await caches.open(MEDIA_CACHE);
  var keys = await cache.keys();
  var entries = [];
  var total = 0;

  for (var i = 0; i < keys.length; i++) {
    var response = await cache.match(keys[i]);
    if (!response) continue;
    var blob = await response.clone().blob();
    total += blob.size;
    entries.push({ key: keys[i], size: blob.size });
  }

  /* اگر از حد مجاز گذشت، قدیمی‌ها رو حذف کن */
  var removed = 0;
  while (entries.length && total > MAX_MEDIA_BYTES) {
    var entry = entries.shift();
    await cache.delete(entry.key);
    total -= entry.size;
    removed++;
  }

  if (removed > 0) {
    console.log('[BANOVAN SW] حذف', removed, 'فایل رسانه برای صرفه‌جویی فضا');
  }
}

/* ═══════════════════════════════════════════════════════════
   پاسخ بخشی برای پخش آفلاین فایل‌های بزرگ
   ═══════════════════════════════════════════════════════════ */
async function makeRangeResponse(response, rangeHeader) {
  var blob = await response.blob();
  var match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '');

  if (!match) {
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Length': String(blob.size),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  var start = match[1] ? Number(match[1]) : 0;
  var end = match[2] ? Number(match[2]) : blob.size - 1;

  if (start >= blob.size || end < start) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': 'bytes */' + blob.size }
    });
  }

  end = Math.min(end, blob.size - 1);
  var part = blob.slice(start, end + 1, blob.type);

  return new Response(part, {
    status: 206,
    headers: {
      'Content-Type': blob.type || 'application/octet-stream',
      'Content-Length': String(part.size),
      'Accept-Ranges': 'bytes',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + blob.size
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   مدیریت درخواست‌های شبکه
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('fetch', function (event) {
  var request = event.request;

  if (request.method !== 'GET') return;

  var url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }

  /* منابع دامنه‌های دیگر (Firebase و...) */
  if (url.origin !== self.location.origin) return;

  var isMedia = MEDIA_PATTERN.test(url.pathname);

  /* ═══ صوت، ویدیو و تصاویر ═══ */
  if (isMedia) {
    event.respondWith((async function () {
      var cache = await caches.open(MEDIA_CACHE);
      var cacheKey = new Request(url.href, { method: 'GET' });

      var cached = await cache.match(cacheKey);
      var range = request.headers.get('range');

      if (cached) {
        return range
          ? makeRangeResponse(cached.clone(), range)
          : cached;
      }

      try {
        var fresh = await fetch(request);

        /* کش کن اگر درخواست کامل بود (نه range) */
        if (fresh && fresh.ok && fresh.status === 200 && !range) {
          await cache.put(cacheKey, fresh.clone());
          trimMediaCache().catch(function () {});
        }

        return fresh;
      } catch (error) {
        return new Response(
          'این فایل در حالت آفلاین ذخیره نشده است.',
          {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          }
        );
      }
    })());
    return;
  }

  /* ═══ صفحات HTML (Navigation) ═══ */
  if (request.mode === 'navigate') {
    event.respondWith((async function () {
      try {
        var response = await fetch(request);

        if (response && response.ok) {
          var runtimeCache = await caches.open(RUNTIME_CACHE);
          runtimeCache.put(request, response.clone()).catch(function () {});
        }

        return response;
      } catch (error) {
        /* در حالت آفلاین از کش استفاده کن */
        var cached = await caches.match(request);
        if (cached) return cached;

        var path = new URL(request.url).pathname;
        var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        var fallback = await caches.match('./' + filename);
        if (fallback) return fallback;

        fallback = await caches.match('./index.html');
        if (fallback) return fallback;

        return new Response(
          'بانوان نور: این صفحه هنوز ذخیره آفلاین نشده است.',
          {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          }
        );
      }
    })());
    return;
  }

  /* ═══ CSS، JS، JSON و سایر ═══ */
  event.respondWith((async function () {
    /* اول کش استاتیک، بعد رانتایم */
    var cached = await caches.match(request, { cacheName: STATIC_CACHE });
    if (cached) return cached;

    cached = await caches.match(request);
    if (cached) return cached;

    try {
      var response = await fetch(request);
      if (response && response.ok && response.status === 200) {
        var runtime = await caches.open(RUNTIME_CACHE);
        runtime.put(request, response.clone()).catch(function () {});
      }
      return response;
    } catch (error) {
      return new Response(
        'بانوان نور: این منبع در حالت آفلاین موجود نیست.',
        {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }
      );
    }
  })());
});

/* ═══════════════════════════════════════════════════════════
   پیام‌های دریافتی از صفحات
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('message', function (event) {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHES') {
    event.waitUntil((async function () {
      var keys = await caches.keys();
      await Promise.all(
        keys.filter(function (key) {
          return key.indexOf('banovan-noor-') === 0;
        }).map(function (key) {
          return caches.delete(key);
        })
      );

      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (client) {
        client.postMessage({ type: 'CACHES_CLEARED' });
      });
    })());
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    var data = event.data;
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'بانوان نور',
        {
          body: data.body || '',
          icon: './assets/icon-192.png',
          badge: './assets/icon-72.png',
          dir: 'rtl',
          lang: 'fa',
          tag: data.tag || 'banovan-noor',
          data: { url: data.url || './index.html' }
        }
      )
    );
  }
});

/* ═══════════════════════════════════════════════════════════
   کلیک روی اعلان
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var targetUrl =
    (event.notification.data && event.notification.data.url) ||
    './index.html';

  event.waitUntil((async function () {
    var clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (var i = 0; i < clients.length; i++) {
      if (
        clients[i].url.indexOf(self.location.origin) === 0 &&
        'focus' in clients[i]
      ) {
        await clients[i].focus();
        if ('navigate' in clients[i]) {
          await clients[i].navigate(targetUrl);
        }
        return;
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  })());
});

/* ═══════════════════════════════════════════════════════════
   اعلان Push
   ═══════════════════════════════════════════════════════════ */
self.addEventListener('push', function (event) {
  if (!event.data) return;

  var data = {};
  try {
    data = event.data.json();
  } catch (error) {
    data = { body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'بانوان نور',
      {
        body: data.body || '',
        icon: './assets/icon-192.png',
        badge: './assets/icon-72.png',
        dir: 'rtl',
        lang: 'fa',
        tag: data.tag || 'banovan-noor',
        data: { url: data.url || './index.html' }
      }
    )
  );
});