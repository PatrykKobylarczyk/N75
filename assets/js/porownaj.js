/* Ulubione i porównanie lokali (porownaj.html). Dane: window.N75_UNITS, lista: window.N75Fav. */
(function () {
  'use strict';
  var root = document.getElementById('cmp-root');
  var units = window.N75_UNITS || [];
  var byId = {}; units.forEach(function (u) { byId[u.id] = u; });
  var fmt = new Intl.NumberFormat('pl-PL');
  var fmtA = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var STATUS = { wolne: 'Wolne', rezerwacja: 'Rezerwacja', sprzedane: 'Sprzedane' };
  var MAX = 3, picked = null;
  var card = function (id) { return 'mieszkanie.html?id=' + encodeURIComponent(id); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function favs() { return (window.N75Fav ? window.N75Fav.list() : []).filter(function (id) { return byId[id]; }); }

  // rzuty w jednej skali: szerokość obrazka proporcjonalna do kadru w px rzutu (k – wspólny mnożnik dla porównywanych lokali)
  var cropW = function (u, l) { return (u.crop && u.crop[l]) ? u.crop[l][2] : 400; };
  var cropH = function (u, l) { return (u.crop && u.crop[l]) ? u.crop[l][3] : 400; };
  var dimW = function (u) { return u.levels.reduce(function (s, l) { return s + cropW(u, l); }, 0) * 1.04; };
  var dimH = function (u) { return Math.max.apply(null, u.levels.map(function (l) { return cropH(u, l); })); };
  var K = 1;
  function thumb(u) {
    return u.levels.map(function (l) { return '<img style="width:' + (cropW(u, l) * K).toFixed(2) + '%" src="assets/img/plany/lokale/' + u.id + '-' + l + '-sm.webp?v=1793990924" alt="Rzut lokalu ' + u.id + (u.levels.length > 1 ? ', piętro ' + l : '') + '" loading="lazy">'; }).join('');
  }
  function roomArea(u, re) { return u.roomsList.filter(function (r) { return re.test(r[1]); }).reduce(function (s, r) { return s + r[2]; }, 0); }

  function render() {
    var list = favs();
    if (picked === null) picked = list.slice(0, MAX);
    picked = picked.filter(function (id) { return list.indexOf(id) >= 0; });

    if (!list.length) {
      root.innerHTML = '<div class="cmp-empty"><p class="lead">Nie masz jeszcze ulubionych lokali.</p><p class="muted">Kliknij serduszko przy mieszkaniu w&nbsp;zestawieniu, na makiecie albo w&nbsp;karcie lokalu.</p>' +
        '<a class="btn btn--solid caps" href="index.html#mieszkania">Przeglądaj apartamenty <span class="arrow"></span></a></div>';
      return;
    }

    var chips = '<div class="cmp-pick"><span class="caps muted">Porównaj (maks. ' + MAX + ')</span><div class="cmp-chips">' +
      list.map(function (id) {
        var on = picked.indexOf(id) >= 0, dis = !on && picked.length >= MAX;
        return '<button type="button" class="chip cmp-chip" data-pick="' + id + '" aria-pressed="' + on + '"' + (dis ? ' disabled' : '') + '>' + id + '</button>';
      }).join('') + '</div></div>';

    var sel = picked.map(function (id) { return byId[id]; });
    K = sel.length ? Math.min.apply(null, sel.map(function (u) { return Math.min(100 / dimW(u), 75 / dimH(u)); })) * .92 : 1;
    var rows = [
      ['Piętro', function (u) { return u.levels.join('–') + (u.levels.length > 1 ? ' (2 poziomy)' : ''); }],
      ['Pokoje', function (u) { return u.rooms; }, 'rooms'],
      ['Powierzchnia', function (u) { return fmtA.format(u.area) + ' m²'; }, 'area'],
      ['Cena', function (u) { return u.status === 'sprzedane' ? '—' : fmt.format(u.price) + ' zł'; }, 'price'],
      ['Cena za m²', function (u) { return u.status === 'sprzedane' ? '—' : fmt.format(Math.round(u.price / u.area)) + ' zł'; }, 'ppm'],
      ['Salon z aneksem', function (u) { var a = roomArea(u, /salon/i); return a ? fmtA.format(a) + ' m²' : '—'; }],
      ['Łazienki i WC', function (u) { return u.roomsList.filter(function (r) { return /łazienka|wc/i.test(r[1]); }).length; }],
      ['Taras / loggia', function (u) { var o = u.outdoor || []; return o.length ? o.map(function (x) { return esc(x[0]) + ' ' + fmtA.format(x[1]) + ' m²'; }).join('<br>') : '—'; }, 'outA'],
      ['Strony świata', function (u) { return u.orient ? esc(u.orient) : '—'; }],
      ['Status', function (u) { return '<span class="status status--' + u.status + '">' + STATUS[u.status] + '</span>'; }]
    ];
    // wyróżnij najlepszą wartość w wierszach liczbowych
    function best(key) {
      if (sel.length < 2) return null;
      var vals = sel.map(function (u) { return key === 'ppm' ? u.price / u.area : key === 'outA' ? (u.outdoor || []).reduce(function (s, x) { return s + x[1]; }, 0) : u[key]; });
      var target = (key === 'price' || key === 'ppm') ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
      return vals.map(function (v) { return v === target; });
    }

    var table = '';
    if (sel.length) {
      table = (sel.length > 1 ? '<p class="cmp-scale caps">Rzuty w jednakowej skali · góra rzutu = ul. Narutowicza (północ)</p>' : '') + '<div class="cmp-grid" style="--n:' + sel.length + '">' +
        '<div class="cmp-col cmp-col--labels" aria-hidden="true"><div class="cmp-cell cmp-cell--head"></div>' + rows.map(function (r) { return '<div class="cmp-cell caps">' + r[0] + '</div>'; }).join('') + '<div class="cmp-cell"></div></div>' +
        sel.map(function (u, i) {
          return '<div class="cmp-col">' +
            '<div class="cmp-cell cmp-cell--head"><div class="cmp-head"><a href="' + card(u.id) + '" class="display cmp-id">' + u.id + '</a>' + window.N75Fav.heart(u.id) + '</div>' +
            '<a class="cmp-plan' + (u.levels.length > 1 ? ' cmp-plan--two' : '') + '" href="' + card(u.id) + '">' + thumb(u) + '</a></div>' +
            rows.map(function (r) {
              var b = r[2] ? best(r[2]) : null;
              return '<div class="cmp-cell' + (b && b[i] ? ' is-best' : '') + '"><span class="cmp-lbl caps">' + r[0] + '</span><span>' + r[1](u) + '</span></div>';
            }).join('') +
            '<div class="cmp-cell cmp-cell--cta"><a class="btn btn--line caps" href="' + card(u.id) + '">Karta lokalu</a></div>' +
          '</div>';
        }).join('') + '</div>';
    } else {
      table = '<p class="muted cmp-hint">Wybierz co najmniej jeden lokal powyżej.</p>';
    }

    var ask = sel.length ? '<div class="cmp-foot"><a class="btn btn--solid caps" href="index.html?lokal=' + encodeURIComponent(sel[0].id) + '&porownanie=' + encodeURIComponent(picked.join(',')) + '#kontakt">Zapytaj o te lokale <span class="arrow"></span></a>' +
      '<p class="legal-note">Ceny brutto według cennika. Ceny i&nbsp;statusy mają charakter informacyjny i&nbsp;nie stanowią oferty w&nbsp;rozumieniu Kodeksu cywilnego.</p></div>' : '';

    root.innerHTML = chips + table + ask;
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]'); if (!b) return;
    var id = b.dataset.pick, i = picked.indexOf(id);
    if (i >= 0) picked.splice(i, 1); else if (picked.length < MAX) picked.push(id);
    render();
  });
  document.addEventListener('n75:fav', function (e) {
    if (e.detail.on && picked && picked.length < MAX && picked.indexOf(e.detail.id) < 0) picked.push(e.detail.id);
    render();
  });
  render();
})();
