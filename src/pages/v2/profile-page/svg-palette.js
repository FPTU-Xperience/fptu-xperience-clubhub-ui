import { isPaletteColor, getGradient, gradientVector } from '../../../components/media/color-palette.js';
export const isSvgAsset = (asset) => typeof asset === 'string' && asset.startsWith('data:image/svg+xml;base64,');
export const decodeSvgAsset = (asset) =>
    new TextDecoder().decode(Uint8Array.from(atob(asset.split(',')[1]), (character) => character.charCodeAt(0)));
export function encodeSvgAsset(source) {
    const bytes = new TextEncoder().encode(source);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return `data:image/svg+xml;base64,${btoa(binary)}`;
}
export function normalizeSvgPalette(value) {
    if (value == null) return null;
    if (!isPaletteColor(value.primary, true) || !isPaletteColor(value.secondary, true))
        throw new Error('Màu chính và màu phụ của SVG không hợp lệ.');
    return { primary: value.primary, secondary: value.secondary };
}
export const svgPaletteFromColors = (colors) =>
    normalizeSvgPalette({ primary: colors.accent, secondary: colors.secondary });

export function applySvgPalette(asset, value) {
    const palette = normalizeSvgPalette(value);
    if (!palette || !isSvgAsset(asset)) return asset;
    let source = decodeSvgAsset(asset);
    if (!/^\s*<svg[\s>]/i.test(source)) return asset;
    const gradientDefinitions = [];
    const resolved = { ...palette };
    for (const role of ['primary', 'secondary']) {
        const gradient = getGradient(palette[role]);
        if (!gradient) continue;
        const id = `clubhub-gradient-${role}`;
        const vector = gradientVector(gradient.angle);
        gradientDefinitions.push(
            `<linearGradient id="${id}" x1="${vector.x1}" y1="${vector.y1}" x2="${vector.x2}" y2="${vector.y2}">${gradient.stops.map((stop) => `<stop offset="${stop.position}%" stop-color="${stop.color}"/>`).join('')}</linearGradient>`,
        );
        resolved[role] = `url(#${id})`;
    }
    const protectedParts = [];
    // Keep clipping and alpha masks intact when recoloring painted geometry.
    source = source.replace(/<(mask|clipPath)\b[\s\S]*?<\/\1>/g, (part) => {
        protectedParts.push(part);
        return `__SVG_PALETTE_PROTECTED_${protectedParts.length - 1}__`;
    });
    const paints = new Map();
    // Converted PNG paths explicitly bind every painted region to a palette role.
    source = source.replace(/<path\b([^>]*)>/g, (tag, attrs) => {
        const role = /\bdata-palette-role\s*=\s*["'](primary|secondary)["']/.exec(attrs)?.[1];
        return role
            ? `<path${attrs.replace(/\b(fill|stroke)\s*=\s*(["'])(.*?)\2/g, (_, name, quote, value) => (/^(none|transparent)$/.test(value.trim()) ? `${name}=${quote}${value}${quote}` : `${name}=${quote}var(--${role})${quote}`))}>`
            : tag;
    });
    const paint = (original) => {
        const key = original.trim().toLowerCase();
        if (/^(none|transparent|inherit|initial|unset)$/.test(key) || /^url\(/.test(key)) return original;
        if (['currentcolor', 'primary', 'var(--primary)', 'var(--color-primary)'].includes(key))
            return resolved.primary;
        if (['secondary', 'var(--secondary)', 'var(--color-secondary)'].includes(key)) return resolved.secondary;
        if (!paints.has(key))
            paints.set(key, paints.size === 0 ? resolved.primary : paints.size === 1 ? resolved.secondary : original);
        return paints.get(key);
    };
    const stopPaint = (value) => {
        const result = paint(value);
        const role = ['primary', 'secondary'].find((key) => result === resolved[key]);
        return role && getGradient(palette[role]) ? getGradient(palette[role]).colors[0] : result;
    };
    source = source.replace(
        /\b(fill|stroke|stop-color)\s*=\s*(["'])(.*?)\2/g,
        (_, name, quote, value) => `${name}=${quote}${name === 'stop-color' ? stopPaint(value) : paint(value)}${quote}`,
    );
    const css = (text) =>
        text.replace(
            /\b(fill|stroke|stop-color)\s*:\s*([^;{}]+)/g,
            (_, name, value) => `${name}:${name === 'stop-color' ? stopPaint(value) : paint(value)}`,
        );
    source = source.replace(/\bstyle\s*=\s*(["'])(.*?)\1/g, (_, quote, value) => `style=${quote}${css(value)}${quote}`);
    source = source.replace(
        /<style\b([^>]*)>([\s\S]*?)<\/style>/g,
        (_, attrs, value) => `<style${attrs}>${css(value)}</style>`,
    );
    source = source.replace(/<svg\b([^>]*)>/, (tag, attrs) => {
        const solid = getGradient(palette.primary)?.colors[0] || palette.primary;
        const next = attrs.replace(/\bcolor\s*=\s*(["'])(.*?)\1/g, `color="${solid}"`);
        return `<svg${next}${/\bfill\s*=/.test(next) ? '' : ` fill="${resolved.primary}"`}${/\bcolor\s*=/.test(next) ? '' : ` color="${solid}"`}>${gradientDefinitions.length ? `<defs>${gradientDefinitions.join('')}</defs>` : ''}`;
    });
    source = source.replace(/__SVG_PALETTE_PROTECTED_(\d+)__/g, (_, index) => protectedParts[Number(index)]);
    return encodeSvgAsset(source);
}

export function cropSvgAsset(asset, rect, size) {
    const source = decodeSvgAsset(asset);
    const id = `crop-${crypto.randomUUID()}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><defs><clipPath id="${id}"><circle cx="${size.width / 2}" cy="${size.height / 2}" r="${Math.min(size.width, size.height) / 2}"/></clipPath></defs><g clip-path="url(#${id})"><g transform="scale(${size.width / rect.width} ${size.height / rect.height}) translate(${-rect.x} ${-rect.y})">${source}</g></g></svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
}
