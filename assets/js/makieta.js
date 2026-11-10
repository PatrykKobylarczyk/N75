/* Makieta 3D budynku N75 z otoczeniem.
   Dane: assets/data/makieta.json (bryła z rzutów DWG, poziomy z przekroju A-A, otoczenie z OpenStreetMap).
   Układ sceny: x – wzdłuż osi budynku (≈ wschód), z – ≈ południe, y – wysokość [m]; 0 = posadzka parteru. */
(function () {
  'use strict';
  var root = document.getElementById('mk3d'); if (!root) return;
  var cv = root.querySelector('canvas');
  var UNITS = {}; (window.N75_UNITS || []).forEach(function (u) { UNITS[u.id] = u; });
  var FMT = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

  /* ---------- geometria ---------- */
  function Mesh() { this.p = []; this.n = []; this.c = []; this.m = []; }
  Mesh.prototype.tri = function (a, b, c, col, mat, uv) {
    var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (var i = 0; i < 3; i++) { var v = i === 0 ? a : i === 1 ? b : c; this.p.push(v[0], v[1], v[2]); this.n.push(nx, ny, nz); if (uv) this.c.push(uv[i][0], uv[i][1], uv[i][2] || 0); else this.c.push(col[0] / 255, col[1] / 255, col[2] / 255); this.m.push(mat || 0); }
  };
  Mesh.prototype.quad = function (a, b, c, d, col, mat) { this.tri(a, b, c, col, mat); this.tri(a, c, d, col, mat); };
  function area2(P) { var s = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function earcut(P) {
    var n = P.length, idx = [], out = [];
    if (n < 3) return out;
    for (var i = 0; i < n; i++) idx.push(i);
    if (area2(P) < 0) idx.reverse();
    function inTri(p, a, b, c) {
      var d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]), d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]), d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    }
    var guard = 0;
    while (idx.length > 3 && guard++ < 20000) {
      var found = false;
      for (var k = 0; k < idx.length; k++) {
        var i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = P[i0], b = P[i1], c = P[i2];
        if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <= 1e-9) continue;
        var ok = true;
        for (var j = 0; j < idx.length; j++) { var q = idx[j]; if (q === i0 || q === i1 || q === i2) continue; if (inTri(P[q], a, b, c)) { ok = false; break; } }
        if (!ok) continue;
        out.push([i0, i1, i2]); idx.splice(k, 1); found = true; break;
      }
      if (!found) break;
    }
    if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
    return out;
  }
  Mesh.prototype.cap = function (P, y, col, mat, down) {
    var self = this; earcut(P).forEach(function (t) {
      var a = P[t[0]], b = P[t[1]], c = P[t[2]];
      // earcut zwraca trójkąty CCW w (x,z) → normalna w dół; odwracamy dla wierzchu
      if (down) self.tri([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], col, mat);
      else self.tri([a[0], y, a[1]], [c[0], y, c[1]], [b[0], y, b[1]], col, mat);
    });
  };
  Mesh.prototype.prism = function (P, y0, y1, col, topCol, mat, topMat, noBottom) {
    if (!P || P.length < 3 || y1 <= y0) return;
    if (area2(P) > 0) P = P.slice().reverse();
    this.cap(P, y1, topCol || col, topMat === undefined ? mat : topMat);
    if (!noBottom) this.cap(P, y0, col, mat, true);
    for (var i = 0; i < P.length; i++) {
      var p = P[i], q = P[(i + 1) % P.length]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-4) continue;
      this.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], col, mat);
    }
  };
  Mesh.prototype.box = function (x0, z0, x1, z1, y0, y1, col, mat) { this.prism([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0, y1, col, col, mat); };
  Mesh.prototype.cyl = function (cx, cz, r, y0, y1, col, seg) { var P = []; seg = seg || 20; for (var i = 0; i < seg; i++) { var a = -i / seg * Math.PI * 2; P.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } this.prism(P, y0, y1, col, col, 0, 0, true); };
  // belka wzdłuż odcinka a→b (szerokość w, wysokość y0..y1)
  Mesh.prototype.beam = function (a, b, w, y0, y1, col, mat) {
    var dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 1e-4) return;
    var nx = -dz / l * w / 2, nz = dx / l * w / 2;
    this.prism([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], y0, y1, col, col, mat, mat, true);
  };
  Mesh.prototype.sphere = function (cx, cy, cz, rx, ry, col, mat) {
    var S = 9, R = 6, V = [];
    for (var j = 0; j <= R; j++) { var v = j / R * Math.PI, row = []; for (var i = 0; i < S; i++) { var u = i / S * Math.PI * 2; row.push([cx + Math.sin(v) * Math.cos(u) * rx, cy + Math.cos(v) * ry, cz + Math.sin(v) * Math.sin(u) * rx]); } V.push(row); }
    for (var j2 = 0; j2 < R; j2++) for (var i2 = 0; i2 < S; i2++) { var a = V[j2][i2], b = V[j2][(i2 + 1) % S], c = V[j2 + 1][(i2 + 1) % S], d = V[j2 + 1][i2]; if (j2 > 0) this.tri(a, b, c, col, mat); if (j2 < R - 1) this.tri(a, c, d, col, mat); }
  };
  function inside(p, P) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function cen(P) { var a = 0, x = 0, z = 0; for (var i = 0; i < P.length; i++) { var p = P[i], q = P[(i + 1) % P.length], k = p[0] * q[1] - q[0] * p[1]; a += k; x += (p[0] + q[0]) * k; z += (p[1] + q[1]) * k; } return Math.abs(a) < 1e-6 ? P[0] : [x / (3 * a), z / (3 * a)]; }
  // przesunięcie wielokąta na zewnątrz o d (gzymsy)
  function offset(P, d) {
    if (area2(P) < 0) P = P.slice().reverse();               // CCW w (x,z): zewnętrzna normala = (dz, -dx)
    var n = P.length, out = [];
    for (var i = 0; i < n; i++) {
      var a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
      var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
      var n1 = [(b[1] - a[1]) / l1, -(b[0] - a[0]) / l1], n2 = [(c[1] - b[1]) / l2, -(c[0] - b[0]) / l2];
      var m = [n1[0] + n2[0], n1[1] + n2[1]], ml = Math.hypot(m[0], m[1]) || 1, cs = Math.max(0.35, (m[0] * n1[0] + m[1] * n1[1]) / ml);
      out.push([b[0] - m[0] / ml * d / cs, b[1] - m[1] / ml * d / cs]);
    }
    return out;
  }

  /* ---------- kolory i materiały ---------- */
  var C = {
    cream: [238, 231, 211], cornice: [244, 239, 224], stone: [224, 214, 192], bronze: [176, 148, 108], rail: [176, 148, 108], gate: [118, 88, 66], glass: [196, 222, 236],
    deck: [180, 152, 118], green: [128, 150, 96], ground: [222, 218, 210], road: [140, 140, 138], walk: [204, 200, 192], grass: [150, 172, 118],
    nb: [208, 207, 204], nbTop: [194, 193, 190], trunk: [104, 86, 70], leaf: [122, 146, 94], leaf2: [104, 132, 84], water: [150, 182, 196],
    wolne: [200, 164, 100], sky: [168, 180, 190], bike: [168, 163, 156], roof: [168, 167, 164], white: [242, 240, 236], ballast: [150, 145, 138], steel: [118, 118, 122], rezerwacja: [170, 112, 70], sprzedane: [150, 146, 138], pwall: [150, 140, 124], plate: [236, 230, 218], wall: [214, 206, 190]
  };
  // M: 1 elewacja, 2 trawertyn, 3 lamele mosiężne, 4 deski, 5 zieleń, 6 asfalt, 7 korony drzew, 8 sąsiednie budynki, 10 chodnik, 12 lokale (płaskie)

  /* ---------- budowa sceny ---------- */
  var D = null, FL = [], SCN = { env: null, floors: [], cut: null, glass: [] };
  function outward(P, a, b) {   // normalna na zewnątrz wielokąta dla krawędzi a→b
    var dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), n = [dz / l, -dx / l];
    var m = [(a[0] + b[0]) / 2 + n[0] * 0.05, (a[1] + b[1]) / 2 + n[1] * 0.05];
    return inside(m, P) ? [-n[0], -n[1]] : n;
  }
  function outAt(f, p) { return (D.floors[f].out || []).some(function (o) { return inside(p, o.p); }); }

  function facade(M, G, fl, top) {
    var f = fl.f, z0 = fl.z0 + (f === 0 ? -0.35 : 0), z1 = top || fl.z1;
    var wallC = f === 0 ? C.stone : C.cream, wallM = f === 0 ? 2 : f === 7 ? 3 : 1, wallCol = f === 7 ? C.bronze : wallC;
    var head = f === 0 ? 3.7 : 2.72, fr = 0.05, inset = 0.2;
    fl.mass.forEach(function (e) {
      var P = e.p;
      for (var i = 0; i < P.length; i++) {
        var a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.02) continue;
        var u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = outward(P, a, b);
        var at = function (s, o) { return [a[0] + u[0] * s + n[0] * o, a[1] + u[1] * s + n[1] * o]; };
        var V = function (s, o, y) { var q = at(s, o); return [q[0], y, q[1]]; };
        var g = (e.g[i] || []).map(function (iv) { return [iv[0] * L + 0.04, iv[1] * L - 0.04, iv[2]]; }).filter(function (iv) { return iv[1] - iv[0] > 0.4; });
        var s = 0;
        var solid = function (s0, s1) {
          if (s1 - s0 <= 0.005) return;
          M.quad(V(s0, 0, z0), V(s1, 0, z0), V(s1, 0, z1), V(s0, 0, z1), wallCol, wallM);
          // pilaster: lekko wysunięty pas muru między oknami (rytm elewacji)
          // parter od Narutowicza: pełne pola to bramy garażowe z bulajami
          if (f === 0 && n[1] < -0.6 && s1 - s0 >= 2.4) {
            var gw = Math.min(5.4, s1 - s0 - 0.16), gm = (s0 + s1) / 2, ga = gm - gw / 2, gb = gm + gw / 2, gh = fl.z0 + 3.55;
            M.quad(V(ga, 0.012, fl.z0), V(gb, 0.012, fl.z0), V(gb, 0.012, gh), V(ga, 0.012, gh), C.gate, 14);
            var bf = function (sa, sb, ya, yb2) { M.beam(at(sa, 0.03), at(sb, 0.03), 0.05, ya, yb2, C.bronze, 0); };
            bf(ga, ga + 0.06, fl.z0, gh); bf(gb - 0.06, gb, fl.z0, gh); bf(ga, gb, gh - 0.06, gh); bf(gm - 0.02, gm + 0.02, fl.z0, gh);
          }
          if (f >= 1 && f <= 6 && s1 - s0 > 0.25 && s1 - s0 < 2.4 && g.length) {
            var pa = s0 + 0.04, pb = s1 - 0.04, A = at(pa, 0), B = at(pb, 0), A2 = at(pa, 0.1), B2 = at(pb, 0.1);
            M.prism([A, B, B2, A2], fl.z0, z1 - 0.02, C.cornice, C.cornice, 1, 1, true);
          }
        };
        g.forEach(function (iv) {
          solid(s, iv[0]); s = iv[1];
          var s0 = iv[0], s1 = iv[1], yb = fl.z0 + 0.02, yh = Math.min(fl.z0 + head, z1), cut = yh >= z1 - 0.01;
          // nadproże / lamele nad witryną parteru
          if (cut) {} else if (f === 0) { M.quad(V(s0, 0, yh), V(s1, 0, yh), V(s1, 0, fl.z0 + 4.55), V(s0, 0, fl.z0 + 4.55), C.bronze, 3); M.quad(V(s0, 0, fl.z0 + 4.55), V(s1, 0, fl.z0 + 4.55), V(s1, 0, z1), V(s0, 0, z1), C.stone, 2); }
          else M.quad(V(s0, 0, yh), V(s1, 0, yh), V(s1, 0, z1), V(s0, 0, z1), wallCol, wallM);
          // ościeża (głębokość okna)
          M.quad(V(s0, 0, yb), V(s0, -inset, yb), V(s0, -inset, yh), V(s0, 0, yh), wallC, 1);
          M.quad(V(s1, -inset, yb), V(s1, 0, yb), V(s1, 0, yh), V(s1, -inset, yh), wallC, 1);
          if (!cut) M.quad(V(s0, 0, yh), V(s1, 0, yh), V(s1, -inset, yh), V(s0, -inset, yh), wallC, 1);
          M.quad(V(s0, -inset, yb), V(s1, -inset, yb), V(s1, 0, yb), V(s0, 0, yb), C.stone, 2);
          // szyba
          G.quad(V(s0, -inset, yb), V(s1, -inset, yb), V(s1, -inset, yh), V(s0, -inset, yh), C.glass, 9);
          // mosiężna rama, słupek i ślemię
          var bx = function (sa, sb, ya, yb2) { var A = at(sa, -inset + 0.03), B = at(sb, -inset + 0.03); M.beam(A, B, 0.06, ya, yb2, C.bronze, 0); };
          bx(s0, s0 + fr, yb, yh); bx(s1 - fr, s1, yb, yh); bx(s0, s1, yh - fr, yh); bx(s0, s1, yb, yb + fr);
          var w = s1 - s0;
          if (w > 0.9 && !iv[2]) { var sm = s0 + w / 2; bx(sm - fr / 2, sm + fr / 2, yb, yh); }   // jeden pionowy podział: lewo / prawo
          // francuski balkon: balustrada w licu elewacji (gdy okno nie wychodzi na loggię / taras)
          var mid = at((s0 + s1) / 2, 0.5);
          if (f >= 1 && f <= 6 && !iv[2] && ![0.3, 0.6, 1.0, 1.5].some(function (o) { return outAt(f, at((s0 + s1) / 2, o)); })) rail(M, at(s0 + 0.02, 0.06), at(s1 - 0.02, 0.06), yb, 1.0);
        });
        solid(s, L);
      }
    });
  }
  // balustrada: pochwyt + pręty co 11 cm
  // patio na stropie parteru (poziom +1) wg wizualizacji: żwirowa ścieżka z płytami, wyspy roślin, głazy, okrągły pokład z meblami, drzewa, bluszcz na ścianie sąsiada
  function patio(M, y) {
    var X = function (xi) { return 4.6 + (xi - 740) / 470 * 10.4; }, Z = function (yi) { return -9.3 + (yi - 210) / 700 * 14; };
    var blob = function (xi, yi, rx, rz, w, sd) { var P = []; for (var i = 0; i < 18; i++) { var a = -i / 18 * Math.PI * 2, k = 1 + w * Math.sin(a * 3 + sd) * 0.5 + w * Math.cos(a * 2 + sd * 1.7) * 0.3; P.push([X(xi) + Math.cos(a) * rx * k, Z(yi) + Math.sin(a) * rz * k]); } return P; };
    var gr = [196, 190, 178], ivy = [72, 98, 58], shrub = [86, 116, 70], shrub2 = [108, 138, 84], stone = [150, 148, 142], step = [214, 208, 196];
    M.box(X(740), Z(210), X(1210), Z(290), y, y + 0.12, C.walk, 10);                                  // pas płyt przy skrzydle północnym
    M.box(X(815), Z(290), X(1205), Z(345), y, y + 0.9, shrub, 5);                                     // żywopłot ogródka
    M.box(X(740), Z(290), X(815), Z(345), y, y + 0.12, C.grass, 5);
    rail(M, [X(740), Z(352)], [X(1210), Z(352)], y + 0.1, 1.3);                                       // ażurowe ogrodzenie z mosiężnych listew
    M.box(X(740), Z(355), X(1210), Z(885), y, y + 0.14, C.grass, 5);                                  // trawnik / runo
    M.box(X(740), Z(885), X(1210), Z(910), y, y + 0.12, C.walk, 10);                                  // pas płyt przy skrzydle południowym
    // żwirowa ścieżka meandrująca od góry do pokładu
    [[985, 405], [955, 440], [915, 470], [870, 500], [835, 530], [825, 570], [845, 610], [880, 640], [930, 650], [985, 640], [1040, 630], [1080, 610], [1110, 580],
     [835, 650], [850, 700], [880, 740], [930, 770], [975, 790]].forEach(function (q, i) { M.prism(blob(q[0], q[1], 0.95, 0.85, 0.25, i), y + 0.14, y + 0.17, gr, gr, 10); });
    [[960, 430], [900, 485], [842, 548], [870, 625], [945, 648], [1030, 628], [858, 700], [905, 752]].forEach(function (q, i) { M.prism(blob(q[0], q[1], 0.42, 0.32, 0.3, i * 2), y + 0.17, y + 0.2, step, step, 10); });   // płyty
    // wyspy roślin z krzewami
    [[930, 560, 1.5, 1.3], [790, 470, 0.9, 1.2], [790, 690, 0.9, 1.0], [930, 860, 1.1, 0.6], [1175, 430, 0.9, 1.2]].forEach(function (q, i) {
      M.prism(blob(q[0], q[1], q[2], q[3], 0.3, i), y + 0.14, y + 0.3, C.grass, C.grass, 5);
      for (var k = 0; k < 4; k++) { var a = k * 1.9 + i, rr = 0.5 * Math.min(q[2], q[3]); M.sphere(X(q[0]) + Math.cos(a) * rr, y + 0.55, Z(q[1]) + Math.sin(a) * rr, 0.55, 0.45, k % 2 ? shrub : shrub2, 7); }
    });
    // głazy
    [[905, 515], [940, 590], [880, 690], [950, 780], [810, 790], [1120, 650], [965, 455], [1000, 660]].forEach(function (q, i) { M.prism(blob(q[0], q[1], 0.38, 0.3, 0.6, i * 3), y + 0.14, y + 0.5 + (i % 3) * 0.12, stone, stone, 0, 0, true); });
    // okrągły pokład z dwoma stolikami i czterema krzesłami
    M.cyl(X(1065), Z(755), 2.1, y + 0.14, y + 0.24, C.deck, 28);
    [[1040, 765], [1075, 775]].forEach(function (q) { M.cyl(X(q[0]), Z(q[1]), 0.06, y + 0.24, y + 0.95, C.bronze, 8); M.cyl(X(q[0]), Z(q[1]), 0.36, y + 0.95, y + 0.99, C.deck, 18); });
    [[1025, 700, 0.6], [1105, 705, -0.6], [1025, 820, 2.5], [1110, 815, -2.5]].forEach(function (q) {
      var c = [X(q[0]), Z(q[1])], u = [Math.cos(q[2]), Math.sin(q[2])], v = [-u[1], u[0]];
      M.prism(orect(c, u, v, 0.28, 0.32), y + 0.24, y + 0.68, [120, 96, 74], [120, 96, 74], 0, 0, true);
    });
    // drzewa (wielopniowe, lekkie korony)
    [[1180, 590, 3.0, 6.2], [990, 615, 2.1, 5.0]].forEach(function (q, i) {
      var x = X(q[0]), z = Z(q[1]); M.cyl(x, z, 0.12, y + 0.14, y + q[3] * 0.5, C.trunk, 8);
      M.sphere(x, y + q[3] * 0.7, z, q[2], q[3] * 0.33, i ? C.leaf : C.leaf2, 7); M.sphere(x + 0.6, y + q[3] * 0.9, z - 0.4, q[2] * 0.7, q[3] * 0.25, C.leaf, 7);
    });
    // bluszcz na ścianie sąsiada (poszarpana górna krawędź)
    for (var zz = Z(300); zz < Z(905); zz += 0.6) { var hh = 3.2 + 2.6 * Math.abs(Math.sin(zz * 1.7) * Math.cos(zz * 0.6)); M.box(14.98, zz, 15.08, zz + 0.62, y + 0.1, y + hh, ivy, 5); }
  }
  function rail(M, a, b, y0, h) {
    var L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.2) return;
    M.beam(a, b, 0.045, y0 + h - 0.04, y0 + h, C.rail); M.beam(a, b, 0.035, y0 + 0.06, y0 + 0.1, C.rail);
    var n = Math.max(2, Math.round(L / 0.11));
    for (var k = 0; k <= n; k++) {
      var t = k / n, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dx = (b[0] - a[0]) / L * 0.008, dz = (b[1] - a[1]) / L * 0.008;
      M.beam([p[0] - dx, p[1] - dz], [p[0] + dx, p[1] + dz], 0.016, y0 + 0.02, y0 + h - 0.04, C.rail);
    }
  }

  function buildFloor(fl) {
    var M = new Mesh(), G = new Mesh(), f = fl.f;
    // strop / gzyms
    fl.slab.forEach(function (P) {
      if (f === 0) { M.prism(P, -0.36, 0.0, C.stone, C.walk, 2, 10); return; }
      if (f === 1) M.prism(offset(P, 0.12), fl.z0 - 0.95, fl.z0, C.stone, C.cornice, 2, 1);
      else { M.prism(offset(P, 0.34), fl.z0 - 0.38, fl.z0 + 0.06, C.cornice, C.cornice, 1); M.prism(offset(P, 0.16), fl.z0 - 0.52, fl.z0 - 0.38, [206, 197, 176], [206, 197, 176], 1); }
    });
    // tarasy, loggie, zielone dachy
    if (f === 1) patio(M, fl.z0 + 0.02);
    (fl.out || []).forEach(function (o) { M.prism(o.p, fl.z0 + 0.03, fl.z0 + 0.1, o.t === 'dach' ? C.green : C.deck, o.t === 'dach' ? C.green : C.deck, o.t === 'dach' ? 5 : 4); });
    facade(M, G, fl);
    (fl.cols || []).forEach(function (c) { M.prism(c, fl.z0, fl.z1, C.cream, C.cream, 1, 1); });
    (fl.rails || []).forEach(function (r) { if (Math.hypot(r[2] - r[0], r[3] - r[1]) > 0.7) rail(M, [r[0], r[1]], [r[2], r[3]], fl.z0 + 0.05, 1.1); });
    // dach nad ostatnią kondygnacją
    if (f === 7) fl.mass.forEach(function (e) { M.prism(offset(e.p, 0.25), fl.z1, fl.z1 + 0.45, C.cornice, C.cornice, 1); M.prism(offset(e.p, -0.35), fl.z1 + 0.45, fl.z1 + 0.52, C.roof, C.roof, 10, 10, true); });   // dach: szara papa / płyty
    return { M: M, G: G };
  }
  // przekrój kondygnacji: płyta, niskie ściany i lokale w kolorach statusu
  function buildCut(f) {
    var fl = D.floors[f], M = new Mesh(), G = new Mesh(), y = fl.z0;
    fl.slab.forEach(function (P) { M.prism(f === 1 ? offset(P, 0.12) : offset(P, 0.22), y - 0.42, y, C.cornice, C.plate, 1, 0); });
    if (f === 1) patio(M, y + 0.02);
    (fl.out || []).forEach(function (o) { M.prism(o.p, y + 0.03, y + 0.1, o.t === 'dach' ? C.green : C.deck, o.t === 'dach' ? C.green : C.deck, o.t === 'dach' ? 5 : 4); });
    var low = { f: fl.f, z0: fl.z0, z1: fl.z0 + 1.15, mass: fl.mass, out: fl.out };
    facade(M, G, low, fl.z0 + 1.15);
    (fl.cols || []).forEach(function (c) { M.prism(c, y, y + 1.15, C.cream, C.cream, 1, 1); });
    fl.mass.forEach(function (e) { M.cap(area2(e.p) > 0 ? e.p.slice().reverse() : e.p, y + 0.02, C.plate, 0); });
    (fl.rails || []).forEach(function (r) { if (Math.hypot(r[2] - r[0], r[3] - r[1]) > 0.7) rail(M, [r[0], r[1]], [r[2], r[3]], y + 0.05, 1.1); });
    var U = new Mesh();
    PICK = [];
    Object.keys(D.units).forEach(function (id) {
      D.units[id].forEach(function (lv) {
        if (lv.f !== f) return;
        var u = UNITS[id] || {}, st = u.status || 'wolne', col = id === HOVER ? lighten(C[st] || C.wolne) : (C[st] || C.wolne);
        (lv.w || []).forEach(function (w) { M.box(Math.min(w[0], w[2]), Math.min(w[1], w[3]), Math.max(w[0], w[2]), Math.max(w[1], w[3]), y + 0.02, y + 0.42, C.pwall, 0); });   // lekki rzut: ściany
        lv.p.forEach(function (P) { U.prism(P, y + 0.03, y + 0.62, col, col, 12); PICK.push({ id: id, P: P, y: y + 0.62 }); });   // półprzezroczysty mosiądz
      });
    });
    return { M: M, G: G, U: U };
  }
  // prostokąt obrócony: środek c, kierunek u (długość 2·hu), prostopadle v (2·hv)
  function orect(c, u, v, hu, hv) { return [[c[0] + u[0] * hu + v[0] * hv, c[1] + u[1] * hu + v[1] * hv], [c[0] - u[0] * hu + v[0] * hv, c[1] - u[1] * hu + v[1] * hv], [c[0] - u[0] * hu - v[0] * hv, c[1] - u[1] * hu - v[1] * hv], [c[0] + u[0] * hu - v[0] * hv, c[1] + u[1] * hu - v[1] * hv]]; }
  // siatka punktów wewnątrz wielokąta, w układzie jego najdłuższej krawędzi; rows=true: rzędy miejsc postojowych (2×5 m + alejka 6 m)
  function grid(P, su, sv, fn, margin, rows) {
    var bi = 0, bl = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > bl) { bl = l; bi = i; } }
    var a0 = P[bi], b0 = P[(bi + 1) % P.length], u = [(b0[0] - a0[0]) / bl, (b0[1] - a0[1]) / bl], v = [-u[1], u[0]];
    var us = P.map(function (p) { return (p[0] - a0[0]) * u[0] + (p[1] - a0[1]) * u[1]; }), vs = P.map(function (p) { return (p[0] - a0[0]) * v[0] + (p[1] - a0[1]) * v[1]; });
    var u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us), v0 = Math.min.apply(null, vs), v1 = Math.max.apply(null, vs);
    var V = []; if (rows) { for (var r = v0 + 2.6; r < v1 - 2; r += 16) { V.push(r); if (r + 5 < v1 - 2) V.push(r + 5); } } else for (var q = v0 + sv / 2; q < v1; q += sv) V.push(q);
    var at = function (uu, vv) { return [a0[0] + u[0] * uu + v[0] * vv, a0[1] + u[1] * uu + v[1] * vv]; };
    V.forEach(function (vv) { for (var uu = u0 + su / 2 + margin; uu < u1 - margin; uu += su) { var c = at(uu, vv), ok = [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(function (k) { return inside(at(uu + k[0] * (rows ? 1 : 2), vv + k[1] * (rows ? 2.3 : 1)), P); }); if (ok && inside(c, P)) fn(c, u, v); } });
  }
  function lighten(c) { return c.map(function (v) { return Math.min(255, v + 45); }); }
  function buildEnv() {
    var M = new Mesh(), e = D.env, R = 330;
    M.prism([[-R, -R], [R, -R], [R, R], [-R, R]], -0.6, -0.36, C.ground, C.ground, 10, 10, true);
    e.g.forEach(function (P) { M.cap(area2(P) > 0 ? P.slice().reverse() : P, -0.33, C.grass, 5); });
    e.w.forEach(function (P) { M.cap(area2(P) > 0 ? P.slice().reverse() : P, -0.31, C.water, 0); });
    e.r.forEach(function (r) {
      var P = r.p, w = r.w, col = w <= 2.5 ? C.walk : C.road, mat = w <= 2.5 ? 10 : 6, y = w <= 2.5 ? -0.32 : -0.34;
      for (var i = 0; i + 1 < P.length; i++) { var a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.01) continue; var nx = -dz / l * w / 2, nz = dx / l * w / 2, ex = dx / l * w / 2, ez = dz / l * w / 2;
        M.quad([a[0] + nx - ex, y, a[1] + nz - ez], [a[0] - nx - ex, y, a[1] - nz - ez], [b[0] - nx + ex, y, b[1] - nz + ez], [b[0] + nx + ex, y, b[1] + nz + ez], col, mat); }
    });
    // przejścia dla pieszych: pasy (zebra) w poprzek jezdni
    e.r.forEach(function (r) {
      if (!r.c) return; var P = r.p;
      for (var i = 0; i + 1 < P.length; i++) {
        var a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1) continue; var u = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], v = [-u[1], u[0]];
        for (var t = 0.25; t < l - 0.3; t += 1.0) { var c = [a[0] + u[0] * (t + 0.25), a[1] + u[1] * (t + 0.25)]; M.prism(orect(c, u, v, 0.25, 1.9), -0.33, -0.318, C.white, C.white, 0, 0, true); }
      }
    });
    // rysowane elewacje pierzei Narutowicza (ten sam rysunek co animacja „pierzeja” na stronie); px – zakres rysunku, t – linia gzymsu
    var PZ = [{ x: 27, px: [1278, 1571], t: 106 }, { x: 50, px: [970, 1278], t: 130 }, { x: 73, px: [711, 970], t: 157 }, { x: 98, px: [410, 711], t: 121 }, { x: 148, px: [27, 358], t: 87 },
      // na zachód od N75 (drugi pas atlasu): Okręgowy Urząd Miar, żółty biurowiec, beżowa kamienica
      { x: -59.5, px: [60, 279], t: 448, b: 844, d: 4 }, { x: -78, px: [360, 670], t: 661, b: 844 }, { x: -112, px: [700, 1280], t: 618, b: 844 }];
    // pozostałe budynki: proceduralny szkic elewacji (okna, gzymsy, bramy) rysowany w shaderze (M 16)
    var OCC = e.b.map(function (b) { var xs = b.p.map(function (q) { return q[0]; }), zs = b.p.map(function (q) { return q[1]; }); return { p: b.p, x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), z0: Math.min.apply(null, zs), z1: Math.max.apply(null, zs) }; });
    (function () { var sl = D.floors[1].slab[0], xs = sl.map(function (q) { return q[0]; }), zs = sl.map(function (q) { return q[1]; }); OCC.push({ p: sl, x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), z0: Math.min.apply(null, zs), z1: Math.max.apply(null, zs) }); })();
    function inPoly(P, x, z) { var r = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) r = !r; } return r; }
    function covered(x, z, self) { for (var i = 0; i < OCC.length; i++) { var o = OCC[i]; if (o.p === self || x < o.x0 || x > o.x1 || z < o.z0 || z > o.z1) continue; if (inPoly(o.p, x, z)) return true; } return false; }
    // wieża narożna Rektoratu UŁ: gzyms, kondygnacja z łukowymi oknami, gzyms, ośmioboczny bęben, kopuła z latarnią i iglicą
    function tower(M, b) {
      var c = cen(b.p), h = b.h, zinc = [132, 144, 150], ink = [92, 84, 76], wall = [222, 220, 214];
      M.prism(offset(b.p, 0.4), h - 0.35, h, wall, wall, 0, 0, true);
      var P2 = offset(b.p, -0.45); M.prism(P2, h, h + 3.4, wall, C.nbTop, 0, 0, true);
      for (var i = 0; i < P2.length; i++) {            // po dwa wysokie, łukowe okna na każdej ścianie
        var a = P2[i], q = P2[(i + 1) % P2.length], l = Math.hypot(q[0] - a[0], q[1] - a[1]), u = [(q[0] - a[0]) / l, (q[1] - a[1]) / l], nn = [u[1], -u[0]];
        if ((c[0] - a[0]) * nn[0] + (c[1] - a[1]) * nn[1] > 0) nn = [-nn[0], -nn[1]];
        [0.3, 0.7].forEach(function (t) {
          var m = [a[0] + u[0] * l * t + nn[0] * 0.03, a[1] + u[1] * l * t + nn[1] * 0.03];
          M.prism(orect(m, u, nn, 0.42, 0.02), h + 0.7, h + 2.5, ink, ink, 0, 0, true);
          var arc = []; for (var k = 0; k <= 8; k++) { var an = k / 8 * Math.PI; arc.push([Math.cos(an) * 0.42, Math.sin(an) * 0.42]); }
          for (var k2 = 0; k2 < 8; k2++) { var p0 = arc[k2], p1 = arc[k2 + 1]; var A = [m[0] + u[0] * p0[0], h + 2.5 + p0[1], m[1] + u[1] * p0[0]], B = [m[0] + u[0] * p1[0], h + 2.5 + p1[1], m[1] + u[1] * p1[0]], C0 = [m[0], h + 2.5, m[1]]; M.tri(C0, A, B, ink, 0); M.tri(C0, B, A, ink, 0); }
        });
      }
      M.prism(offset(b.p, -0.15), h + 3.4, h + 3.8, wall, wall, 0, 0, true);
      var oct = function (r) { var P = []; for (var k = 0; k < 8; k++) { var an = (k + 0.5) / 8 * Math.PI * 2; P.push([c[0] + Math.cos(an) * r, c[1] + Math.sin(an) * r]); } return P; };
      M.prism(oct(2.15), h + 3.8, h + 4.9, wall, wall, 0, 0, true);
      M.sphere(c[0], h + 4.9, c[1], 2.15, 2.3, zinc, 0);
      M.prism(oct(0.5), h + 6.9, h + 7.9, wall, zinc, 0, 0, true);
      M.sphere(c[0], h + 7.9, c[1], 0.5, 0.5, zinc, 0);
      M.prism(oct(0.06), h + 8.3, h + 9.6, ink, ink, 0, 0, true);
    }
    function sketchWalls(b) {
      var P = b.p, A = area2(P), ar = Math.abs(A) / 2, rnd = Math.abs(Math.sin(P[0][0] * 12.9898 + P[0][1] * 78.233) * 43758.5453) % 1;
      var k = b.k !== undefined ? b.k : b.h < 4.5 ? 3 : (b.i || (b.h <= 12 && ar > 900)) ? 2 : b.h > 20 ? 1 : 0, spN = [3.3 + rnd * 0.5, 2.6 + rnd * 0.4, 5.5, 3.2][k];
      for (var i = 0; i < P.length; i++) {
        var a = P[i], c = P[(i + 1) % P.length];
        if (b._E && b._E.some(function (q) { return q[0] === a; })) continue;
        var dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz); if (l < 1.2) continue;
        var nx = dz / l, nz = -dx / l; if (A < 0) { nx = -nx; nz = -nz; }
        var mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2;
        if (inPoly(P, mx + nx * 0.3, mz + nz * 0.3)) { nx = -nx; nz = -nz; }
        if (covered(mx + nx * 0.6, mz + nz * 0.6, P)) continue;          // ściana szczytowa przy sąsiednim budynku
        var n = Math.max(1, Math.round(l / spN)), sp = l / n, spq = Math.round(sp * 10) * 1000, kz = k * 1000 + b.h;
        var o = 0.04, Aa = [a[0] + nx * o, a[1] + nz * o], Cc = [c[0] + nx * o, c[1] + nz * o], y0 = -0.3, y1 = b.h;
        M.tri([Aa[0], y0, Aa[1]], [Cc[0], y0, Cc[1]], [Cc[0], y1, Cc[1]], C.nb, 16, [[0, spq + y0 + 0.5, kz], [n, spq + y0 + 0.5, kz], [n, spq + y1 + 0.5, kz]].map(function (q) { return q; }));
        M.tri([Aa[0], y0, Aa[1]], [Cc[0], y1, Cc[1]], [Aa[0], y1, Aa[1]], C.nb, 16, [[0, spq + y0 + 0.5, kz], [n, spq + y1 + 0.5, kz], [0, spq + y1 + 0.5, kz]]);
      }
    }
    function drawnFront(b) {
      var P = b.p, xs = P.map(function (q) { return q[0]; }), zs = P.map(function (q) { return q[1]; }), bx0 = Math.min.apply(null, xs), bx1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs);
      if (z0 > -10 || z0 < -30) return;
      var f = PZ.filter(function (q) { return q.x > bx0 && q.x < bx1; })[0]; if (!f) return;
      var E = [], cx = xs.reduce(function (a, v) { return a + v; }, 0) / P.length, cz = zs.reduce(function (a, v) { return a + v; }, 0) / P.length;
      for (var i = 0; i < P.length; i++) { var a = P[i], c = P[(i + 1) % P.length]; if (Math.abs(c[1] - a[1]) < 0.25 * Math.abs(c[0] - a[0]) && (a[1] + c[1]) / 2 < z0 + (f.d || 1.5) && Math.abs(c[0] - a[0]) > 0.5) E.push([a, c]); }
      if (!E.length) return;
      b._E = E;
      var fx0 = Math.min.apply(null, E.map(function (q) { return Math.min(q[0][0], q[1][0]); })), fx1 = Math.max.apply(null, E.map(function (q) { return Math.max(q[0][0], q[1][0]); }));
      var U = function (x) { return (f.px[1] - (x - fx0) / (fx1 - fx0) * (f.px[1] - f.px[0])) / 2172; }, vb = (f.b || 409) / 870, vt = f.t / 870;
      E.forEach(function (q) {
        var a = q[0], c = q[1], dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;
        if (nx * (a[0] - cx) + nz * (a[1] - cz) < 0) { nx = -nx; nz = -nz; }
        var o = 0.05, A = [a[0] + nx * o, a[1] + nz * o], Cc = [c[0] + nx * o, c[1] + nz * o];
        var ua = U(a[0]), uc = U(c[0]);
        M.tri([A[0], -0.3, A[1]], [Cc[0], -0.3, Cc[1]], [Cc[0], b.h, Cc[1]], [uc * 255, vb * 255, 0], 15, [[ua, vb], [uc, vb], [uc, vt]]);
        M.tri([A[0], -0.3, A[1]], [Cc[0], b.h, Cc[1]], [A[0], b.h, A[1]], [ua * 255, vt * 255, 0], 15, [[ua, vb], [uc, vt], [ua, vt]]);
      });
    }
    e.b.forEach(function (b) {
      M.prism(b.p, -0.36, b.h, C.nb, C.nbTop, 8, 8, true); drawnFront(b); sketchWalls(b);
      if (b.d) tower(M, b);
      if (b.r) {   // dach czterospadowy (kryty blachą/papą) na prostokącie obrysu
        var xs = b.p.map(function (q) { return q[0]; }), zs = b.p.map(function (q) { return q[1]; }), X0 = Math.min.apply(null, xs) - 0.3, X1 = Math.max.apply(null, xs) + 0.3, Z0 = Math.min.apply(null, zs) - 0.3, Z1 = Math.max.apply(null, zs) + 0.3;
        var hr = b.h, ht = b.h + b.r, rc = [118, 120, 124], zc = (Z0 + Z1) / 2, hd = (Z1 - Z0) / 2, ra = [X0 + hd, ht, zc], rb = [X1 - hd, ht, zc];
        var c00 = [X0, hr, Z0], c10 = [X1, hr, Z0], c11 = [X1, hr, Z1], c01 = [X0, hr, Z1];
        M.tri(c00, c10, rb, rc, 0); M.tri(c00, rb, ra, rc, 0); M.tri(c11, c01, ra, rc, 0); M.tri(c11, ra, rb, rc, 0); M.tri(c01, c00, ra, rc, 0); M.tri(c10, c11, rb, rc, 0);
        M.tri(c10, c00, rb, rc, 0); M.tri(rb, c00, ra, rc, 0); M.tri(c01, c11, ra, rc, 0); M.tri(ra, c11, rb, rc, 0); M.tri(c00, c01, ra, rc, 0); M.tri(c11, c10, rb, rc, 0);
      }
      if (b.i && Math.abs(area2(b.p)) > 600) grid(b.p, 6.5, 5.5, function (c, u, v) { M.prism(orect(c, u, v, 2.2, 0.8), b.h, b.h + 0.55, C.sky, C.sky, 0, 0, true); }, 1.2);   // świetliki hal zajezdni
    });
    // chodnik granitowy między budynkiem a zielenią
    (function () {
      var sl = D.floors[1].slab[0], bz = Math.max.apply(null, sl.map(function (p) { return p[1]; })), x0 = -21.6, x1 = Math.max.apply(null, sl.map(function (p) { return p[0]; }));
      var y = -0.325, za = bz + 0.05, zb = 23.15, x2 = 116, zm = (za + zb) / 2;
      // prosty chodnik z płyt granitowych tuż przy budynku, w linii z przejściem wzdłuż tyłów pierzei (do chodnika ulicy na wschodzie)
      M.box(x0, za, x2, zb, y - 0.01, y + 0.004, [184, 182, 178], 10);
      M.box(x0, zb, x2, zb + 0.15, y - 0.01, y + 0.04, C.stone, 0);                     // obrzeże
      M.box(x0, zb + 0.15, x1, bz + 5, y - 0.01, y + 0.002, C.grass, 5);               // pas trawy do skweru
    })();
    // parkingi (bez aut)
    var CARS = [[236, 236, 234], [40, 42, 46], [150, 152, 156], [196, 198, 200], [52, 66, 92], [128, 34, 30], [84, 86, 90], [226, 222, 214]], ci = 0;
    (e.k || []).forEach(function (P) {
      M.cap(area2(P) > 0 ? P.slice().reverse() : P, -0.335, C.road, 6);
    });
    // tory tramwajowe
    (e.tr || []).forEach(function (P) {
      for (var i = 0; i + 1 < P.length; i++) { var a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) continue; var n = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
        M.beam(a, b, 2.9, -0.36, -0.325, C.ballast, 0);
        [-0.72, 0.72].forEach(function (o) { M.beam([a[0] + n[0] * o, a[1] + n[1] * o], [b[0] + n[0] * o, b[1] + n[1] * o], 0.08, -0.33, -0.26, C.steel, 0); }); }
    });
    e.t.forEach(function (t, i) {
      var h = 7 + ((i * 37) % 7), r = 2.6 + ((i * 13) % 5) * 0.35, x = t[0], z = t[1];
      M.prism([[x - .18, z - .18], [x + .18, z - .18], [x + .18, z + .18], [x - .18, z + .18]], -0.36, h * 0.55, C.trunk, C.trunk, 0, 0, true);
      M.sphere(x, h * 0.62, z, r, h * 0.38, i % 3 ? C.leaf : C.leaf2, 7);
    });
    return M;
  }

  /* ---------- WebGL ---------- */
  var VS = '#version 300 es\nlayout(location=0) in vec3 p;layout(location=1) in vec3 n;layout(location=2) in vec3 c;layout(location=3) in float m;' +
    'uniform mat4 uVP,uL;out vec3 vP,vN,vC;out float vM;out vec4 vL;void main(){vP=p;vN=n;vC=c;vM=m;vL=uL*vec4(p,1.);gl_Position=uVP*vec4(p,1.);}';
  var FS = '#version 300 es\nprecision highp float;in vec3 vP,vN,vC;in float vM;in vec4 vL;uniform sampler2D uS,uF;uniform float uFT;uniform vec3 uSun,uEye;uniform float uA;out vec4 o;' +
    'vec3 lin(vec3 c){return pow(c,vec3(2.2));}float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float LX(float d,float f,float w){return 1.-smoothstep(w,w+f,abs(d));}' +
    'float BX(float ds,float y,float hw,float a,float b,float fx,float fy,float w){float iy=smoothstep(a-fy,a,y)*(1.-smoothstep(b,b+fy,y));float ix=1.-smoothstep(hw,hw+fx,ds);return max(LX(ds-hw,fx,w)*iy,max(LX(y-a,fy,w),LX(y-b,fy,w))*ix);}' +
    'float sketch(vec3 c){float q=floor(c.y/1000.);float sp=q/10.;float y=c.y-q*1000.-.5;float k=floor(c.z/1000.);float H=c.z-k*1000.;' +
    'float cu=fract(c.x)-.5;float ds=abs(cu)*sp;float fx=fwidth(c.x)*sp+1e-4,fy=fwidth(c.y)+1e-4;float w=.04;float ink=LX(y-H+.04,fy,w*1.4);' +
    'if(k<.5){float g=4.;float fl=3.4;float hw=min(.62,sp*.3);ink=max(ink,LX(y-H+.9,fy,w*1.6));ink=max(ink,.5*LX(y-H+.72,fy,w));ink=max(ink,LX(y-g+.15,fy,w*1.4));ink=max(ink,.5*LX(y-.45,fy,w));' +
    'float sw=min(1.05,sp*.38);ink=max(ink,BX(ds,y,sw,.6,3.3,fx,fy,w));ink=max(ink,.8*LX(ds,fx,w)*step(.6,y)*step(y,3.3));' +
    'float j=floor((y-g)/fl);float b0=g+j*fl+.85;float b1=b0+1.8;if(j>=0.&&b1<H-1.1){ink=max(ink,BX(ds,y,hw,b0,b1,fx,fy,w));ink=max(ink,.45*BX(ds,y,hw+.14,b0-.14,b1+.14,fx,fy,w*.8));ink=max(ink,.85*LX(ds,fx,w*.8)*step(b0,y)*step(y,b1));ink=max(ink,LX(y-b0+.1,fy,w*1.5)*step(ds,hw+.22));}}' +
    'else if(k<1.5){float g=3.2;float fl=2.85;float hw=min(.8,sp*.33);ink=max(ink,.5*LX(y-H+.6,fy,w));float j=floor((y-.0)/fl);float b0=j*fl+.85;float b1=b0+1.45;if(b1<H-.5){ink=max(ink,BX(ds,y,hw,b0,b1,fx,fy,w));ink=max(ink,.8*LX(ds,fx,w*.8)*step(b0,y)*step(y,b1));}ink=max(ink,.3*LX(y-j*fl,fy,w*.7));}' +
    'else if(k<2.5){float hw=sp*.38;float b1=min(H-.8,5.2);float gate=step(abs(mod(floor(c.x),5.)-2.),.1);if(gate>.5){ink=max(ink,BX(ds,y,min(1.8,sp*.4),0.,3.8,fx,fy,w*1.3));ink=max(ink,.4*LX(fract(y/.35)-.5,fy/.35,.06)*step(ds,min(1.8,sp*.4))*step(y,3.8));}else if(b1>2.6){ink=max(ink,BX(ds,y,hw,2.2,b1,fx,fy,w));ink=max(ink,.8*LX(ds-hw/3.,fx,w*.7)*step(2.2,y)*step(y,b1));ink=max(ink,.8*LX(ds,fx,w*.7)*step(2.2,y)*step(y,b1)*0.);}}' +
    'else{float hw=sp*.38;ink=max(ink,BX(ds,y,hw,0.,min(2.3,H-.4),fx,fy,w));ink=max(ink,.35*LX(fract(y/.3)-.5,fy/.3,.07)*step(ds,hw)*step(y,min(2.3,H-.4)));}' +
    'return clamp(ink,0.,1.)*.85;}' +
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
    'float sh(){vec3 q=vL.xyz/vL.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z>1.)return 1.;float s=0.;vec2 t=1./vec2(textureSize(uS,0));' +
    'for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uS,q.xy+vec2(x,y)*t*1.5).r;s+=q.z-.0009>d?0.:1.;}return s/9.;}' +
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 col=lin(vC);int M=int(vM+.5);vec2 hz=abs(N.x)>abs(N.z)?vP.zy:vP.xy;' +
    'if(M==16){col=lin(mix(vec3(.86,.85,.83),vec3(.3,.27,.24),sketch(vC)));}' +
    'if(M==15){float k=texture(uF,vC.xy).a*uFT;col=lin(mix(vec3(.86,.85,.83),vec3(.3,.27,.24),k));}' +
    'if(M==1){vec2 q=N.y>.5?vP.xz:hz;col*=.95+.04*vn(q*3.)+.07*h(floor(q*180.))+.04*vn(q*45.);}' +
    'if(M==2){vec2 q=N.y>.5?vP.xz:hz;float jy=fract(q.y/.6),jx=fract((q.x+floor(q.y/.6)*.6)/1.2);col*=mix(.82,1.,smoothstep(0.,.03,min(jy,1.-jy)))*mix(.85,1.,smoothstep(0.,.015,min(jx,1.-jx)));' +
    'col*=.93+.1*vn(q*vec2(1.2,6.)+vn(q*2.)*2.);}' +
    'if(M==3&&N.y<.5){float s=fract(hz.x/.11);col*=mix(.45,1.15,smoothstep(.1,.35,s)*smoothstep(.9,.65,s));}' +
    'if(M==14){vec2 q=hz/.3;vec2 c=fract(q)-.5;float r=length(c);col*=mix(.42,1.,smoothstep(.27,.31,r))*mix(1.25,1.,smoothstep(.31,.36,r));}' +
    'if(M==4&&N.y>.5){float s=fract(vP.x*6.9),bi=floor(vP.x*6.9);float w=fwidth(vP.x*6.9)*1.5;col*=mix(.68,1.,smoothstep(.04,.04+w+.06,min(s,1.-s)));col*=.9+.16*h(vec2(bi,floor(vP.z*.45+h(vec2(bi,3.))*3.)));col*=1.-.04*sin(vP.z*60.+bi*5.);}' +
    'if(M==5){col*=.8+.35*vn(vP.xz*.9)+.1*h(floor(vP.xz*8.));}' +
    'if(M==6){col*=.9+.12*vn(vP.xz*.7)+.05*h(floor(vP.xz*30.));}' +
    'if(M==7){col*=.75+.45*vn(vP.xz*1.6+vP.y*1.3)+.08*h(floor(vP.xz*9.+vP.y*9.));}' +
    'if(M==8&&N.y<.5){float fy=fract(vP.y/3.2);col*=mix(.9,1.,smoothstep(0.,.05,min(fy,1.-fy)));}' +
    'if(M==10&&N.y>.5){vec2 g=fract(vP.xz/1.);col*=mix(.93,1.,smoothstep(0.,.03,min(min(g.x,1.-g.x),min(g.y,1.-g.y))));}' +
    'if(M==9){vec3 V=normalize(uEye-vP);float fr=pow(1.-abs(dot(N,V)),2.5);vec3 R=reflect(-V,N);float az=atan(R.z,R.x);' +
    'float hz=.07+.05*sin(az*7.)*sin(az*3.1+1.)+.03*sin(az*23.+2.);float lf=fract(sin(floor(az*40.)*91.7)*43758.5);' +
    'vec3 env=R.y>hz?mix(vec3(.80,.86,.92),vec3(.52,.66,.84),clamp((R.y-hz)*1.6,0.,1.)):R.y>-.4?mix(vec3(.40,.47,.50),vec3(.58,.64,.68),lf*.55+.25*smoothstep(hz-.08,hz,R.y)+.15*sin(R.y*40.+az*9.)):vec3(.55,.57,.6);' +
    'vec3 c=mix(col*.5,env,.55+fr*.3);o=vec4(pow(c,vec3(1./2.2)),min(1.,uA*1.65+fr*.15));return;}' +
    'float ndl=max(dot(N,uSun),0.),s=sh();vec3 sky=vec3(.82,.88,1.),bnc=vec3(.78,.74,.68);vec3 amb=mix(bnc*.62,sky*.8,N.y*.5+.5);' +
    'float ao=M==8||M==15||M==16||M==1||M==2||M==3?mix(.78,1.,smoothstep(-.3,6.,vP.y)):1.;' +
    'vec3 sunC=vec3(1.,.93,.8)*1.12;vec3 L=col*(amb*ao+sunC*ndl*mix(.16,1.,s));' +
    'if(M==12){vec3 V0=normalize(uEye-vP);L=col*(.78+.25*ndl)+vec3(1.,.9,.7)*pow(max(dot(N,normalize(uSun+V0)),0.),24.)*.35;}' +
    'vec3 V=normalize(uEye-vP);float gs=M==3?.35:M==2?.12:.03;L+=sunC*pow(max(dot(N,normalize(uSun+V)),0.),40.)*gs*s;' +
    'float d=length(uEye-vP);L=mix(L,vec3(.93,.92,.9),smoothstep(260.,700.,d)*.7);' +
    'L=clamp((L*(2.51*L+.03))/(L*(2.43*L+.59)+.14),0.,1.);o=vec4(pow(L,vec3(1./2.2)),M==12?(N.y>.5?.42:.28):1.);}';
  var SVS = '#version 300 es\nlayout(location=0) in vec3 p;uniform mat4 uL;void main(){gl_Position=uL*vec4(p,1.);}';
  var SFS = '#version 300 es\nprecision mediump float;out vec4 o;void main(){o=vec4(1.);}';
  // styl „rysunek architekta”: tusz + akwarela + papier (post-processing)
  var QVS = '#version 300 es\nlayout(location=0) in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var QFS = '#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D uC,uD;uniform vec2 uR;uniform float uN,uF,uSeed;out vec4 o;' +
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
    'float fb(vec2 p){return .5*vn(p)+.25*vn(p*2.03)+.125*vn(p*4.01)+.0625*vn(p*8.07);}' +
    'float ld(vec2 q){float d=texture(uD,q).r;return uN*uF/(uF-d*(uF-uN));}' +
    'float lu(vec3 c){return dot(c,vec3(.3,.59,.11));}' +
    'void main(){vec2 px=1./uR;vec2 w=(vec2(fb(uv*uR/38.+uSeed),fb(uv*uR/38.+7.3+uSeed))-.5)*2.2*px;vec2 q=uv+w;' +
    'float z=ld(q);float bg=step(.9999,texture(uD,q).r);' +
    'float e=0.;for(int i=0;i<4;i++){vec2 d=i==0?vec2(1,0):i==1?vec2(0,1):i==2?vec2(1,1):vec2(1,-1);d*=px*1.3;float a=ld(q+d),b=ld(q-d);e=max(e,abs(a+b-2.*z)/z*7.);}' +
    'float ce=0.;vec3 c0=texture(uC,q).rgb;for(int i=0;i<4;i++){vec2 d=i==0?vec2(1,0):i==1?vec2(0,1):i==2?vec2(-1,0):vec2(0,-1);ce+=abs(lu(texture(uC,q+d*px*1.2).rgb)-lu(c0));}' +
    'float ink=clamp(smoothstep(.06,.22,e)+smoothstep(.12,.3,ce)*.55,0.,1.);ink*=.75+.25*vn(uv*uR/6.);' +
    'vec3 bl=vec3(0.);for(int i=0;i<12;i++){float a=float(i)*2.39996;float r=sqrt(float(i)+.5)*3.2;bl+=texture(uC,q+vec2(cos(a),sin(a))*r*px).rgb;}bl/=12.;' +
    'vec3 col=mix(c0,bl,.55);float L=lu(col);col=mix(vec3(L),col,.62);' +
    'vec3 paper=vec3(.955,.935,.895)*(.94+.06*fb(uv*uR/90.))-.025*h(floor(uv*uR/1.5))*vec3(1.,.95,.9);' +
    'vec3 wash=mix(paper,col*vec3(1.03,.99,.93),.78);float edge=smoothstep(.02,.12,abs(lu(c0)-lu(bl)));wash*=1.-.18*edge;' +
    'wash*=.9+.16*fb(uv*uR/26.+3.1);wash=mix(wash,wash*vec3(.93,.9,.86),smoothstep(.55,.25,L)*.6);' +
    'float sh=smoothstep(.42,.18,L);float hat=step(.62,fract((gl_FragCoord.x+gl_FragCoord.y)/5.));wash=mix(wash,wash*.82,sh*hat*.7);' +
    'vec3 res=mix(wash,vec3(.25,.21,.18),ink*.85);res=mix(res,paper,bg);' +
    'float vig=smoothstep(.95,.35,length(uv-.5));res*=.93+.07*vig;o=vec4(res,1.);}';
  function mat4() { return new Float32Array(16); }
  function persp(f, a, n, fa) { var m = mat4(), t = 1 / Math.tan(f / 2); m[0] = t / a; m[5] = t; m[10] = (fa + n) / (n - fa); m[11] = -1; m[14] = 2 * fa * n / (n - fa); return m; }
  function ortho(l, r, b, t, n, f) { var m = mat4(); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m; }
  function look(e, c, u) {
    var z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]], zl = Math.hypot(z[0], z[1], z[2]); z = z.map(function (v) { return v / zl; });
    var x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]], xl = Math.hypot(x[0], x[1], x[2]); x = x.map(function (v) { return v / xl; });
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]], m = mat4();
    m[0] = x[0]; m[4] = x[1]; m[8] = x[2]; m[1] = y[0]; m[5] = y[1]; m[9] = y[2]; m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
    m[12] = -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]); m[13] = -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]); m[14] = -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]); m[15] = 1; return m;
  }
  function mul(a, b) { var o = mat4(); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function inv(m) {   // odwrotność 4×4 (do promienia myszy)
    var a = m, o = mat4(), b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6],
      b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
    var d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
    o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
    o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
    o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
    return o;
  }

  var gl = cv.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true });
  if (!gl) { root.classList.add('mk3d--nogl'); return; }
  function prog(vs, fs) { var p = gl.createProgram(); [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) { var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); }); gl.linkProgram(p); return p; }
  var P = prog(VS, FS), SP = prog(SVS, SFS), QP = prog(QVS, QFS), SS = 4096;
  var STYLE = /[?&]styl=rysunek/.test(location.search) ? 1 : 0, VIEW = null;
  var qb = gl.createBuffer(), qv = gl.createVertexArray(); gl.bindVertexArray(qv); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  var PF = { w: 0, h: 0, fb: null, c: null, d: null };
  function postFB(W, H) {
    if (PF.w === W && PF.h === H) return; if (PF.fb) { gl.deleteFramebuffer(PF.fb); gl.deleteTexture(PF.c); gl.deleteTexture(PF.d); }
    var mk = function (ifmt, fmt, type) { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, W, H, 0, fmt, type, null); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, ifmt === gl.RGBA8 ? gl.LINEAR : gl.NEAREST); }); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    PF.c = mk(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE); PF.d = mk(gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
    PF.fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, PF.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, PF.c, 0); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, PF.d, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    PF.w = W; PF.h = H;
  }
  var depth = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, depth);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SS, SS, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST); });
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // rysunek pierzei jako tekstura elewacji sąsiadów
  var ftex = gl.createTexture(), ftexOK = false;
  gl.bindTexture(gl.TEXTURE_2D, ftex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  (function () {
    var im = new Image(); im.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, ftex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      ftexOK = true; if (typeof draw === 'function' && VP) draw();
    }; im.src = 'assets/img/makieta-elewacje.png';
  })();
  function upload(M) {
    if (!M || !M.p.length) return null;
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    [[M.p, 3], [M.n, 3], [M.c, 3], [M.m, 1]].forEach(function (a, i) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a[0]), gl.STATIC_DRAW); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, a[1], gl.FLOAT, false, 0, 0); });
    gl.bindVertexArray(null); return { vao: vao, n: M.p.length / 3 };
  }
  function free(o) { if (o) gl.deleteVertexArray(o.vao); }

  /* ---------- kamera i rysowanie ---------- */
  var cam = { az: 3.75, el: 0.36, dist: 100, ty: 12, tx: 0, tz: 0 }, SEL = -1, HOVER = null, PICK = [], VP = null, EYE = [0, 0, 0], sunT = 15.5;
  var ANG = 8.4 * Math.PI / 180, NORTH = [Math.sin(ANG), -Math.cos(ANG)], EAST = [Math.cos(ANG), Math.sin(ANG)];
  function sunDir() {   // równonoc, Łódź 51.8°N; t – godzina czasu słonecznego
    var lat = 51.77 * Math.PI / 180, H = (sunT - 12) * 15 * Math.PI / 180, dec = 0.18;
    var el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI;   // od północy, zgodnie z zegarem
    el = Math.max(el, 0.12);
    var hx = NORTH[0] * Math.cos(az) + EAST[0] * Math.sin(az), hz = NORTH[1] * Math.cos(az) + EAST[1] * Math.sin(az);
    return [hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)];
  }
  var raf = 0; function req() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; draw(); }); }
  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
    if (!W || !H) return;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var tgt = [cam.tx, cam.ty, cam.tz], dd = cam.dist * (W < H ? 1.45 : 1);
    EYE = [tgt[0] + Math.cos(cam.el) * Math.sin(cam.az) * dd, tgt[1] + Math.sin(cam.el) * dd, tgt[2] + Math.cos(cam.el) * Math.cos(cam.az) * dd];
    var fov = W < H ? 0.9 : 0.62, NEAR = 1, FAR = 1600;
    if (VIEW) { EYE = VIEW.eye.slice(); var yw = VIEW.yaw, pt = VIEW.pitch; tgt = [EYE[0] + Math.cos(pt) * Math.sin(yw) * 10, EYE[1] + Math.sin(pt) * 10, EYE[2] + Math.cos(pt) * Math.cos(yw) * 10]; fov = W < H ? 1.25 : 1.0; NEAR = 0.25; }
    VP = mul(persp(fov, W / H, NEAR, FAR), look(EYE, tgt, [0, 1, 0]));
    var sun = sunDir(), Rs = 95, se = [sun[0] * 200, sun[1] * 200, sun[2] * 200];
    var LM = mul(ortho(-Rs, Rs, -Rs, Rs, 20, 420), look(se, [0, 8, 0], [0, 1, 0]));
    var cutF = VIEW ? -1 : SEL;
    var list = [SCN.env].concat(SCN.floors.filter(function (o, i) { return cutF < 0 || i < cutF; }).map(function (o) { return o.op; }));
    if (cutF >= 0 && SCN.cut) list.push(SCN.cut.op);
    var glist = SCN.floors.filter(function (o, i) { return cutF < 0 || i < cutF; }).map(function (o) { return o.gl; });
    if (cutF >= 0 && SCN.cut) glist.push(SCN.cut.gl, SCN.cut.u);
    // cienie
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, SS, SS); gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.colorMask(false, false, false, false);
    gl.useProgram(SP); gl.uniformMatrix4fv(gl.getUniformLocation(SP, 'uL'), false, LM);
    list.forEach(function (o) { if (o) { gl.bindVertexArray(o.vao); gl.drawArrays(gl.TRIANGLES, 0, o.n); } });
    gl.colorMask(true, true, true, true); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // scena
    if (STYLE) { postFB(W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, PF.fb); }
    gl.viewport(0, 0, W, H); gl.clearColor(STYLE ? 0.95 : 0, STYLE ? 0.935 : 0, STYLE ? 0.9 : 0, STYLE ? 1 : 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(P);
    var u = function (n) { return gl.getUniformLocation(P, n); };
    gl.uniformMatrix4fv(u('uVP'), false, VP); gl.uniformMatrix4fv(u('uL'), false, LM);
    gl.uniform3fv(u('uSun'), sun); gl.uniform3fv(u('uEye'), EYE); gl.uniform1f(u('uA'), 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, depth); gl.uniform1i(u('uS'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ftex); gl.uniform1i(u('uF'), 1); gl.uniform1f(u('uFT'), ftexOK ? 1 : 0); gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.CULL_FACE);
    list.forEach(function (o) { if (o) { gl.bindVertexArray(o.vao); gl.drawArrays(gl.TRIANGLES, 0, o.n); } });
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.uniform1f(u('uA'), 0.5);
    glist.forEach(function (o) { if (o) { gl.bindVertexArray(o.vao); gl.drawArrays(gl.TRIANGLES, 0, o.n); } });
    gl.depthMask(true); gl.disable(gl.BLEND);
    if (STYLE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.disable(gl.DEPTH_TEST); gl.useProgram(QP);
      var q = function (n) { return gl.getUniformLocation(QP, n); };
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, PF.c); gl.uniform1i(q('uC'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, PF.d); gl.uniform1i(q('uD'), 1); gl.activeTexture(gl.TEXTURE0);
      gl.uniform2f(q('uR'), W, H); gl.uniform1f(q('uN'), NEAR); gl.uniform1f(q('uF'), FAR); gl.uniform1f(q('uSeed'), 3.7);
      gl.bindVertexArray(qv); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.enable(gl.DEPTH_TEST);
    }
    labels();
    compass();
  }

  /* ---------- UI ---------- */
  var tip = root.querySelector('.mk3d__tip'), lab = root.querySelector('.mk3d__labels'), panel = root.querySelector('.mk3d__floors'), card = root.querySelector('.mk3d__card'), comp = root.querySelector('.mk3d__compass');
  var NAMES = ['Parter', '1. piętro', '2. piętro', '3. piętro', '4. piętro', '5. piętro', '6. piętro', '7. piętro'];
  function proj(x, y, z) { var v = [x, y, z, 1], o = [0, 0, 0, 0]; for (var i = 0; i < 4; i++) for (var k = 0; k < 4; k++) o[i] += VP[k * 4 + i] * v[k]; if (o[3] <= 0) return null; return [(o[0] / o[3] * 0.5 + 0.5) * cv.clientWidth, (1 - (o[1] / o[3] * 0.5 + 0.5)) * cv.clientHeight]; }
  function labels() {
    var html = '';
    if (SEL >= 1) PICK.forEach(function (k, i) { if (PICK.findIndex(function (q) { return q.id === k.id; }) !== i) return; var c = cen(k.P), s = proj(c[0], k.y + 0.3, c[1]); if (s) html += '<span style="left:' + s[0].toFixed(0) + 'px;top:' + s[1].toFixed(0) + 'px"' + (k.id === HOVER ? ' class="is-h"' : '') + '>' + k.id + '</span>'; });
    if (SEL < 0 && D && EYE[2] > 0) { var sl = D.floors[1].slab[0], bz = Math.max.apply(null, sl.map(function (p) { return p[1]; })), xs = sl.map(function (p) { return p[0]; }), sq = proj((Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, 9, bz + 16); if (sq) html += '<span class="mk3d__place" style="left:' + sq[0].toFixed(0) + 'px;top:' + sq[1].toFixed(0) + 'px">Planowany skwer</span>'; }
    if (SEL < 0 && D && D.env.n) D.env.n.forEach(function (q) { var s = proj(q.p[0], 6, q.p[1]); if (s) html += '<span class="mk3d__place" style="left:' + s[0].toFixed(0) + 'px;top:' + s[1].toFixed(0) + 'px">' + q.t + '</span>'; });
    if (lab.innerHTML !== html) lab.innerHTML = html;
  }
  function compass() { if (comp) { var a = Math.atan2(NORTH[0], -NORTH[1]); comp.style.transform = 'rotate(' + (-(cam.az + Math.PI) + a) + 'rad)'; } }
  function ray(mx, my) {
    var r = cv.getBoundingClientRect(), x = (mx - r.left) / r.width * 2 - 1, y = 1 - (my - r.top) / r.height * 2, I = inv(VP);
    var t = function (z) { var v = [x, y, z, 1], o = [0, 0, 0, 0]; for (var i = 0; i < 4; i++) for (var k = 0; k < 4; k++) o[i] += I[k * 4 + i] * v[k]; return [o[0] / o[3], o[1] / o[3], o[2] / o[3]]; };
    var a = t(-1), b = t(1), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]); return { o: a, d: d.map(function (v) { return v / l; }) };
  }
  function pickUnit(mx, my) {
    if (SEL < 1) return null; var R = ray(mx, my), y = D.floors[SEL].z0 + 0.09; if (Math.abs(R.d[1]) < 1e-4) return null;
    var t = (y - R.o[1]) / R.d[1]; if (t < 0) return null; var p = [R.o[0] + R.d[0] * t, R.o[2] + R.d[2] * t];
    var hit = PICK.filter(function (k) { return inside(p, k.P); })[0]; return hit ? hit.id : null;
  }
  function pickFloor(mx, my) {
    var R = ray(mx, my), top = SEL >= 0 ? SEL - 1 : 7;
    for (var t = 1; t < 600; t += 0.35) {
      var p = [R.o[0] + R.d[0] * t, R.o[1] + R.d[1] * t, R.o[2] + R.d[2] * t];
      if (p[1] < -0.4) return null;
      for (var f = top; f >= 0; f--) { var fl = D.floors[f]; if (p[1] >= fl.z0 - 0.4 && p[1] < (f === 7 ? fl.z1 + 0.5 : fl.z1 - 0.4) && fl.slab.some(function (P) { return inside([p[0], p[2]], P); })) return f === 7 ? 6 : f; }
    }
    return null;
  }
  function select(f) {
    SEL = f; HOVER = null; card.hidden = true;
    if (SCN.cut) { free(SCN.cut.op); free(SCN.cut.gl); free(SCN.cut.u); SCN.cut = null; }
    if (f >= 0) { var c = buildCut(f); SCN.cut = { op: upload(c.M), gl: upload(c.G), u: upload(c.U) }; }
    panel.querySelectorAll('button[data-f]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.f === f)); });
    var ty = f >= 0 ? D.floors[f].z0 + 2 : 13; tween({ ty: ty, el: f >= 1 ? Math.max(cam.el, 0.78) : cam.el, dist: f >= 1 ? Math.min(cam.dist, 78) : cam.dist });
    root.classList.toggle('is-cut', f >= 0);
  }
  function refreshUnits() { if (SEL < 1 || !SCN.cut) return; free(SCN.cut.u); var c = buildCut(SEL); free(SCN.cut.op); free(SCN.cut.gl); SCN.cut = { op: upload(c.M), gl: upload(c.G), u: upload(c.U) }; }
  var tw = null;
  function tween(to) {
    var from = {}; Object.keys(to).forEach(function (k) { from[k] = cam[k]; }); var t0 = performance.now(); if (tw) cancelAnimationFrame(tw);
    (function step(now) { var k = Math.min(1, (now - t0) / 650), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; Object.keys(to).forEach(function (q) { cam[q] = from[q] + (to[q] - from[q]) * e; }); draw(); if (k < 1) tw = requestAnimationFrame(step); else tw = null; })(t0);
  }
  /* ---------- widok z okna ---------- */
  var DIRS = ['północ', 'płn.-wschód', 'wschód', 'płd.-wschód', 'południe', 'płd.-zachód', 'zachód', 'płn.-zachód'];
  function windows(id) {
    var L = (D.units[id] || []).slice().sort(function (a, b) { return a.f - b.f; })[0]; if (!L) return [];
    var fl = D.floors[L.f], out = [], rej = [];
    (fl.mass || []).forEach(function (e) {
      var P = e.p;
      for (var i = 0; i < P.length; i++) {
        var a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.5) continue;
        var n = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l], m0 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (inside([m0[0] + n[0] * 0.2, m0[1] + n[1] * 0.2], P)) n = [-n[0], -n[1]];
        ((e.g || [])[i] || []).forEach(function (iv) {
          var w = (iv[1] - iv[0]) * l; if (w < 0.6) return;
          var t = (iv[0] + iv[1]) / 2, c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          var own = [1.0, 1.6, 2.4].some(function (d) { var q = [c[0] - n[0] * d, c[1] - n[1] * d]; return L.p.some(function (U) { return inside(q, U); }); });
          if (!own) return;
          var ang = Math.atan2(n[0] * EAST[0] + n[1] * EAST[1], n[0] * NORTH[0] + n[1] * NORTH[1]);
          var di = DIRS[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
          var prev = out.filter(function (o) { return o.dir === di; })[0];
          var op = 30; for (var d = 0.6; d < 30; d += 0.4) { var q = [c[0] + n[0] * d, c[1] + n[1] * d]; if ((fl.mass || []).some(function (E) { return inside(q, E.p); }) || (fl.cols || []).some(function (C0) { return inside(q, C0); })) { op = d; break; } }
          if (op < 5) { rej.push({ m: c, n: n, w: w, sc: op, dir: di, y: fl.z0 + 1.5 }); return; }   // okno w głębi wnęki / loggii bocznej
          var sc = w * Math.min(op, 15);
          if (!prev || prev.sc < sc) { out = out.filter(function (o) { return o.dir !== di; }); out.push({ m: c, n: n, w: w, sc: sc, dir: di, y: fl.z0 + 1.5 }); }
        });
      }
    });
    if (!out.length && rej.length) out = [rej.sort(function (a, b) { return b.sc - a.sc; })[0]];
    var pref = ['północ', 'płn.-wschód', 'płn.-zachód', 'południe', 'płd.-zachód', 'zachód', 'płd.-wschód', 'wschód'];
    return out.sort(function (a, b) { return pref.indexOf(a.dir) - pref.indexOf(b.dir); });
  }
  var wv = null;
  function windowView(id, k) {
    var W = windows(id); if (!W.length) return;
    k = ((k || 0) % W.length + W.length) % W.length; var w = W[k];
    VIEW = { eye: [w.m[0] + w.n[0] * 0.3, w.y, w.m[1] + w.n[1] * 0.3], yaw: Math.atan2(w.n[0], w.n[1]), pitch: -0.06, base: Math.atan2(w.n[0], w.n[1]) };
    card.hidden = true; root.classList.add('is-window');
    if (!wv) { wv = document.createElement('div'); wv.className = 'mk3d__window'; root.appendChild(wv); }
    var u = UNITS[id];
    wv.innerHTML = '<div class="mk3d__frame"><i></i></div><div class="mk3d__wbar"><span class="caps bronze">Widok z okna</span><b>' + id + ' · ' + NAMES[u ? u.floor : 0] + ' · kierunek: ' + w.dir + '</b>' +
      (W.length > 1 ? '<button type="button" class="mk3d__home caps" data-wn>Inne okno (' + (k + 1) + '/' + W.length + ')</button>' : '') +
      '<button type="button" class="mk3d__home caps" data-wx>Zamknij</button></div><p class="mk3d__whint caps">Przeciągnij, aby rozejrzeć się</p>';
    wv.hidden = false;
    var nb = wv.querySelector('[data-wn]'); if (nb) nb.onclick = function () { windowView(id, k + 1); };
    wv.querySelector('[data-wx]').onclick = function () { VIEW = null; wv.hidden = true; root.classList.remove('is-window'); draw(); };
    draw();
  }
  function showCard(id) {
    var u = UNITS[id]; if (!u) return;
    card.innerHTML = '<button class="mk3d__cx" type="button" aria-label="Zamknij">×</button><span class="caps bronze">' + NAMES[u.floor] + '</span><h3 class="display">' + id + '</h3>' +
      '<dl><div><dt class="caps">Pokoje</dt><dd>' + u.rooms + '</dd></div><div><dt class="caps">Metraż</dt><dd>' + String(u.area).replace('.', ',') + '&nbsp;m²</dd></div><div><dt class="caps">Cena</dt><dd>' + FMT(u.price) + '&nbsp;zł</dd></div></dl>' +
      '<p class="status status--' + u.status + '">' + u.status + '</p><div class="mk3d__ca"><a class="btn caps" target="_top" href="mieszkanie.html?id=' + encodeURIComponent(id) + '">Karta mieszkania</a>' +
      (window.N75Doll && D.units[id] ? '<button type="button" class="btn btn--ghost caps" data-doll="' + id + '">Wnętrze 3D</button>' : '') +
      (D.units[id] && windows(id).length ? '<button type="button" class="btn btn--ghost caps" data-win="' + id + '">Widok z okna</button>' : '') + '</div>';
    card.hidden = false;
    card.querySelector('.mk3d__cx').onclick = function () { card.hidden = true; };
    var d = card.querySelector('[data-doll]'); if (d) d.onclick = function () { N75Doll.open(id, id); };
    var wb = card.querySelector('[data-win]'); if (wb) wb.onclick = function () { windowView(id, 0); };
  }

  // obrót, przybliżenie, kliknięcia
  var drag = null, moved = 0, pts = {};
  cv.addEventListener('pointerdown', function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; drag = { x: e.clientX, y: e.clientY, d: null }; moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function (e) {
    if (pts[e.pointerId]) {
      var prev = pts[e.pointerId]; pts[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (drag.d) cam.dist = Math.min(300, Math.max(28, cam.dist * drag.d / d)); drag.d = d; moved += 10; req(); return; }
      var dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
      if (VIEW) { VIEW.yaw = Math.max(VIEW.base - 1.2, Math.min(VIEW.base + 1.2, VIEW.yaw - dx * 0.004)); VIEW.pitch = Math.max(-0.6, Math.min(0.5, VIEW.pitch + dy * 0.003)); req(); return; }
      cam.az -= dx * 0.006; cam.el = Math.min(1.45, Math.max(0.06, cam.el + dy * 0.004)); req(); return;
    }
    if (e.pointerType === 'mouse') hover(e.clientX, e.clientY);
  });
  function up(e) {
    var was = !!pts[e.pointerId]; delete pts[e.pointerId]; if (Object.keys(pts).length) return;
    if (was && moved < 6 && !VIEW) click(e.clientX, e.clientY);
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; });
  // osadzona w stronie: kółko przybliża dopiero po kliknięciu w makietę (inaczej przewija stronę)
  var EMBED = /[?&]embed=1/.test(location.search), ACTIVE = !EMBED;
  if (EMBED) { document.body.classList.add('is-embed'); cv.addEventListener('pointerdown', function () { ACTIVE = true; document.body.classList.add('is-active'); }); document.addEventListener('mouseleave', function () { ACTIVE = false; document.body.classList.remove('is-active'); }); }
  cv.addEventListener('wheel', function (e) { if (!ACTIVE || VIEW) return; e.preventDefault(); cam.dist = Math.min(300, Math.max(28, cam.dist * Math.exp(e.deltaY * 0.0012))); req(); }, { passive: false });
  function hover(x, y) {
    if (!VP || !D || VIEW) { tip.hidden = true; return; }
    if (SEL >= 1) { var id = pickUnit(x, y); if (id !== HOVER) { HOVER = id; refreshUnits(); req(); } cv.style.cursor = id ? 'pointer' : 'grab'; tipAt(id ? id + ' · ' + (UNITS[id] ? String(UNITS[id].area).replace('.', ',') + ' m² · ' + UNITS[id].status : '') : '', x, y); return; }
    var f = pickFloor(x, y); cv.style.cursor = f !== null ? 'pointer' : 'grab'; tipAt(f !== null ? NAMES[f] + (avail(f) ? ' · wolne: ' + avail(f) : '') : '', x, y);
  }
  function tipAt(t, x, y) { if (!t) { tip.hidden = true; return; } var r = root.getBoundingClientRect(); tip.textContent = t; tip.hidden = false; tip.style.left = (x - r.left + 14) + 'px'; tip.style.top = (y - r.top + 14) + 'px'; }
  function click(x, y) {
    if (!VP || !D) return;
    if (SEL >= 1) { var id = pickUnit(x, y); if (id) { HOVER = id; refreshUnits(); req(); showCard(id); return; } }
    if (SEL >= 0) {   // klik w płytę wybranego piętra (np. korytarz) nie zmienia piętra
      var R = ray(x, y), yy = D.floors[SEL].z0, t = (yy - R.o[1]) / R.d[1];
      if (t > 0 && D.floors[SEL].slab.some(function (P) { return inside([R.o[0] + R.d[0] * t, R.o[2] + R.d[2] * t], P); })) return;
    }
    var f = pickFloor(x, y); if (f !== null && f !== SEL) { select(f); tip.hidden = true; }
  }
  function avail(f) { return (window.N75_UNITS || []).filter(function (u) { return (u.levels || [u.floor])[0] === f && u.status === 'wolne'; }).length; }

  function buildPanel() {
    var h = '<button type="button" class="chip" data-f="-1" aria-pressed="true">Cały budynek</button>';
    for (var f = 6; f >= 0; f--) { var a = avail(f); h += '<button type="button" class="chip" data-f="' + f + '" aria-pressed="false"><b>' + (f === 0 ? 'P' : f) + '</b><span>' + (f === 0 ? 'Parter · usługi' : a ? 'wolne: ' + a : '') + '</span></button>'; }
    panel.innerHTML = h;
    panel.addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (b) select(+b.dataset.f); });
    var sl = root.querySelector('.mk3d__sun input'), out = root.querySelector('.mk3d__sun output');
    if (sl) { var upd = function () { sunT = +sl.value; out.textContent = (Math.floor(sunT) + ':' + (sunT % 1 ? '30' : '00')); req(); }; sl.addEventListener('input', upd); upd(); }
    var home = root.querySelector('[data-home]'); if (home) home.addEventListener('click', function () { select(-1); tween({ az: 3.75, el: 0.36, dist: 100, ty: 12 }); });
    var st = root.querySelector('[data-style]'); if (st) { var sy = function () { st.textContent = STYLE ? 'Styl: rysunek' : 'Styl: model'; root.classList.toggle('is-sketch', !!STYLE); }; sy(); st.addEventListener('click', function () { STYLE = STYLE ? 0 : 1; sy(); draw(); }); }
  }
  window.addEventListener('resize', req);

  fetch(root.dataset.src).then(function (r) { return r.json(); }).then(function (d) {
    D = d;
    SCN.env = upload(buildEnv());
    SCN.floors = d.floors.map(function (fl) { var b = buildFloor(fl); return { op: upload(b.M), gl: upload(b.G) }; });
    buildPanel();
    root.classList.add('is-ready');
    var m = /[?&]p=(\d)/.exec(location.search); if (m) select(+m[1]);
    draw();
  });
  window.N75Mk = { select: function (f) { select(f); }, cam: cam, draw: draw, sun: function (t) { sunT = t; draw(); }, style: function (v) { STYLE = v ? 1 : 0; var st = root.querySelector('[data-style]'); if (st) st.textContent = STYLE ? 'Styl: rysunek' : 'Styl: model'; draw(); }, win: function (id, k) { windowView(id, k); }, wins: function (id) { return windows(id); }, card: function (id) { showCard(id); } };
})();
