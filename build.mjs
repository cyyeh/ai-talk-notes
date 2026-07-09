#!/usr/bin/env node
/*
 * build.mjs — assemble the composable sources under `src/` into a single,
 * self-contained `index.html`.
 *
 * The output is intentionally dependency-free: CSS and JS are inlined so the
 * page can still be opened directly from disk with no build tooling, server,
 * or network. Edit the small files under `src/` and re-run `npm run build`
 * (or `node build.mjs`) to regenerate `index.html`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");

/** Read a source file and strip the single trailing newline added on write. */
function read(rel) {
    const p = path.join(SRC, rel);
    const text = fs.readFileSync(p, "utf8");
    return text.endsWith("\n") ? text.slice(0, -1) : text;
}

const head = read("head.html");
const styles = read("styles.css");

const hero = read("partials/hero.html");
const nav = read("partials/nav.html");
const overview = read("sections/overview.html");
const themes = read("sections/themes.html");
const footer = read("partials/footer.html");

const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((k) =>
    read(`sections/cat-${k}.html`),
);

const order = JSON.parse(read("notes/order.json"));
const notes = order.map((id) => read(`notes/${id}.html`));

const scripts = [
    read("scripts/modal.js"),
    read("scripts/reading-progress.js"),
    read("scripts/notes.js"),
    // Last: the scroll-spy queries the #notes section that notes.js injects.
    read("scripts/nav-scrollspy.js"),
];

const parts = [];
parts.push(head);
parts.push("        <style>");
parts.push(styles);
parts.push("        </style>");
parts.push("    </head>");
parts.push("    <body>");
parts.push(hero);
parts.push(""); // blank line
parts.push(nav);
parts.push(""); // blank line
parts.push(overview);
parts.push(""); // blank line
parts.push(themes);
parts.push(""); // blank line
parts.push('        <div class="wrap">');
for (const cat of categories) parts.push(cat);
parts.push("        </div>");
parts.push(""); // blank line
parts.push(footer);
parts.push(""); // blank line
for (const note of notes) parts.push(note);
for (const js of scripts) {
    parts.push("        <script>");
    parts.push(js);
    parts.push("        </script>");
}
parts.push("    </body>");
parts.push("</html>");

const out = parts.join("\n") + "\n";
fs.writeFileSync(path.join(ROOT, "index.html"), out);
console.log(
    `Built index.html — ${out.split("\n").length - 1} lines, ` +
        `${categories.length} categories, ${notes.length} talk notes.`,
);
