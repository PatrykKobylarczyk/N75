/* Wejście na stronę: krótki ekran powitalny – logo N75 rysowane kreską (ok. 0,9 s), wypełnienie, okrąg otwiera widok.
   Tylko przy pierwszym wejściu w danej wizycie (bez powrotu „wstecz” i przejść z podstron); kliknięcie, klawisz lub przewinięcie pomija. */
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
    setTimeout(function () { intro.remove(); root.classList.add('intro-done'); }, fast ? 400 : 1050);
  }
  if (/^\/(nowa|en|podglad)(\/|$)/.test(location.pathname)) {
    // nowa strona: logo N75 składa się z brył (każda wjeżdża po kolei), pod nim rysuje się brązowa kreska, kurtyna odsłania hero
    intro.classList.add('intro--k');
    var go = function () {
      var sym = document.getElementById('n75-logo'); if (!sym || done) { finish(true); return; }
      var parts = Array.prototype.map.call(sym.children, function (c, i) { return '<g class="pc" style="--i:' + i + '">' + c.outerHTML + '</g>'; }).join('');
      intro.querySelector('.intro__logo').outerHTML = '<div class="ik"><svg class="ik__logo" viewBox="' + sym.getAttribute('viewBox') + '" aria-hidden="true">' + parts + '</svg><i class="ik__rule"></i></div>';
      requestAnimationFrame(function () { requestAnimationFrame(function () { intro.classList.add('is-draw'); }); });
      timers.push(setTimeout(function () { finish(false); }, 4300));   // logo zostaje chwilę po złożeniu
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(go, 0); }); else setTimeout(go, 0);
  } else {
    requestAnimationFrame(function () { intro.classList.add('is-draw'); });
    timers.push(setTimeout(function () { intro.classList.add('is-fill'); }, 900));
    timers.push(setTimeout(function () { finish(false); }, 1250));
  }
  ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { intro.addEventListener(ev, function () { finish(true); }, { passive: true }); });
  window.addEventListener('keydown', function () { finish(true); }, { once: true });
})();
