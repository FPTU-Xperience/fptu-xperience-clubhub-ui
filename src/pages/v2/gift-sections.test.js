import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGiftSections, readGiftPopularity } from './profile-page/gift-sections.js';
import { publishClubGift, readClubGifts } from './profile-page/club-gifts.js';
import { redeemCoverReward } from './profile-page/cover-cosmetics.js';
const db = () => {
    const map = new Map();
    return { getItem: (key) => map.get(key), setItem: (key, value) => map.set(key, value) };
};
test('sections contain distinct categories and recent gifts retain newest-first order with a six-item limit', () => {
    const now = Date.parse('2030-01-30T00:00:00Z');
    const rows = Array.from({ length: 8 }, (_, i) => ({
        key: `${i}`,
        kind: 'frame',
        createdAt: new Date(now - i * 1000).toISOString(),
        status: 'published',
    }));
    rows.push(
        { key: 'old', kind: 'shape', createdAt: '2020-01-01T00:00:00Z' },
        { key: 'bundle', kind: 'combo' },
        { key: 'legacy', kind: 'physical' },
    );
    const sections = buildGiftSections(rows, {}, now);
    assert.deepEqual(
        sections.map((section) => section.id),
        ['recent', 'hot', 'physical', 'frame', 'shape', 'color'],
    );
    assert.deepEqual(
        sections[0].items.map((gift) => gift.key),
        ['0', '1', '2', '3', '4', '5'],
    );
    assert.deepEqual(
        sections.at(-1).items.map((gift) => gift.key),
        ['bundle'],
    );
    assert.equal(rows.length, 11);
});
test('hot gifts are published curated items or genuinely claimed items, never invented popularity', () => {
    const rows = [
        { key: 'featured', kind: 'color', status: 'published', hot: true },
        { key: 'popular', kind: 'frame', status: 'published' },
        { key: 'draft', status: 'draft', hot: true },
        { key: 'none', status: 'published' },
    ];
    assert.deepEqual(
        buildGiftSections(rows, { popular: 3, draft: 10 })[1].items.map((gift) => gift.key),
        ['featured', 'popular'],
    );
    assert.equal(buildGiftSections([rows[3]])[1].items.length, 0);
});
test('claim metrics count successful first claims per issuer, and editing does not make a gift new again', () => {
    const storage = db();
    const gift = publishClubGift(
        {
            clubId: 'a',
            label: 'Palette',
            kind: 'color',
            cost: 0,
            hot: true,
            background: '#112233',
            secondary: '#445566',
            accent: '#778899',
            ink: '#abcdef',
        },
        storage,
    );
    assert.ok(Number.isFinite(Date.parse(gift.createdAt)));
    redeemCoverReward({ id: 1 }, 'a', gift.key, storage);
    redeemCoverReward({ id: 1 }, 'a', gift.key, storage);
    assert.equal(readGiftPopularity('a', storage)[gift.key], 1);
    assert.deepEqual(readGiftPopularity('b', storage), {});
    redeemCoverReward({ id: 2 }, 'a', gift.key, storage);
    assert.equal(readGiftPopularity('a', storage)[gift.key], 2);
    const updated = publishClubGift({ ...gift, label: 'Edited', hot: false }, storage);
    assert.equal(updated.createdAt, gift.createdAt);
    assert.equal(readClubGifts(storage).length, 1);
    assert.equal(updated.hot, false);
});
