# Lịch học cá nhân và lịch học kỳ — 2026-10-27

Hai tính năng đã có backend và frontend gọi API. Chi tiết request/response, quyền campus, version và lỗi nằm trong [contract hiện hành](contracts/study-schedule-api.md).

| Phần | Nguồn dữ liệu hiện tại |
| --- | --- |
| Lịch cá nhân /v2/study-schedule | AuthService; GET toàn block, PUT/DELETE một ô, POST template bulk-import |
| Lịch học kỳ /academic-calendar | AdminService; GET/PUT ba mốc ngày theo campus và học kỳ chính thức |
| Admin UI riêng | AcademicCalendar trong khu học kỳ, dùng cùng endpoint và version backend |
| Helpers frontend | Chỉ còn quy tắc ngày/tuần/slot, validate và chuyển đổi DTO để hiển thị |

Đã xóa repository mock, persistence localStorage, migration local và nút chuyển lịch cũ. Không tự động upload dữ liệu cũ trong trình duyệt. Tuần/slot vẫn giữ đúng 10W trước 3W, 3W có 7 slot; bulk import xem trước và gửi template để backend áp dụng nguyên khối.

Backend đã có migration PrivateStudySchedules và AcademicCalendarBySemester, endpoint và test hợp đồng. Không cần tạo thêm API hay database song song. Calendar cần alias Workspace:SemesterAliases:{semester-guid}:Year/Term trong cấu hình backend để nối năm/kỳ với semester chính thức; thiếu alias thì trả lỗi, không dựng lịch local.

Phân biệt bằng chứng: kiểm tra source, test adapter/build frontend và test backend sẵn có không thay thế nghiệm thu có đăng nhập trên API đang deploy. Không ghi nhận đã chạy thử mutation production trong lần dọn code này.
