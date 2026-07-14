# `src/` — 建置頁面的可組合來源檔案

> [English](README.md) · **繁體中文**

已發布的頁面（`../index.html` 與 `../index.zh.html`）是由 `../build.mjs` 從本
目錄底下的小型檔案**產生**而來。請編輯這些檔案，而非產生出來的頁面，然後在儲存
庫根目錄執行 `npm run build`（或 `node build.mjs`）以重新產生它們。CSS 與 JS 會
在建置時內嵌，因此每個輸出檔案都維持為單一、無相依套件的檔案，可直接從磁碟開
啟。

一次建置會產生**兩個頁面**：`index.html`（英文）與 `index.zh.html`（繁體中
文）。演講筆記與分類卡片在*每一種*語言中皆以 **Markdown** 撰寫，並渲染成與語言
無關的外殼（shell）；任何未翻譯的內容都會回退為英文。

> 初次接觸？Markdown 格式，以及逐步的「新增演講」／「翻譯」說明，請見
> [`../CONTRIBUTING.zh-TW.md`](../CONTRIBUTING.zh-TW.md)。

## 版面配置

| 路徑 | 內容 |
|------|----------|
| `head.html` | `<!doctype>` 到 `<title>` 為止。建置流程會針對每個語系注入 `<html lang>`、`<title>`，以及一段微型的語言偵測／轉址腳本。 |
| `styles.css` | 所有頁面樣式（由建置流程內嵌進一個 `<style>` 區塊）。 |
| `partials/hero.html` | 主視覺（hero）標頭（在 GitHub 連結上方帶有一個 `<!-- lang-toggle -->` 佔位符）。 |
| `partials/lang-toggle.html` | 共用的 `EN | 中文` 切換按鈕，會接合進兩個主視覺標頭中。 |
| `partials/nav.html` | 置頂固定的目錄導覽列。 |
| `partials/footer.html` | 「方法與佐證（Method & Evidence）」頁尾。 |
| `sections/overview.html` | 分類分布總覽（HTML）。 |
| `sections/themes.html` | 9 項跨主題洞察，帶有行內 `#doc-N` 引用連結（HTML）。 |
| `sections/cat-A.md` … `cat-I.md` | **英文**卡片來源：結構 frontmatter（`color`、有序的 `docs`）＋ 每張卡片的標題／講者／摘要。 |
| `notes/shell.html` | 所有筆記共同渲染進去的單一燈箱**外殼**。 |
| `notes/doc-1.md` … `doc-99.md` | **英文**筆記來源（frontmatter 的 title／speaker／video ＋ Markdown 內文）。 |
| `notes/order.json` | 筆記燈箱輸出的順序。 |
| `scripts/modal.js` | 以網址 hash 驅動的燈箱開關，以及 Esc 鍵處理。 |
| `scripts/reading-progress.js` | 各演講的「已完成」按鈕與閱讀進度條。 |
| `scripts/notes.js` | 選取或點按即可儲存的醒目標示，以及「Your Notes」區塊。 |
| `scripts/nav-scrollspy.js` | 捲動時醒目標示目前作用中的導覽連結。 |
| `scripts/lang.js` | 語言切換行為（標記目前作用中的選項；點擊時儲存選擇，並帶著目前的 `#hash` 進行導覽）。 |
| `i18n/<locale>/` | 各語系的翻譯（見下文）。 |

`reading-progress.js` 與 `notes.js` 會在執行期建立自己的 UI；它們面向使用者的字
串放在以 `window.__PAGE_LANG__` 為鍵的 `T[lang]` 表中，因此注入的 UI 也會在地
化。`modal.js` 與 `nav-scrollspy.js` 不會注入任何文字。

## 內容處理流程

`build.mjs` 透過一套小型、零相依套件的處理流程，將內容渲染進外殼中：

- `renderMarkdown` —— 段落、`1.`／`-` 清單（保留 `<ol start>` 的接續編號）、
  `**粗體**`，以及以 `\` 結尾的強制斷行。
- `parseFrontmatter` —— 將以 `---` 圍住的 `key: value` 區塊從內文中分離出來。
- `assembleNote(locale, id)` —— 以某語系的 Markdown（`title`／`speaker`／內文）
  ＋ `LABELS[locale]` 填入 `notes/shell.html`；`video` 取自英文筆記。
- `assembleSection(locale, key)` —— 從英文 `cat-<key>.md` 的 frontmatter（`color`、
  `docs`）與 `##` 卡片區塊產生一個分類 `<section>`；卡片文字以該語系的
  `cat-<key>.md` 覆蓋，每張卡片的影片則讀自其 `notes/doc-N.md`。

## 國際化（`i18n/`）

英文內容位於 `src/` 底下（`notes/doc-*.md`、`sections/cat-*.md`）；翻譯則以相同
結構鏡射於 `src/i18n/<locale>/` 底下。以 `src/i18n/zh/` 為例：

| 路徑 | 格式 | 說明 |
|------|--------|-------|
| `meta.json` | JSON | `{ "title": "…" }` —— 頁面的 `<title>`。 |
| `notes/doc-*.md` | Markdown | frontmatter 的 `title` ＋ `speaker`，接著是以 Markdown 撰寫的內文。（`video` 繼承自英文筆記。） |
| `sections/cat-*.md` | 純文字 | frontmatter 的 `heading` ＋ `desc`，接著每張卡片一個 `## <卡片標題>`／`@ <講者>`／摘要區塊，順序與數量須與卡片一致。 |
| `partials/{hero,nav,footer}.html`、`sections/{overview,themes}.html` | HTML 對照 | 結構相同的完整 HTML 複本（SVG、數據、行內引用連結無法簡化為純文字）。只翻譯可見文字；切勿更動 `id`／`class`／`href`／SVG 資料。 |

`node tools/i18n-check.mjs`（僅供開發使用，位於 `../tools/`）會比對兩個建置後頁
面的 `id`／`href`／SVG／外殼結構是否一致，回報翻譯涵蓋率，並標記出未翻譯的文
字，或因缺少 frontmatter 欄位而產生的字面 `undefined`。每次建置後都應執行它。

## 新增演講／語言

完整步驟請見 [`../CONTRIBUTING.zh-TW.md`](../CONTRIBUTING.zh-TW.md)。簡而言之：新
增 `notes/doc-<N>.md`，將其 id 附加至 `notes/order.json`，把該 doc-id 加入
`sections/cat-<K>.md` 的 `docs:` 清單並新增一個 `##` 區塊，然後執行
`npm run build && node tools/i18n-check.mjs`。
