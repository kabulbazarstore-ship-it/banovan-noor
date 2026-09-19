// کد اتصال BANOVAN NOOR به PostHog
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,s){var o=s.split(".");2==o.length&&(t=t[o[0]],s=o[1]),t[s]=function(){t.push([s].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

posthog.init('phc_thu6zvysqiEhV3DCyZPu57QbepXhLofDf9A6idNNB3r3', {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true
});

// تابع‌های سفارشی برای بخش‌های مختلف
function trackAhkam() { posthog.capture('ahkam_open', { section: 'احکام' }); }
function trackHealth() { posthog.capture('health_open', { section: 'بانوان و سلامت' }); }
function trackDuas() { posthog.capture('duas_open', { section: 'دعاها' }); }
function trackHamraz() { posthog.capture('hamraz_open', { section: 'همراز' }); }
function trackMenstruation() { posthog.capture('menstruation_open', { section: 'قاعدگی' }); }
