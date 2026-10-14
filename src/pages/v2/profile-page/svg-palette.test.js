import assert from 'node:assert/strict';
import test from 'node:test';
import { applySvgPalette, cropSvgAsset, decodeSvgAsset, encodeSvgAsset, normalizeSvgPalette } from './svg-palette.js';
import { publishClubShape, getClubCoverRewards, redeemCoverReward } from './cover-cosmetics.js';
import { publishClubGift } from './club-gifts.js';
import { saveProfile, readProfile } from '../profile-data.js';

const palette = { primary: '#123456', secondary: '#abcdef' };
const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><mask id="alpha"><rect width="200" height="200" fill="white"/><circle cx="100" cy="100" r="70" fill="black"/></mask></defs><path fill="#ff0000" stroke="#00ff00" d="M0 0h200v200z"/><path fill="none" stroke="#ff0000"/><circle fill="#0000ff"/></svg>';

test('SVG palette fills primary/secondary paints without changing alpha masks, none or extra colors', () => {
    const asset = encodeSvgAsset(svg);
    const recolored = decodeSvgAsset(applySvgPalette(asset, palette));
    assert.match(recolored, /fill="#123456" stroke="#abcdef"/);
    assert.match(recolored, /fill="none" stroke="#123456"/);
    assert.match(recolored, /circle fill="#0000ff"/);
    assert.match(recolored, /fill="white"/);
    assert.match(recolored, /fill="black"/);
    assert.equal(decodeSvgAsset(asset), svg);
    assert.equal(applySvgPalette(asset, null), asset);
    assert.equal(applySvgPalette('data:image/png;base64,aW1hZ2U=', palette), 'data:image/png;base64,aW1hZ2U=');
    assert.throws(() => normalizeSvgPalette({ primary: 'red', secondary: '#abcdef' }));
});

test('SVG tokens, inline styles, class styles and gradient stops accept palette colors', () => {
    const source =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" color="red"><style>.a{fill:var(--primary)} .b{stroke:var(--secondary)}</style><path style="fill:var(--primary);stroke:none"/><defs><linearGradient id="g"><stop stop-color="var(--primary)"/><stop stop-color="var(--secondary)"/></linearGradient></defs><rect fill="url(#g)"/></svg>';
    const colored = decodeSvgAsset(applySvgPalette(encodeSvgAsset(source), palette));
    assert.match(colored, /\.a\{fill:#123456\}/);
    assert.match(colored, /\.b\{stroke:#abcdef\}/);
    assert.match(colored, /stop-color="#abcdef"/);
    assert.match(colored, /fill="url\(#g\)"/);
    assert.equal((colored.match(/ color=/g) || []).length, 1);
});

test('circular SVG crop preserves vector paints and recoloring can still be applied after crop', async () => {
    const crop = cropSvgAsset(
        encodeSvgAsset(svg),
        { x: 20, y: 30, width: 100, height: 100 },
        { width: 512, height: 512 },
    );
    assert.equal(crop.type, 'image/svg+xml');
    const source = await crop.text();
    assert.match(source, /scale\(5\.12 5\.12\) translate\(-20 -30\)/);
    assert.match(source, /circle cx="256" cy="256" r="256"/);
    const colored = decodeSvgAsset(applySvgPalette(encodeSvgAsset(source), palette));
    assert.match(colored, /fill="#123456" stroke="#abcdef"/);
    assert.match(colored, /clip-path="url\(#crop-/);
});

test('SVG palette defaults and per-account follow-palette settings survive publishing and equipping', () => {
    const values = new Map(),
        db = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
    const base = { clubId: 'palette-club', label: 'SVG', cost: 0, assetUrl: encodeSvgAsset(svg), svgPalette: palette };
    const shape = publishClubShape(base, db);
    const frame = publishClubGift({ ...base, kind: 'frame', color: '#123456', recolor: false }, db);
    for (const gift of getClubCoverRewards('palette-club', db)) assert.deepEqual(gift.svgPalette, palette);
    const user = { id: 201, name: 'Student' };
    redeemCoverReward(user, 'palette-club', shape.key, db);
    redeemCoverReward(user, 'palette-club', frame.key, db);
    saveProfile(
        user,
        {
            coverShape: shape.id,
            avatarFrame: frame.id,
            coverShapeUsePalette: true,
            avatarFrameUsePalette: true,
            coverPreset: 'forest',
        },
        db,
    );
    saveProfile(user, { coverPreset: 'violet' }, db);
    const profile = readProfile(user, db).profile;
    assert.equal(profile.avatarFrameUsePalette, true);
    assert.equal(profile.coverShapeUsePalette, true);
    assert.equal(profile.coverPreset, 'violet');
    assert.notEqual(readProfile({ id: 202 }, db).profile.avatarFrame, frame.id);
    assert.throws(() => saveProfile(user, { avatarFrameUsePalette: 'yes' }, db));
});
