// Klub sto MONTESE 90x50: ploča artisan hrast, 4 bele pločaste noge, hrastov okvir (opasač)
const { box, part, node } = require('../lib');
module.exports = {
  id: 'montese', animated: false, dims: [90, 50, 42.5],
  build() {
    const root = node('klub_sto'), p = root.parts;
    const oak = { tex: 'montese_top.jpg', rough: 0.6 }, ap = { tex: 'montese_apron.jpg', rough: 0.6 };
    const white = { color: '#f2f2f0', rough: 0.5 }, black = { color: '#1a1a1a', rough: 0.5 };
    const H = 0.425, tt = 0.025, gl = 0.006, ly = H - tt;
    // ploča
    p.push(part(box([0, H - tt / 2, 0], [0.9, tt, 0.5], [0, 0, 1, 1]), oak));
    // dva uska žleba na gornjoj strani uz desni kraj (planke)
    for (const x of [0.33, 0.395]) p.push(part(box([x, H + 0.0001, 0], [0.003, 0.0002, 0.5]), { color: '#7a5a38', rough: 0.8 }));
    // pločaste noge (XY ravan), napred i pozadi
    const lw = 0.16, lt = 0.02, zc = 0.225, xc = 0.44 - lw / 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      p.push(part(box([sx * xc, gl + (ly - gl) / 2, sz * zc], [lw, ly - gl, lt]), white));
      for (const dx of [-0.04, 0.04]) p.push(part(box([sx * xc + dx, gl / 2, sz * zc], [0.04, gl, 0.01]), black)); // stopice
    }
    // okvir ispod ploče: duge i kratke stranice, uvučene iza nogu
    const ah = 0.14, ay = ly - ah / 2, at = 0.018;
    for (const s of [-1, 1]) {
      p.push(part(box([0, ay, s * (zc - lt / 2 - at / 2)], [0.86, ah, at], [0, 0, 1, 1]), ap));
      p.push(part(box([s * 0.43, ay, 0], [at, ah, 0.5 - 2 * (0.25 - zc - lt / 2) - 2 * at - 0.002], [0, 0, 1, 1]), ap));
    }
    return root;
  },
};
