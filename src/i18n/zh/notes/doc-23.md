---
title: 打造原生資料 Agent：Cortex Code
speaker: Snowflake
---
這部影片介紹 Snowflake 的 Cortex Code，一款「原生資料（data-native）」的 AI coding agent，說明它為何被打造出來、如何運作，以及它在安全性與擴充性上的設計。

為什麼需要 Cortex Code？

講者一開始描述了一個通用型 AI coding agent 常見的問題：雖然它們能夠產生 SQL，卻經常引用根本不存在的資料表或欄位，因為模型只擁有「世界知識」，並不理解你實際 Snowflake 環境中的 schema、權限或部署細節。他把這種現象稱為「context 落差（context gap）」。傳統的解法是讓開發者不斷補充 markdown 說明、除錯、重試——不但緩慢、消耗大量 token，也很難真正帶進正式的生產環境。

Snowflake 的想法是讓 agent 成為資料平台本身的一部分，而不是一個外來訪客。換句話說，agent 必須能夠直接、即時地理解 Snowflake 的 metadata、運算資源與安全規則，才能真正加速資料工程與機器學習（ML）工作流程。

Cortex Code 是什麼？該如何使用？

Cortex Code 的目標，是直接從自然語言產出可用於正式環境的程式碼，涵蓋整個資料技術堆疊，而不只是 Snowflake SQL。它可以連接 Snowflake、本機程式碼、DBT、Airflow，以及其他雲端服務（AWS、Databricks、GCP 等），協助建構 ETL pipeline、儀表板，甚至是應用程式。

它以幾種形式提供：

- 直接內建於 Snowflake 使用介面中（「SnowSight」管理主控台）。
- 一款可以嵌入現有自動化工作流程的 CLI 工具。
- 一款 VS Code／Cursor 擴充套件。
- 一款 Cloud Code（例如 Claude Code）外掛：透過 MCP，讓通用型 coding agent 把任何需要的 Snowflake 操作交給 Cortex Code 處理。

根據 Snowflake 客戶的實際使用回饋，許多過去要花上好幾週、動用多人才能完成的資料工作流程，現在一個下午就能搞定；目前每天有數千位客戶、超過十萬名開發者在使用它。

架構設計與效能優勢

在模型層，Cortex Code 目前主要支援 Anthropic 的模型，以及 GPT 5.2 以上的模型，並採「模型無關（model-agnostic）」的設計：同一套 agent 框架可以替換不同的 LLM。它原本主要建構在 Anthropic 模型之上，但當他們觀察到像 GPT 5.5 這類模型在程式能力上已經追上時，便迅速加入支援。

他分享了一些內部的 benchmark 數據：在相同模型下（例如 Claude Opus 4.6），單靠更好的 system prompt、內建工具與 skill 設計，Cortex Code 的通過率就比「純模型加上通用型 agent」高出約 15%——同時還減少了工具呼叫次數與冗長的來回迴圈，降低開發者需要手動處理的步驟，使用更少 token，執行速度自然也更快。

關鍵技術一：即時基礎資訊校準（grounding）與 metadata 感知

Cortex Code 的核心是一套「資料 agent 框架」（agent harness）。在每一次對話中，它都會實際查詢 Snowflake 真實的 schema、RBAC 角色、warehouse 與運算資源限制，而不是仰賴一份固定不變的靜態描述。

啟動時，它會從你最近使用過的最多 100 個資料庫中拉取 metadata 快取；接著在對話的每一輪中，依需要再次查詢 Snowflake，並把結果當作 prompt 的一部分回饋給 LLM。由於現今模型的 context window 已經能達到百萬 token 等級，再搭配適度的壓縮，即使是很長的對話，也能保留足夠的歷史紀錄與環境狀態。

另一項重要的設計選擇是「agent 永遠以你的身分運作」。也就是說，它會繼承你在 Snowflake 中的角色與權限，任何 DROP、寫入或變更動作，都會被記錄在你自己的稽核紀錄（audit log）中——不存在一個神秘、難以治理、握有龐大權限的「AI 帳號」。這大幅緩解了企業對權限與合規性的疑慮。

關鍵技術二：把 Skill 當成產品功能來打造

Snowflake 把「agent skill」當成一等公民來對待。skill 本質上是結構化的文字檔案（包含 front matter、使用說明等），用來教會 LLM「如何操作」特定的工作流程或產品功能，載入時一開始只會讀取 front matter，藉此減輕 context 的負擔。

在內部，每當 Snowflake 任何一個團隊推出新功能，除了撰寫文件之外，也會同時撰寫對應的 skill 與評測（eval）測試。整體流程大致如下：

1. 團隊會先寫一組 eval，檢查模型在「沒有 skill、只靠世界知識」的情況下能否完成任務。
2. 如果通過率只有 40% 到 60%，他們就會撰寫一份大約 100 行的 skill，補上關鍵的領域 context。
3. 接著重新執行 eval，直到通過率提升到 90% 到 95% 之間，才會視為可用。

隨著未來基礎模型變得更聰明、文件也被更完整地訓練進模型中，有些 skill 未來可能會被淘汰；但就目前而言，這套機制能夠快速補上「世界知識」與「實際產品操作」之間的落差。

skill 也被用來承載企業自身的業務邏輯。客戶可以撰寫專屬於自己組織的 skill，而 Snowflake 未來也會推出 skill 市集／目錄，讓組織內部的分享更加容易。許多公司甚至把整套業務流程（例如內部控制規則或標準報表產出程序）編寫成 skill，讓全公司都以同一套方式運作，並由 agent 自動執行。

關鍵技術三：工具、MCP 與可擴充性

在 agent 執行環境中，除了核心的 SQL 執行功能，Cortex Code 還內建了大量針對特定情境的工具，例如：

- 一款能產生並驗證 Snowflake SQL 的工具（先由 LLM 產生，再依 Snowflake 語法進行檢查）。
- 專門用來與 DBT、Airflow 及各種儀表板工具互動的工具。
- 其他外部系統，例如 Databricks、AWS Glue 等等。

其中大多數都是透過 MCP（Model Context Protocol）串接起來。MCP 提供了一個統一介面，讓 agent 可以「接上」GitHub、Jira、Slack、PDF 產生器等等。舉例來說，講者提到一個內部已經存在的自動化 pipeline：監看 Slack 客訴頻道 → 自動開立 Jira 工單 → 產生 pull request → 指派給開發者——整條鏈都是靠 Cortex Code 加上 MCP 串起來的。

對一般開發者來說，任何支援 Cloud Code skill／MCP 的公開 skill 或服務，原則上也都能直接搭配 Cortex Code 一起使用。

安全策略與治理

在安全性方面，團隊得出的結論是：不要過度依賴「prompt 護欄（guardrails）」，因為模型越聰明，就越有辦法繞過這些規則——反而應該回歸基本功：

- 所有操作都在低權限帳號下執行，完全遵循既有的 Snowflake RBAC；不存在另外一個高權限的 agent 帳號。
- 每一個動作都會被記錄下來、可追溯，供內部控制／安全團隊稽核。
- 具破壞性的操作工具（如 DROP TABLE、刪除檔案）預設都需要使用者再次確認，IT 部門也能停用任何「跳過保護」的模式。
- 預設停用 agent 對任意外部網頁內容的存取權限，以避免諸如「幫我上網找一份文件，然後把裡面的 SQL 拿去跑正式環境」這類高風險行為。要啟用外部存取，必須經過明確同意。

展示與進階能力

影片後半，他透過 CLI 進行實際展示，重點在於實際體驗工作流程被加速的感覺：

1. 在一個空的 Snowflake 帳號中，他請 Cortex Code 產生 2,000 筆合成的電子零售交易資料。
2. agent 依靠世界知識推論出合理的欄位與結構，產生一份 CSV，建立 stage 與資料表，並將資料載入 Snowflake。
3. 根據先前的對話與「本機記憶」（過去的操作紀錄寫入一份本機的 markdown 檔案），它會預測你接下來可能想做什麼——例如建立 DBT model 或 Streamlit 儀表板——並主動詢問是否要幫你完成。

他示範了「agent team」的概念：你可以要求它「同時」為這份資料集建立一個 DBT staging model 與一個 Streamlit 儀表板，Cortex Code 就會啟動兩個 sub-agent，各自平行處理不同任務，最後彙整結果並回報。

同樣在 CLI 中，你可以查看目前可用的 skill 清單（包含官方提供與自己客製的），切換模型，並查看已安裝的外掛（例如 Databricks、Iceberg／Glue 等）。

模型選擇與成本

目前「Auto」模型選項只是單純「選用最頂級的模型」——還不是真正依任務動態路由到不同模型，這是他們收到大量需求、也計畫改進的地方。企業客戶也希望能設定組織層級的預設模型（例如強制使用較便宜的 Sonnet），這同樣列在治理功能的路線圖上。

在定價策略上，Snowflake 把 Cortex Code 定位為「協助客戶在 Snowflake 上更快建構東西的工具」，而不是一個獨立的營收產品。因此對客戶來說，費用主要是 Anthropic 或 OpenAI 模型成本的直接轉嫁，不另外加價，目標是讓成本大致維持在與直接使用這些模型相近的水準。

總結來說，這部影片講的是 Snowflake 如何把一個 coding agent 深度整合進自家的資料平台——透過即時 metadata、skill、工具與 MCP，把「AI 幫我寫 SQL／pipeline」從一個展示型 demo，變成一個真正能在受治理的企業環境中安全運作的產品。
