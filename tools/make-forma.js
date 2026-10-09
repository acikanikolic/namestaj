// Generiše GLB modele za Forma Ideale demo. Teksture (images/*.jpg) su isečci iz više fotografija proizvoda
// (prednja strana, bok, detalj drveta), pa model izgleda verodostojno sa svih strana.
// Pokretanje: node tools/make-forma.js
const fs = require('fs');
const path = require('path');

const IMG = path.join(__dirname, '..', 'images');
const OUT = path.join(__dirname, '..', 'models');
const hex = h => [1, 3, 5].map(i => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2)).concat(1);
const qy = a => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
const deg = d => (d * Math.PI) / 180;

// ---------- geometrija ----------
// uv: [u0,v0,u1,v1] iz slike (v raste nadole); svako lice dobija isti isečak
function box([cx, cy, cz], [sx, sy, sz], uv) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const faces = [
    [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]]],
    [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]]],
    [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]]],
    [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]]],
    [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]]],
    [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]]],
  ];
  const g = { pos: [], nor: [], idx: [], uv: uv ? [] : null };
  faces.forEach(([n, vs], f) => {
    vs.forEach(v => { g.pos.push(v[0] + cx, v[1] + cy, v[2] + cz); g.nor.push(...n); });
    if (uv) { const [u0, v0, u1, v1] = uv; g.uv.push(u0, v1, u1, v1, u1, v0, u0, v0); }
    const b = f * 4;
    g.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  return g;
}
function quad([cx, cy, cz], w, h, [u0, v0, u1, v1]) {
  const x = w / 2, y = h / 2;
  return {
    pos: [cx - x, cy - y, cz, cx + x, cy - y, cz, cx + x, cy + y, cz, cx - x, cy + y, cz],
    nor: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    uv: [u0, v1, u1, v1, u1, v0, u0, v0], idx: [0, 1, 2, 0, 2, 3],
  };
}

// deo = {geo, color, tex, rough, metal}
const part = (geo, o = {}) => ({ geo, color: '#ffffff', ...o });
const node = (name, o = {}) => ({ name, parts: [], kids: [], ...o });

// ---------- GLB writer sa hijerarhijom i animacijom ----------
function buildGLB(root, withAnim = true) {
  const bufs = [], views = [], accessors = [], materials = [], matIdx = {}, images = [], textures = [], texIdx = {};
  const meshes = [], nodes = [], channels = [], samplers = [];
  let offset = 0;
  const addBuf = (data, target) => {
    const pad = (4 - (data.length % 4)) % 4;
    bufs.push(data, Buffer.alloc(pad));
    const v = { buffer: 0, byteOffset: offset, byteLength: data.length };
    if (target) v.target = target;
    views.push(v); offset += data.length + pad;
    return views.length - 1;
  };
  const push = (arr, Type, target) => addBuf(Buffer.from(new Type(arr).buffer), target);
  const acc = (view, type, comp, count, extra = {}) => { accessors.push({ bufferView: view, componentType: comp, count, type, ...extra }); return accessors.length - 1; };

  const material = p => {
    const key = (p.tex || p.color) + '|' + (p.rough ?? 0.7) + '|' + (p.metal ?? 0) + '|' + (p.color || '');
    if (key in matIdx) return matIdx[key];
    const pbr = { baseColorFactor: hex(p.color), metallicFactor: p.metal ?? 0, roughnessFactor: p.rough ?? 0.7 };
    if (p.tex) {
      if (!(p.tex in texIdx)) {
        const v = addBuf(fs.readFileSync(path.join(IMG, p.tex)));
        images.push({ bufferView: v, mimeType: 'image/jpeg' });
        textures.push({ source: images.length - 1 });
        texIdx[p.tex] = textures.length - 1;
      }
      pbr.baseColorTexture = { index: texIdx[p.tex] };
    }
    materials.push({ pbrMetallicRoughness: pbr });
    return (matIdx[key] = materials.length - 1);
  };

  const primitives = p => {
    const g = p.geo;
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < g.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], g.pos[i + k]); mx[k] = Math.max(mx[k], g.pos[i + k]); }
    const attrs = {};
    attrs.POSITION = acc(push(g.pos, Float32Array, 34962), 'VEC3', 5126, g.pos.length / 3, { min: mn, max: mx });
    attrs.NORMAL = acc(push(g.nor, Float32Array, 34962), 'VEC3', 5126, g.nor.length / 3);
    if (p.tex) attrs.TEXCOORD_0 = acc(push(g.uv, Float32Array, 34962), 'VEC2', 5126, g.uv.length / 2);
    const indices = acc(push(g.idx, Uint16Array, 34963), 'SCALAR', 5123, g.idx.length);
    return { attributes: attrs, indices, material: material(p) };
  };

  const walk = n => {
    const j = { name: n.name };
    if (n.t) j.translation = n.t;
    if (n.r) j.rotation = n.r;
    if (n.parts.length) { meshes.push({ primitives: n.parts.map(primitives) }); j.mesh = meshes.length - 1; }
    const idx = nodes.push(j) - 1;
    if (n.kids.length) j.children = n.kids.map(walk);
    if (n.anim && withAnim) {
      const T = n.anim.time ?? 1.2;
      const tIn = acc(push([0, T], Float32Array), 'SCALAR', 5126, 2, { min: [0], max: [T] });
      const out = n.anim.path === 'rotation' ? [...n.r, ...n.anim.to] : [...n.t, ...n.anim.to];
      const tOut = acc(push(out, Float32Array), n.anim.path === 'rotation' ? 'VEC4' : 'VEC3', 5126, 2);
      samplers.push({ input: tIn, output: tOut, interpolation: 'LINEAR' });
      channels.push({ sampler: samplers.length - 1, target: { node: idx, path: n.anim.path } });
    }
    return idx;
  };
  walk(root);

  const bin = Buffer.concat(bufs);
  const json = {
    asset: { version: '2.0', generator: 'make-forma.js' },
    scene: 0, scenes: [{ nodes: [0] }], nodes, meshes, materials, accessors, bufferViews: views,
    buffers: [{ byteLength: bin.length }],
  };
  if (images.length) { json.images = images; json.textures = textures; }
  if (channels.length) json.animations = [{ name: 'Otvori', samplers, channels }];
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const total = 12 + 8 + js.length + 8 + bin.length;
  const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  const h1 = Buffer.alloc(8); h1.writeUInt32LE(js.length, 0); h1.write('JSON', 4);
  const h2 = Buffer.alloc(8); h2.writeUInt32LE(bin.length, 0); h2.write('BIN\0', 4);
  return Buffer.concat([head, h1, js, h2, bin]);
}

// ============================================================
// KOMODA DUERO 3K2F  (138 x 40 x 96 cm) – ima vrata i fioke koje se otvaraju
// ============================================================
function duero() {
  const W = 1.38, H = 0.96, D = 0.40, FT = 0.05, t = 0.018;
  const OAK = { tex: 'k_oak.jpg', rough: 0.65 };
  const ko = (c, s) => part(box(c, s, [0, 0, 1, 1]), OAK);
  const black = geo => part(geo, { color: '#1b1b1b', rough: 0.4, metal: 0.3 });
  const FRONT = 'k_front.jpg';
  const frontUV = (x0, y0, x1, y1) => [x0 / 600, y0 / 436.5, x1 / 600, y1 / 436.5]; // koordinate iz fotografije (600 px)
  const zf = D / 2 - t / 2;   // centar prednjih ploča
  const root = node('komoda');

  // korpus
  const body = node('korpus');
  const cd = D - 0.02, cz = -0.01, yb = FT + t / 2, yt = H - t / 2;
  body.parts.push(ko([0, yt, 0], [W, t, D]));                                   // gornja ploča
  body.parts.push(ko([0, yb, cz], [W - 2 * t, t, cd]));                          // dno
  for (const s of [-1, 1]) body.parts.push(ko([s * (W / 2 - t / 2), (H + FT) / 2, cz], [t, H - FT, cd])); // stranice
  body.parts.push(ko([0, (H + FT) / 2, -D / 2 + 0.004], [W - 2 * t, H - FT - 2 * t, 0.008]));            // leđa
  const midHalf = 0.2265;
  for (const s of [-1, 1]) body.parts.push(ko([s * midHalf, (H + FT) / 2, cz], [t, H - FT - 2 * t, cd])); // pregrade
  const secW = W / 2 - t - midHalf - t / 2;
  for (const s of [-1, 1]) for (const y of [0.36, 0.65])                           // police levo/desno
    body.parts.push(ko([s * (W / 2 - t - secW / 2), y, cz], [secW, 0.016, cd - 0.01]));
  body.parts.push(ko([0, 0.36, cz], [midHalf * 2 - t, 0.016, cd - 0.01]));        // polica u sredini
  for (const x of [-0.62, 0.62]) for (const z of [-0.13, 0.13])                     // nožice
    body.parts.push(black(box([x, FT / 2, z], [0.07, FT, 0.05])));
  root.kids.push(body);

  // vrata
  const yDoorBot = FT + 0.012, yDoorTop = H - t - 0.002, dh = yDoorTop - yDoorBot, dyc = (yDoorBot + yDoorTop) / 2;
  const door = (name, hingeX, w, side, uv, hx, open) => {
    const n = node(name, { t: [hingeX, dyc, zf], r: qy(0), anim: { path: 'rotation', to: qy(deg(open)), time: 1.4 } });
    const cx = side * w / 2;
    n.parts.push(ko([cx, 0, 0], [w, dh, t]));
    n.parts.push(part(quad([cx, 0, t / 2 + 0.0006], w, dh, uv), { tex: FRONT, rough: 0.65 }));
    n.parts.push(black(box([hx, dh / 2 - 0.016, t / 2 + 0.008], [0.05, 0.014, 0.022])));
    return n;
  };
  root.kids.push(door('vrata_levo', -W / 2, 0.462, 1, frontUV(124, 148, 239, 380), 0.39, -100));
  root.kids.push(door('vrata_desno', W / 2, 0.462, -1, frontUV(363, 148, 476, 380), -0.405, 100));

  // srednja vrata (ispod fioka)
  const mH = 0.637 - yDoorBot, mYc = (yDoorBot + 0.637) / 2;
  const mid = node('vrata_sredina', { t: [-0.225, mYc, zf], r: qy(0), anim: { path: 'rotation', to: qy(deg(-100)), time: 1.4 } });
  mid.parts.push(ko([0.225, 0, 0], [0.45, mH, t]));
  mid.parts.push(part(quad([0.225, 0, t / 2 + 0.0006], 0.45, mH, frontUV(243, 231, 357, 380)), { tex: FRONT, rough: 0.65 }));
  mid.parts.push(black(box([0.225, mH / 2 - 0.016, t / 2 + 0.008], [0.05, 0.014, 0.022])));
  root.kids.push(mid);

  // fioke
  const drawer = (name, y0, y1, uv, dz) => {
    const h = y1 - y0, n = node(name, { t: [0, (y0 + y1) / 2, zf], anim: { path: 'translation', to: [0, (y0 + y1) / 2, zf + dz], time: 1.4 } });
    n.parts.push(ko([0, 0, 0], [0.45, h, t]));
    n.parts.push(part(quad([0, 0, t / 2 + 0.0006], 0.45, h, uv), { tex: FRONT, rough: 0.65 }));
    n.parts.push(black(box([0, h / 2 - 0.016, t / 2 + 0.008], [0.06, 0.014, 0.022])));
    const WH = { color: '#ececea', rough: 0.5 }, bd = 0.33, bh = h - 0.03;
    n.parts.push(part(box([0, -h / 2 + 0.03, -t / 2 - bd / 2], [0.41, 0.008, bd]), WH));                 // dno
    for (const s of [-1, 1]) n.parts.push(part(box([s * 0.2, -0.0, -t / 2 - bd / 2], [0.008, bh, bd]), WH)); // stranice
    n.parts.push(part(box([0, 0, -t / 2 - bd], [0.41, bh, 0.008]), WH));                                  // zadnja
    return n;
  };
  root.kids.push(drawer('fioka_gore', 0.79, 0.94, frontUV(243, 148, 357, 187), 0.30));
  root.kids.push(drawer('fioka_dole', 0.64, 0.787, frontUV(243, 190, 357, 228), 0.30));
  return root;
}

// ============================================================
// TRPEZARIJSKI STO 80x80x76  (noge su "L" paneli, kao na fotografijama)
// ============================================================
function sto() {
  const root = node('sto'), TOP = 0.76, tt = 0.025;
  const top = { tex: 't_top.jpg', rough: 0.55 }, leg = { tex: 't_leg.jpg', rough: 0.6 };
  const p = root.parts;
  p.push(part(box([0, TOP - tt / 2, 0], [0.80, tt, 0.80], [0, 0, 1, 1]), top));
  const lh = TOP - tt, c = 0.38; // spoljna ivica nogu
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    p.push(part(box([sx * (c - 0.04), lh / 2, sz * (c - 0.0125)], [0.08, lh, 0.025], [0, 0, 1, 1]), leg));
    p.push(part(box([sx * (c - 0.0125), lh / 2, sz * (c - 0.04)], [0.025, lh, 0.08], [0, 0, 1, 1]), leg));
  }
  const ay = TOP - tt - 0.04;
  for (const s of [-1, 1]) {
    p.push(part(box([0, ay, s * 0.345], [0.62, 0.08, 0.02], [0, 0, 1, 1]), top));
    p.push(part(box([s * 0.345, ay, 0], [0.02, 0.08, 0.62], [0, 0, 1, 1]), top));
  }
  return root;
}

// ============================================================
// KREVET NUBIA 160  (okvir + tapacirano uzglavlje + podnica + dušek)
// ============================================================
function nubia() {
  const root = node('krevet'), p = root.parts;
  const frame = { tex: 'b_frame.jpg', rough: 0.55 }, fabric = { tex: 'b_fabric.jpg', rough: 0.95 };
  const LEG = 0.14, RH = 0.26, rt = 0.022, FW = 1.66, FL = 2.06, yr = LEG + RH / 2;
  const F = (c, s) => part(box(c, s, [0, 0, 1, 1]), frame);
  p.push(F([0, yr, FL / 2 - rt / 2], [FW, RH, rt]));                       // nožna daska
  p.push(F([0, yr - 0.06, -FL / 2 + rt / 2], [FW, RH - 0.12, rt]));         // zaglavna (niža)
  for (const s of [-1, 1]) p.push(F([s * (FW / 2 - rt / 2), yr, 0], [rt, RH, FL]));  // bočne
  for (const x of [-0.76, 0.76]) for (const z of [-0.92, 0.95])              // noge
    p.push(part(box([x, LEG / 2, z], [0.055, LEG, 0.055]), { color: '#1b1b1b', rough: 0.45 }));
  for (let i = 0; i < 7; i++)                                                  // letve podnice
    p.push(part(box([0, LEG + 0.07, -0.9 + i * 0.3], [FW - 2 * rt, 0.02, 0.07]), { color: '#d9bf94', rough: 0.7 }));
  const mt = 0.24, my = LEG + 0.09 + mt / 2;
  p.push(part(box([0, my, 0.0], [1.60, mt, 1.98]), { color: '#d9d9d6', rough: 0.95 }));       // dušek
  p.push(part(box([0, my + mt / 2 + 0.004, 0.0], [1.575, 0.012, 1.955]), { color: '#e2e2df', rough: 0.95 }));
  p.push(part(box([0, 0.62, -FL / 2 - 0.045], [1.72, 0.80, 0.06], [0, 0, 1, 1]), fabric));    // uzglavlje
  for (const x of [-0.6, 0.6]) p.push(part(box([x, 0.30, -FL / 2 - 0.01], [0.06, 0.2, 0.025]), { color: '#1b1b1b' }));
  return root;
}

// ---------- dodatna geometrija: cilindar ----------
function cylinder([cx, cy, cz], r, h, seg = 40) {
  const pos = [], nor = [], idx = [], y0 = cy - h / 2, y1 = cy + h / 2;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.push(cx + c * r, y0, cz + s * r, cx + c * r, y1, cz + s * r); nor.push(c, 0, s, c, 0, s);
  }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  [[y1, 1], [y0, -1]].forEach(([y, ny]) => {
    const base = pos.length / 3;
    pos.push(cx, y, cz); nor.push(0, ny, 0);
    for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; pos.push(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r); nor.push(0, ny, 0); }
    for (let i = 0; i < seg; i++) ny > 0 ? idx.push(base, base + i + 2, base + i + 1) : idx.push(base, base + i + 1, base + i + 2);
  });
  return { pos, nor, idx };
}

const WOODT = { tex: 't_top.jpg', rough: 0.6 };
const OAKT = { tex: 'k_oak.jpg', rough: 0.65 };
const wood = (c, s, o = OAKT) => part(box(c, s, [0, 0, 1, 1]), o);
const dark = (c, s) => part(box(c, s), { color: '#1b1b1b', rough: 0.4, metal: 0.3 });
const BLACK = { color: '#1b1b1b', rough: 0.4, metal: 0.3 };

// ---------- pomoćno: rotirane grede i cevi ----------
const qx = a => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];

// pomera/rotira geometriju koja je modelovana duž +Y ose tako da spaja tačke p0 i p1
function alongY(g, p0, p1) {
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(...d), u = d.map(v => v / L);
  const ax = [u[2], 0, -u[0]], s = Math.hypot(ax[0], ax[2]), c = u[1];
  let R;
  if (s < 1e-6) R = c > 0 ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : [[1, 0, 0], [0, -1, 0], [0, 0, -1]];
  else {
    const k = [ax[0] / s, 0, ax[2] / s], K = [[0, -k[2], 0], [k[2], 0, -k[0]], [0, k[0], 0]];
    R = [0, 1, 2].map(i => [0, 1, 2].map(j => (i === j ? 1 : 0) + s * K[i][j] + (1 - c) * K[i].reduce((t, _, m) => t + K[i][m] * K[m][j], 0)));
  }
  const rot = v => [0, 1, 2].map(i => R[i][0] * v[0] + R[i][1] * v[1] + R[i][2] * v[2]);
  const mid = p0.map((v, i) => (v + p1[i]) / 2), pos = [], nor = [];
  for (let i = 0; i < g.pos.length; i += 3) { const r = rot(g.pos.slice(i, i + 3)); pos.push(r[0] + mid[0], r[1] + mid[1], r[2] + mid[2]); }
  for (let i = 0; i < g.nor.length; i += 3) nor.push(...rot(g.nor.slice(i, i + 3)));
  return { ...g, pos, nor };
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const beam = (p0, p1, w, d, o) => part(alongY(box([0, 0, 0], [w, dist(p0, p1), d]), p0, p1), o);
const tube = (p0, p1, r, o) => part(alongY(cylinder([0, 0, 0], r, dist(p0, p1), 12), p0, p1), o);

// cilindar sa planarnim UV na gornjoj/donjoj strani (za teksturu ploče)
function disc([cx, cy, cz], r, h, seg = 48) {
  const g = cylinder([cx, cy, cz], r, h, seg);
  g.uv = [];
  const nSide = (seg + 1) * 2;
  for (let i = 0; i < g.pos.length / 3; i++) {
    if (i < nSide) g.uv.push(0.5, 0.5);
    else g.uv.push(0.5 + (g.pos[i * 3] - cx) / (2 * r), 0.5 + (g.pos[i * 3 + 2] - cz) / (2 * r));
  }
  return g;
}

const WHITE_METAL = { color: '#efeae6', rough: 0.55, metal: 0.2 };
const DARK_METAL = { color: '#2a2a2a', rough: 0.4, metal: 0.5 };
const CHROME = { color: '#b9c3c7', rough: 0.3, metal: 0.8 };

// ============================================================
// TRPEZARIJSKI STO MOHITO fi100  (100 x 100 x 76 cm) – forma i boje prema fotografijama
// ============================================================
function mohito() {
  const root = node('mohito'), p = root.parts, TOP = 0.76, tt = 0.025;
  p.push(part(disc([0, TOP - tt / 2, 0], 0.5, tt), { tex: 'm_top.jpg', rough: 0.55 }));
  const leg = t => [(0.3 + 0.14 * t) , 0.735 * (1 - t)];
  for (let i = 0; i < 3; i++) {
    const a = deg(90 + i * 120), cs = Math.cos(a), sn = Math.sin(a);
    const at = t => { const [r, y] = leg(t); return [cs * r, y, sn * r]; };
    p.push(beam(at(0), at(1), 0.04, 0.025, WHITE_METAL));
    p.push(beam([cs * 0.04, 0.66, sn * 0.04], at(0.55), 0.025, 0.02, WHITE_METAL));   // prečka ka centru
  }
  p.push(part(cylinder([0, 0.715, 0], 0.05, 0.04, 16), WHITE_METAL));                      // središnje čvorište
  return root;
}

// ============================================================
// TRPEZARIJSKA STOLICA SIMPLE  (44 x 51 x 100 cm) – konzolna, sa prošivenim naslonom
// ============================================================
function simple() {
  const root = node('simple'), p = root.parts, SY = 0.455;
  const seat = { tex: 'c_seat.jpg', rough: 0.95 }, back = { tex: 'c_back.jpg', rough: 0.95 };
  p.push(part(box([0, SY, 0.0], [0.44, 0.07, 0.46], [0, 0, 1, 1]), seat));
  const nasl = node('naslon', { t: [0, 0.49, -0.22], r: qx(deg(-7)) });
  nasl.parts.push(part(box([0, 0.26, 0], [0.40, 0.52, 0.045], [0, 0, 1, 1]), back));
  root.kids.push(nasl);
  const r = 0.0085, x = 0.17;
  for (const s of [-1, 1]) {
    const A = [s * x, 0.42, 0.19], B = [s * x, 0.02, 0.2], C = [s * x, 0.02, -0.22], D = [s * x, 0.41, -0.2];
    p.push(tube(A, B, r, DARK_METAL), tube(B, C, r, DARK_METAL), tube(C, D, r, DARK_METAL));
    p.push(tube([s * x, 0.42, -0.2], A, r, DARK_METAL));                                  // nosač ispod sedišta
  }
  p.push(tube([-x, 0.02, 0.2], [x, 0.02, 0.2], r, DARK_METAL));
  return root;
}

// ============================================================
// TROSED LOALTI  (213 x 77 x 90 cm) – naslon se spušta pa postaje ležaj
// ============================================================
function loalti() {
  const root = node('loalti'), p = root.parts;
  const BASE = { tex: 's_base.jpg', rough: 0.95 }, SEAT = { tex: 's_seat.jpg', rough: 0.95 };
  const ARM = { tex: 's_arm.jpg', rough: 0.95 }, BACK = { tex: 's_back.jpg', rough: 0.95 }, PIL = { tex: 's_pillow.jpg', rough: 0.95 };
  const U = [0, 0, 1, 1];
  p.push(part(box([0, 0.22, 0], [1.69, 0.16, 0.74], U), BASE));                       // postolje (sanduk)
  for (const s of [-1, 1]) {
    p.push(part(box([s * 0.955, 0.375, 0], [0.22, 0.47, 0.77], U), ARM));              // rukohvati
    p.push(part(box([s * 0.42, 0.375, 0.09], [0.835, 0.15, 0.56], U), SEAT));          // jastuci sedišta
    for (const z of [-0.3, 0.3]) {                                                       // metalne noge
      const t0 = [s * 0.955, 0.14, z], t1 = [s * 0.975, 0.0, z * 1.05];
      p.push(beam(t0, t1, 0.05, 0.03, CHROME));
    }
  }
  const nasl = node('naslon', { t: [0, 0.37, -0.28], r: qx(deg(-10)), anim: { path: 'rotation', to: qx(deg(-92)), time: 1.6 } });
  nasl.parts.push(part(box([0, 0.275, 0], [1.69, 0.55, 0.16], U), BACK));
  root.kids.push(nasl);
  for (const s of [-1, 1]) {
    const j = node(s < 0 ? 'jastuk_levo' : 'jastuk_desno', { t: [s * 0.65, 0.62, -0.1], r: qx(deg(-22)), anim: { path: 'translation', to: [s * 0.5, 0.56, -0.75], time: 1.6 } });
    j.parts.push(part(box([0, 0, 0], [0.4, 0.4, 0.12], U), PIL));
    root.kids.push(j);
  }
  return root;
}

// ============================================================
// NOĆNI ORMARIĆ SA 2 FIOKE (45 x 40 x 52 cm)
// ============================================================
function nocni() {
  const root = node('nocni_ormaric'), t = 0.018, W = 0.45, H = 0.52, D = 0.40, FT = 0.1, zf = D / 2 - t / 2;
  const body = node('korpus'); root.kids.push(body);
  body.parts.push(wood([0, H - t / 2, 0], [W, t, D]));
  body.parts.push(wood([0, FT + t / 2, -0.01], [W - 2 * t, t, D - 0.02]));
  for (const s of [-1, 1]) body.parts.push(wood([s * (W / 2 - t / 2), (H + FT) / 2, -0.01], [t, H - FT, D - 0.02]));
  body.parts.push(wood([0, (H + FT) / 2, -D / 2 + 0.004], [W - 2 * t, H - FT - 2 * t, 0.008]));
  for (const x of [-0.18, 0.18]) for (const z of [-0.14, 0.14]) body.parts.push(dark([x, FT / 2, z], [0.04, FT, 0.04]));
  const drawer = (name, y0, y1) => {
    const h = y1 - y0, yc = (y0 + y1) / 2, n = node(name, { t: [0, yc, zf], anim: { path: 'translation', to: [0, yc, zf + 0.25], time: 1.2 } });
    n.parts.push(wood([0, 0, 0], [W - 2 * t - 0.004, h, t]));
    n.parts.push(dark([0, h / 2 - 0.03, t / 2 + 0.008], [0.1, 0.012, 0.02]));
    const WH = { color: '#ececea', rough: 0.5 }, bd = 0.3;
    n.parts.push(part(box([0, -h / 2 + 0.03, -t / 2 - bd / 2], [W - 0.07, 0.008, bd]), WH));
    for (const s of [-1, 1]) n.parts.push(part(box([s * (W / 2 - 0.04), 0, -t / 2 - bd / 2], [0.008, h - 0.04, bd]), WH));
    n.parts.push(part(box([0, 0, -t / 2 - bd], [W - 0.07, h - 0.04, 0.008]), WH));
    return n;
  };
  const mid = FT + t + (H - FT - 2 * t) / 2;
  root.kids.push(drawer('fioka_gore', mid + 0.004, H - t - 0.004));
  root.kids.push(drawer('fioka_dole', FT + t + 0.004, mid - 0.004));
  return root;
}

// ============================================================
// REGAL SA 6 POLICA (80 x 30 x 180 cm)
// ============================================================
function regal() {
  const root = node('regal'), p = root.parts, W = 0.8, H = 1.8, D = 0.3, t = 0.022;
  for (const s of [-1, 1]) p.push(wood([s * (W / 2 - t / 2), H / 2, 0], [t, H, D]));
  for (let i = 0; i < 6; i++) p.push(wood([0, 0.04 + i * (H - 0.06) / 5, 0], [W - 2 * t, t, D - 0.01]));
  p.push(wood([0, H / 2, -D / 2 + 0.004], [W - 2 * t, H - 0.08, 0.008]));
  return root;
}

// ============================================================
// TV KOMODA (160 x 40 x 50 cm) – bočna vrata se otvaraju
// ============================================================
function tvkomoda() {
  const root = node('tv_komoda'), t = 0.018, W = 1.6, H = 0.5, D = 0.4, FT = 0.1, zf = D / 2 - t / 2;
  const body = node('korpus'); root.kids.push(body);
  body.parts.push(wood([0, H - t / 2, 0], [W, t, D]));
  body.parts.push(wood([0, FT + t / 2, -0.01], [W - 2 * t, t, D - 0.02]));
  for (const x of [-W / 2 + t / 2, -0.27, 0.27, W / 2 - t / 2]) body.parts.push(wood([x, (H + FT) / 2, -0.01], [t, H - FT, D - 0.02]));
  body.parts.push(wood([0, (H + FT) / 2, -D / 2 + 0.004], [W - 2 * t, H - FT - 2 * t, 0.008]));
  body.parts.push(wood([0, 0.3, -0.01], [0.54 - t, 0.016, D - 0.03]));
  for (const x of [-0.7, 0.7]) for (const z of [-0.14, 0.14]) body.parts.push(dark([x, FT / 2, z], [0.04, FT, 0.04]));
  const dh = H - FT - 2 * t - 0.004, dyc = FT + t + 0.002 + dh / 2;
  const door = (name, hingeX, w, side, open) => {
    const n = node(name, { t: [hingeX, dyc, zf], r: qy(0), anim: { path: 'rotation', to: qy(deg(open)), time: 1.2 } });
    n.parts.push(wood([side * w / 2, 0, 0], [w, dh, t]));
    n.parts.push(dark([side * (w - 0.04), 0, t / 2 + 0.008], [0.012, 0.12, 0.02]));
    return n;
  };
  root.kids.push(door('vrata_levo', -W / 2 + t, 0.5, 1, -100));
  root.kids.push(door('vrata_desno', W / 2 - t, 0.5, -1, 100));
  return root;
}

const outputs = { duero, sto_forma: sto, nubia, mohito, simple, loalti, nocni_ormaric: nocni, regal, tv_komoda: tvkomoda };
const animated = new Set(['duero', 'nocni_ormaric', 'tv_komoda', 'loalti']);
fs.mkdirSync(OUT, { recursive: true });
for (const [name, fn] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(OUT, name + '.glb'), buildGLB(fn()));
  console.log('OK', name);
  // bez animacije za AR (Scene Viewer / Quick Look je puštaju u petlji)
  if (animated.has(name)) fs.writeFileSync(path.join(OUT, name + '_ar.glb'), buildGLB(fn(), false));
}
