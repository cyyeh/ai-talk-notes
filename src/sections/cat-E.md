---
heading: Context / Memory / RAG
desc: Context engineering, memory systems, hybrid retrieval, agentic RAG: what determines whether an agent can get to the "right" context.
color: #ea580c
docs: 21, 26, 28, 29, 30, 33, 45, 55, 64, 89, 94
---
## Building Agentic RAG Systems with ClickHouse
@ ClickHouse
Demonstrates spinning up a complete agentic RAG stack — ClickHouse + LibreChat + MCP + LangFuse — with one Docker Compose command, letting an agent query ClickHouse in natural language via MCP and output interactive chart artifacts. Showcases skills, sub-agents, RBAC, and using LLM-as-a-judge in LangFuse to sample-evaluate traces.

## Bypassing the Multimodal Tax: Hybrid RAG, SQL RRF & UI Telemetry
@ Abed Matini, Ogilvy
Demonstrates building a production-ready enterprise RAG FAQ chatbot using a local-first, low-framework, SQL-heavy approach: Docling converts documents into clean Markdown, chunking follows a deliberate strategy, and Postgres plus pgvector does hybrid retrieval combining vectors, BM25, and RRF, before handing off to a small local model to answer. Emphasizes replacing agents with plain Python functions to cut latency, running guardrails before hitting the LLM, and using Langfuse plus a frontend widget for observability.

## Context Engineering 2.0: Unifying MCP, Agentic RAG, and Memory
@ Redis
Argues that the key to a usable agent is the "context engine," not the model, upgrading RAG from linear pre-querying into a tool agents can navigate autonomously (Agentic RAG), while emphasizing that context must be low-latency and fresh, and that memory is really just state. The architecture is built from fresh-data ETL, a Context Retriever that auto-builds a semantic layer with Pydantic plus MCP, short- and long-term memory extraction, and semantic caching, demonstrated with an agent querying structured data rather than a policy PDF.

## Context Engineering at the Frontier
@ Linus Lee, Thrive Capital
Builds the research agent Puck and the action agent Hobgoblin, with the core philosophy of "pushing complexity into the data structure and indexing stage, rather than into the query-time prompt." Techniques include hybrid search combining BM25, vectors, and a neural reranker; pre-enriching "authoritative entity cards" at indexing time; using SQL sub-agents and parallel sub-agents to avoid polluting the main context; and custom tools for verbatim, verifiable citations.

## Context Engineering for Video Intelligence: Beyond Model Scale to Real-World Impact
@ TwelveLabs
Argues that the key to making video AI usable isn't model size but turning video into a "context pipeline," proposing four pillars — Write → Select → Compress → Isolate (structured evidence, multimodal semantic retrieval, rolling summarization, and isolation by type/time) — and arguing that context should be treated as an engineering artifact to be measured and version-controlled.

## Designing Memory Systems for AI Agents
@ MongoDB
Gives a complete walkthrough of designing a memory system for agents, distinguishing three types of memory: short-term (session chats, using session_id plus TTL), semantic long-term (user facts & preferences), and procedural long-term (step-by-step guides, using embedding plus vector search). The focus is on the "memory lifecycle" — what to store, when to store it, and when to prune — demonstrated with a memory API, tool execution, and the agent loop.

## Hermes Architecture EXPLAINED: Memory, Context & Gateways
@ Hermes project
Breaks down the architecture of Hermes, an always-on agent: the agent loop, rebuilding context every turn (soul.md / user.md / memory.md plus historical summaries plus tool descriptions), a context-compression mechanism that estimates tokens by character count, multi-platform gateways (Telegram / Slack / Email) with session management, and three-tier memory (markdown plus SQLite plus external memory) with cron scheduling.

## Let's Teach Claude Code Semantic Code Search With turbopuffer
@ turbopuffer
Demonstrates using turbopuffer (vector plus full-text) to add semantic code search to Claude Code (treating embedding as cached computation), quantified with ContextBench. Finds that semantic search improves precision and reduces unnecessary file reads (from about 65% up to nearly 90%), but is complementary to grep rather than a replacement for it — the real difficulty is teaching the agent when to choose which tool.

## RAG is dead, right??
@ Kuba Rogut, Turbopuffer
Argues that "RAG isn't dead — what's dead is the narrow definition of RAG as vector search plus stuffing context." Real retrieval is a whole toolbox — vectors, full-text (BM25), grep, filters — that an agent calls repeatedly until it has gathered enough context. Contrasts Cursor (pre-indexing embeddings) with Claude Code (re-scanning with grep every time) to illustrate the tradeoff in indexing cost, and emphasizes staged retrieval that first narrows down to "the right million tokens."

## Turn 10,994 Notes Into Memory
@ Paul Iusztin & Louis-François Bouchard
Demonstrates an "AI Research OS": turning tens of thousands of second-brain notes into research memory an AI can use, deliberately using files plus an index (raw/, index.yaml, wiki/) instead of a vector database or a giant context window. Queries follow a tiered, token-saving strategy (read the index first → source summary → concepts → raw), the raw notes are read-only, and the wiki is a "living memory" that grows with each question answered. The design philosophy favors local markdown/YAML files for easier debugging.

## When All Context Matters: Extended Cache Augmented Generation
@ Luis Romero-Sevilla, Orbis
For situations where "all documents are relevant, and they're often updated in bulk," proposes Extended Cache Augmented Generation (ECAG): instead of stuffing everything into one giant context, it spins up multiple CAG "buckets" simultaneously (multiple sets of KV cache), with a supervisor model deciding which buckets to query and how to synthesize the answer. The key design choice is to shuffle documents randomly into buckets rather than group them by topic, so as not to overlook a domain holding a critical clue; because loading is parallel, it's faster than GraphRAG while delivering better quality than plain RAG.
