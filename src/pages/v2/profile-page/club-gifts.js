import { isFrameAssetUrl } from './avatar-frame-assets.js';
import { normalizeSvgPalette } from './svg-palette.js';
import { isPaletteColor } from '../../../components/media/color-palette.js';
const STORAGE_KEY = 'clubhub:v2:club-gifts:1';
const paint = (value) => isPaletteColor(value, true);
const image = (value) => /^data:image\/(png|webp|jpeg);base64,/.test(value || '') && value.length <= 1500000;

function validate(gift) {
    normalizeSvgPalette(gift.svgPalette);
    if (
        !gift.clubId ||
        !['physical', 'frame', 'color'].includes(gift.kind) ||
        !gift.label?.trim() ||
        gift.label.length > 80 ||
        !Number.isSafeInteger(gift.cost) ||
        gift.cost < 0 ||
        gift.cost > 100000
    )
        throw new Error('Vui lòng nhập loại quà, tên và mức điểm hợp lệ.');
    if (typeof gift.description !== 'string' || gift.description.length > 300)
        throw new Error('Mô tả tối đa 300 ký tự.');
    if (
        gift.kind === 'physical' &&
        (!Number.isSafeInteger(gift.stock) ||
            gift.stock < 1 ||
            gift.stock > 100000 ||
            (gift.assetUrl && !image(gift.assetUrl)))
    )
        throw new Error('Nhập số lượng từ 1 đến 100.000 và ảnh PNG/JPG/WebP tối đa 1 MB.');
    if (
        gift.kind === 'frame' &&
        (!paint(gift.color) ||
            (gift.assetUrl
                ? !isFrameAssetUrl(gift.assetUrl) || typeof gift.recolor !== 'boolean'
                : !paint(gift.accent) || !['ring', 'circuit', 'orbit', 'pixel'].includes(gift.pattern)))
    )
        throw new Error('Chọn ảnh khung PNG/SVG và màu hợp lệ.');
    if (gift.kind === 'color' && !['background', 'secondary', 'accent', 'ink'].every((key) => paint(gift[key])))
        throw new Error('Bộ màu cần đủ bốn màu hợp lệ.');
}

export function readClubGifts(storage = globalThis.localStorage) {
    try {
        const values = JSON.parse(storage?.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(values)) return [];
        return values.filter((gift) => {
            try {
                validate(gift);
                return gift.id?.startsWith('club-') && gift.key === `${gift.kind}:${gift.id}`;
            } catch {
                return false;
            }
        });
    } catch {
        return [];
    }
}

export function publishClubGift(input, storage = globalThis.localStorage) {
    const gift = {
        clubId: String(input.clubId || ''),
        clubName: String(input.clubName || ''),
        kind: input.kind,
        label: String(input.label || '').trim(),
        description: String(input.description || '').trim(),
        cost: input.cost,
        hot: input.hot === true,
        ...(input.kind === 'physical' ? { stock: input.stock, assetUrl: input.assetUrl || '' } : {}),
        ...(input.kind === 'frame'
            ? {
                  color: input.color,
                  assetUrl: input.assetUrl,
                  recolor: input.recolor,
                  circular: input.circular === true,
                  svgPalette: normalizeSvgPalette(input.svgPalette),
              }
            : {}),
        ...(input.kind === 'color'
            ? { background: input.background, secondary: input.secondary, accent: input.accent, ink: input.ink }
            : {}),
    };
    if (gift.kind === 'frame' && !isFrameAssetUrl(gift.assetUrl)) throw new Error('Vui lòng tải khung PNG hoặc SVG.');
    validate(gift);
    const existing = input.id
        ? readClubGifts(storage).find(
              (item) => item.id === input.id && item.clubId === gift.clubId && item.kind === gift.kind,
          )
        : null;
    if (input.id && !existing) throw new Error('Không tìm thấy quà của CLB để sửa.');
    gift.createdAt = existing ? existing.createdAt || null : new Date().toISOString();
    gift.id = existing?.id || `club-${gift.clubId}-${crypto.randomUUID()}`;
    gift.key = `${gift.kind}:${gift.id}`;
    storage.setItem(
        STORAGE_KEY,
        JSON.stringify([...readClubGifts(storage).filter((item) => item.id !== gift.id), gift]),
    );
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
    return gift;
}
