---
title: 從 Span 到軌跡：長時間運行 Agent 的可觀測性
speaker: HoneyHive
---
這部影片探討為什麼長時間運行的 AI agent 需要一套全新的可觀測性（observability）方法，以及 HoneyHive 是怎麼做的。

講者一開始先指出，現今的 agent 和過去有多麼不同：以前比較像是「工作流程編排（workflow orchestration）」——你要事先把每個步驟、狀態機（state machine）以及每次狀態轉換都寫死，agent 只是依照流程走。到了 2026 年，隨著 Claude Code、Opus 4.7 這類模型變得更強，重心轉移到「harness + sandbox」模式：外層迴圈（harness）把大量工具、skills 與一個 sandbox 交給 LLM，讓它自行決定如何規劃、要呼叫哪些工具，甚至何時該產生子 agent。這樣的 harness 可以運行數小時到數天，單一 session 可能就有數百到數千個步驟。

他以 HoneyHive 監控 Claude Code 的一個實例來說明：某個 session 有 689 個事件，包含大量的 bash 呼叫、檔案讀取、檔案寫入、編輯、agent turn 與 user turn。相較於過去 10 到 20 步的 trace，要在數百甚至數千個步驟中找出單一錯誤點，已經變成「大海撈針」的問題——傳統 APM（應用程式效能監控）的「span／trace」概念，一旦你深入到第 10,000 個 span、而錯誤又埋在第四次工具呼叫裡，就完全不夠用了。

接著他定義了幾個關鍵概念。首先是 harness：本質上是一個包裹在 LLM 外層、長時間運行的迴圈，LLM 可以在其中決定是否要建立 sandbox、呼叫工具、產生子 agent 等等。Anthropic 曾用「大腦 vs. 手」的比喻來形容：大腦是 LLM 加上 harness，手則是 sandbox 與各種工具。2026 年的趨勢是，「手」的部分被非常謹慎地工程化（安全性、存取控制等），而包裹著大腦的「harness」層則刻意維持精簡，只負責包裹整個長時間運行的流程。

他接著介紹了另外兩個常用於建構現代 agent 的元素：hooks 與 skills。Hooks 類似 webhook，但是掛在 harness 內部特定的執行點上——例如 pre-tool、post-tool、權限請求、任務追蹤、產生子 agent、agent 啟動／停止等等。這些 hooks 通常同步執行，可以在 agent 運行期間用來做可觀測性與客戶端評測器（例如快速護欄檢查，guardrails）。Skills 則是「可重複使用的行為單元」：一個 skill 通常包含三個部分——實際執行工具的程式碼、常駐在 agent 記憶中的 front matter（讓模型在語意上知道這個 skill 的存在），以及教 agent 如何使用該 skill 的 markdown 說明文件。你可以建立像是「PR review」或「QA feature」這樣的 skill，讓不同的 AI worker 在不同情境下共享相同的行為。

接著他介紹了「軌跡（trajectory）」的概念：軌跡是 agent 的一連串事件序列，事件可以是 LLM 輸出、工具呼叫、agent 委派、權限請求、關鍵決策點等等。HoneyHive 提供軌跡視覺化功能，能把那 689 個步驟畫成單一時間軸——你會看到它在 user turn、bash、read、edit 之間來回跳動數百次——並且可以疊加各種欄位（例如輸入 token 數、評測器分數），讓你能從宏觀角度理解 agent 的行為，而不是只盯著單一個 span 看。

他也說明企業真正想要的其實是「AI worker」，而不是一個無所不能的通用型 agent。AI worker 的特徵包括：只在明確界定的領域內處理特定任務、有清楚的成功標準以便計算投報率（ROI）、有明確的護欄（guardrails）界定其行為範圍、影響範圍（blast radius，出錯時波及的範圍）有限，並且可以水平擴展。反過來說，企業不想要的是一個「全憑感覺、擁有龐大權限、可以隨意亂搞正式環境資料庫」的 agent。

為了讓這些 AI worker 在實務上真正可靠，他列出六種常見的失敗模式：

1. Context rot（上下文腐化）：某個工具一次消耗大量 token，導致「劣質內容」長時間滯留在上下文中，拖累後續每一次呼叫的品質。
2. Amnesia（失憶）：agent 忘記已經有現成的 skill／工具可以自動完成這件事，於是自己從頭打造一套變通方法。
3. 人因設計問題（ergonomics problems）：工具的設計方式對 agent 不友善——例如輸出雜亂的 JSON、操作方式不直覺，或是沒有可用的 --help，導致 agent 看不懂、不斷亂試，甚至最後自己重新實作一遍該工具的邏輯。
4. YOLO：agent 在未先請人類確認的情況下，就執行不可逆的動作（例如 git push、刪除檔案）。
5. 委派問題（delegation problems）：不恰當地事必躬親，而不去呼叫更適合的子 agent。
6. 隨機性（stochasticity）：軌跡的變異度很高——才走到第 50 步，不同的執行結果就已經分歧成完全不同的路徑。你不會希望 agent 一直很「有創意」，比較理想的是讓它偏向更有效率、更穩定的路線。

面對這些問題，傳統「以評測驅動開發（eval-driven development）」的做法開始力不從心。他認為，能力進步的速度已經超過評測基礎設施能跟上的速度：新模型一出來，行為就會改變、失敗模式也會跟著變，評測就得重寫——而且 agent 的長軌跡變異度極高、非常不確定，要為數百甚至數千個步驟設計靜態評測，幾乎是不可能的任務。除此之外，模擬環境與真實世界之間的落差（sim-to-real gap）很大，光靠模擬很難驗證一個長時間運行的 agent。

他提出了一種替代方案，稱為「以可觀測性驅動開發（observability-driven development）」。核心做法是先為 agent 完整佈設監測（instrument），再根據來自真實流量的軌跡進行觀察、量測、分群與調校。大致步驟是：先妥善地為 harness 佈設監測（輸出 trace、事件與工具呼叫資料），接著在相當嚴格的護欄下把 AI worker 部署到正式環境，讓它實際產生 100 到 1,000 條真實軌跡。這批真實資料能給你強烈的訊號，告訴你哪些評測器有用、哪些護欄需要調整。

這正是分群（clustering）派上用場的地方。他把分群的用途分成兩種：
第一種是「用於探索的非監督式分群（unsupervised clustering for discovery）」：用像 HDBSCAN 這樣的演算法，對大量軌跡或任務的 embedding 做分群，觀察自然浮現出來的群集。HoneyHive 內部把這套方法套用在 Claude Code 的日誌上時，得出的群集會對應到像「審查程式碼變更與 pull request」這類工作類別，幫助你理解 agent 實際上在為你做哪些類型的任務——同時也提示某個特定任務群集，或許值得拆分成專屬的 worker 或 skill，或是需要自己專屬的護欄。
第二種是「用於大規模評測的監督式分類器（supervised classifiers for eval at scale）」：一旦你已經知道有哪些任務類別存在，就可以為每個類別撰寫評分準則式（rubric-style）的評測器，把它變成一個伺服器端指標，用來監控品質並偵測漂移（drift）（例如，切換模型後某個任務類別的分數突然下滑）。

在 HoneyHive 的展示中，他示範了一個政策合規評測器（policy compliance evaluator）：像 Sonnet 4.5 這樣的模型會依據一段政策提示（涵蓋是否遵守規則、是否過度放權等內容），為每一次工具呼叫打 1 到 5 分，並附上說明。舉例來說，一看到像 git push 這種不可逆的動作，它就打了 0 分。這些評測結果會以顏色呈現在軌跡檢視畫面上（例如低分顯示紅色），讓你能在 600 多個事件中快速鎖定問題點，而不必逐步檢查每一個步驟。接著你可以把這些評測器接上告警機制——例如「政策分數 < 5 就觸發告警」——這樣一旦 agent 逾越分寸就能立刻知道，並回頭調整護欄門檻或 agent 的設計。

最後，他提供了幾個實務建議。第一，把工具包裝成 CLI 介面，而不是複雜的 JSON schema：這樣模型只需要輸出一個指令字串，CLI 出錯時可以印出清楚的錯誤訊息，還有 --help 可供 agent 查詢，甚至可以預設輸出 markdown，對 LLM 來說更容易解析。第二，善用以事件為基礎的觸發器與 hooks 來啟動工作流程或委派——例如讓 harness 在收到特定 Slack 訊息或 cron job 觸發時自動啟動一個 agent 任務，或是在特定 hook（pre-tool、post-tool）執行自訂邏輯。第三，讓 skills／工具保持範圍狹窄、聚焦，以降低 context rot，並確保每個 skill／工具都夠可靠——因為可靠的工具與 skill，會帶來更穩定、更可預期的軌跡。

貫穿整場演講的主軸是：在一個「agent 能以相當大的權限運行數千個步驟」的世界裡，真正困難的工程問題已經不再只是模型本身，而是圍繞著它的 harness 與可觀測性。要讓 AI worker 在正式環境中既強大又可控，需要脫離傳統的 spans／traces，轉向一套以「軌跡＋skills＋分群＋護欄」為核心的觀察與設計方法論——而 HoneyHive 正是在為這個方向打造基礎建設。
