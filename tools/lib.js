// Zajednička biblioteka za generisanje GLB modela (geometrija + GLB writer).
// Koriste je tools/make-forma.js i tools/products/*.js
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

// ---------- zaobljena kutija (jastuci, ivice nameštaja) ----------
// r = radijus zaobljenja, seg = broj segmenata po uglu; uv = [u0,v0,u1,v1] isečak teksture (planarna projekcija po licu)
function rbox([cx, cy, cz], [sx, sy, sz], r, seg = 4, uv) {
  r = Math.min(r, sx / 2 - 1e-4, sy / 2 - 1e-4, sz / 2 - 1e-4);
  const hx = sx / 2, hy = sy / 2, hz = sz / 2, N = Math.max(2, seg * 2);
  const pos = [], nor = [], idx = [], uvs = uv ? [] : null;
  const faces = [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]]; // [osa u, osa v, osa n, znak]
  const half = [hx, hy, hz];
  for (const [au, av, an, sg] of faces) {
    const base = pos.length / 3;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      // gusće tačke blizu ivica da zaobljenje bude glatko
      const f = t => { const s = t / N * 2 - 1; return Math.sign(s) * (1 - Math.pow(1 - Math.abs(s), 1.6)) ; };
      const p = [0, 0, 0]; p[au] = i / N * 2 - 1; p[av] = j / N * 2 - 1; p[an] = sg;
      const q = [p[0] * hx, p[1] * hy, p[2] * hz];
      const inner = q.map((v, k) => Math.max(-half[k] + r, Math.min(half[k] - r, v)));
      let d = q.map((v, k) => v - inner[k]); const l = Math.hypot(...d) || 1; d = d.map(v => v / l);
      pos.push(cx + inner[0] + d[0] * r, cy + inner[1] + d[1] * r, cz + inner[2] + d[2] * r); nor.push(...d);
      if (uv) { uvs.push(uv[0] + (uv[2] - uv[0]) * (p[au] + 1) / 2, uv[3] - (uv[3] - uv[1]) * (p[av] + 1) / 2); }
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = base + j * (N + 1) + i, b = a + 1, c = a + N + 1, d2 = c + 1;
      // usmeri trouglove prema spoljašnjoj normali
      const flip = ((au + 1) % 3 === av) ? sg < 0 : sg > 0;
      if (flip) idx.push(a, c, b, b, c, d2); else idx.push(a, b, c, b, d2, c);
    }
  }
  return { pos, nor, idx, uv: uvs };
}

module.exports = { fs, path, IMG, OUT, hex, qy, qx, deg, box, rbox, quad, part, node, buildGLB, cylinder, disc, alongY, dist, beam, tube };
