---
title: AI System Design: From Idea to Production
speaker: Apoorva Joshi, MongoDB
video: https://www.youtube.com/watch?v=T0HhO4YtTfE
---
This talk covers a framework for AI system design from idea to production, walking through the whole process using a "health-insurance claims review system" as the example.

1\. Why thinking clearly about what to build matters more than writing code

Apoorva starts by pointing out that in the age of AI writing code, the hard part is no longer "writing the code" — it's figuring out what to build and how to design the system in the first place.\
A casual "wipe code & ship" approach is fine for messing around on a side project, but once a system carries real stakes and other people depend on it, relying purely on trial and error becomes dangerous. [0:57–1:19]

She also cites a view from Anthropic / OpenAI:\
The real technical bar now lies in defining product requirements, system design, and evaluation criteria — not implementation details. [1:30–1:41]

2\. The overall framework: 4 stages

She lays out a four-stage framework for thinking about any AI system: [1:49–2:24]

1. Product Requirements
2. System Design (data, architecture, design patterns)
3. Evaluation & Monitoring
4. Final Optimization (cost, latency, reliability)

These four steps are sequential yet iterative: first nail down what problem you're solving, then design the data and architecture, then quantify results and keep monitoring after launch, and finally — once accuracy is acceptable — squeeze down cost and latency and improve stability.

3\. Worked example: the health-insurance claims review system

She uses "health-insurance claims review" as an end-to-end example, to show how the decisions at each step affect one another. [2:42–3:06]

1. Product requirements: what's the problem, and who are we solving it for

First, scope things with a "business problem statement": [3:45–5:06]

- Users: the insurance company's medical claims reviewers
- Current state: reviewing a single claim takes 2 days on average, far slower than the industry standard (4x slower for routine claims, 12x for urgent ones)
- Impact: delays patients from receiving critical treatment
- Don't presuppose the solution: at this stage, you don't say things like "we need multi-agent" or "we need a chatbot"

Next, gather business and compliance constraints: [5:10–6:06]

- Patient data must stay within an approved cloud environment
- Only models approved for that cloud environment may be used
- Certain complex cases, and every denial decision, must be confirmed by a human physician or senior reviewer (full automation is not allowed)

Next come performance requirements: [6:14–6:26]

- Latency requirements (does it need to be sub-second?)
- A monthly inference cost cap
- Uptime / SLA requirements

Finally, define AI's "role" in the product: [6:31–7:23]

- Is it "critical" or "assistive"? Here it's assistive, since a human is already reviewing anyway
- Is the system "reactive" or "proactive"? This example is reactive (it only triggers once a claim comes in)
- Degree of automation: because mandatory human review is in place, the ceiling here is "semi-autonomous"

And set 1-2 success metrics: [7:28–8:03]

Example:\
Within 90 days of launch, cut the average processing time for "urgent claims" from 2 days to 1 hour.\
This metric is concrete, measurable, time-bound, and maps directly back to the original business pain point.

4\. System design: data strategy and architecture patterns

1. Data strategy: sources, update frequency, preprocessing

She starts with a few core questions: [8:41–8:58]

- What data does this application need?
- Do we have access / can we actually get it?
- Where does the data live, and what does it look like?
- Can the raw format be used directly? What processing does it need?

For the claims system, three major data sources are needed: [8:58–9:29]

- Clinical guidelines
- The insurer's coverage policies
- The patient's claims history

Assume the first two live in Confluence / PDFs, while claims history is stored in MongoDB.

Next, define update frequency, so the system doesn't end up working off stale information: [10:11–10:36]

- Clinical guidelines: updated roughly once a year
- Coverage policies: adjusted roughly once a quarter
- Patient claims history: updated every time a claim is reviewed; if you've promised to "process urgent claims within 1 hour," you need at least hourly syncing

Next, think through data processing and retrieval: [10:42–12:07]

- Guidelines and policies are long documents:

▫ Need to be chunked and embedded

▫ Extract metadata (e.g., procedure name, diagnosis code, publication date)

▫ To support vector search / hybrid search downstream

- Patient claims history is already structured in MongoDB:

▫ Probably just needs PII removed before being fed to the model

On retrieval strategy: [11:20–12:07]

- Guidelines and policies:

▫ Very well suited to vector search

▫ But because of medical terminology / diagnosis codes, it needs to be paired with metadata filters or keyword search → this evolves into a "vector + structured filtering" hybrid search

- Patient records: an exact-match query on patient ID / name is enough

2. System flow and AI design patterns

She first sketches an end‑to‑end flow: [12:42–13:34]

- Receive the claim application and the physician's clinical notes
- Retrieve the relevant clinical guidelines, coverage policies, and the patient's past records
- Send that content plus prompt instructions into the LLM together
- The LLM produces a "recommendation: approve/deny + rationale"
- If it's a complex case or the recommendation is denial: mandatory human review (senior physician / reviewer)
- The final decision and rationale are written back to MongoDB

She then maps this flow against common AI architecture patterns: [14:10–17:27]

- This system definitely has a RAG component: augmenting the LLM with external knowledge (guidelines, policies)
- The whole review process is a "pre-designed control flow," not something left entirely to an agent's own judgment
- Part of the behavior also resembles "LLM as router": deciding whether a case needs to be escalated to a human (which can itself be judged by another LLM)
- There's clearly a human in the loop: humans own the decisions on complex cases and all denials

She stresses: don't jump straight to a multi-agent setup at the start — design the "simplest workable" architecture first, evaluate it, and iterate from there. [12:16–12:37]

3. User experience and feedback channels

During the design phase, you also need to think about UX and feedback: [17:30–19:30]

She runs through a series of checklist questions:

- What's the input? → A claim application / form
- What's the output? → An approve/deny decision + a written explanation
- Where does the system live? → Possibly embedded in the insurer's internal website
- What's the trigger condition? → A claim is submitted
- What's the human's role? → Review the AI's recommendation and make the final call in specified situations
- How does the system explain itself? → Through citations pointing to which clinical guideline / coverage policy was referenced
- How is user feedback collected? → Reviewers can override the AI's verdict and record a reason, and can also flag incorrect/irrelevant citations, which helps surface hallucination

This step ensures the system isn't just a "model API," but is genuinely woven into the existing workflow, with a clear channel for improvement.

5\. Evaluation and monitoring: more than just accuracy

She splits things into "before launch" and "after launch": [20:56–21:08]

- Evaluation: offline / pre‑launch
- Monitoring: online / post‑launch

1. Guardrails: why the LLM era needs them especially

Because an LLM is a probabilistic system that can produce errors, make things up, or even generate harmful content, you need to clearly define the "boundary of acceptable behavior" and detect violations. [21:12–21:41]

- Guardrails on input: [21:43–22:00]

▫ The goal is to detect invalid, irrelevant, or harmful input

▫ For example, "write me a poem" is irrelevant input for a claims system and should be rejected outright

- Guardrails on output: [22:00–22:20]

▫ Detect invalid, incorrect, hallucinated, or harmful output

▫ In the claims example, a decision with no cited source counts as invalid (missing citation)

2. Designing evaluation metrics

She breaks metrics into a few categories: [22:20–23:24]

- Guardrail-related:

▫ Input: claim rejection rate (the share blocked for violating input rules)

▫ Output: missing citation rate (the share of output with no citation attached)

- Answer quality:

▫ Faithfulness: whether the approve/deny call is actually grounded in the retrieved guidelines and policies, rather than the model just guessing

- Domain-/application-specific metrics: [23:24–23:36]

▫ The core of a claims system is "processing time," so it's folded into evaluation

- System health metrics: [23:36–23:56]

▫ Token cost, token usage, number of conversation turns, or "cost per recommendation," etc.

3. Monitoring: what to watch after launch

Once actually in production, besides continuing to track the metrics above, you can also watch some implicit signals to judge whether the product is really helping: [24:00–25:08]

- How often humans override the AI's recommendation (override rate):

▫ Too high indicates the system's quality isn't good enough and needs investigating

- How long humans spend reviewing the AI's recommendation:

▫ If it keeps growing, the output may be too long, too messy, or hard to trust

These all serve as proxies for the real health of the product.

6\. Optimization: from "it works" to "it works well"

Even once accuracy looks acceptable, you still can't immediately say "ship to production": [25:12–25:37]\
In the real world, cost, latency, and reliability become hard constraints.

She discusses three areas of optimization in turn.

1. Accuracy optimization: packing the most critical information into context

The core idea: optimize whatever content actually makes it into the LLM's context. [25:40–26:20]

Techniques that apply in the claims example include:

- Prompt engineering: designing clear, specific, testable prompts
- Reranking: reordering retrieved documents so the most relevant content comes first, letting the LLM see the key points first
- "Memory": patient history is already stored in MongoDB, so you can further consider what other cross-session data needs to be persisted

If the problem is "model behavior" rather than data/orchestration, fine‑tuning is also worth considering (she only touches on this briefly, back in the patterns section). [15:42–15:58]

2. Cost & Latency optimization

She lists some common techniques and points out a few that are especially useful for the claims system: [26:36–26:54]

- Semantic caching:

▫ When a similar case comes in, use "semantically close" past results to speed up the decision

- Batch processing:

▫ Process multiple claims at once, reducing API overhead and queueing time

3. Reliability optimization

Most techniques revolve around handling API failures / model instability, such as retry strategies and fallback paths. [26:54–27:13]

She specifically calls out structured outputs:\
Force the model to output a fixed schema (e.g., JSON) containing the decision result and a list of citations, ensuring downstream systems can parse and store it reliably.

7\. A few final key conclusions

In closing, she sums up a few ideas she considers most important: [27:17–28:34]

1. Thinking through product requirements has to happen before AI writes any code at all. What's hard now is the "product spec," not the code.
2. Your latency budget, cost ceiling, and regulatory and business constraints will shape every architecture and tooling choice that follows, so nail them down at the very start.
3. Design the simplest system that meets the requirements, build it and evaluate it first, then optimize based on where it's actually failing — rather than over‑engineering from day one.
4. Design evaluation in from day one; you can't improve what you don't measure.
5. She offers a GenAI Cookbook as further reading, containing more retrieval techniques, agentic patterns, and worked examples of evaluation and optimization.
