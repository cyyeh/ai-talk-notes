---
title: Bypassing the Multimodal Tax: Hybrid RAG, SQL RRF & UI Telemetry
speaker: Abed Matini, Ogilvy
video: https://www.youtube.com/watch?v=Akm1sqvWG4A
---
This video mainly demonstrates how to build a production-ready, enterprise-grade RAG FAQ chatbot using a local-first, framework-light, SQL-heavy approach, while keeping cost, observability, and security under control.

1. Problem scenario: why isn't "just dropping documents into a cloud chatbot" good enough?

The speaker starts by identifying two common pain points:

1. When a user drags a PDF / Word file / image straight into a cloud chatbot, the content first gets "read and parsed" by the model, burning through a pile of multimodal token cost before you've even asked a real question — and on top of that, you can't see how it's actually being chunked or read.
2. In production, people typically stack up a lot of tools — vector databases, keyword search, various frameworks and agents — leaving the system complex, hard to manage, and hard to debug.

What he wants to solve is: how do you build an FAQ / internal-handbook-style chatbot,\
running locally or on a small server, with minimal dependencies, yet with controllable cost and behavior.

2. Overall architecture: Docling → Markdown → Postgres + pgvector → hybrid retrieval → small-model answer

The full pipeline roughly goes:

1. HR or an administrator uploads various documents (PDF, PPT, Word, screenshots).
2. The Python backend uses Docling to convert the raw documents into "structured Markdown" stored locally.
3. It then applies "strategic chunking" to the Markdown, and writes the text plus vector embeddings into PostgreSQL (pgvector).
4. When a user asks a question in the frontend (a React chat UI):

▫ Hybrid retrieval runs first: vector similarity (semantic) plus BM25 keyword search, simultaneously.

▫ SQL (including RRF ranking) is used to pull the top few most relevant chunks from a single database.

▫ A small number of clean, source-attributed chunks are then handed to a very small local LLM (Qwen 2.5 0.5B) to generate the answer.

5. Langfuse is used throughout to track telemetry such as session, latency, model used, and chunks retrieved, with an extra floating widget on the frontend letting users see basic statistics and token/ROI-type information.
6. For safety and compliance (things like medical questions, prompt injection), code-level checks intercept anything that shouldn't be answered or is malicious input before it ever reaches the LLM.

The whole system can run on GitHub Codespaces or an ordinary CPU server,\
with no GPU required and no dependency on a large cloud LLM.

3. Document processing and chunking strategy: why is "clean first, then chunk" better than just dumping it in?

The speaker spends a lot of time explaining the importance of "data preprocessing and chunking," because this is almost entirely what determines RAG quality.

3.1 Why not just dump in a 28-page PDF?

If you feed an entire HR handbook straight into the system and chunk it crudely, you'll end up with a lot of:

- meaningless fragments (like a footer that's nothing but "signature / date")
- incomplete paragraphs, headings cut off mid-way
- hard-to-trace sources (no way to know which chunk actually corresponds to which policy)

This makes answers vague, increases hallucination, and makes debugging nearly impossible.

3.2 A few chunking strategies and when to use them

He demonstrates several switchable chunking strategies in the admin dashboard:

1. Heading-based chunking

▫ Uses Docling to parse the Markdown's heading structure (like an FAQ question heading plus its answer content).

▫ Each heading plus its content becomes one chunk.

▫ The benefits:

⁃ each chunk naturally maps to one question or topic, so the semantics are very clear;

⁃ tracing and debugging are extremely intuitive (you can immediately tell which HR policy section it is).

▫ Well suited to highly structured documents like FAQs / employee handbooks.

2. Paragraph chunking

▫ Each paragraph becomes one chunk, regardless of whether it has a heading.

▫ Cleaner than the raw PDF, suited to documents with basic formatting but unreliable headings.

3. Fixed-length chunking (e.g. 512 characters + 64% overlap)

▫ A common "best practice": fixed length plus overlap, to make sure important information isn't cut off at a boundary.

▫ Suited to cases where the data is messy and hard to clean up well, though it introduces problems like incomplete semantics and paragraphs being hard-cut across chunk boundaries.

4. Sentence-based chunking

▫ Chunks by sentence count. Suited to short-form content like emails and announcements, especially text OCR'd out of screenshots.

5. Screenshot → text → Markdown

▫ For ad hoc announcements (like a screenshot of an email about "this weekend's maintenance window"),\
a local OCR / sentence model converts the image to text and then to Markdown, quickly adding it to the knowledge base.

▫ The benefits:

⁃ no need to manually clean up short-lived information;

⁃ once it's in the system, a user asking "is there maintenance this weekend?" can accurately retrieve that screenshot's content.

The conclusion: converting documents into clean, structured Markdown locally first, then picking a chunking strategy suited to the content type, is far cheaper and more reliable than handing everything to a cloud LLM from the start.

4. Retrieval layer: hybrid RAG with Postgres + pgvector + BM25 + RRF

The focus now shifts to: "no RAG framework needed — do high-quality retrieval directly in the database."

4.1 Vector and keyword indexes in a single database

The design roughly works like this:

- PostgreSQL + pgvector stores the embedding vectors and performs semantic nearest-neighbor search (cosine distance).
- A BM25 / full-text search index is also built on the text column, used for precise keyword matching (product SKUs, drug names, monetary amounts, and so on).
- A single SQL query can pull together:

▫ the N semantically nearest records

▫ and the M most precisely keyword-matched records,\
then blend them with Reciprocal Rank Fusion (RRF) to get the final top-K candidate chunks.

This lets you tune things by business scenario:

- FAQs or HR policy: K can be smaller, aiming for precise, easily explainable answers.
- E-commerce product retrieval: K can be larger, so you don't just surface two products while other similar products get "starved" out over time.

4.2 Why go hybrid?

He mentions a few typical scenarios:

- Medical or regulatory: what you want is the exact clause or drug name, not something merely "semantically similar."
- Product-focused chatbots: SKUs and brand names must match exactly, or recommending the wrong product becomes a real risk.

So the system uses both at once:

- Vectors: to pull in semantically similar candidate passages.
- Keywords: to filter and rank out the handful that are genuinely precise matches.

Combined with a tunable top-K strategy and RRF ranking, this achieves stable, predictable retrieval quality.

5. Model choice: a small model plus strict preprocessing beats a large model on safety and usability

He particularly stresses: if preprocessing and retrieval are done well, a small model is enough.

In implementation:

- He spins up a local Qwen 2.5 0.5B instruct model via Ollama, about 400MB in size.
- He also tried a 7B model, but it was too slow, with verbose responses that made for a worse experience.
- Observed conclusion:

▫ With clean chunking plus hybrid retrieval, the 0.5B model's answer quality is already well suited to FAQ-type applications.

▫ A small model is more "honest" — when it lacks the information, it simply says it doesn't know, which actually lowers the risk of hallucination.

- For embeddings, he uses a lightweight embedding model (BGE, etc.), also run locally.

In total, only two models are needed: one for chat, one for embedding — everything can run on CPU.

6. Agents vs. direct RAG: use fewer agents, more plain code functions

He deliberately avoids chaining things together with LLM-based agents, for these reasons:

- Every extra agent call means one more LLM round-trip, and latency balloons to 20-30 seconds — a poor user experience.
- Many tasks (getting the current date, computing an amount, looking up simple data) can actually be handled with a plain Python function, with no need to ask the model to act as an "agent" and call it for you.
- Plain code functions are testable, predictable, and won't hallucinate.

So, architecturally:

- The base pipeline is a "fixed, direct RAG pipeline":

▫ embed the query → hybrid retrieval → ranking → hand off to the LLM.

- If functionality absolutely must be extended (e.g. product comparison, advanced filtering), the preference is to write it as a Python function tool, with backend logic deciding whether to call it, rather than letting the LLM orchestrate that on its own.

This fits compliance/risk-control needs better, and also keeps the agent from jumping around the flow unpredictably.

7. Telemetry and the UI widget: bringing system observability to the frontend

On observability, two layers were mainly built:

1. Backend: Langfuse integration

▫ Every session/conversation has an ID.

▫ You can see:

⁃ the question and answer content

⁃ which models were used, how many chunks were returned

⁃ latency, errors, even an estimate of external LLM cost

▫ making it easy to later analyze and optimize slow queries and bad answers.

2. Frontend: a floating React widget

▫ Anonymously displays basic statistics for the current session.

▫ Paired with a user-consent flow:

⁃ if the user doesn't accept the terms, the widget isn't enabled and the conversation doesn't start.

⁃ consent records can be reset from the UI, which is handy for demos or testing.

These design choices exist to satisfy enterprise needs around observability, privacy, and ROI tracking, while keeping the implementation simple (Langfuse running locally, a React widget embedded in the frontend).

8. Guardrails and prompt-injection protection: blocking things "before they ever reach the LLM"

On the security side, his position is:

Don't rely on the LLM to "follow the system prompt" on its own —\
sensitive content and prompt injection need to be intercepted first, at the backend code level.

Specifically:

- For high-risk topics like "medical advice":

▫ The code has dedicated checking logic (e.g. keywords, regex, a classifier).

▫ Once anything medical-related is detected, it returns a fixed safe message directly, instead of passing the question on to the LLM.

- Prompt-injection protection:

▫ Uses a combination of a keyword dictionary, regular expressions, and an LLM classifier,\
scanning the text before it enters the database or is sent to the model.

▫ If a rule is triggered, it's blocked outright, or answered with a safe message.

- All these checks are implemented in Python, so tests can be written to verify "what should be blocked and what shouldn't" — far more stable than "writing a giant system prompt and hoping the model behaves."

9. Tech stack and deployability

The whole project deliberately chose a close-to-"minimum viable" tech stack:

- Backend: Python + FastAPI
- Frontend: React
- Database: PostgreSQL + pgvector
- Models and execution: Ollama (local LLM + embedding model)
- Containerization: Docker (making it easy to reproduce on GitHub Codespaces or any server)
- Observability: Langfuse (self-hosted)

No large frameworks like LangChain were used; the RAG pipeline is basically all hand-written in SQL and Python,\
with the goal of keeping behavior transparent and debuggable, while still mapping onto an enterprise environment (e.g. Azure Database for PostgreSQL).

10. Core takeaways

At the end of the video, the speaker sums up the overall message, roughly boiled down to a few key points:

- Converting documents into "clean, structured Markdown" locally first, then chunking them sensibly, is the key to controlling both cost and quality.
- Putting RAG's retrieval and ranking logic in the database and in SQL, using hybrid search plus RRF, gets you stable, explainable results without relying on a heavyweight framework.
- A small model (local LLM plus embeddings) paired with clean data can actually handle most FAQ / internal-knowledge-base scenarios, and it's even safer and less prone to making things up.
- Engineering capabilities like guardrails, prompt-injection protection, and telemetry need to be implemented at the code level, before the LLM — not just written into the prompt.

Overall, this is a very engineering-implementation-focused talk, on the theme of:\
how to use a "local-first + database-first + framework-light" approach\
to bypass the expensive, uncontrollable multimodal cloud pipeline,\
and build a RAG FAQ system that can genuinely run in an enterprise, be maintained and debugged, and have controllable cost.
