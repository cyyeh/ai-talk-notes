# 貢獻指南

> [English](CONTRIBUTING.md) · **繁體中文**

感謝你有興趣協助改善 **AI 工程演講 — 分類與精華整理**！新增演講、修正錯誤與
翻譯都非常歡迎。本指南說明本站的建置方式，以及如何新增或翻譯內容。

## 運作方式

兩個已發布的頁面——`index.html`（英文）與 `index.zh.html`（繁體中文）——皆由
[`build.mjs`](build.mjs) 從 [`src/`](src/) 底下的小型來源檔案**產生**。CSS
與 JS 皆會內嵌，因此每個頁面都是單一、無相依套件的檔案，可直接從磁碟開啟。

**所有演講內容皆以 Markdown 撰寫**，各語言皆然。建置流程會將這些 Markdown 渲
染成與語言無關的 HTML：

- **筆記** —— `src/notes/shell.html`（燈箱外殼）＋ `src/notes/doc-*.md`
  （英文）＋ `src/i18n/<locale>/notes/doc-*.md`（翻譯）。
- **分類卡片** —— `src/sections/cat-*.md`（英文：`color` ＋ `docs` 結構與卡片
  文字）＋ `src/i18n/<locale>/sections/cat-*.md`（翻譯後的卡片文字）。
- **外框元件／總覽／主題** —— 皆為小型 HTML 檔案（`src/partials/*.html`、
  `src/sections/overview.html`、`src/sections/themes.html`），因為它們包含
  SVG、數據區塊，以及無法簡化為純文字的行內引用連結；其翻譯為
  `src/i18n/<locale>/` 底下的完整 HTML 對照版本。

沒有翻譯的內容一律**回退為英文**，因此提交部分翻譯永遠是安全的。

## 建置與檢查

```bash
npm run build              # or: node build.mjs — emits index.html + index.zh.html
node tools/i18n-check.mjs  # verify the two pages stay structurally identical
```

`i18n-check.mjs` 會比對兩個建置後頁面的 `id`／`href`／SVG 結構與外殼數量是否
一致，回報翻譯涵蓋率，並標記出任何未翻譯的文字，或因缺少 frontmatter 欄位而
出現的字面 `undefined`。執行結果應以 `0` 結束，且不應出現任何 `FAIL` 訊息。
需要 Node.js；無需安裝任何套件。

## Markdown 格式

### 演講筆記 — `doc-<N>.md`

```markdown
---
title: The talk's title
speaker: Speaker Name, Company
video: https://youtu.be/XXXXXXXX
---
The first paragraph of the notes.

A second paragraph. Use a blank line between paragraphs.

1. An ordered list item
2. Another — numbers continue across interruptions if you keep numbering
   (e.g. write `3.` for a list that resumes after a paragraph)

- A bullet
- Another bullet

Use **bold** where needed. End a line with a backslash \
to force a hard line break inside a paragraph.
```

- `title`、`speaker` 與 `video` 皆為必填欄位（缺少欄位會渲染出字面文字
  `undefined`，並會被檢查工具標記出來）。
- `video` 與語言無關：只有**英文版**的 `doc-<N>.md` 需要填寫此欄位；翻譯版本
  會繼承此值。

### 分類區塊 — `cat-<K>.md`

```markdown
---
heading: Category name (no letter prefix)
desc: One-sentence description of the category.
color: #2563eb
docs: 12, 34
---
## Card 1 talk title
@ Speaker, Company
One-paragraph summary of the talk.

## Card 2 talk title
@ Speaker
Another summary.
```

`##` 區塊會**依序**對應到該分類的卡片，而 `docs` 以相同順序列出每張卡片的演講
id——因此 `docs` 與 `##` 區塊的數量必須一致。`color` 是該分類的主題色。其餘內容
（卡片 id、`#NN` 編號、`#doc-N` 連結、來源影片 URL、演講計數）皆為自動衍生——
影片取自每張卡片的 `notes/doc-N.md`。

## 新增一場演講

1. **筆記** —— 建立 `src/notes/doc-<N>.md`（格式如上），`<N>` 為下一個可用
   的編號。
2. **順序** —— 將 `"doc-<N>"` 附加至 `src/notes/order.json`。
3. **卡片** —— 在對應的 `src/sections/cat-<K>.md` 中，將 `<N>` 加入 `docs:`
   清單，並在相同位置新增一個 `## title / @ speaker / summary` 區塊。（卡片
   id、`#NN` 編號、`#doc-N` 連結與來源影片 URL 皆為自動衍生——影片讀自你剛
   建立的那篇筆記。）
4. **（選用）翻譯** —— 新增 `src/i18n/zh/notes/doc-<N>.md`，並在
   `src/i18n/zh/sections/cat-<K>.md` 中新增對應的卡片區塊。
5. **建置與檢查** —— 執行 `npm run build && node tools/i18n-check.mjs`。

## 翻譯內容

翻譯僅涉及文字內容。若要將既有演講翻譯成既有語系（例如 `zh`）：

1. 新增 `src/i18n/zh/notes/doc-<N>.md`——格式與英文筆記相同，但 frontmatter
   只需填寫 `title` + `speaker`（`video` 會被繼承）。請將內文翻譯為**繁體中
   文（台灣用語，zh-Hant）**。
2. 翻譯 `src/i18n/zh/sections/cat-<K>.md` 中的卡片內容（`##` 區塊的位置／順
   序須與英文版卡片相同）。
3. 講者／公司／產品名稱以及慣用術語（RAG、LLM、MCP、Claude Code……）在自然
   的情況下應保持原樣；HTML 對照檔案中的 `id`／`href`／結構絕不可更動。
4. 執行 `npm run build && node tools/i18n-check.mjs`，接著開啟
   `index.zh.html` 進行抽查。

### 新增語言

Markdown／文字處理流程與語系無關，但全新語言仍需要一些額外的接線（wiring）
變更：

1. 建立 `src/i18n/<locale>/`，比照 `zh/` 的結構：`meta.json`（頁面
   `<title>`）、`notes/doc-*.md`、`sections/cat-*.md`，以及
   `partials/*.html`、`sections/overview.html`、`sections/themes.html` 的
   HTML 對照版本。
2. 在 `build.mjs` 中，將此語系加入 `LOCALES`，並新增對應的 `LABELS[<locale>]`
   項目（source-video／close／full-notes／talks／footer-note 等字串），同時
   擴充 head 偵測／轉址腳本，以及新頁面的 `EN | 中文` 切換按鈕。
3. 在 `src/scripts/reading-progress.js` 與 `src/scripts/notes.js` 中新增
   `T[<locale>]` 字串表，讓它們所注入的 UI 也能在地化。

## 慣例

- 請重新產生（`npm run build`）並將 `index.html` 與 `index.zh.html` 連同來源
  變更一併提交——它們是需要提交的建置產物。
- 請讓每次提交聚焦於單一目的；推送前執行 `node tools/i18n-check.mjs`。
- `modal.js` 與 `nav-scrollspy.js` 不會注入任何面向使用者的文字，通常不需要
  修改；`reading-progress.js`／`notes.js` 則將所有 UI 字串集中放在 `T[lang]`
  表中。
