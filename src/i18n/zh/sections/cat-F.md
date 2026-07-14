---
heading: 資料基礎設施
desc: 資料庫、OLTP／OLAP、CDC、湖倉一體、向量搜尋、資料血緣：分析與資料 Agent 賴以運行的基礎。
---
## AI 需要新型態的 OLTP：Agent 時代的 Lakebase 與無伺服器 Postgres
@ Databricks（Lakebase／Neon）
Agent 生成的應用程式會產生大量短命、爆發性的資料庫負載，傳統 Postgres 難以招架，因此 Lakebase／Neon 把 Postgres 拆解成無狀態、儲存與運算分離的雲原生架構：資料落地於物件儲存，並以 page-server 快取平滑延遲。這帶來了 scale-to-zero、自動擴展，以及低成本的資料庫「分支」功能，讓每個 PR 或每一輪 Agent 執行都能開出獨立分支來實驗與回滾。

## 湖倉之後：打造 AI 時代的資料基礎設施
@ 座談：Snowflake、Databricks、ClickHouse
三大資料平台的代表一致認為，中央資料平台不會消失——甚至在治理與信任上變得更加重要，並持續在儲存運算分離、資料重力（data gravity）、多層快取與用量計價上深化，以支援 Agent 高併發、低延遲的查詢需求。他們指出「傳統 BI 正在消失」，語意層必須從 BI 工具下沉到資料層（例如 Open Semantic Interchange），而資料平台也正從單純銷售儲存／運算基礎設施，擴張進入應用程式／Agent 的戰場。

## Agent 將需要數兆個資料庫，那就給它們吧！
@ Turso
預測 AI Agent 將把資料庫的數量推向數兆等級，因為每個 Agent／工作階段／vibe-coded 應用程式都需要自己的狀態、記憶與上下文資料庫——而 SQLite 已部署約一兆個實例，證明這是可行的。Turso 用 Rust 完整重寫了 SQLite，保留檔案格式相容性，並加入完整的非同步支援、多寫入者 MVCC、原生 WASM、向量搜尋、實體化視圖與強型別。

## 打造支援兆級規模 AI 搜尋的資料庫
@ Nikhil, turbopuffer
描述 turbopuffer 如何以「物件儲存原生」的極簡核心為基礎，從小規模向量搜尋演進到支援 4 兆份文件、每秒 250 萬次寫入的兆級 AI 搜尋——其複雜度是根據正式環境的真實指標逐步「掙來」的。同時指出 Agent 正讓搜尋量與複雜度爆炸性成長，並展示搜尋模型與類 git 分支機制如何降低成本。

## 資料湖 CDC：我們到了嗎？
@ ClickHouse
探討為何需要「從資料湖以 CDC 增量同步到分析儲存」，並比較 Delta（變更預先計算，較易消費）與 Iceberg（變更內嵌於資料列中，較困難）。指出目前仍缺三塊拼圖——跨資料表的全域排序、持久的變更保留，以及一致的標準消費介面——並主張這些「橫切語意」應在 catalog 層解決，結論是「還沒到，但已過半」。

## OpenLineage 五年歷程：我們如何打造產業標準，以及 Agent 為何需要它
@ Datadog（OpenLineage）
介紹 OpenLineage——一套由 Linux Foundation 主持、供應商中立的規範，以 JSON 描述執行期血緣事件（核心概念為 Job／Run／Dataset 加上 facet），主張執行期觀察遠比事後從原始碼或日誌推論更準確。強調當 AI Agent 大規模讀寫資料時，血緣紀錄正是把 Agent 從黑盒子轉變為可觀測、可稽核、可重現系統的關鍵基礎設施。

## 先斬後奏：在正式環境資料上執行 Agent
@ Jacopo, Bauplan
主張對 Agent 的信任不應來自層層限縮權限，而應來自把系統設計成即使 Agent 犯錯，仍能維持正確且可復原。提出一套類 Git 的湖倉架構（Iceberg + 不可變 commit + branch／merge + 時光回溯），用暫時分支加上合併來實作類似 MVCC 的交易。同時運用形式化驗證找出 API 的反例，強調這套 API 精簡到僅約 6 萬個 token，即使便宜的模型也能學會。

## 從 Postgres 到 ClickHouse 再折返：為 AI 工作負載打造統一 OLTP + OLAP 資料庫
@ Kaushik, ClickHouse（PeerDB）
說明為何「Postgres 處理交易 + ClickHouse 處理分析」已成為常見架構（AI 原生公司很早就撞牆，資料量在 6 個月內成長 1000%），並指出痛點在於維持雙方同步的複雜度。ClickHouse 的因應之道是推出受管 Postgres 服務，專注於大規模一致的平行回填、低開銷的複寫槽（replication slot）、秒級的端對端延遲，以及一個作為 FDW、能自動下推查詢的開源擴充套件。

## 將 CDC 擴展至兆行等級：哪裡壞了、如何重建，以及 AI 接下來的需求
@ Artie
以一位虛構資料工程師的旅程，追溯 CDC 如何從快照與增量批次，演進到 Debezium + Kafka + Snowflake 架構，並最終在規模擴大後徹底崩潰——促成一次全面重寫：自建 WAL 讀取器、把回填與即時 CDC 分離，以及具備交易語意與自動 schema 演進的消費者。主張 AI Agent 將把分析的瓶頸從人力轉移到擷取／轉換，而 CDC 應演進為一個 AI 能即時反應的事件匯流排。

## DuckDB 的超級秘密下一件大事
@ Hannes, DuckDB
介紹 Quack，一款解決「DuckDB 無法好好與自己對話」痛點的全新擴充套件——一端當伺服器，另一端用 ATTACH／remote.query 把遠端 DuckDB 當成一個 schema 來查詢，底層建構在 over-HTTP RPC 之上。效能測試顯示傳輸 6,000 萬行資料約需 5 秒（相較 Postgres 約需 3 分鐘），讓 DuckDB 從單節點內嵌使用邁向分散式部署。

## Datadog 的解構式資料庫
@ Julien 與 Pierre, Datadog
說明如何把彼此孤立的查詢系統重構為以開放標準組裝而成的「解構式資料庫」：分離控制平面／資料平面與儲存／運算，再用 Substrait 統一各種 DSL 的邏輯計畫、用 Calcite 做最佳化、用 DataFusion 執行，中繼資料與格式則收斂到 Iceberg／Arrow／Parquet。並將打造全公司通用的語意層與資料血緣，定位為支援 AI／Agent 的下一個關鍵步驟。

## 現代資料堆疊已經輸掉這場戰爭：別再打造更多 DataFrame API
@ OpenAI
主張在 AI／Agent 時代，不該再繼續打造新的 DataFrame API，而應轉向「函式優先」的資料程式設計工具：把核心邏輯抽取成可重複使用的 Python 函式（UDF），搭配高效的 UDF 引擎。基準測試顯示，在 UDF 情境下，純 Python 加上函式優先引擎的速度可比傳統 dataframe 快上一個數量級，並示範用 Codex 在一天內生成一套過去需要 20 人耗時 2 年才能打造的轉譯層。

## 兆是新的億：為 AI 管理超大規模多模態資料集
@ LanceDB
主張以「統一資料層」管理兆級規模的多模態資料集，取代在標註、訓練與評測之間反覆複製同一份資料的孤島式做法。核心設計元素包括在同一張表中以多模態索引儲存巨大的 blob 與細粒度欄位、不可變性加上版本控管與血緣，以及大型表格上「零成本的 schema／特徵演進」。同時提出一套 L0–L5 的資料成熟度模型。

## 你的資料庫從未為此而生
@ Andy, CockroachDB
主張傳統資料庫並非為 Agent 時代而設計，未來多數資料庫的「使用者」將是 Agent 而非人類。以內部工具 Mica 為例（讓 60% 員工能用自然語言產生報表／儀表板／應用程式），說明需要改善「Agent 體驗」（結構化、可解析、防呆的介面）、把權限治理與安全預設值內建於平台之中，甚至打造一套「Agent 體驗基準測試」來衡量完成率與 token 消耗。
