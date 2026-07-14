---
title: Hermes Architecture EXPLAINED: Memory, Context & Gateways
speaker: Hermes project
video: https://www.youtube.com/watch?v=n32qq7Kwzh0
---
This video introduces the overall design of Hermes, an "always-on" AI agent — covering everything from its architecture to memory, context, and communication, all the way to scheduled tasks (cron jobs).

Overall architecture and the agent loop

The author starts with a bird's-eye view of Hermes's basic makeup: at the core is an AI agent loop, wrapped by a variety of "entry points," such as a terminal CLI, gateways (Telegram, Email, Slack…), and an API. No matter which entry point a user sends a message through, the request funnels into the same agent core.

Every time Hermes's agent loop receives a user message, it runs through a simple but complete process:

1. The user sends a message in.
2. Hermes assembles a "context" based on its memory and settings (system prompt, persona, user information, tool descriptions, conversation history, etc.).
3. The context and message are sent to the LLM.
4. Whenever the LLM decides it needs a tool, it triggers a tool call (e.g., web search, reading/writing files, operating on the filesystem, etc.); Hermes executes it and feeds the result back to the LLM, repeating as many times as necessary.
5. The LLM produces a final reply, which is sent back to the user.
6. Finally, Hermes enters a memory-update step: it analyzes whether there's anything in this conversation worth "remembering," and writes it into the memory system, so it can keep learning and improving going forward.

Every message round runs through this loop, so Hermes gradually accumulates memory as it's used.

Context: what Hermes sends the LLM each turn

The video then goes into detail on what context is made of — a minimal but critical layer, made up mainly of a few markdown files plus supporting information:

- ‎⁠soul.md⁠: defines the agent's "personality" and system prompt, including tone, goals, attitude, sources of inspiration, and so on. This is usually empty right after installation; if you don't write your own, the system falls back to a default "Hermes assistant" prompt.
- ‎⁠user.md⁠: a user description automatically maintained by Hermes. When you reveal something about your background or preferences in conversation (e.g., "I'm a software engineer"), and the agent finds it useful, it writes it into this file.
- ‎⁠memory.md⁠: more "freeform" knowledge memory — not necessarily about you as a person, but things like how to use tools, workflows, and useful facts learned in conversation.
- Conversation history and summaries: recent messages are placed directly into the context. If the conversation gets too long and crosses a certain threshold, Hermes first compresses older messages into a summary before including them, to avoid blowing out the context window.
- Tool and skill descriptions: tell the LLM what tools/skills are available and how to use them.
- External memory (if enabled): possibly a summary of "past conversations relevant to the current topic," pulled back from an external memory service.

In short, every single turn, Hermes "rebuilds" a context from scratch, selectively packaging up the persona (soul), user information, long-term memory, and the current conversation for the LLM.

Context compression and token control

Because an LLM's context window has an upper limit, Hermes has a built-in context-compression mechanism:

- When installing Hermes, you can configure the ratio that triggers compression (by default, it triggers at around 50% context usage, but it can be adjusted to 70%, 80%, etc.).
- Once accumulated history crosses this ratio, Hermes summarizes the older messages, replacing the original long stretch of messages, and adds the summary into the context.

He also explains how Hermes estimates "how many tokens have been used":

- Before the first call to the LLM, Hermes doesn't have any usage information yet, so it roughly estimates the token count as "character count ÷ 4," and compresses if that exceeds the threshold.
- After that, every LLM call's response usually includes usage statistics (input/output tokens), which then becomes a more accurate usage measure.
- Hermes checks whether compression is needed at two points:

▫ Before every call to the LLM.

▫ Or immediately when the LLM returns an error like "context exceeded."

The video also shows the prompt the context compressor uses: it asks the LLM to organize the conversation into several structured sections (e.g., overall goal, constraints, actions completed, current state, key decisions, resolved issues, relevant files, key context, what to include for next steps…), richer than the previously discussed Pi agent — not a minimal design, but one that leans "information-dense."

Gateway: connecting Hermes to Telegram, Slack, Email…

A big part of why Hermes is popular is its "gateway" system, which can connect the same agent to multiple messaging platforms — Telegram, Email, Slack, SMS, Discord, WhatsApp, and so on.

The gateway's work is split across several layers:

1. A long-running async I/O loop: an asynchronous event loop keeps running, listening for new messages on each platform using whatever method suits it (webhook, periodic API polling, websocket, etc.).
2. Receiving messages and building context: what comes in from each platform is just a single, standalone message with no history attached, so the gateway needs to pull the history for that same session from the database itself, assemble it into a complete message sequence and context, and then feed it into the agent loop.
3. Session identification and the database: Hermes stores all conversation records in SQLite. On the gateway side, the session ID is typically built by combining the "platform name (e.g., Telegram) plus the session/user ID returned by that platform plus other identifying information." When a new message comes in, that key is used to look up past messages in SQLite, which are then added to the context sent to the LLM.
4. Session Manager: manages concurrent messages and interruption behavior. If you send messages back-to-back while the agent is still processing the previous request, the session manager decides whether to:

▫ interrupt the current task (e.g., using ‎⁠/interrupt⁠),

▫ or queue it up and process it once the previous round finishes,

▫ or use a command like ‎⁠/steer⁠ to "steer" the direction of whatever's currently being thought through.

This layer is what lets Hermes function like a "private agent that lives in the cloud and can be reached anytime through chat apps."

Memory system: Markdown + SQLite + external memory

After covering the loop and the gateway, the author devotes a section specifically to memory, split into three layers:

1. Markdown file memory

▫ ‎⁠soul.md⁠: personality and system prompt (not necessarily "learned" content, but part of the long-term configuration).

▫ ‎⁠user.md⁠: an automatically updated user description.

▫ ‎⁠memory.md⁠: arbitrary learned facts, workflows, tool-usage methods, and so on.\
These files get appended in every time context is built.

2. SQLite database: the full conversation record

▫ Every interaction with Hermes has its full message written into SQLite, spanning multiple table/row structures.

▫ Some tables keep only plain text, to make similarity search easier.

▫ This is where the gateway pulls conversation history back from, to continue messages and reconstruct history.

3. External memory system (optional)

▫ Supports several third-party providers, such as MemZero, Supermemory, Honcho, and others.

▫ Implementations vary across providers: some do embedding-based similarity search, others require you to send the full conversation every turn and use an LLM to extract what's worth remembering, to be queried later.

▫ Users typically need to configure an API key or service endpoint separately. It's disabled by default.

▫ Once enabled, Hermes's strategy is:

⁃ It doesn't query external memory on the first turn of a conversation.

⁃ From the second turn onward, once the agent roughly knows what you're talking about, it "proactively" queries external memory for relevant past information — much like a person recalling past experience while chatting.

▫ If it doesn't recall a particular memory the first time, asking again the next turn gives it a better chance of pulling it back from external memory.

The author also notes that external memory systems vary quite a bit from one another and would be worth a dedicated comparison later, but since this video is primarily about Hermes's architecture, he only touches on it briefly.

Cron jobs: scheduling automated tasks

The final section introduces Hermes's cron-job system, which lets the agent "proactively" do things at specific times, for example:

- Sending an AI news digest to your email every morning.
- Automatically posting an update to a Slack community every day.
- Emailing a weekly work report to your manager every Friday.

There are a few key design points:

- Hermes's cron doesn't use the operating system's cron — it runs its own internal loop, calling a ‎⁠tick⁠ function once a minute.
- Each tick checks whether any scheduled job is due that minute, and if so, executes the corresponding task.
- Although the documentation once said cron jobs are stored in SQLite, the author actually looked at the code and found they're now stored as a JSON file:

▫ The path looks something like ‎⁠~/.hermes/cron/jobs.json⁠, which records the content of every cron job (what to do, and when to do it).

▫ The same directory also has an ‎⁠output/⁠ folder, with one subfolder per job ID, containing the markdown result file for every run.

- How cron notifications get delivered:

▫ It doesn't go through the usual path of "the agent calling the send_message tool itself" — instead, it goes through the gateway's "home" channel; for example, when you configure the Telegram gateway, you specify a home user.

▫ When a task finishes, Hermes sends you a notification directly through this home channel.

Overall, cron is really just a simple mechanism that "scans jobs.json every minute, runs whatever needs running, writes out logs, and notifies through the home channel" — but it's what turns Hermes from a "passive responder" into an agent that can "proactively do things on a schedule."

In summary, this video breaks down, in a high-level yet concrete way, Hermes's core loop, how its context is assembled, the design of its memory system (markdown + SQLite + external memory), its cross-platform gateway architecture, and its built-in cron scheduling mechanism — showing how a practical agent system handles long-term memory, multi-channel conversation, and context limits under a deliberately "simple structure."
