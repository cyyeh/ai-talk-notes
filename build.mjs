#!/usr/bin/env node
/*
 * build.mjs — assemble the composable sources under `src/` into two
 * self-contained pages: `index.html` (English) and `index.zh.html`
 * (Traditional Chinese). Translated content lives under `src/i18n/<locale>/`
 * and falls back to the English source when a file is missing. CSS and JS are
 * inlined so each page opens directly from disk with no tooling or network.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");

const LOCALES = [
    { code: "en", htmlLang: "en", out: "index.html" },
    { code: "zh", htmlLang: "zh-Hant", out: "index.zh.html" },
];

const DEFAULT_META = { title: "AI Engineering Talks — Classified &amp; Distilled" };

function strip(text) {
    return text.endsWith("\n") ? text.slice(0, -1) : text;
}

/** Read a source file for `locale`, falling back to the English source. */
function read(rel, locale) {
    if (locale !== "en") {
        const localized = path.join(SRC, "i18n", locale, rel);
        if (fs.existsSync(localized)) return strip(fs.readFileSync(localized, "utf8"));
    }
    return strip(fs.readFileSync(path.join(SRC, rel), "utf8"));
}

/** Per-locale build strings (title, …); English is the default. */
function readMeta(locale) {
    if (locale === "en") return DEFAULT_META;
    const p = path.join(SRC, "i18n", locale, "meta.json");
    if (fs.existsSync(p)) return { ...DEFAULT_META, ...JSON.parse(fs.readFileSync(p, "utf8")) };
    return DEFAULT_META;
}

/** Head detection/redirect script (filled in Task 2; empty for now). */
function detectScript(/* locale */) {
    return "";
}

function buildPage(locale) {
    const L = LOCALES.find((x) => x.code === locale);
    const meta = readMeta(locale);

    const head = read("head.html", locale)
        .replace("__HTML_LANG__", L.htmlLang)
        .replace("__LANG_DETECT__", detectScript(locale))
        .replace("__TITLE__", meta.title);
    const styles = read("styles.css", locale);

    const hero = read("partials/hero.html", locale);
    const nav = read("partials/nav.html", locale);
    const overview = read("sections/overview.html", locale);
    const themes = read("sections/themes.html", locale);
    const footer = read("partials/footer.html", locale);

    const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((k) =>
        read(`sections/cat-${k}.html`, locale),
    );

    const order = JSON.parse(read("notes/order.json", locale));
    const notes = order.map((id) => read(`notes/${id}.html`, locale));

    const scripts = [
        read("scripts/modal.js", locale),
        read("scripts/reading-progress.js", locale),
        read("scripts/notes.js", locale),
        // Last of the behavior scripts: scroll-spy queries the #notes section notes.js injects.
        read("scripts/nav-scrollspy.js", locale),
    ];

    const parts = [];
    parts.push(head);
    parts.push("        <style>");
    parts.push(styles);
    parts.push("        </style>");
    parts.push("    </head>");
    parts.push("    <body>");
    parts.push(hero);
    parts.push("");
    parts.push(nav);
    parts.push("");
    parts.push(overview);
    parts.push("");
    parts.push(themes);
    parts.push("");
    parts.push('        <div class="wrap">');
    for (const cat of categories) parts.push(cat);
    parts.push("        </div>");
    parts.push("");
    parts.push(footer);
    parts.push("");
    for (const note of notes) parts.push(note);
    for (const js of scripts) {
        parts.push("        <script>");
        parts.push(js);
        parts.push("        </script>");
    }
    parts.push("    </body>");
    parts.push("</html>");

    const out = parts.join("\n") + "\n";
    fs.writeFileSync(path.join(ROOT, L.out), out);
    console.log(
        `Built ${L.out} — ${out.split("\n").length - 1} lines, ` +
            `${categories.length} categories, ${notes.length} talk notes.`,
    );
}

for (const L of LOCALES) buildPage(L.code);
