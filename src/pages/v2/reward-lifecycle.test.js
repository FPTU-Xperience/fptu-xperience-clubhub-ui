import assert from 'node:assert/strict';
import test from 'node:test';
import { rewardLifecycle, setRewardLifecycle, setRewardWindow } from './profile-page/reward-lifecycle.js';
import { publishClubGift, readClubGifts } from './profile-page/club-gifts.js';
import {
    publishClubShape,
    readClubShapes,
    redeemCoverReward,
    readCoverInventory,
    canUseCoverItem,
} from './profile-page/cover-cosmetics.js';
const storage = () => {
    const data = new Map();
    return { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
};
const palette = {
    clubId: 'a',
    kind: 'color',
    label: 'Palette',
    cost: 10,
    background: '#112233',
    secondary: '#445566',
    accent: '#778899',
    ink: '#abcdef',
};
test('publication is club scoped and schedules activate at the exact deadline without reopening canceled schedules', () => {
    const db = storage(),
        time = Date.parse('2030-01-01T00:00:00Z');
    assert.equal(rewardLifecycle('a', 'sample', db, time).status, 'published');
    setRewardLifecycle('a', 'sample', 'scheduled', new Date(time + 1000).toISOString(), db, time);
    assert.equal(rewardLifecycle('a', 'sample', db, time + 999).status, 'scheduled');
    assert.equal(rewardLifecycle('a', 'sample', db, time + 1000).status, 'published');
    assert.equal(rewardLifecycle('b', 'sample', db, time).status, 'published');
    setRewardLifecycle('a', 'sample', 'draft', null, db, time);
    assert.equal(rewardLifecycle('a', 'sample', db, time + 2000).status, 'draft');
    assert.throws(() => setRewardLifecycle('a', 'sample', 'scheduled', 'invalid', db, time));
    assert.throws(() => setRewardLifecycle('a', 'sample', 'scheduled', new Date(time).toISOString(), db, time));
});
test('draft/unpublished/deleted rewards block new claims while existing ownership remains usable', () => {
    const db = storage(),
        gift = publishClubGift(palette, db),
        user = { id: 1 };
    setRewardLifecycle('a', gift.key, 'draft', null, db);
    assert.throws(() => redeemCoverReward(user, 'a', gift.key, db), /publish/);
    assert.equal(readCoverInventory(user, db).owned.length, 0);
    setRewardLifecycle('a', gift.key, 'published', null, db);
    redeemCoverReward(user, 'a', gift.key, db);
    setRewardLifecycle('a', gift.key, 'deleted', null, db);
    assert.equal(canUseCoverItem('color', gift.id, readCoverInventory(user, db), db), true);
    assert.equal(readCoverInventory(user, db).wallets.a, 190);
    assert.throws(() => redeemCoverReward({ id: 2 }, 'a', gift.key, db), /publish/);
});
test('editing preserves gift identities and ownership, rejects different club and kind', () => {
    const db = storage(),
        gift = publishClubGift(palette, db),
        user = { id: 1 };
    redeemCoverReward(user, 'a', gift.key, db);
    const edited = publishClubGift({ ...gift, label: 'Edited', cost: 0, accent: '#ffffff' }, db);
    assert.equal(edited.key, gift.key);
    assert.equal(readClubGifts(db).length, 1);
    assert.equal(readCoverInventory(user, db).owned[0], gift.key);
    assert.throws(() => publishClubGift({ ...edited, clubId: 'b' }, db));
    assert.throws(() => publishClubGift({ ...edited, kind: 'physical', stock: 1 }, db));
    const shape = publishClubShape(
        { clubId: 'a', label: 'Shape', cost: 0, assetUrl: 'data:image/png;base64,c2hhcGU=' },
        db,
    );
    assert.equal(publishClubShape({ ...shape, label: 'New shape' }, db).key, shape.key);
    assert.equal(readClubShapes(db).length, 1);
    assert.throws(() => publishClubShape({ ...shape, clubId: 'b' }, db));
});

test('scheduled claims cannot debit early and become available when their deadline has passed', () => {
    const db = storage(),
        gift = publishClubGift(palette, db),
        user = { id: 3 };
    setRewardLifecycle('a', gift.key, 'scheduled', new Date(Date.now() + 60000).toISOString(), db);
    assert.throws(() => redeemCoverReward(user, 'a', gift.key, db), /publish/);
    assert.deepEqual(readCoverInventory(user, db), { owned: [], wallets: {} });
    const historicalDeadline = '2020-01-01T00:00:00Z';
    setRewardLifecycle('a', gift.key, 'scheduled', historicalDeadline, db, Date.parse(historicalDeadline) - 1);
    assert.equal(redeemCoverReward(user, 'a', gift.key, db).wallets.a, 190);
});

test('redemption window opens at start, closes at end and exposes both next boundaries', () => {
    const db = storage(),
        start = Date.parse('2030-01-01T10:00:00Z'),
        end = start + 3600000;
    setRewardWindow('a', 'gift', new Date(start).toISOString(), new Date(end).toISOString(), db, start - 1);
    assert.equal(rewardLifecycle('a', 'gift', db, start - 1).status, 'scheduled');
    assert.equal(rewardLifecycle('a', 'gift', db, start - 1).nextChangeAt, start);
    assert.equal(rewardLifecycle('a', 'gift', db, start).status, 'published');
    assert.equal(rewardLifecycle('a', 'gift', db, start).nextChangeAt, end);
    assert.equal(rewardLifecycle('a', 'gift', db, end - 1).status, 'published');
    assert.equal(rewardLifecycle('a', 'gift', db, end).status, 'expired');
    assert.equal(rewardLifecycle('a', 'gift', db, end).nextChangeAt, null);
});
test('manual publication replaces the window, while active-window setup and deadline validation remain consistent', () => {
    const db = storage(),
        start = Date.parse('2030-01-01T10:00:00Z'),
        end = start + 3600000;
    const from = new Date(start).toISOString(),
        to = new Date(end).toISOString();
    setRewardWindow('a', 'gift', from, to, db, start + 1);
    assert.equal(rewardLifecycle('a', 'gift', db, start + 1).status, 'published');
    setRewardLifecycle('a', 'gift', 'draft', null, db);
    assert.equal(rewardLifecycle('a', 'gift', db, start + 2).status, 'draft');
    assert.equal(rewardLifecycle('a', 'gift', db, start + 2).unpublishAt, null);
    setRewardLifecycle('a', 'gift', 'published', null, db);
    assert.equal(rewardLifecycle('a', 'gift', db, end + 1).status, 'published');
    assert.throws(() => setRewardWindow('a', 'gift', from, from, db, start - 1));
    assert.throws(() => setRewardWindow('a', 'gift', from, to, db, end));
    assert.throws(() => setRewardWindow('a', 'gift', from, '', db, start - 1));
});
test('expired-window gifts reject new claims without removing existing ownership', () => {
    const db = storage(),
        gift = publishClubGift(palette, db),
        user = { id: 20 };
    redeemCoverReward(user, 'a', gift.key, db);
    setRewardWindow(
        'a',
        gift.key,
        '2020-01-01T00:00:00Z',
        '2020-01-02T00:00:00Z',
        db,
        Date.parse('2019-01-01T00:00:00Z'),
    );
    assert.throws(() => redeemCoverReward({ id: 21 }, 'a', gift.key, db), /publish/);
    assert.equal(canUseCoverItem('color', gift.id, readCoverInventory(user, db), db), true);
});
