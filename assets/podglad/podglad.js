/* PODGLĄD KONCEPCJI N75 – trzy kierunki graficzne, każdy z własnym logo (tylko gałąź podglądu) */
(function () {
  'use strict';
  var KEY = 'n75-podglad2', H = document.documentElement;
  var DIR = [
    ['', 'Obecny', 'Kremowy papier, mosiądz, cienki geometryczny krój. Obecne logo liniowe.'],
    ['k1', 'Koncepcja 01', 'Geometria i konstrukcja: koła, półkola i łuki, polska awangarda. Bordo, glina, róż, fiolet. Logo z figur geometrycznych.'],
    ['k2', 'Koncepcja 02', 'Rytm i modularność: prostokąty, pionowe podziały, szachownica i efekt luksferów. Zieleń, brąz, błękit. Logo modułowe z pionowych pasów.']
  ];
  var ACC = [['', 'Mosiądz', '#9c7149'], ['zielen', 'Zieleń', '#2F4A3E'], ['rosso', 'Rosso', '#7E2E2A'], ['blekit', 'Błękit', '#4f6f7a']];
  var st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var q = new URLSearchParams(location.search); ['akcent', 'kierunek'].forEach(function (k) { if (q.has(k)) st[k] = q.get(k); });

  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=Outfit:wght@300;400;500;600&family=Archivo:wdth,wght@100..125,300..700&family=Instrument+Sans:wght@400;500&family=Major+Mono+Display&display=swap';
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
    if (st.kierunek === 'k1') {
      put('.hero', '<i class="k-geo k-h1" aria-hidden="true"></i><i class="k-geo k-h2" aria-hidden="true"></i><i class="k-geo k-h3" aria-hidden="true"></i>');
      put('#inwestycja', '<i class="k-geo k-m1" aria-hidden="true"></i><i class="k-geo k-m2" aria-hidden="true"></i>', true);
    }
    if (st.kierunek === 'k2') {
      put('.hero', '<i class="k-bars" aria-hidden="true"></i><i class="k-strip" aria-hidden="true"></i>');
      ['#inwestycja', '#udogodnienia', '#mieszkania', '#kontakt'].forEach(function (s) { put(s, '<i class="k-strip" aria-hidden="true"></i>', true); });
    }
  }

  function apply() {
    if (st.kierunek) H.setAttribute('data-kierunek', st.kierunek); else H.removeAttribute('data-kierunek');
    if (st.akcent && !st.kierunek) H.setAttribute('data-akcent', st.akcent); else H.removeAttribute('data-akcent');
    setLogo(st.kierunek === 'k1' ? L1 : st.kierunek === 'k2' ? L2 : L0);
    if (document.body) deco();
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    if (panel) {
      panel.querySelectorAll('button[data-k]').forEach(function (b) { b.setAttribute('aria-pressed', String((st[b.dataset.k] || '') === b.dataset.v)); });
      var d = DIR.filter(function (x) { return x[0] === (st.kierunek || ''); })[0]; panel.querySelector('.pg-desc').textContent = d[2];
      panel.querySelector('.pg-acc').hidden = !!st.kierunek;
    }
  }
  var panel = null;
  function build() {
    panel = document.createElement('aside'); panel.className = 'pg-panel'; panel.setAttribute('aria-label', 'Podgląd koncepcji');
    panel.innerHTML = '<div class="pg-panel__h"><span>Podgląd koncepcji</span><span>zwiń / rozwiń</span></div><div class="pg-panel__b">' +
      '<label>Kierunek graficzny i logo<span class="pg-opts">' + DIR.map(function (o) { return '<button type="button" data-k="kierunek" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</span></label>' +
      '<p class="pg-desc"></p>' +
      '<label class="pg-acc">Akcent kolorystyczny (obecny kierunek)<span class="pg-opts">' + ACC.map(function (o) { return '<button type="button" data-k="akcent" data-v="' + o[0] + '"><span class="pg-sw" style="background:' + o[2] + '"></span>' + o[1] + '</button>'; }).join('') + '</span></label>' +
      '<p class="pg-note">Wersja robocza do porównania – nie jest na stronie n75.vercel.app. Kroje zastępcze zamiast płatnych z prezentacji.</p></div>';
    document.body.appendChild(panel);
    panel.querySelector('.pg-panel__h').onclick = function () { panel.classList.toggle('is-min'); };
    panel.addEventListener('click', function (e) { var b = e.target.closest('button[data-k]'); if (!b) return; st[b.dataset.k] = b.dataset.v; apply(); });
    apply();
  }
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
