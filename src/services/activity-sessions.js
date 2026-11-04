const guid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const date = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
export const sessionStatus = (status) =>
    ({ SCHEDULED: 'Đã lên lịch', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy' })[status] || 'Chưa xác định';
export const sessionDate = (value) =>
    date(value) ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa xác định';
export function localSessionDate(value) {
    return date(value)
        ? new Intl.DateTimeFormat('sv-SE', {
              timeZone: 'Asia/Ho_Chi_Minh',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
          })
              .format(new Date(value))
              .replace(' ', 'T')
        : '';
}
export function validateSessions(value, activityId, student = false) {
    if (
        String(value?.activityId) !== String(activityId) ||
        !Array.isArray(value.items) ||
        value.items.some(
            (row) =>
                !Number.isSafeInteger(row.id) ||
                row.id < 1 ||
                String(row.activityId) !== String(activityId) ||
                !guid(row.version) ||
                !date(student ? row.startTimeUtc : row.startTime) ||
                !date(student ? row.endTimeUtc : row.endTime) ||
                !['SCHEDULED', 'CLOSED', 'CANCELLED'].includes(row.status),
        ) ||
        new Set(value.items.map((row) => row.id)).size !== value.items.length ||
        (student && (!Number.isSafeInteger(value.totalPages) || value.totalPages < 0))
    )
        throw new Error('Máy chủ chưa trả về danh sách phiên điểm danh hợp lệ.');
    return value;
}
export function validateAttendanceRoster(value, activityId, sessionId) {
    if (
        String(value?.activityId) !== String(activityId) ||
        value.sessionId !== sessionId ||
        !guid(value.sessionVersion) ||
        !Array.isArray(value.items) ||
        !Number.isSafeInteger(value.totalPages) ||
        value.totalPages < 0 ||
        value.items.some(
            (row) =>
                !Number.isSafeInteger(row.memberId) ||
                row.memberId < 1 ||
                !Number.isSafeInteger(row.userId) ||
                row.userId < 1 ||
                (row.attendance &&
                    (String(row.attendance.activityId) !== String(activityId) ||
                        row.attendance.sessionId !== sessionId ||
                        !guid(row.attendance.version))),
        ) ||
        new Set(value.items.map((row) => row.memberId)).size !== value.items.length ||
        new Set(value.items.map((row) => row.userId)).size !== value.items.length
    )
        throw new Error('Danh sách điểm danh không khớp phiên đang xem.');
    return value;
}
export function sessionPayload(draft, expectedVersion, editing = false) {
    if (!guid(expectedVersion)) throw new Error('Tải lại phiên hoặc hoạt động trước khi lưu.');
    const instant = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Nhập đủ thời gian theo giờ Việt Nam.');
        const result = new Date(value + ':00+07:00');
        if (!Number.isFinite(result.getTime()) || localSessionDate(result.toISOString()) !== value)
            throw new Error('Thời gian phiên không hợp lệ.');
        return result.toISOString();
    };
    const startAt = instant(draft.startAt),
        endAt = instant(draft.endAt),
        opensAt = instant(draft.opensAt),
        closesAt = instant(draft.closesAt);
    if (!(startAt <= opensAt && opensAt < closesAt && closesAt <= endAt) || !['ONLINE', 'ONSITE'].includes(draft.mode))
        throw new Error('Cửa sổ điểm danh cần nằm trong thời gian phiên; chọn hình thức trực tuyến hoặc trực tiếp.');
    const geofence =
        draft.mode === 'ONSITE'
            ? {
                  latitude: Number(draft.latitude),
                  longitude: Number(draft.longitude),
                  radiusMeters: Number(draft.radiusMeters),
              }
            : null;
    if (
        geofence &&
        (!['latitude', 'longitude', 'radiusMeters'].every(
            (key) => String(draft[key]).trim() !== '' && Number.isFinite(geofence[key]),
        ) ||
            Math.abs(geofence.latitude) > 90 ||
            Math.abs(geofence.longitude) > 180 ||
            geofence.radiusMeters <= 0)
    )
        throw new Error('Nhập tọa độ và bán kính hợp lệ cho phiên trực tiếp.');
    return {
        expectedVersion,
        startAt,
        endAt,
        location: draft.location.trim(),
        ...(!editing && { timezone: 'Asia/Ho_Chi_Minh' }),
        attendancePolicy: {
            mode: draft.mode,
            opensAt,
            closesAt,
            geofence,
            manualConfirmationEnabled: draft.manualConfirmationEnabled === true,
            qrRotationSeconds: 30,
        },
    };
}
export function checkInPayload(session, challenge, location) {
    const value = challenge.trim();
    if (
        !Number.isSafeInteger(session?.id) ||
        session.id < 1 ||
        session?.sourceActions?.canCheckIn !== true ||
        !['ONLINE', 'ONSITE'].includes(session.attendanceWindow?.mode)
    )
        throw new Error('Phiên chưa cho phép điểm danh. Tải lại để kiểm tra thời gian và điều kiện.');
    if (!value || value.length > 4096) throw new Error('Nhập mã xác thực hiện tại từ người tổ chức.');
    if (
        session.attendanceWindow.mode === 'ONSITE' &&
        (!location ||
            ![location.latitude, location.longitude, location.accuracyMeters].every(Number.isFinite) ||
            Math.abs(location.latitude) > 90 ||
            Math.abs(location.longitude) > 180 ||
            location.accuracyMeters < 0)
    )
        throw new Error('Lấy vị trí hiện tại trước khi điểm danh trực tiếp.');
    return { sessionId: session.id, challenge: value, ...(session.attendanceWindow.mode === 'ONSITE' && { location }) };
}
export function validateCheckIn(value, activityId, sessionId) {
    if (
        !Number.isSafeInteger(value?.attendanceId) ||
        value.attendanceId < 1 ||
        String(value.activityId) !== String(activityId) ||
        value.sessionId !== sessionId ||
        value.status !== 'VERIFIED' ||
        !guid(value.version)
    )
        throw new Error('Máy chủ chưa xác nhận điểm danh. Tải lại để đối chiếu trước khi thử tiếp.');
    return value;
}

export function validateManualAttendance(value, activityId, sessionId, status, attendanceId = null) {
    const row = Array.isArray(value?.items) && value.items.length === 1 ? value.items[0] : null;
    if (
        !row ||
        row.activityId !== Number(activityId) ||
        row.sessionId !== sessionId ||
        row.attendanceStatus !== status ||
        !Number.isSafeInteger(row.attendanceId) ||
        row.attendanceId < 1 ||
        !guid(row.version) ||
        (attendanceId != null && row.attendanceId !== attendanceId) ||
        (['Present', 'Late'].includes(status) && row.status !== 'VERIFIED')
    )
        throw new Error('Máy chủ chưa xác nhận đúng lượt điểm danh. Tải lại để đối chiếu.');
    return row;
}
export async function sessionMutation(api, activityId, path, body, key, method = 'POST') {
    return api.request(`/api/activities/${encodeURIComponent(activityId)}/${path}`, {
        method,
        headers: { 'Idempotency-Key': key },
        body: JSON.stringify(body),
    });
}
export function validateSessionMutation(value, activityId, previousVersion, creating = false) {
    const next = creating ? value?.activityVersion : value?.version;
    if (
        !guid(next) ||
        next === previousVersion ||
        String(value?.activityId) !== String(activityId) ||
        (creating ? !Array.isArray(value.items) || value.items.length < 1 : !Number.isSafeInteger(value.id))
    )
        throw new Error('Máy chủ chưa xác nhận thay đổi phiên. Tải lại trước khi thử tiếp.');
    return value;
}
export function attendanceError(error) {
    if (/QR is invalid|invalid.*challenge|expired.*session/i.test(error?.message || ''))
        return 'Mã xác thực không hợp lệ, đã hết hạn hoặc thuộc phiên khác. Lấy mã mới từ người tổ chức.';
    if (/geofence|accurate location/i.test(error?.message || ''))
        return 'Vị trí chưa đáp ứng khu vực hoặc độ chính xác của phiên. Lấy lại vị trí hoặc gửi minh chứng để đề nghị xác nhận.';
    if ([404, 405, 501].includes(error?.status)) return 'Nguồn điểm danh này chưa khả dụng trên máy chủ.';
    if (error?.status === 409) return 'Dữ liệu hoặc cửa sổ điểm danh đã thay đổi. Tải lại trước khi thử tiếp.';
    if (error?.status === 403) return 'Bạn chưa đủ quyền hoặc chưa đáp ứng điều kiện điểm danh của phiên.';
    return error?.message || 'Không thể tải hoặc cập nhật điểm danh.';
}
