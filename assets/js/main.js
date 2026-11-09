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
    var map = L.map(mapEl, { center: pos, zoom: +mapEl.dataset.zoom || 16, zoomSnap: .1, zoomDelta: .5, minZoom: 15, maxZoom: 18.5, scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    mapEl._n75map = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, subdomains: 'abc',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    // ilustrowana mapa okolicy (akwarela z danych OSM) na wyciszonym podkładzie
    var ART = [[51.7632, 19.4625], [51.7812, 19.4915]];          // akwarela: ok. 1 km wokół N75
    var VIEW = [[51.77018, 19.47277], [51.77423, 19.48121]];     // kadr startowy: najbliższe sąsiedztwo
    mapEl.classList.add('map--art');
    L.imageOverlay('assets/img/mapa-okolica' + (window.innerWidth < 700 ? '-1200' : '') + '.webp?v=3', ART, { className: 'map__art', interactive: false }).addTo(map);
    fetch('assets/img/mapa-okolica-opisy.svg?v=3').then(function (r) { return r.text(); }).then(function (t) {
      var box = document.createElement('div'); box.innerHTML = t; var sv = box.querySelector('svg');
      L.svgOverlay(sv, ART, { className: 'map__labels', interactive: false }).addTo(map);
    }).catch(function () {});
    // kadr „cover”: ilustracja wypełnia całe okno mapy
    var artView = function (fly) { var z = Math.min(18, map.getBoundsZoom(VIEW, true) + .05), c = L.latLngBounds(VIEW).getCenter(); if (fly) map.flyTo(c, z, { duration: .6 }); else map.setView(c, z, { animate: false }); };
    artView();
    var compass = document.createElement('div'); compass.className = 'map__compass'; compass.setAttribute('aria-hidden', 'true');
    compass.innerHTML = '<svg viewBox="0 0 40 52"><text x="20" y="11" text-anchor="middle">N</text><circle cx="20" cy="33" r="13"/><path d="M20 15V51M7 33h26"/></svg>';
    mapEl.appendChild(compass);
    L.marker(pos, {
      icon: L.divIcon({ className: 'map__pin', html: '<span>N75</span><i></i>', iconSize: [72, 60], iconAnchor: [36, 60] }),
      keyboard: false, title: 'N75 · Narutowicza 75A'
    }).addTo(map);
    // przycisk powrotu do budynku po przesunięciu mapy
    var Home = L.Control.extend({ options: { position: 'topright' }, onAdd: function () {
      var b = L.DomUtil.create('button', 'map__home caps'); b.type = 'button'; b.textContent = 'N75';
      b.setAttribute('aria-label', 'Wróć do budynku N75');
      L.DomEvent.on(b, 'click', function (e) { L.DomEvent.stop(e); artView(true); });
      return b;
    } });
    map.addControl(new Home());
    // mapa w animowanej sekcji: przelicz rozmiar po odsłonięciu
    setTimeout(function () { map.invalidateSize(); artView(); }, 1200);
    window.addEventListener('resize', function () { map.invalidateSize(); });
    mapEl._n75art = artView;
  }

  /* ---------- Lokalizacja: kategorie „Odkryj” ↔ punkty na mapie z odległością ---------- */
  var acc = $('#places-acc');
  if (acc && mapEl) {
    var home = [+mapEl.dataset.lat, +mapEl.dataset.lng];
    var hav = function (a, b) {
      var R = 6371e3, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
      var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
      return 2 * R * Math.asin(Math.sqrt(x));
    };
    // odległość w linii prostej i szacunkowy czas pieszo (droga ok. 1,3× dłuższa, 80 m/min)
    var distTxt = function (m) { var mins = Math.max(1, Math.round(m * 1.3 / 80)); return (m < 995 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km') + ' · ok. ' + mins + ' min pieszo'; };
    var pois = {};
    $$('[data-poi]', acc).forEach(function (li) {
      var d = $('.poi__dist', li), ll = [+d.dataset.lat, +d.dataset.lng], m = d.dataset.m ? +d.dataset.m : hav(home, ll);   // data-m: odległość podana ręcznie (np. do granicy parku)
      d.textContent = distTxt(m);
      pois[li.dataset.poi] = { li: li, ll: ll, name: $('.poi__name', li).textContent, m: m };
    });
    var layer = null;
    function show(cat) {
      if (!window.L || !mapEl._n75map) return;
      var m = mapEl._n75map;
      if (layer) { m.removeLayer(layer); layer = null; }
      if (!cat) { if (mapEl._n75art) mapEl._n75art(true); return; }
      var items = Object.keys(pois).filter(function (k) { return k.indexOf(cat + '-') === 0; }).map(function (k) { return pois[k]; });
      layer = L.layerGroup();
      if (!items.length) { L.circle(home, { radius: 260, color: '#9c7149', weight: 1, dashArray: '4 6', fillColor: '#9c7149', fillOpacity: .06 }).addTo(layer); layer.addTo(m); m.flyTo(home, 16, { duration: .6 }); return; }
      items.forEach(function (p) {
        L.polyline([home, p.ll], { color: '#9c7149', weight: 1.5, dashArray: '4 6', opacity: .9 }).addTo(layer);
        var mk = L.marker(p.ll, { icon: L.divIcon({ className: 'poi-pin', html: '<i></i>', iconSize: [18, 18], iconAnchor: [9, 9] }), title: p.name }).addTo(layer);
        mk.bindTooltip('<b>' + p.name + '</b><br>' + distTxt(p.m), { direction: 'top', offset: [0, -8], className: 'poi-tip', permanent: items.length <= 2 });
        p.marker = mk;
      });
      layer.addTo(m);
      m.flyToBounds(L.latLngBounds([home].concat(items.map(function (p) { return p.ll; }))).pad(.25), { duration: .7, maxZoom: 17 });
    }
    $$('.place-cat', acc).forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) { $$('.place-cat', acc).forEach(function (o) { if (o !== d) o.open = false; }); show(d.dataset.cat); }
        else if (!$('.place-cat[open]', acc)) show(null);
      });
    });
    // najechanie / kliknięcie pozycji: podświetl punkt
    acc.addEventListener('mouseover', function (e) { var li = e.target.closest && e.target.closest('[data-poi]'); if (li && pois[li.dataset.poi].marker) pois[li.dataset.poi].marker.openTooltip(); });
    acc.addEventListener('click', function (e) {
      var li = e.target.closest && e.target.closest('[data-poi]'); if (!li || !mapEl._n75map) return;
      var p = pois[li.dataset.poi]; if (p.marker) { mapEl._n75map.flyTo(p.ll, 17, { duration: .6 }); p.marker.openTooltip(); }
    });
  }

  /* ---------- Slidery zdjęć [data-slider]: co 3 s albo ręcznie (strzałki, kreski, przesunięcie palcem) ---------- */
  $$('[data-slider]').forEach(function (root, idx) {
    var slides = $$('.arch-slide', root), dots = $$('.arch-slider__dots button', root);
    if (slides.length < 2) return;
    var cap = $('[data-cap]', root), num = $('[data-num]', root), i = 0, timer = null, DUR = 3000, inView = false, hover = false;
    var auto = root.id === 'arch-slider';          // samoczynnie zmienia się tylko slider Architektury
    if (!auto) root.classList.add('is-manual');
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
      if (run && auto) timer = setTimeout(function () { go(i + 1); }, DUR + (extra || 0));
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

  /* ---------- Dziennik budowy (dane: assets/js/dziennik.js) ---------- */
  var diary = $('#dziennik'), entries = (window.N75_DZIENNIK || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  if (diary && entries.length) {
    var M = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    var dtxt = function (d) { var p = d.split('-'); return (+p[2]) + ' ' + M[+p[1] - 1] + ' ' + p[0]; };
    var drail = $('#diary-rail');
    drail.innerHTML = entries.map(function (e) {
      return '<article class="diary__item">' + (e.img ? '<figure><img src="' + e.img + '" alt="' + (e.title || 'Budowa N75') + ', ' + dtxt(e.date) + '" loading="lazy" data-lightbox="' + dtxt(e.date) + (e.title ? ' · ' + e.title : '') + '"></figure>' : '') +
        '<time class="caps bronze" datetime="' + e.date + '">' + dtxt(e.date) + '</time>' + (e.title ? '<h4>' + e.title + '</h4>' : '') + (e.text ? '<p class="muted">' + e.text + '</p>' : '') + '</article>';
    }).join('');
    diary.hidden = false;
    $$('[data-diary]', diary).forEach(function (b) { b.addEventListener('click', function () { drail.scrollBy({ left: (b.dataset.diary === 'next' ? 1 : -1) * drail.clientWidth * .8, behavior: 'smooth' }); }); });
  }

  /* ---------- Szkic ołówkiem: po wejściu na ekran kreski rysują się jedna po drugiej, z „grafitem” prowadzącym linię ----------
     Ten sam mechanizm dla szkicu modernizmu i pierzei ul. Narutowicza.
     opts: total (ms całej animacji), gap (ms przerwy po każdej długiej kresce), tip (promień grafitu), host (element dostający .is-drawn) */
  function sketch(lines, stage, opts) {
    if (!lines || !stage || !window.fetch) return;
    var paths = [], tip = null, ready = false, seen = false, run = 0;
    var SPEED = { line: 1.25, light: 2.2, hatch: 3.2 };    // px/ms
    var host = opts.host || stage;
    var words = opts.words || [];
    function reset() { run++; paths.forEach(function (p) { p.el.style.strokeDashoffset = p.L; }); words.forEach(function (w) { w.el.classList.remove('is-on'); }); if (tip) tip.style.opacity = 0; host.classList.remove('is-drawn'); host.classList.add('is-drawing'); }
    function finish() { paths.forEach(function (p) { p.el.style.strokeDashoffset = 0; }); words.forEach(function (w) { w.el.classList.add('is-on'); }); if (tip) tip.style.opacity = 0; host.classList.add('is-drawn'); }
    // odtwarzane za każdym razem, gdy szkic wchodzi na ekran (także po powrocie przewijaniem)
    // jedna oś czasu dla wszystkich kresek: kilka krótkich kresek może narysować się w jednej klatce
    function play() {
      if (!ready || !seen) return;
      if (reduced) { finish(); return; }
      reset(); words.forEach(function (w) { w.on = 0; }); if (opts.follow) opts.follow.reset && opts.follow.reset(); var my = run, t0 = null, idx = 0; tip.style.opacity = 1;
      var total = paths.length ? paths[paths.length - 1].s + paths[paths.length - 1].d : 0;
      (function step(ts) {
        if (my !== run) return;
        if (t0 === null) t0 = ts;
        var el = ts - t0;
        while (idx < paths.length && paths[idx].s + paths[idx].d <= el) { paths[idx].el.style.strokeDashoffset = 0; idx++; }
        words.forEach(function (w) { if (w.t <= el && !w.on) { w.on = 1; w.el.classList.add('is-on'); } });
        if (idx < paths.length && paths[idx].s <= el) {
          var p = paths[idx], t = (el - p.s) / p.d, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          p.el.style.strokeDashoffset = (p.L * (1 - e)).toFixed(1);
          var pt = p.el.getPointAtLength(p.L * e); tip.setAttribute('cx', pt.x); tip.setAttribute('cy', pt.y);
        }
        if (opts.follow) opts.follow(Math.min(1, el / total));
        if (el < total) requestAnimationFrame(step); else { finish(); if (opts.follow) opts.follow.end(); }
      })(performance.now());
    }
    fetch(lines.dataset.src).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (svg) {
      lines.innerHTML = svg;
      var root = $('svg', lines);
      paths = $$('path', root).map(function (el) {
        var L = el.getTotalLength(); el.style.strokeDasharray = L + ' ' + L; el.style.strokeDashoffset = L;
        return { el: el, L: L, k: (el.getAttribute('class') || 's-line').replace('s-', '') };
      });
      tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      tip.setAttribute('r', opts.tip || 3.2); tip.setAttribute('class', 'draw__tip'); root.appendChild(tip);
      // czasy kresek: proporcjonalne do długości, z minimum; całość skalowana do opts.total
      var gap = opts.gap === undefined ? 22 : opts.gap;
      paths.forEach(function (p) { p.d = Math.max(p.k === 'line' ? 70 : 16, p.L / (SPEED[p.k] || SPEED.line)); });
      var gaps = paths.filter(function (p) { return p.k === 'line'; }).length * gap;
      var raw = paths.reduce(function (a, p) { return a + p.d; }, 0), k = Math.max(.05, (opts.total - gaps) / Math.max(1, raw));
      var acc = 0;
      paths.forEach(function (p) { p.d = Math.max(opts.min || 8, p.d * k); p.s = acc; acc += p.d + (p.k === 'line' ? gap : 0); });
      // słowa nad budynkami: każde pojawia się, gdy narysuje się większość kresek „jego” kamienicy
      words.forEach(function (w) {
        var ends = paths.filter(function (p) { if (p.cx === undefined) { var b = p.el.getBBox(); p.cx = b.x + b.width / 2; } return p.cx >= w.x0 && p.cx < w.x1; })
          .map(function (p) { return p.s + p.d; }).sort(function (a, b) { return a - b; });
        w.t = ends.length ? ends[Math.floor(ends.length * .55)] : 0;
      });
      ready = true; host.classList.add('is-drawing'); play();
    }).catch(function () { host.classList.add('is-drawn'); });
    if ('IntersectionObserver' in window) {
      var timer = null;
      var io = new IntersectionObserver(function (en) {
        var e = en[0];
        if (e.intersectionRatio >= .4) { if (!seen) { seen = true; clearTimeout(timer); timer = setTimeout(play, 250); } }
        else if (!e.isIntersecting) { seen = false; clearTimeout(timer); reset(); }   // całkiem poza ekranem: przygotuj do ponownego rysowania
      }, { threshold: [0, .4] });
      io.observe(stage);
    } else seen = true;
  }
  sketch($('#draw-lines'), $('#draw-stage'), { total: 4500, gap: 14 });
  /* na telefonie pasek jest szerszy od ekranu: kamera podąża za ołówkiem od lewej do N75, żeby było widać każde słowo zdania */
  var pzSc = $('#pierzeja-scroll'), pzHand = false, pzCur = 0, pzX0 = 0, pzY0 = 0;
  // tylko świadomy poziomy gest palcem zatrzymuje „kamerę” (pionowe przewijanie strony jej nie wyłącza)
  if (pzSc) {
    pzSc.addEventListener('touchstart', function (e) { pzX0 = e.touches[0].clientX; pzY0 = e.touches[0].clientY; }, { passive: true });
    pzSc.addEventListener('touchmove', function (e) { var dx = Math.abs(e.touches[0].clientX - pzX0), dy = Math.abs(e.touches[0].clientY - pzY0); if (dx > 12 && dx > dy * 1.5) pzHand = true; }, { passive: true });
    pzSc.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pzHand = true; }, { passive: true });
  }
  var pzMaxS = function () { return Math.max(0, pzSc.scrollWidth - pzSc.clientWidth); };
  var pzFollow = function (k) {
    var m = pzMaxS(); if (pzHand || m < 4) return;
    var t = m * Math.min(1, k * 1.08);   // „kamera” jedzie od lewej i dojeżdża do N75 tuż przed końcem rysunku
    pzCur += (t - pzCur) * .12; pzSc.scrollLeft = pzCur;
  };
  pzFollow.reset = function () { pzHand = false; pzCur = 0; if (pzSc) pzSc.scrollLeft = 0; };
  pzFollow.end = function () { if (!pzHand && pzMaxS() >= 4) pzSc.scrollTo({ left: pzMaxS(), behavior: 'smooth' }); };
  sketch($('#pierzeja-lines'), $('#pierzeja-scroll'), { total: 5500, gap: 0, tip: 4, min: 1, host: $('#pierzeja-fig'), follow: pzFollow,
    words: $$('#pierzeja-fig [data-x0]').map(function (el) { return { el: el, x0: +el.dataset.x0, x1: +el.dataset.x1 }; }) });

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
    wEl.textContent = words[0];
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

  /* ---------- Karuzela wnętrz: na komputerze przewijanie strony przesuwa zdjęcia w poziomie,
     a zdjęcia można też „złapać” i przeciągnąć myszką; na telefonie przesuwanie palcem ---------- */
  var rail = $('#rail'), hs = $('#hscroll'), hsBar = $('#hscroll-bar');
  var hMode = false, hMax = 0;
  var wantH = window.matchMedia('(min-width: 901px) and (pointer: fine)');
  function hLayout() {
    hMode = false; // strona przewija się normalnie – galerię przesuwa się strzałkami, myszką lub palcem
    document.body.classList.toggle('h-rail', hMode);
    hs.style.height = '';
    if (!hMode) return;
    hMax = Math.max(0, rail.scrollWidth - rail.clientWidth);
    hs.style.height = (hs.firstElementChild.offsetHeight + hMax) + 'px';
    hTick();
  }
  function hProgress() { var r = hs.getBoundingClientRect(); return hMax ? Math.min(1, Math.max(0, -r.top / hMax)) : 0; }
  function hTick() {
    if (hMode) rail.scrollLeft = hProgress() * hMax;
    if (hsBar) hsBar.style.transform = 'scaleX(' + (hMode ? hProgress() : (rail.scrollLeft / Math.max(1, rail.scrollWidth - rail.clientWidth))) + ')';
  }
  if (rail && hs) {
    window.addEventListener('scroll', function () { requestAnimationFrame(hTick); }, { passive: true });
    rail.addEventListener('scroll', function () { if (!hMode) requestAnimationFrame(hTick); }, { passive: true });
    window.addEventListener('resize', hLayout);
    if (wantH.addEventListener) wantH.addEventListener('change', hLayout);
    $$('img', rail).forEach(function (im) { if (!im.complete) im.addEventListener('load', hLayout, { once: true }); });
    hLayout();
    // strzałki
    $$('[data-rail]').forEach(function (b) {
      b.addEventListener('click', function () {
        var step = (rail.firstElementChild.getBoundingClientRect().width + 20) * (b.dataset.rail === 'next' ? 1 : -1);
        if (hMode) window.scrollBy({ top: step, behavior: 'smooth' });
        else rail.scrollBy({ left: step, behavior: 'smooth' });
      });
    });
    // przeciąganie myszką
    var dx0 = null, moved = 0, startX = 0;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; dx0 = e.clientX; startX = e.clientX; moved = 0; rail.classList.add('is-drag'); e.preventDefault(); });
    window.addEventListener('pointermove', function (e) {
      if (dx0 === null) return;
      var d = e.clientX - dx0; dx0 = e.clientX; moved = Math.max(moved, Math.abs(e.clientX - startX));
      if (hMode) window.scrollBy({ top: -d, behavior: 'instant' }); else rail.scrollLeft -= d;
    });
    window.addEventListener('pointerup', function () { if (dx0 === null) return; dx0 = null; rail.classList.remove('is-drag'); });
    rail.addEventListener('click', function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

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
  var uslugi = window.N75_USLUGI || [];
  var all = units.concat(uslugi);  // wyszukiwarka: mieszkania i lokale usługowe z parteru
  function isShop(u) { return u.floor === 0; }
  var out = $('#units-out');
  var state = { rooms: [], area: '', floor: '', avail: false, view: 'table', sort: 'id', dir: 1, all: false };
  var PAGE = 14;
  var moreBtn = $('#f-more');
  moreBtn.addEventListener('click', function () { state.all = true; render(); });
  $$('.view button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === state.view)); });
  var fmt = new Intl.NumberFormat('pl-PL');
  var fmtA = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var STATUS = { wolne: 'Wolne', rezerwacja: 'Rezerwacja', sprzedane: 'Sprzedane' };

  var floors = Array.from(new Set(all.map(function (u) { return u.floor; }))).sort(function (a, b) { return a - b; });
  var fFloor = $('#f-floor');
  floors.forEach(function (f) { var o = document.createElement('option'); o.value = f; o.textContent = f === 0 ? 'Parter' : 'Piętro ' + f; fFloor.appendChild(o); });

  var cUnit = $('#c-unit');
  all.filter(function (u) { return u.status !== 'sprzedane'; }).forEach(function (u) {
    var o = document.createElement('option'); o.value = u.id; o.textContent = u.id + ' · ' + fmtA.format(u.area) + ' m²'; cUnit.appendChild(o);
  });
  /* index.html?lokal=M1.01#kontakt: formularz z wybranym lokalem (przycisk z karty mieszkania) */
  var askFor = new URLSearchParams(location.search).get('lokal');
  if (askFor && cUnit.querySelector('option[value="' + askFor.replace(/[^\w.]/g, '') + '"]')) cUnit.value = askFor;
  // z porównywarki: index.html?porownanie=M1.01,M2.03#kontakt
  var cmp = (new URLSearchParams(location.search).get('porownanie') || '').replace(/[^\w.,]/g, '');
  if (cmp) { var msg = $('#c-msg'); if (msg && !msg.value) msg.value = 'Dzień dobry, proszę o informacje o lokalach: ' + cmp.split(',').join(', ') + '.'; }
  function cardUrl(id) { return 'mieszkanie.html?id=' + encodeURIComponent(id); }
  // lokale usługowe nie mają karty: prowadzą do formularza z wybranym lokalem
  function unitUrl(u) { return isShop(u) ? '?lokal=' + encodeURIComponent(u.id) + '#kontakt' : cardUrl(u.id); }
  function urlById(id) { return unitUrl(all.filter(function (u) { return u.id === id; })[0]); }

  function ppm(u) { return u.price ? Math.round(u.price / u.area) : null; }
  function priceTxt(u) { return u.status === 'sprzedane' ? '—' : u.price ? fmt.format(u.price) + ' zł' : 'Na zapytanie'; }
  function ppmTxt(u) { return u.status === 'sprzedane' || !u.price ? '—' : fmt.format(ppm(u)) + ' zł'; }
  function roomsTxt(u) { return isShop(u) ? 'Usługi' : u.rooms; }
  function floorTxt(u) { return isShop(u) ? 'Parter' : u.levels.join('–'); }

  function filtered() {
    var list = all.filter(function (u) {
      if (state.rooms.length) {
        if (isShop(u)) return false;
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
      if (k === 'price' || k === 'ppm') { if (va == null) va = Infinity; if (vb == null) vb = Infinity; }
      if (k === 'id') { va = a.floor * 100 + parseInt(a.id.split('.')[1], 10); vb = b.floor * 100 + parseInt(b.id.split('.')[1], 10); }
      return (va > vb ? 1 : va < vb ? -1 : 0) * d;
    });
    return list;
  }

  // miniatura prawdziwego rzutu lokalu (z meblami); dwupoziomowe: obie kondygnacje obok siebie
  function planThumb(u) {
    return u.levels.map(function (l) {
      return '<img src="assets/img/plany/lokale/' + u.id + '-' + l + '-sm.webp?v=1794252441" alt="Rzut lokalu ' + u.id + (u.levels.length > 1 ? ', piętro ' + l : '') + '" loading="lazy">';
    }).join('');
  }

  var COLS = [['id', 'Lokal', 'Lokal'], ['floor', 'Piętro', 'P.'], ['rooms', 'Pokoje', 'Pok.'], ['area', 'Metraż', 'm²'], ['price', 'Cena', 'Cena'], ['ppm', 'Cena za m²', ''], ['status', 'Status', '']];
  // krótka cena do wąskich ekranów: 1,24 mln / 475 tys.
  function priceShort(u) { if (u.status === 'sprzedane') return '—'; if (!u.price) return 'zapyt.'; return u.price >= 1e6 ? (u.price / 1e6).toFixed(2).replace('.', ',') + ' mln' : Math.round(u.price / 1000) + ' tys.'; }

  function render() {
    var full = filtered();
    $('#f-count').textContent = full.length + ' z ' + all.length + ' lokali';
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
        }).join('') + '<th class="c-go"></th><th class="c-fav"><span class="sr-only">Ulubione</span></th></tr></thead><tbody>' +
        list.map(function (u) {
          return '<tr data-id="' + u.id + '" tabindex="0" class="' + (u.status === 'sprzedane' ? 'is-sold' : '') + '">' +
            '<td class="unit-id">' + u.id + '</td><td>' + (isShop(u) ? 'P' : u.floor) + '</td><td>' + roomsTxt(u) + '</td>' +
            '<td class="c-area">' + fmtA.format(u.area) + '<span class="l"> m²</span></td>' +
            '<td class="price c-price"><span class="l">' + priceTxt(u) + '</span><span class="s">' + priceShort(u) + '</span></td><td class="c-ppm">' + ppmTxt(u) + '</td>' +
            '<td class="c-status"><span class="status status--' + u.status + '" title="' + STATUS[u.status] + '"><span class="l">' + STATUS[u.status] + '</span></span></td>' +
            '<td class="go caps c-go"><a href="' + unitUrl(u) + '" tabindex="-1">' + (isShop(u) ? 'Zapytaj' : 'Karta') + '</a></td>' +
            '<td class="c-fav">' + (window.N75Fav && !isShop(u) ? window.N75Fav.heart(u.id) : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      html = '<div class="tiles">' + list.map(function (u) {
        return '<a class="tile" href="' + unitUrl(u) + '">' +
          '<div class="tile__top"><span class="tile__id">' + u.id + '</span><span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>' + (window.N75Fav && !isShop(u) ? window.N75Fav.heart(u.id) : '') + '</div>' +
          '<div class="tile__plan' + (u.levels.length > 1 ? ' tile__plan--two' : '') + '">' + planThumb(u) + '</div>' +
          '<dl><div><dt>Metraż</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div><div><dt>' + (isShop(u) ? 'Rodzaj' : 'Pokoje') + '</dt><dd>' + roomsTxt(u) + '</dd></div>' +
          '<div><dt>Piętro</dt><dd>' + floorTxt(u) + '</dd></div><div><dt>Cena</dt><dd>' + priceTxt(u) + '</dd></div></dl></a>';
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
    if (row && !e.target.closest('a')) location.href = urlById(row.dataset.id);
  });
  out.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var th = e.target.closest('th[data-sort]');
    if (th) { sortBy(th.dataset.sort); return; }
    var row = e.target.closest('tr[data-id]');
    if (row) location.href = urlById(row.dataset.id);
  });
  render();

  /* ---------- Makieta budynku: piętro → rzut z lokalami → karta mieszkania ---------- */
  var mkSvg = $('#mk-svg'), mkPanel = $('#mk-panel');
  if (mkSvg && mkPanel) {
    var NS = 'http://www.w3.org/2000/svg';
    // [x0, x1, y0, y1] kondygnacji wg elewacji PB-AR-301: 5, 6 i 7 cofnięte tarasowo
    var GEO = { 7: [199, 341, 100, 160], 6: [107, 401, 160, 220], 5: [76, 435, 220, 280], 4: [40, 460, 280, 340], 3: [40, 460, 340, 400], 2: [40, 460, 400, 460], 1: [40, 460, 460, 520] };
    var onFloor = function (f) { return f === 0 ? uslugi.slice() : units.filter(function (u) { return u.levels.indexOf(f) >= 0; }); };
    var free = function (l) { return l.filter(function (u) { return u.status === 'wolne'; }).length; };
    var lokali = function (n) { return n === 1 ? 'lokal' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'lokale' : 'lokali'); };
    var wolnych = function (n) { return n === 1 ? 'wolny' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'wolne' : 'wolnych'); };
    function el(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    var X = function (v) { return 40 + (v - 135) / 1845 * 420; }; // oś x elewacji DWG → makieta
    function bars(g, x0, x1, y0, y1, step) {
      var d = 'M' + x0 + ' ' + y0 + 'H' + x1 + 'M' + x0 + ' ' + y1 + 'H' + x1;
      for (var x = x0; x <= x1 + .01; x += step) d += 'M' + x.toFixed(1) + ' ' + y0 + 'V' + y1;
      el('path', { d: d, class: 'mk-bar' }, g);
    }
    // okno francuskie: dwa skrzydła, opcjonalnie balustrada francuska w dolnej części
    function win(g, x, y, w, h, juliet, single) {
      el('rect', { x: x, y: y, width: w, height: h, class: 'mk-win' }, g);
      if (!single) el('path', { d: 'M' + (x + w / 2) + ' ' + y + 'V' + (y + h), class: 'mk-ln' }, g);
      if (juliet) bars(g, x - .6, x + w + .6, y + h * .56, y + h, 2.2);
    }
    function facade(g, x0, x1, y0, y1, n, opt) {
      var bw = (x1 - x0) / n;
      // gzyms / pas stropowy
      el('rect', { x: x0, y: y0, width: x1 - x0, height: opt.band, class: 'mk-band' }, g);
      for (var i = 0; i < n; i++) {
        var bx = x0 + i * bw;
        if (i) el('path', { d: 'M' + (bx - .9) + ' ' + (y0 + opt.band) + 'V' + y1 + 'M' + (bx + .9) + ' ' + (y0 + opt.band) + 'V' + y1, class: 'mk-ln mk-ln--pil' }, g);
        var single = opt.lastSingle && i === n - 1;
        win(g, bx + bw * .16, y0 + opt.band + opt.top, bw * .68, y1 - y0 - opt.band - opt.top - opt.bot, opt.juliet && !single, single);
      }
    }
    // garaż i parter (bez wyboru)
    var base = el('g', { class: 'mk-base' }, mkSvg);
    var gG = el('g', { class: 'mk-floor mk-floor--garage', tabindex: 0, role: 'button', 'data-floor': -1, 'aria-label': 'Garaż podziemny: miejsca postojowe' }, mkSvg);
    el('rect', { x: 40, y: 598, width: 420, height: 50, class: 'mk-garage' }, gG);
    el('text', { x: 250, y: 628, 'text-anchor': 'middle', class: 'mk-small' }, gG).textContent = 'GARAŻ PODZIEMNY';
    el('text', { x: 478, y: 618, class: 'mk-num' }, gG).textContent = '-1';
    el('text', { x: 478, y: 634, class: 'mk-small' }, gG).textContent = 'MIEJSCA POSTOJOWE';
    gG.addEventListener('click', function () { selectFloor(-1, true); });
    gG.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFloor(-1, true); } });
    var gGarage = gG;
    el('line', { x1: 0, y1: 594, x2: 600, y2: 594, class: 'mk-groundline' }, base);
    var floorEls = {};
    floorEls[-1] = gGarage;
    // parter: lobby i lokale usługowe (wybieralny jak piętra)
    (function () {
      var list = onFloor(0), nFree = free(list);
      var g = el('g', { class: 'mk-floor mk-floor--0', tabindex: 0, role: 'button', 'data-floor': 0,
        'aria-label': 'Parter: lobby i ' + list.length + ' ' + lokali(list.length) + ' usługowe, ' + nFree + ' ' + wolnych(nFree) }, mkSvg);
      el('rect', { x: 40, y: 520, width: 420, height: 72, class: 'mk-body mk-ground' }, g);
      el('rect', { x: 40, y: 520, width: 420, height: 9, class: 'mk-band' }, g);
      [[210, 355, 'p'], [355, 498, 'p'], [575, 718, 's'], [718, 860, 's'], [938, 1082, 'p'], [1082, 1225, 'p'], [1305, 1445, 's'], [1445, 1588, 's'], [1665, 1785, 's'], [1787, 1933, 'd']].forEach(function (o) {
        var x0 = X(o[0]) + .8, x1 = X(o[1]) - .8, y0 = 537, y1 = 592;
        el('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, class: 'mk-door' + (o[2] === 's' ? ' mk-door--glass' : '') }, g);
        if (o[2] === 's') { el('path', { d: 'M' + x0 + ' ' + (y0 + 9) + 'H' + x1, class: 'mk-ln' }, g); return; }
        // panele perforowane (kółka) jak na elewacji
        var cols = o[2] === 'd' ? 3 : 6, rows = 6, cw = (x1 - x0) / cols;
        if (o[2] !== 'd') el('path', { d: 'M' + x0 + ' ' + (y0 + 9) + 'H' + x1, class: 'mk-ln' }, g);
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
          el('circle', { cx: x0 + cw * (c + .5), cy: y0 + (o[2] === 'd' ? 8 : 15) + r * 6.4, r: 1.6, class: 'mk-perf' }, g);
      });
      el('path', { d: 'M' + X(198) + ' 529V592M' + X(1980) + ' 529V592', class: 'mk-ln' }, g);
      el('line', { x1: 464, y1: 556, x2: 470, y2: 556, class: 'mk-lead' }, g);
      el('text', { x: 478, y: 552, class: 'mk-num' }, g).textContent = '00';
      el('text', { x: 478, y: 570, class: 'mk-small' }, g).textContent = 'LOBBY · USŁUGI';
      g.addEventListener('click', function () { selectFloor(0, true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFloor(0, true); } });
      floorEls[0] = g;
    })();
    [7, 6, 5, 4, 3, 2, 1].forEach(function (f) {
      var gm = GEO[f], list = onFloor(f), nFree = free(list);
      var g = el('g', { class: 'mk-floor', tabindex: 0, role: 'button', 'data-floor': f,
        'aria-label': f === 7 ? 'Piętro 7: górne poziomy apartamentów z 6. piętra' : 'Piętro ' + f + ': ' + list.length + ' ' + lokali(list.length) + ', ' + nFree + ' ' + wolnych(nFree) }, mkSvg);
      if (f === 7) {
        // penthouse: bryła z lamelami pionowymi, przeszklenia i balustrada tarasu
        el('rect', { x: gm[0], y: gm[2] + 6, width: gm[1] - gm[0], height: 54, class: 'mk-body' }, g);
        el('rect', { x: gm[0] - 1, y: gm[2] + 4, width: gm[1] - gm[0] + 2, height: 4, class: 'mk-band' }, g);
        [[X(975), X(1100)], [X(1195), X(1285)]].forEach(function (s) { for (var x = s[0]; x < s[1]; x += 1.8) el('path', { d: 'M' + x.toFixed(1) + ' ' + (gm[2] + 9) + 'V' + (gm[2] + 60), class: 'mk-ln mk-ln--lam' }, g); });
        win(g, X(885), gm[2] + 20, X(975) - X(885) - 3, 22, false); win(g, X(1290), gm[2] + 20, X(1430) - X(1290), 22, false);
        bars(g, X(440), X(1730), 142, 160, 2.4);
        el('rect', { x: gm[0], y: gm[2], width: gm[1] - gm[0], height: gm[3] - gm[2], class: 'mk-hit' }, g);
      } else if (f >= 5) {
        // kondygnacje cofnięte: gzyms, okna francuskie, balustrada tarasu na stropie niżej
        el('rect', { x: gm[0], y: gm[2], width: gm[1] - gm[0], height: gm[3] - gm[2], class: 'mk-body' }, g);
        facade(g, gm[0], gm[1], gm[2], gm[3], f === 5 ? 9 : 7, { band: 9, top: 6, bot: 6, juliet: false });
        if (f === 5) bars(g, 40, 460, 263, 280, 2.4); else bars(g, X(305), X(1870), 203, 220, 2.4);
      } else {
        el('rect', { x: gm[0], y: gm[2], width: gm[1] - gm[0], height: gm[3] - gm[2], class: 'mk-body' }, g);
        facade(g, gm[0], gm[1], gm[2], gm[3], 10, { band: 6, top: 9, bot: 8, juliet: true, lastSingle: true });
      }
      var ty = (gm[2] + gm[3]) / 2;
      el('line', { x1: gm[1] + 4, y1: ty, x2: 470, y2: ty, class: 'mk-lead' }, g);
      el('text', { x: 478, y: ty - 2, class: 'mk-num' }, g).textContent = (f < 10 ? '0' : '') + f;
      el('text', { x: 478, y: ty + 16, class: 'mk-small' }, g).textContent = f === 7 ? 'M6.01 · M6.04 – POZIOM GÓRNY' : nFree + ' ' + wolnych(nFree).toUpperCase() + ' / ' + list.length;
      g.addEventListener('click', function () { selectFloor(f, true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFloor(f, true); } });
      floorEls[f] = g;
    });

    var plan = null, curFloor = null;
    function shopPrice(u) { return u.status === 'sprzedane' ? '—' : u.price ? fmt.format(u.price) + ' zł' : 'Cena na zapytanie'; }
    function unitRows(list) {
      return list.map(function (u) {
        return '<li><a class="mk-unit" href="' + cardUrl(u.id) + '" data-id="' + u.id + '">' +
          '<span class="mk-unit__id">' + u.id + '</span>' +
          '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>' +
          '<span class="mk-unit__meta">' + u.rooms + ' pok. · ' + fmtA.format(u.area) + ' m²' + (u.levels.length > 1 ? ' · 2 poziomy' : '') + '</span>' +
          '<span class="mk-unit__price">' + priceTxt(u) + '</span></a></li>';
      }).join('');
    }
    var FRAME_UP = null;
    function selectFloor(f, user) {
      curFloor = f;
      Object.keys(floorEls).forEach(function (k) {
        floorEls[k].classList.toggle('is-active', +k === f);
        floorEls[k].setAttribute('aria-pressed', String(+k === f));
      });
      var list = onFloor(f).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var nFree = free(list);
      var g0 = f === 0, gm1 = f === -1, PK = (window.N75_PARKING || {});
      var pkInfo = function (k) { var a = PK[k] || []; return a; };
      if (gm1) {
        var liftSp = pkInfo('-1').filter(function (s) { return s.k === 'lift'; }), lifts = liftSp.length, moto = pkInfo('-1').filter(function (s) { return s.k === 'moto'; }).length;
        var plats = liftSp.reduce(function (a, s) { return a + (s.pl || 1); }, 0), cars = liftSp.reduce(function (a, s) { return a + (s.cnt || 0); }, 0), dbl = liftSp.filter(function (s) { return s.pl === 2; }).length;
        mkPanel.innerHTML =
          '<div class="mk__head"><span class="num">Poziom</span><h3 class="display h3">−1</h3><span class="caps muted">Garaż podziemny · ' + lifts + ' platform parkingowych · ' + moto + ' miejsca dla motocykli</span></div>' +
          '<p class="muted mk__note">Hala garażowa z&nbsp;' + lifts + ' stanowiskami Parklift (G01–G' + (lifts < 10 ? '0' : '') + lifts + '): ' + dbl + ' podwójnych (2 platformy obok siebie) i&nbsp;' + (lifts - dbl) + ' pojedyncze – razem ' + plats + ' platform dwupoziomowych, czyli ' + cars + ' miejsc (numeracja 15–58 wg projektu). Razem z&nbsp;' + pkInfo('0').length + ' miejscami na parterze daje to ok. ' + (cars + pkInfo('0').length) + ' miejsc w&nbsp;budynku. Do tego 2 miejsca dla motocykli, 17 komórek lokatorskich (2–6&nbsp;m²), wózkownia (16,45&nbsp;m²), pomieszczenie porządkowe oraz bezpośrednie wejście do klatki i&nbsp;windy przez przedsionki przeciwpożarowe. Wjazd rampą z&nbsp;parteru. Dostępność miejsc potwierdzi biuro sprzedaży.</p>' +
          '<div class="mk__body"><div class="mk__plan" id="mk-plan"></div><div class="mk__side" id="mk-side" hidden></div></div>';
        plan = window.N75Plan.create($('#mk-plan'), { floor: -1, units: [], frame: [70, 100, 1424, 1720], href: function () { return '#'; } });
        if (user && window.matchMedia('(max-width: 900px)').matches) mkPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      mkPanel.innerHTML =
        '<div class="mk__head"><span class="num">' + (g0 ? 'Poziom' : 'Piętro') + '</span><h3 class="display h3">' + (g0 ? 'Parter' : f) + '</h3>' +
        '<span class="caps muted">' + (f === 7 ? 'Górne poziomy ' + list.map(function (u) { return u.id; }).join(' i ') : list.length + ' ' + lokali(list.length) + (g0 ? ' usługowe' : '') + ' · ' + nFree + ' ' + wolnych(nFree)) + '</span></div>' +
        (f === 7 ? '<p class="muted mk__note">Na 7. kondygnacji nie ma samodzielnych mieszkań – to górne poziomy dwupoziomowych apartamentów ' + list.map(function (u) { return u.id; }).join(' i ') + ' z&nbsp;6. piętra. Kliknij apartament, aby zobaczyć cały lokal.</p>' : '') +
        (g0 ? '<p class="muted mk__note">Lobby z&nbsp;recepcją, hala garażowa z&nbsp;' + pkInfo('0').length + ' miejscami postojowymi (P01–P' + pkInfo('0').length + '), komórki lokatorskie i&nbsp;trzy lokale usługowe od strony ulic Narutowicza i&nbsp;Tramwajowej. Przeznaczenie lokali do ustalenia z&nbsp;najemcą lub nabywcą.</p>' : '') +
        '<div class="mk__body"><div class="mk__plan" id="mk-plan"></div>' +
        '<div class="mk__side" id="mk-side" hidden></div></div>' +
        '<div class="mk__foot">' +
        '<a class="mk__cat caps" href="assets/N75_katalog.pdf?v=1793898045" download="N75_katalog.pdf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/></svg><span>Pobierz katalog inwestycji</span></a></div>';
      // jeden kadr dla wszystkich pięter mieszkalnych: rzuty w tej samej skali i położeniu
      if (!FRAME_UP) {
        var bx = [Infinity, Infinity, -Infinity, -Infinity];
        units.forEach(function (u) { Object.keys(u.shape || {}).forEach(function (k) { if (k !== '0') u.shape[k].forEach(function (p) { bx[0] = Math.min(bx[0], p[0]); bx[1] = Math.min(bx[1], p[1]); bx[2] = Math.max(bx[2], p[0]); bx[3] = Math.max(bx[3], p[1]); }); }); });
        var pw = (bx[2] - bx[0]) * .04, ph = (bx[3] - bx[1]) * .04;
        FRAME_UP = [bx[0] - pw, bx[1] - ph, bx[2] - bx[0] + 2 * pw, bx[3] - bx[1] + 2 * ph];
      }
      var zones = (window.N75_STREFY || []).filter(function (z) { return z.floor === f; });
      plan = window.N75Plan.create($('#mk-plan'), {
        floor: f, units: list.concat(zones), frame: g0 ? [70, 100, 1424, 1720] : FRAME_UP, href: function (u) { return u.kind ? '#' + u.id.toLowerCase() : g0 ? '?lokal=' + encodeURIComponent(u.id) + '#kontakt' : cardUrl(u.id); },
        onPick: function (u, ev) { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return; ev.preventDefault(); showUnit(u); }
      });
      if (user && window.matchMedia('(max-width: 900px)').matches) mkPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function showZone(u) {
      var side = $('#mk-side');
      side.hidden = false; side.parentNode.classList.add('has-detail');
      var n = u.gallery.length, i = 0;
      side.innerHTML = '<div class="mk-detail mk-zone">' +
        '<button type="button" class="mk-back caps" data-back>← Wszystkie lokale</button>' +
        '<div class="mk-detail__head"><div class="mk-detail__id display">' + u.title + '</div></div>' +
        '<p class="muted mk-zone__txt">' + u.text + '</p>' +
        '<div class="mk-zone__sl"><div class="mk-zone__track">' + u.gallery.map(function (g, k) {
          return '<figure class="mk-zone__fig' + (k ? '' : ' is-on') + '"><img src="assets/img/' + g[0] + '.webp" alt="' + g[1] + '"' + (k ? ' loading="lazy"' : '') + '></figure>';
        }).join('') + '</div>' +
        '<div class="mk-zone__nav"><span class="mk-zone__cap caps"></span><span class="mk-zone__count caps"></span>' +
        '<button type="button" class="mk-zone__btn" data-z="-1" aria-label="Poprzednie zdjęcie">←</button><button type="button" class="mk-zone__btn" data-z="1" aria-label="Następne zdjęcie">→</button></div></div>' +
        '<a class="btn btn--line caps" href="' + u.link[0] + '">' + u.link[1] + '</a>' +
      '</div>';
      var figs = $$('.mk-zone__fig', side), cap = $('.mk-zone__cap', side), cnt = $('.mk-zone__count', side);
      function go(k) {
        i = (k + n) % n;
        figs.forEach(function (f, x) { f.classList.toggle('is-on', x === i); });
        cap.textContent = u.gallery[i][1]; cnt.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      }
      go(0);
      $$('[data-z]', side).forEach(function (b) { b.addEventListener('click', function () { go(i + +b.dataset.z); }); });
      var sl = $('.mk-zone__sl', side), x0 = null;
      sl.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      sl.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
      plan.zoomTo(u.id);
      var back = $('[data-back]', side); back.focus({ preventScroll: true });
      back.addEventListener('click', function () {
        plan.zoomOut();
        side.innerHTML = ''; side.hidden = true; side.parentNode.classList.remove('has-detail');
      });
    }
    function showUnit(u) {
      if (u.kind) { showZone(u); return; }
      var side = $('#mk-side');
      side.hidden = false; side.parentNode.classList.add('has-detail');
      var shop = u.floor === 0;
      var two = !shop && u.levels.length > 1;
      side.innerHTML = shop ?
        '<div class="mk-detail">' +
          '<button type="button" class="mk-back caps" data-back>← Wszystkie lokale</button>' +
          '<div class="mk-detail__head"><div class="mk-detail__id display">' + u.id + '</div></div>' +
          '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>' +
          '<dl class="mk-detail__spec">' +
            '<div><dt>Rodzaj</dt><dd>' + u.name + '</dd></div>' +
            '<div><dt>Powierzchnia</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div>' +
            '<div><dt>Poziom</dt><dd>Parter</dd></div>' +
            '<div><dt>Cena</dt><dd>' + shopPrice(u) + '</dd></div>' +
          '</dl>' +
          '<a class="btn btn--solid caps" href="?lokal=' + encodeURIComponent(u.id) + '#kontakt" data-ask="' + u.id + '">Zapytaj o lokal <span class="arrow"></span></a>' +
        '</div>' :
        '<div class="mk-detail">' +
          '<button type="button" class="mk-back caps" data-back>← Wszystkie lokale</button>' +
          '<div class="mk-detail__head"><div class="mk-detail__id display">' + u.id + '</div>' + (window.N75Fav ? window.N75Fav.heart(u.id) : '') + '</div>' +
          '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>' +
          '<dl class="mk-detail__spec">' +
            '<div><dt>Powierzchnia</dt><dd>' + fmtA.format(u.area) + ' m²</dd></div>' +
            '<div><dt>Pokoje</dt><dd>' + u.rooms + '</dd></div>' +
            '<div><dt>Piętro</dt><dd>' + u.levels.join('–') + (two ? ' <small>(2 poziomy)</small>' : '') + '</dd></div>' +
            '<div><dt>Cena</dt><dd>' + priceTxt(u) + '</dd></div>' +
            '<div><dt>Cena za m²</dt><dd>' + fmt.format(ppm(u)) + ' zł</dd></div>' +
          '</dl>' +
          '<button type="button" class="btn btn--line caps mk-3d" data-3d="' + u.id + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v9m0 9v-9m9-4.5L12 12 3 7.5"/></svg><span>Wersja 3D</span></button>' +
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
      var b3 = $('[data-3d]', side);
      if (b3) b3.addEventListener('click', function () { if (window.N75Doll) window.N75Doll.open(u.id, 'Apartament ' + u.id); });
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
      showUnit(units.concat(uslugi).filter(function (u) { return u.id === a.dataset.id; })[0]);
    });
    selectFloor(0, false);

    // „Budynek rośnie”: przy pierwszym pojawieniu się makiety piętra składają się od garażu po dach, z licznikiem
    var mkHint = $('.mk__hint'), mkWrap = $('#makieta');
    if (mkWrap && 'IntersectionObserver' in window) {
      mkSvg.classList.add('mk--prebuild');
      var hintTxt = mkHint ? mkHint.textContent : '';
      var build = function () {
        var order = [mkSvg.querySelector('.mk-base')].concat([0, 1, 2, 3, 4, 5, 6, 7].map(function (f) { return floorEls[f]; }));
        mkSvg.classList.remove('mk--prebuild'); mkSvg.classList.add('mk--building');
        order.forEach(function (g, i) {
          setTimeout(function () {
            g.classList.add('is-built');
            if (mkHint) mkHint.innerHTML = i > 1 ? 'Kondygnacja <b>0' + (i - 1) + '</b> / 07' : (i ? 'Parter' : 'Garaż');
            if (i === order.length - 1) setTimeout(function () { mkSvg.classList.remove('mk--building'); if (mkHint) mkHint.textContent = hintTxt; }, 900);
          }, 180 + i * 230);
        });
      };
      var bo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { bo.disconnect(); build(); } }, { threshold: .35 });
      bo.observe(mkSvg);
    }
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
    msg.textContent = 'Dziękujemy! Twój osobisty doradca zadzwoni w ciągu jednego dnia roboczego, by ustalić termin prywatnej prezentacji.';
    form.reset();
  });


  /* ---------- Cztery wartości: typograficzna sekwencja odtwarzana automatycznie (gdy sekcja jest na ekranie) ---------- */
  (function () {
    var tr = document.getElementById('values-track'); if (!tr) return;
    var ws = $$('.vw', tr), nav = $$('.values__nav span', tr), gh = $$('.values__ghost span', tr), num = document.getElementById('values-n');
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, cl = function (v) { return Math.min(1, Math.max(0, v)); };
    var L = ws.map(function (w) { return $$('.vl > span', w); }), cur = -1;
    // przy „ograniczonym ruchu” (często domyślnie w Windows) słowa tylko przenikają się, bez wjazdu liter
    var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var PER = 4200, x = -.35, last = 0, on = false;
    function draw() {
      ws.forEach(function (w, k) {
        var t = ((x - k + .5) % 4 + 4) % 4 - .5, n = L[k].length;
        L[k].forEach(function (s, i) {
          var d = i / Math.max(1, n - 1) * .22;
          var inn = ease(cl((t + .32 - d) / .38)), out = ease(cl((t - .72 - d * .6) / .3));
          s.style.setProperty('--y', RM ? '0%' : ((1 - inn) * 110 - out * 110).toFixed(2) + '%');
        });
        var o = cl((t + .05) / .25) * (1 - cl((t - .62) / .18));
        w.style.setProperty('--o', o.toFixed(3)); w.classList.toggle('is-on', o > .5);
        if (RM) w.firstElementChild.nextElementSibling.style.opacity = o.toFixed(3);
      });
      var xm = ((x % 4) + 4) % 4, i = Math.floor(xm + .2) % 4;
      nav.forEach(function (s, k) { s.style.setProperty('--b', k === i ? cl(xm - k + .2 > 3 ? xm - 4 - k + .2 : xm - k + .2).toFixed(3) : (k < i ? 1 : 0)); });
      if (i !== cur) { cur = i; if (num) num.textContent = '0' + (i + 1); nav.forEach(function (s, k) { s.classList.toggle('is-on', k === i); }); gh.forEach(function (g, k) { g.classList.toggle('is-on', k === i); }); }
    }
    function tick(ts) {
      if (!on) return;
      var dt = last ? Math.min(100, ts - last) : 0; last = ts;
      x += dt / PER;
      draw(); requestAnimationFrame(tick);
    }
    new IntersectionObserver(function (e) { var v = e[0].isIntersecting; if (v && !on) { on = true; last = 0; requestAnimationFrame(tick); } else if (!v) on = false; }, { threshold: .35 }).observe(tr);
    nav.forEach(function (s, k) { s.addEventListener('click', function () { x = Math.floor(x / 4) * 4 + k - .3; if (x < 0) x += 4; draw(); }); });
    draw();
  })();


  /* ---------- Hero: żywa wizualizacja – przelatujące ptaki, auto na Narutowicza, światła w oknach N75 ---------- */
  (function () {
    var media = $('.hero__media'), img = media && $('img', media); if (!img) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var IW = 3200, IH = 2400;
    var WIN = [[1546,388,11,15],[1434,403,33,35],[1470,406,28,33],[1501,406,12,39],[1355,466,27,26],[1461,479,13,24],[1508,483,16,32],[1256,522,42,34],[1243,527,8,11],[1313,529,22,33],[1401,540,31,23],[1446,546,34,36],[1631,548,15,28],[1574,550,47,13],[1494,552,30,37],[1853,553,13,39],[1587,563,9,17],[1739,581,27,36],[1845,610,18,38],[1460,620,21,20],[1162,639,9,10],[1191,643,23,25],[1273,655,24,27],[1324,665,16,35],[1348,671,40,35],[1849,671,12,24],[1394,677,16,31],[1425,680,10,30],[1499,693,29,25],[1149,697,29,33],[1769,697,19,40],[1846,696,14,13],[1589,700,20,29],[1570,707,14,12],[1742,711,8,20],[1284,724,17,21],[1349,734,12,39],[1767,740,23,10],[1649,746,16,21],[1136,764,11,23],[1558,772,21,37],[1289,785,14,20],[1129,799,19,17],[1457,819,27,39]];
    var fx = document.createElement('div'); fx.className = 'hero__fx'; fx.setAttribute('aria-hidden', 'true');
    var inn = document.createElement('div'); inn.className = 'hero__fxin'; fx.appendChild(inn); media.appendChild(fx);
    // okna: nakładka „zgaszonego” okna i ciepłego rozbłysku, każde w swoim rytmie
    WIN.forEach(function (w, i) {
      var d = document.createElement('i'); d.className = 'hfx-win';
      d.style.cssText = 'left:' + w[0] + 'px;top:' + w[1] + 'px;width:' + w[2] + 'px;height:' + w[3] + 'px;animation-duration:' + (48 + (i * 7.3) % 40).toFixed(1) + 's;animation-delay:-' + ((i * 11.7) % 80).toFixed(1) + 's';
      if (i % 3 === 0) d.classList.add('hfx-win--warm');
      inn.appendChild(d);
    });
    // klucz ptaków na tle nieba
    var birds = document.createElement('div'); birds.className = 'hfx-birds';
    [[0, 0, 1], [-46, 18, .9], [-92, 34, .85], [-40, -16, .92], [-86, -30, .8], [-138, 48, .75], [-128, -44, .78]].forEach(function (b, k) {
      var s = document.createElement('span'); s.className = 'hfx-bird'; s.style.cssText = 'left:' + b[0] + 'px;top:' + b[1] + 'px;transform:scale(' + b[2] + ');animation-delay:-' + (k * .13).toFixed(2) + 's';
      s.innerHTML = '<svg viewBox="0 0 40 16"><path d="M0 9 Q10 0 20 8 Q30 0 40 9 Q30 4 20 12 Q10 4 0 9Z"/></svg>'; birds.appendChild(s);
    });
    inn.appendChild(birds);
    // prawdziwe auta z wizualizacji: w miejscu postoju łata jezdni, a samo auto (wycięte z obrazu) powoli jedzie swoim pasem
    [['a', 1715, 928, 108, 66], ['b', 1849, 868, 92, 62]].forEach(function (c) {
      var road = document.createElement('img'); road.className = 'hfx-road'; road.src = 'assets/img/hero-droga-' + c[0] + '.webp?v=2'; road.alt = '';
      road.style.cssText = 'left:' + c[1] + 'px;top:' + c[2] + 'px;width:' + c[3] + 'px;height:' + c[4] + 'px'; inn.appendChild(road);
      var car = document.createElement('img'); car.className = 'hfx-auto hfx-auto--' + c[0]; car.src = 'assets/img/hero-auto-' + c[0] + '.webp?v=2'; car.alt = '';
      car.style.cssText = 'left:' + c[1] + 'px;top:' + c[2] + 'px;width:' + c[3] + 'px;height:' + c[4] + 'px'; inn.appendChild(car);
    });
    function fit() {
      var W = media.clientWidth, H = media.clientHeight, s = Math.max(W / IW, H / IH);
      var op = getComputedStyle(img).objectPosition.split(' ').map(function (v) { return parseFloat(v) / 100; });
      var x = (W - IW * s) * (isNaN(op[0]) ? .5 : op[0]), y = (H - IH * s) * (isNaN(op[1]) ? .5 : op[1]);
      inn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(5) + ')';
    }
    fit(); window.addEventListener('resize', fit);
    // poza ekranem animacje stoją
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { fx.classList.toggle('is-paused', !e[0].isIntersecting); }).observe(media);
  })();

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();




})();
