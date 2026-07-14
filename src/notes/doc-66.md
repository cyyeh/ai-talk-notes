---
title: Recursively Self-Improving Agents as Autonomous Software Engineering
speaker: Factory
video: https://youtu.be/m0VyJ4v-jrA?si=0UIVqASZAQzoi7yW
---
This video explains how Factory uses "self-improving agents" for automated software engineering maintenance and optimization, letting their agent Droid continuously learn from real user behavior, open its own PRs, and fix its own bugs, with engineers responsible only for the final taste and decision-making.

Key takeaways from the video

The speaker first describes the current situation: LLMs/agents have already made "writing code" very fast, but "overall engineering velocity" hasn't scaled up proportionally. The real bottleneck has shifted to:

- "Discovering" problems in production
- Deciding "which problems are worth fixing"
- Verifying whether a change "actually made things better without breaking anything"

1\. The Signal-to-Fix automated loop

Factory built a general "signal → fix" automated loop and applied it to their own codebase:

1. Detection: gathering signals from real usage sessions
2. Triage: identifying patterns worth acting on and writing them up as tickets
3. Execution: Droid opens a PR and adds tests based on the ticket
4. Validation: multiple layers of automated QA and security checks
5. Merge & Deploy
6. Monitoring: checking whether metrics and user experience improved after the fix

The key point is: agents aren't used only for the "writing the PR" step — they're involved in nearly the entire loop, with humans stepping in only for the "final PR approval."

2\. Signals: an online evaluation system

They built an in-house "online eval" system called Signals, run once a day as a batch job:

- Using an LLM judge to read through user-agent conversation sessions
- Producing three types of structured annotations for each session:

▫ friction: points where the user "completed the task but the process was rough" (repeatedly rewording instructions, confused context, wrong defaults, etc.)

▫ delight: moments where the agent "exceeded expectations and earned trust"

▫ facets: context like task type, intent, tech stack, language, etc.

These annotations:

- Come with evidence/citations pointing back to the original session, but only use summaries and labels rather than verbatim transcripts, and are analyzed only at an aggregate level to protect privacy
- Can be used to identify which friction patterns lead users to abandon a session midway

Some interesting patterns they discovered include:

- Frequent branch switching strongly correlates with worse session outcomes (the agent gets yanked back and forth between environments)
- Context churn (context being repeatedly rebuilt) is a leading indicator of "about to abandon this session"

All of these emerged from Signals' clustering and taxonomies, without any explicitly defined eval set in advance.

3\. Droid's automatic triage and ticket creation

Once a friction pattern accumulates enough data, the next step is having Droid act as its own data scientist:

- Using a "signal analysis skill" to query the database, cluster friction, and find issue patterns
- Cross-checking against existing tickets/PRs/existing work to deduplicate
- If it's a new issue: automatically open a ticket, assign an owner, and add a suggested priority and labels

Example:\
They once found that tool calls were timing out too frequently, causing the agent to keep retrying and wasting time and cost — this was automatically distilled into an actionable ticket.

4\. Droid opens PRs automatically, but can't be the sole reviewer of its own work

After getting a ticket, Droid is assigned from a project management tool (like Linear):

- Reading the ticket, understanding the codebase, and doing root cause analysis
- Writing the fix and regression tests
- Running its own "create PR / fix PR" skill: self-checking at least once to make sure build, type check, lint, and tests all pass

However, the speaker stresses that an agent shouldn't be the sole verifier of its own changes, because:

- The tests it writes tend only to "prove that the implementation it just wrote is correct," rather than "check whether the behavior matches the intent"

So they designed an entire set of automated gates that must be passed "before reaching human review."

5\. Multiple QA gates: reserving human time for the highest-leverage layer

Before a human ever sees a Droid PR, it goes through:

1. Regression tests & evals

▫ Standard unit/integration tests

▫ Synthetic sessions + evals evolved from real failure cases

▫ A/B and side-by-side comparisons

2. Independent agent code review

▫ Reviewed by a different agent that "didn't write this code"

▫ Checking correctness, coding style, and conventions

▫ Most importantly: verifying whether "the problem the PR claims to solve" has actually been solved

3. Security review

▫ Multiple agents run threat modeling like STRIDE against every diff

▫ Searching for possible security risks

4. End-to-end QA

▫ The heaviest, most time-consuming, and most critical step

▫ For every changed product surface, multiple agents launch the real product interface and operate it just like an actual user

▫ For example: in a TUI, Droid opens an actual TUI, types messages, and completes tasks, to make sure there's no user-facing regression

Only after passing everything does the PR move on to:

5. Human review and approval

▫ At this point humans essentially don't need to hunt for small bugs anymore

▫ Their main concerns are:

⁃ Is this change actually what's wanted from a product/strategy standpoint?

⁃ In terms of design and architecture, is this code placed and abstracted correctly?

After that, it moves into the normal merge & deploy process, and Droid also helps automate the release.

The result:\
The time from "user hits a snag" to "issue fixed and shipped" has shrunk dramatically, and a lot of the process completes automatically without anyone specifically watching it.

6\. Results and limitations

They observed that:

- Many PRs are fixing "edge cases" and are, from a technical standpoint, very well suited to automatic merging
- About 70% of this type of PR only needs a "LGTM" from a human reviewer to be merged, with almost no changes needed
- However, the areas with the most room for improvement are still those where:

▫ The problem itself is hard to diagnose or reproduce

▫ The environment is highly unusual

▫ Or the product behavior is very open-ended, with multiple design choices all being justifiable

In these cases, human control over "product intent and taste" remains crucial.\
For example:\
The agent tends to write prompts that are overly verbose, whereas the product team prefers "short and precise" — this kind of tradeoff isn't something an eval can easily quantify.

In summary: automation can absorb a large amount of "clear-cut, locally patchable" work, but product direction and nuanced experience are still steered by humans.

7\. Generalizing to any product team

Finally, the speaker abstracts this loop, arguing that any product could adopt a similar architecture:

- Input: you probably already have logs, metrics, and telemetry
- Validation: strengthen tests and evals, building synthetic evals tied to real failure cases
- Autonomy: let agents participate in:

▫ Finding issues from signals

▫ Automatically opening tickets

▫ Automatically submitting fixes and tests

▫ Automatically running multi-layer QA and security checks

Factory has also productized the review/QA capabilities they use internally, letting users apply the same pipeline directly through commands like ‎⁠/install QA⁠, ‎⁠/install review⁠, ‎⁠/install security review⁠ and similar.

His final conclusion:\
If you apply this signal-to-fix loop to your own software and keep it running continuously, the metrics you care about (experience, reliability, etc.) will keep improving, and this advantage will compound over time, freeing up your team to spend more energy on higher-leverage, more interesting problems.
