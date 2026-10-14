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
import { AVATAR_FRAME_REWARDS } from './avatar-frames.js';
import { publishClubGift, readClubGifts } from './club-gifts.js';
import {
    isFrameAssetUrl,
    frameAssetStyle,
    MAX_COSMETIC_FILE_BYTES,
    readCosmeticDesignFile,
} from './avatar-frame-assets.js';
import { initialsDesignStyle, initialsTextStyle } from '../../../components/media/initials-design.js';
import { normalizeCoverTransform, normalizeShapeHsl, shapeStampTransform } from './cover-design.js';

test('zero-cost cosmetics require a claim, unlock once and never spend points even with an empty wallet', () => {
    const db = storage(),
        user = { id: 101, name: 'Student' };
    const common = { clubId: 'free-club', label: 'Quà miễn phí', cost: 0 };
    const shape = publishClubShape({ ...common, assetUrl: 'data:image/png;base64,c2hhcGU=' }, db);
    const frame = publishClubGift(
        { ...common, kind: 'frame', assetUrl: 'data:image/png;base64,aW1hZ2U=', color: '#abcdef', recolor: false },
        db,
    );
    const color = publishClubGift(
        { ...common, kind: 'color', background: '#112233', secondary: '#445566', accent: '#778899', ink: '#aabbcc' },
        db,
    );
    assert.equal(getClubCoverRewards('free-club', db).length, 3);
    assert.throws(() => saveProfile(user, { coverShape: shape.id }, db), /Kho quà/);
    db.setItem(
        `clubhub:v2:cover-rewards:${user.id}`,
        JSON.stringify({ version: 1, owned: [], wallets: { 'free-club': 0, other: 123 } }),
    );
    for (const gift of [shape, frame, color]) {
        redeemCoverReward(user, 'free-club', gift.key, db);
        redeemCoverReward(user, 'free-club', gift.key, db);
        const inventory = readCoverInventory(user, db);
        assert.equal(inventory.wallets['free-club'], 0);
        assert.equal(inventory.wallets.other, 123);
        assert.equal(inventory.owned.filter((key) => key === gift.key).length, 1);
    }
    saveProfile(user, { coverShape: shape.id, avatarFrame: frame.id, coverPreset: color.id }, db);
    assert.equal(readProfile(user, db).profile.coverShape, shape.id);
    assert.equal(readProfile(user, db).profile.avatarFrame, frame.id);
    assert.equal(readCoverInventory({ id: 102 }, db).owned.length, 0);
    assert.throws(() => publishClubShape({ ...common, cost: -1, assetUrl: shape.assetUrl }, db));
    assert.throws(() => publishClubGift({ ...common, kind: 'physical', stock: 1, cost: 0.5 }, db));
});

test('stamp rotation and HSL persist independently from cover background and other accounts', () => {
    const db = storage(),
        user = { id: 91, name: 'Student' };
    const originalHsl = { hue: 20, saturation: 125, lightness: -10 };
    const shape = publishClubShape(
        {
            clubId: 'stamp-club',
            label: 'Stamp',
            cost: 10,
            assetUrl: 'data:image/png;base64,c3RhbXA=',
            hsl: originalHsl,
        },
        db,
    );
    assert.deepEqual(getClubCoverRewards('stamp-club', db)[0].hsl, originalHsl);
    redeemCoverReward(user, 'stamp-club', shape.key, db);
    const transform = { x: -80, y: 60, scale: 350, rotation: -135 };
    const hsl = { hue: -45, saturation: 80, lightness: 30 };
    saveProfile(
        user,
        { coverShape: shape.id, coverShapeTransform: transform, coverShapeHsl: hsl, coverPreset: 'forest' },
        db,
    );
    saveProfile(user, { coverPreset: 'violet' }, db);
    const profile = readProfile(user, db).profile;
    assert.deepEqual(profile.coverShapeTransform, transform);
    assert.deepEqual(profile.coverShapeHsl, hsl);
    assert.equal(profile.coverPreset, 'violet');
    assert.notEqual(readProfile({ id: 92 }, db).profile.coverShape, shape.id);
    assert.deepEqual(getClubCoverRewards('stamp-club', db)[0].hsl, originalHsl);
    assert.deepEqual(normalizeCoverTransform({ x: 12, scale: 75 }), { x: 12, y: 0, scale: 75, rotation: 0 });
    assert.deepEqual(normalizeShapeHsl(), { hue: 0, saturation: 100, lightness: 0 });
    assert.equal(
        shapeStampTransform({ x: 25, y: -20, scale: 50, rotation: 90 }),
        'translate(900 90) rotate(90) scale(0.5)',
    );
    assert.throws(() => saveProfile(user, { coverShapeTransform: { rotation: 181 } }, db));
    assert.throws(() => saveProfile(user, { coverShapeHsl: { saturation: 201 } }, db), /HSL/);
    assert.throws(
        () =>
            publishClubShape(
                { clubId: 'stamp-club', label: 'Invalid', cost: 10, assetUrl: shape.assetUrl, hsl: { hue: NaN } },
                db,
            ),
        /HSL/,
    );
});

test('created gifts stay club scoped and custom frames and colors can be redeemed and equipped', () => {
    const db = storage(),
        user = { id: 71, name: 'Student' };
    const base = { clubId: 'custom-club', label: 'Quà riêng', cost: 50 };
    const frame = publishClubGift(
        { ...base, kind: 'frame', color: '#112233', assetUrl: 'data:image/png;base64,aW1hZ2U=', recolor: true },
        db,
    );
    const palette = publishClubGift(
        { ...base, kind: 'color', background: '#112233', secondary: '#445566', accent: '#778899', ink: '#aabbcc' },
        db,
    );
    const physical = publishClubGift({ ...base, kind: 'physical', stock: 5 }, db);
    assert.equal(getClubCoverRewards('other-club', db).length, 0);
    assert.equal(getClubCoverRewards('custom-club', db).length, 3);
    assert.throws(() => saveProfile(user, { avatarFrame: frame.id }, db), /Kho quà/);
    assert.throws(() => saveProfile(user, { coverPreset: palette.id }, db), /Kho quà/);
    redeemCoverReward(user, 'custom-club', frame.key, db);
    redeemCoverReward(user, 'custom-club', palette.key, db);
    saveProfile(user, { avatarFrame: frame.id, coverPreset: palette.id }, db);
    assert.equal(readProfile(user, db).profile.avatarFrame, frame.id);
    assert.equal(readProfile(user, db).profile.coverBackgroundColor, palette.id);
    assert.equal(sampleClubBalance(readCoverInventory(user, db), 'custom-club'), 100);
    assert.throws(() => redeemCoverReward(user, 'custom-club', physical.key, db), /hiện vật/);
    assert.equal(sampleClubBalance(readCoverInventory(user, db), 'custom-club'), 100);
    assert.equal(readCoverInventory({ id: 72 }, db).owned.length, 0);
});

test('gift creation rejects invalid stock, colors, patterns and persisted records', () => {
    const db = storage(),
        base = { clubId: 'club', label: 'Quà', cost: 20 };
    assert.throws(() => publishClubGift({ ...base, kind: 'physical', stock: 1.5 }, db));
    assert.throws(() =>
        publishClubGift({ ...base, kind: 'frame', color: '#112233', accent: '#ffffff', pattern: 'unknown' }, db),
    );
    assert.throws(() => publishClubGift({ ...base, kind: 'color', background: 'red' }, db));
    assert.throws(() => publishClubGift({ ...base, kind: 'physical', stock: 2, assetUrl: 'javascript:alert(1)' }, db));
    assert.throws(() => publishClubGift({ ...base, kind: 'physical', stock: 2, cost: -1 }, db));
    db.setItem(
        'clubhub:v2:club-gifts:1',
        JSON.stringify([{ ...base, id: 'club-fake', key: 'physical:club-fake', kind: 'physical', stock: -1 }]),
    );
    assert.deepEqual(readClubGifts(db), []);
});

test('PNG and SVG frame sources and tint settings persist after redemption', () => {
    const db = storage(),
        user = { id: 81, name: 'Student' };
    for (const [index, mime] of ['png', 'svg+xml'].entries()) {
        const assetUrl = `data:image/${mime};base64,aW1hZ2U=`;
        const frame = publishClubGift(
            {
                clubId: 'asset-club',
                kind: 'frame',
                label: `Frame ${index}`,
                cost: 20,
                assetUrl,
                color: '#abcdef',
                recolor: !!index,
                circular: true,
            },
            db,
        );
        redeemCoverReward(user, 'asset-club', frame.key, db);
        saveProfile(user, { avatarFrame: frame.id }, db);
        const stored = readClubGifts(db).find((gift) => gift.id === frame.id);
        assert.equal(stored.assetUrl, assetUrl);
        assert.equal(stored.recolor, !!index);
        assert.equal(stored.circular, true);
        assert.equal(stored.color, '#abcdef');
        assert.equal(readProfile(user, db).profile.avatarFrame, frame.id);
        assert.equal(frameAssetStyle(stored).backgroundColor, '#abcdef');
    }
    assert.equal(sampleClubBalance(readCoverInventory(user, db), 'asset-club'), 160);
    assert.equal(isFrameAssetUrl('https://example.com/frame.svg'), false);
    assert.equal(isFrameAssetUrl('data:image/svg+xml;base64,invalid"url'), false);
    assert.throws(
        () =>
            publishClubGift({ clubId: 'asset-club', kind: 'frame', label: 'Missing', cost: 20, color: '#abcdef' }, db),
        /PNG hoặc SVG/,
    );
});

test('existing geometric frames remain readable alongside uploaded frames', () => {
    const db = storage();
    db.setItem(
        'clubhub:v2:club-gifts:1',
        JSON.stringify([
            {
                clubId: 'club',
                kind: 'frame',
                id: 'club-old',
                key: 'frame:club-old',
                label: 'Old frame',
                description: '',
                cost: 20,
                color: '#112233',
                accent: '#aabbcc',
                pattern: 'orbit',
            },
        ]),
    );
    assert.equal(readClubGifts(db).length, 1);
    assert.equal(getClubCoverRewards('club', db)[0].pattern, 'orbit');
});

test('shape and frame catalogs accept PNG and SVG up to 5 MB and reject larger assets', async () => {
    const db = storage();
    const payload = Buffer.alloc(MAX_COSMETIC_FILE_BYTES).toString('base64');
    for (const mime of ['png', 'svg+xml']) {
        const assetUrl = `data:image/${mime};base64,${payload}`;
        const shape = publishClubShape({ clubId: 'large-assets', label: mime, cost: 10, assetUrl }, db);
        const frame = publishClubGift(
            {
                clubId: 'large-assets',
                kind: 'frame',
                label: mime,
                cost: 10,
                assetUrl,
                recolor: false,
                color: '#123456',
            },
            db,
        );
        const catalog = getClubCoverRewards('large-assets', db);
        assert.equal(catalog.find((item) => item.key === shape.key).assetUrl, assetUrl);
        assert.equal(catalog.find((item) => item.key === frame.key).assetUrl, assetUrl);
    }
    const tooLarge = `data:image/png;base64,${Buffer.alloc(MAX_COSMETIC_FILE_BYTES + 1).toString('base64')}`;
    assert.equal(isFrameAssetUrl(tooLarge), false);
    assert.throws(
        () => publishClubShape({ clubId: 'large-assets', label: 'Too large', cost: 10, assetUrl: tooLarge }, db),
        /5 MB/,
    );
    assert.throws(() =>
        publishClubGift(
            {
                clubId: 'large-assets',
                kind: 'frame',
                label: 'Too large',
                cost: 10,
                assetUrl: tooLarge,
                recolor: false,
                color: '#123456',
            },
            db,
        ),
    );
    await assert.rejects(readCosmeticDesignFile({ type: 'image/png', size: MAX_COSMETIC_FILE_BYTES + 1 }), /5 MB/);
    await assert.rejects(readCosmeticDesignFile({ type: 'image/jpeg', size: 100 }), /PNG hoặc SVG/);
});

test('profile cover palette backgrounds and gradient ink persist without losing its cosmetic selections', () => {
    const db = storage(),
        user = { id: 61, name: 'Student' };
    saveProfile(
        user,
        { coverBackgroundPaint: 'gradient:ocean', coverText: { color: 'gradient:sunset' }, coverShape: 'waves' },
        db,
    );
    saveProfile(user, { headline: 'Updated headline' }, db);
    const profile = readProfile(user, db).profile;
    assert.equal(profile.coverBackgroundPaint, 'gradient:ocean');
    assert.equal(profile.coverText.color, 'gradient:sunset');
    assert.equal(profile.coverShape, 'waves');
    saveProfile(user, { coverBackgroundPaint: '' }, db);
    assert.equal(readProfile(user, db).profile.coverBackgroundPaint, '');
    assert.throws(() => saveProfile(user, { coverBackgroundPaint: 'gradient:unknown' }, db), /Màu nền/);
    assert.throws(() => saveProfile(user, { coverText: { color: 'gradient:unknown' } }, db), /Màu chữ/);
});

test('avatar gradient colors round trip and produce background and text preview styles', () => {
    const db = storage(),
        user = { id: 51, name: 'Student' };
    const design = { background: 'gradient:ocean', color: 'gradient:sunset', font: 'inter' };
    saveProfile(user, { avatarMode: 'default', avatarDesign: design }, db);
    const saved = readProfile(user, db).profile.avatarDesign;
    assert.deepEqual(saved, design);
    assert.match(initialsDesignStyle(saved).background, /^linear-gradient/);
    assert.match(initialsTextStyle(saved).backgroundImage, /^linear-gradient/);
    assert.equal(initialsTextStyle(saved).color, 'transparent');
    assert.throws(() => saveProfile(user, { avatarDesign: { background: 'gradient:unknown' } }, db), /ảnh mặc định/);
});

test('default avatar appearance persists independently of images, frames and other accounts', () => {
    const db = storage(),
        user = { id: 41, name: 'Student' };
    const design = { background: '#123456', color: '#ffffff', font: 'georgia' };
    saveProfile(user, { avatarMode: 'default', avatarDesign: design, avatarFrame: 'orange' }, db);
    saveProfile(user, { coverPreset: 'sunset' }, db);
    const profile = readProfile(user, db).profile;
    assert.equal(profile.avatarMode, 'default');
    assert.equal(profile.avatarFrame, 'orange');
    assert.deepEqual(profile.avatarDesign, design);
    assert.equal(readProfile({ id: 42 }, db).profile.avatarDesign.font, 'inter');
    saveProfile(user, { avatarMode: 'image' }, db);
    assert.deepEqual(readProfile(user, db).profile.avatarDesign, design);
    assert.throws(() => saveProfile(user, { avatarMode: 'other' }, db), /Loại ảnh/);
    assert.throws(() => saveProfile(user, { avatarDesign: { background: 'red' } }, db), /ảnh mặc định/);
    assert.throws(() => saveProfile(user, { avatarDesign: { font: 'other' } }, db), /ảnh mặc định/);
});

test('avatar frames require ownership, persist separately and share the club cosmetics wallet', () => {
    const db = storage(),
        user = { id: 31, name: 'Student' },
        other = { id: 32 };
    const frame = AVATAR_FRAME_REWARDS[0];
    assert.equal(readProfile(user, db).profile.avatarFrame, 'none');
    saveProfile(user, { avatarFrame: 'orange' }, db);
    assert.throws(() => saveProfile(user, { avatarFrame: frame.id }, db), /Kho quà/);
    assert.throws(() => saveProfile(user, { avatarFrame: 'unknown' }, db), /Khung ảnh/);
    assert.throws(() => redeemCoverReward(user, 10, frame.key, db, 'OTHER'), /không tồn tại/);
    const inventory = redeemCoverReward(user, 10, frame.key, db, 'FPT-DEV');
    assert.equal(canUseCoverItem('frame', frame.id, inventory, db), true);
    assert.equal(sampleClubBalance(inventory, 10), 200 - frame.cost);
    assert.equal(sampleClubBalance(redeemCoverReward(user, 10, frame.key, db, 'FPT-DEV'), 10), 200 - frame.cost);
    assert.equal(canUseCoverItem('frame', frame.id, readCoverInventory(other, db), db), false);
    saveProfile(user, { avatarFrame: frame.id }, db);
    saveProfile(user, { coverPreset: 'sunset' }, db);
    assert.equal(readProfile(user, db).profile.avatarFrame, frame.id);
    redeemCoverReward(user, 10, FPT_DEV_COMBOS[0].key, db, 'FPT-DEV');
    assert.equal(sampleClubBalance(readCoverInventory(user, db), 10), 0);
    saveProfile(user, { avatarFrame: 'none' }, db);
    assert.equal(readProfile(user, db).profile.coverPreset, 'sunset');
});

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
            coverShapeTransform: { x: 12, y: -30, scale: 75, rotation: 0 },
            coverText: { title: 'Xin chào', subtitle: '</>', color: '#45f089', size: 36 },
        },
        db,
    );
    const profile = readProfile(user, db).profile;
    assert.deepEqual(profile.coverShapeTransform, { x: 12, y: -30, scale: 75, rotation: 0 });
    assert.equal(profile.coverText.title, 'Xin chào');
    assert.equal(profile.coverBackgroundColor, 'forest');
    assert.equal(profile.coverText.eyebrow, 'THE EXPERIENCE IS YOURS.');
    assert.deepEqual(profile.coverText.fonts, { eyebrow: 'default', title: 'default', subtitle: 'default' });
    saveProfile(user, { coverText: { font: 'georgia', size: 240, x: 30, y: -15 } }, db);
    assert.deepEqual(readProfile(user, db).profile.coverText.fonts, {
        eyebrow: 'georgia',
        title: 'georgia',
        subtitle: 'georgia',
    });
    saveProfile(user, { coverText: { fonts: { title: 'arial', subtitle: 'courier' } } }, db);
    assert.deepEqual(readProfile(user, db).profile.coverText.fonts, {
        eyebrow: 'georgia',
        title: 'arial',
        subtitle: 'courier',
    });
    assert.equal(readProfile(user, db).profile.coverText.size, 240);
    assert.equal(readProfile(user, db).profile.coverText.x, 30);
    assert.equal(readProfile(user, db).profile.coverText.y, -15);
    assert.deepEqual(readProfile(user, db).profile.coverShapeTransform, { x: 12, y: -30, scale: 75, rotation: 0 });
    assert.throws(() => saveProfile(user, { coverText: { size: 241 } }, db), /Cài đặt chữ/);
    assert.throws(() => saveProfile(user, { coverText: { x: 101 } }, db), /Vị trí chữ/);
    saveProfile(user, { coverText: { visible: false }, coverPreset: 'forest' }, db);
    assert.equal(readProfile(user, db).profile.coverText.title, 'Xin chào');
    assert.equal(readProfile(user, db).profile.coverText.visible, false);
    assert.deepEqual(readProfile(user, db).profile.coverText.fonts, {
        eyebrow: 'georgia',
        title: 'arial',
        subtitle: 'courier',
    });
    assert.equal(readProfile(user, db).profile.coverShape, exclusive.id);
    assert.throws(
        () => saveProfile(user, { coverPreset: 'custom', coverBackgroundColor: 'fpt-dev-mint' }, db),
        /Kho quà/,
    );
    assert.throws(() => saveProfile(user, { coverShapeTransform: { scale: 401 } }, db), /kích thước/);
    assert.throws(() => saveProfile(user, { coverText: { color: 'red' } }, db), /Màu chữ/);
    assert.throws(() => saveProfile(user, { coverText: { font: 'unknown' } }, db), /Phông chữ/);
    assert.throws(() => saveProfile(user, { coverText: { fonts: { title: 'unknown' } } }, db), /Phông chữ/);
    assert.throws(() => saveProfile(user, { coverText: { title: 'x'.repeat(61) } }, db), /ký tự/);
});
