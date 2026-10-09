// Gradi sve detaljne modele iz tools/products/*.js  ->  models/<id>.glb (+ <id>_ar.glb ako je animiran)
// Pokretanje: node tools/build-all.js [id ...]
const { fs, path, OUT, buildGLB } = require('./lib');
const dir = path.join(__dirname, 'products');
const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const m = require(path.join(dir, f));
  if (only.length && !only.includes(m.id)) continue;
  fs.writeFileSync(path.join(OUT, m.id + '.glb'), buildGLB(m.build()));
  if (m.animated) fs.writeFileSync(path.join(OUT, m.id + '_ar.glb'), buildGLB(m.build(), false));
  console.log('OK', m.id, m.animated ? '(animiran)' : '');
}
