/* Wejście na stronę: logo N75 rysowane kreską (ok. 1,6 s), wypełnienie, potem okrąg otwiera widok (ok. 1,2 s).
   Raz na wizytę (sessionStorage); kliknięcie, klawisz lub przewinięcie pomija. */
(function () {
  'use strict';
  var root = document.documentElement, intro = document.getElementById('intro');
  if (!intro) return;
  if (root.classList.contains('intro-done')) { intro.remove(); return; }
  var done = false, timers = [];
  root.classList.add('intro-on');
  function finish(fast) {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem('n75-intro', '1'); } catch (e) {}
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
