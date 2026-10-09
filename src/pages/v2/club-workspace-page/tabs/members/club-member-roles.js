// Describes role scope for the information table; never used for authorization.
export const CLUB_ROLE_PERMISSION_COLUMNS = [
    { id: 'participate', label: 'Tham gia hoạt động' },
    { id: 'members', label: 'Quản lý thành viên' },
    { id: 'profile', label: 'Profile CLB' },
    { id: 'eventContent', label: 'Nội dung sự kiện' },
    { id: 'eventStaff', label: 'Phân công staff sự kiện' },
    { id: 'eventApplications', label: 'Đơn đăng ký sự kiện' },
    { id: 'recruitment', label: 'Tuyển thành viên' },
    { id: 'reports', label: 'Biên bản & báo cáo' },
    { id: 'finance', label: 'Tài chính CLB' },
];

const ROLE_PERMISSION_SCOPE = {
    CLUB_OWNER: CLUB_ROLE_PERMISSION_COLUMNS.map((permission) => permission.id),
    VICE_PRESIDENT: CLUB_ROLE_PERMISSION_COLUMNS.map((permission) => permission.id),
    CONTENT: ['profile', 'eventContent'],
    EVENT: ['eventContent', 'eventStaff', 'eventApplications'],
    HR: ['profile', 'recruitment', 'profile'],
    SECRETARY: ['eventApplications', 'recruitment', 'reports', 'finance'],
    TREASURER: ['finance'],
    MEMBER: [],
};

export function clubRoleHasResponsibility(role, permission) {
    return permission === 'participate' || (ROLE_PERMISSION_SCOPE[role] || []).includes(permission);
}

export const CLUB_MEMBER_ROLES = Object.freeze([
    {
        id: 'CLUB_OWNER',
        label: 'Chủ nhiệm',
        group: 'Ban điều hành',
        supported: true,
        responsibilities: 'Định hướng CLB; phân công nhân sự; chịu trách nhiệm về hoạt động và báo cáo.',
        permissions:
            'Đầy đủ quyền vận hành trong CLB: thành viên, profile, nội dung sự kiện, phân công staff, đơn đăng ký, tuyển người, báo cáo và tài chính.',
        limits: 'Không có quyền quản trị hệ thống hoặc thay mặt CTSV. Chuyển giao chủ nhiệm dùng quy trình riêng.',
    },
    {
        id: 'VICE_PRESIDENT',
        label: 'Phó chủ nhiệm',
        group: 'Ban điều hành',
        supported: false,
        responsibilities: 'Hỗ trợ chủ nhiệm; điều phối các ban; theo dõi tiến độ và vận hành CLB.',
        permissions:
            'Đầy đủ quyền vận hành trong CLB như chủ nhiệm: thành viên, profile, nội dung sự kiện, phân công staff, đơn đăng ký, tuyển người, báo cáo và tài chính.',
        limits: 'Quyền chỉ áp dụng trong CLB; không có quyền quản trị hệ thống hoặc thay mặt CTSV. Chuyển giao chủ nhiệm dùng quy trình riêng.',
    },
    {
        id: 'CONTENT',
        label: 'Nội dung (Content)',
        group: 'Ban chuyên môn',
        supported: false,
        responsibilities: 'Viết và cập nhật profile CLB; biên soạn nội dung, hình ảnh và thông tin sự kiện.',
        permissions: 'Tạo và chỉnh sửa profile CLB và nội dung sự kiện thuộc CLB.',
        limits: 'Không quản lý thành viên, phân công staff, xử lý đơn đăng ký sự kiện hoặc quản lý tài chính.',
    },
    {
        id: 'EVENT',
        label: 'Sự kiện (Event)',
        group: 'Ban chuyên môn',
        supported: false,
        responsibilities: 'Phân công staff vào sự kiện; tạo và theo dõi đơn đăng ký sự kiện.',
        permissions: 'Phân công staff và tạo, quản lý, theo dõi đơn đăng ký sự kiện thuộc CLB.',
        limits: 'Không chỉnh sửa profile CLB, quản lý vai trò thành viên hoặc quản lý tài chính; quy trình phê duyệt sự kiện vẫn áp dụng.',
    },
    {
        id: 'HR',
        label: 'Nhân sự',
        group: 'Ban chuyên môn',
        supported: false,
        responsibilities: 'Phụ trách tuyển người, tiếp nhận thành viên mới; viết và cập nhật profile CLB.',
        permissions: 'Quản lý tuyển thành viên, gửi lời mời và xử lý đơn tham gia; tạo và chỉnh sửa profile CLB.',
        limits: 'Không thay đổi vai trò hoặc xóa thành viên hiện có; không quản lý sự kiện hoặc tài chính.',
    },
    {
        id: 'SECRETARY',
        label: 'Thư ký',
        group: 'Ban điều hành',
        supported: false,
        responsibilities: 'Ghi biên bản, tổng hợp kế hoạch, lưu hồ sơ và chuẩn bị báo cáo.',
        permissions: 'tạo/sửa bản nháp biên bản và báo cáo được phân công.',
        limits: 'Không tự nộp/duyệt báo cáo thay chủ nhiệm hoặc truy cập tài chính ngoài phạm vi được giao.',
    },
    {
        id: 'TREASURER',
        label: 'Thủ quỹ',
        group: 'Tài chính',
        supported: true,
        responsibilities: 'Theo dõi thu chi, quản lý chứng từ và phối hợp lập dự toán/quyết toán.',
        permissions: 'Sử dụng nghiệp vụ tài chính dành cho thủ quỹ theo phân công và quyền backend.',
        limits: 'Không mặc định có quyền chủ nhiệm. Hiện mỗi CLB tối đa 2 thủ quỹ; chủ nhiệm không kiêm thủ quỹ.',
    },
    {
        id: 'MEMBER',
        label: 'Thành viên',
        group: 'Thành viên',
        supported: true,
        responsibilities: 'Tham gia sinh hoạt, thực hiện nhiệm vụ và tuân thủ nội quy CLB.',
        permissions: 'Xem nội dung được chia sẻ; tham gia hoạt động và theo dõi dữ liệu cá nhân được cấp.',
        limits: 'Không quản lý người khác, duyệt đơn hoặc sửa thông tin công khai của CLB.',
    },
]);

export function normalizeClubMemberRole(role) {
    const value = String(role || '').toUpperCase();
    return value === 'CLUB_MEMBER' ? 'MEMBER' : value;
}

export function clubMemberRole(role) {
    return CLUB_MEMBER_ROLES.find((item) => item.id === normalizeClubMemberRole(role));
}

export function clubMemberRoleLabel(role) {
    return clubMemberRole(role)?.label || String(role || 'Chưa phân công');
}

// Current backend supports only these membership-role transitions. Office succession is separate.
export function supportedClubRoleChange(from, to) {
    const source = normalizeClubMemberRole(from);
    const target = normalizeClubMemberRole(to);
    return source !== target && ['MEMBER', 'TREASURER'].includes(source) && ['MEMBER', 'TREASURER'].includes(target);
}
