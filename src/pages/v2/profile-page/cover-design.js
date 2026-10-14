import { isPaletteColor } from '../../../components/media/color-palette.js';
import { normalizeTextParagraphs } from '../../../components/media/text-paragraphs.js';

export const DEFAULT_COVER_TRANSFORM = { x: 0, y: 0, scale: 100, rotation: 0 };
export const DEFAULT_SHAPE_HSL = { hue: 0, saturation: 100, lightness: 0 };
export const SHAPE_STAMP_SIZE = 240;
export const PROFILE_COVER_SIZE = { width: 1200, height: 300 };
export const COVER_FONTS = [
    { id: 'default', label: 'Mặc định', family: 'Inter, sans-serif' },
    { id: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
    { id: 'arial', label: 'Arial', family: 'Arial, sans-serif' },
    { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
    { id: 'times', label: 'Times New Roman', family: '"Times New Roman", serif' },
    { id: 'courier', label: 'Courier New', family: '"Courier New", monospace' },
];
export const DEFAULT_COVER_TEXT = {
    visible: true,
    eyebrow: 'THE EXPERIENCE IS YOURS.',
    title: 'Make your time',
    subtitle: 'mean something.',
    color: '',
    fonts: { eyebrow: 'default', title: 'default', subtitle: 'default' },
    size: 42,
    x: 0,
    y: 0,
};

export function normalizeCoverTransform(value = {}, fallback = DEFAULT_COVER_TRANSFORM) {
    const next = { ...DEFAULT_COVER_TRANSFORM, ...fallback, ...value };
    for (const [field, min, max] of [
        ['x', -100, 100],
        ['y', -100, 100],
        ['scale', 10, 400],
        ['rotation', -180, 180],
    ]) {
        if (!Number.isFinite(next[field]) || next[field] < min || next[field] > max)
            throw new Error('Vị trí hoặc kích thước shape không hợp lệ.');
    }
    return { x: next.x, y: next.y, scale: next.scale, rotation: next.rotation };
}

export function normalizeShapeHsl(value = {}, fallback = DEFAULT_SHAPE_HSL) {
    const next = { ...DEFAULT_SHAPE_HSL, ...fallback, ...value };
    for (const [key, min, max] of [
        ['hue', -180, 180],
        ['saturation', 0, 200],
        ['lightness', -100, 100],
    ]) {
        if (!Number.isFinite(next[key]) || next[key] < min || next[key] > max)
            throw new Error('HSL của shape không hợp lệ.');
    }
    return { hue: next.hue, saturation: next.saturation, lightness: next.lightness };
}

export function shapeStampTransform(value = {}) {
    const layout = normalizeCoverTransform(value);
    return `translate(${600 + layout.x * 12} ${150 + layout.y * 3}) rotate(${layout.rotation}) scale(${layout.scale / 100})`;
}

export function normalizeCoverText(value = {}, fallback = DEFAULT_COVER_TEXT) {
    const next = { ...DEFAULT_COVER_TEXT, ...fallback, ...value };
    const fonts = {};
    for (const field of ['eyebrow', 'title', 'subtitle']) {
        fonts[field] = value.fonts?.[field] ?? value.font ?? fallback.fonts?.[field] ?? fallback.font ?? 'default';
        if (!COVER_FONTS.some((font) => font.id === fonts[field])) throw new Error('Phông chữ ảnh bìa không hợp lệ.');
    }
    if (typeof next.visible !== 'boolean' || !Number.isFinite(next.size) || next.size < 24 || next.size > 240)
        throw new Error('Cài đặt chữ ảnh bìa không hợp lệ.');
    for (const axis of ['x', 'y']) {
        if (!Number.isFinite(next[axis]) || next[axis] < -100 || next[axis] > 100)
            throw new Error('Vị trí chữ ảnh bìa không hợp lệ.');
    }
    if (typeof next.color !== 'string' || (next.color && !isPaletteColor(next.color)))
        throw new Error('Màu chữ không hợp lệ.');
    const lines = {};
    for (const [field, limit] of [
        ['eyebrow', 80],
        ['title', 60],
        ['subtitle', 60],
    ]) {
        if (typeof next[field] !== 'string' || next[field].length > limit)
            throw new Error(`Nội dung chữ ảnh bìa tối đa ${limit} ký tự.`);
        lines[field] = next[field];
    }
    if (
        next.sizes &&
        ['eyebrow', 'title', 'subtitle'].some(
            (field) =>
                next.sizes[field] != null &&
                (!Number.isFinite(next.sizes[field]) || next.sizes[field] < 8 || next.sizes[field] > 240),
        )
    )
        throw new Error('Cỡ chữ từng dòng không hợp lệ.');
    let paragraphs = next.paragraphs;
    if (paragraphs !== undefined) {
        paragraphs = normalizeTextParagraphs(paragraphs);
        if (value.paragraphs === undefined && fallback.paragraphs)
            paragraphs = paragraphs.map((paragraph) => {
                const field = paragraph.id;
                if (!['eyebrow', 'title', 'subtitle'].includes(field)) return paragraph;
                return {
                    ...paragraph,
                    ...(value[field] !== undefined ? { text: value[field] } : {}),
                    ...(value.font || value.fonts?.[field] ? { font: fonts[field] } : {}),
                    ...(value.sizes?.[field] != null || (value.size != null && field !== 'eyebrow')
                        ? { size: value.sizes?.[field] ?? value.size }
                        : {}),
                };
            });
    }
    return {
        ...lines,
        visible: next.visible,
        color: next.color,
        fonts,
        size: next.size,
        x: next.x,
        y: next.y,
        ...(next.sizes ? { sizes: next.sizes } : {}),
        ...(paragraphs !== undefined ? { paragraphs } : {}),
    };
}

export function coverTextParagraphs(value = DEFAULT_COVER_TEXT) {
    if (value.paragraphs) return normalizeTextParagraphs(value.paragraphs);
    return normalizeTextParagraphs(
        ['eyebrow', 'title', 'subtitle'].map((field, index) => ({
            id: field,
            text: value[field],
            font:
                value.fonts?.[field] === 'default' && field === 'subtitle'
                    ? 'georgia'
                    : value.fonts?.[field] || 'default',
            size: value.sizes?.[field] || (index ? value.size : 11),
            x: 40 / 12 + value.x,
            y: [75, 136, 185][index] / 3 + value.y,
            color: value.color || '',
            bold: field === 'title',
            italic: field === 'subtitle',
            opacity: 1,
        })),
    );
}
