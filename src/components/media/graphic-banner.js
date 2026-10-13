import { INITIALS_FONTS } from './initials-design.js';
import { getGradient, isPaletteColor } from './color-palette.js';

export const CLUB_BANNER_SIZE = Object.freeze({ width: 1200, height: 300 });
export const ACTIVITY_BANNER_SIZE = Object.freeze({ width: 1200, height: 500 });
export const bannerSize = (kind) => kind === 'activity' ? ACTIVITY_BANNER_SIZE : CLUB_BANNER_SIZE;
export const bannerLayout = (size = CLUB_BANNER_SIZE) => ({
    xStep: size.width / 100, yStep: size.height / 100,
    cx: size.width / 2, cy: size.height / 2,
    textOffset: (size.height - 300) / 2,
    textScale: size.height > 400 ? 1.15 : 1,
    shapeScale: size.height > 400 ? 1.35 : 1,
});

export function defaultGraphicBanner(kind = 'club', identity = '') {
    const palette = [...String(identity)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
    return {
        eyebrow: kind === 'activity' ? 'CLUBHUB / EXPERIENCES' : 'CLUBHUB / COMMUNITY',
        title: kind === 'activity' ? 'Một hoạt động.' : 'Một cộng đồng.',
        subtitle: kind === 'activity' ? 'Nhiều điều đáng nhớ.' : 'Cùng nhau trưởng thành.',
        background:
            kind === 'activity'
                ? 'gradient:community'
                : ['gradient:community', 'gradient:creative', 'gradient:warm'][palette],
        color: '#ffffff',
        font: 'inter',
        decoration: 'circles',
        size: 38,
        visible: true,
        fonts: { eyebrow: 'inter', title: 'inter', subtitle: 'inter' },
        textX: 0,
        textY: 0,
        shapeX: 0,
        shapeY: 0,
        shapeScale: 100,
    };
}
export function normalizeGraphicBanner(value) {
    const next = { ...defaultGraphicBanner(), ...value };
    next.fonts = Object.fromEntries(
        ['eyebrow', 'title', 'subtitle'].map((field) => [field, value?.fonts?.[field] ?? value?.font ?? 'inter']),
    );
    if (
        typeof next.visible !== 'boolean' ||
        Object.values(next.fonts).some((id) => !INITIALS_FONTS.some((font) => font.id === id))
    )
        throw new Error('Cài đặt chữ banner không hợp lệ.');
    for (const [key, min, max] of [
        ['textX', -100, 100],
        ['textY', -100, 100],
        ['shapeX', -50, 50],
        ['shapeY', -100, 100],
        ['shapeScale', 25, 200],
    ]) {
        if (!Number.isFinite(next[key]) || next[key] < min || next[key] > max)
            throw new Error('Vị trí hoặc kích thước banner không hợp lệ.');
    }
    for (const field of ['eyebrow', 'title', 'subtitle']) {
        if (typeof next[field] !== 'string' || next[field].length > 80)
            throw new Error('Mỗi dòng banner tối đa 80 ký tự.');
    }
    if (
        ![next.background, next.color].every(isPaletteColor) ||
        !INITIALS_FONTS.some((font) => font.id === next.font) ||
        !['none', 'circles', 'ribbons', 'waves'].includes(next.decoration) ||
        !Number.isFinite(next.size) ||
        next.size < 24 ||
        next.size > 64
    )
        throw new Error('Thiết kế banner không hợp lệ.');
    return next;
}
export function bannerPaint(value, size = CLUB_BANNER_SIZE) {
    const gradient = getGradient(value);
    if (!gradient) return { color: value };
    const angle = ['gradient:community', 'gradient:creative', 'gradient:warm'].includes(value) ? 125 : 135;
    const dx = Math.sin((angle * Math.PI) / 180),
        dy = -Math.cos((angle * Math.PI) / 180);
    const length = size.width * Math.abs(dx) + size.height * Math.abs(dy);
    return {
        colors: gradient.colors,
        x1: size.width / 2 - (dx * length) / 2,
        y1: size.height / 2 - (dy * length) / 2,
        x2: size.width / 2 + (dx * length) / 2,
        y2: size.height / 2 + (dy * length) / 2,
    };
}
export const BANNER_PATHS = {
    ribbons: ['M850 0h150L780 300H630z', 'M1090 0h150l-220 300H870z'],
    waves: ['M680 300C780 40 900 60 1040 170s100 110 160-30v160z', 'M790 300c150-180 240-130 350-40s40 10 60-30v70z'],
};
export function moveBannerLayer(design, layer, deltaX, deltaY, size = CLUB_BANNER_SIZE) {
    const prefix = layer === 'shape' ? 'shape' : 'text';
    const xLimit = layer === 'shape' ? 50 : 100;
    return {
        ...design,
        [`${prefix}X`]: Math.max(-xLimit, Math.min(xLimit, Math.round(design[`${prefix}X`] + deltaX / (size.width / 100)))),
        [`${prefix}Y`]: Math.max(-100, Math.min(100, Math.round(design[`${prefix}Y`] + deltaY / (size.height / 100)))),
    };
}
export async function createGraphicBannerFile(value, size = CLUB_BANNER_SIZE) {
    const layout = bannerLayout(size);
    const design = normalizeGraphicBanner(value);
    const family = (field) => INITIALS_FONTS.find((font) => font.id === design.fonts[field]).family;
    await Promise.all(
        ['eyebrow', 'title', 'subtitle'].map((field) =>
            document.fonts.load(
                `${field === 'eyebrow' ? 400 : 700} ${(field === 'eyebrow' ? 12 : design.size) * layout.textScale}px ${family(field)}`,
                design[field],
            ),
        ),
    );
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Không thể tạo banner.');
    const paint = (value) => {
        const spec = bannerPaint(value, size);
        if (spec.color) return spec.color;
        const gradient = context.createLinearGradient(spec.x1, spec.y1, spec.x2, spec.y2);
        spec.colors.forEach((color, index) => gradient.addColorStop(index / (spec.colors.length - 1), color));
        return gradient;
    };
    context.fillStyle = paint(design.background);
    context.fillRect(0, 0, size.width, size.height);
    context.save();
    context.translate(design.shapeX * layout.xStep + layout.cx, design.shapeY * layout.yStep + layout.cy);
    context.scale(design.shapeScale / 100 * layout.shapeScale, design.shapeScale / 100 * layout.shapeScale);
    context.translate(-600, -150);
    if (design.decoration === 'circles') {
        for (const [x, y, radius, opacity] of [
            [960, 30, 196, 0.07],
            [1020, 90, 257, 0.04],
        ]) {
            context.fillStyle = `rgba(255,255,255,${opacity})`;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
    } else if (BANNER_PATHS[design.decoration]) {
        context.fillStyle = 'rgba(255,255,255,.09)';
        BANNER_PATHS[design.decoration].forEach((path) => context.fill(new Path2D(path)));
    }
    context.restore();
    if (design.visible) {
        context.translate(design.textX * layout.xStep, design.textY * layout.yStep + layout.textOffset);
        context.fillStyle = paint(design.color);
        context.globalAlpha = 0.65;
        context.font = `400 ${12 * layout.textScale}px ${family('eyebrow')}`;
        context.fillText(design.eyebrow, 46, 53);
        context.globalAlpha = 1;
        context.font = `700 ${design.size * layout.textScale}px ${family('title')}`;
        context.fillText(design.title, 46, 122);
        context.font = `700 ${design.size * layout.textScale}px ${family('subtitle')}`;
        context.fillText(design.subtitle, 46, 122 + design.size * layout.textScale * 1.2);
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Không thể tạo banner.');
    return new File([blob], 'graphic-banner.png', { type: 'image/png' });
}
export function readGraphicBanner(key, imageUrl, storage = globalThis.localStorage) {
    if (!key) return null;
    try {
        const record = JSON.parse(storage?.getItem(key));
        return record?.imageUrl === imageUrl ? normalizeGraphicBanner(record.design) : null;
    } catch {
        return null;
    }
}
export function saveGraphicBanner(key, imageUrl, design, storage = globalThis.localStorage) {
    if (!key) return;
    try {
        storage?.setItem(key, JSON.stringify({ imageUrl, design: normalizeGraphicBanner(design) }));
    } catch {
        /* The uploaded image remains authoritative. */
    }
}
