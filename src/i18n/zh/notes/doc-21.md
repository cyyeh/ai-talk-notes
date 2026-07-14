---
title: 使用 ClickHouse 打造 Agentic RAG 系統
speaker: ClickHouse
---
這部影片示範如何運用「Agentic Data Stack」，在本機建立一套完整的 agentic RAG 系統，圍繞 ClickHouse、LibreChat、MCP 與 LangFuse 協同運作。

這部影片實際示範了什麼？

講者從零開始，在終端機中複製 `clickhouse/agentic-data-stack` 專案，並說明這個 repo 本質上是把 LibreChat、LangFuse、ClickHouse MCP server 原本各自獨立的 Docker Compose 檔案「打包」在一起，再加上一些啟動順序與環境變數的設定，讓整套系統可以用一道指令啟動。

接著他使用 `scripts/prepare_demo.sh` 幫大家產生 `.env`，裡面填入管理員帳號、密碼、隨機密鑰等內容，然後執行 `docker compose up -d` 把整套系統啟動起來。LibreChat 透過 `localhost:3080` 登入，預設帳密為 `admin@admin.com` / `password`。

LibreChat、MCP、ClickHouse 與 LangFuse 究竟是如何串連在一起的？

進入 LibreChat 之後，他示範了以下操作：

- 在 LibreChat 介面中設定 Anthropic API 金鑰（實務上這把金鑰可以放在伺服器端的環境變數中，不一定要 BYOK）。
- 啟用本機的 ClickHouse MCP server，並以自然語言請 agent「列出資料庫、查詢資料表、執行 SELECT」——背後實際上是透過 MCP 的 list databases / list tables / run select query 等工具存取 ClickHouse。
- 同時，這些對話與工具呼叫都會被記錄進 LangFuse，而 LangFuse 本身的儲存又建立在 ClickHouse 之上——所以你可以直接在 LangFuse 裡看到 agent 的 trace、工具呼叫、prompt、回應等詳細紀錄。

他還示範了一個有趣的細節：請 LibreChat agent 查詢 ClickHouse 自己的 trace 資料時，這段對話本身也會被 LangFuse 記錄下來——於是 agent 最後等於在檢視自己的可觀測性資料。

轉戰 ClickHouse Cloud，以及「agentic RAG」所需的資料

接著他切換到 ClickHouse Cloud（console.clickhouse.cloud），透過 OAuth 登入，並展示公開的 ClickHouse MCP endpoint，這裡的工具更多（總共十三種）：除了查詢資料庫之外，還能查詢組織資訊、計算費用、處理備份、ClickPipes 等等。

為了讓「agentic RAG」有真實資料可用，他在 ClickHouse Cloud 執行一段預先準備好的 SQL，從 S3 匯入約三千萬筆英國房屋資料。這段 SQL 透過短網址 `c.house/ads/s3` 取得，並直接在 SQL console 中執行，讓整個示範建立在真正大規模的資料表之上。

LibreChat 中的 Agent、Skill、Artifact 與 Sub-agent

這部影片的一大主軸，是 LibreChat 新增的幾項概念：agent builder、skill、artifact 與 sub-agent。

在 LibreChat 的「Agent builder」中，他：

- 選用一個 Anthropic 模型（Claude），並啟用網頁搜尋、artifact 與 MCP server。
- 說明 artifact 的作用：它讓模型輸出的 HTML 可以直接被前端渲染成互動式圖表或介面，非常適合資料視覺化。
- 說明工具設定中的「defer loading」與「programmatic only」：

▫ Defer loading 會延遲載入工具說明，避免一次把所有工具規格都塞進 system prompt。

▫ Programmatic only 則限制某些工具（例如 run select query）只能在 code-interpreter 環境中使用，避免一次拉出太多資料列，把 context window 撐爆。

接著他示範了 skill：

- 首先他設定一個 agent（skill builder），讓它用網頁搜尋協助寫出一份描述「ClickHouse UI 設計風格」的 markdown 文件，再把這段文字貼進 skill 定義中，變成一個可重複使用的「ClickHouse design」skill。
- 接著他請另一個 agent 結合這個 skill 與 ClickHouse Cloud MCP，從英國房屋資料表產生一個以 ClickHouse 品牌風格（黃黑配色）呈現的互動式圖表 artifact。

整合起來就會變成：自然語言 → agent 決定要用哪些 MCP 工具查詢 ClickHouse → skill 決定視覺風格 → 輸出 HTML artifact，並直接在 LibreChat 中互動式呈現。

影片中他也特別介紹了全新的 sub-agent 功能：

- 在 agent 的進階設定中可以啟用 sub-agent，讓「主 agent」動態產生多個 sub-agent，各自擁有獨立的 context 與任務。
- 這麼做的好處是：

▫ 每個 sub-agent 都在相對「乾淨」的 context 中檢查或完成任務，比較不會被主對話中既有的推理過程「自我說服」帶偏，藉此降低幻覺（hallucination）。

▫ 多個 sub-agent 可以平行作業，實務上能讓資料查詢類的場景明顯加快速度。

- 介面上，LibreChat 會在一個彈出視窗（modal）中顯示 sub-agent 的 seed prompt 與工具呼叫過程，而主對話則只會收到精簡的最終結果。

管理與控管：LibreChat Admin Panel 與 RBAC

影片後半，他切換到 LibreChat 的管理後台（`localhost:3081`），這個後台本質上是把原本一份龐大的 `librechat.yaml` 設定檔，轉換成一套視覺化的設定介面：

- 可以啟用／停用不同的 LLM 供應商（OpenAI、Anthropic、Google 等），新增自訂 endpoint，並調整模型設定。
- 管理 MCP server：新增伺服器、編輯 endpoint、client ID／secret。
- RBAC：建立角色與群組，將不同能力（使用 agent、分享對話、使用 MCP server 等）指派給不同角色，並支援整合企業級的身分識別提供者，例如 Microsoft Entra。
- 目前還在開發中的稽核紀錄（audit log）：未來會針對每一次管理動作記錄「誰、在何時、對誰、變更了哪項權限」，讓企業稽核更容易進行。

他強調，這讓 LibreChat 更像是一套真正的企業級前端系統，能夠精細控管誰可以使用哪些功能與資源。

LangFuse：追蹤、評測與 LLM-as-a-judge

最後他切換到 LangFuse（`localhost:3000`），展示建立在 ClickHouse 之上的可觀測性與評測功能：

- 在追蹤（tracing）頁面中，可以看到每一筆 `agent_run` 與 `title_run`，每筆 trace 都包含：

▫ 使用的 prompt

▫ 工具呼叫（包含 sub-agent 與 MCP 的工具呼叫）

▫ artifact 標籤等等。

- 當使用者回報「這個答案怪怪的」時，開發者可以依時間戳記或使用者找到對應的 trace，逐步檢視每個工具呼叫的輸入／輸出，藉此判斷問題出在資料本身，還是 prompt／agent 策略上。

接著他示範如何在 LangFuse 中設定「LLM-as-a-judge」評測器：

1. 在 LangFuse 中設定 Anthropic API 金鑰，作為評測用的模型。
2. 建立一個評測器（例如命名為 tool use），並撰寫指示，例如：「當使用者詢問 ClickHouse 資料時，應該透過 MCP 工具呼叫驗證資料的目前狀態」，並透過 `{input}` / `{output}` 變數，把原始輸入與模型輸出餵給評測用的 agent。
3. 為 trace 設定取樣比例（例如 40%），讓評測器執行一輪評估，LangFuse 就會顯示每筆 trace 的分數（true/false）及其判斷理由。
4. 在分析頁面中可以看到整體通過率，也可以搭配第二個分數建立混淆矩陣（confusion matrix）等更進階的分析。

如此一來，無論是調整 system prompt、增減工具，或改動 agent 行為，都能用資料而非「憑感覺」來判斷成效是否真的變好。

影片的重點總結

這部影片的核心訊息是：

- 只要一道 Docker Compose 指令，就能啟動一整套完整的 agentic RAG 技術堆疊：ClickHouse（資料與 LangFuse 後端）、LibreChat（多 agent 介面 + MCP + skill + artifact + sub-agent），以及 LangFuse（可觀測性 + 評測）。
- MCP 讓 agent 能用自然語言操作 ClickHouse（列出資料庫、查詢資料表、執行 SELECT 等），不必自己動手寫 SQL。
- skill 與 artifact 提供了可重複使用的能力與視覺呈現，讓 agent 不只是文字問答，還能自動幫你產出互動式儀表板。
- sub-agent 搭配 LangFuse 的追蹤與評測功能，讓你能在品質、成本與可靠度之間做出有工程依據的取捨，而不只是一個「黑盒子」式的聊天體驗。
- LibreChat 的管理後台、RBAC 與稽核紀錄，讓這一整套系統真正能在企業環境中落地，而不只是停留在開發者的玩具階段。
