<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Hoạt động và đăng ký CLB — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-034 | `POST /api/activities/{activityId}/sessions` | **✅ HOÀN THÀNH** | Tạo buổi đơn/lịch lặp theo giờ Việt Nam, ngày loại trừ, occurrence ID ổn định; dời cửa sổ điểm danh theo từng buổi; chống tạo lặp và kiểm tra version. |
| API-035 | `GET /api/activities/{activityId}/sessions` | **✅ HOÀN THÀNH** | Trả các buổi cùng version, semester, attendancePolicy và snapshot nguồn điểm. |
| API-036 | `PATCH /api/activities/{activityId}/sessions/{sessionId}` | **✅ HOÀN THÀNH** | Sửa buổi đúng quyền và version; bảo vệ buổi đã có lịch sử điểm danh. |
| API-037 | `POST /api/activities/{activityId}/sessions/{sessionId}/close` | **✅ HOÀN THÀNH** | Đóng buổi theo trạng thái hợp lệ; lưu lịch sử, version và lý do. |
| API-038 | `POST /api/activities/{activityId}/sessions/{sessionId}/cancel` | **✅ HOÀN THÀNH** | Hủy có lý do/audit/outbox; thu hồi attendance và đảo điểm bằng bút toán mới. |
| API-039 | `GET /api/activities/{activityId}/sessions/{sessionId}/attendance-challenge` | **✅ HOÀN THÀNH** | QR ký HMAC, đổi mỗi 30 giây, ràng buộc activity/session/version; trả serverTime và hết hạn; chỉ manager đúng CLB được phát. |
| API-045 | `GET /api/activities` | **✅ HOÀN THÀNH** | Dữ liệu quản lý có publication/semester/version/capacity/cấu hình điểm và điểm danh; người không quản lý chỉ nhận dữ liệu cá nhân được phép. |
| API-046 | `GET /api/activities/{id}` | **✅ HOÀN THÀNH** | Chi tiết gồm cấu hình nguồn đã công bố; không lộ danh sách người khác cho thành viên thông thường. Các occurrence được lấy qua API-035. |
| API-047 | `POST /api/activities` | **✅ HOÀN THÀNH** | Tạo draft đúng CLB, lấy tên CLB từ authority; giữ cấu hình đăng ký, semester và điểm để công bố sau khi có policy hợp lệ. |
| API-048 | `PUT /api/activities/{id}` | **✅ HOÀN THÀNH** | UPDATE/PUBLISH/CLOSE có version và idempotency; PUBLISH yêu cầu policy đã duyệt và snapshot; bảo vệ dữ liệu đã có lịch sử. |
| API-049 | `DELETE /api/activities/{id}` | **✅ HOÀN THÀNH** | Hủy hoạt động mới bằng expectedVersion/reason/key; giữ lịch sử, hủy các buổi và phát sự kiện đảo điểm. |
| API-050 | `PATCH /api/activities/{id}/complete` | **✅ HOÀN THÀNH** | Hoàn thành khi hoạt động kết thúc và các buổi đã được xử lý; version, lý do, audit; không tự cộng điểm. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ core; BỎ QUA specialist consoles.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

GIỮ manager create/edit/publish/close/cancel/eligibility/capacity/window/evidence, registration/attendance/recurring IDs theo [attendance](activity-attendance-api.md). Tái sử dụng CRUD/participants/check-in; registration không là attendance/verified role.

**BỎ QUA — CHƯA CẦN:** bắt buộc CONTENT/EVENT, staff duties và form builder20fields/complex application answers review. Manager/scoped verifier đủ lõi. Điều kiện hoạt động nếu cần duyệt phải kiểm tra, không bypass vì thiếu builder.

Finance approvals/settlement/global manager grants specialist ngoài phạm vi. Staff assignment không tự cho Organizer/Leader score. Notifications/feed privacy giữ.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Event content, staff and registration applications

Implement Status: Not Yet

Status Scope: Backend implementation

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: ActivityWriteEndpoints.cs contains CRUD, participants, check-in and attendance; specialist content PATCH, staff assignment, versioned registration forms and reviewed registration application resources are absent.

D12; proposed gap behind the agreed role matrix. Existing ActivityService CRUD, participant registration, check-in and attendance remain available. There is no staff/form/submitted-answer approval contract in main 80818266. Do not replace attendance with application records. Shared [conventions](api-contract-conventions.md) apply.

2026-10-12: role names below describe presets. Authorization resolves [effective governance group capabilities](club-governance-groups-api.md); membership in any BQL group is not blanket event authority. Report submission never grants these capabilities.

## Content

The activity profile, separate viewer/workspace pages, media gallery, document uploads and embedded links are specified in [activity profile/resources](activity-profile-resources-api.md). That contract adds scoped asset capabilities; it does not make general membership or content edit permission equivalent to attendance/roster administration.

PATCH `/api/activities/{activityId}/content`: CONTENT or leadership for owning club, `{title?,description?,expectedVersion}` plus separately authorized cover attachment under D01. Validate title/description with existing activity constraints. Content permission does not grant dates/location/cancellation/finance/attendance administration. Existing management PUT stays for leadership workflow; extend service authorization intentionally instead of granting global CLUB_MANAGER to content writers.

## Staff

GET `/api/activities/{activityId}/staff`: EVENT/leadership and assigned staff can read their permitted view. PUT `/staff/{membershipId}`, `{duty,expectedVersion}` assigns approved active member of the same club; duty 1..120 characters. DELETE same resource with expectedVersion removes assignment. Reject other-club/inactive/unapproved membership, cancelled/closed event mutation and duplicate active assignment. Persist event/membership/user reference, duty, actor, audit and version; unique event+membership. Minimal public feed never exposes staff IDs. Assigned staff get only the actual event permissions named in the server capability response, not blanket club access.

## Registration form and applications

GET/PUT `/api/activities/{activityId}/registration-form`: public safe published read; EVENT/leadership write `{fields:[{id,label,type,required,options?}],capacity,opensAt,closesAt,requiresReview,expectedVersion}`. Types `TEXT|SINGLE_CHOICE|MULTI_CHOICE`, max 20 fields, label <=200, text answer <=2000, max 20 options each. Stable field IDs; reject HTML and identity/contact fields that duplicate private profile unnecessarily. Persist immutable published form version; updates never reinterpret existing answers. Event scope/eligibility remains server policy. Capacity positive <=100000 or null; opens < closes <= event end. Limits are implementation defaults, not proof of existing BE support.

POST `/api/activities/{activityId}/registrations`, self-only `{formVersion,answers,acceptedRules}`, Idempotency-Key -> `{id,status:"PENDING"|"APPROVED",version,submittedAt}`. Validate open window, published visibility and eligible active principal; server derives identity. Unique active event+user registration. Auto-approval only if the form explicitly configures `requiresReview:false`; never infer it from a missing review feature.

GET `/registrations/me`: own status/answers. POST `/registrations/{registrationId}/withdraw`: self owner, permitted pending/approved state before configured cutoff; retain history and release reserved capacity atomically. GET `/registrations?status=...&page=...` and POST `/registrations/{registrationId}/review`, `{decision:"APPROVE"|"REJECT",note,expectedVersion}`: EVENT/leadership scoped review. Approve reserves a capacity slot and creates/deduplicates the existing participant record; reject requires note. Concurrent last-seat approvals cannot overbook. Application approval is not attendance verification.

Notifications use source outbox/recipient dedupe for assignment and registration decisions; never email another applicant's answers. Explicit server action capability controls whether specialist roles can review versus write forms. Preserve platform report/approval and attendance policies.

Tests: CONTENT cannot assign staff; EVENT cannot rewrite personal profiles/finance; cross-club staff; form version/required answer; duplicate registration; closed/cancelled event; owner-only withdraw; last-seat race; no participant duplication; private answers absent from discovery. FE only currently promises these responsibilities in the role popup; full operations UI still requires an integration task after backend contracts exist.


</details>
