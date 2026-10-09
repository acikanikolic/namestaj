// Preuzima podatke i fotografije artikala sa formaideale.rs (stranice artikala su renderovane na serveru).
// Pokretanje: node tools/scrape.js slug1 slug2 ...   ->  _src2/<slug>/N.jpg  +  tools/scraped.json
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, '_src2'), JSON_F = path.join(__dirname, 'scraped.json');
const UA = { 'User-Agent': 'Mozilla/5.0' };
const all = fs.existsSync(JSON_F) ? JSON.parse(fs.readFileSync(JSON_F, 'utf8')) : {};

(async () => {
  for (const slug of process.argv.slice(2)) {
    const html = await (await fetch('https://formaideale.rs/artikal/' + slug, { headers: UA })).text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
    const si = text.indexOf('Šifra artikla:'), sku = text[si + 1];
    const di = text.findIndex((l, i) => i > si && /^Š [\d.]+ cm × D [\d.]+ cm × V [\d.]+ cm$/.test(l));
    const dims = text[di].match(/[\d.]+/g).map(Number);
    const variant = text[di + 1];
    const pm = text.slice(di + 1, di + 40).join(' ').match(/(\d{1,3}(?:\.\d{3})*) RSD/), price = pm && pm[1];
    const oi = text.indexOf('Opis proizvoda'), desc = text.slice(oi, oi + 8).find(l => l.length > 60) || '';
    const title = (html.match(/<title>([^<]*)/) || [])[1].split(' | ')[0];
    const imgs = [...new Set([...html.matchAll(new RegExp('products/' + sku + '/images/(\\d+)', 'g'))].map(m => +m[1]))].sort((a, b) => a - b);
    fs.mkdirSync(path.join(OUT, slug), { recursive: true });
    const saved = [];
    for (const n of imgs.slice(0, 8)) {
      const r = await fetch(`https://cdn.formaideale.rs/insecure/f:jpg/q:90/rt:fit/w:1000/plain/s3://forma-ideale-assets/products/${sku}/images/${n}.jpg`, { headers: UA });
      if (!r.ok) continue;
      fs.writeFileSync(path.join(OUT, slug, n + '.jpg'), Buffer.from(await r.arrayBuffer())); saved.push(n);
    }
    all[slug] = { sku, title, widthCm: dims[0], depthCm: dims[1], heightCm: dims[2], variant, price: price ? price + ' RSD' : null, desc, images: saved, url: 'https://formaideale.rs/artikal/' + slug };
    console.log(slug, '->', JSON.stringify(all[slug]).slice(0, 260));
  }
  fs.writeFileSync(JSON_F, JSON.stringify(all, null, 1));
})();
