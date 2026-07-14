# `src/` — composable sources for the built pages

The published pages (`../index.html` and `../index.zh.html`) are **generated**
from the small files in this directory by `../build.mjs`. Edit these files, not
the generated pages, then run `npm run build` (or `node build.mjs`) from the repo
root to regenerate them. CSS and JS are inlined at build time, so each output
stays a single, dependency-free file you can open straight from disk.

One build emits **two pages**: `index.html` (English) and `index.zh.html`
(Traditional Chinese). Talk notes and category cards are authored in **Markdown**
for *every* language and rendered into language-agnostic shells; anything without
a translation falls back to English.

> New here? See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for the Markdown
> formats and step-by-step "add a talk" / "translate" instructions.

## Layout

| Path | Contents |
|------|----------|
| `head.html` | `<!doctype>` through `<title>`. The build injects `<html lang>`, the `<title>`, and a tiny language-detection/redirect script per locale. |
| `styles.css` | All page styles (inlined into a `<style>` block by the build). |
| `partials/hero.html` | The hero header (carries a `<!-- lang-toggle -->` placeholder above the GitHub link). |
| `partials/lang-toggle.html` | The shared `EN | 中文` toggle, spliced into both heroes. |
| `partials/nav.html` | The sticky table-of-contents nav. |
| `partials/footer.html` | The "Method & Evidence" footer. |
| `sections/overview.html` | Category-distribution overview (HTML). |
| `sections/themes.html` | The 9 cross-cutting insights, with inline `#doc-N` citations (HTML). |
| `sections/cat-A.html` … `cat-I.html` | Structural **shells** for the category card grids (ids, colors, `#doc-N` links, videos — no prose). |
| `sections/cat-A.md` … `cat-I.md` | **English** card text (heading, desc, per-card title/speaker/summary). |
| `notes/shell.html` | The single lightbox **shell** all notes render into. |
| `notes/doc-1.md` … `doc-99.md` | **English** note sources (frontmatter title/speaker/video + Markdown body). |
| `notes/order.json` | The order in which the note lightboxes are emitted. |
| `scripts/modal.js` | Hash-driven lightbox open/close + Esc handling. |
| `scripts/reading-progress.js` | Per-talk "finished" buttons and the reading-progress bar. |
| `scripts/notes.js` | Select- or tap-to-save highlighting and the "Your Notes" section. |
| `scripts/nav-scrollspy.js` | Highlights the active nav link on scroll. |
| `scripts/lang.js` | Language-toggle behavior (marks the active option; on click stores the choice and navigates with the current `#hash`). |
| `i18n/<locale>/` | Per-locale translations (see below). |

`reading-progress.js` and `notes.js` build their UI at runtime; their user-facing
strings live in a `T[lang]` table keyed by `window.__PAGE_LANG__`, so the injected
UI is localized too. `modal.js` and `nav-scrollspy.js` inject no text.

## The content pipeline

`build.mjs` renders content into shells via a small, zero-dependency pipeline:

- `renderMarkdown` — paragraphs, `1.`/`-` lists (`<ol start>` continuations
  preserved), `**bold**`, and `\`-terminated hard breaks.
- `parseFrontmatter` — splits a `---`-fenced `key: value` block from the body.
- `assembleNote(locale, id)` — fills `notes/shell.html` with a locale's Markdown
  (`title`/`speaker`/body) + `LABELS[locale]`; `video` comes from the English note.
- `assembleSection(locale, key)` — fills the `cat-<key>.html` shell from a locale's
  `cat-<key>.md` (`##` card blocks mapped onto the cards in order).

## Internationalization (`i18n/`)

English content lives under `src/` (`notes/doc-*.md`, `sections/cat-*.md`);
translations mirror it under `src/i18n/<locale>/`. For `src/i18n/zh/`:

| Path | Format | Notes |
|------|--------|-------|
| `meta.json` | JSON | `{ "title": "…" }` — the page `<title>`. |
| `notes/doc-*.md` | Markdown | Frontmatter `title` + `speaker`, then the body prose as Markdown. (`video` is inherited from the English note.) |
| `sections/cat-*.md` | Flat text | Frontmatter `heading` + `desc`, then one `## <card title>` / `@ <speaker>` / summary block per card, in the cards' order and count. |
| `partials/{hero,nav,footer}.html`, `sections/{overview,themes}.html` | HTML mirror | Full HTML copies with the same structure (SVGs, metrics, inline citations don't reduce to plain text). Translate visible text only; never touch `id`/`class`/`href`/SVG data. |

`node tools/i18n-check.mjs` (dev-only, in `../tools/`) compares the two built
pages for identical `id`/`href`/SVG/shell structure, reports coverage, and flags
untranslated text or a literal `undefined` from a missing frontmatter field. Run
it after every build.

## Adding a talk / a language

See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for the full steps. In short: add
`notes/doc-<N>.md`, append the id to `notes/order.json`, add the card structure to
a `sections/cat-<K>.html` shell + its text to `sections/cat-<K>.md`, then
`npm run build && node tools/i18n-check.mjs`.
