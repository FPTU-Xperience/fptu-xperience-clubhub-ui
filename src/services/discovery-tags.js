export const EXPERIENCE_TAGS = [
    ['Academic', 'Học tập'], ['Research', 'Nghiên cứu'], ['Global', 'Quốc tế'],
    ['CultureSports', 'Thể thao & văn hóa'], ['Community', 'Cộng đồng'],
    ['Entrepreneurship', 'Khởi nghiệp'], ['RealWorldWork', 'Thực chiến dự án (+1)'],
];

export const ACTIVITY_TAG_CATEGORIES = [
    ['workshop', 'Workshop'], ['competition', 'Cuộc thi'], ['talk', 'Hội thảo'],
    ['volunteering', 'Tình nguyện'], ['networking', 'Giao lưu'], ['performance', 'Biểu diễn'],
    ['sports', 'Thể thao'], ['other', 'Hoạt động khác'],
];

export function tagDraft(value) {
    return {
        experience: value?.experience ?? [],
        activityCategory: value?.activityCategory ?? '',
        customText: value?.custom?.join(', ') ?? '',
    };
}

export function tagSelectionPayload(draft) {
    const custom = draft.customText.split(',').map((tag) => tag.normalize().trim().replace(/\s+/g, ' ')).filter(Boolean);
    if (custom.length > 10 || custom.some((tag) => !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .&+#/_-]{0,39}$/u.test(tag))
        || new Set(custom.map((tag) => tag.toUpperCase())).size !== custom.length) {
        throw new Error('Nhập tối đa 10 tag khác nhau, mỗi tag 1–40 ký tự. Phân cách bằng dấu phẩy.');
    }
    return { experience: draft.experience, activityCategory: draft.activityCategory || null, custom };
}

export function readDiscoveryTags(value) {
    return Array.isArray(value) ? value.filter((tag) => typeof tag?.id === 'string' && typeof tag.label === 'string') : [];
}

export function tagSearchText(item) {
    return (item.discoveryTags ?? []).map((tag) => tag.label).join(' ');
}

export function matchesTag(item, id) {
    return !id || (item.discoveryTags ?? []).some((tag) => tag.id === id);
}
