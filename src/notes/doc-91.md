---
title: What Happens to BI in an AI-First World?
speaker: Sean, Evidence
video: https://youtu.be/HUrHMyb_D84?si=lI6Q9qyZ3ZsKWaUL
---
This video discusses how, in a world where AI is extremely powerful, BI won't disappear — it will evolve into an AI-agent-driven "org-wide intelligence system," and the role of data teams will change along with it.

Main thread: from BI to an "intelligence system"

Sean starts by revisiting BI's original vision: letting the whole company share information and make better decisions, rather than just "building a pile of drag-and-drop dashboards." In the past, technical limitations forced a lot of cognitive load onto users (pulling their own dimensions, slicing their own metrics). As AI capability grows, these limitations are starting to disappear, and we can go back to pursuing a genuine intelligence system that connects "all the way from high-level strategy down to front-line action."

He illustrates this with a case from his time at a private equity fund, doing sales analysis for a portfolio company:\
running hundreds of visits alongside the sales team, building a custom app to collect data, feeding it into a CRM, a data warehouse, data models, BI reports, all the way to board presentations and decisions, then feeding the gaps back into front-line processes to close the loop. This kind of end-to-end intelligence system is extremely effective, but without AI it's extremely expensive, and can only be justified for projects with a huge ROI. AI drastically lowers the cost of this kind of "heavily customized, self-optimizing intelligence system," making it implementable across far more departments.

Users and formats: it's not just "dashboards vs. chat"

He divides analytics "users" into several categories: management, middle managers, front-line staff, customers, and a new category — AI agents. Each category has a different kind of decision and different working context, so each needs a different presentation format:

- Management: setting strategy, aligning priorities.
- Middle managers: planning and managing projects/initiatives.
- Front line: executing concrete tasks, with fragmented time, often on the move.
- Customers: judging whether they're getting the value they're owed.
- AI agents: also need to be "aligned" — when answering questions, they need to be consistent with the answer the CEO would give.

The key question isn't "will dashboards get killed off by chat" — it's the "persistence" of a metric or insight:\
things with high persistence (like a car's dashboard, or a company's core KPI dashboard) should be stable and quickly scannable; chat, on the other hand, leans toward short-lived, one-off analysis. AI chat is very valuable, but if everything turns into a chat log, it's as unreasonable as constantly asking a chat box "what's my speed right now?" while driving.

The more sensible future looks like this: chat, reports, and dashboards can "upgrade/downgrade" into each other:\
a good insight discovered via chat can be upgraded with one click into a governed dashboard; and a particular chart on a dashboard can also be drilled down into ad hoc analysis or a chat conversation.

Content explosion isn't a disaster — it's a "goldmine of intent signal"

The history of BI has gone like this:\
it started as Excel everywhere, then became Excel plus BI dashboards. Now that AI is being layered in, self-serve content, chat-based analysis, and personal reports are about to explode — which looks, on the surface, like an even worse case of "report sprawl." Sean's view: this is actually an opportunity.

Every report, chat query, and personal analysis is a trace of what someone genuinely cares about and how they look at the data. If you can use AI to read all of this and turn it into structured, maintainable code, you can build a self-optimizing analytics system. The precondition: all of it has to be digestible by AI, which means "everything has to live in code."

A lesson from software engineering: the self-reinforcing feedback loop

He then pivots to software engineering, noting that in 2024 only about 5% of Evidence's code was written by AI, and by 2025/26 that's become 95%. He breaks their journey of adopting "AI agents" into several levels:

1. Hand-written code.
2. AI-assisted coding (like Cursor, with a human in the loop).
3. Multiple agents running in parallel (like Conductor), where you start to lose visibility into the specific code details.
4. Assigning tickets directly to agents inside the issue tracker (Linear), with the agent working in the background and then opening a draft PR.
5. The end goal: a self-reinforcing feedback loop, running all the way from user feedback to an automatically opened PR, updated logs, filled-in documentation, and smoother handling the next time a similar issue comes up.

He shares a design they've actually built for going "fully automatic from customer feedback to PR":

- Multiple feedback sources: the in-product feature-request page, the in-product AI chat automatically filing requests on a user's behalf, the AI proactively opening an issue whenever it hits something it can't handle, customer questions in Slack channels — all of it flows into a Linear issue.
- Triage: rules or AI sort issues into "critical feature/bug," "minor fix," or "tiny documentation tweak" — high-risk items still go to a human, low-risk ones go to an agent.
- The agent's work session: the agent is given read-only access to the log provider, database, and codebase. It can look up logs itself, pinpoint the error, find the relevant code, and propose a fix. If information is insufficient, it will automatically add logging, fill in documentation, or update rules, paving the way for the next agent.
- Once done, it opens a PR with a description, a deploy preview, and screenshots or a recording; a human plus an AI review tool (like Reptile) jointly review it before merging and replying to the customer.

Every time this loop runs, the system's own logs, documentation, and rules get better, which raises the success rate the next time AI handles a similar issue — that's the core of "self-improvement."

Porting this pattern to analytics/BI

Sean thinks analytics teams are currently a bit behind software engineering, mainly due to structural tooling constraints (lots of drag-and-drop UIs, nothing living in code). But the direction is already clear: AI needs to be able to build a similar self-reinforcing feedback loop in the analytics domain too.

He demonstrates what the Evidence team has built for their internal analytics:\
a request like "please add issue cycle time to the engineering report" becomes a Linear issue, gets assigned to a Cursor agent, and the agent — inside the Evidence reporting project, which is essentially markdown + SQL — directly edits the code and opens a PR that produces a new section. A human just needs to check the deploy preview and quickly scan the diff before merging with confidence. This is completely different from traditional BI, where you manually drag charts around in a tool's UI.

To support this pattern, he proposes a new analytics operating model:

- At the center is an "analytics as code" repo (kept in Git), using YAML, markdown, and SQL to define every analytical artifact — data models, metrics, dashboards, apps.
- Everything has full lineage: from the tables in the source system all the way to a chart on a report, and who viewed it — all of it traceable.
- AI agents use a general-purpose agent (like Claude Code) that can, within a single PR, edit the DBT model, the report, and even the documentation at the same time, rather than splitting work across multiple scattered small agents that share no context with each other.
- Users don't just consume these governed reports — they can also produce self-serve content within safe boundaries. This self-serve content is "sandboxed" to avoid polluting core assets, but is also collected by the system as a signal of "intent and value" — good self-serve content can be promoted into a formal, governed asset.
- Usage and lifecycle management become automated: reports that stop being used after a while can automatically be flagged as stale, scaled down, or retired, keeping the system clean.

Under this architecture, the data team is no longer just "taking orders and building reports" — it's responsible for running an internal "intelligence product": an org-wide intelligence system. The focus of the work shifts to:

- Designing and maintaining the overall system (data, agents, content, governance, user experience).
- Interviewing users across departments and observing how they interact with the system, to do meta-level optimization of the system itself, rather than helping pull one chart at a time.
- Rigorously guarding trust and curation: making sure that, as long as something is inside this system, users can trust it wholesale, instead of being forced to figure out on their own which of a pile of half-trustworthy or untrustworthy assets to believe.

How the data team's role and skills change in the AI era

In this AI-first world, Sean's assessment is:

- Most mechanical, technical work will be done by agents (writing SQL, modifying pipelines, updating reports, adding logging, fixing docs).
- Data teams won't be replaced — they'll shift from "case-by-case executors" to "system product owners," running the entire org-wide intelligence system.
- The division of technical roles will become less granular, because one person plus a powerful AI can work end-to-end across multiple layers of the data stack.
- In terms of team structure, there will be a small, centralized core team responsible for the system itself, paired with analysts embedded in each business unit. These embedded analysts can be relatively "less technical," but need strong analytical ability and domain knowledge, then lean on AI to handle the technical side.

His concrete recommendations for data teams

Finally, Sean offers a few practical recommendations for preparing for an AI-first BI world:

- Move as much as possible into code/Git/the file system, so AI can work with it easily and it stays version-controlled.
- Start designing from "what your ideal intelligence system would look like," rather than extrapolating from your current tools' capabilities, because tools will evolve much faster than you'd expect.
- Learn extensively from software engineering — your own data team should actually be using various AI dev tools and agents, including making them available to non-engineering colleagues.
- Don't linearly extrapolate today's AI capability to plan your architecture 1–2 years out; instead, lock onto a relatively stable set of "target capabilities/use cases" first, then progressively swap out and upgrade the underlying technical components as models and tools improve.

In summary, the core message of this talk is:\
BI won't simply be replaced by a "chat interface" — it will be upgraded into a self-optimizing, org-wide intelligence system made of code and AI agents. The data team's value will shift from writing reports to designing, governing, and running this entire intelligence system.
