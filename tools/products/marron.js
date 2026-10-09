// Komoda MARRON 157 3K3F3V: 3 vrata + 3 fioke, crna letva izmedju, metalne nogice
const { box, part, node, cylinder, qy, deg } = require('../lib');
const UV = [0, 0, 1, 1];
const BEZ = { tex: 'marron_bez.jpg', color: '#ffffff', rough: 0.6 };
const INN = { color: '#b9b1a6', rough: 0.75 };
const CRNA = { color: '#1b1b1c', rough: 0.8 };
const METAL = { color: '#202020', rough: 0.45, metal: 0.5 };
const CHROME = { color: '#b9c3c7', rough: 0.3, metal: 0.8 };
const cm = v => v / 100;
// kutija u cm: centar + dimenzije
const B = (c, s, o = BEZ) => part(box(c.map(cm), s.map(cm), o.tex ? UV : undefined), o);

module.exports = {
  id: 'marron', animated: true, dims: [157, 40, 90],
  build() {
    const W = 157, D = 40, H = 90, T = 1.8, LEG = 8;
    const zF = D / 2 - 1.8;           // prednja ivica korpusa (iza frontova)
    const zB = -D / 2;
    const xi = W / 2 - T, iw = W - 2 * T;     // unutrašnja polu-širina / širina
    const yB = LEG, yT = H - T;               // dno korpusa / donja ivica vrha
    const railH = 4.1, railTop = 67.8, railBot = railTop - railH;
    const root = node('marron');
    const body = node('korpus'); root.kids.push(body);
    const P = (c, s, o) => body.parts.push(B(c, s, o));
    const cd = zF - zB - 0.5;                 // dubina unutrašnjosti do leđa
    const cz = (zF + zB + 0.5) / 2 - 0.0;     // centar po z (bez leđa)
    // stranice, vrh, dno
    P([-W / 2 + T / 2, (yB + H) / 2, (zF + zB) / 2], [T, H - yB, zF - zB]);
    P([W / 2 - T / 2, (yB + H) / 2, (zF + zB) / 2], [T, H - yB, zF - zB]);
    P([0, H - T / 2, (zF + zB) / 2], [W, T, zF - zB]);
    P([0, yB + T / 2, (zF + zB) / 2], [iw, T, zF - zB]);
    // leđa (uvučena, u žlebu)
    P([0, (yB + H) / 2, zB + 0.25], [iw + 1, H - yB - 1, 0.5], INN);
    // pregrade
    const pitch = iw / 3;
    for (const k of [1, 2]) P([-xi + k * pitch, (yB + T + yT) / 2, cz + 0.25], [T, yT - yB - T, cd - 0.5], INN);
    // crna letva/ploča ispod fioka (cela dubina)
    body.parts.push(B([0, (railBot + railTop) / 2, cz + 0.25], [iw, railH, cd - 0.5], CRNA));
    // police u nišama
    const shY = (yB + T + railBot) / 2;
    for (let k = 0; k < 3; k++) P([-xi + (k + 0.5) * pitch, shY, cz + 0.4], [pitch - T, 1.6, cd - 0.9], INN);
    // nogice: 4 metalne (uglovi) + 4 podesive klizne
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      body.parts.push(B([sx * (W / 2 - 4.5), (LEG - 0.3) / 2, sz * 14], [2.2, LEG - 0.3, 2.2], METAL));
      body.parts.push(B([sx * (W / 2 - 4.5), LEG - 0.15, sz * 14], [5, 0.3, 5], METAL));
    }
    for (const gx of [-pitch / 2 - T / 2 + 0, pitch / 2 + T / 2]) for (const sz of [-1, 1]) {
      body.parts.push(part(cylinder([cm(gx), cm(LEG - 2.5), cm(sz * 14)], cm(1.1), cm(1.2), 20), METAL)); // navrtka
      body.parts.push(part(cylinder([cm(gx), cm((LEG - 0.4) / 2 + 0.5), cm(sz * 14)], cm(0.35), cm(LEG - 0.4 - 1.5), 12), METAL));
      body.parts.push(part(cylinder([cm(gx), cm(0.3), cm(sz * 14)], cm(1.5), cm(0.6), 20), METAL));
    }
    // vrata: šarka sa strane h (-1 levo, +1 desno), 3 profilisana polja (žlebovi)
    const gap = 0.3, doorTop = railBot - 0.15, doorBot = yB + 0.2;
    const dh = doorTop - doorBot, dw = pitch - gap;
    const hinges = [-1, 1, 1];
    for (let k = 0; k < 3; k++) {
      const cx = -xi + (k + 0.5) * pitch, h = hinges[k];
      const hx = cx + h * dw / 2;
      const pivot = node('vrata_' + (k + 1), { t: [cm(hx), cm((doorTop + doorBot) / 2), cm(zF)], r: [0, 0, 0, 1] });
      pivot.anim = { path: 'rotation', to: qy(deg(h * 105)), time: 1.4 };
      const lx = -h * dw / 2;                 // centar vrata u odnosu na šarku
      // osnovna ploča (zadnji sloj) + tri uzdignuta polja sa 0.3 cm žlebom
      pivot.parts.push(B([lx, 0, 0.5], [dw, dh, 1.0]));
      const gr = 0.35, ph = (dh - 2 * gr) / 3;
      for (let j = 0; j < 3; j++) pivot.parts.push(B([lx, dh / 2 - ph / 2 - j * (ph + gr), 1.4], [dw, ph, 0.8]));
      // šarke (hromirane) na korpusu - unutar vrata, vidljive kad su otvorena
      for (const yy of [-dh / 2 + 6, dh / 2 - 6]) pivot.parts.push(B([-h * 0.5 + 0.0, yy, -0.1], [1.0, 5, 0.8], CHROME));
      body.kids.push(pivot);
    }
    // fioke: čelo + kutija
    const dTop = yT - 0.15, dBot = railTop + 0.15, dH = dTop - dBot;
    for (let k = 0; k < 3; k++) {
      const cx = -xi + (k + 0.5) * pitch;
      const dr = node('fioka_' + (k + 1), { t: [cm(cx), cm((dTop + dBot) / 2), cm(zF)] });
      dr.anim = { path: 'translation', to: [cm(cx), cm((dTop + dBot) / 2), cm(zF + 30)], time: 1.2 };
      dr.parts.push(B([0, 0, 0.9], [pitch - gap, dH, 1.8]));
      // kutija
      const bw = pitch - T - 2.4, bd = 33, bh = dH - 3.5, by = -dH / 2 + 2.2 + bh / 2, bz = -bd / 2 - 0.1;
      dr.parts.push(B([0, -dH / 2 + 2.2 + 0.4, bz], [bw, 0.8, bd], INN));               // dno
      for (const s of [-1, 1]) dr.parts.push(B([s * (bw / 2 - 0.8), by, bz], [1.6, bh, bd], INN));
      dr.parts.push(B([0, by, bz - bd / 2 + 0.8], [bw - 3.2, bh, 1.6], INN));            // zadnja
      dr.parts.push(B([0, by, -0.1 - 0.8], [bw - 3.2, bh, 1.6], INN));                   // prednja
      body.kids.push(dr);
    }
    return root;
  },
};
