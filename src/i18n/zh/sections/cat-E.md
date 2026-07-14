---
heading: 上下文 / 記憶 / RAG
desc: 上下文工程、記憶系統、混合檢索、Agentic RAG：決定 Agent 能否取得「正確」上下文的關鍵。
---
## 用 ClickHouse 打造 Agentic RAG 系統
@ ClickHouse
示範只用一行 Docker Compose 指令，就能啟動完整的 Agentic RAG 堆疊——ClickHouse + LibreChat + MCP + LangFuse——讓 Agent 透過 MCP 以自然語言查詢 ClickHouse，並輸出互動式圖表產物。展示 skills、子 Agent、RBAC，以及在 LangFuse 中運用 LLM-as-a-judge 對追蹤紀錄進行抽樣評測。

## 繞過多模態稅：混合 RAG、SQL RRF 與 UI 遙測
@ Abed Matini, Ogilvy
示範以本地優先、少框架、大量倚重 SQL 的方式，打造一套可上線的企業 RAG FAQ 聊天機器人：用 Docling 把文件轉為乾淨的 Markdown，分塊採用刻意設計的策略，並以 Postgres 加上 pgvector 做結合向量、BM25 與 RRF 的混合檢索，最後交由小型本地模型回答。強調以純 Python 函式取代 Agent 以降低延遲、在觸及 LLM 前先執行護欄檢查，並用 Langfuse 加上前端 widget 做可觀測性。

## 上下文工程 2.0：統一 MCP、Agentic RAG 與記憶
@ Redis
主張讓 Agent 真正好用的關鍵是「上下文引擎」，而非模型本身，將 RAG 從線性的預先查詢升級為 Agent 能自主導覽的工具（Agentic RAG），同時強調上下文必須低延遲且新鮮，而記憶本質上就是狀態。此架構由新鮮資料的 ETL、用 Pydantic 加上 MCP 自動建構語意層的 Context Retriever、短期與長期記憶擷取，以及語意快取組成，並以一個查詢結構化資料（而非政策 PDF）的 Agent 做示範。

## 前沿的上下文工程
@ Linus Lee, Thrive Capital
打造研究型 Agent「Puck」與行動型 Agent「Hobgoblin」，核心理念是「把複雜度推向資料結構與索引階段，而非查詢當下的提示」。技巧包括結合 BM25、向量與神經網路重新排序器的混合搜尋；在索引階段預先豐富化「權威實體卡」；用 SQL 子 Agent 與平行子 Agent 避免污染主要上下文；以及提供逐字、可驗證引用的自訂工具。

## 影片智慧的上下文工程：超越模型規模，邁向真實影響力
@ TwelveLabs
主張讓影片 AI 真正好用的關鍵不在模型規模，而在於把影片轉變成一條「上下文管線」，提出四大支柱——Write → Select → Compress → Isolate（結構化證據、多模態語意檢索、滾動式摘要，以及依類型／時間隔離）——並主張上下文應被視為可量測、可版本控管的工程產物。

## 為 AI Agent 設計記憶系統
@ MongoDB
完整走過為 Agent 設計記憶系統的過程，區分三種記憶類型：短期記憶（工作階段對話，使用 session_id 加上 TTL）、語意長期記憶（使用者事實與偏好），以及程序性長期記憶（step-by-step 指南，使用 embedding 加上向量搜尋）。重點在於「記憶生命週期」——該儲存什麼、何時儲存、何時修剪——並以一套記憶 API、工具執行與 Agent 迴圈做示範。

## 解析 Hermes 架構：記憶、上下文與閘道
@ Hermes project
拆解常駐型 Agent「Hermes」的架構：每一輪都重建上下文的 Agent 迴圈（soul.md／user.md／memory.md 加上歷史摘要與工具描述）、以字元數估算 token 的上下文壓縮機制、具備工作階段管理的多平台閘道（Telegram／Slack／Email），以及搭配 cron 排程的三層記憶（markdown 加上 SQLite 加上外部記憶）。

## 用 turbopuffer 教 Claude Code 做語意程式碼搜尋
@ turbopuffer
示範運用 turbopuffer（向量加上全文檢索）為 Claude Code 加上語意程式碼搜尋（把 embedding 視為可快取的運算），並以 ContextBench 量化成效。發現語意搜尋能提升精確率、減少不必要的檔案讀取（從約 65% 提升到接近 90%），但它是 grep 的互補，而非取代——真正的難題在於教會 Agent 何時該選用哪種工具。

## RAG 已死，對吧？？
@ Kuba Rogut, Turbopuffer
主張「RAG 沒有死——死的是把 RAG 窄化為『向量搜尋加上塞爆上下文』的定義」。真正的檢索是一整套工具箱——向量、全文檢索（BM25）、grep、篩選條件——由 Agent 反覆呼叫，直到蒐集到足夠的上下文為止。以 Cursor（預先索引 embedding）對比 Claude Code（每次都用 grep 重新掃描），說明索引成本的取捨，並強調應採分階段檢索，先縮小範圍找到「正確的那百萬個 token」。

## 把 10,994 則筆記化為記憶
@ Paul Iusztin 與 Louis-François Bouchard
示範一套「AI Research OS」：把數萬則第二大腦筆記轉變成 AI 可用的研究記憶，刻意採用檔案加上索引（raw/、index.yaml、wiki/）而非向量資料庫或巨大的上下文視窗。查詢遵循分層、節省 token 的策略（先讀索引 → 來源摘要 → 概念 → 原始資料），原始筆記為唯讀，而 wiki 則是隨每個問題被回答而不斷成長的「活記憶」。整體設計哲學偏好本地 markdown／YAML 檔案，以利除錯。

## 當所有上下文都重要：擴充快取增強生成
@ Luis Romero-Sevilla, Orbis
針對「所有文件都相關，且經常大批次更新」的情境，提出擴充快取增強生成（Extended Cache Augmented Generation，ECAG）：不是把所有內容塞進單一巨大上下文，而是同時啟動多個 CAG「桶」（多組 KV 快取），由一個監督模型決定該查詢哪些桶、以及如何綜合出答案。關鍵設計是把文件隨機打散分配到各桶中，而非依主題分組，以免遺漏藏有關鍵線索的領域；由於載入是平行進行，速度比 GraphRAG 更快，品質也優於一般 RAG。
