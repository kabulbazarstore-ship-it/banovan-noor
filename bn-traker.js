/* ═══════════════════════════════════════════════════════════
   BANOVAN NOOR — Page Tracker (نسخه نهایی و اصلاح‌شده)
   ═══════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  /* پیج نیم — از URL گرفته می‌شه */
  function getPageName(){
    var path = location.pathname.split('/').pop() || 'home.html';
    return path.replace('.html', '') || 'home';
  }

  /* زمان کوتاه برای ثبت */
  function shortTime(){
    return Date.now();
  }

  /* راه‌اندازی Firebase */
  function initFB(){
    if(typeof firebase === 'undefined') return null;
    if(!firebase.apps.length){
      if(typeof window.BN_FIREBASE_CONFIG === 'undefined') return null;
      firebase.initializeApp(window.BN_FIREBASE_CONFIG);
    }
    return firebase.database();
  }

  /* UID کاربر — اولویت با کاربر لاگین‌شده */
  function getUID(){
    var uid = null;
    try {
      // ۱. بررسی کاربر لاگین‌شده
      var raw = localStorage.getItem('bn_user');
      if (raw) {
        var user = JSON.parse(raw);
        if (user && user.uid) return 'auth_' + user.uid;
      }
      // ۲. بررسی کاربر مهمان
      uid = localStorage.getItem('bn_user_id');
    } catch(e) {}

    // ۳. تولید شناسه جدید در صورت نبود
    if(!uid){
      uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2,8);
      try{ localStorage.setItem('bn_user_id', uid); }catch(e){}
    }
    return uid;
  }

  /* محدود کردن تعداد رویدادها (جلوگیری از پر شدن دیتابیس) */
  function limitEvents(ref){
    try {
      ref.limitToLast(50).once('value', function(snapshot){
        var count = snapshot.numChildren();
        if (count >= 50) {
          // اگر از ۵۰ گذشت، قدیمی‌ترین‌ها رو حذف کن
          snapshot.ref.limitToFirst(count - 49).remove().catch(function(){});
        }
      });
    } catch(e) {}
  }

  /* ثبت بازدید صفحه */
  function trackPageView(){
    try{
      var db = initFB();
      if(!db) return;
      var uid = getUID();
      var page = getPageName();
      var ref = db.ref('activity/' + uid);
      
      ref.push().set({
        action: 'page_view',
        page: page,
        time: shortTime(),
        ref: (document.referrer || '').substring(0, 80)
      }).then(function(){
        limitEvents(ref); // اعمال محدودیت
      }).catch(function(e){
        console.warn('Tracker: page_view failed', e.message);
      });
    }catch(e){}
  }

  /* ثبت اکشن (برای صفحات دیگه) — با مکانیزم ضد اسپم */
  var _lastTrack = { action: '', time: 0 };
  window.bnTrack = function(action, details){
    try{
      var now = Date.now();
      var actStr = String(action || '').substring(0, 40);
      
      // ضد اسپم: اگر همان اکشن در ۱ ثانیه گذشته ثبت شده، نادیده بگیر
      if (_lastTrack.action === actStr && (now - _lastTrack.time) < 1000) return;
      _lastTrack.action = actStr;
      _lastTrack.time = now;

      var db = initFB();
      if(!db) return;
      var uid = getUID();
      var ref = db.ref('activity/' + uid);
      
      ref.push().set({
        action: actStr,
        page: getPageName(),
        details: String(details || '').substring(0, 100),
        time: shortTime()
      }).catch(function(e){
        console.warn('Tracker: bnTrack failed', e.message);
      });
    }catch(e){}
  };

  /* به‌روزرسانی lastSeen اگه کاربر لاگین داره */
  function updateLastSeen(){
    try{
      var db = initFB();
      if(!db) return;
      var user = null;
      try{
        var raw = localStorage.getItem('bn_user');
        if(raw) user = JSON.parse(raw);
      }catch(e){}
      if(!user || !user.name) return;
      
      var uid = getUID();
      db.ref('users/' + uid + '/lastSeen').set(firebase.database.ServerValue.TIMESTAMP).catch(function(e){
        console.warn('Tracker: lastSeen failed', e.message);
      });
    }catch(e){}
  }

  /* اجرا — با اطمینان از لود شدن کامل همه اسکریپت‌ها */
  function run(){
    trackPageView();
    updateLastSeen();
  }

  // استفاده از رویداد load به جای setTimeout (اطمینان از لود Firebase)
  if(document.readyState === 'complete'){
    run();
  } else {
    window.addEventListener('load', run);
  }
})();
