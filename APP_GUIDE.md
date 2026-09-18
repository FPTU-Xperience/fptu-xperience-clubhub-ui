# Hướng dẫn Ứng dụng ClubHub Desktop UI

## Chạy ứng dụng

```powershell
npm install
npm run dev
```

Mở trình duyệt tại **http://localhost:5173/**. Ứng dụng hoạt động trực tiếp tại đường dẫn gốc `/`, dành cho Sinh viên, Ban chủ nhiệm CLB và Cán bộ CTSV.

- Thiết kế desktop/laptop chuẩn trường học (từ khoảng 1060px).
- Dùng `AuthProvider` và cơ chế đăng nhập email/Google FPT. Đăng nhập thành công đi vào trang Khám phá hoặc onboarding nếu là tài khoản sinh viên mới.
- Thanh **UI LAB** hỗ trợ chuyển đổi nhân vật minh họa trong dữ liệu mẫu (hoặc tự động đồng bộ tài khoản thật khi kết nối BE API).

## Các đường dẫn chính

| Trang | Đường dẫn | Chức năng |
| --- | --- | --- |
| Khám phá CLB | `/` | Tìm kiếm, lọc lĩnh vực, xem CLB nổi bật |
| Hoạt động mở | `/events` | Lịch sự kiện và workshop toàn trường |
| Giới thiệu CLB | `/clubs/:clubId` | Chi tiết thông tin, ban chủ nhiệm, nộp đơn gia nhập |
| CLB của tôi | `/my-clubs` | Danh sách CLB đang tham gia & đang quản lý |
| Không gian làm việc CLB | `/my-clubs/:clubId` | Workspace tổng quan của CLB |
| Hoạt động nội bộ | `/my-clubs/:clubId/activities` | Quản lý & đăng ký hoạt động nội bộ |
| Điểm danh | `/my-clubs/:clubId/attendance` | Điểm danh thành viên qua mã check-in |
| Thành viên | `/my-clubs/:clubId/members` | Danh sách thành viên & xét duyệt đơn |
| Nhiệm vụ & đóng góp | `/my-clubs/:clubId/quests` | Giao việc, nộp đóng góp, duyệt điểm |
| Sổ điểm CLB | `/my-clubs/:clubId/points` | Bảng xếp hạng và điểm cống hiến |
| Kho quà CLB | `/my-clubs/:clubId/gifts` | Đổi quà và vật phẩm kỷ niệm |
| Báo cáo CLB | `/my-clubs/:clubId/reports` | Báo cáo định kỳ gửi CTSV |
| Tài chính CLB | `/my-clubs/:clubId/finance` | Quản lý dự trù, quyết toán và quỹ |
| Cài đặt CLB | `/my-clubs/:clubId/settings` | Cập nhật thông tin giới thiệu |
| Hồ sơ sinh viên | `/profile` | Portfolio hoạt động, biểu đồ radar 6 trụ cột trải nghiệm FPTU |

## Kiểm tra tự động

```powershell
npm test
npm run test:smoke
npm run build
```

- `test:smoke`: Kiểm tra render toàn bộ 18 route chính của ứng dụng tại đường dẫn gốc.
- `build`: Kiểm tra quá trình đóng gói production bundle với Vite.

## Cấu trúc thư mục chuẩn Doanh nghiệp

- `src/api/`: Các client API modular (`client.js`, `auth.api.js`, `clubs.api.js`, `activities.api.js`, `reports.api.js`, `finance.api.js`, `notifications.api.js`,...).
- `src/components/ui/`: Thư viện thành phần giao diện dùng chung (`Avatar`, `Pill`, `Modal`, `Toast`, `Empty`,...).
- `src/components/club/`: Thư viện thành phần miền CLB (`ClubArt`, `ClubMark`, `ClubCard`, `EventCard`).
- `src/components/layout/`: Layout ứng dụng chuẩn (`AppShell`, `AppHeader`, `AppFooter`).
- `src/features/`: Các mô-đun tính năng (`discovery`, `my-clubs`, `workspace`, `activities`, `community`, `profile`).
- `src/routes/`: Router ứng dụng tại `AppRoutes.jsx`.
- `src/core/`: Domain models & mock data fallback tại `model.js`.
- `src/context/`: `AuthContext.jsx`, `ClubHubContext.jsx`, `ThemeContext.jsx`.
