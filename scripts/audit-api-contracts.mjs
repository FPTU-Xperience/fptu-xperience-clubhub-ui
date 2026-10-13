// Declaration inventory only; not a DTO, authorization or live integration test.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const auditDate = process.argv[3] || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const root = process.cwd();
const backend = path.resolve(process.argv[2] || '../fptu-xperience-clubhub-api');
function walk(dir) {
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
function normalize(value) {
    return (
        value
            .replace(/\$\{query[\s\S]*$/, '')
            .split('?')[0]
            .replace(/\$\{[^}]+\}/g, '{}')
            .replace(/\{[^}]+\}/g, '{}')
            .replace(/\/+$/, '') || '/'
    );
}
const routes = [];
const unresolvedGroups = [];
for (const file of walk(path.join(backend, 'src')).filter(
    (f) => f.endsWith('.cs') && f.includes(`${path.sep}Endpoints${path.sep}`),
)) {
    const source = fs.readFileSync(file, 'utf8');
    const groups = new Map(
        [...source.matchAll(/var\s+(\w+)\s*=\s*(\w+)\s*\.MapGroup\("([^"]+)"\)/g)].map((m) => [m[1], m[3]]),
    );
    // ReportEndpoints explicitly delegates its /api/reports group to these modules.
    if (/Report(Crud|Query|Workflow|File)Endpoints\.cs$/.test(file)) groups.set('group', '/api/reports');
    if (/ActivityWriteEndpoints\.cs$/.test(file)) groups.set('activities', '/api/activities');
    if (
        file.includes(`${path.sep}FinanceService${path.sep}`) &&
        /(Proposal|Settlement|Transaction)Endpoints\.cs$/.test(file)
    )
        groups.set('group', '/api/finance');
    const declarations = [...source.matchAll(/(\w+)\.Map(Get|Post|Put|Patch|Delete)\(\s*"([^"]+)"/g)];
    for (const m of source.matchAll(/(\w+)\.MapMethods\(\s*"([^"]+)",\s*\["([A-Z]+)"\]/g))
        declarations.push({ 1: m[1], 2: m[3], 3: m[2], index: m.index });
    for (const match of declarations) {
        let prefix = groups.get(match[1]);
        if (prefix === undefined && match[3].startsWith('/api/')) prefix = '';
        if (prefix === undefined) {
            unresolvedGroups.push(`${path.relative(backend, file)}:${match[1]}:${match[3]}`);
            continue;
        }
        routes.push({
            method: match[2].toUpperCase(),
            route: normalize(prefix + match[3]),
            file: path.relative(backend, file).replaceAll('\\', '/'),
            line: source.slice(0, match.index).split('\n').length,
        });
    }
}
const facade = fs.readFileSync(path.join(root, 'src/services/api.js'), 'utf8');
const matches = [...facade.matchAll(/^\s{4}async (\w+)\(/gm)];
const wrappers = matches
    .map((match, i) => ({
        name: match[1],
        body: facade.slice(match.index, matches[i + 1]?.index || facade.length),
        line: facade.slice(0, match.index).split('\n').length,
    }))
    .filter((m) => !['request', 'parseResponse', 'getErrorMessage'].includes(m.name));
const results = wrappers.map((wrapper) => {
    if (['getMyClubSelection', 'getMyMembershipApplications'].includes(wrapper.name))
        return {
            ...wrapper,
            status: 'COMPOSED',
            method: 'GET',
            route:
                wrapper.name === 'getMyClubSelection'
                    ? '/api/clubs/me/access + /api/clubs'
                    : '/api/clubs/me/memberships + /api/clubs',
        };
    const literal = wrapper.body.match(
        /(?:this\.(?:request|buildUrl)\(|\$\{this\.baseUrl\})(['"`]?)(\/api\/[^'"`\n]*)/,
    );
    if (!literal) return { ...wrapper, status: 'UNRESOLVED', method: '', route: '' };
    const route = normalize(literal[2]);
    const method = wrapper.body.match(/method:\s*['"]([A-Z]+)['"]/)?.[1] || 'GET';
    const declared = routes.find((r) => r.method === method && r.route === route);
    return { ...wrapper, status: declared ? 'DECLARED' : 'ABSENT', method, route, declared };
});
const counts = Object.fromEntries(
    ['DECLARED', 'COMPOSED', 'ABSENT', 'UNRESOLVED'].map((s) => [s, results.filter((r) => r.status === s).length]),
);
const backendHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: backend, encoding: 'utf8' }).trim();
const report = `# FE facade / BE declaration inventory — ${auditDate}\n\nImplement Status: Done\n\nStatus Scope: Documentation declaration inventory only; not backend feature or live integration completion.\n\nGenerated with \`node scripts/audit-api-contracts.mjs\`. BE local HEAD: \`${backendHead}\`; remote comparison is a separate check recorded in the lifecycle audit; this generator does not fetch or verify remote main. This inventories declarations, not handler reachability, DTO compatibility, authorization or deployed health. Report submodule prefix is explicitly resolved from ReportEndpoints.cs. Unresolved group declarations: ${unresolvedGroups.length}; retained below for manual review.\n\n${results.length} wrappers: ${counts.DECLARED} declared, ${counts.COMPOSED} composed, ${counts.ABSENT} absent, ${counts.UNRESOLVED} unresolved.\n\n| Wrapper | HTTP | Normalized path | Declaration status / source |\n| --- | --- | --- | --- |\n${results.map((r) => `| ${r.name} | ${r.method} | \`${r.route}\` | ${r.status}${r.declared ? ` — ${r.declared.file}:${r.declared.line}` : ''} |`).join('\n')}\n\n## Unresolved declaration groups\n\n${unresolvedGroups.length ? unresolvedGroups.map((v) => `- \`${v}\``).join('\n') : 'None.'}\n`;
fs.writeFileSync(path.join(root, 'docs/contracts/api-declaration-inventory.md'), report);
console.log(
    JSON.stringify(
        {
            wrappers: results.length,
            counts,
            absent: results.filter((r) => r.status === 'ABSENT').map((r) => `${r.method} ${r.route}`),
            unresolved: results.filter((r) => r.status === 'UNRESOLVED').map((r) => r.name),
            unresolvedGroups,
        },
        null,
        2,
    ),
);
