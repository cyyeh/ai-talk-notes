#!/usr/bin/env node
/*
 * normalize-note-lists.mjs — make each translated note's ordered-list numbering
 * match its English source's visible numbering.
 *
 * The English notes use `<ol start="N">` to continue a numbered list across
 * intervening paragraphs; translators wrote the `.md` ordered items with
 * inconsistent numbers (some `1.` each, some continuing). This rewrites each
 * `src/i18n/zh/notes/doc-N.md` ordered-list line's leading number to the visible
 * number of the positionally-corresponding item in `src/notes/doc-N.html`, but
 * ONLY when the two have the same count of ordered items (otherwise the note's
 * structure diverged — leave it and report it). Idempotent. Dev tool only.
 *
 *   node tools/normalize-note-lists.mjs           # normalize all translated notes
 *   node tools/normalize-note-lists.mjs --check   # report only, write nothing
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EN_DIR = path.join(ROOT, "src", "notes");
const ZH_DIR = path.join(ROOT, "src", "i18n", "zh", "notes");
const checkOnly = process.argv.includes("--check");

/** Flat sequence of visible ordered-list numbers in the English note body. */
function enOrderedNumbers(html) {
    const m = html.match(/<div class="lb-body md">([\s\S]*?)<\/div>\s*<div class="lb-foot">/);
    const body = m ? m[1] : html;
    const nums = [];
    const olRe = /<ol([^>]*)>([\s\S]*?)<\/ol>/g;
    let mm;
    while ((mm = olRe.exec(body))) {
        const sm = mm[1].match(/start="(\d+)"/);
        let n = sm ? parseInt(sm[1], 10) : 1;
        const liCount = (mm[2].match(/<li[\s>]/g) || []).length;
        for (let k = 0; k < liCount; k++) nums.push(n + k);
    }
    return nums;
}

if (!fs.existsSync(ZH_DIR)) {
    console.log("no translated notes yet:", ZH_DIR);
    process.exit(0);
}

let normalized = 0, unchanged = 0, skipped = 0, noOrdered = 0;
const skips = [];
for (const f of fs.readdirSync(ZH_DIR).sort()) {
    const mMd = f.match(/^doc-(\d+)\.md$/);
    if (!mMd) continue;
    const enPath = path.join(EN_DIR, `doc-${mMd[1]}.html`);
    if (!fs.existsSync(enPath)) continue;
    const enNums = enOrderedNumbers(fs.readFileSync(enPath, "utf8"));

    const md = fs.readFileSync(path.join(ZH_DIR, f), "utf8");
    const lines = md.split("\n");
    const orderedIdx = lines
        .map((l, i) => (/^\s*\d+\.\s/.test(l) ? i : -1))
        .filter((i) => i >= 0);

    if (enNums.length === 0 && orderedIdx.length === 0) { noOrdered++; continue; }
    if (orderedIdx.length !== enNums.length) {
        skipped++;
        skips.push(`${f}: zh ${orderedIdx.length} ordered items vs en ${enNums.length}`);
        continue;
    }
    let changed = false;
    orderedIdx.forEach((li, k) => {
        const newLine = lines[li].replace(/^(\s*)\d+(\.\s)/, `$1${enNums[k]}$2`);
        if (newLine !== lines[li]) changed = true;
        lines[li] = newLine;
    });
    if (changed) {
        if (!checkOnly) fs.writeFileSync(path.join(ZH_DIR, f), lines.join("\n"));
        normalized++;
    } else unchanged++;
}

console.log(
    `${checkOnly ? "[check] " : ""}normalized ${normalized}, already-correct ${unchanged}, ` +
        `no-ordered-list ${noOrdered}, skipped(count-mismatch) ${skipped}`,
);
for (const s of skips) console.log("  SKIP " + s);
