# Contract tài khoản nội bộ và phân quyền xác minh — 2026-10-12

Implement Status: Not Yet

Status Scope: BE existing accounts and scoped verification; future governance separated

Backend Progress: PARTIAL_EXISTING_SOURCE_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#roster).

**Đã có BE:** Internal register/login, canonical profile và verification assignment/capability hiện có; action verifier kiểm tra quyền độc lập và không tự duyệt.

**Chưa hoàn thành / giới hạn:** Nguồn học vụ chính thức và quyền governance xuyên service chưa hoàn thành. Import roster chỉ ghép email trường, không tạo account.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Contract tài khoản nội bộ và phân quyền xác minh — 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-001 | `POST /api/auth/internal/register` | **✅ HOÀN THÀNH** | Password được hash; server gán role Sinh viên; body có username/email/password/displayName. Dùng route thực tế, không gọi đề xuất /api/auth/register. |
| API-002 | `POST /api/auth/internal/login` | **✅ HOÀN THÀNH** | Đăng nhập email/password, kiểm tra active/locked, trả auth envelope và refresh token hiện có. Không dùng dev-login làm login production. |
| API-057 | `GET /api/verifications/me/queue` | **🟡 CHƯA HOÀN THIỆN** | Queue đúng assignment/no-self cho contribution/upgrade/manual; hiện chỉ clubId/page/pageSize, pending states. Chưa hỗ trợ sourceType/status và total riêng cho 3 nhóm; total chỉ đếm items contribution. |
| API-065 | `GET /api/verification-assignments` | **✅ HOÀN THÀNH** | Xem assignment admin; route thực tế /api/verification-assignments, lọc userId/clubId. |
| API-066 | `POST /api/verification-assignments` | **✅ HOÀN THÀNH** | Cấp assignment cho account active/unlocked, sourceType CLUB/EXTERNAL/REAL_WORLD và capabilities, time/reason/key; resolve account từ Auth. |
| API-067 | `PATCH /api/verification-assignments/{assignmentId}` | **✅ HOÀN THÀNH** | Sửa/thu hồi theo expectedVersion/isRevoked/reason, recheck tại review; không dùng path đề xuất /api/verifier-assignments. |

<!-- BE_STATUS_2026_10_14_END -->

**GIỮ — BẮT BUỘC (F01, F10).** Phiếu v1.4: hệ thống dùng tài khoản/API/DB dự án, bảo vệ mật khẩu; người xác minh là tài khoản nội bộ được phân quyền. [Phạm vi](capstone-scope-contract.md) chỉ có bốn actor sản phẩm.

## Tài khoản và session

BE đã có internal register/login bằng password, canonical self profile và verification assignment. Các route thực tế/DTO nằm trong [hướng dẫn tích hợp](be-integration-guide.md); dev-login chỉ Development/Test.

Route chốt: POST `/api/auth/internal/register` `{username,email,password,displayName}` →201; POST `/api/auth/internal/login` `{email,password}` → auth envelope. Tái sử dụng refresh/logout/users/me. Không có alias `/api/auth/register` hoặc `/api/auth/login`. Password 12–128 ký tự; server gán role Sinh viên, không dùng account nội bộ làm chứng nhận sinh viên trường.

Server gán role Sinh viên ban đầu; không nhận role/admin/verifier/club quyền từ register. Email unique normalized, mật khẩu không lưu plain text/log/response, hash một chiều có salt theo thư viện được dự án chọn. Validation/password policy/giới hạn rate được cấu hình và kiểm thử. Login sai trả lỗi không tiết lộ quá mức account existence; locked/inactive không phát session. Logout/refresh/revocation/cross-account kiểm tra DB/phiên hiện có. HTTPS khi triển khai, token/cookie theo cơ chế session dự án.

GIỮ dev-login như luồng tương thích/demo đã có, không dùng làm bằng chứng password authentication; **BỎ QUA — NGOÀI PHẠM VI** tích hợp FAP/SSO chính thức. Google login hiện có không bị xóa nhưng không là phụ thuộc nghiệm thu tài khoản nội bộ.

Self GET/PATCH `/api/users/me/profile` theo [profile](self-profile-sync-api.md). Tối thiểu displayName/about/contact tùy chọn, version, editableFields, persisted self ownership. Email/global role/lock/assignment không sửa qua profile. Academic fields nếu hiển thị chỉ là dữ liệu dự án có provenance, không tuyên bố đã được trường xác nhận.

## Capability và phân công

| Actor | Capability tối thiểu, đúng scope |
| --- | --- |
| Sinh viên | self profile, own applications/registrations/attendance requests/contributions/radar/quests/notifications |
| Quản lý CLB | `club.profile.write`, `club.members.manage`, `club.roles.assign`, `activity.manage`, `attendance.manage`, `club.plan.manage`, `club.analytics.read`, `club.report.export`; `contribution.review` chỉ khi có phạm vi xác minh được cấp |
| Người xác minh | `contribution.review`/`attendance.verify` theo assignment; nguồn CLUB/EXTERNAL/REAL_WORLD, CLB/hồ sơ/campus dự án, thời hạn và trạng thái |
| Quản trị | `accounts.manage`, `verification.assign`, `clubs.admin`, `semesters.manage`, `scoring.policy.manage`, `audit.read`, `experience.adjust` theo quyền; không mặc nhiên duyệt thủ công hồ sơ của mình |

Quyền lấy từ server, không suy từ tên chức vụ hoặc frontend popup. Một manager có thể đồng thời là verifier trong CLB được giao, nhưng không xét self-review; admin quản lý quyền không đồng nghĩa verifier mọi nguồn. Grant không tự mở backoffice/finance. Các mã AuthRole cũ được mapping rõ, không rename toàn hệ thống trong lần chỉnh contract.

Route chốt GET/POST `/api/verification-assignments`, PATCH `/{id}` (GUID). POST `{userId,sourceType,clubId,capabilities,startsAt,expiresAt,reason}`; PATCH `{expectedVersion,isRevoked,reason,expiresAt?}`. Một sourceType cho mỗi assignment: CLUB/EXTERNAL/REAL_WORLD; +1 dùng REAL_WORLD. Chỉ Admin quản lý assignment; account phải active/unlocked, có audit và reason. Scope campus/contributionIds chưa có trong DTO này; không gửi các trường proposal đó.

Hiện có GET `/api/verifications/me/queue?clubId=...&page=1&pageSize=20`: chỉ hồ sơ thuộc assignment/capability hiện hành, trả safe metadata. Detail/download/review recheck assignment tại commit, không chỉ khi load queue. Declarations queue/review legacy có thể được dùng qua adapter với cùng policy; tránh triển khai hai authority review cho một record.

Thu hồi quyền có version/audit/invalidation, ảnh hưởng request sau và review đang chạy tại commit. Cấm người dùng tự promote/grant/approve hồ sơ mình qua route role/quest/bulk attendance. Chức vụ CLB cũ không bắt buộc triển khai đủ8 loại; catalog tối thiểu có manager/owner/member đủ quản lý vai trò trong phiếu, phần mở rộng đã đánh dấu BỎ QUA tại [roles](club-governance-groups-api.md).

## Quản trị và audit

Tái sử dụng quản trị account/role/lock, club create/update/status, semester CRUD, audit read có sẵn. Đảm bảo chính sách quyền của bốn actor và các phân công được lưu DB, không dùng local flags. Config scoring theo [điểm](experience-scoring-contract.md), correction theo [sổ cái](verified-contributions-api.md).

Audit ghi actor/resource/action/time/before-after cần thiết/reason/outcome/traceId/policyVersion, không log password/token/raw GPS/raw evidence. Duyệt/từ chối/bổ sung/thu hồi phải truy được người và căn cứ, lịch sử vẫn tồn tại sau restart. **BỎ QUA** yêu cầu tổ chức cấp trường, import roster chính thức, uy tín verifier tự động hay workflow hai cấp.

## Nghiệm thu

Register không cấp role; email duplicate/race; password không lộ; login/refresh/logout/locked; self profile đối chiếu account; manager đúng/sai CLB; verifier được/không được giao; admin không bypass self-review; assignment revoked giữa load/review; private evidence; restart lưu accounts/assignments/audit; API/UI kiểm tra quyền độc lập.

</details>
