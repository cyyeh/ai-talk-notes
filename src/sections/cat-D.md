---
heading: Agent Security & Identity
desc: Prompt injection, least privilege, identity control planes, PII protection — the prerequisites for agents accessing enterprise data.
---
## Agentic AI: From Risk Awareness to Practical Control
@ Noma Security
Points out that agents hand decision-making authority to non-deterministic LLMs, causing security boundaries to collapse: the trusted/untrusted line within the context window gets flattened, indirect prompt injection is hard to defend against, non-human identity permissions balloon, and agent-to-agent interaction becomes a new blind spot. Advocates for least-privilege, task-scoped permissions, layered deterministic controls upstream and downstream, and runtime governance (allow / deny / defer / escalate) instead of reviewing logs after the fact.

## Agents Break Data Security — And Here's What You Do About It
@ Skyflow
Argues that in architectures with agents, MCP, and multi-agent collaboration, old perimeter-based security fails — security controls must run continuously alongside data flow across every component, and must "protect the data rather than block it." Demonstrates runtime data controls using labels plus vault tokens, so that indexes and systems never store real PII, while still preserving cross-system relationships and keeping RAG/search precision/recall as good as with plaintext.

## Enabling Highly Autonomous Trusted Agents
@ Panel discussion (AI Council SF '26)
Discusses how to safely put increasingly autonomous agents into production: because LLMs are non-deterministic, most companies still run a semi-automatic "human in the loop" approach. Covers the combined blow-up risk of agent supply chains and over-provisioned credentials, prompt injection, an AI version of shared responsibility, and the hard problems of agent identity and visibility. Converges on a Security / Autonomy / Capability triangle and an "Excessive CAP" mental model, arguing for building confidence first in low-risk, repetitive scenarios.

## Identity Is the Bottleneck: Why Agents Force a New Security Model
@ Keycard
Argues that traditional identity and authorization (.env API keys, OAuth) cannot handle the emergent behavior agents introduce — crossing trust boundaries, multi-hop delegation chains, and high-velocity risk — since an agent exploring new paths is structurally identical to an intruder's lateral movement. Proposes making identity an external, continuously running control plane for agents: first-class cryptographic identity, contextual policy evaluation, progressive trust, task-scoped permissions, and a full audit chain.

## The Agent Attack Surface: Why AI Is Breaking Software Security As We Know It
@ Feross, Socket
Points out that supply-chain attacks exploded after GPT-4, with modern applications drawing over 90% of their code from open-source dependencies, while AI agents will select, install, and run packages on their own; attackers now craft perfect malicious READMEs aimed at LLMs, and MCP/skills have also become a new attack surface. AI has compressed the time from "vulnerability disclosed" to "exploited" down to about 10 hours. Advocates switching to reachability analysis to fix only reachable vulnerabilities, using targeted local patches.

## The End of the Internet As We Know It
@ Raffi Krikorian, Mozilla
Mozilla's CTO argues that AI has simultaneously made both "writing code" and "finding zero-day vulnerabilities" easier, breaking the old security "truce" where offense and defense were roughly matched in difficulty — while critical open-source projects that depend on just one or two maintainers are extremely vulnerable under AI-automated vulnerability scanning. Calls for treating AI as a co-author, basing merges on behavior and evals, having git record prompt/model versions and provenance, and pushing secure-by-design.
