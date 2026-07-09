# `src/` — composable sources for `index.html`

The published page (`../index.html`) is **generated** from the small files in
this directory by `../build.mjs`. Edit these files, not the 44k-line
`index.html`, then run `npm run build` (or `node build.mjs`) from the repo root
to regenerate it. CSS and JS are inlined at build time, so the output stays a
single, dependency-free file you can open straight from disk.

## Layout

| Path | Contents |
|------|----------|
| `head.html` | `<!doctype>` through `<title>` (the document head, minus styles). |
| `styles.css` | All page styles (inlined into a `<style>` block by the build). |
| `partials/hero.html` | The hero header. |
| `partials/nav.html` | The sticky table-of-contents nav. |
| `partials/footer.html` | The "Method & Evidence" footer. |
| `sections/overview.html` | Category-distribution overview. |
| `sections/themes.html` | The 9 cross-cutting insights. |
| `sections/cat-A.html` … `cat-I.html` | One card grid per thematic category (A–I). |
| `notes/doc-1.html` … `doc-99.html` | One lightbox per talk with its full rendered notes. |
| `notes/order.json` | The order in which the note lightboxes are emitted. |
| `scripts/modal.js` | Hash-driven lightbox open/close + Esc handling. |
| `scripts/reading-progress.js` | Per-talk "finished" buttons and the reading-progress bar. |
| `scripts/notes.js` | Select-to-save highlighting and the "Your Notes" section. |

## Adding a talk

1. Add `notes/doc-<N>.html` with the lightbox markup for the new talk.
2. Append `"doc-<N>"` to `notes/order.json`.
3. Add its card to the relevant `sections/cat-*.html`.
4. Run `npm run build`.
