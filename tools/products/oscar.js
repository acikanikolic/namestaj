// Trpezarijski sto OSCAR TS 160x90 (artisan hrast): produživ, noge „L", podrame, ploča 25 mm
const { box, rbox, cylinder, part, node } = require('../lib');

const W = 1.605, D = 0.905, H = 0.765;       // gabariti
const T = 0.025, TOP_Y = H - T / 2;          // ploča
const TOP = { tex: 'oscar_top.jpg', color: '#ffffff', rough: 0.65 };
const LEG = { tex: 'oscar_leg.jpg', color: '#ffffff', rough: 0.65 };
const GLIDE = { color: '#1c1c1c', rough: 0.8 };
const UV = [0, 0, 1, 1];

module.exports = {
  id: 'oscar', animated: false, dims: [160.5, 90.5, 76.5],
  build() {
    const root = node('oscar');
    const gl = 0.006, legTop = H - T;          // stopica 6 mm, noge do donje ivice ploče
    const legH = legTop - gl;
    // ploča od dve polovine (produživi sto) sa tankim šavom u sredini
    const half = (W - 0.002) / 2;
    for (const s of [-1, 1]) root.parts.push(part(rbox([s * (half / 2 + 0.001), TOP_Y, 0], [half, T, D], 0.0025, 2, UV), TOP));
    // noge: blok 11.5x11.5 + tanki oslonac 2.5 cm sa spoljne X strane (L presek)
    const ins = 0.012, blk = 0.115, fl = 0.025, LW = blk + fl;
    const ax = (W / 2 - 0.018) - LW, az = D / 2 - 0.018;   // spoljna ivica noge 1.8 cm od ivice ploče
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (W / 2 - 0.018 - LW / 2), cz = sz * (D / 2 - 0.018 - blk / 2);
      // blok (pomeren ka sredini u X), flanša na spoljnoj X strani
      const bx = cx - sx * fl / 2, fx = sx * (W / 2 - 0.018 - fl / 2);
      root.parts.push(part(box([bx, gl + legH / 2, cz], [blk, legH, blk], UV), LEG));
      root.parts.push(part(box([fx, gl + legH / 2, cz], [fl, legH, blk], UV), LEG));
      root.parts.push(part(cylinder([cx, gl / 2, cz], 0.02, gl, 20), GLIDE));
    }
    // podrame (zarge) 2 cm debljine, 9.6 cm visine, ispod ploče
    const aH = 0.096, aY = legTop - aH / 2, aT = 0.02;
    const zo = D / 2 - 0.018;                       // spoljna ravan nogu
    const xi = W / 2 - 0.018 - LW;                  // unutrašnja ivica bloka noge (X)
    for (const sz of [-1, 1]) root.parts.push(part(box([0, aY, sz * (zo - aT / 2)], [2 * xi, aH, aT], UV), LEG));
    const xo = W / 2 - 0.018 - fl;
    for (const sx of [-1, 1]) root.parts.push(part(box([sx * (xo - aT / 2), aY, 0], [aT, aH, 2 * (zo - blk)], UV), LEG));
    return root;
  },
};
