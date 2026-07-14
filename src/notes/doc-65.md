---
title: RLVR in Practice: From Synthetic Data to GRPO
speaker: Chris, NVIDIA
video: https://youtu.be/sVyZVtnygD8?si=6LttdnyVCJdd4JGr
---
This video explains how NVIDIA, in training Nemotron-3 Super, went from synthetic data all the way through multi-environment RLVR (Reinforcement Learning from Verifiable Rewards) and GRPO to turn the model into a strong "agentic" reasoner and tool-user.

The overall arc: from "big soup pot" to agentic model

Chris first explains: a purely pretrained LLM is just "a giant autocomplete," not yet very useful. [03:55] Everything that follows in the "post-training" pipeline aims to twist this big soup pot into what we now expect: an agent model that can chat, do multi-step reasoning, call tools, and plan long-horizon tasks. [4:41][6:27]

The overall hero-run pipeline is roughly:

- SFT (supervised fine-tuning): using a small but carefully designed dataset to "prime" the model for RL, rather than chasing final capability at this stage. [10:18][17:43]
- Multi-environment RLVR: doing RL across many programmatically verifiable environments, so the model learns to genuinely "get the problem right" across a wide range of tasks. [9:20][11:00]
- SWE (software engineering) RL: because verifying an entire software project is slow and expensive, it's split off into its own separate stage. [12:49][39:59]
- RLHF / GenRM: using reward models for human preference, safety, politeness, helpfulness, and so on, to make the model pleasant to work with as well as useful. [14:00][41:56]
- MTP healing: after speeding up inference with multi-token prediction, a "healing" step recovers the few percentage points of quality lost as a result. [15:02]

Synthetic data and SFT: using a small amount of high-quality data to "pave the way for RL"

He emphasizes that data quality now relies not just on "quantity" but on "design":

- Synthetic Data Generation (SDG/STG): using models and pipelines to generate training data themselves, "purpose-building" samples targeted at the capabilities RL will later train, so the model already has roughly a 30% success rate going into RL, instead of 0.1%. This way RL compute isn't wasted. [17:20][17:43]
- The advantages of STG:

▫ Can directly generate problems targeting specific capabilities (web dev, Python, etc.). [18:19]

▫ Since every row is self-generated, each one can be individually verified and tagged with metadata, giving control over the difficulty distribution, which RL can later use strategically. [18:27][19:01]

▫ Easier to "decontaminate" than large-scale web data, avoiding accidentally training on benchmark test data. [19:10]

He also outlines the standard SDG pipeline: [20:22]

1. First, prepare representative seed data.
2. "Fan out": expand the diversity of question types and scenarios — not just problems that look like GSM8K, but variations across the whole surrounding neighborhood of problems. [21:05]
3. Build a large number of trajectories (complete interaction histories), then do verification and selection to filter out low-quality samples. [21:46][22:01]

Nemotron-3 Nano had only 5 domains; by Nemotron-3 Super, that grew to 838 domains, aiming for a model that holds up across all kinds of tasks rather than being good at just one or two benchmarks. [22:08]

Data mix and personas: explicitly telling you what the model "was designed to be good at"

He shows a "data mix" chart, saying it essentially maps out which scenarios this model is meant to be used in going forward. [22:27]

- 36% is "agent stuff," 31% is reasoning, 23% is chat, and the rest is long-context and miscellaneous. [22:51]
- He says this chart shows that NVIDIA positions the Nemotron series as a strong-reasoning-plus-strong-agent model, not primarily a chit-chat model. [23:06]

For diversity, the data pipeline also uses personas: [24:39][25:31]

- First, using census-backed persona data to generate user personas from different backgrounds, regions, and occupations, enriching how questions are phrased.
- Then sampling by conversation type and topic, before moving on to query generation.
- The generated queries are first simulated with other models to confirm "this batch of data really does elicit the behavior we want" — if not, it gets discarded. [27:25][27:48]
- He stresses that the open-source and multi-model ecosystem matters a great deal, because these external models are themselves the tools used to review and generate training data. [28:01]

Reasoning samples and SFT: preventing "long reasoning samples" from swamping the whole training run

In reasoning tasks, the number of thinking tokens is usually very large, and if fed directly into SFT, long samples can easily dominate the entire gradient signal. [28:29]

- He walks through a bit of math: without adjusting sampling/weighting, long reasoning samples overwhelm other capabilities, causing the model to end up with only one style. [28:31][29:02]
- So during SFT they do a lot of rebalancing, to make sure the model doesn't only learn to "write a giant chain-of-thought" but can still do other things. [29:07]

RLVR: using "programmatically verifiable correctness" as the reward

Moving into the main topic of RLVR, he first contrasts it with traditional RLHF: [29:28][29:38]

- Traditional RLHF: uses a reward model (similar to BERT) to predict "how much a human would like this answer," which is prone to reward hacking and requires constantly updating the reward model.
- RLVR: if the task itself has a clear correct answer, just write code to check it directly — for example, unit tests, comparison against ground truth, structured output validation, and so on. [29:42][29:59]

Benefits:

- Avoids reward-model drift issues.
- Especially well-suited to "non-subjective" tasks (math, tool use, coding). [30:08][30:30]

But this is on the condition that the environment and verifier must be extremely rigorous. [31:18]

- Verification code, just like any other critical infrastructure, needs to be tested and reviewed as a serious software engineering concern. [31:26][31:48]
- If the environment is poorly designed, even with RLVR the model will still reward-hack, learning to "score high by exploiting bugs." [32:10]

GRPO ("Gerpo"): ranking a group of samples against each other, instead of a single pass/fail

He introduces group relative policy optimization (GRPO), joking that he keeps calling it "Gerpo." [32:40]

- Instead of producing just one answer, it produces multiple answers, and then a verifier judges which are better and which are worse.
- The reward isn't 0/1 — it's about who's "more right" and who's "more wrong" within the group, using relative scores to nudge the policy step by step toward the better samples. [33:00][33:09]
- This is especially helpful in scenarios where early-stage capability is weak, because you don't have to wait for the model to suddenly "get it right in one shot" before giving positive reward. [33:20]

He also mentions in passing that this approach avoids issues like "value estimation error." [33:44]

Multi-environment RLVR: learning many capabilities across many environments at once

Early on, they tried "doing RL on just one environment at a time" and found it both slow and prone to reward hacking, so they later switched entirely to multi-environment. [34:39][35:03]

- Why do many environments together?

▫ There are too many capabilities — training them one at a time sequentially would blow up the timeline.

▫ RL itself is extremely expensive, so they parallelize wherever possible (he jokes, "we're NVIDIA, parallelizing things is our favorite pastime"). [34:52][35:00]

▫ Multiple environments make it harder for the model to find a "single trick" loophole that satisfies all rewards at once. [35:10][35:44]

- But multi-environment also requires careful design:

▫ The reward weight for each environment must be tuned, to avoid any single environment's signal becoming too strong, getting reward-hacked, and dominating everything. [36:01][36:04]

▫ For each task, they first run the model once to measure the current success rate, then cut tasks that are "always right" or "always wrong," so as not to waste RL budget. [37:33][38:04]

In terms of batch structure, they:

- Generate trajectories from multiple environments in sync, running verification across large amounts of CPU/GPU.
- At the same time, "quietly" inject preference/safety reward from GenRM, ensuring outputs are not just correct but also sensible and usable. [38:29][39:00]

The SWE environment: software engineering is too expensive to handle any other way but separately

He draws SWE as a separate orange box in the hero-run pipeline. [12:49]

- Verifying software engineering tasks (running tests, spinning up environments, checking the whole system) takes an extremely long time.
- If it were folded into multi-environment RL, the whole batch would be dragged down by the slowest SWE task, blowing out both token length and runtime. [39:36][39:54]
- So the approach is: all the fast-to-verify environments run together under multi-environment RL, while SWE is handled separately and asynchronously afterward. [40:01]

Pivot RL: launching RL only at the "step where things start getting hard"

He shows a comparison chart of pure SFT versus end-to-end RL, and ultimately proposes his own middle-ground approach: Pivot RL. [40:10][40:43]

- Pure SFT: very fragile on out-of-distribution (OOD) novel scenarios.
- Pure end-to-end RL: extremely expensive, requiring a huge amount of online rollout.
- Pivot RL's approach:

▫ Train a group of "expert small models," each skilled at generating trajectories in its own domain. [40:43][40:48]

▫ Identify the pivot step within long trajectories where things go "from easy to hard" — the point where the model starts becoming uncertain and making frequent mistakes. [41:02]

▫ Only run RL rollout on the segment after the pivot, rather than training the whole trajectory from scratch. This achieves the same accuracy with roughly a quarter of the rollout volume. [41:15][41:45]

GenRM, safety, and a model that's "pleasant to work with"

Even though RLVR focuses on "right/wrong," they still integrate a Generative Reward Model (GenRM): [41:49][42:14]

- Continuously injecting reward for safety, bias reduction, instruction-following, and constraint compliance across all environments.
- Just like the RLHF mentioned earlier, the goal is for the model to produce human-friendly, maintainable output even on technical tasks like coding, rather than pursuing only logical correctness. [14:28][14:36]

Async GRPO and engineering challenges: making RL "actually run"

He shows a chart comparing synchronous vs. asynchronous GRPO: [43:26]

- Looking at "how many steps it took," async needs more steps to surpass the baseline.
- But looking at "wall-clock time," the async line always reaches the same level faster. [43:04][43:20]
- Conclusion: even if it takes more updates, as long as each step is much cheaper and highly parallelizable, the overall end-to-end time shrinks.

He also uses an architecture diagram full of arrows to mark all the places getting "hammered" by latency — including environment startup, tool invocation, verification workflows, and so on — emphasizing that this is a very heavy engineering problem. [39:10][39:26]

Nemotron-3 Super and the upcoming Ultra

Finally, he returns to the product side:

- For Nemotron-3 Super's entire hero run — from SFT, multi-environment RLVR, SWE, RLHF, to MTP — almost everything is "very open":

▫ Weights, methodology, and plenty of ablations.

▫ Most of the training environments will also be published on Hugging Face's NeMo Gym. [8:15][9:15][32:35]

- At the same time, previewing the larger Nemotron-3 Ultra:

▫ Using more GPUs, more environments, and more tool calls per trajectory. [43:27][43:53]

▫ The corresponding training tools and environments will also be released.

He finishes by showing two QR codes — one for the entire open-source NeMo RL and Pivot RL training framework, and one for the NeMo Gym environment collection — emphasizing that this is genuinely the exact same code and environments NVIDIA's own research team uses to train Nemotron-3 Super/Ultra, and you can go use it directly. [44:14][44:56]
