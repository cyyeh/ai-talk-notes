---
title: Beyond the API: Modern Inference for Modern Workloads
speaker: Panel: NVIDIA, Together AI, Modal
video: https://youtu.be/B3axq9qPOVw?si=07Ix9vFeqJcFh0RB
---
This video is a panel discussion on "modern inference infrastructure," focused on telling application-layer developers how to understand and use model inference today, under the pressures of RL, agents, multi-model composition, and cost.

Main themes and takeaways

The moderator opens by admitting he "doesn't understand inference systems," and brings in frontline practitioners from NVIDIA, Together AI, and Modal to answer what application developers really need to know right now:

- Why everyone is talking about "fine-tuning" again — it's just been renamed RL or model shaping.
- How to use smaller, specialized models to push cost and latency down to acceptable levels.
- Who should own model routing (the logic layer that picks which model to use) — the cloud inference provider, or the application developer?
- Why demand for inference compute is growing far faster than supply, and why that gap may persist for years.

The core message: inference is no longer as simple as "calling an API" — it's a whole systems-design problem, spanning model selection, fine-tuning strategy, token efficiency, and the split between cloud and local inference.

1. Fine-tuning isn't dead — it's just wearing a different outfit

Right at the start the video asks: "Is fine-tuning dead?"\
The panelists' consensus: no, it isn't — it now mostly shows up as RL or the broader idea of model shaping.

- The traditional image of "LoRA fine-tuning, throw in a batch of labeled data" was just an early version.
- Now it's more about "using RL to improve the model in real environments" — for instance, repeated interaction inside an agent sandbox to collect reward signals.
- NVIDIA says its NeMo / Neimotron line hands weights, datasets, and tools directly to customers so they can fine-tune for their own domain (document understanding, internal enterprise documents, and so on).

Why fine-tune at all?

- Frontier models are "extremely strong generalists," but in a specific vertical (your own domain) they don't necessarily beat an open-source model that's been specifically fine-tuned.
- Customers typically have their own datasets and internal evals; after fine-tuning an open-source model, they can beat frontier models on their own metrics, at a lower cost too.

Together AI lumps supervised fine-tuning and RL together under the term "model shaping," for this reason:

- You're not rebuilding a foundation model — you're compressing "the intelligence you actually need" into a smaller, better-suited model.
- This delivers two big benefits: a better user experience (more on-point responses) and lower latency (small models run faster).

2. Small, specialized models: why they beat one giant brain

Take Decagon's customer-service workflow as an example:

- A full workflow has many steps, and if every step calls a massive model, latency blows up.
- Compressing the "sliver of intelligence" each step needs into a small model lets you fit more steps into a fixed latency budget, which makes for a better experience.

This leads to an important idea:

- Don't just think "one giant model handles everything" — instead, assemble a complex agent out of multiple specialized small models.
- In practice, many companies end up barely using "vanilla models" at all — every model has been fine-tuned to some degree.

3. Model routing: the application developer's responsibility, and moat

The moderator asks: "Going forward, who owns model routing — the inference provider or the application layer?"\
Together AI's answer is direct:

- The closer you sit to the domain, the more you should — and the more likely you are to — get routing right. That's also the application developer's moat.
- Inference platforms are very "general-purpose," facing a mix of every kind of workload, which makes patterns hardest for them to read.
- It's actually the teams building the specific product, holding the real usage context and data, who are best positioned to break the task down, define what capability each step needs, and then choose or train the right sub-model.

It makes economic sense too:

- You can start out with the biggest, most expensive model.
- As your understanding deepens, break the requirement into multiple sub-tasks and swap the original large model for smaller, fine-tuned ones.
- The gap in per-token price between the two becomes your long-term cost advantage, and know-how that's hard for anyone else to copy.

4. How do you pick a model? Don't get hung up on a few leaderboard points

With so many models on the market now, the moderator asks: "As an application developer, how do you actually choose?"

A few practical suggestions:

- For most teams, pick a model that looks solid on public benchmarks and has good community word-of-mouth, and stick with it for a while — don't chase the extra 2-3 points that show up on the leaderboard every day.
- As long as your model-shaping pipeline is well designed, swapping the base model down the road won't be as painful as migrating from Postgres to Oracle — it'll feel more like a small backend refactor.
- Public benchmarks and your own private evals are usually "correlated but imperfect" — fine as a starting filter, but in the end you still need to run your own tasks.

They stress that today's open-source / open-weight models are actually "more swappable" than traditional infrastructure:

- Many startups have already built a pluggable multi-model layer: testing a new model just means wiring up one more backend and running a week-long experiment.
- This kind of "swappability" is the new normal now that infrastructure and tooling have advanced.

5. Token usage is exploding: agents are the main driver, and supply can't keep up with demand

The middle-to-later part of the discussion covers the growth curve of token usage:

- By rough estimate, token usage has grown roughly 10x from last year to this year.
- Informal surveys suggest most of that growth comes from coding agents.
- But engineers who have truly "fully adopted coding agents" may be only 5-15% of the total.

What does that mean?

- The current growth is just the effect of a small slice of developers changing their behavior,
- and if the same long-horizon agent pattern extends to other knowledge work (finance, content production, video production, operations...), demand will climb several more orders of magnitude.

What about the supply side?

- Nearly every inference provider has suddenly had its compute "sucked dry" this year — everyone has undershot demand.
- Even accounting for every kind of efficiency gain (better hardware, better kernels, architecture optimization), compute supply is unlikely to catch up with demand growth for at least the next three years.

In other words: pricing pressure on tokens and the need for serious cost optimization will be the norm for years to come.

6. Token efficiency and systems design: whose job is it to save tokens?

The NVIDIA panelist adds an important angle:

- Take Neimotron Omni's video-understanding use case — video eats up an enormous number of tokens,
- so they've invested heavily, at both the model and system level, in token compression/reduction techniques so the same video can be represented with fewer tokens.

The moderator contrasts this with the era of prefix caching:

- At first nobody understood caching; later people learned to design prompts and request patterns so they wouldn't bust the cache every time.
- Now it's a higher-level question: "How should the whole system be designed to save tokens architecturally?"

The division of labor between the two sides is roughly:

- Application/agent developers:

▫ Avoid unnecessary multimodal input (don't turn everything into image or video input unless you need to).

▫ Avoid unintentionally busting the cache (e.g., prepending something different to the system prompt every time).

▫ Understand basic "inference performance" common sense, the same way you'd know to use an index in a database.

- Inference providers:

▫ Provide better caching, test-time compute scaling (generating multiple times per prompt plus a verifier), and more efficient kernels, engines, and scheduling.

▫ Can even package most of the performance tuning into a plan that guarantees "X tokens per minute, with a certain latency and tail latency," and sell it as such.

In summary, saving tokens is a shared responsibility, but the split is different:

- domain-specific decomposition and agent workflow design sit mainly with the application side;
- the core inference engine and hardware utilization sit mainly with the provider side.

7. Cloud vs. local inference: right now is the "most cloud" moment there will ever be

The later part of the discussion turns to Apple / local inference:

- Small open-source models and efficient inference engines now let many models run on a Mac, a PC, or even a phone.
- The NVIDIA panelist himself runs Neimotron Omni on a MacBook using LM Studio.

Modal's view is:

- Right now is actually the moment when inference is at its "most cloud-centric," because all of this grew out of HPC and massive training runs.
- But over the long run, inference will increasingly spread out onto all kinds of local devices and small chips,
- with data centers still handling heavy, batchable work that needs deep integration;
- while everyday interaction, low latency, and privacy-sensitive inference will happen a lot at the edge / locally.

In their words:

- Looking back 40 years from now, today's idea that "all inference happens in the data center" will seem as quaint as punch cards.

Overall, this video offers a view that's both high-level and highly practical:

- Fine-tuning (including RL) is once again taking center stage, especially in the agent era.
- The real competitive edge is knowing how to decompose problems, select and shape models, and design routing and eval pipelines — not merely "knowing how to call an API."
- Token demand will keep surging for years, with supply unable to keep up, forcing everyone to optimize efficiency at the model, system, and economic level all at once.
- Cloud inference remains important, but over the long run, local and edge inference will take up an ever-larger share.
