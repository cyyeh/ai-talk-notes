---
title: Inference for Async Agents in Production
speaker: Meryem, Doubleword
video: https://youtu.be/kfn0khygHYQ?si=bSZS3TSaHRZSfbDo
---
This talk explains that making long-running, asynchronous AI agents run reliably and well under controlled cost comes down to breaking apart and optimizing the "token problem."

The speaker's core argument

Meryem starts by noting that models have gotten much stronger, so we're now willing to let agents run long tasks on their own — 30 minutes, 6 hours, even weeks in the future — no longer just short chats or autocomplete. This kind of long-running agent unlocks new applications, but it also causes inference pressure to explode.

She frames this pressure as a "token problem": = number of tokens used × average cost per token. Long-running agents strain both sides of that equation.

From chat to long-running async agents: how the inference workload changes

The first half of the talk contrasts traditional chat with long-running agents:

1. Token volume explodes From single-turn conversations of a few thousand tokens to long reasoning chains, loops, sub-agents, and multi-turn tool calls that accumulate several orders of magnitude more tokens.
2. Context is no longer fixed — it grows monotonically Traditional system-prompt length was predictable; now an agent stuffs its entire prior history back in at every step, so context keeps growing, only occasionally compressed via a "compaction event."
3. Tool calls become messy and unpredictable It used to be no tool calls, or a small, fixed pattern of them; now it's a long-running, multi-sub-agent, multi-branch, chaotic flow where you can't know in advance which tools will be called, or how many times.
4. Wall-clock time stretches to hours or even weeks From a chat interaction lasting seconds or tens of seconds, to agents running 30 minutes to 6 hours, and eventually agents that work continuously "like an employee." This makes overall inference cost and capacity planning completely different.

The conclusion: together, these factors make inference complexity and cost rise non-linearly, and inference providers (labs like Doubleword) face triple pressure from cost, rate limits, and compute supply.

Abstracting the problem as a "token problem"

She distills the technical challenges of long-running agents into three surface symptoms that are all, underneath, variations of the token problem:

- Cost: token count, context length, and run time all go up, and the bill gets scary.
- Rate limits: when many branching agents/sub-agents run in parallel, it's easy to hit API rate limits.
- Compute: GPUs themselves are expensive and hard to source; sustaining this volume of inference becomes the bottleneck.

The rest of the talk is about how to simultaneously lower both "token usage" and "cost per token."

Lever one: context management (controlling token count)

This section is about how to "control how many tokens an agent uses," especially context.

1. Keep context "small"

She offers three concrete approaches:

- Compaction (compress/summarize) After letting context grow monotonically for a while, do a big compression: use summarization, remove redundant information, and condense the history into a shorter representation. Citing an Nvidia chart and an Anthropic blog post, she notes that in practice you can achieve over 80% compression with almost no drop in accuracy. The key is doing it regularly, and doing it smartly.
- Tool result clearing (dropping useless tool results) There are lots of tool calls, but maybe only 10–20% of the results actually contribute to the final outcome. The rest can simply be removed from context in a later turn, as another form of compression.
- Memory (moving state to cold storage) Instead of keeping the entire history in the prompt, put it into an external memory system (a database, vector store, etc.) and query it when needed, keeping only the fragments necessary for the current step in the "hot" context.

2. Use caching to avoid paying twice for the same thing

She also discusses caching: for large prompts, a repeated prefix can use a cache instead of being recomputed from scratch every time.\
Done well, according to Anthropic's numbers, this can cut cost by roughly 80% with almost no impact on quality.

She emphasizes two points here:

- You need to carefully design which tokens are worth caching and which aren't.
- Different providers/inference engines support caching differently, so the actual savings will vary.

Lever two: model choice (lowering cost per token)

Next she discusses "how to make each token itself cheaper," with a focus on open-source models.

1. Open-source model quality is now close enough

She cites a comprehensive benchmark from Artificial Analysis:

- Proprietary models are still slightly ahead, but the gap has narrowed a lot.
- For example, one open-source model, Kimi / Kimiko 2.6, already beats Claude Opus from a few months ago on overall score. So if "Claude Opus from a few months ago" was already good enough for your business needs, today's open-source models probably are too.

2. What matters more is the "price/intelligence" trade-off curve

She shows an intelligence-vs-price chart:\
The upper-left corner — high intelligence plus low price — is mostly occupied by open-source models. In other words, if your goal is "more reasoning capability per unit of cost," open-source models are often the better choice.

3. A real example: a PR review agent

An internal Doubleword example:

- They have a long-running PR review agent that uses an open-source model (e.g., Kimi).
- They also have GitHub Copilot, which uses OpenAI's most frontier proprietary model.

Approach:

- Even though the open-source model has a lower "raw intelligence score," because tokens are much cheaper, they gave the PR agent a much bigger compute budget:

▫ More context (a wider swath of the codebase)

▫ More research/lookups

▫ Longer reasoning time

Result:

- The PR agent's overall performance — finding issues, adherence to internal coding standards — was clearly better than Copilot's.
- Yet it cost roughly 17x less (compared to doing the same job with GPT-3.5).

She uses this example to make the point:\
Even with a somewhat weaker model, as long as tokens are cheap enough, you can spend more compute to push overall results higher — even surpassing a stronger but expensive black-box model.

Lever three: inference stack design (end to end, from hardware to API)

The final major section looks at "how to design the inference stack" from an infra/provider perspective, to push the per-token price down even further.

1. You can't have "ultra-low latency" and "ultra-high throughput at ultra-low cost" at the same time

She first sketches a typical trade-off:

- One end is high throughput/low cost, but with higher latency.
- The other end is low latency/high interactivity, but at higher cost.

The key judgment call:

- For "long-running async agents," you don't need to be at the "highly interactive, low-latency" end, because no human is sitting in front of a screen waiting for six hours.
- In this scenario, what actually matters is: high volume, low sensitivity to latency → you should prioritize lowering cost and raising throughput.

Her example: "the same model (e.g., Kimi/Kimiko 2.5), under different inference implementations" can range in per-token price from $4.57 down to $0.15 — a huge gap. That's purely a result of stack design and trade-offs.

2. How each layer of the stack can be optimized for "high throughput, low cost"

She sweeps across several layers:

- Hardware layer

▫ Don't pick the "extremely fast but extremely expensive" chip (e.g., certain specialized accelerators) — use something with a better cost curve, like Nvidia/AMD.

▫ You don't necessarily need the newest-generation GPU; when latency sensitivity is low, an older, cheaper card can actually be more cost-effective.

▫ Exploit GPU arbitrage: spot instances, timezone differences (e.g., idle Japanese compute at night serving U.S. customers), and so on, to squeeze hourly cost to the minimum.

- Model layer

▫ Choice of model size, quantization, etc. — trade a smaller or compressed version for more throughput.

- Inference engine layer

▫ Mainly relying on larger batch sizes and various parallelism strategies to push GPU utilization up.

- Scheduling/orchestration layer

▫ In a high-throughput regime, the goal is 100% GPU utilization.

▫ Very different from a low-latency scenario (which needs headroom reserved for traffic spikes).

▫ You can schedule across multiple regions and machines to smooth out the overall demand curve, keeping every card as fully loaded as possible.

- API design layer

▫ A long-running agent doesn't need a traditional chat-completion-style API — you can design an interface better suited to background/responses/async patterns, paired with batch and scheduling optimization on the backend.

Designing the whole stack this way can achieve cost savings on the order of "roughly 94% cheaper than Anthropic" (she shows a slide with the comparison).

Doubleword's product positioning (briefly)

She has a slide explaining how Doubleword productizes this trade-off:

- Instead of offering just one endpoint, they offer multiple endpoints, each with a different cost/latency curve.
- Customers can choose based on their specific use case: for example, open-core, background agents use the async endpoint and enjoy low price, high throughput; interactive interfaces choose the highly interactive, low-latency endpoint.

Closing TL;DR

She wraps up with a few final points (also the thesis of the talk):

- Async/long-running agents will become a mainstream workload, and their inference characteristics are very different from traditional chat: enormous token usage, but insensitive to real-time responsiveness.
- The whole problem can be abstracted as a token problem: ‎⁠number of tokens × cost per token⁠.
- You can control token count through aggressive context management (compaction, clearing useless tool results, external memory, cache).
- Open-source models are now "good enough," and are often better than proprietary models on "intelligence/price" ratio, letting you trade cheap tokens for more compute and better results.
- In async, long-running scenarios, you can design the inference stack by "trading interactivity/latency for high throughput and low price," optimizing everything from hardware to API around that.
- The cheaper inference gets, the more "test-time compute" you can give an agent, unlocking stronger, smarter long-running systems — which is exactly the direction Doubleword is betting on.
