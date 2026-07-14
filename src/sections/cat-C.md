---
heading: Agent Architecture, Reliability & Productionization
desc: Architectural choices on the road from PoC to production: durability, long-running execution, coordination / state / control, and progressive autonomy.
---
## AI System Design: From Idea to Production
@ Apoorva Joshi, MongoDB
Using a health-insurance claims-review system as the example, presents a four-stage framework — product requirements → system design → evaluation & monitoring → optimization — emphasizing that in the age of AI writing code, the hard part is defining the product spec and system design, not the implementation. Covers data strategy (hybrid search combining vectors and metadata), RAG/router/human-in-the-loop patterns, guardrails and domain-metric evaluation, and optimizations such as reranking, semantic caching, and structured outputs.

## Agents Building Agents
@ Alfonso Graziano, Nearform
Argues that building a reliable agent is a systems-engineering problem, not a search for a magic prompt. The core is a golden dataset plus eval plus scorer to quantify quality, with AutoAgent (having a coding agent read the target agent's code/traces, repeatedly propose hypotheses, modify prompts/tools, run evals, keep what works and roll back what doesn't) doing automatic optimization. Real user traces and feedback are clustered into failure modes and fed back into eval, with Harness Engineering used to build a reliable environment for automatic improvement.

## Beyond the AI Pilot: A Framework for Building Systems That Actually Deliver
@ InterSystems
Argues that 95% of AI pilots get stuck at the POC stage, mainly due to two gaps: the infrastructure gap (AI can't access accurate, fresh business context, and has no safe, controlled way to execute) and the execution gap (the vision was never broken down into an executable plan). Proposes three tools — the Read Contract, the Write Contract, and the Execution Ladder — backed up with cases such as Air Canada, Zillow, Knight Capital, and JP Morgan COIN.

## Breaking the Proof-of-Concept Cycle: Stop Prototyping and Get Into Production
@ Neha, GitLab
Presents three steps for getting AI/data prototypes out of "prototype hell": Embrace the chaos (provide a safe space to experiment, and hold retros even on failures), Find product-market fit (judge by actual usage behavior rather than verbal feedback, watching for prototypes that spread virally), and Thin the garden (deliberately kill off most prototypes and concentrate effort on productionizing the few winners). Uses the selection process among multiple "talk-to-your-data" approaches as the example.

## Building Durable, Long-Running Autonomous Agents
@ RedScope AI
Argues that agents will inevitably make mistakes, so what matters is being able to safely continue afterward. Breaks durable agents into three pillars: durable execution (state persistence and fault tolerance, comparing Temporal vs. LangGraph), durable autonomy (learning "when to call a human" using uncertainty / novelty / value of intervention), and durable statefulness (distinguishing state / memory / context and externalizing progress).

## Lessons From RL Systems That Looked Fine Until They Didn't
@ Aethon
Drawing on quant-fund experience, explains that RL systems often "look fine until they flip over in production" — and the root cause isn't a badly designed reward, but poorly designed optimization scope and behavioral boundaries. Solutions include trimming the world model down to only the useful structure, using competition-style selection to weed out brittle models, adding human-set "guardrails" and an evaluation agent, and splitting traces into small, weightable spec files for auditing.

## Running Enterprise Agents in Production: Architecture and Secure Execution Models
@ Salesforce
Argues that the reliability of enterprise agents is an engineering problem, not a model problem: first honestly choose the runtime type (conversational / autonomous / long-horizon), then work backward to patterns across the three dimensions of coordination, state, and control. Uses telecom contract renewal as an example to illustrate Saga compensation explosion and event reordering, noting that practice mostly settles on "hierarchical delegation plus human-in-the-loop"; emphasizes that without three-lens observability and a kill switch / replay / override, you shouldn't even consider going to production.

## Running Millions of (Millisecond) AI Sandboxes without Breaking the Piggy Bank
@ Felipe, Unikraft
Explains that multi-tenant, untrusted AI agents need VM-level isolation rather than containers; Unikraft uses an extremely small unikernel so VMs get both millisecond startup and strong isolation, extending millisecond wake-up across the entire chain. Through snapshot/fork/checkpoint and scale-to-zero, they measured fitting over a million wakeable VMs onto a single 48-core server.

## Should agents be durable?
@ Joey Baker, Render
Points out that an agent's execution time, compute, and external calls are highly unpredictable — a 20-step workflow accumulates a failure rate approaching one in five — so a "durable, elastically scalable, observable" abstraction is needed. Render Workflows lets you get sub-second startup, declarative retries, task-level durability (if step 8 fails, retry only from that step), tens of thousands of concurrent executions, and full execution history, just by adding a decorator to a function.

## The Future Is Domain-Specific Agents
@ Justin Schroeder, StandardAgents
Argues that the future belongs to "compositions of small, domain-specialized agents" rather than a single all-purpose giant agent, criticizing the practice of continually stuffing context into one agent as being like OOP inheritance — composition should be used instead: one small, specialized agent per domain, coordinated on top by a coordinator using natural language. The benefits are token efficiency (potentially over 80%) and cost savings, easier permission security and horizontal scaling; the talk predicts 2027 will be the year of multi-agent orchestration.

## What It Takes to Build Reliable AI Systems for Production Operations
@ Steven, Resolve AI
Points out that once coding gets cheap, the bottleneck shifts to "operations and debugging after launch," using a multi-agent swarm for incident triage and root-cause analysis. Emphasizes that AI for production is a systems-design problem, adopting "design the eval before designing the system": positive evals, negative evals (whether the agent dares to say "I don't know"), evidence-chain evals (every step needs telemetry evidence to prevent reward hacking), and confidence calibration — building trust gradually through progressive permissions.

## When Your AI Agent Runs for 16 Days Straight
@ Factory
Introduces a long-horizon coding agent capable of running continuously for tens of hours up to 16 days straight (producing around 38,000 lines of code). The core is the Missions architecture: an Orchestrator writes requirements into strict "verification contracts" and Features, dispatching them to Workers (implementation) and Validators (which QA-test user journeys like a real tester), forming a long-running self-correcting loop; also highlights multi-model routing and the "adversarial context" created by an append-only trajectory.
