---
title: You Can't Prompt the Room: The Last Skill AI Won't Replace
speaker: Balázs Horváth, VisualLabs
video: https://www.youtube.com/watch?v=6bmM45jkMDY
---
This video argues that once AI can write most of your code for you, what really matters shifts to "figuring out what to build," not "how to build it."

Key takeaways

Speaker Balázs Horváth says that writing code, generating specs, and writing tests can increasingly be handed off to AI, so the bottleneck in software development has shifted toward the human side: getting the right people into the room, clarifying the real requirements, and judging what's worth doing are now the hardest and most valuable parts.

He shares an internal hackathon story: out of 21 AI agent ideas, 17 were ultimately abandoned — not because the technology didn't work, but because they lacked data access, a clear business owner, or any real business value. Only 4 actually shipped and made an impact. This shows that "being able to build it" doesn't mean "it's worth building."

Balázs emphasizes that AI tends to produce "the most common answer." If you just use it to make an existing process a bit faster, you'll likely end up with "a faster horse" rather than "a car." Achieving a real qualitative shift requires humans to "read the room," understand context, and redefine the problem.

Key tools and methods

He argues that the most important thing going forward is an "analysis toolkit," not pure coding skill, including:

- User Story Mapping: break a process down into its backbone steps — for example, a customer support flow: contacting, triaging, resolving, closing. Place user stories under each step, first capturing the high-level picture, then deciding which stories the MVP should tackle first and which go into the backlog.
- Write user stories with a standard structure (persona / what / why), for example: "As a support lead, I want to sort cases by urgency, so escalations don't get missed." AI is very familiar with this format, and it can be used to feed AI to generate specs, tests, and implementation.
- Each user story should come with acceptance criteria, making it easy to derive test cases, and this content should be properly stored in markdown files in the repo, so AI has context to look things up — the output quality improves substantially.

4 questions to judge whether something is worth doing

Balázs proposes a 4-question framework to help clarify value:

1. Whose problem is this, exactly? Can it be pinned down to a specific persona?
2. What does "success" look like for them? What situation indicates it actually helped them?
3. What would make them refuse to use it? For example, lack of platform support, a poor experience, data security concerns, and so on.
4. What decision will this "change"? Are we actually helping them make a better choice?

Organize the answers clearly and give them to AI as context — the results will be far better than just throwing out "build me a customer support agent."

From Value → Architecture → Design (VAD)

He proposes a way of thinking called VAD:

1. Value: first figure out what the value is and how it's created.
2. Architecture: then look at how the existing process works and what the underlying system architecture looks like.
3. Design: only at the end do you design the concrete features and interface.

Everyone has access to the same set of AI tools; what really separates people is who understands the business and the value better, not who codes faster.

What it means to be "building the wrong thing"

He also lists a few warning signs of "building the wrong thing":

- Features ship a lot, and fast, but almost nobody uses them.
- Users only "poke at it" once and don't keep using it; so don't just look at time-on-page — look at the "repeat frequency" of specific behaviors.
- The demo looks great, but it can't be, or never actually gets, deployed to real production.
- The PRD was never actually tested with real users or used to collect feedback.

These are all classic mistakes of optimizing for "output volume" rather than "value."

Where should the smartest people be placed

In the past, we put our smartest people on writing code; now we should move them to the front line, facing customers and business problems, spending more time on "deciding what to do." Writing code itself has become relatively cheap and fast, while the cost of decision-making has gone up instead.

He's not saying everyone needs to become a product manager or a consultant — rather, people with real hands-on experience need to be brought into the decision-making process, so the quality of "what to do" decisions goes up.

Things you can start doing right away

Finally, Balázs offers a few adjustments you can make immediately:

- Check the metrics you're currently tracking. Cut ones like "number of features shipped this quarter" and replace them with "number of features used more than twice."
- Pull people who truly understand the domain into roles closer to customers and decision-making, rather than keeping them locked away writing backend code.
- Always do mapping before development: user story maps, business model canvases, and so on — clearly map out "where the value is" before writing a single line of code.

The core message of the whole talk is: writing code will increasingly become a "commodity resource," and what AI truly cannot replace is the ability to read people, ask the right questions, and draw the right map — the thinking and communication skills that let a team "build the right thing, instead of just building the next thing."
