            /* Notes: select any sentence inside a talk's full notes, save it as
               a highlighted note, and browse all notes grouped by talk in a
               dedicated "Your Notes" section. Persisted in localStorage; no
               per-talk HTML edits required. */
            (function () {
                var STORE_KEY = "ai-talks-notes";

                /* Touch devices show the OS selection menu on any text
                   selection, which collides with the custom toolbar. On those
                   we disable native selection (see styles.css) and let the
                   reader tap a sentence to select it instead. */
                var isTouch =
                    (window.matchMedia &&
                        window.matchMedia("(pointer: coarse)").matches) ||
                    "ontouchstart" in window ||
                    navigator.maxTouchPoints > 0;

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

                /* wrap a range in <mark> elements (handles multi-node ranges);
                   returns the marks created, in document order */
                function paintRange(range, className, noteId) {
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
                    var made = [];
                    nodes.forEach(function (node) {
                        var s = node === sc ? so : 0;
                        var e = node === ec ? eo : node.nodeValue.length;
                        if (s >= e) return;
                        var r = document.createRange();
                        r.setStart(node, s);
                        r.setEnd(node, e);
                        var mark = document.createElement("mark");
                        mark.className = className;
                        if (noteId) mark.setAttribute("data-note-id", noteId);
                        try {
                            r.surroundContents(mark);
                            made.push(mark);
                        } catch (ex) {}
                    });
                    return made;
                }

                /* highlight the live selection range (handles multi-node) */
                function markSelectionRange(range, noteId) {
                    return paintRange(range, "note-hl", noteId)[0] || null;
                }

                function unwrap(mark) {
                    var parent = mark.parentNode;
                    if (!parent) return;
                    while (mark.firstChild)
                        parent.insertBefore(mark.firstChild, mark);
                    parent.removeChild(mark);
                    parent.normalize();
                }

                /* ----- selection capture ----- */
                /* Snapshot the current selection into a plain object. On touch
                   devices the live selection is cleared the moment you tap the
                   toolbar, so we save from this snapshot instead of re-reading
                   window.getSelection() at tap time. The cloned range keeps its
                   DOM boundaries even after the visible selection collapses, so
                   in-place highlighting still works. */
                var pending = null;
                function buildCapture(range) {
                    if (!range || range.collapsed) return null;
                    var body = closestBody(range.commonAncestorContainer);
                    if (!body) return null;
                    var lb = body.closest(".lightbox");
                    var m = lb && /^doc-(\d+)$/.exec(lb.id);
                    if (!m) return null;
                    var text = range.toString().replace(/\s+/g, " ").trim();
                    if (!text) return null;
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
                    return {
                        talk: m[1],
                        text: text,
                        raw: raw,
                        range: range.cloneRange(),
                    };
                }
                function captureSelection() {
                    var sel = window.getSelection();
                    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
                    return buildCapture(sel.getRangeAt(0));
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
                var saveBtn = toolbar.querySelector(".nt-save");
                function onSave(e) {
                    e.preventDefault();
                    saveSelection();
                }
                /* pointerdown fires before the tap can collapse the selection,
                   which makes it reliable on touch; click is the fallback and a
                   no-op once the note is already saved. */
                if (window.PointerEvent) {
                    saveBtn.addEventListener("pointerdown", onSave);
                } else {
                    saveBtn.addEventListener("mousedown", onSave);
                }
                saveBtn.addEventListener("click", onSave);

                function hideToolbar() {
                    toolbar.classList.remove("show");
                }
                function positionToolbar(rect) {
                    if (!rect || (!rect.width && !rect.height)) {
                        hideToolbar();
                        return false;
                    }
                    toolbar.style.left = rect.left + rect.width / 2 + "px";
                    if (rect.top < 60) {
                        toolbar.classList.add("below");
                        toolbar.style.top = rect.bottom + 8 + "px";
                    } else {
                        toolbar.classList.remove("below");
                        toolbar.style.top = rect.top - 8 + "px";
                    }
                    toolbar.classList.add("show");
                    return true;
                }
                function showToolbarForSelection() {
                    var cap = captureSelection();
                    if (!cap) return hideToolbar();
                    pending = cap;
                    positionToolbar(cap.range.getBoundingClientRect());
                }

                /* ----- tap-to-select-sentence (touch) ----- */
                /* With native selection disabled, the visible highlight is
                   painted by us: the pending selection is wrapped in temporary
                   mark.note-sel elements, promoted to mark.note-hl on save and
                   unwrapped on dismiss. The first tap sets the anchor sentence;
                   further taps in the same talk extend the range from the
                   anchor through the tapped sentence (multi-sentence select). */
                var previewMarks = [];
                var anchorInfo = null; // {body, block, start, end} of first sentence
                var selExtended = false; // has the selection grown past the anchor?
                function clearPreview() {
                    if (!previewMarks.length) return;
                    previewMarks.forEach(function (mk) {
                        if (mk.parentNode) unwrap(mk);
                    });
                    previewMarks = [];
                }
                function dismiss() {
                    clearPreview();
                    hideToolbar();
                    pending = null;
                    anchorInfo = null;
                    selExtended = false;
                }

                var BLOCK_TAGS = {
                    P: 1, LI: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
                    BLOCKQUOTE: 1, TD: 1, TH: 1, DD: 1, DT: 1,
                    FIGCAPTION: 1, SUMMARY: 1,
                };
                function blockOf(node, body) {
                    var el = node.nodeType === 3 ? node.parentNode : node;
                    while (el && el !== body) {
                        if (el.nodeType === 1 && BLOCK_TAGS[el.tagName])
                            return el;
                        el = el.parentNode;
                    }
                    return node.nodeType === 3 && node.parentNode
                        ? node.parentNode
                        : body;
                }
                function caretAt(x, y) {
                    if (document.caretRangeFromPoint)
                        return document.caretRangeFromPoint(x, y);
                    if (document.caretPositionFromPoint) {
                        var pos = document.caretPositionFromPoint(x, y);
                        if (!pos) return null;
                        var r = document.createRange();
                        r.setStart(pos.offsetNode, pos.offset);
                        return r;
                    }
                    return null;
                }
                function isSpace(ch) {
                    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
                }
                function isSentenceEnd(ch) {
                    return ch === "." || ch === "!" || ch === "?";
                }
                /* Concatenate a block's text nodes; parts map global offsets in
                   that string back to (node, localOffset). */
                function blockText(block) {
                    var parts = [];
                    var full = "";
                    var walker = document.createTreeWalker(
                        block,
                        NodeFilter.SHOW_TEXT,
                        null,
                    );
                    var n;
                    while ((n = walker.nextNode())) {
                        parts.push({ node: n, start: full.length });
                        full += n.nodeValue;
                    }
                    return { parts: parts, full: full };
                }
                /* Build a Range covering [s, e) of a block's concatenated text.
                   Offsets are stable across preview paint/unwrap because they
                   index the text content, not individual nodes. */
                function rangeFromGlobals(block, s, e) {
                    var parts = blockText(block).parts;
                    if (!parts.length || s >= e) return null;
                    var startNode, startOff, endNode, endOff;
                    for (var k = 0; k < parts.length; k++) {
                        var p = parts[k];
                        var pEnd = p.start + p.node.nodeValue.length;
                        if (startNode == null && s < pEnd) {
                            startNode = p.node;
                            startOff = s - p.start;
                        }
                        if (e <= pEnd) {
                            endNode = p.node;
                            endOff = e - p.start;
                            break;
                        }
                    }
                    if (!startNode) {
                        startNode = parts[0].node;
                        startOff = 0;
                    }
                    if (!endNode) {
                        var last = parts[parts.length - 1];
                        endNode = last.node;
                        endOff = last.node.nodeValue.length;
                    }
                    var range = document.createRange();
                    range.setStart(startNode, startOff);
                    range.setEnd(endNode, endOff);
                    return range;
                }
                /* Expand a caret into the sentence around it. Returns
                   {range, block, start, end} (start/end are block-global
                   offsets) or null. */
                function sentenceInfoAt(caretNode, caretOffset, body) {
                    var block = blockOf(caretNode, body);
                    var bt = blockText(block);
                    var parts = bt.parts,
                        full = bt.full;
                    if (!parts.length || !full.trim()) return null;
                    var caretGlobal = -1;
                    for (var q = 0; q < parts.length; q++) {
                        if (parts[q].node === caretNode) {
                            caretGlobal = parts[q].start + caretOffset;
                            break;
                        }
                    }
                    if (caretGlobal < 0) caretGlobal = 0;
                    var s = 0;
                    for (var i = caretGlobal; i > 0; i--) {
                        if (isSentenceEnd(full.charAt(i - 1))) {
                            s = i;
                            break;
                        }
                    }
                    var e = full.length;
                    for (var j = caretGlobal; j < full.length; j++) {
                        if (isSentenceEnd(full.charAt(j))) {
                            e = j + 1;
                            break;
                        }
                    }
                    while (s < e && isSpace(full.charAt(s))) s++;
                    while (e > s && isSpace(full.charAt(e - 1))) e--;
                    if (s >= e) return null;
                    var range = rangeFromGlobals(block, s, e);
                    if (!range) return null;
                    return { range: range, block: block, start: s, end: e };
                }
                /* Smallest range spanning two ranges (in document order). */
                function unionRange(a, b) {
                    var r = document.createRange();
                    if (a.compareBoundaryPoints(Range.START_TO_START, b) <= 0)
                        r.setStart(a.startContainer, a.startOffset);
                    else r.setStart(b.startContainer, b.startOffset);
                    if (a.compareBoundaryPoints(Range.END_TO_END, b) >= 0)
                        r.setEnd(a.endContainer, a.endOffset);
                    else r.setEnd(b.endContainer, b.endOffset);
                    return r;
                }
                function onTapSelect(e) {
                    var t = e.target;
                    if (toolbar.contains(t)) return; // save button handles itself
                    if (t.closest && t.closest("a, button")) return dismiss();
                    if (!t.closest || !t.closest(".lb-body")) return dismiss();
                    /* unwrap the current preview first so caret/offset math runs
                       against the clean DOM the anchor offsets were taken in. */
                    clearPreview();
                    var caret = caretAt(e.clientX, e.clientY);
                    if (!caret || caret.startContainer.nodeType !== 3)
                        return dismiss();
                    var node = caret.startContainer;
                    var body = closestBody(node);
                    if (!body) return dismiss();
                    /* don't nest a new selection inside an existing note */
                    if (
                        node.parentNode &&
                        node.parentNode.closest &&
                        node.parentNode.closest("mark.note-hl")
                    )
                        return dismiss();
                    var tapped = sentenceInfoAt(node, caret.startOffset, body);
                    if (!tapped || !tapped.range) return dismiss();

                    var sameAnchor =
                        anchorInfo &&
                        anchorInfo.body === body &&
                        tapped.block === anchorInfo.block &&
                        tapped.start === anchorInfo.start &&
                        tapped.end === anchorInfo.end;

                    var range;
                    if (anchorInfo && anchorInfo.body === body && !sameAnchor) {
                        /* extend: span from the anchor sentence to this one */
                        var aRange = rangeFromGlobals(
                            anchorInfo.block,
                            anchorInfo.start,
                            anchorInfo.end,
                        );
                        if (aRange) {
                            range = unionRange(aRange, tapped.range);
                            selExtended = true;
                        }
                    }
                    if (!range) {
                        if (sameAnchor && selExtended) {
                            /* tapping the anchor again collapses back to it */
                            range = tapped.range;
                            selExtended = false;
                        } else if (sameAnchor) {
                            /* second tap on a lone sentence deselects it */
                            return dismiss();
                        } else {
                            /* start a fresh selection anchored here */
                            anchorInfo = {
                                body: body,
                                block: tapped.block,
                                start: tapped.start,
                                end: tapped.end,
                            };
                            selExtended = false;
                            range = tapped.range;
                        }
                    }

                    var rect = range.getBoundingClientRect();
                    var cap = buildCapture(range);
                    if (!cap) return dismiss();
                    previewMarks = paintRange(range, "note-sel", null);
                    pending = cap;
                    if (!positionToolbar(rect)) dismiss();
                }

                /* union client rect of the current preview marks */
                function previewRect() {
                    var l = Infinity,
                        t = Infinity,
                        r = -Infinity,
                        bt = -Infinity;
                    previewMarks.forEach(function (mk) {
                        var rc = mk.getBoundingClientRect();
                        if (!rc.width && !rc.height) return;
                        if (rc.left < l) l = rc.left;
                        if (rc.top < t) t = rc.top;
                        if (rc.right > r) r = rc.right;
                        if (rc.bottom > bt) bt = rc.bottom;
                    });
                    if (l === Infinity) return null;
                    return { left: l, top: t, right: r, bottom: bt, width: r - l, height: bt - t };
                }
                /* re-anchor the toolbar to the selection after a touch scroll;
                   the selection itself is kept so a passage can span screens. */
                function repositionToolbar() {
                    if (!pending || !previewMarks.length) return;
                    var body = previewMarks[0].closest
                        ? previewMarks[0].closest(".lb-body")
                        : null;
                    var rect = previewRect();
                    if (!rect) return;
                    if (body) {
                        var br = body.getBoundingClientRect();
                        if (rect.bottom < br.top + 4 || rect.top > br.bottom - 4)
                            return; // selection scrolled out of view; stay hidden
                    }
                    positionToolbar(rect);
                }

                var showTimer = null;
                function scheduleShow() {
                    if (showTimer) clearTimeout(showTimer);
                    showTimer = setTimeout(showToolbarForSelection, 120);
                }

                var bodies = Array.prototype.slice.call(
                    document.querySelectorAll(".lb-body"),
                );
                if (isTouch) {
                    document.addEventListener("click", onTapSelect);
                    /* Keep the selection while scrolling (so long passages can
                       span multiple screens); just detach the toolbar and
                       re-anchor it once scrolling settles. */
                    var scrollTimer = null;
                    bodies.forEach(function (b) {
                        b.addEventListener("scroll", function () {
                            if (!pending) return;
                            hideToolbar();
                            if (scrollTimer) clearTimeout(scrollTimer);
                            scrollTimer = setTimeout(repositionToolbar, 140);
                        });
                    });
                } else {
                    document.addEventListener("mouseup", function (e) {
                        if (toolbar.contains(e.target)) return;
                        setTimeout(showToolbarForSelection, 10);
                    });
                    /* touch (non-coarse hybrids): selection handles fire
                       selectionchange / touchend rather than mouseup. */
                    document.addEventListener("touchend", function (e) {
                        if (toolbar.contains(e.target)) return;
                        setTimeout(showToolbarForSelection, 10);
                    });
                    document.addEventListener("selectionchange", function () {
                        var sel = window.getSelection();
                        if (!sel || sel.isCollapsed) hideToolbar();
                        else scheduleShow();
                    });
                    bodies.forEach(function (b) {
                        b.addEventListener("scroll", dismiss);
                    });
                }
                window.addEventListener("hashchange", dismiss);

                function saveSelection() {
                    var cap = pending || captureSelection();
                    if (!cap) return;
                    var meta = talkMeta[cap.talk] || {};
                    var note = {
                        id:
                            "note-" +
                            Date.now() +
                            "-" +
                            Math.floor(Math.random() * 1000),
                        talk: cap.talk,
                        title: meta.title || "Talk #" + cap.talk,
                        sc: meta.sc || "",
                        text: cap.text,
                        raw: cap.raw,
                        ts: Date.now(),
                    };
                    /* Highlight the note. On the tap path the sentence is
                       already wrapped in preview marks, so just promote those
                       in place; otherwise highlight the captured range, falling
                       back to the text-search highlighter used on restore. */
                    var highlighted = false;
                    if (previewMarks.length) {
                        previewMarks.forEach(function (mk) {
                            mk.className = "note-hl";
                            mk.setAttribute("data-note-id", note.id);
                        });
                        previewMarks = [];
                        highlighted = true;
                    }
                    if (!highlighted) {
                        try {
                            var r = cap.range;
                            if (
                                r &&
                                !r.collapsed &&
                                closestBody(r.commonAncestorContainer)
                            ) {
                                highlighted = !!markSelectionRange(r, note.id);
                            }
                        } catch (e) {}
                    }
                    if (!highlighted) {
                        var body = lbBodyOf(cap.talk);
                        if (body) highlightNote(body, note);
                    }
                    notes.push(note);
                    writeNotes();
                    var sel = window.getSelection();
                    if (sel) sel.removeAllRanges();
                    pending = null;
                    anchorInfo = null;
                    selExtended = false;
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
                    '<p class="sec-sub">Open any talk’s “📄 Full notes”, then select a sentence (on a phone, tap a sentence — tap again to extend across more sentences) and choose “★ Save as note”. Your saved notes are grouped by talk below and stored in this browser. Click a note to jump back to it in the original talk.</p>' +
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
                            "No notes yet. Open a talk’s full notes, select a sentence (or tap one on a phone), and choose “★ Save as note” to collect it here.";
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
