---
title: Beyond the AI Pilot: A Framework for Building Systems That Actually Deliver
speaker: InterSystems
video: https://youtu.be/rM32jnj7Wjk?si=O4UCTFRaIjpfZvPI
---
This video introduces a framework for helping enterprise AI projects go "from pilot to real production," built around three parts — Read Contract, Write Contract, and the Execution Ladder — used to diagnose why 95% of generative AI pilots get stuck at the POC stage and never reach production.

Why most AI pilots fail

The speaker opens by noting that most people blame failure on "the model isn't accurate enough, the training data is bad, the vendor is no good, the team isn't skilled enough" — but under closer inspection, the real killers are usually:

1. The AI can't get accurate, sufficiently fresh "business context" (data + systems)
2. Even when the AI can produce a recommendation, there's no safe, controlled way for it to actually execute it inside enterprise systems
3. The company stays stuck at a grand vision, never breaking the AI goal down into clear, actionable outcomes, projects, and next steps

He sums this up as two big gaps:

- Infrastructure gap: the AI can neither "read" nor "write" to your critical systems
- Execution gap: a lack of execution discipline connecting vision down to this week's actions

He then introduces three tools: the Read Contract, the Write Contract, and the Execution Ladder.

Read Contract: giving the AI an agreement for "reading correctly"

A Read Contract is a formal agreement that defines what data the AI can read, how often it's refreshed, who's responsible, how it's audited, and how to gracefully degrade when data isn't available.

It clearly defines:

- Which data sources it can read
- The "freshness" of each source: real-time, hourly, daily, or stale
- Data governance: who authorizes it, whether it's auditable, and which queries were run
- The fallback strategy for when data is unavailable (don't make things up — admit you don't know)

He gives a few examples:

1. The Air Canada customer-service chatbot case The chatbot invented a "bereavement discount" refund policy; a traveler followed it, was refused, and sued — and Air Canada ultimately lost the case. The problem wasn't simply "the model hallucinates." It was:

▫ No clear link to the single, authoritative version of the policy document

▫ When the correct policy couldn't be found, the system didn't gracefully degrade to "I don't know / escalate to a human"\
This is a textbook Read Contract failure.

2. Zillow's AI-driven mass home buying and selling failure The system used historical transaction data and a valuation model to make offers, and it kept "bidding too high" over a long stretch, ultimately recognizing roughly $500 million in losses and shutting down the entire division. The problem wasn't a lack of data — it was:

▫ Only reading "historical data," never incorporating "real-time local signals" (such as rezoning or changes in school rankings)

▫ Those real-time signals actually existed inside Zillow, but the pipeline was never wired into this AI system\
So this is a Read Contract failure caused by "poorly defined data sources plus incorrect freshness."

Conversely, a good Read Contract delivers:

- A unified, near-real-time view of the business
- Governed, auditable access (knowing exactly what the AI read)
- Graceful degradation when data is missing (no making things up, no guessing)

A positive example is JP Morgan's COIN (Contract Intelligence) system:

- Rather than opening up "the entire network" to the AI, it precisely provided 12,000 specific commercial loan contracts, with format and schema clearly defined
- Clear-cut sources, with newly signed contracts updated in real time
- The legal team "owns" the system's output, with humans auditing in the loop
- The result: roughly 360,000 hours of legal-review work saved every year, running stably in production

Write Contract: giving the AI boundaries for "safe execution"

The Read Contract solves "the AI understands your company"; the Write Contract defines "how much the AI can do inside the system, and where the line is."

A Write Contract clearly specifies:

- Scope: which operations can the AI perform? Which are absolutely off-limits?
- Limits and thresholds: dollar caps, the threshold that triggers escalation, the time window of effect
- Approval mode: fully automatic? Human-in-the-loop? Human-on-the-loop?
- Auditability and traceability: is every action logged, and is it reversible?

A bad example is the Knight Capital automated trading system incident (2012):

- The automated trading system went live, and because of a code change, it executed $7 billion in "extra trades" within 45 minutes
- There was no:

▫ Daily or per-strategy dollar cap

▫ Kill switch / escalation condition to trigger a shutdown when "losses exceed X"

▫ Pre-approval mechanism

- The result: a $440 million loss in a single day, the company nearly collapsed, and it was only saved by emergency financing
- This is the most textbook, most "pure" Write Contract failure: the AI (or automated program) held excessive, unbounded authority.

Without a Write Contract, a system will either:

- Be limited to "giving recommendations, unable to do anything" — every step requires manual human execution; or
- Have "too much authority" — without a clear scope, limits, and review, disasters like Knight Capital become possible.

A good Write Contract, on the other hand:

- Clearly defines which scopes the AI can act on automatically
- Assigns different autonomy tiers to different risk levels (fully automatic for small amounts; human approval for large amounts; a human on-the-loop for sensitive operations)
- Logs and traces every step, with the ability to roll back within a reasonable scope

He gives Klarna's AI customer-service assistant as an example:

- The AI handles two-thirds of customer-service conversations
- Clear scope: returns, order changes, and the like
- Strict limits: it cannot perform extremely high-risk operations such as deleting accounts
- Every action has a complete audit trail

He also mentions Waymo's "human on the loop" pattern:

- The onboard model continuously monitors whether passengers are wearing seatbelts, but only activates recording when it finds something suspicious, at which point a human steps into the conversation
- This is another kind of Write Contract design that confines AI behavior to "detect, then trigger a human"

Execution Ladder: from vision to "what to do this week"

Even with a well-designed Read Contract and Write Contract, a project can still die halfway, because "execution on the ground" runs into trouble — and that isn't a problem with engineering or PM tools, it's a problem of "never breaking the vision down."

He draws on David Allen's Horizons of Focus from Getting Things Done, adapting it into an Execution Ladder for checking whether an AI project is "ready to start writing code."

The core idea is:\
You can't just act at 10,000 ft (writing code) without first working out every layer between 50,000 ft (vision) and 20,000 ft (concrete outcomes/KPIs).

He cites IBM Watson Health:

- IBM invested roughly $4 billion, acquired multiple AI startups, and assembled large teams, with the goal of "transforming healthcare with AI"
- But "transforming healthcare" was never broken down into concrete, measurable clinical workflows:

▫ Which disease, which diagnosis or claims-processing workflow comes first?

▫ What's the quantified metric? How much time or how many errors reduced, and by when?

- The result: over five years the team produced plenty of demos but almost no real production deployments, and the division was eventually sold off at a fire-sale price
- This is a classic failure case of "vision with no decomposition"

The Execution Ladder looks roughly like this (applying it to his own customer-service example):

1. Vision (30 years, the topmost level): For example: "Within 30 years, have AI resolve 60% of frontline customer-service issues"
2. Outcome / KPI (3-5 years): For example: "By Q4 2027, cut average resolution time by 40%" — a verifiable number plus a timeframe
3. Domains / Areas & Stakeholders:

▫ Which departments and roles must be pulled in: governance, the Chief Data Officer, customer-service leadership

▫ Which processes need to be tackled first

4. Projects:

▫ For example: "Build a Read Contract for the CRM," "Define a Write Contract for the refund process"

▫ Break the vision down into completable, ownable project units

5. Next Actions (concrete actions for this week/today):

▫ Inventory every customer-service-related data source

▫ Tag each source's freshness and owner

▫ Identify missing API endpoints, permission workflows, and so on

His rule of thumb is:\
If any layer is empty, you "shouldn't start writing code yet."

This Execution Ladder isn't a Jira-style project-management sheet — it's a "readiness check":

- Ask yourself: Is the vision clear? Are there quantifiable outcomes? Are there well-defined projects and stakeholders? Does what I'm doing this week genuinely line up with the layers above?
- Most AI initiatives jump straight from "the board wants an AI strategy" to "the engineering team starts building demos," leaving every layer in between blank — so naturally they never reach production.

Final diagnosis and recommended actions

At the close of the talk, the speaker mentions he's prepared a self-diagnosis worksheet that lets a team score itself on three dimensions: Read Contract, Write Contract, Execution Ladder.

- Each question is scored on a 1-5 scale
- Total score < 24: means "building on sand" — the foundation is completely unstable, and you're not ready to build an AI system
- 24-35: there are clear gaps; you need to identify and shore up the lowest-scoring areas first
- 36-45: high readiness — you can consider expanding and scaling, though there's still room to improve

The three concrete actions he recommends are:

1. Audit your Read Contract

▫ List every single data source the AI currently reads from

▫ For each source, note: real-time or stale? Who is the owner / data governor? What happens when it goes down?

2. Audit your Write Contract

▫ List every action the AI needs to actually perform within your systems

▫ For each action, ask: Is there an API today? Who approves it? If it goes wrong, how big is the blast radius? Is there a rollback or kill switch?

3. Pick your single most important AI initiative and walk it all the way through the Execution Ladder

▫ From vision → quantified outcome → scope & stakeholders → projects → concrete actions for next week/this week

▫ Check which layer is empty, fill it in first, and only then start or keep writing code

His conclusion:

- The main reason 95% of AI pilots get stuck and fail usually isn't the model — it's "failing to read the right context, failing to write safe actions," and "a vision that was never broken down into an executable plan."
- Miss even one of the three (Read Contract, Write Contract, Execution Ladder) and you'll easily slip right back into that 95%.
