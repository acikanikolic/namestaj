// Barska stolica GRACE (54.5 x 48.5 x 101): školjka naslona sa otvorom, okretno sedište, centralni stub, kružno postolje
const { part, node, tube, cylinder } = require('../lib');

const BLACK = { color: '#1c1c1c', rough: 0.45, metal: 0.5 };
const RUBBER = { color: '#141414', rough: 0.9 };
const SEAT = { tex: 'grace_seat.jpg', color: '#ffffff', rough: 0.9 };
const BACK = { tex: 'grace_back.jpg', color: '#ffffff', rough: 0.9 };
const SEAM = { color: '#3e2c1e', rough: 0.9 };
const PI = Math.PI;
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// mreža tačaka P[j][i] -> glatka geometrija (normale akumulirane po licima)
function grid(P, { wrapI = false, flip = false, uv } = {}) {
  const J = P.length, I = P[0].length, pos = [], nor = new Array(J * I * 3).fill(0), idx = [], uvs = uv ? [] : null;
  for (let j = 0; j < J; j++) for (let i = 0; i < I; i++) { pos.push(...P[j][i]); if (uv) uvs.push(...uv(j, i, P[j][i])); }
  const at = (j, i) => j * I + i;
  for (let j = 0; j < J - 1; j++) for (let i = 0; i < I - 1; i++) {
    const a = at(j, i), b = at(j, i + 1), c = at(j + 1, i), d = at(j + 1, i + 1);
    const tri = (p, q, r) => {
      const u = [0, 1, 2].map(k => pos[q * 3 + k] - pos[p * 3 + k]), v = [0, 1, 2].map(k => pos[r * 3 + k] - pos[p * 3 + k]);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      for (const x of [p, q, r]) for (let k = 0; k < 3; k++) nor[x * 3 + k] += n[k];
      flip ? idx.push(p, r, q) : idx.push(p, q, r);
    };
    tri(a, b, c); tri(b, d, c);
  }
  if (wrapI) for (let j = 0; j < J; j++) for (let k = 0; k < 3; k++) { const s = nor[at(j, 0) * 3 + k] + nor[at(j, I - 1) * 3 + k]; nor[at(j, 0) * 3 + k] = nor[at(j, I - 1) * 3 + k] = s; }
  for (let v = 0; v < J * I; v++) { const l = Math.hypot(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]) || 1; for (let k = 0; k < 3; k++) nor[v * 3 + k] = (nor[v * 3 + k] / l) * (flip ? -1 : 1); }
  return { pos, nor, idx, uv: uvs };
}
// poklopac (lepeza) oko centra jednog reda tačaka
function fan(ring, flip) {
  const c = [0, 1, 2].map(k => ring.reduce((s, p) => s + p[k], 0) / ring.length);
  return grid([ring.map(() => c), ring], { flip, uv: () => [0.5, 0.5] });
}
// rotaciono telo: profil [r,y] oko Y ose
function lathe(profile, seg = 48) {
  const P = profile.map(([r, y]) => Array.from({ length: seg + 1 }, (_, i) => { const a = i / seg * 2 * PI; return [Math.cos(a) * r, y, Math.sin(a) * r]; }));
  return grid(P, { wrapI: true });
}
// zaobljeni pravougaonik (superelipsa) preseka: poluose a, b
const prof = (a, b, n = 28, e = 4) => Array.from({ length: n + 1 }, (_, k) => {
  const t = k / n * 2 * PI, c = Math.cos(t), s = Math.sin(t);
  return [a * Math.sign(c) * Math.pow(Math.abs(c), 2 / e), b * Math.sign(s) * Math.pow(Math.abs(s), 2 / e)];
});

// tačka na superelipsi u planu
const sup = (a, rx, rz, n) => { const c = Math.cos(a), s = Math.sin(a); return [rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), rz * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };

// ---- tapacirano sedište: superelipsa u planu, zaobljen presek ----
function seatGeo(cx, cz, rx, rz, y0, y1, n = 2.6, seg = 56) {
  const R = 0.022, hm = (y0 + y1) / 2;
  // profil od sredine gore ka ivici i dole: [uvlačenje od ivice, y]
  const pr = [[rx, y1], [0.1, y1 + 0.004], [R * 1.1, y1], [R * 0.45, y1 - R * 0.12], [0.0035, y1 - R * 0.55], [0, hm], [0.0035, y0 + R * 0.55], [R * 0.45, y0 + R * 0.12], [R * 1.1, y0], [rx, y0]];
  const P = pr.map(([ins, y]) => Array.from({ length: seg + 1 }, (_, i) => {
    const [x, z] = sup(i / seg * 2 * PI, rx, rz, n), l = Math.hypot(x, z) || 1, k = Math.max(0, 1 - ins / l);
    return [cx + x * k, y, cz + z * k];
  }));
  return grid(P, { wrapI: true, uv: (j, i, p) => [0.5 + (p[0] - cx) / (2 * rx), 0.5 + (p[2] - cz) / (2 * rz)] });
}

// ---- naslon: zakrivljen pojas oko leđa, sa strane se spušta do sedišta ----
const A = 2.05; // poluugao luka (rad), 0 = sredina pozadi
const bot = (th, ySeat) => 0.795 + (ySeat - 0.01 - 0.795) * sm(0.55, 1.95, Math.abs(th));
const top = th => 1.01 - 0.075 * sm(0.9, A, Math.abs(th)) - 0.02 * sm(1.7, A, Math.abs(th));
function backGeo(rx, rz, t, ySeat, seg = 64) {
  const pf = prof(t / 2, 1, 28, 4), rows = [];
  for (let i = 0; i <= seg; i++) {
    const th = -A + 2 * A * i / seg, b = bot(th, ySeat), tp = top(th), yc = (b + tp) / 2, hh = (tp - b) / 2;
    const nx = Math.sin(th) / rx, nz = -Math.cos(th) / rz, l = Math.hypot(nx, nz), ux = nx / l, uz = nz / l;
    const sx = (rx - t / 2) * Math.sin(th), sz = -(rz - t / 2) * Math.cos(th);
    rows.push(pf.map(([r, v]) => [sx + ux * r, yc + v * hh, sz + uz * r]));
  }
  const body = grid(rows, { wrapI: true, uv: (j, i, p) => [0.5 + Math.sin(-A + 2 * A * j / seg) * 1.1, (p[1] - 0.68) / 0.33] });
  return { body, rows };
}

module.exports = {
  id: 'grace', animated: false, dims: [54.5, 48.5, 101],
  build() {
    const root = node('grace');
    const ySeat1 = 0.685, ySeat0 = 0.595;            // gornja/donja ivica sedišta
    const sRX = 0.235, sRZ = 0.2225, sCZ = 0.02;      // sedište
    const bRX = 0.2725, bRZ = 0.2425;                 // spoljni poluprečnici naslona
    root.parts.push(part(seatGeo(0, sCZ, sRX, sRZ, ySeat0, ySeat1), SEAT));
    const bk = backGeo(bRX, bRZ, 0.05, ySeat1);
    root.parts.push(part(bk.body, BACK));
    for (const j of [0, bk.rows.length - 1]) root.parts.push(part(fan(bk.rows[j], j !== 0), BACK)); // krajevi pojasa

    // prošivanje: ivica sedišta, vertikalni šav pozadi, šavovi uz gornju i donju ivicu naslona
    const seam = pts => { for (let i = 0; i < pts.length - 1; i++) root.parts.push(tube(pts[i], pts[i + 1], 0.0017, SEAM)); };
    const ring = [];
    for (let i = 0; i <= 32; i++) { const [x, z] = sup(i / 32 * 2 * PI, sRX - 0.001, sRZ - 0.001, 2.6); ring.push([x, ySeat1 - 0.014, sCZ + z]); }
    seam(ring);
    seam([[0, 0.81, -bRZ - 0.0012], [0, 1.0, -bRZ - 0.0012]]);
    for (const [fn, dy] of [[top, -0.012], [th => bot(th, ySeat1), 0.012]]) {
      const pts = [];
      for (let i = 2; i <= 62; i += 3) { const th = -A + 2 * A * i / 64; pts.push([(bRX - 0.0012) * Math.sin(th), fn(th) + dy, -(bRZ - 0.0012) * Math.cos(th)]); }
      seam(pts);
    }

    // metalna ploča ispod sedišta i okretni mehanizam
    root.parts.push(part(cylinder([0, 0.58, sCZ - 0.01], 0.14, 0.02, 40), BLACK));
    root.parts.push(part(cylinder([0, 0.55, 0], 0.045, 0.045, 24), BLACK));
    // gas lift: stub + teleskopska čaura
    root.parts.push(part(cylinder([0, 0.31, 0], 0.0215, 0.5, 24), BLACK));
    root.parts.push(part(cylinder([0, 0.2, 0], 0.0265, 0.2, 24), BLACK));
    root.parts.push(part(cylinder([0, 0.305, 0], 0.0285, 0.012, 24), BLACK));
    // okruglo postolje (levak) + gumena stopa
    root.parts.push(part(lathe([[0, 0.014], [0.17, 0.0125], [0.1925, 0.012], [0.196, 0.016], [0.194, 0.0205], [0.18, 0.0235], [0.14, 0.032], [0.1, 0.048], [0.065, 0.07], [0.045, 0.092], [0.0265, 0.105], [0.0265, 0.2]], 56), BLACK));
    root.parts.push(part(lathe([[0, 0], [0.19, 0], [0.193, 0.004], [0.19, 0.0125], [0, 0.0125]], 56), RUBBER));

    // oslonac za noge: eliptična karika od kratkih segmenata + obujmica na stubu
    const ringY = 0.27, rx = 0.175, rz = 0.155, rcz = 0.045, N = 20, pts = [];
    for (let i = 0; i <= N; i++) { const a = i / N * 2 * PI; pts.push([Math.cos(a) * rx, ringY, rcz + Math.sin(a) * rz]); }
    for (let i = 0; i < N; i++) {
      root.parts.push(tube(pts[i], pts[i + 1], 0.0085, BLACK));
      root.parts.push(tube([pts[i + 1][0], ringY - 0.0085, pts[i + 1][2]], [pts[i + 1][0], ringY + 0.0085, pts[i + 1][2]], 0.0087, BLACK)); // spojnica
    }
    root.parts.push(part(cylinder([0, ringY, 0], 0.034, 0.034, 24), BLACK));
    root.parts.push(tube([0, ringY, 0.02], [0, ringY, rcz - rz + 0.002], 0.008, BLACK));

    // poluga za podešavanje visine (levo, ispod sedišta)
    root.parts.push(tube([-0.02, 0.552, 0.005], [-0.095, 0.538, 0.02], 0.0055, BLACK));
    root.parts.push(tube([-0.095, 0.538, 0.02], [-0.15, 0.505, 0.04], 0.0055, BLACK));
    root.parts.push(part(cylinder([-0.15, 0.505, 0.04], 0.0075, 0.025, 12), BLACK));
    return root;
  },
};
