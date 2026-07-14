# Traditional Chinese Site Version — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a full Traditional Chinese (zh-Hant) version of the site with an `EN | 中文` language toggle that defaults to the browser's language and falls back to English.

**Architecture:** `build.mjs` emits two self-contained pages from `src/` — `index.html` (English) and `index.zh.html` (Traditional Chinese). Translated content lives in `src/i18n/zh/` mirroring the English source; any missing translation falls back to English. A tiny head script redirects by browser-language/stored preference; a shared toggle partial switches pages while preserving the `#hash`. The four existing behavior scripts are untouched.

**Tech Stack:** Node ESM build script (zero runtime deps), inline HTML/CSS/JS, `node` for build + integrity checks, headless Chromium (environment-bundled Playwright) for end-to-end verification.

## Global Constraints

Copied verbatim from the spec; every task's requirements implicitly include these.

- Output stays **dependency-free** and openable from disk (`file://`) and from a static host (GitHub Pages) at root **or** a project subpath → **relative links only** (`index.html`, `index.zh.html`).
- **No changes to the four behavior scripts** (`modal.js`, `reading-progress.js`, `notes.js`, `nav-scrollspy.js`). **No duplicate element `id`s** (guaranteed — the two languages are separate files).
- Language preference key: **`ai-talks-lang`** (`"en"` / `"zh"`). Reading-progress keys (`ai-talks-read`, `ai-talks-hide-read`) and notes key (`ai-talks-notes`) are unchanged.
- Redirect logic must be **provably loop-free**; auto-redirect uses `location.replace`, the toggle uses `location.assign` (Back returns to the prior language).
- Detection rule: **English page** → stored `zh` OR (no pref AND `navigator.language(s)` matches `/^zh\b/i`) redirects to Chinese; **Chinese page** → stored `en` redirects to English; otherwise stay. Any `zh*` (incl. `zh-CN`) resolves to the Traditional page.
- The head detection script sits **after** the charset/viewport meta and **before** `<title>` (charset stays first).
- Translation target: **Traditional Chinese, Taiwan-style phrasing** (`zh-Hant`). Never alter `id`/`class`/`href`/SVG path data/code/structure. Keep product names, speaker names, and established jargon (RAG, LLM, TDD, Claude Code, arXiv, …) as-is unless a natural common Chinese term exists.
- **Page scripts** (inlined into the page) live in `src/scripts/`. **Dev tooling** (never inlined) lives in top-level `tools/`.

---

## File Structure

**New — build/mechanism**
- `src/partials/lang-toggle.html` — the `EN | 中文` toggle markup (shared, injected into both heroes). One responsibility: the toggle DOM.
- `src/scripts/lang.js` — page script (inlined last): sets `aria-current`, and on click stores the preference + navigates with `#hash`. One responsibility: toggle behavior.
- `src/i18n/zh/meta.json` — `{ "title": "…" }`, the Chinese `<title>`. One responsibility: per-locale build strings.
- `tools/i18n-check.mjs` — dev-only checker: compares the two built pages for `id`/`href`/SVG parity, verifies shell counts, and reports coverage + untranslated text. Not inlined, not shipped.
- `index.zh.html` — generated Chinese page.

**New — content pipeline (in `build.mjs`)**
- `renderMarkdown`, `parseFrontmatter`, `assembleNote`, `assembleSection`, `LABELS` — assemble Markdown/text translation sources into the English HTML shells (English passthrough when no source).

**New — translation sources (`src/i18n/zh/`)**
- `partials/hero.html`, `partials/nav.html`, `partials/footer.html` — HTML mirrors (SVG/metrics).
- `sections/overview.html`, `sections/themes.html` — HTML mirrors (stats + inline `#doc-N` links).
- `sections/cat-A.md` … `cat-I.md` — flat-text section sources (9 files).
- `notes/doc-*.md` — Markdown note sources (99 files).

**Modified**
- `build.mjs` — `buildPage(locale)` loop, `read(rel, locale)` with English fallback, head templating (lang/title/detect-script), toggle splice, `lang.js` include, and the content pipeline (`renderMarkdown`/`parseFrontmatter`/`assembleNote`/`assembleSection`/`LABELS`) for Markdown/text note + section sources.
- `src/head.html` — templatized: `__HTML_LANG__`, `__LANG_DETECT__`, `__TITLE__` placeholders.
- `src/partials/hero.html` — `<!-- lang-toggle -->` placeholder inside `.hero-actions`, above the GitHub link.
- `src/styles.css` — `.lang-toggle` / `.lang-opt` / active-state rules (light-on-dark, matches `.gh-link`).
- `src/README.md`, `README.md` — document the two-page build + toggle.

---

### Task 1: Two-page build (English content on both; Chinese `<html lang>` + `<title>`)

Refactor the build to emit both pages. No translations yet — `index.zh.html` is English body with `lang="zh-Hant"` and the Chinese title. This proves the two-page pipeline and the English fallback.

**Files:**
- Modify: `build.mjs`
- Modify: `src/head.html`
- Create: `src/i18n/zh/meta.json`

**Interfaces:**
- Produces: `read(rel, locale)` → string (locale-aware, English fallback); `readMeta(locale)` → `{ title }`; `buildPage(locale)` → writes `index.html` (en) / `index.zh.html` (zh). `LOCALES = [{code:"en",htmlLang:"en",out:"index.html"},{code:"zh",htmlLang:"zh-Hant",out:"index.zh.html"}]`.

- [ ] **Step 1: Templatize `src/head.html`**

Replace its contents with (note the three placeholders; `__LANG_DETECT__` is filled in Task 2, here it becomes empty):

```html
<!doctype html>
<html lang="__HTML_LANG__">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
__LANG_DETECT__
        <title>__TITLE__</title>
```

- [ ] **Step 2: Add the Chinese title**

Create `src/i18n/zh/meta.json`:

```json
{
    "title": "AI 工程演講 — 分類與精華整理"
}
```

- [ ] **Step 3: Refactor `build.mjs` to build per-locale**

Replace the top-level assembly with a locale loop. Full file:

```js
#!/usr/bin/env node
/*
 * build.mjs — assemble the composable sources under `src/` into two
 * self-contained pages: `index.html` (English) and `index.zh.html`
 * (Traditional Chinese). Translated content lives under `src/i18n/<locale>/`
 * and falls back to the English source when a file is missing. CSS and JS are
 * inlined so each page opens directly from disk with no tooling or network.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");

const LOCALES = [
    { code: "en", htmlLang: "en", out: "index.html" },
    { code: "zh", htmlLang: "zh-Hant", out: "index.zh.html" },
];

const DEFAULT_META = { title: "AI Engineering Talks — Classified &amp; Distilled" };

function strip(text) {
    return text.endsWith("\n") ? text.slice(0, -1) : text;
}

/** Read a source file for `locale`, falling back to the English source. */
function read(rel, locale) {
    if (locale !== "en") {
        const localized = path.join(SRC, "i18n", locale, rel);
        if (fs.existsSync(localized)) return strip(fs.readFileSync(localized, "utf8"));
    }
    return strip(fs.readFileSync(path.join(SRC, rel), "utf8"));
}

/** Per-locale build strings (title, …); English is the default. */
function readMeta(locale) {
    if (locale === "en") return DEFAULT_META;
    const p = path.join(SRC, "i18n", locale, "meta.json");
    if (fs.existsSync(p)) return { ...DEFAULT_META, ...JSON.parse(fs.readFileSync(p, "utf8")) };
    return DEFAULT_META;
}

/** Head detection/redirect script (filled in Task 2; empty for now). */
function detectScript(/* locale */) {
    return "";
}

function buildPage(locale) {
    const L = LOCALES.find((x) => x.code === locale);
    const meta = readMeta(locale);

    const head = read("head.html", locale)
        .replace("__HTML_LANG__", L.htmlLang)
        .replace("__LANG_DETECT__", detectScript(locale))
        .replace("__TITLE__", meta.title);
    const styles = read("styles.css", locale);

    const hero = read("partials/hero.html", locale);
    const nav = read("partials/nav.html", locale);
    const overview = read("sections/overview.html", locale);
    const themes = read("sections/themes.html", locale);
    const footer = read("partials/footer.html", locale);

    const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((k) =>
        read(`sections/cat-${k}.html`, locale),
    );

    const order = JSON.parse(read("notes/order.json", locale));
    const notes = order.map((id) => read(`notes/${id}.html`, locale));

    const scripts = [
        read("scripts/modal.js", locale),
        read("scripts/reading-progress.js", locale),
        read("scripts/notes.js", locale),
        // Last of the behavior scripts: scroll-spy queries the #notes section notes.js injects.
        read("scripts/nav-scrollspy.js", locale),
    ];

    const parts = [];
    parts.push(head);
    parts.push("        <style>");
    parts.push(styles);
    parts.push("        </style>");
    parts.push("    </head>");
    parts.push("    <body>");
    parts.push(hero);
    parts.push("");
    parts.push(nav);
    parts.push("");
    parts.push(overview);
    parts.push("");
    parts.push(themes);
    parts.push("");
    parts.push('        <div class="wrap">');
    for (const cat of categories) parts.push(cat);
    parts.push("        </div>");
    parts.push("");
    parts.push(footer);
    parts.push("");
    for (const note of notes) parts.push(note);
    for (const js of scripts) {
        parts.push("        <script>");
        parts.push(js);
        parts.push("        </script>");
    }
    parts.push("    </body>");
    parts.push("</html>");

    const out = parts.join("\n") + "\n";
    fs.writeFileSync(path.join(ROOT, L.out), out);
    console.log(
        `Built ${L.out} — ${out.split("\n").length - 1} lines, ` +
            `${categories.length} categories, ${notes.length} talk notes.`,
    );
}

for (const L of LOCALES) buildPage(L.code);
```

- [ ] **Step 4: Build and verify both pages exist with correct head**

Run: `node build.mjs`
Expected: two summary lines, `index.html` and `index.zh.html`, each "9 categories, 99 talk notes."

Run: `node -e "const fs=require('fs');const z=fs.readFileSync('index.zh.html','utf8');const e=fs.readFileSync('index.html','utf8');console.log('zh lang', /<html lang=\"zh-Hant\">/.test(z));console.log('zh title', z.includes('AI 工程演講'));console.log('en lang', /<html lang=\"en\">/.test(e));console.log('en title', e.includes('Classified'));console.log('zh body==en body', z.split('</head>')[1]===e.split('</head>')[1]);"`
Expected: all five `true` (Chinese page has zh-Hant + Chinese title; English unchanged; bodies identical since no translations yet).

- [ ] **Step 5: Commit**

```bash
git add build.mjs src/head.html src/i18n/zh/meta.json index.html index.zh.html
git commit -m "build: emit index.html + index.zh.html from per-locale sources"
```

---

### Task 2: Language detection & redirect (head script, both pages)

Fill `detectScript(locale)` so both pages carry the inline redirect script after the meta tags.

**Files:**
- Modify: `build.mjs` (`detectScript`)

**Interfaces:**
- Consumes: `buildPage` already injects the return of `detectScript(locale)` at `__LANG_DETECT__`.
- Produces: both pages set `window.__PAGE_LANG__` (`"en"`/`"zh"`) and self-redirect per the Global Constraints rule.

- [ ] **Step 1: Implement `detectScript`**

Replace the stub in `build.mjs`:

```js
/** Head detection/redirect script; `locale` is baked in as PAGE_LANG. */
function detectScript(locale) {
    return [
        "        <script>",
        "            (function () {",
        `                var PAGE_LANG = ${JSON.stringify(locale)};`,
        "                window.__PAGE_LANG__ = PAGE_LANG;",
        '                var LANG_KEY = "ai-talks-lang";',
        "                var pref = null;",
        "                try { pref = localStorage.getItem(LANG_KEY); } catch (e) {}",
        "                function wantsZh() {",
        "                    var l = navigator.languages ||",
        "                        (navigator.language ? [navigator.language] : []);",
        "                    for (var i = 0; i < l.length; i++)",
        '                        if (/^zh\\b/i.test(l[i] || "")) return true;',
        "                    return false;",
        "                }",
        "                var target = null;",
        '                if (PAGE_LANG === "en") {',
        '                    if (pref === "zh") target = "index.zh.html";',
        '                    else if (!pref && wantsZh()) target = "index.zh.html";',
        '                } else if (pref === "en") {',
        '                    target = "index.html";',
        "                }",
        "                if (target) location.replace(target + location.hash);",
        "            })();",
        "        </script>",
    ].join("\n");
}
```

- [ ] **Step 2: Build and check the script is present with correct PAGE_LANG**

Run: `node build.mjs`
Run: `node -e "const fs=require('fs');const e=fs.readFileSync('index.html','utf8');const z=fs.readFileSync('index.zh.html','utf8');console.log('en PAGE_LANG', e.includes('var PAGE_LANG = \"en\"'));console.log('zh PAGE_LANG', z.includes('var PAGE_LANG = \"zh\"'));console.log('charset before script', e.indexOf('charset')<e.indexOf('PAGE_LANG'));console.log('script before title', e.indexOf('PAGE_LANG')<e.indexOf('<title>'));"`
Expected: four `true`.

- [ ] **Step 3: Verify redirect + loop-freeness in a headless browser**

Serve locally (localStorage/navigation are reliable over http, flaky on `file://`):

```bash
python3 -m http.server 8123 >/dev/null 2>&1 &
```

Using the environment's bundled headless Chromium (per project memory `headless-browser-verification`), verify each row and confirm the **final** URL:

- context locale `en-US`, open `/index.html` → stays `/index.html`.
- context locale `zh-TW`, open `/index.html` → ends on `/index.zh.html` (no stored pref).
- open `/index.zh.html` directly, locale `en-US`, no stored pref → stays `/index.zh.html`.
- `localStorage['ai-talks-lang']='zh'`, locale `en-US`, open `/index.html` → `/index.zh.html`.
- `localStorage['ai-talks-lang']='en'`, open `/index.zh.html` → `/index.html`, then reopening `/index.html` **stays** (no bounce back → loop-free).
- open `/index.html#doc-3` with locale `zh-TW` → ends `/index.zh.html#doc-3` (hash preserved).

Stop the server: `kill %1` (or the printed PID).
Expected: every row matches; no row oscillates.

- [ ] **Step 4: Commit**

```bash
git add build.mjs index.html index.zh.html
git commit -m "feat: browser-language detection + redirect between EN/ZH pages"
```

---

### Task 3: Language toggle (markup, styles, behavior)

Add the visible `EN | 中文` toggle above the GitHub link, its styling, and its click behavior.

**Files:**
- Create: `src/partials/lang-toggle.html`
- Create: `src/scripts/lang.js`
- Modify: `src/partials/hero.html`
- Modify: `src/styles.css`
- Modify: `build.mjs` (splice toggle into hero; append `lang.js`)

**Interfaces:**
- Consumes: `window.__PAGE_LANG__` (Task 2).
- Produces: `.lang-toggle` in `.hero-actions`; `lang.js` inlined after the behavior scripts.

- [ ] **Step 1: Create the toggle partial**

`src/partials/lang-toggle.html`:

```html
                <div class="lang-toggle" role="group" aria-label="Language / 語言">
                    <a class="lang-opt lang-opt--en" href="index.html" hreflang="en">EN</a>
                    <span class="lang-sep" aria-hidden="true">|</span>
                    <a class="lang-opt lang-opt--zh" href="index.zh.html" hreflang="zh-Hant">中文</a>
                </div>
```

- [ ] **Step 2: Add the placeholder to the hero**

In `src/partials/hero.html`, inside `<div class="hero-actions">`, add the placeholder as the first child (immediately above the `<a class="gh-link" …>`):

```html
                <div class="hero-actions">
                    <!-- lang-toggle -->
                    <a
                        class="gh-link"
```

- [ ] **Step 3: Splice the toggle in `build.mjs`**

In `buildPage`, change the hero read to inject the shared partial:

```js
    const langToggle = read("partials/lang-toggle.html", locale);
    const hero = read("partials/hero.html", locale).replace(
        "<!-- lang-toggle -->",
        langToggle,
    );
```

- [ ] **Step 4: Create the toggle behavior script**

`src/scripts/lang.js`:

```js
/*
 * lang.js — language toggle behavior. Marks the active option and, on click,
 * records the choice in localStorage and navigates to the other page with the
 * current hash preserved. The head script (see build.mjs) handles first-visit
 * detection/redirect; this only runs on explicit user action.
 */
(function () {
    var LANG_KEY = "ai-talks-lang";
    var PAGE_LANG = window.__PAGE_LANG__ || "en";
    var toggle = document.querySelector(".lang-toggle");
    if (!toggle) return;
    var opts = toggle.querySelectorAll(".lang-opt");
    for (var i = 0; i < opts.length; i++) {
        var opt = opts[i];
        var active =
            (PAGE_LANG === "en" && opt.classList.contains("lang-opt--en")) ||
            (PAGE_LANG === "zh" && opt.classList.contains("lang-opt--zh"));
        if (active) opt.setAttribute("aria-current", "true");
        opt.addEventListener("click", function (e) {
            e.preventDefault();
            var lang = this.classList.contains("lang-opt--zh") ? "zh" : "en";
            try { localStorage.setItem(LANG_KEY, lang); } catch (err) {}
            location.assign(this.getAttribute("href") + location.hash);
        });
    }
})();
```

- [ ] **Step 5: Include `lang.js` in the build**

In `buildPage`, append it after the behavior scripts:

```js
    const scripts = [
        read("scripts/modal.js", locale),
        read("scripts/reading-progress.js", locale),
        read("scripts/notes.js", locale),
        read("scripts/nav-scrollspy.js", locale),
        read("scripts/lang.js", locale),
    ];
```

- [ ] **Step 6: Style the toggle (dark hero, matches `.gh-link`)**

Append to `src/styles.css` (inside the same `<style>`-inlined sheet), after the `.gh-link` rules:

```css
            .lang-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                font-size: 14px;
                font-weight: 600;
            }
            .lang-toggle .lang-opt {
                color: rgba(255, 255, 255, 0.72);
                text-decoration: none;
                padding: 2px 8px;
                border-radius: 8px;
                line-height: 1.4;
            }
            .lang-toggle .lang-opt:hover {
                color: #fff;
                text-decoration: none;
            }
            .lang-toggle .lang-opt:focus-visible {
                outline: 2px solid #fff;
                outline-offset: 2px;
            }
            .lang-toggle .lang-sep {
                color: rgba(255, 255, 255, 0.4);
            }
            html[lang="en"] .lang-opt--en,
            html[lang^="zh"] .lang-opt--zh {
                color: #fff;
                background: rgba(255, 255, 255, 0.16);
            }
```

- [ ] **Step 7: Build and verify toggle presence + placement**

Run: `node build.mjs`
Run: `node -e "const fs=require('fs');const e=fs.readFileSync('index.html','utf8');const h=e.split('</header>')[0];console.log('toggle present', h.includes('class=\"lang-toggle\"'));console.log('toggle above gh-link', h.indexOf('lang-toggle')<h.indexOf('gh-link'));console.log('lang.js inlined', e.includes('language toggle behavior'));"`
Expected: three `true`.

- [ ] **Step 8: Verify toggle behavior in a headless browser**

Serve (`python3 -m http.server 8123 &`). With bundled headless Chromium:
- Open `/index.html`, confirm the `EN` option has `aria-current="true"` and the active-highlight style (white).
- Open `/index.html#doc-1` (a lightbox open), click `中文` → URL becomes `/index.zh.html#doc-1`, `localStorage['ai-talks-lang']==='zh'`, and the `#doc-1` dialog is open on the Chinese page.
- Click `EN` back → `/index.html#doc-1`; browser Back returns to the Chinese page (assign, not replace).

Stop the server. Expected: all behaviors as described.

- [ ] **Step 9: Commit**

```bash
git add src/partials/lang-toggle.html src/scripts/lang.js src/partials/hero.html src/styles.css build.mjs index.html index.zh.html
git commit -m "feat: EN | 中文 language toggle above the GitHub link"
```

---

### Task 4: Content pipeline (Markdown/text → HTML assemblers)

Add a zero-dependency content pipeline to `build.mjs`: a tiny Markdown renderer, frontmatter parser, a per-note assembler, a per-section assembler, and a fixed-label map. Wire `buildPage` to use the assemblers for notes and category sections. **No translation content is committed in this task** — with no `.md` sources present, the assemblers pass English through, so `index.html` and `index.zh.html` stay byte-identical to Task 3. The assemblers are proven with throwaway fixtures that are removed before commit.

**Files:**
- Modify: `build.mjs`

**Interfaces:**
- Consumes: `read(rel, locale)`, `SRC`, `path`, `fs` (from Task 1).
- Produces: `renderMarkdown(md)→string`, `parseFrontmatter(text)→{data,body}`, `assembleNote(locale,id)→string`, `assembleSection(locale,key)→string`, `LABELS[locale]`, and escapers `escHtml`/`escAttr`. `buildPage` calls `assembleNote(locale, id)` for each note and `assembleSection(locale, k)` for each category.

- [ ] **Step 1: Add escapers, `renderMarkdown`, `parseFrontmatter`, `LABELS`**

Insert into `build.mjs` after the `read`/`readMeta` helpers (before `detectScript`):

```js
const escHtml = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Minimal, zero-dep Markdown for the note-body vocabulary: paragraphs,
 *  `-`/`*` and `1.` lists, and `**bold**`. Text is HTML-escaped. */
function renderMarkdown(md) {
    const inline = (s) => escHtml(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;
    while (i < lines.length) {
        if (!lines[i].trim()) {
            i++;
        } else if (/^\s*\d+\.\s+/.test(lines[i])) {
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(inline(lines[i].replace(/^\s*\d+\.\s+/, "").trim()));
                i++;
            }
            out.push("<ol>" + items.map((x) => "<li><p>" + x + "</p></li>").join("") + "</ol>");
        } else if (/^\s*[-*]\s+/.test(lines[i])) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                items.push(inline(lines[i].replace(/^\s*[-*]\s+/, "").trim()));
                i++;
            }
            out.push("<ul>" + items.map((x) => "<li><p>" + x + "</p></li>").join("") + "</ul>");
        } else {
            const para = [];
            while (i < lines.length && lines[i].trim() && !/^\s*(\d+\.|[-*])\s+/.test(lines[i])) {
                para.push(lines[i].trim());
                i++;
            }
            out.push("<p>" + para.map(inline).join(" ") + "</p>");
        }
    }
    return out.join("\n");
}

/** Split a leading `---`-fenced `key: value` block from the body. */
function parseFrontmatter(text) {
    const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) return { data: {}, body: text };
    const data = {};
    for (const line of m[1].split("\n")) {
        const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (mm) data[mm[1]] = mm[2].trim();
    }
    return { data, body: m[2].replace(/^\n+/, "") };
}

/** Fixed UI strings substituted into translated shells. */
const LABELS = {
    en: null, // English shells already carry English labels.
    zh: {
        srcVideo: "▶ 來源影片",
        fullNotes: "📄 完整筆記",
        close: "關閉",
        lbNote: "摘自原始演講筆記（已內嵌於本檔案）",
        talks: "場演講",
    },
};
```

- [ ] **Step 2: Add `assembleNote` and `assembleSection`**

Insert after `LABELS`:

```js
/** Build a translated note lightbox from the English shell + a `doc-<id>.md`
 *  source. English (or missing source) → the English shell verbatim. */
function assembleNote(locale, id) {
    const shell = read(`notes/${id}.html`, "en");
    if (locale === "en") return shell;
    const mdPath = path.join(SRC, "i18n", locale, "notes", `${id}.md`);
    if (!fs.existsSync(mdPath)) return shell;
    const { data, body } = parseFrontmatter(fs.readFileSync(mdPath, "utf8"));
    const L = LABELS[locale];
    const bodyHtml = renderMarkdown(body);

    // The lightbox div's aria-label holds the English talk title; capture it
    // before the close-label rewrite so we can retarget just that attribute.
    const alm = shell.match(/<div class="lightbox"[^>]*aria-label="([^"]*)"/);
    const enAria = alm ? alm[1] : null;

    // Function replacers throughout, so a literal `$` in translated text is
    // never mis-read as a `$1`/`$&` replacement pattern.
    let out = shell
        .replace(/(<h3>)[\s\S]*?(<\/h3>)/, (m, a, b) => a + escHtml(data.title) + b)
        .replace(/(<p class="lb-sc">)[\s\S]*?(<\/p>)/, (m, a, b) => a + escHtml(data.speaker || "") + b)
        .replace(
            /(<div class="lb-body md">)[\s\S]*?(<\/div>\s*<div class="lb-foot">)/,
            (m, open, tail) => `${open}\n${bodyHtml}\n                ${tail}`,
        )
        .replace(/(<span class="lb-note"[^>]*>)[\s\S]*?(<\/span>)/, (m, a, b) => a + escHtml(L.lbNote) + b);

    out = out
        .split("▶ Source video").join(L.srcVideo)
        .split(">Close</a>").join(`>${escHtml(L.close)}</a>`)
        .split('aria-label="Close"').join(`aria-label="${escAttr(L.close)}"`);
    if (enAria) out = out.split(`aria-label="${enAria}"`).join(`aria-label="${escAttr(data.title)}"`);
    return out;
}

/** Build a translated category section from the English shell + a `cat-<key>.md`
 *  source (frontmatter heading/desc + ordered `## card` / `@ speaker` / summary
 *  blocks). English (or missing source) → the English shell verbatim. */
function assembleSection(locale, key) {
    const shell = read(`sections/cat-${key}.html`, "en");
    if (locale === "en") return shell;
    const mdPath = path.join(SRC, "i18n", locale, "sections", `cat-${key}.md`);
    if (!fs.existsSync(mdPath)) return shell;
    const { data, body } = parseFrontmatter(fs.readFileSync(mdPath, "utf8"));
    const L = LABELS[locale];

    const cards = body
        .split(/\n(?=##\s)/)
        .map((blk) => {
            const lines = blk.split("\n");
            const t = (lines.find((l) => /^##\s+/.test(l)) || "").replace(/^##\s+/, "").trim();
            if (!t) return null;
            const sc = (lines.find((l) => /^@\s+/.test(l)) || "").replace(/^@\s+/, "").trim();
            const sm = lines.filter((l) => l.trim() && !/^(##|@)\s+/.test(l)).join(" ").trim();
            return { t, sc, sm };
        })
        .filter(Boolean);

    const gridAt = shell.indexOf('<div class="grid">');
    let header = shell.slice(0, gridAt);
    const grid = shell.slice(gridAt);

    header = header
        .replace(/(<h2>)[\s\S]*?(\s*<span class="cnt">)/, (m, a, b) => a + "\n                            " + escHtml(data.heading) + b)
        .replace(/(<p class="catdesc">)[\s\S]*?(<\/p>)/, (m, a, b) => a + escHtml(data.desc) + b);

    let ci = 0;
    const rebuilt = grid.split(/(?=<article )/).map((p) => {
        if (!/^<article /.test(p)) return p;
        const c = cards[ci++];
        if (!c) return p;
        return p
            .replace(/(<a\s+class="doc-open"[^>]*>)[\s\S]*?(<\/a>)/, (m, a, b) => a + escHtml(c.t) + b)
            .replace(/(<p class="sc">)[\s\S]*?(<\/p>)/, (m, a, b) => a + escHtml(c.sc) + b)
            .replace(/(<p class="sm">)[\s\S]*?(<\/p>)/, (m, a, b) => a + escHtml(c.sm) + b);
    });

    let out = header + rebuilt.join("");
    out = out
        .replace(/(<span class="chip"[^>]*>)[\s\S]*?(<\/span>)/g, (m, a, b) => a + key + " · " + escHtml(data.heading) + b)
        .replace(/(<span class="cnt">\s*\d+)\s+talks(\s*<\/span>)/, (m, a, b) => a + " " + escHtml(L.talks) + b)
        .split("📄 Full notes").join(L.fullNotes)
        .split("▶ Source video").join(L.srcVideo);
    return out;
}
```

- [ ] **Step 3: Wire `buildPage` to use the assemblers**

In `buildPage`, replace the category and notes reads:

```js
    const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((k) =>
        assembleSection(locale, k),
    );

    const order = JSON.parse(read("notes/order.json", locale));
    const notes = order.map((id) => assembleNote(locale, id));
```

Leave `overview`, `themes`, and the chrome partials using `read(rel, locale)` — they are HTML mirrors.

- [ ] **Step 4: Build and confirm both pages are unchanged (English passthrough)**

Run: `node build.mjs`
Run: `git diff --quiet -- index.html index.zh.html && echo "UNCHANGED" || echo "CHANGED"`
Expected: `UNCHANGED` — with no `.md` sources yet, the assemblers pass English through, so neither generated page changes.

- [ ] **Step 5: Prove the assemblers with throwaway fixtures**

Create a temporary note fixture `src/i18n/zh/notes/doc-1.md`:

```markdown
---
title: 從教室評估中學到的 5 堂課
speaker: Andrew Zigler, Dev Interrupted
---
這場演講在談把課堂教學與學生評量的思維，帶進 AI agent 的設計與評估。

1. 把專案當成一間教室，從逆向設計開始。
2. 給人與 agent 一份共享的議程。
```

Create a temporary section fixture `src/i18n/zh/sections/cat-D.md`:

```markdown
---
heading: Agent 安全與身分
desc: 提示注入、最小權限、身分控制平面、PII 保護。
---
## Agentic AI：從風險意識到實務控管
@ Noma Security
指出 agent 把決策權交給非確定性的 LLM，導致安全邊界崩解。
```

Run: `node build.mjs`
Run:
```bash
node -e '
const fs=require("fs");
const zh=fs.readFileSync("index.zh.html","utf8"), en=fs.readFileSync("index.html","utf8");
const around=(h,id)=>{const i=h.indexOf("id=\""+id+"\"");return h.slice(i-80,i+1400);};
const d1=around(zh,"doc-1"), cd=around(zh,"cat-D");
const ids=h=>[...h.matchAll(/id="([^"]*)"/g)].map(m=>m[1]).join(",");
const hrefs=h=>[...h.matchAll(/href="([^"]*)"/g)].map(m=>m[1]).join("|");
console.log("note title zh:", d1.includes("從教室評估中學到的"));
console.log("note labels zh:", d1.includes("▶ 來源影片") && d1.includes("關閉"));
console.log("note youtube preserved:", d1.includes("youtu.be"));
console.log("note body rendered:", /<div class="lb-body md">\s*<p>/.test(d1));
console.log("section heading zh:", cd.includes("Agent 安全與身分"));
console.log("section chip zh:", cd.includes("D · Agent 安全與身分"));
console.log("section card1 title zh:", cd.includes("從風險意識到實務控管"));
console.log("id lists equal:", ids(en)===ids(zh));
console.log("href lists equal:", hrefs(en)===hrefs(zh));
'
```
Expected: all nine `true` (translated text present, labels swapped, YouTube href intact, body rendered, and — crucially — the id/href lists of the two pages remain identical, proving the shells were preserved).

- [ ] **Step 6: Remove the fixtures and rebuild**

Run: `rm src/i18n/zh/notes/doc-1.md src/i18n/zh/sections/cat-D.md && node build.mjs`
Run: `git diff --quiet -- index.html index.zh.html && echo "UNCHANGED"`
Expected: `UNCHANGED` (fixtures gone → passthrough again).

- [ ] **Step 7: Commit (build.mjs only)**

```bash
git add build.mjs index.html index.zh.html
git commit -m "build: Markdown/text content pipeline for translated notes + sections"
```
(`index.html`/`index.zh.html` are unchanged but staging them is harmless; the diff is `build.mjs` only.)

---

### Task 5: Translation checker (`tools/i18n-check.mjs`)

A dependency-free dev tool that compares the two **built** pages: identical ordered `id`/`href`/SVG-path lists and equal shell counts (lightboxes, articles, sections) prove the assemblers preserved every structural shell. It also reports translation coverage and flags untranslated (English-looking) visible text on the Chinese page.

**Files:**
- Create: `tools/i18n-check.mjs`

**Interfaces:**
- Produces: CLI `node tools/i18n-check.mjs` → exit `1` on any structural mismatch, else `0`; prints coverage + `WARN` lines (non-fatal).

- [ ] **Step 1: Write the checker**

`tools/i18n-check.mjs`:

```js
#!/usr/bin/env node
/*
 * i18n-check.mjs — compare the two built pages (index.html, index.zh.html) for
 * structural parity, and report translation coverage + untranslated text.
 * Dependency-free. Dev tool only; never inlined. Exit 1 on a structural
 * mismatch. Run after `node build.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const attrs = (html, name) => {
    const re = new RegExp(`${name}="([^"]*)"`, "g");
    const out = [];
    let m;
    while ((m = re.exec(html))) out.push(m[1]);
    return out;
};
const count = (html, re) => (html.match(re) || []).length;
const eqList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

const en = read("index.html");
const zh = read("index.zh.html");

const problems = [];
for (const name of ["id", "href"])
    if (!eqList(attrs(en, name), attrs(zh, name)))
        problems.push(`${name} list differs (en ${attrs(en, name).length} vs zh ${attrs(zh, name).length})`);
if (!eqList(attrs(en, "d"), attrs(zh, "d"))) problems.push("svg path 'd' list differs");
for (const [label, re] of [
    ["lightbox", /<div class="lightbox"/g],
    ["article.card", /<article class="card"/g],
    ["section.catsec", /<section class="catsec"/g],
])
    if (count(en, re) !== count(zh, re))
        problems.push(`${label} count ${count(en, re)} -> ${count(zh, re)}`);

// Coverage
const zhDir = path.join(ROOT, "src", "i18n", "zh");
const countFiles = (d, re) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => re.test(f)).length : 0);
const noteMd = countFiles(path.join(zhDir, "notes"), /^doc-\d+\.md$/);
const catMd = countFiles(path.join(zhDir, "sections"), /^cat-[A-I]\.md$/);

// Untranslated warnings: long, Han-free visible text on the zh page.
const warns = [];
const visible = zh.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
for (const seg of visible.replace(/<[^>]+>/g, "\n").split("\n")) {
    const s = seg.trim();
    if (s.length < 40) continue;
    const han = (s.match(/[一-鿿]/g) || []).length;
    const ascii = (s.match(/[A-Za-z]/g) || []).length;
    if (han === 0 && ascii > 24) warns.push(s.slice(0, 70));
}

console.log(`coverage: notes ${noteMd}/99 md, categories ${catMd}/9 md`);
if (problems.length) for (const p of problems) console.error("FAIL " + p);
else console.log("OK structural parity (id/href/svg + shell counts match)");
console.log(`${warns.length} untranslated-text warning(s)`);
for (const w of warns.slice(0, 40)) console.log("  WARN " + w);
process.exit(problems.length ? 1 : 0);
```

- [ ] **Step 2: Run against the current build (no translations yet)**

Run: `node build.mjs && node tools/i18n-check.mjs`
Expected: `coverage: notes 0/99 md, categories 0/9 md`, `OK structural parity`, and a nonzero untranslated-text warning count (the whole Chinese page is still English) — exit 0.

- [ ] **Step 3: Sanity-check the failure path**

Run:
```bash
node -e 'const fs=require("fs");let z=fs.readFileSync("index.zh.html","utf8").replace("id=\"overview\"","id=\"XXX\"");fs.writeFileSync("index.zh.html",z);'
node tools/i18n-check.mjs; echo "exit=$?"
node build.mjs
```
Expected: a `FAIL id list differs` line and `exit=1`; the rebuild restores parity.

- [ ] **Step 4: Commit**

```bash
git add tools/i18n-check.mjs
git commit -m "tools: add built-page translation/structure checker"
```

---

### Task 6: Translate the chrome (hero, nav, footer — HTML mirrors)

**Files:**
- Create: `src/i18n/zh/partials/hero.html`, `src/i18n/zh/partials/nav.html`, `src/i18n/zh/partials/footer.html`

- [ ] **Step 1: Translate `partials/hero.html`** — copy `src/partials/hero.html` and translate text nodes to zh-Hant. **Preserve** the `<!-- lang-toggle -->` placeholder, the `.gh-link` `href` + its SVG, and metric numbers (`99`, `9`). E.g. eyebrow → "演講筆記 · 分類與重點整理"; h1 → "AI 工程演講 — 分類與精華整理"; metric labels "Talk notes"/"Thematic categories"/"Cross-cutting insights" → "演講筆記"/"主題分類"/"跨領域洞察"; button "View source on GitHub" → "在 GitHub 檢視原始碼".

- [ ] **Step 2: Translate `partials/nav.html`** — keep every `href="#…"` and each `<em>NN</em>` count; translate labels ("Overview"→"總覽", "Key Themes"→"重點主題", "★ Notes"→"★ 筆記", category names, e.g. "A · BI / Analytics / Semantic Layer" → "A · BI / 分析 / 語意層").

- [ ] **Step 3: Translate `partials/footer.html`** — keep the GitHub `href`, repo URL text, and SVG; translate the method list; the "Content language" line → "內容語言：繁體中文。" and "Generated: 2026-07-07." → "產生日期：2026-07-07。".

- [ ] **Step 4: Build + checker** — `node build.mjs && node tools/i18n-check.mjs`. Expected: `OK structural parity` (hero/nav/footer hrefs + SVG unchanged), coverage still `0/99, 0/9`, and a lower untranslated-warning count. If parity FAILs, a translated href/SVG was altered — fix it.

- [ ] **Step 5: Spot-check render** — serve (`python3 -m http.server 8123 &`) and open `/index.zh.html` in the bundled headless Chromium (`/Users/cyyeh/.claude/skills/gstack/node_modules/playwright/index.mjs`); confirm the hero, nav, and footer read as Chinese, the toggle shows `中文` active, and layout is intact. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/zh/partials index.html index.zh.html
git commit -m "i18n(zh): translate hero, nav, footer"
```

---

### Task 7: Translate the overview + themes sections (HTML mirrors)

**Files:**
- Create: `src/i18n/zh/sections/overview.html`, `src/i18n/zh/sections/themes.html`

- [ ] **Step 1: Translate `sections/overview.html`** — copy, translate text nodes only; preserve `id="overview"`, classes, counts, and any inline anchors/`href`s.

- [ ] **Step 2: Translate `sections/themes.html`** — copy, translate the 9 insight blocks; **preserve every inline `<a href="#doc-N">` citation target and tag** (translate only the visible link text), plus `id="themes"` and all structural tags.

- [ ] **Step 3: Build + checker** — `node build.mjs && node tools/i18n-check.mjs`. Expected: `OK structural parity` (all `#doc-N` citation hrefs intact — this is the key check for themes), warnings lower.

- [ ] **Step 4: Spot-check render** — open `/index.zh.html#overview` and `#themes`; confirm Chinese text and that theme→talk citation links still open the right lightboxes.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/zh/sections/overview.html src/i18n/zh/sections/themes.html index.html index.zh.html
git commit -m "i18n(zh): translate overview and key themes"
```

---

### Task 8: Translate the 9 category sections (cat-A…I as `.md` text)

**Files:**
- Create: `src/i18n/zh/sections/cat-A.md` … `cat-I.md`

- [ ] **Step 1: Author each `cat-<K>.md`** in this format (frontmatter + one `##` block per English card, **in the English cards' order, same count**):

```markdown
---
heading: <translated category name, no letter prefix, e.g. Agent 安全與身分>
desc: <translated category description>
---
## <card 1 translated talk title>
@ <card 1 translated speaker/source>
<card 1 translated summary (one paragraph)>

## <card 2 translated talk title>
@ <card 2 translated speaker/source>
<card 2 translated summary>
```

Read each English `src/sections/cat-<K>.html` to get the cards in order and their count. Keep proper nouns/product names. Do **not** include `#doc-N` links, ids, or counts — those come from the English shell. The 9 files are independent → translate in parallel.

- [ ] **Step 2: Build + checker** — `node build.mjs && node tools/i18n-check.mjs`. Expected: `coverage: … categories 9/9 md`, `OK structural parity`. A card-count mismatch in any `.md` shows up as an `id`/`href` FAIL (an English card left un-swapped) — fix that file's block count.

- [ ] **Step 3: Spot-check render** — open `/index.zh.html#cat-A` and a couple others; confirm headings, chips, counts, and every card (title/speaker/summary) are Chinese and the card links open the correct lightboxes.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/zh/sections/cat-*.md index.html index.zh.html
git commit -m "i18n(zh): translate the 9 category sections"
```

---

### Task 9: Translate the 99 talk notes (`doc-*.md` Markdown, fan-out)

The bulk of the work. Each `src/notes/doc-*.html` becomes a `.md` source. Dispatch parallel translator subagents (batches of ~10–20), one file per unit — they share no state.

**Files:**
- Create: `src/i18n/zh/notes/doc-*.md` (99, one per id in `src/notes/order.json`)

- [ ] **Step 1: Per-note format + procedure** (applied to every `doc-N`)

For each `src/notes/doc-N.html`, write `src/i18n/zh/notes/doc-N.md`:

```markdown
---
title: <translated talk title (the <h3>)>
speaker: <translated .lb-sc speaker/source line>
---
<translated body: the .lb-body prose as Markdown — blank line between
paragraphs; `1.` for ordered lists, `-` for bullets; `**bold**` if the
English used <strong>>
```

Translate to zh-Hant (Taiwan phrasing). Keep speaker/company/product names and jargon (RAG, LLM, Claude Code, arXiv, …) as-is. Reproduce the body's paragraph/list structure in Markdown. Do **not** author any HTML, `id`, `href`, close button, or label — the build injects the English lightbox shell and translates the fixed labels.

- [ ] **Step 2: Dispatch the fan-out** — translate all 99 files per Step 1, in parallel batches. Track completion against the 99 ids in `src/notes/order.json`.

- [ ] **Step 3: Build + full checker** — `node build.mjs && node tools/i18n-check.mjs`. Expected: `coverage: notes 99/99 md, categories 9/9 md`, `OK structural parity`, and the untranslated-text warning count near **0**. Investigate any remaining `WARN` (proper-noun-only lines are fine; real English sentences mean a missed/failed note — fix it).

- [ ] **Step 4: Spot-check a sample render** — open `/index.zh.html`, click 4–5 cards across categories; confirm each lightbox body is fully Chinese, lists render, source-video + Close work.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/zh/notes index.html index.zh.html
git commit -m "i18n(zh): translate all 99 talk notes"
```

---

### Task 10: Full end-to-end verification + docs

**Files:**
- Modify: `src/README.md`, `README.md`

- [ ] **Step 1: Full headless E2E pass** (serve via `python3 -m http.server 8123 &`, bundled Chromium at `/Users/cyyeh/.claude/skills/gstack/node_modules/playwright/index.mjs`)

Verify on `/index.zh.html` and across the switch:
  1. `zh-TW` browser on `/index.html` auto-redirects to `/index.zh.html`, no flash.
  2. Non-`zh` browser on `/index.html` stays English; all pref/loop rows from Task 2 still hold.
  3. Toggle preserves an open lightbox `#doc-1` across `EN ⇄ 中文`.
  4. **Reading progress carries across languages:** mark a talk "finished" on the English page, switch to Chinese → it stays finished; the progress bar reflects it (shared `ai-talks-read`).
  5. **Notes work on the Chinese page:** open a lightbox, select/tap a sentence, confirm it saves into "Your Notes."
  6. **Scroll-spy** highlights the active nav link while scrolling the Chinese page.
  7. Esc / backdrop / Close all dismiss lightboxes on the Chinese page.

Stop the server. Expected: all pass.

- [ ] **Step 2: Update `src/README.md`** — document `src/i18n/zh/`: HTML mirrors (`partials/*`, `sections/overview.html`, `sections/themes.html`), flat-text `sections/cat-*.md`, Markdown `notes/doc-*.md`, and `meta.json`. Explain the content pipeline (`renderMarkdown`/`assembleNote`/`assembleSection`), that `npm run build` emits `index.html` + `index.zh.html`, and how to translate/add a language (write Markdown/text; run `node tools/i18n-check.mjs`).

- [ ] **Step 3: Update top-level `README.md`** — mention the Traditional Chinese version, the `EN | 中文` toggle, and the browser-language default.

- [ ] **Step 4: Final build + checker** — `node build.mjs && node tools/i18n-check.mjs`. Expected: both pages build (each "9 categories, 99 talk notes"); `coverage: notes 99/99, categories 9/9`; `OK structural parity`.

- [ ] **Step 5: Commit**

```bash
git add src/README.md README.md index.html index.zh.html
git commit -m "docs: document the Traditional Chinese build + language toggle"
```

---

## Notes for the executor

- **Behavior scripts are frozen.** Never edit `modal.js`, `reading-progress.js`, `notes.js`, or `nav-scrollspy.js`.
- **The English page must stay behavior-identical.** After the mechanism tasks it differs from the original `index.html` only by the head detection script and the hero toggle; the content pipeline and every translation task are English-passthrough for `locale === "en"`, so `git diff` on `index.html` is empty across Tasks 4–9.
- **`index.html` and `index.zh.html` are generated artifacts** committed to the repo — regenerate (`node build.mjs`) and stage both on every commit that touches `src/`, `build.mjs`, or `src/i18n/`.
- **`tools/` is never inlined**; only `src/scripts/*.js` are.
- **Translation contributions are text-only:** notes = `doc-*.md` (Markdown), categories = `cat-*.md` (flat text), the 5 special files = HTML mirrors. `node tools/i18n-check.mjs` is the structural gate.

### Minor findings log (for the final whole-branch review)

- Task 1 `build.mjs`: two-arg `String.replace("__TITLE__", meta.title)` / toggle / detect-script substitutions would misread a `$` in the replacement string. Non-manifesting today (no `$` in any injected value). The Task 4 content pipeline deliberately uses **function replacers** for all translated-text inserts, so the same class of bug cannot occur there even with `$`-bearing prose.
