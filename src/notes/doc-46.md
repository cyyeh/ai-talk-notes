---
title: How Action Bias Breaks Autonomous Software Maintenance
speaker: LogicStar.ai
video: https://youtu.be/Eqqd7kGD1BM?si=hy4CupsQoMAJuA9f
---
This video discusses a critical problem: automated "maintenance" AI agents tend to over-act, modifying code that was already correct, instead of knowing — like a seasoned engineer — when to do nothing.

What scenario is this about?

The speaker first explains that most "coding agents" today are just assistants: a human specifies the task (implementing a feature, fixing a bug, investigating an issue), and only then does the agent act, with the human serving as the "gatekeeper" for the task. But the future trend is that agents will take on system operations and maintenance autonomously, over the long term.

In real-world operations, a large number of bug tickets are:

- Duplicate reports
- Filed against a very old version that was actually already fixed long ago (stale)

Research shows that roughly 50% of bug reports are duplicates. A good maintenance engineer glances at one, sees it's already resolved, and does "nothing at all" before moving on; but today's coding agents can't do this.

FixedBench: testing scenarios where "the agent should not act"

They propose a new benchmark, FixedBench, whose approach is:

1. Take real-repo issues, their corresponding fix commits, and tests from an existing benchmark (like CBench Verified).
2. But this time, instead of giving the agent the "not-yet-fixed" version, they:

▫ First apply the fix commit to the codebase

▫ Then give the agent this "already-fixed" codebase along with the old issue, and ask it to handle the ticket\
In theory, the agent shouldn't touch the business logic code at this point — at most it should add tests or update documentation.

They defined two metrics:

- Resolution rate: under this setup, "making no changes at all" is actually 100% success.
- Abstention rate: how often the agent modifies actual business logic code (excluding pure tests/documentation) when it shouldn't be making changes at all.

Result: frontier models (within their respective official agent frameworks) still have roughly a 35–65% chance of modifying code that was already correct. In other words, for every 3 stale issues encountered, about 1–2 end up being needlessly altered — accumulating technical debt, causing code drift, and even swallowing up errors that were originally meaningful.

This tendency to insist on doing something when it should stop is called action bias.

Would thinking more make it smarter? No.

They first suspected this was a matter of "insufficient reasoning," so they adjusted the "reasoning budget" of a frontier model (such as GPT‑5.1 mini) from low to very high, hoping that more thinking would raise the abstention rate (i.e., make the agent better at knowing when not to act).

The results showed that going from low to high reasoning effort barely improved the abstention rate — the differences were within the margin of error. The conclusion:\
This isn't a matter of "insufficient capability" or "not thinking enough," but a problem with the strategy/training objective itself.

What behavior makes an agent more willing to "not make needless changes"?

They analyzed the agents' traces, splitting behavior into two groups — those that abstain (make no changes) and those that don't — and compared the differences:

- Agents that abstain:

▫ More often check the Git history (in the experimental setup, the bug-fix commit happens to be the most recent one)

▫ More often reproduce the problem first (by running tests or actually operating the system) before touching the code

- Agents that don't abstain:

▫ Quickly jump straight into opening files and making changes, without even reproducing the problem first

▫ Even in the 25% of cases where they "already know the bug has actually been fixed," they still carry out some kind of unnecessary edit, because they "feel they must do something."

They tried adding a line to the prompt: "reproduce the problem before acting." The agent did indeed reproduce the problem more often as a result (rising from about 40% to 70%), but:

- the abstention rate barely changed at all In other words: knowing that the problem has already been solved doesn't make the agent any more willing to hold back.

Next, they added another layer to the prompt: explicitly telling the agent "you may choose not to modify any code at all — that also counts as success." This time the effect was dramatic:

- The rate at which the agent reproduces the problem is even higher
- The abstention rate rose significantly, meaning that in situations where it should hold back, the agent genuinely chose "not to change anything" more often

They also designed a "worst-case scenario" to confirm the agent wasn't just gaming the setup (e.g., by simply looking at the last commit):

- Remove the git history
- Leave the environment unconfigured, so the agent has to install dependencies itself, making it harder to reproduce the problem
- Essentially prevent it from making a quick judgment just by "looking at the last commit"

In this adversarial scenario, the abstention rate drops overall, but:

- the traditional "fix this issue for me" prompt degrades much more severely
- the prompt framed with "you may choose not to change anything," even under this worst-case scenario, still outperforms the traditional prompt's performance under its best-case scenario

This shows that simply changing the prompt (by adding "not changing anything" as a valid success state) can substantially reduce unnecessary modifications across many scenarios.

But could this make the agent "too lazy," failing to fix things it should?

Yes, that's the trade-off.\
So they ran a reverse experiment:

1. Use a weaker model to generate an "incorrect patch" and apply it to the code, creating a state that's "partially fixed but still buggy."
2. Test whether, with the new "it's OK not to change anything" prompt applied, the agent is still willing to make fixes in scenarios that genuinely still contain bugs.

Result:

- The new framing caused the agent's actual fix rate in these "still needs fixing" cases to drop by about 75%.

In other words, as the agent gets better at "avoiding needless changes to already-fixed code," it simultaneously sacrifices its sensitivity to "being willing to act when it should keep fixing." You're essentially choosing sides between two kinds of errors:

- Traditional prompt: too eager to act → makes needless changes to things that are already fine
- New prompt: fewer needless changes → but also more prone to "not fixing bugs that should be fixed"

The root problem: how training and rewards are designed

The speaker concludes by speculating that this is actually caused by how LLMs/agents are currently trained:

- Most RL tasks (nearly all of them, in fact) only count as successful when "some action was taken and produced a change."
- The proportion of tasks where "doing nothing" is treated as a success scenario is extremely low.
- So when a model receives a task, it almost defaults to: "I must do something for the task to count as successfully completed."

This is what he calls a framing problem, not a capability problem.\
Simply making models stronger and better at reasoning, without adjusting the reward/training objective, won't make action bias go away.

A few practical conclusions

The video closes with three main conclusions:

1. Action bias can't be solved just by "thinking a few more steps." Increasing reasoning depth (chain-of-thought, more tool calls) doesn't naturally reduce needless changes.
2. You must explicitly design tasks and prompts so that "taking no action" is included in the space of successful outcomes — letting the model know that "not changing any code" is fine and counts as success, rather than defaulting to the assumption that every task equals "a change must be produced."
3. To truly achieve "automated software maintenance," you likely need systems and agents purpose-built for maintenance scenarios (including data pipelines, environments, and evaluation methods), rather than simply wiring a general-purpose coding agent to a few event triggers and shipping it into production.

Overall, this video is a reminder: if you deploy a coding agent into production operations as an "automated maintenance engineer" without addressing action bias, it will keep tinkering with things that are already fine, quietly accumulating invisible technical debt over time — rather than helping you keep the system clean and stable.
