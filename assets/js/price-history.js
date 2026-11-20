/* Historia ceny lokalu – okno po kliknięciu ceny (lista, kafle, makieta, karta lokalu, porównanie).
   Dane: window.N75_UNITS[].history = [[RRRR-MM-DD, cena brutto], …] (art. 19b ustawy deweloperskiej – jawność cen). */
(function () {
  'use strict';
  var fmt = new Intl.NumberFormat('pl-PL');
  var fmtA = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function unit(id) { return (window.N75_UNITS || []).filter(function (u) { return u.id === id; })[0]; }
  function day(d) { var p = String(d).slice(0, 10).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }

  // cena jako element otwierający historię (span z rolą przycisku – może stać wewnątrz linków i wierszy)
  function wrap(id, html) {
    if (!unit(id)) return html;   // np. lokale usługowe spoza listy mieszkań
    return '<span class="ph-btn" role="button" tabindex="0" data-ph="' + id + '" title="Historia ceny" aria-label="Historia ceny lokalu ' + id + '">' + html + '<i class="ph-ico" aria-hidden="true"></i></span>';
  }

  var box = null, last = null;
  function close() { if (!box) return; box.classList.remove('is-open'); document.documentElement.classList.remove('ph-lock'); var b = box; setTimeout(function () { b.hidden = true; }, 200); if (last && last.focus) last.focus(); }
  function open(id) {
    var u = unit(id); if (!u) return;
    var h = (u.history && u.history.length ? u.history : [[null, u.price]]).slice();
    var rows = h.map(function (x, i) {
      var prev = i ? h[i - 1][1] : null, ch = prev ? (x[1] - prev) / prev * 100 : null;
      return '<tr' + (i === h.length - 1 ? ' class="is-now"' : '') + '><td>' + (x[0] ? day(x[0]) : '—') + '</td><td class="r">' + fmt.format(x[1]) + ' zł</td><td class="r">' + fmt.format(Math.round(x[1] / u.area)) + ' zł</td><td class="r">' +
        (ch == null ? 'cena początkowa' : (ch > 0 ? '+' : '') + fmtA.format(ch) + '%') + '</td></tr>';
    }).reverse().join('');
    if (!box) {
      box = document.createElement('div'); box.className = 'ph-modal'; box.hidden = true;
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ph-title');
      box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('.ph-close')) close(); });
      document.body.appendChild(box);
    }
    var cur = h[h.length - 1];
    box.innerHTML = '<div class="ph-card"><button type="button" class="ph-close" aria-label="Zamknij">×</button>' +
      '<span class="caps ph-kicker">Historia ceny</span>' +
      '<h3 class="ph-title" id="ph-title">Apartament ' + u.id + '</h3>' +
      '<p class="ph-sub">' + fmtA.format(u.area) + ' m² · aktualna cena <strong>' + fmt.format(cur[1]) + ' zł</strong>' + (cur[0] ? ' od ' + day(cur[0]) : '') + '</p>' +
      '<div class="ph-scroll"><table class="ph-table"><thead><tr><th>Obowiązuje od</th><th class="r">Cena</th><th class="r">Cena za m²</th><th class="r">Zmiana</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (h.length < 2 ? '<p class="ph-note">Cena nie zmieniała się od wprowadzenia lokalu do oferty.</p>' : '') +
      '<p class="ph-note">Ceny brutto. Historia zmian ceny publikowana zgodnie z art. 19b ustawy o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego. ' +
      '<a href="/dane-gov/historia-cen-n75.csv">Historia cen wszystkich lokali (CSV)</a></p></div>';
    box.hidden = false; document.documentElement.classList.add('ph-lock');
    requestAnimationFrame(function () { box.classList.add('is-open'); var c = box.querySelector('.ph-close'); if (c) c.focus(); });
    if (window.N75Track) window.N75Track('view_price_history', { unit_id: u.id });
  }
  function hit(e) {
    var t = e.target.closest && e.target.closest('[data-ph]'); if (!t) return false;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    last = t; open(t.getAttribute('data-ph')); return true;
  }
  window.addEventListener('click', hit, true);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box && !box.hidden) { close(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-ph]')) hit(e);
  }, true);
  window.N75PH = { wrap: wrap, open: open, close: close };
})();
