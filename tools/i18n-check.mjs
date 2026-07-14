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
if (!eqList(attrs(en, "d"), attrs(zh, "d"))) problems.push("svg path 'd' list differs");
for (const [label, re] of [
    ["lightbox", /<div class="lightbox"/g],
    ["article.card", /<article class="card"/g],
    ["section.catsec", /<section class="catsec"/g],
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

// Untranslated warnings: long, Han-free visible text on the zh page.
const warns = [];
const visible = zh.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
for (const seg of visible.replace(/<[^>]+>/g, "\n").split("\n")) {
    const s = seg.trim();
    if (s.length < 40) continue;
    const han = (s.match(/[一-鿿]/g) || []).length;
    const ascii = (s.match(/[A-Za-z]/g) || []).length;
    if (han === 0 && ascii > 24) warns.push(s.slice(0, 70));
}

console.log(`coverage: notes ${noteMd}/99 md, categories ${catMd}/9 md`);
if (problems.length) for (const p of problems) console.error("FAIL " + p);
else console.log("OK structural parity (id/href/svg + shell counts match)");
console.log(`${warns.length} untranslated-text warning(s)`);
for (const w of warns.slice(0, 40)) console.log("  WARN " + w);
process.exit(problems.length ? 1 : 0);
