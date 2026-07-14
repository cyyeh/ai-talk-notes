---
title: After the Lakehouse: Building Data Infra for the AI Era
speaker: Panel: Snowflake, Databricks, ClickHouse
video: https://youtu.be/S_RIbZU5seE?si=pAP76z4xF61yggzy
---
This is a panel discussion at AI Council SF 2026, on the theme of "after the lakehouse, how should data infrastructure evolve for the AI era."

The core question: does the AI era still need a "central data platform"?

The panelists (from Snowflake, Databricks, and ClickHouse) were all asked about a new, extreme framing:\
If agents can look up data everywhere for you in the future, stitching together and cross-checking the truth in real time, do you still need to centralize data into a data warehouse / lakehouse at all?

Their consensus is:\
The central data platform isn't going away — if anything, AI makes it more important, though its form will change.

The reasons include:

- The governance, security, compliance, disaster recovery, and "trust" that enterprises need are hard to satisfy with just an MCP server that merely serves up data.
- A fully decentralized architecture that queries data remotely everywhere is hard to run reliably, in terms of both performance and consistency, at large-enterprise scale.
- In practice, what they're seeing is that as AI agents get rolled out, customer usage of the platform goes up, not down.

Agents and MCP: the actual impact on data platforms

Nikita (Databricks) and Yury (ClickHouse) describe the AI architecture that's common today:

- Most startups have a data warehouse (often ClickHouse), with an MCP server layered on top, and questions get asked through a chat interface like Slack/Telegram.
- In startups and smaller organizations, this pattern spreads fast; in large enterprises, it's constrained by security, governance, and compliance, so it scales more slowly.

Yury emphasizes that the "modern data stack" has two major directions in the AI era:

1. Moving from a closed monolith toward a "composable, building-block architecture," ideally made of open-source blocks that can be stacked as needed (for example, swapping a traditional observability tool for AI observability, or replacing a BI tool with a conversational agent).
2. Fully democratizing data access: in the past you needed "data priests" (analysts / data scientists) to hand-write SQL or build dashboards; now, through MCP + agents, anyone can query data without writing SQL.

But this brings a key technical requirement: every single agent interaction can trigger dozens or even hundreds of SQL queries on the backend, executed sequentially. If each backend query takes several seconds, the whole experience grinds to a halt. So the data platform must provide:

- Very low query latency
- Extremely high concurrency

The semantic layer and the "context" problem

Carl from Snowflake raises a problem that isn't yet well-solved in the AI + data-stack world: managing context/semantics across systems.

- Once you break the system apart into a bunch of "Lego blocks," keeping semantics and context consistent across different platforms becomes extremely difficult.
- Traditionally, the semantic model has been locked inside a BI tool (like Power BI's semantic model); in the AI era, the semantic layer now has to sink down into the data layer itself.
- The industry is pushing open standards like Open Semantic Interchange through the Apache Foundation, but there's no mature answer yet.

They also discuss a view:\
"BI as we know it is dead" (BI in its traditional form is disappearing).\
The reasons are:

- On one side, it's being squeezed by conversational interfaces (asking an agent directly for insight);
- On the other side, it's being squeezed by AI-assisted "vibe coding" (generating an app/dashboard from natural language, instead of manually configuring a BI report).

The future may look like this: you use conversation and vibe coding to find the insight, then say "turn this into a dashboard/app" in one sentence — BI becomes a container for the result, rather than the thing the user directly operates.

Will data platforms end up "just storing data, not making money"?

The moderator draws an analogy to the travel industry:\
GDS systems used to control flight/hotel information and sat at the bottom of the stack; later, OTAs (Booking, Kayak, and the like) became the user's entry point, and most of the value got captured by the "front door."\
The question is: could the same thing happen in the data-platform world? Could data platforms end up as nothing but "cheap compute and storage," with all the value captured by AI agents / the application layer?

The panelists' views:

- Carl: in theory that "bear case" exists, but in the enterprise world, what a data platform sells is trust. Who you hand your most sensitive, most critical business data to is exactly why these platforms won't end up as mere dumb storage.
- Yury: you can imagine "no database," with agents grabbing data directly from real-time streams, but in practice, building a mature, production-grade database still takes years (he says about 10), and AI can only speed up part of that.
- AI actually makes data platforms more important: AI labs themselves are among the biggest generators and consumers of data, and user data plus training/inference logs all need a reliable data platform to sit on.

S3 and a new storage primitive

Next, the discussion turns to: in the analytics era, S3 became the standard storage primitive — so does the AI data-platform era need a new primitive?

Nikita's answer:

- One of Neon's innovations is building an OLTP (operational) database on top of object storage, but this isn't easy, because S3 is suited to "cold, old data," not "new data" updated at high frequency.
- Many modern databases (e.g., Aurora, HorizonDB, Neon) are converging on a similar pattern:

▫ S3 is part of the authoritative storage, responsible for old data;

▫ A low-latency layer is built on top of it to handle new data.

- What's genuinely missing: a cloud provider (AWS / Azure / GCP) offering a dedicated "low-latency object storage tier," which would make it far easier for everyone to build this kind of hybrid architecture on top of it.

Yury adds a perspective from compute–storage separation:

- Separating compute from storage is one of the keys to the success of ClickHouse's cloud product.
- Moving data off expensive local SSDs onto cheap object storage, then letting stateless compute auto-scale, can make the commercial cloud product actually cheaper than self-managing the open source.
- This requires a whole stack of multi-layer caching and prefetch design, but if you design it well, you can have it both ways: cheap and fast.

How much have AI coding tools actually sped up development?

Yury shares a real-world observation:\
Even with AI coding tools generating more code per day, overall "shipping speed" hasn't grown 10x.

- The real bottleneck shifts to code review, testing, deployment, operations, and the like.
- He's asked plenty of peers, and nobody thinks products are actually shipping 10x faster; most say the speedup is more like 20–30%.

Nikita adds a suggestion:\
Now that AI coding has lowered the cost of "writing code," startups can actually take on more ambitious systems-level projects that used to be seen as too heavy (like an entirely new database, storage layer, or piece of infrastructure) — provided you design your whole engineering pipeline around AI from day one (AI-born, AI-first), with every bottleneck engineered for up front.

Bring compute close to the data, or send data to the compute?

Later, there's a discussion about AI agent architecture:

- One camp says "put the agent runtime / inference / vector search / retrieval inside the data platform" (bring compute next to the data).
- The other camp says "move the data to an independent agent runtime / inference system" (bring data to the compute).

Yury and Carl both stress one key concept: data gravity.

- Small amounts of metadata, schema, skills, and markdown can of course be shipped around freely.
- But at a scale like Tesla's — a billion events written per second, 1 quadrillion rows every 11 days — or Netflix's several petabytes of daily traffic, and Anthropic/OpenAI operating at a similar scale: at that volume, data effectively becomes a "black hole," extremely hard to move around over the network.
- Once data volume reaches the tens or hundreds of petabytes, or even exabyte scale, a lot of SaaS models simply stop working — you have to deploy the system directly inside the customer's account/VPC, so compute sits close to the data.

Carl puts it more bluntly:

- Moving data is bounded by "the speed of light";
- Storage is long-lived, while compute is ephemeral and can be switched on and off at will, so from both a cost and a practicality standpoint, moving compute next to the data is far more feasible than doing it the other way around.

Cost and consumption-based pricing

The moderator mentions that during the pandemic, everyone ran schedules like crazy without caring about cost, and it was only once the economy turned that cost controls kicked in. Now, with AI agents constantly hitting the data platform's API, it generates revenue for cloud platforms, but it also burns through customers' budgets.

Their answers are largely aligned:

- The pricing model will be consumption-based, paired with strong cost-control mechanisms.
- Platforms will:

▫ Make it easy for both external and internal agents to plug in (since consumption is good for the vendor);

▫ While also giving the enterprise CIO full control: analyzing the correlation between spend and return, the ability to throttle unnecessary high-frequency queries, and setting quotas, alerts, disabling autoscaling, and so on.

- Yury adds: with the right mechanisms like query caching, repeated queries can actually be very cheap on the backend.
- Over the long run, he believes that for most workloads, consumption-based pricing will be cheaper than pre-provisioning fixed capacity, because the latter always has to reserve buffer for peak load — which amounts to paying 24/7 for idle resources.

Data platforms "moving up the stack": from infra to app platform

The final major section focuses on this: data platforms aren't just doing infra anymore, they're expanding into the "application layer."

Examples include:

- Snowflake: Native Apps, Cortex Code (a data-native coding agent), and AI functions built directly into the engine (AI_COMPLETE, AI_AGGREGATE, etc.).
- Databricks: Databricks Apps.
- ClickHouse: ClickStack (its own observability platform), among others.

There are a few motivations:

1. Driven by customer pressure:

▫ Large enterprises rolling out a new SaaS tool have to spend 9–18 months on security/compliance review;

▫ If the app can "run directly inside Snowflake / Databricks / ClickHouse," it can reuse the existing security and governance framework, dramatically shortening rollout time.

2. Driven by internal needs (dogfooding):

▫ Each company is itself one of its own biggest customers, needing a better AI coding agent and a more convenient native-app model, so it naturally turns those capabilities into a product.

3. Driven by market opportunity:

▫ Nikita believes we're heading into a wave of "SaaS consolidation": expensive, limited-value SaaS tools will get rewritten by enterprises using LLM + self-built apps;

▫ In this process, the "app-hosting platform closest to the data" gains a big advantage, and data platforms have a real chance to compete with hyperscalers' general-purpose app platforms on this turf.

Yury is more conservative, arguing that:

- It makes sense for data platforms to build up "repeatable, non-differentiated heavy lifting" (like a general-purpose observability platform);
- But apps carrying a lot of proprietary business logic, like travel or dating, should still be built by the customers themselves or by independent vendors.

Carl, meanwhile, thinks starting with the "hundreds or thousands of small internal enterprise apps" — providing the ability to easily develop, deploy, and host these small business systems on the data platform — and then extending out to third-party ISVs and a marketplace, is a very natural path.

In summary, this panel conveys a few core messages:

- AI agents haven't made centralized data platforms unnecessary — if anything, they've amplified their importance in performance, governance, and the semantic layer.
- Data platforms will keep optimizing deeply around "compute–storage separation, data gravity, multi-layer caching, and AI-friendly primitives" to support high-concurrency, low-latency agent workloads.
- The truly big structural changes are:

▫ Traditional BI is being reshaped by conversational interfaces and AI apps/vibe coding;

▫ The data stack is moving from a closed monolith to composable building blocks, but cross-system semantics/context remains an unsolved problem;

▫ Data platforms are gradually expanding from "just selling compute-and-storage infra" toward becoming "the main battleground for apps and agents."
