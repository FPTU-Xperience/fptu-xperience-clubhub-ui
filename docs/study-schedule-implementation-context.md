# Lịch học theo tuần — context để triển khai BE

Trạng thái ghi nhận: 2026-10-07. Đây là quyết định sản phẩm và handoff triển khai, không phải xác nhận API đã hoạt động. Contract chi tiết nằm ở [study-schedule-api.md](contracts/study-schedule-api.md); trạng thái từng page nằm ở [page-integration-checklist.md](contracts/page-integration-checklist.md).

## Quyết định đã chốt

- Mỗi năm có ba học kỳ `SP`, `SU`, `FA`; UI hiển thị mã hai chữ số năm như `FA26`, `SP27`. Mỗi học kỳ có Block `10W` học trước, rồi Block `3W`. Tuần của từng block đánh số riêng: 1–10 và 1–3.
- Sinh viên quản lý lịch theo **từng tuần** trên bảng Thứ Hai–Chủ nhật. Dropdown chọn tuần nằm giữa hai nút mũi tên tuần trước/tuần sau, ngay cạnh tên học kỳ và block trên panel lịch; tiêu đề và bảng ghép thành một panel liền mạch. Khi có ngày cấu hình, hiển thị số tuần lịch, khoảng ngày và ngày trên cột.
- Bulk import nhận tên môn, ngày, timeslot và phòng tùy chọn; áp cùng mẫu vào mọi tuần của block được chọn. Sửa một ô sau đó chỉ ảnh hưởng tuần đó.
- **Admin UI là nơi cấu hình** ba ngày riêng cho từng học kỳ: `termStartDate`, `block10StartDate`, `block3StartDate`. Sinh viên chỉ đọc. Hai block bắt đầu vào Thứ Hai; `block3StartDate` không sớm hơn 70 ngày sau `block10StartDate`, nên có thể có khoảng nghỉ giữa hai block. Ngày bắt đầu học kỳ có thể khác ngày bắt đầu 10W.
- 10W dùng 5 slot: 07:00–09:15, 09:30–11:45, 12:30–14:45, 15:00–17:15, 17:30–19:45. 3W dùng 7 slot 90 phút từ 07:00 đến 19:15, nghỉ 15 phút giữa slot và 30 phút nghỉ trưa. Chi tiết ID slot trong contract.
- Giữ `dev-login` hiện có. Lịch môn học là dữ liệu riêng của tài khoản; lịch học kỳ là cấu hình chung do admin sở hữu.

## Hiện trạng FE và nguồn dữ liệu

| Phần | Hiện trạng và file sở hữu |
| --- | --- |
| Admin cấu hình ngày | `/academic-calendar` trong [AcademicCalendarPage](../src/pages/AcademicCalendarPage.jsx), route được chặn bởi `MANAGE_ACADEMIC_CALENDAR`; mock chung trình duyệt ở [academic-calendar-repository.js](../src/pages/v2/academic-calendar-repository.js). Quyền UI cấp cho `ADMIN`, `SYSTEM_ADMIN`, `STUDENT_AFFAIRS_ADMIN`. |
| Sinh viên nhập lịch | `/v2/study-schedule` trong [StudySchedulePage](../src/pages/v2/personal-pages/StudySchedulePage.jsx); lịch riêng theo user/năm/kỳ/block/tuần trong [study-schedule-repository.js](../src/pages/v2/study-schedule-repository.js). |
| Quy tắc tuần, slot và migration local | [study-schedule-data.js](../src/pages/v2/study-schedule-data.js), [academic-calendar-data.js](../src/pages/v2/academic-calendar-data.js), [test](../src/pages/v2/study-schedule-data.test.js). |

Mock dùng `localStorage`: calendar ở `clubhub:v2:academic-calendar`, lịch cá nhân ở `clubhub:v2:study-schedule:<authenticated-id>`. Hai trang chỉ chia sẻ calendar trong **cùng trình duyệt**. Mock không cung cấp phân quyền bảo mật, đồng bộ giữa thiết bị hay dữ liệu học kỳ chính thức. Khi chưa có ngày do admin cấu hình, sinh viên vẫn quản lý tuần theo số trong block và không hiện ngày lịch. `termStarts` do sinh viên từng nhập trong mock cũ bị bỏ qua, không được nâng thành cấu hình chung.

Theo [PRODUCT_REQUIREMENTS.md](../PRODUCT_REQUIREMENTS.md), FPTUX Admin sở hữu cấu hình hệ thống trong sản phẩm cuối. Route `/academic-calendar` ở repo UI này là bề mặt mock hiện tại. Khi tích hợp, xác nhận màn cấu hình sẽ đặt trong FPTUX Admin riêng hay giữ tại Admin UI hiện có; dù đặt ở đâu, BE phải là nguồn dữ liệu chung và bảo vệ thao tác ghi theo role.

## Việc cần làm khi triển khai thật

1. BE tạo calendar chung theo `(year, term)`: GET cho actor đăng nhập; PUT chỉ cho admin được phép. Validate ba ngày, Thứ Hai cho hai block, thứ tự 10W trước 3W, và lưu thông tin người sửa. Thêm gateway route. Xem JSON, mã lỗi và role trong [contract](contracts/study-schedule-api.md).
2. BE tạo timetable riêng theo authenticated user và `(year, term, block, week, day, slotId)`: GET toàn block, PUT/DELETE một ô theo tuần, POST bulk import một transaction. Không nhận user ID từ client. Theo contract hiện tại, GET timetable kèm `calendar`, và calendar cũng có GET riêng cho Admin UI/trang sinh viên.
3. FE thay mock repository bằng request qua [src/services/api.js](../src/services/api.js); giữ auth/refresh/error handling có sẵn. Trang sinh viên chỉ đọc calendar, trang admin chỉ ghi qua endpoint có phân quyền server. Tránh kết nối trực tiếp page tới `fetch` riêng.
4. Không tự động đẩy `localStorage` lên BE. Nếu cần chuyển dữ liệu mock, tạo bước review/xác nhận riêng cho người sở hữu lịch. Dữ liệu calendar do sinh viên nhập trước đây không được migrate thành lịch chung.
5. Kiểm tra trên hai tài khoản và hai trình duyệt: admin sửa ba ngày, sinh viên tải lại thấy tuần/ngày đúng; user thường bị 403 khi PUT calendar; lịch môn học của hai user tách biệt; bulk import, sửa riêng tuần, chuyển 10W/3W, đổi năm và tuần qua ranh giới năm vẫn đúng. Kiểm tra khoảng nghỉ giữa block và trường hợp chưa có calendar.

Kiểm thử FE gần nhất khi tạo mock: `npm run test:demo` đạt 64/64, `npm run build` đạt (cảnh báo kích thước bundle). Browser QA của trang lịch học vẫn chưa hoàn tất; không coi các kiểm thử này là bằng chứng tích hợp BE.
