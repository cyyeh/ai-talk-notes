---
title: Great Infra for Background Agents
speaker: Sail
video: https://youtu.be/Gpjr-PlehnQ?si=vZMyVeLeKeBrNjsO
---
The core point of this talk, "Great Infra for Background Agents | Sail," is about how, if AI agents are going to run autonomously in the background for long stretches of time, today's inference infrastructure needs to be thoroughly rebuilt — shifting from "fast responses for humans" to "high-throughput compute for machines."

What is this video about?

The speaker starts by dividing the evolution of language models into three stages: first, chatbots for human conversation, where "being interesting" was enough; then, reasoning models willing to spend more tokens in exchange for better reasoning ability; and now, agentic inference, where models can repeatedly call tools and take action — in other words, "reasoning agents that get things done themselves."

He stresses that we're currently stuck in a "slow and painful" middle ground:\
Agent tasks are getting more and more complex, routinely taking 5–10 minutes to run, while humans just sit there waiting for the result; if you want to speed it up, it costs a lot of money. The real breakthrough will come from stretching task duration out to hours, or even a full day or more, so that humans can hand off work to an agent the way they'd delegate to an employee — "give it to the agent, let it go do its thing, and I'll go to my meeting / head home" — instead of staying glued to the screen the whole time.

From chasing latency to chasing throughput

He breaks inference infrastructure down into six layers, from the data center, chips, kernels, and inference engine up to the top-level API. His core point: every layer must pick one of two priorities — latency or throughput — you can't optimize for both at once.

In the past, cloud APIs like OpenAI's and Anthropic's were mostly designed for "answer inference":\
a human is waiting for the answer, so everything is optimized for low latency:\
data centers positioned close to users, long-lived HTTP connections with streaming output, GPU kernels optimized for single-token autoregressive generation, expensive high-bandwidth memory (HBM), and so on.

But if you want to support long-running, background, multi-agent tasks, you should go all-in on "throughput-first" instead. He gives some examples:

- API layer: an asynchronous interface like OpenAI's Responses API is key — you submit a request and wait for the result via webhook or polling, with no more guarantee of a second-level response; instead it's "done in minutes, or even hours."
- Routing layer: instead of following the user's location, it goes wherever compute is available and wherever off-peak electricity is currently cheap, letting inference tasks run their course by hopping around the globe.
- Inference engine and kernels: designed for large batches, parallelism, and high GPU utilization, willing to sacrifice tokens/sec on a single request in exchange for overall throughput and cost advantages.
- Data centers and power: future buildouts will follow "where clean, abundant power is available" rather than where network nodes are; tokens don't actually take up that many bytes when transmitted across a network — the real scarcity is power and power-distribution capacity.

He says that by choosing "throughput-first" at every layer, Sail can offer the same models roughly 5–6x cheaper than mainstream "latency-optimized" providers, with the goal of making tokens "truly economically abundant."

Parallel intelligence matters more than "single-thread IQ"

Sail's philosophy is: rather than chasing an ever-smarter single model, it's better to solve problems with large numbers of parallel agents.\
In other words, instead of having one agent spend a long time thinking step by step, spin up a swarm of agents to explore different paths simultaneously, try multiple times, and then judge afterward which path was best.

This is especially powerful in a few scenarios:

- Deep research / browsing: when facing a document corpus in the hundreds of thousands, the hard part isn't "comprehension" — it's "being willing to actually get through enough documents." What you need is a very "diligent" agent, not a genius.
- Code review: code is static, so you can have a swarm of agents scan it and hunt for bugs in parallel, as long as you can afford the tokens.

They validated this "many agents + abundant tokens" approach using a benchmark like Browse Comp+, which requires finding answers across 100,000 documents, and achieved the best score among open-source models that month. They believe this is the pattern of the future: the returns from a model's raw "intelligence" are leveling off, and the real bottleneck has become scale and token volume.

Beyond inference, agents also need "computers" and sandboxes

The speaker goes on to say: for agents to actually handle tasks like complex software development, the model alone isn't enough — you also need large numbers of elastically startable/stoppable cloud sandbox environments (cloud computers).

So Sail built a sandbox API (currently in private beta), with these key features:

- It can spin up large numbers of independent sandboxes with fast snapshot/resume.
- Most importantly: whenever the agent is just "waiting on an inference result," the sandbox can automatically sleep and isn't billed — you only pay when it's actually executing.

They demoed a case where a swarm of agents was asked to implement a "wire-compatible Redis clone" within 24 hours. The process consumed a lot of compute, but thanks to the "sleep the sandbox during inference" design, total cost was theoretically cut by around 40% (roughly a 2x efficiency gain).

This is possible because they control both sides — GPU inference and CPU sandboxes:\
an agent is either "thinking" on the GPU or "acting" in the sandbox, never running both at full speed simultaneously. Once you see this pattern, you can build very fine-grained scheduling and resource allocation, evicting memory pages, KV caches, and the like that aren't needed at the moment, to maximize resource utilization.

Chips and the second half of Moore's Law

He then turns to chips and process technology:

- He's bullish on "high-throughput inference chip" competitors outside of Nvidia, arguing that inference workloads are now well understood, making a good AI inference chip no longer a mysterious art — many companies have already mastered similar approaches.
- Nvidia will likely maintain its edge in "low-latency, multi-card training" long-term, but the "pure inference, high-throughput" segment will see a lot of competition — for example, AMD, which emphasizes standard networking (Ethernet), chiplets, and similar approaches, using cheaper process nodes and higher-density compute stacking to trade for better price-performance.
- With Moore's Law slowing down, gains in performance/power from new process nodes are limited, and building new fabs is extremely difficult — he predicts more people will turn back to older but stable process nodes to add chip supply for "non-cutting-edge" inference, since it's still a good deal even at a 50% cut to peak performance.
- Paired with chips like this, future data centers will more often be tied to large amounts of renewable energy (wind, solar) in remote regions — even extreme ideas like "space data centers" may show up, because what's truly scarce is accessible power, not the speed at which bits move across a network.

Final summary and vision of the future

At the end of the video, he sums up a few key points:

1. In the future, most tokens will be "generated by machines, for machines," with humans only stepping in at a handful of decision points and outcomes, rather than watching over every step of reasoning.
2. As a result, the entire stack — from power, data centers, and chips, to kernels, inference engines, and APIs — will be redesigned around "high throughput and efficiency," rather than simply chasing latency.
3. In this world, efficiency and scale matter far more than "the speed of a single request."
4. Companies that can vertically integrate across all six layers, controlling both inference and sandboxes (action) in one unified system, will have a huge advantage, because they can squeeze the most useful tokens out of the same power and chips.
5. Sail's mission is to build exactly this kind of inference infrastructure — designed for background agents, spanning "silicon to API" — to make large-scale, long-running agents economically viable.
