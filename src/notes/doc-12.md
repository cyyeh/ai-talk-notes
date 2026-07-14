---
title: Agents Break Data Security — And Here's What You Do About It
speaker: Skyflow
video: https://youtu.be/Abh6CW0jvLQ?si=j-XBgmuhHcO2FH2b
---
This Skyflow workshop is mainly about how traditional data-security practices can't hold up under today's AI systems, which now have agents built in — they propose a concrete architecture and implementation for "protecting data at runtime."

What's this video about?

The talk opens by pointing out why big model companies increasingly look like "consulting firms":\
the hard part of bringing AI into an enterprise isn't the model itself, but the complexity of the enterprise environment — permissions, workflows, identity, governance, and data scattered across all kinds of systems with different access controls. Tightly coupled, all-in-one enterprise platforms like Palantir prove this kind of integration has real value, but at a cost: extremely expensive, heavily customized, and hard to replicate.

The speakers' goal is to "decouple this all-in-one architecture into modules," so enterprises can gradually assemble their own AI infrastructure with the tools they already have (Snowflake, Databricks, BigQuery, Neo4j, and various orchestration/agent frameworks), with "security and privacy" that has to be designed in from day one rather than patched on afterward.

Core argument: AI breaks the old data-security model

They split this into two control dimensions:\
one is identity (the permissions and possible actions of people, agents, etc.), and the other is data (which data can be touched, how it's processed, whether it should be masked/tokenized, whether data minimization should apply based on task intent).

Right now, most companies, out of fear, choose to just "block the data outright" — which means AI can't deliver any value at all, and the C-suite only sees "spending a fortune with no ROI." So their argument is:\
don't "block" data — use fine-grained runtime data control instead, so AI can use the necessary sensitive information under proper governance.

Why isn't the old approach good enough?\
In the past it was "user – application – database," and permissions were reasonably well understood; now the architecture has added agents, multi-agent collaboration, MCP servers, models calling each other, context, and various kinds of memory (short-term and long-term). Data now flows and gets generated at high speed among all these components, and new kinds of attacks can already do enormous damage before you ever see an alert (they cite the McKinsey incident as an example).\
The conclusion: security controls have to follow the data, running continuously across every component, instead of just guarding a handful of fixed boundaries.

Workshop hands-on: how do you detect and protect sensitive data?

Next comes the more hands-on part, led by a Skyflow developer advocate walking everyone through experiments in Colab.

1. Comparing five PII-detection tools

They took 1,000 text samples containing PII from two public "AI for Privacy" datasets (roughly 200k/300k records), and tested five models:

- Microsoft Presidio (pattern matching + simple NER)
- Glyner PII (zero-shot NER)
- NVIDIA's version of Glyner
- OpenAI's newest open-source privacy-filtering model (OPF, bidirectional token classification)
- Skyflow's Detect API (their own composite classifier)

They compute F1 (combining precision and recall), and also look at performance broken down by entity type and by language. Presidio came out weakest, OpenAI's privacy filter did well, and Skyflow scored highest in this particular evaluation.\
They also show some "ambiguous" examples — for instance, one model mistook "Miss Mercedes" for a car rather than a person's name, while Skyflow was able to split it into first name / last name separately, underscoring how important it is to "detect the correct entity type."

2. Protection methods: it's not just "blacking things out"

Once you've found PII, what can you do with it? They demonstrate four sanitization approaches:

1. Direct redaction — everything becomes ‎⁠*⁠, so neither humans nor the model can see anything
2. Replace with a label — e.g. ‎⁠[EMAIL]⁠, so you know "it's an email" but not which one
3. Label plus numbering — e.g. ‎⁠[EMAIL_1]⁠, letting you tell multiple instances apart within the same text
4. Label plus a vault token (Skyflow's recommendation) — replace with a deterministic or random token, e.g. ‎⁠[EMAIL_TOKEN_abc123]⁠

The key is the fourth option: if you use the same deterministic token for the same email across 27 different systems, you can preserve referential integrity across all of them without any of them ever holding the actual email address.

A key demonstration: security for search & the knowledge base (RAG)

They demo a simplified enterprise-search / agent-search scenario:

- Run documents through the detector to find PII first, then apply different treatments (redaction, labeling, tokenization).
- Build a BM25 index, then use an email address as the query (e.g. ‎⁠alice@example.com⁠), which likewise goes through the same tokenization pipeline.

Comparing the results:

- Raw plaintext index: precision = 1, recall = 1 (Alice can be found perfectly)
- Redaction, plain labels, or label+numbering: precision / recall nearly both drop to 0, since there's no way at all to look up the matching record using the email
- Label + token: precision / recall are 1, the same as plaintext

In other words, the token-based approach lets you achieve two things at once:\
on one hand, neither the index nor any system stores the real PII; on the other, search and lookup functionality work exactly as well as they would with no protection applied at all.

They tie this back to a real enterprise problem: a lot of companies want to build "AI knowledge search," but are too afraid to include Workday (HR), finance, contracts, and similar data — leaving a large share of business units without any help from it. This tokenization approach lets you put the entire company's "corpus" into a search/RAG system without scattering sensitive information across a pile of third-party services.

From detection and protection to governance: what does the whole solution look like?

After the experiments and the data, they emphasize a complete three-step chain:

1. Accurately detect PII/sensitive information inside unstructured data (text, files, chat messages, eval traces…)
2. Use an appropriate method to "protect rather than block," preferring tokenization to preserve usability and referential integrity
3. Handle governance and decryption at the final step:

▫ Most people only ever see a string of tokens

▫ People with partial permissions can see a partially masked result

▫ Only someone who satisfies identity + intent + time-window conditions can see the full plaintext

They also mention Skyflow supports around 70 entity types across multiple languages, and handles not just traditional PII but also things like IPs/domains, project codenames, and other sensitive enterprise information; it also comes with extensive compliance certifications and cross-border data-residency capability. Because a token has no reversible algorithmic relationship to the original data, it isn't subject to the same tier of regulation as personal data, so it can be safely transmitted across borders.

Their closing summary:\
enterprises can take their open-source evaluation and Colab notebook and swap in their own real data and scenarios to test. Skyflow's tokenization can be paired with any open-source detector or your own in-house detection model, whichever you choose. The overall message: inside agent/AI systems, "runtime data control" needs to be designed in as a foundational building block, not bolted on afterward as an add-on.
