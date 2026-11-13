/* PODGLĄD KONCEPCJI N75 – przełącznik akcentu, logo i kierunku graficznego (tylko gałąź podglądu) */
(function () {
  'use strict';
  var KEY = 'n75-podglad', H = document.documentElement;
  var OPT = {
    akcent: [['', 'Obecny (mosiądz)', '#9c7149'], ['zielen', 'Zieleń butelkowa', '#2F4A3E'], ['rosso', 'Rosso', '#7E2E2A'], ['blekit', 'Błękit', '#9FB6BE']],
    logo: [['', 'Obecne'], ['geo', 'Geometryczne']],
    kierunek: [['', 'Obecny'], ['k1', 'Koncepcja 01'], ['k2', 'Koncepcja 02']]
  };
  var st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var q = new URLSearchParams(location.search); ['akcent', 'logo', 'kierunek'].forEach(function (k) { if (q.has(k)) st[k] = q.get(k); });
  // fonty koncepcji
  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Archivo:wdth,wght@100..125,300..600&family=Instrument+Sans:wght@400;500&display=swap';
  document.head.appendChild(fl);

  // logo geometryczne (kształt wg przesłanego wzoru)
  var GEO_VB = '637 185 773 312';
  var GEO = '<path d="M637 497V185h18a115 115 0 0 1 115 115v197z"/>' +
    '<path d="M787 297V185h18a125 115 0 0 1 125 115v197h-12z"/>' +
    '<path d="M939 185h236v91H939z"/>' +
    '<path d="M995 497c18-105 85-200 177-210-30 64-72 140-80 210z"/>' +
    '<path d="M1198 185h100v100a100 100 0 0 1-100 100z"/>' +
    '<path d="M1308 185h102v93a102 93 0 0 1-102-93z"/>' +
    '<circle cx="1248" cy="445" r="50"/>' +
    '<path d="M1308 287a105 105 0 0 1 0 210z"/>';
  var sym = document.getElementById('n75-logo'), OLD = sym ? sym.innerHTML : '', OLD_VB = sym ? sym.getAttribute('viewBox') : '';

  function apply() {
    ['akcent', 'logo', 'kierunek'].forEach(function (k) { if (st[k]) H.setAttribute('data-' + k, st[k]); else H.removeAttribute('data-' + k); });
    if (sym) {
      var geo = st.logo === 'geo';
      sym.innerHTML = geo ? GEO : OLD; sym.setAttribute('viewBox', geo ? GEO_VB : OLD_VB);
      document.querySelectorAll('svg.logo-svg').forEach(function (s) { if (s.querySelector('use')) s.setAttribute('viewBox', geo ? '0 0 773 312' : OLD_VB); });
    }
    document.querySelectorAll('.k-geo').forEach(function (e) { e.remove(); });
    if (st.kierunek === 'k1') {
      var add = function (sel, cls) { var t = document.querySelector(sel); if (!t) return; cls.forEach(function (c) { var d = document.createElement('i'); d.className = 'k-geo k-geo--' + c; d.setAttribute('aria-hidden', 'true'); t.insertBefore(d, t.firstChild); }); };
      add('#inwestycja', ['a', 'b']); add('#kontakt', ['c']); add('#lokalizacja', ['d']); add('#mieszkania', ['a']);
    }
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    if (panel) panel.querySelectorAll('button[data-k]').forEach(function (b) { b.setAttribute('aria-pressed', String((st[b.dataset.k] || '') === b.dataset.v)); });
  }
  var panel = null;
  function build() {
    panel = document.createElement('aside'); panel.className = 'pg-panel'; panel.setAttribute('aria-label', 'Podgląd koncepcji');
    var h = '<div class="pg-panel__h"><span>Podgląd koncepcji</span><span>–</span></div><div class="pg-panel__b">';
    [['akcent', 'Kolor akcentu'], ['logo', 'Logo'], ['kierunek', 'Kierunek graficzny']].forEach(function (g) {
      h += '<label>' + g[1] + '<span class="pg-opts">' + OPT[g[0]].map(function (o) { return '<button type="button" data-k="' + g[0] + '" data-v="' + o[0] + '">' + (o[2] ? '<span class="pg-sw" style="background:' + o[2] + '"></span>' : '') + o[1] + '</button>'; }).join('') + '</span></label>';
    });
    h += '<p class="pg-note">Wersja robocza do porównania – nie jest na stronie n75.vercel.app.</p></div>';
    panel.innerHTML = h; document.body.appendChild(panel);
    panel.querySelector('.pg-panel__h').onclick = function () { panel.classList.toggle('is-min'); };
    panel.addEventListener('click', function (e) { var b = e.target.closest('button[data-k]'); if (!b) return; st[b.dataset.k] = b.dataset.v; apply(); });
    apply();
  }
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
