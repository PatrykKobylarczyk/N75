/* Makieta 3D N75 – styl „miasto”: prawdziwe otoczenie (Google Photorealistic 3D Tiles, CesiumJS) + bryła N75 z projektu */
(function () {
  'use strict';
  var KEY = 'AIzaSyC9McZpolsNuNLOGMCudONnMD2HkpK-awU';
  var root = document.getElementById('mk3d'); if (!root || !window.Cesium) return;
  var C = window.Cesium;
  var UNITS = {}; (window.N75_UNITS || []).forEach(function (u) { UNITS[u.id] = u; });
  var FMT = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var NAMES = ['Parter', '1. piętro', '2. piętro', '3. piętro', '4. piętro', '5. piętro', '6. piętro', '7. piętro'];
  // układ makiety (x, z; z = na południe, osie obrócone o 8,4°) -> geografia
  var ANG = 8.4 * Math.PI / 180, NORTH = [Math.sin(ANG), -Math.cos(ANG)], EAST = [Math.cos(ANG), Math.sin(ANG)];
  var LAT0 = 51.7721981, LON0 = 19.4770487, MLAT = 110574, MLON = 111320 * Math.cos(LAT0 * Math.PI / 180);
  var H0 = 239;   // wysokość terenu (elipsoida); doprecyzowana z kafli Google
  function en(x, z) { return [x * Math.cos(ANG) + z * Math.sin(ANG), x * Math.sin(ANG) - z * Math.cos(ANG)]; }
  function ll(x, z) { var e = en(x, z); return [LON0 + e[0] / MLON, LAT0 + e[1] / MLAT]; }
  function P3(x, z, h) { var g = ll(x, z); return C.Cartesian3.fromDegrees(g[0], g[1], H0 + h); }
  function ring(P, h) { var a = []; P.forEach(function (p) { var g = ll(p[0], p[1]); a.push(g[0], g[1], H0 + (h || 0)); }); return C.Cartesian3.fromDegreesArrayHeights(a); }
  function inside(p, P) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

  var cz = root.querySelector('.mk3d__cz'), credits = root.querySelector('.mk3d__credits'), msg = root.querySelector('.mk3d__msg');
  var tip = root.querySelector('.mk3d__tip'), panel = root.querySelector('.mk3d__floors'), card = root.querySelector('.mk3d__card'), comp = root.querySelector('.mk3d__compass');
  var viewer = new C.Viewer(cz, {
    globe: false, baseLayer: false, baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false,
    animation: false, timeline: false, fullscreenButton: false, infoBox: false, selectionIndicator: false, creditContainer: credits,
    requestRenderMode: true, maximumRenderTimeChange: Infinity, msaaSamples: 4
  });
  var scene = viewer.scene, cam = viewer.camera, E = viewer.entities;
  scene.screenSpaceCameraController.enableInputs = false;
  scene.backgroundColor = C.Color.fromCssColorString('#e9e3d8');
  scene.skyAtmosphere.show = true; if (scene.fog) scene.fog.enabled = true;
  viewer.clock.currentTime = C.JulianDate.fromIso8601('2026-09-22T13:30:00Z'); viewer.clock.shouldAnimate = false;
  scene.light = new C.SunLight();
  function req() { scene.requestRender(); }

  /* ---------- kafle Google ---------- */
  var tiles = null, D = null;
  C.GoogleMaps.defaultApiKey = KEY;
  function fail(e) { console.error('[N75 miasto]', e); if (msg) { msg.hidden = false; msg.textContent = 'Nie udało się wczytać prawdziwego otoczenia (Google Map Tiles). Pokazuję sam budynek.'; } root.classList.add('is-ready'); }
  function loadTiles() {
    var pr;
    try { pr = C.createGooglePhotorealistic3DTileset(undefined, { showCreditsOnScreen: true, maximumScreenSpaceError: 8 }); } catch (e) { pr = Promise.reject(e); }
    return pr.then(function (ts) {
      tiles = ts; scene.primitives.add(ts);
      ts.tileFailed.addEventListener(function (e) { console.warn('[N75 miasto] tile', e && e.message); });
      clip();
      return ts;
    });
  }
  function clip() {   // wycięcie z kafli obecnego stanu działki – dokładnie po obrysach pięter N75 (bez zapasu, żeby nie odsłonić szczeliny przy sąsiadach)
    if (!tiles || !D || !C.ClippingPolygonCollection) return;
    var polys = [];
    D.floors.forEach(function (fl) { fl.slab.forEach(function (P) { if (P.length > 2) polys.push(new C.ClippingPolygon({ positions: ring(P, 0) })); }); });
    try { tiles.clippingPolygons = new C.ClippingPolygonCollection({ polygons: polys }); } catch (e) { console.warn('[N75 miasto] clip', e); }
  }
  function hull(P) {
    P = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [];
    P.forEach(function (p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function ground() {   // wysokość ulicy wokół budynku z kafli
    if (!tiles || !scene.sampleHeightMostDetailed) return Promise.resolve(null);
    var pts = [[0, -34], [0, 34], [-40, 0], [40, 0], [-20, -30], [20, -30]].map(function (p) { var g = ll(p[0], p[1]); return C.Cartographic.fromDegrees(g[0], g[1]); });
    var t = new Promise(function (r) { setTimeout(function () { r(null); }, 12000); });
    return Promise.race([scene.sampleHeightMostDetailed(pts), t]).then(function (r) {
      if (!r) return null; var hs = r.map(function (c) { return c && c.height; }).filter(function (h) { return isFinite(h) && h > 100 && h < 400; }).sort(function (a, b) { return a - b; });
      return hs.length ? hs[Math.floor(hs.length / 3)] : null;
    }).catch(function () { return null; });
  }

  /* ---------- bryła N75 ---------- */
  var COL = { mass: C.Color.fromCssColorString('#ece5d8'), slab: C.Color.fromCssColorString('#cfc5b4'), glass: C.Color.fromCssColorString('#8fa3b0').withAlpha(0.9), roof: C.Color.fromCssColorString('#8d8a86'),
    wolne: C.Color.fromCssColorString('#b08d57').withAlpha(0.7), zarezerwowane: C.Color.fromCssColorString('#9a958c').withAlpha(0.65), sprzedane: C.Color.fromCssColorString('#6c665e').withAlpha(0.6), hov: C.Color.fromCssColorString('#d8b77a').withAlpha(0.85), wall: C.Color.fromCssColorString('#f4efe6').withAlpha(0.9) };
  var FL = [], UN = [], SEL = -1, HOVER = null;
  function add(o, f, kind, id) { var e = E.add(o); e.n75 = { f: f, k: kind, id: id }; return e; }
  function build() {
    E.removeAll(); FL = D.floors.map(function () { return { full: [], cut: [] }; }); UN = [];
    var top = D.floors.length - 1;
    D.floors.forEach(function (fl, f) {
      var z0 = +fl.z0, z1 = +fl.z1, isTop = f === top;
      (fl.mass || []).forEach(function (m) {
        FL[f].full.push(add({ polygon: { hierarchy: ring(m.p, 0), height: H0 + z0 + 0.02, extrudedHeight: H0 + z1 - (isTop ? 0 : 0.32), material: COL.mass, perPositionHeight: false } }, f, 'm'));
        if (!isTop) FL[f].full.push(add({ polygon: { hierarchy: ring(m.p, 0), height: H0 + z1 - 0.32, extrudedHeight: H0 + z1, material: COL.slab } }, f, 'm'));
        else FL[f].full.push(add({ polygon: { hierarchy: ring(m.p, 0), height: H0 + z1, extrudedHeight: H0 + z1 + 0.05, material: COL.roof } }, f, 'm'));
        // przeszklenia (odcinki szyb na krawędziach bryły)
        var P = m.p;
        for (var i = 0; i < P.length; i++) {
          var a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
          var n = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (inside([mid[0] + n[0] * 0.2, mid[1] + n[1] * 0.2], P)) n = [-n[0], -n[1]];
          ((m.g || [])[i] || []).forEach(function (iv) {
            if ((iv[1] - iv[0]) * l < 0.4) return;
            var s = [a[0] + (b[0] - a[0]) * iv[0] + n[0] * 0.04, a[1] + (b[1] - a[1]) * iv[0] + n[1] * 0.04], t = [a[0] + (b[0] - a[0]) * iv[1] + n[0] * 0.04, a[1] + (b[1] - a[1]) * iv[1] + n[1] * 0.04];
            FL[f].full.push(add({ wall: { positions: [P3(s[0], s[1], 0), P3(t[0], t[1], 0)], minimumHeights: [H0 + z0 + 0.12, H0 + z0 + 0.12], maximumHeights: [H0 + z1 - 0.45, H0 + z1 - 0.45], material: COL.glass } }, f, 'm'));
          });
        }
      });
      // przekrój piętra: płyta, niskie ściany obrysu, lokale
      fl.slab.forEach(function (P) { FL[f].cut.push(add({ show: false, polygon: { hierarchy: ring(P, 0), height: H0 + z0 - 0.3, extrudedHeight: H0 + z0, material: COL.slab } }, f, 'c')); });
      (fl.mass || []).forEach(function (m) { FL[f].cut.push(add({ show: false, wall: { positions: ring(m.p.concat([m.p[0]]), 0), minimumHeights: m.p.concat([m.p[0]]).map(function () { return H0 + z0; }), maximumHeights: m.p.concat([m.p[0]]).map(function () { return H0 + z0 + 1.1; }), material: COL.wall } }, f, 'c')); });
    });
    Object.keys(D.units).forEach(function (id) {
      D.units[id].forEach(function (L) {
        var fl = D.floors[L.f]; if (!fl) return; var z0 = +fl.z0;
        L.p.forEach(function (P) {
          var e = add({ show: false, polygon: { hierarchy: ring(P, 0), height: H0 + z0 + 0.02, extrudedHeight: H0 + z0 + 0.12, material: col(id) } }, L.f, 'u', id); UN.push(e); FL[L.f].cut.push(e);
        });
        (L.w || []).forEach(function (w) { FL[L.f].cut.push(add({ show: false, wall: { positions: [P3(w[0], w[1], 0), P3(w[2], w[3], 0)], minimumHeights: [H0 + z0 + 0.12, H0 + z0 + 0.12], maximumHeights: [H0 + z0 + 1.6, H0 + z0 + 1.6], material: C.Color.fromCssColorString('#b08d57').withAlpha(0.35) } }, L.f, 'c')); });
      });
    });
    show();
  }
  function col(id) { var u = UNITS[id]; return id === HOVER ? COL.hov : COL[(u && u.status) || 'sprzedane'] || COL.sprzedane; }
  function show() {
    FL.forEach(function (o, f) {
      var full = SEL < 0 || f < SEL, cut = f === SEL;
      o.full.forEach(function (e) { e.show = full; });
      o.cut.forEach(function (e) { e.show = cut; });
    });
    UN.forEach(function (e) { e.polygon.material = col(e.n75.id); });
    req();
  }

  /* ---------- kamera (orbita wokół budynku) ---------- */
  var orb = { h: Math.PI + 0.62, p: -0.42, r: 150, ty: 12 }, VIEW = null;
  function target() { return P3(0, 0, orb.ty); }
  function place() {
    if (VIEW) return;
    cam.frustum.fov = 0.9;
    cam.lookAt(target(), new C.HeadingPitchRange(orb.h, orb.p, orb.r));
    if (comp) comp.style.transform = 'rotate(' + (-orb.h) + 'rad)';
    req();
  }
  var tw = null;
  function tween(to) {
    var from = {}; Object.keys(to).forEach(function (k) { from[k] = orb[k]; }); var t0 = performance.now(); if (tw) cancelAnimationFrame(tw);
    (function step(now) { var k = Math.min(1, (now - t0) / 700), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; Object.keys(to).forEach(function (q) { orb[q] = from[q] + (to[q] - from[q]) * e; }); place(); if (k < 1) tw = requestAnimationFrame(step); else tw = null; })(t0);
  }

  /* ---------- piętra i lokale ---------- */
  function avail(f) { return (window.N75_UNITS || []).filter(function (u) { return (u.levels || [u.floor])[0] === f && u.status === 'wolne'; }).length; }
  function select(f) {
    SEL = f; HOVER = null; card.hidden = true; show();
    panel.querySelectorAll('button[data-f]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.f === f)); });
    tween(f >= 0 ? { ty: +D.floors[f].z0 + 1, p: Math.min(orb.p, -0.85), r: Math.min(orb.r, 85) } : { ty: 12 });
  }
  function pick(x, y) {
    var r = cz.getBoundingClientRect(), o = scene.pick(new C.Cartesian2(x - r.left, y - r.top));
    return o && o.id && o.id.n75 ? o.id.n75 : null;
  }
  function click(x, y) {
    var k = pick(x, y); if (!k) return;
    if (k.k === 'u') { HOVER = k.id; show(); showCard(k.id); return; }
    if (k.k === 'm') { var f = k.f === D.floors.length - 1 ? 6 : k.f; if (f !== SEL) select(f); }
  }
  var hv = 0;
  function hover(x, y) {
    if (VIEW || hv) return; hv = requestAnimationFrame(function () {
      hv = 0; var k = pick(x, y), t = '';
      if (k && k.k === 'u') { var u = UNITS[k.id]; t = k.id + (u ? ' · ' + String(u.area).replace('.', ',') + ' m² · ' + u.status : ''); if (HOVER !== k.id) { HOVER = k.id; show(); } }
      else { if (HOVER && card.hidden) { HOVER = null; show(); } if (k && k.k === 'm' && SEL < 0) { var f = k.f === D.floors.length - 1 ? 6 : k.f; t = NAMES[f] + (avail(f) ? ' · wolne: ' + avail(f) : ''); } }
      cz.style.cursor = t ? 'pointer' : 'grab';
      if (!t) { tip.hidden = true; return; } var r = root.getBoundingClientRect(); tip.textContent = t; tip.hidden = false; tip.style.left = (x - r.left + 14) + 'px'; tip.style.top = (y - r.top + 14) + 'px';
    });
  }

  /* ---------- widok z okna ---------- */
  var DIRS = ['północ', 'płn.-wschód', 'wschód', 'płd.-wschód', 'południe', 'płd.-zachód', 'zachód', 'płn.-zachód'];
  function windows(id) {
    var L = (D.units[id] || []).slice().sort(function (a, b) { return a.f - b.f; })[0]; if (!L) return [];
    var fl = D.floors[L.f], out = [], rej = [];
    (fl.mass || []).forEach(function (e) {
      var P = e.p;
      for (var i = 0; i < P.length; i++) {
        var a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
        var n = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l], m0 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (inside([m0[0] + n[0] * 0.2, m0[1] + n[1] * 0.2], P)) n = [-n[0], -n[1]];
        ((e.g || [])[i] || []).forEach(function (iv) {
          var w = (iv[1] - iv[0]) * l; if (w < 0.6) return;
          var t = (iv[0] + iv[1]) / 2, c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          var own = [1.0, 1.6, 2.4].some(function (d) { var q = [c[0] - n[0] * d, c[1] - n[1] * d]; return L.p.some(function (U) { return inside(q, U); }); });
          if (!own) return;
          var ang = Math.atan2(n[0] * EAST[0] + n[1] * EAST[1], n[0] * NORTH[0] + n[1] * NORTH[1]);
          var di = DIRS[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
          var prev = out.filter(function (o) { return o.dir === di; })[0];
          var op = 30; for (var d = 0.6; d < 30; d += 0.4) { var q = [c[0] + n[0] * d, c[1] + n[1] * d]; if ((fl.mass || []).some(function (E2) { return inside(q, E2.p); }) || (fl.cols || []).some(function (C0) { return inside(q, C0); })) { op = d; break; } }
          var o = { m: c, n: n, w: w, sc: op < 5 ? op : w * Math.min(op, 15), dir: di, y: +fl.z0 + 1.5, head: ang };
          if (op < 5) { rej.push(o); return; }
          if (!prev || prev.sc < o.sc) { out = out.filter(function (q) { return q.dir !== di; }); out.push(o); }
        });
      }
    });
    if (!out.length && rej.length) out = [rej.sort(function (a, b) { return b.sc - a.sc; })[0]];
    var pref = ['północ', 'płn.-wschód', 'płn.-zachód', 'południe', 'płd.-zachód', 'zachód', 'płd.-wschód', 'wschód'];
    return out.sort(function (a, b) { return pref.indexOf(a.dir) - pref.indexOf(b.dir); });
  }
  var wv = null, saved = null;
  function setView() {
    cam.lookAtTransform(C.Matrix4.IDENTITY);
    cam.frustum.fov = 1.25;
    cam.setView({ destination: VIEW.eye, orientation: { heading: VIEW.yaw, pitch: VIEW.pitch, roll: 0 } });
    if (comp) comp.style.transform = 'rotate(' + (-VIEW.yaw) + 'rad)';
    req();
  }
  function windowView(id, k) {
    var W = windows(id); if (!W.length) return;
    k = ((k || 0) % W.length + W.length) % W.length; var w = W[k];
    if (!saved) saved = SEL;
    // pokazujemy cały budynek, żeby z okna było widać sąsiednie skrzydła
    SEL = -1; show();
    VIEW = { eye: P3(w.m[0] + w.n[0] * 0.35, w.m[1] + w.n[1] * 0.35, w.y), yaw: w.head, pitch: -0.05, base: w.head };
    card.hidden = true; root.classList.add('is-window');
    if (!wv) { wv = document.createElement('div'); wv.className = 'mk3d__window'; root.appendChild(wv); }
    var u = UNITS[id];
    wv.innerHTML = '<div class="mk3d__wbar"><span class="caps bronze">Widok z okna</span><b>' + id + ' · ' + NAMES[u ? u.floor : 0] + ' · kierunek: ' + w.dir + '</b>' +
      (W.length > 1 ? '<button type="button" class="mk3d__home caps" data-wn>Inne okno (' + (k + 1) + '/' + W.length + ')</button>' : '') +
      '<button type="button" class="mk3d__home caps" data-wx>Zamknij</button></div><p class="mk3d__whint caps">Przeciągnij, aby rozejrzeć się</p>';
    wv.hidden = false;
    var nb = wv.querySelector('[data-wn]'); if (nb) nb.onclick = function () { windowView(id, k + 1); };
    wv.querySelector('[data-wx]').onclick = function () { VIEW = null; wv.hidden = true; root.classList.remove('is-window'); var s = saved; saved = null; SEL = s; show(); place(); showCard(id); };
    setView();
  }
  function showCard(id) {
    var u = UNITS[id]; if (!u) return;
    card.innerHTML = '<button class="mk3d__cx" type="button" aria-label="Zamknij">×</button><span class="caps bronze">' + NAMES[u.floor] + '</span><h3 class="display">' + id + '</h3>' +
      '<dl><div><dt class="caps">Pokoje</dt><dd>' + u.rooms + '</dd></div><div><dt class="caps">Metraż</dt><dd>' + String(u.area).replace('.', ',') + '&nbsp;m²</dd></div><div><dt class="caps">Cena</dt><dd>' + FMT(u.price) + '&nbsp;zł</dd></div></dl>' +
      '<p class="status status--' + u.status + '">' + u.status + '</p><div class="mk3d__ca"><a class="btn caps" target="_top" href="mieszkanie.html?id=' + encodeURIComponent(id) + '">Karta mieszkania</a>' +
      (window.N75Doll && D.units[id] ? '<button type="button" class="btn btn--ghost caps" data-doll="' + id + '">Wnętrze 3D</button>' : '') +
      (D.units[id] && windows(id).length ? '<button type="button" class="btn btn--ghost caps" data-win="' + id + '">Widok z okna</button>' : '') + '</div>';
    card.hidden = false;
    card.querySelector('.mk3d__cx').onclick = function () { card.hidden = true; HOVER = null; show(); };
    var d = card.querySelector('[data-doll]'); if (d) d.onclick = function () { N75Doll.open(id, id); };
    var wb = card.querySelector('[data-win]'); if (wb) wb.onclick = function () { windowView(id, 0); };
  }

  /* ---------- sterowanie ---------- */
  var pts = {}, moved = 0, pd = null;
  cz.addEventListener('pointerdown', function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0; pd = null; try { cz.setPointerCapture(e.pointerId); } catch (x) {} });
  cz.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) { if (e.pointerType === 'mouse') hover(e.clientX, e.clientY); return; }
    var prev = pts[e.pointerId]; pts[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(pts);
    if (ids.length === 2 && !VIEW) { var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pd) orb.r = Math.min(900, Math.max(30, orb.r * pd / d)); pd = d; moved += 10; place(); return; }
    var dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
    if (VIEW) { VIEW.yaw = Math.max(VIEW.base - 1.2, Math.min(VIEW.base + 1.2, VIEW.yaw - dx * 0.004)); VIEW.pitch = Math.max(-0.6, Math.min(0.5, VIEW.pitch + dy * 0.003)); setView(); return; }
    orb.h -= dx * 0.006; orb.p = Math.max(-1.5, Math.min(-0.04, orb.p - dy * 0.004)); place();
  });
  function up(e) { var was = !!pts[e.pointerId]; delete pts[e.pointerId]; if (Object.keys(pts).length) return; pd = null; if (was && moved < 6 && !VIEW) click(e.clientX, e.clientY); }
  cz.addEventListener('pointerup', up); cz.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; });
  var EMBED = /[?&]embed=1/.test(location.search), ACTIVE = !EMBED;
  if (EMBED) { document.body.classList.add('is-embed'); cz.addEventListener('pointerdown', function () { ACTIVE = true; document.body.classList.add('is-active'); }); document.addEventListener('mouseleave', function () { ACTIVE = false; document.body.classList.remove('is-active'); }); }
  cz.addEventListener('wheel', function (e) { if (!ACTIVE || VIEW) return; e.preventDefault(); orb.r = Math.min(900, Math.max(30, orb.r * Math.exp(e.deltaY * 0.0012))); place(); }, { passive: false });

  var sl0 = root.querySelector('[data-style-link]'); if (sl0) sl0.href = 'makieta.html?' + (EMBED ? 'embed=1&' : '') + 'miasto=1';
  function buildPanel() {
    var h = '<button type="button" class="chip" data-f="-1" aria-pressed="true">Cały budynek</button>';
    for (var f = 6; f >= 0; f--) { var a = avail(f); h += '<button type="button" class="chip" data-f="' + f + '" aria-pressed="false"><b>' + (f === 0 ? 'P' : f) + '</b><span>' + (f === 0 ? 'Parter · usługi' : a ? 'wolne: ' + a : '') + '</span></button>'; }
    panel.innerHTML = h;
    panel.addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (b) select(+b.dataset.f); });
    var sl = root.querySelector('.mk3d__sun input'), out = root.querySelector('.mk3d__sun output');
    if (sl) { var upd = function () { var t = +sl.value; out.textContent = Math.floor(t) + ':' + (t % 1 ? '30' : '00'); viewer.clock.currentTime = C.JulianDate.fromIso8601('2026-09-22T' + ('0' + Math.floor(t - 2)).slice(-2) + ':' + (t % 1 ? '30' : '00') + ':00Z'); req(); }; sl.addEventListener('input', upd); upd(); }
    var home = root.querySelector('[data-home]'); if (home) home.addEventListener('click', function () { select(-1); tween({ h: Math.PI + 0.62, p: -0.42, r: 150, ty: 12 }); });
  }

  fetch(root.dataset.src).then(function (r) { return r.json(); }).then(function (d) {
    D = d; build(); buildPanel(); place();
    loadTiles().then(function () {
      root.classList.add('is-ready'); req();
      return ground().then(function (h) { if (h !== null && Math.abs(h - H0) > 0.3) { H0 = h; build(); clip(); place(); } });
    }).catch(fail);
    var m = /[?&]p=(\d)/.exec(location.search); if (m) select(+m[1]);
  });
  window.N75City = { viewer: viewer, select: select, card: showCard, win: windowView, wins: function (id) { return windows(id); }, orb: orb, place: place, h0: function () { return H0; } };
})();
