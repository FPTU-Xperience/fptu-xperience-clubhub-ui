import assert from 'node:assert/strict';
import test from 'node:test';
import {
    COVER_COLORS,
    FPT_DEV_COMBOS,
    COVER_SHAPES,
    getClubCoverRewards,
    publishClubShape,
    readCoverInventory,
    redeemCoverReward,
    sampleClubBalance,
    canUseCoverItem,
} from './cover-cosmetics.js';
import { readProfile, saveProfile } from '../profile-data.js';

test('existing styles are free and FPT Dev bundles unlock both parts only through its store', () => {
    const db = storage(),
        user = { id: 1, name: 'Student' };
    const inventory = readCoverInventory(user, db);
    for (const color of COVER_COLORS.filter((item) => !item.id.startsWith('fpt-dev-')))
        assert.equal(canUseCoverItem('color', color.id, inventory, db), true);
    const combo = FPT_DEV_COMBOS[1];
    assert.ok(getClubCoverRewards(10, db, 'FPT-DEV').some((item) => item.key === combo.key));
    assert.ok(!getClubCoverRewards(10, db, 'FPT-TECH').some((item) => item.key === combo.key));
    assert.throws(() => redeemCoverReward(user, 10, combo.key, db, 'FPT-TECH'), /không tồn tại/);
    const owned = redeemCoverReward(user, 10, combo.key, db, 'FPT-DEV');
    assert.equal(canUseCoverItem('color', combo.colorId, owned, db), true);
    assert.equal(canUseCoverItem('shape', combo.shapeId, owned, db), true);
    assert.equal(sampleClubBalance(owned, 10), 200 - combo.cost);
});

const storage = () => {
    const values = new Map();
    return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
};
const upload = (db, cost = 100, clubId = 10) =>
    publishClubShape(
        { clubId, clubName: `Club ${clubId}`, label: 'Club design', cost, assetUrl: 'data:image/png;base64,c2hhcGU=' },
        db,
    );
test('redemption debits the selected club once and unlocks cosmetics only for that account', () => {
    const db = storage(),
        user = { id: 1, name: 'Student' },
        other = { id: 2 };
    const initial = readCoverInventory(user, db);
    for (const shape of COVER_SHAPES) assert.equal(canUseCoverItem('shape', shape.id, initial, db), true);
    const exclusive = upload(db),
        second = upload(db, 120);
    assert.equal(canUseCoverItem('shape', exclusive.id, initial, db), false);
    const redeemed = redeemCoverReward(user, 10, exclusive.key, db);
    assert.equal(sampleClubBalance(redeemed, 10), 100);
    assert.equal(sampleClubBalance(redeemed, 20), 200);
    assert.equal(canUseCoverItem('shape', exclusive.id, redeemed, db), true);
    assert.equal(sampleClubBalance(redeemCoverReward(user, 10, exclusive.key, db), 10), 100);
    assert.equal(canUseCoverItem('shape', exclusive.id, readCoverInventory(other, db), db), false);
    assert.throws(() => redeemCoverReward(user, 10, second.key, db), /đủ điểm/);
    assert.throws(() => redeemCoverReward({}, 10, exclusive.key, db), /đăng nhập/);
    assert.throws(() => redeemCoverReward(user, 20, exclusive.key, db), /không tồn tại/);
    assert.ok(!getClubCoverRewards(20, db).some((item) => item.id === exclusive.id));
});
test('color and shape persist independently and locked cosmetics cannot be equipped', () => {
    const db = storage(),
        user = { id: 1, name: 'Student' };
    saveProfile(user, { coverPreset: 'horizon', coverShape: 'ribbons' }, db);
    saveProfile(user, { coverPreset: 'sunset' }, db);
    assert.equal(readProfile(user, db).profile.coverShape, 'ribbons');
    const exclusive = upload(db);
    assert.throws(() => saveProfile(user, { coverShape: exclusive.id }, db), /Kho quà/);
    redeemCoverReward(user, 10, exclusive.key, db);
    saveProfile(user, { coverShape: exclusive.id }, db);
    assert.equal(readProfile(user, db).profile.coverShape, exclusive.id);
    assert.equal(readProfile(user, db).profile.coverPreset, 'sunset');
});

test('club uploads have unique provenance and reject invalid assets or prices', () => {
    const db = storage();
    const a = upload(db, 100, 10),
        b = upload(db, 100, 20);
    assert.notEqual(a.id, b.id);
    assert.equal(a.clubId, '10');
    assert.equal(b.clubId, '20');
    assert.throws(
        () => publishClubShape({ clubId: 1, label: 'Shape', cost: 1, assetUrl: 'javascript:bad' }, db),
        /PNG/,
    );
    assert.throws(() => upload(db, -1), /hợp lệ/);
});

test('background image keeps independent shape ownership, layout and editable text', () => {
    const db = storage(),
        user = { id: 7, name: 'Student' };
    const exclusive = upload(db);
    assert.throws(() => saveProfile(user, { coverPreset: 'custom', coverShape: exclusive.id }, db), /Kho quà/);
    redeemCoverReward(user, 10, exclusive.key, db);
    saveProfile(
        user,
        {
            coverPreset: 'custom',
            coverBackgroundColor: 'forest',
            coverShape: exclusive.id,
            coverShapeTransform: { x: 12, y: -30, scale: 75 },
            coverText: { title: 'Xin chào', subtitle: '</>', color: '#45f089', size: 36 },
        },
        db,
    );
    const profile = readProfile(user, db).profile;
    assert.deepEqual(profile.coverShapeTransform, { x: 12, y: -30, scale: 75 });
    assert.equal(profile.coverText.title, 'Xin chào');
    assert.equal(profile.coverBackgroundColor, 'forest');
    assert.equal(profile.coverText.eyebrow, 'THE EXPERIENCE IS YOURS.');
    saveProfile(user, { coverText: { size: 240, x: 30, y: -15 } }, db);
    assert.equal(readProfile(user, db).profile.coverText.size, 240);
    assert.equal(readProfile(user, db).profile.coverText.x, 30);
    assert.equal(readProfile(user, db).profile.coverText.y, -15);
    assert.deepEqual(readProfile(user, db).profile.coverShapeTransform, { x: 12, y: -30, scale: 75 });
    assert.throws(() => saveProfile(user, { coverText: { size: 241 } }, db), /Cài đặt chữ/);
    assert.throws(() => saveProfile(user, { coverText: { x: 101 } }, db), /Vị trí chữ/);
    saveProfile(user, { coverText: { visible: false }, coverPreset: 'forest' }, db);
    assert.equal(readProfile(user, db).profile.coverText.title, 'Xin chào');
    assert.equal(readProfile(user, db).profile.coverText.visible, false);
    assert.equal(readProfile(user, db).profile.coverShape, exclusive.id);
    assert.throws(
        () => saveProfile(user, { coverPreset: 'custom', coverBackgroundColor: 'fpt-dev-mint' }, db),
        /Kho quà/,
    );
    assert.throws(() => saveProfile(user, { coverShapeTransform: { scale: 201 } }, db), /kích thước/);
    assert.throws(() => saveProfile(user, { coverText: { color: 'red' } }, db), /Màu chữ/);
    assert.throws(() => saveProfile(user, { coverText: { title: 'x'.repeat(61) } }, db), /ký tự/);
});
