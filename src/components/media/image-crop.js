export function imageCropRect(width, height, targetWidth, targetHeight, zoom = 1, x = 50, y = 50) {
    if (![width, height, targetWidth, targetHeight, zoom].every((value) => Number.isFinite(value) && value > 0))
        throw new Error('Kích thước ảnh crop không hợp lệ.');
    const ratio = targetWidth / targetHeight;
    const cropWidth = Math.min(width, height * ratio) / Math.max(1, zoom);
    const cropHeight = cropWidth / ratio;
    return {
        x: ((width - cropWidth) * Math.max(0, Math.min(100, x))) / 100,
        y: ((height - cropHeight) * Math.max(0, Math.min(100, y))) / 100,
        width: cropWidth,
        height: cropHeight,
    };
}
export function moveImageCrop(rect, imageWidth, imageHeight, frameWidth, frameHeight, dx, dy) {
    const freeX = imageWidth - rect.width,
        freeY = imageHeight - rect.height;
    const x = Math.max(0, Math.min(freeX, rect.x - (dx * rect.width) / frameWidth));
    const y = Math.max(0, Math.min(freeY, rect.y - (dy * rect.height) / frameHeight));
    return { x: freeX > 0 ? (x / freeX) * 100 : 50, y: freeY > 0 ? (y / freeY) * 100 : 50 };
}
