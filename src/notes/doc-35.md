---
title: Enabling Highly Autonomous Trusted Agents
speaker: Panel discussion (AI Council SF '26)
video: https://youtu.be/l6aHWUfzk7E?si=8DkhTfr5yF-DP_Nr
---
This video is a panel discussion at AI Council SF '26, on the theme: as AI agents become increasingly autonomous, how do you "safely" actually put them into production, rather than leaving them stuck at the PoC stage.

1. The "vulnerability explosion" risk brought by Methos / Project Glasswing

The video opens by discussing Anthropic's Claude Methos / Project Glasswing: models of this kind can now automatically find vulnerabilities in modern browsers and operating systems that human researchers had failed to discover for 17 to 27 years.\
Heather points out that this means:

- Attackers can use AI to find more zero-days; the defenders' "window of exploitation" has shrunk from 30 days to a few days, or even become "negative one day" (exploited before the CVE is even announced).
- The traditional process of "waiting for a patch" and "waiting for developers to upgrade" is now too slow; it's necessary to:

▫ Use AI to auto-patch and shorten time-to-fix.

▫ Use network- and behavior-layer "attack-path mitigation" as a temporary defense while waiting for the real patch to be ready.

▫ Rely on behavioral detection to catch attacks early, even without a CVE or an updated version.

Meanwhile, Feross notes that open-source maintainers are already overworked; AI finding more vulnerabilities, combined with AI-generated "low-quality PRs/AI slop," will make the maintenance burden explode — potentially even leading some people to simply use fewer or no open-source packages at all, having agents generate code directly instead. But that's a different set of risks (no one reviews it, no CVE, no shared ecosystem oversight).

2. Why does everyone talk about "defensive agents," yet so few are actually deployed?

The moderator cites Alex Stamos's view: in the future, "defensive autonomous agents" will definitely need to run in production, directly performing high-privilege actions like shutting down VMs or rotating credentials, because humans react too slowly.\
But all three guests admit frankly: right now, many companies still don't dare to actually put "fully automatic" defensive agents into production, mainly because:

- LLM output is non-deterministic; security teams don't dare let an agent that might make the wrong call shut down services or delete things on its own.
- Security products fear false positives most of all; an agent taking down production is the worst-case version of a false positive.
- The more viable approach right now:

▫ Use agents in the SOC to triage, gather evidence, and generate recommendations, with a human pressing "execute" at the end.

▫ Start by putting agents on clear, highly repetitive, low-risk processes, gradually building confidence before slowly loosening the degree of automation.

▫ Use "deterministic" techniques to filter out 90% of the noise first, for example:

⁃ Static analysis + reachability analysis: check whether a vulnerable function is actually ever called; if not, mark it low priority and address it later.

⁃ Backport patches: instead of a major version upgrade of the entire library, backport the critical fix into the old version, reducing the risk of a large-scale refactor.

The overall mood: in the short term, it's unlikely that "fully autonomous security agents" will be put directly into core systems — the path forward will first be a "human-in-the-loop, semi-automatic" one.

3. Agent supply chains and the "over-privileged credentials" combo blowing up

The middle section shifts focus to "agents downloading their own code/tools/skills, creating a new supply chain."\
Feross shares several recent large-scale supply chain attacks in the npm/JS ecosystem (such as axios, TanStack, node-ipc), which share these characteristics:

- A malicious package being live for just a few hours is enough for large numbers of agents/dev environments to install it.
- Because agents are often configured with "over-privileged credentials," the moment a package is poisoned, API keys, tokens, and cloud credentials all get leaked immediately.
- Once attackers obtain large numbers of credentials, they can go on to hijack maintainer accounts and publish more malicious versions, forming a "supply chain worm."

Everyone stresses that two directions need to be pursued simultaneously:

1. As much as possible, don't let agents download things indiscriminately

▫ Strictly vet and verify skills, MCP servers, and package marketplaces.

▫ Organizations with the capability should use internally vetted packages/mirrors as much as possible, rather than letting agents download directly from the public internet.

2. Even if the wrong thing gets downloaded, minimize what can be leaked

▫ Move credentials off the endpoint, or keep them in a vault with strict scoping/just-in-time access.

▫ Tokens used by agents should be short-lived with fine-grained permissions, rather than "just grant everything, it's easier."

▫ Monitor and enforce agent behavior at runtime: don't let agents freely traverse every execution path — have a policy engine layer intercept instead.

Diana describes it as: a while back the agent ecosystem was a bit of an "AI gold rush" — everyone, in the name of speed, first crammed every permission into agents, and only now are they going back to retrofit governance and least privilege.

4. Prompt injection, complex context, and "agentic traps"

They then discuss: as the "context layer" becomes ever richer (memory, tools, skills, multi-source RAG), the opportunities and combinations by which agents encounter untrusted content become more complex.

The video mentions Google DeepMind's "AI agentic traps":

- Each individual sub-agent appears to only do one small, harmless thing, and each of their prompts looks harmless too.
- But when the orchestrator combines the outputs of multiple sub-agents together, the overall semantics become malicious.
- There's also the technique of repeating a message like "this product is the industry standard," which accumulates into a cognitive bias that skews the system toward a particular conclusion.

Diana draws a historical analogy to intrusion detection systems (IDS): back then, attackers would split a malicious payload across multiple TCP packets, and the IDS would find each individual packet harmless, but combined they became an attack. The solution was:

- Don't look only at a "single event/single prompt" — reconstruct the entire session/overall behavior before making a judgment.
- Before feeding content into the LLM/agent, use a classifier or another AI to do a "content hygiene check" first, blocking anything that looks like prompt injection or a malicious instruction.

The takeaway: many agent attacks actually share a "similar structure" with traditional security problems, just transposed into an AI/context setting. You can borrow from past defensive designs, but they need to be rebuilt at the new technical layer.

5. The AI version of the Shared Responsibility Model: who's accountable?

The moderator brings up the incident where "Railway/PacketOS had its database deleted by an AI agent in 9 seconds":

- The agent was granted overly broad credentials and directly executed a destructive operation with no proper guardrails in place.
- The affected developer's gut reaction was to push the blame onto the AI vendor: "How could you let the agent do this?"

A few viewpoints from the discussion:

- Some vendors (Sentry's MCP server is the example given) simply don't offer a delete tool at all — if you want to delete data, a human has to go do it manually in the console.
- Heather says that for agents, they currently mostly "build in-house" rather than relying heavily on third-party vendors, because:

▫ The ecosystem changes too fast; building your own guardrails lets you adjust more quickly.

▫ You gain finer-grained control over agent behavior, quality, and measurement.

Diana, meanwhile, draws an analogy from cloud shared responsibility:

- When you store files in Box, Box ensures the underlying platform is secure, but if you share a file with the wrong person, that's the user's responsibility.
- When it comes to AI/agents, the responsibility surface has many more layers:

▫ Who trained the model, and with what data?

▫ Who wrote the agent? Who deployed it?

▫ Who wrote the prompt, who granted the permissions?

- When incidents happen in the future, assigning liability and drawing contractual boundaries will be far more complex than in the cloud era.

Feross proposes a model that some people are experimenting with now:\
Treat each agent as "an employee" — give it an email/identity, attach it under a manager (a real person), so that existing HR/permissions/audit systems can be applied to the agent; if the agent does something wrong, trace it back to the person responsible.\
Heather cautions, though, that in practice an agent is often not "one person, one agent" — it's a whole product/team, or even a system made up of multiple sub-agents together, so mapping it one-to-one onto a single responsible person isn't always sensible, and agent identity and traceability themselves haven't been properly solved yet.

6. Agent identity, auditability, visibility: everyone is still "hunting for shadows"

The next section discusses: "we don't even really know how many agents are running inside the company."

Heather describes the current state of affairs:

- Real agents are often not built under the direction of central IT/security — instead:

▫ A developer figures out a workflow on their own.

▫ Marketing or sales discovers that an agent can automate certain tasks.

- So the "birth" of agents within a company is often spontaneous, and the security team may not even know about it.
- So the overall maturity stage is roughly:

a. First figure out how to "see" which agents exist (visibility/discovery).

b. Only then discuss configuration, policy, and runtime protection.

c. Most companies today are still at stage 1.5: some important agents already have runtime controls, but the overall inventory is far from complete.

Feross adds that supply chain security is in the same boat:\
ask "do you know what third-party code your agents have downloaded and run?" and almost no one can answer.\
And traditionally only looking at "code that lands in GitHub" isn't enough, because many agents just generate or run scripts temporarily on a laptop that are never committed at all, so they're never scanned by existing AppSec tools.\
The result: the endpoint (the developer's laptop) has once again become a critically important observation point, because a large volume of AI tools (like co-pilot-style products that move the mouse and open the browser) are actually running right there.

7. The trade-off among security, autonomy, and capability: how to "turn the dials"

Near the end, the moderator distills the theme into a "Security / Autonomy / Capability triangle."\
In reality, most companies can't have all three, and must sacrifice one:

- Limit capability: only let the agent do very small, narrow tasks — safe, but of limited value.
- Reduce autonomy: humans frequently review and approve in the loop — reduces risk but limits efficiency and speed.
- Loosen security: let the agent do a lot, very autonomously — but the risk of credential leaks and data exfiltration skyrockets.

Diana proposes a mental model: "Excessive CAP," where CAP stands for:

- Control
- Autonomy
- Permissions

You need to set these three dials to a position that's "helpful to the business, but doesn't blow up the risk," avoiding excess on any one side.\
Practical strategies include:

- Start by using agents in low-risk, highly repetitive scenarios (like Tier 1 helpdesk, repetitive SOC triage), observe for a while, and build confidence.
- Set clear confidence thresholds and false-positive tolerances, and only consider removing human approval or loosening permissions once they're met.
- Gradually pilot higher autonomy on tasks that are security-sensitive but have stable patterns (e.g., blocking a specific type of incident).

Heather shares that their SOC agents have already reached a certain level of maturity — an analyst has said "for some low-risk cases, maybe we don't need human review at all, just a weekly report review" — a real example of gradually increasing autonomy.

8. Closing sentiment: optimistic long-term, bumpy short-term

The closing message from all three is fairly consistent:

- In the short term, the attack surface and governance difficulty brought by AI agents will make the security world "very bumpy" — there will be more gray hairs.
- But over the long term, they're all optimistic that AI is a net positive for the defensive side:

▫ AI can be used to find more vulnerabilities and shorten time-to-fix.

▫ It can automate away a lot of tedious security work that requires high consistency.

- Security has always been a field of "dynamic adversarial contest": defenders and attackers trade moves back and forth, and AI just makes this loop faster — but also more interesting.
- Finally, they stress that this is a "collective problem": the industry must figure out architectures, governance models, and best practices together — human collaboration itself remains critically important.
