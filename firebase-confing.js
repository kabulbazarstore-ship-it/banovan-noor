/* ═══════════════════════════════════════════════════════════
   BANOVAN NOOR — Firebase Connection
   ═══════════════════════════════════════════════════════════ */

window.BN_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAqsKBzecZmyccJ2EDZlcqi4-NUVZJOsy4",
  authDomain: "banovan-noor.firebaseapp.com",
  databaseURL: "https://banovan-noor-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "banovan-noor",
  storageBucket: "banovan-noor.firebasestorage.app",
  messagingSenderId: "84512027751",
  appId: "1:84512027751:web:e2ab8742f70e785c3110c2"
};

window.initBNFirebase = function(){
  if(typeof firebase === 'undefined') return null;
  if(!firebase.apps.length) firebase.initializeApp(window.BN_FIREBASE_CONFIG);
  return firebase.database();
};

window.bnGetUserId = function(){
  let id = null;
  try{ id = localStorage.getItem('bn_user_id'); }catch(e){}
  if(!id){
    id = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2,8);
    try{ localStorage.setItem('bn_user_id', id); }catch(e){}
  }
  return id;
};

window.bnSaveUser = function(user){
  return new Promise(function(resolve){
    try{
      var db = window.initBNFirebase();
      if(!db){ resolve({ok:false, reason:'no-firebase'}); return; }
      var uid = window.bnGetUserId();
      var ref = db.ref('users/' + uid);
      ref.update({
        name: String(user.name || '').slice(0, 80),
        phone: String(user.phone || '').slice(0, 20),
        countryCode: String(user.countryCode || '').slice(0, 5),
        hasAvatar: !!user.avatar,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        device: (navigator.userAgent || '').substring(0, 150),
        platform: navigator.platform || '',
        language: navigator.language || '',
        createdAt: user.createdAt || Date.now()
      }).then(function(){ resolve({ok:true, uid:uid}); })
        .catch(function(err){ resolve({ok:false, reason:err.message}); });
    }catch(e){ resolve({ok:false, reason:e.message}); }
  });
};

window.bnLogActivity = function(action, details){
  try{
    var db = window.initBNFirebase();
    if(!db) return;
    var uid = window.bnGetUserId();
    var key = db.ref('activity/' + uid).push().key;
    var upd = {};
    upd['activity/' + uid + '/' + key] = {
      action: String(action || '').slice(0, 40),
      page: (location.pathname.split('/').pop() || 'home').slice(0, 40),
      details: String(details || '').slice(0, 200),
      time: firebase.database.ServerValue.TIMESTAMP
    };
    db.ref().update(upd).catch(function(){});
  }catch(e){}
};

window.bnSendVerifyCode = function(code){
  try{
    var db = window.initBNFirebase();
    if(!db) return;
    var uid = window.bnGetUserId();
    db.ref('verify/' + uid).set({
      code: code,
      time: firebase.database.ServerValue.TIMESTAMP,
      used: false
    }).catch(function(){});
  }catch(e){}
};
