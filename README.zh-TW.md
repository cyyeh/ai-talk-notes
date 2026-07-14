# AI 工程演講 — 分類與精華整理

> [English](README.md) · **繁體中文**

本專案有系統地整理了 **99 篇 AI 工程領域的研討會與 YouTube 演講筆記**，依 **9
大主題分類**歸類，並濃縮成簡短、易讀的重點摘要——另外還提煉出橫跨全部語料庫的
**9 項跨主題洞察**。

發布的頁面是一個**單一、自成一體的 `index.html`**——不需伺服器、沒有外部相依套
件，用瀏覽器打開即可。此檔案現在是透過一支小型建置腳本
（[`build.mjs`](build.mjs)）從 [`src/`](src/) 底下**小型、可組合的來源檔案**
產生出來的，因此你編輯的是聚焦的局部檔案，而非單一 44k 行的龐大檔案。CSS 與
JS 會在建置時內嵌，讓輸出檔案不需任何相依套件。

本站同時提供**英文與繁體中文**版本。語言切換按鈕（`EN | 中文`）位於「*View
source on GitHub*」按鈕正上方；首次造訪時會依照瀏覽器語言設定（任何 `zh*` 偏
好 → 中文，否則為英文），之後你的選擇會被記住。建置流程會產生兩個自成一體的頁
面——`index.html`（英文）與 `index.zh.html`（繁體中文）——切換按鈕會在兩者間切
換，同時保留你在頁面上的位置。

## 亮點

- **99 場演講**濃縮為簡短的重點摘要。
- **9 大主題分類**（A–I），並附分類分布總覽。
- 橫跨全部演講整理出的 **9 項跨主題洞察**。
- **每則摘要皆附雙重佐證：**
  - 點擊演講標題（或 **📄 Full notes** 按鈕）即可展開完整原始筆記，直接嵌入頁
    面中。
  - 透過 **▶ Source video** 連結回原始 YouTube 演講影片。
- **個人筆記** ——在演講的完整筆記中選取一句話（在手機上則是點選一句話，再次
  點選可延伸涵蓋更多句子），選擇 **★ Save as note** 即可將其標記起來。已儲存
  的筆記會集中收錄在依演講分組的 **Your Notes** 區塊中，並保存於你的瀏覽器
  裡。
- **完全自成一體的輸出** ——所有筆記都會被渲染並嵌入，因此發布的 `index.html`
  不依賴任何外部檔案或網路連線。
- **可組合的來源檔案** ——頁面由小型局部檔案（`src/`）建置而成，因此無需改動
  單一巨型檔案即可輕鬆編輯與擴充。

## 分類

| # | 分類 | 演講數 |
|---|----------|:-----:|
| A | BI / 分析 / 語意層 | 11 |
| B | Agent 評估與可觀測性 | 15 |
| C | Agent 架構、可靠性與上線部署 | 12 |
| D | Agent 安全與身分 | 6 |
| E | 上下文 / 記憶 / RAG | 11 |
| F | 資料基礎設施 | 14 |
| G | 模型訓練與推論 | 15 |
| H | AI 輔助開發與 AI 原生工程 | 9 |
| I | 產品策略與商業 | 6 |

每場演講皆歸入單一主要主題。

## 跨主題洞察

1. 語意層正被重新定義——從 BI 工具下沉，成為「Agent 所消費的上下文」。
2. 可靠 text-to-SQL 的關鍵在於扎根（grounding）與資料建模，而非更大的模型。
3. 評測正從「憑直覺」走向資料驅動的工程。
4. 從 PoC 到正式上線：可靠性是系統工程問題，而非模型問題。
5. 上下文工程與記憶決定了 Agent 是否使用正確的資料。
6. 資料基礎設施正為 AI／Agent 而重塑。
7. 安全與身分是 Agent 存取企業資料的前提條件。
8. BI 的未來與產品資料飛輪。
9. 小型、專精的模型／Agent 勝過龐大且通用的模型。

## 使用方式

在任何現代瀏覽器中開啟已發布的頁面：

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# or serve it locally
python3 -m http.server
# then visit http://localhost:8000
```

## 專案結構

```
index.html        # generated English page, self-contained (commit it)
index.zh.html     # generated Traditional Chinese page (commit it)
build.mjs         # renders src/* into both pages (inlines CSS + JS)
package.json      # `npm run build`
tools/            # i18n-check.mjs — dev-only structure checker (not shipped)
src/
  head.html       # document head (minus styles)
  styles.css      # all page styles
  partials/       # hero, nav, footer, lang-toggle
  sections/       # overview.html, themes.html; cat-*.html shells + cat-*.md (English text)
  notes/          # shell.html + doc-*.md (English notes) + order.json
  scripts/        # modal, reading-progress, notes, nav-scrollspy, lang
  i18n/zh/        # Traditional Chinese content (notes/*.md, sections/cat-*.md, HTML mirrors)
```

所有演講筆記與分類卡片都是以 **Markdown** 撰寫，並渲染成與語言無關的外殼
（shell）；完整版面配置請見 [`src/README.md`](src/README.md)，如何新增或翻譯
內容請見 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 開發

`index.html` 是建置產物——請改為編輯 `src/` 底下的檔案，然後重新產生：

```bash
npm run build   # or: node build.mjs
```

建置流程只做串接、內嵌與渲染（無需安裝任何相依套件），且結果可重現。需要
Node.js。執行一次即可同時產生 `index.html` 與 `index.zh.html`。

**所有內容皆以 Markdown 撰寫。** 演講筆記（`notes/doc-*.md`）與分類卡片
（`sections/cat-*.md`）都是以 Markdown／純文字撰寫，並渲染成與語言無關的外
殼——英文版位於 `src/`，各語言翻譯則位於 `src/i18n/<locale>/`。尚未翻譯的部
分會回退（fallback）為英文。建置完成後，執行 `node tools/i18n-check.mjs` 以驗
證兩個頁面在結構上維持一致。

## 貢獻

歡迎貢獻——包含新增演講、修正錯誤與翻譯。所有內容皆以 Markdown 撰寫，一次建
置即可同時渲染兩個語言頁面。內容模型、Markdown 格式、如何新增演講，以及如何
新增或改善翻譯，請見 **[`CONTRIBUTING.md`](CONTRIBUTING.md)**
（[繁體中文](CONTRIBUTING.zh-TW.md)）。

## 方法與佐證

- **資料來源：** 全部 99 篇 Markdown 演講筆記，皆完整渲染並嵌入建置後的頁面中
  （不依賴外部 `.md` 檔案）。
- **雙重佐證：** 每則摘要皆同時連結至完整原始筆記（可於頁面內展開）與來源
  YouTube 影片。
- **分類方式：** 每場演講在 9 大分類（A–I）中歸入單一主要主題；每項洞察皆取
  材自完整語料庫。

## 授權

採用 [MIT 授權](LICENSE) 釋出。© 2026 cyyeh。
