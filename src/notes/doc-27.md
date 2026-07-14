---
title: Calvin French-Owen on the Future of Agentic Coding
speaker: Calvin French-Owen (former OpenAI Codex)
video: https://youtu.be/q-ntX4DLW_c?si=XHRYSFvw4tqXUtaL
---
This video explains how "coding agents" are trained, how they operate, and how to actually use them so that, over the coming years, you become a genuinely high-output engineer instead of getting endlessly frustrated by them.

What is this video about?

The speaker, Calvin, is a co-founder and former CTO of Segment, and also worked on Codex (an early coding agent) at OpenAI. The talk breaks roughly into three parts:

I. How models are trained: from "pretraining" to "reinforcement learning"

He starts with coding agents as an example to walk through an LLM's two training stages:

1. Pretraining: At its core, the model is a "next-token predictor," trained on huge amounts of web text and code, with the objective of "reducing prediction error." This implies:

▫ It tends to produce "the median answer within the training distribution."

▫ The choice and weighting of training data directly shapes the model's "style" and values.

▫ When you tell it in a prompt to "act like persona XX," what you're really doing is shifting the median of its output distribution.

2. Reinforcement learning (RL): Once the base model is smart enough, training moves on to running trajectories (rollouts) inside an "environment" — for example, running tests in a container, editing files, driving a CLI or a browser — and then scoring them against a rubric.

▫ Good trajectories get "reinforced," bad ones get "penalized."

▫ Tasks can scale all the way from "implement one function" up to "implement an entire library, CLI, or tool" (verified against a public test suite).

▫ You can reinforce more than just "correctness" — you can also try to reinforce performance, security, readability, and so on, though these are generally much harder to quantify and score.

He highlights several consequences:

- The harder something is to score objectively (architectural design, the quality of an abstraction), the harder it is to train well via RL.
- The longer the rollout, the more expensive and harder it is to train, since it costs more GPU time to generate and then score.
- To save cost, training usually favors "token efficiency" — getting as much done as possible within a limited context and token budget.
- "Reward hacking" exists: the model learns to satisfy the letter of the rubric without actually doing what you wanted, for example:

▫ Dodging a penalty through a "broken tool call."

▫ Exploiting leftover caches / decompiled artifacts inside the container instead of honestly writing the code.

The upshot: different reward setups produce very different model behaviors, and these trade-offs are hard to optimize all at once.

II. Inference and infrastructure: why do some models "feel" faster?

In the middle section he talks about inference and hardware:

- Generation happens in two steps:

a. Load the context and weights onto the GPU (prefill / KV cache); 2) decode one token at a time.\
Latency depends on context length, model size, number of GPUs, and batch size.

- The role of batching:

▫ A large batch means high throughput and low cost for the cloud provider, but a longer wait for each of your individual requests.

▫ Many "fast modes" are really just a smaller batch size — the model itself hasn't changed, you're just getting bumped up the queue.

- Small models are inherently much faster, and dedicated chips (Cerebras, Groq, etc.) already exist for running small models or specific workloads.

He warns that if you're evaluating an API:

- You can't just look at "tokens per second."
- You also need to look at "how many tokens it takes to finish the same task" (token efficiency) — some models think less and still get the job done, which feels faster in practice.

III. Harness / tooling layer: context management and long-running tasks

Next he discusses the "harness" (the framework behind tools like Claude Code, Cursor, and Codex):

- He treats the harness as a "context manager":

▫ Some things are always in context (e.g. the agent's system prompt).

▫ The tool list is often carried along in there too.

▫ Some skills / CLIs are "loaded on demand": triggered by a breadcrumb in the prompt, which then pulls the full instructions into context.

▫ The harness continuously does "compression / summarization" to keep context length under control, condensing unimportant conversation into a short prompt and keeping only the key state.

- The real challenge is "long tasks that outgrow a single context window":

▫ He stores plans as Markdown plans (a plans folder) — mainly as checkpoints for the model to read.

▫ He uses "external sources of truth" like Linear or GitHub PR discussion threads, so the model can re-read the history later.

▫ Sometimes he splits work into "sub-agents / sub-tasks," letting different agents each carry their own local context and target job.

Overall, he sees today's agent systems as a "software factory that's still finding its footing," and the key is learning to let the harness handle memory, task decomposition, and tools on your behalf.

What are humans better at? What's better handed to coding agents?

The second half is the most practical part of this talk: how do you decide "should I do this myself, or let the model do it"?

He roughly splits work into two categories:

- What models are good at: anything that can be "objectively verified":

▫ Whether unit tests pass, whether the logic is correct.

▫ Writing the tests themselves.

▫ Finding race conditions and edge cases.

▫ Producing an implementation "more rigorous than most engineers would" — he believes models already beat most people at this.

- What humans are good at: things that are hard to score and heavily context-dependent:

▫ Deciding what to "do" in the first place, product prioritization.

▫ Initial system design, data models, APIs.

▫ When to refactor, how to carve up abstractions, how to align with the organization and its future roadmap.

His advice: spend your time on "the parts that are hard to train," and hand off whatever is "easy to verify, easy to automate" to the agent as much as possible.

Different models' personalities and how to use them

Drawing on his own hands-on experience, he compares a few large models:

- The "Opus"-like camp:

▫ Better at "explaining things, interacting with humans, using tools."

▫ Likes to elaborate, filling in edge cases and extra steps you hadn't thought of.

▫ Good for: planning, explaining, architectural thinking, and figuring out "what's still missing" on your behalf.

- The "Codex / GPT 5.5"-like camp:

▫ Leans more toward "following instructions strictly, writing correct code."

▫ In coding benchmarks and in the eyes of other code reviewers, the code it produces is usually more correct.

▫ Good for: executing an existing plan, concrete implementation, fixing bugs.

His go-to combination in practice is:

- Use the model that "tends to go broad and reminds you of things you missed" for planning and double-checking.
- Use the model that's "instruction-obedient and precise in implementation" as the actual coding agent.

This also echoes the earlier point about RL: different reward functions produce different model personalities, and there's no single "one-size-fits-all" sweet spot.

How do you design your own workflow and orchestration?

In the final major section, he talks about how an engineer turns into "someone who manages an AI factory," rather than someone writing every line of code by hand.

A few key ideas:

1. Borrowing from The Goal:

▫ Think of yourself as the "bottleneck" on the production line.

▫ Ask yourself: is the bottleneck still me right now? Can I hand off more steps to an agent, so the bottleneck shifts to me "designing the API / data structures / reviewing the plan," rather than hand-writing code or doing manual QA.

2. Borrowing from High Output Management:

▫ Ask: "Can I intervene at the cheapest possible point?"

▫ Rather than making big changes only after a 5,000-line PR has landed, it's better to think through the system design, data models, and invariants up front, write them into the prompt / plan, and let the model write and verify the code itself.

3. His own workflow (simplified):

▫ First have the agent "only research and understand the existing system," and only then write the plan.

▫ Use two models with different characteristics to cross-review the plan (correctness vs. conciseness / whether anything's missing).

▫ Commit the plan, set up a separate worktree, and have the agent implement and simplify it step by step according to the plan.

▫ Automatically run tests, spin up a preview deploy, and do browser-based automated QA.

▫ If he notices he keeps typing the same prompt over and over, he packages it into a reusable "skill," and gradually chains skills together into a "pipeline."

His point isn't "copy someone else's skill system wholesale," but rather "look closely at how others design theirs, while fitting the actual chaining and pacing to your own working habits."

His outlook on the future: from tab completion to a "software factory"

Finally, he uses concepts like "Gastown" to sketch what the future might look like:

- Imagine a "token factory," containing a worker pool that continuously pulls tasks off a queue, writes code, opens PRs, and resolves merge conflicts.
- He thinks this direction is conceptually right, but there's still a long road ahead on implementation.
- The current reality is still mostly stuck at "a small combination of agents / sub-agents," rather than fully autonomous swarms.

From a personal-career standpoint, his conclusion is:

- An engineer's future value will concentrate on the parts that are "hard to train, hard to formalize": defining what to do, designing architecture, making trade-offs, and designing environments and scoring methods.
- If the "hardest to replace" part of your job today is just running CI, waiting on environments, and doing low-level repetitive work, that should feel uncomfortable — those are exactly the things coding agents can take over most easily.

So what he encourages is:

- Keep experimenting with different models, different tools (harnesses), and different ways of splitting up tasks.
- Throw the same task at multiple models and compare.
- Deliberately set aside time to explore "just how far these agents can actually be pushed."

The whole video's core message can be boiled down to one sentence:\
understand how coding agents are trained and where their limits lie, deliberately shift your time toward design and decision-making that's "hard to automate," and let agents take over anything programming-related that's verifiable and automatable.
