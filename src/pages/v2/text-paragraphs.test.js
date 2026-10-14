import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeTextParagraphs,
    moveTextParagraph,
    drawTextParagraphs,
} from '../../components/media/text-paragraphs.js';
import { normalizeCoverText, coverTextParagraphs } from './profile-page/cover-design.js';
import {
    defaultGraphicBanner,
    normalizeGraphicBanner,
    graphicTextParagraphs,
    saveGraphicBanner,
    readGraphicBanner,
} from '../../components/media/graphic-banner.js';
import { saveProfile, readProfile } from './profile-data.js';
import { customGradientColor } from '../../components/media/color-palette.js';

const paragraphs = normalizeTextParagraphs([
    { id: 'title', text: 'Tiêu đề', size: 64, font: 'georgia', x: 12, y: 40, bold: true },
    { id: 'custom', text: 'Dòng một\nDòng hai', size: 22, font: 'courier', x: 60, y: 65, color: 'gradient:ocean' },
]);

test('legacy cover and club text become independent paragraphs with their existing fonts and sizes', () => {
    const profile = coverTextParagraphs(
        normalizeCoverText({ size: 48, fonts: { title: 'arial' }, sizes: { eyebrow: 16, subtitle: 30 } }),
    );
    assert.deepEqual(
        profile.map((item) => item.size),
        [16, 48, 30],
    );
    assert.equal(profile[1].font, 'arial');
    assert.equal(profile[2].font, 'georgia');
    const club = graphicTextParagraphs(normalizeGraphicBanner(defaultGraphicBanner()));
    assert.deepEqual(
        club.map((item) => item.size),
        [12, 38, 38],
    );
    assert.equal(club[0].opacity, 0.65);
    assert.equal(club[1].x * 12, 46);
});

test('dragging a paragraph moves only that paragraph and matches cover-relative coordinates', () => {
    const next = moveTextParagraph(paragraphs, 'custom', 120, -30, 1200, 300);
    assert.deepEqual(next[0], paragraphs[0]);
    assert.equal(next[1].x, 70);
    assert.equal(next[1].y, 55);
    assert.equal(paragraphs[1].x, 60);
    const edge = moveTextParagraph(paragraphs, 'title', -100000, 100000, 1200, 300);
    assert.equal(edge[0].x, -200);
    assert.equal(edge[0].y, 200);
});

test('profile saves arbitrary paragraph text, individual fonts/sizes and positions per account', () => {
    const db = storage(),
        user = { id: 401, name: 'Student' };
    saveProfile(user, { coverText: { paragraphs } }, db);
    saveProfile(user, { headline: 'Updated', coverPreset: 'forest' }, db);
    assert.deepEqual(readProfile(user, db).profile.coverText.paragraphs, paragraphs);
    saveProfile(user, { coverText: { title: 'Legacy update' } }, db);
    assert.equal(readProfile(user, db).profile.coverText.paragraphs[0].text, 'Legacy update');
    assert.equal(readProfile(user, db).profile.coverText.paragraphs[1].text, 'Dòng một\nDòng hai');
    assert.equal(readProfile({ id: 402 }, db).profile.coverText?.paragraphs, undefined);
    saveProfile(user, { coverText: { paragraphs: [] } }, db);
    assert.deepEqual(readProfile(user, db).profile.coverText.paragraphs, []);
});

test('club banner paragraphs round trip with saved image and canvas draws each font and newline at the same coordinates', () => {
    const db = storage();
    const design = normalizeGraphicBanner({ ...defaultGraphicBanner(), paragraphs });
    saveGraphicBanner('club:paragraphs', 'https://example.com/cover.png', design, db);
    assert.deepEqual(readGraphicBanner('club:paragraphs', 'https://example.com/cover.png', db).paragraphs, paragraphs);
    const calls = [],
        context = {
            save() {},
            restore() {},
            fillText(text, x, y) {
                calls.push({ text, x, y, font: this.font, paint: this.fillStyle });
            },
        };
    drawTextParagraphs(context, paragraphs, { width: 1200, height: 300 }, '#ffffff', (paint) => paint);
    assert.equal(calls[0].font, '700 64px Georgia, serif');
    assert.deepEqual(
        calls.slice(1).map(({ text, x, y }) => ({ text, x, y })),
        [
            { text: 'Dòng một', x: 720, y: 195 },
            { text: 'Dòng hai', x: 720, y: 222.5 },
        ],
    );
    assert.equal(calls[1].font, '400 22px "Courier New", monospace');
});

test('paragraph validation rejects duplicate IDs, invalid fonts, dimensions and colors, while club supports advanced colors', () => {
    assert.throws(() => normalizeTextParagraphs([paragraphs[0], paragraphs[0]]));
    assert.throws(() => normalizeTextParagraphs([{ ...paragraphs[0], font: 'unknown' }]));
    assert.throws(() => normalizeTextParagraphs([{ ...paragraphs[0], size: 0 }]));
    assert.throws(() => normalizeTextParagraphs([{ ...paragraphs[0], text: 'x'.repeat(1001) }]));
    assert.throws(() =>
        normalizeTextParagraphs(Array.from({ length: 13 }, (_, index) => ({ ...paragraphs[0], id: `text-${index}` }))),
    );
    const paint = customGradientColor(45, [
        { color: '#ffffff', position: 0 },
        { color: '#000000', position: 100 },
    ]);
    assert.throws(() => normalizeCoverText({ paragraphs: [{ ...paragraphs[0], color: paint }] }));
    assert.equal(
        normalizeGraphicBanner({ paragraphs: [{ ...paragraphs[0], color: paint }] }).paragraphs[0].color,
        paint,
    );
});

function storage() {
    const values = new Map();
    return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}
