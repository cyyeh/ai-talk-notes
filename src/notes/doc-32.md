---
title: Democratizing Analytics via Self Service
speaker: Netflix
video: https://youtu.be/HotbjSIgLOM?si=3FyEX0Sj9tQj7Fso
---
This video introduces how Netflix uses a semantic layer and self-service tools to expand "who looks at data" from engineers to non-technical roles like business and production staff, while also preparing for the age of AI-native analytics.

Part one: why we need "self-service analytics" and a semantic layer

The speaker is a senior data engineer at Netflix, responsible for Netflix Games' data infrastructure. She first explains the complexity of game data:\
Each game is its own piece of software; there are hundreds of them, spanning multiple platforms and coming from different studios. Every stakeholder (producers, developers, finance, data scientists) is "very data-savvy" yet "defines things differently" — for example, "Active User" is calculated differently by different teams, leading to:

- The data team being overwhelmed by a flood of reports and ad hoc queries, becoming a bottleneck.
- The company constantly "adding headcount" and "adding reports" without actually speeding up decision-making.

She proposes three principles (the 3 D's):\
Democratize (anyone can ask questions), Discover (you can find out what metrics exist), and Define (there's a single authoritative definition, one source of truth).

Traditional BI tools (Tableau, Looker, Superset, etc.) are powerful, but:

- The learning curve is steep, making them unsuitable for non-technical users to truly "self-serve."
- Even with a drag-and-drop interface, you still need to understand SQL and the data model underneath.

So Netflix has invested in building self-service tools for non-technical users, and the key is building a "semantic layer" underneath.

What is a semantic layer, and how is it designed?

The semantic layer is defined as: a translation layer between "business language" and "database language."

- Users only ask: "Give me Weekly Active Users for Germany"
- The semantic layer is responsible for knowing:

▫ which tables store which raw events

▫ how to calculate this metric

▫ which dimensions (country, platform, game, membership…) to break it down by

She breaks the semantic layer down into three parts:

1. Semantic Model

▫ Defined in YAML or a similar structure: metrics, dimensions, mapped tables, and calculation methods.

▫ For example:

⁃ ‎⁠play_seconds⁠: a summable duration metric

⁃ ‎⁠DAU/WAU⁠: not summable, needs a distinct count computed at query time.

2. Semantic Query Engine

▫ Converts a "business request" into actual SQL, executes it against the data warehouse/OLAP engine, and returns the result.

3. Interface Layer (UI)

▫ The front end presented to PMs or business users is a drag-and-drop chart interface, showing only business metric names and simple fields — no need to understand SQL.

Storage layer and implementation details

To support arbitrary ad hoc breakdowns without precomputing an explosion of aggregations, they:

- Keep "summable metrics" like ‎⁠play_seconds⁠ at the detail level, rather than directly storing metrics that need distinct counts, like DAU/WAU.
- Use a distributed OLAP store like Druid, supporting low-latency, real-time computation.
- Static dimensions (e.g., device) are written directly into the serving table; dynamic dimensions (e.g., game names that change) are handled via lookup/join, filled in at query time in the semantic layer.

The core idea is:\
Keep the physical layer (tables, indexes) as "dumb" as possible, concerned only with structure and performance;\
push all "business logic" up into the semantic layer, avoiding scattered patches that lead to inconsistent definitions.

Part two: from dashboards to AI-native "conversational analytics"

She then jumps to the current AI era:\
The traditional mode is "clicking through a dashboard"; increasingly, the future will be "conversing with an agent."

Users no longer want to hunt for reports — they just ask directly:

- "What was DAU in Germany last month?"
- "Why did retention drop for this game?"

In other words, a shift from "scrolling through charts" to "asking questions and wanting explanations."\
But she stresses: AI makes asking questions easier, but it doesn't automatically understand your business definitions.\
If the underlying data and semantic layer aren't solid, AI will just amplify errors faster.

The new generation of AI analytics stack

She gives a layered architecture for thinking about AI-native analytics systems:

1. Data Layer

▫ Various raw event tables, warehouses, lakehouses.

▫ If this layer is garbage, it's the classic case of "garbage in, garbage out."

2. Semantic Layer

▫ Metric and dimension definitions, as introduced above.

3. MCP Tools Layer (Model Context Protocol Tools)

▫ A set of "tools/APIs" that run on top of the data — interfaces that an LLM can understand and call.

▫ For example:

⁃ ‎⁠list_metrics⁠: returns all "blessed" (governed) metrics

⁃ ‎⁠get_metric⁠: returns a value given a metric + dimension conditions

⁃ ‎⁠get_metric_definition⁠: returns a metric's description and constraints

▫ These MCP tools may call the semantic layer, or query metadata tables like Iceberg directly.

▫ A very important point:

⁃ Tools must not perform destructive operations like deletion or overwriting

⁃ They cannot query unauthorized domains or arbitrary tables

⁃ They only serve "governed metrics and data"

4. Agentic Layer

▫ Various LLMs/agents, used to reason and answer questions.

▫ Can exist in a terminal, Slack bot, web UI, notebook, etc.

▫ Architecturally, multiple front-end agents share the same set of MCP APIs, ensuring consistent governance and authorization.

5. Skills

▫ To make agent behavior stable and reproducible, they use "skill files" (really Markdown runbooks) to tell the agent:

⁃ which tools to use for a given task, in what order, and how to format the output.

▫ For example, the Trend Analysis skill:

⁃ First use ‎⁠get_metric⁠ to pull period A

⁃ Then pull period B

⁃ Compute the delta

⁃ Automatically detect and exclude outliers, establishing a clean baseline

⁃ Finally output: the percentage change, an explanation of outliers, the data source, etc. With a skill in place, the same question asked today or tomorrow, by whoever asks it, produces consistent, auditable behavior, rather than the LLM "improvising" every time.

6. Evaluation Layer

▫ A "unit test" system spanning the entire stack, ensuring AI behavior is trustworthy.

▫ Can run periodically or before deployment, for example:

⁃ The same set of questions, checking whether the right skill was used, whether the right MCP was called, and whether the correct number was returned.

⁃ Asking about an "undefined metric" (e.g., a nonexistent Monthly Active Users),\
must result in a refusal or a request for clarification, rather than the model just guessing a number.

⁃ Requiring that the agent not accept out-of-scope requests like "write and run custom SQL for me."

A real data flow and architecture example (using Netflix Games)

She uses an architecture diagram to summarize the full flow from "event" to "AI answer":

- Multiple devices (TV, web, mobile, games that use the phone as a controller, game servers…) continuously send telemetry events to Netflix's central logging system.
- A Flink pipeline filters events from various products down to game-related ones, assembles them into sessions, computes core metrics like play duration, and writes them into Iceberg.
- Based on the raw session tables in Iceberg, it aggregates into OLAP-friendly Druid tables for low-latency self-service analytics.
- The semantic layer sits on top, defining all standard metrics.
- MCP tools are authorized to query the semantic layer / Iceberg metadata directly.
- Agents use MCP + skills to fetch data, perform trend analysis, and produce natural-language summaries.
- The evaluation layer continuously checks:

▫ whether metrics were calculated correctly

▫ whether authorization was exceeded

▫ whether there was any hallucinated fabrication (especially in scenarios involving "nonexistent metrics").

The "Analytics Trilemma" and takeaways

She proposes an "analytics trilemma" (similar to CAP theorem):

- Speed: how quickly you get an answer
- Flexibility: whether you can explore from any angle
- Accuracy: whether the numbers are trustworthy

Roughly corresponding to:

- Traditional dashboards: fast and accurate, but low flexibility (you can only view pre-designed cuts).
- Ad hoc SQL: accurate and flexible, but slow (requires skilled people to write and compute).
- AI self-service queries: fast and flexible, but without governance, accuracy tends to drift.

Her conclusion isn't that "you can never have all three" — rather:\
across different eras and different technical conditions, you always need to know clearly what boundary you're trading off on, and use the semantic layer, MCP, skills, and evals to push all three as high as possible.

Three final lessons:

1. Treat metrics like a product: version them, document them, and deprecate them carefully.
2. AI amplifies both the good and bad in your foundation:

▫ Good foundation → accelerated insight

▫ Bad foundation → faster production of untrustworthy conclusions.

3. Data teams need to transform from "report producers" into "platform builders":

▫ The goal is no longer to personally answer every question,

▫ but to build a reliable semantic layer, self-service tools, and agent infrastructure,\
so that others (including AI agents) can safely find answers on their own.
