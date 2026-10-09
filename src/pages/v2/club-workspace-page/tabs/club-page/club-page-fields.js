export const CLUB_CATEGORY_LABELS = {
    SPORTS: 'Thể thao',
    ARTS: 'Nghệ thuật',
    ACADEMIC: 'Học thuật',
    VOLUNTEER: 'Tình nguyện',
    TECHNOLOGY: 'Công nghệ',
    OTHER: 'Khác',
};

export const CLUB_PAGE_FIELDS = [
    { name: 'name', label: 'Tên CLB', maxLength: 200, required: true },
    { name: 'category', label: 'Lĩnh vực', options: CLUB_CATEGORY_LABELS },
    { name: 'description', label: 'Giới thiệu CLB', maxLength: 1000, multiline: true },
    { name: 'contactEmail', label: 'Email liên hệ', type: 'email', maxLength: 255 },
    { name: 'contactPhone', label: 'Số điện thoại', type: 'tel', maxLength: 20 },
    { name: 'scheduleLabel', label: 'Lịch sinh hoạt', maxLength: 500, multiline: true },
];

export const CLUB_PAGE_TABS = [
    { id: 'general', label: 'Thông tin chung', fields: ['name', 'category'] },
    { id: 'description', label: 'Giới thiệu', fields: ['description'] },
    { id: 'contact', label: 'Liên hệ', fields: ['contactEmail', 'contactPhone'] },
    { id: 'schedule', label: 'Lịch sinh hoạt', fields: ['scheduleLabel'] },
];
