# Traditional Chinese version — design spec

- **Date:** 2026-07-14
- **Status:** Approved (design)
- **Topic:** Add a full Traditional Chinese (zh-Hant) version of the site with a language toggle that defaults to the browser language.

## Goal

Ship a complete Traditional Chinese version of the site alongside the existing
English one. A language toggle (`EN | 中文`) sits directly above the "View source
on GitHub" button. On first visit the site chooses a language from the browser's
preferred languages, defaulting to English when no Chinese preference is found.
**All existing functionality must remain unchanged.**

## Background — current architecture

- The published `index.html` (~2.3 MB) is **generated** from small composable
  sources under `src/` by `build.mjs`, which inlines CSS and JS so the output is
  a single dependency-free file that opens straight from disk.
- Content pieces: `partials/{hero,nav,footer}.html`, `sections/overview.html`,
  `sections/themes.html`, `sections/cat-A…I.html` (9 categories), and
  `notes/doc-*.html` (100 talk lightboxes), assembled in the order given by
  `notes/order.json`.
- Behavior lives in four inlined scripts, all left **untouched** by this work:
  - `modal.js` — hash-driven (`:target`) lightbox open/close + Esc.
  - `reading-progress.js` — per-talk "finished" buttons + progress bar; keys
    `ai-talks-read`, `ai-talks-hide-read` (keyed by **talk id**).
  - `notes.js` — select/tap-to-save sentence highlighting + "Your Notes"; key
    `ai-talks-notes` (keyed by sentence text within a talk).
  - `nav-scrollspy.js` — highlights the active nav link on scroll.
- `head.html` is `<!doctype>` → `<html lang="en">` → charset/viewport meta →
  `<title>`. The build then appends the `<style>` block, closes `</head>`, and
  opens `<body>`.

## Requirements

### Functional
1. Two self-contained output pages: `index.html` (English, unchanged output for
   the English reader) and `index.zh.html` (Traditional Chinese).
2. A language toggle rendered `EN | 中文`, active side highlighted, placed in
   `.hero-actions` **above** the GitHub link, on both pages.
3. Clicking the inactive language navigates to the other page, **preserving the
   current `#hash`** (open lightbox / anchor), and records the choice.
4. First-visit default follows the browser language: a `zh*` browser preference
   → Chinese page; otherwise → English page. An explicit toggle choice always
   wins on subsequent visits.
5. Full translation to zh-Hant (Taiwan-style): hero, nav, overview, 9 themes, 9
   category headings/blurbs, all 100 talk essays (titles, subtitles, bodies,
   footer notes), page `<title>`, and user-facing `aria-label`/alt text.

### Non-functional
- Output stays dependency-free and openable from disk (`file://`) and from a
  static host (GitHub Pages) at either the domain root or a project subpath →
  **relative links only**.
- No changes to the four behavior scripts. No duplicate element `id`s.
- No visible flash of the wrong language on auto-redirect.
- Redirect logic is provably loop-free.

## Design

### 1. Source layout

`src/` remains the **English** source (unchanged). Translations live under
`src/i18n/zh/`. To make future translation contributions **text-only**, the
translatable content uses three source formats matched to its structure:

- **Notes → Markdown** (`src/i18n/zh/notes/doc-*.md`): a contributor writes just
  the prose. Frontmatter carries `title` + `speaker`; the body is Markdown
  (paragraphs, `-`/`1.` lists, `**bold**` — the full vocabulary the note bodies
  use). The build renders it and injects it into the **English lightbox shell**
  (`id`, YouTube `href`, close buttons, footer note, and affordance labels all
  come from the English file / a shared label map).
- **Category sections → flat text** (`src/i18n/zh/sections/cat-*.md`):
  frontmatter (`heading`, `desc`) plus one `## <card title>` / `@ <speaker>` /
  summary block per card, in the English cards' order. No Markdown rendering
  (card fields are single strings). The build maps blocks onto the English
  `<article>` cards, preserving `#doc-N` links, ids, colors, count, and labels.
- **Special-structure files → HTML mirrors:** `partials/{hero,nav,footer}.html`,
  `sections/overview.html`, `sections/themes.html` — these carry SVGs, metric
  blocks, distribution stats, and inline `#doc-N` citation links that don't
  reduce to plain text. Translated once as full HTML copies of the same
  structure.
- `src/i18n/zh/meta.json` — `{ "title": "…" }`, the Chinese `<title>`. (The
  footer language line is handled inside the translated `footer.html`.)
- **Shared, read once, never duplicated / translated:** `styles.css`, all four
  behavior `scripts/*.js`, `notes/order.json`, structural wrappers emitted by
  the build, and all SVG icon markup.
- New shared partial `src/partials/lang-toggle.html` — the toggle markup,
  authored once and injected into both pages.

The **English page is unaffected**: for `locale === "en"` (or any note/section
with no translation source) the assemblers pass the English file through
verbatim, so `index.html` output does not change.

### 2. Build changes (`build.mjs`)

- Refactor the assembly body into `buildPage(locale)` where `locale ∈ {"en","zh"}`,
  called once per locale. `en` → `index.html`, `zh` → `index.zh.html`.
- `read(rel, locale)` resolution:
  - `locale === "zh"` and `src/i18n/zh/<rel>` exists → read the zh file.
  - otherwise → read `src/<rel>` (English). **English is the fallback** for any
    missing translation, so the page always builds and partial translation is
    safe to commit.
- Per-locale injected values:
  - `<html lang>` → `en` or `zh-Hant`.
  - `<title>` → English title / `meta.json.title`.
  - The **language-detection script** (below), with `PAGE_LANG` set to the
    locale, injected in `<head>` **immediately after the charset/viewport meta
    tags and before `<title>`** (charset stays first; a synchronous inline head
    script still runs before body render).
  - `window.__PAGE_LANG__ = "<locale>"` set by that same script for later use.
  - The footer "Content language" line.
- `src/partials/lang-toggle.html` is spliced into each hero via a placeholder
  comment `<!-- lang-toggle -->` that both hero files carry inside
  `.hero-actions`, immediately before the GitHub `<a>`.
- A new small shared script `scripts/lang.js` is inlined at the **end of body**
  with the others (it needs the toggle in the DOM); it wires toggle behavior.
- Build prints a one-line summary per page (lines, categories, notes).

### 3. Language toggle

Shared markup (`src/partials/lang-toggle.html`), same on both pages:

```html
<div class="lang-toggle" role="group" aria-label="Language / 語言">
    <a class="lang-opt lang-opt--en" href="index.html" hreflang="en">EN</a>
    <span class="lang-sep" aria-hidden="true">|</span>
    <a class="lang-opt lang-opt--zh" href="index.zh.html" hreflang="zh-Hant">中文</a>
</div>
```

- **Active-state highlight is pure CSS**, keyed off the root `lang`:
  - `html[lang="en"] .lang-opt--en { /* active */ }`
  - `html[lang^="zh"] .lang-opt--zh { /* active */ }`
  New rules added to the shared `styles.css`. Styling matches the existing
  `.gh-link` visual language (pill, hover, focus-visible ring).
- **`scripts/lang.js`** (shared, end of body):
  - On load, set `aria-current="true"` on the option matching
    `window.__PAGE_LANG__`.
  - On click of either option: `localStorage.setItem("ai-talks-lang", <lang>)`,
    then `location.assign(href + location.hash)` and `preventDefault()` — so the
    open lightbox / anchor is preserved and Back returns to the prior language.
    (Clicking the already-active option just re-stores the pref and stays.)
  - All wrapped in `try/catch` for `localStorage` (private-mode safe).

### 4. Language detection & redirect (default = browser language)

Inline script injected in `<head>` (after the charset/viewport meta, before
`<title>`) on both pages, with `PAGE_LANG` set by the build:

```js
(function () {
    var PAGE_LANG = "en"; // build injects "en" or "zh"
    window.__PAGE_LANG__ = PAGE_LANG;
    var LANG_KEY = "ai-talks-lang";
    var pref = null;
    try { pref = localStorage.getItem(LANG_KEY); } catch (e) {}

    function browserWantsZh() {
        var langs = navigator.languages ||
            (navigator.language ? [navigator.language] : []);
        for (var i = 0; i < langs.length; i++) {
            if (/^zh\b/i.test(langs[i] || "")) return true;
        }
        return false;
    }

    var target = null;
    if (PAGE_LANG === "en") {
        if (pref === "zh") target = "index.zh.html";
        else if (!pref && browserWantsZh()) target = "index.zh.html";
    } else { // PAGE_LANG === "zh"
        if (pref === "en") target = "index.html";
    }
    if (target) location.replace(target + location.hash);
})();
```

**Decision table**

| Page | stored pref | browser | result |
|------|-------------|---------|--------|
| en | `zh` | — | → `index.zh.html` |
| en | none | `zh*` | → `index.zh.html` |
| en | none | non-zh | stay (English default) |
| en | `en` | — | stay |
| zh | `en` | — | → `index.html` |
| zh | `zh` / none | — | stay |

- **Loop-free:** every redirect target is a state that will not redirect again
  (pref matches the destination page, or the destination is terminal for that
  condition). Verified across all six rows.
- **Any `zh*` (incl. zh-CN) → Chinese page:** the only non-English version is
  Traditional Chinese, so all Chinese browser preferences resolve to it. This is
  intentional.
- A user who directly opens `index.zh.html` without an `en` preference **stays**
  on Chinese (shared Chinese links and the toggle work; we never bounce a
  direct Chinese visit away unless they explicitly chose English before).
- `location.replace` (not `assign`) on auto-redirect → no extra history entry,
  Back is not trapped.
- A synchronous inline script in `<head>` fires before body render → no flash
  of the wrong language (its exact position after the meta tags is fine).

### 5. Content pipeline (Markdown/text → HTML)

`build.mjs` gains a small **zero-dependency** content pipeline used only for the
Markdown/text sources; HTML-mirror files still flow through `read(rel, locale)`.

- **`renderMarkdown(md)`** — a ~35-line renderer for the note-body vocabulary:
  blank-line-separated paragraphs → `<p>`, `-`/`*` → `<ul>`, `1.` → `<ol>`,
  `**bold**` → `<strong>`, HTML-escaping text. No other constructs are needed
  (note bodies use only `p/ul/ol/li/strong`).
- **`parseFrontmatter(text)`** → `{ data, body }` splits a leading `---`-fenced
  `key: value` block from the body.
- **`assembleNote(locale, id)`** — returns the English `notes/<id>.html`
  verbatim when `locale === "en"` or no `doc-<id>.md` exists; otherwise uses the
  English lightbox as the shell and replaces only the translatable regions: the
  `<h3>` title, the `.lb-sc` speaker line, the `.lb-body` inner HTML (rendered
  Markdown), the dialog `aria-label` (→ title), and the fixed labels via the
  label map. `id`, `role`, `href`s and close controls are preserved from the
  shell.
- **`assembleSection(locale, key)`** — same shape for `sections/cat-<key>.html`:
  passes English through unless `cat-<key>.md` exists, else swaps the `<h2>`
  heading text, `.catdesc`, every `.chip` (→ `<letter> · <heading>`), the count
  unit, and each `<article>`'s `.card-title` / `.sc` / `.sm` from the ordered
  `##` blocks. Card count in the `.md` must equal the English `<article>` count.
- **`LABELS[locale]`** — the fixed-string map: `▶ Source video`, `Close`, the
  `.lb-note` line, `📄 Full notes`, and the `talks` count unit.
- `buildPage` uses `assembleNote` / `assembleSection` for notes and category
  sections; HTML-mirror files (chrome, overview, themes) keep using
  `read(rel, locale)` with English fallback.

Because the assemblers pass English through untouched when a translation source
is absent, an untranslated note or category simply renders in English on the
Chinese page — the same graceful fallback as the HTML-mirror files.

### 6. Translation scope & conventions

- Target: **Traditional Chinese, Taiwan-style phrasing** (zh-Hant).
- **Notes** (`doc-*.md`): translate the frontmatter `title` + `speaker` and the
  Markdown body prose; keep to the supported Markdown vocabulary.
- **Category sections** (`cat-*.md`): translate `heading`, `desc`, and each
  card's title / `@ speaker` / summary, in the English cards' order (same count).
- **HTML-mirror files** (chrome, overview, themes): translate visible text nodes
  only. **Never touch** `id`, `class`, `href` (YouTube/GitHub URLs), SVG path
  data, inline `#doc-N` citation targets, or structural markup. Translate
  user-facing `aria-label`/alt text (e.g. `Close` → `關閉`).
- **Keep as-is** (English or established form): product/speaker names and
  established jargon (RAG, LLM, TDD, Claude Code, arXiv) unless a natural common
  Chinese term exists.
- The ZH footer "Content language" line → `內容語言：繁體中文` (in the translated
  `footer.html`).
- Numeric metrics/counts ("99", "9") stay numeric.

### 7. Preserved functionality (unchanged scripts)

- `modal.js`, `nav-scrollspy.js`: work per-page unchanged; ids/hashes identical
  across languages.
- `reading-progress.js`: keys `ai-talks-read` / `ai-talks-hide-read` are keyed by
  **talk id** and share the origin's localStorage → **progress carries across
  both languages**.
- `notes.js`: key `ai-talks-notes` stores highlights by sentence text →
  **highlights are naturally per-language** (you highlight the language you read).
  Acceptable and expected; no change.
- New key `ai-talks-lang` is additive and does not collide.

## File-by-file change list

**New**
- `src/i18n/zh/partials/{hero,nav,footer}.html` (HTML mirrors)
- `src/i18n/zh/sections/{overview,themes}.html` (HTML mirrors)
- `src/i18n/zh/sections/cat-*.md` (9 flat-text section files)
- `src/i18n/zh/notes/doc-*.md` (99 Markdown note files)
- `src/i18n/zh/meta.json`
- `src/partials/lang-toggle.html`
- `src/scripts/lang.js`
- `tools/i18n-check.mjs` (dev-only checker)
- `index.zh.html` (generated)

**Modified**
- `build.mjs` — `buildPage(locale)`, `read(rel, locale)` with EN fallback,
  per-locale head/title/lang injection, toggle splice, `lang.js` include, and
  the content pipeline (`renderMarkdown`, `parseFrontmatter`, `assembleNote`,
  `assembleSection`, `LABELS`).
- `src/head.html` — build injects `<html lang>`, the head detection script, and
  `<title>` (via placeholders).
- `src/partials/hero.html` — add `<!-- lang-toggle -->` placeholder in
  `.hero-actions` above the GitHub link.
- `src/styles.css` — `.lang-toggle` / `.lang-opt` / active-state rules.
- `src/README.md` — document the `i18n/zh/` layout (md/text + HTML mirrors) and
  the two-page build.
- `README.md` — note the Chinese version and how the language toggle works.
- `index.html` (regenerated).

## Edge cases

- **Missing translation source** (`.md` for a note/section, or a missing HTML
  mirror) → the assembler / `read()` falls back to the English source; the page
  still builds (English content on the Chinese page for that piece).
- **Card-count mismatch** (a `cat-*.md` with more/fewer `##` blocks than the
  English section has `<article>`s) → the checker fails via `id`/`href` parity;
  the assembler leaves unmatched English cards untouched rather than corrupting
  structure.
- **localStorage unavailable** (private mode / `file://` restrictions) → detection
  degrades to browser-language only; toggle still navigates (pref write is
  wrapped in try/catch).
- **Direct `file://` open** → sibling relative links (`index.html` /
  `index.zh.html`) resolve; hash is preserved.
- **Hash with special anchors** (e.g. `#_` used to close a lightbox) → appended
  verbatim on switch; harmless.
- **Duplicate ids across pages** → not possible; the two languages live in
  separate files.

## Testing / verification

1. `npm run build` produces both `index.html` and `index.zh.html`; summary line
   reports 9 categories and 99 notes for each. `tools/i18n-check.mjs` compares
   the two built pages — identical ordered `id`/`href`/SVG-path lists and equal
   lightbox/article/section counts (proving the assemblers preserved every
   shell) — and reports translation coverage + untranslated-text warnings.
2. Headless browser (bundled Playwright, per project memory
   `headless-browser-verification`):
   - Non-`zh` browser opens `index.html` → stays English.
   - `zh-TW` browser opens `index.html` → auto-redirects to `index.zh.html`, no
     flash, correct Chinese hero.
   - Toggle `EN → 中文` with a lightbox open (`#doc-1`) → lands on
     `index.zh.html#doc-1` with the Chinese lightbox open.
   - Mark a talk "finished" in English, switch to Chinese → progress persists;
     progress bar reflects it.
   - On the Chinese page: open a lightbox, select/tap a sentence to save a note,
     confirm "Your Notes" works; scroll-spy highlights the active nav link.
   - Re-open `index.html` after choosing 中文 → redirects to Chinese (pref wins);
     choosing EN on the Chinese page and reopening → stays English (no loop).
3. Spot-check rendered Chinese for structural integrity: ids/links/SVGs intact,
   no broken markup, counts unchanged.

## Out of scope / future

- Simplified Chinese or any third language (the layout supports adding
  `src/i18n/<locale>/` later).
- Instant in-place (no-reload) toggle (Approach A) — rejected for weight/risk.
- Translating localized note **highlights** across languages.
- SEO `hreflang` `<link>` alternates (could be added later; not required now).
