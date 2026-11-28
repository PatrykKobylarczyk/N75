/* Szkic N75 rysowany węglem: prawdziwy rysunek pojawia się płynnie kreska po kresce, w jednym ciągu ręki,
   a nad kreską delikatnie przesuwa się konturowy ołówek. Kreski: assets/data/szkic-n75-kreski.json (z samego rysunku). */
(function () {
  'use strict';
  var img = document.querySelector('.arka__bg'); if (!img || !window.IntersectionObserver) return;
  var host = img.parentElement;
  var view = document.createElement('canvas'); view.className = 'olowek-cv'; view.setAttribute('aria-hidden', 'true');
  var pencil = document.createElement('div'); pencil.className = 'olowek'; pencil.setAttribute('aria-hidden', 'true');
  pencil.innerHTML = '<svg viewBox="0 0 80 16" aria-hidden="true"><defs><filter id="wg-f" x="-5%" y="-30%" width="110%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.25"/><feComposite in="SourceGraphic" operator="in"/></filter></defs><path filter="url(#wg-f)" fill="currentColor" d="M2 5.2 L5 3.4 Q8 2.6 12 2.9 L74 2.4 Q78 2.6 78.6 5 L78.8 11 Q78.2 13.4 74 13.5 L12 13.2 Q7.5 13.3 4.6 12.2 L1.6 10.4 Q.6 7.8 2 5.2 Z"/><path d="M14 4.3 L72 3.9" stroke="#fff" stroke-opacity=".12" stroke-width=".8"/></svg>';
  img.style.opacity = '0';
  host.appendChild(view); host.appendChild(pencil);
  var src = new Image(); src.src = img.currentSrc || img.src;
  Promise.all([fetch('assets/data/szkic-n75-kreski.json').then(function (r) { return r.json(); }), new Promise(function (ok) { if (src.complete) ok(); else src.onload = ok; })]).then(function (R) {
    var D = R[0], W = D.w, H = D.h, Q = 2;    // płótna w połowie rozdzielczości rysunku – płynnie i ostro
    view.width = W / Q; view.height = H / Q;
    var mask = document.createElement('canvas'); mask.width = W / Q; mask.height = H / Q;
    var mx = mask.getContext('2d'), vx = view.getContext('2d');
    mx.lineCap = 'round'; mx.lineJoin = 'round'; mx.strokeStyle = '#000'; mx.lineWidth = 15 / Q; mx.shadowColor = '#000'; mx.shadowBlur = 6 / Q;
    // Kreski jako ruchy ręki: każda kreska z własnym przyspieszeniem i wyhamowaniem, między kreskami węgiel unosi się i przenosi łukiem
    var K = D.p.map(function (d) {
      var n = d.slice(1).trim().split(/\s+/).map(Number), P = [], C = [0];
      for (var i = 0; i < n.length; i += 2) { P.push([n[i], n[i + 1]]); if (i) C.push(C[C.length - 1] + Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1])); }
      return { P: P, C: C, L: C[C.length - 1] };
    });
    var TL = [], T = 0;   // oś czasu w umownych jednostkach: rysowanie ~ długość, przeniesienie ~ odległość (szybciej, w powietrzu)
    K.forEach(function (k, i) {
      TL.push({ k: i, t0: T, d: k.L + 6 }); T += k.L + 6;
      if (i + 1 < K.length) { var a = k.P[k.P.length - 1], b = K[i + 1].P[0], g = Math.hypot(b[0] - a[0], b[1] - a[1]); TL.push({ m: [a, b], t0: T, d: 4 + g * .3, g: g }); T += 4 + g * .3; }
    });
    var at = function (k, l) {   // punkt na kresce w odległości l
      var C = k.C, P = k.P, j = 1; while (j < C.length - 1 && C[j] < l) j++;
      var f = C[j] > C[j - 1] ? (l - C[j - 1]) / (C[j] - C[j - 1]) : 0; f = Math.max(0, Math.min(1, f));
      return [P[j - 1][0] + (P[j][0] - P[j - 1][0]) * f, P[j - 1][1] + (P[j][1] - P[j - 1][1]) * f];
    };
    var sm = function (x) { return x * x * (3 - 2 * x); };
    var DUR = 9000, t0 = 0, ended = false, ti = 0, drawn = [], lift = 0, ang = -38, px = 0, py = 0, first = true;
    var cs = getComputedStyle(img);
    var sync = function () {   // płótno dokładnie w miejscu obrazka (to samo położenie i parallax)
      var r = img.getBoundingClientRect(), h = host.getBoundingClientRect();
      view.style.left = (r.left - h.left) + 'px'; view.style.top = (r.top - h.top) + 'px'; view.style.width = r.width + 'px'; view.style.height = r.height + 'px';
      return r;
    };
    var baseOp = (function () { img.style.opacity = ''; var o = getComputedStyle(img).opacity; img.style.opacity = '0'; return o; })();
    var strokeTo = function (k, l) {   // dorysuj kreskę k do długości l
      var from = drawn[k] || 0; if (l <= from) return;
      var o = K[k], st = Math.max(2, (l - from) / 12);
      mx.beginPath(); var p0 = at(o, from); mx.moveTo(p0[0] / Q, p0[1] / Q);
      for (var x = from + st; x < l; x += st) { var q = at(o, x); mx.lineTo(q[0] / Q, q[1] / Q); }
      var pe = at(o, l); mx.lineTo(pe[0] / Q, pe[1] / Q); mx.stroke(); drawn[k] = l;
    };
    var frame = function (now) {
      if (ended) return;
      if (!t0) t0 = now;
      var u = Math.min(1, (now - t0) / DUR), tt = T * (.5 * u + .5 * sm(u));   // spokojny start i koniec, środek równym tempem
      var tipX, tipY, wantLift = 0;
      while (ti < TL.length - 1 && TL[ti].t0 + TL[ti].d <= tt) { if (TL[ti].k !== undefined) strokeTo(TL[ti].k, K[TL[ti].k].L); ti++; }
      var e = TL[ti], f = Math.max(0, Math.min(1, (tt - e.t0) / e.d));
      if (e.k !== undefined) { var l = K[e.k].L * sm(f); strokeTo(e.k, l); var p = at(K[e.k], l); tipX = p[0]; tipY = p[1]; }
      else { var a = e.m[0], b = e.m[1], g = sm(f); tipX = a[0] + (b[0] - a[0]) * g; tipY = a[1] + (b[1] - a[1]) * g; wantLift = Math.min(1, e.g / 60) * Math.sin(Math.PI * f); }
      vx.globalCompositeOperation = 'copy'; vx.drawImage(mask, 0, 0);
      vx.globalCompositeOperation = 'source-in'; vx.drawImage(src, 0, 0, W / Q, H / Q);
      var r = sync(), k = r.width / W, h = host.getBoundingClientRect();
      view.style.opacity = baseOp;
      if (first) { px = tipX; py = tipY; first = false; }
      var dx = tipX - px, dy = tipY - py;
      px += dx * .55; py += dy * .55;                    // lekko wygładzone, bez opóźnienia
      lift += (wantLift - lift) * .25;
      var sp = Math.hypot(dx, dy);
      if (sp > .5) ang += ((-38 + 9 * Math.max(-1, Math.min(1, dx / (sp + 4)))) - ang) * .06;   // nadgarstek lekko podąża za kierunkiem ruchu
      var trem = Math.sin(now / 37) * .25 + Math.sin(now / 23) * .15;   // drobne drżenie dłoni
      pencil.style.transform = 'translate(' + (r.left - h.left + px * k + trem).toFixed(1) + 'px,' + (r.top - h.top + py * k - lift * 7).toFixed(1) + 'px) rotate(' + ang.toFixed(1) + 'deg) scale(' + (1 + lift * .05).toFixed(3) + ')';
      pencil.style.filter = 'drop-shadow(' + (1 + lift * 3).toFixed(1) + 'px ' + (1 + lift * 5).toFixed(1) + 'px ' + (1 + lift * 3).toFixed(1) + 'px rgba(0,0,0,' + (.18 - lift * .1).toFixed(2) + '))';
      if (u >= 1) { K.forEach(function (o, i) { strokeTo(i, o.L); }); vx.globalCompositeOperation = 'copy'; vx.drawImage(mask, 0, 0); vx.globalCompositeOperation = 'source-in'; vx.drawImage(src, 0, 0, W / Q, H / Q);
        ended = true; pencil.classList.add('is-off'); img.style.transition = 'opacity 1.2s'; img.style.opacity = ''; view.style.transition = 'opacity 1.2s'; setTimeout(function () { view.style.opacity = '0'; }, 50); setTimeout(function () { view.remove(); pencil.remove(); }, 1400); return; }
      requestAnimationFrame(frame);
    };
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); pencil.classList.add('is-on'); requestAnimationFrame(frame); } }, { threshold: .3 });
    io.observe(img);
  }).catch(function () { img.style.opacity = ''; view.remove(); pencil.remove(); });
})();
