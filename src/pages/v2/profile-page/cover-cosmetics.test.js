import assert from 'node:assert/strict';
import test from 'node:test';
import {
    COVER_COLORS,
    COVER_SHAPES,
    getCoverColors,
    getCoverShapes,
    getAvatarFrames,
    readCoverInventory,
    canUseCoverItem,
} from './cover-cosmetics.js';
import { readProfile, saveProfile, profileStorageKey } from '../profile-data.js';
import { acceptServerCosmetics, clearServerCosmetics } from '../../../services/server-cosmetics-cache.js';
import { initialsDesignStyle, initialsTextStyle } from '../../../components/media/initials-design.js';
import { normalizeCoverTransform, normalizeShapeHsl, shapeStampTransform } from './cover-design.js';
import { isFrameAssetUrl, readCosmeticDesignFile, MAX_COSMETIC_FILE_BYTES } from './avatar-frame-assets.js';

function storage() {
    const values = new Map();
    return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}
const item = (id, kind, definition) => ({
    cosmetic: { cosmeticId: id, kind, issuerClubId: 10, label: kind, definition },
});

test('retired local cosmetic selections fall back to free designs without losing authored profile fields', () => {
    const db = storage(),
        user = { id: 5006, name: 'Student' };
    saveProfile(
        user,
        {
            displayName: 'Tên đã sửa',
            about: 'Giới thiệu đã lưu',
            coverText: { title: 'Cover cá nhân' },
            personal: { phoneNumber: '0901234567' },
        },
        db,
    );
    const key = profileStorageKey(user);
    const saved = JSON.parse(db.getItem(key));
    Object.assign(saved.profile, {
        coverPreset: 'fpt-dev-mint',
        coverBackgroundColor: 'fpt-dev-mint',
        coverShape: 'club-retired-local',
        avatarFrame: 'fpt-dev-circuit-frame',
    });
    db.setItem(key, JSON.stringify(saved));
    const before = db.getItem(key);
    const restored = readProfile(user, db);
    assert.equal(restored.profile.displayName, 'Tên đã sửa');
    assert.equal(restored.profile.about, 'Giới thiệu đã lưu');
    assert.equal(restored.profile.coverText.title, 'Cover cá nhân');
    assert.equal(restored.personal.phoneNumber, '0901234567');
    assert.equal(restored.profile.coverPreset, 'default');
    assert.equal(restored.profile.coverShape, 'petals');
    assert.equal(restored.profile.avatarFrame, 'none');
    assert.equal(db.getItem(key), before, 'reading retired choices does not rewrite storage');
    saveProfile(user, { headline: 'Cập nhật mới' }, db);
    assert.equal(readProfile(user, db).profile.displayName, 'Tên đã sửa');
    assert.equal(readCoverInventory(user).source, 'SERVER_UNAVAILABLE');
});

test('old local wallets, gift catalogs and ownership cannot grant cosmetics or manufacture a balance', () => {
    const db = storage(),
        user = { id: 5001 };
    db.setItem(
        'clubhub:v2:cover-rewards:5001',
        JSON.stringify({ version: 1, owned: ['shape:forged'], wallets: { 10: 200 } }),
    );
    db.setItem(
        'clubhub:v2:club-cover-shapes:1',
        JSON.stringify([
            { id: 'forged', kind: 'shape', clubId: 10, cost: 0, assetUrl: 'https://example.test/badge.png' },
        ]),
    );
    assert.deepEqual(readCoverInventory(user, db), { owned: [], wallets: {}, source: 'SERVER_UNAVAILABLE' });
    assert.equal(
        getCoverShapes(db).some((x) => x.id === 'forged'),
        false,
    );
    assert.equal(
        getCoverColors(db).some((x) => x.id.startsWith('fpt-dev-')),
        false,
    );
    assert.equal(
        getAvatarFrames(db).some((x) => x.id.startsWith('fpt-dev-')),
        false,
    );
    for (const color of COVER_COLORS) assert.equal(canUseCoverItem('color', color.id, readCoverInventory(user)), true);
    for (const shape of COVER_SHAPES) assert.equal(canUseCoverItem('shape', shape.id, readCoverInventory(user)), true);
});

test('server-owned shapes, colors and frames equip only for their owner and are revoked when the inventory is refreshed', () => {
    const db = storage(),
        user = { id: 5002 },
        other = { id: 5003 };
    const entries = [
        item('server-shape', 'SHAPE', { assetUrl: 'https://example.test/badge.png' }),
        item('server-frame', 'FRAME', { assetUrl: 'https://example.test/frame.png' }),
        item('server-color', 'COLOR', {
            background: '#112233',
            secondary: '#445566',
            accent: '#778899',
            ink: '#aabbcc',
        }),
    ];
    acceptServerCosmetics(other.id, entries);
    assert.throws(() => saveProfile(user, { coverShape: 'server-shape' }, db), /Kho quà/);
    acceptServerCosmetics(user.id, entries);
    assert.deepEqual(readCoverInventory(user).owned, [
        'shape:server-shape',
        'frame:server-frame',
        'color:server-color',
    ]);
    saveProfile(user, { coverShape: 'server-shape', avatarFrame: 'server-frame', coverPreset: 'server-color' }, db);
    assert.equal(readProfile(user, db).profile.coverShape, 'server-shape');
    acceptServerCosmetics(user.id, []);
    assert.equal(canUseCoverItem('shape', 'server-shape', readCoverInventory(user)), false);
    assert.throws(() => saveProfile(user, { headline: 'Refresh' }, db), /Kho quà/);
    clearServerCosmetics(other.id);
    assert.equal(readCoverInventory(other).source, 'SERVER_UNAVAILABLE');
});

test('server badge transforms, HSL and text survive profile edits without granting another account ownership', () => {
    const db = storage(),
        user = { id: 5004 };
    acceptServerCosmetics(user.id, [item('badge-transform', 'SHAPE', { assetUrl: 'https://example.test/badge.png' })]);
    const transform = { x: -80, y: 60, scale: 350, rotation: -135 };
    const hsl = { hue: -45, saturation: 80, lightness: 30 };
    saveProfile(
        user,
        {
            coverShape: 'badge-transform',
            coverShapeTransform: transform,
            coverShapeHsl: hsl,
            coverText: { title: 'Xin chào' },
            coverPreset: 'forest',
        },
        db,
    );
    saveProfile(user, { coverPreset: 'violet' }, db);
    assert.deepEqual(readProfile(user, db).profile.coverShapeTransform, transform);
    assert.deepEqual(readProfile(user, db).profile.coverShapeHsl, hsl);
    assert.equal(readProfile(user, db).profile.coverText.title, 'Xin chào');
    assert.throws(() => saveProfile({ id: 5005 }, { coverShape: 'badge-transform' }, db), /Kho quà/);
    assert.deepEqual(normalizeShapeHsl(), { hue: 0, saturation: 100, lightness: 0 });
    assert.equal(
        shapeStampTransform({ x: 25, y: -20, scale: 50, rotation: 90 }),
        'translate(900 90) rotate(90) scale(0.5)',
    );
    assert.throws(() => saveProfile(user, { coverShapeTransform: { rotation: 181 } }, db));
    assert.throws(() => saveProfile(user, { coverShapeHsl: { saturation: 201 } }, db), /HSL/);
});

test('cosmetic design upload validation still rejects oversized files and unsupported formats', async () => {
    assert.equal(isFrameAssetUrl('https://example.com/frame.svg'), false);
    assert.equal(isFrameAssetUrl('data:image/svg+xml;base64,invalid"url'), false);
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

test('hidden shape retains selected design and transform through a profile save', () => {
    const db = storage();
    const user = { id: 997, name: 'Nguyễn An' };
    const transform = { x: 12, y: -8, scale: 85, rotation: 10, hidden: true };
    saveProfile(user, { coverShape: 'petals', coverShapeTransform: transform }, db);
    const profile = readProfile(user, db).profile;
    assert.equal(profile.coverShape, 'petals');
    assert.deepEqual(profile.coverShapeTransform, transform);
    assert.throws(() => normalizeCoverTransform({ hidden: 'yes' }));
});
