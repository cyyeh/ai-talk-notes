---
title: Scaling CDC to Trillions of Rows: What Broke, What We Rebuilt, and What AI Demands Next
speaker: Artie
video: https://youtu.be/EcYB5qraEZc?si=sz-rlR1n2U42tOhF
---
This video covers how the Artie team scaled their CDC (Change Data Capture) system from "just get the MVP running" all the way to "billions to tens of billions of events a day across thousands of pipelines" — what broke along the way, how they rebuilt it, and how they're designing their architecture next for the AI era.

Summary of key points (roughly a 20–30% excerpt)

The speaker opens with a fictional character, Sam — a senior data engineer at Yesterday Inc. — to tell the story: the CEO's one requirement is that "the data warehouse stay as close to real-time production as possible." Sam initially goes through a few typical stages:

1. Daily snapshots → increasing frequency They start with nightly snapshots to avoid affecting the live DB, then run them more and more often, but the moment a job finishes and the live DB keeps serving traffic, the warehouse data goes stale again immediately.
2. The "poor man's CDC": incremental batch Using a field like ‎⁠updated_at⁠ to run batched queries such as ‎⁠SELECT * FROM table WHERE updated_at > last_run⁠. Problems with this approach include:

▫ It can't catch hard deletes (Yesterday Inc. only does soft deletes, which is barely acceptable).

▫ Every table needs a reliable "updated" field, and many schemas don't have one.

▫ The updated field is often set by application code rather than guaranteed by the DB itself, so if a side effect doesn't fire or a migration forgets to set it, data quietly goes missing.

▫ As volume grows, the batch takes longer and longer to run, and it starts to buckle.

3. Moving to real CDC: Debezium + Kafka + Snowflake Sink Sam then adopts a "textbook" architecture: Debezium reads the Postgres WAL → feeds it into Kafka → a Snowflake sink connector writes it to the destination. In theory this solves:

▫ No more polling.

▫ Deletes get captured too.

▫ It's all open-source components, which looks like something you can just "wire up yourself." But once it actually went live, problems piled up one after another:

▫ The backfill strategy opens long-running read transactions, causing changes to pile up in the WAL faster than they can be consumed, and the DB disk nearly fills up.

▫ Kafka storage blows up too, because the original sizing only accounted for ongoing CDC, not for all the backfill traffic that also flows through Kafka — and compression wasn't enabled by default.

▫ After fixing the infrastructure, they found a pile of "silently missing data" on the destination side (the pipeline looked healthy, but specific changes were simply gone).

4. The root cause of the "silent missing data": Postgres TOAST, odd types, and edge cases Digging deeper, they find that some fields are being handled by the Postgres TOAST mechanism:

▫ If a field's value exceeds the page size (around 8 KB) and that value hasn't changed, the WAL/CDC event omits that column.

▫ If the downstream doesn't handle TOAST behavior, it ends up with an incomplete row. Other edge cases that only surface at scale:

▫ Very unusual type configurations, such as a numeric with negative scale, or years outside the normal ‎⁠YYYYMMDD⁠ encoding range.

▫ Many open-source tools only expose "system-level metrics," not "data-processing-level errors and telemetry" — in practice, it's like "flying a mission-critical pipeline blind."

5. Throughput mismatch: Kafka is fast, Snowflake merges are slow Publishing to Kafka is nearly instantaneous, but ‎⁠MERGE⁠ on an OLAP system like Snowflake is inherently inefficient and requires large table scans. Under high traffic over long stretches of time, the speed mismatch across source → Kafka → destination becomes a constant bottleneck and backlog.
6. Takeaway one: the tools are all correct in theory, but in practice they "were never designed to play nicely together" The whole Debezium + Kafka + Sink world looks like a set of modular, composable open-source tools, but:

▫ None of them were designed with the "complete end-to-end pipeline" in mind.

▫ A huge number of edge cases can only be patched by hand, which makes operations extremely painful. The speaker mentions he's used similar setups at several previous companies, and at Artie they finally decided to "rewrite everything," rather than keep forcing square pegs into round holes.

The architecture and key design choices Artie rebuilt

They kept the rough topology (source DB → CDC → Kafka → consumers/destinations), but reimplemented all of the core components themselves, focusing on:

1. A custom-built reader: replacing Debezium

To address Debezium's pain points, they rewrote the WAL reader, aiming for higher reliability and operability:

- Backfill control: With their own reader, they can control, in much finer detail, which tables need a backfill and how it runs alongside live CDC without blocking it.
- Fan-in/fan-out as first-class citizens: For example, when multiple tenants (single-tenant DBs, sharded DBs) need to land in the same destination schema, they support fan-in/fan-out right at the reader layer, instead of relying on fragile SMT (Single Message Transform) hacks.
- Clearer error handling and recovery:

▫ Failures aren't "silently swallowed" — errors get thrown upward and the pod is crashed instead.

▫ They lean on Kubernetes' autoscheduler, implementing reliability directly through standard restart/monitoring mechanisms.

This lets them process billions of changes a day while keeping the on-call burden manageable.

2. Separating backfill from live CDC processing

They spent years refining their "live backfill strategy," and the core design is:

- Backfill and CDC consumption are completely separate processes.
- Backfill data no longer flows through Kafka — it's read straight from the source DB and written directly to the destination.
- Once a backfill finishes, they run a single dedupe pass (mostly by primary key), avoiding an expensive merge.
- Once a given table's backfill is done, that table's corresponding Kafka consumer is enabled to start draining CDC.
- Concurrency is controlled at the table level, not across the whole pipeline.

The effect is:

- The source DB is no longer tied up by long-running read transactions.
- Kafka no longer needs to carry the combined peak of backfill + CDC.
- "Backfill data" and "CDC data" can be clearly distinguished, so the destination side can use whichever DB operation suits each best, making backfill faster and safer.

3. The consumer layer automatically handles schema changes and transactional semantics

Previously, if you only used a generic Kafka sink connector, engineering teams often had to:

- Write custom logic per table to handle things like unfurling key-value tables.
- Manually handle schema evolution (adding columns, changing types, dropping columns).
- Build their own merge logic to guarantee idempotency and correct ordering.

Artie's consumer aims to turn all of this into a platform capability:

- The workflow (replication, transformation) carries transactional guarantees, achieved by:

▫ Designing "processing one event" as an idempotent operation.

▫ Using the DB's own atomic SQL operations to complete the write before committing the Kafka offset.

- Write throughput is managed automatically by the system, with no need for users to hand-tune flush rules.

4. Philosophy of schema evolution: minimal intervention, but never sacrifice precision

They follow three design principles for handling schema changes:

1. Avoid escalations wherever possible (don't force a human to step in on every schema change), to keep operational cost down.
2. Put the consumer (the downstream user) in the driver's seat — the pipeline should adapt to what the user does.
3. Never proactively cause precision loss.

For example, with type conversion:

- float → int: this would lose decimal places, so they choose to "hard-fail + notify," and let the customer decide whether to switch to float or string instead.
- int → float: this only adds decimal places, so the system can safely auto-convert.

Combined with monitoring and error management, this philosophy makes "insisting on correctness" actually workable, instead of scattering ‎⁠try/catch⁠ blocks everywhere to quietly drop data.

5. Producing two kinds of tables at once: a mirror table + an audit/history table (similar to SCD Type 4)

For every table, they produce two views on the destination side:

- A "stable table" that mirrors production as closely as possible (via merge-on-write) — suited to most analytics/BI use cases.
- An "append-only log table" that records every change together with its DB transaction timestamp — suited to tracking history, debugging the pipeline, replaying events, and similar uses.

From CDC to an AI sync layer: extending toward future AI workloads

The second half covers this: even once Sam finally gets the CDC pipeline working, there's now an "AI agent" that also wants to use this data.

- AI agents query and analyze extremely fast in parallel, spinning up sub-agents and fanning out — effectively removing the "human analyst bottleneck."
- For an agent, a delay of minutes or tens of minutes — perfectly acceptable to a human — reads as "the system is broken."
- Once AI removes the bottleneck at the analysis layer, the real bottleneck shifts to:

▫ Data ingestion (how fast data comes in)

▫ The transformation layer (how fast transformation and feature generation happen)

Their view:

1. Who's consuming the data is changing fast: from human analysts → automated systems → AI agents.
2. A lot of egress/query speed that looks "fast enough" today will soon be seen as "a service outage."
3. In the future, "reading" alone won't be enough — agents should also be able to react to changes in real time (event-driven).

So their next-stage direction is: instead of trying to be "the one and only destination," turn the CDC stream into the enterprise's internal event bus:

- Not just pushing to Snowflake or Databricks, but exposing it via a Kafka stream so customers can build their own consumers.
- Supporting in-flight transformations (transforming data live on the stream).
- Fanning out to whatever destination fits the workload, such as Elasticsearch or various vector stores.
- They themselves focus on turning the underlying plumbing (reader, backfill, consumer, fault tolerance, schema evolution, etc.) into a stable platform.

Finally, they expand the scope of "CDC" beyond traditional databases to more AI-relevant sources:

- File systems and object storage.
- Git repos: Git itself is essentially "CDC for the file system" — every commit is a change event.
- These changes (e.g. skills, shared caches, repo changes) should all be able to trigger new workflow/agent behavior.

Overall, this talk is partly a war story about building and rebuilding a Debezium+Kafka-style CDC pipeline, and partly an argument that in the AI era, "real-time data" isn't just a database-replication problem — it's a design problem for the entire enterprise data sync layer, and CDC will evolve into a unified, event-driven piece of infrastructure that feeds AI systems.
