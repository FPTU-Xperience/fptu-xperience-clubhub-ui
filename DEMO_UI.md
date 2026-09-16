# ClubHub desktop UI preview

## Chạy bản mock

```powershell
cd C:\Users\ADMIN\Downloads\DOAN\fptu-xperience-clubhub-ui
npm ci
npm run dev -- --port 5174 --open false
```

Mở **http://localhost:5174/demo**. Đường dẫn `/` và các trang cũ vẫn hoạt động như trước; `/demo` là khu xem thử độc lập.

- Chỉ thiết kế desktop/laptop (từ khoảng 1060px). Không có phiên bản mobile trong phạm vi này.
- Không cần đăng nhập Google để xem mock. Thanh **UI LAB** đổi nhân vật minh họa, không cấp quyền cho tài khoản thật.
- Không mount AuthProvider/NotificationProvider thật trên route `/demo`; các thao tác demo không gọi API nghiệp vụ.
- Tất cả dữ liệu trong bộ nhớ của phiên trang. **Reload hoặc Reset demo sẽ về dữ liệu ban đầu.** Không sửa DB, token hoặc localStorage hiện có.
- Theme của bản demo là sáng; không thay đổi theme/cài đặt của giao diện cũ.
- Preview dùng ngày giả lập **16/09/2026, 10:00 giờ Việt Nam**. Mã check-in giả lập: **FPT26**. Không dùng camera, GPS hoặc QR bảo mật thật.

## Các đường dẫn chính

| Trang | Đường dẫn |
| --- | --- |
| Khám phá | `/demo` |
| Hoạt động mở | `/demo/events` |
| Giới thiệu F-Code | `/demo/clubs/fcode` |
| CLB của tôi | `/demo/my-clubs` |
| Không gian F-Code | `/demo/my-clubs/fcode` |
| Hồ sơ portfolio | `/demo/profile` |

Trong CLB: `activities`, `attendance`, `quests`, `members`, `points`, `gifts`, `reports`, `finance`, `settings`. Menu và kiểm tra đường dẫn theo tư cách thành viên tại CLB, không theo vai trò ở CLB khác.

## Nhân vật để thử

- **Linh:** chủ F-Code, thành viên FStyle. Chuyển CLB để kiểm tra menu quản lý/thành viên.
- **Minh:** thành viên F-Code và Cóc Xanh. Dùng để nộp đóng góp và thử check-in.
- **An:** chưa thuộc CLB. Gửi đơn F-Code, đổi sang Linh duyệt, đổi lại An để vào CLB.
- **Bảo:** chủ FStyle và Cóc Xanh. Có thể xác nhận trao quà cho Linh ở FStyle.
- **Hà:** role khác, vẫn xem khu khám phá; không tự động trở thành chủ CLB. Link Hệ thống hiện tại mở ứng dụng cũ bằng phiên đăng nhập thật, không chuyển nhân vật mock sang tài khoản thật.

## Luồng thử đề xuất

1. Linh → CLB của tôi → F-Code: xem dashboard, duyệt đơn, danh sách thành viên.
2. Chuyển sang FStyle: menu Báo cáo/Tài chính/Cài đặt biến mất; thử mở URL `/demo/my-clubs/fstyle/reports` để thấy màn không có quyền.
3. FStyle → Điểm danh → nhập FPT26: lịch sử và điểm cập nhật; thao tác trùng bị ngăn.
4. Đổi quà → túi tote: số dư và tồn kho thay đổi, điểm thành tích không bị trừ.
5. An → Khám phá → F-Code → gửi đơn; Linh → Thành viên → duyệt; An → CLB của tôi có F-Code.
6. Minh → Nhiệm vụ: có đóng góp mẫu đang chờ; Linh → Nhiệm vụ → xác nhận kèm lý do; điểm Minh tăng đúng CLB.
7. Linh → Hoạt động → Tạo hoạt động; Báo cáo → lưu nháp/nộp; Cài đặt → sửa giới thiệu và kiểm tra lại trang công khai.
8. Hồ sơ → Chỉnh sửa → lưu; Xem bản chia sẻ → mã sinh viên, điểm chi tiết và lịch sử riêng tư được ẩn.
9. Chọn Summer 2026: xem dữ liệu lưu trữ; các thao tác thay đổi bị tắt.
10. Bộ chọn trạng thái trên UI LAB trong CLB: đầy đủ/rỗng/đang tải/lỗi để kiểm tra UI và thử lại.

## Giới hạn có chủ ý của mock

- Tài chính: chỉ tổng quan thu chi mẫu, không thanh toán hay luồng thủ quỹ.
- Báo cáo: văn bản nháp/nộp mock, chưa upload tệp hoặc có hệ thống duyệt thật.
- Điểm: quy tắc đơn giản phục vụ tương tác demo. Radar là hình minh họa có nhãn, chưa là kết quả engine XP/6+1.
- Hồ sơ: sửa giới thiệu và kỹ năng; chưa upload avatar, chứng chỉ, xuất PDF hoặc công bố đường dẫn xác thực.
- Thông báo: lịch sử thao tác trong phiên, không phải hệ thống gửi thông báo thật.
- Chưa tích hợp BE, chưa kiểm chứng bảo mật/phân quyền BE. UI guard không thay thế kiểm soát truy cập server.

## Kiểm tra tự động

```powershell
npm run test:demo
npm run test:demo:routes
npm run build
```

- `test:demo`: 10 ca kiểm tra trạng thái, cách ly CLB, đăng ký/check-in, đơn tham gia, điểm/quà, báo cáo, học kỳ lưu trữ.
- `test:demo:routes`: render 18 route, gồm route bị chặn khi sai CLB/vai trò.
- Kiểm thử trình duyệt bổ sung: chuyển vai trò/CLB, gửi và duyệt đơn, check-in, đổi quà, sửa hồ sơ và bản chia sẻ.

## Tổ chức code

`src/demo/model.js`: fixture và các chuyển trạng thái có kiểm tra quyền. `DemoContext.jsx`: trạng thái trong bộ nhớ. `DemoApp.jsx`: route và khung UI. Các trang tách thành Discover, Workspace, Activities, Community, Profile; `ui.jsx` và `demo.scss` chứa thành phần/thiết kế dùng chung. `src/main.jsx` chỉ thêm nhánh lazy `/demo/*`, giữ nguyên provider của hệ thống hiện hữu ở các route còn lại.
