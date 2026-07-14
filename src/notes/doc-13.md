---
title: Agents Building Agents
speaker: Alfonso Graziano, Nearform
video: https://www.youtube.com/watch?v=aHhB3sjGjkI
---
This video shows how Nearform's Alfonso Graziano builds reliable AI agents using a systematic method where "agents upgrade other agents."

Main theme: an AI agent isn't a prompting problem, it's a systems-engineering problem

Alfonso opens by noting that everyone wants to use AI agents for workflow automation, search, and more these days, but agents come with a whole set of headaches: non-determinism, hallucination, latency, cost, and all kinds of failure modes. So the point isn't to write one perfect prompt — it's to keep iterating and monitoring, in an engineered way.

He breaks an agent down into: an LLM (the brain) + tools (that can call APIs, search, access data) + context + a continuously running "agentic loop." On top of that, you also need observability, evaluation (evals), and a feedback mechanism.

Core concept one: the golden dataset and evals

To quantify how well an agent performs, Nearform builds a golden dataset together with domain experts:

- Each entry represents one task: an input (a user request) plus the expected output.
- The "expected output" isn't just an answer string — it can also be:

▫ which tool should be called

▫ the tool's parameters

▫ the sequence of tool calls (retrieve first, then update…)

Because LLM output is non-deterministic, you need a scorer to grade it, rather than doing plain literal matching. Running the whole golden dataset and scoring it gives you an accuracy baseline you can use to see whether a change made the system better or worse.

He uses a "super-simple Hello World agent" as an example: at first, relying purely on the model's weights with no tools wired in, running the eval only gets an 18% pass rate, because only the simplest arithmetic-type questions can be answered directly from the LLM's training data.

From this he distills a few common causes of failure:

- A tool that should be there is missing (e.g. expecting the ability to fetch data from the web, but there's no web-fetch tool).
- The system prompt is incomplete and doesn't clearly state the expected behavior.
- Context retrieval isn't done well — the agent doesn't know where to look for data, or uses the wrong tool.

Core concept two: AutoAgent – using a coding agent to automatically tune a product agent

He then asks: could you get one AI agent to modify another AI system on its own, making it better and better?

He cites Andrej Karpathy's "auto research" experiment: using a coding agent to automatically modify deep-learning code and hyperparameters, with performance steadily improving and loss dropping over many rounds of experimentation. This inspired his AutoAgent:

- A coding agent (e.g. Claude Code) is responsible for:

▫ Reading the target agent's code, configuration, and traces

▫ Modifying the system prompt, adding/changing tools, adjusting logic

▫ Running evals and comparing the results

- The agent being modified is called the target / product agent — the one that actually goes into production for real users.

The AutoAgent process roughly goes like this:

1. Generate a baseline: run the eval once and write a baseline report recording the current pass rate and which cases fail.
2. Each iteration:

▫ Open a new branch.

▫ The coding agent reads the report and memory, and proposes a "hypothesis" (e.g. add some tool, change some part of the prompt).

▫ Implement the hypothesis: change the code or the prompt.

▫ Rerun the eval and produce a report.

▫ Update the memory file, recording what was done this round and what the result was.

▫ If the metric improves, keep this branch and start a new one from it to keep experimenting.

▫ If it regresses or something breaks, roll back to the last good branch.

After about 10 rounds, the simple example went from 18% up to 83%. On a real-world production agent that had already been optimized by humans, they used this same method to squeeze out roughly another 10% on the eval score, by:

- Finding edge cases nobody had noticed.
- Improving the system prompt and tool descriptions.
- Fixing parts of the tool logic.

Every round leaves behind a complete changelog and report, so a human can go back and look at a hypothesis that seemed "promising but didn't quite pan out," and step in to refine it further if needed.

Core concept three: using real users' live data to improve the agent

The second big theme is: how do you use real online user data and feedback to improve an agent, instead of relying only on offline evals?

The overall flow:

1. A user or tester actually uses the system, for something like "how should I optimize this React component?"
2. The system fully captures the trace:

▫ The user's input and the output

▫ Tool calls, their order, and their results

▫ Latency, token usage, etc.

3. The user or a subject-matter expert gives feedback:

▫ Simple version: thumbs up/down plus a text note on "what was good / what wasn't / what was expected."

▫ Advanced version: an expert annotates each step on a trace platform, pointing out exactly where it went wrong and what it should have been.

4. Once enough traces with feedback have piled up (say, over 100), download them as JSON or a similar format.
5. Run a dedicated "analysis skill":

▫ Have a coding agent read all the traces plus feedback.

▫ Cluster failure modes: identify the 5-7 main categories of error.

▫ Do a preliminary root-cause analysis: since the coding agent can read the target agent's code and also see the traces, it can guess whether the fault lies in:

⁃ the prompt design

⁃ the tool's description or parameters

⁃ some specific piece of code logic

▫ Produce fix proposals for each cluster.

6. Output a detailed markdown report containing:

▫ Statistics on positive/negative feedback, and the negative-feedback rate.

▫ A description of each failure cluster, with its corresponding trace IDs.

▫ Likely root causes and suggested fixes.

Then comes the human decision-making stage:

- Triage together with domain experts:

▫ Which issues need fixing right away, which can wait, and which are actually expected behavior or a user misunderstanding that doesn't need fixing at all.

- For the failure clusters that do need fixing:

▫ Hand the relevant traces and context to the coding agent so it can produce a fix — changing the prompt, the tools, or the logic.

▫ Or make the change with a human's help.

A crucial step is folding these real-world failure cases back into the golden dataset and eval suite discussed earlier. That way, if a future change reintroduces this bug, the eval will catch it right away.

How often reports get generated depends on data volume and product cadence; in practice, a common pattern for them is generating one report per sprint as a recurring input for improvement.

In some cases, once a coding agent has enough context plus a regression suite (regs), it can fix a whole group of similar issues with a single prompt. For more complex situations, they combine this with AutoAgent: treating specific failure clusters as an optimization target for AutoAgent, and having it help produce a draft PR.

Core concept four: Harness Engineering – giving the coding agent a safe, reliable "workplace"

Alfonso calls the underlying architecture that supports all of this Harness Engineering. The key idea: if you want a coding agent to modify code on its own and still be reliable, you have to build it a rigorous "workplace," including:

- A spec-first environment: every failure mode gets written up as an "expected-behavior spec," and the implementation is built from that.
- Quality gates:

▫ Lint, unit tests

▫ The eval suite

▫ LLM code review

- Context engineering: controlling which files and documentation the coding agent can see, and restricting what it's not allowed to do (e.g. it must not modify the golden dataset and the scorer in order to "cheat").
- Observability: fully capturing traces, metrics, and failure cases — otherwise, when the system breaks, everyone's fumbling in the dark, and the coding agent has nothing to improve from either.

Put all together, this lets the coding agent:

- Change code.
- Check its own changes with evals and regression tests.
- Revert and try a new hypothesis if the result isn't good.

Closing

Overall, this video is making one point: getting AI agents to work in real teams and products isn't about finding a "magic prompt" — it's about:

- Having a golden dataset + eval + scorer to quantify quality.
- Using a coding agent (the builder) to systematically optimize the product agent.
- Turning real user traces and feedback into failure clusters, and feeding them back into the evals and the code.
- Using Harness Engineering to build a complete environment of spec, tests, governance, and observability, so this "agents upgrading agents" loop can run sustainably, safely, and under control.
