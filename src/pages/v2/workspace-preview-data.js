const activity = [
    {
        title: 'Code Camp: Build for Campus',
        meta: '28/09 · Innovation Lab',
        status: 'Sắp diễn ra',
        tag: 'Workshop',
        icon: 'calendar',
    },
    {
        title: 'React từ cơ bản đến dự án',
        meta: '02/10 · Phòng Beta 304',
        status: 'Đã đăng ký',
        tag: 'Đào tạo',
        icon: 'calendar',
    },
    {
        title: 'Tech Talk: AI for Students',
        meta: '05/10 · Hội trường Gamma',
        status: 'Mở đăng ký',
        tag: 'Chia sẻ',
        icon: 'calendar',
    },
];
const attendance = [
    {
        title: 'Code Camp: Build for Campus',
        meta: 'Phiên check-in mở lúc 08:00 · 28/09',
        status: 'Sắp mở',
        tag: 'QR check-in',
        icon: 'scan',
    },
    {
        title: 'Workshop Git & GitHub',
        meta: 'Đã hoàn thành · 24 thành viên tham dự',
        status: 'Đã đóng',
        tag: 'Hoàn tất',
        icon: 'scan',
    },
    {
        title: 'Họp ban điều hành tháng 10',
        meta: 'Chưa có phiên điểm danh',
        status: 'Bản nháp',
        tag: 'Nội bộ',
        icon: 'scan',
    },
];
const quests = [
    {
        title: 'Chia sẻ recap hoạt động',
        meta: 'Gửi bài viết hoặc ảnh minh chứng trước 30/09',
        status: 'Còn 3 ngày',
        tag: '+20 điểm',
        icon: 'flag',
    },
    {
        title: 'Hoàn thành hồ sơ thành viên',
        meta: 'Cập nhật kỹ năng và lĩnh vực bạn quan tâm',
        status: 'Đang mở',
        tag: '+10 điểm',
        icon: 'flag',
    },
    {
        title: 'Hỗ trợ tân thành viên',
        meta: 'Đăng ký đồng hành cùng một thành viên mới',
        status: 'Còn 7 ngày',
        tag: '+30 điểm',
        icon: 'flag',
    },
];
const members = [
    {
        title: 'Nguyễn Khánh Linh',
        meta: 'Ban kỹ thuật · Tham gia từ 09/2025',
        status: 'Chủ nhiệm',
        tag: 'KL',
        icon: 'users',
    },
    {
        title: 'Trần Nhật Minh',
        meta: 'Ban nội dung · Hoạt động tích cực',
        status: 'Thành viên',
        tag: 'NM',
        icon: 'users',
    },
    {
        title: 'Lê Hoài An',
        meta: 'Thành viên mới · Đã tham gia 2 hoạt động',
        status: 'Thành viên',
        tag: 'HA',
        icon: 'users',
    },
];
const points = [
    {
        title: 'Điểm đóng góp tháng 9',
        meta: 'Ghi nhận từ hoạt động và nhiệm vụ đã hoàn thành',
        status: '120 điểm',
        tag: 'Tháng này',
        icon: 'award',
    },
    {
        title: 'Huy hiệu Người kết nối',
        meta: 'Đạt 3 lần hỗ trợ thành viên mới',
        status: 'Đang tiến độ',
        tag: '2/3',
        icon: 'award',
    },
    {
        title: 'Bảng thành tích',
        meta: 'Khám phá những cột mốc của bạn trong CLB',
        status: 'Mới cập nhật',
        tag: 'Fall 2026',
        icon: 'award',
    },
];
const gifts = [
    { title: 'Áo thun F-Code', meta: 'Đổi bằng 250 điểm đóng góp', status: 'Còn 12', tag: '250 điểm', icon: 'gift' },
    {
        title: 'Sticker pack F-Code',
        meta: 'Bộ nhãn dán phiên bản Fall 2026',
        status: 'Còn 36',
        tag: '60 điểm',
        icon: 'gift',
    },
    {
        title: 'Vé workshop chuyên sâu',
        meta: 'Ưu tiên đăng ký các buổi đào tạo nội bộ',
        status: 'Đang mở',
        tag: '180 điểm',
        icon: 'gift',
    },
];
const reports = [
    {
        title: 'Báo cáo hoạt động tháng 9',
        meta: 'Cập nhật tiến độ và kết quả hoạt động trong tháng',
        status: 'Bản nháp',
        tag: '30/09',
        icon: 'file',
    },
    {
        title: 'Tổng kết học kỳ Fall 2026',
        meta: 'Báo cáo các mục tiêu và cột mốc học kỳ',
        status: 'Chưa bắt đầu',
        tag: '15/12',
        icon: 'file',
    },
    {
        title: 'Kế hoạch hoạt động tháng 10',
        meta: 'Các hoạt động dự kiến và nguồn lực cần chuẩn bị',
        status: 'Đang duyệt',
        tag: 'Nội bộ',
        icon: 'file',
    },
];
const finance = [
    {
        title: 'Quỹ hoạt động Fall 2026',
        meta: 'Tổng quan thu chi trong học kỳ hiện tại',
        status: '12.500.000đ',
        tag: 'Số dư',
        icon: 'wallet',
    },
    {
        title: 'Workshop React',
        meta: 'Đề xuất chi phí tài liệu và địa điểm',
        status: 'Chờ duyệt',
        tag: '2.000.000đ',
        icon: 'wallet',
    },
    {
        title: 'Tài trợ sự kiện tháng 9',
        meta: 'Khoản thu đã được xác nhận',
        status: 'Hoàn tất',
        tag: '+5.000.000đ',
        icon: 'wallet',
    },
];
const clubPage = [
    {
        title: 'Thông tin công khai',
        meta: 'Tên, mô tả, hình ảnh và liên kết hiển thị trên trang CLB',
        status: 'Đã cập nhật',
        tag: 'Công khai',
        icon: 'settings',
    },
];
const memberSettings = [
    {
        title: 'Đang tuyển thành viên',
        meta: 'Thiết lập trạng thái và biểu mẫu đăng ký',
        status: 'Đang mở',
        tag: 'Fall 2026',
        icon: 'settings',
    },
];

export const workspacePreviewRecords = {
    'Hoạt động': activity,
    'Điểm danh': attendance,
    'Nhiệm vụ & đóng góp': quests,
    'Thành viên': members,
    'Cài đặt thành viên': memberSettings,
    'Điểm & thành tích': points,
    'Kho quà': gifts,
    'Báo cáo': reports,
    'Tài chính': finance,
    'Trang CLB': clubPage,
};
