// Ugaona garnitura GALAXY (266.5 x 178 x 75 cm) – ležaj (šezlong) sa leve strane, 4 jastuka naslona, tufovano sedište
const { box, rbox, cylinder, part, node, qx, deg } = require('../lib');

const W = 2.665, D = 1.78, X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
const LEG = 0.05, SEAT_Y = 0.415, ARM = 0.24, BACKT = 0.20, ZS = 0.03;   // ZS = prednja ivica glavnog dela
const SEAT = { tex: 'galaxy_seat.jpg', rough: 0.97 }, PIL = { tex: 'galaxy_pillow.jpg', rough: 0.97 };
const FRONT = { tex: 'galaxy_front.jpg', rough: 0.97 }, ARMT = { tex: 'galaxy_arm.jpg', rough: 0.97 };
const SEAM = { color: '#4f4e4b', rough: 1 };
const FOOT = { color: '#a9a49c', rough: 0.4, metal: 0.5 };
const U = [0, 0, 1, 1];

// rbox zadat sa dve ugaone tačke (x0,y0,z0)-(x1,y1,z1)
const rb = (a, b, r, seg = 4) => rbox([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [b[0] - a[0], b[1] - a[1], b[2] - a[2]], r, seg, U);

function build() {
  const root = node('galaxy'), p = root.parts;
  const gap = 0.003;

  // --- postolje (sanduk za posteljinu): glavni deo + ležaj, sa uvučenom podnožnom trakom ---
  const bx0 = X0, cx1 = -0.333;                       // ležaj: x od X0 do cx1
  p.push(part(rb([cx1, LEG + 0.07, Z0], [X1, SEAT_Y - 0.085, ZS], 0.012), FRONT));        // desni deo
  p.push(part(rb([bx0, LEG + 0.07, Z0], [cx1 - gap, SEAT_Y - 0.085, Z1], 0.012), FRONT)); // ležaj
  p.push(part(rb([cx1 + 0.01, LEG, Z0 + 0.01], [X1 - 0.01, LEG + 0.075, ZS - 0.01], 0.008), { ...FRONT, color: '#8a8a8a' }));
  p.push(part(rb([bx0 + 0.01, LEG, Z0 + 0.01], [cx1 - 0.01, LEG + 0.075, Z1 - 0.01], 0.008), { ...FRONT, color: '#8a8a8a' }));

  // --- jastuci sedišta (tufovani) ---
  const sy0 = SEAT_Y - 0.085, ax0 = X0 + ARM, ax1 = X1 - ARM, zb = Z0 + BACKT;
  const seatR = [cx1 + gap, ax1, zb, ZS], seatA = [ax0, cx1 - gap, zb, ZS], seatB = [X0, cx1 - gap, ZS + gap, Z1];
  const cell = [];
  for (const [x0, x1, z0, z1] of [seatR, seatA, seatB]) {
    p.push(part(rb([x0, sy0, z0], [x1, SEAT_Y, z1], 0.025, 5), SEAT));
    cell.push([x0, x1, z0, z1]);
  }
  // prošivanje: mreža šavova + puceta na gornjoj strani (ćelije ~ 0.28 m)
  const ty = SEAT_Y + 0.0008;
  for (const [x0, x1, z0, z1] of cell) {
    const nx = Math.max(2, Math.round((x1 - x0) / 0.28)), nz = Math.max(2, Math.round((z1 - z0) / 0.28));
    for (let i = 1; i < nx; i++) p.push(part(box([x0 + (x1 - x0) * i / nx, ty, (z0 + z1) / 2], [0.004, 0.002, z1 - z0 - 0.08]), SEAM));
    for (let j = 1; j < nz; j++) p.push(part(box([(x0 + x1) / 2, ty, z0 + (z1 - z0) * j / nz], [x1 - x0 - 0.08, 0.002, 0.004]), SEAM));
    for (let i = 1; i < nx; i++) for (let j = 1; j < nz; j++)
      p.push(part(cylinder([x0 + (x1 - x0) * i / nx, ty, z0 + (z1 - z0) * j / nz], 0.011, 0.004, 10), SEAM));
  }

  // --- zadnji panel (naslon) i rukohvati ---
  p.push(part(rb([X0, LEG + 0.07, Z0], [X1, 0.62, zb - gap], 0.03), PIL));
  for (const s of [-1, 1]) {
    const xa = s < 0 ? X0 : X1 - ARM;
    p.push(part(rb([xa, LEG + 0.07, zb], [xa + ARM, 0.58, ZS], 0.035, 5), ARMT));
    p.push(part(box([xa + ARM / 2, 0.578, (zb + ZS) / 2], [0.003, 0.003, ZS - zb - 0.06]), SEAM));   // šav na rukohvatu
  }

  // --- 4 jastuka naslona (55x36x14), blago nagnuti unazad ---
  const cw = (ax1 - ax0) / 4;
  for (let i = 0; i < 4; i++) {
    const n = node('jastuk_' + i, { t: [ax0 + cw * (i + 0.5), 0.55, zb + 0.095], r: qx(deg(-11)) });
    n.parts.push(part(rbox([0, 0, 0], [cw - 0.012, 0.36, 0.14], 0.055, 5, U), PIL));
    n.parts.push(part(box([0, 0, 0.0705], [0.002, 0.2, 0.002]), SEAM));
    root.kids.push(n);
  }
  // mali ukrasni jastuci 38x38x10 (kao na fotografiji u enterijeru)
  for (const [x, z, a] of [[ax0 + 0.2, ZS - 0.32, -22], [ax1 - 0.2, ZS - 0.30, 20]]) {
    const n = node('ukrasni_jastuk', { t: [x, SEAT_Y + 0.15, z], r: qx(deg(-30)) });
    n.parts.push(part(rbox([0, 0, 0], [0.38, 0.38, 0.10], 0.04, 4, U), PIL));
    root.kids.push(n);
  }

  // --- nožice 8x6x5 cm, svetli metal ---
  for (const [x, z] of [[-1.25, 0.8], [-0.42, 0.8], [-1.25, -0.8], [-0.42, -0.8], [0.0, -0.8], [0.0, -0.06], [1.22, -0.8], [1.22, -0.06]])
    p.push(part(box([x, LEG / 2, z], [0.08, LEG, 0.06]), FOOT));
  return root;
}

module.exports = { id: 'galaxy', animated: false, dims: [266.5, 178, 75], build };
