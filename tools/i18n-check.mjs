#!/usr/bin/env node
/*
 * i18n-check.mjs — compare the two built pages (index.html, index.zh.html) for
 * structural parity, and report translation coverage + untranslated text.
 * Dependency-free. Dev tool only; never inlined. Exit 1 on a structural
 * mismatch. Run after `node build.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const attrs = (html, name) => {
    const re = new RegExp(`${name}="([^"]*)"`, "g");
    const out = [];
    let m;
    while ((m = re.exec(html))) out.push(m[1]);
    return out;
};
const count = (html, re) => (html.match(re) || []).length;
const eqList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

const en = read("index.html");
const zh = read("index.zh.html");

const problems = [];
for (const name of ["id", "href"])
    if (!eqList(attrs(en, name), attrs(zh, name)))
        problems.push(`${name} list differs (en ${attrs(en, name).length} vs zh ${attrs(zh, name).length})`);
// SVG path data only — anchor to <path ...> so we don't match id="…"/aria-expanded="…"
// (any attribute ending in the letter "d" would match a bare `d="…"` regex).
const svgPaths = (html) => [...html.matchAll(/<path\b[^>]*?\bd="([^"]*)"/g)].map((m) => m[1]);
if (!eqList(svgPaths(en), svgPaths(zh))) problems.push("svg path 'd' list differs");
// Shell counts — match on the class attribute, NOT `<tag class="…"`: Prettier
// splits multi-attribute open tags across lines (the lightbox <div> has 5 attrs,
// so `<div class="lightbox"` is never contiguous and would count 0==0, a false pass).
for (const [label, re] of [
    ["lightbox", /class="lightbox"/g],
    ["article.card", /class="card"/g],
    ["section.catsec", /class="catsec"/g],
])
    if (count(en, re) !== count(zh, re))
        problems.push(`${label} count ${count(en, re)} -> ${count(zh, re)}`);

// A `.md` missing a frontmatter field renders the literal text "undefined"
// (String(undefined)); catch that as a hard failure, not a silent bad output.
for (const bad of [">undefined<", 'aria-label="undefined"'])
    if (zh.includes(bad)) problems.push(`literal "undefined" — a translated .md is missing a frontmatter field (${bad})`);

// Coverage
const zhDir = path.join(ROOT, "src", "i18n", "zh");
const countFiles = (d, re) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => re.test(f)).length : 0);
const noteMd = countFiles(path.join(zhDir, "notes"), /^doc-\d+\.md$/);
const catMd = countFiles(path.join(zhDir, "sections"), /^cat-[A-I]\.md$/);
// Denominators are the English source counts, so coverage never hard-codes a total.
const enNoteMd = countFiles(path.join(ROOT, "src", "notes"), /^doc-\d+\.md$/);
const enCatMd = countFiles(path.join(ROOT, "src", "sections"), /^cat-[A-I]\.md$/);

// Untranslated warnings: long, Han-free visible PROSE on the zh page. The notes
// embed code inline as ordinary paragraphs (there are no ``` fences anywhere), so
// a standalone line like `px.register(project_name=…, auto_instrument=True)` is
// Han-free by design — code, not an untranslated sentence. Tell them apart by word
// count: prose is many space-separated words; a code snippet is dotted/underscored
// identifiers with ~none. A word = one whitespace token that is a single run of
// letters (any wrapping punctuation); `px.register(…)` has none, a sentence has many.
const warns = [];
const visible = zh.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
const proseWords = (s) => s.split(/\s+/).filter((t) => /^[^A-Za-z]*[A-Za-z]+[^A-Za-z]*$/.test(t)).length;
for (const seg of visible.replace(/<[^>]+>/g, "\n").split("\n")) {
    const s = seg.trim();
    if (s.length < 40) continue;
    const han = (s.match(/[一-鿿]/g) || []).length;
    const ascii = (s.match(/[A-Za-z]/g) || []).length;
    if (han === 0 && ascii > 24 && proseWords(s) >= 4) warns.push(s.slice(0, 70));
}

console.log(`coverage: notes ${noteMd}/${enNoteMd} md, categories ${catMd}/${enCatMd} md`);
if (problems.length) for (const p of problems) console.error("FAIL " + p);
else console.log("OK structural parity (id/href/svg + shell counts match)");
console.log(`${warns.length} untranslated-text warning(s)`);
for (const w of warns.slice(0, 40)) console.log("  WARN " + w);
process.exit(problems.length ? 1 : 0);
