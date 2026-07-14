---
title: The Future Is Domain-Specific Agents
speaker: Justin Schroeder, StandardAgents
video: https://www.youtube.com/watch?v=spNAUEgq_A8
---
This video argues that the key to future AI that's actually useful and deployable lies in "composing multiple small, domain-specialized agents" rather than one giant all-purpose agent.

What does he mean by "domain-specific agents"?

Justin first defines "agent":\
a piece of deterministic code used to steer the non-deterministic output of an LLM or similar model toward achieving some clearly defined goal. [2:23]

He observes that nearly every company today, even small insurance agencies and realtors, is trying to build its own "custom agent" — not because they lack access to AI, but because they want to properly integrate their own data and processes into an AI system. [4:34]

But building an agent yourself is actually very hard:\
you have to handle orchestration of the agentic loop, a provider abstraction layer, durable execution, observability and debugging, environment differences, portability and reusability, and so on — and the result is usually that you get stuck at the demo stage. [5:15–7:32]

The current mainstream approach — tools, MCP, skills — is really all just "inheritance"

He reviews the common integration approaches today:

- MCP: right now it's mainly become a distribution mechanism for feeding tools to a large-model agent, and in practice hasn't yet delivered much value on other fronts. [8:13–8:55]
- Skills: essentially just a bunch of markdown documentation. A small number are useful, but research shows that using too many skills makes agent performance worse. [9:24–9:38]

He sketches out a typical agent stack:

model → system prompt → tools → skills → MCP → conversation history [10:08–10:35]

Most of this really just turns into "context" — you keep piling information and capabilities onto the same one agent. He says this closely resembles inheritance in traditional OOP:\
you take an object and keep bolting on properties and capabilities until it turns into a giant monster. [12:11–12:29]

This is fine at first (loading up 5 skills), but once you're up to 100 or 1,000, returns diminish and it becomes very hard to control and reason about. [13:04–13:23]

This is why he uses "Composition over inheritance" as the lens for critiquing the current MCP + skills integration approach.

His proposed alternative: domain-specific agents (composed multi-agent systems)

Instead, he argues for composition:

instead of cramming everything into one big agent's context, build a complete but small and specialized agent for each domain, for example:

- a Figma agent: its system prompt is designed entirely around Figma, containing only Figma-related tools and a very small message history. [13:35–14:14]
- Gmail, Travel, Sheets, GitHub... each is its own independent agent, with its own agent loop, tools, and state. [14:21–14:38]

Above these sits a coordinator/primary agent, responsible for:

- deciding when to call which domain agent
- the agents only communicate with each other using "natural language" (the way a human team writes emails or talks to each other). [14:41–15:21]

He uses the Apollo moon-landing team as an analogy:\
what actually got people to the moon was many expert teams collaborating, with each individual skilled at just a few tools and tasks, not one person charging in alone with a giant pile of tools. [15:27–16:17]

This "specialized small agents + collaboration" pattern is what he calls domain-specific agents.

Why is this better? (performance, cost, security, scalability)

He shares his own implementation experience at StandardAgents, arguing that domain-specific agents have several clear advantages:

1. Token efficiency and cost

Because:

- each small agent's context is very lean, keeping only the system prompt, tools, and small amount of messaging that the task actually needs.
- the coordinator only needs a single sentence to invoke a domain agent — for example, "get me Debbie's latest email" — and that's the entire context for that call. [17:30–18:01]

Their actual observation: task-level token efficiency can exceed 80%, and it's also easier to define clear task scope. [16:52–17:10]

On top of that, you can use smaller, cheaper models (even non-LLMs, like diffusion or image models) to handle specific subtasks, so cost can drop dramatically. [18:06–19:10]

He gives an example: the per-task cost gap between some small models (DeepSeek V4 Flash) and top-end models (Fable 5) can reach 137x;\
with domain-specific agents, letting the small model handle only what it's good at, with a minimal context, gets you a cost advantage of this magnitude without sacrificing result quality. [18:16–18:37, 18:52–19:10]

2. Security and permission control are easier

Right now everyone is using "one giant coding agent" to do everything, which ends up bypassing a lot of security and permission mechanisms, because a single agent can, in theory, do anything. [19:30–19:52]

If you switch to many small agents instead:

- the Gmail agent can only touch the Gmail permissions and API you've allowed it to touch.
- the Travel agent can only book tickets and look up itineraries.
- the GDPR agent can only check compliance issues for EU customers.

Each agent's innate capability is inherently limited, so even if the LLM "wants to misbehave," it can't do much beyond its boundary at the tool level. This puts a company's IT/security staff much more at ease. [19:58–20:24]

3. Better scalability

Each agent:

- is an independent, small execution environment that can scale horizontally in the cloud, running thousands of instances in parallel around the world. [20:26–20:54]
- doesn't need to share a giant global state, and doesn't need a huge monolithic VPC.

The whole system ends up looking like a multi-service network of microservices, except the nodes are "intelligent agents."

His predicted timeline: 2027 will be "the year of multi-agent orchestration"

Right now these domain-specific agents don't yet exist at scale in the public domain, but StandardAgents is already using them heavily internally. [21:00–21:19]

He makes a few timeline predictions:

- Starting in the second half of 2026: you'll clearly see more people talking about domain-specific agents, along with the frameworks, tools, and ecosystem forming around them. [21:19–21:52]
- 2027: will be the breakout year for multi-agent orchestration, and the term will become a mainstream buzzword. [21:55–22:03]

An important backdrop driving this is:

the belief that "the cost of intelligence keeps falling" has actually, temporarily, reversed in 2026. [22:39–22:52]

He says they track token prices on their website:

- even after normalizing for "per unit of IQ," token cost has still risen about 29% this year.
- Ignoring IQ and just looking at raw token price, the increase has actually reached 76%, and the year isn't even half over. [22:44–23:38]

So:

- long-term (10-year), cost per unit of intelligence will probably still fall;
- but in the short term, token costs keep rising, forcing everyone to look for cheaper-but-good-enough options.
- You can't just put an expensive model like Fable in front of every customer as frontline support, unless customer lifetime value is genuinely off the charts. [23:54–24:07]

Domain-specific agents plus small models become one of the only viable architectures that's both "good enough to use" and "affordable." [24:09–24:16]

What does his ideal "complete agent" look like?

In the second half he breaks down what an "ideal agent" should be made of:

1. The tool layer, broken down into:

▫ functions: actions that genuinely produce external side effects (writing a file, etc.). [24:39–24:49]

▫ prompts: can be a sub-prompt that calls another LLM or model — for example, the main agent uses GLM5.2, while one of its tools uses Nano Banana specifically for generating images. [25:01–25:21]

▫ other complete agents: that is, using a domain-specific agent itself as a tool. [25:23–25:33]

2. hooks:

▫ allow injecting or modifying message history, or triggering side effects, within the agent's flow.

▫ example: the LLM itself doesn't know what time it is, so you can insert an artificial message into the history — "someone asks the time → a tool replies it's 6:45pm" — to make the LLM feel like it knows the current time. [25:35–26:13]

3. agent rules:

▫ behavioral constraints including the agent's maximum allowed number of turns, tool-use validation rules, and so on. [26:27–26:53]

4. file system and sandbox runtime:

▫ every agent should have its own sandboxed file system, similar to how ChatGPT/Claude can generate files for you today and save them. [27:01–27:35]

▫ there should also be sandboxed code execution, letting it write code, run it, and check the results, without directly touching the host OS, to avoid leakage. [27:37–27:54]

Wrapping all of this together is, in his view, what makes a "truly complete" domain-specific agent. [26:55–27:56]

A multi-layered, recursive sub-agent structure

In this architecture, "agent as a tool" means you can:

- have the top-level coordinator control a Salesforce agent.
- have the Salesforce agent in turn call a Google Workspace agent to handle spreadsheets and Gmail. [28:20–28:51]
- have the Salesforce agent separately call an "asset-generation agent," which itself wraps multiple models (image, SVG, etc.) and does its own self-reflection and QA. [28:52–29:15]
- have the coordinator additionally maintain an entire legal-team agent, which further splits out sub-agents dedicated to compliance checks, like a GDPR agent or an OSHA agent. [29:19–29:47]

As a result:

- each layer only needs the domain context it actually cares about
- collaboration happens through natural language plus clearly defined API/tool boundaries
- the whole system still keeps a small context, high observability, and easy changeability

This is the concrete picture he has in mind for multi-agent orchestration. [29:51–30:04]

Closing: StandardAgents' position and an invitation

Finally, he says StandardAgents is currently:

- building and refining this domain-specific agent ecosystem internally,
- beginning to open up early access to a small number of ambitious enterprises looking to adopt small, specialized agents. [30:08–30:27]

He hasn't formally launched a product, but he provides a website and contact info, inviting teams interested in "small, specialized agents collaborating" to join.\
The core message of the whole talk is: stop thinking in terms of one giant, everything-plugged-in "god agent," and instead, the way the industrial revolution did, break intelligence apart into collaborating specialized machines and small teams — using composition to actually put AI to work on the production line and in front of customers.
