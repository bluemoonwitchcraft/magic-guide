// 青月魔法使用手冊 — 原型程式
// 組合方式：產品（專屬：觀想、咒語、顏色、成分、例外）＋種類（共通步驟、搭配）＋使用模式（保存、期限）
const $ = (s, el = document) => el.querySelector(s);
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const state = { form: {}, year: {}, tab: {}, picks: [], q: '', ing: '', rtag: '', rprod: '' };
const CJK = /^[\s「『（(]*[\u3400-\u9fff]/;

// ───────── 組合產品資料 ─────────
function resolve(id, year) {
  const p = byId[id]; if (!p) return null;
  const yrs = p.years ? Object.keys(p.years) : null;
  const yr = yrs ? (year && p.years[year] ? year : yrs.find(y => p.years[y].oneLine) || yrs[0]) : null;
  const yd = yr ? p.years[yr] : {};
  const S = yd.kind === 'goddess' ? SERIES['女神聖化'] : (SERIES[p.series] || {});
  const m = MODES[S.mode] || MODES.wish;
  const x = { ...p, ...yd, S, m, year: yr, years: yrs, forms: yd.forms || p.forms, kind: yd.kind || SERIES_KIND[S.kind] || 'wish' };
  x.K = KINDS[x.kind];
  x.cat = p.cat || (S.kind === 'cat' && p.series !== '不屬任何種類' ? p.series : null);
  x.sub = x.kind === 'wish' ? p.series : x.kind === 'goddess' ? x.group : x.kind === 'energy' ? (p.seriesName ? '能量補充' : '季節魔法配方') : (p.cat || '');
  x.sameList = x.kind === 'wish' && !S.noSameRule ? PRODUCTS.filter(q => q.series === p.series && q.forms.includes('油') && q.id !== p.id).map(q => q.name) : [];
  x.short = yd.short || (p.id === SPECIAL.libation ? '禱告的祭酒' : p.name.split('．')[0]);
  return x;
}
const formOf = x => x.forms.includes(state.form[x.id]) ? state.form[x.id] : x.forms[0];

// ───────── 小元件 ─────────
const ul = (arr, cls = 'bul') => `<ul class="${cls}">${arr.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
function fold(title, inner, open) { return `<details class="fold"${open ? ' open' : ''}><summary>${esc(title)}</summary><div>${inner}</div></details>`; }
function link(id) { const p = byId[id]; return p ? `<a href="#p-${id}" class="plink">${esc(p.name)}</a>` : esc(id); }
function video(v) { return `<a class="ext" href="https://www.youtube.com/watch?v=${v.yt}" target="_blank" rel="noopener">▶ ${esc(v.title)}<small>需要網路</small></a>`; }
function pendingBox(t) { return `<div class="pend">${esc(t)}</div>`; }
function glyph(k, size) {
  const g = GLYPHS[k]; if (!g) return '';
  const [x, y, w, h] = g.vb, m = Math.max(w, h), pad = m * 0.08;
  return `<svg class="glyph" width="${size}" height="${size}" viewBox="${x - (m - w) / 2 - pad} ${-(y + h) - (m - h) / 2 - pad} ${m + pad * 2} ${m + pad * 2}" role="img" aria-label="${ASTRO_ZH[k]}符號"><path transform="scale(1,-1)" d="${g.d}"/></svg>`;
}
function astroBox(id) {
  const ss = STAR_SIGNS[id]; if (!ss) return '';
  return `<div class="astro">${ss.map(k => `<figure>${glyph(k, 64)}<figcaption>${ASTRO_ZH[k]}</figcaption></figure>`).join('<span class="plus">＋</span>')}</div>`;
}
function visualBox(t) { return t ? `<div class="vis"><div class="lbl">心中觀想</div><p>${esc(t)}</p></div>` : ''; }
function spellBox(lines, label, howto) {
  if (!lines || !lines.length) return '';
  const zh = lines.filter(l => CJK.test(l)), en = lines.filter(l => !CJK.test(l));
  return `<div class="spell"><div class="spell-h"><span>${esc(label)}</span>${howto ? `<span>${esc(howto)}</span>` : ''}</div>
    <div class="langs">${zh.length ? `<div><div class="lbl">中文</div>${zh.map(l => `<p>${esc(l)}</p>`).join('')}</div>` : ''}${en.length ? `<div><div class="lbl">ENGLISH</div>${en.map(l => `<p>${esc(l)}</p>`).join('')}</div>` : ''}</div></div>`;
}
// 共通步驟頁：下拉選單選產品，就地查觀想與咒語
function lookupBox(kind) {
  const pool = PRODUCTS.filter(p => KINDS[kind].series.includes(p.series));
  const groups = []; pool.forEach(p => { const g = resolve(p.id).sub || p.series; let G = groups.find(x => x[0] === g); if (!G) groups.push(G = [g, []]); G[1].push(p); });
  const opt = p => `<option value="${p.id}">${esc(p.name)}</option>`;
  const opts = groups.length > 1 ? groups.map(([g, ps]) => `<optgroup label="${esc(g)}">${ps.map(opt).join('')}</optgroup>`).join('') : pool.map(opt).join('');
  return `<div class="lookup" data-kind="${kind}"><div class="lbl">查這一款的觀想與咒語</div><select class="lk-sel" aria-label="選擇產品"><option value="">請選擇你手上的產品…</option>${opts}</select><div class="lk-out"></div></div>`;
}
function lookupResult(id) {
  const x = resolve(id); let h = '';
  if (x.kind === 'wish') h = visualBox(x.visual) + spellBox(x.spell, '啟動咒語', '中文或英文擇一・完整唸三次');
  else if (x.kind === 'goddess') h = (x.color ? visualBox(`${x.short}${x.color}的能量降臨在雙掌之中。`) : '') + spellBox(x.prayer, '女神祈禱文', '中文或英文擇一');
  else if (x.kind === 'star') h = `<div class="vis"><div class="lbl">心中觀想</div>${astroBox(x.id)}</div>` + spellBox(x.prayer, '祈禱文', '中文或英文擇一');
  else h = visualBox(x.visual) + spellBox(x.prayer, x.kind === 'powder' ? '咒語' : '祈禱文', '中文或英文擇一');
  if (!x.visual && !x.spell && !x.prayer && !x.color && !STAR_SIGNS[x.id]) h = pendingBox('這一款的觀想與咒語整理中，請先參考紙本說明書。');
  return `<div class="lk-name">${esc(x.name)}</div>${h}<a class="toollink" href="#p-${id}">到${esc(x.short)}的產品頁 ›</a>`;
}
function steps(list) {
  return `<ol class="flow">${list.map(s => `<li><div class="st-h">${esc(s.t)}</div>${s.b ? `<p>${esc(s.b)}</p>` : ''}${s.html || ''}</li>`).join('')}</ol>`;
}
function card(id) {
  const x = resolve(id);
  return `<a class="card" href="#p-${id}"><span class="card-name">${STAR_SIGNS[id] ? `<span class="mini">${STAR_SIGNS[id].map(k => glyph(k, 22)).join('')}</span>` : ''}${esc(x.name)}${x.isNew ? '<span class="new">NEW</span>' : ''}</span><span class="card-sub">${x.forms.join('／')}${x.years ? `・${x.years.join('／')}` : ''}</span></a>`;
}

// ───────── 各種類的步驟（同一份模板供產品頁與「啟動方式」頁共用） ─────────
// x 為產品（或 null 表示共通說明），form 為劑型
function stepsWish(x, form) {
  const oil = form !== '噴霧', thing = oil ? '魔法油' : '魔法噴霧';
  const look = x ? (visualBox(x.visual) + spellBox(x.spell, '啟動咒語', '中文或英文擇一・完整唸三次') || '') : '';
  const lookHtml = x ? (x.visual || x.spell ? look : pendingBox('這一款的觀想畫面與咒語整理中，請先參考紙本說明書。')) : lookupBox('wish');
  return steps([
    { t: '打開瓶口', b: oil ? '打開瓶蓋、取下瓶塞，將說明書放在瓶身旁。' : '取下噴頭，將說明書放在瓶身旁。' },
    { t: '準備你的魔杖', b: '將慣用手的食指與中指併攏，作為魔杖；也可以使用魔杖。' },
    { t: '一邊旋轉，一邊觀想與唸咒', b: '手指或魔杖在瓶口上方順時針旋轉，同時觀想下列畫面，出聲唸咒三次。', html: lookHtml },
    { t: '在瓶口吹一口長氣', b: `唸完三次後，心中想著「將所有祝福放入${thing}裡」，在瓶口吹一口長氣。` },
    { t: '關緊並搖勻', b: oil ? '裝回瓶塞與瓶蓋，關緊後搖晃瓶身，讓力量與油混合均勻。' : '裝回噴頭，關緊後搖晃瓶身，讓力量與噴霧混合均勻。' }
  ]);
}
function stepsEnergy(x, form) {
  const oil = form !== '噴霧';
  return steps([
    { t: '打開瓶口', b: oil ? '打開瓶蓋、取下瓶塞，將說明書放在瓶身旁。' : '取下噴頭，將說明書放在瓶身旁。' },
    { t: '在瓶口吹一口長氣', b: `心中想著「將所有祝福放入魔法${oil ? '油' : '噴霧'}裡」，在瓶口吹一口長氣。不必念咒。` },
    { t: '關緊並搖勻', b: oil ? '裝回瓶塞與瓶蓋，關緊後搖晃瓶身。' : '裝回噴頭，關緊後搖晃瓶身。' }
  ]);
}
function stepsGoddess(x, form) {
  const who = x ? x.short : '女神', color = x && x.color ? x.color : '';
  const vis = x ? (color ? visualBox(`${who}${color}的能量降臨在雙掌之中。`) : pendingBox('這一位女神的觀想顏色整理中，請先參考紙本說明書。')) : lookupBox('goddess');
  const pr = x ? (x.prayer ? spellBox(x.prayer, '女神祈禱文', '中文或英文擇一') : pendingBox('這一位女神的祈禱文整理中，請先參考紙本說明書。')) : '<p class="aside">在上一步輸入女神名稱，祈禱文會一起顯示。</p>';
  const first = form === '噴霧'
    ? { t: '噴灑並迎接', b: '噴灑在需要祝福的空間或區域周圍，然後伸出雙掌，做迎接的姿勢。' }
    : { t: '滴出並感受香氣', b: '將所需滴數滴在需要之處，或滴入無香蠟燭中並點燃，感受女神魔法油的香氣。' };
  let h = steps([
    first,
    { t: `呼喚${who}，觀想能量降臨`, b: `呼喚${who}之名，同時觀想：`, html: vis },
    { t: '念誦祈禱文', html: pr },
    { t: '把祝福放在需要的地方', b: '將迎接了女神能量的雙掌放在胸前，感受女神的祝福；也可以放在需要祝福的人、事、物上（他人請先徵得同意，建議現場進行）。' }
  ]);
  if (form !== '噴霧') h += `<p class="aside">滴入蠟燭點燃後，就是與女神連結的魔法蠟燭：請勿以嘴吹熄，蠟燭中也不可再滴入其他魔法油。</p>`;
  return h;
}
function stepsStar(x) {
  const ss = x && STAR_SIGNS[x.id];
  const vis = x ? `<div class="vis"><div class="lbl">心中觀想</div><p>${esc(x.visual || (ss ? `${ASTRO_ZH[ss[0]]}符號與${ASTRO_ZH[ss[1]]}符號浮現在眼前。` : '行星與星座的符號浮現在眼前。'))}</p>${astroBox(x.id)}</div>` : visualBox('行星與星座的符號浮現在眼前。');
  const pr = x ? (x.prayer ? spellBox(x.prayer, '行星／星座祈禱文', '中文或英文擇一') : pendingBox('這一款的祈禱文整理中，請先參考紙本說明書。')) : lookupBox('star');
  return steps([
    { t: '滴出並塗開', b: '將魔法油滴在需要加持的地方或物品上（例如護身符），塗開。' },
    { t: '觀想', html: vis },
    { t: '念誦祈禱文', html: pr },
    { t: '讓光芒照耀', b: '想像行星與星座符號的能量釋放出光芒，照耀在自己或物品上，感覺能量充滿。' }
  ]) + `<p class="aside">也可以將少許魔法油滴入蠟燭中，點燃後重複步驟 2～4。一個蠟燭使用一種星光行運魔法油；若要和願望型魔法油一起滴入蠟燭，請選說明書建議搭配的款式。</p>`;
}
function stepsPowder(x) {
  const pr = x ? (x.prayer ? spellBox(x.prayer, '咒語', '只須唸一次・中文或英文擇一') : pendingBox('這一款的咒語整理中，請先參考紙本說明書。')) : lookupBox('powder');
  const vis = x ? (x.visual ? visualBox(x.visual) : pendingBox('這一款的觀想畫面整理中，請先參考紙本說明書。')) : '<p class="aside">在上一步選擇產品，觀想畫面會一起顯示。</p>';
  return steps([
    { t: '取用香粉，選一種用法', html: `<div class="opts"><div><b>灑</b>用手指拈起少量，一邊灑在空間或物品上，一邊唸咒。</div><div><b>點燃</b>小茶匙挖 2～3 匙，在耐燃器皿中堆成小丘後點燃；用量不足會點不起來。</div><div><b>做成香包</b>裝入茶包袋或小袋子，完成下列步驟後隨身攜帶，直到香氣消失。</div></div>` },
    { t: '唸咒語', html: pr },
    { t: '觀想', html: vis },
    { t: '說出願望', b: x && x.example ? '例如：' + x.example : '說出你的願望，請許在合理的範圍內。' }
  ]);
}
function wishTable(ws) {
  return `<div class="wishes">${ws.map(w => `<div class="wishrow"><div class="wr-h">許<b>${esc(w.w)}</b>的願</div><p class="aside">${esc(w.note)}</p><div class="wr-oil"><span class="lbl">滴入${w.pick ? `（${w.pick}）` : ''}</span>${w.oils.map(id => `<a class="chip" href="#p-${id}">${esc(byId[id].name)}</a>`).join('')}</div>${spellBox([w.say], '念誦', '')}</div>`).join('')}</div>`;
}
function candleModes(x) {
  if (!x || !x.candleModes) return pendingBox(x ? '這一款蠟燭的用法整理中，請先參考隨附說明書。' : '每一款蠟燭的用法不同，請到產品頁查看。');
  return (x.candleModes.length > 1 ? `<p class="lead">${x.candleModes[0].t.startsWith('第一步') ? '依序進行：' : '先選一種用法：'}</p>` : '') + x.candleModes.map((c, i) => `<div class="modecard"><div class="st-h">${esc(c.t)}</div><p>${esc(c.b)}</p>${c.say ? spellBox(c.say, '點燃後念誦', '') : ''}${c.wishes ? wishTable(c.wishes) : ''}${(c.spell === undefined ? i === 1 : c.spell) ? visualBox(x.visual) + spellBox(x.prayer, '咒語／祈禱文', '中文或英文擇一') : ''}</div>`).join('');
}

// ───────── 日常使用、分享、搭配 ─────────
const GENERIC_USE = {
  wish: { '油': ['將啟動後的魔法油少量使用在需要之處，或滴入無香蠟燭中點燃釋放能量。'], '噴霧': ['將啟動後的魔法噴霧噴灑在空間中或需要之處；有需要時一至兩小時可補噴一次。'] },
  energy: { '油': ['將啟動後的魔法油使用在需要之處或護身符上。'], '噴霧': ['將啟動後的魔法噴霧噴灑在空間中或需要之處。'] }
};
function sharing(x, form) {
  return {
    wish: form === '噴霧' ? '自己啟動、自己使用；噴灑在空間中時，空間裡的所有生命都能受到守護。' : '自己啟動、自己使用；請勿分享他人使用，家人亦然。',
    energy: '可以分享給親人與朋友使用。', goddess: '可以分享給親人與朋友，一起分享女神能量。', star: '可以分享給親人與朋友使用。',
    powder: '可以分享：香粉是使用時才施咒，可以分給親朋好友。', sachet: '可以分享，香氣範圍能到達的都是有效區域。', candle: ''
  }[x.kind];
}
function pairRules(x, form) {
  const r = [];
  if (x.kind === 'wish') {
    if (x.sameList.length && form === '油') {
      r.push(`同種類願望型魔法油不可同時使用在同一對象上，請錯開使用對象，或間隔 24 小時。（同屬${x.cat}：${x.sameList.join('、')}）`);
    }
    if (x.sameList.length && form === '噴霧') r.push('噴霧與同種類的魔法油魔法路徑不同，可以同時使用。');
    r.push(...(x.exceptions || []));
    r.push(form === '噴霧' ? '與其他噴霧同時使用：請錯開噴灑位置，或間隔 10 分鐘。' : '與其他魔法油同時使用：不要用在同一處；同一處至少間隔 10 分鐘。');
    if (x.id !== SPECIAL.dragon) r.push('當天若也要使用女神聖化系列或黃金龍氣，請先使用它們。');
    r.push(form === '噴霧' ? '搭配蠟燭：先噴灑空間再點燭；噴霧不可加入蠟燭，也不要對著火焰噴。' : '滴入蠟燭時，一個蠟燭只用一種願望型魔法油。');
  } else if (x.kind === 'energy') {
    r.push('可與其他魔法油同時使用：避免用在同一處，或間隔約十分鐘。', '也可以和一種願望型魔法油一起滴入無香蠟燭中；一個蠟燭以一種季節魔法油為限。');
    if (form === '噴霧') r.push('噴霧不可加入蠟燭；搭配蠟燭時先噴灑空間再點燭。');
  } else if (x.kind === 'goddess' || x.kind === 'star' || x.kind === 'powder') {
    r.push(...(x.S.keyNotes || []));
    if (x.kind === 'star') r.push('可與其他魔法油同時使用；若非說明書建議搭配的魔法油，最好不要自行搭配。');
    if (x.kind === 'powder') r.push('不同香粉可以同時使用，但請不要混在一起。');
    r.push(...(x.exceptions || []));
  } else if (x.kind === 'candle') {
    r.push(x.oilRule || '若要滴入魔法油，一個蠟燭只用一種願望型魔法油。', ...(x.exceptions || []));
  }
  return r;
}
function otherNotes(x) {
  const all = [...(x.extraNotes || []), ...(x.kind === 'sachet' ? (x.exceptions || []) : []), ...(x.S.notes || []), ...(x.m.notes || [])];
  return all.filter(n => !/分享|施咒一次|月空時間也可以|可與其他魔法油同時使用|不同的魔法香包|不同香粉可以/.test(n));
}
function extras(x) {
  return (x.tips || []).map(t => `<div class="ex"><b>${esc(t.t)}</b><p>${esc(t.b)}</p></div>`).join('');
}
function recsOf(id, rx) {
  const x = rx || byId[id], rs = RECIPES.filter(r => r.products.includes(id) || (r.alt || []).includes(id));
  const ids = [...new Set([...(x.pairWith || []), ...(x.suggest || []), ...rs.flatMap(r => r.products)])].filter(i => i !== id && byId[i] && !(SERIES[x.series]?.kind === 'cat' && byId[i].series === x.series));
  return { ids, rs };
}
function pairBlock(x) {
  const { ids, rs } = recsOf(x.id, x); if (!ids.length && !rs.length && !x.suggestNote) return '';
  return `<div class="pairs">${x.pairNote || x.suggestNote ? `<p class="aside">${esc(x.pairNote || x.suggestNote)}</p>` : ''}<div class="pills">${ids.map(i => `<a class="pill" href="#p-${i}">${esc(byId[i].name)}</a>`).join('')}</div>
    ${rs.length ? `<div class="rlinks">${rs.map(r => `<a href="#${r.id}">秘方：${esc(r.name)} ›</a>`).join('')}</div>` : ''}</div>`;
}

// ───────── 產品頁 ─────────
const TABS = {
  wish: [['first', '首次啟動'], ['daily', '日常使用與搭配'], ['info', '成分與保存']],
  energy: [['first', '吹氣連結'], ['daily', '日常使用與搭配'], ['info', '成分與保存']],
  goddess: [['first', '每次使用'], ['daily', '搭配與注意'], ['info', '成分與保存']],
  star: [['first', '每次使用'], ['daily', '搭配與注意'], ['info', '成分與保存']],
  powder: [['first', '每次使用'], ['daily', '搭配與注意'], ['info', '成分與保存']],
  sachet: [['first', '使用方式'], ['info', '成分與保存']],
  candle: [['first', '使用方式'], ['daily', '搭配與注意'], ['info', '成分與保存']]
};
function viewProduct(id) {
  const x = resolve(id, state.year[id]); if (!x) return '<p>找不到這個產品。</p>';
  const form = formOf(x), tabs = TABS[x.kind], tab = tabs.some(t => t[0] === state.tab[id]) ? state.tab[id] : 'first';
  let h = `<div class="phead"><div class="crumb"><a href="#k-${x.kind}">${x.K.name}</a>${x.sub ? ` ／ <a href="#k-${x.kind}" data-scroll="g-${esc(x.sub)}">${esc(x.sub)}</a>` : ''}</div>
    <div class="ptop"><div><h1 class="ptitle">${esc(x.name)}</h1>${x.en ? `<div class="en">${esc(x.en)}</div>` : ''}</div>
    ${x.forms.length > 1 ? `<div class="seg">${x.forms.map(f => `<button data-form="${f}" class="${f === form ? 'on' : ''}">${f}</button>`).join('')}</div>` : ''}</div>`;
  if (x.years) h += `<div class="seg yr">${x.years.map(y => `<button data-year="${y}" class="${y === x.year ? 'on' : ''}">${y}</button>`).join('')}</div>`;
  h += x.oneLine ? `<p class="oneline">${esc(x.oneLine)}</p>` : `<p class="oneline muted">${esc(x.S.intro || '')}</p>`;
  if (x.oracle) h += `<blockquote class="oracle">神諭：「${esc(x.oracle)}」</blockquote>`;
  const facts = [['適合誰', x.recommend], ['主要功能', x.func], [x.kind === 'star' ? '' : '建議時機', x.kind === 'star' ? '' : x.timing]].filter(f => f[0] && f[1]);
  if (facts.length) h += `<dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  if (x.blog) h += `<a class="bloglink" href="${esc(x.blog)}" target="_blank" rel="noopener">看思逸老師部落格的完整介紹 ↗</a>`;
  h += `</div>`;
  if (x.years && !x.oneLine) return h + pendingBox(`${x.year} 年的說明整理中。`);
  h += `<div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${t}</button>`).join('')}</div>`;
  h += `<section class="pane">${tab === 'first' ? paneFirst(x, form) : tab === 'daily' ? paneDaily(x, form) : paneInfo(x, form)}</section>`;
  return h;
}
function paneFirst(x, form) {
  let h = '';
  const vids = (x.videos || []);
  if (x.kind === 'wish') {
    h += `<h2>跟著步驟，完成啟動<small>第一次使用前做一次即可，之後不必重做</small></h2>`;
    h += `<div class="notice">開始前：請避開月空時間${x.S.eclipse ? '及日／月食' : ''}，並由使用者本人啟動。<a href="#t-moon">看月空時間表 ›</a></div>${moonStatus(true)}`;
    h += stepsWish(x, form);
  } else if (x.kind === 'energy') {
    h += `<h2>吹氣連結<small>第一次使用前做一次即可，不必念咒</small></h2><div class="notice">開始前：請避開月空時間。<a href="#t-moon">看月空時間表 ›</a></div>${moonStatus(true)}` + stepsEnergy(x, form);
  } else if (x.kind === 'goddess') {
    h += `<h2>每次使用都這樣做<small>不須啟動，月空時間也可以使用</small></h2>` + stepsGoddess(x, form);
  } else if (x.kind === 'star') {
    h += `<h2>每次使用都這樣做<small>不須啟動，月空時間也可以使用</small></h2>${x.timing ? `<div class="notice">行運期間：${esc(x.timing)}</div>` : ''}` + stepsStar(x);
  } else if (x.kind === 'powder') {
    h += `<h2>每次使用都這樣做<small>不須啟動，月空時間也可以使用</small></h2>` + stepsPowder(x);
  } else if (x.kind === 'sachet') {
    h += `<h2>不須啟動，取出就能用</h2>` + ul((x.usage && x.usage[form]) || x.m.usage) + `<p class="share">${esc(sharing(x, form))}</p>`;
    if (x.spellOpt) h += spellBox(x.spellOpt, '灑淨時可以念的咒語', '自然魔法常用咒語');
    h += fold('注意事項', ul(otherNotes(x)));
  } else if (x.kind === 'candle') {
    h += `<h2>使用方式</h2>${x.moonFree ? '' : moonStatus(true)}` + candleModes(x);
    if (x.usage && x.usage['蠟燭']) h += ul(x.usage['蠟燭']);
  }
  vids.filter(v => v.at === 'activation' || v.at === 'top').forEach(v => h += video(v));
  if (TABS[x.kind].some(t => t[0] === 'daily')) h += `<button class="next" data-tab="daily">接著看${TABS[x.kind][1][1]} →</button>`;
  if (x.kind === 'wish') h += fold('忘記啟動、唸錯咒語或在月空啟動了？', '<p>在避開月空的時間，重新依步驟啟動一次即可。不需要每次使用都重新啟動。</p>');
  return h;
}
function paneDaily(x, form) {
  let h = '';
  if (x.kind === 'wish' || x.kind === 'energy') {
    const use = (x.usage && x.usage[form]) || GENERIC_USE[x.kind][form];
    h += `<h2>${x.kind === 'wish' ? '啟動後，平常這樣用' : '連結後，平常這樣用'}<small>不必重新${x.kind === 'wish' ? '施咒啟動' : '吹氣'}</small></h2>${ul(use)}`;
    if (!x.usage) h += `<p class="aside">這一款的專屬用法整理中，以上為同類產品的共通用法。</p>`;
  }
  const sh = sharing(x, form); if (sh && x.kind !== 'sachet') h += `<p class="share">${esc(sh)}</p>`;
  h += `<h2>搭配其他產品時</h2>${ul(pairRules(x, form), 'rules')}`;
  if (x.kind === 'wish' && form === '油' && x.S.sameTarget) h += fold('怎麼錯開使用對象？', ul(x.S.sameTarget));
  const pb = pairBlock(x); if (pb) h += `<h2>推薦搭配</h2>` + pb;
  h += `<a class="toollink" href="#check" data-addcheck="${x.id}">把${esc(x.short)}放進「這樣用搭不搭」 ›</a>`;
  const ex = extras(x); if (ex) h += fold('延伸用法', ex);
  const notes = otherNotes(x); if (notes.length) h += fold('其他注意事項', ul(notes));
  (x.videos || []).filter(v => v.at === 'usage').forEach(v => h += video(v));
  if (x.id === 'mercurywind') h += mercuryBlock();
  return h;
}
function paneInfo(x, form) {
  let h = `<h2>配方<small>${esc(x.kind === 'candle' ? '魔法蠟燭' : '魔法' + form)}</small></h2>`;
  const ing = x.ingredients && x.ingredients[form];
  h += ing ? `<dl class="ing">${ing.split('｜').map(s => { const [k, ...v] = s.split('：'); return v.length ? `<dt>${esc(k)}</dt><dd>${esc(v.join('：'))}</dd>` : `<dd class="full">${esc(s)}</dd>`; }).join('')}</dl>` : pendingBox('成分整理中。');
  if (x.specs) h += `<h2>規格</h2><dl class="ing">${x.specs.split('｜').map(s => { const [k, ...v] = s.split('：'); return `<dt>${esc(k)}</dt><dd>${esc(v.join('：'))}</dd>`; }).join('')}</dl>`;
  h += `<h2>保存與使用期限</h2><p>${esc(x.S.storage || x.m.storage)}</p><p>${esc(x.S.expiry || x.m.expiry)}</p>`;
  const pdf = x.pdf || x.S.pdf; if (pdf) h += `<a class="ext" href="${encodeURI(pdf)}" target="_blank" rel="noopener">查看完整 PDF 說明書<small>需要網路</small></a>`;
  h += `<p class="disclaimer">本產品為宗教儀式用品，用途屬信仰性質，不具保養或療效目的。</p>`;
  return h;
}


// ───────── 月空 ─────────
const CAL_ID = 've3cjvibuusqup6r1fm2mkqrc0%40group.calendar.google.com';
const CAL_ADD = `https://calendar.google.com/calendar/render?cid=${CAL_ID}`, ICAL_URL = `https://calendar.google.com/calendar/ical/${CAL_ID}/public/basic.ics`;
const QA_URL = 'https://wp.me/P3UNVs-5K8', CAL_URL = 'https://calendar.google.com/calendar/embed?src=ve3cjvibuusqup6r1fm2mkqrc0%40group.calendar.google.com&ctz=Asia%2FTaipei';
const tp = s => new Date(s + ':00+08:00');
const WD = '日一二三四五六';
function tpParts(d) { const t = new Date(d.getTime() + 8 * 3600e3); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), w: WD[t.getUTCDay()], hh: String(t.getUTCHours()).padStart(2, '0'), mm: String(t.getUTCMinutes()).padStart(2, '0') }; }
function fmtD(d) { const p = tpParts(d); return `${p.m}/${p.d}（${p.w}）${p.hh}:${p.mm}`; }
function fmtRange(s, e) { const a = tpParts(s), b = tpParts(e); return `${fmtD(s)} – ${a.d === b.d && a.m === b.m ? `${b.hh}:${b.mm}` : fmtD(e)}`; }
function moonNow(now = new Date()) {
  const list = VOC.map(([a, b]) => [tp(a), tp(b)]);
  const cur = list.find(([a, b]) => a <= now && now < b), next = list.find(([a]) => a > now);
  return { cur, next, end: tp(VOC[VOC.length - 1][1]) };
}
function moonStatus(compact) {
  const { cur, next, end } = moonNow();
  if (new Date() > end) return `<div class="mstat"><b>月空資料需要更新</b><span>請查青月巫作時程表</span></div>`;
  if (cur) return `<div class="mstat on"><b>現在是月空時間</b><span>到 ${fmtD(cur[1])} 結束${compact ? '，請在結束後再啟動' : ''}</span></div>`;
  return `<div class="mstat off"><b>現在不是月空時間</b>${next ? `<span>下一次月空：${fmtRange(next[0], next[1])}</span>` : ''}</div>`;
}


// ───────── 水星順逆行（水星之風） ─────────
function mercuryBlock() {
  const now = new Date(), list = MERCURY.map(([t, s, g]) => ({ d: tp(t), y: t.slice(0, 4), s, g, rx: /逆行/.test(s) && s !== '恢復順行' }));
  const last = [...list].reverse().find(r => r.d <= now), nextRx = list.find(r => r.d > now && r.s === '開始逆行'), nextDir = list.find(r => r.d > now && r.s === '恢復順行');
  let stat = '';
  if (!last || now > list[list.length - 1].d && now.getTime() - list[list.length - 1].d > 60 * 864e5) stat = `<div class="mstat"><b>水星資料需要更新</b><span>請查巫日書或青月巫作時程表</span></div>`;
  else if (last.rx) stat = `<div class="mstat on"><b>目前水星逆行中・在${last.g}座</b><span>${nextDir ? `到 ${fmtD(nextDir.d)} 恢復順行` : ''}</span></div>`;
  else stat = `<div class="mstat off"><b>目前水星順行・在${last.g}座</b>${nextRx ? `<span>下一次逆行：${fmtD(nextRx.d)} 起（${nextRx.y}）</span>` : ''}</div>`;
  const years = [...new Set(list.filter(r => r.d > now).map(r => r.y))];
  const sel = years.includes(state.merc) ? state.merc : years[0];
  const rows = list.filter(r => r.y === sel && r.d > now).map(r => `<li class="${r.rx ? 'rx' : ''}${r.s === '恢復順行' ? ' dir' : ''}"><span class="md">${fmtD(r.d)}</span><span class="ms">${r.s}</span><b>${r.g}座</b></li>`).join('');
  return `<h2>水星順逆行與進入星座時間表<small>以台灣時間（UTC+8）顯示；已過去的時間不再列出</small></h2><p class="aside">${esc(MERCURY_INTRO)}</p>${stat}
    ${years.length > 1 ? `<div class="chipnav">${years.map(y => `<button data-merc="${y}" class="${y === sel ? 'on' : ''}">${y}</button>`).join('')}</div>` : ''}
    <ul class="voclist merc">${rows || '<li class="muted">目前沒有後續資料。</li>'}</ul>`;
}

// ───────── 首頁 ─────────
const TOPICS = [
  ['activate', '啟動方式', '哪些要啟動？怎麼開始？'], ['usage', '使用方式', '油、噴霧、香粉怎麼用？'],
  ['order', '使用順序', '先用哪一個？搭配的原則'], ['moon', '月空時間', '什麼要避開？什麼可以？'],
  ['storage', '保存方式', '怎麼存放？用多久？'], ['ingr', '成分查詢', '這瓶有哪些成分？']
];
function viewHome() {
  return `<div class="lockup"><img class="ld" src="${BRAND.deer}" alt=""><img class="lw" src="${BRAND.word}" alt="青月巫作"></div><section class="hero"><p class="eyebrow">SEER × BLUE MOON WITCHCRAFT</p><h1>青月魔法使用手冊</h1><p>查詢青月巫作魔法產品的啟動方式、咒語、使用方式與搭配</p>
    <form class="search" data-search><input name="q" type="search" placeholder="搜尋品名、女神、成分或關鍵字" autocomplete="off"><button>搜尋</button></form>
    <div class="try">試試搜尋 ${['幸運', '黃金', '玫瑰'].map(k => `<a href="#search" data-q="${k}">${k}</a>`).join('')}</div></section>
    <h2 class="sec">種類</h2><div class="kinds">${KIND_ORDER.map(k => `<a class="kind" href="#k-${k}"><b>${KINDS[k].name}</b><span>${KINDS[k].sub}</span></a>`).join('')}</div>
    <h2 class="sec">你想查什麼？</h2><div class="topics">${TOPICS.map(([k, t, s]) => `<a class="topic" href="#t-${k}"><b>${t}</b><span>${s}</span></a>`).join('')}</div>
    <div class="tools"><a class="tool" href="#check"><b>這樣用搭不搭？</b><span>放進手上的產品，看先用哪一個、要注意什麼</span></a><a class="tool" href="#recipes"><b>搭配秘方</b><span>老師推薦的組合用法</span></a><a class="tool qa" href="${QA_URL}" target="_blank" rel="noopener"><b>魔法產品答客問 ↗</b><span>更多常見問題（部落格，需要網路）</span></a></div>${typeof BUILD_TIME !== 'undefined' ? `<p class="stamp">資料更新：${BUILD_TIME}</p>` : ''}`;
}

// ───────── 種類頁 ─────────
function viewKind(k) {
  const K = KINDS[k]; if (!K) return viewHome();
  const ps = PRODUCTS.filter(p => K.series.includes(p.series));
  let groups;
  if (k === 'wish') groups = K.series.map(s => [s, ps.filter(p => p.series === s)]);
  else if (k === 'goddess') groups = GODDESS_GROUPS.map(g => [g, ps.filter(p => p.group === g)]);
  else if (k === 'energy') groups = [['季節魔法配方', ps.filter(p => !p.seriesName)], ['能量補充', ps.filter(p => p.seriesName)]];
  else if (k === 'powder' || k === 'sachet' || k === 'candle') { const cs = [...new Set(ps.map(p => p.cat || '其他'))]; groups = cs.map(c => [c, ps.filter(p => (p.cat || '其他') === c)]); }
  else groups = [['', ps]];
  return `<h1 class="ptitle">${K.name}</h1><p class="lead">${esc(K.sub)}</p>
    <div class="common"><div class="lbl">這一類的共通用法</div>${ul(K.summary)}<a href="#t-activate" data-scroll="a-${k}">看完整步驟 ›</a></div>
    ${groups.filter(g => g[1].length).map(([g, l]) => `${g ? `<h3 id="g-${esc(g)}">${esc(g)}</h3>` : ''}<div class="cards">${l.map(p => card(p.id)).join('')}</div>`).join('')}`;
}

// ───────── 主題頁（不必先選產品） ─────────
function faq(key) {
  return `<section class="topic-s" id="faq"><h2>常見問題</h2>${QA[key].map(([q, a]) => fold(q, `<p>${esc(a)}</p>`)).join('')}<a class="ext" href="${QA_URL}" target="_blank" rel="noopener">更多問題：魔法產品答客問<small>需要網路</small></a></section>`;
}
function chipsNav(items) { return `<div class="chipnav">${items.map(([id, t]) => `<button data-scroll="${id}">${t}</button>`).join('')}</div>`; }
function viewTopic(t) {
  if (t === 'activate') {
    return `<h1 class="ptitle">啟動方式</h1><p class="lead">不同種類的開始方式不一樣。每一類都可以在步驟中選擇你手上的產品，直接查看那一款的觀想與咒語。</p>
    ${chipsNav([...KIND_ORDER.map(k => ['a-' + k, KINDS[k].name]), ['faq', '常見問題']])}
    <section class="topic-s" id="a-wish"><h2>願望型<small>第一次使用前施咒啟動一次</small></h2><div class="notice">請避開月空時間（豐盛生活、人緣和合另避開日／月食），並由使用者本人啟動。</div>${stepsWish(null, '油')}<p class="aside">噴霧的做法相同，只是取下的是噴頭。</p></section>
    <section class="topic-s" id="a-energy"><h2>能量補充型<small>第一次使用前吹氣連結</small></h2>${stepsEnergy(null, '油')}</section>
    <section class="topic-s" id="a-goddess"><h2>女神聖化系列<small>不須啟動，每次使用都這樣做</small></h2>${stepsGoddess(null, '油')}</section>
    <section class="topic-s" id="a-star"><h2>星光行運<small>不須啟動，每次使用都這樣做</small></h2>${stepsStar(null)}</section>
    <section class="topic-s" id="a-powder"><h2>魔法香粉<small>不須啟動，每次使用都這樣做</small></h2>${stepsPowder(null)}</section>
    <section class="topic-s" id="a-sachet"><h2>魔法香包<small>不須啟動</small></h2><p>取出即可使用，已由專業巫師完成祝聖程序。</p></section>
    <section class="topic-s" id="a-candle"><h2>魔法蠟燭<small>依各款說明</small></h2>${ul(KINDS.candle.summary)}</section>${faq('activate')}`;
  }
  if (t === 'usage') {
    return `<h1 class="ptitle">使用方式</h1><p class="lead">依劑型查看共通用法。各款的專屬用法在產品頁。</p>
    ${chipsNav([['u-oil', '魔法油'], ['u-spray', '魔法噴霧'], ['u-powder', '魔法香粉'], ['u-sachet', '魔法香包'], ['u-candle', '魔法蠟燭'], ['faq', '常見問題']])}
    <section class="topic-s" id="u-oil"><h2>魔法油</h2><dl class="kv"><dt>願望型</dt><dd>${esc(GENERIC_USE.wish['油'][0])}</dd><dt>能量補充型</dt><dd>${esc(GENERIC_USE.energy['油'][0])}</dd><dt>女神聖化</dt><dd>滴在需要之處，或滴入無香蠟燭中點燃；每次都呼喚女神、念祈禱文。</dd><dt>星光行運</dt><dd>滴在需要加持的地方或物品上，每次都觀想並念祈禱文。</dd></dl><p class="aside">請勿使用水氧機等擴香機器，可以水燈薰香。</p></section>
    <section class="topic-s" id="u-spray"><h2>魔法噴霧</h2><dl class="kv"><dt>願望型</dt><dd>${esc(GENERIC_USE.wish['噴霧'][0])}</dd><dt>能量補充型</dt><dd>${esc(GENERIC_USE.energy['噴霧'][0])}</dd><dt>女神聖化</dt><dd>噴灑在需要祝福的空間或區域周圍，再伸出雙掌迎接女神能量。</dd></dl><p class="aside">噴霧不可加入蠟燭；搭配蠟燭時先噴灑空間再點燭，不要對著火焰噴。</p></section>
    <section class="topic-s" id="u-powder"><h2>魔法香粉</h2>${stepsPowder(null)}</section>
    <section class="topic-s" id="u-sachet"><h2>魔法香包</h2>${ul(MODES.sachet.usage)}</section>
    <section class="topic-s" id="u-candle"><h2>魔法蠟燭</h2>${ul([...KINDS.candle.summary.slice(0, 1), ...MODES.candle.notes])}${fold('殘蠟怎麼辦？', `<p>${esc(MODES.candle.tips[0].b)}</p>`)}</section>${faq('usage')}`;
  }
  if (t === 'order') {
    return `<h1 class="ptitle">使用順序</h1><p class="lead">只有一天當中第一次使用時要注意順序，之後補用不必。</p>
    <ol class="orderlist"><li><b>禱告的祭酒</b></li><li><b>其他女神聖化系列</b><span>含東方七女神</span></li><li><b>黃金龍氣</b></li><li><b>其他所有魔法產品</b><span>不分先後；香粉與油同用時，先香粉再油</span></li></ol>
    <h2>搭配的原則</h2>${ul([
      '女神：一天建議只使用一位；緊急時 24 小時內最多三位（禱告的祭酒不計）。用完女神可立即使用其他產品。',
      '同種類的願望型魔法油：不可同時用在同一對象上，請錯開使用對象，或間隔 24 小時。噴霧不受此限。',
      '決別之刃：使用前後與其他願望型魔法產品間隔 2 小時。',
      '不同魔法油：不要用在同一處；同一處至少間隔 10 分鐘。',
      '不同噴霧：錯開噴灑位置，或間隔 10 分鐘。',
      '蠟燭：一個蠟燭只滴一種願望型魔法油，可再加一種季節魔法油或月神之箭；噴霧不可加入蠟燭。',
      '星光行運：若要與願望型魔法油一起滴入蠟燭，請選說明書建議搭配的款式。'
    ], 'rules')}<a class="toollink" href="#check">放進手上的產品，看這樣用搭不搭 ›</a>${faq('order')}`;
  }
  if (t === 'moon') {
    const now = new Date(), pn = tpParts(now);
    const months = [...new Set(VOC.map(v => v[0].slice(0, 7)))].filter(m => m >= `${pn.y}-${String(pn.m).padStart(2, '0')}`);
    const sel = months.includes(state.mon) ? state.mon : months[0];
    const rows = VOC.filter(v => v[0].startsWith(sel) && tp(v[1]) > now).map(([a, b]) => { const s0 = tp(a), e0 = tp(b), past = e0 < now, live = s0 <= now && now < e0;
      return `<li class="${live ? 'live' : ''}">${fmtRange(s0, e0)}${live ? '<em>進行中</em>' : ''}</li>`; }).join('');
    const ecl = ECLIPSES.filter(([, b]) => tp(b) > now);
    return `<h1 class="ptitle">月空時間</h1><p class="lead">月亮空亡期間少了月亮女神的支持，個人魔力會大幅減弱。啟動與許願請避開。</p>
    <div class="calcard"><div class="lbl">青月巫作時程表 X 月相曆</div><b>月空時間、新滿月，還有每一檔的開單、結單時間都在這裡</b><p>加入你的行事曆，手機會自動提醒，不會錯過任何一檔！</p>
      <a class="calbtn" href="${CAL_ADD}" target="_blank" rel="noopener">加入我的 Google 日曆</a>
      <a class="calbtn ghost" href="${CAL_URL}" target="_blank" rel="noopener">打開線上月相曆</a>
      <button class="calbtn ghost" data-copy="${ICAL_URL}">複製 iCal 網址（iPhone 行事曆可訂閱）</button><span class="copied" hidden>已複製</span>
      <small>需要網路</small></div>
    ${moonStatus()}
    <div class="two"><div class="no"><div class="lbl">月空時請避開</div>${ul(['願望型魔法油／噴霧的啟動', '能量補充型的吹氣連結', '蠟燭魔法許願、魔法蠟燭的許願或第一次施咒', '新月、滿月儀式等有目的的施術'])}</div>
    <div class="yes"><div class="lbl">月空時也可以</div>${ul(['已啟動產品的日常使用', '女神聖化系列、星光行運', '魔法香粉、魔法香包', '單純點燃蠟燭、滴入魔法油釋放能量（不許願）'])}</div></div>
    <h2>離線版月空時間表<small>不需要網路；以台灣時間（UTC+8）顯示，香港、澳門、馬來西亞、中國相同</small></h2><div class="chipnav">${months.map(m => `<button data-mon="${m}" class="${m === sel ? 'on' : ''}">${+m.slice(0, 4) !== pn.y ? m.slice(0, 4) + '/' : ''}${+m.slice(5)} 月</button>`).join('')}</div>
    <ul class="voclist">${rows || '<li class="muted">這個月的月空時間都已經過了。</li>'}</ul>
    ${ecl.length ? `<h2>日食・月食<small>豐盛生活、人緣和合類的啟動請另外避開</small></h2><ul class="voclist">${ecl.map(([a, b, k]) => `<li><b>${k}</b>　${a.slice(0, 4)}/${fmtRange(tp(a), tp(b))}</li>`).join('')}</ul>` : ''}
    <h2>常見問題</h2>
    ${fold('不小心在月空時間啟動了，怎麼辦？', '<p>沒問題，等月空時間結束後，再依步驟正確啟動一次即可。</p>')}
    ${fold('月空時可以使用魔法油、噴霧、香粉嗎？', '<p>可以。只要不是需要高度專注力的許願，單純使用已啟動的產品都沒有問題。女神聖化系列、星光行運也可以在月空時間使用。</p>')}
    ${fold('為什麼魔法香粉月空時可以用？', '<p>香粉製作時已由女巫團隊透過儀式祝福，本身就帶有魔力；使用時唸的一句咒語代表你的祈求與連結，並不是由你灌入魔力。魔法油與噴霧的啟動需要你的魔力灌注，所以要避開月空。</p>')}
    ${fold('月空時可以點蠟燭嗎？', '<p>單純點燃、或滴入魔法油釋放能量，可以；要許願或第一次施咒，請等月空結束後再進行。</p>')}
    <a class="ext" href="${QA_URL}" target="_blank" rel="noopener">更多問題：魔法產品答客問<small>需要網路</small></a>
    <p class="aside">離線版月空時間表收錄到 ${VOC[VOC.length - 1][0].slice(0, 4)} 年底，以青月巫作時程表為準。</p>`;
  }
  if (t === 'storage') {
    const rows = [['魔法油・噴霧', MODES.wish.storage, MODES.wish.expiry], ['魔法香粉', SERIES['魔法香粉'].storage, SERIES['魔法香粉'].expiry], ['魔法香包', MODES.sachet.storage, MODES.sachet.expiry], ['魔法蠟燭', MODES.candle.storage, MODES.candle.expiry]];
    return `<h1 class="ptitle">保存方式</h1>${rows.map(([n, s, e]) => `<section class="topic-s"><h2>${n}</h2><p>${esc(s)}</p><p>${esc(e)}</p></section>`).join('')}
    ${faq('storage')}`;
  }
  if (t === 'ingr') {
    const k = state.ing.trim(); let res = '';
    if (k) {
      const prods = PRODUCTS.filter(p => (p.name + ' ' + (p.en || '')).toLowerCase().includes(k.toLowerCase()));
      prods.forEach(p => { const x = resolve(p.id, state.year[p.id]);
        res += `<div class="ingcard"><div class="ingcard-h"><a href="#p-${p.id}">${esc(p.name)}</a>${x.year ? `<span>${x.year}</span>` : ''}</div>` +
          (x.ingredients ? Object.entries(x.ingredients).map(([f, v]) => `<div class="lbl">${f === '蠟燭' || f === '香包' || f === '香粉' ? '成分' : '魔法' + f}</div><dl class="ing">${v.split('｜').map(z => { const [a, ...b] = z.split('：'); return b.length ? `<dt>${esc(a)}</dt><dd>${esc(b.join('：'))}</dd>` : `<dd class="full">${esc(z)}</dd>`; }).join('')}</dl>`).join('') : pendingBox('成分整理中。')) + `</div>`; });
      const hits = []; PRODUCTS.forEach(p => { const x = resolve(p.id); Object.entries(x.ingredients || {}).forEach(([f, v]) => { if (v.includes(k)) hits.push([p.id, f]); }); });
      if (hits.length) res += `<h2>含「${esc(k)}」的產品<small>${hits.length} 項</small></h2><div class="cards">${hits.map(([id, f]) => `<a class="card" href="#p-${id}" data-setform="${f}"><span class="card-name">${esc(byId[id].name)}</span><span class="card-sub">${f}</span></a>`).join('')}</div>`;
      if (!res) res = '<p class="aside">找不到相符的產品或成分，換個關鍵字試試。目前收錄成分的產品還不多，資料陸續補齊中。</p>';
    }
    return `<h1 class="ptitle">成分查詢</h1><p class="lead">選擇產品，看它的全部成分；或輸入成分，看哪些產品含有它。</p><select id="ingsel" class="pick" aria-label="選擇產品"><option value="">從清單選擇產品…</option>${Object.values(KINDS).map(K => `<optgroup label="${esc(K.name)}">${PRODUCTS.filter(p => K.series.includes(p.series)).map(p => `<option value="${esc(p.name)}"${p.name === k ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}</select><form class="search inline" data-ing><input name="q" type="search" value="${esc(k)}" placeholder="例如：大地之財、乳香"><button>查詢</button></form>
    <div class="try">試試 ${['大地之財', '愛西斯', '金色龍寶', '乳香', '肉桂'].map(w => `<a href="#t-ingr" data-ing="${w}">${w}</a>`).join('')}</div>${res}`;
  }
  return viewHome();
}

// ───────── 這樣用搭不搭（數量不限；提醒緊跟著產品） ─────────
function rank(x) { return x.id === SPECIAL.libation ? 0 : x.kind === 'goddess' ? 1 : x.id === SPECIAL.dragon ? 2 : x.form === '香粉' ? 3 : 4; }
const STEP_NOTE = ['最優先使用', '女神聖化系列（含東方七女神）', '在女神之後、其他產品之前', '先用香粉，再用魔法油', ''];
function check(items) {
  const ps = items.map((i, n) => ({ ...resolve(i.id), form: i.form, n }));
  let level = 0; const bump = l => level = Math.max(level, l);
  const flags = [];
  const notes = new Map(ps.map(p => [p.n, []])); const put = (p, l, t) => { notes.get(p.n).push({ l, t }); bump(l); };
  const steps = [0, 1, 2, 3, 4].map(r => ({ r, ps: ps.filter(p => rank(p) === r), notes: [], units: [] })).filter(g => g.ps.length);
  steps.forEach(g => {
    if (g.r === 1) {
      const gods = [...new Set(g.ps.map(p => p.id))];
      if (gods.length > 3) {
        const over = gods.slice(3); bump(3);
        g.ps.filter(p => over.includes(p.id)).forEach(p => { p.over = true; });
        over.forEach(id => { const p = g.ps.find(q => q.id === id); notes.get(p.n).push({ l: 3, t: `超過上限：24 小時內最多呼喚三位女神（禱告的祭酒不計），${p.short}請改天再使用。` }); flags.push({ l: 3, t: `${p.short}超過女神上限` }); });
        flags.unshift({ l: 2, t: `女神 ${gods.length} 位，建議一天一位最佳` });
        g.notes.push({ l: 2, t: `已選 ${gods.length} 位女神。一天建議只使用一位，緊急時 24 小時內最多三位：${gods.slice(0, 3).map(i => byId[i].name.split('．')[0]).join('、')}。` });
      }
      else if (gods.length > 1) { g.notes.push({ l: 2, t: `已選 ${gods.length} 位女神：一天建議只使用一位，緊急時 24 小時內最多三位（禱告的祭酒不計）。` }); bump(2); flags.push({ l: 2, t: `女神 ${gods.length} 位，建議一天一位最佳` }); }
      if (ps.some(p => rank(p) > 1)) g.notes.push({ l: 0, t: '用完女神後可立即使用其他產品，無須間隔，避免用在同一處即可。' });
    }
    // 同種類願望型：把同類的排在一起，提醒放在這一組下面
    const used = new Set();
    g.ps.forEach(p => {
      if (used.has(p.n)) return;
      if (p.kind === 'wish' && p.cat && !p.S.noSameRule) {
        const grp = g.ps.filter(q => q.kind === 'wish' && q.cat === p.cat && !q.S.noSameRule);
        const oils = [...new Set(grp.filter(q => q.form === '油').map(q => q.short))];
        if (grp.length > 1) {
          grp.forEach(q => used.add(q.n)); const un = { ps: grp, notes: [] };
          if (oils.length > 1) { flags.push({ l: 2, t: `${oils.join('、')}要錯開對象或間隔 24 小時` }); un.notes.push({ l: 2, t: `同種類願望型魔法油不可同時使用在同一對象上，請錯開使用對象，或間隔 24 小時。（${oils.join('、')}油同屬${p.cat}）` }); bump(2); }
          if (grp.some(q => q.form === '噴霧') && oils.length) un.notes.push({ l: 0, t: '噴霧與油的魔法路徑不同，同種類也可以同時使用。' });
          g.units.push(un); return;
        }
      }
      used.add(p.n); g.units.push({ ps: [p], notes: [] });
    });
  });
  const n = f => ps.filter(p => p.form === f).length;
  ps.forEach(p => {
    if (p.id === SPECIAL.blade) { const o = [...new Set(ps.filter(q => q.kind === 'wish' && q.id !== p.id).map(q => q.short))]; if (o.length) { flags.push({ l: 2, t: '決別之刃要間隔 2 小時' }); } if (o.length) put(p, 2, `決別之刃使用前後，請與其他願望型產品（${o.join('、')}）間隔 2 小時，以免相反的願力互相抵銷。`); }
    if (p.form === '蠟燭') put(p, 1, p.oilRule || '一個蠟燭只滴一種願望型魔法油。');
    if (p.form === '噴霧' && n('蠟燭')) put(p, 1, '噴霧不可加入蠟燭：先噴灑空間，再點燭，不要對著火焰噴。');
    if (p.form === '香粉' && n('香粉') > 1) put(p, 1, '不同香粉可以同時使用，但請不要混在一起。');
    if (p.kind === 'star' && (n('蠟燭') || ps.some(q => q.kind === 'wish' && q.form === '油'))) put(p, 1, '若要與願望型魔法油一起滴入蠟燭，請選說明書建議搭配的款式。');
    if (p.form === '香包') put(p, 0, '隨身攜帶或放置即可，與其他產品沒有使用限制。');
  });
  const general = [];
  if (n('油') > 1) general.push('不同魔法油不要用在同一處；同一處至少間隔 10 分鐘。');
  if (n('噴霧') > 1) general.push('不同噴霧請錯開噴灑位置，或間隔 10 分鐘。');
  if (general.length) bump(1);
  return { level, steps, notes, general, flags };
}
function viewCheck() {
  const groups = KIND_ORDER.map(k => `<optgroup label="${KINDS[k].name}">${PRODUCTS.filter(p => KINDS[k].series.includes(p.series)).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
  const rows = state.picks.map((pk, i) => { const p = byId[pk.id];
    return `<div class="pick"><b>${esc(p.name)}</b>${p.forms.length > 1 ? `<div class="seg sm">${p.forms.map(f => `<button data-pick="${i}" data-pf="${f}" class="${f === pk.form ? 'on' : ''}">${f}</button>`).join('')}</div>` : `<span class="muted">${p.forms[0]}</span>`}<button class="x" data-del="${i}" aria-label="移除${esc(p.name)}">✕</button></div>`; }).join('');
  const ln = z => `<p class="ln ln-${z.l}">${esc(z.t)}</p>`;
  let out = '';
  if (state.picks.length >= 2) {
    const r = check(state.picks);
    const head = [['可以一起用', 'ok'], ['可以一起用，留意提醒', 'info'], ['需要間隔或錯開', 'warn'], ['超過上限', 'no']][r.level];
    out = `<div class="result r-${head[1]}"><h2>${head[0]}</h2>${r.flags.length ? `<ul class="flags">${r.flags.map(f => `<li class="fl-${f.l}">${esc(f.t)}</li>`).join('')}</ul>` : ''}<p class="aside">以下是當天第一次使用的順序；之後補用沒有順序限制。提醒就在相關產品的下方。</p><ol class="seq">${r.steps.map(g => `<li><div class="seq-h">${STEP_NOTE[g.r] ? `<span class="tag">${STEP_NOTE[g.r]}</span>` : ''}${g.ps.length > 1 && g.r === 4 ? '<span class="tag soft">這一步不分先後</span>' : ''}</div>
      ${g.units.map(u => `<div class="unit${u.ps.length > 1 ? ' grp' : ''}">${u.ps.map(p => `<div class="it${p.over ? ' over' : ''}"><b>${esc(p.short)}${p.over ? '<em>超過上限</em>' : ''}</b><span>${p.form}</span></div>${r.notes.get(p.n).map(ln).join('')}`).join('')}${u.notes.map(ln).join('')}</div>`).join('')}
      ${g.notes.map(ln).join('')}</li>`).join('')}</ol>
      ${r.general.length ? `<div class="lbl">共通提醒</div>${r.general.map(t => ln({ l: 1, t })).join('')}` : ''}</div>`;
  } else out = `<p class="aside">加入兩個以上的產品，就會顯示順序與提醒。數量不限。</p>`;
  return `<h1 class="ptitle">這樣用搭不搭？</h1><p class="lead">放進你想一起使用的產品並選劑型，看先用哪一個、要不要間隔或錯開。</p>
    <div class="picks">${rows}</div><select id="addpick"><option value="">＋ 加入產品</option>${groups}</select>${out}
    <p class="aside">依據：各產品說明書與〈魔法產品答客問〉。個別產品的特殊提醒，以產品頁為準。</p>`;
}

// ───────── 秘方 ─────────
function recipeCard(r) {
  return `<a class="rcard" href="#${r.id}"><b>${esc(r.name)}</b><span class="pills">${r.products.map(i => `<span class="pill">${esc(byId[i]?.short || byId[i]?.name)}</span>`).join('')}</span><small>${r.tags.join('・')}</small></a>`;
}
function viewRecipes() {
  const tags = [...new Set(RECIPES.flatMap(r => r.tags))];
  const inR = [...new Set(RECIPES.flatMap(r => [...r.products, ...(r.alt || [])]))].filter(i => byId[i]);
  let list = RECIPES;
  if (state.rtag) list = list.filter(r => r.tags.includes(state.rtag));
  if (state.rprod) list = list.filter(r => r.products.includes(state.rprod) || (r.alt || []).includes(state.rprod));
  return `<h1 class="ptitle">搭配秘方</h1><p class="lead">一次用兩三種產品，達成同一個目的。</p>
    <div class="chipnav">${['', ...tags].map(t => `<button data-rtag="${t}" class="${t === state.rtag ? 'on' : ''}">${t || '全部'}</button>`).join('')}</div>
    <select id="rprod"><option value="">依產品找：全部產品</option>${inR.map(i => `<option value="${i}"${i === state.rprod ? ' selected' : ''}>${esc(byId[i].name)}</option>`).join('')}</select>
    <div class="rlist">${list.map(recipeCard).join('') || '<p class="aside">沒有符合的秘方。</p>'}</div>`;
}
function viewRecipe(id) {
  const r = RECIPES.find(x => x.id === id); if (!r) return '<p>找不到這個秘方。</p>';
  return `<div class="crumb"><a href="#recipes">搭配秘方</a> ／ ${r.tags.join('・')}</div><h1 class="ptitle">${esc(r.name)}</h1>
    <div class="pairs"><div class="lbl">使用產品</div><div class="pills">${r.products.map(i => `<a class="pill" href="#p-${i}">${esc(byId[i]?.name)}</a>`).join('')}</div></div>${steps(r.steps.map(s => ({ t: s })))}
    ${r.note ? `<div class="notice">${esc(r.note)}</div>` : ''}<p class="aside">出處：${esc(r.src)}</p>`;
}

// ───────── 搜尋 ─────────
const TOPIC_WORDS = { activate: '啟動 施咒 吹氣 咒語 常見問題 答客問', usage: '使用方式 怎麼用 用法', order: '順序 先後 搭配 一起用 24小時 間隔', moon: '月空 日食 月食', storage: '保存 期限 過期 沉澱', ingr: '成分 配方' };
function viewSearch() {
  const k = state.q.trim().toLowerCase();
  const hits = k ? PRODUCTS.filter(p => [p.name, p.en, p.series, p.cat, p.group, p.oneLine, JSON.stringify(p.ingredients || ''), JSON.stringify(p.years || '')].join(' ').toLowerCase().includes(k)) : [];
  const topics = k ? TOPICS.filter(([id, t]) => (t + TOPIC_WORDS[id]).includes(k)) : [];
  const rs = k ? RECIPES.filter(r => JSON.stringify(r).toLowerCase().includes(k)) : [];
  const kinds = k ? KIND_ORDER.filter(x => KINDS[x].name.includes(k)) : [];
  return `<form class="search inline" data-search><input name="q" type="search" value="${esc(state.q)}" placeholder="搜尋品名、女神、成分或關鍵字"><button>搜尋</button></form>
    ${k ? `<p class="lead">「${esc(state.q)}」的結果</p>` : ''}
    ${kinds.concat().map(x => `<a class="card" href="#k-${x}"><span class="card-name">${KINDS[x].name}</span><span class="card-sub">種類</span></a>`).join('')}
    ${topics.map(([id, t, s]) => `<a class="card" href="#t-${id}"><span class="card-name">${t}</span><span class="card-sub">${s}</span></a>`).join('')}
    <div class="cards">${hits.map(p => card(p.id)).join('')}</div>
    ${rs.length ? '<h3>搭配秘方</h3>' + rs.map(r => `<a class="card" href="#${r.id}"><span class="card-name">${esc(r.name)}</span><span class="card-sub">${r.products.map(x => byId[x]?.name).join('＋')}</span></a>`).join('') : ''}
    ${k && !hits.length && !topics.length && !rs.length && !kinds.length ? '<p class="aside">找不到相符的項目，換個關鍵字試試。</p>' : ''}`;
}

// ───────── 導覽：上一頁、首頁、選單 ─────────
function drawer() {
  return `<form class="search inline" data-search><input name="q" type="search" placeholder="搜尋"><button>搜尋</button></form>
    <div class="dl">種類</div>${KIND_ORDER.map(k => `<a href="#k-${k}">${KINDS[k].name}</a>`).join('')}
    <div class="dl">你想查什麼？</div>${TOPICS.map(([k, t]) => `<a href="#t-${k}">${t}</a>`).join('')}
    <div class="dl">工具</div><a href="#check">這樣用搭不搭？</a><a href="#recipes">搭配秘方</a><a href="${QA_URL}" target="_blank" rel="noopener">魔法產品答客問 ↗</a>`;
}
let depth = 0, pendingScroll = null;
function render() {
  const h = decodeURIComponent(location.hash.slice(1));
  let html;
  if (!h) html = viewHome();
  else if (h.startsWith('p-')) html = viewProduct(h.slice(2));
  else if (h.startsWith('k-')) html = viewKind(h.slice(2));
  else if (h.startsWith('t-')) html = viewTopic(h.slice(2));
  else if (h === 'check') html = viewCheck();
  else if (h === 'recipes') html = viewRecipes();
  else if (h.startsWith('r-')) html = viewRecipe(h);
  else if (h === 'search') html = viewSearch();
  else html = viewHome();
  $('#main').innerHTML = html;
  $('#back').hidden = !h;
  $('#drawer').classList.remove('open');
  if (pendingScroll) { const el = document.getElementById(pendingScroll); pendingScroll = null; if (el) { el.scrollIntoView(); return; } }
  window.scrollTo(0, 0);
}
function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }
document.addEventListener('click', e => {
  const t = e.target.closest('button,a'); if (!t) return;
  const hash = decodeURIComponent(location.hash.slice(1)), pid = hash.startsWith('p-') ? hash.slice(2) : null;
  if (t.id === 'back') { if (depth > 0) history.back(); else location.hash = ''; return; }
  if (t.id === 'menu') { $('#drawer').classList.toggle('open'); return; }
  if (t.dataset.form && pid) { state.form[pid] = t.dataset.form; rerender(); }
  else if (t.dataset.year && pid) { state.year[pid] = t.dataset.year; rerender(); }
  else if (t.dataset.tab && pid) { state.tab[pid] = t.dataset.tab; render(); document.querySelector('.tabs').scrollIntoView({ block: 'start' }); }
  else if (t.dataset.pf) { state.picks[+t.dataset.pick].form = t.dataset.pf; rerender(); }
  else if (t.dataset.del) { state.picks.splice(+t.dataset.del, 1); rerender(); }
  else if (t.dataset.q) { state.q = t.dataset.q; if (hash === 'search') { e.preventDefault(); render(); } }
  else if (t.dataset.ing) { state.ing = t.dataset.ing; if (hash === 't-ingr') { e.preventDefault(); render(); } }
  else if (t.dataset.copy) { const done = () => { const c = t.parentNode.querySelector('.copied'); if (c) c.hidden = false; }; try { navigator.clipboard.writeText(t.dataset.copy).then(done, () => { t.textContent = t.dataset.copy; }); } catch (err) { t.textContent = t.dataset.copy; } }
  else if (t.dataset.mon) { state.mon = t.dataset.mon; rerender(); }
  else if (t.dataset.merc) { state.merc = t.dataset.merc; rerender(); }
  else if (t.dataset.rtag !== undefined) { state.rtag = t.dataset.rtag; rerender(); }
  else if (t.dataset.setform) { const id = t.getAttribute('href').slice(3); state.form[id] = t.dataset.setform; state.tab[id] = 'info'; }
  if (t.dataset.addcheck) { const id = t.dataset.addcheck; if (!state.picks.some(x => x.id === id)) state.picks.push({ id, form: state.form[id] || byId[id].forms[0] }); }
  if (t.dataset.scroll) {
    if (t.tagName === 'BUTTON') { const el = document.getElementById(t.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    else pendingScroll = t.dataset.scroll;
  }
});
document.addEventListener('change', e => { if (e.target.id === 'ingsel') { if (e.target.value) { state.ing = e.target.value; render(); } return; } if (e.target.classList.contains('lk-sel')) { const box = e.target.closest('.lookup'); box.querySelector('.lk-out').innerHTML = e.target.value ? lookupResult(e.target.value) : ''; return; } if (e.target.id === 'rprod') { state.rprod = e.target.value; rerender(); return; } if (e.target.id === 'addpick' && e.target.value) { const id = e.target.value; state.picks.push({ id, form: byId[id].forms[0] }); rerender(); } });
document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (f.dataset.search !== undefined) { state.q = f.q.value; if (location.hash === '#search') render(); else location.hash = 'search'; }
  if (f.dataset.ing !== undefined) { state.ing = f.q.value; render(); }
});
window.addEventListener('hashchange', () => { depth++; render(); });
window.addEventListener('popstate', () => { depth = Math.max(0, depth - 2); });
render();
