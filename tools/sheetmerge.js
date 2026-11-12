// 把 Google Sheet「產品」分頁的內容套用到 PRODUCTS 上。
// 瀏覽器與 Node 共用：applySheet(PRODUCTS, SERIES, rows) → 回傳新的 PRODUCTS 陣列；有錯誤時丟出中文訊息。
// rows：第一列為標題，其餘為資料（字串二維陣列）。欄位以「標題名稱」對應，欄位順序可以自由調整。
(function (root) {
  const FORMS = ['油', '噴霧', '香粉', '香包', '蠟燭'];
  const lines = v => v.split('\n').map(s => s.trim()).filter(Boolean);
  const byForm = (v, asList) => {
    const out = {}; let cur = null;
    v.split('\n').forEach(raw => {
      const s = raw.trim(); if (!s) return;
      const m = s.match(/^(油|噴霧|香粉|香包|蠟燭)\s*[：:]\s*(.*)$/);
      if (m) { cur = m[1]; out[cur] = asList ? (m[2] ? [m[2]] : []) : m[2]; }
      else if (cur) { if (asList) out[cur].push(s); else out[cur] += (out[cur] ? '｜' : '') + s; }
      else throw new Error(`開頭要先寫劑型，例如「油：」`);
    });
    return out;
  };
  // 標題 → [欄位名稱, 解析方式]
  const COLS = {
    '品名': ['name', 'str'], '英文名': ['en', 'str'], '種類／系列': ['series', 'str'], '系列顯示名': ['seriesName', 'str'],
    '女神分組': ['group', 'str'], '香粉香包蠟燭種類': ['cat', 'str'], '劑型': ['forms', 'forms'], '新品': ['isNew', 'bool'],
    '一句話介紹': ['oneLine', 'str'], '神諭': ['oracle', 'str'], '主要功能': ['func', 'str'], '使用時機': ['timing', 'str'],
    '推薦對象': ['recommend', 'str'], '觀想畫面': ['visual', 'str'], '女神顏色': ['color', 'str'], '啟動咒語': ['spell', 'list'],
    '祈禱文／咒語': ['prayer', 'list'], '許願示範': ['example', 'str'], '日常使用（覆蓋）': ['usage', 'formList'],
    '例外規則': ['exceptions', 'list'], '其他注意事項': ['extraNotes', 'list'], '隱藏技能': ['tips', 'tips'],
    '建議搭配': ['suggest', 'ids'], '適合搭配': ['pairWith', 'ids'], '成分': ['ingredients', 'formStr'], '規格': ['specs', 'str'],
    'PDF': ['pdf', 'str'], '影片': ['videos', 'videos'], '蠟燭加油規則': ['oilRule', 'str'], '搭配說明': ['pairNote', 'str'],
    '不必避月空': ['moonFree', 'bool'], '部落格連結': ['blog', 'str']
  };
  function applySheet(PRODUCTS, SERIES, rows) {
    const head = rows[0].map(h => String(h).trim());
    const ci = h => head.indexOf(h);
    if (ci('代號') < 0) throw new Error('「產品」分頁找不到「代號」欄。');
    const base = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
    const nameToId = {}; rows.slice(1).forEach(r => { const id = String(r[ci('代號')] || '').trim(), n = String(r[ci('品名')] || '').trim(); if (id && n) { nameToId[n] = id; nameToId[n.split('．')[0]] = id; } });
    PRODUCTS.forEach(p => { nameToId[p.name] = nameToId[p.name] || p.id; nameToId[p.name.split('．')[0]] = nameToId[p.name.split('．')[0]] || p.id; });
    const errs = [], out = [], seen = {};
    const parse = (type, v, where) => {
      v = String(v ?? '').replace(/\r/g, '').trim();
      if (!v) return undefined;
      switch (type) {
        case 'str': return v;
        case 'bool': return v === '是' || v === 'TRUE' || v === 'true' ? true : undefined;
        case 'list': return lines(v);
        case 'forms': return v.split(/[／/、,，]/).map(s => s.trim()).filter(Boolean);
        case 'formList': return byForm(v, true);
        case 'formStr': return byForm(v, false);
        case 'tips': return lines(v).map(s => { const i = s.indexOf('：'); return i < 0 ? { t: s, b: '' } : { t: s.slice(0, i), b: s.slice(i + 1) }; });
        case 'ids': return lines(v.replace(/[、，,]/g, '\n')).map(n => { const id = base[n] ? n : nameToId[n]; if (!id) errs.push(`${where}：找不到產品「${n}」`); return id; }).filter(Boolean);
        case 'videos': return lines(v).map(s => { const [at, yt, ...t] = s.split('｜'); return { at: at.trim(), yt: yt.trim(), title: t.join('｜').trim() }; });
      }
    };
    rows.slice(1).forEach((r, i) => {
      const id = String(r[ci('代號')] || '').trim(); if (!id) return;
      const year = ci('年份') >= 0 ? String(r[ci('年份')] || '').trim() : '';
      const where = `第 ${i + 2} 列（${id}${year ? ' ' + year : ''}）`;
      const vals = {};
      for (const h in COLS) {
        if (ci(h) < 0) continue;
        const [k, type] = COLS[h];
        try { vals[k] = parse(type, r[ci(h)], where + '「' + h + '」'); } catch (e) { errs.push(`${where}「${h}」：${e.message}`); }
      }
      if (!vals.name) errs.push(`${where}：品名不能空白`);
      if (vals.series && !SERIES[vals.series]) errs.push(`${where}：種類／系列「${vals.series}」不存在`);
      if (!vals.forms || !vals.forms.length) errs.push(`${where}：劑型不能空白`);
      else vals.forms.forEach(f => { if (!FORMS.includes(f)) errs.push(`${where}：劑型「${f}」不認得（可用：${FORMS.join('、')}）`); });
      const b = base[id];
      // 舊資料裡用 spellOpt／suggestNote 的，維持原欄位
      if (b && b.spellOpt && !b.prayer) { vals.spellOpt = vals.prayer; delete vals.prayer; }
      if (b && b.suggestNote && !b.pairNote) { vals.suggestNote = vals.pairNote; delete vals.pairNote; }
      let p = seen[id];
      if (!p) { p = seen[id] = { ...(b ? JSON.parse(JSON.stringify(b)) : { id }) }; if (year) p.years = p.years || {}; out.push(p); }
      if (!year) {
        for (const k in vals) { if (vals[k] === undefined) delete p[k]; else p[k] = vals[k]; }
      } else {
        const by = (b && b.years && b.years[year]) || {}, y = p.years[year] = p.years[year] || {};
        if (!p.name) Object.assign(p, { name: vals.name, series: vals.series, forms: vals.forms });
        const PL = ['name', 'en', 'series', 'seriesName', 'group', 'cat', 'blog', 'isNew'];
        for (const k in vals) {
          const v = vals[k];
          if (PL.includes(k) && !(k in by)) { if (v === undefined) delete p[k]; else p[k] = v; continue; }
          if (k in by) { y[k] = v; continue; }                       // 這一年原本就有的欄位：以表格為準（空白＝這一年不用）
          if (JSON.stringify(v) !== JSON.stringify(p[k])) y[k] = v;  // 和產品共通內容不同：存成這一年的專屬內容
        }
      }
    });
    if (errs.length) throw new Error('Google Sheet 有 ' + errs.length + ' 個地方要修正：\n- ' + errs.join('\n- '));
    if (out.length < 10) throw new Error('「產品」分頁讀到的產品太少（' + out.length + ' 個），為了安全先不更新。');
    return out;
  }
  if (typeof module !== 'undefined') module.exports = { applySheet };
  else root.applySheet = applySheet;
})(this);
