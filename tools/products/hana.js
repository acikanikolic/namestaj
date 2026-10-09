// Ormar HANA 4K2F2O: 4 krila (2 sa ogledalom), 2 fioke, šipka, police. 160x52x205 cm
const { box, part, node, qy, deg, tube } = require('../lib');

const W = 1.60, D = 0.52, H = 2.05, T = 0.018;
const PL = 0.07;                       // sokla
const DT = 0.018;                      // debljina krila
const ZF = D / 2 - 0.027 - DT / 2;     // centar krila (rukohvati završavaju na D/2)
const ZC = ZF - DT / 2;                // prednja ivica korpusa
const ZB = -D / 2;                     // zadnja ivica
const DOOR_BOT = 0.08, DOOR_TOP = H - T - 0.002;
const DW = 0.398;                      // širina krila
const DRAWER_TOP = 0.465, MIR_BOT = 0.467;

const WOOD = { tex: 'hana_door.jpg', rough: 0.7 };
const WOOD_H = { tex: 'hana_wood_h.jpg', rough: 0.7 };
const INNER = { color: '#cfc6c0', rough: 0.8 };
const BOXC = { color: '#e6dfd6', rough: 0.65 };
const SILVER = { color: '#b4b9bb', rough: 0.35, metal: 0.8 };
const MIRROR = { color: '#d3d9dc', rough: 0.05, metal: 1 };

const full = [0, 0, 1, 1];
const wv = (c, s) => part(box(c, s, full), WOOD);          // vertikalni dezen
const wh = (c, s) => part(box(c, s, full), WOOD_H);        // horizontalni dezen
const bc = (c, s) => part(box(c, s), INNER);

function build() {
  const root = node('ormar_hana');
  const body = node('korpus');
  const cd = ZC - ZB, cz = (ZC + ZB) / 2;             // dubina/centar stranica
  const hi = W / 2 - T;                                // unutrašnja ivica stranice

  body.parts.push(wh([0, H - T / 2, (D / 2 + 0.003 + ZB) / 2], [W, T, D / 2 + 0.003 - ZB]));          // vrh (blagi prepust napred)
  for (const s of [-1, 1]) body.parts.push(wv([s * (W / 2 - T / 2), (H - T) / 2, cz], [T, H - T, cd])); // stranice do poda
  body.parts.push(wh([0, PL + T / 2, cz - 0.004], [2 * hi, T, cd - 0.008]));                           // dno
  body.parts.push(bc([0, (PL + H - T) / 2, ZB + 0.004], [2 * hi, H - T - PL, 0.008]));                // leđa
  body.parts.push(wv([0, PL / 2, ZC - 0.025 - T / 2], [2 * hi, PL, T]));                              // sokla (uvučena)
  body.parts.push(wv([0, PL / 2, ZB + 0.06], [2 * hi, PL, T]));                                        // zadnja sokla

  // pregrade i police
  const yb = PL + T, yt = H - T;
  for (const s of [-1, 1]) {
    body.parts.push(wv([s * 0.4, (yb + yt) / 2, cz - 0.004], [T, yt - yb, cd - 0.008]));              // pregrade
    for (const y of [1.66, 1.28, 0.88, 0.505]) {                                                       // 4 police u bočnim odeljcima
      const x0 = 0.4 + T / 2, x1 = hi, w = x1 - x0;
      body.parts.push(wh([s * (x0 + w / 2), y, cz - 0.01], [w, 0.016, cd - 0.028]));
    }
  }
  const cw = 0.4 - T / 2;
  body.parts.push(wh([0, 1.66, cz - 0.01], [2 * cw, 0.016, cd - 0.028]));                              // polica iznad šipke
  body.parts.push(wh([0, 0.452, cz - 0.01], [2 * cw, 0.016, cd - 0.028]));                             // polica iznad fioka
  body.parts.push(tube([-cw + 0.012, 1.58, cz], [cw - 0.012, 1.58, cz], 0.0125, SILVER)); // garderobna šipka
  // šipka je cilindar duž ose; nosači šipke
  for (const s of [-1, 1]) body.parts.push(part(box([s * (cw - 0.006), 1.58, cz], [0.012, 0.04, 0.04]), SILVER));
  // pločice šarki na pregradama
  const plate = (x, ys) => ys.forEach(y => body.parts.push(part(box([x, y, ZC - 0.03], [0.004, 0.05, 0.035]), SILVER)));
  plate(-0.789, [0.2, 1.05, 1.9]); plate(0.789, [0.2, 1.05, 1.9]);
  plate(-0.389, [0.55, 1.25, 1.9]); plate(0.389, [0.55, 1.25, 1.9]);
  root.kids.push(body);

  // ručka vertikalna (lokalno u koordinatama krila)
  const vHandle = (n, x, y) => {
    for (const dy of [-0.04, 0.04]) n.parts.push(part(box([x, y + dy, DT / 2 + 0.0065], [0.012, 0.012, 0.013]), SILVER));
    n.parts.push(part(box([x, y, DT / 2 + 0.0165], [0.012, 0.10, 0.007]), SILVER));
  };
  const hHandle = (n, x, y) => {
    for (const dx of [-0.045, 0.045]) n.parts.push(part(box([x + dx, y, DT / 2 + 0.0065], [0.012, 0.012, 0.013]), SILVER));
    n.parts.push(part(box([x, y, DT / 2 + 0.0165], [0.11, 0.012, 0.007]), SILVER));
  };

  // krila: pivot na ivici šarke; s = smer širenja krila od pivota
  const door = (name, hx, s, mirror, ys) => {
    const open = s > 0 ? -105 : 105;
    const n = node(name, { t: [hx, 0, ZF], r: qy(0), anim: { path: 'rotation', to: qy(deg(open)), time: 1.6 } });
    const yb0 = mirror ? MIR_BOT : DOOR_BOT, h = DOOR_TOP - yb0;
    // uv po krilu: x lokalno 0..DW (od pivota), y yb0..DOOR_TOP
    const piece = (x0, x1, y0, y1) => {
      const g = box([s * (x0 + x1) / 2, (y0 + y1) / 2, 0], [x1 - x0, y1 - y0, DT],
        [x0 / DW, (DOOR_TOP - y1) / h, x1 / DW, (DOOR_TOP - y0) / h]);
      if (s < 0) { /* ogledalo UV po x ostaje valjano za dezen */ }
      n.parts.push(part(g, WOOD));
    };
    if (!mirror) piece(0, DW, yb0, DOOR_TOP);
    else {
      const ox0 = 0.084, ox1 = 0.314, oy0 = 0.548, oy1 = 1.945;
      piece(0, ox0, yb0, DOOR_TOP); piece(ox1, DW, yb0, DOOR_TOP);
      piece(ox0, ox1, yb0, oy0); piece(ox0, ox1, oy1, DOOR_TOP);
      n.parts.push(part(box([s * (ox0 + ox1) / 2, (oy0 + oy1) / 2, 0.002], [ox1 - ox0 + 0.016, oy1 - oy0 + 0.016, 0.006]), MIRROR));
    }
    vHandle(n, s * (DW - 0.05), 1.055);
    for (const y of ys) n.parts.push(part(box([s * 0.022, y, -DT / 2 - 0.003], [0.044, 0.04, 0.006]), SILVER)); // šarka
    return n;
  };
  const sh1 = [0.2, 1.05, 1.9], sh2 = [0.55, 1.25, 1.9];
  root.kids.push(door('krilo_1', -0.799, 1, false, sh1));
  root.kids.push(door('krilo_2', -0.399, 1, true, sh2));
  root.kids.push(door('krilo_3', 0.399, -1, true, sh2));
  root.kids.push(door('krilo_4', 0.799, -1, false, sh1));

  // fioke
  const drawer = (name, y0, y1, vr) => {
    const h = y1 - y0, yc = (y0 + y1) / 2, fw = 0.796;
    const n = node(name, { t: [0, yc, ZF], anim: { path: 'translation', to: [0, yc, ZF + 0.32], time: 1.6 } });
    n.parts.push(part(box([0, 0, 0], [fw, h, DT], [0, vr[0], 1, vr[1]]), WOOD_H));
    hHandle(n, -0.2, 0); hHandle(n, 0.2, 0);
    const bd = 0.40, bh = 0.15, bw = 0.72, by = -h / 2 + 0.013 + bh / 2 + 0.005, bz = -DT / 2 - bd / 2;
    const p = (c, s) => n.parts.push(part(box(c, s), BOXC));
    p([0, by - bh / 2 + 0.004, bz], [bw, 0.008, bd]);                       // dno
    for (const s of [-1, 1]) p([s * (bw / 2 - 0.006), by, bz], [0.012, bh, bd]); // stranice
    p([0, by, -DT / 2 - bd + 0.006], [bw, bh, 0.012]);                      // zadnja
    p([0, by, -DT / 2 - 0.006], [bw, bh, 0.012]);                           // prednja
    return n;
  };
  root.kids.push(drawer('fioka_dole', DOOR_BOT, 0.2725, [0.5, 1]));
  root.kids.push(drawer('fioka_gore', 0.2745, DRAWER_TOP, [0, 0.5]));
  return root;
}

module.exports = { id: 'hana', animated: true, dims: [160, 52, 205], build };
