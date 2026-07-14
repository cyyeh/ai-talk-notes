---
title: Agents Are Eating the Semantic Layer
speaker: Zenlytic
video: https://youtu.be/Sm5x2ItO5os?si=FOkqOWOHibj8ERQT
---
This video argues that for AI agents to be genuinely useful with data, the "traditional semantic layer" has actually become the bottleneck — agents should instead write SQL directly, with semantics and business context supplied as flexible, text-based "context."

Why the traditional semantic layer no longer fits AI agents

The speaker first revisits the consensus from around 2023:\
LLMs are great at "understanding human language" but can't do arithmetic, so the approach was:

the LLM handles understanding the question + the semantic layer (LookML, Business Objects, Cube, the dbt Semantic Layer, Omni…) guarantees the metrics are correct.

The typical structure of a semantic layer is:\
on one side, a "context store" (metric definitions, table relationships, KPI descriptions, and other text/config), and on the other, a "SQL compiler" that assembles these measures / dimensions / filters into a DSL, compiling them into SQL the target database can run.

This made sense at the time, because older models would pick the wrong date range, miscalculate net revenue (forgetting to subtract discounts), or use the wrong field. This is why everyone came to believe: add more structure and guardrails — in other words, a heavier semantic layer.

But in practice, the semantic layer has two fatal problems for AI agents:

1. Limited coverage

▫ You can only ask about metrics/fields that were defined into the semantic layer ahead of time.

▫ Business questions are often exactly the kind "nobody thought of in advance" — and by definition, those will never be in the semantic layer.

▫ Even if you let the agent "dynamically add a new measure / dimension," you still run into:

⁃ LLMs perform extremely well on mainstream languages (Python, JS, SQL),

⁃ but perform noticeably worse on your own proprietary DSL (the semantic layer's language).

▫ The result: you still can't ask truly new questions.

2. Expressiveness (flexibility) is too weak, and it effectively becomes a ceiling

▫ Most of the analysis that actually matters to a business goes beyond a simple "select X group by Y" query.

▫ Common examples that are hard for a semantic layer to express:

⁃ Redefining ROAS to use gross profit instead of revenue: this needs multiple CTEs, then a merge after the query.

⁃ "The difference in spend on another product, between customers who bought product X during some period versus those who didn't":\
this requires first building a cohort, then doing two aggregations, a comparison, case-when logic, and so on.

⁃ "Which product had the biggest revenue jump from a customer's first order to their second order?":\
this needs a window function, separate CTEs to compute the first and second orders, then a join to compare them.

▫ These questions feel intuitive to a business user, but they're often things the semantic layer's query compiler simply can't do.

▫ So the semantic layer ends up as a framework that can only answer the existing KPIs already on a dashboard — and a BI dashboard already answers those faster anyway.

So for AI agents, the semantic layer stops being a safety net and becomes a ceiling:\
agents can only operate within whatever space the semantic layer's schema and compiler can express.

What should you keep? Semantics — just not "a semantic layer"

The speaker isn't saying semantics don't matter — rather, that the traditional semantic layer should be "taken apart" into several kinds of context an agent can draw on, rather than a mandatory query compiler that everything has to pass through.

He lists several key sources of context:

- Query history: the SQL queries already sitting in the warehouse are themselves a huge set of examples of "how we actually use this data" — agents can learn patterns from them.
- Column values: a user will say "canceled orders," while the database might actually store ‎⁠order_status='CNL'⁠ or some odd string; the agent needs to see the real column values in order to line up human language with the actual data.
- Explicit instructions (instructions / system prompt): an organization's conventions and ground rules for how to interpret metrics should all be told to the agent as plain text.
- Memories and skills: how to remember answers already worked out for complex questions, chart branding guidelines, and so on — all of this can serve as reusable knowledge snippets.
- Context from external data tools: data catalogs, lineage, monitoring, and the configuration and documentation of other SaaS tools all carry context that's useful to an agent.

For the warehouse itself, the "semantic" part of a semantic layer is still important — things like:

- Table descriptions (view-level descriptions)
- Column descriptions (dimension / measure definitions)
- Join rules and gotchas
- How KPIs / measures are calculated

But these should be kept in a text structure that's easy for an agent to work with — a knowledge graph, an ontology, or a markdown repo — rather than baked into a semantic-layer framework that has to compile everything down to SQL.

The key point: the context itself has to be something an agent can read — and can also modify on its own, under the user's direction.

The right architecture: let the agent write SQL directly, then use semantics to explain that SQL

The traditional semantic-layer flow is:

Semantics (a measures/dimensions DSL) → the semantic layer's compiler → SQL → the database

With that setup, the questions an agent can answer are constrained to whatever the semantic DSL can express.

The speaker argues for doing the reverse:

The agent, based on context and the question → writes arbitrary SQL directly →\
then uses the existing semantic information to "interpret" the tables, columns, and metrics used in that SQL.

Once the flow is reversed:

- The agent can draw on its own considerable SQL skill to write queries of arbitrary complexity.
- Existing semantics (KPI definitions, join rules, etc.) become context used to audit, explain, or help generate SQL, rather than a rigid framework.
- If a question touches on a concept that hasn't been defined yet, the agent can still construct the SQL first, and update/extend the context during or afterward, instead of getting stuck for "lacking a measure definition."

Why this makes sense in 2026: models have gotten "absurdly good"

The speaker closes by using the trajectory of LLM capability to back up this design shift:

- 2023: people were still mocking LLMs for getting "basic arithmetic" wrong.
- 2026:

▫ It can write an entire app within seconds.

▫ Specialized coding models perform at a level comparable to top competitive-programming contestants.

▫ Frontier models can find security vulnerabilities in mainstream software.

▫ Various code / SQL benchmarks have basically been "crushed" by models — they're no longer hard enough to measure real ability.

Given all this:

- Designing things so these models "can't write SQL directly, and can only produce it indirectly through a limited DSL" runs against their nature.
- The real bottleneck is no longer "can the LLM write SQL" — it's "have you given it the right, sufficiently complete business and data context."

So the speaker's conclusion is:

- Stop packaging semantics into a mandatory semantic layer plus compiler.
- Break semantics apart into text-based context an agent can read and write (various descriptions, documents, knowledge graphs, markdown…).
- Then let the agent write whatever SQL it wants, and use semantics to understand and govern those queries.

The closing, slogan-style line is:\
rather than guard the semantic layer, "let my agents write code" (Let my agents code) — that's the architecture that satisfies both business flexibility and governability at once, and that can stretch to fit an unbounded space of questions.
