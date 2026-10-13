import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as sass from 'sass';

const entry = fileURLToPath(new URL('./V2App.jsx', import.meta.url));

function productionSources(file = entry, sources = new Map()) {
    if (sources.has(file)) return sources;
    const source = readFileSync(file, 'utf8');
    sources.set(file, source);
    // Follow static imports only: the demo is a separately loaded route.
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
        const base = path.resolve(path.dirname(file), match[1]);
        const dependency = [base, `${base}.jsx`, `${base}.js`].find(existsSync);
        if (dependency) productionSources(dependency, sources);
    }
    return sources;
}

test('production V2 imports component styles without demo classes or stylesheet dependencies', () => {
    const sources = productionSources();
    for (const [file, source] of sources) {
        assert.doesNotMatch(source, /\bdx-/, `${path.basename(file)} still depends on demo classes`);
        assert.doesNotMatch(
            source,
            /demo\.scss|from ['"].*DemoApp/,
            `${path.basename(file)} loads demo styles eagerly`,
        );
    }
    assert.match(sources.get(entry), /lazy\(\(\) => import\('\.\/DemoApp'\)\)/);
    const demo = readFileSync(new URL('./DemoApp.jsx', import.meta.url), 'utf8');
    assert.match(demo, /import '\.\/demo\.scss'/);
});

test('migrated component classes have styles and use defined V2 color tokens', () => {
    const sources = productionSources();
    const css = [...sources.keys()]
        .filter((file) => file.endsWith('.scss'))
        .map((file) => sass.compile(file).css)
        .join('\n');
    for (const [file, source] of sources) {
        if (!file.endsWith('.jsx')) continue;
        const classes = new Set(
            source.match(/v2-(?:discovery|access|onboarding|student-onboarding|club-banner|club-logo)[\w-]*/g),
        );
        for (const name of classes) {
            assert.ok(css.includes(`.${name}`), `${name} in ${path.basename(file)} has no component styles`);
        }
    }
    const variables = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
    const migratedFiles = [
        '../../components/v2/DiscoveryLayout.scss',
        '../../components/v2/ClubArt.scss',
        '../../components/v2/student-onboarding/StudentOnboarding.scss',
        './V2Access.scss',
    ];
    for (const relative of migratedFiles) {
        const styles = readFileSync(new URL(relative, import.meta.url), 'utf8');
        for (const match of styles.matchAll(/var\((--[\w-]+)\)/g)) {
            assert.ok(variables.has(match[1]), `${relative} references undefined ${match[1]}`);
        }
    }
});
