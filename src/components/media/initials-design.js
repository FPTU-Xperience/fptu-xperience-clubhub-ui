import { isPaletteColor, paletteColorCss, getGradient, canvasPaletteColor } from './color-palette.js';

export const INITIALS_FONTS = [
    { id: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
    { id: 'arial', label: 'Arial', family: 'Arial, sans-serif' },
    { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
    { id: 'times', label: 'Times New Roman', family: '"Times New Roman", serif' },
    { id: 'courier', label: 'Courier New', family: '"Courier New", monospace' },
];
export const DEFAULT_INITIALS_DESIGN = { background: '#ffedd5', color: '#9a3412', font: 'inter' };
export function normalizeInitialsDesign(value = {}, fallback = DEFAULT_INITIALS_DESIGN) {
    const next = { ...DEFAULT_INITIALS_DESIGN, ...fallback, ...value };
    if (![next.background, next.color].every(isPaletteColor) || !INITIALS_FONTS.some((font) => font.id === next.font))
        throw new Error('Màu hoặc phông chữ ảnh mặc định không hợp lệ.');
    return { background: next.background, color: next.color, font: next.font };
}
export function initialsDesignStyle(design) {
    const value = normalizeInitialsDesign(design);
    return {
        background: paletteColorCss(value.background),
        color: getGradient(value.color)?.colors[0] || value.color,
        fontFamily: INITIALS_FONTS.find((font) => font.id === value.font).family,
    };
}
export function initialsTextStyle(design) {
    const value = normalizeInitialsDesign(design);
    return getGradient(value.color)
        ? {
              backgroundImage: paletteColorCss(value.color),
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
          }
        : { color: value.color };
}
export function nameInitials(name = '') {
    return (
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => [...word][0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'CLB'
    );
}
export async function createInitialsLogoFile(text, design) {
    const style = initialsDesignStyle(design);
    const font = `700 100px ${style.fontFamily}`;
    await document.fonts.load(font, text);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 300;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Không thể tạo logo mặc định.');
    context.fillStyle = canvasPaletteColor(context, design.background, 300);
    context.fillRect(0, 0, 300, 300);
    context.fillStyle = canvasPaletteColor(context, design.color, 300);
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 150, 150, 260);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Không thể tạo logo mặc định.');
    return new File([blob], 'club-logo-default.png', { type: 'image/png' });
}
