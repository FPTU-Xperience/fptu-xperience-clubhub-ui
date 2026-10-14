import { paletteColorCss, getGradient } from '../../../components/media/color-palette.js';
import { encodeSvgAsset } from './svg-palette.js';
export const MAX_COSMETIC_FILE_BYTES = 5 * 1024 * 1024;
export const isFrameAssetUrl = (value) => {
    if (typeof value !== 'string') return false;
    const match = /^data:image\/(?:png|svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[1].length % 4 !== 0) return false;
    const padding = match[1].endsWith('==') ? 2 : match[1].endsWith('=') ? 1 : 0;
    return (match[1].length / 4) * 3 - padding <= MAX_COSMETIC_FILE_BYTES;
};
const safePaint = (value) =>
    !/javascript:|expression\s*\(|@import|@font-face/i.test(value) &&
    [...value.matchAll(/url\s*\(([^)]*)\)/gi)].every((match) => /^['"]?#[\w.-]+['"]?$/.test(match[1].trim()));

export function sanitizeFrameSvg(source) {
    if (/<!DOCTYPE|<!ENTITY/i.test(source))
        throw new Error('SVG cần là thiết kế độc lập, không dùng tài nguyên ngoài.');
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = doc.documentElement;
    if (doc.querySelector('parsererror') || root.localName !== 'svg') throw new Error('File SVG không hợp lệ.');
    const tags = new Set([
        'svg',
        'g',
        'path',
        'rect',
        'circle',
        'ellipse',
        'polygon',
        'polyline',
        'line',
        'defs',
        'linearGradient',
        'radialGradient',
        'stop',
        'clipPath',
        'mask',
        'use',
        'title',
        'desc',
        'style',
    ]);
    for (const element of [root, ...root.querySelectorAll('*')]) {
        if (!tags.has(element.localName) || element.namespaceURI !== 'http://www.w3.org/2000/svg')
            throw new Error('SVG chỉ hỗ trợ nét vẽ vector, không dùng script, ảnh nhúng hoặc nội dung động.');
        for (const attribute of [...element.attributes]) {
            if (
                /^on/i.test(attribute.name) ||
                (attribute.localName === 'href' && !/^#[\w.-]+$/.test(attribute.value)) ||
                !safePaint(attribute.value)
            )
                throw new Error('SVG cần bỏ nội dung động và liên kết đến tài nguyên ngoài.');
        }
        if (element.localName === 'style' && (!safePaint(element.textContent) || /@/.test(element.textContent)))
            throw new Error('SVG cần dùng màu và nét vẽ bên trong file.');
    }
    const viewBox = root
        .getAttribute('viewBox')
        ?.trim()
        .split(/[\s,]+/)
        .map(Number);
    const width = viewBox?.length === 4 ? viewBox[2] : Number(root.getAttribute('width')?.replace(/px$/, ''));
    const height = viewBox?.length === 4 ? viewBox[3] : Number(root.getAttribute('height')?.replace(/px$/, ''));
    if (
        ![width, height].every((size) => Number.isFinite(size) && size > 0 && size <= 4096) ||
        (viewBox && (viewBox.length !== 4 || !viewBox.every(Number.isFinite)))
    )
        throw new Error('SVG cần width/height hoặc viewBox hợp lệ, tối đa 4096 × 4096.');
    root.setAttribute('width', String(width));
    root.setAttribute('height', String(height));
    return new XMLSerializer().serializeToString(root);
}

export async function readCosmeticDesignFile(file, { vectorizePng = true } = {}) {
    const svg = file.type === 'image/svg+xml' || (!file.type && /\.svg$/i.test(file.name));
    if ((!svg && file.type !== 'image/png') || file.size > MAX_COSMETIC_FILE_BYTES)
        throw new Error('Chọn ảnh PNG hoặc SVG tối đa 5 MB.');
    const bytes = svg
        ? new TextEncoder().encode(sanitizeFrameSvg(await file.text()))
        : new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const assetUrl = `data:image/${svg ? 'svg+xml' : 'png'};base64,${btoa(binary)}`;
    if (!isFrameAssetUrl(assetUrl)) throw new Error('Thiết kế quá lớn. Hãy dùng file nhỏ hơn.');
    const image = new Image();
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Không thể đọc thiết kế.'));
        image.src = assetUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096)
        throw new Error('Thiết kế tối đa 4096 × 4096 pixel.');
    if (!svg && vectorizePng) {
        const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Không thể đọc PNG để chuyển SVG.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const worker = new Worker(new URL('./png-vectorizer.worker.js', import.meta.url), { type: 'module' });
        const source = await new Promise((resolve, reject) => {
            const finish = (error, value) => {
                clearTimeout(timeout);
                worker.terminate();
                error ? reject(error) : resolve(value);
            };
            const timeout = setTimeout(
                () => finish(new Error('Chuyển SVG quá lâu. Hãy dùng PNG đơn giản hơn hoặc SVG gốc.')),
                30000,
            );
            worker.onmessage = (event) => finish(event.data.error ? new Error(event.data.error) : null, event.data.svg);
            worker.onerror = () => finish(new Error('Không thể chuyển PNG thành SVG. Vui lòng thử lại.'));
            worker.postMessage({ width: pixels.width, height: pixels.height, data: pixels.data }, [pixels.data.buffer]);
        });
        const converted = encodeSvgAsset(sanitizeFrameSvg(source));
        if (!isFrameAssetUrl(converted))
            throw new Error('SVG sau chuyển đổi vượt quá 5 MB. Hãy dùng thiết kế đơn giản hơn.');
        return converted;
    }
    return assetUrl;
}

export async function ensureVectorCosmeticAsset(asset) {
    if (!asset?.startsWith('data:image/png;base64,')) return asset;
    const bytes = Uint8Array.from(atob(asset.split(',')[1]), (character) => character.charCodeAt(0));
    return readCosmeticDesignFile(new File([bytes], 'design.png', { type: 'image/png' }));
}

export function frameAssetStyle(frame) {
    const mask = `url("${frame.assetUrl}")`;
    return {
        background: paletteColorCss(frame.color),
        backgroundColor: getGradient(frame.color) ? undefined : frame.color,
        maskImage: mask,
        WebkitMaskImage: mask,
    };
}
