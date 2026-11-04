(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  // Strona zachowuje się tak samo niezależnie od systemowego „ogranicz ruch” (decyzja projektowa).
  var reduced = false;
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

  /* ---------- Mapa lokalizacji (Leaflet): znacznik przypięty do współrzędnych budynku ---------- */
  var mapEl = $('#map');
  if (mapEl && !window.L) {
    // zapas, gdy Leaflet się nie wczyta: mapa OSM z wbudowanym znacznikiem (porusza się razem z mapą)
    var la = +mapEl.dataset.lat, ln = +mapEl.dataset.lng, d = .006;
    var fr = document.createElement('iframe');
    fr.title = 'Mapa: Narutowicza 75A, Łódź'; fr.loading = 'lazy'; fr.referrerPolicy = 'no-referrer';
    fr.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (ln - d * 1.6) + '%2C' + (la - d) + '%2C' + (ln + d * 1.6) + '%2C' + (la + d) + '&layer=mapnik&marker=' + la + '%2C' + ln;
    mapEl.appendChild(fr);
  }
  if (mapEl && window.L) {
    var pos = [+mapEl.dataset.lat, +mapEl.dataset.lng];
    var map = L.map(mapEl, { center: pos, zoom: +mapEl.dataset.zoom || 16, scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, subdomains: 'abc',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.marker(pos, {
      icon: L.divIcon({ className: 'map__pin', html: '<span>N75</span><i></i>', iconSize: [72, 60], iconAnchor: [36, 60] }),
      keyboard: false, title: 'N75 · Narutowicza 75A'
    }).addTo(map);
    // przycisk powrotu do budynku po przesunięciu mapy
    var Home = L.Control.extend({ options: { position: 'topright' }, onAdd: function () {
      var b = L.DomUtil.create('button', 'map__home caps'); b.type = 'button'; b.textContent = 'N75';
      b.setAttribute('aria-label', 'Wróć do budynku N75');
      L.DomEvent.on(b, 'click', function (e) { L.DomEvent.stop(e); map.flyTo(pos, +mapEl.dataset.zoom || 16, { duration: .6 }); });
      return b;
    } });
    map.addControl(new Home());
    // mapa w animowanej sekcji: przelicz rozmiar po odsłonięciu
    setTimeout(function () { map.invalidateSize(); }, 1200);
    window.addEventListener('resize', function () { map.invalidateSize(); });
  }

  /* ---------- Slidery zdjęć [data-slider]: co 3 s albo ręcznie (strzałki, kreski, przesunięcie palcem) ---------- */
  $$('[data-slider]').forEach(function (root, idx) {
    var slides = $$('.arch-slide', root), dots = $$('.arch-slider__dots button', root);
    if (slides.length < 2) return;
    var cap = $('[data-cap]', root), num = $('[data-num]', root), i = 0, timer = null, DUR = 3000, inView = false, hover = false;
    var offset = idx * 450;                       // kilka sliderów obok siebie: zmiany nie w tej samej chwili
    root.style.setProperty('--arch-dur', DUR + 'ms');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function go(k) {
      i = (k + slides.length) % slides.length;
      slides.forEach(function (sl, j) { sl.classList.toggle('is-on', j === i); sl.setAttribute('aria-hidden', String(j !== i)); });
      dots.forEach(function (d, j) { d.setAttribute('aria-selected', String(j === i)); });
      var bar = dots[i].querySelector('i'); bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = '';
      cap.textContent = slides[i].querySelector('img').dataset.lightbox;
      num.textContent = pad(i + 1) + ' / ' + pad(slides.length);
      play(0);
    }
    function play(extra) {
      clearTimeout(timer);
      var run = inView && !hover && !document.hidden;
      root.classList.toggle('is-paused', !run);
      if (run) timer = setTimeout(function () { go(i + 1); }, DUR + (extra || 0));
    }
    $$('[data-dir]', root).forEach(function (b) { b.addEventListener('click', function () { go(i + (b.dataset.dir === 'next' ? 1 : -1)); }); });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.dataset.i); }); });
    root.addEventListener('mouseenter', function () { hover = true; play(); });
    root.addEventListener('mouseleave', function () { hover = false; play(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
    var track = $('.arch-slider__track', root), x0 = null, y0 = 0;
    track.addEventListener('pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; });
    track.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(i + (dx < 0 ? 1 : -1)); root.dataset.swiped = '1'; setTimeout(function () { delete root.dataset.swiped; }, 50); }
    });
    track.addEventListener('pointercancel', function () { x0 = null; });
    track.addEventListener('click', function (e) { if (root.dataset.swiped) { e.stopPropagation(); e.preventDefault(); } }, true);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { var was = inView; inView = en[0].isIntersecting; play(!was && inView ? offset : 0); }, { threshold: .3 }).observe(root);
    else { inView = true; play(offset); }
    document.addEventListener('visibilitychange', function () { play(); });
  });

  /* ---------- Modernizm to… (zmieniające się słowo) ---------- */
  var rot = $('#modern-rot');
  if (rot) {
    var words = ['luksus', 'wyrafinowanie', 'etos', 'filozofia'];
    // dopasowanie wielkości: najdłuższe słowo musi zmieścić się w szerokości kolumny (każdy font, każdy ekran)
    var title = rot.closest('.modern__title');
    var fitTitle = function () {
      title.style.fontSize = '';
      var probe = document.createElement('span');
      probe.className = 'modern__word'; probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      rot.appendChild(probe);
      var widest = 0;
      words.concat(['Modernizm to']).forEach(function (w) { probe.textContent = w; widest = Math.max(widest, probe.getBoundingClientRect().width); });
      rot.removeChild(probe);
      var avail = title.getBoundingClientRect().width;
      if (widest > avail) title.style.fontSize = (parseFloat(getComputedStyle(title).fontSize) * avail / widest * .98) + 'px';
    };
    fitTitle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
    window.addEventListener('resize', fitTitle);
    var wEl = $('.modern__word', rot), wi = 0;
    setInterval(function () {
      wEl.classList.add('is-out');
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        wEl.textContent = words[wi];
        wEl.classList.remove('is-out');
      }, 500);
    }, 2400);
  }

  /* ---------- Animacje wejścia ---------- */
  var revealEls = $$('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduced) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { (e.target._reveal || e.target).classList.add('is-in'); rObs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    // .reveal-img jest na starcie całkowicie przycięty (clip-path), więc obserwator nigdy by go nie „zobaczył”:
    // obserwujemy jego ramkę i odsłaniamy obrazek
    revealEls.forEach(function (el) {
      var t = el.classList.contains('reveal-img') && el.parentElement ? el.parentElement : el;
      if (t !== el) t._reveal = el;
      rObs.observe(t);
    });
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
  var state = { rooms: [], area: '', floor: '', avail: false, view: 'table', sort: 'id', dir: 1, all: false };
  var PAGE = 14;
  var moreBtn = $('#f-more');
  moreBtn.addEventListener('click', function () { state.all = true; render(); });
  $$('.view button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === state.view)); });
  var fmt = new Intl.NumberFormat('pl-PL');
  var fmtA = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var STATUS = { wolne: 'Wolne', rezerwacja: 'Rezerwacja', sprzedane: 'Sprzedane' };

  var floors = Array.from(new Set(units.map(function (u) { return u.floor; }))).sort(function (a, b) { return a - b; });
  var fFloor = $('#f-floor');
  floors.forEach(function (f) { var o = document.createElement('option'); o.value = f; o.textContent = 'Piętro ' + f; fFloor.appendChild(o); });

  var cUnit = $('#c-unit');
  units.filter(function (u) { return u.status !== 'sprzedane'; }).forEach(function (u) {
    var o = document.createElement('option'); o.value = u.id; o.textContent = u.id + ' · ' + fmtA.format(u.area) + ' m²'; cUnit.appendChild(o);
  });
  /* index.html?lokal=M1.01#kontakt: formularz z wybranym lokalem (przycisk z karty mieszkania) */
  var askFor = new URLSearchParams(location.search).get('lokal');
  if (askFor && cUnit.querySelector('option[value="' + askFor.replace(/[^\w.]/g, '') + '"]')) cUnit.value = askFor;
  function cardUrl(id) { return 'mieszkanie.html?id=' + encodeURIComponent(id); }

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

  // miniatura prawdziwego rzutu lokalu (z meblami); dwupoziomowe: obie kondygnacje obok siebie
  function planThumb(u) {
    return u.levels.map(function (l) {
      return '<img src="assets/img/plany/lokale/' + u.id + '-' + l + '-sm.webp" alt="Rzut lokalu ' + u.id + (u.levels.length > 1 ? ', piętro ' + l : '') + '" loading="lazy">';
    }).join('');
  }

  var COLS = [['id', 'Lokal', 'Lokal'], ['floor', 'Piętro', 'P.'], ['rooms', 'Pokoje', 'Pok.'], ['area', 'Metraż', 'm²'], ['price', 'Cena', 'Cena'], ['ppm', 'Cena za m²', ''], ['status', 'Status', '']];
  // krótka cena do wąskich ekranów: 1,24 mln / 475 tys.
  function priceShort(u) { if (u.status === 'sprzedane') return '—'; return u.price >= 1e6 ? (u.price / 1e6).toFixed(2).replace('.', ',') + ' mln' : Math.round(u.price / 1000) + ' tys.'; }

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
          return '<th data-sort="' + c[0] + '" class="' + cls + ' c-' + c[0] + '" aria-sort="' + aria + '" tabindex="0"><span class="l">' + c[1] + '</span><span class="s" aria-hidden="true">' + c[2] + '</span></th>';
        }).join('') + '<th class="c-go"></th></tr></thead><tbody>' +
        list.map(function (u) {
          return '<tr data-id="' + u.id + '" tabindex="0" class="' + (u.status === 'sprzedane' ? 'is-sold' : '') + '">' +
            '<td class="unit-id">' + u.id + '</td><td>' + u.floor + '</td><td>' + u.rooms + '</td>' +
            '<td class="c-area">' + fmtA.format(u.area) + '<span class="l"> m²</span></td>' +
            '<td class="price c-price"><span class="l">' + priceTxt(u) + '</span><span class="s">' + priceShort(u) + '</span></td><td class="c-ppm">' + (u.status === 'sprzedane' ? '—' : fmt.format(ppm(u)) + ' zł') + '</td>' +
            '<td class="c-status"><span class="status status--' + u.status + '" title="' + STATUS[u.status] + '"><span class="l">' + STATUS[u.status] + '</span></span></td>' +
            '<td class="go caps c-go"><a href="' + cardUrl(u.id) + '" tabindex="-1">Karta</a></td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      html = '<div class="tiles">' + list.map(function (u) {
        return '<a class="tile" href="' + cardUrl(u.id) + '">' +
          '<div class="tile__top"><span class="tile__id">' + u.id + '</span><span class="status status--' + u.status + '">' + STATUS[u.status] + '</span></div>' +
          '<div class="tile__plan' + (u.levels.length > 1 ? ' tile__plan--two' : '') + '">' + planThumb(u) + '</div>' +
          '<dl><div><dt>Metraż</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div><div><dt>Pokoje</dt><dd>' + u.rooms + '</dd></div>' +
          '<div><dt>Piętro</dt><dd>' + u.levels.join('–') + '</dd></div><div><dt>Cena</dt><dd>' + priceTxt(u) + '</dd></div></dl></a>';
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
    var row = e.target.closest('tr[data-id]');
    if (row && !e.target.closest('a')) location.href = cardUrl(row.dataset.id);
  });
  out.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var th = e.target.closest('th[data-sort]');
    if (th) { sortBy(th.dataset.sort); return; }
    var row = e.target.closest('tr[data-id]');
    if (row) location.href = cardUrl(row.dataset.id);
  });
  render();

  /* ---------- Makieta budynku: piętro → rzut z lokalami → karta mieszkania ---------- */
  var mkSvg = $('#mk-svg'), mkPanel = $('#mk-panel');
  if (mkSvg && mkPanel) {
    var NS = 'http://www.w3.org/2000/svg';
    // [x0, x1, y0, y1] kondygnacji na elewacji; 6 i 7 cofnięte tarasowo
    var GEO = { 7: [120, 380, 100, 160], 6: [80, 420, 160, 220], 5: [40, 460, 220, 280], 4: [40, 460, 280, 340], 3: [40, 460, 340, 400], 2: [40, 460, 400, 460], 1: [40, 460, 460, 520] };
    var onFloor = function (f) { return units.filter(function (u) { return u.levels.indexOf(f) >= 0; }); };
    var free = function (l) { return l.filter(function (u) { return u.status === 'wolne'; }).length; };
    var lokali = function (n) { return n === 1 ? 'lokal' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'lokale' : 'lokali'); };
    var wolnych = function (n) { return n === 1 ? 'wolny' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'wolne' : 'wolnych'); };
    function el(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function bays(g, x0, x1, y0, h, n, cls) {
      var w = (x1 - x0) / n;
      for (var i = 0; i < n; i++) el('rect', { x: x0 + i * w + w * .22, y: y0, width: w * .56, height: h, class: cls }, g);
    }
    // garaż i parter (bez wyboru)
    var base = el('g', { class: 'mk-base' }, mkSvg);
    el('rect', { x: 40, y: 598, width: 420, height: 50, class: 'mk-garage' }, base);
    el('text', { x: 250, y: 628, 'text-anchor': 'middle', class: 'mk-small' }, base).textContent = 'GARAŻ PODZIEMNY';
    el('rect', { x: 40, y: 520, width: 420, height: 72, class: 'mk-ground' }, base);
    for (var i = 0; i < 7; i++) {
      var cx = 40 + i * 60 + 30;
      el('path', { d: 'M' + (cx - 14) + ' 584V548a14 14 0 0 1 28 0V584Z', class: 'mk-door' }, base);
    }
    el('line', { x1: 0, y1: 594, x2: 600, y2: 594, class: 'mk-groundline' }, base);
    el('text', { x: 478, y: 552, class: 'mk-num' }, base).textContent = '00';
    el('text', { x: 478, y: 570, class: 'mk-small' }, base).textContent = 'LOBBY · USŁUGI';
    // zielone tarasy
    [[40, 80, 220], [420, 460, 220], [80, 120, 160], [380, 420, 160]].forEach(function (t) {
      for (var x = t[0] + 6; x < t[1]; x += 11) el('circle', { cx: x, cy: t[2] - 6, r: 6, class: 'mk-green' }, base);
    });
    var floorEls = {};
    [7, 6, 5, 4, 3, 2, 1].forEach(function (f) {
      var gm = GEO[f], list = onFloor(f), nFree = free(list);
      var g = el('g', { class: 'mk-floor', tabindex: 0, role: 'button', 'data-floor': f,
        'aria-label': 'Piętro ' + f + ': ' + list.length + ' ' + lokali(list.length) + ', ' + nFree + ' ' + wolnych(nFree) }, mkSvg);
      el('rect', { x: gm[0], y: gm[2], width: gm[1] - gm[0], height: gm[3] - gm[2], class: 'mk-body' }, g);
      bays(g, gm[0], gm[1], gm[2] + 12, gm[3] - gm[2] - 22, Math.round((gm[1] - gm[0]) / 60), 'mk-win');
      el('line', { x1: gm[0], y1: gm[3] - 6, x2: gm[1], y2: gm[3] - 6, class: 'mk-rail' }, g);
      var ty = (gm[2] + gm[3]) / 2;
      el('line', { x1: gm[1] + 4, y1: ty, x2: 470, y2: ty, class: 'mk-lead' }, g);
      el('text', { x: 478, y: ty - 2, class: 'mk-num' }, g).textContent = (f < 10 ? '0' : '') + f;
      el('text', { x: 478, y: ty + 16, class: 'mk-small' }, g).textContent = nFree + ' ' + wolnych(nFree).toUpperCase() + ' / ' + list.length;
      g.addEventListener('click', function () { selectFloor(f, true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFloor(f, true); } });
      floorEls[f] = g;
    });

    var plan = null, curFloor = null;
    function unitRows(list) {
      return list.map(function (u) {
        return '<li><a class="mk-unit" href="' + cardUrl(u.id) + '" data-id="' + u.id + '">' +
          '<span class="mk-unit__id">' + u.id + '</span>' +
          '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>' +
          '<span class="mk-unit__meta">' + u.rooms + ' pok. · ' + fmtA.format(u.area) + ' m²' + (u.levels.length > 1 ? ' · 2 poziomy' : '') + '</span>' +
          '<span class="mk-unit__price">' + priceTxt(u) + '</span></a></li>';
      }).join('');
    }
    function selectFloor(f, user) {
      curFloor = f;
      Object.keys(floorEls).forEach(function (k) {
        floorEls[k].classList.toggle('is-active', +k === f);
        floorEls[k].setAttribute('aria-pressed', String(+k === f));
      });
      var list = onFloor(f).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var nFree = free(list);
      mkPanel.innerHTML =
        '<div class="mk__head"><span class="num">Piętro</span><h3 class="display h3">' + f + '</h3>' +
        '<span class="caps muted">' + list.length + ' ' + lokali(list.length) + ' · ' + nFree + ' ' + wolnych(nFree) + '</span></div>' +
        (f === 7 ? '<p class="muted mk__note">Górne kondygnacje dwupoziomowych apartamentów z&nbsp;6. piętra.</p>' : '') +
        '<div class="mk__body"><div class="mk__plan" id="mk-plan"></div>' +
        '<div class="mk__side" id="mk-side" hidden></div></div>' +
        '<p class="mk__legend caps">Najedź na lokal, aby go podświetlić. Kliknij, aby zobaczyć jego rzut.</p>';
      plan = window.N75Plan.create($('#mk-plan'), {
        floor: f, units: list, href: function (u) { return cardUrl(u.id); },
        onPick: function (u, ev) { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); showUnit(u); }
      });
      if (user && window.matchMedia('(max-width: 900px)').matches) mkPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function showUnit(u) {
      var side = $('#mk-side');
      side.hidden = false; side.parentNode.classList.add('has-detail');
      var two = u.levels.length > 1;
      side.innerHTML =
        '<div class="mk-detail">' +
          '<button type="button" class="mk-back caps" data-back>← Wszystkie lokale</button>' +
          '<div class="mk-detail__id display">' + u.id + '</div>' +
          '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>' +
          '<dl class="mk-detail__spec">' +
            '<div><dt>Powierzchnia</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div>' +
            '<div><dt>Pokoje</dt><dd>' + u.rooms + '</dd></div>' +
            '<div><dt>Piętro</dt><dd>' + u.levels.join('–') + (two ? ' <small>(2 poziomy)</small>' : '') + '</dd></div>' +
            '<div><dt>Cena</dt><dd>' + priceTxt(u) + '</dd></div>' +
            '<div><dt>Cena za m²</dt><dd>' + fmt.format(ppm(u)) + ' zł</dd></div>' +
          '</dl>' +
          '<a class="btn btn--solid caps" href="' + cardUrl(u.id) + '">Karta mieszkania <span class="arrow"></span></a>' +
          '<a class="btn btn--line caps" href="?lokal=' + encodeURIComponent(u.id) + '#kontakt" data-ask="' + u.id + '">Zapytaj o lokal</a>' +
        '</div>';
      plan.zoomTo(u.id);
      var back = $('[data-back]', side); back.focus({ preventScroll: true });
      back.addEventListener('click', function () {
        plan.zoomOut();
        side.innerHTML = ''; side.hidden = true; side.parentNode.classList.remove('has-detail');
      });
      $('[data-ask]', side).addEventListener('click', function (e) {
        e.preventDefault(); cUnit.value = u.id; $('#kontakt').scrollIntoView({ behavior: 'smooth' });
      });
    }
    // lista ↔ rzut: podświetlenie i wybór lokalu
    function hl(e, on) {
      var a = e.target.closest && e.target.closest('.mk-unit[data-id]');
      if (a && plan) plan.highlight(a.dataset.id, on);
      if (!a) return;
      a.classList.toggle('is-hl', on);
    }
    mkPanel.addEventListener('mouseover', function (e) {
      var p = e.target.closest && e.target.closest('.pl-unit[data-id]');
      if (p) { var li = $('.mk-unit[data-id="' + p.dataset.id + '"]', mkPanel); if (li) li.classList.add('is-hl'); }
      hl(e, true);
    });
    mkPanel.addEventListener('mouseout', function (e) {
      var p = e.target.closest && e.target.closest('.pl-unit[data-id]');
      if (p) { var li = $('.mk-unit[data-id="' + p.dataset.id + '"]', mkPanel); if (li) li.classList.remove('is-hl'); }
      hl(e, false);
    });
    mkPanel.addEventListener('focusin', function (e) { hl(e, true); });
    mkPanel.addEventListener('focusout', function (e) { hl(e, false); });
    mkPanel.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.mk-unit[data-id]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      showUnit(units.filter(function (u) { return u.id === a.dataset.id; })[0]);
    });
    selectFloor(2, false);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lb.classList.contains('is-open')) closeLb();
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
