---
title: How Open Frontier Labs Actually Train Their Models
speaker: Sami, Prime Intellect
video: https://youtu.be/JEoG1v62APM?si=OA-yhaQQRsws71Ww
---
This video covers how modern large open-model labs (using Prime Intellect and the Trinity/GLM series as examples) design and train models by trading off between performance, capability, and cost — especially for workloads centered on long sequences, agents, and RL-heavy training.

Main thread of the video

The speaker, Sami (Head of Research at Prime Intellect), starts by briefly summarizing their results, such as Intellect 3's large-scale RL post-training, the Trinity large model built in collaboration with Arcee, and their open-sourced training/RL toolchain. The rest of the talk is devoted to answering one core question:\
If most of today's cost goes into inference, and the use cases involve long sequences, tool calls, and agents, how should the model architecture be designed?

He breaks the question down into two parts:

1. How to push inference from being "memory-bound" toward "compute-bound" to improve efficiency.
2. How the model itself can become more capable without increasing FLOPs per token (sparsification, MoE).

I. Why does inference cost dominate everything today?

Sami worked through an estimate: taking a Kimi-like model as an example, suppose pretraining uses 30T tokens and post-training another 30T, but cumulative usage from online serving could reach the hundred-trillion-token scale. Doing the math, over 70% of total compute cost goes to inference — and it could be even higher for popular cloud APIs.

This means:\
when training, the question is no longer just "how do we make training cheap" — you have to ask from the very start:

What will this architecture's cost and latency look like in real inference and long-sequence agent scenarios?

As a result, many architectural choices (the form of attention, precision, whether to use MoE, etc.) are now made with "future inference cost and latency" as the primary consideration, not just validation-set loss/accuracy.

II. The two phases of inference: Prefill vs. Decode

He splits inference into two modes:

1. Prefill: Ingests the entire input in one go (system prompt, context, tool output, etc.) and runs a single large forward pass.

▫ Similar to training: high parallelism, high compute utilization → compute-bound.

▫ This phase can more easily saturate GPU FLOPs.

2. Decode (autoregressive generation phase): Processes only "previous token → next token" at a time, and is highly sequential.

▫ The entire layer's weights must be moved to the compute unit just to produce a single token.

▫ With small batches, most of the time is spent waiting on memory transfers → memory-bound.

▫ Increasing batch size improves throughput, but doesn't reduce latency for a single user.

So in modern LLM applications (especially agents), the real bottleneck is:\
memory bandwidth and KV cache handling during the decode phase — not raw FLOPs.

III. Common techniques for reducing decode latency

He lists several mainstream optimization techniques and explains the trade-offs of each:

1. Quantization

▫ Lowering weights from BF16 down to FP8 / NVFP4 or other lower precisions.

▫ The goal isn't cheaper training, but rather:\
smaller memory footprint → faster transfers → lower latency in memory-bound scenarios.

▫ But using extremely low precision (like NVFP4) during pretraining makes training less stable, requiring extra handling of numerical instability.

2. Speculative Decoding

▫ A small model first drafts multiple tokens (e.g., 8 at a time), and the large model then verifies them in a batch, overwriting some as needed.

▫ If the small and large models agree on more than half the tokens, it's effectively as if the large model "skipped ahead many steps" at once.

▫ In essence: it uses a small model to turn "moving one token at a time" into "moving multiple tokens at a time," converting a memory-bound workload into something more compute-heavy, which improves both throughput and latency.

3. Parallelization (sharding across GPUs)

▫ Splitting weights across multiple GPUs, each responsible for moving and computing its portion.

▫ Ideally, latency scales down roughly by the number of GPUs, but in practice it suffers diminishing returns due to reduced kernel efficiency, communication overhead, and so on.

Most of these methods focus on optimizing "weight movement," but agent scenarios bring an even bigger problem: KV cache.

IV. Agent scenarios: KV cache becomes the real killer

In pure chat mode (short context), the analysis above still roughly holds;\
but in agent mode — with frequent tool calls, large amounts of code, logs, and long-text input — sequence length explodes.

At this point, a new bottleneck emerges:\
generating each token requires moving not just the full layer weights, but also the KV cache (the attention key/value pairs) of the corresponding length.\
What's more:

- KV cache size grows linearly, or at an even higher rate, with "sequence length × number of layers × hidden dimension."
- Each user's KV cache cannot be shared (everything after the system prompt is personalized to that interaction).
- At the 100K-token scale, the number of bytes that need to be moved for the KV cache can even exceed that of the model weights themselves.

The result:\
as long as the sequence is long enough, you will eventually fall into a regime where "no matter how large the batch is, you're always memory-bound."\
→ GPU cores sit idle while waiting for the KV cache to move through memory — effectively burning money.

So if you're designing a large model for agent use today, the top priority becomes:

How to reduce the size and transfer cost of the KV cache without making the model "dumber."

V. Architectural designs to reduce KV cache: the evolution of attention

He walks through several design approaches in turn:

1. GQA / MLA / Low-rank compression

- Idea: reduce the number of Query/Key/Value entries that need to be stored/moved.
- Approaches like GQA (grouped-query attention) and MLA (multi-head latent attention) aggregate multiple heads or perform attention in a low-rank space.
- Advantage: directly reduces KV cache size, easing memory pressure.
- Disadvantage: if compressed too aggressively, expressiveness drops and the model gets dumber — this becomes a new design dimension that needs to be swept over.

2. Sliding Window / Linear Attention

- Sliding window: each position only attends to the most recent N tokens (e.g., 512), both during training and inference.
- Linear attention (such as the DeltaNet family): replaces the full KV cache with an accumulated state, somewhat in the spirit of an RNN.
- Advantage: KV cache cost now depends only on the window or state size, not the entire sequence.
- But: if the entire model relies solely on sliding windows, it will "forget" important information from farther back, and in practice fails to produce a good LLM.

Conclusion:\
pure sliding-window or pure linear attention isn't enough to support a practical LLM — it needs to be mixed with full attention.

3. Hybrid Attention

- Practical approach: use cheap attention variants like sliding-window or linear attention for most layers, while keeping a small number of layers with full attention.
- Idea:

▫ Most computation only needs "local processing," while a small number of layers handle long-range dependencies and "global integration."

▫ This substantially cuts costs on both KV cache and FLOPs while keeping the model usable.

- For example, in an architecture like Trinity, only a subset of its 80+ layers is given full attention.

This approach essentially "dilutes the unavoidable quadratic complexity down to a small number of layers," pushing back the threshold at which you fall into being "fully memory-bound."

4. Sparse Attention

- Core idea:

▫ Still maintain a KV cache for all tokens, but when actually computing attention, only perform dense attention over the top-K tokens.

▫ K can be learned and selected by the model itself (e.g., GSA: Grouped Selective Attention).

- Result:

▫ It retains the expressiveness of being "theoretically able to attend to all tokens,"

▫ while actual data movement and computation only target a small number of key tokens, bringing the cost close to that of a sliding window.

- He cites an experiment from GLM-5: whether training with full attention or inserting GSA partway through training, the loss ends up nearly identical, but performance improves substantially.

Limitation:

- The KV cache still needs to be fully stored (the memory footprint issue remains) — it's just that "moving it from HBM to the compute unit" becomes cheaper.

Overall, he believes:\
hybrid + sparse attention is currently the most promising direction for agent-type workloads.

VI. After moving from memory-bound to compute-bound: boosting capability with "sparse models"

Once the attention side has become "cheap enough," inference re-enters compute-bound territory, and the next question becomes:

How can the model become more capable without significantly increasing FLOPs per token?

This is where "model-level sparsification" comes in, especially MoE (Mixture-of-Experts):

1. The dilemma of dense models

▫ Scaling laws tell us that bigger models get stronger, but a dense architecture means:\
every extra parameter has to be moved and computed on at every single inference step.

▫ After scaling all the way up, dense models like GPT-3 were already nearing the limits of practicality — any bigger, and they'd simply be too slow.

2. The Expert Sparsity / MoE solution

▫ Split each FFN/MLP layer into multiple "experts," with each token routed through only a small number of them (e.g., top-2).

▫ As a result:

⁃ Total parameter count can be very large (storing more knowledge),

⁃ but the number of parameters actually activated per token stays close to that of a smaller dense model.

▫ GPT-4-class models, and nearly all major closed- and open-source frontier models (DeepSeek and others), adopt this kind of design.

3. Engineering and training challenges

▫ The router can "collapse" (all tokens get routed to the same expert → degenerating into a dense model).

▫ Uneven distribution can overload some GPUs while leaving others idle, requiring special loss terms and load-balancing techniques.

▫ Implementation shifts from "large matrix multiplication" to "many small matrices plus message passing," making compilers, communication, and scheduling all considerably more complex.

4. Success stories: DeepSeek-V3 and others

▫ He mentions a public example:\
roughly 1.6T total parameters, but only 48B "active."

▫ Result:

⁃ Training and inference costs even come in lower than training a 70B-class dense model,

⁃ yet its capacity and expressiveness are much closer to those of a "trillion-parameter" model.

Conclusion:\
MoE / expert parallelism is currently the key technique for boosting capability without blowing up inference cost, and it has become part of mainstream frontier architectures.

VII. Summary: what are frontier labs actually optimizing for when designing models?

Sami finally distills the whole story into two "design axes":

1. Efficient Attention

▫ Drive down the memory cost of attention and the KV cache,

▫ pushing inference toward compute-bound as much as possible so GPU FLOPs can be fully utilized.

▫ Techniques include: GQA/MLA, sliding window, linear attention, hybrid attention, and sparse attention (GSA, etc.).

2. Model Sparsity

▫ Through MoE / expert parallelism, without increasing FLOPs per token,\
substantially increase total parameter count and representational capacity.

▫ This lets the model become stronger and better able to handle complex agent tasks at the same inference cost.

Taken together, today's frontier open labs (such as the Trinity, GLM-5, and DeepSeek families they're involved with) are largely converging on the same direction:

- Massive but sparse models (trillion-scale total parameters, with tens of billions of active parameters),
- Hybrid or sparse attention designs to support long-sequence agent scenarios,
- and every decision is strongly driven by inference cost and latency, rather than just benchmark accuracy.
