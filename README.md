# 視界物所 — 互動式 3D 展示

以 Three.js 建立的靜態網頁，內含以程式產生的原創幾何雕塑。支援滑鼠及觸控拖曳旋轉、雙指／滾輪縮放、方向及縮放按鈕、鍵盤操作、重設與手動開啟自動旋轉。

## 本機執行

需求：Node.js 符合 Vite 8 的版本要求（`^20.19.0 || >=22.12.0`）。

```sh
npm install
npm run dev
```

執行 `npm test` 測試，`npm run build` 建置。GitHub Actions 會建置並部署到 GitHub Pages。模型需瀏覽器支援 WebGL；觸控時請從模型畫布外捲動頁面。字型使用 Google Fonts，無網路時使用後備字型。
