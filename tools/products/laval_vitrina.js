// Vitrina LAVAL 1K VS1 193 (54.5 x 40 x 192.5 cm): donja zatvorena vrata sa crnim letvicama, gornja staklena vrata.
const { box, quad, part, node, qy, deg, CHROME } = require('../lib');

module.exports = {
  id: 'laval_vitrina', animated: true, dims: [54.5, 40, 192.5],
  build() {
    const W = 0.545, D = 0.40, H = 1.925, t = 0.018, LEG = 0.10, bt = 0.008;
    const U = [0, 0, 1, 1];
    const OAK = { tex: 'lavalv_oak.jpg', rough: 0.65 };
    const INN = { tex: 'lavalv_in.jpg', rough: 0.7 };
    const BLK = { tex: 'lavalv_blk.jpg', color: '#ffffff', rough: 0.45, metal: 0.1 };
    const METAL = { color: '#1c1c1c', rough: 0.4, metal: 0.5 };
    const oak = (c, s) => part(box(c, s, U), OAK);
    const root = node('vitrina');

    // --- korpus ---
    const body = node('korpus'); root.kids.push(body);
    const bd = 0.37, bz = -0.015;                 // korpus z od -0.20 do 0.17; vrata + ručka do 0.20
    const iw = W - 2 * t, yTop = H - t / 2;
    body.parts.push(oak([0, yTop, bz], [W, t, bd]));                              // vrh
    body.parts.push(oak([0, LEG + t / 2, bz], [iw, t, bd]));                      // dno
    for (const s of [-1, 1]) body.parts.push(oak([s * (W / 2 - t / 2), (H + LEG) / 2, bz], [t, H - LEG, bd])); // stranice
    body.parts.push(part(box([0, (H + LEG) / 2, -D / 2 + bt / 2], [iw, H - LEG - 2 * t, bt], U), INN)); // leđa
    // police (pokazane visine po fotografiji): 0.878 je fiksna pregrada između vrata
    for (const y of [0.515, 0.878, 1.195, 1.507]) body.parts.push(oak([0, y, bz + 0.005], [iw, 0.016, bd - 0.02]));
    // metalne nogice (crne, kvadratne)
    for (const x of [-0.235, 0.235]) for (const z of [-0.15, 0.15]) body.parts.push(part(box([x, LEG / 2, z], [0.022, LEG, 0.022]), METAL));
    // pomoćna donja letva (sokl iza vrata)
    body.parts.push(oak([0, LEG + t + 0.004, bd / 2 - 0.02], [iw, 0.012, 0.012]));
    // šarke (unutra levo)
    for (const y of [0.20, 0.76, 0.98, 1.80]) body.parts.push(part(box([-W / 2 + t + 0.006, y, bd / 2 - 0.027], [0.012, 0.07, 0.014]), CHROME));

    
    const dt = 0.018, dw = W - 0.004, hx = -W / 2 + 0.002;
    const zc = 0.17 + dt / 2;

    // --- donja vrata (zatvorena, šarka levo) ---
    const y0 = 0.120, y1 = 0.876, dh = y1 - y0;
    const low = node('vrata_donja', { t: [hx, (y0 + y1) / 2, zc], r: qy(0), anim: { path: 'rotation', to: qy(deg(-105)), time: 1.5 } });
    low.parts.push(oak([dw / 2, 0, 0], [dw, dh, dt]));
    // crne letvice (4) u desnom delu fronta
    const sw = 0.043, gap = 0.027, sx0 = 0.272;
    for (let i = 0; i < 4; i++) low.parts.push(part(box([sx0 + sw / 2 + i * (sw + gap), 0, dt / 2 + 0.0015], [sw, dh, 0.003], U), BLK));
    root.kids.push(low);

    // --- gornja staklena vrata: okvir + staklo (providno, bez ploče) ---
    const u0 = 0.880, u1 = 1.905, uh = u1 - u0, uyc = (u0 + u1) / 2;
    const up = node('vrata_gornja', { t: [hx, uyc, zc], r: qy(0), anim: { path: 'rotation', to: qy(deg(-105)), time: 1.5 } });
    const fs = 0.036, fb = 0.044;                   // širina okvira (stranice/vrh) i donje letve
    up.parts.push(oak([dw / 2, uh / 2 - fs / 2, 0], [dw, fs, dt]));           // gornja
    up.parts.push(oak([dw / 2, -uh / 2 + fb / 2, 0], [dw, fb, dt]));          // donja
    for (const x of [fs / 2, dw - fs / 2]) up.parts.push(oak([x, (fb - fs) / 2, 0], [fs, uh - fs - fb, dt])); // stranice
    // unutrašnja uska letva uz staklo (profil)
    const gh = uh - fs - fb, gy = (fb - fs) / 2, gw = dw - 2 * fs;
    const lip = { color: '#8a6a4c', rough: 0.6 };
    up.parts.push(part(box([dw / 2, gy + gh / 2 - 0.002, 0], [gw, 0.004, 0.008]), lip));
    up.parts.push(part(box([dw / 2, gy - gh / 2 + 0.002, 0], [gw, 0.004, 0.008]), lip));
    // staklo: samo tanke refleksne trake (dimljeno staklo bi zaklonilo unutrašnjost)
    const GL = { color: '#c9d6dc', rough: 0.08, metal: 0 };
    up.parts.push(part(box([dw / 2 - 0.08, gy + 0.05, 0], [0.012, gh * 0.55, 0.002]), GL));
    up.parts.push(part(box([dw / 2 - 0.045, gy + 0.05, 0], [0.005, gh * 0.55, 0.002]), GL));
    // tamna traka na dnu stakla (naznaka dimljenog stakla)
    up.parts.push(part(box([dw / 2, gy - gh / 2 + 0.006, -0.002], [gw, 0.012, 0.002]), { color: '#3a2d28', rough: 0.2 }));
    // ručka: crna vertikalna, na desnoj ivici
    up.parts.push(part(box([dw - 0.018, -uh / 2 + 0.145, dt / 2 + 0.006], [0.010, 0.095, 0.012]), METAL));
    root.kids.push(up);
    return root;
  },
};
