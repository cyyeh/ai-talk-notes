---
title: The Deconstructed Database at Datadog
speaker: Julien and Pierre, Datadog
video: https://youtu.be/Bh9O20Q1dkE?si=SWoKeEqJ6uv4_BW7
---
This Datadog talk is about one thing: how they refactored a pile of siloed databases/query systems into a "composable, open-standards-assembled" deconstructed database, so it can sustain their current scale and future demands like AI.

First half: from "just keep it standing" to a cloud-native, large-scale rethink

Julien starts with Datadog's background and growth.

Datadog started out as just infrastructure monitoring, bootstrapped pragmatically on open-source solutions:\
metrics used relational-database-like (Postgres) table design plus time series;\
events/logs were buffered and then dumped into Elasticsearch for full-text search.

There were only two core data types:

events: structured, timestamped event data\
metrics: the numeric trajectory of a single "phenomenon" over time (essentially a "pre-aggregation" of events)

But as they grew to "trillions of events/metrics, huge numbers of customers, multiple products sharing the platform," several pain points in the early architecture got amplified:

1. A cluster like Elasticsearch, where "storage and compute are bound to the same node," can easily have a single hot shard drag down the entire quorum.
2. The more queries there are, the busier the nodes get, which directly affects ingestion, causing latency and data gaps.
3. In a multi-tenant environment, balancing isolation between different customers against pooling resources (mutualization) is a hard trade-off between availability and cost.

They first did two layers of "separation":

- Splitting the control plane (deciding where data goes) from the data plane (the nodes that actually store the data), reducing the "chain reaction" from a single overloaded point.
- Going further, in a cloud-native environment, making good use of "cheap, fast object storage (like S3) + high-speed networking" to fully decouple storage from compute.

The new generation of the event/historical-metrics system looks roughly like this:

- writer pool: takes in data, does enrichment, and quickly writes "lots of small files" into blob storage (optimized for write throughput and durability).
- compactor pool: cleans up these small files in the background, turning them into large, sorted files that are query-friendly.
- query pool: a completely independent query fleet responsible only for reading blob storage and computing queries. No matter how heavy the queries get, they don't directly slow down ingestion.

For metrics, they also split things into two pipelines:

- one for recent data used for "real-time monitoring/alerting/dashboards," which needs to be extremely fast.
- one leaning more toward OLAP-style historical queries, for capacity planning and long-term trend analysis.

The key idea is: separate use cases with different SLAs and optimize each on its own, rather than cramming everything into one do-everything system.

Midway: the trouble with multiple products, multiple platforms, and federated queries

Pierre then takes over, discussing the new problems that emerged after Datadog's product line exploded.

As cloud security, product analytics (BI), and various AI/agent products emerged, the handful of platforms originally "built for observability" quickly showed their limits:

- Every ingestion/processing/query engine was built independently, each with its own semantics, API, and capability boundaries.
- Many product requirements actually span platforms — for example, needing metrics + logs + traces together for complex analysis.

Their solution at the time was to "wrap a federation layer in front":

- All products go through the same unified query entry point, which breaks the query down into queries against each backend platform and then joins/aggregates at the layer above.
- On the surface it looks like "one system," but underneath it's really a pile of silos.

But this quickly ran into several practical problems:

- Many joins (e.g. joining the top-k results from two backends) couldn't be pushed down to each platform, so large amounts of data had to be "pulled up" and computed at the top layer instead, making costs high and introducing correctness risk.
- The semantics across platforms weren't truly aligned, so the federation layer often didn't dare push filters and aggregations down (fearing semantic inconsistency), and had to compute them at the top layer instead, which was even less efficient.
- Supporting a new feature meant changing both the federation layer and every backend query system, and development and maintenance costs exploded.

On top of that, a growing volume of "offline transforms" and AI needs started pulling data directly from the storage layer, completely bypassing the originally designed query API, laying the overall complexity bare.

Pivot: from "build everything in-house vs. buy off-the-shelf" to "assemble with open-source building blocks"

Pierre reviews the two extremes they went through:

- Early on, using off-the-shelf systems like Postgres and Elasticsearch was fast to develop with, but meant constantly fighting their built-in opinions (transactional semantics, consistency models, schema conventions, etc.).
- Later, they swung the other way and wrote their own metrics platform and event platform entirely from scratch; while this gave full flexibility at first, over time any new capability caused the platforms' semantics to diverge, technical debt piled up, and operational cost became staggering.

The position they've now settled on is a middle ground:

- Use open standards and composable open-source components as much as possible (like Lego bricks) — for example: Arrow, Substrait, Calcite, DataFusion, Parquet, Iceberg, and so on.
- Break the system into many small components, connected via "standardized contracts," where each component can be swapped for an off-the-shelf version or a custom, specially optimized one.

This is what they call the "deconstructed database" mindset:\
no longer a single giant database, but a composable set of query engine + metadata + storage + transport standards.

Second half: the concrete architecture — from DSL to execution engine, formats, and metadata

On the query path, they split the system into several layers and picked a corresponding open-source project for each:

1. Multiple DSLs → a unified intermediate representation (Substrait)

Datadog has many different query languages/DSLs (SQL, dataframe-like APIs, metrics query syntax, etc.).\
These languages let different personas express intent in a natural way, but the backend doesn't want to write a completely separate query engine for every DSL.

The approach:

- All DSLs are first "translated" into a Substrait logical plan.
- Substrait defines a standard set of types, relational operators, and functions, and allows extension with custom operators.
- This way, whether the layer above was originally SQL or a metrics DSL, underneath it all becomes the same kind of logical plan, for example:

▫ a flow like scan → filter → partial aggregation → re-aggregation.

With unified semantics in place, they can now optimize only against the Substrait plan, without reinventing the wheel for every DSL.

2. Logical plan optimization (Calcite) → physical plan (DataFusion)

Once the logical plan is built, they use Calcite to do rule- and statistics-driven optimization, for example:

- pushing filters up or down as appropriate, and reordering them relative to aggregates.
- using data statistics to decide join order, and so on.

Next, "intent" needs to become the physical plan for "how it will actually run":

- They use DataFusion's physical plan as the execution specification.
- The physical plan is much more detailed than the logical plan, including the partitioning strategy, how to shuffle, where aggregation happens, how to coalesce results, and so on.
- The physical stage can do another round of optimization tailored to actual storage capabilities — for example, confirming the underlying layer supports filter pushdown, and pushing the condition down to the scan node to save on I/O.

3. Execution engine and distributed execution (DataFusion + in-house extensions)

DataFusion itself is a single-node query engine framework:

- it has a large set of built-in operators (scan, filter, projection, join, aggregate...), all implemented through a public API, which also lets you write your own extensions using that same API.
- It uses Apache Arrow's columnar in-memory format, prioritizing random-access efficiency and low serialization cost.

Building on top of this, Datadog:

- open-sourced a "distributed DataFusion" extension, adding distributed nodes for shuffle, broadcast join, scatter-gather, coalesce, and so on.
- explicitly encodes "how to execute in a distributed way" into special nodes of the physical plan, so anyone using DataFusion can gain distributed capability without modifying the core.

4. Metadata and file formats (Iceberg, Arrow, Parquet)

At the metadata and storage layer, they're moving toward open formats:

- Metadata:

▫ for highly streaming, high-churn data, they still heavily use their own custom metadata system, because the open-source world isn't yet well-suited to this kind of live-edge, continuously-written scenario.

▫ but for "static or slowly-changing" data, they lean toward adopting Apache Iceberg, uniformly managing partitions, snapshots, and statistics for the query engine to use for pruning and planning.

- In-memory format:

▫ using the Arrow columnar format across the board, so as to enable:

⁃ efficient random access;

⁃ exchanging data between nodes and between systems at low serialization cost.

▫ one layer up from that, there's also Arrow Flight (transport protocol), Flight SQL (query protocol), and ADBC (something like a columnar version of JDBC).

- Storage format:

▫ historically there were quite a few in-house formats, but they're gradually converging more datasets, and even legacy products, toward Parquet.

▫ a standard storage format makes it much easier for future, unanticipated systems, tools, and models to reuse this data.

Overall, they divide the various components into two broad categories:

- Contracts: Substrait, Arrow, Parquet, Iceberg, etc., used to "define boundaries" so different components can be swapped in and out.
- Components: DataFusion, Calcite, etc., providing extensible default implementations, paired with their own specialized implementations.

Results and current progress

This deconstructed stack is still "migration in progress," but some clear wins are already visible:

- Semantics are now consistent across platforms, and semantic bugs have dropped substantially.
- Having a unified way to express query/schema/metadata is what makes it realistically possible to build a genuine "semantic layer" at the company-wide level — which is especially critical for AI and agents.
- Using open-source engines and formats improves resource efficiency, and also saves a lot of time on "commodity" functionality (like general-purpose operators, scanners, etc.).
- Once the system is broken down more finely into horizontal layers, you can mix and match open-source and proprietary components at each layer, adjusting at a finer granularity and moving in smaller, faster steps.
- For newcomers, the learning cost drops a lot: getting familiar with Arrow, Parquet, DataFusion, Iceberg, etc. is enough to get started, rather than first having to understand a pile of mysterious in-house custom systems.

Future work and the connection to AI/agents

Finally, Julien lays out several key directions they're headed next, basically all tied to AI and higher-level data products:

1. Evolving from plain compaction to more general materialized views: not just merging small files into big ones, but building smart aggregation, sampling, and pruning structures to support a broader range of more complex query patterns.
2. Deeper integration between interactive queries and ETL: the goal is for the interactive engine and the batch ETL layer to share the same semantics and logic (e.g. both built on Substrait + the same semantic layer), reducing the fragmentation between the "online query" and "offline ETL" worlds.
3. Unifying the table format and stronger interoperability: as more products move toward batch/analytics-oriented use, they need their streaming-first DNA to smoothly connect with the need to "look back over the past several days/weeks for large-scale analytics."
4. Semantic layer and data lineage: when you have a stack of transformation layers and derived datasets, you need to fully track where the data came from, how it was transformed, and what its sensitivity and retention rules are, and carry this semantic information along with the data. For AI agents, just seeing the schema isn't enough — they also need to know the semantics of identifiers, what the canonical id is, permitted uses, and so on.
5. Supporting AI model training and inference/agents:

▫ training: needs to provide consistent, controllable, cost-reasonable access to "all data"; this requires reducing data fragmentation.

▫ inference/agents: letting agents safely read, write, and operate on production systems — doing automated debugging, deployment, rollbacks, and so on — requires the data platform to be complete enough in both semantics and governance.

In summary, this talk is about:\
Datadog's evolution, within a massive multi-tenant cloud environment, from a traditional monolithic database, to custom in-house engines, to now building a "deconstructed" database using open standards and composable open-source components.\
The goal is: without giving up control over platform details, to make the system easier to evolve and better able to support new kinds of analytics and AI/agent workloads.
