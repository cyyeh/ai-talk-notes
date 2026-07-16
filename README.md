# AI Engineering Talks — Classified & Distilled

> **English** · [繁體中文](README.zh-TW.md)

A systematic read-through of **100 conference and YouTube talk notes** on AI
engineering, sorted into **9 thematic categories** and distilled into short,
skimmable key-point summaries — plus **9 cross-cutting insights** drawn from the
entire corpus.

The published page is a **single, self-contained `index.html`** — no server, no
external dependencies, just open it in a browser. That file is now **generated
from small, composable sources** under [`src/`](src/) by a tiny build script
([`build.mjs`](build.mjs)), so you edit focused partials instead of one
44k-line monolith. CSS and JS are inlined at build time, keeping the output
dependency-free.

The site ships in **English and Traditional Chinese**. A language toggle
(`EN | 中文`) sits just above the *View source on GitHub* button; the first
visit follows your browser's language (any `zh*` preference → Chinese, otherwise
English) and your choice is remembered. The build emits two self-contained
pages — `index.html` (English) and `index.zh.html` (Traditional Chinese) — and
the toggle switches between them while preserving your place on the page.

## Highlights

- **100 talks** distilled into short key-point summaries.
- **9 thematic categories** (A–I) with a category-distribution overview.
- **9 cross-cutting insights** synthesized across all talks.
- **Dual evidence for every summary:**
  - Click a talk title (or the **📄 Full notes** button) to expand the complete
    original notes, embedded directly in the page.
  - Follow **▶ Source video** back to the original YouTube talk.
- **Personal notes** — inside a talk's full notes, select a sentence (or, on a
  phone, tap a sentence — tap again to extend across more sentences) and choose
  **★ Save as note** to highlight it. Saved notes are collected in a **Your
  Notes** section grouped by talk and persist in your browser.
- **Fully self-contained output** — all notes are rendered and embedded, so the
  published `index.html` depends on no external files or network connection.
- **Composable sources** — the page is built from small partials (`src/`), so
  it's easy to edit and extend without touching a giant single file.

## Categories

| # | Category | Talks |
|---|----------|:-----:|
| A | BI / Analytics / Semantic Layer | 11 |
| B | Agent Evaluation & Observability | 15 |
| C | Agent Architecture, Reliability & Productionization | 12 |
| D | Agent Security & Identity | 6 |
| E | Context / Memory / RAG | 11 |
| F | Data Infrastructure | 14 |
| G | Model Training & Inference | 15 |
| H | AI Coding & AI-Native Engineering | 9 |
| I | Product Strategy & Business | 6 |

Each talk is assigned a single primary theme.

## Cross-cutting insights

1. The semantic layer is being redefined — sinking from BI tools down into
   "context that agents consume."
2. The key to reliable text-to-SQL is grounding and data modeling, not a bigger
   model.
3. Evals move from "gut feel" to data-driven engineering.
4. From PoC to production: reliability is systems engineering, not a model
   problem.
5. Context engineering and memory decide whether an agent uses the right data.
6. Data infrastructure is being reshaped for AI / agents.
7. Security and identity are prerequisites for agents to access enterprise data.
8. The future of BI and the product data flywheel.
9. Small, specialized models / agents beat big and general-purpose ones.

## Usage

Open the published page in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# or serve it locally
python3 -m http.server
# then visit http://localhost:8000
```

## Project structure

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
  sections/       # overview.html, themes.html; cat-*.md (English card text + color/docs)
  notes/          # shell.html + doc-*.md (English notes) + order.json
  scripts/        # modal, reading-progress, notes, nav-scrollspy, lang
  i18n/zh/        # Traditional Chinese content (notes/*.md, sections/cat-*.md, HTML mirrors)
```

All talk notes and category cards are authored in **Markdown** and rendered into
language-agnostic HTML; see [`src/README.md`](src/README.md) for the full
layout and [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to add or translate one.

## Development

`index.html` is a build artifact — edit the files under `src/` instead, then
regenerate:

```bash
npm run build   # or: node build.mjs
```

The build only concatenates, inlines, and renders (no dependencies to install),
and the result is reproducible. Requires Node.js. One run emits both
`index.html` and `index.zh.html`.

**All content is Markdown.** Talk notes (`notes/doc-*.md`) and category cards
(`sections/cat-*.md`) are authored as Markdown / flat text and rendered into
language-agnostic HTML — English under `src/`, each translation under
`src/i18n/<locale>/`. Untranslated pieces fall back to English. After building,
run `node tools/i18n-check.mjs` to verify the two pages stay structurally
identical.

## Contributing

Contributions — new talks, corrections, and translations — are welcome. All
content is authored in Markdown, and one build renders both language pages from
it. See **[`CONTRIBUTING.md`](CONTRIBUTING.md)** ([繁體中文](CONTRIBUTING.zh-TW.md))
for the content model, the Markdown formats, how to add a talk, and how to add or
improve a translation.

## Method & evidence

- **Data source:** all 100 Markdown talk notes, fully rendered and embedded in
  the built page (no dependency on external `.md` files).
- **Dual grounding:** every summary links to both the full original notes
  (expandable in-page) and the source YouTube video.
- **Classification:** a single primary theme per talk across the 9 categories
  (A–I); every insight is drawn from the full corpus.

## License

Released under the [MIT License](LICENSE). © 2026 cyyeh.
