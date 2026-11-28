/* Szkic N75 rysowany ołówkiem: prawdziwy rysunek pojawia się płynnie kreska po kresce, w jednym ciągu ręki,
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
    var segs = [];
    D.p.forEach(function (d) { var n = d.slice(1).trim().split(/\s+/).map(Number); for (var i = 2; i < n.length; i += 2) segs.push([n[i - 2], n[i - 1], n[i], n[i + 1], Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1])]); });
    var total = segs.reduce(function (t, s) { return t + s[4]; }, 0), DUR = 9000, done = 0, si = 0, pos = 0, t0 = 0, ended = false;
    var px = 0, py = 0, tx = 0, ty = 0;
    var cs = getComputedStyle(img);
    var sync = function () {   // płótno dokładnie w miejscu obrazka (ta sama przezroczystość, położenie i parallax)
      var r = img.getBoundingClientRect(), h = host.getBoundingClientRect();
      view.style.left = (r.left - h.left) + 'px'; view.style.top = (r.top - h.top) + 'px'; view.style.width = r.width + 'px'; view.style.height = r.height + 'px';
      view.style.opacity = cs.opacity === '0' ? (img.dataset.op || '1') : cs.opacity;
      return r;
    };
    img.dataset.op = getComputedStyle(img).getPropertyValue('--op') || '';
    var baseOp = (function () { img.style.opacity = ''; var o = getComputedStyle(img).opacity; img.style.opacity = '0'; return o; })();
    var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var frame = function (now) {
      if (ended) return;
      if (!t0) t0 = now;
      var target = total * ease(Math.min(1, (now - t0) / DUR));
      mx.beginPath();
      while (done < target && si < segs.length) {
        var s = segs[si], take = Math.min(s[4] - pos, target - done), f0 = pos / s[4], f1 = (pos + take) / s[4];
        mx.moveTo((s[0] + (s[2] - s[0]) * f0) / Q, (s[1] + (s[3] - s[1]) * f0) / Q);
        tx = s[0] + (s[2] - s[0]) * f1; ty = s[1] + (s[3] - s[1]) * f1;
        mx.lineTo(tx / Q, ty / Q);
        pos += take; done += take; if (pos >= s[4] - 1e-6) { si++; pos = 0; }
      }
      mx.stroke();
      vx.globalCompositeOperation = 'copy'; vx.drawImage(mask, 0, 0);
      vx.globalCompositeOperation = 'source-in'; vx.drawImage(src, 0, 0, W / Q, H / Q);
      var r = sync(), k = r.width / W, h = host.getBoundingClientRect();
      view.style.opacity = baseOp;
      px += (tx - px) * .18; py += (ty - py) * .18;   // ołówek płynie za kreską, bez skoków
      pencil.style.transform = 'translate(' + (r.left - h.left + px * k).toFixed(1) + 'px,' + (r.top - h.top + py * k).toFixed(1) + 'px) rotate(' + (-38 + Math.sin(now / 420) * 4).toFixed(1) + 'deg)';
      if (done >= total - .5) { ended = true; pencil.classList.add('is-off'); img.style.transition = 'opacity 1.2s'; img.style.opacity = ''; view.style.transition = 'opacity 1.2s'; setTimeout(function () { view.style.opacity = '0'; }, 50); setTimeout(function () { view.remove(); pencil.remove(); }, 1400); return; }
      requestAnimationFrame(frame);
    };
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); px = segs[0][0]; py = segs[0][1]; pencil.classList.add('is-on'); requestAnimationFrame(frame); } }, { threshold: .3 });
    io.observe(img);
  }).catch(function () { img.style.opacity = ''; view.remove(); pencil.remove(); });
})();
