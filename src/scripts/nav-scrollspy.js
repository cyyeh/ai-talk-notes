            /* Scroll-spy for the sticky nav: highlights the pill of the
               section currently in view, keeps that pill scrolled into view
               within the horizontally-scrollable navbar, and pins the clicked
               pill active while a click-triggered smooth scroll travels there
               (so the highlight doesn't flicker through the sections it
               passes). It also sets each section's scroll-margin-top from the
               measured nav height so a clicked heading lands just below the
               sticky nav rather than behind it. */
            (function () {
                var nav = document.querySelector("nav.toc .wrap");
                if (!nav) return;

                /* Pair each in-page nav link with the section it targets, in
                   document order. #notes is injected by notes.js, which has
                   already run by the time this script executes. */
                var items = [];
                var links = nav.querySelectorAll('a[href^="#"]');
                for (var i = 0; i < links.length; i++) {
                    var id = links[i].getAttribute("href").slice(1);
                    var sec = id && document.getElementById(id);
                    if (sec) items.push({ link: links[i], section: sec });
                }
                if (!items.length) return;

                /* The sticky header is the whole nav.toc — its reading-progress
                   bar (injected by reading-progress.js) plus the pill row — so
                   its measured height drives both the scroll offset (so a
                   clicked heading lands just below it, never behind it) and the
                   spy's activation line. Measured, not hardcoded, so it stays
                   correct if that height ever changes. */
                var navEl = document.querySelector("nav.toc");
                var LINE = 120; // recomputed from the nav height in applyOffsets

                function applyOffsets() {
                    var navH = navEl ? navEl.getBoundingClientRect().height : 96;
                    var offset = Math.round(navH + 12);
                    LINE = offset + 8;
                    for (var i = 0; i < items.length; i++) {
                        items[i].section.style.scrollMarginTop = offset + "px";
                    }
                }

                var current = null; // currently-active link
                var pinned = null; // link locked active during a click scroll
                var pinTimer = 0;

                function setActive(link) {
                    if (link === current) return;
                    if (current) current.classList.remove("active");
                    if (link) link.classList.add("active");
                    current = link;
                    if (link) keepInView(link);
                }

                /* Scroll the active pill into view within the navbar only —
                   never the page. */
                function keepInView(link) {
                    var left = link.offsetLeft;
                    var right = left + link.offsetWidth;
                    if (left < nav.scrollLeft) {
                        nav.scrollTo({ left: left - 12, behavior: "smooth" });
                    } else if (right > nav.scrollLeft + nav.clientWidth) {
                        nav.scrollTo({
                            left: right - nav.clientWidth + 12,
                            behavior: "smooth",
                        });
                    }
                }

                function activeByScroll() {
                    /* At the very bottom, the last section wins even if its top
                       never scrolls up to the line. */
                    if (
                        window.innerHeight + window.scrollY >=
                        document.documentElement.scrollHeight - 2
                    ) {
                        return items[items.length - 1].link;
                    }
                    /* Otherwise: the last section whose top has passed the
                       line; falls back to the first section near the top. */
                    var found = items[0].link;
                    for (var i = 0; i < items.length; i++) {
                        var top = items[i].section.getBoundingClientRect().top;
                        if (top <= LINE) {
                            found = items[i].link;
                        } else {
                            break;
                        }
                    }
                    return found;
                }

                function update() {
                    setActive(pinned || activeByScroll());
                }

                var ticking = false;
                function onScroll() {
                    if (ticking) return;
                    ticking = true;
                    requestAnimationFrame(function () {
                        update();
                        ticking = false;
                    });
                }

                /* Clicking a pill: light it immediately and keep it lit while
                   the smooth scroll travels there, then hand back to the spy. */
                items.forEach(function (it) {
                    it.link.addEventListener("click", function () {
                        pinned = it.link;
                        setActive(it.link);
                        clearTimeout(pinTimer);
                        pinTimer = setTimeout(function () {
                            pinned = null;
                            update();
                        }, 700);
                    });
                });

                function onResize() {
                    applyOffsets();
                    update();
                }

                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener("resize", onResize);
                applyOffsets();
                update();
            })();
