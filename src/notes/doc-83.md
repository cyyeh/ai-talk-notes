---
title: The Open Layer: How Open Models, Routing, and Inference Are Reshaping Agentic Engineering
speaker: Panel: OpenRouter, Fireworks, Arcee
video: https://youtu.be/jXyDdSTg7Qo?si=ZxjPPVCdJZPlM_Mo
---
This video is a panel discussion at the AI Council SF '26 conference, on the theme of: in the world of "agentic engineering," what role do open-source/open-weight models, routing, and inference infrastructure play, and what are the practical engineering trade-offs.

What is the video about?

The moderator first sets the scene: everyone's talking about closed frontier models (like OpenAI, Anthropic), but in practice, a lot of "long-running agents" and new applications are built on a hybrid technology stack: open-weight models, multi-model routing, and high-throughput, low-latency inference infrastructure.

A few founders from OpenRouter, Fireworks AI, and Arcee AI then answer several core questions from different angles:

1. What does "open" actually mean now?

Several definitions at different levels are put forward:

- From OpenRouter's perspective, "open" means optionality and substitutability: it's not about using a bunch of models today — it's that you know your needs will change in the future, so you want to be able to switch models or providers at any time, rather than being locked to a single closed API. It also includes openness of data, such as publishing model performance and usage data to help the ecosystem collectively adjust and train better models.
- From Arcee's perspective, "open" is more of a bet on people and community, rather than a bet purely on IP/software itself: the model weights, training recipe, and code are open, but the real asset is the group of people who can keep training the next generation of models, plus the users who will take these things and innovate with them. So "making the secret sauce public" isn't really giving up IP — it's expanding the community and accelerating iteration.
- From Fireworks' perspective, "open" is broken down in a more technical, institutional way: there's a distinction between "weights-only" and "truly open source," plus many dimensions:

▫ whether the training code is open

▫ whether the training data or its sources are disclosed

▫ what license it's released under (research-only vs. commercially usable)\
some people are now even building an "openness index" to quantify exactly how open different models actually are.\
Even weights-only releases (with no open training recipe) are still extremely valuable to the ecosystem, because they provide control and extensibility.

2. Open vs. closed: what are the downsides and risks of using open-weight models?

Everyone on the panel is genuinely very "pro-open," but they still honestly discuss a few real-world considerations.

- The dynamics of capability and cost: many open-weight models today are already "good enough" for most everyday tasks and are an order of magnitude or more cheaper, but the closed frontier labs (OpenAI, Anthropic) command enormous compute, and are likely to open up a large gap on the hardest, most cutting-edge capabilities in the future. This leads to a situation where:

▫ on the real commercial work you actually care about, closed models are only a little better, yet far more expensive.

▫ so the real challenge becomes figuring out which scenarios truly require a closed frontier model versus which ones an open-weight model handles just fine, rather than treating it as a black-and-white either/or choice.

- A safety perspective (using Anthropic's argument as an example): some people (Anthropic in particular) genuinely believe that as model capability increases, fully open weights bring safety risk, so "having clear control over the weights" is part of protecting humanity. You may agree or disagree, but this is indeed one important voice in the conversation today.
- Provider variance: in the open-weight world, the exact same model weights can sit behind wildly different inference systems. The real quality difference is often not a surface-level issue like "quantized or not," but that whole large layer of software in between: scheduling, concurrency, batching, caching, GPU utilization, and so on. The result is:

▫ the exact same model can feel completely different across different inference providers.

▫ some FP16 services can even be worse than some FP4 ones, simply because the system engineering is poor.

- Chinese open-weight models and geopolitics: quite a few of the most competitive open-weight models right now come out of China, and this touches on several dimensions:

▫ their training corpora include a large amount of the "Chinese internet," which is fundamentally different from the data available to US models, and may reflect different viewpoints on sensitive topics like politics and history.

▫ many enterprises have a gut-level unease about "using Chinese software," even though model weights are, at bottom, just numbers.

▫ certain applications (e.g. political communication, value-sensitive domains) worry more about this kind of bias; but for general coding and everyday tasks, most panelists think it's not a big problem.

▫ what genuinely worries some US-side groups is that if "open weights" end up dominated mainly by China, the US would have almost no leverage on safety standards, regulation, or governance, leaving only the extreme option of "outright banning" them.\
At the same time, some point out that these models' answers, across different languages, reflect the viewpoints of different societies — which is, in its own way, a kind of "mirror."

- Regulation and data provenance: legal action (a number of cases from 2023–2024) has made a lot of companies that want to use models care a great deal about: whether the training data is properly licensed, whether its sourcing is clear, and where the model was trained. Some "domestic" open-weight teams (like Arcee) specifically emphasize:

▫ being able to clearly tell customers the distribution and proportions of their data sources.

▫ this is an important selling point for compliance and risk management.

3. Why have cost, speed, and psychological perception become so critical?

Midway through, the discussion shifts to "cost and pricing models" — a part that matters a great deal to practicing engineers and product people.

- Changes in cost structure:

▫ models keep getting stronger, but the per-token price has an upward trend.

▫ agentic workflows (agents) mean "a single task" can consume a huge number of tokens, even running for a long time in the background, so an organization can easily burn through a whole year's budget in six months.

▫ the key metric is no longer just "price per token," but how much it costs and how long it takes to complete an entire task.

- The cost advantage of open-weight models: the panelists repeatedly emphasize that for a huge number of real commercial tasks, open-weight models are already good enough, at an order of magnitude lower cost. If you're just generating slides or automating general business processes, there's likely no need to pay 5x the price for "a 50% boost in frontier math ability."
- "Good, fast, cheap" — pick your trade-off: Fireworks proposes a three-dimensional trade-off:

▫ Quality

▫ Cost

▫ Speed\
different tasks have a different optimal point among these three:

▫ frontier research problems may only care about quality;

▫ a lot of internal enterprise applications just need to be "good enough" and will prioritize minimizing cost;

▫ for interactive interfaces, where a person is sitting in front of the screen waiting for a result, speed has a huge effect on the experience — for example, 200 tokens/s creates that "feels like magic" difference.

- Agents turn "speed" into a background cost: even for a background agent, where no human is watching the screen waiting for a result, speed still matters, because:

▫ you're paying for an entire workflow — the sandbox, external APIs, surrounding compute, and so on.

▫ if the model is too slow, even though you save on inference cost, you waste other resources and time.

- User psychology and pricing: there's a section using a "watching the gas-pump meter" analogy that's remarkably precise:

▫ users staring at token-based pricing feels like watching the numbers tick up on a gas pump — it creates a lot of psychological pressure, producing a kind of "range anxiety."

▫ pure usage-based pricing gives individual users a bad experience; a lot of people much prefer a subscription model (like Netflix), which feels a lot less stressful.

▫ for people selling a product, separating the "product subscription fee" from the "inference bill" also helps with communication:

⁃ you can say: "our product's monthly fee is X, and separately, there's an overall inference bill across the whole company, which we'll help you optimize — but that's a separate tab."

⁃ rather than having users see "the more you use, the more you pay" on the same bill and become reluctant to use the product.

- Exploring pricing models: the video mentions an experiment Fireworks ran called a capped "Firepass subscription," which the community responded to very well, suggesting that a subscription with a reasonable usage cap, combined with usage-based pricing beyond that cap, might be a viable middle path.

4. Routing and "which layer controls everything"?

The final section discusses, in the architecture of the future, "who decides how to route to which model, on which hardware," and which layer can genuinely "get fat" and capture the value.

- A multi-layer "cake":

▫ at the bottom are the GPU/hardware vendors.

▫ above that are the efficient-inference platforms (e.g. Fireworks).

▫ above that are the multi-model routing, unified-API layers (e.g. OpenRouter).

▫ and, higher still, the product companies and agent platforms.

- Who gets commoditized, and who captures the value?

▫ a business that's purely "I have a lot of GPUs and run public models" struggles to build a moat.

▫ an inference platform capable of custom post-training and helping customers optimize task cost can pull itself toward higher value-add, in a "consultant + infra" direction.

▫ a multi-model routing layer that holds a large amount of usage and performance data can also become the "intelligence hub" for choosing the best model/provider.

- A possible "bipolar" latency distribution: some predict that inference services in the future may split into two poles in terms of latency:

▫ one that's extremely fast, commanding a high per-unit price for interactive experiences;

▫ and one that tolerates slower speed but runs background tasks in a cheaper, batched, ultra-high-utilization mode.\
At the same time, specialized hardware like Cerebras and new technologies like Talos will play a role here.

Overall conclusion

The thrust of this panel can be condensed into a few points:

- In 2026, "open" is no longer just "whether the code is on GitHub" — it's the whole package of control, customizability, optionality, and community iteration speed.
- In real-world business scenarios, open-weight models often strike a great balance between cost and good-enough quality, and are especially well suited to the multi-step, long-running workflows in agentic pipelines.
- Closed frontier models will remain extremely strong at the cutting edge of capability, but what actually matters commercially is: which tasks are worth paying that premium for, while everything else gets handled by open weights plus smart routing plus efficient inference.
- On the engineering and business-design side, the real challenges are:

▫ how to find the optimal point among quality/cost/speed that suits your own use case,

▫ how to design pricing and product experience so users don't get scared off by the "token meter,"

▫ and at which layer (model, inference, routing, or product) to build genuinely sustainable value and differentiation.
