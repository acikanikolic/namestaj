// Generiše jednostavne GLB 3D modele nameštaja (bez zavisnosti). Pokretanje: node tools/make-models.js
const fs = require('fs');
const path = require('path');

const hex = h => [1, 3, 5].map(i => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2)).concat(1);

// ---- geometrija ----
function box([cx, cy, cz], [sx, sy, sz]) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const faces = [
    [[1, 0, 0], [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]]],
    [[-1, 0, 0], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]]],
    [[0, 1, 0], [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]]],
    [[0, -1, 0], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]]],
    [[0, 0, 1], [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]]],
    [[0, 0, -1], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]]],
  ];
  const pos = [], nor = [], idx = [];
  faces.forEach(([n, vs], f) => {
    vs.forEach(v => { pos.push(v[0] + cx, v[1] + cy, v[2] + cz); nor.push(...n); });
    const b = f * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  return { pos, nor, idx };
}

function cylinder([cx, cy, cz], r, h, seg = 48) {
  const pos = [], nor = [], idx = [];
  const y0 = cy - h / 2, y1 = cy + h / 2;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.push(cx + c * r, y0, cz + s * r, cx + c * r, y1, cz + s * r);
    nor.push(c, 0, s, c, 0, s);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  [[y1, 1], [y0, -1]].forEach(([y, ny]) => {
    const base = pos.length / 3;
    pos.push(cx, y, cz); nor.push(0, ny, 0);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r); nor.push(0, ny, 0);
    }
    for (let i = 0; i < seg; i++) ny > 0 ? idx.push(base, base + i + 2, base + i + 1) : idx.push(base, base + i + 1, base + i + 2);
  });
  return { pos, nor, idx };
}

// pravougaonik okrenut ka +Z, sa UV koordinatama (u0,v0)-(u1,v1) iz slike
function quad([cx, cy, cz], w, h, [u0, v0, u1, v1]) {
  const x = w / 2, y = h / 2;
  return {
    pos: [cx - x, cy - y, cz, cx + x, cy - y, cz, cx + x, cy + y, cz, cx - x, cy + y, cz],
    nor: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    uv: [u0, v1, u1, v1, u1, v0, u0, v0],
    idx: [0, 1, 2, 0, 2, 3],
  };
}

// ---- GLB writer ----
function buildGLB(parts) {
  const materials = [], matIndex = {}, images = [], textures = [], texIndex = {};
  const bufs = [], accessors = [], views = [], prims = [];
  let offset = 0;
  const push = (arr, Type, target) => {
    const data = Buffer.from(new Type(arr).buffer);
    const pad = (4 - (data.length % 4)) % 4;
    bufs.push(data, Buffer.alloc(pad));
    views.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target });
    offset += data.length + pad;
    return views.length - 1;
  };
  for (const p of parts) {
    const key = (p.tex ? 'T' + p.tex : p.color) + (p.rough ?? 0.6) + (p.metal ?? 0);
    if (!(key in matIndex)) {
      matIndex[key] = materials.length;
      const pbr = { baseColorFactor: p.tex ? [1, 1, 1, 1] : hex(p.color), metallicFactor: p.metal ?? 0, roughnessFactor: p.rough ?? 0.6 };
      if (p.tex) {
        if (!(p.tex in texIndex)) {
          const data = fs.readFileSync(path.join(__dirname, '..', 'images', p.tex));
          const pad = (4 - (data.length % 4)) % 4;
          bufs.push(data, Buffer.alloc(pad));
          views.push({ buffer: 0, byteOffset: offset, byteLength: data.length });
          images.push({ bufferView: views.length - 1, mimeType: 'image/jpeg' });
          textures.push({ source: images.length - 1 });
          texIndex[p.tex] = textures.length - 1;
          offset += data.length + pad;
        }
        pbr.baseColorTexture = { index: texIndex[p.tex] };
      }
      materials.push({ pbrMetallicRoughness: pbr });
    }
    const g = p.geo;
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < g.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], g.pos[i + k]); mx[k] = Math.max(mx[k], g.pos[i + k]); }
    const vp = push(g.pos, Float32Array, 34962), vn = push(g.nor, Float32Array, 34962), vi = push(g.idx, Uint16Array, 34963);
    accessors.push({ bufferView: vp, componentType: 5126, count: g.pos.length / 3, type: 'VEC3', min: mn, max: mx });
    accessors.push({ bufferView: vn, componentType: 5126, count: g.nor.length / 3, type: 'VEC3' });
    accessors.push({ bufferView: vi, componentType: 5123, count: g.idx.length, type: 'SCALAR' });
    const a = accessors.length - 3;
    const attrs = { POSITION: a, NORMAL: a + 1 };
    if (g.uv) {
      const vt = push(g.uv, Float32Array, 34962);
      accessors.push({ bufferView: vt, componentType: 5126, count: g.uv.length / 2, type: 'VEC2' });
      attrs.TEXCOORD_0 = accessors.length - 1;
    }
    prims.push({ attributes: attrs, indices: a + 2, material: matIndex[key] });
  }
  const bin = Buffer.concat(bufs);
  const json = {
    asset: { version: '2.0', generator: 'make-models.js' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: prims }], materials, accessors, bufferViews: views, ...(images.length ? { images, textures } : {}),
    buffers: [{ byteLength: bin.length }],
  };
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const total = 12 + 8 + js.length + 8 + bin.length;
  const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  const h1 = Buffer.alloc(8); h1.writeUInt32LE(js.length, 0); h1.write('JSON', 4);
  const h2 = Buffer.alloc(8); h2.writeUInt32LE(bin.length, 0); h2.write('BIN\0', 4);
  return Buffer.concat([head, h1, js, h2, bin]);
}

const Q = (c, w, h, uv, tex, o = {}) => ({ geo: quad(c, w, h, uv), tex, color: '#ffffff', ...o });
const B = (c, s, color, o = {}) => ({ geo: box(c, s), color, ...o });
const C = (c, r, h, color, o = {}) => ({ geo: cylinder(c, r, h), color, ...o });

// ---- proizvodi (dimenzije u metrima, Y gore) ----
const WOOD = '#b98b5e', DARK = '#3b2a20', LEG = '#2b2b2b';

const models = {
  stolica() {
    const p = [];
    p.push(B([0, 0.45, 0], [0.45, 0.05, 0.45], WOOD));                     // sediste
    p.push(B([0, 0.72, -0.2], [0.45, 0.5, 0.04], WOOD));                   // naslon
    for (const x of [-0.19, 0.19]) for (const z of [-0.19, 0.19])
      p.push(B([x, 0.21, z], [0.04, 0.42, 0.04], DARK));                   // noge
    p.push(B([0, 0.96, -0.2], [0.45, 0.04, 0.05], DARK));
    return p;
  },
  sto() {
    const p = [];
    p.push(C([0, 0.74, 0], 0.55, 0.04, '#e9e2d6', { rough: 0.35 }));       // ploca
    p.push(C([0, 0.36, 0], 0.05, 0.72, '#222222', { metal: 0.8, rough: 0.35 })); // stub
    p.push(C([0, 0.015, 0], 0.32, 0.03, '#222222', { metal: 0.8, rough: 0.35 })); // baza
    return p;
  },
  sofa() {
    const p = [], FAB = '#5c7a8a';
    p.push(B([0, 0.2, 0], [2.0, 0.2, 0.9], '#2b2b2b'));                    // postolje
    p.push(B([0, 0.37, 0.05], [1.6, 0.16, 0.75], FAB, { rough: 0.95 }));   // sediste
    p.push(B([0, 0.62, -0.35], [1.6, 0.4, 0.2], FAB, { rough: 0.95 }));    // naslon
    p.push(B([-0.9, 0.5, 0], [0.2, 0.5, 0.9], FAB, { rough: 0.95 }));      // rukohvat L
    p.push(B([0.9, 0.5, 0], [0.2, 0.5, 0.9], FAB, { rough: 0.95 }));       // rukohvat D
    for (const x of [-0.9, 0.9]) for (const z of [-0.38, 0.38])
      p.push(B([x, 0.05, z], [0.06, 0.1, 0.06], '#1a1a1a'));
    return p;
  },
  komoda() {
    const p = [];
    p.push(B([0, 0.5, 0], [1.4, 0.55, 0.4], '#d8c3a5'));                   // korpus
    p.push(B([0, 0.79, 0], [1.46, 0.03, 0.44], WOOD));                     // ploca
    for (const x of [-0.46, 0, 0.46]) {
      p.push(B([x, 0.5, 0.205], [0.44, 0.48, 0.015], '#f1ebe0'));          // vrata
      p.push(B([x, 0.5, 0.225], [0.03, 0.12, 0.02], '#8a6a45', { metal: 0.6, rough: 0.4 })); // rucka
    }
    for (const x of [-0.6, 0.6]) for (const z of [-0.14, 0.14])
      p.push(B([x, 0.11, z], [0.04, 0.22, 0.04], DARK));
    return p;
  },
};

const out = path.join(__dirname, '..', 'models');
fs.mkdirSync(out, { recursive: true });
for (const [name, fn] of Object.entries(models)) {
  const file = path.join(out, name + '.glb');
  fs.writeFileSync(file, buildGLB(fn()));
  console.log('OK', file);
}
