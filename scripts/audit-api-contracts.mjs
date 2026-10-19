// Declaration inventory only; not a DTO, authorization or live integration test.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readBackendRoutes, normalize } from './source-route-inventory.mjs';

const auditDate = process.argv[3] || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const root = process.cwd();
const backend = path.resolve(process.argv[2] || '../fptu-xperience-clubhub-api');
const { routes, unresolvedGroups } = readBackendRoutes(backend);
const facade = fs.readFileSync(path.join(root, 'src/services/api.js'), 'utf8');
const matches = [...facade.matchAll(/^\s{4}async (\w+)\(/gm)];
const wrappers = matches
    .map((match, i) => ({
        name: match[1],
        body: facade.slice(match.index, matches[i + 1]?.index || facade.length),
        line: facade.slice(0, match.index).split('\n').length,
    }))
    .filter((m) => !['request', 'parseResponse', 'getErrorMessage', 'readMedia'].includes(m.name));
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
    const literal = wrapper.body.match(/['"`](\/api\/[^'"`\n]*)/);
    if (!literal) return { ...wrapper, status: 'UNRESOLVED', method: '', route: '' };
    const route = normalize(literal[1]);
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
