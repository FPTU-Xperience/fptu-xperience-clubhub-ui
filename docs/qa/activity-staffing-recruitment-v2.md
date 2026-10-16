# Detail hoạt động — Phân công & Tuyển dụng

Ngày: 2026-10-16. Trạng thái: UI, shared client và contract đã triển khai; API backend cho flow này chưa có ở checkout đã kiểm tra.

## UI

- Detail workspace và public có thêm **Phân công** và **Tuyển dụng**. Workspace manager có controls khi server cấp capability; public viewer chỉ thấy phân công của chính mình và các vị trí được phép đọc/tham gia.
- Phân công: chọn người đủ điều kiện do server trả, action đã duyệt và loại HOST/STAFF. Có gỡ phân công theo `canRemove`, xem occurrence/completion, số lượt đã xác minh và raw XP chờ duyệt. Xác minh chỉ khi aggregate và completion cấp quyền, người xác minh khác người được ghi nhận, và kế hoạch đã được duyệt.
- Tuyển dụng: một nhiệm vụ cho hoạt động, nhiều vị trí liên kết action. Có tạo/sửa title/description, public/private, eligibility và capacity; mở/đóng tuyển. Private dùng thành viên CLB; public có thể chọn sinh viên trường hoặc thành viên CLB. Loại HOST/STAFF là trường tường minh, không suy từ tên action/hệ số điểm.
- Người đủ điều kiện bấm tham gia để nhận assignment ngay; không thêm bước duyệt đơn tuyển. `canJoin`, trạng thái OPEN và approval kiểm soát button. Backend phải xử lý capacity/dedup; client không tự cộng slot hoặc tạo assignment trước response.
- **Nhiệm vụ & đóng góp** của CLB đã thay placeholder bằng danh sách recruitment summaries. Chọn một nhiệm vụ mở cùng `ActivityStaffingPanel`, gọi đúng activity staffing aggregate. Không copy recruitment sang một local task riêng.
- Assignment/verification/join không có thao tác credit XP. UI phân biệt nhận việc, xác minh và XP chờ CTSV duyệt báo cáo kết thúc. Attendance/action source và ledger còn thuộc backend proposal.
- Mutations dùng expectedVersion và stable Idempotency-Key cho cùng path/body. Receipt cần đúng activityId và version tăng; lỗi không giả thành công. Missing API trả thông báo rõ, có retry. Không có browser persistence cho staffing/recruitment.
- Read-only observation không cho mutations. Private recruitment cần capability đọc khi không ở manager view. Frontend lọc assignments theo userId cho public viewer; backend vẫn phải không trả dữ liệu người khác.

## Contract

Tất cả dùng auth facade `api.request`, được bọc trong `src/services/activity-staffing.js`.

| Route | Chức năng |
| --- | --- |
| GET `/api/activities/{id}/staffing` | Aggregate chung cho hai tab và nhiệm vụ của CLB |
| POST `/api/activities/{id}/assignments` | `{ userId, actionRuleId, assignmentKind, expectedVersion }` |
| POST `/api/activities/{id}/assignments/{assignmentId}/cancel` | `{ expectedVersion }`, gỡ assignment không xóa lịch sử đóng góp |
| POST `/api/activities/{id}/action-completions/{completionId}/verify` | `{ expectedVersion, completionVersion }`, chỉ xác minh nguồn đã có, không tạo credit |
| POST/PATCH `/api/activities/{id}/recruitment` | Tạo một nhiệm vụ hoặc sửa cùng recruitment |
| PATCH `/api/activities/{id}/recruitment/status` | `{ status: OPEN/CLOSED, expectedVersion }` |
| POST `/api/activities/{id}/recruitment/positions/{positionId}/join` | `{ expectedVersion }`, user lấy từ principal |
| GET `/api/clubs/{clubId}/activity-recruitments` | Array hoặc `{ items }`; filters theo `workspaceSemesterQuery(semester, 'activities')` |

GET staffing ví dụ manager:

```json
{
  "activityId": 15,
  "version": 1,
  "applicationStatus": "APPROVED",
  "capabilities": {
    "canManageAssignments": true,
    "canManageRecruitment": true,
    "canOpenRecruitment": true,
    "canVerify": true,
    "canViewRecruitment": true
  },
  "actions": [{ "id": 2, "name": "Staff supporting", "expectedPeople": 3 }],
  "eligibleAssignees": [{ "userId": 10, "displayName": "Nguyễn An" }],
  "assignments": [{
    "id": 44,
    "userId": 10,
    "displayName": "Nguyễn An",
    "assignmentKind": "STAFF",
    "actionName": "Staff supporting",
    "status": "ASSIGNED",
    "canRemove": true,
    "verifiedOccurrences": 0,
    "pendingRawXp": 0,
    "completions": [{ "id": 50, "version": 1, "occurrenceLabel": "Ca 1", "status": "PENDING", "canVerify": true }]
  }],
  "recruitment": {
    "id": 77,
    "title": "Tuyển staff workshop",
    "description": "Hỗ trợ tổ chức",
    "visibility": "PUBLIC",
    "eligibility": "SCHOOL_STUDENTS",
    "status": "OPEN",
    "positions": [{
      "id": 101,
      "actionRuleId": 2,
      "actionName": "Staff supporting",
      "assignmentKind": "STAFF",
      "capacity": 3,
      "filledCount": 0,
      "rawXpPerOccurrence": 150,
      "canJoin": true,
      "joinBlockReason": null,
      "myAssignmentId": null
    }]
  }
}
```

`recruitment: null` khi chưa tạo. Public projection chỉ trả assignments của principal, không trả eligibleAssignees hoặc trường quản trị người khác. Private không đủ quyền trả 403/404, không trả nội dung rồi dựa vào UI ẩn.

Body tạo/sửa recruitment:

```json
{
  "title": "Tuyển staff workshop",
  "description": "Hỗ trợ tổ chức",
  "visibility": "PUBLIC",
  "eligibility": "SCHOOL_STUDENTS",
  "positions": [{ "actionRuleId": 2, "assignmentKind": "STAFF", "capacity": 3 }],
  "expectedVersion": 1
}
```

Mọi mutation có `Idempotency-Key`, response `{ "activityId": 15, "version": 2 }` (có thể kèm assignment/recruitment IDs). GET sau đó trả nguồn canonical mới. Summary list của CLB: `{ id: recruitmentId, clubId, activityId, activityTitle, title, status, visibility, canView }`. Cùng recruitment ID 77 được dùng ở cả hai chỗ.

Backend cần kiểm tra quyền scoped, approval, published/private visibility, eligibility, capacity, action limits/budget và version; slot cuối xử lý nguyên tử, retry không tạo assignment trùng. Không tự xác minh phần việc của mình. Tạo host assignment cần invalidate/resolution đầu mối liên hệ theo quy tắc host đầu tiên/chủ tịch. Tạo/sửa recruitment không được âm thầm sửa action policy hoặc hạn mức XP đã duyệt. Không xóa completion/history khi gỡ assignment. Chỉ CTSV duyệt báo cáo kết thúc mới cho ledger ghi điểm.

## Giới hạn

Không sửa backend trong thay đổi này. Repo API yêu cầu GitNexus impact trước chỉnh sửa, nhưng MCP/runner chưa có trong phiên. Các endpoint trên là contract mới; chưa có persistence, capacity concurrency hoặc approval/XP posting được kiểm chứng trên backend thật. UI không giả dữ liệu khi endpoint chưa triển khai.

## Kiểm tra

- 179/179 V2 Node tests đạt, gồm contract/validation vị trí/idempotency.
- Production build đạt; cảnh báo bundle >500KB hiện có.
- Chrome API fixture kiểm tra thêm phân công host, verify occurrence, tạo/mở tuyển, nhiệm vụ chung, sinh viên join/retry, own assignments/private visibility, approval guard và API chưa hỗ trợ.
- Evidence tại visualization folder của chat: `activity-staffing-browser-check.cjs`, `activity-staffing-browser-results.json`, `activity-recruitment-desktop.png`, `activity-recruitment-mobile.png`.
