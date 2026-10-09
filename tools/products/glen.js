// Regal GLEN (formaideale.rs) - kula levo, viseća polica gore, TV klupa desno, bela klapna dole
const { box, part, node, qx, deg } = require('../lib');

const W = 170.5, ZB = -0.2075;                 // cm; zadnja ravan modela
const X = x => (x - W / 2) / 100;
const Z = z => ZB + z / 100;
// kutija po granicama (cm): x0..x1, y0..y1, z0..z1 (z od zadnje strane ka napred)
const bx = (x0, x1, y0, y1, z0, z1) => ({
  c: [X((x0 + x1) / 2), (y0 + y1) / 200, Z((z0 + z1) / 2)],
  s: [(x1 - x0) / 100, (y1 - y0) / 100, (z1 - z0) / 100],
});
const OAK = { tex: 'glen_oak.jpg', rough: 0.65 };
const OAKV = { tex: 'glen_oakv.jpg', rough: 0.65 };
const WHITE = { color: '#ebe8e5', rough: 0.35 };
const ALU = { color: '#b9bcc0', rough: 0.35, metal: 0.8 };

function build() {
  const root = node('glen');
  const body = node('korpus');
  const add = (m, ...a) => { const k = bx(...a); body.parts.push(part(box(k.c, k.s, [0, 0, 1, 1]), m)); };

  // sokl (uvučen)
  add(OAK, 3.5, 169.5, 0, 4.5, 2, 33.6);
  add(OAK, 3.5, 115.2, 0, 4.5, 33.6, 38.5);

  // bela baza ispod kule (iza klapne)
  add(WHITE, 0, 115.2, 4.5, 6.3, 0, 39.7);          // dno
  add(WHITE, 0, 115.2, 33.6, 35.4, 0, 41.5);        // vrh (vidljiv beo)
  add(WHITE, 0, 1.8, 6.3, 33.6, 0, 39.7);           // leva stranica
  add(WHITE, 113.4, 115.2, 6.3, 33.6, 0, 39.7);     // desna stranica
  add(WHITE, 55.5, 57.3, 6.3, 33.6, 0, 39.7);       // srednja pregrada
  add(WHITE, 1.8, 113.4, 6.3, 33.6, 0, 0.6);        // leđa

  // kula levo (3 otvorene niše)
  add(OAKV, 0, 3.6, 35.4, 170.5, 0, 34.6);          // leva stranica
  add(OAKV, 42.4, 45.2, 35.4, 138.4, 0, 34.6);      // desna stranica
  add(OAK, 3.6, 42.4, 68.8, 70.4, 0.6, 34.6);       // police
  add(OAK, 3.6, 42.4, 103.6, 105.2, 0.6, 34.6);
  add(OAK, 3.6, 42.4, 35.4, 138.4, 0, 0.6);         // leđa
  add(OAK, 3.6, 45.2, 138.4, 140.2, 0, 34.6);       // pod gornje police nad kulom

  // gornja viseća polica (2 niše)
  add(OAK, 45.2, 164.6, 138.4, 140.2, 0, 23.6);     // dno
  add(OAK, 3.6, 164.6, 166.9, 170.5, 0, 23.6);      // vrh
  add(OAKV, 160.6, 164.6, 140.2, 166.9, 0, 23.6);   // desna stranica
  add(OAKV, 81.3, 82.9, 140.2, 166.9, 0, 23.6);     // pregrada
  add(OAK, 3.6, 160.6, 140.2, 166.9, 0, 0.6);       // leđa

  // TV klupa
  add(OAK, 55.1, 170.5, 51.8, 55.8, 0, 34.6);       // ploča
  add(OAKV, 55.1, 58.1, 35.4, 51.8, 0, 34.6);       // leva noga
  add(OAK, 58.1, 166.9, 35.4, 51.8, 0, 0.6);        // leđa gore
  add(OAKV, 115.2, 118, 4.5, 51.8, 0, 34.6);        // pregrada
  add(OAKV, 166.9, 170.5, 4.5, 51.8, 0, 34.6);      // desna stranica
  add(OAK, 118, 166.9, 26.5, 28.1, 0.6, 34.6);      // polica
  add(OAK, 118, 166.9, 4.5, 10, 0.6, 34.6);         // dno
  add(OAK, 118, 166.9, 4.5, 51.8, 0, 0.6);          // leđa desno
  root.kids.push(body);

  // klapna (šarka dole, otvara se napred i dole)
  const fh = 35.2 - 4.7, fw = 114.8;
  const flap = node('klapna', { t: [X(0.2 + fw / 2), 0.047, Z(40.6)], r: qx(0), anim: { path: 'rotation', to: qx(deg(75)), time: 1.4 } });
  flap.parts.push(part(box([0, fh / 200, 0], [fw / 100, fh / 100, 0.018], [0, 0, 1, 1]), WHITE));
  for (const hx of [21.2, 91.5]) {                  // aluminijumske ručke
    const hc = X(hx) - flap.t[0];
    flap.parts.push(part(box([hc, (29.5 - 4.7) / 100, 0.0115], [0.115, 0.006, 0.005]), ALU));
  }
  root.kids.push(flap);
  return root;
}

module.exports = { id: 'glen', animated: true, dims: [170.5, 41.5, 170.5], build };
