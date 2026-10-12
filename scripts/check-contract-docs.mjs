import fs from 'node:fs';
import path from 'node:path';

const dirs = ['docs/contracts', 'docs/qa', 'specs/004-club-workspace/contracts'];
const failures = [];
let links = 0, examples = 0;
for (const dir of dirs) {
    for (const name of fs.readdirSync(dir).filter((v) => v.endsWith('.md'))) {
        const file = path.join(dir, name), source = fs.readFileSync(file, 'utf8');
        for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
            const target = match[1].replace(/^<|>$/g, '').split('#')[0];
            if (!target || /^(https?:|mailto:|app:)/.test(target)) continue;
            links++;
            if (!fs.existsSync(path.resolve(path.dirname(file), target))) failures.push(`${file}: missing link ${target}`);
        }
        for (const match of source.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
            examples++;
            try { JSON.parse(match[1]); } catch (issue) { failures.push(`${file}: invalid JSON example: ${issue.message}`); }
        }
    }
}
console.log(`${links} local links, ${examples} JSON examples checked.`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('PASS: all local targets and JSON examples are valid.');
