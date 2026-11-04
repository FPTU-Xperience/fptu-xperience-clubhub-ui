export function attendanceQrPayload(activityId, value) {
    return JSON.stringify({
        type: 'clubhub-attendance', version: 1,
        activityId: Number(activityId), sessionId: value.sessionId,
        challenge: value.challenge, expiresAt: value.expiresAt,
    });
}

export function readAttendanceQr(text, activityId, sessionId, now = Date.now()) {
    let value;
    try {
        if (typeof text !== 'string' || text.length > 8192) throw new Error();
        value = JSON.parse(text);
    } catch {
        throw new Error('Đây không phải mã QR điểm danh ClubHub. Bạn vẫn có thể nhập mã do người tổ chức cung cấp.');
    }
    if (value?.type !== 'clubhub-attendance' || value.version !== 1 ||
        value.activityId !== Number(activityId) || value.sessionId !== Number(sessionId))
        throw new Error('Mã QR không thuộc phiên tham gia đang chọn.');
    if (typeof value.challenge !== 'string' || !value.challenge.trim() || value.challenge.length > 4096 ||
        !Number.isFinite(Date.parse(value.expiresAt)))
        throw new Error('Mã QR chưa có mã xác thực hợp lệ.');
    if (Date.parse(value.expiresAt) <= now)
        throw new Error('Mã QR đã hết hạn. Đề nghị người tổ chức cấp mã mới.');
    return value.challenge;
}
