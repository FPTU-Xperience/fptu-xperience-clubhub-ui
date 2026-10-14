import { isSvgAsset, encodeSvgAsset } from './svg-palette.js';
import {
    ensureVectorCosmeticAsset,
    sanitizeFrameSvg,
    isFrameAssetUrl,
    MAX_COSMETIC_FILE_BYTES,
} from './avatar-frame-assets.js';
export const canSyncPaletteAsset = (asset) =>
    typeof asset === 'string' &&
    (isSvgAsset(asset) ||
        asset.startsWith('data:image/png;base64,') ||
        /^(?:https?:\/\/|\/|\.\/)[^?#]*\.svg(?:[?#].*)?$/i.test(asset));
const cache = new Map();
export async function resolvePaletteAsset(asset) {
    if (!canSyncPaletteAsset(asset)) throw new Error('Thiết kế này chưa hỗ trợ đồng bộ màu.');
    if (isSvgAsset(asset)) return asset;
    if (cache.has(asset)) return cache.get(asset);
    const result = (async () => {
        if (asset.startsWith('data:image/png;base64,')) return ensureVectorCosmeticAsset(asset);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch(asset, { signal: controller.signal });
            if (!response.ok) throw new Error('Không thể tải SVG để đồng bộ màu.');
            const blob = await response.blob();
            if (blob.size > MAX_COSMETIC_FILE_BYTES) throw new Error('SVG vượt quá 5 MB.');
            const vector = encodeSvgAsset(sanitizeFrameSvg(await blob.text()));
            if (!isFrameAssetUrl(vector)) throw new Error('SVG vượt quá 5 MB.');
            return vector;
        } finally {
            clearTimeout(timeout);
        }
    })();
    cache.set(asset, result);
    try {
        return await result;
    } catch (issue) {
        cache.delete(asset);
        throw issue;
    }
}
