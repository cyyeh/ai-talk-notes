---
title: Evals Are Broken, Use Them Anyway
speaker: Ara Khan, Cline
video: https://www.youtube.com/watch?v=QuuIywMG4s8
---
This video argues that although all kinds of LLM evals have problems, in practice you should still use them well — and use them the right way.

The main thread of the video is Ara Khan (of the Cline team) sharing how they think about evals while building "coding agents," and how they used a higher-fidelity benchmark like Terminal Bench to optimize Cline all the way up from 43% — with the key not being "switching to a stronger model," but tuning the engineering and recipe (harness + prompt).

1. Two common misconceptions people have about evals

He starts by clearly laying out the two mistaken extremes:

- One side is the "objective metrics camp": looking only at leaderboard scores or dashboards, declaring from a few benchmark percentages that "GPT x and Gemini y are about the same" or "Meta's new model has the highest benchmark score so it's the best." He considers this too naive, because many models score similarly on the leaderboard yet perform very differently in actual use, and there's even an element of marketing hype in "benchmark maxing" — you shouldn't treat it as gospel. [1:33–2:29]
- The other side is the "pure vibes camp": not trusting metrics at all, just saying things like "I just feel this model is a nicer conversationalist," going purely by feel and anthropomorphizing the model — this is also wrong. [2:32–3:07]

His position: the truth lies in the middle. Evals are neither a cure-all nor garbage — they're only valuable when used the right way.

2. How to "correctly" interpret evals other people have already built

Ara offers a few practical heuristics (simple rules of thumb) for interpreting various evals/benchmarks: [3:36–6:18]

1. First rule: don't fully trust eval scores published by an official source or the model's own app. These are usually just rough approximations, and sometimes not very rigorous. Many researchers and engineers themselves don't think those numbers should be treated as absolute truth.
2. Second rule: keep up with new models, but don't be the earliest adopter. [4:20–5:22] He uses the Epochs Index as an example, noting that over the past two years frontier models have been turning over every few months, moving extremely fast. As an ordinary developer, you don't need to switch the moment a new model drops — instead you should let things "simmer for a while," wait a few weeks to see market consensus and real-world testing before evaluating a switch, otherwise you're just serving as a tester for the frontier labs.
3. Third rule: look for evals that are "new enough, and precise enough." [5:23–6:16] Many classic benchmarks (like pass@1/HumanEval, which OpenAI itself says no longer measures frontier coding ability) have questions that are too simple — things like Fibonacci or matrix multiplication no longer represent real-world software engineering. What you need is an eval designed around real tasks and built recently.
4. Treating evals as both an engineering and a philosophical problem

He then discusses how to use evals to improve your own coding agent. [6:20–7:12]

- Engineering side: how to design the test environment, log traces, analyze failures, and tune container resources, timeouts, prompts, and so on.
- Philosophical side: you're really trying to use a finite set of questions to approximate an almost infinite problem space (real-world development tasks); you have to acknowledge that an eval is only an "approximation" — you can't turn it into "a perfect score means I'm invincible in every scenario in the world."

4. Cline's real-world practice: why they built their own eval, and ended up using Terminal Bench

He explains Cline's background: [7:12–9:04]

- At first, ready-made evals were scarce and none felt close to real usage. Many teams (including the Codex team) even flat-out said "these evals are useless, just ignore them."
- Later they felt they still needed some "quantifiable" way to measure things, so they started from real usage data, collected coding sessions with users' consent, spent a lot of manual effort cleaning them up, and produced a set of questions closer to real-world practice, specifically for testing coding agents.
- Meanwhile, Stanford released Terminal Bench: [10:17–11:07]

▫ About 89 questions, covering things like race conditions, DB issues, and infra problems — much closer to real-world work than pure algorithm questions.

▫ Each question requires running the agent in an isolated environment — the agent checks files, reads docs, sets up the environment, and runs tests, and the whole process often takes 30–40 minutes before you know "whether it actually fixed the issue without breaking anything else."

These evals target not single-turn Q&A, but a complete agent workflow.

5. Harbor, infrastructure, and "how to run" an eval like Terminal Bench

Ara then talks about tooling at the execution level: [11:07–12:02]

- To run an eval with 89 questions like this, you need:

▫ Each question mapped to its own isolated VM/container, containing the full repo and environment setup.

▫ Then install the agent you want to test inside it (Cline, Cloud Code, Codex, etc.).

- Harbor (Luda Institute) provides an infrastructure layer:

▫ You can define standardized configurations for each question (Linux, RAM, CPU).

▫ Then run all 89 questions "in parallel" on the infra, so the total runtime ends up bounded by the slowest question, rather than everything running serially for ages.

On the infra side, he mentions you can use Daytona, your own powerful machines, or, like they do, a compute-providing service such as Model. [12:00–12:47]

6. Using evals to "hill climb": the actual method behind going up from 43%

This is the most practical part of the talk, and the key point mentioned in the title summary: [13:00–15:30]

The whole process is:

1. First run a round of Terminal Bench and get an overall score — for example, Cline initially only scored 43%. [14:53–15:05]
2. Collect the traces of all the failed questions. These traces contain every LLM call, command, and step the agent took on that question. [13:01–13:33]
3. Then spin up "another agent" to read these traces and help you categorize the reasons for failure:

▫ Which questions failed because the tests didn't run successfully?

▫ Which questions failed because the retry tool was broken?

▫ Which questions timed out?

▫ Which questions had a prompt that drove the model crazy (endlessly declaring "I am a model")?\
This lets you "portfolio allocate" the failures, and see clearly where the small levers are. [13:19–13:49]

Three major areas that actually move the score:

- The model itself: sometimes the model is strong enough to score well even under a bad harness, but this isn't a sustainable strategy. [13:52–14:07]
- The harness/agent framework:

▫ For example, the same Anthropic model performs differently on Cursor, Droid, or Cloud Code, because each harness has different designs for tool use, file browsing, and retry mechanisms. [14:10–14:34]

- The question set itself: if the benchmark's questions are themselves too easy or irrelevant, even a perfect score means nothing. [14:39–14:47]

The concrete steps Cline took to improve from 43% include: [14:53–15:30]

- Adjusting the container's CPU/memory resource allocation.
- Raising the timeout, to avoid long tasks getting killed before they finish.
- Improving "thinking behavior":

▫ Sometimes the model needs to "think a bit more" so it doesn't jump to conclusions carelessly.

▫ But if you make the model think too long, it enters "stroke mode," starting to frantically repeat that it's a model or spin its wheels, wasting thousands of tokens.

They also maintain a large internal benchmark matrix, continuously testing across various open-source and commercial models, to understand how effectiveness differs across model + harness combinations. [15:28–15:40]

7. Three "improvement zones": avoiding cheating just to post a bragging tweet

Ara divides eval-driven improvement into three zones: [15:40–16:43]

1. Zone 1: obvious bugs/basic issues

▫ Things like the harness crashing outright, or getting heavily rate-limited. These are things you should fix first, right away.

2. Zone 2: the critical "fine-grained optimization" (he considers this the most important)

▫ Includes prompt engineering specific to a given model family.

▫ Some prompting techniques work for Anthropic but don't work at all for Codex or Gemini.

▫ These details explain why "everyone says this model is amazing," yet it performs only so-so under your particular harness.

▫ Through repeated hill climbing, you tune prompt length, format, tool descriptions, and more, so the model truly gets "in sync" with your system.

3. Zone 3: the danger zone — overfitting to the benchmark

▫ This is deliberately hardcoding shortcuts or cheat logic targeted at specific questions, just to post a tweet like "XX model scores 98% on YY benchmark."

▫ He says plainly: a lot of people do this, but don't — he doesn't recommend it either.

8. A final framework and recommendation

In closing he gives a practical framework: [17:00–18:00]

- No matter what kind of AI system you're building (not just coding agents), you should:

a. Find a benchmark close to your problem, or build your own eval.

b. Repeatedly "hill climb" on it:

⁃ Run it round after round, look at the score, analyze failures, make small-lever changes, and run again.

- You must satisfy two things at the same time:

▫ The numbers look good: a "respectable score" on the eval.

▫ It passes the vibe check: it has to actually "work well" in real use, not just be good at taking the test.

- After experimenting, they found:

▫ Their own support for the Anthropic model family was very good.

▫ But support for model families like Gemini was weaker, so they improved it through hill climbing, since this represents a large group of users who like those models and could be brought on board as a result.

Finally, he says openly that if you're interested in these kinds of eval/agent questions, feel free to reach out to him via Twitter/LinkedIn.
