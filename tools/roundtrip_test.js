// 測試：匯出成表格 → 讀回來，產品資料要完全一樣
const fs = require('fs'), vm = require('vm');
const ctx = { console, require, module: {}, fs };
vm.createContext(ctx);
const src = ['src/data.js', 'src/extra.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n') + '\n' + fs.readFileSync('tools/export_sheet_body.js', 'utf8').replace("fs.writeFileSync('sheet.json',JSON.stringify(out));", 'globalThis.OUT=out;') + '\nglobalThis.P=PRODUCTS;globalThis.S=SERIES;';
vm.runInContext(src, ctx);
const { applySheet } = require('./sheetmerge.js');
const res = applySheet(ctx.P, ctx.S, ctx.OUT['產品']);
const srt = v => Array.isArray(v) ? v.map(srt) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, srt(v[k])])) : v; const norm = o => srt(JSON.parse(JSON.stringify(o)));
let bad = 0;
const A = norm(ctx.P), B = norm(res);
if (A.length !== B.length) { console.log('count', A.length, B.length); bad++; }
A.forEach((a, i) => { const b = B[i]; const ka = new Set([...Object.keys(a), ...Object.keys(b)]); ka.forEach(k => { if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) { bad++; console.log(a.id, k, '\n  A:', JSON.stringify(a[k]).slice(0, 300), '\n  B:', JSON.stringify(b[k]).slice(0, 300)); } }); });
console.log(bad ? `差異 ${bad} 處` : '完全一致 ✓');
fs.writeFileSync('tools/sheet_snapshot.json', JSON.stringify(ctx.OUT));
