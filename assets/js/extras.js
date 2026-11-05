/* Wspólne dodatki dla wszystkich stron: ulubione lokale, pasek kontaktu na telefonie,
   płynne przewijanie i wejście numerów sekcji. Bez zależności. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var KEY = 'n75-ulubione';
  var PHONE = '+48799278344', PHONE_TXT = '+48 799 278 344';
  var onIndex = !!document.getElementById('kontakt');
  var base = onIndex ? '' : 'index.html';

  /* ---------- Ulubione (pamiętane w tej przeglądarce) ---------- */
  function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  var favs = read();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(favs)); } catch (e) {} }
  function has(id) { return favs.indexOf(id) >= 0; }
  function toggle(id) {
    if (has(id)) favs.splice(favs.indexOf(id), 1); else favs.push(id);
    save(); sync();
    document.dispatchEvent(new CustomEvent('n75:fav', { detail: { id: id, on: has(id), list: favs.slice() } }));
  }
  function sync() {
    $$('[data-fav]').forEach(function (b) {
      var on = has(b.dataset.fav);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? 'Usuń z ulubionych: ' : 'Dodaj do ulubionych: ') + b.dataset.fav);
      var l = $('.fav__label', b); if (l) l.textContent = on ? 'W ulubionych' : 'Dodaj do ulubionych';
    });
    var n = favs.length;
    $$('.fav-count').forEach(function (c) { c.textContent = n; c.hidden = !n; });
    $$('.fav-link').forEach(function (a) { a.classList.toggle('has-favs', !!n); });
  }
  // kliknięcie serduszka nie otwiera karty lokalu ani wiersza tabeli
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    toggle(b.dataset.fav);
  }, true);
  window.N75Fav = { list: function () { return favs.slice(); }, has: has, toggle: toggle, sync: sync,
    heart: function (id, extra) {
      return '<button type="button" class="fav' + (extra ? ' ' + extra : '') + '" data-fav="' + id + '" aria-pressed="false" aria-label="Dodaj do ulubionych: ' + id + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg></button>';
    } };

  // link „Ulubione” w nagłówku
  var hr = $('.header__right');
  if (hr && !$('.fav-link', hr)) {
    var a = document.createElement('a');
    a.href = 'porownaj.html'; a.className = 'fav-link caps'; a.setAttribute('aria-label', 'Ulubione lokale i porównanie');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg><span class="fav-count" hidden>0</span>';
    hr.insertBefore(a, hr.firstChild);
  }
  sync();
  // treść dodana później (tabela, kafle, makieta) też dostaje stan serduszek
  if ('MutationObserver' in window) {
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(sync, 30); }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- Pasek kontaktu przyklejony do dołu (telefon) ---------- */
  if (!$('.mbar')) {
    var bar = document.createElement('div');
    bar.className = 'mbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Szybki kontakt');
    bar.innerHTML =
      '<a class="mbar__call" href="tel:' + PHONE + '" aria-label="Zadzwoń: ' + PHONE_TXT + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5l2.6 3.3-1.7 2.4a11.5 11.5 0 0 0 7.3 7.3l2.4-1.7 3.3 2.6-1.6 3a3 3 0 0 1-3 1.3C9.6 20.5 3.5 14.4 2.3 8a3 3 0 0 1 1.3-3z"/></svg><span>Zadzwoń</span></a>' +
      '<a class="mbar__ask" href="' + base + '#kontakt"><span>Zapytaj o lokal</span><span class="arrow" aria-hidden="true"></span></a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-mbar');
    // ukryj nad hero i przy formularzu (nie zasłania przycisku „Wyślij”)
    var hero = $('.hero'), contact = document.getElementById('kontakt');
    var upd = function () {
      var y = window.scrollY, vh = window.innerHeight, show = true;
      if (hero && y < hero.offsetHeight * .6) show = false;
      if (contact) { var r = contact.getBoundingClientRect(); if (r.top < vh * .85 && r.bottom > 0) show = false; }
      bar.classList.toggle('is-on', show);
    };
    window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }

  /* ---------- Wejście numerów sekcji ---------- */
  var nums = $$('.sec-head .num');
  if (nums.length && 'IntersectionObserver' in window) {
    nums.forEach(function (n) { n.classList.add('num-in'); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-shown'); io.unobserve(e.target); } });
    }, { threshold: .6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Kotwice na tej samej stronie: przewijanie bez dopisywania #sekcji do adresu ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var h = a.getAttribute('href'), i = h.indexOf('#');
    if (i < 0) return;
    var path = h.slice(0, i), id = h.slice(i + 1);
    if (path && path !== location.pathname.split('/').pop() && !(path === 'index.html' && /\/(index\.html)?$/.test(location.pathname))) return;
    var t = id === 'top' || id === '' ? document.body : document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    if (t === document.body) window.scrollTo({ top: 0, behavior: 'smooth' }); else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- Płynne przewijanie kółkiem myszy (komputer) ----------
     Ruch kółka trafia do „celu”, a strona dopływa do niego z wygaszaniem. Natywny scroll pozostaje
     źródłem prawdy (działają sticky, kotwice, klawiatura, pasek przewijania). Ekrany dotykowe bez zmian. */
  (function () {
    var fine = window.matchMedia('(pointer: fine)'), reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches || !window.requestAnimationFrame) return;
    var root = document.documentElement, target = window.scrollY, current = window.scrollY, raf = null, ours = false;
    var EASE = .095;                                   // 0–1: mniejsze = dłuższe dopływanie
    var maxY = function () { return root.scrollHeight - window.innerHeight; };
    // czy element pod kursorem sam przewija się w pionie (menu, listy, mapy, tabele)
    function scrollableParent(el, dy) {
      for (; el && el !== document.body && el !== root; el = el.parentElement) {
        if (el.classList && (el.classList.contains('leaflet-container'))) return true;
        var st = getComputedStyle(el), oy = st.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
        }
      }
      return false;
    }
    function loop() {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < .4) current = target;
      ours = true; window.scrollTo({ top: current, behavior: 'instant' });
      raf = current === target ? null : requestAnimationFrame(loop);
    }
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) return;                                  // powiększanie strony
      if (document.body.classList.contains('menu-open') || document.querySelector('.lightbox.is-open')) return;
      var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(e.deltaX) > Math.abs(dy)) return;                                // przewijanie w bok (gładzik)
      if (scrollableParent(e.target, dy)) return;
      e.preventDefault();
      if (!raf) { current = window.scrollY; target = current; }
      target = Math.max(0, Math.min(maxY(), target + dy));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: false });
    // inne źródła przewijania (kotwice, klawiatura, pasek, skrypty) przejmują stery
    window.addEventListener('scroll', function () {
      if (ours) { ours = false; return; }
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      current = target = window.scrollY;
    }, { passive: true });
    window.addEventListener('resize', function () { target = Math.min(target, maxY()); });
  })();
})();
