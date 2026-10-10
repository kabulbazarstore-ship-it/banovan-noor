/* =========================================================
   BANOVAN NOOR — Analytics (PostHog) - نسخه نهایی و اصلاح‌شده
   ========================================================= */
(function () {
  'use strict';

  var APP_VERSION = '1.0.0'; // نسخه اپ — برای آپدیت‌های آینده اینجا تغییر بده

  // اگر کاربر Do Not Track فعال کرده، آنالیتیکس رو اجرا نکن
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    console.info('[BN Analytics] غیرفعال: Do Not Track فعال است.');
    window.bnAnalytics = { track: function () {}, identify: function () {}, trackSection: function () {} };
    return;
  }

  // بارگذاری اسکریپت PostHog
  !function (t, e) {
    var o, n, p, r;
    e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) {
      function g(t, s) {
        var o = s.split('.');
        2 == o.length && (t = t[o[0]], s = o[1]);
        t[s] = function () { t.push([s].concat(Array.prototype.slice.call(arguments, 0))); };
      }
      (p = t.createElement('script')).type = 'text/javascript';
      p.async = !0;
      p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
      (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
      var u = e;
      void 0 !== a ? u = e[a] = [] : a = 'posthog';
      u.people = u.people || [];
      u.toString = function (t) { var e = 'posthog'; return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e; };
      u.people.toString = function () { return u.toString(1) + '.people (stub)'; };
      o = 'capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId'.split(' ');
      for (n = 0; n < o.length; n++) g(u, o[n]);
      e._i.push([i, s, a]);
    }, e.__SV = 1);
  }(document, window.posthog || []);

  // مقداردهی اولیه
  posthog.init('phc_thu6zvysqiEhV3DCyZPu57QbepXhLofDf9A6idNNB3r3', {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // خاموش شد تا با bn-tracker.js تداخل نداشته باشه
    capture_pageleave: true,
    autocapture: false, // برای حریم خصوصی
    disable_session_recording: true, // برای حریم خصوصی
    loaded: function (ph) {
      // ثبت اولین رویداد بعد از آماده شدن
      ph.capture('app_loaded', {
        app: 'banovan_noor',
        version: APP_VERSION,
        lang: (localStorage.getItem('bn_lang') || 'fa'),
        theme: (localStorage.getItem('bn_theme') || 'light')
      });
    }
  });

  // API عمومی و امن
  window.bnAnalytics = {
    /**
     * ثبت رویداد سفارشی
     * @param {string} event - نام رویداد
     * @param {object} props - اطلاعات اضافی
     */
    track: function (event, props) {
      try {
        if (!window.posthog || typeof posthog.capture !== 'function') return;
        posthog.capture(event, Object.assign({
          app: 'banovan_noor',
          ts: Date.now()
        }, props || {}));
      } catch (e) {
        console.warn('[BN Analytics] Track error:', e.message);
      }
    },

    /**
     * شناسایی کاربر (وقتی لاگین کرد)
     * @param {string} userId
     * @param {object} props
     */
    identify: function (userId, props) {
      try {
        if (!window.posthog || typeof posthog.identify !== 'function') return;
        posthog.identify(userId, Object.assign({
          app: 'banovan_noor'
        }, props || {}));
      } catch (e) {
        console.warn('[BN Analytics] Identify error:', e.message);
      }
    },

    /**
     * ثبت رویدادهای مربوط به بخش‌های خاص
     */
    trackSection: function (section) {
      this.track('section_open', { section: section });
    }
  };

  // میان‌برهای آسان
  window.trackAhkam  = function () { window.bnAnalytics.trackSection('ahkam'); };
  window.trackHealth = function () { window.bnAnalytics.trackSection('health'); };
  window.trackDuas   = function () { window.bnAnalytics.trackSection('duas'); };
  window.trackHamraz = function () { window.bnAnalytics.trackSection('hamraz'); };
})();
