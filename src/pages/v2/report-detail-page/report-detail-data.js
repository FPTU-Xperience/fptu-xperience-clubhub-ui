export function reportDetailAccess(report, user, clubAccess = [], readOnly = false) {
    if (!report || readOnly) return {};
    const status = String(report.status || '')
        .toUpperCase()
        .replace(/\s+/g, '');
    const manager = clubAccess.some((access) => String(access.clubId) === String(report.clubId) && access.isManager);
    const author = user?.id != null && String(report.createdByUserId) === String(user.id);
    const reviewer = user?.roles?.some((role) => ['ADMIN', 'STUDENT_AFFAIRS_ADMIN'].includes(role));
    const uploaded = report.contentSource === 'UPLOADED_FILE' || Boolean(report.uploadedFile);
    const editable = ['DRAFT', 'REJECTED'].includes(status);
    const future = report.reportType === 'FUTURE_EVENT' || report.tag === 'FUTURE_EVENT';
    return {
        edit: manager && editable,
        attachments: manager && author && editable,
        submit: author && (manager || uploaded) && editable,
        managerReview: manager && status === 'SUBMITTED' && (future || !author),
        finalReview: Boolean(reviewer && status === 'UNDERREVIEW'),
        export: Boolean(manager || reviewer),
    };
}

export function safeReportEvidenceUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

export function reportDate(value, time = false) {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Chưa cập nhật'
        : time
          ? date.toLocaleString('vi-VN')
          : date.toLocaleDateString('vi-VN');
}

export function reportFileSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return 'Chưa rõ dung lượng';
    return value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
}
