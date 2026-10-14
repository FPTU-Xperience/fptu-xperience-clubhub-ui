import test from 'node:test';
import assert from 'node:assert/strict';
import { giftClaimState, giftDescription } from './profile-page/gift-presentation.js';
const gift = { kind: 'color', cost: 100, status: 'published' };
const viewer = { authenticated: true, clubId: 'a', balance: 200 };
test('card and detail panel share free, paid, owned and insufficient-balance claim states', () => {
    assert.deepEqual(giftClaimState(gift, viewer), { disabled: false, label: 'Đổi quà' });
    assert.deepEqual(giftClaimState({ ...gift, cost: 0 }, { ...viewer, balance: 0 }), {
        disabled: false,
        label: 'Nhận miễn phí',
    });
    assert.equal(giftClaimState(gift, { ...viewer, owned: true }).label, 'Đã sở hữu');
    assert.equal(giftClaimState(gift, { ...viewer, balance: 99 }).disabled, true);
});
test('detail claims are unavailable after window closes, for physical gifts and without a signed-in club context', () => {
    for (const status of ['draft', 'scheduled', 'expired', 'deleted'])
        assert.equal(giftClaimState({ ...gift, status }, viewer).disabled, true);
    assert.equal(giftClaimState({ ...gift, kind: 'physical' }, viewer).disabled, true);
    assert.equal(giftClaimState(gift, { ...viewer, authenticated: false }).disabled, true);
    assert.equal(giftClaimState(gift, { ...viewer, clubId: null }).disabled, true);
});
test('detail descriptions preserve authored text and supply appropriate defaults per gift type', () => {
    assert.equal(
        giftDescription({ ...gift, description: 'Full description\nSecond line' }),
        'Full description\nSecond line',
    );
    for (const kind of ['physical', 'frame', 'shape', 'color', 'combo'])
        assert.ok(giftDescription({ kind }).length > 0);
});
