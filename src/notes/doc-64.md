---
title: RAG is dead, right??
speaker: Kuba Rogut, Turbopuffer
video: https://www.youtube.com/watch?v=UM6sFg_jdlE
---
This video argues that "RAG isn't dead — what's dead is everyone's narrow definition of RAG," and uses the contrast between Cursor and Claude Code to show that the future is "multi-tool, agentic retrieval."

Here's a condensed summary:

Kuba starts by mentioning the "RAG is dead" trend on Twitter, but at the same time, Google search volume for RAG actually saw a fresh surge in mid-2025 — showing that the actual usage curve is running opposite to the prevailing sentiment.

He then redefines what RAG actually is. Many people think RAG is just "vector search plus stuffing results into the LLM," but from Turbopuffer's point of view, retrieval is an entire toolkit: vector search, full-text search (BM25), grep, glob, regex, and various filters — all of which can be called repeatedly by an agent until enough context is found, which is then handed off to the LLM for generation. In practice, so-called "agentic search" often just means letting the agent decide for itself how to grep or search the file system, read files, and keep looking if it decides that's not enough, advancing the task step by step.

He uses Cursor as a success story. When you open a codebase or branch, Cursor first does an "index plus embed" pass: it chunks the code, embeds it, and stores it in Turbopuffer, using a Merkle tree to determine whether codebases across different engineers are similar, so only changed files need reprocessing — avoiding everyone recomputing everything from scratch every time. This upfront cost buys them, on their internal benchmark, roughly a 12–13% improvement in overall answer accuracy, rising to as much as 24% for the composer model; online A/B tests also showed a 2.6% improvement in code retention on large codebases, and a 2.2% drop in dissatisfied requests. The numbers look small, but since semantic search isn't triggered on every single query, averaged across the full volume of requests it's still quite significant.

Claude Code, by contrast, chooses "no vector indexing" — instead, within each session it repeatedly uses grep-like methods to read files, search, and read again. That's not wrong, it's a tradeoff: you avoid paying a large upfront indexing cost, but the price is that every time you ask a similar question, you rescan files and burn tokens again. Kuba uses this contrast to introduce a key idea: embeddings can be thought of as "cached compute" — you spend compute and money upfront to cache the results of semantic understanding, and many subsequent queries can then share that cache. Whether it's worth it depends on query volume and usage patterns.

In the second half, he contrasts "simple RAG" with "agentic retrieval." Early on, the approach was "one vector search → stuff all the results into the context window," which was barely adequate in 2023 and early 2024, but now more mature customers let the agent perform multi-stage, repeated retrieval: calling semantic search or full-text search only when needed, narrowing the scope step by step, grabbing only what's actually needed at each step, and then moving forward. Retrieval is no longer a single call, but a recurring action throughout the whole reasoning process.

Finally, he cites Jeff Dean's view on large context windows: even if a model has "a trillion tokens of context," what really matters isn't ingesting everything, but having a staged retrieval process that quickly narrows a massive corpus down to "the right million tokens." Among Turbopuffer's customers, people might store trillions of tokens in their corpus, but the system's real job is to help you find "the small number of tens of thousands to a million tokens that truly belong in context."

Overall, the video's thesis is: RAG isn't just alive, it's evolving into an agent-driven, multi-tool hybrid retrieval system; the real point of contention isn't "whether to use RAG," but "when to pay the upfront cost of indexing/embedding to treat semantics as a cache," and how to design good agent workflows that make retrieval staged, iterative, and genuinely useful.
