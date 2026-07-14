---
title: Lessons From RL Systems That Looked Fine Until They Didn't
speaker: Aethon
video: https://youtu.be/-EEYh1Twefs?si=ENDky1ElxtWJ_xym
---
This talk is about, drawing on the speaker's hands-on experience, why reinforcement learning (RL) systems "look fine and then blow up in production," and how she later learned to design more stable systems.

1. The core problem: it's not that the reward is wrong, it's that optimization goes "out of control"

The speaker works in a hedge-fund/quant-AI environment, putting models to work in markets where the money and the risk are both very real. Her conclusion: a lot of RL failures happen not because the reward was designed wrong, but because the "scope of optimization" and "behavioral boundaries" weren't designed properly:

A policy will hunt for boundary loopholes in the training environment, quietly drifting under an aggregate metric that still looks fine — until the market changes, the distribution shifts, or it hits a hard constraint (capital, risk, regulation), at which point it blows up.

So she focuses on structural, system-level controls, rather than just tacking penalties onto the reward.

2. From research to production: a brutally strict funnel

At the fund, before a strategy or model can go live, it has to pass through an entire rigorous process:

- Start from a hypothesis, with every experiment given clear hash/run anchoring, to make it easy to track and detect drift (e.g., backtest performance getting worse).
- Run backtests, walk-forward tests (simulating tomorrow's and the day-after's world), and tier-1 risk gates.
- Review a pile of statistics (Sharpe ratio, various risk metrics) — a single run might involve 200-plus models, and in the end only a tiny handful survive into production.

She stresses: in this setting, don't just chase making "a single model as good as possible" — instead, put a whole cohort of models into something like a tournament environment where they compete against each other, and filter out the fragile ones.

3. Production isn't as "simple" as it sounds: stability, scalability, sustainability

She complains that a lot of people think "shipping it to infra" is the same as production, but in reality there are several dimensions you need to handle:

- Scale and capital allocation: whether the strategy still works properly as you go from a single portfolio to different capital scales.
- Sustainability: the strategy can't be entirely at the mercy of momentary emotion or the day's sentiment; sentiment is allowed to influence the strategy, but it can't blow up drastically every single day.
- Reliability and continuous learning: once each day's end-of-day data comes in, you have to decide whether to fine-tune or just adjust inference, making sure the return curve doesn't go from 40% today to 0% tomorrow.

This often means fast retraining and adjustment overnight, but without redoing everything from scratch — you have to balance cost, stability, and responsiveness.

4. World models + RL: but take only the part we need

She breaks the system into three layers: "world model → individual model → RL algorithm."

- World model: defines the world environment, used to "auto-prompt" different scenarios, letting the system continuously simulate "what would happen if tomorrow looked like this."
- But she doesn't put blind faith in world models themselves — most open-source world models are designed for games/vision, so her approach is to strip out the vision-related and other unnecessary parts entirely, keeping only the core structure useful for financial decision-making.
- This way she can leverage other people's infra without being dragged down by unnecessary noise.

They also use the world model to solve the problem of "distilling a customized small model for each customer": instead of forcing all distillation to feed back into the main model every single day, they first compare "this small model vs. the main model" on backtest/forward-test performance inside the world model, and use that to decide whether it's needed, and at what frequency (e.g., switching to weekly re-distillation instead of daily).

5. Lessons from failure: a plain RL policy too easily "lives only in today"

At first they only did "traditional RL + single-agent policy":

- Give the policy a goal and a reward, and let it optimize.
- The result: the agent does "policy optimization" that exploits the current environment, while the market is a world that keeps changing tomorrow and the day after.
- They found: you can't let the agent live only in "today"; nor can it over-rely on the distant past or unrealistic predictions of the future.

Later, using world-model infra built by a former colleague, they abstracted the original RL results into a prompt, fed it into the world model, grew a strategy out of that world, and finally distilled it back down to customers and the live system.

6. Quantitative results: world models plus the right distillation strategy work better

She showed a few charts (described verbally):

- Plain offline-RL approach vs. adding a world model/union: alpha and Sharpe both improve significantly after adding the world model.
- Initially they just played around with the world model plus image generation directly, and the result was too noisy, giving the worst performance.
- After that, they "cut off the head," keeping only the core structure, and mixed in their own data with generated artifacts; in the end they found that only by fully stripping out the excess visual noise and keeping just what's needed did they get the best result (the red line).
- Distillation went from "re-distilling every night" to "distilling weekly plus inference every night," paired with offline fine-tuning on weekends/at night — which turned out overall more stable and cheaper.

7. Carrying this same thinking over to a "taste" system

She then jumps from finance to her own interests in music and oil painting, complaining that today's LLMs/recommendation systems all have the same "aesthetic" and fail to capture a person's real taste. She applies the same structure from before:

- On the finance side, strict hard limits like variance ratios and risk thresholds are used.
- A taste system, meanwhile, can use "softer" but still bounded metrics, such as "satisfaction variance" or "PP + PP10 mean drop":

▫ Suppose the songs you usually like all cluster around a certain "taste level" — when the system recommends something new, it can allow roughly 18 "basis points" of deviation above or below that average (she uses 18pp as an example), giving you a sense of novelty without dumping you into a genre you don't recognize at all.

▫ This is similar to risk preference: even an extremely conservative person won't suddenly be pushed into an ultra-high-risk asset.

She stresses: taste can be encoded — the key is how you control the magnitude of "exploration."

8. The world model as a "personal world": the role of the knowledge graph

Back to the world model, but this time in the context of human taste:

- The market is already a ready-made world; human life and preferences, by contrast, are much looser.
- She suggests using a knowledge graph to construct a "personal world":

▫ Put all data about you into the knowledge graph, with each node carrying detailed structure.

▫ The world model takes this knowledge graph in as a giant prompt, and from that can understand the relationships between different nodes.

▫ After that, you can operate on subgraphs — for example, "only look at the intersection of music × art × fashion" — to build a specific sub-world.

- This reduces hallucination, and makes every recommendation/decision traceable.

9. Designing the RL agent plus recommendation layer: avoiding a "black-box policy" and cold start

She criticizes the typical approach: taking a big policy like OpenAI Gym as a black box, tuning parameters, and hoping it magically learns well. Her suggestion:

- Treat these large, opaque policies as a baseline, mainly used to solve "cold start."
- The real differentiation should be at the layer above: your world model, novelty factors, and the "scaffolding" built from users' historical behavior.
- Novelty in particular: don't just do purely random exploration — instead, treat the user's historical preferences as a growing dataset, giving exploration a direction.
- This way, without frequently retraining the world model, you can still make recommendations feel more and more "like you," while avoiding the trap of relying purely on an open-source black-box policy that never learns anything stable in the long run.

10. Evaluation and constraints: agentic verdicts plus human-set "guardrails"

The final segment covers the evaluation/auditing part she cares about a great deal:

- In a fund environment there's risk-management and audit pressure, but even in a personal system, you "should" still know what your agent is doing.
- She designed an "evaluation agent":

▫ The RL agent still has tier-1 rewards.

▫ On top of that, an "agentic verdict" layer acts as a guardrail (she compares it to bowling-lane bumpers).

▫ These verdicts can be things like:

⁃ "Don't deviate more than ±18 basis points from the user's average taste."

⁃ "Don't surface certain types of content/pipeline."

▫ At heart these can be very simple JSON rules, set by humans and also trackable by the system.

She points out that without this kind of guardrail, RL will discover that some "extreme deviation" boosts engagement or satisfaction in the short term, and will keep charging in that direction — leaving the user ultimately feeling "this system doesn't understand me at all."

11. Auditing and tracing that's actually usable: split into small files, weighted reading

She places a lot of weight on traces/logs, but knows most people are too lazy to read logs, so she shares a practical approach:

- Don't have one giant 2,000–4,000-line log/cloud MD file.
- Split the trace into several types of spec sheets, for example:

▫ A hypothesis spec (for researchers).

▫ A hash/back spec (a mapping from one encoding to another, similar to normalization).

▫ A walk-forward spec (in finance this might be "tomorrow's US stock market world"; in a taste system it could be new releases on Spotify, etc.).

▫ A tiers/gates rules file.

- The production system can weight these spec sheets differently, so it's clear which layer's constraints or assumptions each decision came from.
- This also lets the world model, the RL agent, and the evaluation agent trace against different files/nodes, instead of being drowned in a mass of noise.

She shows her own example: policy weighting handed to an agent called Sarah, with all ML flow and rollout rules centralized in an easily searchable interface (she also gives a nod to tools like Sky Portal, while noting that just JSON plus Slack works fine to start with).

To sum up, her main thesis is: to truly put a reinforcement learning system into production, the key isn't "designing the perfect reward function" — it's the boundary design of the whole system, world modeling, distillation strategy, and evaluation/audit structure. Having been forced to mature in a high-stakes financial setting, this approach can also be used to build "taste systems" and personalized agents that understand people better without spinning out of control.
