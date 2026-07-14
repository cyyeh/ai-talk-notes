---
title: Building Agentic RAG Systems with ClickHouse
speaker: ClickHouse
video: https://youtu.be/s-yB8C0wd78?si=MnKSV-mnm5MHx8_Q
---
This video demonstrates how to use an "Agentic Data Stack" to stand up a complete agentic RAG system locally, built around ClickHouse + LibreChat + MCP + LangFuse working together.

What does the video walk through?

The presenter starts from scratch, cloning the ‎⁠clickhouse/agentic-data-stack⁠ project in a terminal, and explains that this repo essentially "bundles together" the separate Docker Compose files for LibreChat, LangFuse, and the ClickHouse MCP server, adding some startup-order and environment-variable configuration on top so the whole system can be started with a single command.

Next he uses ‎⁠scripts/prepare_demo.sh⁠ to generate ‎⁠.env⁠ for everyone, populating it with an admin account, password, random secrets, and so on, then runs ‎⁠docker compose up -d⁠ to bring up the whole stack. LibreChat is signed into from ‎⁠localhost:3080⁠, with default credentials ‎⁠admin@admin.com⁠ / ‎⁠password⁠.

How do LibreChat, MCP, ClickHouse, and LangFuse all connect together?

Once inside LibreChat, he demonstrates how to:

- Set an Anthropic API key inside the LibreChat interface (in practice this can live server-side in an env var — BYOK isn't required).
- Enable the local ClickHouse MCP server, and use natural language to ask the agent to "list the databases, query a table, run a SELECT" — under the hood this actually goes through the MCP tools list databases / list tables / run select query to hit ClickHouse.
- At the same time, every one of these conversations and tool calls gets instrumented into LangFuse, and LangFuse's own storage in turn runs on ClickHouse — so you can see the agent's traces, tool calls, prompts, responses, and other detailed records right inside LangFuse.

He demonstrates one fun detail: asking the LibreChat agent to query ClickHouse's own traces means that conversation itself gets logged by LangFuse too — so the agent ends up looking at its own observability data.

Moving to ClickHouse Cloud and the "agentic RAG" data

He then switches over to ClickHouse Cloud (console.clickhouse.cloud), signs in via OAuth, and shows off the public ClickHouse MCP endpoint, which has even more tools here (thirteen): besides querying databases, you can also look up the org, calculate costs, handle backups, ClickPipes, and more.

To give "agentic RAG" some real data to work with, he runs a pre-prepared piece of SQL in ClickHouse Cloud that ingests roughly 30 million rows of UK housing data from S3. This SQL is fetched via the short link ‎⁠c.house/ads/s3⁠ and run directly in the SQL console, so the demo works against a genuinely large-scale table.

Agents, Skills, Artifacts, and Sub-agents inside LibreChat

One of the main threads is a handful of concepts newly added to LibreChat: the agent builder, skills, artifacts, and sub-agents.

In LibreChat's "Agent builder" he:

- Picks an Anthropic model (Claude), and enables web search, artifacts, and MCP servers.
- Explains artifacts: they let the model output HTML that the frontend renders directly as an interactive chart or UI, which is great for data visualization.
- Explains the tool settings "defer loading" and "programmatic only":

▫ Defer loading lazy-loads tool descriptions, avoiding stuffing every tool spec into the system prompt at once.

▫ Programmatic only restricts certain tools (like run select query) to only being usable inside the code-interpreter context, so you don't pull too many rows at once and blow out the context window.

Next he demonstrates skills:

- First he sets up an agent (a skill builder) and has it use web search to help write a markdown write-up describing "ClickHouse's UI design style," then pastes that text into a skill definition, turning it into a reusable "ClickHouse design" skill.
- Then he asks another agent to use that skill plus the ClickHouse Cloud MCP to produce, from the UK housing table, an interactive chart artifact styled in ClickHouse's own brand look (yellow and black).

Put together, this becomes:\
natural language → the agent decides which MCP tools to use to query ClickHouse → a skill decides the visual style → an HTML artifact is output and rendered interactively right inside LibreChat.

In the video he also highlights the new sub-agents feature:

- In an agent's Advanced settings you can enable sub-agents, letting a "main agent" dynamically spin up multiple sub-agents, each with its own context and task.
- The benefits of this are:

▫ Each sub-agent checks or completes its task in a relatively "clean" context, so it's less prone to being swayed by "self-persuasion" from reasoning already present in the main conversation — reducing hallucination.

▫ Multiple sub-agents can work in parallel, which in practice can make data-querying scenarios noticeably faster.

- On the UI side, LibreChat shows a sub-agent's seed prompt and its tool-calling process in a modal, while the main conversation only receives a concise final result.

Management & control: the LibreChat Admin Panel + RBAC

In the second half he switches to the LibreChat admin panel (‎⁠localhost:3081⁠), which essentially turns what used to be one enormous ‎⁠librechat.yaml⁠ file into a visual configuration interface:

- You can enable/disable different LLM providers (OpenAI, Anthropic, Google, etc.), add custom endpoints, and adjust model configs.
- Manage MCP servers: add them, edit endpoints, client IDs/secrets.
- RBAC: create roles and groups, then assign different capabilities (using agents, sharing conversations, using MCP servers, etc.) to different roles, with support for integrating an enterprise Identity Provider such as Microsoft Entra.
- An audit log that's currently in development: eventually it will record, for every admin action, "who, when, on whom, and which capability was changed," making enterprise auditing easier.

He stresses that this makes LibreChat feel much more like a genuine enterprise-grade frontend, one that can finely control who gets to use which features and resources.

LangFuse: tracing, evals, and LLM-as-a-judge

Finally he switches to LangFuse (‎⁠localhost:3000⁠) to show off observability and evaluation on top of ClickHouse:

- On the tracing page, you can see every ‎⁠agent_run⁠ and ‎⁠title_run⁠, and each trace includes:

▫ the prompt used

▫ tool calls (including sub-agent and MCP tool calls)

▫ artifact tags, and more.

- When a user reports "this answer seems off," a developer can look up the matching trace by timestamp or user, and inspect the input/output of every tool call step by step to figure out whether it's a data problem or a prompt/agent-strategy problem.

Next he demonstrates how to set up an "LLM-as-a-judge" evaluator in LangFuse:

1. Set an Anthropic API key in LangFuse to serve as the evaluation model.
2. Create an evaluator (call it, say, tool use) and write instructions such as: "When a user asks about ClickHouse data, it should verify the current state of the data via an MCP tool call," feeding the evaluator agent the original input and the model's output through the ‎⁠{input}⁠ / ‎⁠{output}⁠ variables.
3. Set sampling on the traces (say, 40% of traces), let the evaluator run a pass, and LangFuse will show each trace's score (true/false) along with its reasoning.
4. In analytics you can see the overall pass rate, or pair it with a second score to build a confusion matrix and other more advanced analysis.

This way, whenever you change the system prompt, add or remove tools, or adjust agent behavior, you can judge whether things genuinely got better using data instead of "gut feel."

Key takeaways from the video

The whole video's key message is:

- A single Docker Compose command can spin up a complete agentic RAG stack: ClickHouse (data plus the LangFuse backend), LibreChat (multi-agent UI + MCP + skills + artifacts + sub-agents), and LangFuse (observability + evals).
- MCP lets an agent drive ClickHouse operations (listing DBs, querying tables, SELECTs...) using natural language, instead of writing SQL directly.
- Skills and artifacts provide reusable capability and visual presentation, so the agent isn't just doing text Q&A — it can automatically produce interactive dashboards for you.
- Sub-agents, together with LangFuse's tracing/evals, let you make engineered trade-offs between quality, cost, and reliability, instead of a "black-box" chat experience.
- The LibreChat admin panel, RBAC, and audit log let all of this actually run in an enterprise environment, rather than staying a developer toy.
