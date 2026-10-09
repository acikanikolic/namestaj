// TV polica LAVAL TV 131 2K2V: 131.5 x 40 x 52 cm, dva vrata sa strane + srednja niša sa crnim/hrast letvicama
const { box, cylinder, part, node, qy, deg } = require('../lib');

module.exports = {
  id: 'laval_tv', animated: true, dims: [131.5, 40, 52],
  build() {
    const W = 1.315, D = 0.39, H = 0.52, t = 0.018, LEG = 0.09;
    const OAK = { tex: 'lavaltv_oak.jpg', rough: 0.65 };
    const TOP = { tex: 'lavaltv_top.jpg', rough: 0.6 };
    const SLAT = { tex: 'lavaltv_slat.jpg', rough: 0.65 };
    const BLK = { tex: 'lavaltv_black.jpg', rough: 0.55 };
    const METAL = { color: '#262626', rough: 0.4, metal: 0.5 };
    const o = (c, s, m = OAK) => part(box(c, s, [0, 0, 1, 1]), m);
    const root = node('laval_tv');
    const body = node('korpus');
    const yb = LEG + t / 2, yt = H - t / 2, hi = H - LEG;       // dno, vrh
    const iw = W - 2 * t, zf = D / 2;
    // vrh i dno, stranice, leđa
    body.parts.push(o([0, yt, 0], [W, t, D], TOP));
    body.parts.push(o([0, yb, 0], [iw, t, D - 0.002]));
    for (const s of [-1, 1]) body.parts.push(o([s * (W / 2 - t / 2), LEG + hi / 2 - 0 , 0], [t, hi, D]));
    body.parts.push(o([0, LEG + hi / 2, -D / 2 + 0.012], [iw, hi - 2 * t, 0.005], { ...OAK, color: '#d8d0c8' }));
    // srednja niša: crne ploče (uvučene 4 mm) i hrast letvice (u ravni fronta); redosled B S B S B S B S
    const midW = 0.26, bw = 0.045, sw = 0.02, nh = hi - 2 * t, ny = LEG + hi / 2;
    const dFront = D - 0.004;
    let x = -midW / 2;
    for (let i = 0; i < 4; i++) {
      body.parts.push(o([x + bw / 2, ny, -0.002], [bw, nh, dFront], BLK)); x += bw;
      body.parts.push(o([x + sw / 2, ny, 0], [sw, nh, D], SLAT)); x += sw;
    }
    // nožice (crne) i podesiva nogica u sredini
    for (const s of [-1, 1]) {
      body.parts.push(part(box([s * 0.615, LEG / 2, 0.145], [0.025, LEG, 0.025]), METAL));
      body.parts.push(part(box([s * 0.575, LEG / 2, -0.145], [0.025, LEG, 0.025]), METAL));
    }
    body.parts.push(part(cylinder([0.128, 0.0375, 0.005], 0.014, 0.075, 20), METAL));
    body.parts.push(part(cylinder([0.128, LEG - 0.005, 0.005], 0.019, 0.01, 6), METAL));
    root.kids.push(body);

    // vrata (uvučena u otvor, fuga 2-3 mm), šarke spolja
    const open0 = -midW / 2, gap = 0.0025;
    const dw = (W / 2 - t) - midW / 2 - 2 * gap, dh = hi - 2 * t - 2 * gap, dyc = LEG + hi / 2;
    const door = (name, hx, side, open) => {
      const n = node(name, { t: [hx, dyc, zf - t / 2], r: qy(0), anim: { path: 'rotation', to: qy(deg(open)), time: 1.4 } });
      const cx = side * dw / 2;
      n.parts.push(o([cx, 0, 0], [dw, dh, t]));
      // crna ručka (traka sa dve nožice) pri unutrašnjoj ivici vrata, 9 cm ispod vrha
      const hxc = side * (dw - 0.02 - 0.043), hy = dh / 2 - 0.087;
      n.parts.push(part(box([hxc, hy, t / 2 + 0.005], [0.086, 0.014, 0.010]), METAL));
      n.parts.push(part(box([hxc, hy + 0.0105, t / 2 + 0.002], [0.086, 0.008, 0.004]), METAL));
      // šarke (lonče) na unutrašnjoj strani
      for (const yy of [dh / 2 - 0.07, -dh / 2 + 0.07])
        n.parts.push(part(box([side * 0.02, yy, -t / 2 - 0.004], [0.04, 0.045, 0.008]), { color: '#9a9a96', rough: 0.35, metal: 0.8 }));
      return n;
    };
    root.kids.push(door('vrata_levo', -(W / 2 - t) + gap, 1, -100));
    root.kids.push(door('vrata_desno', (W / 2 - t) - gap, -1, 100));
    return root;
  },
};
