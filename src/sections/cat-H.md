---
heading: AI Coding & AI-Native Engineering
desc: Coding agents, AI-native development workflows, and organizational transformation: the methodology is worth borrowing, though most cases involve general-purpose coding agents.
---
## Building a Data Native Agent: Cortex Code
@ Snowflake
Introduces Snowflake Cortex Code, a "data-native" coding agent whose core purpose is closing the "context gap" where a typical agent generates SQL referencing tables/columns that don't exist — solved by grounding it in real time against the actual schema, RBAC, and warehouse, and always "executing as the user." Treats skills as first-class citizens (with evals that lift pass rates from 40–60% to 90–95%), uses MCP to connect to DBT/Airflow, and emphasizes that security comes from low-privilege accounts and auditing rather than prompt guardrails.

## Calvin French-Owen on the Future of Agentic Coding
@ Calvin French-Owen (ex-OpenAI Codex)
Unpacks how coding agents are shaped by pretraining and RL, and how the inference/harness layer manages context and long-running tasks, then suggests engineers shift their time toward design decisions that are "hard to verify and context-dependent," leaving verifiable, automatable implementation to the agent. Also compares different model personalities and applies management thinking to acting as the bottleneck manager of a "software factory."

## How Action Bias Breaks Autonomous Software Maintenance
@ LogicStar.ai
Points out that autonomous-maintenance coding agents have an "action bias": even when the code is already fixed (about 50% of bug reports are duplicate/stale), there's still a 35–65% chance the agent will make unnecessary changes and pile up technical debt. Uses FixedBench to show that increasing the reasoning budget doesn't help — what actually works is explicitly including "doing nothing is also success" in the outcome space of prompt/task design; the root cause is that RL almost exclusively rewards "taking action."

## How we made Trail of Bits AI-Native (so far)
@ Dan Guido, Trail of Bits
How a security consultancy actually became AI-native: using an AI maturity matrix, an AI handbook, internal hackathons, a skills repository, multiple sandboxes, and MCP governance to treat agents as regular teammates — pushing bug discovery on some projects from 15 per week to roughly 200. The second half discusses how AI makes finding vulnerabilities cheap, shifting the bottleneck to human judgment.

## Make Vibe Coding Safe: How to Test with Playwright
@ Amazon AGI Lab
Explains how to use Playwright (paired with Playwright Test MCP) to build reliable end-to-end tests for vibe-coded web features: letting the agent actually open a browser and read the rendered accessibility tree to pick the most stable locator. Recommends keeping tests small and focused, running them on every commit, and treating failures as bugs to investigate.

## Recursively Self-Improving Agents as Autonomous Software Engineering
@ Factory
Applies a "signal→fix" automatic loop to its own codebase: a daily-batch online evaluation system called Signals uses an LLM judge to tag friction/delight in user sessions, letting Droid automatically triage, open tickets, open PRs, and add tests. Before reaching human review, PRs must pass multiple gates — regression evals, independent agent code review, security review, and end-to-end QA. Concludes that automation can absorb a large share of clearly scoped, locally fixable work, while direction and taste remain steered by humans.

## The Best Engineer in the Room Doesn't Write Code
@ Emilie, Kilo Code
Argues that the strongest engineer's value isn't in writing the most code, but in owning the problem and the outcome, and that the key going forward is turning AI from a session-based tool into an "always-on, outcome-accountable" AI colleague. Using always-on agents as an example, explains the need to give agents a persistent identity, finely scoped permissions, event-driven triggers, and a separation between the control plane and the runtime plane.

## The Mythical Agent-Month
@ Posit
Now that agents can write large amounts of code on our behalf, argues that an engineer's real value lies in scoping the problem, designing the architecture, and exercising "taste" — borrowing from The Mythical Man-Month's distinction between essential and accidental complexity, since agents are good at accidental complexity but struggle with essential design. Describes their own agentic engineering stack (automated code review, a session database, a self-built issue tracker).

## The Prompt is the Platform
@ Dominik Tornow, Resonate HQ
Proposes a new engineering workflow where "the spec is the product, the prompt is the platform": a reusable abstract spec is turned into custom implementations for different platforms by a coding agent. The key is having the agent first produce a "simulated implementation" in a deterministic simulation environment to verify the correctness of distributed algorithms, then derive the concrete spec and production implementation from it — turning the agent from an end-of-pipeline code writer into a design lead.
