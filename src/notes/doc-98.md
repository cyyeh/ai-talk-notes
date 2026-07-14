---
title: Your Agent Failed in Prod. Good Luck Reproducing It.
speaker: Tisha Chawla & Susheem Koul, Microsoft
video: https://www.youtube.com/watch?v=Lc8zRh9muoY
---
This video addresses a core problem: when an AI agent fails in production, it's almost impossible to "reproduce that specific failure," which makes real debugging very difficult — and they use a "record & replay" pattern to solve it.

Main thread of the talk

The speakers start by describing a typical scenario:\
In production, an agent calls the wrong tool, miscalculates a number, and corrupts critical data. Afterward, you pull the prompt from the logs at that moment and rerun it locally with the same model and the same prompt — but it keeps "working just fine." The exact run that actually hurt you can never be reproduced again, so there's no way to really debug it or guarantee it won't happen again.

Many teams' first reaction is to set temperature to 0, assuming that will make the model fully deterministic. The video says this is a myth:

- Temperature 0 just means "take the argmax at every step" — it doesn't guarantee the underlying logits are actually identical.
- GPU floating-point arithmetic, the order of matrix operations, batching, Mixture-of-Experts routing, and so on can all cause different outputs even at temperature 0.
- So "pursuing bitwise determinism (same input → same output)" is nearly impossible in a cloud-hosted model environment, and may not even be what you actually want, because randomness itself is what gives the model room to explore and be creative.

Their proposal: the goal shouldn't be making the model's decisions bit-level controllable, but making "the execution path from the incident" fully replayable, so it can be used for debugging.

- Bitwise determinism: the same input always produces the same output — this is about controllability.
- Replayability: being able to re-verify a run that "already happened," letting you walk back through the entire execution step by step for observation and debugging — this is about observability.

The overall point of the video is: stop fixating on making the model itself deterministic, and instead build systems that can "record" the agent's actual execution so it can be "replayed" later.

Stock agent incident example

They demonstrate with a stock-trading agent:

- The user says: "Sell $1,000 worth of stock for me."
- The agent doesn't first work out dollar amount → share count — instead, it directly treats ‎⁠1000⁠ as the "share count" and puts it into the tool's ‎⁠quantity⁠ field.
- Assuming the stock is $190 a share, that becomes 1000 shares ≈ $190,000 — a $1,000 request turning into a $190,000 disaster.
- Worse still, the broker API quickly returns 200 OK with no exception at all — the dashboards look all green, and the error is completely undetectable.

This example highlights that:\
traditional observability (status codes, error rates, latency) all look normal, yet it's a serious error in "business semantics." You want to reproduce that broken execution flow, but you can't.

Key concept: Record & Replay, from "network-layer logs" to "logical boundaries"

Their proposal is to "record at the logical boundaries of the agent flow," rather than just capturing request/response at the network layer:

- Many agent behaviors never touch the network at all — local retrieval, in-process tools, memory operations, and so on — and if you only log at the HTTP layer, you can't see any of it.
- The right place to record is at the method boundary of every node — that is, "the input entering that step, and the output it produces."
- Think of the whole agent run as a graph: each node might be:

▫ An LLM call

▫ A tool call

▫ A RAG retrieval

- You draw a "boundary" around each node, recording:

▫ This node's input

▫ The output the node produces

▫ Relevant metadata: model version, sampling parameters, code build ID, RAG chunk version, and so on

With this kind of append-only event log, you can later "replay" that run without ever calling the model again, and pinpoint exactly which node started corrupting the state.

Chronicle / Boundary: implementation and demo

They demo their own PoC system, Chronicle, whose core is exactly the boundary annotation just described:

- Any method (tool, LLM call, RAG, other business logic) can be annotated with a boundary.
- That boundary will, "at execution time, record the method's input, output, and any metadata you specify (such as model version, code version)," all as part of a trace.
- Once an agent session ends, you're left with an entire, "fully recorded execution trace."

In their stock agent example:

- The whole flow is split into three nodes:

▫ ‎⁠plan⁠ (LLM planning)

▫ ‎⁠place_order⁠ (the actual order-placing tool)

▫ ‎⁠finalize⁠ (LLM generates the final reply to the user)

- All three get a boundary added.
- In the run where things went wrong:

▫ You can clearly see that the ‎⁠plan⁠ LLM node produced an incorrect tool call: ‎⁠symbol=ACME, quantity=1000⁠.

▫ The ‎⁠place_order⁠ tool then sold 1000 shares as instructed.

- Through Chronicle, this entire faulty path is "frozen" inside the trace — you no longer just see "which record ended up corrupted," you can trace step by step back to which reasoning step first went wrong.

Using "replay" for testing and protection: Deterministic vs Behavioral Testing

With these recorded traces in hand, the video takes it a step further: how to use "replay" to turn a single incident into a repeatable test.

They emphasize two kinds of testing:

1. Deterministic testing Targets nodes that are inherently deterministic:

▫ Guardrails

▫ Tools (business logic)\
Chronicle fits well here, because:

▫ LLM nodes have already been "stubbed" to use the recorded output (no longer actually calling the model), so there's no more randomness.

▫ The entire agent run feeds each deterministic node with the recorded context, so you only test the piece of code you actually changed.

▫ These tests can be "rerun endlessly without incurring model costs," and the execution path stays exactly consistent. The workflow they demo roughly goes:

▫ Load the trace from the original incident.

▫ Turn on replay mode: most nodes are stubbed out, directly reusing the originally recorded output.

▫ Only the node you just fixed (for example, the order-placing tool) actually runs the new version of the code.

▫ Finally, assert on that node's output, for example:

⁃ This time the order got blocked by the guardrail (no longer selling 1000 shares).\
This way, the same faulty execution path has been turned into a "test case" — every future code change can be verified by replaying it.

2. Behavioral testing Focuses on more subjective aspects of behavioral quality:

▫ Whether the tone is appropriate

▫ Whether the strategic path the agent took makes sense

▫ Whether the overall task was completed\
This part is better suited to evaluation techniques like "LLM-as-a-judge" — for the most part you still need to actually call the model and run statistical evaluation over a dataset.

Their argument is: Chronicle/Boundary's replay is extremely well suited to deterministic testing, freezing a one-off incident run into a "repeatable unit / integration test." The behavioral side is then addressed as a supplementary, separate layer.

A few practical design points / Takeaways

The video closes by summarizing a few practical ideas you can use as a checklist when designing a production agent system:

1. Stop chasing bitwise determinism through the API Given how most cloud LLMs are implemented today (GPU non-determinism, batching, Mixture-of-Experts, and so on), this is practically unachievable — and unnecessary.
2. Know exactly what variables exist for each session, and record them For example:

▫ LLM version

▫ Deployment build ID

▫ RAG chunk version\
These are all critical dimensions when replaying and pinpointing issues.

3. "Record the whole package," not just the prompt That is:

▫ Record the input/output and metadata for every node at every step.

▫ The "semantic-level" execution state of that run needs to be recoverable, not just the HTTP request body.

4. Use replay to debug, then turn the trace into a test First use replay to find which node, and which state transition, went wrong, then:

▫ Fix the guardrail or tool logic

▫ Use that same trace to write a test, so every future change can confirm the same mistake won't happen again.

5. Preserve the randomness in the model's generation — don't lock temperature down just to "look stable" Randomness is the source of an agent's ability to produce diverse solutions and explore the space. The right approach is to provide guardrails and tests at the behavioral level, and complete record & replay at the observability level, rather than reducing the model to something rigid and static.

Overall, this video is conveying a conceptual shift:\
rather than trying to turn LLM agents into traditional, "fully controllable" deterministic systems, it's better to accept that there will be underlying uncertainty, and instead use system design (boundary record & replay, trace → tests) to build an agent execution environment that's observable, replayable, and continuously improvable.
