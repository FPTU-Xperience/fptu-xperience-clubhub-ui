import { inferStudentFromEmail, inferStudentYear } from './profile-options.js';

export const ONBOARDING_VERSION = 1;
export const MIN_INTERESTS = 3;

export const MAJORS = [
    'Kỹ thuật phần mềm',
    'Trí tuệ nhân tạo',
    'An toàn thông tin',
    'Thiết kế mỹ thuật số',
    'Truyền thông đa phương tiện',
    'Kinh doanh quốc tế',
    'Digital Marketing',
    'Ngôn ngữ Anh',
    'Ngôn ngữ Nhật',
];

export const INTERESTS = [
    { id: 'technology', label: 'Công nghệ', description: 'Lập trình, AI, sản phẩm số' },
    { id: 'design', label: 'Thiết kế & sáng tạo', description: 'UI/UX, hình ảnh, nội dung' },
    { id: 'business', label: 'Kinh doanh', description: 'Khởi nghiệp, marketing, tài chính' },
    { id: 'arts', label: 'Nghệ thuật', description: 'Âm nhạc, nhảy, biểu diễn' },
    { id: 'sports', label: 'Thể thao', description: 'Rèn luyện, thi đấu, đồng đội' },
    { id: 'community', label: 'Cộng đồng', description: 'Tình nguyện, môi trường, kết nối' },
    { id: 'languages', label: 'Ngôn ngữ & văn hóa', description: 'Giao lưu và khám phá thế giới' },
    { id: 'leadership', label: 'Lãnh đạo', description: 'Tổ chức, mentoring, điều phối' },
];

const client = async (api) => api || (await import('../../services/api.js')).default;

export function onboardingAutofill(user, snapshot) {
    const academic = snapshot?.academic || {};
    const inferred = inferStudentFromEmail(user?.email);
    const studentCode = academic.studentCode || inferred.studentCode;
    const campus = user?.campusCode || inferred.campus;
    const year = academic.year || inferStudentYear(studentCode);
    return {
        ...academic,
        studentCode,
        campus,
        year,
    };
}

function validateSnapshot(user, value) {
    if (
        String(value?.userId) !== String(user?.id) ||
        typeof value?.version !== 'string' ||
        !value.profile ||
        !value.personal ||
        !Array.isArray(value.editableFields) ||
        !Number.isInteger(value.onboarding?.version) ||
        !Object.hasOwn(value.onboarding, 'completedAt')
    )
        throw new Error('Máy chủ chưa hỗ trợ dữ liệu onboarding. Vui lòng thử lại sau.');
    return value;
}

export function isValidOnboarding(value) {
    // Completion is a server decision; later profile edits do not reset it.
    return (
        value?.version === ONBOARDING_VERSION &&
        typeof value.completedAt === 'string' &&
        Number.isFinite(Date.parse(value.completedAt))
    );
}

export function onboardingPreferences(snapshot) {
    if (!isValidOnboarding(snapshot.onboarding)) return null;
    return {
        ...snapshot.onboarding,
        major: snapshot.academic?.major || '',
        interests: snapshot.profile.interests.map(
            (label) => INTERESTS.find((item) => item.label === label)?.id || label,
        ),
    };
}

export async function readOnboarding(user, api) {
    if (!user?.id) throw new Error('Cần đăng nhập để tải onboarding.');
    const snapshot = validateSnapshot(user, await (await client(api)).request('/api/users/me/profile'));
    return { snapshot, preferences: onboardingPreferences(snapshot) };
}

export async function saveOnboarding(user, preferences, snapshot, api) {
    validateSnapshot(user, snapshot);
    const major = String(preferences.major || '').trim();
    const interests = [...new Set((preferences.interests || []).map((value) => String(value).trim()).filter(Boolean))];
    if (
        !MAJORS.includes(major) ||
        new Set(interests.map((value) => value.toLocaleLowerCase())).size < MIN_INTERESTS ||
        interests.length > 30 ||
        interests.some((value) => value.length > 100)
    )
        throw new Error('Vui lòng chọn chuyên ngành và ít nhất 3 sở thích hợp lệ.');
    const editable = new Set(snapshot.editableFields);
    if (!['academic.major', 'profile.interests', 'onboarding.completed'].every((field) => editable.has(field)))
        throw new Error('Máy chủ chưa cho phép hoàn tất onboarding. Vui lòng thử lại sau.');
    const body = {
        expectedVersion: snapshot.version,
        academic: { major },
        profile: { interests: interests.map((id) => INTERESTS.find((item) => item.id === id)?.label || id) },
        onboarding: { completed: true, version: ONBOARDING_VERSION, syncTimetable: Boolean(preferences.syncTimetable) },
    };
    for (const [name, value] of Object.entries(preferences.personal || {})) {
        if (editable.has('personal.' + name)) (body.personal ||= {})[name] = value || null;
    }
    const saved = validateSnapshot(
        user,
        await (
            await client(api)
        ).request('/api/users/me/profile', {
            method: 'PATCH',
            headers: { 'Idempotency-Key': crypto.randomUUID() },
            body: JSON.stringify(body),
        }),
    );
    const result = onboardingPreferences(saved);
    if (!result) throw new Error('Máy chủ chưa xác nhận hoàn tất onboarding.');
    return result;
}
