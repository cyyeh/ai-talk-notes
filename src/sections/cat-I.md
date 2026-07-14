---
heading: Product Strategy & Business
desc: Product strategy, pricing, AI-native startups, organizational culture: thinking about product and business models in the AI era.
color: #db2777
docs: 18, 34, 48, 62, 63, 97
---
## Born Different: How AI Natives Build Startups
@ Panel: Turbopuffer, Cognition, Higgsfield
Three AI-native founders point out that under high uncertainty, long-term planning compresses into a month-to-month or week-to-week cadence, decisions get pushed down heavily, and AI is used to amplify small teams' output. Also discusses filtering hires by AI adoption, traditional SaaS turning into a "headless database plus AI agent layer," and organizational/GTM observations like how engineering-to-sales ratios differ sharply at AI-native companies.

## Do the Boring Stuff to Make Open Source AI Win
@ John Dickerson, Mozilla.ai
Argues open-source AI doesn't need to match closed-source giants on benchmarks — it should instead use satisficing (good enough is good enough) to capture the 99% of use cases that only need a passable model, shifting focus from "bench-maxing" to "experience-maxing" (experience, controllability, trust, distribution). Introduces "boring engineering" like AnyAgents, multi-model routing, a guardrail abstraction layer, and an MCP proxy, and emphasizes that the real weak spot is UI/UX and reaching non-technical users.

## How Product and Research Build Together at the Frontier
@ Izzy & Olivia, Hex
Hex's AI research and product leads share how they collaborate when "the model gets a new version every few weeks": the first 80% of a demo is easy, but the 80→95% quality tail is the hardest part — you have to learn to call it quits early and wait for the model to get better, and design the infrastructure that patches model shortcomings to be "removable." Also discusses the difficulty of evaluating data work (deliberately planting a bug, where the model has zero instinct to "doubt the numbers") and a moat built from deep understanding of data workflows plus sandbox infrastructure.

## Pricing AI Agents
@ Orb
Argues that in the AI agent era, pricing and usage-based billing need to be "engineered" — iterating continuously across four time scales and four levers (price point, value metric, charging model, contract structure) — and emphasizes that choosing a value metric (tokens vs. workflows/outcomes) is really telling customers "what counts as value." Finally points out the governance gap created by agents' explosive volume and high-frequency actions, and proposes agent wallets that compute the cost of each run in real time.

## Prompt to Production: Building from Traditional SaaS to True AI-Native SaaS
@ Utkarsh Sengar, Webflow
Shares three stages from "bolting on AI features" to becoming truly AI-native: first falling into the trap of one-click-generation demo slop, then pulling back to a "high-quality, constrained starting point," and finally projecting the website as a React codebase plus design.md, opening up a canvas API/MCP so agents can edit directly. The core idea is treating the agent as a "first-class persona," using an autonomy slider to divide work between human and machine, with the moat being the application layer that turns the underlying stack into customer value.

## You Can't Prompt the Room: The Last Skill AI Won't Replace
@ Balázs Horváth, VisualLabs
Argues that once AI can write most of the code, the one skill that remains irreplaceable is figuring out what to build and aligning people around it. Uses an internal hackathon (21 ideas, only 4 actually shipped) to illustrate that "being able to build it doesn't mean it's worth building," and proposes User Story Mapping, four questions for judging value, and a Value→Architecture→Design path, suggesting teams change their metric from "number of features shipped" to "number of features used more than twice."
