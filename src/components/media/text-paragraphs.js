import { INITIALS_FONTS } from './initials-design.js';
import { isPaletteColor } from './color-palette.js';

export const PARAGRAPH_FONTS = [{ id: 'default', label: 'Mặc định', family: 'Inter, sans-serif' }, ...INITIALS_FONTS];
export const MAX_TEXT_PARAGRAPHS = 12;
export function normalizeTextParagraphs(values, advanced = false) {
    if (!Array.isArray(values) || values.length > MAX_TEXT_PARAGRAPHS)
        throw new Error('Ảnh bìa có tối đa 12 đoạn chữ.');
    const ids = new Set();
    return values.map((value) => {
        const next = {
            font: 'inter',
            size: 32,
            x: 10,
            y: 50,
            color: '',
            bold: false,
            italic: false,
            opacity: 1,
            ...value,
        };
        if (typeof next.id !== 'string' || !/^[\w-]{1,64}$/.test(next.id) || ids.has(next.id))
            throw new Error('Mã đoạn chữ không hợp lệ hoặc trùng nhau.');
        ids.add(next.id);
        if (
            typeof next.text !== 'string' ||
            next.text.length > 1000 ||
            !PARAGRAPH_FONTS.some((font) => font.id === next.font)
        )
            throw new Error('Đoạn chữ tối đa 1.000 ký tự và cần phông chữ hợp lệ.');
        for (const [key, min, max] of [
            ['size', 8, 240],
            ['x', -200, 200],
            ['y', -200, 200],
            ['opacity', 0, 1],
        ])
            if (!Number.isFinite(next[key]) || next[key] < min || next[key] > max)
                throw new Error('Cỡ chữ hoặc vị trí đoạn chữ không hợp lệ.');
        if (
            typeof next.bold !== 'boolean' ||
            typeof next.italic !== 'boolean' ||
            typeof next.color !== 'string' ||
            (next.color && !isPaletteColor(next.color, advanced))
        )
            throw new Error('Màu hoặc kiểu chữ không hợp lệ.');
        return {
            id: next.id,
            text: next.text,
            font: next.font,
            size: next.size,
            x: next.x,
            y: next.y,
            color: next.color,
            bold: next.bold,
            italic: next.italic,
            opacity: next.opacity,
        };
    });
}
export function createTextParagraph() {
    return {
        id: `text-${crypto.randomUUID()}`,
        text: 'Đoạn chữ mới',
        font: 'inter',
        size: 32,
        x: 10,
        y: 50,
        color: '',
        bold: false,
        italic: false,
        opacity: 1,
    };
}
export function moveTextParagraph(values, id, dx, dy, width, height) {
    return values.map((paragraph) =>
        paragraph.id !== id
            ? paragraph
            : {
                  ...paragraph,
                  x: Math.max(-200, Math.min(200, paragraph.x + (dx / width) * 100)),
                  y: Math.max(-200, Math.min(200, paragraph.y + (dy / height) * 100)),
              },
    );
}
export function drawTextParagraphs(context, paragraphs, size, inheritedColor, paint) {
    for (const paragraph of paragraphs) {
        context.save();
        context.globalAlpha = paragraph.opacity;
        context.fillStyle = paint(paragraph.color || inheritedColor);
        context.font = `${paragraph.italic ? 'italic ' : ''}${paragraph.bold ? '700' : '400'} ${paragraph.size}px ${PARAGRAPH_FONTS.find((font) => font.id === paragraph.font).family}`;
        paragraph.text
            .split('\n')
            .forEach((line, index) =>
                context.fillText(
                    line,
                    (paragraph.x * size.width) / 100,
                    (paragraph.y * size.height) / 100 + index * paragraph.size * 1.25,
                ),
            );
        context.restore();
    }
}
