/* PODGLĄD KONCEPCJI N75 – trzy kierunki graficzne, każdy z własnym logo (tylko gałąź podglądu) */
(function () {
  'use strict';
  var KEY = 'n75-podglad2', H = document.documentElement;
  var DIR = [
    ['', 'Obecny', 'Kremowy papier, mosiądz, cienki geometryczny krój. Obecne logo liniowe.'],
    ['k1', 'Koncepcja 01', 'Geometria i konstrukcja: koła, półkola i łuki, polska awangarda. Bordo, glina, róż, fiolet. Logo z figur geometrycznych.'],
    ['k2', 'Koncepcja 02', 'Rytm i modularność: prostokąty, pionowe podziały, szachownica i efekt luksferów. Zieleń, brąz, błękit. Logo modułowe z pionowych pasów.'],
    ['k3', 'Koncepcja 03', 'Kolory obecnej strony (kremowy papier, mosiądz, ciepła czerń) z krojami, kształtami i logo Koncepcji 01: koła, półkola, łuki, zaokrąglone przyciski, logo geometryczne.'],
    ['k3b', 'Koncepcja 03b', 'Koncepcja 03 delikatnie poprawiona: hero z ćwiartką koła i trzema liniami w stylu streamline lat 30., lżejsze nagłówki, wszystkie łuki do góry, numery w mosiądzu, 5 powodów bez numerów i linków, cieńsze przyciski.'],
    ['k4', 'Koncepcja 04', 'Koncepcja 03b w klimacie szyldów lat 30.: logo i nagłówki w kroju „N75 Szyld” (wzór: neon księgarni S. Seipelta, Łódź), nagłówki w pasie dwóch linii, drobne napisy wąskimi wersalikami, liczby i ceny jak numeracja na tablicach, barwy czarno-białej fotografii z mosiądzem, delikatne światło neonu w hero, separatory z trzech linii i tabliczka adresowa w stopce.'],
    ['k5', 'Koncepcja 05', 'Koncepcja 03b z logo z liter lat 30.: grube geometryczne wersaliki z przerwami jak w ażurowej bramie i napisy z metalowych liter (Telefon Międzymiastowy, Seipelt, Wedel). Mocny akcent metalicznego brązu: logo, nagłówki, przyciski, liczby i linie z połyskiem metalu. Nagłówki szerokimi wersalikami, drobne napisy cienkim krojem art déco, tabliczka z adresem w hero i w stopce.']
  ];
  var STY = [['', 'Obecna'], ['kamien', 'Lata 30 · kamień'], ['mosiadz', 'Lata 30 · mosiężne litery'], ['szyld', 'Lata 30 · szyld']];
  var ACC = [['', 'Mosiądz', '#9c7149'], ['zielen', 'Zieleń', '#4f7262'], ['rosso', 'Rosso', '#9a3b32'], ['blekit', 'Błękit', '#4f7a8a']];
  /* n75.vercel.app/nowa/ – publiczna wersja strony w koncepcji 03b, bez panelu podglądu */
  var FIX = /^\/nowa(\/|$)/.test(location.pathname);
  var st = {}; if (FIX) st = { kierunek: 'k3b' }; else { try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var q = new URLSearchParams(location.search); ['akcent', 'kierunek', 'styl'].forEach(function (k) { if (q.has(k)) st[k] = q.get(k); }); }

  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=Outfit:wght@300;400;500;600&family=Archivo:wdth,wght@100..125,300..700&family=Instrument+Sans:wght@400;500&family=Major+Mono+Display&family=Josefin+Sans:ital,wght@0,200..600;1,200..500&family=Poiret+One&family=Sacramento&display=swap';
  document.head.appendChild(fl);

  /* ---------- logo ---------- */
  // Koncepcja 01: logo z figur geometrycznych (wg przesłanego wzoru)
  var L1 = { vb: '0 0 925 435', svg:
    '<path d="M0 433V0h27a105 115 0 0 1 105 115v318z"/>' +
    '<path d="M152 0h132v433h-32a100 115 0 0 1-100-115z"/>' +
    '<path d="M320 0h282v127H320z"/>' +
    '<path d="M437 433V240a131 95 0 0 1 131-95v148a91 140 0 0 1-91 140z"/>' +
    '<path d="M640 0h128v160a96 117 0 0 1-96 117h-32z"/>' +
    '<circle cx="704" cy="367" r="68"/>' +
    '<path d="M790 0h132v127h-30A102 127 0 0 1 790 0z"/>' +
    '<path d="M790 145h10a125 140 0 0 1 125 140v8a125 140 0 0 1-125 140h-10z"/>' };
  // Koncepcja 04: logo z kroju N75 Szyld (neon księgarni S. Seipelta) w pasie dwóch linii
  var L4 = { vb: '-28 -74 1208 868', svg: '<path d="M-28 692L-28 177L-27 159L-24 141L-19 123L-13 106L-4 89L6 73L18 59L31 46L45 34L61 24L78 15L95 9L113 4L131 1L150 0L169 1L187 4L205 9L222 15L239 24L255 34L269 46L282 59L294 73L304 89L313 106L319 123L324 141L327 159L328 177L328 692L328 697L326 702L324 706L321 710L318 713L314 716L310 718L305 720L300 720L295 720L290 718L286 716L282 713L279 710L276 706L274 702L272 697L272 692L272 179L271 165L269 153L266 140L261 128L256 117L249 106L241 96L232 87L222 79L211 72L200 67L188 62L175 59L163 57L150 56L137 57L125 59L112 62L100 67L89 72L78 79L68 87L59 96L51 106L44 117L39 128L34 140L31 153L29 165L28 179L28 692L28 697L26 702L24 706L21 710L18 713L14 716L10 718L5 720L0 720L-5 720L-10 718L-14 716L-18 713L-21 710L-24 706L-26 702L-28 697ZM436 0L726 0L731 0L736 2L740 4L744 7L747 10L750 14L752 18L754 23L754 28L754 33L752 38L750 42L747 46L744 49L740 52L736 54L731 56L726 56L436 56L431 56L426 54L422 52L418 49L415 46L412 42L410 38L408 33L408 28L408 23L410 18L412 14L415 10L418 7L422 4L426 2L431 0ZM753 36L550 700L548 705L545 709L542 712L538 715L534 718L529 719L524 720L520 720L515 719L510 717L506 714L503 711L500 707L497 703L496 698L495 693L495 689L496 684L699 20L701 15L704 11L707 8L711 5L715 2L720 1L725 0L729 0L734 1L739 3L743 6L746 9L749 13L752 17L753 22L754 27L754 31ZM1152 56L872 56L867 56L862 54L858 52L854 49L851 46L848 42L846 38L844 33L844 28L844 23L846 18L848 14L851 10L854 7L858 4L862 2L867 0L872 0L1152 0L1157 0L1162 2L1166 4L1170 7L1173 10L1176 14L1178 18L1180 23L1180 28L1180 33L1178 38L1176 42L1173 46L1170 49L1166 52L1162 54L1157 56ZM900 29L890 301L889 306L888 311L886 315L883 319L879 322L875 325L871 327L866 328L861 328L856 327L851 326L847 324L843 321L840 317L837 313L835 309L834 304L834 299L844 27L845 22L846 17L848 13L851 9L855 6L859 3L863 1L868 0L873 0L878 1L883 2L887 4L891 7L894 11L897 15L899 19L900 24ZM862 272L1008 272L1026 273L1045 277L1064 284L1082 294L1098 305L1113 319L1127 334L1140 352L1150 370L1160 390L1167 411L1173 433L1177 456L1179 478L1180 502L1179 525L1175 547L1171 569L1164 591L1155 611L1145 631L1134 649L1121 665L1106 680L1090 693L1073 703L1055 711L1036 717L1017 720L998 720L978 717L960 712L942 704L924 693L909 681L894 666L881 650L869 632L859 612L850 592L844 571L843 567L843 562L843 557L845 552L847 548L850 544L854 541L858 538L862 536L867 535L872 535L877 536L881 537L886 539L890 542L893 546L896 550L897 555L903 573L910 589L917 603L926 617L936 628L946 639L956 647L968 654L979 659L990 662L1002 664L1013 664L1024 662L1036 659L1047 654L1058 647L1069 638L1079 628L1088 616L1097 603L1105 588L1111 572L1116 555L1120 537L1123 519L1124 500L1124 482L1122 463L1118 445L1114 428L1108 412L1101 396L1093 382L1083 369L1074 358L1063 349L1052 341L1041 336L1030 331L1018 329L1006 328L862 328L857 328L852 326L848 324L844 321L841 318L838 314L836 310L834 305L834 300L834 295L836 290L838 286L841 282L844 279L848 276L852 274L857 272ZM-28 -74H1180V-52H-28ZM-28 772H1180V794H-28Z"/>' };
  // Koncepcja 05: N75 z grubych geometrycznych wersalików z przerwami szablonu (brama „10 Lutego”, Telefon Międzymiastowy)
  var L5 = { vb: '0 0 636 220', svg: '<path d="M0 0h40v220h-40zM156 0h40v220h-40zM50 0L98 0L146 220L98 220ZM246 0h168v40h-168zM360 50L414 50L342 220L288 220ZM514 0h122v40h-122zM464 0h40v136h-40zM514 96H574.0A62.0 62.0 0 0 1 574.0 220H464V180H574.0A22.0 22.0 0 0 0 574.0 136H514Z"/>' };
  // Koncepcja 02: logo modułowe – litery z prostokątów, wypełnione rytmem pionowych pasów
  var shapes = '<path d="M0 0h60v300H0zM180 0h60v300h-60zM60 0h30v80H60zM90 70h30v80H90zM120 150h30v80h-30zM150 220h30v80h-30z' +
    'M280 0h220v60H280zM440 60h60v60h-60zM410 120h60v60h-60zM380 180h60v60h-60zM350 240h60v60h-60z' +
    'M540 0h220v60H540zM540 60h60v60h-60zM540 120h160a60 60 0 0 1 60 60v60a60 60 0 0 1-60 60H540v-60h160v-60H540z"/>';
  var bars = ''; for (var x = 0; x < 760; x += 30) bars += '<rect x="' + x + '" y="0" width="21" height="300"/>';
  var L2 = { vb: '0 0 760 300', svg: '<defs><clipPath id="k2-clip">' + shapes + '</clipPath></defs><g clip-path="url(#k2-clip)">' + bars + '</g>' };

  // Lata 30 · mosiężne litery: geometryczna monolinia z zaokrąglonymi końcami
  var LM = { vb: '0 0 500 230', svg: '<g fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M30 200V30l120 170V30"/><path d="M200 30h120L250 200"/><path d="M262 120h52"/>' +
    '<path d="M470 30h-100v100"/><path d="M370 130a52 52 0 1 1 1 36"/></g>' };
  // Lata 30 · szyld: cienkie wersaliki art déco w ramie z linii, z tabliczką
  var LS = { vb: '0 0 600 300', svg: '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M40 64h155M405 64h155M40 250h520M40 262h520M40 64v186M560 64v186"/>' +
    '<rect x="195" y="46" width="210" height="36" rx="4"/>' +
    '<path d="M110 228V96l100 132V96"/><path d="M258 96h104l-70 132"/><path d="M285 166h56"/>' +
    '<path d="M490 96h-78l-6 60c12-10 26-14 40-14a44 44 0 1 1-38 66"/></g>' +
    '<text x="300" y="70" text-anchor="middle" font-family="Josefin Sans, Jost, sans-serif" font-size="16" textLength="176" lengthAdjust="spacingAndGlyphs" fill="currentColor">NARUTOWICZA 75</text>' };
  // Lata 30 · kamień: monogram z grubych cyfr z przerwami (jak kute „1930”) + ażurowy napis NARUTOWICZA 75
  var LK = { vb: '0 0 584 202', svg: '<path d="M0 0h38v200H0z"/><path d="M50 0h40l68 200h-40z"/><path d="M170 0h38v200h-38z"/><path d="M250 0h156v38H250z"/><path d="M366 50h42L330 200h-42z"/><path d="M448 0h134v38H448z"/><path d="M448 48h38v58h-38z"/><path d="M501.6 80.9A60 60 0 1 1 460.0 170.0L491.2 152.0A24 24 0 1 0 507.8 116.4Z"/><circle cx="475.6" cy="161.0" r="22"/>' };
  var WORD = { vb: '-4 -4 1296 88', svg: '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="butt" stroke-linejoin="miter"><path transform="translate(0 0)" d="M0 80V0L56 80V0"/><path transform="translate(96 0)" d="M0 80L32 0L64 80M22 54H48"/><path transform="translate(200 0)" d="M0 80V0H30a20 20 0 0 1 0 40H0M28 40L52 80"/><path transform="translate(292 0)" d="M0 0V52a26 26 0 0 0 23 26M33 78A26 26 0 0 0 56 52V0"/><path transform="translate(388 0)" d="M0 0H56M28 0V80"/><path transform="translate(484 0)" d="M0.3 35.1A40 40 0 0 1 79.7 35.1M79.7 44.9A40 40 0 0 1 0.3 44.9"/><path transform="translate(604 0)" d="M0 0L19 80L42 14L65 80L84 0"/><path transform="translate(728 0)" d="M0 0V34M0 46V80"/><path transform="translate(768 0)" d="M72.6 65.7A40 40 0 1 1 72.6 14.3"/><path transform="translate(878 0)" d="M0 0H54L0 80H54"/><path transform="translate(972 0)" d="M0 80L32 0L64 80M22 54H48"/><path transform="translate(1146 0)" d="M0 0H38M48 0L20 80"/><path transform="translate(1236 0)" d="M50 0H6L3 34C12 29 20 27 26 27a26 26 0 1 1-24 36"/></g>' };
  (function () { var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.style.position = 'absolute';
    defs.innerHTML = '<symbol id="n75-word" viewBox="' + WORD.vb + '">' + WORD.svg + '</symbol>' +
      '<linearGradient id="k5-brz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3517"/><stop offset=".3" stop-color="#b47c45"/><stop offset=".48" stop-color="#f2c993"/><stop offset=".64" stop-color="#a5662d"/><stop offset="1" stop-color="#4a2a12"/></linearGradient>'; (document.body || document.documentElement).appendChild(defs); })();
  var sym = document.getElementById('n75-logo'), L0 = sym ? { vb: sym.getAttribute('viewBox'), svg: sym.innerHTML } : null;
  function setLogo(L) {
    if (!sym || !L) return;
    sym.innerHTML = L.svg; sym.setAttribute('viewBox', L.vb);
    var p = L.vb.split(' '); var own = L === L0 ? L.vb : '0 0 ' + p[2] + ' ' + p[3];
    document.querySelectorAll('svg.logo-svg').forEach(function (s) { if (s.querySelector('use')) s.setAttribute('viewBox', own); });
  }

  /* ---------- dekoracje ---------- */
  function deco() {
    document.querySelectorAll('.k-geo, .k-strip, .k-bars').forEach(function (e) { e.remove(); });
    var put = function (sel, html, first) { var t = document.querySelector(sel); if (!t) return; var d = document.createElement('div'); d.innerHTML = html; while (d.firstChild) { if (first) t.insertBefore(d.lastChild, t.firstChild); else t.appendChild(d.firstChild); } };
    if (st.kierunek === 'k1' || st.kierunek === 'k3' || st.kierunek === 'k3b' || st.kierunek === 'k4' || st.kierunek === 'k5') {
      put('.hero', '<i class="k-geo k-h1" aria-hidden="true"></i><i class="k-geo k-h2" aria-hidden="true"></i><i class="k-geo k-h3" aria-hidden="true"></i>');
      put('#inwestycja', '<i class="k-geo k-m1" aria-hidden="true"></i><i class="k-geo k-m2" aria-hidden="true"></i>', true);
    }
    if (st.kierunek === 'k2') {
      put('.hero', '<i class="k-bars" aria-hidden="true"></i><i class="k-strip" aria-hidden="true"></i>');
      ['#inwestycja', '#udogodnienia', '#mieszkania', '#kontakt'].forEach(function (s) { put(s, '<i class="k-strip" aria-hidden="true"></i>', true); });
    }
  }

  /* ---------- pełne przebarwienie obecnej strony na wybrany akcent ---------- */
  var PAL = {
    zielen: { '#9c7149': '#4f7262', '#c4a27f': '#93b0a0', '#b88c62': '#5f8673', '#b0946c': '#7c9a8a', '#7b4f2e': '#2f4a3e', '#d99a5b': '#7fa48f',
      '156, 113, 73': '79, 114, 98', '196, 162, 127': '147, 176, 160',
      '#f7f3ec': '#f4f4ee', '#efe9df': '#e9ede4', '#d9cfc1': '#cdd5c9', '#d8cfc2': '#ccd4c8', '#726a60': '#5f6a62', '#8c8478': '#7a857c',
      '#221d18': '#16221c', '#2d2721': '#1e2d26', '#342a21': '#21332b', '#f4ede2': '#eef1e9', '#e6d6c2': '#d6e0d6', '#efe6d8': '#e5ece4' },
    rosso: { '#9c7149': '#9a3b32', '#c4a27f': '#cf948b', '#b88c62': '#a8493f', '#b0946c': '#b56c63', '#7b4f2e': '#6e2420', '#d99a5b': '#c7675b',
      '156, 113, 73': '154, 59, 50', '196, 162, 127': '207, 148, 139',
      '#f7f3ec': '#f8f2ee', '#efe9df': '#f1e5df', '#d9cfc1': '#e0cbc4', '#d8cfc2': '#dfcac3', '#726a60': '#76625e', '#8c8478': '#907c77',
      '#221d18': '#26120f', '#2d2721': '#341915', '#342a21': '#3d1e19', '#f4ede2': '#f5e9e4', '#e6d6c2': '#e9d0c9', '#efe6d8': '#f0e1db' },
    blekit: { '#9c7149': '#4f7a8a', '#c4a27f': '#9fb6be', '#b88c62': '#5f8a9a', '#b0946c': '#7f9ea8', '#7b4f2e': '#34525c', '#d99a5b': '#7fa6b4',
      '156, 113, 73': '79, 122, 138', '196, 162, 127': '159, 182, 190',
      '#f7f3ec': '#f3f5f4', '#efe9df': '#e7ecec', '#d9cfc1': '#ccd6d7', '#d8cfc2': '#cbd5d6', '#726a60': '#5e6a6e', '#8c8478': '#7b878b',
      '#221d18': '#131b1f', '#2d2721': '#1c272c', '#342a21': '#22313a', '#f4ede2': '#edf1f1', '#e6d6c2': '#d4dfe2', '#efe6d8': '#e4ebec' }
  };
  /* arkusze akcentów są wpięte w <head> jako <link media="not all"> – tu tylko je włączamy */
  function recolor(name) {
    Object.keys(PAL).forEach(function (k) { var l = document.getElementById('pg-ak-' + k); if (l) l.media = (k === name) ? 'all' : 'not all'; });
  }



  function apply() {
    var k4 = st.kierunek === 'k4', k5 = st.kierunek === 'k5';
    var k3 = st.kierunek === 'k3' || st.kierunek === 'k3b' || k4 || k5;
    var kd = k3 ? 'k1' : st.kierunek;
    if (st.kierunek === 'k3b' || k4 || k5) H.setAttribute('data-k3b', ''); else H.removeAttribute('data-k3b');
    if (k4) H.setAttribute('data-k4', ''); else H.removeAttribute('data-k4');
    if (k5) H.setAttribute('data-k5', ''); else H.removeAttribute('data-k5');
    document.querySelectorAll('.k4-plate, .k5-plate').forEach(function (e) { e.remove(); });
    var fb = document.querySelector('.footer__bottom');
    if (k4 && fb) fb.insertAdjacentHTML('afterbegin', '<p class="k4-plate" aria-hidden="true">N75 · ul. Narutowicza 75 · Łódź</p>');
    if (k5 && fb) fb.insertAdjacentHTML('afterbegin', '<p class="k5-plate" aria-hidden="true">Narutowicza <b>75</b></p>');
    var hr = document.querySelector('.hero__rule');
    if (k5 && hr) hr.insertAdjacentHTML('beforebegin', '<p class="k5-plate k5-plate--hero" aria-hidden="true">ul. Narutowicza 75 · Łódź</p>');
    if (kd) H.setAttribute('data-kierunek', kd); else H.removeAttribute('data-kierunek');
    if (k3) H.setAttribute('data-paleta', 'obecna'); else H.removeAttribute('data-paleta');
    if (st.akcent && !st.kierunek) H.setAttribute('data-akcent', st.akcent); else H.removeAttribute('data-akcent');
    var styl = '';
    var kam = styl === 'kamien';
    setLogo(k5 ? L5 : k4 ? L4 : (st.kierunek === 'k1' || k3) ? L1 : st.kierunek === 'k2' ? L2 : styl === 'mosiadz' ? LM : styl === 'szyld' ? LS : kam ? LK : L0);
    var narrow = matchMedia('(max-width: 700px)').matches;
    document.querySelectorAll('.header .logo use, .drawer .logo use, .footer .logo use').forEach(function (u) {
      var svg = u.ownerSVGElement, small = narrow && !u.closest('.footer'), w = kam && !small;
      u.setAttribute('href', w ? '#n75-word' : '#n75-logo');
      if (w) svg.setAttribute('viewBox', '0 0 ' + WORD.vb.split(' ')[2] + ' 88');
    });
    var hw = document.querySelector('.k-word'); if (hw) hw.remove();
    if (kam) { var h1 = document.querySelector('.hero__logo'); if (h1) { var d = document.createElement('div'); d.className = 'k-word'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<svg viewBox="0 0 ' + WORD.vb.split(' ')[2] + ' 88"><use href="#n75-word"/></svg>'; h1.after(d); } }
    if (styl) H.setAttribute('data-styl', styl); else H.removeAttribute('data-styl');
    recolor(st.kierunek ? '' : st.akcent);
    if (document.body) deco();
    try { FIX || localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    if (panel) {
      panel.querySelectorAll('button[data-k]').forEach(function (b) { b.setAttribute('aria-pressed', String((st[b.dataset.k] || '') === b.dataset.v)); });
      var d = DIR.filter(function (x) { return x[0] === (st.kierunek || ''); })[0]; panel.querySelector('.pg-desc').textContent = d[2];
      panel.querySelectorAll('.pg-acc').forEach(function (e) { e.hidden = !!st.kierunek; });
    }
  }
  var panel = null;
  function build() {
    panel = document.createElement('aside'); panel.className = 'pg-panel'; panel.setAttribute('aria-label', 'Podgląd koncepcji');
    panel.innerHTML = '<div class="pg-panel__h"><span>Podgląd koncepcji</span><span>zwiń / rozwiń</span></div><div class="pg-panel__b">' +
      '<label>Kierunek graficzny i logo<span class="pg-opts">' + DIR.map(function (o) { return '<button type="button" data-k="kierunek" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</span></label>' +
      '<p class="pg-desc"></p>' +
      
      '<label class="pg-acc">Kolor zamiast mosiądzu (obecny kierunek)<span class="pg-opts">' + ACC.map(function (o) { return '<button type="button" data-k="akcent" data-v="' + o[0] + '"><span class="pg-sw" style="background:' + o[2] + '"></span>' + o[1] + '</button>'; }).join('') + '</span></label>' +
      '<p class="pg-note">Wersja robocza do porównania – widoczna tylko pod tym adresem. Kroje zastępcze zamiast płatnych z prezentacji.</p></div>';
    document.body.appendChild(panel);
    panel.querySelector('.pg-panel__h').onclick = function () { panel.classList.toggle('is-min'); };
    panel.addEventListener('click', function (e) { var b = e.target.closest('button[data-k]'); if (!b) return; st[b.dataset.k] = b.dataset.v; apply(); });
    apply();
  }
  apply();
  if (!FIX) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build(); }
})();
