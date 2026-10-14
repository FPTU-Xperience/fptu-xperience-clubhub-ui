export const BASIC_COLORS = [
    '#ffffff',
    '#f1f5f9',
    '#94a3b8',
    '#334155',
    '#000000',
    '#ffedd5',
    '#f97316',
    '#9a3412',
    '#ef4444',
    '#facc15',
    '#84cc16',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#d946ef',
    '#ec4899',
    '#fda4af',
];
export const GRADIENT_COLORS = [
    { id: 'gradient:community', label: 'Cộng đồng', colors: ['#133c49', '#277475'] },
    { id: 'gradient:creative', label: 'Sáng tạo', colors: ['#392f63', '#7963a2'] },
    { id: 'gradient:warm', label: 'Ấm áp', colors: ['#793a23', '#b85e35'] },
    { id: 'gradient:sunset', label: 'Hoàng hôn', colors: ['#fb923c', '#ec4899'] },
    { id: 'gradient:ocean', label: 'Đại dương', colors: ['#06b6d4', '#2563eb'] },
    { id: 'gradient:forest', label: 'Rừng xanh', colors: ['#bef264', '#059669'] },
    { id: 'gradient:violet', label: 'Tím sáng tạo', colors: ['#c4b5fd', '#7c3aed'] },
    { id: 'gradient:peach', label: 'Đào pastel', colors: ['#ffedd5', '#fda4af'] },
    { id: 'gradient:night', label: 'Bầu trời đêm', colors: ['#334155', '#6366f1'] },
    { id: 'gradient:gold', label: 'Ánh vàng', colors: ['#fef08a', '#f97316'] },
    { id: 'gradient:rainbow', label: 'Cầu vồng', colors: ['#f97316', '#ec4899', '#8b5cf6'] },
];
const CUSTOM_PREFIX = 'gradient:custom:';
export const isCustomGradient = (value) => typeof value === 'string' && value.startsWith(CUSTOM_PREFIX);
export function customGradientColor(angle, stops) {
    const value = CUSTOM_PREFIX + encodeURIComponent(JSON.stringify({ angle, stops }));
    if (!getGradient(value))
        throw new Error('Gradient cần góc 0–360°, từ 2–8 điểm dừng màu solid và vị trí 0–100% theo thứ tự.');
    return value;
}
export function getGradient(value) {
    const preset = GRADIENT_COLORS.find((item) => item.id === value);
    if (preset)
        return {
            ...preset,
            angle: 135,
            stops: preset.colors.map((color, index) => ({
                color,
                position: (index * 100) / (preset.colors.length - 1),
            })),
        };
    if (!isCustomGradient(value) || value.length > 2048) return undefined;
    try {
        const { angle, stops } = JSON.parse(decodeURIComponent(value.slice(CUSTOM_PREFIX.length)));
        if (
            !Number.isFinite(angle) ||
            angle < 0 ||
            angle > 360 ||
            !Array.isArray(stops) ||
            stops.length < 2 ||
            stops.length > 8
        )
            return undefined;
        if (
            !stops.every(
                (stop, index) =>
                    /^#[0-9a-f]{6}$/i.test(stop.color || '') &&
                    Number.isFinite(stop.position) &&
                    stop.position >= 0 &&
                    stop.position <= 100 &&
                    (!index || stop.position >= stops[index - 1].position),
            )
        )
            return undefined;
        return { id: value, label: 'Gradient tùy chỉnh', angle, stops, colors: stops.map((stop) => stop.color) };
    } catch {
        return undefined;
    }
}
export const isPaletteColor = (value, allowCustom = false) =>
    typeof value === 'string' &&
    (/^#[0-9a-f]{6}$/i.test(value) || (!!getGradient(value) && (allowCustom === true || !isCustomGradient(value))));
export function gradientVector(angle, width = 1, height = 1) {
    const radians = (angle * Math.PI) / 180;
    const dx = Math.sin(radians),
        dy = -Math.cos(radians);
    const length = Math.abs(width * dx) + Math.abs(height * dy);
    return {
        x1: (width - dx * length) / 2,
        y1: (height - dy * length) / 2,
        x2: (width + dx * length) / 2,
        y2: (height + dy * length) / 2,
    };
}
export const paletteColorCss = (value) => {
    const gradient = getGradient(value);
    return gradient
        ? `linear-gradient(${gradient.angle}deg, ${gradient.stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`
        : value;
};
export function canvasPaletteColor(context, value, size) {
    const item = getGradient(value);
    if (!item) return value;
    const { x1, y1, x2, y2 } = gradientVector(item.angle, size, size);
    const gradient = context.createLinearGradient(x1, y1, x2, y2);
    item.stops.forEach((stop) => gradient.addColorStop(stop.position / 100, stop.color));
    return gradient;
}
