---
title: DuckDB 的超級秘密下一件大事
speaker: Hannes, DuckDB
---
這支影片介紹了 DuckDB 的新功能 Quack，它讓原本只能「內嵌、單機、單一程序」運作的 DuckDB，變成一個能以 client-server 模式運作的資料庫。

Hannes 一開始先回顧 DuckDB 的定位：一個友善、通用的資料整形工具，內嵌在各式各樣的應用程式裡，在本機執行分析，讓你不用每次連上雲端就被帳單嚇到。DuckDB 與 Duck Lake（他們自家的 lakehouse 格式）在過去一年成長非常快——Duck Lake extension 的下載量甚至已經追上 Iceberg、Delta 這類格式。

接著他指出一個根本性的限制：DuckDB 可以連接各種外部系統（Postgres、MySQL、物件儲存、Parquet……），但它「沒辦法好好地跟自己對話」——讓多個 DuckDB 實例寫入同一個資料庫是件很麻煩的事，不論是多個節點即時寫入遙測資料，還是多個本機工具同時操作同一個資料庫。社群因此自行長出了一堆零散的「DuckDB <-> DuckDB」專案，這也顯示了這方面需求有多強烈。

Quack 就是為了解決這個痛點而生。它是一個讓「兩端都是 DuckDB」的 DuckDB extension——一端可以 `serve` 一個本機資料庫，讓它變成伺服器；另一端則用 `ATTACH` 連線，把遠端的 DuckDB 當成一個可查詢的 schema，或是用 `remote.query(...)` 把查詢推送過去執行、只拿回結果。DuckDB 支援的每一種型別、extension 與功能，都可以透過這個通道使用。

在底層，Quack 是一個建立在 HTTP 之上的 RPC 協定：
最底層是 TCP/IP，上面是 HTTP（為了支援瀏覽器，也更容易穿過防火牆、加上 TLS），再上一層是 DuckDB 自己既有的內部序列化格式，無損地傳輸型別、資料區塊等內容，最上層則是一組簡單的請求／回應訊息（執行一段敘述、取得更多結果等等）。

在安全性方面，驗證與授權都是可插拔的：官方預設是以 token 為基礎的機制，但你可以掛上自己的驗證系統（像是 LDAP）、實作權限檢查，或透過 extension 或 SQL function 改寫查詢邏輯。

他也展示了效能實驗。
在 AWS 上用各自獨立的 client／server 虛擬機，比較 Postgres、Arrow Flight SQL 與 Quack：

- 在大量資料傳輸方面，Quack 用大約 5 秒搬移了 6,000 萬列資料，相較之下 Postgres 大約要 3 分鐘，Arrow Flight 大約要 20 秒。
- 在小型交易方面（單列插入、多執行緒），Quack 維持大約每秒 5,000 筆交易；Arrow Flight 在小型插入上表現較弱，Postgres 則介於中間——也就是說 Quack 同時能兼顧大量吞吐與高 TPS 的小型交易。

有了這樣的協定，很多事情都變得可能：
例如用 Quack 把一群分片或副本的 DuckDB 實例包裝在一個協調節點後面，讓客戶端可以透明地使用它們；讓邊緣節點先在本地做聚合，再推送到中央節點；或是直接從瀏覽器裡的 DuckDB WebAssembly，連到跑在 EC2 上的 DuckDB 服務（也就是他現場示範的情境），你可以選擇把整張表拉回本機，或是把查詢推到遠端執行以節省資料傳輸量。

最後，他把這件事放回 OLTP／OLAP 的光譜上來看：
一般的圖像是 Postgres 處理 OLTP、DuckDB 處理 OLAP，中間有一塊模糊的 HTAP。實際上，真正極端的 OLTP 系統是像 TigerBeetle 這樣的東西，而 Postgres 更偏向通用型。透過 Quack，再加上並行事務、checkpoint 等方面的同步進展，DuckDB 正從純分析工具走向「更通用」——在不犧牲分析效能的前提下，獲得一整套分散式部署與交易能力，拓寬了它能處理的使用場景範圍。

整場演講的核心是：Quack 把 DuckDB 從單機、內嵌式的工具，向前推進到一個分散式部署的世界，讓各個實例能透過網路彼此「quack」，同時仍保有 DuckDB 原本的簡潔與效率。
