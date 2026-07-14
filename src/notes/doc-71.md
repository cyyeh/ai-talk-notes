---
title: Shipping AI That Works: An Evaluation Framework for PMs
speaker: Aman Khan, Arize
video: https://www.youtube.com/watch?v=2HNSG990Ew8
---
This video presents an evaluation framework for "actually getting AI products live and trusted," aimed specifically at product managers (PMs).

The whole talk breaks down into a few main threads:

1. Why AI products need rigorous evaluation (eval)

The speaker, Aman, is an AI PM at Arize, with a background in self-driving car evaluation, the Spotify ML platform, and recommendation systems. He starts by pointing out that while GenAI is hot right now, most people are still stuck at the stage of "tweak the prompt, vibe-check it, ship it if it looks okay."

He stresses a few things:

- Large models will always hallucinate, and OpenAI and Anthropic themselves have publicly said their models are unreliable and need eval.
- The biggest difference between LLMs/agents and traditional software:

▫ Traditional programs are "deterministic," while LLMs/agents are "non-deterministic" — the same input can produce a different result each time.

▫ Agents can take different paths and make tool calls, so the behavior space is much larger.

▫ Whether a product is good often hinges on "your own data" and pipeline, not just the model itself.

- So eval is a bit like "software testing for the new era," except you have to accept that the results are probabilistic, and you need large sample sizes, metrics, and human annotation to build confidence.

2. What an eval is (the basic form of LLM-as-a-judge)

He uses a simple LLM-as-judge pattern to break down the structure of an eval, which has roughly four parts:

1. Role / task description: tell the judge model "here's the judgment you need to make right now."
2. Context / content to be evaluated: e.g. a piece of text, a conversation, an agent output.
3. Goal / evaluation objective: e.g. judging whether there's toxicity, whether it's correct, whether it used the context, etc.
4. Label definitions and output format: clearly define what counts as good vs. bad, and require it to output a structured label (e.g. ‎⁠"toxic"⁠ / ‎⁠"not_toxic"⁠) rather than a number like 1 to 5.

He specifically warns: don't have the LLM output a numeric score directly, because LLMs are very unstable with numbers — have it output a text label first, and then map that label to a score inside your own system.

At the same time, he notes that eval isn't only LLM-as-judge — it also includes:

- Code-based eval (rules or comparisons written in code)
- Human annotation But LLM-as-judge is the most scalable approach available today.

3. Implementation case study: an AI trip-planner agent

The long middle section is a live demo using an "AI travel trip planner" multi-agent system as the example, walking through the entire flow from prototype to eval.

3.1 Building a simple multi-agent trip planner

He uses LangGraph + Arize to turn an example originally built in CrewAI into a trip planner with a UI:

- User inputs: destination (e.g. Tokyo), number of days, budget, interests (food/adventurous, etc.).
- Underneath, there are multiple agents:

▫ Budget agent: handles budget and spending allocation.

▫ Local experiences agent: finds local experiences.

▫ Research agent: does general information lookup.

▫ Itinerary agent: combines the outputs of the previous agents into the final itinerary.

When the user hits submit, they get a 7-day itinerary broken into morning/afternoon/evening, trying to fit within a $1,000 budget and match their interests.

3.2 From "seems okay" to data-backed improvement

After the first run, he admits himself: "this feels very AI, it's long, and it's hard to read." If this were just vibe coding, it might stop at "seems fine"; what he wants to demonstrate instead is:

- Pull out the LLM call that generates the itinerary and load it into a "prompt playground."
- Treat the UI's variables (destination, number of days, interests, budget…) as prompt parameters, so you can rerun experiments easily in the playground.
- Edit the prompt in the playground:

▫ Ask it to "stop rambling" and "limit to 500 words" to shorten the output.

▫ Ask it to "use a super-friendly tone."

▫ Ask it to "always request the user's email and offer a discount," testing an extra growth/feedback behavior.

- Running it once shows improvement or oddities on a single sample, but he stresses: looking at just one example is a "vibe eval" — you can't just trust it, you need to move up to comparing at the "dataset level."

3.3 Building a dataset: from traces to a replayable test set

He uses Arize's trace concept to explain this:

- Every user request → one trace, containing many spans underneath (agent, tool, LLM).
- From these production-like traces, you can batch-add the itinerary span into a dataset.
- A dataset is essentially like a Google Sheet:

▫ Each row is one sample: input (destination, duration, style…) plus the model output.

▫ You can manually add human labels (thumbs up/down, friendly/robotic…).

He says most teams today are actually doing eval this way in Excel/Google Sheets, but it easily gets stuck on manual work that doesn't scale. Turning it into a proper dataset is the first step.

3.4 A/B testing: comparing prompt A vs. prompt B on the same dataset

Next he demonstrates the concept of an "experiment":

- Take that same dataset and define two prompt versions:

▫ Prompt A: the original version.

▫ Prompt B: the version with "a word-count limit, friendly tone, and a requirement to ask for email + discount."

- Run both experiments on the same 10–12 examples.
- At the same time, record:

▫ Latency (Prompt B produces shorter output, so average response time is shorter too)

▫ Output content (whether it really became more friendly, whether it really mentioned the discount)

When someone in the audience asked "so what exactly are you evaling?", he mentioned:

- You can eval latency/UX-level metrics.
- You can also eval things like:

▫ Whether it used the RAG context (anti-hallucination)

▫ Correctness (whether the answer is right given the context)

▫ Tone/style

▫ Safety, compliance, etc.\
And all of these can draw on predefined eval templates.

4. Implementing an LLM-as-judge eval, and "trust but verify"

Next comes the core of the whole talk: how to write a good LLM-as-judge eval, and make sure it's reliable itself.

4.1 Writing a tone eval: friendly vs. robotic

He demonstrates a simple eval:

- Task: read a piece of text (the itinerary output) and judge whether the tone is "friendly" or "robotic."
- Be explicit in the prompt:

▫ Define friendly: upbeat, cheerful, warmly engaging…

▫ Require the output to be only either ‎⁠"friendly"⁠ or ‎⁠"robotic"⁠.

- This lets you automatically add a label to every itinerary in the dataset.

Likewise, he also writes an eval for: "does this text offer a discount?" (discount / no discount).

4.2 Run the eval first, then use human annotation to "eval the eval"

After running the eval, he sees a few important things:

- On the original prompt (long-winded, more robotic-feeling), the LLM judge actually labels most of them as friendly, which doesn't match his own subjective impression.
- On the new prompt (requiring email + discount), the discount eval detects a discount almost 100% of the time, showing that the prompt change worked for that specific goal of "discount present or not."

But he immediately warns: you can't trust the LLM judge itself 100%, so you need to do an "eval of the eval":

1. Pick a few samples from the dataset.
2. Have a human (PM/SME) label each one:

▫ Is this output actually friendly or robotic?

3. Write these human labels back into the dataset, so the same table has both:

▫ human_label_friendly

▫ llm_label_friendly

Then write a code-based eval to compare whether the two match:

- If a large number of samples mismatch, that means the eval prompt itself is poorly designed and needs a rewrite.
- When he actually ran this, he found: the friendly eval barely agreed with humans at all → this eval is bad and has to be fixed.

This is what he means by: "you need to eval your eval."\
And this can be iterated on continuously: run the eval → have humans spot-check a sample → use a code/second-layer eval to check the agreement rate → revise the eval prompt → run it again.

4.3 How to make the eval prompt better

Someone asks, "So how do you actually make the eval more accurate?" His approach:

- Go back to the eval prompt:

▫ Write it more strictly (e.g. make the definition of friendly more specific).

▫ Add few-shot examples: list a few friendly examples and a few robotic examples, so the judge learns where the boundary is.

- Use another LLM as a co-pilot to help you "write the eval prompt," "optimize the eval prompt," and tighten it up.
- Rerun it on the same dataset, recompare human vs. LLM labels, and keep iterating.

His standard isn't "write the perfect eval on the first try" — it's building a workflow that lets the eval keep getting better through human annotation plus prompt iteration.

5. From development to launch: eval as the "new product requirements document"

The later Q&A covers a few important ideas:

5.1 The eval iteration loop

He sketches out a loop:

- Development stage:

▫ Experiment with prompts + evals on a small CSV/dataset.

▫ Don't chase statistical significance — just catch obvious bugs and differences.

- Before launch:

▫ Accumulate more representative samples, so the dataset gradually covers more "hard scenarios."

▫ Similar to how self-driving cars expand step by step, from "straight lines only" → "can turn left" → "turning left with a pedestrian present."

- After launch (production):

▫ Keep running evals continuously against real traffic.

▫ Add problematic or "boundary-ambiguous" samples into the golden dataset, so they become regression tests for future iterations.

▫ Keep shuttling hard samples back and forth between dev and prod, enriching the test set.

5.2 Eval as the PM's "acceptance criteria"

He makes an important proposal: treat eval + dataset as the new PRD/acceptance criteria.

In other words, as an AI PM:

- Don't just write a PRD saying "this agent should be friendly, shouldn't hallucinate, should respect the budget."
- Also hand the engineering team:

▫ A dataset with human annotations.

▫ A set of eval definitions (tone, correctness, use-of-context…).

▫ A set of target values (e.g. "hallucination rate on this dataset must be below 1%," "tone must be friendly > 95% of the time").

- This way, before launch, the team can decide whether it's okay to ship based on the eval results.

For a PM, eval becomes a much more concrete, executable form of "product requirement."

5.3 Shifting team and role dynamics: AI PMs get more technical, engineers get more product-minded

In the Q&A, they also discuss a lot about roles and organizational questions:

- AI has massively shortened the time from "idea" to "usable prototype" — sometimes you can go from a new prompt → eval → launch within a single day.
- PMs have more and more tools (e.g. AI coding assistants like Cursor) to directly touch code, write scripts to generate synthetic data, and tune prompts.
- He encourages PMs to:

▫ Personally feel the pain of writing evals, so they know what kind of people to hire and what interview questions to ask.

▫ Try to understand the codebase as much as possible (even without production write access), using an AI IDE to read, ask questions, and generate experimental code.

▫ Build their own high-fidelity prototypes using a small amount of real or sampled data, to produce a demo that "engineers are forced to take seriously once they see it."

- At the same time, he also believes engineers will increasingly think about "what to build," not just "how to build it" — the line between product and engineering will blur, turning into a team with a complementary "skill stack" rather than rigid job-title divisions.

6. The role Arize/Phoenix plays here

Finally, he briefly introduces Arize/Phoenix itself:

- Phoenix is the open-source version; Arize is the commercial version (more complete, more scalable, more secure).
- Both are built on OpenTelemetry and a traces/spans model, and can automatically capture, from various frameworks (LangGraph, LangChain, etc.):

▫ The agent graph (which agents/tools connect to which)

▫ Each span's input/output, latency, etc.

- They provide:

▫ Trace visualization (agent graph, tool calls, session conversations).

▫ A prompt playground (prompt editing and A/B testing with data attached).

▫ Dataset management and a human annotation interface.

▫ LLM-as-judge eval templates and custom evals (including custom model endpoints, e.g. BERT or in-house models).

▫ Pipeline/CI integration (automatically running evals on a PR or deploy).

His summary point is: in the AI era, "eval capability" will become one of the moats for AI teams, and if a PM can master the design and workflow of eval, they can truly turn "a demo that produces something" into "a stable, shippable product."
