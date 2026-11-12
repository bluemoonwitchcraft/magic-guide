const J=v=>v==null?'':Array.isArray(v)?v.join('\n'):typeof v==='object'?Object.entries(v).map(([k,x])=>`${k}：${Array.isArray(x)?x.join('\n'):x}`).join('\n\n'):String(v);
const out={};const N=id=>(PRODUCTS.find(p=>p.id===id)||{name:id}).name;
out['使用模式']=[['代號','名稱','簡稱','說明','標籤','啟動標題','啟動副標','啟動提醒','啟動步驟','咒語標籤','啟動備註','日常使用標題','預設日常使用','注意事項','小技巧','保存方式','使用期限'],
 ...Object.entries(MODES).map(([k,m])=>[k,m.name,m.short,m.desc,J(m.badges.map(b=>b[0])),m.activationTitle||'',m.activationSub||'',m.activationAlert||'',J(m.activationSteps),m.spellLabel||'',m.activationNote||'',m.usageTitle||'',J(m.usage),J(m.notes),J((m.tips||[]).map(t=>t.t+'：'+t.b)),m.storage||'',m.expiry||''])];
out['種類系列']=[['種類／系列','使用模式','類型','介紹','同類如何錯開','避開日月食','無同類規則','每次使用標題','每次使用副標','每次使用步驟','祈禱文標籤','重要提醒','注意事項','保存方式','使用期限','PDF'],
 ...Object.entries(SERIES).map(([k,s])=>[k,s.mode,s.kind,s.intro||'',J(s.sameTarget),s.eclipse?'是':'',s.noSameRule?'是':'',s.useTitle||'',s.useSub||'',J(s.useSteps),s.prayerLabel||'',J(s.keyNotes),J(s.notes),s.storage||'',s.expiry||'',s.pdf||''])];
out['產品']=[['代號','品名','英文名','種類／系列','系列顯示名','女神分組','香粉香包蠟燭種類','劑型','年份','新品','一句話介紹','神諭','主要功能','使用時機','推薦對象','觀想畫面','女神顏色','啟動咒語','祈禱文／咒語','許願示範','日常使用（覆蓋）','蠟燭兩種用法（唯讀）','例外規則','隱藏技能','建議搭配','適合搭配','成分','規格','PDF','影片','蠟燭加油規則','搭配說明','不必避月空','年份特殊用法（唯讀）','部落格連結','其他注意事項']];
for(const p of PRODUCTS){
  const rows=p.years?Object.entries(p.years).map(([y,d])=>({...p,...d,year:y})):[{...p,year:''}];
  for(const x of rows) out['產品'].push([p.id,p.name,p.en||'',p.series,x.seriesName||'',x.group||'',x.cat||'',(x.forms||p.forms).join('／'),x.year,p.isNew?'是':'',x.oneLine||'',x.oracle||'',x.func||'',x.timing||'',x.recommend||'',x.visual||'',x.color||'',J(x.spell),J(x.prayer||x.spellOpt),x.example||'',J(x.usage),J((x.candleModes||[]).map(c=>c.t+'：'+c.b+(c.say?'｜念誦：'+c.say.join(' '):'')+(c.wishes?'｜'+c.wishes.map(w=>`${w.w}：${w.oils.map(i=>PRODUCTS.find(p=>p.id===i).name).join('／')}（${w.say}）`).join('｜'):''))),J(x.exceptions),J((x.tips||[]).map(t=>t.t+'：'+t.b)),J((x.suggest||[]).map(N)),J((x.pairWith||[]).map(N)),J(x.ingredients),x.specs||'',x.pdf||'',J((x.videos||[]).map(v=>`${v.at}｜${v.yt}｜${v.title}`)),x.oilRule||'',x.pairNote||x.suggestNote||'',x.moonFree?'是':'',x.year&&p.years[x.year].kind==='goddess'?`以女神聖化方式使用（${p.years[x.year].short||''}）`:'',x.blog||'',J(x.extraNotes)]);
}
out['搭配秘方']=[['代號','名稱','情境標籤','使用產品代號','替代產品代號','步驟','注意','出處'],...RECIPES.map(r=>[r.id,r.name,r.tags.join('、'),r.products.join('、'),(r.alt||[]).join('、'),J(r.steps),r.note||'',r.src])];
out['併用規則']=[['規則','內容','來源','程式處理'],
['使用順序','禱告的祭酒 → 其他女神聖化（含東方七女神）→ 黃金龍氣 → 其他所有產品；只有當天第一次使用要注意順序','答客問、如何使用','rank()'],
['女神每日上限','一天建議一種（同一種可重複用）；緊急時 24 小時內最多三種；禱告的祭酒不計','各女神說明書','goddesses.length'],
['女神之後','用完女神可立即用其他產品，無須間隔，避開同一處即可','各女神說明書','固定文字'],
['同種類願望型油','同種類魔法油不可同時使用在同一對象上，須錯開使用對象或間隔 24 小時；噴霧或不同種類無此限制','各類說明書','同 cat、皆為油、非 noSameRule'],
['噴霧例外','噴霧與油路徑不同，同種類也可同時使用；不同噴霧錯開位置或間隔 10 分鐘','答客問','任一為噴霧'],
['不同種類願望型','可同時使用；不要用在同一處，同一處至少間隔 10 分鐘','答客問','預設'],
['能量補充、星光行運','可與任何魔法油同時使用；可與一種願望型油同時滴入無香蠟燭','答客問','預設'],
['香粉','與油／噴霧可同時使用，建議先用香粉；不同香粉可同時用但不混合','答客問、香粉說明書','任一為香粉'],
['蠟燭','一個蠟燭只用一種願望型油，可加一種季節油或月神之箭；女神油蠟燭不可再滴其他油；噴霧不可加入蠟燭','答客問、各說明書','任一為蠟燭'],
['產品例外','決別之刃前後與其他願望型間隔 2 小時；光明火焰可與豐盛生活類同時使用','各說明書','SPECIAL.blade；產品 exceptions 欄']];
out['說明']=[['這份試算表是「青月魔法使用手冊」App 的資料來源，分三層：使用模式 → 種類／系列 → 產品。'],['產品只填自己獨有的欄位；空白的欄位會自動從種類與使用模式繼承。'],['同一儲存格多行內容用換行分隔（Alt+Enter）。成分欄用「油：…」「噴霧：…」分段，中間空一行。'],['季節魔法油、星光行運每個年份一列，代號相同、年份欄不同。'],['代號一旦印上說明書 QR Code 就不可更改。'],['涉及身體的用法（塗抹身上、皮膚、乳液、泡澡）一律改為「使用於需要之處」。'],['搭配秘方的「使用產品代號」用頓號分隔，對應「產品」分頁的代號欄。'],['更新流程：改這份表 → 通知 Claude → 重新發布 App。']];
fs.writeFileSync('sheet.json',JSON.stringify(out));
for(const k in out) console.log(k,out[k].length,'rows',out[k][0].length,'cols');
