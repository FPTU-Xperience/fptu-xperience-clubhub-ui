import assert from 'node:assert/strict';
import test from 'node:test';
import { createEntityMediaStore } from '../../services/entity-media-store.js';
import { publishProfileImageSaved, subscribeProfileImageSaved, PROFILE_IMAGE_SIGNAL_KEY } from '../../services/profile-image-sync.js';
import { ACTIVITY_BANNER_SIZE, CLUB_BANNER_SIZE, bannerSize, moveBannerLayer, defaultGraphicBanner, createGraphicBannerFile } from '../../components/media/graphic-banner.js';

test('saved media has one identity across API directory, detail and membership projections', () => {
    const media = createEntityMediaStore();
    media.ingest('club', { id: 7, logoUrl: 'old-logo', coverImageUrl: 'old-cover' });
    media.commit('club', '7', { logoUrl: 'saved-logo' });
    assert.deepEqual(media.select('club', { clubId: '7', logoUrl: 'stale-logo' }), { clubId: '7', logoUrl: 'saved-logo', coverImageUrl: 'old-cover' });
    assert.equal(media.select('activity', { id: 7, coverImageUrl: 'activity' }).coverImageUrl, 'activity');
    assert.equal(media.ingest('club', { items: [{ id: 7, name: 'Club' }] }).items[0].coverImageUrl, 'old-cover');
});

test('a read started before saving cannot roll media back, even when the saved URL is unchanged', () => {
    const media = createEntityMediaStore();
    media.ingest('activity', { id: 1, coverImageUrl: 'saved' });
    const oldRead = media.ticket();
    media.commit('activity', 1, { coverImageUrl: 'saved' });
    assert.equal(media.ingest('activity', { id: 1, coverImageUrl: 'old' }, oldRead).coverImageUrl, 'saved');
    media.ingest('activity', { id: 1, coverImageUrl: null });
    assert.equal(media.select('activity', { id: '1', coverImageUrl: 'stale' }).coverImageUrl, '');
});

test('logout clears snapshots and rejects an earlier session read', () => {
    const media = createEntityMediaStore();
    const pending = media.ticket();
    media.commit('club', 7, { logoUrl: 'user-a' });
    media.reset();
    media.ingest('club', { id: 7, logoUrl: 'user-a' }, pending);
    assert.equal(media.select('club', { id: 7 }).logoUrl, undefined);
});

test('profile image invalidation filters accounts and carries no image bytes or URL', () => {
    const target = new EventTarget();
    let stored;
    target.localStorage = { setItem: (key, value) => { stored = { key, value }; } };
    const received = [];
    const unsubscribe = subscribeProfileImageSaved('account-a', (signal) => received.push(signal), target);
    publishProfileImageSaved('account-b', 'avatar', 'writer', target);
    publishProfileImageSaved('account-a', 'cover', 'writer', target);
    assert.equal(received.length, 1);
    assert.equal(stored.key, PROFILE_IMAGE_SIGNAL_KEY);
    assert.deepEqual(Object.keys(JSON.parse(stored.value)).sort(), ['account', 'kind', 'revision', 'source']);
    const event = new Event('storage');
    Object.assign(event, { key: PROFILE_IMAGE_SIGNAL_KEY, newValue: stored.value });
    target.dispatchEvent(event);
    assert.equal(received.length, 2);
    unsubscribe();
    target.dispatchEvent(event);
    assert.equal(received.length, 2);
});

test('activity banners crop/export at 12:5 and drag by their own canvas height', () => {
    assert.deepEqual(bannerSize('activity'), { width: 1200, height: 500 });
    assert.deepEqual(bannerSize('club'), { width: 1200, height: 300 });
    const value = defaultGraphicBanner('activity');
    assert.equal(moveBannerLayer(value, 'text', 120, 50, ACTIVITY_BANNER_SIZE).textY, 10);
    assert.equal(moveBannerLayer(value, 'text', 120, 30, CLUB_BANNER_SIZE).textY, 10);
});

test('generated activity PNG uses the same output size and scaled text placement as its SVG', async () => {
    const previousDocument = globalThis.document;
    const calls = [];
    const context = Object.fromEntries(['fillRect', 'save', 'restore', 'translate', 'scale', 'beginPath', 'arc', 'fill', 'fillText'].map((name) => [name, (...args) => calls.push([name, ...args])]));
    const canvas = { getContext: () => context, toBlob: (resolve) => resolve(new Blob(['png'], { type: 'image/png' })) };
    globalThis.document = { createElement: () => canvas, fonts: { load: async () => [] } };
    try {
        await createGraphicBannerFile({ ...defaultGraphicBanner('activity'), background: '#ffffff' }, ACTIVITY_BANNER_SIZE);
        assert.equal(canvas.width, 1200);
        assert.equal(canvas.height, 500);
        assert.ok(calls.some((call) => JSON.stringify(call) === JSON.stringify(['fillRect', 0, 0, 1200, 500])));
        const text = calls.filter(([name]) => name === 'fillText');
        assert.deepEqual(text.map(([, content]) => content), ['CLUBHUB / EXPERIENCES', 'Một hoạt động.', 'Nhiều điều đáng nhớ.']);
        for (const [index, expectedY] of [153, 222, 274.44].entries()) {
            assert.ok(Math.abs(text[index][2] - 46) < 0.001);
            assert.ok(Math.abs(text[index][3] - expectedY) < 0.001);
        }
    } finally { globalThis.document = previousDocument; }
});
