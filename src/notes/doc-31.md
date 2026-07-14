---
title: Data Lake CDC: Are we there yet?
speaker: ClickHouse
video: https://youtu.be/XsEBpU1lrhs?si=hKQgwdnwAc4f00KC
---
This video discusses where things currently stand with "doing CDC (Change Data Capture) from a data lake to pull incremental data into an analytical database," why it's needed, and where it's still not mature enough.

The speaker starts by saying that in the past she mostly worked on OLTP CDC (from Postgres, MySQL, etc.); this is her first time seriously looking at "doing CDC from a data lake, incrementally syncing changed data into an analytical database like ClickHouse." At first she was confused like most people: isn't a data lake meant for storing cold data and doing offline analysis? If you want real-time or near-real-time analytics, you could connect directly to the source database, pull at high frequency in batches, or build a streaming architecture — and given that most analytical databases today (ClickHouse, Snowflake, BigQuery) can already "remotely scan the data lake," why would you still need to "do CDC outward from the data lake"?

After interviewing customers, she found several typical scenarios where "the data lake becomes the only reasonable source for CDC":

1. Many companies adopt a lake-first architecture, where all raw data lands in the data lake first, and the lake serves as the "source of truth" and the contract between teams. Downstream teams may not even have access to the real source system and can only read from the lake, so cross-system data consumption has to go through the data lake as an intermediary.
2. Multi-cloud/cross-region architectures are becoming more common, and full cross-cloud synchronization is too expensive, so the data lake becomes the interoperability layer across clouds — you only need incremental sync from the lake to each respective analytical system.
3. In some scenarios batch processing isn't fast enough, but re-scanning the entire lake is too costly — you need to process only the "changes," reducing the volume of data to analyze, in order to support more real-time queries or data-driven apps.

In these scenarios, customers today mostly write their own scripts to "manually implement data lake CDC," which is very cumbersome and fragile — which is why her team at ClickHouse wants to turn this into a productized ingestion offering (ClickPipes).

She then focuses on the two mainstream lake formats: Delta Lake and Apache Iceberg. Both carry change information, but implement it very differently.

Delta's approach is to "precompute changes and write them to a separate directory," so consumers only need to read this metadata without touching the actual data files, making the change stream easier to consume. The difficulty for consumers lies in tracking which version has already been read and how to recover from the correct version when an error occurs, but overall it's fairly straightforward — so ClickHouse plans to support Delta CDC first, since it only requires orchestrating version and offset management.

Iceberg, on the other hand, embeds change information "inside the rows" as metadata columns, with no separate change files. This makes storage cheaper, but consuming it requires scanning forward from a checkpoint and walking the metadata tree to find what changed — before v3 in particular, this was barely feasible for ordinary users to attempt on their own. Starting with v3, new primitives such as sequence numbers give CDC "a barely viable path," but it's still far more complex than Delta. The community is discussing further designs, such as a "root manifest": letting you diff just two pointers to know what changed, without walking the entire tree, making pulls cheaper.

Drawing on her years of experience with OLTP CDC, she then compares what key pieces data lake CDC is still missing:

1. No "global ordering across tables." Change tracking in Delta/Iceberg today is almost entirely table-level; if a single logical transaction modifies multiple tables at once, there's currently no way to know how these changes relate to each other, nor to sort and replay them on a single timeline — a major limitation for applications that need strong consistency or cross-table semantics.
2. A lack of "durable retention" guarantees for changes. In theory, the consumer can track its own offset, but only if the producer retains change metadata long enough. She compares this to MySQL binlogs: if binlog retention is too short, once a consumer is down too long, the log will already have been trimmed by the time it restarts, forcing a full re-run of the entire database. Data lake formats today rarely provide strong semantic guarantees around "change log retention" either, which makes recovery and replay fragile.
3. No "consistent, standard consumption interface." Today users often have to understand the details of Delta and Iceberg themselves, write their own readers, and handle their own scheduling and error recovery. She believes this should be abstracted away by products like ClickPipes or Debezium, which provide the same CDC interface regardless of whether the underlying format is Delta or Iceberg, so users don't need to understand those spec differences.

In her view, these three gaps — global ordering, durable retention, and a standard interface — all naturally fall to the "catalog layer" to solve, i.e., the layer that manages all the objects in the data lake (Hive Metastore/Unity Catalog/various catalog services). She hasn't seen much public discussion of this yet, but this is her inference about how things will evolve: cross-cutting semantics like cross-table ordering should be provided by the catalog, not just by the table format itself.

Finally, she answers the title question, "Are we there yet?" Her conclusion: not yet, but already "past the halfway point." The change-tracking primitives in Delta and Iceberg are both evolving, and a lot of very smart people are pushing the specs in a CDC-friendly direction. What will truly make this "mainstream" is a consumer layer like ClickPipes, which packages up version management, error recovery, and format details so that ordinary users don't need to be big data engineers to do data lake CDC. At the end of the video she also mentions that ClickHouse is building these capabilities and the team is hiring.
