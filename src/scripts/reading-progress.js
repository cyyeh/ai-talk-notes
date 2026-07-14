            /* Reading-progress: per-talk "Finished" buttons + progress bar,
               persisted in localStorage. Injects buttons into every card and
               notes lightbox so no per-talk HTML edits are needed. */
            (function () {
                var STORE_KEY = "ai-talks-read";
                var HIDE_KEY = "ai-talks-hide-read";

                var T = {
                    en: {
                        progress: "Reading progress",
                        talksRead: "Talks read",
                        hideRead: "Hide read",
                        showAll: "Show all",
                        read: "read",
                        finished: "Finished",
                        markFinished: "Mark finished",
                        markAsFinished: "Mark as finished",
                    },
                    zh: {
                        progress: "閱讀進度",
                        talksRead: "已讀演講數",
                        hideRead: "隱藏已讀",
                        showAll: "顯示全部",
                        read: "已讀",
                        finished: "已完成",
                        markFinished: "標記完成",
                        markAsFinished: "標記為完成",
                    },
                }[window.__PAGE_LANG__ === "zh" ? "zh" : "en"];

                function readStore() {
                    var map = {};
                    try {
                        var arr = JSON.parse(
                            localStorage.getItem(STORE_KEY) || "[]",
                        );
                        if (Array.isArray(arr)) {
                            arr.forEach(function (n) {
                                map[String(n)] = true;
                            });
                        }
                    } catch (e) {}
                    return map;
                }
                function writeStore(map) {
                    try {
                        var arr = Object.keys(map)
                            .filter(function (k) {
                                return map[k];
                            })
                            .map(Number)
                            .sort(function (a, b) {
                                return a - b;
                            });
                        localStorage.setItem(STORE_KEY, JSON.stringify(arr));
                    } catch (e) {}
                }

                var state = readStore();
                var talks = {}; // id -> {card, cardBtn, lbBtn}

                var cards = Array.prototype.slice.call(
                    document.querySelectorAll('article.card[id^="t"]'),
                );
                var total = cards.length;

                /* ----- progress bar in the sticky nav ----- */
                var nav = document.querySelector("nav.toc");
                var pg = document.createElement("div");
                pg.className = "progress-wrap";
                pg.innerHTML =
                    '<span class="pg-label">' + T.progress + "</span>" +
                    '<span class="progress-track" role="progressbar" ' +
                    'aria-valuemin="0" aria-valuemax="' +
                    total +
                    '" aria-valuenow="0" aria-label="' + T.talksRead + '">' +
                    '<span class="progress-fill"></span></span>' +
                    '<span class="pg-count"></span>' +
                    '<button type="button" class="pg-toggle" aria-pressed="false">' +
                    T.hideRead + "</button>";
                if (nav) nav.insertBefore(pg, nav.firstChild);
                var fill = pg.querySelector(".progress-fill");
                var track = pg.querySelector(".progress-track");
                var countEl = pg.querySelector(".pg-count");
                var toggleBtn = pg.querySelector(".pg-toggle");

                function updateProgress() {
                    var done = 0;
                    for (var k in state) {
                        if (state[k] && talks[k]) done++;
                    }
                    countEl.textContent = done + " / " + total + " " + T.read;
                    fill.style.width = total
                        ? (done / total) * 100 + "%"
                        : "0%";
                    track.setAttribute("aria-valuenow", String(done));
                }

                function applyState(id) {
                    var t = talks[id];
                    if (!t) return;
                    var read = !!state[id];
                    if (t.card) t.card.classList.toggle("is-read", read);
                    if (t.cardBtn) {
                        t.cardBtn.setAttribute(
                            "aria-pressed",
                            read ? "true" : "false",
                        );
                        t.cardBtn.querySelector(".fin-txt").textContent = read
                            ? T.finished
                            : T.markFinished;
                    }
                    if (t.lbBtn) {
                        t.lbBtn.setAttribute(
                            "aria-pressed",
                            read ? "true" : "false",
                        );
                        t.lbBtn.querySelector(".fin-txt").textContent = read
                            ? T.finished
                            : T.markAsFinished;
                    }
                }

                function toggle(id) {
                    if (state[id]) delete state[id];
                    else state[id] = true;
                    writeStore(state);
                    applyState(id);
                    updateProgress();
                }

                function makeBtn(id, cls, label) {
                    var b = document.createElement("button");
                    b.type = "button";
                    b.className = cls;
                    b.setAttribute("aria-pressed", "false");
                    b.innerHTML =
                        '<span class="fin-ico" aria-hidden="true"></span>' +
                        '<span class="fin-txt">' +
                        label +
                        "</span>";
                    b.addEventListener("click", function () {
                        toggle(id);
                    });
                    return b;
                }

                cards.forEach(function (card) {
                    var m = /^t(\d+)$/.exec(card.id);
                    if (!m) return;
                    var id = m[1];
                    talks[id] = { card: card };

                    var foot = card.querySelector(".card-foot");
                    if (foot) {
                        var cb = makeBtn(id, "finbtn", T.markFinished);
                        foot.appendChild(cb);
                        talks[id].cardBtn = cb;
                    }

                    var lb = document.getElementById("doc-" + id);
                    if (lb) {
                        var actions = lb.querySelector(".lb-actions");
                        if (actions) {
                            var lbb = makeBtn(
                                id,
                                "lb-finbtn",
                                T.markAsFinished,
                            );
                            var closeBtn =
                                actions.querySelector(".lb-close-btn");
                            if (closeBtn)
                                actions.insertBefore(lbb, closeBtn);
                            else actions.appendChild(lbb);
                            talks[id].lbBtn = lbb;
                        }
                    }

                    applyState(id);
                });

                updateProgress();

                /* ----- hide-read filter ----- */
                function applyHide(on) {
                    document.body.classList.toggle("hide-read", on);
                    toggleBtn.setAttribute(
                        "aria-pressed",
                        on ? "true" : "false",
                    );
                    toggleBtn.textContent = on ? T.showAll : T.hideRead;
                }
                var hideOn = false;
                try {
                    hideOn = localStorage.getItem(HIDE_KEY) === "1";
                } catch (e) {}
                applyHide(hideOn);
                toggleBtn.addEventListener("click", function () {
                    hideOn = !hideOn;
                    try {
                        localStorage.setItem(HIDE_KEY, hideOn ? "1" : "0");
                    } catch (e) {}
                    applyHide(hideOn);
                });
            })();
