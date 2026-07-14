---
title: Building a Data Native Agent: Cortex Code
speaker: Snowflake
video: https://youtu.be/pV3hybzf31A?si=LVSTkWodYKacJrPA
---
This video introduces Snowflake's Cortex Code, a "data-native" AI coding agent, explaining why it was built, how it works, and its security and extensibility design.

Why do we need Cortex Code?

The speaker starts by describing a common problem with general-purpose AI coding agents: although they can generate SQL, they often reference tables or columns that don't exist, because the model only knows "world knowledge" and doesn't understand the schema, permissions, or deployment specifics of your actual Snowflake environment. This produces what he calls a "context gap." The traditional fix is for developers to keep adding markdown explanations, debug, and retry — slow, token-hungry, and hard to carry into a real production environment.

Snowflake's idea is to make the agent part of the data platform itself, rather than an outside visitor. In other words, the agent must directly and instantly understand Snowflake's metadata, compute resources, and security rules in order to truly accelerate data-engineering and ML workflows.

What is Cortex Code, and how can you use it?

Cortex Code's goal is to go straight from natural language to production-ready code, covering the entire data stack rather than just Snowflake SQL. It can connect to Snowflake, local code, DBT, Airflow, and other clouds (AWS, Databricks, GCP, etc.), helping build ETL pipelines, dashboards, and even apps.

It's offered in several forms:

- Built directly into the Snowflake UI (the "SnowSight" management console).
- A CLI tool that can be embedded into existing automation workflows.
- A VS Code / Cursor extension.
- A Cloud Code (e.g. Claude Code) plugin: via MCP, a general-purpose coding agent hands off any needed Snowflake operations to Cortex Code.

Feedback from Snowflake customers using it in practice is that many data workflows that used to take weeks and multiple people can now be wrapped up in an afternoon; thousands of customers and well over a hundred thousand developers use it daily.

Architecture design and performance advantages

At the model layer, Cortex Code currently mainly supports Anthropic models and models at GPT 5.2 and above, and it is "model-agnostic": the same agent framework can swap in different LLMs. It was originally built mostly on top of Anthropic models, but once they observed that models like GPT 5.5 had caught up on coding, they quickly added support.

He shared some internal benchmarks: on the same model (e.g. Claude Opus 4.6), simply through a better system prompt, built-in tools, and skill design, Cortex Code achieves roughly a 15% higher pass rate than "a bare model plus a generic agent" — while also reducing the number of tool calls and long back-and-forth loops, cutting the manual steps developers need to take, using fewer tokens, and naturally running faster.

Key technique one: real-time grounding and metadata awareness

At the center of Cortex Code is a "data agent framework" (agent harness). In every conversation, it actually queries Snowflake's real schema, RBAC roles, warehouses, and compute limits, rather than working off a single static description.

On startup, it pulls a metadata cache from up to the 100 databases you've used most recently; then, in each turn of the conversation, it queries Snowflake again as needed and feeds the results back to the LLM as part of the prompt. Since model context windows can now reach the million-token range, combined with moderate compression, even long conversations can retain enough history and environment state.

Another important design choice is that "the agent always runs as you." That is, it inherits your role and permissions in Snowflake, and any DROP, write, or change gets recorded in your own audit log — there's no mysterious, hard-to-govern "AI account" holding sweeping privileges. This greatly eases enterprise concerns around permissions and compliance.

Key technique two: Skills as a product feature

Snowflake treats "agent skills" as first-class citizens. Skills are essentially structured text files (front matter, usage instructions, etc.) that teach the LLM "how to operate" a specific workflow or product feature, and when loaded, only the front matter is read at first, reducing pressure on context.

Internally, whenever any Snowflake team ships a new feature, besides writing documentation, they also write a corresponding skill along with eval tests. The process roughly goes:

1. The team first writes a set of evals to check whether the model can complete the task "without a skill, relying only on world knowledge."
2. If the pass rate is only 40-60%, they write a roughly 100-line skill to fill in the key domain context.
3. They rerun the eval, and only consider it usable once the pass rate climbs to 90-95%.

As foundation models get smarter down the line and documentation gets better trained in, some skills may eventually be retired; but for now, this mechanism quickly closes the gap between world knowledge and actual product operation.

Skills are also used to carry an enterprise's own business logic. Customers can write skills specific to their organization, and Snowflake will eventually offer a skills marketplace/catalog to make sharing within an organization easier. Many companies even encode entire business processes (such as internal-control rules or standard report-generation procedures) as skills, so the whole company operates the same way, with agents able to execute them automatically.

Key technique three: tools, MCP, and extensibility

Within the agent runtime, besides core SQL execution, Cortex Code carries a large number of tools for specific scenarios, such as:

- A tool that generates and validates Snowflake SQL (the LLM generates it first, then it's checked against Snowflake syntax).
- Tools dedicated to interacting with DBT, Airflow, and dashboard tools.
- Other external systems, such as Databricks, AWS Glue, and so on.

Most of these are wired together via MCP (Model Context Protocol). MCP provides a unified interface that lets the agent "plug into" GitHub, Jira, Slack, PDF generators, and more. As an example, the speaker mentions an internal automation pipeline that already exists: watch a Slack complaints channel → automatically open a Jira ticket → generate a pull request → assign it to a developer — the whole chain strung together with Cortex Code plus MCP.

For an ordinary developer, any public skill or service that supports Cloud Code skills / MCP can, in principle, be used directly alongside Cortex Code as well.

Security strategy and governance

On the security side, the team's conclusion is: don't over-rely on "prompt guardrails," because as models get smarter they'll always find a way around the rules — instead, go back to fundamentals:

- Everything runs under a low-privilege account, fully complying with existing Snowflake RBAC; there is no separate high-privilege agent account.
- Every action is logged and traceable, auditable by internal-controls / security teams.
- Tools for destructive operations (DROP TABLE, deleting files) require the user to reconfirm by default, and IT can also disable any "skip protection" mode.
- Disable the agent's default access to arbitrary external web content, to avoid high-risk behavior like "go find some document online for me, then run the SQL inside it against my production." Enabling external access requires explicit consent.

Demo and advanced capabilities

In the second half, he runs a CLI demo, focused on actually experiencing the workflow acceleration:

1. In an empty Snowflake account, he asks Cortex Code to generate 2,000 rows of synthetic electronics-retail transaction data.
2. The agent draws on world knowledge to infer reasonable columns and structure, generates a CSV, creates a stage and table, and loads it into Snowflake.
3. Based on the prior conversation and "local memory" (past actions written to a local markdown file), it predicts what you might want to do next — such as building a DBT model or a Streamlit dashboard — and proactively asks whether it should do that for you.

He demonstrates an "agent team" concept: you can ask it to build a DBT staging model and a Streamlit dashboard for this dataset "at the same time," and Cortex Code will spin up two sub-agents, each handling a different task in parallel, then consolidate the results and report back.

Also in the CLI, you can view the list of currently available skills (both official and your own custom ones), switch models, and view installed plugins (such as Databricks, Iceberg / Glue, etc.).

Model selection and cost

Right now the "Auto" model option just "picks the top-tier model" — it doesn't yet truly route dynamically to different models based on the task, an area they've received a lot of requests about and plan to improve. Enterprises also want to be able to set an organization-level default model (for instance, forcing the use of a cheaper Sonnet), which is also on the governance-feature roadmap.

On pricing, Snowflake positions Cortex Code as "a tool that helps customers build things faster on Snowflake," rather than a standalone revenue product. So for customers, it's mainly a pass-through of Anthropic's or OpenAI's model costs with no added markup, aiming to keep the cost at roughly the same order of magnitude as using those models directly.

In summary, this video is about how Snowflake deeply integrates a coding agent into its own data platform — using real-time metadata, skills, tools, and MCP to turn "AI writing my SQL / pipeline for me" from a demo into a product that can run safely inside a real, governed enterprise environment.
