# Trạng thái API BE cho FE — 23/10/2026

Implement Status: Done

Status Scope: Documentation: current BE operation status, not all backend features complete

Backend Progress: PARTIAL_PROJECT

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#overview).

**Đã có BE:** Đồng bộ 40 operation mới và 13 operation có extension/fix; đầy đủ các nhãn source/partial/deferred.

**Chưa hoàn thành / giới hạn:** Chưa hoàn thành toàn bộ contract, chưa xác nhận FE hay deploy; số 74 operation cũ chỉ là checkpoint lịch sử.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.


## Cách đọc

Nguồn BE là nhánh `feat/backend-contract-completion`, **không phải main**. Muốn tích hợp phải chạy đúng commit/migration/cấu hình; push Git không chứng minh server đã deploy. JSON đồng hành: [be-api-status.json](be-api-status.json). [Hướng dẫn wire hiện hành](backend-current-integration.md) ưu tiên hơn ví dụ đề xuất/lịch sử.

- **✅ Đã có BE**: source/HTTP/SQL đã có trong phạm vi ghi rõ; không tự là FE/live Done.
- **🟡 Chưa hoàn thiện**: chỉ dùng phần đã nêu. POST resources chỉ hỗ trợ EMBED; canManage không thay canUpload/supportedKinds.
- **⏳ Chưa triển khai**: không gọi như API thật; stub 501 không được tính là hoàn thành.
- **⏸ Tạm hoãn**: phần điểm mới chờ chủ sản phẩm chốt; không xóa, không giả null thành 0.
- **⏭ Bỏ qua/optional**: giữ yêu cầu và code; không tính là core đã hoàn thành.

**40** là số operation mới so với BE `b066f96`, không phải tổng API hệ thống. **16/16** consumer operation từng thiếu route ở audit 21/10 đã có handler; điều đó không xác nhận đủ nghiệp vụ tất cả contract. Không cộng trùng API dùng chung theo actor. Bảng 74 operation/32 sinh viên của 14/10 giữ dưới lịch sử, không phải backlog hiện hành.

## 40 operation mới có triển khai trong phạm vi ghi rõ

| Method | Route | Actor | Trạng thái BE / giới hạn |
| --- | --- | --- | --- |
| GET | `/api/clubs/{clubId}/workspace-semesters` | Quản lý CLB, Thành viên đã duyệt, CTSV/Admin có phạm vi | **✅ Đã có BE trong phạm vi này** — Overall workspace attribution/governance remains partial. |
| GET | `/api/clubs/{clubId}/invitation-semesters` | Quản lý CLB, CTSV/Admin có phạm vi | **✅ Đã có BE trong phạm vi này** — Availability from authoritative roster revision; revalidate identity on invite/consent/approval. |
| GET | `/api/clubs/{clubId}/experience-policies` | Quản lý CLB, Thành viên đã duyệt, CTSV/Admin có phạm vi | **✅ Đã có BE trong phạm vi này** — Canonical semester; approved PERIOD/environment policies only. |
| GET | `/api/v2/activities/{activityId}/sessions` | Sinh viên đã đăng ký | **✅ Đã có BE trong phạm vi này** — Registration/current eligibility required; submission authority revalidates writes. |
| GET | `/api/clubs/me/membership-applications` | Sinh viên: chính chủ | **✅ Đã có BE trong phạm vi này** — Legacy UNKNOWN is preserved; self-only capabilities. |
| POST | `/api/clubs/me/membership-applications/{applicationId}/withdraw` | Sinh viên: chính chủ | **✅ Đã có BE trong phạm vi này** — Own pending APPLICATION only; no body, optional Idempotency-Key. |
| POST | `/api/activity-applications` | Quản lý CLB | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| GET | `/api/activity-applications` | Quản lý CLB, CTSV/Admin | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| GET | `/api/activity-applications/{id}` | Quản lý CLB, CTSV/Admin | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| PATCH | `/api/activity-applications/{id}` | Quản lý CLB | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| POST | `/api/activity-applications/{id}/submit` | Quản lý CLB | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| POST | `/api/activity-applications/{id}/review` | CTSV/Admin | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| GET | `/api/activity-applications/{id}/history` | Quản lý CLB, CTSV/Admin | **✅ BE vận hành; điểm tạm hoãn** — expectedRawXp=null; scoringStatus=DEFERRED_BY_PRODUCT_OWNER |
| PATCH | `/api/activities/{id}/publication` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| GET | `/api/activities/{id}/staffing` | Quản lý CLB, Sinh viên, Người xác minh | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/assignments` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/assignments/{assignmentId}/cancel` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/assignments/{assignmentId}/completions` | Sinh viên | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/assignments/{assignmentId}/attendance-claims` | Sinh viên | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/action-completions/{completionId}/verify` | Người xác minh | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/recruitment` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| PATCH | `/api/activities/{id}/recruitment` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| PATCH | `/api/activities/{id}/recruitment/status` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| POST | `/api/activities/{id}/recruitment/positions/{positionId}/join` | Sinh viên | **✅ Đã có BE trong phạm vi này** — No new point award; manual attendance claims are not QR check-in. |
| GET | `/api/clubs/{clubId}/activity-recruitments` | Quản lý CLB, Sinh viên | **✅ Đã có BE trong phạm vi này** |
| GET | `/api/clubs/{clubId}/eligible-members` | Quản lý CLB | **✅ Đã có BE trong phạm vi này** |
| POST | `/api/v1/semesters/{identifier}/roster-imports/preview` | CTSV/Admin | **✅ Đã có BE trong phạm vi này** — Existing school-email accounts only; no implicit account creation. |
| POST | `/api/v1/semesters/{identifier}/roster-imports/{importId}/commit` | CTSV/Admin | **✅ Đã có BE trong phạm vi này** — Existing school-email accounts only; no implicit account creation. |
| GET | `/api/v1/semesters/{identifier}/student-roster` | CTSV/Admin | **✅ Đã có BE trong phạm vi này** — Existing school-email accounts only; no implicit account creation. |
| GET | `/api/academic-calendar/{year}/{term}` | Tất cả actor | **✅ Đã có BE trong phạm vi này** — FE consumer still browser-local; deployment/live acceptance pending. |
| PUT | `/api/academic-calendar/{year}/{term}` | CTSV/Admin | **✅ Đã có BE trong phạm vi này** — FE consumer still browser-local; deployment/live acceptance pending. |
| GET | `/api/users/me/study-schedule/{year}/{term}/{block}` | Tất cả actor: self-only | **✅ Đã có BE trong phạm vi này** — FE consumer still browser-local; deployment/live acceptance pending. |
| PUT | `/api/users/me/study-schedule/{year}/{term}/{block}/{week}/{day}/{slotId}` | Tất cả actor: self-only | **✅ Đã có BE trong phạm vi này** — FE consumer still browser-local; deployment/live acceptance pending. |
| DELETE | `/api/users/me/study-schedule/{year}/{term}/{block}/{week}/{day}/{slotId}` | Tất cả actor: self-only | **✅ Đã có BE trong phạm vi này** — FE consumer still browser-local; deployment/live acceptance pending. |
| POST | `/api/users/me/study-schedule/{year}/{term}/{block}/bulk-import` | Tất cả actor: self-only | **✅ Đã có BE trong phạm vi này** — FE consumer still browser-local; deployment/live acceptance pending. |
| GET | `/api/activities/{activityId}/resources` | Quản lý CLB hiện tại, Thành viên CLB đã duyệt, Người xem đã xác thực trong phạm vi | **✅ Đã có BE trong phạm vi này** — Authenticated scope only; CLUB links limited to current club member/manager; no anonymous or private file delivery. |
| POST | `/api/activities/{activityId}/resources` | Quản lý CLB hiện tại | **🟡 EMBED đã có; DOCUMENT/MEDIA chưa làm** — DOCUMENT/MEDIA not implemented (501); required Idempotency-Key; at most 100 attached resources. |
| PATCH | `/api/activities/{activityId}/resources/{resourceId}` | Quản lý CLB hiện tại | **✅ Đã có BE trong phạm vi này** — GUID expectedVersion; title/visibility/position only; required Idempotency-Key. |
| DELETE | `/api/activities/{activityId}/resources/{resourceId}` | Quản lý CLB hiện tại | **✅ Đã có BE trong phạm vi này** — JSON expectedVersion/reason and Idempotency-Key; soft detach retains immutable audit. |
| GET | `/api/activities/{activityId}/resources/history` | Quản lý CLB hiện tại | **✅ Đã có BE trong phạm vi này** — Current authority required; paginated; no former-manager grant. |

## Operation hiện có được mở rộng/sửa

| Method | Route | Trạng thái / hành vi đã thay |
| --- | --- | --- |
| GET | `/api/users/me/profile` | Hồ sơ chính chủ + học vụ read-only; major/year chưa có nguồn. |
| PATCH | `/api/users/me/profile` | GUID expectedVersion; headline/DOB/address + avatar/cover; omitted giữ/null xóa; Idempotency-Key tùy chọn. |
| POST | `/api/media/upload-intents` | club-logo/club-cover/activity-cover/student-avatar/student-cover; không phải upload tài liệu/video. |
| GET | `/api/clubs/{id}` | Manager DTO trả version, coverImageUrl, schedule (F01). |
| GET | `/api/clubs/me/managed` | Cùng metadata manager, không mở rộng roster visibility. |
| PATCH | `/api/clubs/{id}/public-profile` | Text/schedule có version; giữ scope quản lý hiện tại. |
| PUT | `/api/clubs/{id}/public-images` | F02: chỉ trường gửi mới thay; null xóa; verify owner/kind; CAS. |
| PUT | `/api/activities/{activityId}/cover-image` | GUID activity expectedVersion; media verified owner; không dùng URL tùy ý. |
| GET | `/api/activities/{id}` | Publication bool/int cho application-owned; detail thêm EMBED resources/capabilities/availability; không phải public transport. |
| GET | `/api/activities` | Giữ GUID activity version; application-owned bổ sung isPublished/publicationVersion, không dùng CLOSE để ẩn. |
| POST | `/api/clubs/{id}/join` | Reapply tạo ID mới, previousApplicationId, giữ lịch sử/consent; không auto-approve. |
| GET | `/api/clubs/me/memberships` | Code/logo/source/version/capabilities/semester/consent; legacy không đủ nguồn giữ UNKNOWN. |
| POST | `/api/clubs/{clubId}/members` | Bắt buộc semesterId; kiểm tra school-email/account/roster/campus, outbox; consent và duyệt kiểm tra lại. |

## Chưa hoàn thành và tạm hoãn

| Phần | Trạng thái / việc FE cần giữ |
| --- | --- |
| Điểm action/final report/raw budget/caps/+1/rollover/reversal và task credit/wallet/redemption | **⏸ TẠM HOÃN theo chủ dự án**. expectedRawXp=null, scoringStatus=DEFERRED_BY_PRODUCT_OWNER, canAwardPoints=false; VERIFIED completion chưa trao điểm. |
| Tài liệu/video | **⏳ CHƯA TRIỂN KHAI**. Upload-intents và commit DOCUMENT/MEDIA trả 501; canUpload=false. Private delivery/scanner/quarantine/cleanup chưa có. |
| Public activity detail ẩn danh | **⏳ CHƯA TRIỂN KHAI**. CAMPUS_PUBLIC vẫn cần tài khoản cùng campus; không đổi sang anonymous bằng filter FE. |
| Governance đa nhóm | **⏳ CHƯA HOÀN THÀNH**. Term/groups/revision/union/expiry/report/nominations và quyền xuyên service; migration thủ quỹ cũ đang chờ quyết định. |
| Cosmetics/layout, application-logo/club-shape | **⏳ CHƯA HOÀN THÀNH / cần policy**. Avatar/cover cơ bản không chứng minh inventory/equip đã có. |
| Ngành/năm học chính thức | **⏳ CHƯA CÓ NGUỒN**. major/year=null, NO_AUTHORITATIVE_SOURCE; academic chỉ đọc. |
| Directory/pins/custom forms/physical fulfillment/contest/office succession | **⏭ OPTIONAL / BỎ QUA / CẦN ĐẶC TẢ**. Giữ nguyên, không đếm như core Done. |
| FE adapters, browser E2E, shared migrations, deploy, R2/delivery live | **CHƯA NGHIỆM THU**. Lượt này chỉ sửa tài liệu FE; không chuyển consumer hay UI. |

## Bằng chứng

BE suite đã chạy tại commit trên: **914 passed / 0 failed / 0 skipped** (123 unit, 85 Admin integration, 706 Backend stabilization); có SQL upgrade/CAS, Gateway route selection và coverage. Build -warnaserror, 15 style/model checks gồm 8 service EF và diff-check đạt. Đây là bằng chứng BE đã có, **không phải vừa chạy FE E2E hay nghiệm thu production**. [Manifest/proof gốc](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/contracts/be-operation-manifest.json).

<details>
<summary>Checkpoint 14/10: 74 operation — lịch sử, không dùng làm trạng thái hoặc tổng backlog hiện hành</summary>

# Trạng thái API BE để tích hợp FE — 14/10/2026

Đây là bảng tiến độ BE hiện hành, đối chiếu mã nguồn working tree trên nhánh `feat/student-api-completion`, commit nền `80818266`. Đọc cùng [hướng dẫn request/response thực tế](be-integration-guide.md) và [phạm vi v1.4](capstone-scope-contract.md). Đánh giá theo operation và phần yêu cầu còn thiếu; có route không tự đồng nghĩa hoàn thành.

## Cách dùng nhãn

| Nhãn | Ý nghĩa và cách làm FE |
| --- | --- |
| **✅ HOÀN THÀNH** | Đã triển khai core nghiệp vụ BE theo phạm vi/DTO hiện tại; FE có thể tích hợp API thật. Không đồng nghĩa đã triển khai trên server hoặc màn hình FE đã xong. |
| **🟡 CHƯA HOÀN THIỆN** | Có route, dùng được phần ghi rõ; còn thiếu yêu cầu contract. FE chỉ dùng phần hiện có và thể hiện phần còn thiếu là chưa hỗ trợ. |
| **⏳ CHƯA TRIỂN KHAI** | Chưa có route/nghiệp vụ tương ứng; không gọi proposal hoặc dựng dữ liệu giả như kết quả API thật. |
| **⏭ BỎ QUA — CHƯA CẦN** | Ngoài phạm vi hoặc chưa cần. Giữ tài liệu/mã; không tính vào công việc MVP bắt buộc. |

Trạng thái này ưu tiên hơn nhận định “chưa có API” và checklist tiến độ ngày 05–12/10. Nội dung lịch sử vẫn được giữ. Phần yêu cầu chưa triển khai vẫn là đề xuất. **HOÀN THÀNH BE khác HOÀN THÀNH FE**: người làm FE phải tích hợp, kiểm tra quyền/lỗi/version/retry và thử trên môi trường được cấu hình.

## Đếm theo mốc 74 operation

| Actor tính chính | Hoàn thành | Chưa hoàn thiện | Chưa triển khai | Còn việc |
| --- | ---: | ---: | ---: | ---: |
| Sinh viên | 32 | 0 | 0 | 0 |
| Quản lý CLB | 23 | 1 | 0 | 1 |
| Người xác minh | 5 | 3 | 0 | 3 |
| Quản trị hệ thống | 4 | 6 | 0 | 6 |
| **Tổng 74 operation** | **64** | **10** | **0** | **10** |

Đây là 74 operation từng còn việc ở kiểm kê 12/10, không phải tổng mọi route của hệ thống. Không cộng trùng API dùng chung. Các route hỗ trợ/bổ sung và chức năng BỎ QUA nằm ngoài tổng này. Sinh viên đã hoàn thành 32/32 operation. Quản lý CLB hoàn thành 23/24, còn API-033 thiếu read version cho manager; Người xác minh và Quản trị hệ thống giữ các phần PARTIAL đã ghi rõ bên dưới.

## Sinh viên

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-001 | `POST /api/auth/internal/register` | **✅ HOÀN THÀNH** | Password được hash; server gán role Sinh viên; body có username/email/password/displayName. Dùng route thực tế, không gọi đề xuất /api/auth/register. |
| API-002 | `POST /api/auth/internal/login` | **✅ HOÀN THÀNH** | Đăng nhập email/password, kiểm tra active/locked, trả auth envelope và refresh token hiện có. Không dùng dev-login làm login production. |
| API-003 | `GET /api/users/me/profile` | **✅ HOÀN THÀNH** | Trả userId/version/profile/personal/editableFields và provenance PROJECT_ACCOUNT; profile chưa tạo có version GUID rỗng. |
| API-004 | `PATCH /api/users/me/profile` | **✅ HOÀN THÀNH** | PATCH profile/personal của chính mình, expectedVersion + Idempotency-Key; chưa hỗ trợ avatar/cover qua self profile. |
| API-005 | `GET /api/v2/activities/feed` | **✅ HOÀN THÀNH** | Feed authenticated, display-safe; campus/member visibility, private-by-default, search/status/semester/SQL paging và buổi kế tiếp. Không roster/contact/minh chứng. |
| API-006 | `GET /api/v2/activities/{activityId}` | **✅ HOÀN THÀNH** | Deep link đọc trực tiếp, kiểm tra campus/visibility như feed, DTO an toàn; không dùng management detail cho discovery. |
| API-007 | `GET /api/v2/recommendations/activities` | **✅ HOÀN THÀNH** | LOW_AXIS_RULE từ sáu trục X chưa làm tròn; eligible upcoming candidates qua toàn bộ các trang, thứ tự trục/start/ID, radar/policy snapshot. Outage503, không ghi điểm. |
| API-008 | `POST /api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests` | **✅ HOÀN THÀNH** | Xin xác nhận cho session đã diễn ra, có reason/evidenceRefs; yêu cầu ban đầu PENDING, không tự có điểm. |
| API-009 | `POST /api/activities/{activityId}/contributions` | **✅ HOÀN THÀNH** | Nộp cho nguồn activity/session đã công bố; proposedAttributes/evidenceRefs/message/expectedActivityVersion và key; unique source chống khai lại cùng công sức. |
| API-010 | `GET /api/users/me/contributions` | **✅ HOÀN THÀNH** | Hợp nhất canonical + legacy có nhãn, dedup mirror, lọc kỳ/status/pillar, SQL count/paging; calculation hiện trạng. Legacy semester unassigned, không cộng vào điểm verified. |
| API-011 | `GET /api/contributions/{id}` | **✅ HOÀN THÀNH** | Detail có calculationBreakdown và lịch sử ledger effect/delta/allocation/revision/policy/verification. Snapshot mới bất biến; lịch sử cũ chỉ reconstruct nếu dữ liệu gốc khớp, thiếu căn cứ báo unavailable. |
| API-012 | `PATCH /api/contributions/{id}` | **✅ HOÀN THÀNH** | Author sửa SUBMITTED/REVISION_REQUESTED theo version; không sửa đóng góp đã ghi điểm. |
| API-013 | `POST /api/contributions/{id}/role-upgrade-requests` | **✅ HOÀN THÀNH** | Xin nâng cùng contribution; role/result/evidenceRefs/reason/version. Đang chờ không thay điểm; duyệt chỉ ghi delta. |
| API-014 | `GET /api/users/me/experience-ledger` | **✅ HOÀN THÀNH** | Paged self net ledger với sourceType/sourceId/sourceKey/sourceNamespace, policy/formula/revision/verification; không đưa XP mẫu vào ledger. |
| API-015 | `POST /api/contributions/evidence` | **✅ HOÀN THÀNH** | Multipart một PDF/PNG/JPEG tối đa 10 MiB; trả attachmentId/evidenceId. Private evidence chưa nhận WebP; public images có WebP riêng. |
| API-016 | `GET /api/contributions/evidence/{attachmentId}/download` | **✅ HOÀN THÀNH** | Tải cho owner hoặc reviewer assignment còn hiệu lực, private/no-store. Không phát public URL của minh chứng. |
| API-017 | `GET /api/users/me/experience-summary` | **✅ HOÀN THÀNH** | Summary đọc toàn bộ net ledger, counts riêng với points; nguồn attendance/membership có availability/asOf/version riêng. Nguồn lỗi trả null, không giả0; historical external counters chưa có snapshot được đánh dấu rõ. |
| API-018 | `GET /api/users/me/activity-history` | **✅ HOÀN THÀNH** | Self-only, cross-activity/session history; SQL filter/count/paging, registration/verified/revoked/legacy tách nhãn, không lộ dữ liệu sinh viên khác. |
| API-019 | `POST /api/activities/{id}/participants` | **✅ HOÀN THÀNH** | Registration theo activity, kiểm tra publish/window/capacity/current eligibility và self identity; nguồn session dùng registration này. Không có registration riêng cho mỗi session. |
| API-020 | `POST /api/activities/{id}/check-in` | **✅ HOÀN THÀNH** | Body sessionId/challenge/location; QR 30 giây, cửa sổ và geofence; trả verification/recognition trung thực. Không nhận userId từ FE. |
| API-021 | `GET /api/activities/{id}/my-attendance` | **✅ HOÀN THÀNH** | Xem attendance chính chủ; nguồn mới có session/version/method/contributionId/recognition. Legacy lịch ngày được giữ riêng. |
| API-022 | `POST /api/v1/declarations` | **✅ HOÀN THÀNH** | Payload mới có semesterId/occurredAt/proposedAttributes/evidenceRefs, isOutsideClub=true và clubId=null; vào canonical ledger workflow. Không gửi payload legacy để làm luồng mới. |
| API-023 | `GET /api/v1/declarations/me` | **✅ HOÀN THÀNH** | Self normalized canonical declarations + legacy, SQL paging/dedup. Response đổi sang envelope items/page/pageSize/total/totalItems/totalPages; FE đọc items, không dùng array cũ. |
| API-024 | `GET /api/v1/declarations/{id}` | **✅ HOÀN THÀNH** | Canonical declaration trả detail giống contribution; kiểm tra author/assignment, có revisions/decisions và refs riêng tư. |
| API-025 | `PUT /api/v1/declarations/{id}` | **✅ HOÀN THÀNH** | Canonical declaration cần expectedVersion/proposedAttributes/evidenceRefs; evidenceDescription là message. Author revision; không sửa bản đã ghi điểm. |
| API-026 | `GET /api/v1/declarations/me/radar` | **✅ HOÀN THÀNH** | VERIFIED_NET_LEDGER theo PERIOD và CUMULATIVE; six radarAxes + plusOne, ERI/D/J/M và leader proof theo trụ cột; approved policy/version/asOf/ledgerRevision. Cumulative cần policy scope riêng, thiếu trả503. |
| API-027 | `GET /api/v1/quests` | **✅ HOÀN THÀNH** | Catalog có criteria/version/targetPillar/eligibleActivityIds/policyVersion. Sinh viên mặc định nhận nhiệm vụ xếp theo trục thấp trước khi paging, lọc campus/kỳ/deadline/eligible sources; recommended=false đọc CATALOG. GET không tự seed. |
| API-028 | `GET /api/v1/quests/me` | **✅ HOÀN THÀNH** | Self participation, linkedContributionIds và progress derived từ net verified proof; revoked/cancelled =>REQUIRES_REVALIDATION, nguồn lỗi =>UNAVAILABLE/progressAvailable=false. Completion history được giữ. |
| API-029 | `GET /api/v1/quests/{id}` | **✅ HOÀN THÀNH** | Detail có frozen criteria/policy/version/counts, không roster; draft chỉ backoffice hoặc người đã tham gia được đọc. completedCount là lịch sử đã ghi, rewardXp chỉ legacy display. |
| API-030 | `POST /api/v1/quests/{id}/join` | **✅ HOÀN THÀNH** | Self join, canonical identity, approved matching criteria, campus/deadline/source eligibility, freeze criteria, chống trùng và retry. Đã đăng ký nguồn vẫn join khi full/closed; nguồn phải upcoming; đổi quest khi xử lý =>409. |
| API-031 | `POST /api/v1/quests/{id}/complete` | **✅ HOÀN THÀNH** | Self-only, phải join, expectedVersion participation, verified eligible proof đúng tác giả/kỳ/source/pillar. Kiểm tra live cancellation trước replay, completion history append-only, không mint thêm điểm. note tối đa500. |
| API-032 | `POST /api/clubs/{id}/join` | **✅ HOÀN THÀNH** | Join bằng canonical profile Auth, active/unlocked/campus, consent và category info. Identity từ body không ghi đè Auth; transaction/unique/retry, key tùy chọn. Auth outage503. |

## Quản lý CLB

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-033 | `PATCH /api/clubs/{clubId}/public-profile` | **🟡 CHƯA HOÀN THIỆN** | PATCH text/category/schedule và CAS đã có. GET /api/clubs/{id} của manager trả ClubFullResponse chưa có version (public DTO có version); thiếu đường đọc version cho manager để mở form/lưu lần đầu. FE chờ bổ sung read DTO, không tự tạo expectedVersion. |
| API-034 | `POST /api/activities/{activityId}/sessions` | **✅ HOÀN THÀNH** | Tạo buổi đơn/lịch lặp theo giờ Việt Nam, ngày loại trừ, occurrence ID ổn định; dời cửa sổ điểm danh theo từng buổi; chống tạo lặp và kiểm tra version. |
| API-035 | `GET /api/activities/{activityId}/sessions` | **✅ HOÀN THÀNH** | Trả các buổi cùng version, semester, attendancePolicy và snapshot nguồn điểm. |
| API-036 | `PATCH /api/activities/{activityId}/sessions/{sessionId}` | **✅ HOÀN THÀNH** | Sửa buổi đúng quyền và version; bảo vệ buổi đã có lịch sử điểm danh. |
| API-037 | `POST /api/activities/{activityId}/sessions/{sessionId}/close` | **✅ HOÀN THÀNH** | Đóng buổi theo trạng thái hợp lệ; lưu lịch sử, version và lý do. |
| API-038 | `POST /api/activities/{activityId}/sessions/{sessionId}/cancel` | **✅ HOÀN THÀNH** | Hủy có lý do/audit/outbox; thu hồi attendance và đảo điểm bằng bút toán mới. |
| API-039 | `GET /api/activities/{activityId}/sessions/{sessionId}/attendance-challenge` | **✅ HOÀN THÀNH** | QR ký HMAC, đổi mỗi 30 giây, ràng buộc activity/session/version; trả serverTime và hết hạn; chỉ manager đúng CLB được phát. |
| API-040 | `GET /api/clubs/{clubId}/semester-plans/{semesterId}` | **✅ HOÀN THÀNH** | Đọc kế hoạch kỳ đúng scope, canonical semester code và version. |
| API-041 | `PUT /api/clubs/{clubId}/semester-plans/{semesterId}` | **✅ HOÀN THÀNH** | Một kế hoạch hiện hành cho mỗi CLB/kỳ; mục tiêu không âm; CAS/version, revision history và idempotency. |
| API-042 | `GET /api/clubs/{clubId}/experience-statistics` | **✅ HOÀN THÀNH** | Tính toàn dữ liệu: hoạt động/buổi, người duy nhất, lần đầu toàn dự án, vai trò hiệu lực, net raw points từng trụ cột và tiến độ mục tiêu. |
| API-043 | `POST /api/clubs/{clubId}/experience-reports` | **✅ HOÀN THÀNH** | Chốt snapshot thống kê đã đối chiếu planVersion/ledgerRevision; trả 202 và job PDF lưu trong DB. |
| API-044 | `GET /api/clubs/{clubId}/experience-reports/{reportId}/download` | **✅ HOÀN THÀNH** | Tải PDF thực tế sau khi hoàn thành; private/no-store; kiểm tra quyền quản lý hiện tại, kể cả file đã tạo trước đó. |
| API-045 | `GET /api/activities` | **✅ HOÀN THÀNH** | Dữ liệu quản lý có publication/semester/version/capacity/cấu hình điểm và điểm danh; người không quản lý chỉ nhận dữ liệu cá nhân được phép. |
| API-046 | `GET /api/activities/{id}` | **✅ HOÀN THÀNH** | Chi tiết gồm cấu hình nguồn đã công bố; không lộ danh sách người khác cho thành viên thông thường. Các occurrence được lấy qua API-035. |
| API-047 | `POST /api/activities` | **✅ HOÀN THÀNH** | Tạo draft đúng CLB, lấy tên CLB từ authority; giữ cấu hình đăng ký, semester và điểm để công bố sau khi có policy hợp lệ. |
| API-048 | `PUT /api/activities/{id}` | **✅ HOÀN THÀNH** | UPDATE/PUBLISH/CLOSE có version và idempotency; PUBLISH yêu cầu policy đã duyệt và snapshot; bảo vệ dữ liệu đã có lịch sử. |
| API-049 | `DELETE /api/activities/{id}` | **✅ HOÀN THÀNH** | Hủy hoạt động mới bằng expectedVersion/reason/key; giữ lịch sử, hủy các buổi và phát sự kiện đảo điểm. |
| API-050 | `PATCH /api/activities/{id}/complete` | **✅ HOÀN THÀNH** | Hoàn thành khi hoạt động kết thúc và các buổi đã được xử lý; version, lý do, audit; không tự cộng điểm. |
| API-051 | `GET /api/clubs/{clubId}/members` | **✅ HOÀN THÀNH** | Hồ sơ hiện hành lấy từ Auth; applicationSnapshot được tách riêng. Thống kê không khả dụng trả available=false và số liệu null. |
| API-052 | `GET /api/clubs/{clubId}/members/{memberId}` | **✅ HOÀN THÀNH** | Hồ sơ hiện hành, hồ sơ gia nhập lịch sử và lịch sử tham gia phân trang; cùng quyền quản lý CLB. |
| API-053 | `PUT /api/clubs/{clubId}/members/{memberId}` | **✅ HOÀN THÀNH** | Giữ route tương thích và trả 403 `PERSONAL_PROFILE_SELF_ONLY` khi yêu cầu sửa hồ sơ cá nhân người khác. Tự sửa dùng canonical self profile. |
| API-054 | `GET /api/clubs/{clubId}/activities/{activityId}/attendance` | **✅ HOÀN THÀNH** | Trả dữ liệu theo session, verification/recognition/version và nguồn; kiểm tra đúng CLB/hoạt động. |
| API-055 | `PUT /api/clubs/{clubId}/activities/{activityId}/attendance/{memberId}` | **✅ HOÀN THÀNH** | Xác nhận theo buổi với version/lý do/minh chứng, capability attendance.verify và no-self; ghi outbox cho ledger. |
| API-056 | `PUT /api/clubs/{clubId}/activities/{activityId}/attendance` | **✅ HOÀN THÀNH** | Kiểm tra toàn bộ batch trước khi ghi, gồm no-self từng người; source/session/row versions và cùng giao dịch. |

## Người xác minh

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-057 | `GET /api/verifications/me/queue` | **🟡 CHƯA HOÀN THIỆN** | Queue đúng assignment/no-self cho contribution/upgrade/manual; hiện chỉ clubId/page/pageSize, pending states. Chưa hỗ trợ sourceType/status và total riêng cho 3 nhóm; total chỉ đếm items contribution. |
| API-058 | `GET /api/activities/{activityId}/contributions` | **✅ HOÀN THÀNH** | Paged contribution đúng activity và CLB được phân công; kiểm tra scope kể cả danh sách rỗng. |
| API-059 | `POST /api/contributions/{id}/reviews` | **✅ HOÀN THÀNH** | ASSIGNED review APPROVE/REJECT/REQUEST_REVISION; version/reason/verifiedAttributes; decision/revision/ledger/outbox nguyên tử; không tự duyệt. |
| API-060 | `POST /api/contributions/{id}/role-upgrade-requests/{requestId}/reviews` | **✅ HOÀN THÀNH** | Duyệt upgrade theo version của upgrade request; giữ blueprint/policy, ghi delta; reject giữ điểm cũ. |
| API-061 | `GET /api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests` | **✅ HOÀN THÀNH** | List theo activity/session: reviewer đọc phạm vi được giao, author chỉ đọc request của mình; paging. |
| API-062 | `POST /api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests/{requestId}/review` | **✅ HOÀN THÀNH** | Review manual có assignment/no-self/version/reason; APPROVED_PENDING chờ source confirmation rồi recognition receipt. |
| API-063 | `GET /api/v1/student-affairs/declarations` | **🟡 CHƯA HOÀN THIỆN** | Adapter queue canonical đã có và lọc assignment/no-self; còn lẫn DTO/hồ sơ legacy, nhánh staff đọc khai báo outside legacy không theo assignment mới. FE ưu tiên queue canonical, nhận diện legacy rõ. |
| API-064 | `POST /api/v1/student-affairs/declarations/{id}/review` | **🟡 CHƯA HOÀN THIỆN** | Review canonical đã version/vector/assignment/ledger/outbox. Nhánh legacy outside của Admin/CTSV vẫn dùng review/scoring cũ; không đưa nhánh này vào luồng điểm verified mới. |

## Quản trị hệ thống

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-065 | `GET /api/verification-assignments` | **✅ HOÀN THÀNH** | Xem assignment admin; route thực tế /api/verification-assignments, lọc userId/clubId. |
| API-066 | `POST /api/verification-assignments` | **✅ HOÀN THÀNH** | Cấp assignment cho account active/unlocked, sourceType CLUB/EXTERNAL/REAL_WORLD và capabilities, time/reason/key; resolve account từ Auth. |
| API-067 | `PATCH /api/verification-assignments/{assignmentId}` | **✅ HOÀN THÀNH** | Sửa/thu hồi theo expectedVersion/isRevoked/reason, recheck tại review; không dùng path đề xuất /api/verifier-assignments. |
| API-068 | `POST /api/contributions/{id}/adjustments` | **✅ HOÀN THÀNH** | CORRECT/REVOKE có capability/no-self/version/reason; append effect, không sửa ledger cũ hoặc phục hồi nguồn đã hủy. |
| API-069 | `GET /api/v1/student-affairs/benchmarks` | **🟡 CHƯA HOÀN THIỆN** | List benchmark có sẵn; DTO legacy chưa có đủ approvalStatus/version/formula/precision/cumulative metadata. Đọc policy snapshot qua route bổ sung, không suy từ isActive. |
| API-070 | `GET /api/v1/student-affairs/benchmarks/active` | **🟡 CHƯA HOÀN THIỆN** | active vẫn có thể tự tạo fallback FA26 khi DB trống và không đồng nghĩa APPROVED. FE không dùng response này làm bằng chứng policy đã được duyệt. |
| API-071 | `POST /api/v1/student-affairs/benchmarks` | **🟡 CHƯA HOÀN THIỆN** | Create benchmark draft và approval workflow đã có; /approval hỗ trợ scope PERIOD/CUMULATIVE, effectiveAt và snapshot version. DTO create benchmark legacy chưa thể hiện đầy đủ cấu hình P01–P06/formula/precision và metadata phê duyệt; giữ PARTIAL cho operation quản trị này. |
| API-072 | `PUT /api/v1/student-affairs/benchmarks/{id}` | **🟡 CHƯA HOÀN THIỆN** | Đã chặn update approved/locked, bump version; có draft mới giữ approved snapshot cũ. DTO update legacy chưa có CAS expectedVersion và đầy đủ chính sách tích lũy/effective. |
| API-073 | `POST /api/v1/student-affairs/benchmarks/{id}/lock` | **🟡 CHƯA HOÀN THIỆN** | Lock/version có sẵn; isLocked chưa thay approval và snapshot ledger kỳ. Dùng /approval cho approved policy, không dùng lock để cấp quyền ghi điểm. |
| API-074 | `POST /api/clubs/{id}/managers` | **🟡 CHƯA HOÀN THIỆN** | Constraint/outbox có sẵn; AssignManager vẫn dùng ManagerUserId/ManagerName từ request, chưa resolve account active/unlocked/current name từ Auth. |

## Route đã chọn khác proposal cũ

| Mục | FE gọi | Proposal không có alias tương ứng |
| --- | --- | --- |
| Register/login nội bộ | `/api/auth/internal/register`, `/api/auth/internal/login` | `/api/auth/register`, `/api/auth/login` |
| Assignment verifier | `/api/verification-assignments` và `/{id}` | `/api/verifier-assignments` và `/{assignmentId}` |

## Hỗ trợ và route bổ sung ngoài 74

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| SUP-01 | `POST /api/media/upload-intents` | **✅ HOÀN THÀNH** | Club/activity public image intent; R2 thật cần cấu hình. Kind chỉ club-logo/club-cover/activity-cover, không avatar/cover cá nhân. |
| SUP-02 | `PUT /api/clubs/{clubId}/public-images` | **🟡 CHƯA HOÀN THIỆN** | Write/issued-object verify đã có; cần expectedVersion nhưng manager detail GET chưa trả version, cùng vướng mắc API-033. Không mở Save trước khi BE bổ sung read DTO. |
| SUP-03 | `PUT /api/activities/{activityId}/cover-image` | **✅ HOÀN THÀNH** | Cover activity đúng quyền/version; giữ blueprint và lịch sử. |
| SUP-04 | `POST /api/clubs/me/membership-applications/{applicationId}/withdraw` | **⏳ CHƯA TRIỂN KHAI** | Chưa có withdrawal; hỗ trợ ngoài tổng 74, FE không giả thành công. |
| SUP-05 | `GET /api/clubs/{clubId}/member-roles` | **⏭ BỎ QUA — CHƯA CẦN** | Chưa có generic catalog; MVP dùng owner/member tối thiểu, không bắt buộc mở đủ chức vụ. |
| SUP-06 | `PATCH /api/clubs/{clubId}/members/{membershipId}/role` | **⏭ BỎ QUA — CHƯA CẦN** | Chưa có generic role PATCH; không gọi proposal. Assignment verifier là quyền riêng. |
| ADD-01 | `GET /api/club-experience-reports/{reportId}` | **✅ HOÀN THÀNH** | Theo dõi job Pending/Processing/Completed/Failed và downloadUrl. |
| ADD-02 | `GET /api/club-experience-reports/{reportId}/download` | **✅ HOÀN THÀNH** | Alias tải PDF theo reportId; current owner, private/no-store. |
| ADD-03 | `GET /api/v1/student-affairs/benchmarks/{id}/policy` | **✅ HOÀN THÀNH** | Đọc benchmarkId/version/approvalStatus/versions (metadata approved policy). Không trả full snapshot/coefficients; không đọc /active để suy APPROVED. |
| ADD-04 | `POST /api/v1/student-affairs/benchmarks/{id}/approval` | **✅ HOÀN THÀNH** | Technical approval snapshot có scope PERIOD/CUMULATIVE và effectiveAt; expectedVersion/environment/approvalBasis/parametersP01ThroughP06Agreed. Cumulative reader đã triển khai; vẫn cần cấu hình P06 được phê duyệt thật. |
| ADD-05 | `POST /api/v1/student-affairs/benchmarks/{id}/draft` | **✅ HOÀN THÀNH** | Tạo draft tiếp theo, giữ approved snapshot cũ; version/reason/key. |

## API hiện có trước mốc kiểm kê

Refresh/logout/me, notification list/read/read-all, clubs/me/access/memberships/managed, duyệt/từ chối membership, xóa thành viên và catalog học kỳ/CLB vẫn dùng endpoint hiện có. Mốc 74 chỉ đếm phần còn việc ngày 12/10; các route này không biến thành API mới hoặc bị xóa vì không nằm trong bảng. Nhánh dev-login chỉ dùng Development/Test; production dùng password/Google. Mọi luồng đọc cá nhân cần authentication và scope server.

## Điều kiện môi trường, kiểm thử và phần chưa chốt

- BE đã chạy 740/740 test, 0 failed/0 skipped; build Release 0 warning/0 error, format CI và EF model/migration 8 service đều qua ngày 14/10/2026. Đây là kết quả kỹ thuật ở source, không phải nghiệm thu deployment/FE. Chi tiết xem [bàn giao Sinh viên](../../../fptu-xperience-clubhub-api/docs/audit/HOAN_THIEN_API_SINH_VIEN_2026-10-13.md).
- Môi trường cần migration Quản lý CLB và 3 migration Sinh viên đã ghi trong tài liệu bàn giao, SQL Server/Redis và secret nội bộ/QR. Media public cần cấu hình R2/CORS thật; chưa test upload bucket thật. Thiếu cấu hình phải hiển thị unavailable/503, không báo upload thành công.
- P01–P06 còn cần thống nhất/approval thực tế. Approved snapshot và reader PERIOD/CUMULATIVE đã có; cumulative cần policy scope riêng được phê duyệt, thiếu trả503. `isLocked`/`isActive` và `/active` fallback không chứng minh APPROVED.
- Header mutation/version, shape response và route alias theo [hướng dẫn tích hợp](be-integration-guide.md). Request/response hiện hành ưu tiên hơn DTO proposal trong lịch sử.
- BỎ QUA finance/wallet/rewards/cosmetics/leaderboard cạnh tranh/public student directory/roster trường/timetable/ML/full specialist consoles; giữ mã và tài liệu cũ.

## Căn cứ mã nguồn

- API-001: [InternalAccountEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AuthService/Endpoints/InternalAccountEndpoints.cs).
- API-002: [InternalAccountEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AuthService/Endpoints/InternalAccountEndpoints.cs).
- API-003: [CanonicalProfileEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AuthService/Endpoints/CanonicalProfileEndpoints.cs).
- API-004: [CanonicalProfileEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AuthService/Endpoints/CanonicalProfileEndpoints.cs).
- API-008: [ManualAttendanceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/ManualAttendanceEndpoints.cs).
- API-009: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-010: [StudentContributionReadService.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Services/StudentContributionReadService.cs).
- API-011: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-012: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-013: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-014: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-015: [PrivateEvidenceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/PrivateEvidenceEndpoints.cs).
- API-016: [PrivateEvidenceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/PrivateEvidenceEndpoints.cs).
- API-022: [DeclarationEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/DeclarationEndpoints.cs).
- API-023: [DeclarationEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/DeclarationEndpoints.cs).
- API-024: [DeclarationEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/DeclarationEndpoints.cs).
- API-025: [DeclarationEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/DeclarationEndpoints.cs).
- API-026: [StudentExperienceReadService.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Services/StudentExperienceReadService.cs).
- API-027: [StudentQuestRecommendations.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Services/StudentQuestRecommendations.cs).
- API-028: [StudentQuestService.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Services/StudentQuestService.cs).
- API-029: [QuestEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/QuestEndpoints.cs).
- API-030: [QuestEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/QuestEndpoints.cs).
- API-031: [QuestEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/QuestEndpoints.cs).
- API-032: [MembershipEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/MembershipEndpoints.cs).
- API-033: [ClubPublicProfileEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/ClubPublicProfileEndpoints.cs).
- API-034: [ActivitySessionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivitySessionEndpoints.cs).
- API-035: [ActivitySessionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivitySessionEndpoints.cs).
- API-036: [ActivitySessionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivitySessionEndpoints.cs).
- API-037: [ActivitySessionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivitySessionEndpoints.cs).
- API-038: [ActivitySessionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivitySessionEndpoints.cs).
- API-039: [ActivitySessionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivitySessionEndpoints.cs).
- API-040: [ClubSemesterPlanEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/ClubSemesterPlanEndpoints.cs).
- API-041: [ClubSemesterPlanEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/ClubSemesterPlanEndpoints.cs).
- API-042: [ClubExperienceStatisticsEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/ClubExperienceStatisticsEndpoints.cs).
- API-043: [ClubExperienceReportEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ExportService/Endpoints/ClubExperienceReportEndpoints.cs).
- API-044: [ClubExperienceReportEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ExportService/Endpoints/ClubExperienceReportEndpoints.cs).
- API-045: [ActivityEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityEndpoints.cs).
- API-046: [ActivityEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityEndpoints.cs).
- API-047: [ActivityEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityEndpoints.cs).
- API-048: [ActivityLifecycleEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityLifecycleEndpoints.cs).
- API-049: [ActivityTransitionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityTransitionEndpoints.cs).
- API-050: [ActivityTransitionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityTransitionEndpoints.cs).
- API-051: [MemberManagementEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs).
- API-052: [MemberManagementEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs).
- API-053: [MemberManagementEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs).
- API-054: [SessionAttendanceManagement.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/SessionAttendanceManagement.cs).
- API-055: [SessionAttendanceManagement.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/SessionAttendanceManagement.cs).
- API-056: [SessionAttendanceManagement.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/SessionAttendanceManagement.cs).
- API-057: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-058: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-059: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-060: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-061: [ManualAttendanceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/ManualAttendanceEndpoints.cs).
- API-062: [ManualAttendanceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/ManualAttendanceEndpoints.cs).
- API-063: [DeclarationEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/DeclarationEndpoints.cs).
- API-064: [DeclarationEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/DeclarationEndpoints.cs).
- API-065: [VerificationAssignmentEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerificationAssignmentEndpoints.cs).
- API-066: [VerificationAssignmentEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerificationAssignmentEndpoints.cs).
- API-067: [VerificationAssignmentEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerificationAssignmentEndpoints.cs).
- API-068: [VerifiedContributionEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/VerifiedContributionEndpoints.cs).
- API-069: [BenchmarkEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/BenchmarkEndpoints.cs).
- API-070: [BenchmarkEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/BenchmarkEndpoints.cs).
- API-071: [BenchmarkEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/BenchmarkEndpoints.cs).
- API-072: [BenchmarkEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/BenchmarkEndpoints.cs).
- API-073: [BenchmarkEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/BenchmarkEndpoints.cs).
- API-074: [ManagerEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ClubService/Endpoints/ManagerEndpoints.cs).
- API-005: [StudentActivityEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/StudentActivityEndpoints.cs).
- API-006: [StudentActivityEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/StudentActivityEndpoints.cs).
- API-007: [StudentExperienceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/StudentExperienceEndpoints.cs).
- API-017: [StudentExperienceEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/StudentExperienceEndpoints.cs).
- API-018: [StudentActivityHistoryEndpoints.cs](../../../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/StudentActivityHistoryEndpoints.cs).

</details>
