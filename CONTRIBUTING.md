# Contributing

> **English** · [繁體中文](CONTRIBUTING.zh-TW.md)

Thanks for your interest in improving **AI Engineering Talks — Classified &
Distilled**! New talks, corrections, and translations are all welcome. This
guide covers how the site is built and how to add or translate content.

## How it works

The two published pages — `index.html` (English) and `index.zh.html` (Traditional
Chinese) — are **generated** from small sources under [`src/`](src/) by
[`build.mjs`](build.mjs). CSS and JS are inlined, so each page is a single,
dependency-free file you can open straight from disk.

**All talk content is authored in Markdown**, for every language. The build
renders that Markdown into language-agnostic HTML *shells*:

- **Notes** — `src/notes/shell.html` (the lightbox shell) + `src/notes/doc-*.md`
  (English) + `src/i18n/<locale>/notes/doc-*.md` (translations).
- **Category cards** — `src/sections/cat-*.html` (structural shells) +
  `src/sections/cat-*.md` (English) + `src/i18n/<locale>/sections/cat-*.md`.
- **Chrome / overview / themes** — small HTML files (`src/partials/*.html`,
  `src/sections/overview.html`, `src/sections/themes.html`) because they carry
  SVGs, metric blocks, and inline citation links that don't reduce to plain text;
  translations are full HTML mirrors under `src/i18n/<locale>/`.

Anything without a translation **falls back to English**, so partial translations
are always safe to commit.

## Build & check

```bash
npm run build              # or: node build.mjs — emits index.html + index.zh.html
node tools/i18n-check.mjs  # verify the two pages stay structurally identical
```

`i18n-check.mjs` compares the two built pages for identical `id`/`href`/SVG
structure and shell counts, reports translation coverage, and flags any
untranslated text or a literal `undefined` from a missing frontmatter field. It
should exit `0` with no `FAIL` lines. Requires Node.js; no packages to install.

## Markdown formats

### A talk note — `doc-<N>.md`

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

- `title`, `speaker`, and `video` are all required (a missing field renders the
  literal text `undefined`, which the checker flags).
- `video` is language-agnostic: only the **English** `doc-<N>.md` needs it;
  translations inherit it.

### A category section — `cat-<K>.md`

```markdown
---
heading: Category name (no letter prefix)
desc: One-sentence description of the category.
---
## Card 1 talk title
@ Speaker, Company
One-paragraph summary of the talk.

## Card 2 talk title
@ Speaker
Another summary.
```

The `##` blocks map onto the section's cards **in order**, so there must be
exactly one block per card. Do not put `#doc-N` links, ids, or counts here —
those live in the shell (`cat-<K>.html`).

## Adding a talk

1. **Note** — create `src/notes/doc-<N>.md` (format above) with `<N>` the next
   free number.
2. **Order** — append `"doc-<N>"` to `src/notes/order.json`.
3. **Card structure** — in the right `src/sections/cat-<K>.html` shell, copy an
   existing `<article class="card">` and set its `id="t<N>"`, the `#NN` idnum,
   both `href="#doc-<N>"`, and the `.src` link's `href` to the video. Leave the
   `.card-title` link, `.sc`, and `.sm` text **empty** — the build fills them.
4. **Card text** — add a `## title / @ speaker / summary` block to
   `src/sections/cat-<K>.md` in the same position as the card.
5. **(Optional) translate** — add `src/i18n/zh/notes/doc-<N>.md` and a matching
   card block in `src/i18n/zh/sections/cat-<K>.md`.
6. **Build & check** — `npm run build && node tools/i18n-check.mjs`.

## Translating

Translations are text-only. To translate an existing talk into an existing
locale (e.g. `zh`):

1. Add `src/i18n/zh/notes/doc-<N>.md` — same format as the English note, but you
   only need `title` + `speaker` in the frontmatter (the `video` is inherited).
   Translate the body prose to **Traditional Chinese, Taiwan-style (zh-Hant)**.
2. Translate the card in `src/i18n/zh/sections/cat-<K>.md` (same `##` block
   position/order as the English card).
3. Keep speaker/company/product names and established jargon (RAG, LLM, MCP,
   Claude Code, …) as-is where natural; never change `id`/`href`/structure in the
   HTML-mirror files.
4. `npm run build && node tools/i18n-check.mjs`, then open `index.zh.html` to
   spot-check.

### Adding a new language

The Markdown/text pipeline is locale-generic, but a brand-new language also needs
a few wiring changes:

1. Create `src/i18n/<locale>/` mirroring `zh/`: `meta.json` (page `<title>`),
   `notes/doc-*.md`, `sections/cat-*.md`, and HTML mirrors of `partials/*.html`,
   `sections/overview.html`, and `sections/themes.html`.
2. In `build.mjs`, add the locale to `LOCALES` and a `LABELS[<locale>]` entry
   (source-video / close / full-notes / talks / footer-note strings), and extend
   the head detection/redirect script and the `EN | 中文` toggle for the new page.
3. Add a `T[<locale>]` string table in `src/scripts/reading-progress.js` and
   `src/scripts/notes.js` so their injected UI is localized.

## Conventions

- Regenerate (`npm run build`) and commit both `index.html` and `index.zh.html`
  along with your source changes — they are committed build artifacts.
- Keep commits focused; run `node tools/i18n-check.mjs` before pushing.
- `modal.js` and `nav-scrollspy.js` inject no user-facing text and should not
  need edits; `reading-progress.js` / `notes.js` keep all UI strings in a
  `T[lang]` table.
