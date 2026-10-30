const page = (path, element, title, description) => ({
    path,
    element,
    popover: { title, description, side: 'bottom', align: 'start' },
});

export function publicGuidePlan(origin, personal = true) {
    const plan = [
        {
            path: origin,
            popover: {
                title: 'Khám phá ClubHub từng bước',
                description:
                    'Hướng dẫn sẽ đưa bạn qua các mục chính. Dùng Tiếp theo hoặc Quay lại để chuyển mục. Khi kết thúc hoặc đóng, bạn sẽ trở về trang ban đầu.',
            },
        },
        page(
            '/v2',
            '.v2-discovery-hero',
            'Khám phá',
            'Bắt đầu từ trang Khám phá để tìm cộng đồng và hoạt động phù hợp.',
        ),
        page(
            '/v2',
            '.v2-recommended-activities',
            'Gợi ý hoạt động',
            'Xem các hoạt động sắp tới, lọc theo trạng thái và mở thẻ để tìm hiểu.',
        ),
        page(
            '/v2/clubs',
            '#v2-main h1',
            'Câu lạc bộ',
            'Danh sách CLB có bộ lọc lĩnh vực, từ khóa và tình trạng tuyển thành viên.',
        ),
        page(
            '/v2/clubs',
            '.v2-filter-bar',
            'Tìm CLB phù hợp',
            'Dùng ô tìm kiếm và các bộ lọc. Mở thẻ CLB để xem cách tham gia.',
        ),
        page(
            '/v2/activities',
            '.v2-event-filter-bar',
            'Hoạt động',
            'Xem hoạt động công khai cùng campus và hoạt động nội bộ của CLB bạn đang tham gia. Lọc Sắp diễn ra hoặc Đang diễn ra.',
        ),
    ];
    if (personal)
        plan.push(
            page(
                '/v2/my-clubs',
                '#v2-main h1',
                'Câu lạc bộ của tôi',
                'Theo dõi CLB đã tham gia, lời mời và đơn đang chờ duyệt. Mở CLB để vào không gian làm việc.',
            ),
            page(
                '/v2/my-schedule',
                '#v2-main h1',
                'Lịch trình',
                'Xem lịch hoạt động của các CLB bạn đang tham gia để sắp xếp thời gian.',
            ),
            page(
                '/v2/study-schedule',
                '.v2-study-schedule-period',
                'Lịch học',
                'Chọn học kỳ và block để xem hoặc nhập thời khóa biểu. Kiểm tra lịch học trước khi chọn hoạt động.',
            ),
            page(
                '/v2/personal-experience',
                '.personal-experience-page h1',
                'Trải nghiệm cá nhân',
                'Theo dõi hồ sơ đã gửi. Khi gửi trải nghiệm mới, bổ sung thông tin và minh chứng để CTSV xét duyệt.',
            ),
        );
    plan.push(
        page(
            '/v2/profile',
            '.v2-profile-identity',
            'Hồ sơ cá nhân',
            'Cập nhật thông tin, ảnh và sở thích; xem các kết quả trải nghiệm đã được ghi nhận.',
        ),
        page(
            '/v2/profile',
            '.v2-left-rail-account-trigger',
            'Mở lại hướng dẫn',
            'Mở menu tài khoản và chọn Hướng dẫn sử dụng bất cứ khi nào cần. Bấm Hoàn tất để trở về trang ban đầu.',
        ),
    );
    return plan;
}
