---
title: Designing Memory Systems for AI Agents
speaker: MongoDB
video: https://youtu.be/8DAVx8urNn8?si=MQeXlrAio-h3XK0O
---
This video is about how to design a practical "memory system" for AI agents, with a full demonstration using MongoDB.

The video opens by explaining why agents need memory: an LLM's context window has a limit, and once a conversation runs long, tool calls pile up, and the reasoning trace gets long, it quickly fills up. Once it overflows or the session is closed, the next time is like "starting a brand-new agent" — all past interactions are gone. So an external memory system is needed to help the agent persist important information and retrieve it later on demand.

She then defines several memory types that map to what this lab will build:\
Short-term memory (short-term/session memory) is simply the current conversation history: user messages, agent responses, tool calls and results — all stored in a MongoDB ‎⁠chats⁠ collection. This data is only relevant to the current session, is queried using session_id as the key, and also gets a TTL index so it's automatically deleted after a period of time, avoiding unbounded accumulation of data.

Long-term memory is further split into two categories:

1. Semantic memory: like a human's "understanding of the world/of other people." In the coding agent example, this is "facts about the user themselves": preferred languages, framework preferences, tool habits, and so on. She treats these as individual "user facts & preferences," stored in a ‎⁠semantic⁠ collection indexed by user_id, which can likewise be pruned/updated via TTL or scheduling.
2. Procedural memory: knowledge of "how to do things," like a human "knowing how to ride a bike or swim." For a coding agent, this is how it implemented some complex project step by step: design decisions, tool choices, pitfalls encountered and their solutions. These are stored as individual "step-by-step implementation guides" in a ‎⁠procedural⁠ collection, paired with vector embeddings for vector search, so that when the agent takes on a similar task in the future, it can look up "how it did this before."

The video uses Voyage AI's embedding model (the Voyage v4 series) to generate vectors, converting procedural memories into embeddings stored in MongoDB, then building a vector index using MongoDB's vector search index. At query time it will:

1. First embed the current task description;
2. Run an aggregation pipeline on the ‎⁠procedural⁠ collection: the first stage is a vector search (nearest neighbor), followed by post-processing such as projection;
3. Retrieve the top few most relevant procedural memories to give the LLM as reference.

She also demonstrates the index design:

- ‎⁠chats⁠ has a single-field index on session_id, plus a TTL index (e.g., auto-delete after 1 year) to avoid long-term accumulation of stale conversations;
- ‎⁠semantic⁠ likewise has an index queried by user_id, plus TTL or conditional deletion, to handle the fact that "people's preferences change, so old memories shouldn't be kept forever";
- ‎⁠procedural⁠, meanwhile, has a vector search index, which requires specifying the embedding field path, the number of dimensions, and the similarity metric.

She spends considerable time on the design of the "memory lifecycle": not just "storing" and "retrieving," but also "what to store, when to store it, and when to delete it":

- Not every conversational detail gets stuffed into long-term memory; instead, the LLM "extracts representative facts/procedures" from multiple conversations before they're stored.
- She stresses that memory needs to be pruned/consolidated, for reasons including: preferences change, old information may conflict with new requirements, and there's the matter of cost (storage and query expense). She states that she's firmly on the side of "pruning/trimming" rather than "never delete."

At the implementation level, the lab's workflow is roughly:

1. Start the environment in the provided sandbox (Jupyter Notebook + local MongoDB), choosing the right Python version.
2. Use the MongoDB Python driver (‎⁠pymongo⁠) to connect to an already-set-up local cluster.
3. Configure an LLM / Voyage embedding API accessed through a proxy (the key is provided via a pass key, valid for 3 days).
4. Create a MongoDB database and three collections: ‎⁠chats⁠ (short-term), ‎⁠semantic⁠ (semantic long-term), and ‎⁠procedural⁠ (procedural long-term), and seed a few sample procedural memories up front so everyone can try vector search directly.
5. Write short-term memory functions:

▫ ‎⁠store_chat_message(session_id, role, content)⁠: writes a JSON-like document (including a timestamp).

▫ ‎⁠get_chat_history(session_id)⁠: queries with ‎⁠find⁠, sorts by timestamp, and projects out role and content.

6. Write tool functions for long-term memory:

▫ Semantic memory: ‎⁠save_user_memories(user_id, memories)⁠ uses ‎⁠insert_many⁠ to store multiple documents; ‎⁠get_user_memories(user_id)⁠ uses ‎⁠find⁠ to fetch all of that user's memories, keeping the content and timestamps, formatted as a string.

▫ Procedural memory:

⁃ First, provide a "scratchpad tool" that lets the agent write temporary notes to a local file;

⁃ Then there's ‎⁠generate_procedural_memory()⁠:

A. Read the scratchpad notes;

B. Use an LLM + prompt to turn these rough notes into a structured step-by-step implementation guide;

C. Embed this description, and store it in the ‎⁠procedural⁠ collection along with the title, description, timestamp, and embedding;

D. Clear the scratchpad, ready for the next task.

⁃ ‎⁠get_procedural_memories(query)⁠:

A. Embed the query;

B. Use a stage like ‎⁠$vectorSearch⁠ in the MongoDB aggregation to pull out the top-K most similar procedural memories, projecting to keep only title and description.

She also explains the relationship between "tool use" and the "code orchestrator": the LLM itself only outputs "which tool to use" and "the tool's arguments" — it doesn't actually "execute the tool." Actually calling tools (e.g., querying a DB, writing a file) has to happen in your agent framework/own code. So they additionally wrote an ‎⁠execute_tool(tool_name, args, session)⁠ function to catch the LLM's tool-call instruction and then perform the actual operation in code.

The final section is a summary of agent orchestration (rushed through due to time constraints):

- Use a session object to track session_id, user_id, and token usage.
- Write a helper to compute the context window usage ratio, and in a "memory protocol" tell the LLM: if usage exceeds a certain threshold (e.g. 70%), it should consider triggering memory creation or consolidation, otherwise information will be lost when the context gets truncated.
- Explicitly specify in the system prompt (or "memory protocol"):

▫ which tool to call at the start of a conversation (e.g., ‎⁠get_user_facts_and_preferences⁠ first);

▫ when encountering a technical/programming problem, how to prioritize checking ‎⁠procedural⁠ memory first;

▫ during the conversation, when to write to the scratchpad, and when to convert the scratchpad into formal procedural memory.

- The skeleton of the agent loop is:

a. Assemble the system prompt + session history + (if needed) long-term memory;

b. Call the LLM;

c. If the LLM gives a final answer directly, end the turn;

d. If the output calls for a tool, parse out the tool name and arguments and hand them to ‎⁠execute_tool⁠ in the code to run;

e. Feed the tool result back to the LLM and continue iterating.

Overall, this video offers a very concrete framework: using MongoDB to manage an agent's short-term conversation history and long-term semantic/procedural memory, and using indexes, TTL, vector search, and a tool-based memory API to implement a memory system that can learn across sessions without spiraling out of control.
