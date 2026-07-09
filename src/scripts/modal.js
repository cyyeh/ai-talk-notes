            (function () {
                function isOpen() {
                    return location.hash.indexOf("#doc-") === 0;
                }
                function sync() {
                    document.body.style.overflow = isOpen() ? "hidden" : "";
                }
                window.addEventListener("hashchange", sync);
                sync();
                document.addEventListener("keydown", function (e) {
                    if (e.key === "Escape" && isOpen()) {
                        location.hash = "#_";
                    }
                });
            })();
