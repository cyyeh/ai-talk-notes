---
title: Should agents be durable?
speaker: Joey Baker, Render
video: https://youtu.be/v8G8vWbD_bs?si=R028E4zHGNVUuRVp
---
In this video, Joey Baker explains in an AI Council workshop that getting AI agents truly into production hinges on durability and elastic infrastructure — not just an architecture that looks good running demos.

Main takeaways from the video

Joey opens by contrasting a "flashy agent demo" with "a system that never makes it to production and keeps running into disaster in staging." He points out that LLMs are now quite good at generating code, but the problems that actually keep recurring come from the design of the underlying infrastructure — and the very nature of agents makes traditional infra fragile:

- An agent's run time, the compute it needs, which model and temperature it uses, and its behavior when calling external APIs/DBs are all highly unpredictable.
- Model providers' own uptime is also unstable; in a 20-step workflow, if each step has even a small chance of failing, the whole run ends up with close to a "one-in-five" chance of dying somewhere along the way.
- If every failure means you can only "start over from scratch," that's extremely costly in both time and money.

Most modern infrastructure was designed for a world where "the same input produces the same output" (traditional request/response and transactional systems). In the non-deterministic world of agents, that "contract" is broken, so infra naturally can't keep up.

Why the traditional approach doesn't work: fixed capacity and over-provisioning

The usual response is to "provision more machines":\
you keep a bigger worker pool and reserve idle compute so things don't blow up during load spikes. But that produces a shocking bill, and finance starts asking you to cut costs; once you scale back, you end up under-provisioned instead, with the result that:

- A task runs for 30-40 minutes and then suddenly OOMs because of a memory issue or some other resource problem.
- Users just see an error, and the experience falls apart.

Joey's conclusion: a "fixed" infrastructure model doesn't suit this new kind of long-running, non-transactional workload, because "how much capacity you need" is itself a constantly moving target.

His proposed "correct abstraction": durable, elastically scalable, observable

Joey believes infrastructure for agents must be:

1. Elastic compute: pay only for the capacity you actually use, and scale up/down instantly and transparently. No need to pre-warm or pre-configure a worker count; whether it's 1 task or 10,000 tasks, the system should hold up automatically.
2. Task-level durability: durability needs to reach down to the level of every individual task.

▫ If an agent running for 45 minutes crashes at the 30-minute mark, the whole run shouldn't be scrapped.

▫ The system should be able to "remember which step you'd reached" and recover near the point of failure, instead of starting over from scratch.

3. Full observability (full visibility):

▫ You need to be able to see what happened at each step, how long it took, and where it went wrong.

▫ This matters for human engineers debugging today, and it will be just as critical for future "agent debugging agent" scenarios.

Render Workflows: turning these abstractions into a product

He then introduces what Render is building: Render Workflows, a "durability layer" purpose-built for long-running tasks and agent workloads.

The design philosophy is: you just write your function logic as you normally would, then use a small amount of annotation/decorator to make it part of a workflow — the rest, including queues, worker pools, retry strategy, and scaling, is handled by Render.

Roughly how it's used in Python/TypeScript:

- Install the SDK and initialize the client.
- Mark a given function as a durable task with a decorator.
- The mental model is that "the code itself is the infra definition" — no extra YAML, manifest, DAG file, or sidecar configuration needed.

This approach of "embedding infra directly in the code" is especially advantageous for writing code with an LLM, since LLMs often work with a "single file" as their context; when you co-locate behavior and infrastructure configuration in the same file, the LLM is less likely to go wrong because of hidden external configuration.

Solving the pain points mentioned earlier: concrete capabilities

He lists the capabilities Workflows offers now or will soon offer, mapped to the infra problems raised at the start:

- Sub-second startup times: you don't need to over-provision machines just to avoid cold starts.
- Declarative retries:

▫ You can define max retries, wait times, backoff strategy, timeouts, and so on right in the code.

▫ If a task fails at step 8, it can retry from just that step instead of rerunning the whole workflow from scratch.

- Large-scale parallelism: supports tens of thousands of concurrent tasks at once — "1 task and 10,000 tasks" are the same thing in the mental model.
- Complete execution history: you can see the detailed steps and status of every run, instead of blindly guessing where it failed.
- State checkpointing (coming soon): you'll be able to manually checkpoint at any state, and later, on failure, resume near that checkpoint instead of starting from scratch.

He also emphasizes that for developers, Workflows "requires no new framework to learn," because:

- Parallelism and concurrency are expressed with native language primitives (like Python's asyncio), with no extra "mystery runtime";
- There's no need to define a DAG/manifest — everything is written in code you already know.

Example application: an agent that tracks new restaurant openings in San Francisco

Joey uses a real agent demo to illustrate this:

- Goal: generate a website listing newly opened restaurants in San Francisco.
- The underlying pipeline includes:

▫ Crawling new restaurant data from multiple sources;

▫ Feeding the scraped results (could be 0, could be 100) to an LLM for structured extraction and cleanup;

▫ Using an LLM to deduplicate and normalize fields;

▫ Crawling again to fetch each restaurant's menu, then using an LLM to analyze whether it's vegetarian-friendly, has gluten-free options, and so on.

This pipeline has many steps, many external dependencies, and potential for large-scale parallelization.\
The traditional approach would require:

- a job scheduler + worker pool;
- retry logic scattered across different programs and config files;
- a lot of cross-file, cross-service dependencies.

Under the Render Workflows model, what he demonstrates is: just attach a workflow decorator to each function, and the whole pipeline — including parallelism and error recovery — gets automatically orchestrated by the platform.

Deep dive: Q&A on durability, state storage, and observability

Before the hands-on demo, there were a few technical questions from the audience, which he also addressed:

1. Where is state stored? How far back can it be tracked?

▫ Render automatically stores the input/output of every task, and shows every step of the whole workflow in the dashboard via an "execution viewer."

▫ For paying users, these records are kept for 30 days by default.

▫ If a lot of data needs to be passed between steps, he recommends putting large objects in object storage and only referencing them by URL within the workflow — this avoids performance problems and makes later debugging easier.

2. What about deeper observability?

▫ Render itself already has observability for compute usage and application logs across all services, not just workflows.

▫ Within Workflows, they've additionally built an execution viewer that shows:

⁃ The start/end, duration, and failure point of each step.

▫ In the future they'll further add logging/tracing integration — for example, when a task calls an LLM, you'll be able to see how long it took, how many tokens it used, and so on.

3. How is scaling and worker management handled?

▫ For the user it's "automatic"; you're only responsible for writing a loop that produces N tasks, and N can be 1 or 1,000.

▫ The underlying infra scales horizontally automatically — no need to configure a worker count in advance.

▫ He compares this to serverless functions: while they can auto-scale, they typically come with an execution time cap.

▫ Render's tasks can run anywhere from as short as 1 second up to 24 hours (currently an artificial limit — contact them if you need longer).

4. Is the infra "self-managed" or fully managed by Render?

▫ It's entirely a Render-managed service — users don't need to bring their own infra.

▫ The benefit is that Render can offer stronger SLO/performance guarantees.

5. Can you choose the LLM?

▫ Render places no restriction whatsoever on which LLM or third-party API you use:

▫ You just write whatever HTTP call or SDK call you want inside the workflow's task function; the platform is only responsible for executing it.

Implementation section (workshop portion)

The rest of the session is a live workshop and hands-on walkthrough, including:

- Having everyone sign up for a Render account and join a workspace via a designated link (there's free credit involved, so no one actually gets charged).
- Providing a GitHub repo template to fork/create a new repo directly.
- Explaining Render's "Blueprint": a YAML-based infra definition format used for non-workflow services, letting you finely control which services get created on Render and how they're deployed.
- A demo of:

▫ Changing the project name in the blueprint file;

▫ Committing and pushing to trigger the blueprint to create the corresponding services on Render;

▫ Creating a new blueprint instance from the dashboard.

The focus of this part is to let the audience actually run an app that's already written, experiencing Workflows' orchestrator, execution viewer, and other features, rather than building everything from scratch by hand.

In summary, the core argument of this video is:\
in the world of agents, the deterministic assumption behind input and output disappears — both the models and the infra itself carry a high degree of randomness. So you need a layer of durable infrastructure purpose-built for handling "long-running, unpredictable, multi-step" work. Render Workflows tries to turn this abstraction into an SDK, so that just by adding annotations in your code, you get automatic scaling, task-level durability, and a fully observable execution history, without having to hand-maintain queues, workers, retries, and a mountain of YAML.
