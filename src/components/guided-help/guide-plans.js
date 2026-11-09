const step = (element, title, description) => ({
    element,
    popover: { title, description, side: 'bottom', align: 'start' },
});
const intro = (title, description) => ({ popover: { title, description } });

export function onboardingGuidePlan(stage) {
    const shared = [
        intro(
            'Bắt đầu với ClubHub',
            'Hoàn thiện hồ sơ trong ba bước. Bạn có thể đóng hướng dẫn bằng phím Esc và mở lại bất cứ lúc nào.',
        ),
        step(
            '.v2-onboarding-steps',
            'Ba bước làm quen',
            'Kiểm tra thông tin sinh viên, bổ sung hồ sơ và chọn lĩnh vực bạn quan tâm.',
        ),
    ];
    const fields =
        stage === 1
            ? [
                  step('.v2-onboarding-email', 'Email đăng nhập', 'Kiểm tra email của tài khoản đang sử dụng.'),
                  step(
                      '.v2-onboarding-fields',
                      'Thông tin sinh viên',
                      'Đối chiếu mã sinh viên, campus, học kỳ và khóa học. Nếu campus tài khoản chưa đúng, liên hệ CTSV để được kiểm tra.',
                  ),
              ]
            : stage === 2
              ? [
                    step(
                        '.v2-onboarding-section:first-of-type',
                        'Chuyên ngành',
                        'Chọn chuyên ngành trước khi tiếp tục.',
                    ),
                    step(
                        '.v2-onboarding-section:last-of-type',
                        'Thông tin cá nhân',
                        'Ngày sinh, số điện thoại và địa chỉ có thể bổ sung sau trong hồ sơ.',
                    ),
                ]
              : [
                    step(
                        '.v2-access-interest-grid',
                        'Sở thích của bạn',
                        'Chọn ít nhất ba lĩnh vực. Bạn có thể thay đổi sở thích trong hồ sơ sau này.',
                    ),
                ];
    return [
        ...shared,
        ...fields,
        step(
            '.v2-onboarding-actions',
            'Tiếp tục hoặc quay lại',
            'Dùng các nút này để chuyển bước. Chỉ nút Hoàn tất và khám phá mới lưu phần thông tin bạn vừa nhập.',
        ),
    ];
}

export function clubGuidePlan(pathname) {
    const navigation = step(
        '.v2-left-rail-nav, .v2-workspace-left-rail-nav',
        'Điều hướng',
        'Mở các mục phù hợp với tài khoản và câu lạc bộ của bạn.',
    );
    let title = 'Khám phá ClubHub';
    let steps = [
        step(
            '.v2-recommended-activities',
            'Hoạt động dành cho bạn',
            'Xem hoạt động sắp tới và lọc theo trạng thái. Mở một thẻ để xem chi tiết.',
        ),
        step(
            '#club-directory',
            'Tìm cộng đồng phù hợp',
            'Tìm kiếm và lọc câu lạc bộ theo lĩnh vực. Mở trang CLB để xem thông tin và cách tham gia.',
        ),
    ];
    if (/\/reports\//.test(pathname)) {
        title = 'Báo cáo câu lạc bộ';
        steps = [
            step(
                '.v2-report-editor-steps, .v2-report-tabs',
                'Các phần báo cáo',
                'Kiểm tra lần lượt nội dung và các mục bắt buộc trước khi lưu hoặc nộp.',
            ),
            step(
                '.v2-report-editor-card',
                'Nội dung báo cáo',
                'Điền thông tin và minh chứng phù hợp với loại báo cáo.',
            ),
            step(
                '.v2-report-editor-actions',
                'Lưu và nộp',
                'Lưu nháp để tiếp tục chỉnh sửa. Kiểm tra đầy đủ thông tin trước khi nộp duyệt.',
            ),
        ];
    } else if (/\/workspace(?:\/|$)/.test(pathname) || /^\/v2\/my-clubs\//.test(pathname)) {
        title = 'Không gian câu lạc bộ';
        steps = [
            step(
                '.v2-workspace-club-switcher',
                'Đổi câu lạc bộ',
                'Chọn CLB bạn muốn làm việc nếu tài khoản tham gia nhiều CLB.',
            ),
            step(
                '.v2-workspace-term',
                'Học kỳ đang xem',
                'Kiểm tra học kỳ trước khi xem hoạt động, thành viên và báo cáo.',
            ),
            step(
                '.v2-workspace-main h1',
                'Nội dung của mục đang mở',
                'Các chức năng hiển thị theo vai trò và quyền của bạn trong CLB.',
            ),
        ];
    } else if (pathname === '/v2/activities') {
        title = 'Khám phá hoạt động';
        steps = [
            step(
                '.v2-event-filter-bar',
                'Tìm và lọc hoạt động',
                'Tìm theo tên hoặc chuyển giữa Sắp diễn ra và Đang diễn ra.',
            ),
            step(
                '.v2-event-grid',
                'Xem chi tiết',
                'Mở thẻ hoạt động để kiểm tra lịch, địa điểm và điều kiện tham gia.',
            ),
        ];
    } else if (/^\/v2\/activities\//.test(pathname)) {
        title = 'Chi tiết hoạt động';
        steps = [
            step(
                '#v2-main h1',
                'Thông tin hoạt động',
                'Kiểm tra thời gian, địa điểm và trạng thái trước khi tham gia.',
            ),
            step(
                '#v2-main .v2-panel',
                'Nội dung và điều kiện',
                'Đọc hướng dẫn của CLB. Các thao tác đăng ký hoặc nhận việc chỉ hiện khi bạn đủ điều kiện.',
            ),
        ];
    } else if (pathname === '/v2/clubs') {
        title = 'Danh sách câu lạc bộ';
        steps = [
            step('.v2-filter-bar', 'Tìm câu lạc bộ', 'Lọc theo lĩnh vực, từ khóa và tình trạng tuyển thành viên.'),
            step('.v2-club-grid', 'Trang câu lạc bộ', 'Mở thẻ để xem thông tin, lịch hoạt động và điều kiện tham gia.'),
        ];
    } else if (pathname === '/v2/my-clubs') {
        title = 'Câu lạc bộ của tôi';
        steps = [
            step(
                '.v2-my-clubs-grid',
                'Các CLB bạn tham gia',
                'Mở một CLB để vào không gian làm việc. Lời mời và đơn chờ duyệt có trạng thái riêng.',
            ),
        ];
    } else if (pathname === '/v2/profile') {
        title = 'Hồ sơ của bạn';
        steps = [
            step(
                '.v2-profile-identity',
                'Thông tin và ảnh hồ sơ',
                'Dùng Chỉnh sửa để cập nhật hồ sơ, hoặc mở ảnh đại diện và ảnh bìa để thay ảnh.',
            ),
            step(
                '.v2-profile-columns',
                'Hồ sơ và trải nghiệm',
                'Xem thông tin cá nhân, sở thích và các kết quả trải nghiệm đã được ghi nhận.',
            ),
        ];
    } else if (pathname === '/v2/study-schedule' || pathname === '/v2/my-schedule') {
        title = 'Lịch trình của bạn';
        steps = [
            step(
                '.v2-study-schedule-period',
                'Chọn thời gian',
                'Chọn học kỳ và block trước khi nhập hoặc xem lịch học.',
            ),
            step(
                '.v2-study-schedule-grid',
                'Lịch học theo tuần',
                'Chọn ô để xem hoặc cập nhật lịch khi học kỳ cho phép chỉnh sửa.',
            ),
            step('#v2-main h1', 'Lịch trình cá nhân', 'Đối chiếu lịch học với các hoạt động bạn đã đăng ký.'),
        ];
    } else if (pathname === '/v2/personal-experience') {
        title = 'Trải nghiệm cá nhân';
        steps = [
            step(
                '.personal-experience-page h1',
                'Theo dõi trải nghiệm',
                'Xem hồ sơ trải nghiệm và trạng thái xử lý của từng lần gửi.',
            ),
            step(
                '.personal-experience-form',
                'Gửi trải nghiệm',
                'Điền thông tin và minh chứng. Kiểm tra kỹ trước khi gửi để CTSV xét duyệt.',
            ),
        ];
    } else if (/^\/v2\/clubs\//.test(pathname)) {
        title = 'Tìm hiểu câu lạc bộ';
        steps = [
            step('#v2-main h1', 'Thông tin CLB', 'Xem giới thiệu, lĩnh vực và thông tin liên hệ của CLB.'),
            step(
                '.v2-club-header .v2-button, .v2-club-profile-header .v2-button',
                'Tham gia câu lạc bộ',
                'Theo dõi trạng thái tuyển thành viên và sử dụng thao tác tham gia khi có sẵn.',
            ),
        ];
    }
    return [
        intro(
            title,
            'Cùng tìm hiểu các phần chính của trang đang mở. Dùng Tiếp theo, Quay lại hoặc Esc để đóng hướng dẫn.',
        ),
        navigation,
        ...steps,
    ];
}
