import test from 'node:test';
import assert from 'node:assert/strict';
import {
    customGradientColor,
    getGradient,
    isPaletteColor,
    paletteColorCss,
    gradientVector,
    canvasPaletteColor,
} from '../../components/media/color-palette.js';
import { normalizeInitialsDesign } from '../../components/media/initials-design.js';
import { publishClubGift } from './profile-page/club-gifts.js';
import { publishClubShape, redeemCoverReward, getClubCoverRewards } from './profile-page/cover-cosmetics.js';
import { encodeSvgAsset, decodeSvgAsset, applySvgPalette } from './profile-page/svg-palette.js';
import { frameAssetStyle } from './profile-page/avatar-frame-assets.js';
import { saveProfile, readProfile } from './profile-data.js';

const stops = [
    { color: '#ff0000', position: 0 },
    { color: '#00ff00', position: 35 },
    { color: '#0000ff', position: 100 },
];
const advanced = customGradientColor(90, stops);

test('custom club gradients preserve angle and unequal stops across CSS, canvas and SVG bindings', () => {
    assert.equal(getGradient(advanced).angle, 90);
    assert.deepEqual(getGradient(advanced).stops, stops);
    assert.equal(paletteColorCss(advanced), 'linear-gradient(90deg, #ff0000 0%, #00ff00 35%, #0000ff 100%)');
    assert.equal(isPaletteColor(advanced, true), true);
    const calls = [];
    canvasPaletteColor(
        {
            createLinearGradient: (...vector) => {
                calls.push(vector);
                return { addColorStop: (...stop) => calls.push(stop) };
            },
        },
        advanced,
        100,
    );
    assert.ok(Math.abs(calls[0][0]) < 0.001);
    assert.ok(Math.abs(calls[0][2] - 100) < 0.001);
    assert.deepEqual(calls.slice(1), [
        [0, '#ff0000'],
        [0.35, '#00ff00'],
        [1, '#0000ff'],
    ]);
    const vector = gradientVector(0, 1200, 300);
    assert.deepEqual(vector, { x1: 600, y1: 300, x2: 600, y2: 0 });
    const svg = encodeSvgAsset(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path fill="var(--primary)" stroke="var(--secondary)" d="M0 0h100v100z"/></svg>',
    );
    const colored = decodeSvgAsset(applySvgPalette(svg, { primary: advanced, secondary: 'gradient:forest' }));
    assert.match(colored, /fill="url\(#clubhub-gradient-primary\)"/);
    assert.match(colored, /offset="35%" stop-color="#00ff00"/);
    assert.match(colored, /stroke="url\(#clubhub-gradient-secondary\)"/);
    assert.equal(
        frameAssetStyle({ assetUrl: 'data:image/png;base64,aW1hZ2U=', color: advanced }).background,
        paletteColorCss(advanced),
    );
});

test('profile accepts basic gradients and custom solid colors while custom gradients are club authored', () => {
    assert.equal(isPaletteColor('gradient:ocean'), true);
    assert.equal(isPaletteColor('#123456'), true);
    assert.equal(isPaletteColor(advanced), false);
    // Array callback indices must not accidentally enable the advanced mode.
    assert.equal(['#123456', advanced].every(isPaletteColor), false);
    assert.throws(() => normalizeInitialsDesign({ color: advanced }));
    const db = store(),
        user = { id: 301, name: 'Student' };
    assert.throws(() => saveProfile(user, { coverBackgroundPaint: advanced }, db));
    assert.throws(() => saveProfile(user, { coverText: { color: advanced } }, db));
    saveProfile(user, { coverBackgroundPaint: 'gradient:ocean', coverText: { color: '#123456' } }, db);
    assert.equal(readProfile(user, db).profile.coverBackgroundPaint, 'gradient:ocean');
});

test('reward palettes, frame tint and shape SVG roles accept advanced gradients and retain ownership checks', () => {
    const db = store(),
        user = { id: 302, name: 'Student' };
    const base = { clubId: 'gradient-club', label: 'Gradient', cost: 0 };
    const palette = publishClubGift(
        {
            ...base,
            kind: 'color',
            background: advanced,
            secondary: 'gradient:forest',
            accent: advanced,
            ink: '#123456',
        },
        db,
    );
    const frame = publishClubGift(
        { ...base, kind: 'frame', assetUrl: 'data:image/png;base64,aW1hZ2U=', color: advanced, recolor: true },
        db,
    );
    const shape = publishClubShape(
        {
            ...base,
            assetUrl: encodeSvgAsset(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="var(--primary)"/></svg>',
            ),
            svgPalette: { primary: advanced, secondary: 'gradient:forest' },
        },
        db,
    );
    assert.equal(getClubCoverRewards('gradient-club', db)[0].svgPalette.primary, advanced);
    assert.throws(() => saveProfile(user, { coverPreset: palette.id }, db), /Kho quà/);
    for (const gift of [palette, frame, shape]) redeemCoverReward(user, 'gradient-club', gift.key, db);
    saveProfile(
        user,
        { coverPreset: palette.id, coverShape: shape.id, avatarFrame: frame.id, coverShapeUsePalette: true },
        db,
    );
    assert.equal(readProfile(user, db).profile.coverPreset, palette.id);
    assert.equal(readProfile(user, db).profile.coverShapeUsePalette, true);
});

test('gradient definitions reject invalid angles, unordered positions, non-solid stops and excessive stop counts', () => {
    assert.throws(() => customGradientColor(361, stops));
    assert.throws(() => customGradientColor(0, [...stops].reverse()));
    assert.throws(() => customGradientColor(0, [{ color: 'gradient:ocean', position: 0 }, stops[2]]));
    assert.throws(() =>
        customGradientColor(
            0,
            Array.from({ length: 9 }, (_, index) => ({ color: '#ffffff', position: index * 10 })),
        ),
    );
    assert.equal(getGradient('gradient:custom:invalid'), undefined);
});

function store() {
    const values = new Map();
    return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}
