/* ═══════════════════════════════════════════════════════════
   BANOVAN NOOR — Smart Media Player
   مسیر فایل: js/bn-media-player.js
   ═══════════════════════════════════════════════════════════
   • پخش فایل‌های صوتی/تصویری از کش یا شبکه
   • دانلود در لحظه (On-Demand) با تأیید کاربر
   • ذخیره در Cache API برای استفاده همیشگی
   • نمایش وضعیت کش (آفلاین / آنلاین)
   ═══════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  const MEDIA_CACHE = 'banovan-noor-media-v1';
  const SIZE_ESTIMATE_KEY = 'bn_media_sizes';

  /* ═══ تخمین حجم فایل ═══ */
  async function getFileSize(url){
    try {
      const saved = JSON.parse(localStorage.getItem(SIZE_ESTIMATE_KEY) || '{}');
      if (saved[url]) return saved[url];
    } catch(e) {}

    try {
      const res = await fetch(url, { method: 'HEAD' });
      const size = parseInt(res.headers.get('Content-Length') || '0', 10);
      if (size > 0) {
        try {
          const saved = JSON.parse(localStorage.getItem(SIZE_ESTIMATE_KEY) || '{}');
          saved[url] = size;
          localStorage.setItem(SIZE_ESTIMATE_KEY, JSON.stringify(saved));
        } catch(e) {}
        return size;
      }
    } catch(e) {}

    if (url.match(/\.mp3$/i)) return 3 * 1024 * 1024;
    if (url.match(/\.mp4$/i)) return 15 * 1024 * 1024;
    return 5 * 1024 * 1024;
  }

  /* ═══ چک کش ═══ */
  async function isCached(url){
    try {
      const cache = await caches.open(MEDIA_CACHE);
      const cached = await cache.match(url);
      return !!cached;
    } catch(e) {
      return false;
    }
  }

  /* ═══ فرمت حجم ═══ */
  function formatBytes(bytes){
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ═══ تخمین زمان ═══ */
  function estimateTime(bytes){
    const seconds = Math.ceil(bytes / (1024 * 1024 / 8) / 1);
    if (seconds < 60) return '~ ' + seconds + ' ثانیه';
    return '~ ' + Math.ceil(seconds / 60) + ' دقیقه';
  }

  /* ═══ مودال دانلود ═══ */
  function buildDownloadModal(url, size, onConfirm, onCancel){
    const old = document.getElementById('bnDownloadModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'bnDownloadModal';
    modal.className = 'bn-dl-overlay';
    modal.innerHTML = `
      <div class="bn-dl-box" role="dialog" aria-modal="true">
        <div class="bn-dl-header">
          <div class="bn-dl-icon">📥</div>
          <h3 class="bn-dl-title">دانلود برای پخش آفلاین</h3>
          <p class="bn-dl-sub">این فایل هنوز در گوشی شما ذخیره نشده است</p>
        </div>

        <div class="bn-dl-info">
          <div class="bn-dl-info-row">
            <span class="bn-dl-info-label">حجم فایل:</span>
            <span class="bn-dl-info-value">${formatBytes(size)}</span>
          </div>
          <div class="bn-dl-info-row">
            <span class="bn-dl-info-label">زمان تقریبی:</span>
            <span class="bn-dl-info-value">${estimateTime(size)}</span>
          </div>
          <div class="bn-dl-info-row">
            <span class="bn-dl-info-label">ذخیره‌سازی:</span>
            <span class="bn-dl-info-value bn-dl-green">همیشه آفلاین می‌مونه ✓</span>
          </div>
        </div>

        <div class="bn-dl-progress" id="bnDlProgressBox" style="display:none;">
          <div class="bn-dl-progress-label">
            <span id="bnDlLabel">در حال دانلود...</span>
            <span id="bnDlPercent">۰٪</span>
          </div>
          <div class="bn-dl-progress-bar">
            <div id="bnDlFill" class="bn-dl-progress-fill"></div>
          </div>
          <div class="bn-dl-progress-size" id="bnDlSize"></div>
        </div>

        <div class="bn-dl-actions" id="bnDlActions">
          <button class="bn-dl-btn bn-dl-btn-primary" id="bnDlConfirm">
            دانلود و پخش
          </button>
          <button class="bn-dl-btn bn-dl-btn-ghost" id="bnDlCancel">
            انصراف
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const confirmBtn = modal.querySelector('#bnDlConfirm');
    const cancelBtn = modal.querySelector('#bnDlCancel');
    const actions = modal.querySelector('#bnDlActions');

    confirmBtn.addEventListener('click', function(){
      actions.style.display = 'none';
      onConfirm(modal);
    });

    cancelBtn.addEventListener('click', function(){
      modal.remove();
      document.body.style.overflow = '';
      onCancel && onCancel();
    });

    return modal;
  }

  /* ═══ دانلود با پیشرفت ═══ */
  async function downloadWithProgress(url, modal, onDone, onError){
    const progressBox = modal.querySelector('#bnDlProgressBox');
    const fill = modal.querySelector('#bnDlFill');
    const percentEl = modal.querySelector('#bnDlPercent');
    const labelEl = modal.querySelector('#bnDlLabel');
    const sizeEl = modal.querySelector('#bnDlSize');

    progressBox.style.display = 'block';

    function toFa(n){ return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);

      const total = parseInt(response.headers.get('Content-Length') || '0', 10);
      let loaded = 0;
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
          const percent = Math.round((loaded / total) * 100);
          fill.style.width = percent + '%';
          percentEl.textContent = toFa(percent) + '٪';
          sizeEl.textContent = formatBytes(loaded) + ' از ' + formatBytes(total);
        } else {
          sizeEl.textContent = formatBytes(loaded);
        }
      }

      labelEl.textContent = 'ذخیره در حافظه...';
      fill.style.width = '100%';
      percentEl.textContent = '۱۰۰٪';

      const blob = new Blob(chunks);
      const blobResponse = new Response(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
          'Content-Length': String(blob.size)
        }
      });

      const cache = await caches.open(MEDIA_CACHE);
      await cache.put(url, blobResponse);

      labelEl.textContent = '✓ دانلود کامل شد';
      sizeEl.textContent = 'حجم ذخیره‌شده: ' + formatBytes(blob.size);

      setTimeout(function(){
        modal.remove();
        document.body.style.overflow = '';
        onDone && onDone(blob);
      }, 800);

    } catch(e) {
      console.error('[MediaPlayer] Download failed:', e);
      labelEl.textContent = 'خطا در دانلود: ' + e.message;
      fill.style.background = '#ef4444';
      setTimeout(function(){
        modal.remove();
        document.body.style.overflow = '';
        onError && onError(e);
      }, 2000);
    }
  }

  /* ═══ پخش فایل ═══ */
  async function playMedia(url, options){
    options = options || {};
    const onPlay = options.onPlay;
    const onError = options.onError;

    const cached = await isCached(url);

    if (cached) {
      if (window.BN && BN.toast) {
        BN.toast('پخش آفلاین از حافظه');
      }
      onPlay && onPlay({ url: url, offline: true });
      return { offline: true };
    }

    if (!navigator.onLine) {
      if (window.BN && BN.toast) {
        BN.toast('این فایل دانلود نشده. لطفاً به اینترنت وصل شوید.');
      }
      onError && onError(new Error('offline-not-cached'));
      return { offline: false, error: 'offline' };
    }

    const size = await getFileSize(url);

    return new Promise(function(resolve){
      buildDownloadModal(
        url,
        size,
        function(modal){
          downloadWithProgress(
            url,
            modal,
            function(blob){
              onPlay && onPlay({ url: url, offline: false, blob: blob });
              resolve({ offline: false, downloaded: true });
            },
            function(err){
              onError && onError(err);
              resolve({ offline: false, downloaded: false, error: err.message });
            }
          );
        },
        function(){
          resolve({ cancelled: true });
        }
      );
    });
  }

  /* ═══ حجم کش ═══ */
  async function getCacheSize(){
    try {
      const cache = await caches.open(MEDIA_CACHE);
      const keys = await cache.keys();
      let totalSize = 0;

      for (const req of keys) {
        const res = await cache.match(req);
        if (res) {
          const blob = await res.clone().blob();
          totalSize += blob.size;
        }
      }

      return { count: keys.length, size: totalSize };
    } catch(e) {
      return { count: 0, size: 0 };
    }
  }

  /* ═══ پاک کردن کش ═══ */
  async function clearCache(){
    try {
      await caches.delete(MEDIA_CACHE);
      return { ok: true };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }

  /* ═══ API عمومی ═══ */
  window.bnMedia = {
    play: playMedia,
    isCached: isCached,
    getFileSize: getFileSize,
    getCacheSize: getCacheSize,
    clearCache: clearCache,
    formatBytes: formatBytes
  };

  console.log('[BN Media] player loaded ✓');
})();
