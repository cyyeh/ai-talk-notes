---
heading: Agent Evaluation & Observability
desc: Evals, LLM-as-judge, trace/trajectory observability, benchmarks: turning agent quality from "gut feeling" into data-driven engineering.
---
## 5 Lessons from the Classroom for Evaluating Agents
@ Andrew Zigler, Dev Interrupted
Applies classroom teaching experience (backward design, a daily agenda, rubrics that demand "show your work") to agent design and evaluation, arguing for structured task graphs in place of scattered notes so humans and multiple agents can share context. The core argument: a good eval isn't a radar chart of abstract scores, but a set of discrete binary pass/fail checkpoints that let you inspect the intermediate decision chain and feed failure signals back into the prompt, tools, and architecture.

## AI Attribution: Measuring What AI Actually Did
@ Shopify
Presents a framework for measuring AI contribution: an "evidence ladder" (usage → acceptance → retention → outcome → incrementality) plus field-level attribution status, quantifying how much of what AI produces is actually kept and creates value, while emphasizing that "assisted" (helping someone get past a blank page) is itself a success. Warns that this must be paired with guardrail metrics (edit rate, rollback rate, retention) to avoid Goodhart's-law traps, and that attribution can only detect patterns — incrementality still needs to be proven with A/B experiments.

## Agent Optimization with Pydantic AI: GEPA, Evals, Feedback Loops
@ Samuel Colvin, Pydantic
Using data extraction as the example, walks through a full pipeline — from a Pydantic AI agent, a golden dataset, and a deterministic evaluator, to using GEPA (a genetic algorithm plus Pareto frontier) to automatically iterate the system prompt — pushing accuracy from a hand-written 0.92 to 0.967. Also demonstrates using Logfire managed variables to hot-update prompts/models without redeploying and to run A/B tests (e.g., Shopify using a small model plus GEPA to cut annual cost from 5 million down to 60-70K).

## Agentic Evaluations at Scale, For Everybody
@ Nicholas Kang & Michael Aaron, Google DeepMind (Kaggle)
Proposes rebuilding agent evaluation infrastructure at the "community level" to solve the problems of scattered, outdated evaluations, lack of reproducibility, and too few designers — launching four initiatives: hackathons, standardized Agent exams, Game Arena, and Kaggle Benchmarks. Using the SWE-Bench Pro example, shows that switching harnesses alone can swing scores by 20+ percentage points, emphasizing that many "model evals" actually conflate the model with the tool chain and prompt engineering.

## Build Trustworthy LLM Apps Powered by Agentic Evals
@ Meta
Argues for treating agentic eval as an "observability and control layer" that simultaneously measures capability, reliability, safety, and cost, and proposes engineering mitigations for non-determinism, hallucination, tool misuse, accumulated error over long chains, and stale memory (fixed seeds/structured outputs, requiring citations, idempotency and sagas, plan-act-observe-replan, memory tiering and TTL). Splits graders into three types — code-based, model-based, and human — and introduces the open-source GAIA 2 / ARE benchmarks.

## Evals 101: Intro to Evals for Engineers
@ Braintrust
Teaches engineers to treat eval as a fixed loop of "observe real traces → find failure modes → design scorers → iterate," emphasizing that eval is not unit testing and shouldn't chase a perfect score. Introduces LLM-as-judge (designed to verify rather than re-solve), code-based scorers, and combinations of the two, arguing that eval is a team activity requiring domain-expert labeling, and that since most cases lack a single ground truth, scoring should be compressed to binary.

## Evals Are Broken, Use Them Anyway
@ Ara Khan, Cline
Shares how to hill-climb a coding agent from 43% upward on a realistic benchmark like Terminal Bench — the key isn't swapping in a stronger model but harness and prompt engineering. Proposes guidelines for reading evals (don't fully trust official scores; find evals that are recent and precise enough), uses a separate agent to read failure traces for attribution, and specifically warns about the danger of overfitting to the benchmark.

## From Spans to Trajectories: Observability for Long-Running Agents
@ HoneyHive
Argues that long-running agents capable of thousands of steps break traditional spans/traces, requiring a "trajectory" view instead, and catalogs failure modes such as context rot, amnesia, YOLO, delegation, and stochasticity. Proposes replacing static evals with "observability-driven development": instrument thoroughly first, run 100-1,000 real traffic samples, use clustering to discover task types, then write a rubric evaluator and guardrails/alerting for each type.

## Judge the Judge: Building LLM Evaluators That Actually Work with GEPA
@ Mahmoud Mabrouk, Agenta AI
Demonstrates using the evolutionary prompt-optimization framework GEPA to calibrate an LLM-as-a-judge so it aligns with human annotations, avoiding evaluations that are "confidently wrong." Using an airline customer-service agent as the example, emphasizes doing error analysis first, designing binary metrics, and collecting expert annotations with reasons attached, then iterating with a reflection template carrying a strong prior — raising judge accuracy from about 60% to about 74%.

## Malleable Evals: Why Are We Evaluating Adaptive Systems with Static Tests?
@ Vincent Koc, OpenClaw
Argues that evaluating agentic systems that "keep adapting and differ from person to person, organization to organization" with "static" benchmarks is no longer sufficient — calling this "eval calcification." Proposes that eval should shift from "matching the correct answer" to aligning with "the outcome that was intended" (fuzzy criteria can be described with rubrics), and should itself become a living agent: self-curating test sets from real traces, running as a standing online evaluation, and feeding telemetry back into the loop for self-repair.

## Ship Real Agents: Hands-On Evals for Agentic Applications
@ Laurie Voss, Arize
Runs a hands-on workshop using Arize Phoenix plus the Claude Agent SDK to turn agent testing from a vibe check into data-driven engineering: first read traces to classify failures, then apply three complementary approaches — code eval, LLM-as-judge, and human eval — while distinguishing capability evals from regression evals. Key lesson: "test the outcome, not the path"; use a golden dataset for meta-eval to compute the judge's precision/recall; evals become a data flywheel and a moat.

## Shipping AI That Works: An Evaluation Framework for PMs
@ Aman Khan, Arize
Gives PMs an evaluation framework for AI products: breaking down eval into the four components of LLM-as-judge (role / context / goal / label), and emphasizing that the judge should output text labels rather than scores. Using a multi-agent travel-itinerary demo, shows building a dataset from traces, running A/B tests in a prompt playground, then using human annotation to "eval your eval." The core idea: treat eval plus a labeled dataset plus target values as the new PRD / acceptance criteria.

## Systematic LLM Prompt Optimization with DSPy and Databricks
@ Databricks
Uses DSPy plus Databricks to turn prompt tuning into a trainable pipeline, treating the prompt as an optimizable parameter via signatures/modules/optimizers. The method has two layers: first use 30-100 SME gold-standard examples with MIPROv2 to align the LLM judge, then use GEPA with the judge as the metric to optimize the main prompt. Using maintenance-message urgency classification as the example, accuracy rises from about 70% to nearly 100%.

## The Agentic AI Engineer
@ Benedikt Sanftl, Mutagent
Turns the human engineer's job of iterating on an agent (spec → build → eval → deploy → monitor → diagnose → optimize) into an eval-driven dual loop run by a set of collaborating agents. An evaluator agent automatically builds datasets and evaluation logic; a diagnose agent samples traces to find failure modes, performs root-cause analysis, and outputs fix tasks that can be fed directly to a coding agent. Also argues for separating spec from implementation.

## Your Agent Failed in Prod. Good Luck Reproducing It.
@ Tisha Chawla & Susheem Koul, Microsoft
Points out that once a production agent fails, it's nearly impossible to reproduce, and debunks the myth that "temperature=0 means deterministic" (GPU floating point, batching, and MoE routing all introduce nondeterminism). Argues the goal isn't bitwise determinism but replayability: use record & replay to log input/output and metadata at each node's "logical boundary," so you can later replay without calling the model to pinpoint the failing node, and freeze the failing trace into a deterministic test.
