---
title: Agents will need trillions of databases. Let's give it to them!
speaker: Turso
video: https://youtu.be/0FNoeIvx1K4?si=Txf0jZ8hulcI3wpE
---
This video argues that AI agents are going to need a "trillion-scale" number of databases, and Turso wants to be the infrastructure that makes that possible.

The speaker opens with a historical analogy: it started with "one application + one database," then came microservices, with "tens to hundreds of services + tens to hundreds of databases" — the count grew, but was still fairly modest. Yet every technological turning point (like going from a single transistor to a CPU with billions of them, from physical servers to the cloud to Kubernetes, and on to sandboxes that spin up in milliseconds) seemed absurd in scale at first, only to prove inevitable in hindsight.

He believes AI agents are driving a similar turning point. Rather than a few big, shared databases, it looks more like an explosion in the sheer number of small databases:\
every agent has its own state, memory, environment settings, chat history, context index, and so on. A lot of this is currently propped up with plain markdown files, but the moment you bolt a query API, local/cloud sync, and security controls onto those files, you're effectively reinventing a database. His predictions:

- agents will automatically spin up and tear down huge numbers of apps and sessions;
- every small app / session / agent / "vibe-coded" application will be tied to one or more of its own databases;
- this naturally leads toward a "trillion-scale" number of databases.

He then raises a key fact: SQLite already has roughly a trillion databases out in the world — inside phones, inside browsers, embedded in all kinds of applications; every single ‎⁠.sqlite⁠ file is its own independent database. In other words, "trillion-scale databases" isn't some future state — it has already happened, just at a scale so small and invisible that no one noticed.

The problem is that while SQLite has a "perfect shape" (a single file, ready to go instantly, embeddable, small and cheap enough), it no longer fits several requirements of modern and agentic use cases:

- A fully synchronous API (‎⁠sqlite3_step⁠ is blocking), which drags down the experience in a browser or whenever you need to span storage backends (e.g. partly local, partly on S3);
- Only one writer is allowed at a time, so concurrent writes get a busy error — impractical for the multi-threaded, scattergun write workloads typical of agents;
- Some modern features are missing (like native vector search, strong typing, and connection start-up cost when there's a huge number of tables).

So they built Turso: a full rewrite of SQLite in Rust, compatible with the SQLite file format, but with the modern and agentic capabilities layered on top. Key points include:

- A fully asynchronous design that can run in the browser (WASM), and that can work with modern async I/O like ‎⁠io_uring⁠;
- Native WASM support, so the database can "travel with the agent" wherever it goes, instead of living on a single remote server;
- Multi-version concurrency control (MVCC) to support multiple writers, so throughput can scale roughly linearly with thread count when there's no conflict;
- Staying compatible with the SQLite file format: you can take a SQLite file and open it with Turso, and take a file Turso wrote and open it back up with SQLite — the only catch is that during concurrent writes there's an extra state file, which "folds" back down into an ordinary SQLite file once you commit/checkpoint;
- Adding modern capabilities on top: things like native vector search, materialized views (incrementally maintained), start-up time optimizations for databases with 10,000+ tables, and an experimental strongly-typed mode that can correct SQLite behaviors like happily accepting a string stuffed into an integer column.

He emphasizes that Turso is open source and open to outside contribution, unlike SQLite's model of being "open source but accepting almost no outside contributions" — it already has more than 200 contributors (including some AI coding tools). In their GitHub repo they maintain a ‎⁠compat.md⁠ that itemizes the compatibility status of every SQLite feature; the upcoming 0.6 release will, for the first time, cover all the major functionality (including vacuum and multi-process access) — and while they're not calling it GA yet, it's already good enough for plenty of agent workloads (short-lived, risk-tolerant data), and quite a few people are actually using it in production or "pre-production" already.

Finally, he briefly mentions the commercial Turso Cloud offering:

- It manages and deploys "millions, even tens of millions, of SQLite-shaped databases" for you in the cloud, which you can query over the network just like connecting to Postgres;
- You can also sync a cloud database down to a local device, turning the cloud into a sync touchpoint;
- Right now the online cloud service is still backed by SQLite underneath; the local Turso core will take over in the coming months, bringing capabilities like concurrent writes.

The core message of the whole talk is:

1. AI agents are pushing the number of databases from "single digits, hundreds" up to a scale of "millions to trillions";
2. SQLite's "single-file, instantly usable, cheap" shape has already proven this path is viable;
3. but truly supporting the age of agents means adding modern capabilities — async, concurrency, WASM, vector search, type safety — on top of that shape without breaking it, and that's what Turso is trying to do.
