# Đóng góp, nhiệm vụ và điểm trải nghiệm — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: BE new task/credit/point lifecycle; existing evidence/ledger routes are separate

Backend Progress: DEFERRED_BY_PRODUCT_OWNER

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#decisions).

**Đã có BE:** Contribution/evidence/review/ledger legacy hiện có; action completion/verification mới chỉ xác nhận công việc, không phát điểm.

**Chưa hoàn thành / giới hạn:** Task credit, ví CLUB_CREDIT, đổi thưởng, cap/rollover/reversal/final report awards chưa triển khai hoặc chưa chốt; không thay bằng Admin quest hay tiền Finance.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Đóng góp, nhiệm vụ và điểm trải nghiệm — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-009 | `POST /api/activities/{activityId}/contributions` | **✅ HOÀN THÀNH** | Nộp cho nguồn activity/session đã công bố; proposedAttributes/evidenceRefs/message/expectedActivityVersion và key; unique source chống khai lại cùng công sức. |
| API-010 | `GET /api/users/me/contributions` | **✅ HOÀN THÀNH** | Hợp nhất canonical + legacy có nhãn, dedup mirror, lọc kỳ/status/pillar, SQL count/paging; calculation hiện trạng. Legacy semester unassigned, không cộng vào điểm verified. |
| API-011 | `GET /api/contributions/{id}` | **✅ HOÀN THÀNH** | Detail có calculationBreakdown và lịch sử ledger effect/delta/allocation/revision/policy/verification. Snapshot mới bất biến; lịch sử cũ chỉ reconstruct nếu dữ liệu gốc khớp, thiếu căn cứ báo unavailable. |
| API-012 | `PATCH /api/contributions/{id}` | **✅ HOÀN THÀNH** | Author sửa SUBMITTED/REVISION_REQUESTED theo version; không sửa đóng góp đã ghi điểm. |
| API-013 | `POST /api/contributions/{id}/role-upgrade-requests` | **✅ HOÀN THÀNH** | Xin nâng cùng contribution; role/result/evidenceRefs/reason/version. Đang chờ không thay điểm; duyệt chỉ ghi delta. |
| API-014 | `GET /api/users/me/experience-ledger` | **✅ HOÀN THÀNH** | Paged self net ledger với sourceType/sourceId/sourceKey/sourceNamespace, policy/formula/revision/verification; không đưa XP mẫu vào ledger. |
| API-058 | `GET /api/activities/{activityId}/contributions` | **✅ HOÀN THÀNH** | Paged contribution đúng activity và CLB được phân công; kiểm tra scope kể cả danh sách rỗng. |
| API-059 | `POST /api/contributions/{id}/reviews` | **✅ HOÀN THÀNH** | ASSIGNED review APPROVE/REJECT/REQUEST_REVISION; version/reason/verifiedAttributes; decision/revision/ledger/outbox nguyên tử; không tự duyệt. |
| API-060 | `POST /api/contributions/{id}/role-upgrade-requests/{requestId}/reviews` | **✅ HOÀN THÀNH** | Duyệt upgrade theo version của upgrade request; giữ blueprint/policy, ghi delta; reject giữ điểm cũ. |
| API-068 | `POST /api/contributions/{id}/adjustments` | **✅ HOÀN THÀNH** | CORRECT/REVOKE có capability/no-self/version/reason; append effect, không sửa ledger cũ hoặc phục hồi nguồn đã hủy. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ đóng góp; BỎ QUA ví/quà/leaderboard.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

Contract áp dụng: [verified contributions](verified-contributions-api.md), [6+1 scoring](experience-scoring-contract.md). Điểm là trải nghiệm xác thực, không CLUB_CREDIT tiêu được.

GIỮ submit/revision/private evidence/review/no self/immutable ledger/outbox/correction; role upgrade reject giữ điểm hợp lệ. Low-axis quests hoàn thành qua contribution đã duyệt, không award lần2. Task catalog riêng là hỗ trợ, không cần task publish giá wallet.

**BỎ QUA — NGOÀI PHẠM VI:** walletPoints/per-club spendable wallet, CREDIT/DEBIT mua quà, points/leaderboard, negative balance/redemption lock/paid rewards. Points/me balance cũ không phải API6+1. Bậc/danh hiệu và private experience ledger vẫn GIỮ.

Payload/wallet/reversal endpoint dưới là LỊCH SỬ, không dùng mint trải nghiệm hoặc bắt buộc triển khai ví.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Club tasks, contributions and credited points

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: AdminDbContext declares Quests, QuestParticipants and XpLedgerEntries, but ClubDbContext has no club task evidence/review, wallet or credit-ledger entities/routes. Admin raw XP is not this spendable credit lifecycle.

D07; proposed, main 80818266 audited 2026-10-09. `QuestsTab` and `PointsTab` currently show unavailable states. AdminService quest catalog/participants and declaration raw scoring exist; they do not implement this club-scoped evidence/review/wallet lifecycle. Shared [conventions](api-contract-conventions.md) apply.

## Tasks and submissions

GET `/api/clubs/{clubId}/tasks?status=...&page=1&pageSize=20`: approved member/authorized club actor; return paged `{id,clubId,title,description,dueAt,walletPoints,status,version,mySubmission?}`. Manager-only metadata stays separate. POST same path: leadership task-management capability, body `{title,description,dueAt,walletPoints}`; 201 canonical DRAFT. PATCH `/{taskId}` with partial fields and expectedVersion; POST `/{taskId}/publish` or `/close` with expectedVersion. DRAFT -> PUBLISHED -> CLOSED; archived task records remain for audit. Title 1..200, description <=4000, dueAt valid future instant on publish, walletPoints integer 0..100000 under server award policy; immutable reward after publication or first submission. Zero-reward tasks are valid. These limits are proposed implementation defaults.

POST `/api/clubs/{clubId}/tasks/{taskId}/submissions`: approved member, own principal only, `{message,evidenceRefs,expectedTaskVersion}`, Idempotency-Key. Evidence refs are server-issued **private** files/authorized existing records, not arbitrary public R2 URLs for sensitive files. Message <=2000, max 10 files; server verifies ownership, size/type limits and task open/deadline. Return 201 `{id,taskId,userId,status:"SUBMITTED",submittedAt,version}`. One current submission per user/task; retain revision history. GET `/tasks/{taskId}/submissions` is reviewer-only, paged; GET `/task-submissions/me` is self-only. GET `/task-submissions/{submissionId}` author or authorized reviewer. PATCH own rejected/revision-requested submission permits a new version before close; no editing approved evidence.

POST `/api/clubs/{clubId}/task-submissions/{submissionId}/review`, `{decision:"APPROVE"|"REJECT"|"REQUEST_REVISION",note,expectedVersion}`, Idempotency-Key. Leadership contribution-review capability; no self-review. Reject/revision require note <=1000. SUBMITTED -> APPROVED/REJECTED/REVISION_REQUESTED. APPROVED is terminal for ordinary review; corrections use an audited reversal operation, never mutate old ledger entries. Role names alone do not authorize the actor.

## Award and read models

A successful approval commits decision, unique award `(submissionId,awardPolicyVersion)` and outbox together. Server derives credit from the published task policy; client never submits a price/award at review. If wallet persistence is another service, publish idempotent award event and expose `creditStatus:"PENDING"|"CREDITED"|"FAILED"`; do not claim credited success before its receipt. Duplicate review/event cannot credit twice.

GET `/api/clubs/{clubId}/contributions/summary`: reviewer gets `{pendingCount,revisionRequestedCount,approvedCount,asOf}`; ordinary member gets only own counts. GET `/api/clubs/{clubId}/points/me?semesterId=...` -> `{earnedTotal,revokedTotal,balance,version,unit:"CLUB_CREDIT"}`; GET `/points/me/ledger?page=...` -> own `{id,type,amount,sourceType,sourceId,occurredAt,reason}`. GET `/points/leaderboard?semesterId=...&page=...` ranks earned eligible credits, not remaining spendable balance; display names only under club privacy policy. GET `/badges/me` returns own awarded server-defined `{id,label,description,awardedAt,assetUrl?}`; badge catalog/award rules must be configured server-side, not seeded client counters.

Persist task/submission/review history, immutable ledger (CREDIT/DEBIT/REVERSAL), per-user per-club wallet/version and unique award source. No conversion from raw experience budget, Admin XP adjustments or money. Reuse approved scoring for experience where applicable through a separate versioned integration; earning club credit does not itself certify CTSV experience. Do not mint real credits from demo records or the 200 sample-wallet bootstrap.

Tests: own/other club; pending/inactive member; own-review denial; published price immutability; private evidence ownership; deadline; replay/race; transaction rollback; outbox duplicate; reversal; balances versus earned totals; pagination; badges and privacy. Dependencies: D06 scoped authority, D01 private-evidence strategy (reuse protected report attachment infrastructure where suitable), D08 wallet debit/inventory. PointsTab remains unavailable until authoritative reads exist.

## Private evidence and credit correction operations

Private task evidence is a distinct attachment scope, not a public-image intent. Proposed POST `/api/clubs/{clubId}/tasks/{taskId}/evidence` accepts multipart `file`, active approved member only, max 10 MiB each, allowlisted PDF/PNG/JPEG/WebP and verified MIME/decode; return 201 `{attachmentId,name,contentType,sizeBytes,createdAt}` without storage path/public URL. Actor must be eligible for the open task. GET `/api/clubs/{clubId}/task-evidence/{attachmentId}/download` streams with Content-Disposition and `Cache-Control: private, no-store`; only uploader or scoped reviewer for the attached submission. DELETE same resource permits uploader removal only while unattached or in an editable submission; immutable approved evidence cannot be removed by ordinary edit. On submission, `evidenceRefs` are these opaque attachment IDs. Bind club/task/uploader, revalidate attachment ownership when linking, deny reuse across tasks, expire unlinked uploads after 24 hours. Reuse protected attachment/storage utilities where suitable, not report-author permission or public delivery URLs. Malware/type/size checks and cleanup must be implemented before accepting live files.

Proposed POST `/api/clubs/{clubId}/task-submissions/{submissionId}/credit-reversals` requires leadership contribution-review capability, excludes the submission author, accepts `{reason,expectedVersion}`, Idempotency-Key. Reason 1..1000; only a credited approved submission can be reversed once. Persist reviewer/reason, immutable reversal source and wallet event/receipt; preserve the original approval/evidence and return correction status plus current wallet version. No arbitrary amount or user supplied by client. If balance was already spent, the correction may make the canonical balance negative; prohibit new redemption until sufficient credits restore it, retain prior legitimate receipts/grants and never rewrite historical entries. This debt policy is a proposed implementation default to confirm with the award policy before live rollout. An asynchronous reversal remains PENDING until its unique ledger receipt, with duplicate delivery/replay protection matching credit awards.

All abbreviated `/tasks`, `/task-submissions`, `/points` and `/badges` paths above are rooted at `/api/clubs/{clubId}`. Responses use shared pagination and versions; mutation operations return the canonical updated resource or a receipt, never a fabricated success counter.


</details>

</details>
