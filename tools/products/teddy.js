// Fotelja TEDDY: okruglo tapacirano sedište (pouf), školjka-naslon koja obuhvata, crne metalne noge.
const { part, node, alongY, cylinder, tube } = require('../lib');

const FAB = { color: '#6f7378', rough: 0.97 };   // jednobojan štof (isečak sa fotografije imao je gradijent senke)
const METAL = { color: '#151515', rough: 0.45, metal: 0.6 };
const TILE = 0.11; // veličina jednog isečka štofa u metrima

// okreće trouglove tako da se poklope sa normalama temena
function fixWinding(g) {
  for (let t = 0; t < g.idx.length; t += 3) {
    const [a, b, c] = [g.idx[t], g.idx[t + 1], g.idx[t + 2]];
    const P = i => [g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]];
    const A = P(a), B = P(b), C = P(c);
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const d = [0, 1, 2].reduce((s, k) => s + n[k] * (g.nor[a * 3 + k] + g.nor[b * 3 + k] + g.nor[c * 3 + k]), 0);
    if (d < 0) { g.idx[t + 1] = c; g.idx[t + 2] = b; }
  }
  return g;
}

// sedište: rotaciono telo od profila [r, y, nr, ny] (od dna ka vrhu), zaobljene ivice
function seatBody(cx, cz, R, y0, y1, rt, rb, seg = 72) {
  const prof = [[0, y0, 0, -1]];
  const arc = (c0, y, r, a0, a1, n) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; prof.push([c0 + Math.cos(a) * r, y + Math.sin(a) * r, Math.cos(a), Math.sin(a)]); } };
  arc(R - rb, y0 + rb, rb, -Math.PI / 2, 0, 5);          // donja ivica
  arc(R - rt, y1 - rt, rt, 0, Math.PI / 2, 8);           // gornja ivica (deblji sunđer)
  prof.push([0, y1, 0, 1]);
  const pos = [], nor = [], uv = [], idx = [], n = prof.length;
  for (let s = 0; s <= seg; s++) {
    const a = s / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    for (const [r, y, nr, ny] of prof) {
      pos.push(cx + c * r, y, cz + sn * r); nor.push(c * nr, ny, sn * nr);
      if (Math.abs(ny) > 0.75) uv.push((c * r) / TILE, (sn * r) / TILE); else uv.push(a * R / TILE, y / TILE);
    }
  }
  for (let s = 0; s < seg; s++) for (let i = 0; i < n - 1; i++) { const a = s * n + i, b = a + 1, c = a + n, d = c + 1; idx.push(a, b, c, b, d, c); }
  return fixWinding({ pos, nor, uv, idx });
}

// školjka naslona: profil (zaobljen pravougaonik u r-y ravni) izvučen po luku oko vertikalne ose
function shell(cz, Rout, t, y0, y1, half, lean) {
  const rc = Rout - t / 2, yc = (y0 + y1) / 2, hw = t / 2, hh = (y1 - y0) / 2, cr = 0.032, k = 6;
  const prof = [];
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sr, sy], q) => {
    const base = [0, Math.PI / 2, Math.PI, Math.PI * 1.5][q];
    for (let i = 0; i <= k; i++) {
      const a = base + (Math.PI / 2) * i / k, nr = Math.cos(a), ny = Math.sin(a);
      prof.push([rc + (hw - cr) * Math.sign(nr || sr) + nr * cr, yc + (hh - cr) * Math.sign(ny || sy) + ny * cr, nr, ny]);
    }
  });
  const m = prof.length, N = 44, pos = [], nor = [], uv = [], idx = [];
  const ring = th => prof.map(([r, y, nr, ny]) => {
    const s = Math.sin(th), c = Math.cos(th), lz = -lean * (y - y0) / (y1 - y0);
    return { p: [r * s, y, cz - r * c + lz], n: [nr * s, ny, -nr * c] };
  });
  for (let s = 0; s <= N; s++) {
    const th = -half + 2 * half * s / N;
    ring(th).forEach((v, i) => { pos.push(...v.p); nor.push(...v.n); uv.push(th * rc / TILE, prof[i][1] / TILE + prof[i][0] / TILE); });
  }
  for (let s = 0; s < N; s++) for (let i = 0; i < m; i++) { const j = (i + 1) % m, a = s * m + i, b = s * m + j, c = a + m, d = b + m; idx.push(a, b, c, b, d, c); }
  // krajnje kape (lepeza)
  for (const [th, sg] of [[-half, -1], [half, 1]]) {
    const base = pos.length / 3, rg = ring(th), tn = [Math.cos(th) * sg, 0, Math.sin(th) * sg];
    const cen = rg.reduce((a, v) => [a[0] + v.p[0] / m, a[1] + v.p[1] / m, a[2] + v.p[2] / m], [0, 0, 0]);
    pos.push(...cen); nor.push(...tn); uv.push(0.5, 0.5);
    rg.forEach(v => { pos.push(...v.p); nor.push(...tn); uv.push(v.p[0] / TILE, v.p[1] / TILE); });
    for (let i = 0; i < m; i++) idx.push(base, base + 1 + i, base + 1 + (i + 1) % m);
  }
  return fixWinding({ pos, nor, uv, idx });
}

module.exports = {
  id: 'teddy', animated: false, dims: [57.5, 57, 69],
  build() {
    const root = node('teddy', { t: [0, 0, 0.012] }); // centriranje po Z
    const SY0 = 0.265, SY1 = 0.445;                 // sedište: donja/gornja ivica
    root.parts.push(part(seatBody(0, 0, 0.272, SY0, SY1, 0.04, 0.018), FAB));
    // šav pri vrhu sedišta (tanak prsten)
    root.parts.push(part(seatBody(0, 0, 0.2724, SY1 - 0.0155, SY1 - 0.0145, 0.0004, 0.0004, 72), { ...FAB, color: '#bdbdbd' }));
    root.parts.push(part(shell(0.0, 0.288, 0.075, 0.495, 0.69, 80 * Math.PI / 180, 0.008), FAB));

    // noge: prednje (kratke, do sedišta) i zadnje (do naslona); blago razmaknute ka spolja
    const legs = [];
    const front = [[0.225, 0.175], [-0.225, 0.175]], back = [[0.2, -0.205], [-0.2, -0.205]];
    for (const [x, z] of front) legs.push({ b: [x * 1.012, 0, z * 1.012], t: [x, 0.35, z] });
    for (const [x, z] of back) legs.push({ b: [x * 1.012, 0, z * 1.012], t: [x, 0.60, z] });
    for (const l of legs) {
      root.parts.push(tube(l.b, l.t, 0.0095, METAL));
      root.parts.push(part(alongY(cylinder([0, 0, 0], 0.0125, 0.006, 14), [l.b[0], 0, l.b[2]], [l.b[0], 0.006, l.b[2]]), { color: '#0c0c0c', rough: 0.8 })); // stopica
      // spojnica ka središtu ispod sedišta
      const ly = 0.262, f = l.b[2] > 0 ? 1 : 1;
      root.parts.push(tube([l.t[0] * 0.985, ly, l.t[2] * 0.985], [0, ly - 0.006, 0], 0.007, METAL));
    }
    // gornji kraj zadnjih nogu i prednjih: mali poklopci
    for (const l of legs) root.parts.push(part(alongY(cylinder([0, 0, 0], 0.0098, 0.004, 14), [l.t[0], l.t[1], l.t[2]], [l.t[0], l.t[1] + 0.004, l.t[2]]), METAL));
    return root;
  },
};
