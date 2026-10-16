# Xuất bản hoạt động sau duyệt — V2

Ngày: 2026-10-16. Đã triển khai UI/contract; chưa triển khai backend trong thay đổi này.

## Quy tắc được yêu cầu

CTSV duyệt kế hoạch tạo **một hoạt động trong workspace**, mặc định **chưa công khai**. Content/event hoàn thiện thông tin, ảnh bìa và tài nguyên rồi người có quyền bật publish. Unpublish ẩn hoạt động khỏi các trang công khai, giữ record và dữ liệu quản lý. Publication độc lập với approval, execution và quyết toán XP; bật/tắt không cấp/thu hồi XP, không hủy hoạt động và không thay quyết định CTSV.

## UI đã thực hiện

- Trang quản lý `/v2/my-clubs/:clubCode/activities/:id` có switch “Công khai hoạt động”, nhãn trạng thái và hướng dẫn chuẩn bị nội dung. Có nút chỉnh thông tin, ảnh bìa và các tab tài nguyên đang có. Chưa công khai thì không hiện link mở trang công khai.
- Thẻ hoạt động trong workspace quản lý có nhãn Chưa công khai/Đã công khai. Record private vẫn được giữ ở workspace quản lý; workspace thành viên thường không hiển thị hoặc đếm record chưa công khai.
- Feed khám phá, gợi ý và lịch lấy từ feed lọc record `isPublished=false`. Trang detail công khai không render nội dung chưa công khai kể cả API lỡ trả record cho người quản lý đang đăng nhập. Đây là lọc phòng vệ ở client, không thay thế authorization backend.
- Switch chỉ bật khi server trả `publicationCapabilities.canManage=true`, boolean `isPublished`, version hợp lệ và người dùng có permission theo CLB. `clubAccess.permissions` nếu có phải chứa `activity.publish`; khi chưa có array thì tương thích với isManager. Capability của server vẫn bắt buộc.
- Không đổi switch lạc quan. Chỉ chấp nhận response đúng activity ID, đúng boolean mục tiêu và version tăng. Retry cùng phiên bản/mục tiêu dùng cùng Idempotency-Key. Lỗi hoặc response không hợp lệ giữ trạng thái trước đó. Đổi thành công phát tín hiệu refresh activity cho các view/tab đang mở; tín hiệu này không lưu trạng thái publication thay server.
- Khi còn ảnh/tài nguyên preview chưa lưu, switch bị khóa để người dùng hoàn tất hoặc bỏ bản preview trước. Thông tin xuất bản chưa có từ server hiển thị “Chưa đồng bộ”, switch bị khóa và giải thích rõ.
- Record từ application mới có `sourceApplicationId` mà thiếu boolean publication được xem là chưa công khai. Record legacy thiếu cả hai giữ cách hiển thị cũ để không tự ẩn dữ liệu lịch sử; backend cần migration có chủ đích.
- Detail trong workspace bỏ hai link “Đến trang CLB” và “Đến không gian CLB” ở phần đơn vị tổ chức; public detail giữ navigation hiện có.
- Đã sửa breadcrumb/học kỳ trên mobile của trang detail hoạt động thành hai hàng, tránh chồng chữ.

## Backend contract cần bổ sung

Activity DTO trong workspace và public phải có:

```json
{
  "id": 15,
  "clubId": 7,
  "sourceApplicationId": 91,
  "isPublished": false,
  "publicationVersion": 1,
  "publicationCapabilities": { "canManage": true }
}
```

`publicationCapabilities.canManage` phụ thuộc principal, club, permission và trạng thái đã duyệt. Content/event dùng quyền quản lý nội dung hiện có; role được phép xuất bản nhận `activity.publish`. Tên role không được dùng để suy quyền. ClubHub UI hiện còn manager gate ở trang ActivityManagementPage; để content/event không nằm trong isManager được truy cập toàn trang cần mở rộng scoped capability contract cho trang quản lý, không chỉ gán vai trò hoạt động host/staff.

Mutation mới qua facade `api.setActivityPublication`:

```http
PATCH /api/activities/15/publication
Idempotency-Key: stable-uuid
Content-Type: application/json

{ "isPublished": true, "expectedVersion": 1 }
```

Response tối thiểu:

```json
{ "id": 15, "isPublished": true, "publicationVersion": 2 }
```

GET detail tiếp theo phải phản ánh trạng thái mới. Backend cần:

1. Approval tạo record một lần theo source application, khởi tạo `isPublished=false`; không dùng approval để tự công khai. Retry approval không tạo hoạt động trùng.
2. Kiểm tra scoped permission, club ownership, đã được CTSV duyệt, đủ nội dung cần công khai; xử lý version conflict 409 và idempotency cùng body/cùng key. Ghi audit người thực hiện/thời điểm/phiên bản. Không cho update thông tin thường ghi đè isPublished.
3. Lọc public query/recommendation/search, public club activity lists và public resource reads ở server. Người ngoài không đọc detail/resources chưa công khai bằng URL trực tiếp. Manager queries trả cả bản chuẩn bị để quản lý. Có thể tái sử dụng endpoint detail hiện tại theo access principal; public endpoint phải enforce public scope, UI không phải lớp bảo mật.
4. Publish/unpublish làm invalidation các feed/cache liên quan; không xóa attendance/history/assignment và không tác động ledger. Quy tắc đóng/mở đăng ký/tuyển dụng sau unpublish cần backend áp dụng rõ, không tự tạo hoặc xóa nhiệm vụ từ switch UI.
5. Chốt migration trạng thái publication cho record legacy trước rollout; không tự coi mọi record cũ là bản nháp.

Các endpoint/trường này chưa có trong API checkout đã xem ở chuỗi làm việc này. Không sửa backend vì repo yêu cầu GitNexus impact trước chỉnh sửa, còn tool/runner không có trong phiên này. Switch được capability-gate cho đến khi backend hỗ trợ; không có persistence giả bằng localStorage.

## Verification

- 172/172 V2 Node tests đạt, gồm 5 test mới: publication state/legacy compatibility, public projections, workspace manager/member, permission/capability và server acknowledgement.
- Production build đạt; vẫn có cảnh báo bundle >500KB hiện có.
- 10 kiểm tra Chrome **API fixture** đạt: workspace private record, feed/direct-detail hiding, desktop/mobile controls, failed save/retry key, reload published, unpublish giữ workspace, malformed response, unsupported capability, scoped permission denial và ordinary member visibility. Không có pageerror.
- Đã xem screenshot 1440px và 390px. Chưa có integration với backend thật và chưa xác nhận auto-create unpublished sau approval trên server.
- Evidence trong visualization folder của chat: `activity-publication-browser-check.cjs`, `activity-publication-browser-results.json`, `activity-publication-desktop.png`, `activity-publication-mobile.png`.
