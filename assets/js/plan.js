/* Interaktywny rzut piętra: obrysy lokali na oczyszczonym rzucie, podświetlenie i przybliżenie wybranego lokalu.
   Używany na stronie głównej (makieta) i w karcie mieszkania. Dane: window.N75_UNITS (shape, label). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1504, H = 1925;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function pathD(pts) { return 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join('L') + 'Z'; }
  function box(list) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    list.forEach(function (pts) {
      pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    });
    return [x0, y0, x1 - x0, y1 - y0];
  }
  function pad(b, k, minW) {
    var w = Math.max(b[2], minW || 0), h = b[3];
    var cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
    w *= 1 + k; h *= 1 + k;
    return [cx - w / 2, cy - h / 2, w, h];
  }
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* opts: floor, units, href(u), current (id lokalu zaznaczonego na stałe), onPick(u, ev) */
  function create(container, opts) {
    var f = String(opts.floor);
    var list = opts.units.filter(function (u) { return u.shape && u.shape[f]; });
    var full = pad(box(list.map(function (u) { return u.shape[f]; })), .06);
    var vb = full.slice(), anim = null, zoomed = null;

    var svg = el('svg', { class: 'pl', viewBox: vb.join(' '), preserveAspectRatio: 'xMidYMid meet', role: 'group', 'aria-label': 'Rzut piętra ' + f });
    svg.style.aspectRatio = (full[2] / full[3]).toFixed(4);
    el('image', { href: 'assets/img/plany/pietro-' + f + '.webp', x: 0, y: 0, width: W, height: H, class: 'pl-img' }, svg);
    // wersja szczegółowa (z meblami) do widoku pojedynczego lokalu; ładowana przy pierwszym przybliżeniu
    var detail = el('image', { x: 0, y: 0, width: 0, height: 0, class: 'pl-img pl-img--detal', preserveAspectRatio: 'none' }, svg);
    // wycinek z meblami w wysokiej rozdzielczości, osobny dla każdego lokalu
    function loadDetail(u) {
      var c = u.crop && u.crop[f]; if (!c) return;
      detail.classList.remove('is-ready');
      detail.onload = function () { detail.classList.add('is-ready'); };
      detail.setAttribute('x', c[0]); detail.setAttribute('y', c[1]); detail.setAttribute('width', c[2]); detail.setAttribute('height', c[3]);
      detail.setAttribute('href', 'assets/img/plany/lokale/' + u.id + '-' + f + '.webp');
    }
    var g = el('g', { class: 'pl-units' }, svg);
    var dim = el('path', { class: 'pl-dim', 'fill-rule': 'evenodd', d: '' }, svg);
    var ring = el('path', { class: 'pl-ring', d: '' }, svg);
    var nodes = {};

    list.forEach(function (u) {
      var a = el('a', { href: opts.href(u), class: 'pl-unit pl-unit--' + u.status + (u.id === opts.current ? ' is-current' : ''), 'data-id': u.id, 'aria-label': u.id + ', ' + String(u.area).replace('.', ',') + ' m²' }, g);
      el('path', { d: pathD(u.shape[f]) }, a);
      var lp = (u.label && u.label[f]) || [0, 0];
      var t = el('text', { x: lp[0], y: lp[1], class: 'pl-label' }, a);
      t.textContent = u.id;
      if (opts.onPick) a.addEventListener('click', function (ev) { opts.onPick(u, ev); });
      nodes[u.id] = a;
    });
    container.appendChild(svg);

    function setVB(v) { vb = v; svg.setAttribute('viewBox', v.join(' ')); }
    function animate(to, ms) {
      if (anim) cancelAnimationFrame(anim);
      var from = vb.slice(), t0 = null;
      if (!ms) { setVB(to); return; }
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / ms), e = ease(k);
        setVB(from.map(function (v, i) { return v + (to[i] - v) * e; }));
        if (k < 1) anim = requestAnimationFrame(step);
      }
      anim = requestAnimationFrame(step);
    }

    var api = {
      svg: svg,
      highlight: function (id, on) { if (nodes[id]) nodes[id].classList.toggle('is-hl', on); },
      zoomTo: function (id, ms) {
        var u = list.filter(function (x) { return x.id === id; })[0];
        if (!u) return;
        zoomed = id;
        loadDetail(u);
        var pts = u.shape[f];
        // tło poza lokalem wygaszone: prostokąt z „dziurą” w kształcie lokalu
        dim.setAttribute('d', 'M-2000 -2000H' + (W + 2000) + 'V' + (H + 2000) + 'H-2000Z' + pathD(pts));
        ring.setAttribute('d', pathD(pts));
        svg.classList.add('is-zoomed');
        Object.keys(nodes).forEach(function (k) { nodes[k].classList.toggle('is-sel', k === id); });
        animate(pad(box([pts]), .22, full[2] * .28), ms === undefined ? 700 : ms);
      },
      zoomOut: function (ms) {
        zoomed = null;
        svg.classList.remove('is-zoomed');
        Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove('is-sel'); });
        animate(full, ms === undefined ? 600 : ms);
        setTimeout(function () { if (!zoomed) { dim.setAttribute('d', ''); ring.setAttribute('d', ''); } }, ms === undefined ? 600 : ms);
      },
      zoomed: function () { return zoomed; }
    };
    return api;
  }

  window.N75Plan = { create: create };
})();
