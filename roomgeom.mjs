// Geometrija prostorije: poligon od ćoškova [x, z] u metrima (bez DOM-a, može da se testira u Node-u).
// Zid i ide od ćoška i do ćoška i+1.

export const MIN_WALL = 0.3;     // najkraći zid (m)
export const MIN_AREA = 1;       // najmanja površina (m²)
export const SNAP = 0.05;        // korak magneta (m)

export const snap = v => +(Math.round(v / SNAP) * SNAP).toFixed(3);
export const rect = (w, d) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];

// gotovi oblici (koordinate u metrima, centriraju se po težištu)
export const PRESETS = [
  { name: 'Pravougaonik', pts: rect(5, 4) },
  { name: 'Kvadrat', pts: rect(4, 4) },
  { name: 'L oblik', pts: [[0, 0], [5, 0], [5, 2.5], [2.5, 2.5], [2.5, 5], [0, 5]] },
  { name: 'U oblik', pts: [[0, 0], [6, 0], [6, 4], [4, 4], [4, 1.5], [2, 1.5], [2, 4], [0, 4]] },
  { name: 'T oblik', pts: [[0, 0], [6, 0], [6, 2], [4, 2], [4, 5], [2, 5], [2, 2], [0, 2]] },
  { name: 'Skošen ćošak', pts: [[0, 0], [5, 0], [5, 2.5], [3.5, 4], [0, 4]] },
  { name: 'Hodnik', pts: rect(1.6, 6) },
];

export function area(p) {            // površina (m²), uvek pozitivna
  let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}
const signedArea = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };

export function centroid(p) {
  let x = 0, z = 0, A = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], c = a[0] * b[1] - b[0] * a[1]; A += c; x += (a[0] + b[0]) * c; z += (a[1] + b[1]) * c; }
  return A ? [x / (3 * A), z / (3 * A)] : [p[0][0], p[0][1]];
}
export const centered = p => { const [cx, cz] = centroid(p); return p.map(([x, z]) => [snap(x - cx), snap(z - cz)]); };

export function bbox(p) {
  const xs = p.map(v => v[0]), zs = p.map(v => v[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}
export const wallLen = (p, i) => Math.hypot(p[(i + 1) % p.length][0] - p[i][0], p[(i + 1) % p.length][1] - p[i][1]);
export const perimeter = p => p.reduce((s, _, i) => s + wallLen(p, i), 0);

// unutrašnja normala zida i (jedinični vektor ka unutrašnjosti prostorije)
export function inwardNormal(p, i) {
  const a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, ccw = signedArea(p) > 0;
  // u koordinatama (x, z) sa z naniže: za pozitivnu površinu je unutrašnjost desno od smera ivice
  return ccw ? [-dz, dx] : [dz, -dx];
}

export function pointInPoly([x, z], p) {      // ray casting
  let in_ = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) in_ = !in_;
  }
  return in_;
}

const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const onSeg = (a, b, c) => Math.min(a[0], b[0]) - 1e-9 <= c[0] && c[0] <= Math.max(a[0], b[0]) + 1e-9 && Math.min(a[1], b[1]) - 1e-9 <= c[1] && c[1] <= Math.max(a[1], b[1]) + 1e-9;
function segsTouch(a, b, c, d) {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b), e = 1e-9;
  if (((o1 > e && o2 < -e) || (o1 < -e && o2 > e)) && ((o3 > e && o4 < -e) || (o3 < -e && o4 > e))) return true;
  return (Math.abs(o1) <= e && onSeg(a, b, c)) || (Math.abs(o2) <= e && onSeg(a, b, d)) || (Math.abs(o3) <= e && onSeg(c, d, a)) || (Math.abs(o4) <= e && onSeg(c, d, b));
}

// proverava da je oblik ispravan; vraća { ok, msg }
export function validate(p) {
  const n = p.length;
  if (n < 3) return { ok: false, msg: 'Prostorija mora imati bar 3 ćoška.' };
  if (p.some(v => !isFinite(v[0]) || !isFinite(v[1]) || Math.abs(v[0]) > 50 || Math.abs(v[1]) > 50)) return { ok: false, msg: 'Mere nisu u dozvoljenom opsegu.' };
  for (let i = 0; i < n; i++) if (wallLen(p, i) < MIN_WALL - 1e-9) return { ok: false, msg: `Zid ${i + 1} je prekratak (najmanje ${Math.round(MIN_WALL * 100)} cm).` };
  for (let i = 0; i < n; i++) {                                 // zidovi ne smeju da se seku ni dodiruju
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) {            // susedni zidovi: samo ne smeju da se vrate preko sebe
        const k = j === i + 1 ? i : j, m = (k + 1) % n, o = (m + 1) % n;
        const cr = orient(p[k], p[m], p[o]), dt = (p[m][0] - p[k][0]) * (p[o][0] - p[m][0]) + (p[m][1] - p[k][1]) * (p[o][1] - p[m][1]);
        if (Math.abs(cr) < 1e-9 && dt < 0) return { ok: false, msg: 'Zidovi se vraćaju jedan preko drugog.' };
        continue;
      }
      if (segsTouch(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n])) return { ok: false, msg: 'Zidovi se ukrštaju. Pomerite ćošak.' };
    }
  }
  if (area(p) < MIN_AREA) return { ok: false, msg: 'Prostorija je premala (najmanje 1 m²).' };
  return { ok: true, msg: '' };
}

// promena dužine zida i: sledeći zid (i+1) se pomera paralelno duž zida i; vraća novi poligon ili null
export function setWallLength(p, i, len) {
  const n = p.length, a = p[i], b = p[(i + 1) % n], L = wallLen(p, i);
  if (!isFinite(len) || L === 0) return null;
  const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, d = len - L;
  const q = p.map(v => v.slice()), j = (i + 1) % n, k = (i + 2) % n;
  q[j][0] += dx * d; q[j][1] += dz * d; q[k][0] += dx * d; q[k][1] += dz * d;
  return q;
}

export function insertCorner(p, i) {            // novi ćošak na sredini zida i
  const a = p[i], b = p[(i + 1) % p.length], q = p.map(v => v.slice());
  q.splice(i + 1, 0, [snap((a[0] + b[0]) / 2), snap((a[1] + b[1]) / 2)]);
  return q;
}
export function removeCorner(p, i) {            // uklanja ćošak i (ostaje bar 3)
  if (p.length <= 3) return null;
  const q = p.map(v => v.slice()); q.splice(i, 1); return q;
}
