---
title: Building Durable, Long-Running Autonomous Agents
speaker: RedScope AI
video: https://youtu.be/aYSl1hbuPfs?si=L8MPE5E5RMG3Se4t
---
This video is about how to make an AI agent not just perform well in demos, but actually survive long-term in a real-world environment.

Core idea

The speaker uses his own content-platform project as an example: early on, the agent kept failing in production, and every failure brought API costs, compute costs, SLA violations, customer complaints, and refund negotiations. The whole team got stuck firefighting and couldn't properly iterate on the product. They eventually realized the problem wasn't "a bad prompt or model" — the entire architecture simply wasn't designed for production in the first place.

He breaks a "durable agent system" down into three pillars: durable execution, durable autonomy, and durable statefulness, emphasizing that agents will inevitably make mistakes, drift, and produce wrong results — the point isn't to avoid errors, but to make sure the system can keep running safely after errors occur.

I. Durable Execution: tasks must actually be completable

The first pillar is durable execution: never mind whether the job is done well — if you can't even reliably finish the task at all, nothing else matters.

He says the biggest difference between dev and production is the "cascading effect" of failure: one stuck task causes a backlog, the queue fills up, and the whole pipeline breaks. In dev you can freely kill and restart, but in production hundreds of agents can go down at once.

Engineers' instinct is to add retries — he calls this "Level 1": a bit better than doing nothing at all (Level 0), but still far from enough. The reasons include:

- Many failures come from process/infra issues — a server taken offline, a VM running out of memory, a deploy interrupted — and a simple one-line retry can't fix any of that.
- When error classification is imperfect, you might blindly retry a client error like a 400, needlessly hammering an external service.
- People only add retries where they assume things will break, leaving the rest of the code as blind spots — turning it into an endless game of whack-a-mole.

He argues the mindset needs to shift from "failure-proof" to "failure-tolerant": you can't guarantee third-party APIs, networks, or machines will never break, so the goal should be that the system can still hold up even though these things are bound to break. Achieving this requires three properties:

1. State persistence: state must be persisted, or there's no basis for any durability at all.
2. Universal fault tolerance: this must cover not just a single API call, but every path — including file I/O and internal service calls.
3. Intelligent retries: the retry strategy needs judgment, not mechanical, indiscriminate retrying.

For durable execution, he compares two mainstream frameworks: Temporal and LangGraph.

- Temporal's philosophy: durability is infrastructure's job — the code doesn't need to worry about it — achieved through a durable event log that enables deterministic replay. On failure, it replays the workflow from the start, but the results of expensive operations are pulled back from the log instead of being redone. The upside is that recovery is automatic and almost magical; the cost is that the workflow must be deterministic — non-deterministic things like random numbers, timestamps, and LLM responses have to be wrapped inside "activities." Also, its state is automatically persisted as local variables, which is less transparent for developers — debugging/inspecting requires special tooling.
- LangGraph's philosophy: if you clearly define the agent's structure (graph / state machine), durability emerges naturally. It checkpoints state at every step, and on failure it "resumes from the most recent checkpoint" — like loading a save file in a video game. State is an explicitly declared typed object, free to log and inspect. You choose the persistence layer yourself — Postgres, Redis, in-memory, all work — giving you more control and visibility, but also putting the responsibility on you.

How do you choose? He offers a few guidelines:

- When the control flow is simple and linear, Temporal is a natural fit.
- When the control flow has many branches, dynamic routing, or a graph-like structure, LangGraph is more suitable.
- Temporal needs an extra layer of infrastructure (a Temporal server), which is a burden for small teams; LangGraph requires no additional infra, making it friendlier.

His recommendation: for agentic needs, start with LangGraph, and only "graduate" to Temporal once you need stronger guarantees and have the bandwidth to operate the extra infrastructure.

II. Durable Autonomy: letting the agent know when it needs a human

The second pillar is about durable autonomy — dealing with "silent failures," not the "loud failures" that blow up outright.

He says a loud failure is actually a good thing — at least it's honest. The most dangerous case is when the agent appears to run through smoothly, yet produces wrong or extremely poor-quality output that nobody notices. A common scenario on a content platform: the model is capable of writing an article, but is missing certain "information that only a human can supply at key moments," such as:

- Which keyword variant is better for SEO?
- What's the company's official stance and tone on this topic?
- Who is the real target audience?

Without this information, the agent can only guess, producing output that's low quality yet "formally looks complete" — this is a silent failure.

He points out a tension that's often overlooked:\
One end of the team wants "full automation, no human intervention"; the other end, wary of risk, leans toward "check with a human on everything," which turns humans into the bottleneck. The right approach isn't to pick one extreme, but to choose a starting operating point and then gradually move toward higher autonomy as the agent earns trust.

He proposes an "autonomy maturity model":

- Stage 1: demo-grade — fast, flashy, but fragile.
- Stage 2: the "policy-gated human in the loop" pattern common in production — high-risk actions always require human approval first. This is a necessary safety net, but the problems are:

▫ It can generate too many interruptions, overwhelming human support capacity;

▫ Or, because the policy is hard-coded while real situations vary endlessly, many cases that should be escalated aren't.

- Stage 3: Agents can ask for help. The agent can treat a human as a kind of tool, the same way it would use search or a database, proactively pulling a person in whenever it senses it lacks enough information. This is a hybrid tier:

▫ Layer 1: a fixed safety-policy floor, always on;

▫ Layer 2: a dynamic ceiling driven by the agent's own judgment, covering whatever the policy misses.

- Stage 4: whether the agent "asks for a human" no longer relies on intuition, but on measurable, learnable judgment.

Stage 4's architecture works like this:\
At every point requiring a decision, the agent computes three scores:

1. Uncertainty score: how uncertain the agent is about its own ability to handle the current situation.
2. Novelty score: how different this situation is from situations it has seen before.
3. Intervention benefit score: in similar past situations, how much human intervention actually helped, and how large the effect was.

These three scores are then combined into a weighted final score; if it exceeds a certain threshold, the case is escalated to a human — otherwise the agent decides for itself.

In implementation, he offers very concrete methods:

- Uncertainty: query the model multiple times at the decision point, gather confidence scores plus reasoning, and estimate uncertainty from the spread of the confidence values and "hesitation / hedging language" in the tone.
- Novelty: if embeddings/RAG are already in place, measure the embedding distance between the current situation and historical situations — the farther the distance, the more novel it is.
- Intervention benefit: store cases that were once escalated to a human, along with their outcomes, as a table; when a similar situation comes up later, look up these records to see whether human intervention actually improved the outcome at the time.

The weights can start at 1/3, 1/3, 1/3, and then be continuously tuned afterward with simple linear regression and new data. The threshold, too, can start conservative (on the low side, preferring to call in a human more often) and gradually rise over time.

The benefit of this approach: every escalation becomes training data for the next judgment, so the entire escalation strategy self-calibrates over time.\
His conclusion: autonomy isn't granted by default — it's something the agent "earns" through consistently solid performance.

III. Durable Statefulness: letting work continue "across contexts and across sessions"

The third pillar addresses durable statefulness. This isn't about judgment (as with autonomy), nor is it about execution's crash/retry behavior — it's a question of "continuity": can the agent reliably know where it stands within a long-running task.

He starts by rigorously distinguishing three concepts that are often conflated: state, memory, and context.

- State: an external record that exists for the sake of "task continuity," describing "current progress" — what's been done, what hasn't, and what output artifacts exist. It lives outside the model and is persisted.
- Memory: knowledge accumulated for the sake of "better reasoning" — user preferences, past cases, and so on. It, too, lives outside the model, is persisted, and is queried on demand.
- Context: the small slice of information the model sees during "one particular inference" — a slice cut from state and memory and placed into the attention window. It carries no guarantee of persistence on its own.

He illustrates this with a nursing-station example:\
At shift change, you don't transfer all of a veteran nurse's knowledge and experience to the incoming nurse — what actually gets handed off is the patient's chart. That chart is the state; the senior nurse's clinical skill is the memory. The next-shift nurse only has to read the chart to pick up seamlessly, without starting over from scratch.

Back to agents: when people feel context isn't enough, they tend to just keep enlarging the context window haphazardly. But the real solution is to properly design state and memory, so that each inference only needs one small, fresh slice of context to carry the task forward.

Without durable statefulness, two architectural pathologies show up:

1. Context rot: in a long-running task, the context keeps getting stuffed full; as new things come in, early critical information gets crowded out, and the agent gradually "forgets" what it already did, with quality silently sliding downhill.
2. Context limits / resets: the agent suddenly hits a context limit, or restarts for some other reason, and with no external, authoritative record, it wakes up with no idea of task progress at all, forced to guess from a partial context.

In practice, these two situations turn into:

- "Declaring victory too early": seeing a pile of partial output and mistakenly assuming the task is complete, when parts of it are actually unfinished.
- "One-shotting": once context has been wiped, the agent tries to do a great many things in one shot, with no external progress record at all, resulting in a pile of "unfinished / undocumented" half-done work.

He points out that behind all these problems there is really just one root cause: the lack of an external, authoritative record of task state. The good news: a single fix addresses it too.

The solution has two foundational moves, illustrated using Anthropic's "git-commit pattern":

1. Before work begins, clearly define "progress markers" and "what counts as done." Cut the large task into small pieces, each with verifiable completion criteria, and write these down as an external artifact.
2. Externalize state into structured artifacts that persist across sessions, across contexts, and survive crashes.

Using Anthropic's coding agent as an example, he splits this into two phases:

Phase 1: Initializer agent

This agent doesn't write a single line of feature code — it only does four things, all of which are about building "state":

- Create a feature-list JSON: listing the features to be built, all initially marked "not done." This list is the sole authority on progress.
- Create a progress-log file: empty at first, with every later session recording what it did here.
- Create the first git commit: capturing the project's current file state, so later sessions can consult the git log to understand history.
- Create an init file: a script that can spin up the environment and run basic tests, ensuring the next session doesn't waste time repeating setup.

The key point: the Initializer's value lies in "creating a sustainable working environment for every session that follows," not in completing any feature itself.

Phase 2: a four-step loop for every subsequent session

Every coding session after that follows a fixed, four-step operational heartbeat:

1. Wake: read the progress log and git log, run init, and confirm the environment is healthy — don't assume everything is fine, check first.
2. Orient: look at the feature list and pick out the single highest-priority feature that's still unfinished — focus on just that one thing, don't be greedy. This list, rather than the model's own judgment in the current context, is the authority on "what should be done."
3. Act / Work: actually implement that feature — write the code, test it.
4. Write-back / Clean: update the feature list's status, write the progress log, make a git commit, and tidy up the environment, making sure the next session doesn't inherit a "half-broken world."

Without this write-back and cleanup, the next session would "inherit a stale or inconsistent state," and the whole chain would break down before long.

He adds one caveat: if your task can actually be finished within a single context window, there's no need to bring out this entire state machine and external-artifact apparatus. All of this design is really meant for "long-running tasks spanning many rounds, many agents, or many processes."

Final summary

Many teams talking about agents focus on stronger capability: deeper reasoning, bigger context, flashier tool integrations. But the speaker believes that whether an agent system is "still standing" six months later, or has long since broken down with nobody daring to touch it, comes down not to capability, but to durability design.

The real difference shows up like this: on some ordinary Tuesday morning, when nobody is watching closely, can that agent system still keep running steadily? That's exactly what the three pillars he describes — durable execution, durable autonomy, durable statefulness — are meant to address.
