import test from 'node:test';
import assert from 'node:assert/strict';
import { tracePngPixels } from './profile-page/png-vectorizer.js';
import { encodeSvgAsset, decodeSvgAsset, applySvgPalette, cropSvgAsset } from './profile-page/svg-palette.js';
import { isFrameAssetUrl } from './profile-page/avatar-frame-assets.js';
function fixture(transparent = true) {
    const width = 32,
        height = 24,
        data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const alpha =
                transparent && (x < 3 || x > 28 || y < 3 || y > 20 || (x > 11 && x < 20 && y > 8 && y < 16)) ? 0 : 255;
            data.set(x < 16 ? [25, 40, 90, alpha] : [240, 220, 100, alpha], (y * width + x) * 4);
        }
    return { width, height, data };
}
test('PNG vectorization creates actual paths with both editable roles and no embedded raster image', () => {
    const pixels = fixture(),
        original = pixels.data.slice();
    const svg = tracePngPixels(pixels);
    assert.match(svg, /viewBox="0 0 32 24"/);
    assert.match(svg, /data-palette-role="primary"/);
    assert.match(svg, /data-palette-role="secondary"/);
    assert.doesNotMatch(svg, /<image|base64|opacity="0"/);
    assert.match(svg, /opacity="1"/);
    assert.deepEqual(pixels.data, original);
    assert.equal(isFrameAssetUrl(encodeSvgAsset(svg)), true);
});
test('all converted paths use their assigned solid or gradient role, including after circular SVG crop', async () => {
    const asset = encodeSvgAsset(tracePngPixels(fixture()));
    const cropped = await cropSvgAsset(
        asset,
        { x: 0, y: 0, width: 32, height: 24 },
        { width: 512, height: 512 },
    ).text();
    const colored = decodeSvgAsset(
        applySvgPalette(encodeSvgAsset(cropped), { primary: '#ff0000', secondary: '#00ff00' }),
    );
    const paths = [...colored.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);
    assert.ok(paths.length >= 2);
    for (const path of paths)
        assert.match(path, path.includes('data-palette-role="primary"') ? /fill="#ff0000"/ : /fill="#00ff00"/);
    assert.match(colored, /<clipPath/);
    const gradient = decodeSvgAsset(applySvgPalette(asset, { primary: 'gradient:community', secondary: '#00ff00' }));
    assert.match(gradient, /<linearGradient/);
    assert.match(gradient, /fill="url\(#clubhub-gradient-primary\)"/);
});
test('opaque PNGs remain accepted without background removal, and empty/oversized pixel inputs fail explicitly', () => {
    assert.match(tracePngPixels(fixture(false)), /<path/);
    assert.throws(() => tracePngPixels({ width: 513, height: 1, data: new Uint8Array(513 * 4) }));
    assert.throws(() => tracePngPixels({ width: 8, height: 8, data: new Uint8ClampedArray(8 * 8 * 4) }), /nhìn thấy/);
    assert.throws(() => tracePngPixels({ width: 32, height: 24, data: new Uint8Array(1) }));
});
