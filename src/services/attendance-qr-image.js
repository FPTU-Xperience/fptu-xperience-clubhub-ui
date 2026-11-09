// Keep the normal detector for camera photos; exported, axis-aligned QR images
// can confuse its alignment-pattern search even when their data is intact.
export async function decodeAttendanceQrImage(url) {
    const [{ BrowserQRCodeReader }, { DecodeHintType }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
    ]);
    try {
        return (await new BrowserQRCodeReader().decodeFromImageUrl(url)).getText();
    } catch (issue) {
        try {
            const hints = new Map([[DecodeHintType.PURE_BARCODE, true]]);
            return (await new BrowserQRCodeReader(hints).decodeFromImageUrl(url)).getText();
        } catch {
            throw issue;
        }
    }
}
