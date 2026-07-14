---
title: Benchmarking AI Agents Against Realistic Analytical Tasks with ADE-bench
speaker: ADE-bench team
video: https://youtu.be/wLZLmGcGQZs?si=urfjJBT0wuZ0umE6
---
This video introduces ADE-bench, explaining why this new kind of benchmark is needed, and just how good — or not — today's AI "data analysis agents" really are, and what's still missing.

What is this talk about?

The speaker opens by recalling a prediction he once got wrong (he'd written that "LLMs shouldn't write SQL," yet machines now write far more SQL than humans do), using it to set up a core argument: benchmarks that only look at "LLMs writing SQL and solving stats problems" are actually still a long way from real analytical work.

In the real world, data analysis isn't just about writing one correct query — it's about:

- First figuring out what an ambiguous business question is actually asking
- Finding the right tables and columns inside a DBT project full of legacy code, bugs, macros, and third-party packages
- Fixing broken pipelines, adjusting financial reporting conventions, and aligning the organization's definitions of metrics

These qualities are all things traditional benchmarks struggle to capture.

Early benchmarks: the progress of LLMs writing SQL

They looked back at a line of work from around 2023:

- Juan Sequeda & data.world's research: using an insurance dataset, they measured LLM accuracy on easy/medium/hard questions and found that as long as some questions could be answered correctly, accuracy kept climbing as models and tools improved.
- The second key finding: in settings with a semantic layer / ontology, LLMs performed markedly better than "pure text-to-SQL." They redid the experiment with a DBT semantic layer, and the results were as expected: LLMs running on top of the semantic layer could push "well-defined queries" to near 100% accuracy. Text-to-SQL itself kept improving too, but remained comparatively fragile.

This shows that it isn't just the models getting stronger — "data modeling + semantic layer + tooling support" matters just as much.

Real-world needs: not just answering questions, but building pipelines

They split tasks into two broad categories:

1. Asking questions and getting answers (classic text-to-SQL, BI queries)
2. Building and maintaining data pipelines (DBT models, transformation logic, metric definitions, etc.)

The former already has plenty of benchmarks; the latter has almost none. So they decided to design a new benchmark, ADE-bench, aimed specifically at "having an agent do real data-engineering/analysis work inside a real, messy DBT project."

What is ADE-bench?

ADE-bench is designed around "realism," not clean toy problems.

- It hands over an entire messy DBT project, not one or two clean little tables.
- It includes a staging layer, test environments, macros, third-party packages, and other structures typical of enterprise projects.
- They deliberately "break" the project — broken models, incorrect joins, illogical logic, or a business rule that changed (e.g., how an onboarding fee is recognized) without the code catching up — and then ask the agent to find the problem, fix it, or implement the new requirement.

The point is to test:

- Whether the agent can navigate a large amount of context and read code and docs
- Whether it can understand ambiguous business instructions and turn them into correct schema/model updates
- Whether it can actually get a "broken data world" running properly again

At first they showed some kind of "score" chart, but the feedback from the room was consistent: people didn't really care whether a given model scored 3 points higher or 5 points lower on this benchmark.

What does the industry actually want to know?

The questions practitioners ask most often are really:

- What context should I give the agent? Notion docs? dbt docs? A semantic layer?
- Should I write skills/tools? How?
- How do I connect Slack, ticketing systems, the data warehouse... to actually get value out of it?

There's also a very practical baseline question:\
"If I do nothing at all — just turn on an out-of-the-box agent like Co-pilot/Co-work, hook it up to a few systems, and it already performs decently — do I really need to invest in all this custom-built stuff?"

They reach for a baseball analogy — "wins above replacement":

- What you should really be comparing is the gap between "your system" and "a readily available, off-the-shelf agent wired up with a bunch of integrations" — not against some abstract model leaderboard ranking.

The harness and context matter more than the model itself

They raise a key idea: the agent harness (the tools, workflow, and orchestration) is effectively the product itself, and matters just as much as the underlying model.

- Many new benchmarks no longer measure the model alone — they measure the "model + harness" pairing. Some models have great raw capability, yet once placed inside a particular product's harness, their actual coding scores end up losing to competitors.
- In the real world, we use the "complete product," not a "bare model."

On the other hand, there's also a growing consensus that context is the new "garbage in, garbage out."

- How complete and clean the schema, metric definitions, and internal docs you give the agent are will largely determine whether it can get things right.
- If you only look at model scores without checking how it performs in your actual context, you'll hit a wall very quickly.

Field experience: data modeling + documentation + semantic layer

Ganz then shares a practical observation: for a team trying to "build a data agent like Ramp's," the first few steps aren't actually that mysterious — they still come down to the familiar best practices of data engineering.

He describes an internal experiment (Opini's work):

- First, giving the LLM raw data to query directly produced poor results.
- Adding basic data modeling — splitting things into staging/intermediate/marts layers — significantly improved accuracy.
- The most critical step was adding documentation for columns and tables: this produced the single biggest jump, because "humans might not read the docs, but Claude will."
- Adding a semantic layer on top of that improved performance further still.

In short: the "model things properly and document them clearly" work you've been doing for the last decade matters even more in the LLM era, because the model actually reads it.

Where are we now?

Overall, they feel agents in data analysis/data engineering are currently at roughly "60-70% of the way there":

- Far better than the early natural-language BI tools from around 2017 (like Lookerbot), when the experience was generally poor.
- Now, as long as the systems are properly wired up and the context is right, agents genuinely can answer valuable questions and carry out a fair amount of real work.
- But there are still plenty of blind spots, failure scenarios, and fragile points — it's still some distance from a "hands-off Skynet."

The limits of benchmarks: why is "the test broken"?

They then turn to a philosophical question: can a benchmark really measure something like this?

- Izzy's "Metric City" is currently a very advanced approach: it simulates an entire company inside a sandbox, asking questions over a long period to see whether the agent genuinely learns and improves the metrics.
- But to compare it against a baseline that's "hooked up to Co-work, reading real email/Slack/tickets," you'd have to fully simulate all that surrounding information too — which is extremely hard.
- In the real world, we will always hook agents up to all kinds of internal systems — we'd never let one look at just an isolated data warehouse.

They even joked that some lab should just buy up companies that have gone under but left behind a complete digital footprint, and use a decade's worth of real email, tickets, and documents as a sandbox.\
The point is: without folding in domain context, you can't really benchmark a data agent.

That's why they say "the test is broken": not that benchmarks are useless, but that traditional, clean, closed benchmarks can't fully capture real-world value.

From "specs" to "experience" to "treating the model like a hire"

The final section offers a more macro-level reflection:

- In the early days of buying a computer, ads were all spec sheets (CPU in MHz, RAM in MB); nowadays the focus is on experience, design, and ecosystem, with the specs tucked away at the bottom.
- LLM/agent products are still stuck in the "obsessing over benchmark scores" spec-sheet era, but in the long run, what people actually want is real performance inside their own company.

They use "hiring an employee" as an analogy:

- Clearing the bar: some level of technical competence and background (corresponding to benchmark scores and model capability).
- Vibe fit: whether it matches the team's culture, style, and risk appetite — things that are hard to quantify.
- Ability to learn: whether, once on board, it gets familiar with your company's data model, processes, and business logic.
- What ultimately matters most: how it actually collaborates and performs in production.

For models and agents, a similar line of thinking applies:

- Whether being "good enough at some level" is sufficient, rather than needing to top every benchmark.
- Whether it can integrate well with your existing infrastructure, semantic layer, and internal systems.
- Whether, once genuinely deployed, it can reliably "get the job done" within your data and processes.

In other words, in the long run we'll care more about "how this agent performs at my company" than "where it ranks on some public benchmark." The real value of ADE-bench is that it offers a practically grounded framework for people to think and design with, rather than a single score to chase.
