/* Szkic N75 rysowany ołówkiem: prawdziwy rysunek odsłania się kreska po kresce, za grafitem podąża ołówek.
   Kreski (kolejność i przebieg) z assets/data/szkic-n75-kreski.json – wyznaczone z samego rysunku.
   Odsłanianie: maska CSS z małego płótna (szybkie), więc obraz zachowuje swój wygląd, położenie i parallax. */
(function () {
  'use strict';
  var img = document.querySelector('.arka__bg'); if (!img || !window.IntersectionObserver) return;
  var host = img.parentElement, M = 4;   // maska 4× mniejsza od rysunku
  var setMask = function (v) { img.style.webkitMaskImage = v; img.style.maskImage = v; img.style.webkitMaskSize = '100% 100%'; img.style.maskSize = '100% 100%'; };
  setMask('linear-gradient(transparent, transparent)');
  var pencil = document.createElement('div'); pencil.className = 'olowek'; pencil.setAttribute('aria-hidden', 'true');
  pencil.innerHTML = '<svg viewBox="0 0 160 24"><path d="M0 12 L18 6 L18 18 Z" fill="#3b3833"/><path d="M6 10 L18 6 L18 18 L6 14 Z" fill="#d9b98c"/><rect x="18" y="6" width="112" height="12" fill="#c9a24a"/><rect x="18" y="6" width="112" height="4" fill="#ddb95c"/><rect x="130" y="5" width="12" height="14" fill="#b8b4ad"/><rect x="142" y="5" width="16" height="14" rx="3" fill="#c96f6a"/></svg>';
  host.appendChild(pencil);
  fetch('assets/data/szkic-n75-kreski.json').then(function (r) { return r.json(); }).then(function (D) {
    var W = D.w, H = D.h, cv = document.createElement('canvas'); cv.width = Math.ceil(W / M); cv.height = Math.ceil(H / M);
    var cx = cv.getContext('2d'); cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#000'; cx.lineWidth = 16 / M;
    // kreski jako listy punktów + długości
    var S = D.p.map(function (d) { var n = d.slice(1).trim().split(/\s+/).map(Number), p = []; for (var i = 0; i < n.length; i += 2) p.push([n[i], n[i + 1]]); return p; });
    var segs = []; S.forEach(function (p, k) { for (var i = 1; i < p.length; i++) segs.push({ a: p[i - 1], b: p[i], l: Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]), s: k, first: i === 1 }); });
    var total = segs.reduce(function (t, s) { return t + s.l; }, 0), DUR = Math.min(9000, Math.max(6000, total / 4.5)), done = 0, si = 0, segPos = 0, t0 = 0, last = 0, ended = false;
    var place = function (x, y, ang) {
      var r = img.getBoundingClientRect(), hr = host.getBoundingClientRect(), k = r.width / W;
      pencil.style.transform = 'translate(' + (r.left - hr.left + x * k).toFixed(1) + 'px,' + (r.top - hr.top + y * k).toFixed(1) + 'px) rotate(' + ang.toFixed(1) + 'deg)';
    };
    var finish = function () {
      ended = true; pencil.classList.add('is-off');
      img.style.transition = 'none'; setMask('none'); img.classList.add('is-drawn');
    };
    var frame = function (now) {
      if (ended) return;
      if (!t0) t0 = now;
      var target = Math.min(total, (now - t0) / DUR * total), tip = null;
      cx.beginPath();
      while (done < target && si < segs.length) {
        var s = segs[si], take = Math.min(s.l - segPos, target - done), f0 = segPos / s.l, f1 = (segPos + take) / s.l;
        var x0 = s.a[0] + (s.b[0] - s.a[0]) * f0, y0 = s.a[1] + (s.b[1] - s.a[1]) * f0, x1 = s.a[0] + (s.b[0] - s.a[0]) * f1, y1 = s.a[1] + (s.b[1] - s.a[1]) * f1;
        cx.moveTo(x0 / M, y0 / M); cx.lineTo(x1 / M, y1 / M);
        tip = [x1, y1, s.b[0] - s.a[0], s.b[1] - s.a[1]];
        segPos += take; done += take; if (segPos >= s.l - 1e-6) { si++; segPos = 0; }
      }
      cx.stroke();
      if (tip) { var ang = -58 + Math.sin(now / 140) * 5; place(tip[0], tip[1], ang); }
      if (now - last > 45 || done >= total) { last = now; setMask('url(' + cv.toDataURL('image/png') + ')'); }
      if (done >= total) { setTimeout(finish, 250); return; }
      requestAnimationFrame(frame);
    };
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); pencil.classList.add('is-on'); requestAnimationFrame(frame); } }, { threshold: .35 });
    io.observe(img);
  }).catch(function () { setMask('none'); pencil.remove(); });
})();
