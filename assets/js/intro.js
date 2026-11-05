/* Wejście na stronę: logo N75 rysowane kreską (ok. 1,6 s), wypełnienie, potem okrąg otwiera widok (ok. 1,2 s).
   Przy każdym wejściu i odświeżeniu (bez powrotu „wstecz” i przejść z podstron); kliknięcie, klawisz lub przewinięcie pomija. */
(function () {
  'use strict';
  var root = document.documentElement, intro = document.getElementById('intro');
  if (!intro) return;
  if (root.classList.contains('intro-done')) { intro.remove(); return; }
  var done = false, timers = [];
  root.classList.add('intro-on');
  // intro zawsze kończy się na hero: wyłącz przywracanie ostatniej pozycji przewinięcia
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (location.hash) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { if (!done) window.scrollTo(0, 0); });
  window.addEventListener('pageshow', function () { if (!done) window.scrollTo(0, 0); });
  function finish(fast) {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    intro.classList.add(fast ? 'is-skip' : 'is-open');
    root.classList.remove('intro-on');
    setTimeout(function () { intro.remove(); root.classList.add('intro-done'); }, fast ? 450 : 1300);
  }
  requestAnimationFrame(function () { intro.classList.add('is-draw'); });
  timers.push(setTimeout(function () { intro.classList.add('is-fill'); }, 1650));
  timers.push(setTimeout(function () { finish(false); }, 2300));
  ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { intro.addEventListener(ev, function () { finish(true); }, { passive: true }); });
  window.addEventListener('keydown', function () { finish(true); }, { once: true });
})();
