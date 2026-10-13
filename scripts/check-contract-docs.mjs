// Documentation checks only; this never classifies endpoint presence as implementation.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : [file];
    });
}
const contractFiles = [
    ...walk(path.join(root, 'docs/contracts')),
    ...walk(path.join(root, 'specs')).filter((file) => path.basename(path.dirname(file)) === 'contracts'),
].filter((file) => file.endsWith('.md'));
const files = [...contractFiles, ...walk(path.join(root, 'docs/qa')).filter((file) => file.endsWith('.md'))];
const errors = [];
const counts = { Done: 0, 'Not Yet': 0, Cancel: 0 };
let localLinks = 0;
let jsonExamples = 0;
for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file);
    if (contractFiles.includes(file)) {
        const statuses = [...source.matchAll(/^Implement Status: (.+)$/gm)].map((match) => match[1].trim());
        if (statuses.length !== 1 || !(statuses[0] in counts)) {
            errors.push(`${relative}: expected exactly one Done/Not Yet/Cancel status`);
        } else counts[statuses[0]]++;
        if (!/^Status Scope: /m.test(source)) errors.push(`${relative}: missing status scope`);
        if (!/\b[0-9a-f]{40}\b/.test(source)) errors.push(`${relative}: missing reviewed backend commit`);
    }
    for (const match of source.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
        jsonExamples++;
        try { JSON.parse(match[1]); } catch (error) { errors.push(`${relative}: invalid JSON example: ${error.message}`); }
    }
    const withoutCode = source.replace(/```[\s\S]*?```/g, '');
    for (const match of withoutCode.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].replace(/^<|>$/g, '').split('#')[0];
        if (!target || /^(?:https?:|mailto:|app:|\/)/.test(target)) continue;
        localLinks++;
        if (!fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(target)))) {
            errors.push(`${relative}: missing local link target ${target}`);
        }
    }
}
if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else console.log(JSON.stringify({ contractFiles: contractFiles.length, counts, localLinks, jsonExamples, result: 'valid' }));
