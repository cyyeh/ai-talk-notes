---
heading: BI / Analytics / Semantic Layer
desc: Semantic layers, text-to-SQL, self-service analytics, conversational analytics, causal decision-making — the core themes of data analytics and business intelligence.
---
## A Guide to Deploy an Enterprise-Ready ClawdBot in Under 30 Minutes
@ Ethan, TextQL
Demonstrates how to deploy an enterprise-ready data agent in under 30 minutes — one that proactively cleans up messy data, runs SQL, and combines external APIs, running long background "brute-force searches" of the database to proactively surface revenue opportunities and cost-optimization points and suggest next steps, rather than passively waiting for people to ask questions. It also emphasizes security design — semantic layers, PII anonymization, a sandbox proxy, and Okta / Azure AD identity integration — that lets CISOs feel confident putting it into production.

## Agents Are Eating the Semantic Layer
@ Zenlytic
Argues that the traditional semantic layer has become a ceiling for AI agents: its coverage is limited to predefined metrics, and LLMs perform far worse on a proprietary DSL than on SQL, leaving them unable to answer real business questions that require multiple CTEs, window functions, or cohort comparisons. Proposes "decomposing" semantics into text-based context that agents can read and write (query history, field values, instructions, memory, knowledge graphs), letting agents write arbitrary SQL directly and using semantics for explanation and governance instead.

## Benchmarking AI Agents Against Realistic Analytical Tasks with ADE-bench
@ ADE-bench team
Points out that clean benchmarks that only test "LLM writes SQL" are far removed from real analytical work, so the team designed ADE-bench: deliberately "breaking" models and changing business rules inside messy DBT projects full of legacy code, macros, and third-party packages, to test whether an agent can navigate context, understand ambiguous business instructions, and fix the data world. Practical insight: semantic layers plus data modeling plus field/table descriptions substantially boost accuracy ("humans don't read the docs, but Claude does") — data agents currently complete roughly 60-70% of the work.

## Building the Blueprint for Scalable Data Products in Public Sector
@ Chief Data Officer, City and County of San Francisco
San Francisco's CDO argues that "AI is cheap — the hard part is data and infrastructure governance," pointing out that government data is fragmented and lacks shared definitions and SLAs. She splits maturity into L1/L2/L3 (only L3 — with certified datasets, clear owners, SLAs, and strict RBAC — is safe to put AI on). She proposes a "three-question checklist" and the principle "if a person can't see it, neither can the agent," using a unified platform with a semantic layer as the example.

## Democratizing Analytics via Self Service
@ Netflix
Netflix uses a semantic layer and self-service tools to extend "who looks at data" to non-technical roles, proposing the 3D principle (Democratize / Discover / Define) and splitting the semantic layer into a semantic model, query engine, and UI. It then extends to an AI-native conversational analytics stack: data layer → semantic layer → MCP tool layer → agent layer → skills → evaluation layer, and proposes the "analytics trilemma" of Speed / Flexibility / Accuracy, emphasizing that metrics should be run like a product.

## From Prediction to Uplift: Causal Modeling for Better Decisions
@ Intuit
Explains that "predictive models" can only answer "who will do X," not "who will change their behavior because of an intervention" — yet the latter is what actually matters for decisions. Introduces uplift (causal) modeling: using potential outcomes, CATE, and S-learner/T-learner to estimate intervention gains, evaluated with uplift-by-decile curves. Conclusion: when treatment has a cost and can't be applied to everyone equally, you should shift from prediction to estimating causal uplift.

## Welcome to Our Data Benchmark, Where Everything's Made Up and the Points Don't Matter
@ Izzy, Hex
Criticizes existing public benchmarks for data-analysis agents (DS-Bench, Spider, Tinybird, etc.) for being mostly single-turn text-to-SQL, built on fabricated data and brittle string matching — nothing like real data work (clarifying what "revenue" means, whether units are cents or dollars, broken ETL). Argues that evaluation should be "stateful, long-running, and agentic," testing whether a model can learn from its mistakes, and introduces the team's own Metric City: a 90-day simulation.

## Powering Agents with Context Graphs & Ontologies
@ Datalinks
Argues that real enterprise data mostly lives in tables, so it uses a "tabular graph" plus an ontology, linking PDFs, wide tables, and extensive discussion cell-to-cell into a queryable context layer, letting agents jump between tables with programming-language-like queries to answer business questions. The modeling principle: every wide table should work as an executive dashboard on its own, with field semantics clear to both humans and LLMs, then linked into a graph via connecting fields; agent decision trajectories are also stored as a context graph for auditing.

## We Solved Agent Building
@ Vercel
Shares the evolution of Vercel's internal text-to-SQL data agent, D0: from stuffing the entire Snowflake semantic layer (roughly 300 entities) into the prompt, to decomposing into multiple sub-agents, and finally — inspired by Claude Code — switching to "filesystem + minimal tools (read/write files, plotting, bash) + skill distillation," automatically distilling common questions into 40+ reusable skills (handling around 2,000 queries a day). This experience was ultimately abstracted into a "Next.js for agents" framework.

## What Happens to BI in an AI-First World?
@ Sean, Evidence
Argues that in the AI era, BI won't be replaced by chat — it will be upgraded into a "codified, agent-driven, self-optimizing organizational intelligence system." The core is an "analytics as code" repo (YAML/markdown/SQL plus full lineage), where chat/reports/dashboards can be upgraded or downgraded into one another, and the explosion of self-service content is treated as a "goldmine of intent signals" fed to AI to form a self-reinforcing feedback loop (customer feedback → automatic PR). The data team's role shifts from "taking orders to build reports" to running the entire intelligence-system product.

## Why Can't Anyone Answer Questions About the Business?
@ Garrett Galow, WorkOS
Introduces the internal tool Studio: it lets support and operations staff query Snowflake/Linear/Notion in natural language and generate reusable widgets (declarative JS that no longer goes through an LLM at execution time, so it's cheap and behaves predictably). The three pillars of reliability are sequencing (preflight checks, injecting schema on demand only at the moment a tool is actually needed), layering (multi-layer prompts telling the model not to trust its own stale knowledge and to trust the primary source instead), and validation (actually running the query to confirm there's data before baking it into the widget).
