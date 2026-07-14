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

const escHtml = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Minimal, zero-dep Markdown for the note-body vocabulary: paragraphs,
 *  `-`/`*` and `1.` lists, and `**bold**`. Text is HTML-escaped. */
function renderMarkdown(md) {
    const inline = (s) =>
        escHtml(s)
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\\\./g, "."); // `\.` escapes a literal "N." so it isn't a list
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;
    while (i < lines.length) {
        if (!lines[i].trim()) {
            i++;
        } else if (/^\s*\d+\.\s+/.test(lines[i])) {
            // Preserve the first item's number so a list that continues after an
            // interruption (English `<ol start="N">`) renders from N, not 1.
            const start = parseInt(lines[i].match(/^\s*(\d+)\./)[1], 10);
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(inline(lines[i].replace(/^\s*\d+\.\s+/, "").trim()));
                i++;
            }
            out.push(
                "<ol" + (start > 1 ? ' start="' + start + '"' : "") + ">" +
                    items.map((x) => "<li><p>" + x + "</p></li>").join("") +
                    "</ol>",
            );
        } else if (/^\s*[-*]\s+/.test(lines[i])) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                items.push(inline(lines[i].replace(/^\s*[-*]\s+/, "").trim()));
                i++;
            }
            out.push("<ul>" + items.map((x) => "<li><p>" + x + "</p></li>").join("") + "</ul>");
        } else {
            const para = [];
            while (i < lines.length && lines[i].trim() && !/^\s*(\d+\.|[-*])\s+/.test(lines[i])) {
                para.push(lines[i]);
                i++;
            }
            // A line ending in `\` is a hard break (<br />); otherwise join with
            // a space. (zh sources have no `\`, so they're unaffected.)
            let html = "";
            for (let j = 0; j < para.length; j++) {
                const hard = /\\\s*$/.test(para[j]);
                html += inline(para[j].replace(/\\\s*$/, "").trim());
                if (j < para.length - 1) html += hard ? "<br />" : " ";
            }
            out.push("<p>" + html + "</p>");
        }
    }
    return out.join("\n");
}

/** Split a leading `---`-fenced `key: value` block from the body. */
function parseFrontmatter(text) {
    const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) return { data: {}, body: text };
    const data = {};
    for (const line of m[1].split("\n")) {
        const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (mm) data[mm[1]] = mm[2].trim();
    }
    return { data, body: m[2].replace(/^\n+/, "") };
}

/** Fixed UI strings substituted into translated shells. */
const LABELS = {
    en: {
        srcVideo: "▶ Source video",
        fullNotes: "📄 Full notes",
        close: "Close",
        lbNote: "From the original talk-notes (embedded in this file)",
        talks: "talks",
    },
    zh: {
        srcVideo: "▶ 來源影片",
        fullNotes: "📄 完整筆記",
        close: "關閉",
        lbNote: "摘自原始演講筆記（已內嵌於本檔案）",
        talks: "場演講",
    },
};

/** Read a note's Markdown source for `locale`: the English `src/notes/<id>.md`
 *  supplies the structural `video` and is the fallback; a locale override under
 *  `src/i18n/<locale>/notes/<id>.md` supplies translated title/speaker/body. */
function readNote(locale, id) {
    const en = parseFrontmatter(fs.readFileSync(path.join(SRC, "notes", `${id}.md`), "utf8"));
    if (locale === "en") return en;
    const lp = path.join(SRC, "i18n", locale, "notes", `${id}.md`);
    if (!fs.existsSync(lp)) return en;
    const loc = parseFrontmatter(fs.readFileSync(lp, "utf8"));
    return { data: { ...en.data, ...loc.data }, body: loc.body };
}

/** Assemble a note lightbox by filling the shared shell with a locale's
 *  Markdown (title/speaker/body) + labels; `video` comes from the English note. */
function assembleNote(locale, id) {
    const shell = read("notes/shell.html", "en");
    const { data, body } = readNote(locale, id);
    const L = LABELS[locale] || LABELS.en;
    const vals = {
        ID: id.replace(/^doc-/, ""),
        ARIA_TITLE: escAttr(data.title || ""),
        TITLE: escHtml(data.title || ""),
        SPEAKER: escHtml(data.speaker || ""),
        VIDEO: data.video || "",
        CLOSE: escAttr(L.close),
        CLOSE_BTN: escHtml(L.close),
        SRC_VIDEO: L.srcVideo,
        LB_NOTE: escHtml(L.lbNote),
        BODY: renderMarkdown(body),
    };
    return shell.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vals ? vals[k] : m));
}

/** Build a translated category section from the English shell + a `cat-<key>.md`
 *  source (frontmatter heading/desc + ordered `## card` / `@ speaker` / summary
 *  blocks). English (or missing source) → the English shell verbatim. */
function assembleSection(locale, key) {
    const shell = read(`sections/cat-${key}.html`, "en");
    const mdPath =
        locale === "en"
            ? path.join(SRC, "sections", `cat-${key}.md`)
            : path.join(SRC, "i18n", locale, "sections", `cat-${key}.md`);
    if (!fs.existsSync(mdPath)) return shell;
    const { data, body } = parseFrontmatter(fs.readFileSync(mdPath, "utf8"));
    const L = LABELS[locale];

    const cards = body
        .split(/\n(?=##\s)/)
        .map((blk) => {
            const lines = blk.split("\n");
            const t = (lines.find((l) => /^##\s+/.test(l)) || "").replace(/^##\s+/, "").trim();
            if (!t) return null;
            const sc = (lines.find((l) => /^@\s+/.test(l)) || "").replace(/^@\s+/, "").trim();
            const sm = lines.filter((l) => l.trim() && !/^(##|@)\s+/.test(l)).join(" ").trim();
            return { t, sc, sm };
        })
        .filter(Boolean);

    const gridAt = shell.indexOf('<div class="grid">');
    let header = shell.slice(0, gridAt);
    const grid = shell.slice(gridAt);

    // Same Prettier split-tag tolerance as assembleNote (`</tag\s*>`).
    header = header
        .replace(/(<h2>)[\s\S]*?(\s*<span class="cnt">)/, (m, a, b) => a + "\n                            " + escHtml(data.heading) + b)
        .replace(/(<p class="catdesc">)[\s\S]*?(<\/p\s*>)/, (m, a, b) => a + escHtml(data.desc) + b)
        .replace(/(<span class="cnt">\s*\d+)\s+talks(\s*<\/span\s*>)/, (m, a, b) => a + " " + escHtml(L.talks) + b);

    // Chip is swapped INSIDE each per-card substring, not globally: its own
    // closing </span> is split across lines, so a global lazy scan would run
    // into the NEXT card's <span class="idnum"> close and delete cards.
    let ci = 0;
    const rebuilt = grid.split(/(?=<article )/).map((p) => {
        if (!/^<article /.test(p)) return p;
        const c = cards[ci++];
        if (!c) return p;
        return p
            .replace(/(<span class="chip"[^>]*>)[\s\S]*?(<\/span\s*>)/, (m, a, b) => a + key + " · " + escHtml(data.heading) + b)
            .replace(/(<a\s+class="doc-open"[^>]*>)[\s\S]*?(<\/a\s*>)/, (m, a, b) => a + escHtml(c.t) + b)
            .replace(/(<p class="sc">)[\s\S]*?(<\/p\s*>)/, (m, a, b) => a + escHtml(c.sc) + b)
            .replace(/(<p class="sm">)[\s\S]*?(<\/p\s*>)/, (m, a, b) => a + escHtml(c.sm) + b);
    });

    let out = header + rebuilt.join("");
    out = out
        .split("📄 Full notes").join(L.fullNotes)
        .split("▶ Source video").join(L.srcVideo);
    return out;
}

/** Head detection/redirect script; `locale` is baked in as PAGE_LANG. */
function detectScript(locale) {
    return [
        "        <script>",
        "            (function () {",
        `                var PAGE_LANG = ${JSON.stringify(locale)};`,
        "                window.__PAGE_LANG__ = PAGE_LANG;",
        '                var nav = performance.getEntriesByType &&',
        '                    performance.getEntriesByType("navigation")[0];',
        '                if (nav && nav.type === "back_forward") return;',
        '                var LANG_KEY = "ai-talks-lang";',
        "                var pref = null;",
        "                try { pref = localStorage.getItem(LANG_KEY); } catch (e) {}",
        "                function wantsZh() {",
        "                    var l = navigator.languages ||",
        "                        (navigator.language ? [navigator.language] : []);",
        "                    for (var i = 0; i < l.length; i++)",
        '                        if (/^zh\\b/i.test(l[i] || "")) return true;',
        "                    return false;",
        "                }",
        "                var target = null;",
        '                if (PAGE_LANG === "en") {',
        '                    if (pref === "zh") target = "index.zh.html";',
        '                    else if (!pref && wantsZh()) target = "index.zh.html";',
        '                } else if (pref === "en") {',
        '                    target = "index.html";',
        "                }",
        "                if (target) location.replace(target + location.hash);",
        "            })();",
        "        </script>",
    ].join("\n");
}

function buildPage(locale) {
    const L = LOCALES.find((x) => x.code === locale);
    const meta = readMeta(locale);

    const head = read("head.html", locale)
        .replace("__HTML_LANG__", L.htmlLang)
        .replace("__LANG_DETECT__", detectScript(locale))
        .replace("__TITLE__", meta.title);
    const styles = read("styles.css", locale);

    const langToggle = read("partials/lang-toggle.html", locale);
    const hero = read("partials/hero.html", locale).replace(
        "<!-- lang-toggle -->",
        langToggle,
    );
    const nav = read("partials/nav.html", locale);
    const overview = read("sections/overview.html", locale);
    const themes = read("sections/themes.html", locale);
    const footer = read("partials/footer.html", locale);

    const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((k) =>
        assembleSection(locale, k),
    );

    const order = JSON.parse(read("notes/order.json", locale));
    const notes = order.map((id) => assembleNote(locale, id));

    const scripts = [
        read("scripts/modal.js", locale),
        read("scripts/reading-progress.js", locale),
        read("scripts/notes.js", locale),
        // Last of the behavior scripts: scroll-spy queries the #notes section notes.js injects.
        read("scripts/nav-scrollspy.js", locale),
        read("scripts/lang.js", locale),
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
