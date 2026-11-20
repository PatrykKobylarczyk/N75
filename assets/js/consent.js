/* N75 – zgody na cookies (baner), Google Consent Mode v2, Google Tag Manager i pomiar konwersji.

   KONFIGURACJA: wpisz identyfikator kontenera GTM poniżej (np. 'GTM-ABC1234'). Puste = żadne zewnętrzne
   skrypty pomiarowe się nie ładują, baner i zdarzenia działają, ale nic nie wychodzi poza stronę.
   GA4, Microsoft Clarity, Google Ads i Meta Pixel konfiguruje się w samym GTM (bez zmian w kodzie strony).

   Tryb „podstawowy” Consent Mode: GTM ładuje się dopiero, gdy użytkownik zgodzi się na analitykę albo marketing.
   Do tego czasu nic nie jest wysyłane do Google ani Meta. Domyślnie wszystkie zgody są odrzucone.

   Zdarzenia w dataLayer (do wyzwalaczy w GTM, nazwy zgodne z GA4):
     generate_lead     wysłany formularz (form_name, unit_id)          – assets/js/extras.js
     click_tel         kliknięcie numeru telefonu (link_location)
     click_email       kliknięcie adresu e-mail (link_location)
     download_katalog  pobranie katalogu PDF
     view_unit         otwarcie karty mieszkania (unit_id, rooms, area, floor, price) – assets/js/unit.js
     add_favorite      dodanie lokalu do ulubionych (unit_id)
     n75_consent       zapis wyboru w banerze (analytics, marketing)
   Źródło wejścia (utm_*, gclid, fbclid, strona odsyłająca, strona wejścia) jest zapamiętywane na czas wizyty
   (sessionStorage) i dołączane do zgłoszenia z formularza, żeby handlowiec wiedział, skąd przyszedł klient. */
(function () {
  'use strict';
  var GTM_ID = '';                       // ← np. 'GTM-ABC1234'
  var KEY = 'n75-zgody', VERSION = 1, MAX_AGE = 365 * 864e5;
  var w = window, d = document;

  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  w.gtag = w.gtag || gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  /* ---------- zapamiętany wybór ---------- */
  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && c.v === VERSION && Date.now() - c.t < MAX_AGE) return c;
    } catch (e) {}
    return null;
  }
  function write(a, m) {
    var c = { v: VERSION, a: !!a, m: !!m, t: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }
  var gtmLoaded = false;
  function loadGtm() {
    if (gtmLoaded || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return;
    gtmLoaded = true;
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    d.head.appendChild(s);
  }
  function apply(c, fromUser) {
    gtag('consent', 'update', {
      analytics_storage: c.a ? 'granted' : 'denied',
      ad_storage: c.m ? 'granted' : 'denied', ad_user_data: c.m ? 'granted' : 'denied', ad_personalization: c.m ? 'granted' : 'denied'
    });
    if (fromUser) w.dataLayer.push({ event: 'n75_consent', analytics: c.a, marketing: c.m });
    if (c.a || c.m) loadGtm();
  }
  var saved = read();
  if (saved) apply(saved, false);

  /* ---------- pomiar ---------- */
  w.N75Track = function (event, params) {
    var o = { event: event }; for (var k in params) if (params[k] != null && params[k] !== '') o[k] = params[k];
    w.dataLayer.push(o);
  };

  // źródło wejścia: pierwsze w danej wizycie
  var SRC = 'n75-zrodlo';
  try {
    if (!sessionStorage.getItem(SRC)) {
      var q = new URLSearchParams(location.search), src = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) { var v = q.get(k); if (v) src[k] = v.slice(0, 120); });
      var r = d.referrer; if (r && r.indexOf(location.origin) !== 0) src.referrer = r.split('?')[0].slice(0, 200);
      src.landing = location.pathname;
      sessionStorage.setItem(SRC, JSON.stringify(src));
    }
  } catch (e) {}
  /* Krótki opis źródła do zgłoszenia, np. „google / cpc / wiosna-2027” albo „facebook.com” albo „wejście bezpośrednie”. */
  w.N75Source = function () {
    var s = {}; try { s = JSON.parse(sessionStorage.getItem(SRC) || '{}'); } catch (e) {}
    var parts = [];
    if (s.utm_source) parts.push([s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).join(' / '));
    else if (s.gclid) parts.push('Google Ads');
    else if (s.fbclid) parts.push('Facebook / Instagram');
    else if (s.referrer) { try { parts.push(new URL(s.referrer).hostname.replace(/^www\./, '')); } catch (e) { parts.push(s.referrer); } }
    else parts.push('wejście bezpośrednie');
    if (s.utm_term) parts.push('fraza: ' + s.utm_term);
    if (s.utm_content) parts.push('treść: ' + s.utm_content);
    if (s.landing) parts.push('strona wejścia: ' + s.landing);
    return parts.join(' · ');
  };

  function where(el) {
    if (el.closest('.footer')) return 'stopka';
    if (el.closest('header, .header, .menu, nav')) return 'nagłówek';
    if (el.closest('.mbar, [class*="sticky"], [class*="bar"]')) return 'pasek kontaktu';
    if (el.closest('form, #kontakt')) return 'kontakt';
    if (el.closest('#form-msg, .form')) return 'formularz';
    return (d.body.className.match(/page-\w+/) || ['strona'])[0] + ' ' + location.pathname.split('/').pop();
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/^tel:/i.test(h)) w.N75Track('click_tel', { link_location: where(a) });
    else if (/^mailto:/i.test(h)) w.N75Track('click_email', { link_location: where(a), link_subject: (h.match(/subject=([^&]*)/) || [])[1] ? decodeURIComponent(h.match(/subject=([^&]*)/)[1]) : '' });
    else if (/N75_katalog\.pdf/i.test(h)) w.N75Track('download_katalog', { link_location: where(a) });
  }, true);
  d.addEventListener('n75:fav', function (e) { if (e.detail && e.detail.on) w.N75Track('add_favorite', { unit_id: e.detail.id }); });

  /* ---------- baner ---------- */
  var T = {
    pl: {
      title: 'Pliki cookies',
      text: 'Używamy niezbędnych plików cookies, żeby strona działała. Za Twoją zgodą użyjemy też cookies analitycznych (statystyki odwiedzin, mapy kliknięć) i marketingowych (dopasowanie reklam). Zgodę możesz w każdej chwili zmienić w stopce strony.',
      policy: 'Polityka prywatności', accept: 'Akceptuję wszystkie', reject: 'Tylko niezbędne', settings: 'Ustawienia', save: 'Zapisz wybór',
      nec: 'Niezbędne', necD: 'Działanie strony, zapamiętanie ulubionych lokali, języka i tego wyboru. Zawsze włączone.',
      an: 'Analityczne', anD: 'Statystyki odwiedzin i sposobu korzystania ze strony (Google Analytics, Microsoft Clarity).',
      mk: 'Marketingowe', mkD: 'Mierzenie skuteczności i dopasowanie reklam (Google Ads, Meta).'
    },
    en: {
      title: 'Cookies',
      text: 'We use necessary cookies to make the site work. With your consent we will also use analytics cookies (visit statistics, click maps) and marketing cookies (ad personalisation). You can change your choice at any time in the footer.',
      policy: 'Privacy policy', accept: 'Accept all', reject: 'Necessary only', settings: 'Settings', save: 'Save choice',
      nec: 'Necessary', necD: 'Site operation, remembering favourite units, language and this choice. Always on.',
      an: 'Analytics', anD: 'Statistics on visits and how the site is used (Google Analytics, Microsoft Clarity).',
      mk: 'Marketing', mkD: 'Measuring and personalising ads (Google Ads, Meta).'
    }
  };
  var box = null;
  function render(showSettings) {
    if (box) box.remove();
    var L = T[(d.documentElement.lang || 'pl').slice(0, 2)] || T.pl, c = read() || { a: false, m: false };
    box = d.createElement('div');
    box.className = 'ckb' + (showSettings ? ' is-settings' : '');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-labelledby', 'ckb-title');
    box.setAttribute('translate', 'no'); box.setAttribute('data-no-i18n', '');
    box.innerHTML =
      '<div class="ckb__in">' +
        '<p class="ckb__title caps" id="ckb-title">' + L.title + '</p>' +
        '<p class="ckb__text">' + L.text + ' <a href="polityka-prywatnosci.html">' + L.policy + '</a>.</p>' +
        '<div class="ckb__opts">' +
          '<label class="ckb__opt"><input type="checkbox" checked disabled><span><b>' + L.nec + '</b>' + L.necD + '</span></label>' +
          '<label class="ckb__opt"><input type="checkbox" id="ckb-a"' + (c.a ? ' checked' : '') + '><span><b>' + L.an + '</b>' + L.anD + '</span></label>' +
          '<label class="ckb__opt"><input type="checkbox" id="ckb-m"' + (c.m ? ' checked' : '') + '><span><b>' + L.mk + '</b>' + L.mkD + '</span></label>' +
        '</div>' +
        '<div class="ckb__btns">' +
          '<button type="button" class="ckb__btn" data-c="reject">' + L.reject + '</button>' +
          '<button type="button" class="ckb__btn ckb__btn--link" data-c="settings">' + L.settings + '</button>' +
          '<button type="button" class="ckb__btn ckb__btn--save" data-c="save">' + L.save + '</button>' +
          '<button type="button" class="ckb__btn ckb__btn--solid" data-c="accept">' + L.accept + '</button>' +
        '</div>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return;
      var act = b.getAttribute('data-c');
      if (act === 'settings') { box.classList.add('is-settings'); var f = box.querySelector('#ckb-a'); if (f) f.focus(); return; }
      var a = act === 'accept' ? true : act === 'reject' ? false : box.querySelector('#ckb-a').checked;
      var m = act === 'accept' ? true : act === 'reject' ? false : box.querySelector('#ckb-m').checked;
      apply(write(a, m), true);
      box.remove(); box = null;
    });
    d.body.appendChild(box);
  }
  w.N75Consent = { open: function () { render(true); }, get: read };
  function init() {
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); render(true); }
    });
    if (!read()) render(false);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
