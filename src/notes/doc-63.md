---
title: Prompt to Production: Building from Traditional SaaS to True AI-Native SaaS
speaker: Utkarsh Sengar, Webflow
video: https://youtu.be/OWL-PZvQjPI?si=5_UZmaFOyP2s3SM_
---
This talk by Webflow VP of Engineering Utkarsh Sengar is about how a traditional SaaS company (Webflow) went, over 2.5–3 years, from "bolting on AI features" all the way to a genuinely "AI‑native product and architecture."

He breaks the journey into three phases, interspersed with plenty of missteps and mindset shifts.

Phase 1: The GPT hype and the "AI Demo Trap"

At the very start (when GPT‑3.5/ChatGPT first went viral), Webflow did what everyone else was doing — built a very cool demo: a single prompt auto-generating a beautiful landing page, which looked amazing.

But when they showed it to core customers, they got shot down immediately:

It generated fast, sure, but "this isn't what I wanted."

For Webflow's typical customer (marketing teams at large brands), the hard part wasn't "whether there's a page," but:

- Whether it fully complies with brand guidelines, the design system, and tone of voice
- Whether it delivers a high conversion rate, with no details going off the rails
- Whether it satisfies enterprise-grade governance (who can publish, review workflows, permissions)

In other words, simply "generating a page with one click" was, to them, "slop" — a flashy demo that couldn't actually be used in production.

Key reflections from this phase:

- They overestimated the LLM: "it looks impressive, but it's far from real quality and control"
- They were too eager for a "Big Bang AI launch," but couldn't find a product that could hold up
- They discovered the so-called "AI trap": a demo's happy path looks great, but the gap to becoming a stable product is enormous

In the end, they paused this line of work and went back to the drawing board.

Phase 2: Retreating from "unbounded generation" to a "high-quality, constrained starting point"

In the second phase, they switched to breaking the problem into smaller pieces and adding a lot of structure and constraints, rather than letting the LLM "freely create."

The first things they built were some "small toys":

- A built-in AI Help Assistant (Q&A / onboarding guidance for new Webflow users)
- Using this kind of small tool to practice understanding the LLM's strengths and limits

The big product that actually had real business impact was AI Site Builder:

- The user enters a prompt, and Webflow generates a multi-page website draft
- These pages aren't generated completely freely, but rather:

▫ First, "golden data" is generated from Webflow's own long-accumulated corpus of "good website samples" and templates:

⁃ Breaking color, typography, layout, card styles, etc. into about 14 axes

⁃ Predefining roughly 200 million reasonable combinations

▫ Once the user's prompt comes in, the system reads that project's design system (tokens, variables, brand assets)

▫ Then assembles the first version of the page from these "vetted components plus parameters"

Results:

- Extremely helpful for new-user "cold start," with conversion rates surging
- Users don't just get a static page, but a foundation that's still "no-code editable" and can be fine-tuned to brand standards

But he emphasizes: Webflow's real value isn't just an initial draft, but "the last 5–10% of polish."\
AI Site Builder solves the starting point, but that final stretch of pixel‑perfect, on-brand experience is still primarily a human's job.

The "Autonomy Slider" mindset

At this stage, he introduces a concept mentioned at YC Startup School: the Autonomy Slider:

- Not building a "fully autonomous Iron Man robot," but rather "Iron Man armor"
- Some tasks should be fully automated (e.g., systematically moving data, applying templates), while others absolutely require deep human involvement (brand details, complex logic)
- The product should be designed so users can slide between "fully automatic" and "fully manual"

For Webflow:

- Right side: highly manual control (adjusting every element on the canvas, conditional display, and so on, in pursuit of pixel-perfection)
- Middle: something like AI Site Builder — "give a prompt → get to 80% completion → a human finishes it off"
- Left side: more of the process handed off to AI to complete (the direction they want to push toward in the future)

This mindset pushed them to think more systematically about "which parts of the process suit AI, and which parts must remain with humans."

Phase 3: Reshaping the product into something "AI can understand" — from database to Code Native & Agents

The third phase is the most "architectural rework" part, aiming to make Webflow genuinely AI‑native.

They confronted several key realities:

- LLMs are best at representations in the form of "text and code"
- Traditional Webflow implementation relies heavily on proprietary DSLs (such as the Vivaldi design language), which are unfamiliar to LLMs
- To let an agent help edit a website, the system itself needs to be representable as "code plus a file system," rather than existing only as database JSON

So they did three big things:

1. Giving the Canvas a full programmatic interface (Designer Extensions + MCP)

- Officially opening up the canvas API, previously used only internally, to the outside world as Designer Extensions
- Allowing Webflow's canvas to be manipulated with JavaScript
- Then, through mechanisms like MCP, exposing these canvas manipulation capabilities to local or cloud-based agents
- The practical effect is:

▫ You open a tool like Claude Code locally and install Webflow's MCP

▫ The agent can directly create and modify elements for you on Webflow's canvas

▫ The results comply with your design system and brand guidelines

2. Projecting the site structure into an actual React codebase

In the past:

- Websites were scattered across multiple database tables, JSON, and Webflow's proprietary language (Vivaldi)
- This representation was unfriendly to machine learning models: they weren't trained on this format

Now:

- The site is projected into TSX/React files, paired with a Markdown design spec (design.md)
- For an agent, this becomes a standard codebase sandbox:

▫ The directory contains .tsx files

▫ There's a .md file with brand guidelines

- The agent edits code within this file system, and changes get written back to Webflow in real time, with the canvas updating in sync

He notes this greatly improved:

- Generation quality
- Architectural simplicity
- No need to stuff in a bunch of RAG context — the brand guidelines are simply the documentation

3. Forming two modes of using AI: Agents via API + Agents via Code

He sums up the final shape into two main tracks:

- Agents via API:

▫ Using a CLI or RESTful API to operate the CMS and some canvas functions

▫ Suited to data flows, batch jobs, and back-end processes

- Agents via Code:

▫ Projecting the entire site into a file system (via vendors like Blackcell)

▫ The agent edits TSX files as if it were an ordinary repo

▫ Changes map to the Webflow canvas in real time

▫ They're currently exploring how to bring this "agent code layer" onto developers' local machines (approaches like mounting a remote FS, Git workflows, Cloudflare Artifacts, etc.)

On the customer adoption front, he mentions:

- They've become a design tool with high enterprise adoption in the cloud
- Many enterprise customers use "cloud IDE + Webflow Designer + Agent" to complete the first 80% of the work, with humans finishing off the last 20%

Core philosophy and culture: treat the agent as "just another kind of user," and keep rebuilding

Finally, he circles back to several abstract but crucial lessons:

1. Treat the agent as a first-class persona

▫ Even though it's acting on a human's behalf, it has its own "brain" and non-deterministic behavior

▫ When designing the system, ask: if this "user" makes a strange decision, will brand governance and permission control still hold up?

▫ So Webflow's design has to safeguard both the "human creator" and the "agent" roles at once, for both safety and control

2. Continually question "why should we still exist?"

▫ If Webflow just keeps being a drag-and-drop UI tool while AI can actually write the code itself, the company's value would erode

▫ Forcing themselves to rethink: in this new world of "AI + brand control + non-deterministic systems," what is our moat?

▫ Being willing to throw away what's already built and redo it, keeping only the core principles (avoiding getting locked into complex abstractions and frameworks)

3. Don't fetishize complex frameworks — try a lot, and throw away a lot

▫ Over the past two or three years, the market has produced many "super-abstraction layers that wrap the LLM for you," but they're often quickly rendered obsolete by new model capabilities

▫ The team itself made many attempts, discarding at least a dozen lines of work, keeping only the small number of approaches that truly worked

▫ The technical architecture needs to stay "bendable," adjusting quickly as models and tools advance

4. Organizationally emphasize "shipping muscle," rather than getting it right in one shot

▫ Roughly every 6–8 months they revisit direction, willing to tear it down and start over

▫ After Cloud Code came out, it only took two or three months to go from the "aha moment" to shipping a GA product with their own built-in AI code components based on a similar concept

▫ The core capability isn't predicting the future, but "the ability to keep shipping" to keep pace with the technology curve

5. Technology gets commoditized — the real battle is won at the application layer

▫ Just like the past two waves — databases, and then Salesforce:

⁃ At first everyone competed on whose database technology was stronger

⁃ Later, the real winners were the application layer that hid the technology in the background and solved customers' business problems

▫ In the AI era, RAG, agents, sandbox architectures, and so on will likely become standardized and commoditized

▫ The key becomes: who understands these underlying technologies better, and who can translate them into truly meaningful "customer value"

Overall, this video is about:\
How a top-tier B2B SaaS company evolved from "playing with AI demos" to "reworking its product architecture, opening up a canvas API, and using a codebase to let agents genuinely join the workflow" — and in the process, learned to respect existing customers' high standards for quality and governance, accept the LLM's imperfections, and use organizational shipping capability to keep up with the fast-moving AI ecosystem.
