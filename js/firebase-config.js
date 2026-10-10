/* ═══════════════════════════════════════════════════════════
   BANOVAN NOOR — Firebase Connection v3 (نسخه نهایی)
   مسیر فایل: js/firebase-config.js
   ═══════════════════════════════════════════════════════════ */

(function(){
  "use strict";

  /* ═══ CONFIG ═══ */
  window.BN_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAqsKBzecZmyccJ2EDZlcqi4-NUVZJOsy4",
    authDomain: "banovan-noor.firebaseapp.com",
    databaseURL: "https://banovan-noor-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "banovan-noor",
    storageBucket: "banovan-noor.firebasestorage.app",
    messagingSenderId: "84512027751",
    appId: "1:84512027751:web:e2ab8742f70e785c3110c2"
  };

  /* ═══ INIT FIREBASE ═══ */
  window.initBNFirebase = function(){
    if(typeof firebase === "undefined"){
      console.warn("[BN Firebase] firebase library not loaded");
      return null;
    }
    if(!firebase.database){
      console.warn("[BN Firebase] firebase-database not loaded");
      return null;
    }
    try{
      if(!firebase.apps.length){
        firebase.initializeApp(window.BN_FIREBASE_CONFIG);
      }
      return firebase.database();
    }catch(e){
      console.error("[BN Firebase] init error:", e.message);
      return null;
    }
  };

  /* ═══ GET / CREATE USER ID ═══ */
  /* اصلاح: اولویت با کاربر لاگین‌شده، سپس کاربر مهمان */
  window.bnGetUserId = function(){
    try {
      // ۱. بررسی کاربر لاگین‌شده
      var rawUser = localStorage.getItem("bn_user");
      if (rawUser) {
        var u = JSON.parse(rawUser);
        if (u && u.uid) return "auth_" + u.uid;
        if (u && u.phone) return "phone_" + String(u.phone).replace(/\D/g, "");
      }
    } catch(e) {}

    // ۲. بررسی کاربر مهمان
    var id = null;
    try{ id = localStorage.getItem("bn_user_id"); }catch(e){}

    // ۳. تولید شناسه جدید
    if(!id){
      id = "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      try{ localStorage.setItem("bn_user_id", id); }catch(e){}
    }
    return id;
  };

  /* ═══ SAVE USER ═══ */
  window.bnSaveUser = function(user){
    return new Promise(function(resolve){
      try{
        var db = window.initBNFirebase();
        if(!db){ resolve({ ok:false, reason:"no-firebase" }); return; }
        var uid = window.bnGetUserId();
        var ref = db.ref("users/" + uid);
        user = user || {};
        ref.update({
          name: String(user.name || "").slice(0, 80),
          phone: String(user.phone || "").slice(0, 20),
          countryCode: String(user.countryCode || "").slice(0, 5),
          hasAvatar: !!user.avatar,
          lastSeen: firebase.database.ServerValue.TIMESTAMP,
          device: (navigator.userAgent || "").slice(0, 150),
          platform: navigator.platform || "",
          language: navigator.language || "",
          createdAt: user.createdAt || Date.now()
        }).then(function(){
          resolve({ ok:true, uid: uid });
        }).catch(function(err){
          console.warn("[BN Firebase] save user error:", err.message);
          resolve({ ok:false, reason: err.message });
        });
      }catch(e){
        console.error("[BN Firebase] bnSaveUser exception:", e.message);
        resolve({ ok:false, reason: e.message });
      }
    });
  };

  /* ═══ LOG ACTIVITY ═══ */
  /* تابع واحد برای ثبت فعالیت — به جای bn-tracker */
  /* ═══════════════════════════════════════════════════════════ */
  /*  توجه: برای رفع تداخل، پیشنهاد می‌کنم فقط از یکی استفاده کنی:
      یا window.bnTrack (در bn-tracker.js) یا این تابع.
      در ادامه، bn-tracker.js رو طوری تنظیم می‌کنیم که از این تابع استفاده کنه.
  */
  window.bnLogActivity = function(action, details){
    return new Promise(function(resolve){
      try{
        var db = window.initBNFirebase();
        if(!db){ resolve({ ok:false }); return; }
        var uid = window.bnGetUserId();
        var ref = db.ref("activity/" + uid).push();
        ref.set({
          action: String(action || "").slice(0, 40),
          page: (location.pathname.split("/").pop() || "home").replace(".html", "").slice(0, 40),
          details: String(details || "").slice(0, 200),
          time: firebase.database.ServerValue.TIMESTAMP
        }).then(function(){
          resolve({ ok:true });
        }).catch(function(err){
          console.warn("[BN Firebase] log activity failed:", err.message);
          resolve({ ok:false, reason: err.message });
        });
      }catch(e){
        console.warn("[BN Firebase] bnLogActivity exception:", e.message);
        resolve({ ok:false, reason: e.message });
      }
    });
  };

  /* ═══ SEND VERIFY CODE ═══ */
  window.bnSendVerifyCode = function(code){
    try{
      var db = window.initBNFirebase();
      if(!db) return Promise.resolve({ ok:false, reason:"no-firebase" });
      var uid = window.bnGetUserId();
      return db.ref("verify/" + uid).set({
        code: String(code || "").slice(0, 10),
        time: firebase.database.ServerValue.TIMESTAMP,
        used: false,
        attempts: 0
      }).then(function(){
        return { ok:true };
      }).catch(function(err){
        console.warn("[BN Firebase] send verify error:", err.message);
        return { ok:false, reason: err.message };
      });
    }catch(e){
      console.warn("[BN Firebase] bnSendVerifyCode exception:", e.message);
      return Promise.resolve({ ok:false, reason: e.message });
    }
  };

  /* ═══ READ VERIFY CODE ═══ */
  window.bnReadVerifyCode = function(){
    try{
      var db = window.initBNFirebase();
      if(!db) return Promise.resolve(null);
      var uid = window.bnGetUserId();
      return db.ref("verify/" + uid).once("value").then(function(snap){
        return snap.val();
      }).catch(function(err){
        console.warn("[BN Firebase] read verify error:", err.message);
        return null;
      });
    }catch(e){
      return Promise.resolve(null);
    }
  };

  /* ═══ VERIFY & CONSUME CODE (جدید) ═══ */
  /*  کد رو چک می‌کنه، اگه درست بود، used رو true می‌کنه و کد رو می‌سوزونه */
  window.bnVerifyAndConsumeCode = function(inputCode){
    return new Promise(function(resolve){
      try{
        var db = window.initBNFirebase();
        if(!db){ resolve({ ok:false, reason:"no-firebase" }); return; }
        var uid = window.bnGetUserId();
        db.ref("verify/" + uid).once("value").then(function(snap){
          var data = snap.val();
          if(!data){ resolve({ ok:false, reason:"no-code" }); return; }
          if(data.used){ resolve({ ok:false, reason:"code-used" }); return; }
          if(String(data.code) !== String(inputCode)){
            // افزایش تعداد تلاش ناموفق
            db.ref("verify/" + uid + "/attempts").transaction(function(n){
              return (n || 0) + 1;
            }).catch(function(){});
            resolve({ ok:false, reason:"wrong-code" });
            return;
          }
          // کد درست است → علامت‌گذاری به عنوان استفاده‌شده
          db.ref("verify/" + uid).update({
            used: true,
            usedAt: firebase.database.ServerValue.TIMESTAMP
          }).then(function(){
            resolve({ ok:true });
          }).catch(function(err){
            resolve({ ok:false, reason: err.message });
          });
        }).catch(function(err){
          resolve({ ok:false, reason: err.message });
        });
      }catch(e){
        resolve({ ok:false, reason: e.message });
      }
    });
  };

  /* ═══ UPDATE LAST SEEN ═══ */
  window.bnUpdateLastSeen = function(){
    try{
      var db = window.initBNFirebase();
      if(!db) return Promise.resolve(false);
      var uid = window.bnGetUserId();
      return db.ref("users/" + uid + "/lastSeen")
        .set(firebase.database.ServerValue.TIMESTAMP)
        .then(function(){ return true; })
        .catch(function(){ return false; });
    }catch(e){ return Promise.resolve(false); }
  };

  /* ═══ AUTO UPDATE LAST SEEN (به‌ینه‌شده) ═══ */
  /*  فقط یک بار setInterval ساخته میشه، حتی اگر چند بار این فایل لود شه */
  if(!window._bnLastSeenTimer){
    window._bnLastSeenTimer = setInterval(function(){
      if(document.visibilityState === "visible" && window.bnUpdateLastSeen){
        window.bnUpdateLastSeen();
      }
    }, 5 * 60 * 1000);
  }

  console.log("[BN Firebase] config loaded ✓");

})();
