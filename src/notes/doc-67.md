---
title: Running Enterprise Agents in Production: Architecture and Secure Execution Models
speaker: Salesforce
video: https://youtu.be/LthkAkIQhgc?si=n4jvdJackttUNW-5
---
This video is about what it really takes to move AI agents from demo/MVP status to actually running long-term in enterprise production — and the key isn't the model itself, but engineering and operations: runtime types, coordination and state-management patterns, security and control planes, and observability plus eval loops.

Core idea: reliability is an engineering problem, not a model problem

The speaker opens with a premise: "reliability is not a model property, it's an engineering problem."\
The model is just scaffolding; what actually determines whether something can run stably in an enterprise is:

- How you design task decomposition, coordination, state persistence, and recovery
- How you wrap security, permissions, auditing, policy, and monitoring around the runtime
- How you keep correcting the pattern over time (she uses the metaphor of a "biased random walk: drift vs. variance")

Variance (the real world's messiness, bugs, partial rollouts, business anomalies) will never be 0, so you shouldn't fantasize about eliminating variance — instead, you need the slope of "drift" (your ongoing iteration and fixes to the system) to outpace variance.

Three emergent runtime types

She divides the production agents she's seeing today into three runtime categories:

1. Conversational agents

▫ Unit: session / turn

▫ Latency requirement: seconds

▫ Use cases: enterprise search, customer-service chat, etc.

▫ Main pressure: low-latency UX, with all context living inside a single session

2. Autonomous agents (task-based)

▫ Unit: task / episode

▫ Trait: a task is broken into multiple subtasks/subagents, running for anywhere from minutes to a dozen or so minutes

▫ State between episodes/subtasks is maintained via a queue

▫ Main pressure: how to split and recombine tasks, and complete them within enterprise constraints (time limits, retries, tool timeouts)

3. Long-horizon agents (process-based)

▫ Unit: process (e.g. "renew 22 million contracts," "help me build a browser")

▫ Duration: at least 25–30 minutes up to several hours (she mentions systems that can run for 10 days), though in enterprise practice it's mostly "a few hours or less"

▫ Requirement: must be able to pause/resume without rebuilding the entire context; the environment and requirements can change mid-process (the process was designed, but business conditions keep shifting after it goes live)

▫ This is the area she focuses on most, and also the hardest and most valuable type

Her point: before designing agents, honestly decide which runtime type you actually need; that runtime type then determines your design space for coordination, state, and control.

Three dimensions: coordination, state, control

Once you've picked a runtime, you have to handle three dimensions at once:

1. Coordination (how to split / how to merge)

▫ How is the task cut into subtasks?

▫ How are the subagents orchestrated?

▫ How are final results merged, and how are partial results handled?

2. State (how the system remembers what happened)

▫ After a conversation ends or a process is interrupted, how is state persisted and restored?

▫ In multi-turn interactions or long-running processes, how do mid-flight changes (e.g. a product reaching end-of-life) get reflected into the existing flow?

3. Control (who decides what runs, and when it stops)

▫ What can be fully automatic, and what absolutely requires a human in the loop?

▫ At scale, how do you throttle, approve/escalate, and kill-switch?

▫ When you have millions of operations, where are the limits of human oversight?

These three dimensions are mandatory questions for any enterprise agent.

Coordination patterns: hierarchical delegation vs. scatter-gather + saga

On "how work gets split and merged," she proposes two common patterns:

1. Hierarchical delegation

▫ A high-level orchestrator/planner sequentially assigns subtasks to subagents, then collects and merges the results

▫ Analogy: Mission Impossible — the main task executes step by step

▫ Advantages:

⁃ The process is clear and predictable

⁃ Merge policy and partial-result policy can be clearly defined

⁃ Among the production systems she's seen, this is currently the "most common, most reliable" pattern

2. Scatter-gather + saga (parallel + compensation)

▫ The orchestrator fans out to multiple workers/peers at once (can be a lot of them)

▫ Workers don't maintain long-lived state; state is held by the coordinator/compile agent

▫ If a worker fails, the Saga pattern is used for compensation or rollback

▫ Analogy: Ocean's Eleven — everyone acts at the same time, then it's all reconciled at the end

▫ Advantages: fast, scales in parallel — but the compensation logic can easily end up more complex than the original flow

Her observation: in enterprise practice, most teams land on hierarchical delegation first, because it's "easy to explain, easy to govern, easy to audit."

State patterns: event-driven sequencing vs. shared state machine

On "how state gets stored," she contrasts two patterns:

1. Event-driven sequencing

▫ An append-only event log serves as the source of truth

▫ Supports replay and branching (enterprises love these two words)

▫ Well suited to triggering async workflows and downstream behavior

▫ But there are two big problems:

⁃ Out-of-order events: when event ordering breaks down, business semantics often break along with it

⁃ You usually can't fully control every event producer (multiple systems, multiple teams each emitting independently) — once a few of them break, get refactored, or change format, it becomes very hard to guarantee the whole agent flow is 100% correct

2. Shared state machine

▫ A single, explicit state store/state machine serves as the sole source of truth

▫ What workers do is merely "comment on" this state; the actual state transitions are driven by the state machine itself

▫ She believes that, especially in regulated industries and for long-horizon agents, the shared state machine becomes an "unavoidable" pattern, because:

⁃ Observability is better (you can drill into any state at any time and see its full context)

⁃ It's better suited to auditing, compliance, and debugging

She clearly sides with the shared state machine, and says she sees the industry gradually converging on it.

Control patterns: human-in-the-loop vs. supervisor & gates

On the control plane, she discusses two typical approaches:

1. Human-in-the-loop

▫ The easiest pattern to understand and the most common, especially at smaller rollout scales (e.g. 1,000–5,000 units)

▫ Requires at least four control capabilities:

⁃ throttling (rate-limiting/pausing)

⁃ approval (review)

⁃ escalation (escalated handling)

⁃ kill switch (emergency master switch)

▫ Downside: once you're dealing with tasks at the scale of "renewing 22 million contracts," human capacity gets completely overwhelmed (Slack fills up with notifications, and people just mute the channel)

2. Supervisor + gates

▫ Introduces a supervisor agent that performs "heartbeat checks + exponential backoff + policy gating"

▫ Before a sub-agent executes, it must first pass the gate's policy check (model capability differences matter a lot here — some models are inherently better at following policy and reasoning)

▫ Real-world constraint: an enterprise may only allow specific models to serve as these gates (for security/compliance reasons), so you can't just pick whatever open-source SOTA model you like — this significantly limits room for innovation

Her conclusion leans toward: you typically start with human-in-the-loop + kill switch, then as scale grows, gradually introduce a control plane centered on supervisor/gates automation.

Mental model: pick the runtime first, then pick the pattern for each of the three dimensions

She offers a practical "back-of-the-napkin mental model":

1. Go back to pen and paper and honestly define the runtime:

▫ Is it purely conversational?

▫ Or conversational + autonomous?

▫ Or is it essentially a long-horizon process?

2. Based on that runtime, "work backward" to your choices across the three dimensions:

▫ Coordination: hierarchical / scatter-gather / a hybrid?

▫ State: event log / shared state machine?

▫ Control: mostly human, or mostly supervisor? What hard constraints (compliance, internal policy) have already decided this for you?

She says that, looking back on her own projects, many early missteps came from:

- Wrongly treating a "long-horizon process" problem as if it were "event-driven + human-conversational"
- Or not thinking the runtime through clearly, then just taking an existing human process and slapping "an AI layer" on top, which caused nearly every subsequent pattern layer to grow crooked

Case study: B2B telecom contract-renewal flow

She uses a concrete B2B telecom contract-renewal flow as a case study to show how these patterns break down in the real world:

- A single contract can have 50–60 products, with complex hierarchical structures and terms
- Starting roughly 90 days before a contract is due to expire:

▫ Watch for usage decline

▫ AML/ML models predict churn (often with multiple teams each running their own churn model)

▫ Analyze signals like network availability, billing, support tickets, disputed bills, etc.

▫ Design new offers, pricing, promotions

▫ Update CRM and billing systems; the final outcome may be: renewal / restructuring / churn

Her initial instinct was the same as most people's:

- "This looks like a perfect fit for event-driven + scatter-gather":

▫ Lots of independent signals and workflows

▫ Needs fast reaction and parallel processing

▫ E.g. the churn agent, offer agent, and contract agent all kick off at the same time

Pitfalls discovered once it actually shipped:

- Saga compensation explosion:

▫ For example, the contract agent has already sent a new contract to the customer, but the offer agent times out or fails on some condition

▫ How do you "compensate" at that point? The contract has already gone out, so the compensation logic ends up being the hardest part of the whole flow to write

- Uncontrollable event ordering and producers:

▫ Mid-flight product end-of-life, a competitor appearing, a new promotion launching — all of these generate new events

▫ If the migration agent is still running while the closing agent has already closed the case out based on stale context, you get bad decisions

▫ This depends heavily on controlling every event producer, which in a real enterprise is nearly impossible

- The limits of using humans as the primary control:

▫ In the early rollout to a small subset of customers, human-in-the-loop was still fine

▫ When scaling to millions or tens of millions of contracts, human capacity completely breaks down, and notifications/reviews turn into noise

In the end, what they actually shipped was:

- A variant of hierarchical delegation + human-in-the-loop, as "an acceptable, cheap, and reliable starting point achievable within 6 months"
- They built an event-driven POC, then shelved it after finding the risk and complexity too high
- They're now evolving toward a shared state machine, because:

▫ They can't fully control every source system

▫ They want stronger observability and compliance capability

Her meta-lesson:\
Don't fixate on finding "the perfect pattern" on the first try — instead pick whatever combination is most reliable and easiest to ship right now, get it running in a real environment, and keep iterating on that "drift curve."

Observation and evaluation: it isn't really in production without observability

She spends a long stretch on how "observability & evals" are close to a ticket to entry for enterprise agents:

1. Three observation lenses

▫ Operational lens: P95 latency, queue depth, retry/error rate, etc. — making sure the system is "alive and holding up"

▫ Business lens: renewal rate, how many contracts were saved, how much outreach was sent, actual conversion outcomes, etc. — used to build the business case for the next round of iteration

▫ Compliance lens: the evidence needed to satisfy various regulations and internal controls (UGC, CMMC, CPNI, FCC…) — ideally, like a Bloomberg terminal, you can click into any event and see the full state and context at that moment

2. Eval patterns & intervention mechanisms

▫ Single-step evals: given a particular state, check whether the next action is reasonable and complies with policy and risk limits

▫ Trajectory/replay evals: replay the entire flow and check it thoroughly (critical for compliance and incident investigation)

▫ Adversarial scenarios: work with the business to design extreme scenarios (e.g. a product suddenly reaching end-of-life, multiple systems changing at once) to validate the flow's resilience

▫ Production sampling & shadow runs: have humans and the agent run the same flow at the same time and compare performance (standard response metrics)

3. Three standard enterprise eval interfaces

▫ Kill switch

▫ Replay

▫ Override (a human steps in to override the agent's decision when needed)

She even suggests: build the "operational console" first, even if it's not part of the main product stack — build one on the side if you have to; without this console, enterprises often won't let you into production.

A few other strong opinions

Finally, she shares a few more subjective but very practical opinions:

- The multi-agent debate pattern basically doesn't work for long enterprise processes

▫ Unless you're in a specialized scenario like research or coding agents

▫ In general business processes, she prefers "explicit, typed input/output, deadlines, retry budgets, and partial-result policy," to cut down on negotiation and unpredictability

- Pattern will keep mattering more than model

▫ Model variance (sigma) will keep shrinking, but the pattern you chose (the direction of drift) doesn't automatically get better as a result

▫ Once a pattern becomes entrenched in an enterprise, it's very hard to change, so the initial pattern choice matters all the more

- Practical advice

▫ Think of your flow as a long-horizon agent from the very start, not as "chat + plugins"

▫ Prioritize patterns that fit the enterprise — auditable, observable, easy to roll out — over whatever architecture looks theoretically flashiest

▫ Accept that "continuously iterating the pattern" is the norm: start with the most stable hierarchical delegation + human-in-the-loop, then evolve toward shared state machines, supervisor gating, and so on

Overall, this video is teaching you: if you want agents running in a large, regulated enterprise to be more than a demo — to run stably long-term on real data and real systems — you need a clear mental model of runtimes, a strategy for combining patterns across the three dimensions, and the supervision, security, observability, and evaluation infrastructure that surrounds it all.
