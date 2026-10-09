// Proverava gabarite modela (u cm) i poredi ih sa očekivanim.
// Pokretanje: node tools/check-dims.js            (svi modeli iz tools/products/*.js)
//             node tools/check-dims.js <id> ...   (samo navedeni)
// Modul proizvoda treba da izvozi: { id, build(), dims: [širina, dubina, visina] u cm }  (X = širina, Z = dubina, Y = visina)
const { fs, path } = require('./lib');
const dir = path.join(__dirname, 'products');
const only = process.argv.slice(2);

const rotQ = (q, v) => { // v' = q * v * q^-1
  const [x, y, z, w] = q, [vx, vy, vz] = v;
  const tx = 2 * (y * vz - z * vy), ty = 2 * (z * vx - x * vz), tz = 2 * (x * vy - y * vx);
  return [vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx)];
};
function bounds(n, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], xf = v => v) {
  const here = v => { const r = n.r ? rotQ(n.r, v) : v; const t = n.t || [0, 0, 0]; return xf([r[0] + t[0], r[1] + t[1], r[2] + t[2]]); };
  for (const p of n.parts) for (let i = 0; i < p.geo.pos.length; i += 3) {
    const w = here(p.geo.pos.slice(i, i + 3));
    for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[k]); mx[k] = Math.max(mx[k], w[k]); }
  }
  for (const k of n.kids) bounds(k, mn, mx, here);
  return [mn, mx];
}

let bad = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.startsWith('_'))) {
  const m = require(path.join(dir, f));
  if (only.length && !only.includes(m.id)) continue;
  const [mn, mx] = bounds(m.build());
  const got = [mx[0] - mn[0], mx[2] - mn[2], mx[1] - mn[1]].map(v => v * 100);   // Š, D, V u cm
  const exp = m.dims, err = exp ? got.map((v, i) => v - exp[i]) : [];
  const ok = exp && err.every(e => Math.abs(e) <= 1.5);
  if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'LOŠE'} ${m.id}: Š×D×V = ${got.map(v => v.toFixed(1)).join(' × ')} cm` + (exp ? `   (očekivano ${exp.join(' × ')}, razlika ${err.map(e => e.toFixed(1)).join(' / ')})` : '') +
    `   y_min=${(mn[1] * 100).toFixed(1)} cm, centar X/Z = ${((mn[0] + mx[0]) * 50).toFixed(1)}/${((mn[2] + mx[2]) * 50).toFixed(1)}`);
}
process.exitCode = bad ? 1 : 0;
