/* N75 – przełącznik języka PL / EN.
   Flaga w nagłówku: UK → cała strona po angielsku (słownik assets/js/i18n-en.js + wzorce poniżej), PL → powrót.
   Wybór zapamiętany w przeglądarce (localStorage „n75-lang”), działa też ?lang=en. Treści dopisywane przez skrypty
   (makieta, filtry, karta lokalu) tłumaczy obserwator zmian DOM. */
(function () {
  'use strict';
  var KEY = 'n75-lang', H = document.documentElement;
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var q = null; try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (q === 'en' || q === 'pl') store(q);
  // /en/… – osobny adres wersji angielskiej (dla Google); /nowa/… – polska
  var EN_PATH = /^\/en(\/|$)/.test(location.pathname), NOWA_PATH = /^\/nowa(\/|$)/.test(location.pathname);
  var lang = EN_PATH ? 'en' : (q === 'en' || q === 'pl') ? q : NOWA_PATH ? 'pl' : (stored() === 'en' ? 'en' : 'pl');
  var swapPath = function (l) { return (l === 'en' ? location.pathname.replace(/^\/nowa(\/|$)/, '/en$1') : location.pathname.replace(/^\/en(\/|$)/, '/nowa$1')) + location.search.replace(/([?&])lang=\w+&?/, '$1').replace(/[?&]$/, '') + location.hash; };
  H.lang = lang;
  // adresy językowe dla Google: canonical na /en/ wskazuje siebie, para hreflang pl ↔ en na każdej stronie
  (function () {
    var m = location.pathname.match(/^\/(stara|nowa|en)(\/.*)?$/); if (!m) return;
    var rest = (m[2] || '/') + location.search.replace(/([?&])lang=\w+&?/, '$1').replace(/[?&]$/, ''), o = location.origin, hd = document.head;
    var add = function (rel, href, hl) { var l = document.createElement('link'); l.rel = rel; l.href = href; if (hl) l.hreflang = hl; hd.appendChild(l); };
    add('alternate', o + '/stara' + rest, 'pl'); add('alternate', o + '/en' + rest, 'en'); add('alternate', o + '/stara' + rest, 'x-default');
    if (m[1] === 'en') { var c = document.querySelector('link[rel=canonical]'); if (c) c.href = o + '/en' + rest; else add('canonical', o + '/en' + rest); }
  })();

  var D = window.N75_EN || {};
  var norm = function (s) { return s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim(); };
  var ROOMS = { 'Pokój': 'Room', 'Salon z aneksem kuchennym': 'Living room with kitchenette', 'Łazienka': 'Bathroom', 'Komunikacja': 'Hallway', 'WC': 'WC', 'Pralnia': 'Laundry', 'Garderoba': 'Walk-in wardrobe', 'Spiżarnia': 'Pantry', 'Sauna': 'Sauna' };
  var MON = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  var MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var ROMAN = { I: 1, II: 2, III: 3, IV: 4 };
  var pl = function (n, one, many) { return n + ' ' + (+n === 1 ? one : many); };
  function T(s) { var t = tr(s); return t == null ? s : t; }
  function list(s) { return s.split(', ').map(T).join(', '); }

  // liczby po angielsku: ceny w PLN z przecinkami tysięcy, kropka dziesiętna
  function num(s) {
    s = s.replace(/(\d),(\d)/g, '$1.$2');
    s = s.replace(/(\d[\d\u00a0 ]*?)\s?tys\./g, function (m, a) { return 'PLN ' + a.replace(/[\s\u00a0]/g, '') + 'k'; });
    return s.replace(/(\d{1,3}(?:[ \u00a0]\d{3})+|\d+)(?:\.(\d+))?[ \u00a0]?zł(\/m²)?/g, function (m, a, d, per) { return 'PLN ' + a.replace(/[ \u00a0]/g, ',') + (d ? '.' + d : '') + (per || ''); });
  }

  var RULES = [
    [/^(\d+)\. (.+)$/, function (m) { return m[1] + '. ' + (ROOMS[m[2]] || T(m[2])); }],
    [/^(\d+) (?:pokój|pokoje|pokoi)$/, function (m) { return pl(m[1], 'room', 'rooms'); }],
    [/^(\d+) lokal(?:i|e)? usługow(?:e|ych|y)$/, function (m) { return pl(m[1], 'commercial unit', 'commercial units'); }],
    [/^(\d+) lokal(?:i|e)?$/, function (m) { return pl(m[1], 'unit', 'units'); }],
    [/^(\d+) woln(?:e|ych|y)$/, function (m) { return m[1] + ' available'; }],
    [/^(\d+) WOLN(?:E|YCH|Y) \/ (\d+)$/, function (m) { return m[1] + ' AVAILABLE / ' + m[2]; }],
    [/^(\d+) PLATFORM(?:A|Y)?$/, function (m) { return pl(m[1], 'PLATFORM', 'PLATFORMS'); }],
    [/^(\d+) MIEJSC(?:A|E)?$/, function (m) { return pl(m[1], 'SPACE', 'SPACES'); }],
    [/^(\d+) komórek$/, function (m) { return m[1] + ' storage rooms'; }],
    [/^ok\. (\d+) min pieszo$/, function (m) { return 'approx. ' + m[1] + ' min walk'; }],
    [/^wolne: (\d+)$/, function (m) { return 'available: ' + m[1]; }],
    [/^(\d+) z (\d+) mieszkań$/, function (m) { return m[1] + ' of ' + m[2] + ' apartments'; }],
    [/^(\d+) z (\d+) lokali usługowych$/, function (m) { return m[1] + ' of ' + m[2] + ' commercial units'; }],
    [/^(\d+) z (\d+)$/, function (m) { return m[1] + ' of ' + m[2]; }],
    [/^lobby i (\d+) lokale usługowe$/, function (m) { return 'lobby and ' + m[1] + ' commercial units'; }],
    [/^od (\d{2}\.\d{2}\.\d{4})$/, function (m) { return 'since ' + m[1]; }],
    [/^Historia ceny lokalu (.+)$/, function (m) { return 'Price history of unit ' + m[1]; }],
    [/^aktualna cena (.+) od (\d{2}\.\d{2}\.\d{4})$/, function (m) { return 'current price ' + m[1] + ' since ' + m[2]; }],
    [/^Pokaż wszystkie lokale \((\d+)\)$/, function (m) { return 'Show all units (' + m[1] + ')'; }],
    [/^Dodaj do ulubionych: (.+)$/, function (m) { return 'Add to favourites: ' + m[1]; }],
    [/^Usuń z ulubionych: (.+)$/, function (m) { return 'Remove from favourites: ' + m[1]; }],
    [/^Apartament ([MU][\d.]+)$/, function (m) { return 'Apartment ' + m[1]; }],
    [/^Apartament · piętro (.+)$/, function (m) { return 'Apartment · floor' + (/ i /.test(m[1]) ? 's ' : ' ') + T(m[1]); }],
    [/^(\d) i (\d)(?: \(dwupoziomowy\))?$/, function (m) { return m[1] + ' and ' + m[2] + (/dwupoziomowy/.test(m[0]) ? ' (two-level)' : ''); }],
    [/^Górne poziomy (.+) i (.+)$/, function (m) { return 'Upper levels of ' + m[1] + ' and ' + m[2]; }],
    [/^Piętro (\d+)$/, function (m) { return 'Floor ' + m[1]; }],
    [/^(\d+)\. piętro$/, function (m) { return 'Floor ' + m[1]; }],
    [/^Rzut piętra (\d+)$/, function (m) { return 'Floor ' + m[1] + ' plan'; }],
    [/^Porozmawiajmy o (.+)$/, function (m) { return "Let's talk about " + m[1]; }],
    [/^Umów prezentację (.+)$/, function (m) { return 'Book a presentation of ' + m[1]; }],
    [/^Zapytaj o (.+)$/, function (m) { return 'Enquire about ' + m[1]; }],
    [/^Kontakt w sprawie apartamentu (.+)$/, function (m) { return 'Enquiry about apartment ' + m[1]; }],
    [/^Rzut apartamentu (\S+)\. Na widoku całego piętra kliknij inny lokal, aby otworzyć jego kartę\.$/, function (m) { return 'Floor plan of apartment ' + m[1] + '. In the whole-floor view, click another unit to open its page.'; }],
    [/^Lokal (\S+) nie istnieje w ofercie N75\.$/, function (m) { return 'Unit ' + m[1] + ' is not part of the N75 offer.'; }],
    [/^(Loggia|Taras) (.+)$/, function (m) { return (m[1] === 'Taras' ? 'Terrace ' : 'Loggia ') + m[2]; }],
    [/^([\d,.]+ m²) \+ ([\d,.]+ m²) (.+)$/, function (m) { return m[1] + ' + ' + m[2] + ' ' + T(m[3]); }],
    [/^(\d{1,2}) (stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia) (\d{4})$/, function (m) { return m[1] + ' ' + MON_EN[MON.indexOf(m[2])] + ' ' + m[3]; }],
    [/^(I{1,3}|IV) kw\.(?: (\d{4}))?$/, function (m) { return 'Q' + ROMAN[m[1]] + (m[2] ? ' ' + m[2] : ''); }],
    [/^Apartament (\S+) w N75, Narutowicza 75A, Łódź: (.+?), ([\d,]+ m²), piętro (\d+), ekspozycja (.+)\. Rzut, cena i kontakt w sprawie lokalu\.$/, function (m) {
      return 'Apartment ' + m[1] + ' at N75, Narutowicza 75A, Łódź: ' + T(m[2]) + ', ' + m[3] + ', floor ' + m[4] + ', facing ' + list(m[5]) + '. Floor plan, price and contact details for the unit.'; }],
    [/^Dziękujemy! Doradca skontaktuje się w sprawie (.+) w ciągu jednego dnia roboczego\.$/, function (m) { return 'Thank you! An adviser will contact you about ' + m[1] + ' within one working day.'; }],
    [/^Dzień dobry, proszę o informacje o lokalach: (.+)\.$/, function (m) { return 'Hello, please send me information about units: ' + m[1] + '.'; }],
    [/^Hala garażowa z (\d+) stanowiskami Parklift \(G01–G(\d+)\): (\d+) podwójnych \(2 platformy obok siebie\) i (\d+) pojedyncze – razem (\d+) platform dwupoziomowych, czyli (\d+) miejsc \(numeracja 15–58 wg projektu\)\. Razem z (\d+) miejscami na parterze daje to ok\. (\d+) miejsc w budynku\.(.*)$/, function (m) {
      return 'A garage hall with ' + m[1] + ' Parklift stackers (G01–G' + m[2] + '): ' + m[3] + ' double (2 platforms side by side) and ' + m[4] + ' single – a total of ' + m[5] + ' two-level platforms, i.e. ' + m[6] + ' spaces (numbered 15–58 in the design). Together with the ' + m[7] + ' spaces on the ground floor, this gives about ' + m[8] + ' spaces in the building. In addition, 2 motorcycle spaces, 17 storage rooms (2–6 m²), a pram and bike room (16.45 m²), a cleaning room and direct access to the staircase and lift through fire lobbies. Ramp access from the ground floor. The sales office will confirm availability.'; }],
    [/^Lobby z recepcją, hala garażowa z (\d+) miejscami postojowymi \(P01–P(\d+)\), (.+)$/, function (m) { return 'A lobby with reception, a garage hall with ' + m[1] + ' parking spaces (P01–P' + m[2] + '), storage rooms and three commercial units facing Narutowicza and Tramwajowa Streets. The use of the units to be agreed with the tenant or buyer.'; }]
  ];
  var SEPS = [': ', ' · ', ' – ', ', ', ' / '];

  // tłumaczenie jednego (znormalizowanego) tekstu; null = brak tłumaczenia
  function tr(s, depth) {
    if (!s) return null;
    if (Object.prototype.hasOwnProperty.call(D, s)) return D[s];
    for (var i = 0; i < RULES.length; i++) { var m = s.match(RULES[i][0]); if (m) return RULES[i][1](m); }
    var e = s.match(/^(.*?)(\s*[·:–]\s*)$/); if (e && e[1]) { var t0 = tr(e[1], depth); if (t0 != null) return t0 + e[2]; }
    if ((depth || 0) > 8) return null;
    for (var k = 0; k < SEPS.length; k++) {
      var at = s.indexOf(SEPS[k]); if (at < 0) continue;
      var a = s.slice(0, at), b = s.slice(at + SEPS[k].length), ta = tr(a, (depth || 0) + 1), tb = tr(b, (depth || 0) + 1);
      if (ta != null || tb != null) return (ta == null ? a : ta) + SEPS[k] + (tb == null ? b : tb);
    }
    return null;
  }
  function full(s) { var n = norm(s); if (!n) return null; var t = tr(n); if (t == null) { var nn = num(n); return nn !== n && /zł|tys\.|\d,\d/.test(n) ? nn : null; } return num(t); }

  /* ---------- zapis oryginałów i podmiana ---------- */
  var TXT = new Map(), ATT = new Map(), SET = new WeakMap();
  var ATTRS = ['alt', 'aria-label', 'placeholder', 'title', 'data-lightbox', 'data-cap', 'content'];
  var SKIP = 'script,style,noscript,textarea,.pg-panel,.lang-switch,[data-no-i18n]';
  function txtNode(n) {
    var p = n.parentElement; if (!p || p.closest(SKIP)) return;
    var cur = n.nodeValue; if (SET.get(n) === cur) return;
    var t = full(cur); if (t == null) return;
    var lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0];
    var v = lead + t + trail; if (v === cur) return;
    TXT.set(n, cur); SET.set(n, v); n.nodeValue = v;
  }
  function attrEl(el) {
    if (el.closest && el.closest('.pg-panel,.lang-switch,[data-no-i18n]')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i]; if (!el.hasAttribute(a)) continue;
      if (a === 'content' && !(el.tagName === 'META' && /^(description|og:title|og:description)$/.test(el.getAttribute('name') || el.getAttribute('property')))) continue;
      var cur = el.getAttribute(a), k = el; var rec = ATT.get(k) || {};
      if (rec[a] && rec[a].set === cur) continue;
      var t = full(cur); if (t == null || t === cur) continue;
      rec[a] = { orig: cur, set: t }; ATT.set(k, rec); el.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { txtNode(root); return; }
    if (root.nodeType !== 1) return;
    attrEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) txtNode(n); else attrEl(n); }
  }
  // słowa „5 powodów” są złożone z osobnych liter
  var VW = { 'ARCHITEKTURA': 'ARCHITECTURE', 'LOKALIZACJA': 'LOCATION', 'MODERNIZM': 'MODERNISM', 'KUNSZT': 'CRAFT', 'WELLNESS': 'WELLNESS', 'ADRES': 'ADDRESS', 'ŚWIATŁO': 'LIGHT', 'CISZA': 'SILENCE' };
  function words(en) {
    document.querySelectorAll('.vw__word').forEach(function (w) {
      if (en) {
        if (w.dataset.pl) return;
        var word = w.textContent.replace(/\s/g, ''), t = VW[word]; if (!t) return;
        w.dataset.pl = w.innerHTML;
        w.innerHTML = t.split('').map(function (c) { return '<span class="vl"><span>' + c + '</span></span>'; }).join('');
      } else if (w.dataset.pl) { w.innerHTML = w.dataset.pl; delete w.dataset.pl; }
    });
  }
  function toEN() { words(true); walk(document.documentElement); }
  function toPL() {
    TXT.forEach(function (orig, n) { if (SET.get(n) === n.nodeValue) n.nodeValue = orig; SET.delete(n); });
    TXT.clear();
    ATT.forEach(function (rec, el) { Object.keys(rec).forEach(function (a) { if (el.getAttribute(a) === rec[a].set) el.setAttribute(a, rec[a].orig); }); });
    ATT.clear(); words(false);
  }
  var mo = new MutationObserver(function (list) {
    if (lang !== 'en') return;
    list.forEach(function (m) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') txtNode(m.target);
      else if (m.type === 'attributes') attrEl(m.target);
    });
  });

  /* ---------- flaga w nagłówku ---------- */
  // flagi w proporcjach 3:2 (jak przycisk), wszystko przycięte do prostokąta – bez wystających ukośnych pasów
  var UK = '<svg viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="lsw-uk-o"><rect width="60" height="40"/></clipPath><clipPath id="lsw-uk-t"><path d="M30 20h30v20zv20H0zH0V0zV0h30z"/></clipPath></defs>' +
    '<g clip-path="url(#lsw-uk-o)"><rect width="60" height="40" fill="#012169"/><path d="M0 0l60 40m0-40L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0l60 40m0-40L0 40" clip-path="url(#lsw-uk-t)" stroke="#C8102E" stroke-width="5"/>' +
    '<path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="13"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="8"/></g></svg>';
  var PL = '<svg viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true"><rect width="60" height="20" fill="#fff"/><rect y="20" width="60" height="20" fill="#DC143C"/></svg>';
  var btn = null;
  function paintBtn() {
    if (!btn) return;
    btn.innerHTML = lang === 'en' ? PL : UK;
    btn.setAttribute('aria-label', lang === 'en' ? 'Wersja polska' : 'English version');
    btn.title = lang === 'en' ? 'Polski' : 'English';
  }
  function addBtn() {
    var host = document.querySelector('.header__right') || document.querySelector('.header__in');
    if (!host || host.querySelector('.lang-switch')) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'lang-switch';
    btn.addEventListener('click', function () { var l = lang === 'en' ? 'pl' : 'en'; if (EN_PATH || NOWA_PATH) { store(l); location.href = swapPath(l); return; } set(l); });
    host.insertBefore(btn, host.firstChild); paintBtn();
  }
  function set(l, fromStorage) {
    if (l === lang) return;
    lang = l; H.lang = l; if (!fromStorage) store(l);
    if (l === 'en') toEN(); else toPL();
    paintBtn();
  }
  window.addEventListener('storage', function (e) { if (EN_PATH || NOWA_PATH) return; if (e.key === KEY && (e.newValue === 'en' || e.newValue === 'pl')) set(e.newValue, true); });
  window.N75Lang = { get: function () { return lang; }, set: set, t: function (s) { return lang === 'en' ? (full(s) || s) : s; } };

  function init() {
    addBtn();
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (lang === 'en') toEN();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
