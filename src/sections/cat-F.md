---
heading: Data Infrastructure
desc: Databases, OLTP/OLAP, CDC, lakehouses, vector search, data lineage: the foundation that analytics and data agents run on.
color: #059669
docs: 4, 7, 14, 25, 31, 38, 39, 40, 69, 73, 78, 81, 87, 99
---
## AI Needs a New Kind of OLTP: Lakebase & Serverless Postgres in the Agent Era
@ Databricks (Lakebase/Neon)
Agent-generated applications create huge volumes of short-lived, bursty database workloads that traditional Postgres can't handle, so Lakebase/Neon splits Postgres into a stateless, storage-compute-separated cloud-native architecture, with data landing on object storage and a page-server cache smoothing out latency. This brings scale-to-zero, auto-scaling, and cheap database "branching," letting every PR or agent turn open an independent branch to experiment and roll back.

## After the Lakehouse: Building Data Infra for the AI Era
@ Panel: Snowflake, Databricks, ClickHouse
Representatives from three major data platforms agree that the central data platform isn't going away — if anything, it becomes more important for governance and trust, and it keeps deepening around storage-compute separation, data gravity, multi-layer caching, and consumption pricing to support agents' high-concurrency, low-latency queries. They note that "traditional BI is disappearing," and the semantic layer must sink from BI tools down into the data layer (e.g., Open Semantic Interchange), while data platforms are expanding from selling storage/compute infrastructure into the app/agent battleground.

## Agents will need trillions of databases. Let's give it to them!
@ Turso
Predicts that AI agents will push the number of databases into the trillions, because every agent/session/vibe-coded app needs its own state, memory, and context database — and SQLite, with roughly a trillion instances already deployed, proves this is feasible. Turso fully rewrote SQLite in Rust, keeping file-format compatibility, and added full async support, multi-writer MVCC, native WASM, vector search, materialized views, and strong typing.

## Building the Database for Trillion-Scale AI Search
@ Nikhil, turbopuffer
Describes how turbopuffer, built around an "object-storage-native," minimal core, evolved from small-scale vector search into trillion-scale AI search supporting 4 trillion documents and 2.5M writes per second — earning its complexity incrementally based on real production metrics. Also points out that agents are causing search volume and complexity to explode, and shows how search models and git-style branching cut costs.

## Data Lake CDC: Are we there yet?
@ ClickHouse
Explores why "CDC incremental sync from a data lake into an analytics store" is needed, and compares Delta (changes precomputed, easier to consume) with Iceberg (changes embedded in rows, harder). Points out three missing pieces today — cross-table global ordering, durable change retention, and a consistent standard consumption interface — and argues these "cross-cutting semantics" should be solved at the catalog layer, concluding "not there yet, but past the halfway point."

## Five years of OpenLineage: How we built an industry standard and why agents need it
@ Datadog (OpenLineage)
Introduces OpenLineage, a vendor-neutral spec hosted under the Linux Foundation that describes runtime lineage events in JSON (core concepts: Job/Run/Dataset + facets), arguing that runtime observation is more accurate than inferring after the fact from source code or logs. Emphasizes that as AI agents read and write data at scale, lineage is the key infrastructure that turns agents from black boxes into observable, auditable, and reproducible systems.

## Forgiveness, Not Permission: Running Agents On Production Data
@ Jacopo, Bauplan
Argues that trust in agents shouldn't come from stripping down permissions, but from designing systems to stay correct and recoverable even when an agent makes mistakes. Proposes a Git-like lakehouse (Iceberg + immutable commits + branch/merge + time travel), using temporary branches plus merges to implement MVCC-like transactions. Also uses formal verification to find API counterexamples, emphasizing that the API is small enough — around 60K tokens — for even cheap models to learn.

## From Postgres to ClickHouse and Back: Building a Unified OLTP + OLAP Database for AI Workloads
@ Kaushik, ClickHouse (PeerDB)
Explains why "Postgres for transactions + ClickHouse for analytics" has become a common architecture (AI-native companies hitting walls early, with data volume growing 1000% in 6 months), and identifies the pain point as the complexity of keeping both sides in sync. ClickHouse responded by launching a managed Postgres service, focused on large-scale consistent parallel backfill, low-overhead replication slots, second-level end-to-end latency, and an open-source extension that acts as an FDW to auto-push-down queries.

## Scaling CDC to Trillions of Rows: What Broke, What We Rebuilt, and What AI Demands Next
@ Artie
Uses a fictional data engineer's journey to trace how CDC evolved from snapshots and incremental batches to a Debezium + Kafka + Snowflake architecture that eventually broke down at scale — leading to a full rewrite: a custom-built WAL reader, separating backfill from live CDC, and consumers with transactional semantics and automatic schema evolution. Argues that AI agents will shift the analytics bottleneck from people to ingestion/transformation, and that CDC should evolve into an event bus that AI can react to in real time.

## Super-Secret Next Big Thing for DuckDB
@ Hannes, DuckDB
Introduces Quack, a new DuckDB extension that solves the pain point of "DuckDB can't talk to itself properly" — one side serves, and the other side uses ATTACH/remote.query to query a remote DuckDB as a schema, built on over-HTTP RPC. Performance tests show transferring 60 million rows takes about 5 seconds (versus roughly 3 minutes for Postgres), moving DuckDB from single-node embedded use toward distributed deployment.

## The Deconstructed Database at Datadog
@ Julien and Pierre, Datadog
Explains how siloed query systems were refactored into a "deconstructed database" assembled from open standards: separating control/data plane and storage/compute, then using Substrait to unify logical plans across various DSLs, Calcite for optimization, and DataFusion for execution, with metadata/formats converging on Iceberg/Arrow/Parquet. Frames building a company-wide semantic layer and data lineage as the key next step for supporting AI/agents.

## The Modern Data Stack Lost the War: Stop Building more DataFrame APIs
@ OpenAI
Argues that in the AI/agent era, we shouldn't keep building new DataFrame APIs, but should instead move toward "function-first" data programming tools: extracting core logic into reusable Python functions (UDFs), paired with an efficient UDF engine. Benchmarks show plain Python plus a function-first engine can be an order of magnitude faster than traditional dataframes in UDF scenarios, and demonstrates using Codex to generate, in a single day, a translation layer that used to take 20 people 2 years to build.

## Trillion is the New Billion: Managing Really Large Multimodal Datasets for AI
@ LanceDB
Argues for managing trillion-scale, multimodal datasets with a "unified data layer," replacing the siloed approach of repeatedly copying the same data across labeling, training, and evaluation. Core design elements include storing huge blobs and fine-grained columns in the same table with multimodal indexing, immutability plus versioning plus lineage, and "zero-cost schema/feature evolution" on large tables. Also proposes an L0–L5 data maturity model.

## Your Database Wasn't Built for This
@ Andy, CockroachDB
Argues that traditional databases weren't designed for the agent era, and that in the future most database "users" will be agents rather than humans. Using cases like the internal tool Mica (which lets 60% of employees generate reports/dashboards/apps in natural language), it explains the need to improve "agent experience" (structured, parseable, foolproof interfaces), build permission governance and secure defaults into the platform, and even create an "agent experience benchmark" to measure completion rates and token consumption.
