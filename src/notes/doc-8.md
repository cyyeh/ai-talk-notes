---
title: Agent Optimization with Pydantic AI: GEPA, Evals, Feedback Loops
speaker: Samuel Colvin, Pydantic
video: https://www.youtube.com/watch?v=A48uhxfxbsM
---
This video shows how to use Pydantic AI, Logfire, and GEPA (Jepa) to implement an AI agent workflow that runs "from production to continuous optimization," including a hands-on demo of evals, prompt optimization, and managed variables.

1. Introduction to the Pydantic AI + Logfire ecosystem

Samuel Colvin starts by explaining Pydantic's three current products:\
the Pydantic data-validation library, Pydantic AI (an agent framework), and Logfire (an observability platform built on OpenTelemetry). He notes that he doesn't really believe "AI observability" deserves to be its own category — it's more like a feature of general observability — so Logfire supports logs, metrics, and traces together, and also extends into "AI-specific" features like evals and managed variables.

2. How GEPA (Jepa) does prompt optimization

Next he introduces GEPA / Jepa:\
it's an optimization library built on "genetic algorithms + a Pareto frontier," used to optimize "a single string" — which can be a simple prompt or a JSON structure (containing the model, tools, parameters, etc.). Roughly, the process works like this:

- From a batch of candidate prompts, find the group that performs best across multiple metrics (the Pareto frontier).
- "Breed" these good candidates together to produce the next generation (mixing parts of their content, introducing some mutation).
- Repeatedly evaluate → keep the good ones → generate new candidates, gradually climbing toward a better prompt.

Here he uses a Pydantic AI agent as the "proposal agent," having it generate new system prompts for Jepa — achieving the effect of "using an agent to optimize an agent."

3. Example: using Wikipedia to analyze the political dynasties of UK MPs

The example task is:\
from each UK MP's Wikipedia page, extract "which direct relatives or ancestors were also politicians," then work out the proportion who come from a "political family background."

The pipeline roughly works like this:

1. Pre-fetch every MP's Wikipedia HTML and save it as local files.
2. Use BeautifulSoup to convert the HTML to plain text.
3. Define a Pydantic schema: MP, Relation (name, role, relation-type, e.g. parent, grandparent, spouse...).
4. Build a structured-output agent with Pydantic AI and have it output a "list[PoliticalRelation]".
5. Practical difficulties:

▫ It's hard for an LLM to strictly follow a rule like "only count ancestors — not spouse/child/sibling."

▫ It also confuses "politicians" with "other public figures."

▫ Samuel's eventual pragmatic solution: let the model return all relations first, then use code afterward to filter out peers and descendants.

This example then becomes the playground for the evals and GEPA optimization that follow.

4. Building a golden dataset and an evals workflow

To evaluate how good the agent is, he prepared a "golden relations" JSON:\
for each MP, marking the "correct list of political relations." This golden data was itself produced using a strong model (Opus 4.6) plus a similar pipeline, then heavily corrected through manual spot checks.

In terms of code structure:

- There's a ‎⁠load_dataset⁠ function that reads the MPs, HTML, and golden relations, assembling them into an eval dataset.
- A custom evaluator compares the "model output" against the "golden answers" to compute:

▫ An accuracy score for fully correct or partially correct answers (e.g. 0.9).

▫ Whatever other metrics/assertions you want.

- Then Pydantic AI's eval interface runs dataset.evaluate(agent_function, …) and sends the results to Logfire.

He demonstrates two prompts:

1. A very short one-line instruction (the baseline prompt).
2. A longer, more professional expert prompt that explicitly spells out the rules.

Test results (on a test subset of about 65 cases):

- The simple prompt gets about 0.85 accuracy.
- The expert prompt gets about 0.92.

Inside Logfire you can:

- See the input, output, golden answer, and score for each case.
- See aggregate metric statistics.
- Compare the differences between two experiments and observe error cases (e.g. wrongly counting a spouse, or mistaking a public figure for a politician).

5. Automated prompt optimization with GEPA / Jepa

Then comes the main event: hooking the eval pipeline up to Jepa so it automatically iterates the system prompt.

To implement this, he built an "adapter":

- Jepa requires you to provide an adapter that tells it:

▫ How to generate new candidates (build a proposer agent).

▫ How to evaluate candidates (evaluate).

- Inside the adapter, Samuel built a proposer agent using Pydantic AI:

▫ Its system prompt is something like "you are an expert prompt engineer; based on these eval results, rewrite a better system prompt."

▫ Every time Jepa needs a new candidate, it calls this agent.

- Inside evaluate():

▫ Run an eval once using the dataset and custom evaluator from before.

▫ Return an EvaluationBatch containing this candidate's scores (which can be multi-dimensional, e.g. accuracy, cost, latency…).

He then actually ran an example, setting parameters like max_calls=400:

- Jepa repeatedly:

▫ Uses the proposer agent to generate a new prompt.

▫ Runs the eval and produces scores.

▫ Uses Pareto frontier logic to decide which prompts are worth keeping/mixing.

- Result:

▫ It eventually found an optimal prompt with about 96.7% accuracy — a good deal higher than the hand-written expert prompt.

▫ The downside is that the prompt becomes longer and more verbose (e.g. repeating a bunch of rules over and over to avoid including the wrong relation type).

He also touched on some practical points:

- This kind of approach is a great fit for "letting a cheaper, faster model do work that used to require a SOTA model" — take Shopify's example:

▫ Originally they fed an entire site to GPT-5 to judge fraud/tax categories;

▫ Later they switched to: a smaller model + agent + a Jepa-optimized prompt, dropping the cost from roughly 5 million a year to 60-70K, while quality actually improved.

- If your task is very open-ended (e.g. a general-purpose coding agent), you need enough diverse eval cases for this to be meaningful — otherwise it's easy to "overfit onto a handful of paths in the eval set."

6. Difficulties with evals, and key Q&A discussion points

The mid-session Q&A raised some important points:

- What if you don't have a golden set?

▫ You can combine "partial manual labeling" with "programmatically verifiable conditions" (e.g. whether the code runs, whether it uses a library that doesn't exist).

▫ Or use LLM-as-a-judge, though he prefers a deterministic evaluator.

- The variance problem:

▫ If each case only runs once, the model's randomness will cause big swings.

▫ In serious scenarios (e.g. a hedge fund), you might run each case many times and spend tens of thousands of dollars on nightly evals.

▫ Inside the Jepa adapter you can define custom scores — including accuracy, variance, and so on — turning it into multi-objective optimization.

- Systematic errors:

▫ If the training/validation data isn't large enough or its distribution is skewed, it's easy to over-optimize — or wrongly penalize — some relation type (like uncle/aunt).

▫ Strictly speaking, you need more data split into separate train/validation sets to avoid overfitting.

- Prompt-model coupling:

▫ A prompt optimized for one model has to be re-optimized almost from scratch when you switch models.

▫ This is also why a lot of teams end up "just writing one decent prompt and tuning it by feel," since models get updated so often.

▫ But in scenarios with huge volume or a large potential cost saving (e.g. finance, risk control, large-scale classification), investing in this kind of optimization is still very worthwhile.

- Relationship to fine-tuning:

▫ Prompt/agent optimization vs. fine-tuning are two competing approaches.

▫ In most cases fine-tuning is too expensive and gets overtaken by the next generation of models, so the official line is often "it's not worth it."

▫ But for companies continuously running the same task at scale, fine-tuning can still make sense; an approach like Jepa is a lighter-weight option that can be rerun as models get updated.

7. Managed Variables: adjusting prompts/models without redeploying

The second half turns to Logfire's managed variables, with the goal of:

- Extracting settings like "prompt, model choice, temperature, etc." into a type-safe Pydantic model.
- Using this managed variable in code, instead of hard-coding the prompt and model into the program.
- Storing this variable's value inside Logfire itself, so it can be edited directly through an online GUI and used for A/B testing, without redeploying the service.

He demonstrates a simple FastAPI site:

- The front end is a form that lets the user enter a "constituency or question."
- The agent backend has a tool that can grep the MPs HTML folder to find the relevant MP, then answer "who is the MP for this area."
- The managed variable (e.g. ‎⁠MPSearchConfig⁠) is a Pydantic model containing:

▫ instructions (a system-prompt fragment, like "please answer in English"),

▫ the model name,

▫ a max_tokens field, and so on.

He demonstrates a few capabilities:

1. In the Logfire dashboard, he changes the instructions from "answer normally" to "please answer in French," and immediately sees the front end's reply switch to French; he then changes it to German, which also kicks in right away.
2. Switching the model from Anthropic to GPT-4.1, just by changing the variable's ‎⁠model⁠ field.
3. Managed variables have a targeting/traffic-splitting mechanism that lets you set things like:

▫ For example, 50% of traffic goes to the "latest version" and 50% to the "old version," implementing an A/B test.

▫ This is implemented on top of the OpenFeature standard, so in principle it's interoperable.

Going further, he pastes the "best prompt" he found earlier via Jepa into a new managed variable, and changes the web agent's tool to use this variable's instructions instead — which means he can:

- Train a good prompt using evals + Jepa;
- Then deploy this prompt live to the actual agent, without restarting the service.

8. Handling user feedback and privacy

The final section covers two topics:

1. User feedback (feedback loops):

▫ Traditional thumbs up/thumbs down get almost no clicks — the signal is sparse.

▫ A better approach is to use "implicit feedback":

⁃ If the user immediately follows up with "no, I meant...," that can be treated as a negative example.

⁃ If the user says "thanks" or just leaves, that can be treated as a successful turn.

▫ These implicit signals can accumulate into eval data, used to update the prompt/agent.

2. Sensitive data and Logfire:

▫ If the data is highly confidential (medical, legal, etc.), you can:

⁃ Avoid logging the raw prompt/response before it reaches Logfire, keeping only a "classification result" or a "good/bad" signal.

⁃ Or use a self-hosted Logfire inside your own VPC, keeping all data on your internal network.

▫ A common approach at large legal-AI companies: only return a "classification result" or score, never any text containing the original content.

9. Summary: the full practical path "from production to continuous optimization"

The video actually walks through this entire path:

1. Write a Pydantic AI agent to solve a concrete task (extracting political relations).
2. Prepare a golden dataset, implement a deterministic evaluator, and run evals.
3. Write a second version of the prompt and objectively compare it using eval metrics.
4. Hook the eval pipeline up to GEPA / Jepa, letting a proposer agent automatically generate new prompts and iterate using the Pareto frontier.
5. Save the resulting best prompt as a Logfire managed variable.
6. Use this variable to drive the agent's behavior in the actual service (a FastAPI web app), with hot updates and A/B testing done through the GUI.
7. Think about how to build a feedback loop from real user behavior, moving further toward "automatically optimizing all the way to production."

The overall point: deploying an agent is only the beginning — the real value comes from having evals, feedback, and observability, letting you keep iterating on the prompt, model, and configuration, turning a system that's still "tuned by feel" into a product process that can be engineered and optimized.
