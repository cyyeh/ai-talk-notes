---
title: Build Trustworthy LLM Apps Powered by Agentic Evals
speaker: Meta
video: https://youtu.be/XZwbeuwZxSk?si=0HWAVCgPYm9Np6OV
---
This video explains how to use "agentic evals" to build trustworthy LLM agent systems. The key point: relying on a gut feeling of "looks good to me (LGTM)" is nowhere near enough — you need a rigorous, repeatable evaluation and monitoring framework.

The talk opens by explaining that the traditional analogy of eval as "unit tests / integration tests" isn't enough. Agents are non-deterministic, probabilistic systems with a huge behavior space, and they call all kinds of external tools and APIs — so eval's role is really more like a whole "observability and control layer" that simultaneously measures capability, reliability, safety, and cost.

He then lists several key problems you're bound to hit once agents actually go into production:\
non-determinism (the same input yields different results), hallucination (making up answers), tool-call mistakes and edge cases, error accumulation over long task chains, stale or conflicting information in memory systems, and "blast radius" (how much real damage an agent can do to money, data, or safety once it goes wrong).

Mapped against these problems, he shares a set of "engineering-practical" mitigations.\
For non-determinism, for example, pin the seed where feasible, lower the temperature, and use structured outputs (JSON schema, typed objects) to make part of the behavior predictable.\
For hallucination, he stresses teaching the agent to say "I don't know," and requiring citations wherever possible, paired with RAG and adversarial datasets (designing protocols that don't actually exist, to test whether the model will make things up).\
For tool use, borrow classic distributed-systems lessons: idempotent design, bringing in the saga pattern to handle "cancel/rollback," and strict argument validation, so the agent doesn't go "wildly repeating actions" on high-risk tasks like payments or booking.\
For error accumulation over long tasks, he suggests treating the agent like a collaborating colleague: plan in segments, iterate in the short term (a plan-act-observe-replan loop), rather than planning one extremely long process up front.\
For memory, clearly layer it (long-term/short-term, org-level/individual-level), track provenance/lineage, and set a TTL on certain memories, so stale information doesn't contaminate behavior over the long haul.

On the eval process, he stresses how important "scientific record-keeping" is: every evaluation should log the system prompt, model version, sampling parameters, and provider (the same model served through different cloud API providers can genuinely perform differently), and test scenarios should be designed around all kinds of unhappy paths — missing or conflicting memory, a tool partially down, an API 429, insufficient permissions, and so on.\
Beyond that, metrics can't just be success/failure rate — you need visibility at the step level, plus the number of tool-verification calls, the hallucination rate, and ultimately "cost per successful task."

He then places the "beating heart" of eval on the grader, of which there are three kinds: programmatic, model-based, and human.\
Programmatic graders (static analysis, linting, string/regex checks) are cheap and highly deterministic, and should be used as much as possible to catch obvious mistakes early.\
Model-based graders (LLM-as-a-judge) handle the dimensions that are hard to formalize in code, such as how coherent or concise a response is, or whether it cites sources correctly. But this creates a circular-trust problem of "using an LLM to grade an LLM," so it needs careful design and calibration.\
Human graders are reserved for highly sensitive or highly context-dependent domains (medicine, law, differences in regulation across jurisdictions); only by tuning the model grader's rubric against human-labeled results can you keep things reliable at scale.

In the second half he introduces Meta's open-sourced GAIA 2 / ARE (Agent Research Environment): a set of benchmarks and a framework that simulates a "super-capable agent" in the real environment of your own computer. It's built with around ten different universes — tasks like reading email, messaging, shopping, hailing rides, renting housing — letting you evaluate an agent in a setting that approximates real, multi-app, multi-tool use.\
This benchmark's distinguishing feature is that, beyond traditional search/execution ability, it also adds dimensions like timing, adaptability, and handling ambiguity — timing especially: for example, having the agent track price changes on an Amazon product and trigger an action at a specific moment, testing its time-awareness and its response to a changing environment.

He also demonstrates a complex task inside these universes: something like buying gifts for friends, where you first have to confirm everyone's size and color preferences, handle conflicts and changes, and then place the order. These scenarios are modeled as a DAG-like agent runtime graph, where the pink/maroon nodes are "oracle events" — a series of "mini ground-truths" used, as the agent executes, to check whether it's staying on the right trajectory.

In his closing summary, he stresses: what makes an agent genuinely trustworthy isn't any single model or any one prompt hack — it's an entire systematic eval and monitoring framework, covering non-determinism control, hallucination prevention, tool safety, memory management, rigorous graders, and benchmark environments that approximate the real world. Only then can agents safely move into zero-error-tolerance domains like healthcare, finance, and law.
