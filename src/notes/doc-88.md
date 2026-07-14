---
title: Trinity: Training a 400B MoE from Scratch Without Losing Your Mind
speaker: Lucas (CTO), Arcee AI
video: https://youtu.be/_GXUlM5DCL4?si=RnOvfnrop14h-uTB
---
This video shares how Arcee AI trained a 400B-parameter MoE model, Trinity Large, from scratch, and how they "rescued" the whole project to success under high-risk, high-pressure conditions.

The model and background

Lucas is Arcee AI's CTO. They originally did custom post-training, but as options for Western open-source large models got worse, they decided to pretrain their own. The company raised only about $50 million in total, yet burned roughly $20 million in six months training a series of models back to back, with the final target being Trinity Large: a 400B MoE model with only 13B active parameters per token, trained on a total of about 17 trillion tokens.

They first built a dense model, then two smaller MoE models (e.g. 26B / 3B active), purely to validate "can this even run" and to hit early landmines. The real big run was: training this extremely high-sparsity MoE (256 experts, only 4 activated per token) on a new cluster of about 2,000 B300 GPUs, rented for 30 days.

The first disaster: routing imbalance

For the first few days after the cluster came online, they were dealing with new-hardware issues: GPU failures, data-center coordination, and Nvidia even stepping in to ask them to take a full day of downtime for a firmware update. Once things finally stabilized, training looked perfect on the surface: good loss, stable grad norm, throughput hitting target.

The real problem showed up in a metric they specifically track for MoE balance: max vio (which they themselves call "violence"). It measures how unevenly the router distributes traffic across experts. Ideally it should stay below 1, and 3–5 is still acceptable; but after about 100B tokens, max vio started climbing all the way to 7, 8, 9, 10 — indicating severe routing imbalance, with some experts overloaded and others turning into essentially "dead experts."

This problem was especially tricky because:\
first, loss hadn't collapsed, and every "normal" training metric looked fine; second, they had already applied all the mainstream MoE load-balancing tricks from the literature and prior experience, and had tested them without issue on smaller models. Yet at this scale, a new kind of instability was emerging.

If they kept training for several more trillion tokens only to find that most experts were dead, all they could do afterward was prune — completely violating their goal of "a 400B model where every expert is actually useful." But having only trained 100B tokens so far, they also weren't willing to just scrap it and restart.

The "nuclear option" and decision boundary

He mentally set a "nuclear option" in advance: revert the model to a sparsity configuration they were familiar with — i.e., drop 400B / 13B active down to roughly 200B (active would change too) — using a lower-risk structure, so that at least they'd finish training something "decent, if less spectacular." But the company had already publicly announced 400B beforehand, and he admits this was a lesson learned: don't pre-announce the size next time.

He calculated how many days it would take to finish training if they cut to 200B right then, and worked backward to find that, within the 30-day rental period, they'd have to launch a new run by day 12 at the latest. At the time they were only on day 4 — in other words, they had 8 days to debug and run ablations like crazy, and if it wasn't solved by day 12, they'd have to bite the bullet and switch to 200B. He kept this deadline to himself and didn't tell the team, so the researchers could focus on debugging without also carrying business and reputational pressure.

He also emphasizes that, as the leader, he deliberately took full ownership of "whose fault it is if this fails," repeatedly reassuring the team: "success belongs to everyone, failure is on me." The goal was to prevent people from making impulsive, undiscussed big changes under high pressure, or being too afraid of blame to try things.

Debugging philosophy: shrink the search space

Lucas strongly emphasizes a debugging philosophy: spend effort first ruling out what it "isn't," aggressively shrinking the search space. Most anomalous train-time metrics are really just "symptoms" — the true root cause may lie elsewhere — so you can't let everyone scatter off chasing every direction at once.

He gave an example of a pitfall they'd hit before at small-model scale: when everything looks bizarre and inexplicable, and no other metric lines up with it, there's an extremely high chance the tokenizer is the culprit. Back then, for the sake of speed, they'd built a fancy tokenizer (something like superBPE, the kind that chunks whole sentences for tokenization), and training came out weird across the board. After a huge number of experiments ruled out the data pipeline, checkpointing, and other issues, they switched to the "known-stable" LLaMA tokenizer and everything went back to normal. This time, for Trinity, he flatly established a rule: don't get greedy with the tokenizer — innovate elsewhere if you want, but keep the tokenizer conservative and safe.

During this routing-imbalance incident, they again used a large number of ablations to rule things out: tuning hyperparameters, testing different load-balancing variants, splitting off one batch of GPUs for more "conservative, information-gathering" experiments (e.g. raising the balancing loss coefficient, adjusting the learning rate), while another batch of GPUs was handed to a few engineers to go all-in on "bold, unconventional" ideas — not expected to work right away, but with a very high payoff if they did.

To prevent anyone from privately restarting the whole run in the middle of the night, they also designed a "decision tree" in advance: if A fails, try B; if B also fails, try C, and so on — with a rule that any major change required sign-off from several core leads together.

The real technical fix: SMEBU and six changes at once

This crisis lasted about six days, with everyone constantly refreshing Weights & Biases, waking up to find the run had crashed or been modified again, then starting over. In the end, they didn't rely on a single magic fix — they shipped six changes at the same time to stabilize the system:

1. A new load-balancing method: SMEBU They designed a momentum-based way to update routing balance (the name itself is fairly playful). The core idea: instead of adjusting every expert's bias by the same update magnitude, introduce magnitude-aware momentum based on each expert's degree of imbalance, so severely imbalanced experts get larger adjustments and mildly imbalanced ones get gentler adjustments, preventing overall routing from diverging again.
2. Reverting to a more conservative numeric format: most layers switched back to BF16 Some layers had originally used the more aggressive low-precision MXFP8 format; to reduce potential future sources of instability, they switched most of the model back to full BF16. This wasn't necessarily the core cause of this particular problem, but it reduces the odds of new "ghosts" appearing over the next 5–10 trillion tokens.
3. Adding Z-loss (logit regularization) A new Z-loss term was added to stabilize the logit distribution, helping overall training convergence and stability.
4. Sequence-wise auxiliary loss Borrowing from Qwen's approach, they switched to a sequence-wise auxiliary loss to assist MoE routing, giving finer-grained control over load balancing across different sequences.
5. Architecture adjustment: more dense layers, fewer MoE layers The model was originally 420B; they added a few dense layers and removed a few MoE layers, settling at 400B. The intuition: using more dense layers early in training reduces the dynamically complex MoE subnetwork, giving better early-stage stability — once the run unfolds on a stable foundation, the rest of it is less prone to blowing up.
6. (Later on) a more advanced data shuffling and masking strategy In the subsequent phase-three training, they applied more sophisticated shuffle/masking to the data to improve long-term stability and performance; this was less related to the initial routing-collapse issue, but mattered a lot for overall run quality.

They had ablated each of these individually and confirmed each one helped, then took the risk of shipping all of them at once. Fortunately, the outcome was good: as training continued to 100B tokens, max vio stayed completely stable, with no further blowups.

Over the following 30 days, the team basically lived watching that one vio curve — any time one or two steps twitched even slightly, Slack would light up — but overall it stayed within a good range, never spiraling out of control.

An MoE-specific bonus: "violence" as an OOD signal

Interestingly, max vio later turned into an unexpected bonus feature:\
in the MoE setting, the degree of expert-routing imbalance can itself serve as a proxy for "how out-of-distribution this batch of data is for the model."

For example, later on, when they added a large amount of reasoning data during post-training or CBT, they saw vio rise noticeably, indicating the experts found this kind of data relatively unfamiliar — which let them infer that "maybe the pretraining data didn't have enough reasoning-type content," and that they could add another round of high-quality reasoning data in phase 3 going forward. This is a signal that's much harder to observe directly in a dense model.

Three-phase training and results

Trinity Large's pretraining was roughly split into three phases, totaling about 17 trillion tokens:

- Phase 1: about 10 trillion, broad general web text, letting the model build a wide base of language and knowledge.
- Phase 2: about 4 trillion, adding harder data and some instruct-type data, though still not very heavily weighted.
- Phase 3: about 3 trillion, high-quality and more difficult data, further strengthening reasoning and other capabilities.

Partway through, delays forced them to raise the batch size to catch up on schedule, which was effectively an indirect change to the effective learning rate — yet the overall loss curve remained extremely smooth, an almost spike-free "textbook curve" that's remarkably stable among public examples.

On model performance, their Trinity base model, compared against contemporaries like Llama Maverick and GLM 4.5/4.6/4.7 across multiple benchmarks, achieves comparable or even better results at a similar "total size" while using far fewer active parameters — particularly strong on agentic tasks and function calling (e.g. BFCL-style benchmarks). There's still room to improve on code-specific metrics like SweetBench Verified, which is also related to their relatively smaller share of code pretraining data.

During post-training, they had only about a month's worth of compute available, and had to choose between "building a model heavily skewed toward code" and "building a model that's broadly a very strong agent, while also being good at code." Since there were already plenty of code-only models on the market, they chose the latter, focusing effort on general agentic capability and practical agentic tasks.

Cost, serving, and product-side trade-offs

On the serving side, because Trinity only activates 13B parameters per token, overall inference cost is very low even though the total parameter count is 400B. They estimate that, at the 400B size, cost per million output tokens is about $0.8 — far lower than some 1T- and 700B-class open-source models (e.g. Kimi, GLM, which are typically around $3 per 1M output tokens). This is a real economic advantage that comes from the architecture design and MoE sparsity.

He also mentions that they briefly offered it for free on OpenRouter in the short term, using the resulting traffic from a large number of users to get a real-world estimate of how many tokens per day they could serve within a fixed compute budget — a pragmatic form of product experimentation.

Mindset and leadership: "not losing your mind" under pressure

The final big chunk of the video discusses mindset and leadership style:

- Under high pressure and high cost, the most important thing is to focus solely on what the team can actually control — more ablations, better-designed experimental decision processes, inventing new load-balancing methods — rather than getting dragged down by uncontrollable things like "what investors think" or "what the media would say if this fails."
- For researchers, the scariest thing is carrying too many conflicting pressures and priorities at once, so he consciously took on all the various external pressures himself, so everyone else could stay focused on the technical problems.
- He encourages the team to "pick goals you supposedly have no business attempting, and then keep smashing into the wall until you actually pull it off" — that is, don't be afraid to fail in public, and treat "being willing to fail in full view of everyone" as a muscle worth training, especially in a field like AI that moves extremely fast and is full of very strong people.

In summary, this video isn't just about the technical details of a 400B MoE — it's about how, under limited resources, tight timelines, and unclear technical boundaries, a disciplined debugging process, sensible risk boundaries, and team psychological safety can drag a big bet that could easily have died halfway all the way to the finish line, and make it competitive on both quality and cost.
