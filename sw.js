/* BANOVAN NOOR | Service Worker — cache-first/offline-first
 * v26: offline-first media cache persists across app updates; audio/video are saved after first successful online fetch.
 * Core assets are pre-cached; existing audio/video files are fetched in the home-page background downloader.
 */
'use strict';
var SW_VERSION = 'v28-support-campaign-gallery';
var STATIC_CACHE = 'banovan-noor-static-' + SW_VERSION;
var RUNTIME_CACHE = 'banovan-noor-runtime-' + SW_VERSION;
// Stable cache name: keep downloaded audio/video across app updates.
var MEDIA_CACHE = 'banovan-noor-media-v1';
var MAX_MEDIA_BYTES = 200 * 1024 * 1024;
var PRECACHE_URLS = [
  "./",
  "./README-HOME-CALENDAR-PRAYER.txt",
  "./README-SETTINGS-GUIDE-FIX.txt",
  "./about.html",
  "./admin.html",
  "./ahkam.html",
  "./assets/banovan-noor-qr.png",
  "./assets/icon-144.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-72.png",
  "./assets/logo.png",
  "./assets/owner.jpg",
  "./assets/owner.png",
  "./assets/scripte.svg",
  "./assets/speakers/default.svg",
  "./audio.html",
  "./calendar.html",
  "./childbirth.html",
  "./contacts.html",
  "./data/audio/ahkam-audio.json",
  "./data/calendar/event.json",
  "./data/calendar/events.json",
  "./data/calendar/occasions.json",
  "./data/daily/daily.json",
  "./data/doctors/doctors.json",
  "./data/duas/amal.json",
  "./data/duas/duas.json",
  "./data/duas/lectures.json",
  "./data/duas/mahdaviat.json",
  "./data/duas/videos.json",
  "./data/duas/ziyarat.json",
  "./data/education/education.json",
  "./data/fiqh/hanafi.json",
  "./data/fiqh/jafari/fayyaz.json",
  "./data/fiqh/jafari/shirazi.json",
  "./data/fiqh/jafari/sistani.json",
  "./data/hamraz/categories.json",
  "./data/hamraz/questions.json",
  "./data/medical/anal-health.json",
  "./data/medical/anemia.json",
  "./data/medical/breast-health.json",
  "./data/medical/breastfeeding.json",
  "./data/medical/cancer-screening.json",
  "./data/medical/childbirth.json",
  "./data/medical/contraception.json",
  "./data/medical/fitness.json",
  "./data/medical/general-health.json",
  "./data/medical/gynecological.json",
  "./data/medical/menopuse.json",
  "./data/medical/menstruation.json",
  "./data/medical/mental.health.json",
  "./data/medical/nutrition.json",
  "./data/medical/personal-hygiene.json",
  "./data/medical/pregnancy.json",
  "./data/medical/skin-hair.json",
  "./data/medical/sleep.json",
  "./data/medical/vaginal-health.json",
  "./data/women/women.json",
  "./doctors.html",
  "./duas.html",
  "./education.html",
  "./guide.html",
  "./hamraz.html",
  "./health.html",
  "./home.html",
  "./i18n/en.json",
  "./i18n/fa.json",
  "./i18n/ps.json",
  "./index.html",
  "./js/bn-analytics.js",
  "./js/bn-app.js",
  "./js/bn-auth-gate.js",
  "./js/bn-firebase-loader.js",
  "./js/bn-media-player.js",
  "./js/bn-tracker.js",
  "./js/calendar.js",
  "./js/firebase-config.js",
  "./js/prayer-times.js",
  "./js/qibla.js",
  "./manifest.json",
  "./menstruation.html",
  "./notes.html",
  "./offline.html",
  "./prayer-times.html",
  "./pregnancy.html",
  "./privacy.html",
  "./support.html",
  "./SUPABASE-SCHEMA.sql",
  "./support-campaigns.js",
  "./admin-support.html",
  "./charity.html",
  "./donate.html",
  "./campaign.html",
  "./transparency.html",
  "./track.html",
  "./volunteer.html",
  "./thank-you.html",
  "./support.css",
  "./support.js",
  "./translations.json",
  "./support-config.json",
  "./SUPPORT-SETUP-FA.md",
  "./search.html",
  "./settings.html",
  "./start.html",
  "./styles.css",
  "./women.html",
  "./js/bn-offline-download.js",
];
var MEDIA_PATTERN = /\.(mp3|mp4|m4a|ogg|wav|webm|jpg|jpeg|png|gif|webp|svg)$/i;

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    var cache = await caches.open(STATIC_CACHE);
    var index = 0, ok = 0, failed = [];
    // Limit parallel requests to reduce pressure on low-end phones.
    async function worker() {
      while (index < PRECACHE_URLS.length) {
        var url = PRECACHE_URLS[index++];
        try {
          var response = await fetch(new Request(url, { cache: 'reload' }));
          if (response && response.ok && response.status === 200) {
            await cache.put(url, response.clone()); ok++;
          } else failed.push(url);
        } catch (e) { failed.push(url); }
      }
    }
    await Promise.all([worker(), worker(), worker(), worker(), worker()]);
    console.log('[BANOVAN SW] precache:', ok, 'saved;', failed.length, 'not available');
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (key) {
      if (key.indexOf('banovan-noor-') === 0 && key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== MEDIA_CACHE && key.indexOf('banovan-noor-media-') !== 0) return caches.delete(key);
    }));
    await self.clients.claim();
    console.log('[BANOVAN SW] active', SW_VERSION);
  })());
});

async function trimMediaCache() {
  var cache = await caches.open(MEDIA_CACHE), keys = await cache.keys(), entries = [], total = 0;
  for (var i = 0; i < keys.length; i++) {
    var response = await cache.match(keys[i]); if (!response) continue;
    var size = (await response.clone().blob()).size; total += size; entries.push({ key: keys[i], size: size });
  }
  while (entries.length && total > MAX_MEDIA_BYTES) { var entry = entries.shift(); await cache.delete(entry.key); total -= entry.size; }
}

async function makeRangeResponse(response, rangeHeader) {
  var blob = await response.blob();
  var match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '');
  if (!match) return new Response(blob, { status: 200, headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Content-Length': String(blob.size), 'Accept-Ranges': 'bytes' } });
  var start = match[1] ? Number(match[1]) : 0;
  var end = match[2] ? Number(match[2]) : blob.size - 1;
  if (start >= blob.size || end < start) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + blob.size } });
  end = Math.min(end, blob.size - 1);
  var part = blob.slice(start, end + 1, blob.type);
  return new Response(part, { status: 206, headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Content-Length': String(part.size), 'Accept-Ranges': 'bytes', 'Content-Range': 'bytes ' + start + '-' + end + '/' + blob.size } });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url; try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  var isMedia = MEDIA_PATTERN.test(url.pathname);

  if (isMedia) {
    event.respondWith((async function () {
      var staticCache = await caches.open(STATIC_CACHE);
      var staticCached = await staticCache.match(request, { ignoreSearch: true });
      if (staticCached) return staticCached;
      var cache = await caches.open(MEDIA_CACHE);
      var cached = await cache.match(request, { ignoreSearch: true });
      var range = request.headers.get('range');
      if (cached) return range ? makeRangeResponse(cached.clone(), range) : cached;
      try {
        // Media elements often request byte ranges. Fetch a full copy once so it can work offline later.
        var fullRequest = new Request(url.href, { method: 'GET', credentials: 'same-origin', headers: new Headers() });
        var fresh = await fetch(range ? fullRequest : request);
        if (fresh && fresh.ok && fresh.status === 200) {
          try { await cache.put(new Request(url.href), fresh.clone()); }
          catch (cacheError) { console.warn('[BANOVAN SW] media cache unavailable:', url.pathname); }
          return range ? makeRangeResponse(fresh.clone(), range) : fresh;
        }
        return fresh;
      } catch (e) {
        return new Response('این فایل هنوز دانلود نشده است. برای پخش آفلاین، یک بار هنگام اتصال به اینترنت آن را پخش کنید.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async function () {
      var cache = await caches.open(STATIC_CACHE);
      var cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      var runtime = await caches.open(RUNTIME_CACHE);
      cached = await runtime.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        var response = await fetch(request);
        if (response && response.ok) runtime.put(request, response.clone()).catch(function () {});
        return response;
      } catch (e) {
        var fallback = await cache.match('./offline.html') || await cache.match('./index.html');
        return fallback || new Response('این صفحه هنوز ذخیره نشده است. هنگام اتصال به اینترنت یک بار آن را باز کنید.', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  event.respondWith((async function () {
    var cache = await caches.open(STATIC_CACHE);
    var cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    var runtime = await caches.open(RUNTIME_CACHE);
    cached = await runtime.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      var response = await fetch(request);
      if (response && response.ok && response.status === 200) runtime.put(request, response.clone()).catch(function () {});
      return response;
    } catch (e) {
      return new Response('این منبع هنوز ذخیره آفلاین نشده است.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});

self.addEventListener('message', function (event) {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'CLEAR_CACHES') event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (key) { return key.indexOf('banovan-noor-') === 0; }).map(function (key) { return caches.delete(key); }));
    var clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (client) { client.postMessage({ type: 'CACHES_CLEARED' }); });
  })());
  if (event.data.type === 'SHOW_NOTIFICATION') {
    var d = event.data; event.waitUntil(self.registration.showNotification(d.title || 'بانوان نور', { body: d.body || '', icon: './assets/icon-192.png', badge: './assets/icon-72.png', dir: 'rtl', lang: 'fa', tag: d.tag || 'banovan-noor', data: { url: d.url || './index.html' } }));
  }
});
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); var target = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil((async function () {
    var clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < clients.length; i++) { if (clients[i].url.indexOf(self.location.origin) === 0 && 'focus' in clients[i]) { await clients[i].focus(); if ('navigate' in clients[i]) await clients[i].navigate(target); return; } }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
self.addEventListener('push', function (event) {
  if (!event.data) return; var d = {}; try { d = event.data.json(); } catch (e) { d = { body: event.data.text() }; }
  event.waitUntil(self.registration.showNotification(d.title || 'بانوان نور', { body: d.body || '', icon: './assets/icon-192.png', badge: './assets/icon-72.png', dir: 'rtl', lang: 'fa', tag: d.tag || 'banovan-noor', data: { url: d.url || './index.html' } }));
});
