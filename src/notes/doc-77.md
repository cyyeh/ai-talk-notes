---
title: The Best Engineer in the Room Doesn't Write Code
speaker: Emilie, Kilo Code
video: https://youtu.be/O0ELM9ZqkE8?si=0Cej_pVokM0AOxlb
---
This video is about a shift in mindset: moving from "a tool that helps you write code" to "an AI colleague that works alongside you long-term and shares the responsibility."

Emilie starts by asking everyone to think back to "the best engineer you've ever worked with," and points out that what made them great usually wasn't writing the most code themselves — it was making architectural decisions, helping others plan, doing reviews, and raising the output of the whole team, i.e., being a "force multiplier." She believes the people who will truly get the most out of AI in the future will be like that kind of engineer too: skilled at "owning the problem, owning the outcome," rather than simply writing every line of code themselves.

She then distinguishes two stages: the "session-based" AI most people use today — conversation by conversation, autocomplete, asking it to help write a chunk of code — where model capability is already quite strong and, arguably, "close to a solved problem." But being able to write code isn't the same as being able to "ship," and it's even further from being able to "take responsibility." The truly hard question is: can AI **"own the outcome"**? That is, can it operate long-term inside complex systems, remember context, and proactively track whether things actually got done — rather than just filling in code for you within a single conversation session.

She draws a key comparison: most AI tools today are like "the smartest intern in the room" — sharp-minded, but forgetting everything the moment they leave the meeting room. That's because most tools:

- have no long-term memory (it evaporates when the session ends)
- have context limited by the context window
- require everything to be initiated by a human (stateless, mostly request/response)
- have model capability that's actually good enough already; what's really holding things back is the surrounding infrastructure: environment management, observability, permissions, security, and so on

So what they're doing at Kilo is turning AI from a "chat tool" into an "always-on teammate." She cites two always-on agents they genuinely use: Chad and Snivel. These agents have their own GitHub accounts, Slack accounts, even their own email; their permissions are carefully planned out just like a regular engineer's, giving them persistent access to the relevant repos and systems without directly bypassing security boundaries. Because they have a fixed identity and persistent state, they can gradually build up their own "tacit knowledge" about the project and the organization, just like a real colleague.

She also compares three modes: human-driven vs. prompt-driven vs. event-driven. The traditional mode: PagerDuty wakes an engineer up in the middle of the night, and the human gets up, checks the alert, investigates, and writes a patch. Then there's today's common mode: the engineer receives the alert and then prompts a coding agent to help produce a fix. The future she advocates for is event-driven: the alert goes to the agent first, and a human only gets paged if the agent can't resolve it. With this shift, the problem is no longer "build a smarter chatbot" but "build a long-running distributed system with recoverable state and strong observability" — which is, in essence, building agents a piece of infrastructure as robust as a cloud service.

So she covers several key design points:\
you need persistent identity (GitHub, Slack, cloud credentials, calendar, etc.), you need finely scoped permissions (how much of the production DB can it see, can it touch Sentry, Cloudflare, and so on), and you need organization-level "conventions" to define permission boundaries for different types of agents — one set of rules for engineering agents, another for marketing agents. Once all of this is managed centrally by a runtime and a control plane, AI reliability becomes something that's "engineered," rather than "lucky enough not to break."

She shares how Kilo implements this: separating the control plane from the runtime plane, giving the agent a manageable life cycle (account creation, credential rotation, environment updates, and not falling over entirely when a model or token limit changes). She even gives an example of having Chad sign up for a LinkedIn account — just having the AI figure out how to get past CAPTCHA and bot detection burned about $100 of compute, but once past it, it could log in reliably afterward. This also reflects that today's internet wasn't designed for agents; to let them work long-term in this environment, systematically managing credentials, updates, and supply-chain risk (like an NPM package getting hijacked) becomes really important.

On the product side, she stresses that "capability ≠ product." Even if a model is already capable of doing a lot, if you haven't packaged it into something "engineers are willing to use, trust, and can rely on at 2 AM," it still won't have a real impact inside the organization. So when rolling it out, you need to design carefully for:

- clear, easy-to-understand usage conventions (e.g. email naming rules)
- stable, long-term permission and lifecycle management
- observability and debugging capabilities that people are willing to trust at critical moments

She concludes that what's holding companies back from adopting always‑on agents like these is usually fragile environments, lack of persistence, lack of observability, and weak recovery mechanisms. But these are engineering problems, not theoretical ones, and once solved, she expects that within six months everyone will have their own Chad and Snivel — one or more continuously running AI colleagues handling coding-related work for you, and more.

Finally, she condenses the question of our era into a single line: yesterday we were asking "can the model write code?"; today the question is "can the system coordinate? does it have enough access? can it actually solve the task and 'own the outcome'?" She believes the direction is already fairly clear: the strongest engineer of the future won't necessarily be the one writing the most code, but the one skilled at building the next generation of the strongest AI colleagues — turning these agents into one of the new "best engineers in the room."
