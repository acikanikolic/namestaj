// Lokalni server za testiranje: node tools/serve.js  ->  http://localhost:8765
const h = require('http'), f = require('fs'), p = require('path');
const T = { '.html': 'text/html; charset=utf-8', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg' };
const root = p.join(__dirname, '..');
h.createServer((q, r) => {
  let u = decodeURI(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  try { const b = f.readFileSync(p.join(root, u)); r.writeHead(200, { 'Content-Type': T[p.extname(u)] || 'application/octet-stream' }); r.end(b); }
  catch { r.writeHead(404); r.end(); }
}).listen(8765, () => console.log('http://localhost:8765'));
