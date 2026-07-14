---
title: Why Can't Anyone Answer Questions About the Business?
speaker: Garrett Galow, WorkOS
video: https://www.youtube.com/watch?v=iUWwcG-C8OU
---
This video introduces Studio, an internal tool WorkOS built to solve the problem of "everyone asks business questions, but no one can look up the data themselves," and explains how they used LLMs plus database tooling to make it reliable enough to hand to support and operations teams for daily use.

What the video covers

Garrett starts by describing a typical company scenario: when operations, support, or sales want to know "how customers use the product" or "which content drives conversions," they usually have to go find an engineer to write SQL. The flow goes: ask the question, the engineer writes a query, reports back the results, realizes a column or join is missing, revises it again, and the answer finally ends up buried in some Slack thread, completely unreusable.

To break this cycle, WorkOS built an internal tool called Studio that lets anyone ask questions in natural language. Studio calls data sources like Snowflake, Linear, and Notion to find the answer for you, and can even go a step further and "generate reusable widgets" for you.

What are Studio and widgets?

Studio's workflow roughly looks like this:

1. The user asks a question in natural language, either in the Studio interface or via the Slack bot — for example, "Which content is most likely to drive new team creation?" (WorkOS refers to its customers as "teams.")
2. Behind the scenes, the system uses a Lane Graph–based agent paired with the Opus model, plus a "guidance layer" that decides how to call tools like Snowflake, Linear, and Notion.
3. The agent queries the Snowflake schema, selects the tables it needs, composes SQL, and actually issues the query against the internal database.
4. After getting the results, it doesn't just answer the one-off question — it can also be asked to "build me a reusable table / dashboard," at which point it generates a widget.

A widget here is a piece of "declarative JavaScript" that bundles the UI, API calls, and database query logic together. Every subsequent use of the widget calls the data source directly, without going through the LLM again, keeping cost low and behavior predictable.

The video shows two demos:

- Content performance analysis: asking "which content drives the most new team creation" prompts Studio to look up page views and conversion data across the blog, docs, homepage, and so on, then automatically generate a table widget with adjustable time ranges and content-type filters. PMs or marketing can then keep reusing it in recurring meetings.
- Support queries for the Radar security product: Radar is WorkOS's bot-defense / risk-control product. Support agents often get asked "why was this user blocked?" Previously that meant finding a data scientist or engineer to run SQL; now they have a widget where entering an email queries Radar's live database directly and lists all login attempts, whether each was blocked, the reason, and so on — support can now fully self-serve.

Underlying architecture and key design decisions

Garrett spends the second half of the talk on how they made this system "reliable enough for non-technical colleagues to use every day," centered on three key points: sequencing, layering, and validation.

1. Sequencing (execution-order design)

When the agent receives a new question, it doesn't just start calling tools haphazardly — it first runs a series of preflight checks:

- Check that all tools are connected and working properly.
- Confirm it has enough context to answer; if not, it asks a clarifying question first.
- Run a checklist to decide which tools it should use.

The most critical part is that "the schema/context for a given tool is only injected at the moment the agent actually decides to call it." For instance, the Snowflake context describes the internal database schema in detail — how customers are represented in the database, how tables should be joined, and so on. This content is quite long, and stuffing all of it into the prompt up front would blow out the context window, so they chose to "inject on demand" instead.

2. Layering (multi-layer prompt strategy)

They split their prompts into several layers:

- Studio's base prompt (global behavior).
- Default rules and org-level rules (instructions and constraints specific to a given organization or tool).
- Additional context attached when editing a specific widget or tool (for example, special syntax for certain joins).

One interesting design choice: they explicitly tell the LLM "don't trust your own knowledge about WorkOS." Because the product updates so quickly and the model's training data is often stale, they instruct the model in the prompt to "trust internal primary sources (such as docs and schemas)," rather than answering from its outdated impression of WorkOS.

3. Validation (query validation)

When generating a Snowflake query, they:

- Run the query once first.
- Check whether the result actually contains data, not just whether the syntax is correct.
- Only after confirming everything checks out do they "bake the SQL into the widget."

This avoids a common problem: SQL generated by the model that is syntactically correct but returns 0 rows, yet gets treated as a "real answer." Through this upfront validation, they make sure whatever gets written into the widget "actually pulls back data."

In addition, they made heavy use of evals while developing Studio, and they use the same eval pipeline on both staging and production, to make sure the behavior observed in the dev environment matches real-world usage.

A few practical details from the Q&A

In the closing Q&A, he added a few practical lessons:

- No need to fully clean up the database first: their Snowflake actually has some ugly, deeply nested joins (for example, connecting customer to user takes four levels of joins), but by teaching the LLM in the context "what this join block should look like," the model can reuse it consistently. LLMs are actually quite good at understanding schemas and column naming.
- Techniques to avoid miscounting: for example, to make sure you only count entities that are non-deleted and active, these rules can be hard-coded into the context (such as always requiring certain status / deleted_at filters), to avoid common statistical errors.
- Combining data across multiple tools: a widget is essentially JavaScript code that makes API calls to multiple services and then combines the results in code. Once generated, refreshing the widget just reruns that JS — the LLM is no longer involved, so it's highly stable, and it can accept user input as parameters.
- Access control: most integrations currently connect to Snowflake, Linear, and Notion "as the user," but this will move to org-level connectors, where one person configures the integration and defines who has what permissions (for example, read-only by default, with some roles allowed to edit), implemented using WorkOS's own "Pipes" product.
- Cost considerations: once a widget is generated, day-to-day use no longer goes through the LLM, so cost is concentrated at "the moment the tool is generated." They chose to use Opus directly, because the quality gap is large enough that switching models to save money isn't worth it.

Overall, this video presents a real-world case study: using an LLM-driven agent plus a carefully designed tool layer and context to turn "asking a business question, querying real internal data, and productizing the query into a widget" into a repeatable, reliable process that can be handed off to non-engineering teams.
