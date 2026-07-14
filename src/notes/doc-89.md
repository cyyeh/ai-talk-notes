---
title: Turn 10,994 Notes Into Memory
speaker: Paul Iusztin & Louis-François Bouchard
video: https://www.youtube.com/watch?v=ZRM_TfEZcIo
---
This video introduces a system that turns a "second brain" into a research operating system usable by AI (an AI Research OS), with the emphasis on files and indexes rather than relying solely on a huge context window or a vector database.

The problem: tons of notes, but none of them get used

Paul says he has tens of thousands of notes and pieces of data (Obsidian, Readwise, Notion, Google Drive…), still growing every month, but:

- When he starts writing an article, working on a project, or coding, it's hard to "recall" what he's already looked at.
- He has to search and re-read things again, and his reading list turns into a "graveyard."
- He wants to use tools like NotebookLM or Claude Code, but they're either not customizable or agent-native enough, or they start from scratch every session, unable to accumulate structured memory.
- The traditional approach — building RAG + a vector DB — is too heavy for personal use, and too hard to inspect and maintain.

What he wants is a system that's genuinely anchored in his own notes, values, and beliefs — turning his second brain into a long-term, usable "research memory."

Evolution: from one-off research to a memory system with a "wiki layer"

V1: one-off deep research → a single research.md

At the start, they only generated course materials:

1. Input: "a topic + manually curated golden links."
2. The deep research process:

▫ A main orchestrator agent breaks the topic down into multiple questions based on the topic plus existing context.

▫ Multiple sub-agents use Gemini + Google search to gather links and write an executive summary for each one.

▫ It runs multiple rounds of queries, ending up with 40–50 links.

▫ A ranking algorithm picks out the K most informative sources for full extraction, keeping only a summary for the rest.

3. Result: a single flat ‎⁠research.md⁠ file, used to write course content.

This worked well for "producing 30-plus lessons in one shot," but the research output was static and hard to extend afterward.

V2: pointing Deep Research at the "second brain"

Next, instead of only querying the public web, they pointed the Deep Research queries at their own second brain:

- Data sources include: Obsidian, local files, Readwise, NotebookLM, GitHub, etc., still combinable with the public web.
- The input only needs to be "a topic" — no more manually supplying golden links, because the second brain itself is already a continuously growing set of high-quality sources.
- The process is similar to V1, but the sources become "data accumulated over years."

The problem: the output is still a "static research.md" — whenever you want to add to it, ask a new question, or the data goes stale, you have to rerun the whole expensive deep-research process.

V3: adding a "Wiki + Index" knowledge layer on top

Their final version is: deep research + an LLM knowledge base (a wiki layer), implemented entirely with files and references — no database.

The core structure has three layers:

1. raw/

▫ The original source files (full article text, papers, video transcripts, GitHub repo analysis results…), treated as immutable snapshots.

2. index.yaml

▫ A single YAML file that acts as "table of contents + card catalog":

▫ Every source records:

⁃ File path, original link

⁃ Source type (Obsidian, YouTube, GitHub…)

⁃ Title, author, date, a short summary

▫ It also lists the wiki pages derived from that source (concepts, entities, comparisons, notes).

▫ When querying, the agent only needs this index.yaml as the entry point to decide where to look next.

3. wiki/

▫ Generated and maintained by the LLM, including:

⁃ sources: an "expanded executive summary" for each raw source.

⁃ concepts: concept explanations distilled from multiple sources (e.g. tool registry, context compaction, sandboxing).

⁃ entities: entities related to the system (e.g. names of various harnesses, project names).

⁃ comparisons: comparisons between concepts or systems, design trade-offs.

⁃ notes / open questions: thoughts generated during research, unresolved questions, etc.

The query strategy is layered and token-saving:

1. First read ‎⁠index.yaml⁠ to see which sources are relevant.
2. Preferentially read the corresponding source's wiki summary (a longer, already-organized executive summary).
3. If that's still not enough, follow that source's links out to derived pages like concepts / entities / comparisons.
4. Only as a last resort, read the full raw source text.

Relying on nothing more than simple files + references + a layered structure gives you a memory system that's both efficient and explainable.

An important idea: a living wiki that doesn't touch your original notes

They treat the entire Obsidian vault as a "big second-brain snapshot," organized using Tiago Forte's PARA structure (Projects / Areas / Resources / Archive). The key points are:

- The original Obsidian notes are read-only — the LLM never directly modifies your handwritten notes.
- Only when you start a new project (writing an article, recording a video, making a deck, writing a book, building a piece of software…) do they run deep research for that specific project:

▫ Extracting what's needed from the big second brain plus relevant external sources,

▫ and saving it into a raw / index / wiki subtree dedicated to that project.

In addition, the wiki is "alive":

- Every time you ask a question, the system can choose to:

▫ add a new concept / comparison / note file,

▫ or update the index's summaries or links.

- You can also ingest new articles, repos, or videos at any time, or rerun a deep research pass.

The result: the wiki gradually becomes a "shared memory" between you and your agents, question by question, rather than a one-off artifact.

Tooling and implementation: the AI Research OS repo + demos

They open-sourced a sample project, the AI Research OS workshop repo, built on Claude / Claude Code + plugins, but designed to be portable to any agent harness. The video demonstrates three examples:

1. Demo 1: deep research on an existing brain-dump draft (agent engineering)

▫ Prepare a file containing a brain-dump draft on "agentic AI engineering" plus a few articles they want cited.

▫ Open a session in Claude Code, invoke the research skill, and point it at this file.

▫ The system first treats this file as seed context, uses it to design queries, then runs deep research against Obsidian, Readwise, NotebookLM, etc., building a complete wiki.

▫ You can choose the research depth (light / fast / deep), which really controls the number of rounds and queries per round — a reminder that deeper research costs more tokens.

2. Demo 2: building a wiki from just a few GitHub repos, to learn architecture design

▫ Given the URLs of three open-source harness repos (OpenCode, Pi, Hermes), explicitly stating what they want to understand:

⁃ overall architecture, agent architecture

⁃ sub-agents, memory system

⁃ permission flow, etc.

▫ The tool will:

⁃ automatically clone the repo and parse its directory structure and key files.

⁃ generate notes on each topic for every repo (e.g. "how does this repo implement its permission flow").

⁃ generate comparison files contrasting the design differences across harnesses.

▫ For engineers who want to write their own harness, this quickly surfaces "each project's design patterns" and "shared patterns."

3. Demo 3: quickly building a small wiki from just a few URLs

▫ Given a handful of arbitrary web links, the system uses curl to fetch content — no need for Obsidian / Readwise or any extra setup.

▫ It generates the same raw / index / wiki structure:

⁃ Every link gets an executive summary.

⁃ Concepts, entities, and comparisons are extracted.

▫ You can then keep asking questions based on this small wiki, and every Q&A round expands the wiki further.

They also demonstrate "asking questions using an existing wiki as context": for example, asking on a harness repo's wiki how remote sandboxing is implemented and how it plugs into the harness — the system queries the wiki + raw sources, answers, and then updates the wiki.

Design philosophy and limitations

They repeatedly emphasize a few design choices:

- Try not to reach for a vector DB or knowledge graph right away: for personal use, the infrastructure cost is high and visibility is poor, which ends up making people not want to use it.
- Prefer the local file system + markdown + YAML, because:

▫ A human can open it directly, which makes debugging and manual editing easy.

▫ It can be visualized with tools like Obsidian (graph view to see relationships between concepts).

▫ Multi-device sync is also easy (Obsidian Sync, git, or cloud drives all work).

- Everything is aimed at "teaching practical AI engineering," not building a mass-market product, so:

▫ The UI is just the terminal + Claude Code, with no fancy front end.

▫ The connectors currently only support what they themselves actually use (Obsidian, Readwise, NotebookLM, GitHub, YouTube, generic web pages, etc.).

▫ It still lacks more complete source provenance, staleness detection, and memory-compaction strategies, etc. — these are listed under "future improvements."

Finally: extending into a full course

At the end of the video, they mention that this AI Research OS is actually part of a larger body of teaching content:

- They run an "Agent Engineering" course at Towards AI Academy:

▫ The goal is for students to implement a similar multi-agent deep research + writing & research agent system from scratch.

▫ The course runs about 60 hours, and the final project is building your own multi-agent research system.

- The repo shown in this video is more of a "slimmed-down / workshop version," meant to let engineers jump in directly and rewrite their own research OS to fit their needs.

To sum up: what this whole video is trying to convey is a shift away from "hoarding tens of thousands of notes + desperately expanding the context window," and toward "designing a genuinely maintainable, growable memory layer using simple files, indexes, and a wiki structure" — so that both you and your AI agents can keep drawing on your second brain to do research and create.
