---
title: Building the Database for Trillion-Scale AI Search
speaker: Nikhil, turbopuffer
video: https://youtu.be/gGgZiThcGyw?si=ZeaWDUf9tfRvyzIO
---
This video describes how turbopuffer evolved, step by step, from "a very simple, small-scale vector search service" into a database that can power trillion-scale AI search, all while keeping costs low and the system simple.

Main thread of the talk

Nikhil starts by defining the goal: turbopuffer needs to be able to search "every kind of document" at trillion-scale (issues, comments, Slack, photos, code — anything an LLM can understand), and it's built for agents to use, not just human search.

He emphasizes one core principle:\
Build a system that's "correct and simple" first, then "earn" every bit of complexity gradually based on real production metrics, rather than designing an overly complex architecture from the start.

From Postgres cost pain to an object-storage-native design

The story starts with Readwise wanting to build semantic search: it needed 100 million embeddings. Keeping them in Postgres's memory would have taken the bill from $5,000 a month to $30,000 a month, so the feature never shipped at all.

But putting the vectors in S3 instead, a rough calculation shows:\
1 million vectors ≈ $1/month,\
so 100 million vectors would land around the $100 mark — add in query costs, and the total is still within an acceptable range.

So Simon (the founder) locked himself in a cabin in the summer of 2023 and built the first version of turbopuffer:\
vectors live in object storage (S3), with a Rust binary in front doing the search; at first there wasn't even a cache, and only later was an NVMe cache added to bring a single query down from roughly one second to a usable latency. This bare-bones architecture was already enough to support early customers like Cursor, cheap enough to genuinely run in production, and it scaled to 600 million vectors right out of the gate.

2024: scaling the "core" to the 10B level, 1M writes/sec

The theme of 2024 was "scale the core" — not much fancy retrieval yet, just pushing plain dense-vector search to a much larger scale while maintaining four nines of availability.

At this point they ran into two major technical challenges:

1. Incremental updates to the vector index The original approach was: after letting changes accumulate for a while, just throw away the old index and rebuild it from all the old data plus every newly written vector. That barely worked at 600M scale, but completely fell apart at 10B. So they implemented a new incremental-indexing algorithm (similar to SPFresh):

▫ Instead of rebuilding the entire index every time, newly added or deleted vectors are progressively "folded into" the existing vector space, adjusting the centroids.

▫ This brought the time complexity of index building down from "quadratic in total record count" to "linear in the count of new records," which is what made it hold up at the tens-of-billions scale.

2. The LSM tree built on object storage Because S3 has no random writes and only supports whole-block put/get — high latency but good throughput — they built their own "object-storage-native" LSM tree on S3: using very large blocks to merge lots of updates into far fewer writes, tailored to S3's characteristics, rather than using a traditional disk-oriented LSM design (like RocksDB).

Another 2024 pain point was "vector search plus filtering":

- If you find nearest neighbors with the vector index first and then apply the filter, you can end up with zero results matching the filter at all (recall = 0).
- If you use the filter first to pull out a huge batch of candidates and then compute similarity one by one, it's very slow.

So they introduced "native filtering": maintaining an attribute index for every vector cluster, so the system knows whether any document in that cluster matches the filter. At query time, the attribute index first narrows things down to the clusters that might be useful, and nearest-neighbor search then runs only within those clusters — balancing speed and recall.

2025: from "vectors only" to traditional full-text search, and tens-of-billions-scale sharding

By 2025, customers started needing more traditional keyword search (full-text search) and combinations of multiple retrieval techniques, not just dense vectors. The reasons included:\
for some queries you already know the exact keyword, and you don't want something that's "semantically close but actually unrelated" (e.g. Taylor Swift, or an exact function name).

As always, they started with the simplest version, and found that while humans rarely type extremely long keyword queries, agents do all the time — throwing an entire long description at full-text search. This made the naive implementation's latency drop to around 175ms on long queries.

Based on actual query patterns, instead of picking the industry's long-standing WAND algorithm, they chose a max-score dynamic-pruning algorithm better suited to long queries:

- High-weight, rare terms (like "singer-songwriter") are prioritized,
- and once documents containing these terms are already confirmed to score high enough, documents containing only high-frequency words like "of," "the," or "year" can be skipped. This brought long-query latency down to about 20ms — in other words, choosing the algorithm based on real agent behavior rather than by the textbook.

That same year, they also ran into an extremely large customer wanting a "100B vectors in a single index" scenario — far bigger than the entire system's total volume at the time.\
Their solution was still very much in the spirit of "simple thinking":

- Split the 100B into 100 shards of 1B each,
- and hit all 100 shards simultaneously at query time, then merge the results. This obviously required heavily optimizing each 1B shard (including quantizing vectors to cut memory usage, so enough vectors could be scanned within 200ms), but the overall approach was to use S3 as the single source of truth and scale by "having many machines query the same object-storage data in parallel," rather than being limited by local-disk capacity allocation.

2026: an explosion of agents, document counts breaking 4 trillion, and starting to support "search models" and "branching"

Coming to now (2026), they're seeing two trends:

1. Search volume and complexity are both exploding because of agents

▫ Humans used to trigger 1-2 searches per prompt,

▫ whereas today's coding agents (e.g. Claude Code) often do dozens to hundreds of searches within a single prompt, including:

⁃ vector search

⁃ full-text search

⁃ multi-vector / multi-stage re-ranking

⁃ going off to query transactional/analytics databases

⁃ an orchestration agent looping continuously to add more searches

▫ turbopuffer's production scale is now:

⁃ over 4 trillion documents

⁃ 2.5M+ writes/sec, 25k+ queries/sec

⁃ customers spanning coding tools, productivity tools, legal, healthcare, finance, and more.

2. "Search models" have emerged, turning complex pipelines into a learned strategy The old shape of a retrieval pipeline used to be a pile of hand-written if-else logic:

▫ if the query looks like this, route through vector + text + some kind of reranker

▫ if it's a different pattern, route through vector only

▫ and then let the LLM decide whether to run another round of search. Now they're working with a company called SID, using models like Sid-1 that "know how to use search tools," handing off logic such as "when to use keyword search, when to use vector search, how many rounds of search are needed" for the model to learn, instead of hand-writing rules.\
Experiments show:

▫ When Sid-1 is given enough "thinking budget," retrieval quality can exceed that of a general-purpose GPT model.

▫ In normal mode, quality is close to GPT 5.1, but cheaper, because it knows when it can stop searching early. For turbopuffer, this is a bonus they get to enjoy "without changing the backend at all," since they only provide a simple, unified set of search primitives and let this kind of search model do the orchestrating.

Branching: cutting the storage and indexing cost of "many agents, many branches"

Another focus for 2026 is branching.\
The typical coding-agent usage pattern:

- Each person has one clone of a repo, and builds one index for it in turbopuffer.
- But once you get to "one person paired with many agents," with "every agent having its own branch," rebuilding an entire vector index for every single branch becomes extremely wasteful:

▫ Most files are identical across branches, with only the last few percent differing.

So they built a git-like branching mechanism:

- You can "branch off" from a namespace that's already indexed,
- this action only updates metadata and requires no re-indexing, so it's fast and adds almost no storage,
- and afterward, each branch only pays extra cost for the parts that are newly changed.

This is extremely useful for coding agents, and it's also great for RL-related search-in-the-loop training scenarios:

- You can branch off several times from "a known-good state" and let different experiments explore from there, without having to rebuild the entire index over and over.
- One month after launch, branch namespaces had already accumulated 1PB of data, showing just how strong the demand is.

Looking ahead: driving cost down vs. maximizing quality

Looking past 2027, they expect two clearly diverging kinds of workload to emerge:

1. Cost optimization (cost-dim)

▫ For example, everyday issue search or simple coding prompts, which might happen hundreds of thousands of times a day.

▫ Per-query cost must be pushed down aggressively, or agent traffic will blow costs through the roof.

▫ What turbopuffer is already doing here includes:

⁃ automated design of object storage plus caching

⁃ branching to cut down on duplicate indexing

⁃ search models (like Sid-1) that stop early automatically

⁃ and, coming next, int8 vectors, cutting storage cost and memory in half.

2. Performance / quality maximization (perf-max)

▫ For example, in legal, medical, or financial situations where "a single task is worth tens of thousands of dollars in labor,"

▫ customers are willing to spend hundreds or even thousands of dollars on tokens and search, as long as it meaningfully improves accuracy and completeness.

▫ On this front, they continue to track and support:

⁃ sparse vectors (in between dense and keyword)

⁃ stronger search agents

⁃ techniques like late interaction and multi-vector search, which trade "doing more searches" for "getting better results."

The overall strategy is:\
keep the "core storage plus search system" as simple as possible, and extremely low-cost,\
and only "earn" the added complexity — after careful evaluation — for frontier techniques that customers have actually proven to be valuable.

Final conclusion

Nikhil's closing statement:\
Don't let your search infrastructure limit your imagination for the product.\
The reason agentic AI in 2026 has truly "started to become usable" isn't just about the model itself — it's about the search and context system behind it. turbopuffer's approach is to:

- build on a foundation that is simple, correct, and object-storage-native,
- let every newly emerging agent pattern, search model, and new retrieval technique
- gradually layer onto this core exactly the complexity that's truly necessary,
- so as to support both "extremely high-volume, extremely cheap" everyday search and "expensive but critical" high-stakes tasks at the same time.
