// 產生網站：讀 Google Sheet「產品」分頁 → 檢查 → 組成 dist/（index.html、離線用的 sw.js、圖示）
// 用法：node tools/build.js            （從 Google Sheet 讀最新內容）
//       node tools/build.js --local    （用 tools/sheet_snapshot.json，離線測試用）
const fs = require('fs'), path = require('path'), vm = require('vm');
const { applySheet } = require('./sheetmerge.js');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src'), DIST = path.join(ROOT, 'dist');
const SHEET_ID = '1lChuWJlDJFW2ciXN_tDDDyyv19D7KHHI3-z9Gqc2hTY', PRODUCT_GID = 3;
const DOMAIN = 'guide.seerhuang.blog';

function parseCSV(t) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

async function sheetRows() {
  if (process.argv.includes('--local')) return JSON.parse(fs.readFileSync(path.join(__dirname, 'sheet_snapshot.json'), 'utf8'))['產品'];
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${PRODUCT_GID}`;
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  if (!res.ok || /^\s*<(!DOCTYPE|html)/i.test(text)) throw new Error('讀不到 Google Sheet。請確認 Sheet 的共用設定是「知道連結的任何人都可以檢視」。');
  return parseCSV(text);
}

(async () => {
  const rows = (await sheetRows()).map(r => r.map(c => String(c ?? '')));
  const base = ['data.js', 'extra.js'].map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(base + '\nglobalThis.P = PRODUCTS; globalThis.S = SERIES;', ctx);
  const products = applySheet(ctx.P, ctx.S, rows);          // 有錯就在這裡停下來，網站維持舊版
  console.log(`Google Sheet 讀取成功：${products.length} 個產品`);

  const now = new Date(Date.now() + 8 * 3600e3), pad = n => String(n).padStart(2, '0');
  const stamp = `${now.getUTCFullYear()}/${now.getUTCMonth() + 1}/${now.getUTCDate()} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
  const data = base + '\n' + fs.readFileSync(path.join(__dirname, 'sheetmerge.js'), 'utf8') +
    `\nconst SHEET_ROWS = ${JSON.stringify(rows)};\nPRODUCTS.splice(0, PRODUCTS.length, ...applySheet(PRODUCTS, SERIES, SHEET_ROWS));\nconst BUILD_TIME = ${JSON.stringify(stamp)};\n`;
  let html = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8')
    .replace('/*DATA*/', () => data).replace('/*APP*/', () => fs.readFileSync(path.join(SRC, 'app.js'), 'utf8'));
  for (const f of fs.readdirSync(path.join(ROOT, 'brand')))
    html = html.split('{{' + f.slice(0, -4) + '}}').join('data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'brand', f)).toString('base64'));
  if (html.includes('{{')) throw new Error('還有沒替換的圖片：' + html.match(/\{\{\w+\}\}/)[0]);

  fs.rmSync(DIST, { recursive: true, force: true }); fs.mkdirSync(DIST);
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({
    name: '青月魔法使用手冊', short_name: '魔法使用手冊', lang: 'zh-Hant-TW', start_url: './', scope: './', display: 'standalone',
    background_color: '#f8f6f0', theme_color: '#1f2a45',
    icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
  }, null, 1));
  // 離線：有網路時拿最新版並存起來，沒網路時用存下來的版本
  fs.writeFileSync(path.join(DIST, 'sw.js'), `const C = 'guide-${Date.now()}';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
`);
  fs.writeFileSync(path.join(DIST, 'CNAME'), DOMAIN + '\n');
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
  console.log('完成：dist/（資料時間 ' + stamp + '）');
})().catch(e => { console.error('\n✖ ' + e.message + '\n'); process.exit(1); });
