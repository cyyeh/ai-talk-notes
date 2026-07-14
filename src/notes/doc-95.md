---
title: When Your AI Agent Runs for 16 Days Straight
speaker: Factory
video: https://youtu.be/UKDE2_IBk7A?si=WE9Welq-Zpki0a_O
---
This video introduces how Factory built a long-running AI software development agent system that can run continuously anywhere from tens of hours to 16 days, and how such a system changes "the way software gets built."

Main thread: from "assigning tasks" to a "software factory"

The speaker starts by revisiting a few eras of AI-assisted development:\
at first, people assumed that simply extending "autocomplete" further and further would eventually cover the entire software development lifecycle. The current mainstream, instead, is "delegation-style" tooling: a human types out a requirement, hands the work off to the model, and after working for a while it gives you a result.

Factory wants to push into the next stage: a long-running "software factory" / autonomous system. In this world, humans no longer keep throwing small tasks at it — instead, they define "governance and constraints" and let the system keep developing and maintaining software on its own, 24/7; the human's role becomes more like an engineering lead or CTO.

Models and architecture: multiple models, long-running tasks, long context

They stress that we're no longer in an era where "one model is best" — different models show "peak capability" on different tasks:\
some are better suited to writing code, some to doing code review, some to security analysis.\
To deploy this at a large organization (say, tens of thousands of engineers), you have to jointly optimize for "cost × quality," using a multi-model/model-routing approach that picks different models for different subtasks — that's the only way to do things like company-wide AI code review within budget.

To support multi-day tasks, they treat the agent as "a system that repeatedly thinks, calls tools, and reads/writes files inside a while loop." This kind of agent runs into several problems:\
context keeps accumulating and bloating, errors compound along long chains and drag down the success rate, and parallelizing multiple agents introduces coordination and conflict overhead.

The core problem of long-running agents: context and self-interference

They found that historical context is very hard to manage in long-horizon tasks:\
to save on cost and latency, they use an "append-only" trajectory to take advantage of prompt caching, avoiding frequent history rewrites — but this leaves a large amount of "already-wrong or no-longer-relevant reasoning" sitting in the conversation.

For example, an agent first tries approach A, finds it doesn't work, and switches to approach B — but the context still holds a large amount of reasoning about A, and the model's attention computation still gets interfered with by this stale context, creating an "adversarial/misleading context." This also pushed them to rethink:\
what actually defines the boundary of an agent — the entire trajectory, or a sub-context for a particular phase?\
The more practical question is: when should you proactively reset, compress, or restructure context to avoid this kind of interference?

Missions: an architecture that gives agents a "long-term goal"

To address these problems, Factory designed a system called Missions, which lets an agent take action toward a "long-term, structured goal" and keep going for hours, days, or even weeks.

The overall process closely resembles a human engineering team working on a big project:

1. First, humans and the system jointly "define the goal" and discuss requirements — like a design meeting, discussing multiple approaches — with the agent proactively asking questions to pin down requirements as concretely as possible.
2. An Orchestrator (the coordinator/main agent) turns these requirements into a concrete set of Validation Contracts and Features. These strictly define "what outcome must be achieved and how it will be verified," rather than directly writing code.
3. The Orchestrator then breaks the overall goal down into Milestones and Features, turning it into dispatchable units of work.
4. This work gets handed to agents playing different roles:

▫ Workers: dedicated to "implementing" features — writing code, modifying the system.

▫ Validators: dedicated to "checking" and "experiencing" the results, like QA: opening the freshly built app, actually clicking through sign-up, login, sending a message, etc., confirming that the entire user journey satisfies the validation contract.

5. The Orchestrator uses feedback from the Validators (including bugs or experience issues) to generate new subtasks or revised requirements, forming a long-running self-correction loop.

This whole setup is actually described through "skill documents/prompts," minimizing hardcoded logic, so it's easy to evolve alongside each new generation of models.

Workers vs. validators: why separate the roles, and even separate the models

They care a lot about "role separation" and "incentive alignment":\
a Worker's job is to "get the requirement done" — it needs to be proactive, high-energy, unafraid to try things;\
a Validator's job is to "find fault" — it needs to be strict, conservative, and focused on consistency and safety.

In their experiments, they found clearly different performance across models for these two roles:\
for example, one particular model is excellent as a Worker but performs poorly as a Validator; other models excel at validation, writing tests, and code review.\
This once again illustrates why a multi-model architecture is so critical in long-running agent systems.

They also distinguish two types of quality checks:\
one is "Work Scrutiny," which looks at architectural consistency and whether the code follows the system design and best practices;\
the other is "User Testing," which verifies whether a feature actually works by following real user behavior paths.\
The system decides which type of validation to use — or both — depending on the task type.

Self-correction and the "self-evaluation" puzzle

Within Missions, a long-running system also has to be capable of self-correction:\
when a given Worker's change passes validation at the time, but causes other problems later in the process, the Orchestrator has to notice, trace back, and add new Features to fix it, preserving the integrity of the overall user journey.

They also discuss the subtlety of self-evaluation:\
having the same agent (or an agent that heavily shares context) check its own work turns up different kinds of problems than having a brand-new validator with almost no context check it.\
Too much context creates "blind spots," too little means a lack of understanding of the design goal — finding the right balance is still an open research and engineering problem.

Interface and human-AI collaboration: the control plane

To let humans stay on top of these multi-day tasks, they designed a "control plane":\
the interface shows which Missions currently exist, each Mission's feature progress, which Worker is currently active, which models are being used, how much time and cost has been spent, and what logs exist.\
This can be used in a terminal interface, a desktop app, or even a headless mode — the key is letting a human retain observability and the ability to intervene on top of an extremely complex automated task.

A real case study: a large SaaS product like Slack, and a 16-day task

Internally, they have a benchmark called SaaSbench:\
it decomposes a large SaaS product like Slack into hundreds or even thousands of features, describing each user journey in a validation-contract-like format (e.g. messaging a colleague, messaging a group, multi-tenancy, Slack Connect, enterprise features, etc.), and then has Missions try to implement a Slack clone from scratch.

The results:\
a single Mission task like this can run continuously anywhere from 20 to 37 hours;\
their longest run so far lasted about 16 days and produced about 38,000 lines of code.

This isn't a full recreation of Slack, but it already reaches a streamlined version that satisfies many internal needs.\
This experiment gave them a fairly pragmatic view on "can AI replace existing SaaS":\
technically, you can build a Slack replacement that meets most of your own company's needs, but truly building and maintaining a mission-critical system like this entirely in-house comes at a very high cost; in most cases, relying on mature SaaS from a dedicated team still makes more sense.\
That said, this also means a lot of "very niche internal tools that nobody used to be willing to invest effort in" can now be built quickly with Missions, raising the overall quality of internal company software.

The impact on engineers' role: from writing code to defining "validation contracts"

Because Missions hands off most of the implementation work to agents, human work starts shifting up to the layer of "defining user journeys and constraints."

The speaker observes that, within Factory's own team, many engineers are increasingly starting to resemble product managers/product owners:\
spending a lot of time thinking about "what users should be able to do" and "what the experience bar is across different platforms and scenarios," and writing all of this clearly in the form of validation contracts.

Some engineers have also become dedicated to writing guardrails and environment rules:\
for example, writing static analysis, lint rules, and parsers to make sure agent output never crosses the company's defined red lines.\
He thinks this is quite different from the popular outside narrative that "programming will disappear and you won't need a technical background":\
at this high level of abstraction, understanding system design and code still matters enormously — if anything, people who understand both product and technology become especially valuable.

A broader range of applications: not just building apps

Finally, he gives a few examples beyond ordinary software development to show that Missions is really a "general-purpose long-term-goal execution framework":

- Machine learning research and model training: for example, starting from a handful of public papers (with no original code) and rebuilding a protein-folding model from scratch, reproducing near-SOTA results using only open data — something close to the idea of "auto-research."
- Performance tuning and optimization: for a goal like "make my application five times faster," the system breaks it down into subtasks — profiling, experimenting with different optimization strategies, re-testing — and iterates.
- System modernization and migration: moving from Java 7 to Java 21, upgrading databases, or even migrating legacy languages like COBOL/Fortran to modern languages.
- Creative tasks in entirely different domains: things like "write a graphic novel," generate slide decks, or compose video — as long as there's a programmatic interface (an image model, Markdown, rendering tools), Missions can still decompose the goal, plan the steps, and execute over the long run the same way.

Their conclusion is: the best general-purpose agent is really just a very powerful coding agent.\
Because as long as it can write code, call APIs, and operate tools, almost any kind of knowledge work can be wrapped into this "long-term goal → decompose → implement → validate → correct" framework.
