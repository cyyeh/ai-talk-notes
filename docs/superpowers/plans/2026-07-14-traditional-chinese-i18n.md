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
- `tools/i18n-check.mjs` — dev-only structure-parity checker for EN↔ZH file pairs. Not inlined, not shipped.
- `index.zh.html` — generated Chinese page.

**New — translations (`src/i18n/zh/`, mirror English structure)**
- `partials/hero.html`, `partials/nav.html`, `partials/footer.html`
- `sections/overview.html`, `sections/themes.html`, `sections/cat-A.html` … `cat-I.html`
- `notes/doc-*.html` (100 files)

**Modified**
- `build.mjs` — `buildPage(locale)` loop, `read(rel, locale)` with English fallback, head templating (lang/title/detect-script), toggle splice, `lang.js` include.
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
Expected: two summary lines, `index.html` and `index.zh.html`, each "9 categories, 100 talk notes."

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

### Task 4: Translation-integrity checker (`tools/i18n-check.mjs`)

A dependency-free dev tool that gates every translation task: for each English source that has a `src/i18n/zh/` counterpart, it asserts the two files share an identical structural skeleton (same ordered `id`/`href` values, same `<path d>` data, same count of block tags) and warns about text nodes that look untranslated (long + mostly ASCII letters).

**Files:**
- Create: `tools/i18n-check.mjs`

**Interfaces:**
- Produces: CLI `node tools/i18n-check.mjs [rel ...]` → exits `0` on parity, `1` on a structural mismatch; prints `WARN` lines for likely-untranslated text (non-fatal).

- [ ] **Step 1: Write the checker**

`tools/i18n-check.mjs`:

```js
#!/usr/bin/env node
/*
 * i18n-check.mjs — verify each translated file under src/i18n/zh/ preserves the
 * structure of its English counterpart under src/. Dependency-free. Dev tool
 * only; never inlined into the page. Exit 1 on a structural mismatch.
 *
 *   node tools/i18n-check.mjs                 # check every zh file
 *   node tools/i18n-check.mjs partials/hero.html sections/cat-A.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, "src");
const ZH = path.join(SRC, "i18n", "zh");

const attrs = (html, name) => {
    const re = new RegExp(`${name}="([^"]*)"`, "g");
    const out = [];
    let m;
    while ((m = re.exec(html))) out.push(m[1]);
    return out;
};
const tagCount = (html, tag) =>
    (html.match(new RegExp(`<${tag}[\\s>/]`, "g")) || []).length;

const STRUCT_TAGS = ["p", "li", "ol", "ul", "h1", "h2", "h3", "h4", "a", "div", "path", "svg"];
const eqList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Files whose text is translated (everything the build reads per-locale). */
function targets() {
    const list = [
        "partials/hero.html", "partials/nav.html", "partials/footer.html",
        "sections/overview.html", "sections/themes.html",
        ...["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((k) => `sections/cat-${k}.html`),
    ];
    const notesDir = path.join(SRC, "notes");
    for (const f of fs.readdirSync(notesDir))
        if (/^doc-\d+\.html$/.test(f)) list.push(`notes/${f}`);
    return list;
}

/** WARN if a text node is long and mostly ASCII letters (likely untranslated). */
function untranslatedWarnings(zhHtml) {
    const warns = [];
    const text = zhHtml.replace(/<[^>]+>/g, "\n");
    for (const raw of text.split("\n")) {
        const s = raw.trim();
        if (s.length < 40) continue;
        const letters = s.replace(/[^A-Za-z一-鿿]/g, "");
        if (!letters) continue;
        const ascii = (s.match(/[A-Za-z]/g) || []).length;
        const han = (s.match(/[一-鿿]/g) || []).length;
        if (han === 0 && ascii / letters.length > 0.6)
            warns.push(s.slice(0, 60) + (s.length > 60 ? "…" : ""));
    }
    return warns;
}

const only = process.argv.slice(2);
let failed = 0, checked = 0;
for (const rel of targets()) {
    if (only.length && !only.includes(rel)) continue;
    const zhPath = path.join(ZH, rel);
    if (!fs.existsSync(zhPath)) continue; // untranslated → English fallback, skip
    checked++;
    const en = fs.readFileSync(path.join(SRC, rel), "utf8");
    const zh = fs.readFileSync(zhPath, "utf8");
    const problems = [];
    if (!eqList(attrs(en, "id"), attrs(zh, "id"))) problems.push("id list differs");
    if (!eqList(attrs(en, "href"), attrs(zh, "href"))) problems.push("href list differs");
    if (!eqList(attrs(en, "d"), attrs(zh, "d"))) problems.push("svg path 'd' differs");
    for (const t of STRUCT_TAGS)
        if (tagCount(en, t) !== tagCount(zh, t))
            problems.push(`<${t}> count ${tagCount(en, t)}→${tagCount(zh, t)}`);
    if (problems.length) {
        failed++;
        console.error(`FAIL ${rel}: ${problems.join("; ")}`);
    } else {
        const warns = untranslatedWarnings(zh);
        console.log(`OK   ${rel}${warns.length ? `  (${warns.length} untranslated?)` : ""}`);
        for (const w of warns) console.log(`      WARN untranslated? "${w}"`);
    }
}
console.log(`\n${checked} checked, ${failed} failed.`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it against the (untranslated) tree — must pass vacuously**

Run: `node tools/i18n-check.mjs`
Expected: `0 checked, 0 failed.` (no zh content files yet), exit 0.

- [ ] **Step 3: Sanity-check the failure path**

Run: `mkdir -p src/i18n/zh/partials && sed 's/id="overview"/id="XXX"/' src/sections/overview.html > src/i18n/zh/sections/overview.html 2>/dev/null; node tools/i18n-check.mjs sections/overview.html; echo "exit=$?"`
Expected: a `FAIL sections/overview.html: id list differs` line and `exit=1`.
Then clean up: `rm -f src/i18n/zh/sections/overview.html`

- [ ] **Step 4: Commit**

```bash
git add tools/i18n-check.mjs
git commit -m "tools: add EN↔ZH translation-integrity checker"
```

---

### Task 5: Translate the chrome (hero, nav, footer)

**Files:**
- Create: `src/i18n/zh/partials/hero.html`, `src/i18n/zh/partials/nav.html`, `src/i18n/zh/partials/footer.html`

**Interfaces:**
- Consumes: `build.mjs` reads these per-locale; `tools/i18n-check.mjs` gates parity.

- [ ] **Step 1: Translate `partials/hero.html`**

Copy `src/partials/hero.html` to `src/i18n/zh/partials/hero.html` and translate **only text nodes** to zh-Hant. Preserve every tag, attribute, the `<!-- lang-toggle -->` placeholder, the `.gh-link` `href` and its SVG, and keep metric numbers (`99`, `9`). Keep the button label meaning ("View source on GitHub" → "在 GitHub 檢視原始碼"). Example key strings:
  - eyebrow "Talk Notes · Classification & Key-Point Synthesis" → "演講筆記 · 分類與重點整理"
  - h1 "AI Engineering Talks — Classified & Distilled" → "AI 工程演講 — 分類與精華整理"
  - metric labels "Talk notes"/"Thematic categories"/"Cross-cutting insights" → "演講筆記"/"主題分類"/"跨領域洞察"

- [ ] **Step 2: Translate `partials/nav.html`**

Copy and translate the nav labels; keep the `href="#…"` anchors and the `<em>NN</em>` counts unchanged. E.g. "Overview"→"總覽", "Key Themes"→"重點主題", "★ Notes"→"★ 筆記", category names (e.g. "A · BI / Analytics / Semantic Layer" → "A · BI / 分析 / 語意層").

- [ ] **Step 3: Translate `partials/footer.html`**

Copy and translate the method list and heading; keep the GitHub `href`, the repo URL text, and the SVG. Translate the "Content language" line to "內容語言：繁體中文。" and keep "Generated: 2026-07-07."→"產生日期：2026-07-07。".

- [ ] **Step 4: Build + integrity check**

Run: `node build.mjs && node tools/i18n-check.mjs partials/hero.html partials/nav.html partials/footer.html`
Expected: three `OK` lines, `0 failed.` Review any `WARN` (proper nouns/URLs are fine; real English sentences are not).

- [ ] **Step 5: Spot-check render**

Serve and open `/index.zh.html` in the headless browser; confirm the hero, nav, and footer read as Chinese, the toggle shows `中文` active, and layout is intact.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/zh/partials index.zh.html index.html
git commit -m "i18n(zh): translate hero, nav, footer"
```

---

### Task 6: Translate the overview + themes sections

**Files:**
- Create: `src/i18n/zh/sections/overview.html`, `src/i18n/zh/sections/themes.html`

- [ ] **Step 1: Translate `sections/overview.html`** — copy, translate text nodes only; preserve `id="overview"`, all classes, counts, and any inline anchors.

- [ ] **Step 2: Translate `sections/themes.html`** — copy, translate the 9 insight blocks; preserve `id="themes"`, every talk-reference `href="#doc-…"` and its (numeric/label) link text, and all structural tags.

- [ ] **Step 3: Build + integrity check**

Run: `node build.mjs && node tools/i18n-check.mjs sections/overview.html sections/themes.html`
Expected: two `OK`, `0 failed.`

- [ ] **Step 4: Spot-check render** — open `/index.zh.html#overview` and `#themes`; confirm Chinese text and that the theme→talk links still open the right lightboxes.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/zh/sections/overview.html src/i18n/zh/sections/themes.html index.zh.html index.html
git commit -m "i18n(zh): translate overview and key themes"
```

---

### Task 7: Translate the 9 category sections (A–I)

**Files:**
- Create: `src/i18n/zh/sections/cat-A.html` … `cat-I.html`

- [ ] **Step 1: Translate each `sections/cat-<K>.html`** (K = A…I): copy to the zh path, translate the category heading, description, and every card's title + summary. Preserve `id="cat-<K>"`, each card's `href="#doc-…"`, the "📄 Full notes"/badge markup, and all classes. Card titles that match a talk title should read naturally in Chinese but keep proper nouns. This is a 9-file fan-out — the files are independent and may be translated in parallel.

- [ ] **Step 2: Build + integrity check (all categories)**

Run: `node build.mjs && node tools/i18n-check.mjs sections/cat-A.html sections/cat-B.html sections/cat-C.html sections/cat-D.html sections/cat-E.html sections/cat-F.html sections/cat-G.html sections/cat-H.html sections/cat-I.html`
Expected: nine `OK`, `0 failed.`

- [ ] **Step 3: Spot-check render** — open `/index.zh.html#cat-A` and one or two others; confirm headings/cards are Chinese and card links open the correct lightboxes.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/zh/sections/cat-*.html index.zh.html index.html
git commit -m "i18n(zh): translate the 9 category sections"
```

---

### Task 8: Translate the 100 talk notes (fan-out)

The bulk of the work. Each `src/notes/doc-*.html` is an independent lightbox; translate all 100 into `src/i18n/zh/notes/`. Dispatch parallel translator subagents (batches of ~10–20), one file per unit — they share no state.

**Files:**
- Create: `src/i18n/zh/notes/doc-*.html` (100)

- [ ] **Step 1: Per-note translation procedure** (applied to every `doc-N.html`)

For each file, copy `src/notes/doc-N.html` to `src/i18n/zh/notes/doc-N.html` and translate to zh-Hant, obeying:
  - Translate **only** the visible text: the `<h3>` title, the `.lb-sc` speaker/source line, every `<p>`/`<li>` in `.lb-body`, the `.lb-note` line, and the "▶ Source video" / "Close" labels ("▶ 來源影片" / "關閉").
  - **Do not change** the outer `id="doc-N"`, `role`/`aria-modal`, the `aria-label` may be translated to the Chinese title, the `href="#_"` close links, or the `href="https://youtu.be/…"` source link.
  - Keep speaker names, company names, product names, and established jargon as-is; render explanatory prose in natural Taiwanese Chinese.
  - Preserve paragraph/list structure exactly (same number of `<p>`, `<li>`, `<ol>` as the source).

- [ ] **Step 2: Dispatch the fan-out**

Translate all 100 files following Step 1. Independent per file → run in parallel batches. Track completion against `src/notes/order.json` (100 ids).

- [ ] **Step 3: Build + full integrity check**

Run: `node build.mjs && node tools/i18n-check.mjs`
Expected: `100+ checked, 0 failed.` (all chrome/sections/notes now present). Review the `WARN untranslated?` lines and fix any that are genuine English sentences (proper-noun-only lines are fine).

- [ ] **Step 4: Spot-check a sample render** — open `/index.zh.html`, click 4–5 cards across different categories; confirm each lightbox body is fully Chinese, the source-video links work, and Close works.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/zh/notes index.zh.html index.html
git commit -m "i18n(zh): translate all 100 talk notes"
```

---

### Task 9: Full end-to-end verification + docs

Confirm every functionality survives on the Chinese page and document the two-page build.

**Files:**
- Modify: `src/README.md`, `README.md`

- [ ] **Step 1: Full headless E2E pass** (serve via `python3 -m http.server 8123 &`, bundled Chromium)

Verify on `/index.zh.html` and across the switch:
  1. `zh-TW` browser on `/index.html` auto-redirects to `/index.zh.html`, no flash.
  2. Non-`zh` browser on `/index.html` stays English; the pref/loop rows from Task 2 Step 3 all still hold.
  3. Toggle preserves an open lightbox `#doc-1` across `EN ⇄ 中文`.
  4. **Reading progress carries across languages:** mark a talk "finished" on the English page, switch to Chinese → it stays finished; the progress bar reflects it (shared `ai-talks-read`).
  5. **Notes work on the Chinese page:** open a lightbox, select/tap a sentence, confirm it saves into "Your Notes."
  6. **Scroll-spy** highlights the active nav link while scrolling the Chinese page.
  7. Esc / backdrop / Close all dismiss lightboxes on the Chinese page.

Stop the server. Expected: all pass.

- [ ] **Step 2: Update `src/README.md`** — document `src/i18n/<locale>/` (mirror structure, English fallback), `partials/lang-toggle.html`, `scripts/lang.js`, `meta.json`, and that `npm run build` now emits `index.html` + `index.zh.html`. Add a "Translating a talk" note pointing at `tools/i18n-check.mjs`.

- [ ] **Step 3: Update top-level `README.md`** — mention the Traditional Chinese version, the `EN | 中文` toggle, and the browser-language default.

- [ ] **Step 4: Final build + integrity check**

Run: `node build.mjs && node tools/i18n-check.mjs`
Expected: both pages build (each "9 categories, 100 talk notes"); `0 failed.`

- [ ] **Step 5: Commit**

```bash
git add src/README.md README.md index.html index.zh.html
git commit -m "docs: document the Traditional Chinese build + language toggle"
```

---

## Notes for the executor

- **Behavior scripts are frozen.** If a task tempts you to edit `modal.js`, `reading-progress.js`, `notes.js`, or `nav-scrollspy.js`, stop — the design guarantees they need no changes.
- **`index.html` output must stay behavior-identical** for the English reader. After the mechanism tasks, the English page differs from the pre-change version only by the head detection script and the hero toggle.
- **Regenerate and stage both `index.html` and `index.zh.html`** on every commit that touches `src/` or `build.mjs` (they are generated artifacts committed to the repo).
- **`tools/` is never inlined**; only `src/scripts/*.js` are.
