---
title: Super-Secret Next Big Thing for DuckDB
speaker: Hannes, DuckDB
video: https://youtu.be/O_tzHeDpjrE?si=B2mPeU0adt0oe7sl
---
This video introduces DuckDB's new capability Quack, which turns DuckDB — previously only "embedded, single-machine, single-process" — into a database that can operate client-server.

Hannes starts by revisiting DuckDB's positioning: a friendly, general-purpose data-shaping tool, embedded in all kinds of applications, running analytics locally so you avoid getting your bill blown up every time you reach for the cloud. DuckDB and Duck Lake (their own lakehouse format) have grown very fast over the past year — downloads of the Duck Lake extension have even caught up to formats like Iceberg and Delta.

He then points out a fundamental limitation: DuckDB can connect to all kinds of external systems (Postgres, MySQL, object storage, Parquet...), yet it "can't talk to itself properly" — having multiple DuckDB instances write to the same DB is a real hassle, whether that's several nodes writing telemetry in real time, or several local tools operating on the same database at once. The community has consequently grown a pile of small "DuckDB <-> DuckDB" projects on its own, which shows how strong the demand is.

Quack was built to solve exactly this pain point. It's a DuckDB extension that makes "both sides DuckDB" — one side can ‎⁠serve⁠ a local database so it becomes a server, and the other side connects with ‎⁠ATTACH⁠, treating the remote DuckDB as a schema to query, or uses ‎⁠remote.query(...)⁠ to push a query over for execution and only get the results back. Every type, extension, and feature DuckDB supports can be used through this channel.

Under the hood, Quack is an over-HTTP RPC protocol:\
at the base is TCP/IP, then HTTP on top (to support browsers and make it easier to get through firewalls and add TLS), then DuckDB's own existing internal serialization format above that, transmitting types, data chunks, and so on losslessly, and at the very top a simple set of request/response messages (execute a statement, fetch more results, etc.).

On the security side, authentication and authorization are both pluggable: the official default is a token-based scheme, but you can hook in your own authentication system (like LDAP), implement permission checks, or rewrite query logic via an extension or SQL function.

He also showed performance experiments.\
Using separate client/server VMs on AWS, comparing Postgres, Arrow Flight SQL, and Quack:

- For bulk data transfer, Quack moved 60 million rows in about 5 seconds, versus roughly 3 minutes for Postgres and about 20 seconds for Arrow Flight.
- For small transactions (single-row inserts, multi-threaded), Quack sustained about 5,000 transactions per second; Arrow Flight was weak at small inserts, while Postgres was middling — meaning Quack handles both bulk throughput and high-TPS small transactions well at the same time.

With a protocol like this in place, a lot more becomes possible:\
for example, using Quack to wrap a group of sharded or replica DuckDB instances behind a coordinator node so clients can use them transparently; having edge nodes aggregate locally before pushing to a central node; or connecting straight from DuckDB WebAssembly in the browser to a DuckDB service running on EC2 (the scenario in his live demo), where you can choose to pull the whole table locally or push the query to run remotely to save on data transfer.

Finally, he places this back on the OLTP/OLAP spectrum:\
the conventional picture is Postgres handling OLTP, DuckDB handling OLAP, with a fuzzy HTAP in between. In reality, the truly extreme OLTP systems are things like TigerBeetle, while Postgres leans more general-purpose. Through Quack, along with concurrent work on things like concurrent transactions and checkpointing, DuckDB is moving from pure analytics toward being "more general-purpose" — gaining a set of distributed-deployment and transactional capabilities without sacrificing analytical performance, which widens the range of use cases it can handle.

The core of the whole talk is: Quack pushes DuckDB from a single-machine, embedded tool forward into a distributed-deployment world where instances can "quack" to each other over the network, all while keeping DuckDB's original simplicity and efficiency.
