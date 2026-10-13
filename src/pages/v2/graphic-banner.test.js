import test from 'node:test';
import assert from 'node:assert/strict';
import {
    defaultGraphicBanner,
    normalizeGraphicBanner,
    bannerPaint,
    saveGraphicBanner,
    readGraphicBanner,
    moveBannerLayer,
} from '../../components/media/graphic-banner.js';

test('dragging moves only the active banner layer and clamps to slider limits', () => {
    const original = defaultGraphicBanner();
    const text = moveBannerLayer(original, 'text', 120, -30);
    assert.equal(text.textX, 10);
    assert.equal(text.textY, -10);
    assert.equal(text.shapeX, 0);
    const shape = moveBannerLayer(text, 'shape', -600, 75);
    assert.equal(shape.shapeX, -50);
    assert.equal(shape.shapeY, 25);
    assert.equal(shape.textX, 10);
    assert.equal(shape.shapeScale, 100);
    assert.equal(original.textX, 0);
    const limit = moveBannerLayer(shape, 'shape', 99999, -99999);
    assert.equal(limit.shapeX, 50);
    assert.equal(limit.shapeY, -100);
    assert.equal(moveBannerLayer(original, 'text', 99999, 99999).textX, 100);
});

test('graphic defaults preserve community and activity placeholder wording and deterministic palettes', () => {
    const club = defaultGraphicBanner('club', 7),
        activity = defaultGraphicBanner('activity', 7);
    assert.equal(club.eyebrow, 'CLUBHUB / COMMUNITY');
    assert.equal(club.title, 'Một cộng đồng.');
    assert.equal(club.subtitle, 'Cùng nhau trưởng thành.');
    assert.equal(activity.eyebrow, 'CLUBHUB / EXPERIENCES');
    assert.equal(activity.subtitle, 'Nhiều điều đáng nhớ.');
    assert.deepEqual(defaultGraphicBanner('club', 7), club);
    assert.equal(activity.background, 'gradient:community');
    assert.equal(bannerPaint('gradient:creative').colors[0], '#392f63');
});
test('graphic designs allow palette gradients and reject invalid rendering settings', () => {
    const draft = {
        ...defaultGraphicBanner(),
        title: '<CLB & Friends>',
        background: 'gradient:ocean',
        color: 'gradient:gold',
        decoration: 'waves',
        font: 'georgia',
        size: 48,
    };
    assert.deepEqual(normalizeGraphicBanner(draft), draft);
    for (const patch of [
        { size: 0 },
        { size: 65 },
        { title: 'x'.repeat(81) },
        { font: 'unknown' },
        { decoration: 'unknown' },
        { background: 'url(https://example.com)' },
        { shapeScale: 201 },
        { textX: 101 },
        { fonts: { title: 'unknown' } },
    ])
        assert.throws(() => normalizeGraphicBanner({ ...draft, ...patch }));
    assert.equal(normalizeGraphicBanner({ font: 'georgia' }).fonts.subtitle, 'georgia');
    const independent = normalizeGraphicBanner({
        ...draft,
        fonts: { eyebrow: 'arial', title: 'times', subtitle: 'courier' },
        textX: 30,
        shapeScale: 75,
        visible: false,
    });
    assert.equal(independent.fonts.title, 'times');
    assert.equal(independent.textX, 30);
    assert.equal(independent.shapeScale, 75);
    assert.equal(independent.visible, false);
});
test('cached graphic editing settings are isolated by key and only reused for the saved image', () => {
    const values = new Map(),
        storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
    const design = defaultGraphicBanner('activity');
    saveGraphicBanner('account:1:activity:7', 'https://cdn.example.com/saved.png', design, storage);
    assert.deepEqual(readGraphicBanner('account:1:activity:7', 'https://cdn.example.com/saved.png', storage), design);
    assert.equal(readGraphicBanner('account:2:activity:7', 'https://cdn.example.com/saved.png', storage), null);
    assert.equal(readGraphicBanner('account:1:activity:7', 'https://cdn.example.com/replaced.png', storage), null);
    assert.equal(readGraphicBanner(null, 'https://cdn.example.com/saved.png', storage), null);
});
