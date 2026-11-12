# 青月魔法使用手冊

網址：https://guide.seerhuang.blog

## 更新內容
1. 修改 Google Sheet「產品」分頁。
2. 到本專案的 **Actions → 更新手冊 → Run workflow**。
3. 一兩分鐘後網站更新；手冊首頁最下方會顯示「資料更新」時間。

如果 Sheet 有寫錯，該次更新會停下來（網站維持舊版），Actions 頁面的紅色 ✖ 會列出要修正的列與欄位。

## 專案結構
- `src/`：網頁外框（shell.html）、程式（app.js）、基本資料（data.js、extra.js）、圖示
- `brand/`：品牌圖檔
- `tools/build.js`：讀 Sheet → 檢查 → 產生 `dist/`
- `tools/sheetmerge.js`：把 Sheet 內容套用到產品資料
- `.github/workflows/deploy.yml`：「更新手冊」按鈕
