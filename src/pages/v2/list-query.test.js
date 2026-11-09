import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Exercise URL navigation independently of React DOM, including batched filter updates.
test('list query preserves filters and position on reload/back and resets page on filter changes', async () => {
    const source = (await readFile(new URL('./use-list-query.js', import.meta.url), 'utf8'))
        .replace("import { useRef } from 'react';", 'const useRef = globalThis.__listQueryHarness.useRef;')
        .replace("import { useSearchParams } from 'react-router-dom';", 'const useSearchParams = globalThis.__listQueryHarness.useSearchParams;');
    let url = new URLSearchParams('page=3&query=robot&status=LIVE&semester=fall');
    let ref;
    globalThis.__listQueryHarness = {
        useRef: (value) => ref ||= { current: value },
        useSearchParams: () => [url, (next) => { url = next; }],
    };
    try {
        const { useListQuery } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
        const defaults = { page: 1, query: '', status: 'ALL' };
        let [state, set] = useListQuery(defaults);
        assert.deepEqual(state, { page: 3, query: 'robot', status: 'LIVE' });
        set('query', 'music'); set('status', 'ALL');
        assert.equal(url.get('query'), 'music'); assert.equal(url.get('page'), '1');
        assert.equal(url.get('semester'), 'fall');
        [state, set] = useListQuery(defaults); set('page', 2);
        assert.equal(useListQuery(defaults)[0].page, 2);
        url = new URLSearchParams('page=3&query=robot&status=LIVE');
        assert.deepEqual(useListQuery(defaults)[0], { page: 3, query: 'robot', status: 'LIVE' });
        url.set('page', '-4'); assert.equal(useListQuery(defaults)[0].page, 1);
    } finally { delete globalThis.__listQueryHarness; }
});
