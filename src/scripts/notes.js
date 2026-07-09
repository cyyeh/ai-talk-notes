            /* Notes: select any sentence inside a talk's full notes, save it as
               a highlighted note, and browse all notes grouped by talk in a
               dedicated "Your Notes" section. Persisted in localStorage; no
               per-talk HTML edits required. */
            (function () {
                var STORE_KEY = "ai-talks-notes";

                function readNotes() {
                    try {
                        var arr = JSON.parse(
                            localStorage.getItem(STORE_KEY) || "[]",
                        );
                        return Array.isArray(arr) ? arr : [];
                    } catch (e) {
                        return [];
                    }
                }
                function writeNotes() {
                    try {
                        localStorage.setItem(STORE_KEY, JSON.stringify(notes));
                    } catch (e) {}
                }

                var notes = readNotes();

                /* ----- talk metadata, pulled from each lightbox ----- */
                var talkMeta = {}; // id -> {title, sc}
                Array.prototype.slice
                    .call(document.querySelectorAll(".lightbox[id^='doc-']"))
                    .forEach(function (lb) {
                        var m = /^doc-(\d+)$/.exec(lb.id);
                        if (!m) return;
                        var h = lb.querySelector(".lb-head h3");
                        var sc = lb.querySelector(".lb-head .lb-sc");
                        talkMeta[m[1]] = {
                            title: h ? h.textContent.trim() : "Talk #" + m[1],
                            sc: sc ? sc.textContent.trim() : "",
                        };
                    });

                function lbBodyOf(id) {
                    var lb = document.getElementById("doc-" + id);
                    return lb ? lb.querySelector(".lb-body") : null;
                }
                function closestBody(node) {
                    var el = node.nodeType === 3 ? node.parentNode : node;
                    return el && el.closest ? el.closest(".lb-body") : null;
                }

                /* ----- highlighting ----- */
                function highlightNote(body, note) {
                    if (!body) return null;
                    var existing = body.querySelector(
                        'mark.note-hl[data-note-id="' + note.id + '"]',
                    );
                    if (existing) return existing;
                    var needle =
                        note.raw && note.raw.length ? note.raw : note.text;
                    if (!needle) return null;
                    var walker = document.createTreeWalker(
                        body,
                        NodeFilter.SHOW_TEXT,
                        null,
                    );
                    var node;
                    while ((node = walker.nextNode())) {
                        if (
                            node.parentNode &&
                            node.parentNode.closest &&
                            node.parentNode.closest("mark.note-hl")
                        )
                            continue;
                        var idx = node.nodeValue.indexOf(needle);
                        if (idx === -1) continue;
                        var r = document.createRange();
                        r.setStart(node, idx);
                        r.setEnd(node, idx + needle.length);
                        var mark = document.createElement("mark");
                        mark.className = "note-hl";
                        mark.setAttribute("data-note-id", note.id);
                        try {
                            r.surroundContents(mark);
                            return mark;
                        } catch (e) {
                            return null;
                        }
                    }
                    return null;
                }

                /* highlight the live selection range (handles multi-node) */
                function markSelectionRange(range, noteId) {
                    var sc = range.startContainer,
                        so = range.startOffset,
                        ec = range.endContainer,
                        eo = range.endOffset;
                    var nodes = [];
                    var walker = document.createTreeWalker(
                        range.commonAncestorContainer,
                        NodeFilter.SHOW_TEXT,
                        null,
                    );
                    var n;
                    while ((n = walker.nextNode())) {
                        if (range.intersectsNode(n)) nodes.push(n);
                    }
                    if (!nodes.length && sc.nodeType === 3) nodes.push(sc);
                    var first = null;
                    nodes.forEach(function (node) {
                        var s = node === sc ? so : 0;
                        var e = node === ec ? eo : node.nodeValue.length;
                        if (s >= e) return;
                        var r = document.createRange();
                        r.setStart(node, s);
                        r.setEnd(node, e);
                        var mark = document.createElement("mark");
                        mark.className = "note-hl";
                        mark.setAttribute("data-note-id", noteId);
                        try {
                            r.surroundContents(mark);
                            if (!first) first = mark;
                        } catch (ex) {}
                    });
                    return first;
                }

                function unwrap(mark) {
                    var parent = mark.parentNode;
                    if (!parent) return;
                    while (mark.firstChild)
                        parent.insertBefore(mark.firstChild, mark);
                    parent.removeChild(mark);
                    parent.normalize();
                }

                /* ----- selection toolbar ----- */
                var toolbar = document.createElement("div");
                toolbar.className = "note-toolbar";
                toolbar.innerHTML =
                    '<button type="button" class="nt-save">★ Save as note</button>';
                document.body.appendChild(toolbar);
                toolbar.addEventListener("mousedown", function (e) {
                    e.preventDefault();
                });
                toolbar
                    .querySelector(".nt-save")
                    .addEventListener("click", function (e) {
                        e.preventDefault();
                        saveSelection();
                    });

                function hideToolbar() {
                    toolbar.classList.remove("show");
                }
                function showToolbarForSelection() {
                    var sel = window.getSelection();
                    if (!sel || sel.isCollapsed || !sel.rangeCount)
                        return hideToolbar();
                    var range = sel.getRangeAt(0);
                    if (!closestBody(range.commonAncestorContainer))
                        return hideToolbar();
                    if (!sel.toString().trim()) return hideToolbar();
                    var rect = range.getBoundingClientRect();
                    if (!rect || (!rect.width && !rect.height))
                        return hideToolbar();
                    toolbar.style.left = rect.left + rect.width / 2 + "px";
                    if (rect.top < 60) {
                        toolbar.classList.add("below");
                        toolbar.style.top = rect.bottom + 8 + "px";
                    } else {
                        toolbar.classList.remove("below");
                        toolbar.style.top = rect.top - 8 + "px";
                    }
                    toolbar.classList.add("show");
                }

                document.addEventListener("mouseup", function (e) {
                    if (toolbar.contains(e.target)) return;
                    setTimeout(showToolbarForSelection, 10);
                });
                document.addEventListener("selectionchange", function () {
                    var sel = window.getSelection();
                    if (!sel || sel.isCollapsed) hideToolbar();
                });
                window.addEventListener("hashchange", hideToolbar);
                Array.prototype.slice
                    .call(document.querySelectorAll(".lb-body"))
                    .forEach(function (b) {
                        b.addEventListener("scroll", hideToolbar);
                    });

                function saveSelection() {
                    var sel = window.getSelection();
                    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
                    var range = sel.getRangeAt(0);
                    var body = closestBody(range.commonAncestorContainer);
                    if (!body) return;
                    var lb = body.closest(".lightbox");
                    var m = lb && /^doc-(\d+)$/.exec(lb.id);
                    if (!m) return;
                    var talk = m[1];
                    var text = sel.toString().replace(/\s+/g, " ").trim();
                    if (!text) return;
                    var raw = "";
                    if (
                        range.startContainer === range.endContainer &&
                        range.startContainer.nodeType === 3
                    ) {
                        raw = range.startContainer.nodeValue.substring(
                            range.startOffset,
                            range.endOffset,
                        );
                    }
                    var meta = talkMeta[talk] || {};
                    var note = {
                        id:
                            "note-" +
                            Date.now() +
                            "-" +
                            Math.floor(Math.random() * 1000),
                        talk: talk,
                        title: meta.title || "Talk #" + talk,
                        sc: meta.sc || "",
                        text: text,
                        raw: raw,
                        ts: Date.now(),
                    };
                    markSelectionRange(range, note.id);
                    notes.push(note);
                    writeNotes();
                    sel.removeAllRanges();
                    hideToolbar();
                    renderNotes();
                }

                function deleteNote(id) {
                    var idx = -1;
                    for (var i = 0; i < notes.length; i++) {
                        if (notes[i].id === id) {
                            idx = i;
                            break;
                        }
                    }
                    if (idx === -1) return;
                    var n = notes[idx];
                    notes.splice(idx, 1);
                    writeNotes();
                    var body = lbBodyOf(n.talk);
                    if (body) {
                        var mark = body.querySelector(
                            'mark.note-hl[data-note-id="' + id + '"]',
                        );
                        if (mark) unwrap(mark);
                    }
                    renderNotes();
                }

                function openNote(n) {
                    location.hash = "#doc-" + n.talk;
                    setTimeout(function () {
                        var body = lbBodyOf(n.talk);
                        if (!body) return;
                        var mark =
                            body.querySelector(
                                'mark.note-hl[data-note-id="' + n.id + '"]',
                            ) || highlightNote(body, n);
                        if (mark) {
                            mark.scrollIntoView({
                                block: "center",
                                behavior: "smooth",
                            });
                            mark.classList.add("note-flash");
                            setTimeout(function () {
                                mark.classList.remove("note-flash");
                            }, 1500);
                        }
                    }, 90);
                }

                /* ----- Notes section (injected after Key Themes) ----- */
                var themes = document.getElementById("themes");
                var section = document.createElement("section");
                section.className = "block";
                section.id = "notes";
                section.style.background = "#fbfaf4";
                section.innerHTML =
                    '<div class="wrap">' +
                    '<div class="sec-head"><h2>Your Notes</h2></div>' +
                    '<p class="sec-sub">Open any talk’s “📄 Full notes”, select a sentence, and click “★ Save as note”. Your saved notes are grouped by talk below and stored in this browser. Click a note to jump back to it in the original talk.</p>' +
                    '<div class="notes-list"></div>' +
                    "</div>";
                if (themes && themes.parentNode)
                    themes.parentNode.insertBefore(
                        section,
                        themes.nextSibling,
                    );
                var listEl = section.querySelector(".notes-list");
                var badge = document.querySelector(".notes-navlink .nn-badge");

                function renderNotes() {
                    var groups = {};
                    notes.forEach(function (n) {
                        (groups[n.talk] = groups[n.talk] || []).push(n);
                    });
                    var ids = Object.keys(groups).sort(function (a, b) {
                        return Number(a) - Number(b);
                    });
                    listEl.innerHTML = "";
                    if (!notes.length) {
                        var empty = document.createElement("div");
                        empty.className = "notes-empty";
                        empty.textContent =
                            "No notes yet. Open a talk’s full notes, select a sentence, and click “★ Save as note” to collect it here.";
                        listEl.appendChild(empty);
                    } else {
                        ids.forEach(function (tid) {
                            var g = groups[tid];
                            var meta = talkMeta[tid] || {};
                            var group = document.createElement("div");
                            group.className = "note-group";

                            var head = document.createElement("div");
                            head.className = "note-group-head";
                            var titleWrap = document.createElement("div");
                            var link = document.createElement("a");
                            link.href = "#doc-" + tid;
                            var h3 = document.createElement("h3");
                            h3.textContent = meta.title || "Talk #" + tid;
                            link.appendChild(h3);
                            titleWrap.appendChild(link);
                            if (meta.sc) {
                                var scEl = document.createElement("span");
                                scEl.className = "ng-sc";
                                scEl.textContent = meta.sc;
                                titleWrap.appendChild(scEl);
                            }
                            var cnt = document.createElement("span");
                            cnt.className = "ng-count";
                            cnt.textContent =
                                g.length + (g.length === 1 ? " note" : " notes");
                            head.appendChild(titleWrap);
                            head.appendChild(cnt);
                            group.appendChild(head);

                            g.forEach(function (n) {
                                var item = document.createElement("div");
                                item.className = "note-item";
                                var q = document.createElement("button");
                                q.type = "button";
                                q.className = "ni-quote";
                                q.textContent = n.text;
                                q.addEventListener("click", function () {
                                    openNote(n);
                                });
                                var del = document.createElement("button");
                                del.type = "button";
                                del.className = "note-del";
                                del.setAttribute("aria-label", "Delete note");
                                del.textContent = "✕";
                                del.addEventListener("click", function () {
                                    deleteNote(n.id);
                                });
                                item.appendChild(q);
                                item.appendChild(del);
                                group.appendChild(item);
                            });
                            listEl.appendChild(group);
                        });
                    }
                    if (badge)
                        badge.textContent = notes.length
                            ? String(notes.length)
                            : "";
                }

                /* ----- initial render + restore highlights ----- */
                notes.forEach(function (n) {
                    var body = lbBodyOf(n.talk);
                    if (body) highlightNote(body, n);
                });
                renderNotes();
            })();
