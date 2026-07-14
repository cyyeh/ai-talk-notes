---
title: AI Attribution: Measuring What AI Actually Did
speaker: Shopify
video: https://youtu.be/0FacVWoVKkw?si=Qp7bsUScen6aqwA6
---
This talk from Shopify is mainly about this: don't just look at whether AI was used — quantify how much of what AI produced actually stuck around and created real value, and how to do that inside a product.

Why "AI contribution" is so hard to measure

The speaker works on merchant store-setup onboarding at Shopify. In the past, they used milestones to measure success — things like adding your first product, changing your theme for the first time, or unlocking your store for the first time.

But now there's an AI assistant called Sidekick, and AI helps out with a lot of things — auto-creating products, editing themes, setting up payments. So every time a milestone is hit, a new question comes up:\
Did AI cause this, or would it have happened anyway?

Most teams only measure two layers:

- Usage: whether AI was opened, how many messages, how many sessions
- Acceptance rate: whether "apply suggestion" was clicked

The problem is, all of this only happens "at the moment AI is used" — it tells you nothing about whether what AI produced actually stayed in the product afterward, let alone whether it led to a good outcome.

She proposes a concept she calls the "evidence ladder":

1. Usage
2. Acceptance
3. Retention: whether AI-generated content gets kept over the long term
4. Outcomes: whether the retained content leads to better results
5. Incrementality: whether these things would have happened anyway without AI

The higher up the ladder, the closer you get to whether AI is truly useful — but also the harder it is to measure.

Attribution: connecting "AI output" to the "final artifact"

She proposes an AI attribution framework whose core idea is: map "what AI produced" one-to-one against "what the user ultimately saved," and classify it.

First, distinguish between two kinds of tasks:

- Deterministic: things like a toggle setting or enabling a field, where there's a clear right or wrong → suited to looking at "full attribution" (AI did it or it didn't)
- Non-deterministic / creative: copy, layout, color scheme — there's no single right answer → better understood through "partial attribution" (AI provides a draft, the user edits it, and it gets kept)

For creative tasks, she breaks the outcome into four states:

1. Attributed: the final saved content is exactly the AI's proposal
2. Assisted: the final content was edited starting from the AI's output
3. Abandoned: AI made a proposal, but it was ultimately thrown out
4. Manual: the whole field has nothing to do with AI

She specifically emphasizes: "assisted matters a lot." For many people, the value of AI is relieving the pressure of the blank page, not fully automating the task. Users may already have their own ideas about brand voice or product features, and just need a starting point to edit from.

So if you treat "full automation" as the only definition of success, you'll miss the real "scaffolding" effect AI provides: helping someone get past the first step, and then letting them finish the rest themselves.

How do you actually do this in a real product?

Take Sidekick helping to "create a product" as an example: AI generates three fields — title, description, image.\
You have to look at attribution at the field level, not just at whether a Sidekick session was ever opened.

For example:

- The title is accepted exactly as-is → Attributed
- The description is edited and then saved → Assisted
- The image is rejected outright and not used → Abandoned

Once you break it down by field, you can see AI's real performance at scale:

- Which fields AI performs well on (mostly kept or lightly tweaked)
- Which fields get discarded often (high abandonment rate, signaling a priority to improve)

She found that:

- SEO-type fields (e.g., meta description) are often accepted directly, because merchants don't have strong opinions about them
- Fields like price and supplier are almost always manual, because merchants know exactly what they want to enter → don't force AI in here
- Creative fields like title and product description don't necessarily have high full attribution, but the "assisted rate" is very high → meaning AI works well as a draft machine

Technical details: how do you decide "similar enough to count as AI having helped"

The key challenge is: what counts as an "edit" rather than a "rewrite"?\
She gives the example of a product title:

- AI: Handcrafted Ceramic Mug Ocean Blue 12 oz.
- Actually saved: Ocean Blue Ceramic Mug

Different similarity algorithms produce completely different conclusions:

- Text edit distance (Levenshtein): might be judged as 64% rewritten → closer to manual
- Token overlap: 4 of 7 words retained → looks more like assisted
- Vector embedding (embedding similarity): semantically almost identical → could be treated as fully attributed

Her conclusion is:

- There is no "single right answer"
- Structured fields can use simple token overlap
- Free-text fields are better suited to embedding similarity
- The key point: in your product's context, "choosing a method + choosing a threshold" is exactly how you end up defining "how similar counts as AI having contributed"

The iceberg metaphor: a clean attribution table hides a mountain of engineering

From a data-engineering standpoint, she stresses that the attribution table is just "the tip of the iceberg" — underneath it is a lot of grinding work:

- Stitching together events scattered across different systems: AI suggestions, admin-panel actions, backend save events, each with its own ID/schema/latency
- Deciding the measurement granularity: should the unit be a session, a field, or a single suggestion? Too coarse and you lose the detail; too fine and you're just counting "edits within edits"
- Deciding the scoring time window: something that looks attributed right now might get changed and become abandoned seven days later → the observation window you pick is effectively the metric you're defining
- Credit assignment: if the same field sees multiple interactions with AI, do you count the last one, or the first suggestion that got the person unstuck?
- Deduplication: the same action can show up repeatedly across multiple event streams; if you don't handle this, AI's contribution gets counted many times over

She adds that these data-pipeline and design decisions are an important but unglamorous part of a data engineer's job — and they're the prerequisite for good attribution.

Full automation vs. partial automation: the goal isn't necessarily to remove humans entirely

A lot of people's first instinct is: "more automation is always better."\
But she cites a study on the economics of AI automation that points out:

- AI's cost curve is "convex": going from mediocre to pretty good is relatively easy and cheap; going from pretty good to nearly perfect sees costs explode
- For many complex, multi-step tasks, the endgame is actually "human-machine collaboration," not full AI takeover
- Low-complexity tasks move more easily toward full automation; high-complexity tasks will keep a human in the loop for the long haul

So for work like product descriptions, the sensible strategy is:\
Have AI supply a draft that's roughly on-brand, and let merchants with their own ideas edit it — rather than chasing the fantasy of always producing perfect content in one shot.

Her framing is: assisted isn't a second-class state — it's quite possibly the final long-run equilibrium.

The metric trap: Goodhart’s Law and guardrail metrics

Once attribution becomes a KPI, product teams will naturally look for ways to "inflate" it:

- Defaulting to showing AI-generated content
- Burying the manual path deep in the UI
- Aggressively pushing AI output in the interface

All of this makes the "percentage attributed to AI" look great, while the actual experience can get worse.

She cites Goodhart’s Law: once a measure becomes a target, it stops being a good measure.

So you need a set of "guardrail metrics" to watch alongside it, such as:

- Edit rate
- Revert rate
- Retention

If attribution goes up while retention goes down, it means users were only "talked into accepting it" in the moment, and later changed it back — the actual quality wasn't good.

Beyond that, you also need to look at the more ultimate business outcomes:

- Do merchants who kept AI content actually hit key milestones faster?
- Do they actually have better sales?

The real question isn't "did AI contribute?" — it's "did that contribution actually mean anything?"

What attribution can't solve: you have to pair it with experimentation

She closes by discussing the relationship between attribution and experiments (A/B tests).

Suppose you see:\
Products with AI-generated descriptions convert 15% better than fully manual ones.\
It's easy to conclude: "AI raises conversion rate."

But there's serious selection bias here:

- Merchants who use Sidekick might already be more proactive and tech-savvy
- The type of products they sell might already be more copy-dependent
- They might even already be better at writing good content to begin with

So no matter how good attribution looks, it can't answer the key question: would these good results have happened anyway, without AI?

Her conclusion:

- Attribution is good at "discovering patterns": which fields AI is commonly kept in, which scenarios have a lot of assisted usage
- Experiments (incrementality tests) are for "proving lift": how much worse a control group without AI actually performs

A better approach is:

- Use attribution first to find high-potential scenarios (e.g., a description field with a high assisted rate)
- Then design experiments for those specific scenarios, rather than asking a vague question like "does AI help overall?"

The final summary: to understand how much value AI is really creating, you need both attribution and experimentation.

Four key takeaways from the end of the talk

1. For creative tasks, "assisted success" is itself a KPI — don't blindly chase fully replacing humans; optimize for "unblocking people" instead.
2. Attribution must always be paired with guardrail metrics (edit rate, revert rate, retention, etc.), to avoid sacrificing the experience just to drive up AI metrics.
3. Attribution is for discovering patterns, experimentation is for proving incrementality — you need both, and neither can be skipped.
4. Don't just measure "usage" and "acceptance"; measure "what ultimately survives" — that is, the actual residue and impact of AI output in the final state of the product.
