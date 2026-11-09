import test from 'node:test';
import assert from 'node:assert/strict';
import { creditWallet, creditGraph, cosmeticInventory, rewardReceipt, rewardWindow } from '../../services/club-credit.js';
const version = '11111111-1111-4111-8111-111111111111';
test('wallet preserves debt and rejects another account, club or non-reconciled amounts', () => {
    const body = { userId: 7, clubId: 1, unit: 'CLUB_CREDIT', policyVersion: 'CLUB_VERIFIED_XP_1_TO_1_V1', version, earnedTotal: 100, revokedTotal: 100, spentTotal: 80, balance: -80 };
    assert.equal(creditWallet(body, 7, 1).balance, -80);
    assert.throws(() => creditWallet(body, 8, 1));
    assert.throws(() => creditWallet(body, 7, 2));
    assert.throws(() => creditWallet({ ...body, balance: 0 }, 7, 1));
    assert.throws(() => creditWallet({ ...body, unit: 'MONEY' }, 7, 1));
});
test('graph is ordered, reconciled and scoped; reward windows always interpret Vietnam local time', () => {
    const body = { userId: 7, clubId: 1, unit: 'CLUB_CREDIT', policyVersion: 'CLUB_VERIFIED_XP_1_TO_1_V1', version, timezone: 'Asia/Ho_Chi_Minh', points: [{ date: '2026-11-04', earned: 0, spent: 80, balance: -80 }] };
    assert.equal(creditGraph(body, 7, 1).points[0].balance, -80);
    assert.throws(() => creditGraph({ ...body, points: [...body.points, ...body.points] }, 7, 1));
    assert.throws(() => creditGraph({ ...body, points: [{ ...body.points[0], balance: 0 }] }, 7, 1));
    assert.equal(rewardWindow('2030-11-04T14:30', '').opensAt, '2030-11-04T07:30:00.000Z');
    assert.throws(() => rewardWindow('2030-11-04T14:30', '2030-11-04T14:30'));
});
test('inventory is account scoped and paged; receipt validates actual granted identities', async () => {
    const item = { cosmetic: { cosmeticId: version, issuerClubId: 1, kind: 'COLOR', label: 'Palette', definition: { background: '#112233', secondary: '#445566', accent: '#778899', ink: '#FFFFFF' } }, sourceReceiptId: version };
    const api = { request: async () => ({ userId: 7, page: 1, totalItems: 1, totalPages: 1, items: [item] }) };
    assert.equal((await cosmeticInventory(api, 7)).length, 1);
    await assert.rejects(cosmeticInventory(api, 8));
    const reward = { id: version, price: 80, grants: [{ cosmeticId: version }] };
    const receipt = { receiptId: version, userId: 7, clubId: 1, rewardId: version, walletVersion: version, balance: 20, amount: 80, grants: [version] };
    assert.equal(rewardReceipt(receipt, 7, 1, reward).amount, 80);
    assert.throws(() => rewardReceipt({ ...receipt, userId: 8 }, 7, 1, reward));
    assert.throws(() => rewardReceipt({ ...receipt, amount: 1 }, 7, 1, reward));
});
