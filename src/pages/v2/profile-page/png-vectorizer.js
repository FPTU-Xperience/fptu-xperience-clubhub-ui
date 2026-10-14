import ImageTracer from 'imagetracerjs';

export const MAX_TRACE_DIMENSION = 512;
export function tracePngPixels({ width, height, data }) {
    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        height < 1 ||
        width > MAX_TRACE_DIMENSION ||
        height > MAX_TRACE_DIMENSION ||
        data?.length !== width * height * 4
    )
        throw new Error('Dữ liệu PNG để chuyển SVG không hợp lệ.');
    const pixels = new Uint8ClampedArray(data),
        histogram = new Map();
    let transparent = false;
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 16) {
            pixels.fill(0, i, i + 4);
            transparent = true;
            continue;
        }
        const color = {
            r: pixels[i] & 248,
            g: pixels[i + 1] & 248,
            b: pixels[i + 2] & 248,
            a: Math.min(255, Math.round(pixels[i + 3] / 16) * 16),
        };
        const key = `${color.r},${color.g},${color.b},${color.a}`;
        const previous = histogram.get(key);
        histogram.set(key, { color, count: (previous?.count || 0) + 1 });
    }
    if (!histogram.size) throw new Error('PNG không có vùng ảnh nhìn thấy để chuyển SVG.');
    const palette = [...histogram.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((item) => item.color);
    if (transparent) palette.push({ r: 0, g: 0, b: 0, a: 0 });
    const options = {
        pal: palette,
        colorquantcycles: 3,
        mincolorratio: 0,
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 2,
        strokewidth: 0,
        roundcoords: 2,
        viewbox: true,
        desc: false,
    };
    const traced = ImageTracer.imagedataToTracedata({ width, height, data: pixels }, options);
    const visibleColors = traced.palette.filter((color) => color.a >= 16);
    const luminance = (color) => 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    const brightness = visibleColors.map(luminance);
    const threshold = (Math.min(...brightness) + Math.max(...brightness)) / 2;
    let paths = '',
        pathCount = 0;
    for (let layer = 0; layer < traced.layers.length; layer++) {
        if (traced.palette[layer].a < 16) continue;
        const role = luminance(traced.palette[layer]) <= threshold ? 'primary' : 'secondary';
        for (let path = 0; path < traced.layers[layer].length; path++) {
            if (traced.layers[layer][path].isholepath) continue;
            if (++pathCount > 10000)
                throw new Error('PNG quá nhiều chi tiết. Hãy dùng thiết kế đơn giản hơn hoặc SVG gốc.');
            paths += ImageTracer.svgpathstring(traced, layer, path, options).replace(
                '<path ',
                `<path data-palette-role="${role}" `,
            );
        }
    }
    if (!pathCount) throw new Error('Không tìm thấy nét vẽ trong PNG. Hãy dùng ảnh lớn hơn hoặc SVG gốc.');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-converted-from="png">${paths}</svg>`;
}
