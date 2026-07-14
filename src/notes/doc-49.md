---
title: How to Unlock Enterprise Value by Training Your Own Language Models
speaker: Snowflake
video: https://youtu.be/_pk8IhWq9zw?si=DJRZde5Cp1Zq31pR
---
This Snowflake talk covers when enterprises should train their own language/embedding models, how to go about it, when to stop, and their hands-on lessons from Arctic Embed and Text-to-SQL.

Snowflake's thinking on "should we train our own models"

The speaker starts by describing his role at Snowflake: three years spanning product engineering and model training, having worked on RAG, chat assistants, and now agents. The core question has become: when should you train your own models, and when is it fine to just use open-source or frontier lab models?

He lays out a few principles:

1. Only train where you have an advantage That advantage can be a domain (e.g., Snowflake's strength in SQL), proprietary data, a product feedback loop (continuously collecting user interaction data), or regulatory/contractual constraints (customers need traceable provenance for training data). Without a defensible advantage, you'll easily get overtaken by a frontier lab's general-purpose model.
2. The top priority is "solving customer pain points," not "winning public benchmarks" Many enterprise model teams get obsessed with public leaderboards and metrics, but real customer usage doesn't always match what benchmarks cover. Snowflake would rather give up climbing certain retrieval-benchmark leaderboards in favor of optimizing the experience for real enterprise workflows.
3. "Quality" is the prerequisite; latency and cost come after Enterprise customers today are more willing than before to accept higher cost and higher latency, as long as capability clearly improves. First ask: can this model deliver genuinely high-value, defensible capability? Only after that do you start optimizing latency, and then cost.
4. The biggest gains usually come from data, not algorithmic tricks They tried many algorithms and training-strategy tweaks, but what really drove large improvements was mostly: mining better data, designing better data-processing and filtering pipelines, and synthetic data more closely tailored to the target task.
5. Know when to stop Model training isn't a one-off project — if your use case is very quality-sensitive, that means you need to be prepared for long-term, continuous model iteration. Conversely, if marginal improvements no longer move the needle for customers, you should stop and redirect resources elsewhere.

Arctic Embed V1: an enterprise retrieval embedding model built for Snowflake

The first case study is Arctic Embed V1, which powers Snowflake's internal search and RAG capabilities.

Why train it themselves instead of just using an off-the-shelf model?

- Snowflake wanted an in-house search/RAG product where "data never leaves the enclave," consistent with their long-standing data-residency commitments.
- After acquiring Neeva, they had a large amount of proprietary search data and search expertise — a real advantage.
- Open-source embedding models exist, but many have licensing issues that make enterprise customers uneasy.
- Existing baseline models (like E5) had fallen behind on the latest techniques/data, giving them a chance to do better at equal or smaller parameter counts.
- Latency and serving cost had to be considered, so the goal was a "small and fast, but still high quality" model, not a giant embedding model.

On the technical side, he emphasized that the real value driver was the "data recipe":

- Carefully designed negative samples during pre-training (source stratification, same-source clustering, etc.) to teach the model what a "wrong" document looks like.
- Bringing web-style filtering methods from LLM training into embedding training, for more refined data filtering.
- Using smaller models to help clean and improve the quality of training data.
- In the fine-tuning stage, using synthetic data tailored to specific retrieval tasks, combined with curriculum learning that moves from easy to hard negatives.
- Choosing among multiple model sizes based on serving requirements.

The result: it beat comparable open-source models across all parameter scales, and even outperformed embedding models like Google Gecko and OpenAI's on quality, despite those having far more parameters.

Arctic Embed V2: expanding to multilingual while keeping English quality

The second case study is Arctic Embed V2.

The goal wasn't just "make it a bit better" — it was driven by a clear customer need: multilingual retrieval.

- V1 only supported English, and customers wanted to retrieve across multiple languages.
- Open-source multilingual embedding models are typically "one English version + one multilingual version," which complicates usage and deployment (customers must choose a model, and systems must maintain multiple versions).
- Snowflake wanted to offer "one model that handles English plus the customer base's main languages" — not chasing every one of the world's hundred-plus languages, but targeting the handful of languages that matter most to their customer base.
- On top of that, they scaled up the embedding parameter count so the model could handle multilingual generalization well.

Technically, V2 continues and strengthens V1's data and training techniques:

- Reusing V1's data processing and training pipeline, plus large-scale multilingual data.
- Adding new clustering methods to remove outliers from multilingual data, improving overall data quality.
- Introducing MRL (compressing embedding vectors while preserving quality) in both pre-training and fine-tuning, going a step further than the industry practice of only using MRL during fine-tuning.
- Drawing on newer research such as NVIDIA Retriever to improve hard-negative mining strategies.

Result: it outperformed other models on both English and multilingual quality, and didn't sacrifice English performance for multilingual gains — both improved.

Why was there no Arctic Embed V3?

An interesting point: after both V1 and V2 succeeded, they chose not to build a V3.

There were two reasons:

1. The improvement customers actually noticed became limited

▫ Going from E5 to Arctic V1, customers subjectively felt a "huge quality jump" — a clear enterprise value.

▫ Afterward, even when benchmarks showed larger models performing slightly better, customers in practice "couldn't feel the difference," especially once they factored in latency and serving cost — they were even less willing to trade a slower, more expensive system for that sliver of quality.

2. The way RAG/agents are used changed the quality-demand curve

▫ With RAG plus agents, an agent can search multiple times and can stuff 10, 20, or even more retrieval results into a massive context window.

▫ That means the importance of "perfecting the top-1/top-3 ranking" decreases — as long as key information appears somewhere among the top results, the overall task can still succeed.

▫ So continuing to pour money into nudging up "top-result accuracy" delivers very low marginal enterprise value.

Against that backdrop, they judged there wasn't a strong enough enterprise case for a V3, and chose to stop and redirect resources to other, higher-impact directions.

Arctic Text-to-SQL: unlocking new capability with a dedicated SQL model

The third case study is Arctic Text-to-SQL (specifically V2, not yet formally released in full — this talk was something of a preview).

Why train their own Text-to-SQL model?

Snowflake has two product lines that need Text-to-SQL capability:

- Cortex Analyst: a native Text-to-SQL interface.
- Snowflake Intelligence: a data agent that converses with data and produces insights, partly via SQL queries.

Initially, like the rest of the industry, they relied on frontier models for Text-to-SQL. But they ran into several problems:

- Snowflake's SQL dialect has many proprietary features, with almost no examples of that syntax in public web corpora.
- Snowflake keeps shipping new SQL features that have "zero footprint" on the open web, so general-purpose models never spontaneously learn to use them.
- Snowflake has a rich real-world SQL execution environment and data, which lets them do large-scale RL and evaluation — a clear advantage.

So they decided: train a dedicated Text-to-SQL model specifically for Snowflake's own SQL ecosystem.

The training process and key points

On the technical path, they went through:

1. First doing supervised fine-tuning (SFT) and RL They started with the typical path: SFT on labeled Text-to-SQL questions and corresponding queries, then combined with RL. However, experiments showed the gains weren't as large as expected.
2. Shifting to "mid-training" plus more targeted data He returns to the point made earlier: what's really useful is data, not endlessly swapping RL algorithms.

▫ They tried multiple RL algorithms (e.g., SFO, GRPO, etc.) and tuned many hyperparameters, but the payoff was limited.

▫ What actually produced a breakthrough was: synthetic queries targeting Snowflake SQL patterns and textbook-style SQL teaching material, which let the model go through an additional "mid-training" pass — becoming much more familiar with the target domain.

▫ Only after stacking SFT + RL on top of mid-training did they reach the expected improvement.

Result: on internal benchmarks, they achieved both better accuracy and better latency, while also using Snowflake's newest SQL features more effectively and more often — which lined up exactly with the enterprise value they set out to capture.

The model succeeded, but product integration wasn't so smooth

Interestingly, even though the Text-to-SQL model itself hit its targets, they still ran into some snags on the product side.

- Snowflake Intelligence's agent architecture evolved from "two agents (Text-to-SQL + data agent) calling each other" into "one long-lived, large agent that manages its own context and actions."
- This architectural shift meant they couldn't simply drop the new Text-to-SQL model into all traffic without restructuring the entire system.
- Looking back, he thinks it would have been better to model things at the "system level" from the start — for instance, incorporating the interaction between the two agents into the training objective, rather than optimizing the Text-to-SQL subtask in isolation.

Still, the data and training foundation built for Text-to-SQL can be reused for other SQL-related tasks and models, so the investment wasn't wasted.

Summary: a few key takeaways on training your own enterprise models

Finally, he condenses the whole talk into a few takeaways (applicable to any enterprise considering training its own models):

- Only train where you have a "defensible advantage": for example proprietary data, a special domain/dialect (like Snowflake SQL), a clear regulatory/licensing edge, or a product feedback loop. Don't train for research bragging rights or marketing buzz.
- Public benchmarks matter, but they're always just a proxy. The real, ultimate evaluation standard should be performance and feedback from customers' actual workflows.
- Think in the order "quality → latency → cost." Enterprise customers will pay more in waiting and money for a clear quality improvement, but won't pay for gains they can barely feel.
- Put most of your R&D effort into data and evaluation: find better, more representative data, do rigorous data cleaning and construction, rather than endlessly making small tweaks to algorithmic details.
- When you can no longer see a substantial marginal gain in enterprise value, be willing to stop training a new model version; more models isn't better — the real goal is whether the customer's problem is being solved better.
