/* Karta mieszkania: mieszkanie.html?id=M1.01. Dane z assets/js/units.js. */
(function () {
  'use strict';
  var root = document.getElementById('unit-root');
  var units = window.N75_UNITS || [];
  var id = new URLSearchParams(location.search).get('id');
  var u = units.filter(function (x) { return x.id === id; })[0];
  var fmt = new Intl.NumberFormat('pl-PL');
  var fmtA = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var STATUS = { wolne: 'Wolne', rezerwacja: 'Rezerwacja', sprzedane: 'Sprzedane' };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var card = function (x) { return 'mieszkanie.html?id=' + encodeURIComponent(x.id); };

  if (!u) {
    root.innerHTML = '<section class="u-hero"><div class="wrap"><nav class="crumbs caps" aria-label="Ścieżka"><a href="index.html">N75</a><span>/</span><a href="index.html#mieszkania">Apartamenty</a></nav>' +
      '<h1 class="display u-title">Nie znaleziono lokalu</h1><p class="lead">Lokal ' + esc(id || '') + ' nie istnieje w&nbsp;ofercie N75.</p>' +
      '<a class="btn btn--solid caps" href="index.html#mieszkania">Zobacz apartamenty <span class="arrow"></span></a></div></section>';
    return;
  }

  document.title = 'Apartament ' + u.id + ' · N75 · Narutowicza 75A, Łódź';
  var sold = u.status === 'sprzedane';
  var two = u.levels.length > 1;
  var floorTxt = two ? u.levels.join(' i ') + ' (dwupoziomowy)' : String(u.floor);
  var ppm = Math.round(u.price / u.area);
  var pokoje = u.rooms === 1 ? 'pokój' : (u.rooms < 5 ? 'pokoje' : 'pokoi');

  // pomieszczenia: w dwupoziomowych numeracja z rzutu obu kondygnacji
  var rooms = u.roomsList.map(function (r) {
    return '<tr><td>' + r[0] + '. ' + esc(r[1]) + '</td><td>' + fmtA.format(r[2]) + ' m²</td></tr>';
  }).join('');

  var hist = u.history.slice().reverse().map(function (h, i, arr) {
    var d = h[0].split('-'), prev = arr[i + 1];
    var ch = prev ? ((h[1] - prev[1]) / prev[1] * 100) : null;
    return '<tr><td>' + d[2] + '.' + d[1] + '.' + d[0] + '</td><td>' + fmt.format(Math.round(h[1] / u.area)) + ' zł</td><td>' + fmt.format(h[1]) + ' zł' +
      (ch !== null ? ' <small class="muted">(' + (ch > 0 ? '+' : '') + ch.toFixed(1).replace('.', ',') + '%)</small>' : '') + '</td></tr>';
  }).join('');

  var viz;
  if (u.id === 'M2.03') viz = ['assets/img/salon-m2-03.webp', 'Salon apartamentu M2.03', 'Wizualizacja apartamentu M2.03'];
  else if (u.id === 'M2.04') viz = ['assets/img/loggia-m2-04.webp', 'Loggia apartamentu M2.04', 'Wizualizacja apartamentu M2.04'];
  else viz = ['assets/img/salon-m2-03.webp', 'Przykładowe wnętrze apartamentu w N75', 'Wizualizacja poglądowa, wnętrze apartamentu M2.03'];

  var same = units.filter(function (x) { return x.floor === u.floor; });
  var i = same.indexOf(u), prev = same[i - 1], next = same[i + 1];

  var tabs = two ? '<div class="u-tabs" role="group" aria-label="Kondygnacja">' + u.levels.map(function (l, k) {
    return '<button type="button" data-level="' + l + '" aria-pressed="' + (k === 0) + '">Piętro ' + l + '</button>';
  }).join('') + '</div>' : '';

  root.innerHTML =
    '<section class="u-hero"><div class="wrap">' +
      '<nav class="crumbs caps" aria-label="Ścieżka"><a href="index.html">N75</a><span>/</span><a href="index.html#mieszkania">Apartamenty</a><span>/</span><a href="index.html#makieta">Piętro ' + u.floor + '</a><span>/</span><span aria-current="page">' + u.id + '</span></nav>' +
      '<div class="u-grid">' +
        '<div>' +
          '<div class="caps bronze">Piętro ' + floorTxt + ' · <span class="status status--' + u.status + '">' + STATUS[u.status] + '</span></div>' +
          '<h1 class="display u-title">' + u.id + '</h1>' +
          '<p class="lead">' + u.rooms + ' ' + pokoje + ' · ' + fmtA.format(u.area) + ' m²' + (two ? ' · dwa poziomy' : '') + '</p>' +
          '<dl class="u-spec">' +
            '<div><dt>Powierzchnia</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div>' +
            '<div><dt>Pokoje</dt><dd>' + u.rooms + '</dd></div>' +
            '<div><dt>Piętro</dt><dd>' + u.levels.join('–') + '</dd></div>' +
            '<div><dt>Status</dt><dd><span class="status status--' + u.status + '">' + STATUS[u.status] + '</span></dd></div>' +
            '<div><dt>Cena</dt><dd>' + (sold ? '—' : fmt.format(u.price) + ' zł') + '</dd></div>' +
            '<div><dt>Cena za m²</dt><dd>' + (sold ? '—' : fmt.format(ppm) + ' zł') + '</dd></div>' +
          '</dl>' +
          '<div class="u-cta">' +
            (sold ? '<a class="btn btn--solid caps" href="index.html#makieta">Zobacz inne lokale <span class="arrow"></span></a>'
                  : '<a class="btn btn--solid caps" href="index.html?lokal=' + encodeURIComponent(u.id) + '#kontakt">Zapytaj o ten lokal <span class="arrow"></span></a>') +
            '<button type="button" class="btn btn--line caps" id="u-print">Drukuj kartę</button>' +
          '</div>' +
        '</div>' +
        '<div>' + tabs +
          '<div class="mk__plan" id="u-plan"></div>' +
          '<div class="u-plan-foot"><p class="u-plan-cap">Rzut lokalu ' + u.id + '. Na widoku całego piętra kliknij inny lokal, aby otworzyć jego kartę.</p>' +
          '<button type="button" class="u-whole caps" id="u-whole" aria-pressed="false">Pokaż całe piętro</button></div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="u-section"><div class="wrap u-two">' +
      '<div><div class="sec-head"><span class="num">01</span><span class="line"></span><span class="caps">Pomieszczenia</span></div>' +
        '<table class="u-table"><thead><tr><th>Pomieszczenie</th><th>Powierzchnia</th></tr></thead><tbody>' + rooms + '</tbody>' +
        '<tfoot><tr><td>Razem</td><td>' + fmtA.format(u.area) + ' m²</td></tr></tfoot></table></div>' +
      '<div><div class="sec-head"><span class="num">02</span><span class="line"></span><span class="caps">Historia ceny</span></div>' +
        (sold ? '<p class="muted">Lokal sprzedany.</p>' :
        '<table class="u-table"><thead><tr><th>Data zmiany</th><th>Cena za m²</th><th>Cena</th></tr></thead><tbody>' + hist + '</tbody></table>') +
        '<p class="u-note">Ceny brutto. Ceny i&nbsp;statusy lokali mają charakter informacyjny i&nbsp;nie stanowią oferty w&nbsp;rozumieniu Kodeksu cywilnego. Powierzchnie i&nbsp;ceny według cennika z&nbsp;25.08.2026; powierzchnie pomieszczeń według projektu budowlanego.</p></div>' +
    '</div></section>' +

    '<section class="u-section"><div class="wrap">' +
      '<figure class="u-viz"><img src="' + viz[0] + '" alt="' + viz[1] + '" loading="lazy" data-lightbox="' + viz[2] + '"><figcaption>' + viz[2] + '</figcaption></figure>' +
    '</div></section>' +

    '<section class="u-section"><div class="wrap u-pager">' +
      (prev ? '<a href="' + card(prev) + '"><span class="caps muted">← Poprzedni</span><strong>' + prev.id + '</strong><span class="muted">' + fmtA.format(prev.area) + ' m²</span></a>' : '<span></span>') +
      (next ? '<a href="' + card(next) + '"><span class="caps muted">Następny →</span><strong>' + next.id + '</strong><span class="muted">' + fmtA.format(next.area) + ' m²</span></a>' : '') +
    '</div></section>';

  var plan = document.getElementById('u-plan');
  var planApi = null, wholeFloor = false;
  function showLevel(l) {
    plan.innerHTML = '';
    var others = units.filter(function (x) { return x.levels.indexOf(l) >= 0; });
    planApi = window.N75Plan.create(plan, { floor: l, units: others, href: card, current: u.id });
    if (!wholeFloor) planApi.zoomTo(u.id, 0);
    plan.dataset.level = l;
    Array.prototype.forEach.call(document.querySelectorAll('.u-tabs button[data-level]'), function (b) { b.setAttribute('aria-pressed', String(+b.dataset.level === l)); });
  }
  showLevel(u.levels[0]);
  Array.prototype.forEach.call(document.querySelectorAll('.u-tabs button[data-level]'), function (b) {
    b.addEventListener('click', function () { showLevel(+b.dataset.level); });
  });
  var tog = document.getElementById('u-whole');
  tog.addEventListener('click', function () {
    wholeFloor = !wholeFloor;
    tog.setAttribute('aria-pressed', String(wholeFloor));
    tog.textContent = wholeFloor ? 'Pokaż tylko lokal' : 'Pokaż całe piętro';
    if (wholeFloor) planApi.zoomOut(); else planApi.zoomTo(u.id);
  });
  document.getElementById('u-print').addEventListener('click', function () { window.print(); });
})();
