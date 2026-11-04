(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- Header: przezroczysty nad hero, pełny po przewinięciu ---------- */
  var header = $('#header');
  var hero = $('.hero');
  function onScroll() {
    var limit = hero ? hero.offsetHeight - 90 : 40;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Wysuwane menu ---------- */
  var burger = $('#burger');
  var drawer = $('#drawer');
  var overlay = $('#drawer-overlay');
  var drawerClose = $('#drawer-close');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    if (open) {
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      setTimeout(function () { drawerClose.focus(); }, 50);
    } else {
      overlay.classList.remove('is-open');
      setTimeout(function () { if (!drawer.classList.contains('is-open')) overlay.hidden = true; }, 500);
      burger.focus({ preventScroll: true });
    }
  }
  burger.addEventListener('click', function () { setMenu(true); });
  drawerClose.addEventListener('click', function () { setMenu(false); });
  overlay.addEventListener('click', function () { setMenu(false); });
  $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Aktywna pozycja menu ---------- */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- Hero: film ---------- */
  var video = $('#hero-video');
  var playBtn = $('#hero-play');
  function setPaused(p) {
    if (p) video.pause(); else { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }
    playBtn.setAttribute('aria-pressed', String(p));
    $('.lbl', playBtn).textContent = p ? 'Odtwórz' : 'Pauza';
  }
  if (video) {
    if (reduced) { video.removeAttribute('autoplay'); setPaused(true); }
    playBtn.addEventListener('click', function () { setPaused(!video.paused ? true : false); });
  }

  /* ---------- Animacje wejścia ---------- */
  var revealEls = $$('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduced) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); rObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { rObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Licznik w faktach ---------- */
  $$('[data-count]').forEach(function (el) {
    if (reduced || !('IntersectionObserver' in window)) return;
    var target = +el.dataset.count;
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now();
      (function tick(t) {
        var p = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
    o.observe(el);
  });

  /* ---------- Karuzela wnętrz ---------- */
  var rail = $('#rail');
  $$('[data-rail]').forEach(function (b) {
    b.addEventListener('click', function () {
      var step = rail.firstElementChild.getBoundingClientRect().width + 20;
      rail.scrollBy({ left: b.dataset.rail === 'next' ? step : -step, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  var gallery = $$('img[data-lightbox]');
  var lbIdx = 0, lastFocus = null;
  function showLb(i) {
    lbIdx = (i + gallery.length) % gallery.length;
    var g = gallery[lbIdx];
    lbImg.src = g.dataset.full || g.currentSrc || g.src;
    lbImg.alt = g.alt;
    lbCap.textContent = g.dataset.lightbox + '  ·  ' + String(lbIdx + 1).padStart(2, '0') + ' / ' + String(gallery.length).padStart(2, '0');
  }
  function openLb(i) { lastFocus = document.activeElement; showLb(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); body.style.overflow = 'hidden'; $('.lb-close', lb).focus(); }
  function closeLb() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  gallery.forEach(function (img, i) {
    img.style.cursor = 'zoom-in';
    img.tabIndex = 0;
    img.addEventListener('click', function () { openLb(i); });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter') openLb(i); });
  });
  $('.lb-prev', lb).addEventListener('click', function () { showLb(lbIdx - 1); });
  $('.lb-next', lb).addEventListener('click', function () { showLb(lbIdx + 1); });
  $('.lb-close', lb).addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  /* ---------- Wyszukiwarka mieszkań ---------- */
  var units = window.N75_UNITS || [];
  var out = $('#units-out');
  var state = { rooms: [], area: '', floor: '', avail: false, view: window.matchMedia('(max-width: 700px)').matches ? 'tiles' : 'table', sort: 'id', dir: 1, all: false };
  var PAGE = 14;
  var moreBtn = $('#f-more');
  moreBtn.addEventListener('click', function () { state.all = true; render(); });
  $$('.view button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === state.view)); });
  var fmt = new Intl.NumberFormat('pl-PL');
  var fmtA = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var STATUS = { wolne: 'Wolne', rezerwacja: 'Rezerwacja', sprzedane: 'Sprzedane' };
  var EXP = { N: 'północ', S: 'południe', E: 'wschód', W: 'zachód', NE: 'północny wschód', NW: 'północny zachód', SE: 'południowy wschód', SW: 'południowy zachód' };

  var floors = Array.from(new Set(units.map(function (u) { return u.floor; }))).sort(function (a, b) { return a - b; });
  var fFloor = $('#f-floor');
  floors.forEach(function (f) { var o = document.createElement('option'); o.value = f; o.textContent = 'Piętro ' + f; fFloor.appendChild(o); });

  var cUnit = $('#c-unit');
  units.filter(function (u) { return u.status !== 'sprzedane'; }).forEach(function (u) {
    var o = document.createElement('option'); o.value = u.id; o.textContent = u.id + ' · ' + fmtA.format(u.area) + ' m²'; cUnit.appendChild(o);
  });

  function ppm(u) { return Math.round(u.price / u.area); }
  function priceTxt(u) { return u.status === 'sprzedane' ? '—' : fmt.format(u.price) + ' zł'; }

  function filtered() {
    var list = units.filter(function (u) {
      if (state.rooms.length) {
        var r = u.rooms >= 4 ? 4 : u.rooms;
        if (state.rooms.indexOf(r) < 0) return false;
      }
      if (state.area) { var p = state.area.split('-'); if (u.area < +p[0] || u.area >= +p[1]) return false; }
      if (state.floor !== '' && u.floor !== +state.floor) return false;
      if (state.avail && u.status !== 'wolne') return false;
      return true;
    });
    var k = state.sort, d = state.dir;
    list.sort(function (a, b) {
      var va = k === 'ppm' ? ppm(a) : a[k], vb = k === 'ppm' ? ppm(b) : b[k];
      if (k === 'id') { va = a.floor * 100 + parseInt(a.id.split('.')[1], 10); vb = b.floor * 100 + parseInt(b.id.split('.')[1], 10); }
      return (va > vb ? 1 : va < vb ? -1 : 0) * d;
    });
    return list;
  }

  function planSvg(rooms) {
    var p = ['M10 10h80v60H10z'];
    if (rooms >= 2) p.push('M52 10v34h38');
    if (rooms >= 3) p.push('M10 44h28v26');
    if (rooms >= 4) p.push('M70 44v26');
    p.push('M38 70v6h20v-6');
    return '<svg viewBox="0 0 100 80" aria-hidden="true"><path d="' + p.join(' ') + '"/></svg>';
  }

  var COLS = [['id', 'Lokal'], ['floor', 'Piętro'], ['rooms', 'Pokoje'], ['area', 'Metraż'], ['exp', 'Ekspozycja'], ['price', 'Cena'], ['ppm', 'Cena za m²'], ['status', 'Status']];

  function render() {
    var full = filtered();
    $('#f-count').textContent = full.length + ' z ' + units.length + ' lokali';
    var list = state.all ? full : full.slice(0, PAGE);
    moreBtn.hidden = full.length <= list.length;
    moreBtn.textContent = 'Pokaż wszystkie lokale (' + full.length + ')';
    if (!list.length) { out.innerHTML = '<div class="empty">Brak lokali spełniających kryteria. <button class="bronze" data-reset>Wyczyść filtry</button></div>'; return; }
    var html;
    if (state.view === 'table') {
      html = '<div class="table-scroll"><table class="units"><thead><tr>' +
        COLS.map(function (c) {
          var cls = state.sort === c[0] ? (state.dir > 0 ? 'asc' : 'desc') : '';
          var aria = state.sort === c[0] ? (state.dir > 0 ? 'ascending' : 'descending') : 'none';
          return '<th data-sort="' + c[0] + '" class="' + cls + '" aria-sort="' + aria + '" tabindex="0">' + c[1] + '</th>';
        }).join('') + '<th></th></tr></thead><tbody>' +
        list.map(function (u) {
          return '<tr data-id="' + u.id + '" tabindex="0" class="' + (u.status === 'sprzedane' ? 'is-sold' : '') + '">' +
            '<td class="unit-id">' + u.id + '</td><td>' + u.floor + '</td><td>' + u.rooms + '</td>' +
            '<td>' + fmtA.format(u.area) + ' m²</td><td>' + (EXP[u.exp] || u.exp) + '</td>' +
            '<td class="price">' + priceTxt(u) + '</td><td>' + (u.status === 'sprzedane' ? '—' : fmt.format(ppm(u)) + ' zł') + '</td>' +
            '<td><span class="status status--' + u.status + '">' + STATUS[u.status] + '</span></td>' +
            '<td class="go caps">Karta</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      html = '<div class="tiles">' + list.map(function (u) {
        return '<button class="tile" data-id="' + u.id + '">' +
          '<div class="tile__top"><span class="tile__id">' + u.id + '</span><span class="status status--' + u.status + '">' + STATUS[u.status] + '</span></div>' +
          '<div class="tile__plan">' + planSvg(u.rooms) + '</div>' +
          '<dl><div><dt>Metraż</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div><div><dt>Pokoje</dt><dd>' + u.rooms + '</dd></div>' +
          '<div><dt>Piętro</dt><dd>' + u.floor + '</dd></div><div><dt>Cena</dt><dd>' + priceTxt(u) + '</dd></div></dl></button>';
      }).join('') + '</div>';
    }
    out.innerHTML = html;
  }

  $$('#f-rooms .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var v = +c.dataset.v, i = state.rooms.indexOf(v);
      if (i < 0) state.rooms.push(v); else state.rooms.splice(i, 1);
      c.setAttribute('aria-pressed', String(i < 0));
      render();
    });
  });
  $('#f-area').addEventListener('change', function (e) { state.area = e.target.value; render(); });
  fFloor.addEventListener('change', function (e) { state.floor = e.target.value; render(); });
  $('#f-avail').addEventListener('change', function (e) { state.avail = e.target.checked; render(); });
  function resetFilters() {
    state.rooms = []; state.area = ''; state.floor = ''; state.avail = false;
    $$('#f-rooms .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    $('#f-area').value = ''; fFloor.value = ''; $('#f-avail').checked = false;
    render();
  }
  $('#f-reset').addEventListener('click', resetFilters);
  $$('.view button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.view = b.dataset.view;
      $$('.view button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  function sortBy(k) { if (state.sort === k) state.dir *= -1; else { state.sort = k; state.dir = 1; } render(); }
  out.addEventListener('click', function (e) {
    if (e.target.closest('[data-reset]')) { resetFilters(); return; }
    var th = e.target.closest('th[data-sort]');
    if (th) { sortBy(th.dataset.sort); return; }
    var row = e.target.closest('[data-id]');
    if (row) openUnit(row.dataset.id);
  });
  out.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var th = e.target.closest('th[data-sort]');
    if (th) { sortBy(th.dataset.sort); return; }
    var row = e.target.closest('tr[data-id]');
    if (row) openUnit(row.dataset.id);
  });
  render();

  /* ---------- Karta lokalu ---------- */
  var modal = $('#unit-modal');
  var modalFocus = null;
  function openUnit(id) {
    var u = units.filter(function (x) { return x.id === id; })[0];
    if (!u) return;
    modalFocus = document.activeElement;
    var useLoggia = u.id === 'M2.04' || (u.id !== 'M2.03' && u.floor % 2 === 0);
    $('#m-img').src = useLoggia ? 'assets/img/loggia-m2-04.webp' : 'assets/img/salon-m2-03.webp';
    $('#m-img').alt = useLoggia ? 'Wizualizacja loggii' : 'Wizualizacja salonu';
    $('#m-cap').textContent = (u.id === 'M2.03' || u.id === 'M2.04') ? 'Wizualizacja lokalu ' + u.id : 'Wizualizacja poglądowa';
    $('#m-kicker').innerHTML = 'Piętro ' + u.floor + ' · <span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>';
    $('#m-title').textContent = u.id;
    var rows = [
      ['Metraż', fmtA.format(u.area) + ' m²'], ['Pokoje', u.rooms],
      ['Loggia', fmtA.format(u.loggia) + ' m²'], ['Taras', u.terrace ? fmtA.format(u.terrace) + ' m²' : '—'],
      ['Ekspozycja', EXP[u.exp] || u.exp], ['Piętro', u.floor],
      ['Cena', priceTxt(u)], ['Cena za m²', u.status === 'sprzedane' ? '—' : fmt.format(ppm(u)) + ' zł']
    ];
    $('#m-spec').innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
    $('#m-history').innerHTML = u.history.slice().reverse().map(function (h) {
      var d = h[0].split('-');
      return '<tr><td>' + d[2] + '.' + d[1] + '.' + d[0] + '</td><td>' + fmt.format(h[1]) + ' zł</td><td>' + fmt.format(Math.round(h[1] / u.area)) + ' zł</td></tr>';
    }).join('');
    var ask = $('#m-ask');
    ask.style.display = u.status === 'sprzedane' ? 'none' : '';
    ask.onclick = function () { cUnit.value = u.id; closeUnit(true); };
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    $('.modal__close', modal).focus();
  }
  function closeUnit(keepFocus) {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); body.style.overflow = '';
    if (!keepFocus && modalFocus) modalFocus.focus();
  }
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]')) closeUnit(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lb.classList.contains('is-open')) closeLb();
      else if (modal.classList.contains('is-open')) closeUnit();
      else if (body.classList.contains('menu-open')) setMenu(false);
    }
    if (lb.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
      if (e.key === 'ArrowRight') showLb(lbIdx + 1);
    }
  });

  /* ---------- Formularz (bez backendu; do podpięcia) ---------- */
  var form = $('#form'), msg = $('#form-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#c-name').value.trim(), email = $('#c-email').value.trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Podaj imię i poprawny adres e-mail.'; return; }
    if (!$('#c-consent').checked) { msg.textContent = 'Zaznacz zgodę na przetwarzanie danych.'; return; }
    // TODO: wysyłka do CRM / API sprzedaży
    msg.textContent = 'Dziękujemy. Doradca skontaktuje się z Tobą w ciągu jednego dnia roboczego.';
    form.reset();
  });

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
