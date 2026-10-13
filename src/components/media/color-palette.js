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
export const getGradient = (value) => GRADIENT_COLORS.find((item) => item.id === value);
export const isPaletteColor = (value) =>
    typeof value === 'string' && (/^#[0-9a-f]{6}$/i.test(value) || !!getGradient(value));
export const paletteColorCss = (value) => {
    const gradient = getGradient(value);
    return gradient ? `linear-gradient(135deg, ${gradient.colors.join(', ')})` : value;
};
export function canvasPaletteColor(context, value, size) {
    const item = getGradient(value);
    if (!item) return value;
    const gradient = context.createLinearGradient(0, 0, size, size);
    item.colors.forEach((color, index) => gradient.addColorStop(index / (item.colors.length - 1), color));
    return gradient;
}
