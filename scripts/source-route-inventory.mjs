import fs from 'node:fs';
import path from 'node:path';

export function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        if (['node_modules', 'bin', 'obj', '.git', 'dist'].includes(entry.name)) return [];
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : [file];
    });
}

export function normalize(value) {
    return (
        value
            .replace(/\$\{query[\s\S]*$/, '')
            .split('?')[0]
            .replace(/\$\{[^}]+\}/g, '{}')
            .replace(/\{[^}]+\}/g, '{}')
            .replace(/\/+$/, '') || '/'
    );
}

// Source declarations, not a C# compiler or proof of runtime reachability.
export function readBackendRoutes(backend) {
    const routes = [],
        unresolvedGroups = [];
    for (const file of walk(path.join(backend, 'src')).filter((f) => /Endpoints[\\/].*\.cs$/.test(f))) {
        const source = fs.readFileSync(file, 'utf8');
        const groups = new Map([
            ['app', ['']],
            ['endpoints', ['']],
        ]);
        const definitions = [...source.matchAll(/var\s+(\w+)\s*=\s*(\w+)\s*\.MapGroup\("([^"]+)"\)/g)];
        if (path.basename(file) === 'AnomalyEndpoints.cs') groups.set('api', ['/api/v1/student-affairs', '/api']);
        for (let pass = 0; pass <= definitions.length; pass++)
            for (const m of definitions) {
                if (groups.has(m[2]))
                    groups.set(
                        m[1],
                        groups.get(m[2]).map((prefix) => prefix + m[3]),
                    );
            }
        const name = path.basename(file);
        if (/Report(Crud|Query|Workflow|File)Endpoints.cs/.test(name)) groups.set('group', ['/api/reports']);
        if (name === 'ActivityWriteEndpoints.cs') groups.set('activities', ['/api/activities']);
        if (file.includes('FinanceService') && /^(Proposal|Settlement|Transaction)Endpoints.cs$/.test(name))
            groups.set('group', ['/api/finance']);
        // These helpers are invoked for both public aliases in their owning source file.
        if (['QuestEndpoints.cs', 'BonusMatrixEndpoints.cs'].includes(name)) {
            groups.set(
                'group',
                [...source.matchAll(/MapGroup\(endpoints,\s*"([^"]+)"\)/g)].map((m) => m[1]),
            );
        }
        const add = (method, route, index) =>
            routes.push({
                method: method.toUpperCase(),
                route: normalize(route),
                file: path.relative(backend, file).replaceAll('\\', '/'),
                line: source.slice(0, index).split('\n').length,
            });
        for (const m of source.matchAll(/(\w+)\.Map(Get|Post|Put|Patch|Delete)\(\s*"([^"]+)"/g)) {
            const prefixes = groups.get(m[1]);
            if (prefixes) for (const prefix of prefixes) add(m[2], prefix + m[3], m.index);
            else unresolvedGroups.push(`${path.relative(backend, file)}:${m[1]}:${m[3]}`);
        }
        for (const m of source.matchAll(/(\w+)\.MapMethods\(\s*"([^"]+)",\s*\["([A-Z]+)"\]/g)) {
            const prefixes = groups.get(m[1]);
            if (prefixes) for (const prefix of prefixes) add(m[3], prefix + m[2], m.index);
            else unresolvedGroups.push(`${path.relative(backend, file)}:${m[1]}:${m[2]}`);
        }
        for (const m of source.matchAll(
            /(\w+)\.MapGroup\("([^"]+)"\)[\s\S]{0,180}?\.Map(Get|Post|Put|Patch|Delete)\("([^"]+)"/g,
        )) {
            for (const prefix of groups.get(m[1]) || ['']) add(m[3], prefix + m[2] + m[4], m.index);
        }
    }
    return {
        routes: routes.filter(
            (r, index) =>
                routes.findIndex(
                    (other) => other.file === r.file && other.method === r.method && other.route === r.route,
                ) === index,
        ),
        unresolvedGroups,
    };
}
