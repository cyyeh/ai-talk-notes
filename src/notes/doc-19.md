---
title: Breaking the Proof-of-Concept Cycle: Stop Prototyping and Get Into Production
speaker: Neha, GitLab
video: https://youtu.be/Wkpt2MDCaxI?si=5XD4Ok5GS9FRYY8I
---
This GitLab talk is about one thing: everyone is running AI experiments, but few of them actually go live as "stable, usable, maintainable" systems — and she offers a practical framework for getting from "prototype hell" to "a product that actually delivers."

Why does everyone get stuck in "prototype hell"?

The speaker, Neha (GitLab's Director of Data Science and Analytics), first describes the current state of things:

- Data teams are naturally curious and love doing research, and with AI tools evolving so fast, the result is "an endless stream of new ideas, new PoCs."
- There are always more questions to answer, so the backlog is effectively bottomless, and there's always a reason to build one more prototype.
- These days it's not just the data team experimenting — non-technical teams in sales, operations, and product also feed CSVs into AI tools themselves, build their own dashboards, and put together their own simple prediction models (their own lead scoring, their own sales forecasts), which sometimes end up conflicting with the official models.

This creates a state of sprawling chaos: small tools, small experiments, and small bots everywhere, but no unification, no governance, and no genuinely stable "productization."

She stresses: this chaos can't really be stopped, and shouldn't be forcibly stopped, because it shows people are genuinely using data and AI — they just need to be "guided."

The three-step framework she proposes

She frames the whole talk around a three-part structure:

1. Embrace the chaos
2. Find & cultivate product-market fit
3. Thin the garden
4. Embrace the chaos: don't be the team that says "no"

She says AI tools today are just like Excel used to be: once data gets downloaded as a CSV, people build their own things with it, and it easily spreads and turns into "wild versions." The only difference now is that it's faster, and more people are involved.

Rather than trying to ban it, she suggests:

- Acknowledge that this chaos is normal — even a valuable "exploration phase."
- Build institutional structures that give people "a safe space to experiment": dedicated learning/experimentation time, for instance (something like hackathon spirit), where the expectation is "you don't necessarily need to ship — the goal is to learn."
- Run retrospectives on experiments: even if an experiment never ships, treat it like an agile retro and capture "what did we learn," so failure produces something instead of just getting tossed.

She also mentions where the pressure comes from: it isn't just the data team — sales and product are expected to "have something to do with AI" too. That pressure pushes people into trying things haphazardly, so the data team needs to reframe this "haphazard experimentation" as material for user research, rather than pure technical debt.

2. Find and cultivate "product-market fit"

She takes classic product-management concepts and applies them to "internal data products / AI tools."

The point isn't: do people say this thing is nice to use?\
It's: is it actually being used?

She offers a few things to watch for:

- Some things you poured a lot of care into, built exactly to spec, end up with almost no users after launch — broken for two weeks and nobody even notices.
- Meanwhile, some "ugly but useful views, originally built just for yourself," get passed around like wildfire among colleagues and turn into genuinely valuable tools.

She uses the metaphor of "desire paths": in a park, people wear their own dirt trail around the concrete path that was actually designed, showing where "the route people really want to walk" is.\
For data products, the prototypes that unexpectedly get used like crazy are exactly like desire paths — worth watching closely and mining for product direction.

In practice, she recommends:

- Record and inventory: list out every AI/data prototype currently in the organization — you'll be surprised how many departments and levels they're scattered across.
- Measure by behavior, not just by listening to feedback: look at actual usage frequency, return rate, who's using it, whether people share it on their own.
- Ask yourself: if you shut this prototype down tomorrow, how disappointed would users be? It's a great question for judging product-market fit.

3. Thinning the garden: deliberately cutting some back so the rest can grow

She uses her own experience growing carrots as a metaphor: once the seeds sprout, every seedling looks healthy, but you have to pull some of them out — otherwise they all fight over the nutrients, and in the end none of them grows well.

Applied to the world of AI/data prototypes, that means:

- Accept that "most prototypes will never ship," and actively decide which ones to let go of, rather than letting them die a slow natural death.
- Deliberately pick "the path we're going to focus our firepower on productizing": for example, with a talk-to-your-data solution, you might have three separate groups each running a different tech stack (a self-built vector database, a semantic-layer approach, an external SaaS product) — in the end you still need to settle on which one becomes the "organization-recommended, operable, governable" main path.
- For the approaches that get cut, treat them through the lens of "negative knowledge is still knowledge": document clearly why it wasn't right for now, since that preserved learning may be useful later.

She also cautions that if a team's energy gets spread too thin across too many directions, nothing gets to grow big; you need to make trade-offs deliberately and concentrate effort on the handful of approaches that genuinely have product-market fit and can produce "quantifiable results."

Things you can actually do (the kind you can "start on Monday")

She then turns this framework into a few very concrete actions (mostly team/management-facing):

For "embrace the chaos," actions include:

- Proactively go talk to every department and gather "the little AI/data side projects people are already running on their own," breaking down their fear of "getting shut down by the technical team."
- Formally schedule learning/experimentation time, and build retros into the rhythm: every round of experimentation should produce a "what did we learn?" output, rather than being judged solely on "did something ship?"

For "product-market fit," you can:

- Build an org-wide inventory of prototypes, noting "who uses it, how, and how much."
- Design a simple set of usage metrics and a survey — something like "how disappointed would you be if this feature disappeared tomorrow?" — to decide which prototypes are worth pushing forward.

For "thinning the garden," you can:

- Formally announce which experiments "we're shutting down," but hold a small internal share-out so people clearly hear what was learned, giving everyone closure and letting failure be seen as a valuable output.
- For the handful of chosen "winners," reallocate resources so they get a real chance to be productized, instead of sitting in PoC status forever.

Closing thoughts and mindset

She returns to the contested statistic she cited at the top:\
"95% of AI pilots fail to generate business value."

Her take: even with a 5% success rate, if you have a team of 50 people with three or four ideas each, you'll still likely end up with 7-10 solutions that genuinely make it into production — which isn't bad at all, and the 95% that "fail" are full of things worth learning too.

So she says that if she had to retitle this talk today, she'd change it to:

"Keep prototyping and get into production" —\
in other words: don't stop prototyping, but do it methodically, at a steady cadence, so that the small number of things that truly have value get picked out, nurtured, and productized.
