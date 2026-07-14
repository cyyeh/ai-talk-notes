---
title: 為 AI Agent 設計記憶系統
speaker: MongoDB
---
這部影片講的是如何為 AI agent 設計一套實用的「記憶系統」，並以 MongoDB 完整示範。

影片一開始說明為什麼 agent 需要記憶：LLM 的 context window（上下文視窗）是有限的，一旦對話拉長、工具呼叫不斷累積、推理軌跡變長，很快就會被塞滿。一旦超出上限或工作階段（session）被關閉，下一次就像是「重新啟動一個全新的 agent」——過去所有的互動都會消失。因此需要一套外部的記憶系統，協助 agent 把重要資訊持久化保存，並在之後依需求取用。

接著她定義了幾種記憶類型，對應這次實作課程要建構的內容：短期記憶（short-term／session memory）就是目前的對話歷史紀錄：使用者訊息、agent 的回應、工具呼叫與結果——全部存放在 MongoDB 的 chats collection 中。這份資料只與目前的 session 有關，以 session_id 作為查詢鍵值，同時也會建立 TTL 索引，讓資料在一段時間後自動刪除，避免無限制地累積。

長期記憶則進一步分為兩類：

1. 語意記憶（Semantic memory）：類似人類「對世界／對他人的理解」。在 coding agent 的例子中，指的是「關於使用者本身的事實」：偏好的程式語言、偏好的框架、工具使用習慣等等。她把這些視為個別的「使用者事實與偏好」，存放在以 user_id 建立索引的 semantic collection 中，同樣可以透過 TTL 或排程機制進行清理／更新。
2. 程序記憶（Procedural memory）：關於「如何做事」的知識，就像人類「知道怎麼騎腳踏車或游泳」。對 coding agent 而言，指的是它過去如何一步步實作某個複雜專案：設計決策、工具選擇、遇到的坑與對應的解法。這些會以個別的「逐步實作指南」形式存放在 procedural collection 中，並搭配向量嵌入（vector embeddings）以支援向量搜尋，讓 agent 未來遇到類似任務時，可以查詢「它之前是怎麼做的」。

影片使用 Voyage AI 的嵌入模型（Voyage v4 系列）產生向量，把程序記憶轉換成嵌入向量存入 MongoDB，接著利用 MongoDB 的向量搜尋索引建立向量索引。在查詢時會：

1. 先將目前的任務描述做嵌入（embed）；
2. 在 procedural collection 上執行一個聚合（aggregation）pipeline：第一個階段是向量搜尋（最近鄰搜尋），接著進行像投影（projection）這樣的後處理；
3. 取出最相關的前幾筆程序記憶，提供給 LLM 作為參考。

她也示範了索引的設計：

- chats 有一個以 session_id 為欄位的單欄位索引，外加一個 TTL 索引（例如 1 年後自動刪除），避免過時的對話長期累積；
- semantic 同樣有一個以 user_id 查詢的索引，外加 TTL 或條件式刪除，因應「人的偏好會改變，所以舊的記憶不該被永久保留」這個事實；
- procedural 則有一個向量搜尋索引，需要指定嵌入欄位的路徑、維度數，以及相似度衡量方式。

她花了相當多篇幅談「記憶生命週期」的設計：不只是「儲存」與「取用」，還包括「該存什麼、何時該存、何時該刪」：

- 並不是每一個對話細節都會被塞進長期記憶；而是由 LLM 先從多次對話中「萃取出具代表性的事實／程序」，才進行儲存。
- 她強調記憶需要被修剪／整合（prune/consolidate），原因包括：偏好會改變、舊資訊可能與新需求衝突，以及成本考量（儲存與查詢的花費）。她明確表示自己堅定站在「修剪／精簡」這一邊，而不是「永不刪除」。

在實作層面，這堂實作課程的流程大致是：

1. 在提供的沙盒環境（Jupyter Notebook + 本機 MongoDB）中啟動環境，選擇正確的 Python 版本。
2. 使用 MongoDB 的 Python 驅動程式（pymongo）連線到已經架設好的本機叢集。
3. 設定透過 proxy 存取的 LLM／Voyage 嵌入 API（金鑰以 pass key 形式提供，效期 3 天）。
4. 建立一個 MongoDB 資料庫與三個 collection：chats（短期）、semantic（語意長期）、procedural（程序長期），並預先種入幾筆範例程序記憶，讓大家可以直接嘗試向量搜尋。
5. 撰寫短期記憶相關函式：

▫ store_chat_message(session_id, role, content)：寫入一份類似 JSON 的文件（包含時間戳記）。

▫ get_chat_history(session_id)：以 find 查詢，依時間戳記排序，並投影（project）出 role 與 content 欄位。

6. 撰寫長期記憶相關的工具函式：

▫ 語意記憶：save_user_memories(user_id, memories) 使用 insert_many 一次寫入多筆文件；get_user_memories(user_id) 使用 find 取出該使用者的所有記憶，保留內容與時間戳記，並格式化成字串。

▫ 程序記憶：

⁃ 首先提供一個「暫存工具（scratchpad tool）」，讓 agent 可以把暫時性的筆記寫入本機檔案；

⁃ 接著是 generate_procedural_memory()：

A. 讀取暫存筆記；

B. 透過 LLM 加上提示詞，把這些粗略的筆記轉換成結構化的逐步實作指南；

C. 將這段描述做嵌入，連同標題、描述、時間戳記與嵌入向量一併存入 procedural collection；

D. 清空暫存區，準備迎接下一項任務。

⁃ get_procedural_memories(query)：

A. 將查詢做嵌入；

B. 在 MongoDB 聚合中使用像 $vectorSearch 這樣的階段，取出最相似的前 K 筆程序記憶，並投影只保留 title 與 description。

她也說明了「工具使用（tool use）」與「程式碼協調器（code orchestrator）」之間的關係：LLM 本身只會輸出「該使用哪個工具」以及「工具的參數」——它並不會真的去「執行工具」。實際呼叫工具（例如查詢資料庫、寫入檔案）必須發生在你自己的 agent 框架／程式碼中。因此他們額外寫了一個 execute_tool(tool_name, args, session) 函式，用來接收 LLM 的工具呼叫指令，再由程式碼實際執行對應的操作。

最後一節是 agent 協調（orchestration）的總結（因時間關係講得比較倉促）：

- 使用一個 session 物件來追蹤 session_id、user_id 與 token 使用量。
- 撰寫一個輔助函式來計算 context window 的使用比例，並在「記憶協定（memory protocol）」中告訴 LLM：如果使用量超過某個門檻（例如 70%），就應該考慮觸發記憶的建立或整合，否則一旦 context 被截斷，資訊就會遺失。
- 在系統提示詞（或「記憶協定」）中明確指定：

▫ 對話開始時該呼叫哪個工具（例如優先呼叫 get_user_facts_and_preferences）；

▫ 遇到技術／程式問題時，該如何優先檢查 procedural 記憶；

▫ 在對話過程中，什麼時候該寫入暫存區，什麼時候該把暫存內容轉換成正式的程序記憶。

- agent 迴圈的骨架大致是：

a. 組合系統提示詞 + session 歷史紀錄 +（如有需要的）長期記憶；

b. 呼叫 LLM；

c. 如果 LLM 直接給出最終答案，就結束這一輪；

d. 如果輸出要求呼叫工具，就解析出工具名稱與參數，交給程式碼中的 execute_tool 執行；

e. 把工具結果回饋給 LLM，繼續迭代。

整體而言，這部影片提供了一個相當具體的框架：用 MongoDB 管理 agent 的短期對話歷史與長期的語意／程序記憶，並運用索引、TTL、向量搜尋，以及以工具形式呈現的記憶 API，實作出一套能夠跨 session 學習、卻不會失控膨脹的記憶系統。
