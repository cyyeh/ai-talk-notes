---
title: The Prompt is the Platform
speaker: Dominik Tornow, Resonate HQ
video: https://www.youtube.com/watch?v=DqtmZE6Hl0g
---
This video discusses a new software engineering workflow for "designing and producing systems with agents," where the core idea is that the product becomes the specification rather than the implementation, and the prompt itself functions like a platform.

1. Why "the specification is the product, the prompt is the platform"

The speaker opens by describing a trend: [0:37]\
In the past, what we reused was "generic implementation" (libraries, frameworks, platforms); in the future, increasingly, this will shift to:

- We reuse "abstract specifications"
- Coding agents then dynamically generate "custom implementations" targeting different infrastructure [1:03]

For Resonate, this means:

- Their real product is no longer a particular server implementation or SDK
- The real product is the abstract, reusable "Resonate protocol/specification" [2:05]
- From that single specification, multiple "target-platform-specialized" server implementations can be generated (for example, a general-purpose version, and versions built in partnership with cloud or infrastructure vendors) [2:22]

So: the prompt (how you describe requirements and specification) becomes the entry point to the platform; the specification itself becomes the reusable core asset.

2. Why going straight from an abstract spec to an implementation fails

They initially tried to have the agent generate "a Resonate server implemented in Rust + Postgres" directly from the abstract specification [5:11], and the result was:

- It could only handle the happy path; basic tests passed
- But it broke under concurrency, process failures, and network failures [5:31]
- It was essentially more like a prototype than a production-ready system

The reason: the "gap" between the abstract spec and the concrete implementation is too large.\
To bridge that gap, they inserted an intermediate artifact: a concrete specification [5:52].

The process becomes:

- Abstract spec
- Human-led, agent-assisted authoring of a concrete spec for a specific target (e.g. Postgres): including schema, indexes, SQL queries, transaction boundaries, etc. [6:16]
- The agent then writes the implementation following this concrete spec [6:28]

While this can produce a production-grade system, it exposes a limitation:\
the agent is only "helping implement," not truly "participating in design" [6:40].\
If the specification itself is meant to be a reusable, sellable product, that isn't enough.

3. Moving the agent "upstream": adding a simulation environment

In the second round (targeting NATS as the platform), they reframed the question: [7:04]\
instead of asking "can the agent build a production system directly," they asked:

- What tools does the agent need in order to first design the correct algorithm, before implementing it?

There were two key changes:

1. Give the agent a repeatable, inspectable, deterministic simulation environment (written in Python) [7:23][12:38]
2. First have it produce a "simulation implementation," not a production implementation [7:31]

This "simulation implementation" isn't the product — it's "executable design" [7:42]:\
it's used to find the correct distributed algorithm under partial ordering and partial failure (concurrency, stale reads, errors) [7:46].\
Once the algorithm is confirmed correct in simulation, the agent then derives a "concrete specification" from that result [7:55], and only then comes the production implementation [8:01].

So the new pipeline becomes:\
Abstract spec → simulation implementation → concrete spec → concrete implementation [8:06]

In this process, the agent is no longer just "a worker who writes code" — it actually participates in, and even leads, the design. [8:17]

4. Why a "minimal protocol + simple primitives" is a precondition

For the agent to work within this pipeline, the protocol itself has to be extremely small and simple.

Resonate spent three years continually asking themselves:\
"Can this abstraction be removed? Can this property be dropped? Can this relationship be decoupled?" [8:35]\
Through repeated simplification, they eventually arrived at a very small protocol built around just two core objects:

- durable promise
- durable task [8:56]

Even so, even a "simple concurrent distributed protocol" still has a very complex state and behavior space [9:04], and implementing it on any concrete platform is far from easy — for humans and agents alike.

He then used NATS as an example:\
Resonate can only use the handful of primitives NATS provides: queues, a versioned key-value store, and delayed/scheduled messages [9:24].\
The design problem becomes: "how do we express the Resonate protocol using only these primitives?" [9:44]

5. Simulating NATS's consistency model: fresh reads and stale reads

They focused on NATS's versioned key-value store to demonstrate where the real difficulty lies: the consistency model.

- Most of the time, reading a key gets you the latest value (a fresh read) [10:11]
- But sometimes you get an older version (a stale read), which is "legal" under that platform's consistency model, not a bug [10:23][10:40]

The system can't only be correct when "the platform's behavior happens to be considerate" —\
it has to be correct under all legal behavior [10:52].\
This means the simulation environment has to faithfully represent:

- Possibly a fresh read
- Possibly a stale read
- Carrying version information, so you can later determine which "world" you were looking at [11:06]

The key point: at the moment you read, you don't actually know whether it's stale —\
you only discover, when you later try to write and fail due to a version mismatch, that what you read earlier was actually the old world [11:21].\
Building an "always-correct application" on top of this model is hard for both humans and agents [11:48].

6. The key to making the agent succeed: deterministic simulation + "forbidden fruit" debug information

The tooling they built for the agent has two layers:

6.1 The deterministic simulation environment itself

They implemented a simulated version of NATS in Python:

- The key-value store keeps the full version history for every key [12:48]
- ‎⁠get⁠ sometimes returns the latest version, and sometimes (controlled by deterministic randomness) returns an older version [12:57]
- ‎⁠update⁠ implements optimistic concurrency control: it only succeeds if the version read is still the latest, otherwise it errors [13:10]

This gives the agent an environment that is:

- Identical to the real platform in terms of correctness-relevant behavior
- Yet reproducible, deterministic, and observable [13:23]

So when the agent writes a buggy algorithm, you can replay the exact same failing trace and have the agent fix it for that specific scenario [13:37].

6.2 The "forbidden fruit information" in the simulation

On a real platform, reading a key-value pair only tells you "this value and its version" — it won't tell you whether it's stale, and won't give you the latest value [14:10].\
Actual production code can't depend on this information, so it isn't visible in production.

But in the simulation, they allow themselves to record this information:

- Every ‎⁠get⁠ emits a trace event,
- recording whether that read was fresh or stale, what value was obtained, and what the "latest value" was at the same time [14:35]

For the algorithm, this is "forbidden fruit": it cannot be used directly to make decisions.\
But for the agent, it's extremely useful debug information that can be used to understand and explain "why an invariant broke" [14:49][15:38].

The result is:

- The algorithm itself only sees legal observations and errors
- The agent, however, sees a much richer trace, from which it learns:

▫ Not just that "an invariant broke,"

▫ but that "the invariant broke because a decision was made in the stale world" [16:04]

This makes "causality" visible to the agent, enabling it to improve the algorithm in a targeted way [16:08].

7. The final workflow and conclusion

With this tooling and process, the agent is able to:

1. First produce a proof-of-concept implementation in the deterministic simulation environment, and validate it through testing [16:22]
2. From that simulation implementation, derive a concrete specification that is "known to have a correct algorithm" [16:33]
3. Then generate the real production implementation based on the concrete spec [16:45]

The whole chain becomes:\
Abstract spec → (agent-led) simulation implementation → concrete spec → concrete implementation [16:53]

In this way, the agent is no longer just writing code at the very end of the chain — it actually participates in design, and even becomes the design driver [17:01].\
The speaker sums it up in one line: the prompt is the platform, the specification is the product, and deterministic simulation is what lets agents truly "move upstream."
