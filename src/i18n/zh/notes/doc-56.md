---
title: 讓 Vibe Coding 更安全：如何用 Playwright 做測試
speaker: Amazon AGI Lab
---
這場演講說明如何運用 Playwright，讓透過「vibe coding」打造出來的功能變得可靠、可維護。

講者一開始自我介紹，曾是微軟 Playwright 的核心開發者之一，目前在 Amazon AGI Lab 從事瀏覽器自動化工作。他描繪了現今的開發模式：大家使用 Cursor、Claude Code 這類編碼 Agent 進行「vibe coding」，快速做出看起來能動的功能，但因為缺乏安全護欄，真實的使用者流程很容易壞掉——尤其是之後反覆迭代之後更是如此。解法仍然是「寫測試」，只是手動寫傳統的端到端測試（過去是 Selenium，現在是 Playwright）實在太慢、太痛苦。

接著他對比兩種做法。一種只讓 Agent 看原始碼，猜測畫面上會出現哪些按鈕／文字，再據此產生 Playwright 測試。這在小型專案上還算可行，但一旦專案有大量的 node_modules、第三方套件、monorepo 結構等複雜度，模型就很容易被程式碼淹沒，猜錯定位器（locator），測試一跑就失敗，需要反覆修正。

另一種做法，則是把瀏覽器與 Playwright MCP／Playwright Test MCP 接進 Agent 的迴圈中。這樣一來，Agent 不只是看原始碼——它能真的打開瀏覽器、啟動本機伺服器、實際點過畫面，並看到 React／Next.js 最終渲染出來的 DOM 與無障礙樹（accessibility tree）。每次點擊之後，Playwright MCP 都會把整棵無障礙樹（有哪些按鈕、標籤、文字）回饋給模型，讓它能根據畫面上真實存在的資訊，決定最穩定的定位器，產生更可靠的測試。

他用一個小型的 Next.js「待辦事項／主控台任務」應用程式做示範：目標是寫一個測試，涵蓋一個需要點兩次才能刪除的兩步驟確認流程——先點「刪除」，再點「確定」。只看原始碼的 Agent，會猜測 UI 結構，第一次很可能猜錯選擇器，需要好幾輪的錯誤修正。而接上 Playwright Test MCP 的 Agent，則會先用 MCP 確認伺服器有在運行，接著打開瀏覽器，操作實際頁面，點擊刪除，觀察清單項目與計數器是否真的有變化，再根據這種「真實、觀察到的畫面行為」寫出測試，最後呼叫 Playwright test 執行並確認測試通過。

演講的中段，他概覽了目前能讓 Agent 操控瀏覽器／測試的各種工具：Playwright CLI、Playwright MCP、具備測試執行能力的 Playwright Test MCP、Vercel 的 Agent Browser、Google 的 Chrome DevTools MCP 等等。重點在於：如果你已經在用 Playwright 做端到端測試，最推薦的做法就是搭配 Playwright Test MCP，讓 Agent 能直接執行測試、管理測試清單。

他也回顧了「MCP vs. Skills（CLI）」的爭論：在 2025 年底之前，MCP 很耗費 token、效率不佳，所以有一段時間大家轉向 CLI skills 來省成本。但後來 Anthropic 改善了 MCP 的執行方式與上下文用量，他自己做的小型基準測試也顯示，現在 MCP 實際消耗的上下文 token 反而比 CLI 更少——所以「必須選擇 skills／CLI 才能省成本」這個前提已經不再成立；實務上，挑選最適合整體工作流程的形式就好。

他最後的實務建議是：測試要保持「精簡犀利」，而不是一大堆難以維護、臃腫的測試套件。對於 vibe coding 出來的應用程式，他建議針對每一個關鍵使用者旅程，寫一個清楚的端到端 spec，讓測試套件維持精簡、綠燈，同時仍然涵蓋真正重要的流程；每次 commit 都要執行，並且永遠把失敗當成需要調查的 bug，而不是可以容忍的偶發不穩定（flakiness）。搭配 Playwright 的截圖、追蹤紀錄與影片產出物，讓人類與 Agent 事後都能好好除錯。整體訊息是：打造功能已經變得非常便宜，但「信心」依然昂貴——所以要善用 Playwright 加上 MCP／Agent，建立一套高訊噪比的端到端測試工作流程，讓快速的 vibe coding 也能安全上線。
