export const EXPERIENCE_CATEGORIES = [
    ['Academic', 'Học thuật'],
    ['Research', 'Nghiên cứu'],
    ['Global', 'Hội nhập quốc tế'],
    ['CultureSports', 'Văn hóa & thể thao'],
    ['Community', 'Cộng đồng'],
    ['Entrepreneurship', 'Khởi nghiệp'],
    ['RealWorldWork', 'Kinh nghiệm làm việc thực tế'],
];
export const EXPERIENCE_STATES = {
    SUBMITTED: 'Chờ xét duyệt',
    APPROVED: 'Đã ghi nhận',
    REJECTED: 'Không thông qua',
    REVISION_REQUESTED: 'Cần bổ sung minh chứng',
    REVOKED: 'Đã thu hồi',
};
export const EXPERIENCE_ROLES = [
    ['Participant', 'Người tham gia'],
    ['Contributor', 'Người đóng góp'],
    ['Product', 'Tạo sản phẩm'],
    ['Organizer', 'Người tổ chức'],
    ['Leader', 'Người dẫn dắt'],
];
export const EXPERIENCE_SCALES = [
    ['Club', 'Câu lạc bộ'],
    ['Campus', 'Cơ sở'],
    ['FptEducation', 'FPT Education'],
    ['National', 'Quốc gia'],
    ['International', 'Quốc tế'],
];
export const EXPERIENCE_RESULTS = [
    ['None', 'Hoàn thành / tham gia'],
    ['Finalist', 'Vào vòng chung kết'],
    ['Prize', 'Đạt giải'],
    ['RealWorldOutput', 'Có sản phẩm / kết quả thực tế'],
];
export const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const blankExperience = (semesterId = '') => ({
    title: '',
    kind: 'competition',
    organizationSource: '',
    semesterId,
    occurredDate: '',
    category: 'Academic',
    description: '',
    tier: 'T1',
    role: 'Participant',
    scale: 'National',
    result: 'None',
    referenceMode: 'DIRECT',
    referenceClubId: '',
});
export function validateEvidenceFile(file) {
    const types = { 'application/pdf': /\.pdf$/i, 'image/png': /\.png$/i, 'image/jpeg': /\.jpe?g$/i };
    if (!types[file?.type]?.test(file.name) || file.size <= 0 || file.size > 10 * 1024 * 1024)
        throw new Error('Chọn minh chứng PDF, PNG hoặc JPEG, tối đa 10 MB mỗi tệp.');
}
export function validateExperience(form, files, now = Date.now()) {
    if (form.referenceMode !== 'DIRECT')
        throw new Error(
            'Gửi qua CLB trực thuộc cần chức năng tham chiếu/xác nhận từ máy chủ. Lựa chọn của bạn chưa được gửi.',
        );
    if (
        !form.title.trim() ||
        form.title.trim().length > 200 ||
        !form.organizationSource.trim() ||
        !form.semesterId.trim()
    )
        throw new Error('Nhập tên trải nghiệm, đơn vị tổ chức/cấp chứng nhận và học kỳ.');
    if (!['competition', 'certificate', 'qualification', 'other'].includes(form.kind))
        throw new Error('Chọn hình thức trải nghiệm.');
    const occurredAt = Date.parse(`${form.occurredDate}T00:00:00+07:00`);
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(form.occurredDate) ||
        !Number.isFinite(occurredAt) ||
        new Date(occurredAt + 7 * 60 * 60 * 1000).toISOString().slice(0, 10) !== form.occurredDate ||
        occurredAt > now
    )
        throw new Error('Ngày trải nghiệm phải hợp lệ và không ở tương lai.');
    if (!form.description.trim() || form.description.trim().length > 1800)
        throw new Error('Mô tả kết quả và minh chứng trong tối đa 1.800 ký tự.');
    if (
        !EXPERIENCE_CATEGORIES.some(([id]) => id === form.category) ||
        !['T1', 'T2', 'T3', 'T4', 'T5'].includes(form.tier) ||
        !EXPERIENCE_ROLES.some(([id]) => id === form.role) ||
        !EXPERIENCE_SCALES.some(([id]) => id === form.scale) ||
        !EXPERIENCE_RESULTS.some(([id]) => id === form.result)
    )
        throw new Error('Chọn thuộc tính trải nghiệm hợp lệ.');
    if (!files.length || files.length > 10) throw new Error('Cần từ 1 đến 10 minh chứng để gửi xét duyệt.');
    files.forEach(({ file }) => validateEvidenceFile(file));
}
export function experiencePayload(form, evidenceRefs) {
    if (
        !evidenceRefs.length ||
        evidenceRefs.length > 10 ||
        evidenceRefs.some((id) => !GUID.test(id)) ||
        new Set(evidenceRefs).size !== evidenceRefs.length
    )
        throw new Error('Chưa xác nhận đầy đủ các minh chứng đã tải lên.');
    if (form.referenceMode !== 'DIRECT') throw new Error('Chưa hỗ trợ gửi trải nghiệm qua CLB trực thuộc.');
    const kind = {
        competition: 'Thi đấu / cuộc thi bên ngoài',
        certificate: 'Chứng chỉ',
        qualification: 'Văn bằng',
        other: 'Trải nghiệm khác',
    }[form.kind];
    return {
        title: form.title.trim(),
        category: form.category,
        organizationSource: form.organizationSource.trim(),
        isOutsideClub: true,
        clubId: null,
        evidenceUrl: '',
        evidenceDescription: `${kind}\n${form.description.trim()}`,
        roleProposed: form.role,
        startDate: form.occurredDate,
        endDate: form.occurredDate,
        semesterId: form.semesterId.trim(),
        occurredAt: `${form.occurredDate}T00:00:00+07:00`,
        proposedAttributes: {
            tier: form.tier,
            role: form.role,
            scale: form.scale,
            result: form.result,
            pillarWeights: [{ pillar: form.category, weight: 1 }],
        },
        evidenceRefs,
    };
}
export function experiencePage(value, userId) {
    if (
        !Array.isArray(value?.items) ||
        !Number.isSafeInteger(value.total) ||
        value.total < 0 ||
        !Number.isSafeInteger(value.totalPages) ||
        value.totalPages < 0 ||
        new Set(value.items.map((row) => row.id)).size !== value.items.length ||
        value.items.some(
            (row) =>
                !GUID.test(row.id) ||
                String(row.userId) !== String(userId) ||
                !row.title ||
                !row.status ||
                (row.status === 'APPROVED' &&
                    row.isAuthoritative !== false &&
                    (!Number.isFinite(row.rawPoints) || row.rawPoints < 0)),
        )
    )
        throw new Error('Không đọc được danh sách trải nghiệm cá nhân hợp lệ.');
    return { ...value, totalPages: Math.max(1, value.totalPages) };
}
export function createPersonalExperienceClient(api, userId) {
    return {
        async list(params) {
            const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
            return experiencePage(await api.request(`/api/users/me/contributions?${query}`), userId);
        },
        async summary() {
            const data = await api.request('/api/users/me/experience-summary?scope=PERIOD');
            if (
                String(data?.userId) !== String(userId) ||
                typeof data.semesterId !== 'string' ||
                !data.semesterId ||
                !Number.isSafeInteger(data.recognizedContributionCount) ||
                data.recognizedContributionCount < 0 ||
                !Number.isFinite(data.rawExperiencePoints)
            )
                throw new Error('Không đọc được báo cáo Xperience Point cá nhân hợp lệ.');
            return data;
        },
        async detail(row) {
            const data = await api.request(
                `${row.sourceNamespace === 'LEGACY_DECLARATION' ? '/api/v1/declarations' : '/api/contributions'}/${encodeURIComponent(row.id)}`,
            );
            const record = data.contribution || data;
            if (String(record.id) !== String(row.id) || String(record.userId ?? record.studentId) !== String(userId))
                throw new Error('Trải nghiệm không thuộc tài khoản hiện tại.');
            return { ...data, contribution: record };
        },
        async submit(payload, key) {
            const row = await api.request('/api/v1/declarations/', {
                method: 'POST',
                headers: { 'Idempotency-Key': key },
                body: JSON.stringify(payload),
            });
            if (!GUID.test(row?.id) || String(row.userId) !== String(userId) || row.status !== 'SUBMITTED')
                throw new Error('Chưa xác nhận được kết quả gửi trải nghiệm. Kiểm tra danh sách trước khi thử lại.');
            return row;
        },
    };
}
