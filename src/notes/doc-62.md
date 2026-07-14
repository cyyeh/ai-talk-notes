---
title: Pricing AI Agents
speaker: Orb
video: https://youtu.be/HSzRTLSCU94?si=91wAWy7zGdcoVCyj
---
This video explains how to "engineer" pricing and usage-based billing in the age of AI agents, rather than treating pricing as a financial decision that only gets revisited occasionally.

What is this video about?

The speaker is from Orb, a company that builds usage-based billing infrastructure. They work daily with SaaS and AI product teams, helping design the full "event → metering → billing" system that supports constantly evolving pricing strategies.

They first lay out the broader context:\
Pricing used to be a decision the finance department made once a quarter. Now, under AI and usage-based models, pricing has become a decision that product and engineering need to iterate on weekly, and it touches engineering, finance, sales, product, and other departments all at once. If the billing system isn't flexible enough, even a small price change turns into a cross-departmental "relay race" that slows down innovation.

Next, they use four time scales to look at how companies think about pricing:

- When a product just launches (days/weeks): pricing focuses on "driving adoption," commonly using free tiers, free trials, and freemium.
- On a scale of weeks: the focus shifts to COGS (cost of goods sold), especially whether the underlying foundation model costs still make sense, and whether free and self-serve users remain profitable.
- On a scale of months: repricing for "growth," balancing adoption against paid upgrades, and making sure new features and engineering investment get paid for.
- On a scale of years: designing an overall monetization strategy for "profitability and exit path" — for instance, whether to lean more enterprise, and how to repackage and restructure plans.

They also break down the four major levers involved in pricing:

1. Price point: exactly how much to charge per unit.
2. Value metric: what do you actually charge for? Tokens, credits, workflows, outcomes, etc.
3. Billing model: prepaid vs. postpaid, and whether there's a committed volume.
4. Contract structure: discounts, adjustments, renewal incentives, and how much flexibility to give sales.

Key concepts and case studies behind successful pricing

From interviews with numerous AI/SaaS companies, they distilled four success factors:

- Signal capture: how do you know if the pricing is working? This includes community sentiment before and after a price change, customer interviews, revenue pressure, competitor pricing, and actual churn and adoption rates. They especially emphasize: don't just look at how loud the complaints are — check whether there's actual churn and whether usage has dropped.
- Risk awareness: striking a balance between "flexibility" and "predictability." Finance teams actually like usage-based plans with commitments, since that makes budgeting and risk control easier.
- Value story: every price change should come with a clear ROI story, telling customers why this change represents more value.
- Partnership: use pricing to convey "growing together," rather than "the more you grow, the more we keep charging you until it feels like a punishment."

They shared three concrete case studies:

Case 1: A price increase plus new features — learning that "moderate friction is healthy"

A company doing both AI and SaaS, already with strong product-led growth, wanted to use the launch of new features as an opportunity to start genuinely "monetizing" more value — in other words, a real price increase.

They first did extensive "social listening" and customer interviews to confirm customers saw the product as high-value, then went ahead. The price change did trigger a wave of discussion and complaints, but on closer inspection, they found the same people were simultaneously discussing and praising the new features, and overall user growth continued, with the product still seen as differentiated.

The conclusion:\
If there's absolutely no negative feedback, you might be charging too little. A moderate amount of "you're a bit expensive" or "you gave away too much for free" chatter is actually a sign that you're in a healthy market and your price is near the sweet spot.

Case 2: The tokenomics trap — learning to price for "loyalty" early

The second was an agentic AI company with a large self-serve user base. It initially subsidized tokens heavily to drive adoption, then later discovered the entry tier was completely unprofitable, and had to raise prices and cut back the free allowance.

They expected some churn, and used a large amount of free credits to help existing customers "land softly." In practice, though, it made many users angry, and they switched to cheaper competitors — the adoption curve still hadn't fully recovered even a year later.

Even so, they don't regret it, because this adjustment exposed a truth:\
Most of the people driven away by the price change were "token tourists" — they cared about whoever had the cheapest tokens, treated the product as just an LLM wrapper, and could switch providers anytime. The people who actually stayed were the ICP (ideal customer profile) — those who valued the product itself and were willing to pay for value-added features.

This leads to an important point: whichever value metric you choose is effectively telling customers "this is the value you should care about." Charging purely for tokens tracks cost closely, but doesn't necessarily express the product's real value; charging for "workflows/outcomes" aligns better with how customers perceive value, but is harder to map directly to cost and needs a more refined cost model.

Case 3: A single simple metric traps you into always "competing on who's cheaper"

The third was an AI infrastructure company that found its sales negotiations almost always devolved into: "how much cheaper are you than the competition?" Because they used only one extremely simple value metric, customers could only do a one-to-one comparison on that single number.

They eventually shifted to a more "multi-dimensional" rate card: a primary usage metric, plus separate charges for premium scalability, dedicated capacity, support, add-on features, and so on.

This gave sales a vocabulary for talking about "differentiated value," instead of being left with nothing but "whose unit price is lower." The tradeoff is a more complex plan with a higher cognitive burden, so the design needs to match customers' tolerance for complexity, rather than chasing simplicity for its own sake.

Four summary recommendations

In the second half of the video, the speaker distills the whole talk into four concrete recommendations:

1. Understand the complexity your customers can tolerate: look at how technical your audience is and how large the buying team is, to decide how granular and flexible your rate card can be.
2. Predefine the "pricing signals" you'll watch: use both qualitative (community, interviews) and quantitative (churn, adoption) methods to judge whether a given price change is healthy friction or dangerous friction.
3. Price for "loyalty" early, not just for acquisition: distinguish genuine power users from token tourists, and design your value metric and packaging to favor the ICP you want to build a long-term relationship with.
4. Always be differentiating: experiment not just with price points but with the "value story" too. When changing prices, pair it as much as possible with a new product or new packaging, giving customers a narrative about "what's new," rather than just "it got more expensive."

Risk in the agent era and the "Governance Gap"

In the final major section, the video focuses on: "What new risks does usage-based billing face when the primary user shifts from a human to an agent?"

They point out that agents introduce three things:

- Instruction ambiguity: a vague prompt can easily be "over-interpreted" by the agent.
- Massive scale: an agent can complete in seconds what would take a human many clicks to do.
- High action frequency: a single bad prompt can burn through an entire month's worth of tokens or other cloud resources in an instant.

Traditional governance approaches (rate limiting, payment authorization, observability tools) each have their own problems:

- Rate limiting at the usage layer protects your infrastructure costs, but it can't let customers set a budget in the language of "dollars."
- Budget authorization at the payment layer protects the customer's wallet, but from your side, the agent has already incurred charges from the model provider — the money still has to be paid.
- Observability tools are only for after-the-fact investigation, not before-or-during control.

They believe there's currently a governance gap: the market lacks a shared language and mechanism that's precise about both "usage" and "spend," while also being enforceable in real time.

Orb's solution: Agent Wallets

Orb proposes its own new product concept here, "agent wallets":\
The core idea is to use their two strengths in billing — high-speed event ingestion and extremely fine-grained pricing/cost models — to compute in real time exactly "how much a given agent run has spent," triggering an alert or webhook before it exceeds a preset amount, so you can automatically stop the agent or take other control actions.

They emphasize this needs to operate at the "entity level" (e.g., per-agent / per-workflow), and requires a very tight balance between latency, precision, and granularity, so as to prevent agent spending from spiraling out of control while also avoiding false kills on legitimate work.

Finally, they note this product is still in early access, and they're hoping to recruit design partners to jointly explore how to bring "concrete budgets plus real-time limits" as a governance primitive for agents.
