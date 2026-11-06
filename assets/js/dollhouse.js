/* Widok 3D „doll house” mieszkania: własny lekki renderer WebGL2 (bez bibliotek).
   Dane: assets/data/3d/<ID>.json – ściany, przeszklenia, posadzki i wyposażenie wyciągnięte z rzutów DWG.
   Użycie: N75Doll.open(id, label) – otwiera okno z modelem (obrót przeciągnięciem, przybliżenie kółkiem/szczypnięciem). */
(function () {
  'use strict';
  var BASE = 'assets/data/3d/';
  var WALL_H = 2.05, GLASS_H = 1.95, LEVEL_DZ = 3.05;

  /* ---------- paleta quiet luxury (sRGB 0–255) ---------- */
  var C = {
    wall: [238, 233, 225], wallTop: [58, 54, 50], slab: [70, 65, 60],
    oak: [104, 74, 53], tile: [222, 214, 201], stone: [205, 198, 187],
    linen: [236, 230, 220], linen2: [244, 241, 235], boucle: [232, 226, 215], sand: [214, 200, 179], taupe: [176, 160, 141],
    mocha: [134, 108, 88], walnut: [96, 70, 52], door: [78, 52, 36], onyx: [120, 78, 56], oakLight: [204, 182, 150], travertine: [221, 210, 192], brass: [178, 145, 92],
    veneer: [146, 102, 70], legs: [120, 120, 118], raksa: [212, 200, 182], raksa2: [198, 186, 168], black: [38, 36, 34], white: [247, 246, 242], cabinet: [217, 208, 194], steel: [150, 150, 148], glass: [110, 172, 220], rug: [226, 217, 202],
    green: [110, 124, 92], pot: [196, 184, 166], teak: [168, 134, 98], teak2: [150, 114, 80], olive: [118, 128, 96], olive2: [134, 144, 110],
    bronze: [120, 96, 70], frame: [74, 68, 62], curtain: [240, 235, 226], rugOut: [214, 205, 190]
  };

  /* ---------- geometria ---------- */
  function Mesh() { this.p = []; this.n = []; this.c = []; this.m = []; }
  Mesh.prototype.tri = function (a, b, c, col, mat) {
    var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (var i = 0; i < 3; i++) {
      var v = [a, b, c][i];
      this.p.push(v[0], v[1], v[2]); this.n.push(nx, ny, nz); this.c.push(col[0] / 255, col[1] / 255, col[2] / 255); this.m.push(mat || 0);
    }
  };
  function area2(P) { var s = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  // triangulacja wielokąta prostego (ear clipping); wynik: trójki indeksów
  function earcut(P) {
    var n = P.length, idx = [], out = [];
    if (n < 3) return out;
    for (var i = 0; i < n; i++) idx.push(i);
    if (area2(P) < 0) idx.reverse();
    function inTri(p, a, b, c) {
      var d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
      var d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
      var d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    }
    var guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      var found = false;
      for (var k = 0; k < idx.length; k++) {
        var i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
        var a = P[i0], b = P[i1], c = P[i2];
        if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <= 1e-9) continue;
        var ok = true;
        for (var j = 0; j < idx.length; j++) {
          var q = idx[j]; if (q === i0 || q === i1 || q === i2) continue;
          if (inTri(P[q], a, b, c)) { ok = false; break; }
        }
        if (!ok) continue;
        out.push([i0, i1, i2]); idx.splice(k, 1); found = true; break;
      }
      if (!found) break;
    }
    if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
    return out;
  }
  // graniastosłup z obrysu (x,z w planie) od y0 do y1; topCol – kolor wierzchu
  Mesh.prototype.prism = function (P, y0, y1, col, topCol, mat, topMat) {
    if (!P || P.length < 3 || y1 <= y0) return;
    if (area2(P) > 0) P = P.slice().reverse();   // w układzie (x, z) – orientacja dla normalnych na zewnątrz
    var t = earcut(P), self = this;
    t.forEach(function (tr) {
      var a = P[tr[0]], b = P[tr[1]], c = P[tr[2]];
      self.tri([a[0], y1, a[1]], [c[0], y1, c[1]], [b[0], y1, b[1]], topCol || col, topMat === undefined ? mat : topMat);
    });
    for (var i = 0; i < P.length; i++) {
      var p = P[i], q = P[(i + 1) % P.length];
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-4) continue;
      this.tri([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], col, mat);
      this.tri([p[0], y0, p[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], col, mat);
    }
  };
  Mesh.prototype.box = function (x0, z0, x1, z1, y0, y1, col, topCol, mat) {
    this.prism([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, y1, col, topCol, mat);
  };
  Mesh.prototype.cyl = function (cx, cz, r, y0, y1, col, seg) {
    var P = []; seg = seg || 20;
    for (var i = 0; i < seg; i++) { var a = i / seg * Math.PI * 2; P.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    this.prism(P, y0, y1, col);
  };

  /* ---------- pomocnicze dla wyposażenia ---------- */
  function bbox(P) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    P.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    return [x0, y0, x1, y1];
  }
  function polyArea(P) { return Math.abs(area2(P)); }
  function inside(p, P) {
    var c = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      var a = P[i], b = P[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function cen(P) { var x = 0, y = 0; P.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / P.length, y / P.length]; }
  // układ lokalny bloku: o = [początek, +100cm x, +100cm y] w metrach planu
  function frame(it) {
    var o = it.o[0], ax = [(it.o[1][0] - o[0]) / 100, (it.o[1][1] - o[1]) / 100], ay = [(it.o[2][0] - o[0]) / 100, (it.o[2][1] - o[1]) / 100];
    return function (lx, ly) { return [o[0] + ax[0] * lx + ay[0] * ly, o[1] + ax[1] * lx + ay[1] * ly]; };
  }
  function rectL(L, x0, y0, x1, y1) { return [L(x0, y0), L(x1, y0), L(x1, y1), L(x0, y1)]; }
  function shrinkL(b, d) { return [b[0] + d, b[1] + d, b[2] - d, b[3] - d]; }

  // loggia: leżaki z teku, stolik i oliwki w donicach
  function loggia(M, P, dy) {
    var b = bbox(P), w = b[2] - b[0], d = b[3] - b[1], horiz = w >= d, L = horiz ? w : d, D = horiz ? d : w;
    var cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2;
    var at = function (u, v) { return horiz ? [cx + u, cz + v] : [cx + v, cz + u]; };
    var ok = function (u, v) { return inside(at(u, v), P); };
    var plant = function (u, v, r) {
      return;
      if (!ok(u, v)) return; var p = at(u, v);
      M.cyl(p[0], p[1], r, dy, dy + 0.55, C.pot, 18);
      M.cyl(p[0], p[1], r * 1.35, dy + 0.75, dy + 1.05, C.olive, 14); M.cyl(p[0], p[1], r * 1.05, dy + 1.05, dy + 1.3, C.olive2, 12); M.cyl(p[0], p[1], 0.02, dy + 0.55, dy + 0.78, C.walnut, 6);
    };
    if (L > 1.6) { plant(-L / 2 + 0.4, 0, 0.2); plant(L / 2 - 0.4, 0, 0.2); }
    if (D < 1.25 || L < 2.4) return;
    [-0.55, 0.55].forEach(function (u) {
      if (!ok(u, 0)) return;
      var a = at(u - 0.33, -0.36), c = at(u + 0.33, 0.36);
      var x0 = Math.min(a[0], c[0]), x1 = Math.max(a[0], c[0]), z0 = Math.min(a[1], c[1]), z1 = Math.max(a[1], c[1]);
      M.box(x0, z0, x1, z1, dy + 0.05, dy + 0.3, C.teak2); M.box(x0 + 0.04, z0 + 0.04, x1 - 0.04, z1 - 0.04, dy + 0.3, dy + 0.42, C.linen);
      var bk = at(u, -0.36); M.box(horiz ? x0 + 0.04 : bk[0] - 0.05, horiz ? bk[1] - 0.05 : z0 + 0.04, horiz ? x1 - 0.04 : bk[0] + 0.05, horiz ? bk[1] + 0.05 : z1 - 0.04, dy + 0.3, dy + 0.75, C.linen);
    });
    var t = at(0, 0.05); M.cyl(t[0], t[1], 0.24, dy + 0.42, dy + 0.46, C.travertine, 24); M.cyl(t[0], t[1], 0.05, dy, dy + 0.42, C.bronze, 10);
    if (D > 1.6) { var r = at(0, 0); M.box(r[0] - (horiz ? 1.1 : 0.7), r[1] - (horiz ? 0.7 : 1.1), r[0] + (horiz ? 1.1 : 0.7), r[1] + (horiz ? 0.7 : 1.1), dy, dy + 0.01, C.rugOut); }
  }

  /* ---------- budowa modelu ---------- */
  function buildLevel(M, lv, dx, dz, dy, opaque, glassM) {
    var X = function (P) { return P.map(function (p) { return [p[0] + dx, p[1] + dz]; }); };
    // posadzki z płytą stropu
    var inner = [];
    lv.floors.forEach(function (f) {
      var n = (f.n || '').toLowerCase();
      var wet = /łazienka|wc|pralnia|sauna/.test(n);
      var out = f.k === 'out' || /loggia|balkon|taras/.test(n);
      var top = wet ? C.tile : out ? C.teak : C.oak, mat = wet ? 2 : out ? 3 : 1;
      M.prism(X(f.p), dy - 0.22, dy, C.slab, top, 0, mat);
      if (out) loggia(M, X(f.p), dy); else inner.push(X(f.p));
    });
    // drzwi: uchylone skrzydło na zawiasie z rzutu (h – zawias, c – koniec w zamknięciu, sw – kierunek otwierania)
    function door(d, entry) {
      var h = [d[0][0] + dx, d[0][1] + dz], c = [d[1][0] + dx, d[1][1] + dz], sw = [d[2][0] + dx, d[2][1] + dz];
      var R = Math.hypot(c[0] - h[0], c[1] - h[1]) || 0.9;
      var ux = (c[0] - h[0]) / R, uz = (c[1] - h[1]) / R, vx = (sw[0] - h[0]) / R, vz = (sw[1] - h[1]) / R;
      var ang = entry ? 0.62 : 0.78, ca = Math.cos(ang), sa = Math.sin(ang);
      var dxl = ux * ca + vx * sa, dzl = uz * ca + vz * sa, nx = -dzl, nz = dxl, t = entry ? 0.035 : 0.022, H2 = WALL_H - 0.02;
      var Q = function (u0, u1, v0, v1) { return [[h[0] + dxl * u0 + nx * v0, h[1] + dzl * u0 + nz * v0], [h[0] + dxl * u1 + nx * v0, h[1] + dzl * u1 + nz * v0], [h[0] + dxl * u1 + nx * v1, h[1] + dzl * u1 + nz * v1], [h[0] + dxl * u0 + nx * v1, h[1] + dzl * u0 + nz * v1]]; };
      var F = function (u0, u1, v0, v1) { return [[h[0] + ux * u0 + vx * v0, h[1] + uz * u0 + vz * v0], [h[0] + ux * u1 + vx * v0, h[1] + uz * u1 + vz * v0], [h[0] + ux * u1 + vx * v1, h[1] + uz * u1 + vz * v1], [h[0] + ux * u0 + vx * v1, h[1] + uz * u0 + vz * v1]]; };
      var L = R - 0.02;
      if (entry) {
        M.prism(Q(0.02, L, -t, t), dy + 0.17, dy + H2, C.door, C.door);            // orzech
        M.prism(Q(0.02, L, -t - 0.004, t + 0.004), dy + 0.01, dy + 0.17, C.brass);  // mosiężny cokół
        [-1, 1].forEach(function (s_) { M.prism(Q(L - 0.13, L - 0.1, s_ * t, s_ * (t + 0.05)), dy + 1.0, dy + 1.05, C.brass); M.prism(Q(L - 0.22, L - 0.1, s_ * (t + 0.03), s_ * (t + 0.05)), dy + 1.0, dy + 1.03, C.brass); });
        // ościeżnica z orzecha i pas onyksu przy drzwiach
        M.prism(F(-0.06, 0, -0.1, 0.1), dy, dy + WALL_H, C.door); M.prism(F(R, R + 0.06, -0.1, 0.1), dy, dy + WALL_H, C.door);
        M.prism(F(-0.26, -0.06, -0.11, -0.07), dy, dy + WALL_H, C.onyx);
      } else {
        M.prism(Q(0.01, L, -t, t), dy + 0.01, dy + H2, C.white, C.white);
        [-1, 1].forEach(function (s_) { M.prism(Q(L - 0.12, L - 0.09, s_ * t, s_ * (t + 0.04)), dy + 1.0, dy + 1.03, C.brass); });
      }
    }
    (lv.doors || []).forEach(function (d) { door(d, true); });
    (lv.idoors || []).forEach(function (d) { door(d, false); });
    // ściany: przekrój ciemny na górze
    lv.walls.forEach(function (w) { M.box(w[0] + dx, w[1] + dz, w[2] + dx, w[3] + dz, dy - 0.22, dy + WALL_H, C.wall, C.wallTop, 4); });
    // loggie od zewnątrz otwarte: niski murek/obrzeże i smukły brązowy pochwyt na słupkach
    (lv.rails || []).forEach(function (r) {
      var x0 = r[0] + dx, z0 = r[1] + dz, x1 = r[2] + dx, z1 = r[3] + dz, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, horiz = (x1 - x0) >= (z1 - z0);
      var a0 = horiz ? x0 : z0, a1 = horiz ? x1 : z1, c = horiz ? cz : cx;
      var B_ = function (u0, u1, w, y0, y1, col) { M.box(horiz ? u0 : c - w, horiz ? c - w : u0, horiz ? u1 : c + w, horiz ? c + w : u1, y0, y1, col); };
      B_(a0, a1, 0.05, dy - 0.22, dy + 0.06, C.wall);
      B_(a0, a1, 0.02, dy + 1.05, dy + 1.09, C.bronze);
      var n = Math.max(1, Math.round((a1 - a0) / 1.2));
      for (var i = 0; i <= n; i++) { var m = a0 + (a1 - a0) * i / n; B_(m - 0.015, m + 0.015, 0.015, dy + 0.06, dy + 1.05, C.bronze); }
    });
    // okna: półprzezroczyste szkło w smukłych ramach + lniane zasłony od środka
    lv.glass.forEach(function (g) {
      var x0 = g[0] + dx, z0 = g[1] + dz, x1 = g[2] + dx, z1 = g[3] + dz, horiz = (x1 - x0) >= (z1 - z0);
      var len = horiz ? x1 - x0 : z1 - z0, c = horiz ? (z0 + z1) / 2 : (x0 + x1) / 2, t = 0.018;
      var seg = function (a, b, y0, y1, th, col, mesh) { (mesh || M).box(horiz ? a : c - th, horiz ? c - th : a, horiz ? b : c + th, horiz ? c + th : b, y0, y1, col, col, mesh ? 9 : 0); };
      seg(horiz ? x0 : z0, horiz ? x1 : z1, dy + 0.06, dy + WALL_H - 0.05, t, C.glass, glassM);
      seg(horiz ? x0 : z0, horiz ? x1 : z1, dy - 0.22, dy + 0.06, 0.045, C.frame);
      seg(horiz ? x0 : z0, horiz ? x1 : z1, dy + WALL_H - 0.05, dy + WALL_H, 0.045, C.frame);
      var n = Math.max(1, Math.round(len / 1.35)), a0 = horiz ? x0 : z0;
      for (var i = 0; i <= n; i++) { var m = a0 + len * i / n; seg(m - 0.025, m + 0.025, dy + 0.06, dy + WALL_H - 0.05, 0.04, C.frame); }
      // zasłony: tylko przy oknach pomieszczeń (strona wewnętrzna)
      if (len < 0.9) return;
      var mid = horiz ? [(x0 + x1) / 2, c] : [c, (z0 + z1) / 2], side = 0;
      [0.3, -0.3].forEach(function (o) { var p = horiz ? [mid[0], mid[1] + o] : [mid[0] + o, mid[1]]; if (!side && inner.some(function (P) { return inside(p, P); })) side = o > 0 ? 1 : -1; });
      if (!side) return;
      var cc = c + side * 0.13, pw = Math.min(0.42, len * 0.18);
      [[a0 + 0.04, a0 + 0.04 + pw], [a0 + len - 0.04 - pw, a0 + len - 0.04]].forEach(function (q) {
        M.box(horiz ? q[0] : cc - 0.05, horiz ? cc - 0.05 : q[0], horiz ? q[1] : cc + 0.05, horiz ? cc + 0.05 : q[1], dy + 0.02, dy + WALL_H - 0.08, C.curtain);
      });
    });
    lv.items.forEach(function (it) { try { furnish(M, it, dx, dz, dy); } catch (e) { /* pojedynczy mebel nie blokuje modelu */ } });
  }

  function furnish(M, it, dx, dz, dy) {
    var Lw = frame(it), L = function (x, y) { var p = Lw(x, y); return [p[0] + dx, p[1] + dz]; };
    var regs = it.l.map(function (P, i) { var b = bbox(P); return { P: P, W: it.r[i], b: b, w: b[2] - b[0], d: b[3] - b[1], A: polyArea(P) / 1e4 }; })
      .filter(function (r) { return r.A > 0.004; });
    var bb = it.bb;   // [x0,x1,y0,y1] cm lokalnie
    var sgn = Math.abs(bb[3]) > Math.abs(bb[2]) ? 1 : -1;          // kierunek „od ściany” (oś y bloku)
    var P = function (r) { return r.P.map(function (p) { return L(p[0], p[1]); }); };
    var R = function (b) { return rectL(L, b[0], b[1], b[2], b[3]); };
    var big = regs.slice().sort(function (a, b) { return b.A - a.A; });
    var Y = function (v) { return dy + v; };
    var q = it.q.map(function (p) { return [p[0] + dx, p[1] + dz]; });
    var lb = [bb[0], bb[2], bb[1], bb[3]];   // bbox lokalny jako [x0,y0,x1,y1]
    // obszar zawierający inne = rama (pierścień) -> pasy wokół wnętrza
    function strips(r, inner, y0, y1, col) {
      var o = r.b, i = inner;
      [[o[0], o[1], o[2], i[1]], [o[0], i[3], o[2], o[3]], [o[0], i[1], i[0], i[3]], [i[2], i[1], o[2], i[3]]].forEach(function (s) {
        if (s[2] - s[0] > 2 && s[3] - s[1] > 2) M.prism(R(s), Y(y0), Y(y1), col);
      });
    }
    function contained(r) {
      var c = regs.filter(function (s) { return s !== r && inside(cen(s.P), r.P) && s.A < r.A; });
      return c.length ? bbox([].concat.apply([], c.map(function (s) { return [[s.b[0], s.b[1]], [s.b[2], s.b[3]]]; }))) : null;
    }
    switch (it.t) {
      case 'bed2': case 'bed1': {
        var mains = big[0]; if (!mains) return;
        var mb = mains.b;
        var headY = Math.abs(mb[1]) < Math.abs(mb[3]) ? mb[1] : mb[3], footY = headY === mb[1] ? mb[3] : mb[1], dir = footY > headY ? 1 : -1;
        M.prism(R(shrinkL(mb, 1)), Y(0.06), Y(0.3), C.taupe);                                   // podstawa
        M.prism(R([mb[0] + 2, Math.min(headY, footY) + 2, mb[2] - 2, Math.max(headY, footY) - 2]), Y(0.3), Y(0.5), C.linen2);   // materac i pościel
        var fy0 = footY - dir * Math.abs(footY - headY) * 0.28;
        M.prism(R([mb[0] - 1, Math.min(fy0, footY), mb[2] + 1, Math.max(fy0, footY) + (dir > 0 ? 1 : -1)]), Y(0.3), Y(0.52), C.mocha);   // narzuta
        M.prism(R([mb[0] - 4, Math.min(headY, headY - dir * 9), mb[2] + 4, Math.max(headY, headY - dir * 9)]), Y(0.06), Y(1.1), C.sand);   // zagłówek tapicerowany
        var pw = (mb[2] - mb[0] - 12) / (it.t === 'bed2' ? 2 : 1);
        for (var k = 0; k < (it.t === 'bed2' ? 2 : 1); k++) {
          var px0 = mb[0] + 4 + k * (pw + 4);
          M.prism(R([px0, Math.min(headY + dir * 6, headY + dir * 42), px0 + pw, Math.max(headY + dir * 6, headY + dir * 42)]), Y(0.5), Y(0.62), C.white);
        }
        regs.forEach(function (r) {                                                              // szafki nocne
          if (r === mains || inside(cen(r.P), mains.P) || r.A > 0.4) return;
          M.prism(P(r), Y(0), Y(0.5), C.walnut, C.travertine);
          var c = cen(r.P), cc = L(c[0], c[1]); M.cyl(cc[0], cc[1], 0.07, Y(0.5), Y(0.56), C.brass, 14);
        });
        // dywan pod łóżkiem
        M.prism(R([mb[0] - 45, Math.min(fy0, footY) - (dir > 0 ? 0 : 55), mb[2] + 45, Math.max(fy0, footY) + (dir > 0 ? 55 : 0)].map(function (v, i) { return v; })), Y(0), Y(0.012), C.rug);
        break;
      }
      case 'sofa': {
        var s0 = big[0]; if (!s0) return;
        // części sofy: obszary przylegające do największego (odstęp < 6 cm), reszta to stolik/konsola
        var near = function (a, b) { return !(a.b[0] > b.b[2] + 6 || b.b[0] > a.b[2] + 6 || a.b[1] > b.b[3] + 6 || b.b[1] > a.b[3] + 6); };
        // sofa = największa (łączną powierzchnią) grupa stykających się elementów; osobny prostokąt obok to stolik/puf
        var grow = function (seed) { var g = [seed], ch = true; while (ch) { ch = false; regs.forEach(function (r) { if (g.indexOf(r) < 0 && g.some(function (p) { return near(p, r); }) && r.A < 1.6) { g.push(r); ch = true; } }); } return g; };
        var part = [s0], best = 0;
        regs.forEach(function (r) { var g = grow(r), a = g.reduce(function (s, x) { return s + x.A; }, 0); if (a > best + 1e-6) { best = a; part = g; } });
        var sb = bbox([].concat.apply([], part.map(function (r) { return [[r.b[0], r.b[1]], [r.b[2], r.b[3]]]; })));
        // Raksa (NOBONOBO, proj. T. Rygalik): tapicerowana rama na smukłych metalowych nóżkach 13 cm, grube siedziska, duże luźne poduchy oparcia
        var LEG = 0.13, sbx = (sb[0] + sb[2]) / 2, sby = (sb[1] + sb[3]) / 2;
        [[sb[0] + 8, sb[1] + 8], [sb[2] - 8, sb[1] + 8], [sb[0] + 8, sb[3] - 8], [sb[2] - 8, sb[3] - 8], [sbx, sb[1] + 8], [sbx, sb[3] - 8]].forEach(function (l) { var c = L(l[0], l[1]); M.cyl(c[0], c[1], 0.018, Y(0), Y(LEG), C.legs, 8); });
        var lp = L(sb[0] - 24, sby - (sb[3] - sb[1]) * 0.3);   // lampa podłogowa
        M.cyl(lp[0], lp[1], 0.14, Y(0), Y(0.03), C.bronze, 16); M.cyl(lp[0], lp[1], 0.012, Y(0.03), Y(1.45), C.bronze, 6); M.cyl(lp[0], lp[1], 0.2, Y(1.45), Y(1.72), C.curtain, 20);
        var cushions = function (b, along, y0, y1, col, gap) {          // podział na poduchy z widoczną szczeliną
          var len = along ? b[2] - b[0] : b[3] - b[1], n = Math.max(1, Math.round(len / 92)), st = len / n;
          for (var k = 0; k < n; k++) {
            var s = (along ? b[0] : b[1]) + k * st + gap, e = (along ? b[0] : b[1]) + (k + 1) * st - gap;
            M.prism(R(along ? [s, b[1], e, b[3]] : [b[0], s, b[2], e]), Y(y0), Y(y1), col);
            M.prism(R(along ? [s + 2, b[1] + 2, e - 2, b[3] - 2] : [b[0] + 2, s + 2, b[2] - 2, e - 2]), Y(y1), Y(y1 + 0.025), col);   // zaokrąglenie
          }
        };
        // krawędź oparcia: ta, wzdłuż której leży najwięcej cienkich elementów (reszta to podłokietniki)
        var edgeLen = [0, 0, 0, 0];   // 0: y-min, 1: y-max, 2: x-min, 3: x-max
        part.forEach(function (r) {
          if (Math.min(r.w, r.d) >= 28) return;
          if (r.w >= r.d) { if (Math.abs(r.b[1] - sb[1]) < 4) edgeLen[0] += r.w; if (Math.abs(r.b[3] - sb[3]) < 4) edgeLen[1] += r.w; }
          else { if (Math.abs(r.b[0] - sb[0]) < 4) edgeLen[2] += r.d; if (Math.abs(r.b[2] - sb[2]) < 4) edgeLen[3] += r.d; }
        });
        var backE = edgeLen.indexOf(Math.max.apply(null, edgeLen));
        var isBack = function (r) {
          if (Math.min(r.w, r.d) >= 28) return false;
          return backE === 0 ? r.w >= r.d && Math.abs(r.b[1] - sb[1]) < 4 : backE === 1 ? r.w >= r.d && Math.abs(r.b[3] - sb[3]) < 4 : backE === 2 ? r.d > r.w && Math.abs(r.b[0] - sb[0]) < 4 : r.d > r.w && Math.abs(r.b[2] - sb[2]) < 4;
        };
        part.forEach(function (r) {
          var thin = Math.min(r.w, r.d) < 28, horiz = r.w >= r.d, len = Math.max(r.w, r.d);
          if (thin) {
            M.prism(P(r), Y(LEG), Y(0.61), C.raksa2);                             // oparcie / podłokietnik (rama)
            M.prism(R(shrinkL(r.b, 2)), Y(0.61), Y(0.635), C.raksa2);
            if (isBack(r) && len > 40) {                                                      // duże luźne poduchy oparcia od strony siedziska
              var b = r.b, cb;
              if (horiz) cb = backE === 0 ? [b[0] + 1, b[3], b[2] - 1, b[3] + 22] : [b[0] + 1, b[1] - 22, b[2] - 1, b[1]];
              else cb = backE === 2 ? [b[2], b[1] + 1, b[2] + 22, b[3] - 1] : [b[0] - 22, b[1] + 1, b[0], b[3] - 1];
              cushions(cb, horiz, 0.43, 0.9, C.raksa, 1.5);
            }
          } else {
            var inn = contained(r);
            if (inn) { strips(r, inn, LEG, 0.61, C.raksa2); M.prism(R(inn), Y(LEG), Y(0.3), C.raksa2); cushions(shrinkL(inn, 1), (inn[2] - inn[0]) >= (inn[3] - inn[1]), 0.3, 0.43, C.raksa, 1.2); }
            else { M.prism(P(r), Y(LEG), Y(0.3), C.raksa2); cushions(shrinkL(r.b, 1), r.w >= r.d, 0.3, 0.43, C.raksa, 1.2); }
          }
        });
        // poduszki dekoracyjne na grzbiecie
        regs.forEach(function (r) {
          if (part.indexOf(r) >= 0) return;
          if (Math.min(r.w, r.d) < 30 && Math.max(r.w, r.d) > 90) {        // konsola RTV
            M.prism(P(r), Y(0), Y(0.42), C.walnut, C.walnut);
          } else if (r.A > 0.15 && r.A < 1.4) {                                // stolik kawowy (trawertyn)
            M.prism(P(r), Y(0.0), Y(0.32), C.travertine);
            M.prism(P(r), Y(0.32), Y(0.38), C.travertine);
            var c = cen(r.P), cc = L(c[0], c[1]);
            M.cyl(cc[0], cc[1], 0.08, Y(0.38), Y(0.47), C.travertine, 16);
            var rb = r.b; M.prism(R([Math.min(rb[0], sb[0]) - 30, Math.min(rb[1], sb[1]) - 10, Math.max(rb[2], sb[2]) + 30, Math.max(rb[3], sb[3]) + 10]), Y(0), Y(0.012), C.rug);
          }
        });
        break;
      }
      case 'ctable': { var r = big[0]; if (r) { M.prism(P(r), Y(0), Y(0.38), C.travertine); } break; }
      case 'armchair': {
        var a0 = big[0]; if (!a0) return; var inn = contained(a0);
        M.prism(P(a0), Y(0.02), Y(0.2), C.walnut);
        if (inn) { strips(a0, inn, 0.2, 0.68, C.sand); M.prism(R(inn), Y(0.2), Y(0.44), C.sand); } else M.prism(P(a0), Y(0.2), Y(0.44), C.sand);
        break;
      }
      case 'table': case 'rtable': {
        var chairs = [], tops = [];
        regs.forEach(function (r) { if (r.w < 66 && r.d < 66 && r.A < 0.34) chairs.push(r); else tops.push(r); });
        if (!tops.length && big[0]) { tops = [big[0]]; chairs = chairs.filter(function (c) { return c !== big[0]; }); }
        var tb = bbox([].concat.apply([], tops.map(function (r) { return [[r.b[0], r.b[1]], [r.b[2], r.b[3]]]; })));
        if (it.t === 'rtable') {
          var c = L((tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2), rr = Math.min(tb[2] - tb[0], tb[3] - tb[1]) / 200;
          M.cyl(c[0], c[1], rr, Y(0.72), Y(0.76), C.walnut, 32); M.cyl(c[0], c[1], 0.06, Y(0.04), Y(0.72), C.walnut, 12); M.cyl(c[0], c[1], 0.25, Y(0), Y(0.04), C.walnut, 20);
        } else {
          M.prism(R(tb), Y(0.72), Y(0.76), C.walnut);
          [[tb[0] + 4, tb[1] + 4], [tb[2] - 9, tb[1] + 4], [tb[0] + 4, tb[3] - 9], [tb[2] - 9, tb[3] - 9]].forEach(function (l) { M.prism(R([l[0], l[1], l[0] + 5, l[1] + 5]), Y(0), Y(0.72), C.walnut); });
          var tc = L((tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2);
          M.cyl(tc[0], tc[1], 0.07, Y(0.76), Y(0.98), C.travertine, 16);
        }
        chairs.forEach(function (r) {
          if (Math.min(r.w, r.d) < 12) { M.prism(P(r), Y(0.46), Y(0.86), C.mocha); return; }
          M.prism(P(r), Y(0.4), Y(0.47), C.sand); M.prism(R(shrinkL(r.b, Math.min(r.w, r.d) / 2 - 2)), Y(0), Y(0.4), C.walnut);
        });
        break;
      }
      case 'desk': {
        var d0 = big[0]; if (!d0) return;
        M.prism(P(d0), Y(0.72), Y(0.75), C.oakLight); M.prism(R([d0.b[0] + 2, d0.b[1] + 2, d0.b[0] + 6, d0.b[3] - 2]), Y(0), Y(0.72), C.oakLight); M.prism(R([d0.b[2] - 6, d0.b[1] + 2, d0.b[2] - 2, d0.b[3] - 2]), Y(0), Y(0.72), C.oakLight);
        regs.forEach(function (r) { if (r !== d0) { M.prism(P(r), Y(0.42), Y(0.48), C.mocha); M.prism(R(shrinkL(r.b, Math.min(r.w, r.d) / 2 - 3)), Y(0), Y(0.42), C.black); } });
        break;
      }
      case 'island': {
        var i0 = big[0]; if (!i0) return;
        M.prism(P(i0), Y(0.05), Y(0.88), C.veneer, C.veneer, 5); M.prism(P(i0), Y(0), Y(0.05), C.black); M.prism(P(i0), Y(0.88), Y(0.92), C.travertine);
        regs.forEach(function (r) { if (r !== i0 && r.A < 0.2) { var c = cen(r.P), cc = L(c[0], c[1]); M.cyl(cc[0], cc[1], 0.18, Y(0.62), Y(0.68), C.mocha, 16); M.cyl(cc[0], cc[1], 0.025, Y(0), Y(0.62), C.brass, 8); } });
        break;
      }
      case 'counter': case 'appl': case 'sink': case 'hob': {
        M.prism(q, Y(0.08), Y(0.88), C.veneer, C.veneer, 5); M.prism(q, Y(0), Y(0.08), C.black);
        M.prism(q, Y(0.88), Y(0.92), C.travertine);
        if (it.t === 'hob') { M.prism(R([lb[0] + 8, lb[1] + 8, lb[2] - 8, lb[3] - 8]), Y(0.92), Y(0.925), C.black); }
        if (it.t === 'sink') { M.prism(R([lb[0] + 10, lb[1] + 10, lb[2] - 10, lb[3] - 10]), Y(0.92), Y(0.924), C.steel); var c2 = L((lb[0] + lb[2]) / 2, sgn > 0 ? lb[1] + 6 : lb[3] - 6); M.cyl(c2[0], c2[1], 0.015, Y(0.92), Y(1.2), C.brass, 8); }
        break;
      }
      case 'fridge': { M.prism(q, Y(0), Y(2.2), C.veneer, C.veneer, 5); break; }
      case 'wardrobe': { M.prism(q, Y(0), Y(1.95), C.oakLight, C.oakLight); break; }
      case 'tv': {
        M.prism(q, Y(0.05), Y(0.42), C.walnut);
        var ty = sgn > 0 ? lb[1] : lb[3] - 4; M.prism(R([lb[0] + 8, Math.min(ty, ty + 4), lb[2] - 8, Math.max(ty, ty + 4)]), Y(0.75), Y(1.4), C.black);
        break;
      }
      case 'bath': {
        var b0 = big[0]; if (!b0) return; var inn = contained(b0);
        if (inn) { strips(b0, inn, 0, 0.56, C.white); M.prism(R(inn), Y(0), Y(0.4), [214, 222, 224]); } else M.prism(P(b0), Y(0), Y(0.56), C.white);
        break;
      }
      case 'shower': { var s1 = big[0]; if (s1) M.prism(P(s1), Y(0), Y(0.03), C.travertine); break; }
      case 'wc': {
        regs.forEach(function (r) {
          if (r.A > 0.5) return;
          if (r.A < 0.2 && Math.min(r.w, r.d) > 25) M.prism(P(r), Y(0), Y(0.4), C.white);
          else M.prism(P(r), Y(0), Y(1.05), C.travertine);
        });
        break;
      }
      case 'basin': {
        var v0 = big[0]; if (!v0) return; M.prism(P(v0), Y(0.35), Y(0.82), C.walnut); M.prism(P(v0), Y(0.82), Y(0.86), C.travertine);
        var vc = cen(v0.P), vcc = L(vc[0], vc[1]); M.cyl(vcc[0], vcc[1], Math.min(v0.w, v0.d) / 260, Y(0.86), Y(0.95), C.white, 20);
        break;
      }
      default: { var g0 = big[0]; if (g0) M.prism(P(g0), Y(0), Y(0.45), C.sand); }
    }
  }

  /* ---------- WebGL ---------- */
  var VS = '#version 300 es\nlayout(location=0) in vec3 p;layout(location=1) in vec3 n;layout(location=2) in vec3 c;layout(location=3) in float m;' +
    'uniform mat4 uVP,uL;out vec3 vP,vN,vC;out float vM;out vec4 vL;void main(){vP=p;vN=n;vC=c;vM=m;vL=uL*vec4(p,1.);gl_Position=uVP*vec4(p,1.);}';
  var FS = '#version 300 es\nprecision highp float;in vec3 vP,vN,vC;in float vM;in vec4 vL;uniform sampler2D uS;uniform vec3 uSun,uEye;uniform float uA;out vec4 o;' +
    'vec3 lin(vec3 c){return pow(c,vec3(2.2));}' +
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float sh(){vec3 q=vL.xyz/vL.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 1.;float s=0.;vec2 t=1./vec2(textureSize(uS,0));' +
    'for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){float d=texture(uS,q.xy+vec2(x,y)*t*2.2).r;s+=q.z-.0012>d?0.:1.;}return s/25.;}' +
    'void main(){vec3 N=normalize(vN);vec3 col=lin(vC);int M=int(vM+.5);' +
    'if(M==1&&N.y>.5){float cw=.42,bw=.12;float cx=vP.x/cw;float ci=floor(cx);float lx=fract(cx)*cw;float sg=mod(ci,2.)<1.?1.:-1.;' +
    'float u=(vP.z+sg*lx)*.7071;float ri=floor(u/bw);float fu=fract(u/bw);float v=h(vec2(ri,ci));' +
    'col*=.84+.26*v;col*=1.-.06*sin((vP.z-sg*lx)*46.+v*11.);' +
    'float e=min(fu,1.-fu);float ec=min(fract(cx),1.-fract(cx))*cw;col*=mix(.8,1.,smoothstep(0.,.035,e))*mix(.78,1.,smoothstep(0.,.006,ec));}' +
    'if(M==2&&N.y>.5){vec2 g=fract(vP.xz/.6);float e=min(min(g.x,1.-g.x),min(g.y,1.-g.y));col*=mix(.9,1.,smoothstep(0.,.02,e));col*=.97+.05*h(floor(vP.xz/.6));}' +
    'if(M==3&&N.y>.5){float g=fract(vP.x*7.);float v=h(vec2(floor(vP.x*7.),floor(vP.z*1.2)));col*=.92+.12*v;col*=mix(.8,1.,smoothstep(0.,.08,min(g,1.-g)));}' +
    'if(M==5){float yl=vP.y-floor(vP.y/3.05)*3.05;float u=N.y>.5?vP.x:(abs(N.x)>abs(N.z)?vP.z:vP.x);float pw=.6,pi=floor(u/pw),fu=fract(u/pw);float m2=mod(pi,2.)<1.?fu:1.-fu;' +
    'float w=m2*pw*34.+sin(yl*2.3+pi*1.7)*1.4+sin(m2*9.+yl*.9)*.5;float g=.5+.5*sin(w*6.283*1.4);col*=.86+.1*g+.05*h(vec2(floor(m2*pw*240.),pi));' +
    'if(N.y<.5){float e=min(fu,1.-fu)*pw;col*=mix(.55,1.,smoothstep(0.,.004,e));float hy=abs(yl-.5);col*=mix(.6,1.,smoothstep(0.,.004,hy));}}' +
    'if(M==9){vec3 V=normalize(uEye-vP);float fr=pow(1.-abs(dot(N,V)),3.);o=vec4(mix(vC,vec3(.85,.93,1.),fr*.5),uA+fr*.2);return;}' +
    'float ndl=max(dot(N,uSun),0.);float s=sh();vec3 sky=vec3(1.,.975,.94),gr=vec3(.62,.56,.5);' +
    'vec3 amb=mix(gr,sky,N.y*.5+.5)*.74;float ao=mix(.72,1.,smoothstep(0.,.5,vP.y-floor(vP.y/3.05)*3.05+.02));' +
    'vec3 L=col*(amb*ao+vec3(1.,.93,.84)*.86*ndl*mix(.25,1.,s));' +
    'vec3 V=normalize(uEye-vP);float sp=pow(max(dot(N,normalize(uSun+V)),0.),40.)*.06*s;L+=sp;' +
    'L=L/(L+.75)*1.55;o=vec4(pow(L,vec3(1./2.2)),uA);}';
  var SVS = '#version 300 es\nlayout(location=0) in vec3 p;uniform mat4 uL;void main(){gl_Position=uL*vec4(p,1.);}';
  var SFS = '#version 300 es\nprecision mediump float;out vec4 o;void main(){o=vec4(1.);}';

  function mat4() { return new Float32Array(16); }
  function persp(f, a, n, fa) { var m = mat4(), t = 1 / Math.tan(f / 2); m[0] = t / a; m[5] = t; m[10] = (fa + n) / (n - fa); m[11] = -1; m[14] = 2 * fa * n / (n - fa); return m; }
  function ortho(l, r, b, t, n, f) { var m = mat4(); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m; }
  function look(e, c, u) {
    var z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]], l = Math.hypot(z[0], z[1], z[2]); z = z.map(function (v) { return v / l; });
    var x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; l = Math.hypot(x[0], x[1], x[2]); x = x.map(function (v) { return v / l; });
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    var m = mat4(); m[0] = x[0]; m[4] = x[1]; m[8] = x[2]; m[1] = y[0]; m[5] = y[1]; m[9] = y[2]; m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
    m[12] = -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]); m[13] = -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]); m[14] = -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]); m[15] = 1;
    return m;
  }
  function mul(a, b) { var o = mat4(); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }

  function Viewer(canvas) {
    var gl = canvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.cv = canvas;
    function prog(vs, fs) {
      var p = gl.createProgram();
      [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) { var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); });
      gl.linkProgram(p); return p;
    }
    this.P = prog(VS, FS); this.SP = prog(SVS, SFS);
    var S = 2048; this.SS = S;
    this.depth = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.depth);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, S, S, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST); });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.az = -0.62; this.el = 1.0; this.zoom = 1; this.meshes = [];
  }
  Viewer.prototype.upload = function (M) {
    var gl = this.gl, vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    [[M.p, 3], [M.n, 3], [M.c, 3], [M.m, 1]].forEach(function (a, i) {
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a[0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, a[1], gl.FLOAT, false, 0, 0);
    });
    gl.bindVertexArray(null);
    return { vao: vao, n: M.p.length / 3 };
  };
  Viewer.prototype.set = function (opaque, glass, box) {
    var gl = this.gl;
    this.meshes.forEach(function (m) { gl.deleteVertexArray(m.vao); });
    this.op = this.upload(opaque); this.gl_ = this.upload(glass); this.meshes = [this.op, this.gl_];
    this.box = box;   // [x0, z0, x1, z1, yTop]
    this.draw();
  };
  Viewer.prototype.draw = function () {
    var gl = this.gl, cv = this.cv, b = this.box; if (!b) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2, R = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2 + 0.5;
    var fov = 0.5, dist = R / Math.sin(fov / 2) * 0.86 / this.zoom * Math.max(1, (H / W) * 1.25);
    var eye = [cx + Math.cos(this.el) * Math.sin(this.az) * dist, b[4] * 0.3 + Math.sin(this.el) * dist, cz + Math.cos(this.el) * Math.cos(this.az) * dist];
    var tgt = [cx, b[4] * 0.12, cz];
    var VP = mul(persp(fov, W / H, 0.5, dist * 3), look(eye, tgt, [0, 1, 0]));
    var sun = [-0.42, 0.82, 0.38], sl = Math.hypot(sun[0], sun[1], sun[2]); sun = sun.map(function (v) { return v / sl; });
    var se = [cx + sun[0] * 30, sun[1] * 30, cz + sun[2] * 30];
    var LM = mul(ortho(-R, R, -R, R, 1, 70), look(se, [cx, 0, cz], [0, 1, 0]));
    // cienie
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); gl.viewport(0, 0, this.SS, this.SS);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.colorMask(false, false, false, false);
    gl.useProgram(this.SP); gl.uniformMatrix4fv(gl.getUniformLocation(this.SP, 'uL'), false, LM);
    gl.bindVertexArray(this.op.vao); gl.drawArrays(gl.TRIANGLES, 0, this.op.n);
    gl.colorMask(true, true, true, true); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // scena
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.P);
    var u = function (n) { return gl.getUniformLocation(this.P, n); }.bind(this);
    gl.uniformMatrix4fv(u('uVP'), false, VP); gl.uniformMatrix4fv(u('uL'), false, LM);
    gl.uniform3fv(u('uSun'), sun); gl.uniform3fv(u('uEye'), eye); gl.uniform1f(u('uA'), 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.depth); gl.uniform1i(u('uS'), 0);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.bindVertexArray(this.op.vao); gl.drawArrays(gl.TRIANGLES, 0, this.op.n);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.uniform1f(u('uA'), 0.5);
    gl.bindVertexArray(this.gl_.vao); gl.drawArrays(gl.TRIANGLES, 0, this.gl_.n);
    gl.depthMask(true); gl.disable(gl.BLEND);
  };

  function model(data, which) {
    var M = new Mesh(), G = new Mesh(), lv = data.levels;
    var base = lv[0], box = [Infinity, Infinity, -Infinity, -Infinity, WALL_H];
    lv.forEach(function (l, i) {
      if (which !== undefined && which !== i) return;
      var dx = l.ox - base.ox, dz = base.oy - l.oy, dy = which === undefined ? i * LEVEL_DZ : 0;
      buildLevel(M, l, dx, dz, dy, M, G);
      box[0] = Math.min(box[0], dx); box[1] = Math.min(box[1], dz); box[2] = Math.max(box[2], dx + l.w); box[3] = Math.max(box[3], dz + l.h);
    });
    // przytnij ramkę do faktycznej geometrii (bez marginesu 60 cm)
    // kadr wg ścian (tarasy mogą wychodzić poza kadr)
    var ext = [Infinity, Infinity, -Infinity, -Infinity];
    lv.forEach(function (l, i) {
      if (which !== undefined && which !== i) return;
      var dx = l.ox - base.ox, dz = base.oy - l.oy;
      l.walls.forEach(function (w) { ext[0] = Math.min(ext[0], w[0] + dx); ext[1] = Math.min(ext[1], w[1] + dz); ext[2] = Math.max(ext[2], w[2] + dx); ext[3] = Math.max(ext[3], w[3] + dz); });
    });
    if (!isFinite(ext[0])) for (var i = 0; i < M.p.length; i += 3) { ext[0] = Math.min(ext[0], M.p[i]); ext[1] = Math.min(ext[1], M.p[i + 2]); ext[2] = Math.max(ext[2], M.p[i]); ext[3] = Math.max(ext[3], M.p[i + 2]); }
    return { M: M, G: G, box: [ext[0], ext[1], ext[2], ext[3], box[4]] };
  }

  /* ---------- okno ---------- */
  var dlg = null, viewer = null, data = null, level = 0;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function ensure() {
    if (dlg) return;
    dlg = el('div', 'dh', '<div class="dh__in" role="dialog" aria-modal="true" aria-labelledby="dh-t">' +
      '<div class="dh__bar"><div><span class="caps dh__eyebrow">Wersja 3D</span><h3 class="display dh__t" id="dh-t"></h3></div>' +
      '<div class="dh__lv" hidden></div><button type="button" class="dh__x" aria-label="Zamknij">×</button></div>' +
      '<div class="dh__stage"><canvas class="dh__cv" aria-label="Model 3D mieszkania"></canvas><div class="dh__load caps">Ładowanie modelu…</div></div>' +
      '<div class="dh__foot"><span class="caps">Przeciągnij, aby obrócić · kółko lub dwa palce, aby przybliżyć</span><span class="dh__note">Wizualizacja poglądowa na podstawie rzutu architektonicznego. Aranżacja i&nbsp;wyposażenie przykładowe.</span></div></div>');
    document.body.appendChild(dlg);
    var cv = dlg.querySelector('canvas');
    try { viewer = new Viewer(cv); } catch (e) { viewer = null; }
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.dh__x')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dlg.classList.contains('is-open')) close(); });
    // obrót i przybliżenie
    var drag = null, pts = {};
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; drag = { az: viewer.az, el: viewer.el, x: e.clientX, y: e.clientY, z: viewer.zoom, d: null }; stopSpin(); });
    cv.addEventListener('pointermove', function (e) {
      if (!drag || !pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY];
      var k = Object.keys(pts);
      if (k.length === 2) {
        var a = pts[k[0]], b = pts[k[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (drag.d === null) { drag.d = d; drag.z = viewer.zoom; }
        viewer.zoom = Math.max(0.7, Math.min(3, drag.z * d / drag.d));
      } else {
        viewer.az = drag.az - (e.clientX - drag.x) * 0.008;
        viewer.el = Math.max(0.45, Math.min(1.45, drag.el + (e.clientY - drag.y) * 0.006));
      }
      req();
    });
    var up = function (e) { delete pts[e.pointerId]; if (!Object.keys(pts).length) drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); stopSpin(); viewer.zoom = Math.max(0.7, Math.min(3, viewer.zoom * Math.exp(-e.deltaY * 0.0012))); req(); }, { passive: false });
    window.addEventListener('resize', function () { if (dlg.classList.contains('is-open')) req(); });
  }
  var raf = null, spin = null;
  function req() { if (!raf && viewer) raf = requestAnimationFrame(function () { raf = null; viewer.draw(); }); }
  function stopSpin() { if (spin) { cancelAnimationFrame(spin); spin = null; } }
  function intro() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var t0 = null, a0 = viewer.az - 0.5, e0 = 1.2;
    (function step(ts) {
      if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 1600), e = 1 - Math.pow(1 - k, 3);
      viewer.az = a0 + 0.5 * e; viewer.el = e0 + (1.0 - e0) * e; viewer.draw();
      spin = k < 1 ? requestAnimationFrame(step) : null;
    })(performance.now());
  }
  function show(which) {
    var m = model(data, which);
    viewer.set(m.M, m.G, m.box);
  }
  function setLevels() {
    var box = dlg.querySelector('.dh__lv');
    if (data.levels.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = ['Poziom dolny', 'Poziom górny'].map(function (t, i) { return '<button type="button" class="chip caps" data-lv="' + i + '" aria-pressed="' + (i === 0) + '">' + t + '</button>'; }).join('');
    box.querySelectorAll('[data-lv]').forEach(function (b) {
      b.addEventListener('click', function () {
        box.querySelectorAll('[data-lv]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        show(+b.dataset.lv); intro();
      });
    });
  }
  function open(id, label) {
    ensure();
    dlg.querySelector('.dh__t').textContent = label || id;
    dlg.classList.add('is-open'); document.body.classList.add('dh-open');
    var load = dlg.querySelector('.dh__load'); load.hidden = false; load.textContent = 'Ładowanie modelu…';
    if (!viewer) { load.textContent = 'Ta przeglądarka nie obsługuje widoku 3D.'; return; }
    viewer.az = -0.62; viewer.el = 1.0; viewer.zoom = 1;
    fetch(BASE + encodeURIComponent(id) + '.json?v=1793989875').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) {
      data = d; setLevels(); show(0); load.hidden = true; intro();
    }).catch(function () { load.textContent = 'Model 3D tego lokalu jest w przygotowaniu.'; });
    setTimeout(function () { var x = dlg.querySelector('.dh__x'); if (x) x.focus({ preventScroll: true }); }, 50);
  }
  function close() { if (!dlg) return; stopSpin(); dlg.classList.remove('is-open'); document.body.classList.remove('dh-open'); }
  window.N75Doll = { open: open, close: close, has: function (id) { return (window.N75_3D || []).indexOf(id) >= 0; }, _model: model, _Viewer: Viewer };
})();
