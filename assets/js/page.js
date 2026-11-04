/* Podstrony (np. Manifest): nagłówek, wysuwane menu, animacje wejścia i galeria. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;

  /* Nagłówek: na podstronach od razu z tłem po przewinięciu */
  var header = $('#header');
  function onScroll() { header.classList.toggle('is-solid', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Wysuwane menu */
  var burger = $('#burger'), drawer = $('#drawer'), overlay = $('#drawer-overlay'), closeBtn = $('#drawer-close');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    if (open) {
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      setTimeout(function () { closeBtn.focus(); }, 50);
    } else {
      overlay.classList.remove('is-open');
      setTimeout(function () { if (!drawer.classList.contains('is-open')) overlay.hidden = true; }, 500);
      burger.focus({ preventScroll: true });
    }
  }
  burger.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  overlay.addEventListener('click', function () { setMenu(false); });
  $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* Animacje wejścia */
  var els = $$('.reveal, .reveal-img');
  if ('IntersectionObserver' in window) {
    var o = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); o.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { o.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('is-in'); }); }

  /* Galeria */
  var lb = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  var gallery = $$('img[data-lightbox]'), idx = 0, last = null;
  function show(i) {
    idx = (i + gallery.length) % gallery.length;
    var g = gallery[idx];
    lbImg.src = g.dataset.full || g.currentSrc || g.src; lbImg.alt = g.alt;
    lbCap.textContent = g.dataset.lightbox;
  }
  function openLb(i) { last = document.activeElement; show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); body.style.overflow = 'hidden'; $('.lb-close', lb).focus(); }
  function closeLb() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); body.style.overflow = ''; if (last) last.focus(); }
  if (lb) {
    gallery.forEach(function (img, i) {
      img.tabIndex = 0;
      img.addEventListener('click', function () { openLb(i); });
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter') openLb(i); });
    });
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
    $('.lb-close', lb).addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lb && lb.classList.contains('is-open')) closeLb();
      else if (body.classList.contains('menu-open')) setMenu(false);
    }
    if (lb && lb.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    }
  });
})();
