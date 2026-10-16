# Đầu mối liên hệ hoạt động

Ngày: 2026-10-16. Quy tắc xác nhận: host được chỉ định đầu tiên là đầu mối; khi chưa có host thì lấy chủ tịch CLB.

## UI

`resolveActivityContactPoint` ưu tiên DTO `contactPoint` đã được server giải quyết. Nếu API cung cấp source projections thì chọn host còn được phân công (ASSIGNED/ACTIVE), sắp theo `assignedAtUtc` tăng dần, hòa thời gian thì dùng assignment ID tăng dần. Không dựa vào thứ tự array, tên action Hosting, hệ số Leader hoặc role quản lý CLB để suy host.

Chưa có host hợp lệ thì dùng `clubPresidentContact` được server chỉ rõ. Không gán email chung của CLB hoặc manager bất kỳ làm thông tin của chủ tịch. Có host nhưng thiếu kênh liên hệ thì vẫn giữ host làm đầu mối và báo thiếu thông tin; không chuyển sang chủ tịch chỉ vì host chưa có email/điện thoại. Thiếu metadata thứ tự thì không chọn host tùy ý.

Phần Lịch & địa điểm trong Tổng quan hiển thị tên, nguồn tự động, email và điện thoại được API cho phép; dùng cùng component cho workspace/public. Không có field nhập tay để editor ghi đè auto contact. Mapper loại bỏ raw host assignments; links chỉ dùng email/phone hợp lệ.

## Backend contract cần bổ sung

Khuyến nghị server tính contact, trả contact projection trên Activity DTO:

```json
{
  "contactPoint": {
    "source": "FIRST_HOST",
    "userId": 22,
    "displayName": "Người phụ trách hoạt động",
    "email": "host@example.edu",
    "phone": "0901234567"
  }
}
```

Fallback có source `CLUB_PRESIDENT`. Chỉ trả các kênh liên hệ được phép công khai ở public endpoint; không đưa roster/profile PII vào public DTO để client tự lọc. Khi trả source projections thay resolved DTO, contract đang hỗ trợ:

```json
{
  "clubPresidentContact": { "userId": 1, "displayName": "Chủ tịch CLB", "email": "president@example.edu", "phone": "0901234567" },
  "hostAssignments": [{
    "id": 22, "assignmentKind": "HOST", "status": "ASSIGNED", "assignedAtUtc": "2026-10-16T02:00:00Z",
    "contact": { "userId": 22, "displayName": "Host đầu tiên", "email": "host@example.edu" }
  }]
}
```

Nguồn president phải lấy từ chức danh chủ tịch có hiệu lực của đúng CLB, không suy từ CLUB_MANAGER. Host lấy từ assignment chính thức. Khi chỉ định/bỏ chỉ định host, thay chủ tịch hoặc cập nhật kênh liên hệ, backend tính lại và invalidate activity detail. Nếu host đầu tiên bị bỏ phân công, host còn hiệu lực sớm nhất trở thành đầu mối; nếu không còn host thì về chủ tịch. Các quyết định này không cấp quyền quản trị.

Backend hiện chưa có contract host assignments/contact resolution trong flow action mới; thay đổi này triển khai UI/resolver, không ghi assignment/contact vào DB. Không có dữ liệu đúng contract thì UI báo chưa đồng bộ, không tạo thông tin giả.

## Verification

- Bốn Node tests mới: fallback president, host ordering/status/tie, host thiếu contact hoặc ordering, canonical DTO precedence và projection.
- 176/176 V2 Node tests đạt.
- Browser API fixture xác minh đầu mối từ chủ tịch chuyển sang host khi refresh nguồn, cùng regression modal → Xem trước → Lưu/Hủy và publication.
- Publication control đã đưa lên trước tab bar bằng slot `beforeTabs` của ActivityProfileLayout; browser kiểm tra DOM order.
- Không xác nhận backend persistence, tự động cấp assignment hoặc public contact privacy trên deployment thật.
