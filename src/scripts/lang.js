/*
 * lang.js — language toggle behavior. Marks the active option and, on click,
 * records the choice in localStorage and navigates to the other page with the
 * current hash preserved. The head script (see build.mjs) handles first-visit
 * detection/redirect; this only runs on explicit user action.
 */
(function () {
    var LANG_KEY = "ai-talks-lang";
    var PAGE_LANG = window.__PAGE_LANG__ || "en";
    var toggle = document.querySelector(".lang-toggle");
    if (!toggle) return;
    var opts = toggle.querySelectorAll(".lang-opt");
    for (var i = 0; i < opts.length; i++) {
        var opt = opts[i];
        var active =
            (PAGE_LANG === "en" && opt.classList.contains("lang-opt--en")) ||
            (PAGE_LANG === "zh" && opt.classList.contains("lang-opt--zh"));
        if (active) opt.setAttribute("aria-current", "true");
        opt.addEventListener("click", function (e) {
            e.preventDefault();
            var lang = this.classList.contains("lang-opt--zh") ? "zh" : "en";
            try { localStorage.setItem(LANG_KEY, lang); } catch (err) {}
            location.assign(this.getAttribute("href") + location.hash);
        });
    }
})();
