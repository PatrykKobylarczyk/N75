/* PODGLĄD KONCEPCJI N75 – trzy kierunki graficzne, każdy z własnym logo (tylko gałąź podglądu) */
(function () {
  'use strict';
  var KEY = 'n75-podglad2', H = document.documentElement;
  var DIR = [
    ['', 'Obecny', 'Kremowy papier, mosiądz, cienki geometryczny krój. Obecne logo liniowe.'],
    ['k1', 'Koncepcja 01', 'Geometria i konstrukcja: koła, półkola i łuki, polska awangarda. Bordo, glina, róż, fiolet. Logo z figur geometrycznych.'],
    ['k2', 'Koncepcja 02', 'Rytm i modularność: prostokąty, pionowe podziały, szachownica i efekt luksferów. Zieleń, brąz, błękit. Logo modułowe z pionowych pasów.'],
    ['k3', 'Koncepcja 03', 'Kolory obecnej strony (kremowy papier, mosiądz, ciepła czerń) z krojami, kształtami i logo Koncepcji 01: koła, półkola, łuki, zaokrąglone przyciski, logo geometryczne.'],
    ['k3b', 'Koncepcja 03b', 'Koncepcja 03 delikatnie poprawiona (hero jak w 03): lżejsze nagłówki, wszystkie łuki do góry, numery w mosiądzu, 5 powodów bez numerów i linków, cieńsze przyciski.']
  ];
  var STY = [['', 'Obecna'], ['kamien', 'Lata 30 · kamień'], ['mosiadz', 'Lata 30 · mosiężne litery'], ['szyld', 'Lata 30 · szyld']];
  var ACC = [['', 'Mosiądz', '#9c7149'], ['zielen', 'Zieleń', '#4f7262'], ['rosso', 'Rosso', '#9a3b32'], ['blekit', 'Błękit', '#4f7a8a']];
  var st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var q = new URLSearchParams(location.search); ['akcent', 'kierunek', 'styl'].forEach(function (k) { if (q.has(k)) st[k] = q.get(k); });

  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=Outfit:wght@300;400;500;600&family=Archivo:wdth,wght@100..125,300..700&family=Instrument+Sans:wght@400;500&family=Major+Mono+Display&family=Josefin+Sans:ital,wght@0,200..600;1,200..500&family=Poiret+One&family=Sacramento&display=swap';
  document.head.appendChild(fl);

  /* ---------- logo ---------- */
  // Koncepcja 01: logo z figur geometrycznych (wg przesłanego wzoru)
  var L1 = { vb: '0 0 773 312', svg:
    '<g transform="translate(-637 -185)">' +
    '<path d="M637 497V185h18a115 115 0 0 1 115 115v197z"/>' +
    '<path d="M787 297V185h18a125 115 0 0 1 125 115v197h-12z"/>' +
    '<path d="M939 185h236v91H939z"/>' +
    '<path d="M995 497c18-105 85-200 177-210-30 64-72 140-80 210z"/>' +
    '<path d="M1198 185h100v100a100 100 0 0 1-100 100z"/>' +
    '<path d="M1308 185h102v93a102 93 0 0 1-102-93z"/>' +
    '<circle cx="1248" cy="445" r="50"/>' +
    '<path d="M1308 287a105 105 0 0 1 0 210z"/></g>' };
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
    defs.innerHTML = '<symbol id="n75-word" viewBox="' + WORD.vb + '">' + WORD.svg + '</symbol>'; (document.body || document.documentElement).appendChild(defs); })();
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
    if (st.kierunek === 'k1' || st.kierunek === 'k3' || st.kierunek === 'k3b') {
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
  var cssText = null, recol = null;
  function recolor(name) {
    if (!recol) { recol = document.createElement('style'); recol.id = 'pg-recolor'; document.head.appendChild(recol); }
    if (!name || !PAL[name]) { recol.textContent = ''; return; }
    var link = document.querySelector('link[href*="assets/css/style.css"]');
    var go = function (t) {
      var m = PAL[name];
      Object.keys(m).forEach(function (k) {
        var re = k.charAt(0) === '#' ? new RegExp(k, 'gi') : new RegExp('rgba\\(\\s*' + k.replace(/, /g, ',\\s*'), 'g');
        t = t.replace(re, k.charAt(0) === '#' ? m[k] : 'rgba(' + m[k]);
        if (k.charAt(0) === '#') t = t.replace(new RegExp('%23' + k.slice(1), 'gi'), '%23' + m[k].slice(1));
      });
      t = t.replace(/url\((['"]?)\.\.\//g, 'url($1assets/');
      recol.textContent = t;
    };
    if (cssText) go(cssText); else if (link) fetch(link.href).then(function (r) { return r.text(); }).then(function (t) { cssText = t; if ((st.akcent || '') === name && !st.kierunek) go(t); });
  }

  function apply() {
    var k4 = false;
    var k3 = st.kierunek === 'k3' || st.kierunek === 'k3b';
    var kd = k3 ? 'k1' : k4 ? '' : st.kierunek;
    if (st.kierunek === 'k3b') H.setAttribute('data-k3b', ''); else H.removeAttribute('data-k3b');
    if (k4) H.setAttribute('data-k4', ''); else H.removeAttribute('data-k4');
    if (kd) H.setAttribute('data-kierunek', kd); else H.removeAttribute('data-kierunek');
    if (k3) H.setAttribute('data-paleta', 'obecna'); else H.removeAttribute('data-paleta');
    if (st.akcent && !st.kierunek) H.setAttribute('data-akcent', st.akcent); else H.removeAttribute('data-akcent');
    var styl = k4 ? 'kamien' : (!st.kierunek ? st.styl : '');
    var kam = styl === 'kamien';
    setLogo((st.kierunek === 'k1' || k3) ? L1 : st.kierunek === 'k2' ? L2 : styl === 'mosiadz' ? LM : styl === 'szyld' ? LS : kam ? LK : L0);
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
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
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
      '<label class="pg-acc pg-sty">Typografia i logo (obecny kierunek)<span class="pg-opts">' + STY.map(function (o) { return '<button type="button" data-k="styl" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</span></label>' +
      '<label class="pg-acc">Kolor zamiast mosiądzu (obecny kierunek)<span class="pg-opts">' + ACC.map(function (o) { return '<button type="button" data-k="akcent" data-v="' + o[0] + '"><span class="pg-sw" style="background:' + o[2] + '"></span>' + o[1] + '</button>'; }).join('') + '</span></label>' +
      '<p class="pg-note">Wersja robocza do porównania – nie jest na stronie n75.vercel.app. Kroje zastępcze zamiast płatnych z prezentacji.</p></div>';
    document.body.appendChild(panel);
    panel.querySelector('.pg-panel__h').onclick = function () { panel.classList.toggle('is-min'); };
    panel.addEventListener('click', function (e) { var b = e.target.closest('button[data-k]'); if (!b) return; st[b.dataset.k] = b.dataset.v; apply(); });
    apply();
  }
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
