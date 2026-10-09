/* ═══════════════════════════════════════════════════════════
   BANOVAN NOOR — Page Tracker
   همه صفحات از این فایل استفاده می‌کنن
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

  /* UID کاربر */
  function getUID(){
    var uid = null;
    try{ uid = localStorage.getItem('bn_user_id'); }catch(e){}
    if(!uid){
      uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2,8);
      try{ localStorage.setItem('bn_user_id', uid); }catch(e){}
    }
    return uid;
  }

  /* ثبت بازدید صفحه */
  function trackPageView(){
    try{
      var db = initFB();
      if(!db) return;
      var uid = getUID();
      var page = getPageName();
      var ref = db.ref('activity/' + uid).push();
      ref.set({
        action: 'page_view',
        page: page,
        time: shortTime(),
        ref: (document.referrer || '').substring(0, 80)
      }).catch(function(){});
    }catch(e){}
  }

  /* ثبت اکشن (برای صفحات دیگه) */
  window.bnTrack = function(action, details){
    try{
      var db = initFB();
      if(!db) return;
      var uid = getUID();
      var ref = db.ref('activity/' + uid).push();
      ref.set({
        action: String(action || '').substring(0, 40),
        page: getPageName(),
        details: String(details || '').substring(0, 100),
        time: shortTime()
      }).catch(function(){});
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
      db.ref('users/' + uid + '/lastSeen').set(firebase.database.ServerValue.TIMESTAMP).catch(function(){});
    }catch(e){}
  }

  /* اجرا */
  function run(){
    /* تأخیر کوچیک تا Firebase لود بشه */
    setTimeout(function(){
      trackPageView();
      updateLastSeen();
    }, 1200);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
