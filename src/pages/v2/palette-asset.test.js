import test from 'node:test';
import assert from 'node:assert/strict';
import { canSyncPaletteAsset, resolvePaletteAsset } from './profile-page/palette-asset.js';
import { encodeSvgAsset } from './profile-page/svg-palette.js';
test('palette sync accepts saved PNGs and URL SVGs as well as new base64 SVG uploads', () => {
    for (const asset of [
        'data:image/png;base64,aW1hZ2U=',
        encodeSvgAsset('<svg/>'),
        '/assets/profile-covers/fpt-dev-circuit.svg',
        './assets/stamp.svg',
        'https://cdn.example.com/frame.svg?version=2',
        'https://cdn.example.com/frame.svg#design',
    ])
        assert.equal(canSyncPaletteAsset(asset), true, asset);
    for (const asset of [
        undefined,
        '',
        'javascript:alert(1)',
        'https://example.com/frame.png',
        'https://example.com/frame.svg.exe',
        'data:text/html;base64,aW1hZ2U=',
    ])
        assert.equal(canSyncPaletteAsset(asset), false);
});
test('existing vector assets resolve without needing an HTTP request or worker', async () => {
    const asset = encodeSvgAsset('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff"/></svg>');
    assert.equal(await resolvePaletteAsset(asset), asset);
    await assert.rejects(resolvePaletteAsset('not-an-asset'), /hỗ trợ/);
});
test('failed remote vectors do not stay cached and can retry', async () => {
    const original = globalThis.fetch;
    let requests = 0;
    globalThis.fetch = async () => {
        requests++;
        return { ok: false };
    };
    try {
        await assert.rejects(resolvePaletteAsset('/assets/retry.svg'), /tải SVG/);
        await assert.rejects(resolvePaletteAsset('/assets/retry.svg'), /tải SVG/);
        assert.equal(requests, 2);
    } finally {
        globalThis.fetch = original;
    }
});
