/* N75 – detale „premium”, ładowane na wszystkich stronach:
   1. typografia: długie napisy wersalikami (ponad ~26 znaków) wracają do zwykłej pisowni – czytelniej na telefonie
   2. kursor-kropka na komputerze (myszka), powiększa się nad linkami i przyciskami
   3. płynne przejścia między stronami (View Transitions; CSS w style.css), bez skryptów zewnętrznych
   4. Vercel Web Analytics i Speed Insights – pomiar bez cookies (działa po włączeniu w panelu Vercel) */
(function () {
  'use strict';
  var d = document, w = window;

  /* 1. długie wersaliki → zwykła pisownia */
  var SEL = '.caps, .h2-kicker, .hero__kicker, .vw__sub, .eyebrow';
  var mark = function (root) {
    (root.querySelectorAll ? root : d).querySelectorAll(SEL).forEach(function (e) {
      if (e.closest('button, .btn, nav, .header, .chips, .view, th, .status, .caps-keep')) return;
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      e.classList.toggle('caps-long', t.length > 26);
    });
  };
  var go = function () { mark(d); };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', go); else go();
  w.addEventListener('load', go);
  var mt; new MutationObserver(function () { clearTimeout(mt); mt = setTimeout(go, 120); }).observe(d.documentElement, { childList: true, subtree: true, characterData: true });

  /* 2. kursor-kropka (tylko precyzyjny wskaźnik, bez ograniczonego ruchu) */
  if (w.matchMedia && matchMedia('(pointer: fine) and (hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var dot = d.createElement('div'); dot.className = 'cdot'; dot.setAttribute('aria-hidden', 'true');
    var x = -50, y = -50, tx = -50, ty = -50, on = false, raf = 0;
    var loop = function () { x += (tx - x) * .28; y += (ty - y) * .28; dot.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; raf = Math.abs(tx - x) + Math.abs(ty - y) > .3 ? requestAnimationFrame(loop) : 0; };
    d.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY; if (!on) { on = true; d.body.appendChild(dot); x = tx; y = ty; }
      var hot = e.target.closest && e.target.closest('a, button, [role="button"], select, label, input, .tile, tr[data-id], canvas');
      dot.classList.toggle('is-hot', !!hot); dot.classList.toggle('is-dark', !!(e.target.closest && e.target.closest('.section--dark, .hero, .values, footer, .footer')));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    d.addEventListener('mouseleave', function () { dot.classList.add('is-off'); });
    d.addEventListener('mouseenter', function () { dot.classList.remove('is-off'); });
  }

  /* 4. Vercel Web Analytics + Speed Insights (bez cookies, nie wymagają zgody) */
  if (!/^(localhost|127\.)/.test(location.hostname)) {
    w.va = w.va || function () { (w.vaq = w.vaq || []).push(arguments); };
    w.si = w.si || function () { (w.siq = w.siq || []).push(arguments); };
    [['/_vercel/insights/script.js'], ['/_vercel/speed-insights/script.js']].forEach(function (s) { var e = d.createElement('script'); e.defer = true; e.src = s[0]; d.head.appendChild(e); });
    // zdarzenia (formularz, telefon, karta lokalu…) również do Vercel Analytics
    var prev = w.N75Track;
    if (prev) w.N75Track = function (ev, p) { prev(ev, p); try { var o = {}; for (var k in p) if (p[k] != null && p[k] !== '') o[k] = String(p[k]).slice(0, 255); w.va('event', { name: ev, data: o }); } catch (e) {} };
  }
})();
