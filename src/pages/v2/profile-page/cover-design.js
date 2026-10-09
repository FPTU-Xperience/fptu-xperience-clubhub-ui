export const DEFAULT_COVER_TRANSFORM = { x: 0, y: 0, scale: 100 };
export const DEFAULT_COVER_TEXT = {
    visible: true,
    eyebrow: 'THE EXPERIENCE IS YOURS.',
    title: 'Make your time',
    subtitle: 'mean something.',
    color: '',
    size: 42,
    x: 0,
    y: 0,
};

export function normalizeCoverTransform(value = {}, fallback = DEFAULT_COVER_TRANSFORM) {
    const next = { ...DEFAULT_COVER_TRANSFORM, ...fallback, ...value };
    for (const [field, min, max] of [
        ['x', -50, 50],
        ['y', -100, 100],
        ['scale', 25, 200],
    ]) {
        if (!Number.isFinite(next[field]) || next[field] < min || next[field] > max)
            throw new Error('Vị trí hoặc kích thước shape không hợp lệ.');
    }
    return { x: next.x, y: next.y, scale: next.scale };
}

export function normalizeCoverText(value = {}, fallback = DEFAULT_COVER_TEXT) {
    const next = { ...DEFAULT_COVER_TEXT, ...fallback, ...value };
    if (typeof next.visible !== 'boolean' || !Number.isFinite(next.size) || next.size < 24 || next.size > 240)
        throw new Error('Cài đặt chữ ảnh bìa không hợp lệ.');
    for (const axis of ['x', 'y']) {
        if (!Number.isFinite(next[axis]) || next[axis] < -100 || next[axis] > 100)
            throw new Error('Vị trí chữ ảnh bìa không hợp lệ.');
    }
    if (typeof next.color !== 'string' || (next.color && !/^#[0-9a-f]{6}$/i.test(next.color)))
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
    return { ...lines, visible: next.visible, color: next.color, size: next.size, x: next.x, y: next.y };
}
