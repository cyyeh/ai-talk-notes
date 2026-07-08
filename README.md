# AI Engineering Talks — Classified & Distilled

A systematic read-through of **99 conference and YouTube talk notes** on AI
engineering, sorted into **9 thematic categories** and distilled into short,
skimmable key-point summaries — plus **9 cross-cutting insights** drawn from the
entire corpus.

The whole thing is a **single, self-contained `index.html`** file. No build
step, no server, no external dependencies — just open it in a browser.

## Highlights

- **99 talks** distilled into short key-point summaries.
- **9 thematic categories** (A–I) with a category-distribution overview.
- **9 cross-cutting insights** synthesized across all talks.
- **Dual evidence for every summary:**
  - Click a talk title (or the **📄 Full notes** button) to expand the complete
    original notes, embedded directly in the page.
  - Follow **▶ Source video** back to the original YouTube talk.
- **Fully self-contained** — all notes are rendered and embedded, so nothing
  depends on external `.md` files or a network connection.

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

Open the page in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# or serve it locally
python3 -m http.server
# then visit http://localhost:8000
```

## Method & evidence

- **Data source:** all 99 Markdown talk notes, fully rendered and embedded in a
  single HTML file (no dependency on external `.md` files).
- **Dual grounding:** every summary links to both the full original notes
  (expandable in-page) and the source YouTube video.
- **Classification:** a single primary theme per talk across the 9 categories
  (A–I); every insight is drawn from the full corpus.

## License

Released under the [MIT License](LICENSE). © 2026 cyyeh.
