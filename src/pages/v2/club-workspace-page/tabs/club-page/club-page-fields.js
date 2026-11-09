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
    { name: 'expectedLocation', label: 'Địa điểm sinh hoạt', maxLength: 500 },
    { name: 'majorEvents', label: 'Sự kiện lớn dự kiến', maxLength: 2000, multiline: true },
    { name: 'equipmentNeeds', label: 'Thiết bị cần thiết', maxLength: 1000, multiline: true },
    { name: 'advisorNeeded', label: 'Nhu cầu cố vấn', options: { false: 'Chưa cần cố vấn', true: 'Cần cố vấn hoặc người hướng dẫn' } },
];

export const CLUB_PAGE_TABS = [
    { id: 'general', label: 'Thông tin chung', fields: ['name', 'category'] },
    { id: 'description', label: 'Giới thiệu', fields: ['description'] },
    { id: 'contact', label: 'Liên hệ', fields: ['contactEmail', 'contactPhone'] },
    { id: 'schedule', label: 'Lịch sinh hoạt', fields: ['scheduleLabel'] },
    { id: 'additional', label: 'Thông tin bổ sung', fields: ['expectedLocation', 'majorEvents', 'equipmentNeeds', 'advisorNeeded'] },
];
