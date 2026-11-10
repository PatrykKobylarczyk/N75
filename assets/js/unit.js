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
  // widok z okien: kierunek okien z modelu 3D (północ – park, wnętrze kwartału – patio, południe – planowany skwer)
  var VIEWS = {"M1.01": ["park im. Staszica"], "M1.02": ["park im. Staszica"], "M1.03": ["park im. Staszica", "zabudowa miejska od zachodu"], "M1.04": ["zabudowa miejska od zachodu"], "M1.05": ["zabudowa miejska od zachodu"], "M1.06": ["planowany skwer", "zabudowa miejska od zachodu"], "M1.07": ["planowany skwer"], "M1.08": ["planowany skwer"], "M2.01": ["park im. Staszica", "zielone patio"], "M2.02": ["park im. Staszica"], "M2.03": ["park im. Staszica", "zabudowa miejska od zachodu"], "M2.04": ["zabudowa miejska od zachodu"], "M2.05": ["zabudowa miejska od zachodu"], "M2.06": ["planowany skwer", "zabudowa miejska od zachodu"], "M2.07": ["planowany skwer"], "M2.08": ["planowany skwer", "zabudowa miejska od wschodu"], "M2.09": ["zielone patio"], "M2.10": ["zielone patio"], "M2.11": ["zielone patio"], "M3.01": ["park im. Staszica", "zielone patio"], "M3.02": ["park im. Staszica"], "M3.03": ["park im. Staszica", "zabudowa miejska od zachodu"], "M3.04": ["zabudowa miejska od zachodu"], "M3.05": ["zabudowa miejska od zachodu"], "M3.06": ["planowany skwer", "zabudowa miejska od zachodu"], "M3.07": ["planowany skwer"], "M3.08": ["zielone patio", "planowany skwer"], "M3.09": ["zielone patio"], "M3.10": ["zielone patio"], "M4.01": ["park im. Staszica", "zielone patio"], "M4.02": ["park im. Staszica"], "M4.03": ["park im. Staszica", "zabudowa miejska od zachodu"], "M4.04": ["zabudowa miejska od zachodu"], "M4.05": ["zabudowa miejska od zachodu"], "M4.06": ["planowany skwer", "zabudowa miejska od zachodu"], "M4.07": ["planowany skwer"], "M4.08": ["zielone patio", "planowany skwer"], "M4.09": ["zielone patio"], "M4.10": ["zielone patio"], "M5.01": ["park im. Staszica", "zielone patio"], "M5.02": ["park im. Staszica", "zabudowa miejska od zachodu"], "M5.03": ["zabudowa miejska od zachodu"], "M5.04": ["planowany skwer", "zabudowa miejska od zachodu"], "M5.05": ["planowany skwer", "zabudowa miejska od wschodu"], "M5.06": ["zielone patio"], "M5.07": ["zielone patio"], "M6.01": ["park im. Staszica", "zielone patio"], "M6.02": ["park im. Staszica", "zielone patio"], "M6.03": ["planowany skwer", "zielone patio"], "M6.04": ["planowany skwer", "zielone patio"]};
  var TEL = '+48799278344', TEL_TXT = '+48 799 278 344', MAIL = 'sprzedaz@n75.pl';

  if (!u) {
    root.innerHTML = '<section class="u-hero"><div class="wrap"><nav class="crumbs caps" aria-label="Ścieżka"><a href="index.html">N75</a><span>/</span><a href="index.html#mieszkania">Apartamenty</a></nav>' +
      '<h1 class="display u-title">Nie znaleziono lokalu</h1><p class="lead">Lokal ' + esc(id || '') + ' nie istnieje w&nbsp;ofercie N75.</p>' +
      '<a class="btn btn--solid caps" href="index.html#mieszkania">Zobacz apartamenty <span class="arrow"></span></a></div></section>';
    return;
  }

  document.title = 'Apartament ' + u.id + ' · N75 · Narutowicza 75A, Łódź';
  (function () {
    var d = 'Apartament ' + u.id + ' w N75, Narutowicza 75A, Łódź: ' + u.rooms + ' ' + (u.rooms === 1 ? 'pokój' : u.rooms < 5 ? 'pokoje' : 'pokoi') + ', ' + String(u.area).replace('.', ',') + ' m², piętro ' + u.floor + (u.orient ? ', ekspozycja ' + u.orient : '') + '. Rzut, cena i kontakt w sprawie lokalu.';
    var m = document.querySelector('meta[name=description]'); if (m) m.setAttribute('content', d);
    var c = document.createElement('link'); c.rel = 'canonical'; c.href = 'https://n75.vercel.app/mieszkanie.html?id=' + encodeURIComponent(u.id); document.head.appendChild(c);
    var ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Apartment', name: 'Apartament ' + u.id + ' – N75', url: c.href, numberOfRooms: u.rooms, floorLevel: String(u.floor),
      floorSize: { '@type': 'QuantitativeValue', value: u.area, unitCode: 'MTK' }, address: { '@type': 'PostalAddress', streetAddress: 'ul. Narutowicza 75A', postalCode: '90-132', addressLocality: 'Łódź', addressCountry: 'PL' },
      offers: u.status === 'sprzedane' ? undefined : { '@type': 'Offer', price: u.price, priceCurrency: 'PLN', availability: u.status === 'wolne' ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability' } });
    document.head.appendChild(ld);
  })();
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
  // wizualizacja poglądowa, wspólna dla wszystkich mieszkań
  viz = ['assets/img/salon-m2-03.webp', 'Przykładowe wnętrze apartamentu w N75', 'Wizualizacja poglądowa'];

  var same = units.filter(function (x) { return x.floor === u.floor; });
  var i = same.indexOf(u), prev = same[i - 1], next = same[i + 1];

  var tabs = two ? '<div class="u-tabs" role="group" aria-label="Kondygnacja">' + u.levels.map(function (l, k) {
    return '<button type="button" data-level="' + l + '" aria-pressed="' + (k === 0) + '">Piętro ' + l + '</button>';
  }).join('') + '</div>' : '';

  var outd = u.outdoor || [], outA = outd.reduce(function (a, o) { return a + o[1]; }, 0);
  var outTxt = outd.length ? outd.map(function (o) { return esc(o[0]) + ' ' + fmtA.format(o[1]) + '&nbsp;m²'; }).join(' + ') : 'brak';
  var views = VIEWS[u.id] || [];
  var subj = encodeURIComponent('Apartament ' + u.id + ' – N75');
  var body = encodeURIComponent('Dzień dobry,\nproszę o kontakt w sprawie apartamentu ' + u.id + ' (' + fmtA.format(u.area) + ' m², piętro ' + u.floor + ').\n');
  var spec = function (dt, dd, cls) { return '<div' + (cls ? ' class="' + cls + '"' : '') + '><dt>' + dt + '</dt><dd>' + dd + '</dd></div>'; };

  root.innerHTML =
    '<section class="u-hero"><div class="wrap">' +
      '<nav class="crumbs caps" aria-label="Ścieżka"><a href="index.html">N75</a><span>/</span><a href="index.html#mieszkania">Apartamenty</a><span>/</span><a href="index.html#makieta">Piętro ' + u.floor + '</a><span>/</span><span aria-current="page">' + u.id + '</span></nav>' +
      '<div class="u-head">' +
        '<div>' +
          '<div class="caps bronze">Apartament · piętro ' + floorTxt + '</div>' +
          '<div class="u-title-row"><h1 class="display u-title">' + u.id + '</h1>' + (window.N75Fav ? window.N75Fav.heart(u.id, 'fav--lg') : '') + '</div>' +
          '<p class="lead u-lead">' + u.rooms + ' ' + pokoje + ' · ' + fmtA.format(u.area) + ' m²' + (outA ? ' + ' + fmtA.format(outA) + ' m² ' + (outd.length > 1 ? 'na zewnątrz' : esc(outd[0][0].toLowerCase())) : '') + (two ? ' · dwa poziomy' : '') + '</p>' +
        '</div>' +
        '<div class="u-price">' + (sold ? '<span class="status status--sprzedane">Sprzedane</span>' :
          '<span class="caps muted">Cena</span><strong>' + fmt.format(u.price) + ' zł</strong><span class="muted">' + fmt.format(ppm) + ' zł/m² · <span class="status status--' + u.status + '">' + STATUS[u.status] + '</span></span>') + '</div>' +
      '</div>' +
      '<div class="u-main">' +
        '<div class="u-planbox">' + tabs +
          '<div class="mk__plan u-plan--big" id="u-plan"></div>' +
          '<div class="u-plan-foot"><p class="u-plan-cap">Rzut apartamentu ' + u.id + '. Na widoku całego piętra kliknij inny lokal, aby otworzyć jego kartę.</p>' +
          '<button type="button" class="u-whole caps" id="u-whole" aria-pressed="false">Pokaż całe piętro</button></div>' +
          '<dl class="u-spec u-spec--3">' +
            spec('Powierzchnia', fmtA.format(u.area) + ' m²') +
            spec('Cena', sold ? '—' : fmt.format(u.price) + ' zł') +
            spec('Cena za m²', sold ? '—' : fmt.format(ppm) + ' zł') +
            spec('Pokoje', u.rooms) +
            spec('Piętro', two ? u.levels.join(' i ') : u.floor) +
            spec('Status', '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>') +
            spec('Ekspozycja', esc(u.orient || '—'), 'u-spec__txt') +
            spec('Powierzchnia zewnętrzna', outTxt, 'u-spec__txt') +
            spec('Miejsce postojowe', 'opcjonalnie, w garażu podziemnym', 'u-spec__txt') +
            spec('Komórka lokatorska', 'opcjonalnie, w budynku', 'u-spec__txt') +
            spec('Widok z okien', (views.length ? esc(views.join(', ')) : '—') + ' <a class="u-link caps" href="makieta.html?okno=' + encodeURIComponent(u.id) + '">Zobacz widok z okna w 3D →</a>', 'u-spec__txt u-spec__wide') +
          '</dl>' +
          '<div class="u-cta">' +
            '<button type="button" class="btn btn--line caps mk-3d" id="u-3d"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v9m0 9v-9m9-4.5L12 12 3 7.5"/></svg><span>Wnętrze 3D</span></button>' +
            '<a class="btn btn--line caps" href="makieta.html?okno=' + encodeURIComponent(u.id) + '">Widok z okna</a>' +
            '<button type="button" class="btn btn--line caps" id="u-pdf">Pobierz kartę PDF</button>' +
          '</div>' +
        '</div>' +
        '<aside class="u-contact" id="u-contact" aria-label="Kontakt w sprawie apartamentu ' + u.id + '">' +
          '<span class="caps bronze">Prywatna prezentacja</span>' +
          '<h2 class="display u-contact__t">Porozmawiajmy o&nbsp;' + u.id + '</h2>' +
          (sold ? '<p class="muted">Ten apartament jest już sprzedany. Chętnie pokażemy podobne lokale.</p>' :
          '<p class="muted">Pokażemy ten apartament na rzutach i&nbsp;w&nbsp;biurze sprzedaży, odpowiemy na pytania o&nbsp;cenę, miejsce postojowe i&nbsp;komórkę.</p>') +
          '<div class="u-contact__direct">' +
            '<a class="btn btn--solid caps" href="tel:' + TEL + '">Zadzwoń · ' + TEL_TXT + '</a>' +
            '<a class="btn btn--line caps" href="mailto:' + MAIL + '?subject=' + subj + '&amp;body=' + body + '">Napisz e-mail</a>' +
          '</div>' +
          '<form class="u-form" id="u-form" novalidate>' +
            '<input type="hidden" name="unit" value="' + u.id + '"><input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' +
            '<label><span class="caps">Imię</span><input name="name" id="u-name" autocomplete="given-name" required></label>' +
            '<label><span class="caps">Telefon lub e-mail</span><input name="contact" id="u-contactf" autocomplete="email" required></label>' +
            '<fieldset class="u-form__opts"><legend class="caps">Interesuje mnie też <span class="opt">(opcjonalnie)</span></legend>' +
              '<label class="u-chk"><input type="checkbox" name="parking"> miejsce postojowe</label><label class="u-chk"><input type="checkbox" name="storage"> komórka lokatorska</label></fieldset>' +
            '<label><span class="caps">Wiadomość <span class="opt">(opcjonalnie)</span></span><textarea name="message" rows="2"></textarea></label>' +
            '<label class="u-chk u-consent"><input type="checkbox" id="u-consent" required><span>Zgoda na przetwarzanie danych w&nbsp;celu odpowiedzi, zgodnie z&nbsp;<a href="polityka-prywatnosci.html" target="_blank">polityką prywatności</a>.</span></label>' +
            '<button type="submit" class="btn btn--solid caps">Umów prezentację ' + u.id + '</button>' +
            '<p class="form__msg" id="u-msg" aria-live="polite"></p>' +
          '</form>' +
        '</aside>' +
      '</div>' +
    '</div></section>' +

    '<section class="u-section"><div class="wrap u-two">' +
      '<div><div class="sec-head"><span class="num">01</span><span class="line"></span><span class="caps">Pomieszczenia</span></div>' +
        '<table class="u-table"><thead><tr><th>Pomieszczenie</th><th>Powierzchnia</th></tr></thead><tbody>' + rooms + '</tbody>' +
        '<tfoot><tr><td>Razem</td><td>' + fmtA.format(u.area) + ' m²</td></tr></tfoot></table></div>' +
      '<div><div class="sec-head"><span class="num">02</span><span class="line"></span><span class="caps">Historia ceny</span></div>' +
        (sold ? '<p class="muted">Lokal sprzedany.</p>' :
        '<table class="u-table"><thead><tr><th>Data zmiany</th><th>Cena za m²</th><th>Cena</th></tr></thead><tbody>' + hist + '</tbody></table>') +
        '<p class="u-note">Ceny brutto. Ceny i&nbsp;statusy lokali mają charakter informacyjny i&nbsp;nie stanowią oferty w&nbsp;rozumieniu Kodeksu cywilnego. Powierzchnie i&nbsp;ceny według cennika z&nbsp;15.09.2026; powierzchnie pomieszczeń według projektu budowlanego.</p></div>' +
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
  var ask = document.querySelector('.mbar__ask'); if (ask) { ask.href = '#u-contact'; var sp = ask.querySelector('span'); if (sp) sp.textContent = 'Zapytaj o ' + u.id; }
  var uf = document.getElementById('u-form'), um = document.getElementById('u-msg');
  uf.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = document.getElementById('u-name').value.trim(), c = document.getElementById('u-contactf').value.trim();
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c), okTel = c.replace(/[^\d]/g, '').length >= 9 && /^[+\d\s()-]+$/.test(c);
    if (!n || !(okMail || okTel)) { um.textContent = 'Podaj imię oraz numer telefonu lub adres e-mail.'; return; }
    if (!document.getElementById('u-consent').checked) { um.textContent = 'Zaznacz zgodę na przetwarzanie danych.'; return; }
    if (uf.elements._honey && uf.elements._honey.value) return;
    var extra = [uf.elements.parking.checked ? 'miejsce postojowe' : '', uf.elements.storage.checked ? 'komórka lokatorska' : ''].filter(Boolean).join(', ');
    var btn = uf.querySelector('button[type=submit]'); btn.disabled = true; um.textContent = 'Wysyłanie…';
    window.N75Send({ 'Imię': n, 'Kontakt': c, 'Lokal': u.id + ' (' + fmtA.format(u.area) + ' m², piętro ' + u.floor + ', ' + fmt.format(u.price) + ' zł)', 'Dodatkowo': extra, 'Wiadomość': uf.elements.message.value.trim(), 'Formularz': 'Karta mieszkania' }).then(function () {
      um.textContent = 'Dziękujemy! Doradca skontaktuje się w sprawie ' + u.id + ' w ciągu jednego dnia roboczego.';
      uf.reset();
    }).catch(function () {
      um.innerHTML = 'Nie udało się wysłać formularza. Zadzwoń: <a href="tel:' + TEL + '">' + TEL_TXT + '</a> lub napisz: <a href="mailto:' + MAIL + '">' + MAIL + '</a>.';
    }).then(function () { btn.disabled = false; });
  });
  // „Pobierz kartę PDF”: okno druku przeglądarki z gotowym układem karty; tytuł = nazwa pliku PDF
  document.getElementById('u-3d').addEventListener('click', function () { if (window.N75Doll) window.N75Doll.open(u.id, 'Apartament ' + u.id); });
  document.getElementById('u-pdf').addEventListener('click', function () {
    var t = document.title; document.title = 'N75-karta-' + u.id;
    if (wholeFloor) { wholeFloor = false; planApi.zoomTo(u.id, 0); }
    setTimeout(function () { window.print(); document.title = t; }, 60);
  });
})();
