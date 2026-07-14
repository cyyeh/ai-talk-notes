---
title: Ship Real Agents: Hands-On Evals for Agentic Applications
speaker: Laurie Voss, Arize
video: https://www.youtube.com/watch?v=Xfl50508LZM
---
This video is a long, hands-on workshop teaching you how to seriously test an AI agent using evals — the point is to turn "testing by feel" (vibes) into a data-driven, iterative engineering process.

What this workshop is about

Laurie starts by pointing out that a lot of teams just run a few queries, decide it "seems to work," and ship it — then run into:

- Edge cases, malicious input, or just plain dumb questions make it blow up
- They tweak a line in the system prompt, the tone gets better, but it starts making up features out of thin air and nobody notices
- Switching model versions (e.g. Sonnet 4.5 → 4.6) means retesting everything, which is extremely painful

To solve this "vibes problem," he uses Arize Phoenix together with the Claude Agent SDK to build a complete pipeline from scratch, evaluating a "financial analysis agent" (input: a stock/focus area, output: an investment report).

Concepts: traces, spans, and evals

He first translates ML-insider jargon into plain language:

- A trace is simply a record of an AI's execution, like a log — it captures the input/output and metadata (token counts, latency, cost, etc.) for every LLM call, tool call, and agent turn.
- A trace is made up of many spans; a span is a single step. An agent turn can contain multiple child spans.
- An eval is essentially a test: it uses traces (log data) to automatically judge "how good was this run."

Why can't you just write traditional unit tests?\
Because LLM output is "a huge space of answers that could all be correct" — you can't do a simple string comparison. All you can really ask is "did this response satisfy the requirements/facts/tone," not "is the string exactly identical."

Three kinds of eval: code, LLM judge, human

He splits evals into three categories, stressing that they're "complementary," not mutually exclusive:

1. Code eval

▫ You write your own Python/TS function — fully deterministic, fast, and cheap to run.

▫ Good for checking things like: format (is it valid JSON), length limits, required fields, whether a forbidden phrase appears (like "As an AI language model…"), or whether a specified stock ticker is mentioned.

▫ The downside is it gets fragile on complex cases and can't understand meaning.

2. LLM-as-a-judge

▫ Use a (usually stronger) LLM to look at the input, output, and context, and judge it against a rubric you provide: accuracy, faithfulness, tone, policy compliance.

▫ The upside is it understands meaning — it can judge whether the "tone fits" or whether it's "actually answering the question."

▫ The downside is it's expensive, slow, non-deterministic itself, and can make mistakes; you also have to make sure the "judge's own prompt" is well written, or the scoring skews.

3. Human eval

▫ The gold standard, but it doesn't scale at all and can't run in CI.

▫ In practice, humans are used to build a "golden dataset": a batch of clearly labeled examples used to check how well your eval/judge itself is performing.

▫ He cites a statistic: pure human annotators get it wrong roughly half the time due to fatigue and similar factors, so the goal for an eval is to be "as good as, or slightly better than, a human," not perfect.

Why agents are especially hard to eval

A single LLM response is already non-deterministic; agents are even messier:

- A single path involves a chain of tool calls, each step depending on the previous result — an error early on cascades into a disaster (e.g. researching "Tesla" as if it were Nikola Tesla, and ending up emailing the boss an investment report built on that).
- Multi-agent systems add another layer of routing: did the router pick the right sub-agent? Did the sub-agent understand the task? Was the result returned correctly? Did it fail to stop when it should have?

At the same time, you can't write an overly "prescriptive" eval (expecting it to always call A, then B, then do C), because a stronger model might find a smarter path with fewer steps, and you'd wrongly penalize a good result. So the focus of an eval should be "is the output correct," not "does the path match what you imagined."

Two eval roles: capability vs. regression

Laurie uses a very practical framing:

- Capability eval: give the agent a "mountain it currently mostly fails to climb," and see how far up it gets. This is the eval you use while developing a new capability.
- Regression eval: once a capability reaches the bar you want, it becomes a regression test. From then on, every time you change a prompt or switch models, you need to make sure these evals keep passing, so you don't regress.

Your eval suite keeps converting capability evals into regression evals, while you keep adding new capability evals.

Demo: monitoring a financial analysis agent with Phoenix

He demos a simple financial analysis agent:

- Sub-agent A: runs web searches based on the stock ticker to gather data.
- Sub-agent B: writes a financial report based on the research results.
- For the implementation, he uses Claude Haiku as the agent (deliberately picking a "cheap and not-so-smart" model, so it produces plenty of errors to test against).

Through Phoenix + OpenTelemetry + OpenInference, all he has to do is: import phoenix.otel as px

px.register(project_name="... ", auto_instrument=True)

and every LLM call, tool call, and agent turn is automatically turned into spans and shipped to Phoenix Cloud, where he can see:

- The input (e.g. "Analyze TSLA, focus on growth outlook") and output (the full report) for every top-level trace.
- The query and returned content for every internal web search.
- Metadata such as token counts, cost, and latency.

He then runs 12 test queries (various stocks and focus topics, plus an Apple vs. Microsoft comparison and Rivian, a company with sparse data) to accumulate traces in preparation for writing evals.

Before writing an eval, read the traces first

He emphasizes a step that a lot of tutorials skip: actually open up the traces, read the content, categorize the failure types, and only then decide what to test — instead of designing evals behind closed doors.

In these traces, he finds several typical failures:

- In the Apple report, the agent thought it was running inside "Claude Code" and tried to write the report out as a Markdown file to disk, which blew up because the Colab environment had no write permission.
- In the Amazon task, the whole report talks about AWS, without ever covering Amazon as a whole.
- For a company with opaque data like Rivian, the agent produces very specific numbers that look like "confidently made-up nonsense" — something that should raise particular suspicion.

The point of reading traces is to break "the output looks off" down into:

- Is the data itself wrong?
- Is the tool selection/parameters wrong?
- Was the conclusion reasoned incorrectly?
- Or is the agent just hallucinating numbers?

This directly tells you what eval to write, and what to fix.

Implementing a code eval: start with the simplest deterministic check

The first eval he writes is: does the output mention the stock ticker?

The implementation is just a decorated function (e.g. ‎⁠@create_evaluator(kind="code")⁠) that uses regex to find uppercase ticker symbols, filters out some non-ticker strings, and checks whether one of them shows up in the output.

Running it, he finds: 2 of the 13 traces fail (Tesla and Amazon), which immediately exposes:

- Tesla: the earlier file-write failure.
- Amazon: the report ends up only about AWS, never treating Amazon as a whole as the subject.

This shows that code evals aren't just a "toy" — they can catch very real problems, at almost zero cost.

He also flags two design principles:

- Test the "result," not the "path" (don't check that web search must be called a specific number of times — as long as the output is correct, that's fine).
- Text parsing can be flexible (e.g. 2 hours, 120 minutes, or some number of seconds are all essentially the same thing and should all be accepted).

Built-in LLM evals: correctness vs. faithfulness

Phoenix ships with some built-in LLM-as-a-judge eval templates, such as:

- correctness (factual accuracy, logical consistency)
- whether tool selection/invocation is reasonable
- document relevance
- refusal detection, etc.

You can specify which LLM to use as the judge, and the underlying rubric prompt is visible — not a black box.

He first runs a correctness eval with Sonnet as the judge, to see whether these financial reports are "factually correct."

Result: all 13 score 0.

Only by reading the explanations does he discover why: Sonnet was trained in 2025 and knows nothing about 2026 earnings forecasts, but the agent used web search to pull "future predictions" to write the reports. So the correctness eval kept ruling "I can't see where these numbers come from, so they all count as wrong."

This example is crucial: picking the wrong eval type is even more fatal than a bad prompt. The same agent scores 0/13 on correctness, but 13/13 once you switch to a faithfulness eval.

The faithfulness eval works by treating "the output of the research step" as context, then having the judge ask:

Does this report faithfully follow this context, rather than making things up out of nowhere?

This way, the judge doesn't need to know the latest earnings itself — it just compares the report against the research content. This design actually reflects what you care about (whether it invented things beyond its sources), rather than judging "the truth of the world."

Custom rubrics: designing an "actionability" eval

Since there's no built-in eval for "is this report actually useful — can it inform a decision," he demonstrates designing an LLM judge rubric from scratch to determine whether a report is actionable.

He breaks it into a few key structural pieces:

1. Define the judge's role Give it domain context: you are a professional financial analyst, and your job is to judge whether the report is useful to an investor.
2. Spell out criteria explicitly Don't write "good / helpful / accurate" — write "observable and concrete" conditions instead, for example:

▫ Conditions for actionable: a clear buy/sell/hold recommendation, forward-looking analysis, concrete risks and figures, suggested entry/exit price levels, etc.

▫ Conditions for not actionable: merely summarizing public information, only historical description, no clear recommendation, or no differentiation between possible scenarios. And these conditions are extracted from failure patterns he genuinely saw while reading traces earlier — not invented out of thin air.

3. Clearly tag the input data Use tags (e.g. ‎⁠<BEGIN_QUERY> / <END_QUERY>⁠, ‎⁠<BEGIN_REPORT> / <END_REPORT>⁠) to wrap the user's question and the report, so as not to confuse the judge.
4. Provide concrete labeled examples This is the part he keeps stressing is the most overlooked, yet most important.

▫ Give a "good example": one containing concrete data, risks, and recommendations, ending in a clear action like "accumulate on dips below price X."

▫ Then give a "bad example": something that just says "Nvidia is a leading semiconductor company with growth potential," with no statement of what to actually do. LLMs are far better at "learning the pattern from examples" than at reading a pile of written instructions alone.

5. Constrain the output format Have it output only ‎⁠actionable⁠ or ‎⁠not actionable⁠ (add a third category like ‎⁠partially actionable⁠ if you genuinely need one), rather than a 1–10 score or a lengthy explanation. He also takes a swipe at "1–10 scoring scales": if the rubric doesn't explicitly spell out "the difference between a 6 and a 7," then that number is just injecting noise.

In practice, it's common to first ask it to "explain its reasoning in natural language (chain-of-thought), then output the label at the end" — this not only raises accuracy, but also lets you see the explanation in Phoenix, which helps you debug the eval itself.

Running this custom-rubric actionability eval across the 13 traces, only about half were judged actionable — meaning this is a good capability eval: there's enough room for failure to let you climb.

Meta-eval: how do you know the eval itself is trustworthy

At this point, you already have a code eval, a faithfulness eval, and an actionability eval — so the next question becomes:

Why should I trust these evals?

He introduces the idea of meta-evaluation:

- Treat the LLM judge as a classifier, and compute precision/recall on it just like you would for a typical ML task.
- Build a small golden dataset: have humans (ideally several domain experts) look at the reports directly, label them "actionable / not actionable," and record the results in Phoenix annotations.
- Run the judge on this same batch of data, compute the "judge vs. human" precision/recall, and see which kind of error shows up more.

A few key points:

- High precision: when the judge says "fail," it's usually genuinely a failure (few false positives).
- High recall: most cases that are truly failures actually get caught (few false negatives).
- For most eval purposes, you'd usually rather tolerate a few more false positives (reviewing a few extra cases that turn out fine) than let a serious error slip through.

He also notes that agreement between humans is never that high to begin with — for many tasks, two annotators only agree 0.2 to 0.3 of the time — so your expectation for an LLM judge should be "roughly as good as, or a bit better than, a human," not 100% agreement.

You should also keep checking for common biases:

- Length bias (longer answers always score higher).
- Position bias (when choosing between two options, always favoring the first or the second).
- Self-preference bias (the same model acting as both generator and judge).

To reduce bias, he recommends keeping the judge model different from the production model wherever possible (e.g. use Claude for the agent and OpenAI for the eval, or vice versa).

Dataset & Experiments: actually "proving" you've improved

Once you have:

1. Read the traces,
2. Built the evals,
3. Used the evals to find common failures,
4. Made concrete prompt changes based on the explanations (e.g. requiring it to always list financial ratios, news from the past 6 months, and an explicit buy/sell/hold)

the next step is to move into an "experiment" phase, rather than eyeballing a few examples again and declaring it "feels better."

The workflow roughly looks like:

- Collect the traces that previously failed the actionability eval and save them as a dataset.
- Write a task function that takes an input, runs it once through the "modified agent," and returns the output.
- Using the same actionability eval, score the old and new agent on the same batch of inputs and compare the difference.

In the workshop, he deliberately makes the change dramatic: after the prompt edit, all 6 previously-not-actionable cases become actionable, and the chart shows a line jumping from partial pass straight to full pass. But he also notes that in the real world it's usually many small steps: a given change might only lift the overall score by a few percentage points, or even make it worse, in which case you'd roll back to the previous prompt version.

The core principle of experimentation is:

- Keep the "input" and "judging method" fixed, and only change the agent — this is fundamentally an A/B test.
- That way you can reasonably conclude that "the score change is a result of the prompt/design change."

Impact hierarchy: where should you fix things first?

Once you start iterating on "read traces → change something → run an experiment," you need to know where to spend your effort:

1. Data quality: if the source data is wrong, stale, or bad, no amount of prompt-writing will save you. First make sure your RAG corpus, APIs, and web search sources are themselves trustworthy.
2. Prompt design: adding few-shot examples, explicit rules, and things to forbid or require is usually the highest-value-for-effort change.
3. Model choice: switching to a stronger model can solve certain capability problems that are otherwise unsolvable, but it costs more, so you need to weigh the cost/accuracy trade-off. You can compute what's called cost-normalized accuracy (accuracy ÷ cost).
4. Hyperparameters (temperature, top-p, etc.): usually the lowest-impact thing, and the last thing you tune.

Golden datasets, the data flywheel, and cross-team collaboration

He keeps stressing that eval isn't a purely engineering matter, but cross-functional work:

- Defining a "good answer" requires bringing in domain experts, PMs, customer support, sales, and end users.
- Their judgment gets encoded into the golden dataset and rubrics, which over time forms a data moat that belongs uniquely to your product.

Every time you hit a new failure in production, you can add that trace to the dataset, update the eval, and use it to supervise the agent in turn — forming a data flywheel: more real data → better evals → a more reliable agent → more usage → more data.

How far do you really need to take eval?

Finally, he offers some practical advice:

- When should you start doing evals? When you notice that "every prompt change breaks something and you don't know what," or "eyeballing vibe checks has become your development bottleneck," that's when it's time to bring in evals.
- How many samples do you need?

▫ Workshop-level experiments: a dozen or two samples is enough to see a direction.

▫ To actually use it as a ship/no-ship criterion, somewhere around 200–400 is more reasonable — you can use statistical methods to compute a confidence interval (e.g. if the target is a failure rate <5%, 200 samples showing a 3% failure rate might still have a true interval that crosses 5%; 400 samples would narrow that).

- Online monitoring In enterprise-grade Arize AX, you can continuously sample production traffic and run evals on it, watching for model quality drift, changing usage patterns, adversarial attacks, and so on.
- Eval-driven development Write the eval before writing the feature (like TDD), giving the agent a capability mountain to climb — then when models get upgraded down the line, just rerun the eval suite to know whether it's actually gotten better.

To sum up, this video takes you from "what is an eval" all the way through "how to use traces, code evals, LLM judges, custom rubrics, meta-evals, datasets, and experiments" to build a complete, iterable evaluation system — turning agent development from "going on instinct" into "engineering with data and process."
