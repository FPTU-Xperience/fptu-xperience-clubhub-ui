# Contract đóng góp xác thực và sổ cái — 2026-10-12

Implement Status: Not Yet

Status Scope: BE existing verified workflow and new operational completions; new award policy excluded

Backend Progress: PARTIAL_EXISTING_SOURCE_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#actions).

**Đã có BE:** Private evidence/contribution/declaration/review/upgrade/ledger hiện có; thêm action completion/attendance claim/verify có source/capability và audit.

**Chưa hoàn thành / giới hạn:** Completion VERIFIED không có nghĩa đã trao điểm; final action award/budget/reversal mới đang tạm hoãn, không dùng legacy endpoint đi vòng.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Contract đóng góp xác thực và sổ cái — 2026-10-12

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
| API-015 | `POST /api/contributions/evidence` | **✅ HOÀN THÀNH** | Multipart một PDF/PNG/JPEG tối đa 10 MiB; trả attachmentId/evidenceId. Private evidence chưa nhận WebP; public images có WebP riêng. |
| API-016 | `GET /api/contributions/evidence/{attachmentId}/download` | **✅ HOÀN THÀNH** | Tải cho owner hoặc reviewer assignment còn hiệu lực, private/no-store. Không phát public URL của minh chứng. |
| API-022 | `POST /api/v1/declarations` | **✅ HOÀN THÀNH** | Payload mới có semesterId/occurredAt/proposedAttributes/evidenceRefs, isOutsideClub=true và clubId=null; vào canonical ledger workflow. Không gửi payload legacy để làm luồng mới. |
| API-023 | `GET /api/v1/declarations/me` | **✅ HOÀN THÀNH** | Self normalized canonical declarations + legacy, SQL paging/dedup. Response đổi sang envelope items/page/pageSize/total/totalItems/totalPages; FE đọc items, không dùng array cũ. |
| API-024 | `GET /api/v1/declarations/{id}` | **✅ HOÀN THÀNH** | Canonical declaration trả detail giống contribution; kiểm tra author/assignment, có revisions/decisions và refs riêng tư. |
| API-025 | `PUT /api/v1/declarations/{id}` | **✅ HOÀN THÀNH** | Canonical declaration cần expectedVersion/proposedAttributes/evidenceRefs; evidenceDescription là message. Author revision; không sửa bản đã ghi điểm. |
| API-027 | `GET /api/v1/quests` | **✅ HOÀN THÀNH** | Catalog có criteria/version/targetPillar/eligibleActivityIds/policyVersion. Sinh viên mặc định nhận nhiệm vụ xếp theo trục thấp trước khi paging, lọc campus/kỳ/deadline/eligible sources; recommended=false đọc CATALOG. GET không tự seed. |
| API-028 | `GET /api/v1/quests/me` | **✅ HOÀN THÀNH** | Self participation, linkedContributionIds và progress derived từ net verified proof; revoked/cancelled =>REQUIRES_REVALIDATION, nguồn lỗi =>UNAVAILABLE/progressAvailable=false. Completion history được giữ. |
| API-029 | `GET /api/v1/quests/{id}` | **✅ HOÀN THÀNH** | Detail có frozen criteria/policy/version/counts, không roster; draft chỉ backoffice hoặc người đã tham gia được đọc. completedCount là lịch sử đã ghi, rewardXp chỉ legacy display. |
| API-030 | `POST /api/v1/quests/{id}/join` | **✅ HOÀN THÀNH** | Self join, canonical identity, approved matching criteria, campus/deadline/source eligibility, freeze criteria, chống trùng và retry. Đã đăng ký nguồn vẫn join khi full/closed; nguồn phải upcoming; đổi quest khi xử lý =>409. |
| API-031 | `POST /api/v1/quests/{id}/complete` | **✅ HOÀN THÀNH** | Self-only, phải join, expectedVersion participation, verified eligible proof đúng tác giả/kỳ/source/pillar. Kiểm tra live cancellation trước replay, completion history append-only, không mint thêm điểm. note tối đa500. |
| API-058 | `GET /api/activities/{activityId}/contributions` | **✅ HOÀN THÀNH** | Paged contribution đúng activity và CLB được phân công; kiểm tra scope kể cả danh sách rỗng. |
| API-059 | `POST /api/contributions/{id}/reviews` | **✅ HOÀN THÀNH** | ASSIGNED review APPROVE/REJECT/REQUEST_REVISION; version/reason/verifiedAttributes; decision/revision/ledger/outbox nguyên tử; không tự duyệt. |
| API-060 | `POST /api/contributions/{id}/role-upgrade-requests/{requestId}/reviews` | **✅ HOÀN THÀNH** | Duyệt upgrade theo version của upgrade request; giữ blueprint/policy, ghi delta; reject giữ điểm cũ. |
| API-063 | `GET /api/v1/student-affairs/declarations` | **🟡 CHƯA HOÀN THIỆN** | Adapter queue canonical đã có và lọc assignment/no-self; còn lẫn DTO/hồ sơ legacy, nhánh staff đọc khai báo outside legacy không theo assignment mới. FE ưu tiên queue canonical, nhận diện legacy rõ. |
| API-064 | `POST /api/v1/student-affairs/declarations/{id}/review` | **🟡 CHƯA HOÀN THIỆN** | Review canonical đã version/vector/assignment/ledger/outbox. Nhánh legacy outside của Admin/CTSV vẫn dùng review/scoring cũ; không đưa nhánh này vào luồng điểm verified mới. |
| API-068 | `POST /api/contributions/{id}/adjustments` | **✅ HOÀN THÀNH** | CORRECT/REVOKE có capability/no-self/version/reason; append effect, không sửa ledger cũ hoặc phục hồi nguồn đã hủy. |

<!-- BE_STATUS_2026_10_14_END -->

**GIỮ — BẮT BUỘC (F05, F07, F08, F10, F11).** Phiếu v1.4 mục 3.1; PDF trang 2–5. Áp dụng [phạm vi](capstone-scope-contract.md), [điểm](experience-scoring-contract.md), [quyền](internal-accounts-verification-api.md) và [conventions](api-contract-conventions.md).

## Nguồn và danh tính đóng góp

| Nguồn | Luồng bắt buộc |
| --- | --- |
| CLB — tham dự | Đăng ký/điểm danh hợp lệ theo [attendance](activity-attendance-api.md). Server xác thực attendance; chỉ ghi điểm cơ bản khi điều kiện hoạt động/policy đã hợp lệ |
| CLB — đóng góp sâu/nâng vai trò | Sinh viên nộp căn cứ công sức/vai trò/đầu ra; Quản lý CLB hoặc người xác minh có phân công và capability duyệt |
| Ngoài CLB / nguồn Khoa, Phòng ban, FPT Education | Sinh viên tự khai kèm minh chứng, người xác minh nội bộ được phân công xử lý; **BỎ QUA** tự đồng bộ hệ thống của đơn vị |
| +1 Trải nghiệm Thực tế | Khai báo thực tập/OJT/dự án doanh nghiệp/freelance/sản phẩm thực, minh chứng và người xác minh nội bộ; **BỎ QUA** API OJT/SSO trường |

Một `contributionId` biểu diễn một công sức của một sinh viên từ một nguồn. Ràng buộc nguồn CLB đề xuất: `(userId, activityId, sessionId, contributionKind)`; sessionId bắt buộc nếu ghi nhận theo buổi. Không ghi cùng công sức bằng cả attendance, task và declaration. Nâng vai trò/kết quả là revision của cùng contribution, không tạo nguồn điểm mới. Khai báo ngoài CLB có ID ổn định; kiểm tra trùng với nguồn dự án đã liên kết, không cam kết tự phát hiện mọi khai báo trùng từ thực tế.

Contribution gồm: `id,userId,sourceType,sourceId,clubId?,activityId?,sessionId?,semesterId,occurredAt,title,proposedAttributes,evidenceRefs,currentRevisionId,status,version`. `verifiedAttributes` gồm tier/role/scale/result/vector; chỉ người có quyền/validator nguồn tin cậy ghi. Lưu người/đường xác thực, decisionId, policy/formula và snapshot tính điểm. Không lấy tên/userId/campus/điểm do client gửi làm căn cứ quyền.

## Tái sử dụng route và đề xuất phần thiếu

Các route declarations hiện có vẫn được dùng, nâng DTO/state/persistence; không tạo một API self-declaration thứ hai:

| API | Trạng thái contract |
| --- | --- |
| POST `/api/v1/declarations` | CÓ ROUTE; nâng khai báo ngoài CLB/+1: `semesterId,occurredAt,pillarWeights,proposedAttributes,evidenceRefs`, giữ adapter DTO cũ |
| GET `/api/v1/declarations/me`, GET/PUT `/api/v1/declarations/{id}` | CÓ ROUTE; self history/detail và bổ sung revision, quyền author/reviewer được giao |
| GET `/api/v1/student-affairs/declarations`, POST `/{id}/review` | CÓ ROUTE; tên namespace cũ không bắt buộc actor CTSV thật. Nâng policy thành phân công xác minh + phạm vi + cấm self-review; không mở toàn bộ backoffice cho Verifier |
| POST `/api/activities/{activityId}/contributions` | ĐỀ XUẤT; self submit `{sessionId?,contributionKind,proposedAttributes,message,evidenceRefs,expectedActivityVersion}`; 201, Idempotency-Key |
| GET `/api/activities/{activityId}/contributions` | ĐỀ XUẤT; paged cho reviewer đúng scope, không cho mọi thành viên đọc minh chứng |
| GET `/api/users/me/contributions` | ĐỀ XUẤT projection thống nhất self, query semesterId/status/pillar/page/pageSize. Dùng nguồn có namespace `DECLARATION`/`CLUB_CONTRIBUTION`; không cộng trùng |
| GET `/api/contributions/{id}`, PATCH `/{id}` | ĐỀ XUẤT riêng nguồn CLB; author hoặc reviewer đúng quyền. Author chỉ bổ sung bản chưa approved/được yêu cầu; không sửa revision đã ghi điểm |
| POST `/api/contributions/{id}/reviews` | ĐỀ XUẤT review CLB; `{decision,reason,verifiedAttributes?,expectedVersion}`, Idempotency-Key |
| POST `/api/contributions/{id}/role-upgrade-requests` | ĐỀ XUẤT self xin nâng role/result cùng nguồn; `{proposedRole,proposedResult?,evidenceRefs,reason,expectedVersion}` |
| POST `/api/contributions/{id}/role-upgrade-requests/{requestId}/reviews` | ĐỀ XUẤT reviewer phân công, cấm self; cùng format quyết định, không nhập điểm tùy ý |
| GET `/api/users/me/experience-ledger` | ĐỀ XUẤT self paged theo kỳ/trụ cột/source; ledger trải nghiệm, **không phải ví tiêu điểm** |
| POST `/api/contributions/{id}/adjustments` | ĐỀ XUẤT quyền `experience.adjust`; `{kind:REVOKE|CORRECT,reason,correctedAttributes?,expectedVersion}`, Idempotency-Key; tính số điều chỉnh phía server |

Tất cả route `/{id}` ghi tắt trong một dòng kế thừa prefix của dòng đó. Queue/detail declarations giữ prefix `/api/v1/student-affairs/declarations`. Các route mới cần Gateway, migration và FE facade; nguồn tồn tại không là bằng chứng chúng đã có.

## Trạng thái và duyệt

Đề xuất canonical: `DRAFT → SUBMITTED → APPROVED | REJECTED | REVISION_REQUESTED`; `REVISION_REQUESTED → SUBMITTED` bằng revision mới. Đổi alias trạng thái BE cũ cần adapter/migration, không tự đổi giá trị cũ mà làm mất history. APPROVED không bị author sửa trực tiếp. Author được xem reason/history và bổ sung đúng trạng thái.

Review: `decision:APPROVE|REJECT|REQUEST_REVISION`, `expectedVersion`, `reason` và `verifiedAttributes` khi APPROVE. Reject/request revision phải có lý do; đề xuất reason 1–1000 ký tự, message ≤2000, tối đa 10 evidenceRefs. Mọi limit này là mặc định kỹ thuật được ghi trong thiết kế, không phải quy định trường. Validate field, state, nguồn/policy/semester và quyền lần nữa trong transaction.

Quản lý CLB chỉ duyệt đóng góp thuộc CLB được giao và capability `contribution.review`; bên ngoài/+1 cần phân công tương ứng. Người duyệt không được có userId bằng người đóng góp, kể cả admin/owner; thu hồi/điều chỉnh thủ công cũng không tự xử lý điểm của mình. Từ chối do SELF_REVIEW_FORBIDDEN không được client vòng qua bằng route quest/attendance/declaration khác.

Attendance QR hợp lệ là xác thực tự động theo quy tắc server, không phải sinh viên tự duyệt thủ công. Chỉ cấp Participant cơ bản; chức vụ/staff/đăng ký không tự cấp Organizer/Leader/Product hay thưởng đầu ra. Thuộc tính hoạt động được xác nhận trước công bố; không dùng cấu hình chưa duyệt để mint điểm thật.

## Nâng vai trò và giữ điểm hợp lệ

Contribution đã có điểm A vẫn APPROVED trong khi yêu cầu nâng vai trò đang PENDING. Từ chối/yêu cầu bổ sung/withdraw yêu cầu nâng không thu hồi A và không hạ role đã xác nhận. Phê duyệt role/result mới tính P_new theo cùng quy tắc phiên bản được chỉ rõ, append **chênh lệch** `P_new − P_old` cùng phân bổ, không cộng toàn bộ P_new thêm lần nữa.

Ví dụ T3 Campus: Participant=78; nâng Product=171.6 thì append +93.6, net=171.6; nâng Leader bị từ chối thì net vẫn171.6. Nếu policy/vector thay đổi thì `CORRECT` có căn cứ và snapshot trước/sau, không giả làm upgrade chỉ để cộng lại điểm. Phiên bản thay đổi trong lúc review →409; reviewer phải đọc lại.

## Sổ cái chỉ ghi thêm

Ledger đề xuất gồm `entryId,contributionId,revisionId,userId,semesterId,pillar,entryType,amount,sourceType,sourceId,verificationId,verifiedByUserId?,verificationMethod,policyVersion,formulaVersion,occurredAt,recordedAt,reason,originalEntryId?,eventId`. Types: `AWARD|UPGRADE_DELTA|REVERSAL|CORRECTION`. Căn cứ riêng tư chỉ lộ cho chủ thể/người xử lý có quyền, không kèm storagePath/public URL.

Decision + contribution revision + unique ledger effect + outbox phải commit nguyên tử, hoặc qua outbox/receipt nếu khác DB; response phải trả `recognitionStatus:PENDING|RECORDED|FAILED` trung thực. Unique `(contributionId,revisionId,effectType)` và source identity ngăn race/key khác; idempotency key chỉ là một lớp. Consumer dedupe eventId. Không mint lại khi đọc, reload, restart, xác nhận lại, hoàn thành quest hoặc thay frontend tab.

Sai thì append bút toán đảo liên kết bản gốc; không UPDATE/DELETE ledger cũ. Net của cùng đóng góp chỉ thay đổi theo correction được quyền duyệt; không cho đảo cùng entry hai lần hoặc thu hồi quá phần còn hiệu lực. Trả effective/revoked state và snapshot ledgerRevision mới, vẫn đọc được lịch sử trước/sau. Không có chính sách nợ ví/tiêu điểm vì ví đã **BỎ QUA**.

Giữ `XpLedgerEntry` cũ để tương thích, nhưng không dùng sample/anomaly/manual XP tùy ý làm đóng góp đã xác thực. Khi hợp nhất phải có provenance và migration được review. Nguồn declarations/attendance/contributions dùng chung quy tắc ghi nhận, không ba bộ cộng điểm độc lập.

## Minh chứng riêng tư

Đề xuất POST `/api/contributions/evidence` multipart file + `sourceType,sourceId?`: self uploader, pending scope, private storage; trả opaque `{attachmentId,name,contentType,sizeBytes,createdAt}`. POST declarations có thể tái sử dụng cơ chế protected attachment hiện có nếu bảo đảm cùng quyền; không ép sinh viên phát URL công khai.

GET `/api/contributions/evidence/{attachmentId}/download` kiểm tra author/reviewer assignment và stream private no-store. Liên kết evidence kiểm tra actor/nguồn/size/type; không đọc được của người khác bằng đoán ID. Đề xuất tối đa10 MiB/file, PDF/PNG/JPEG (WebP chỉ có ở public image, chưa được private upload hỗ trợ), kiểm tra bytes/MIME. Evidence đã dùng xác thực được giữ; correction không xóa history. Không bắt buộc thêm nhà cung cấp lưu trữ, public R2 chỉ dành ảnh trình bày.

## Nhiệm vụ và thông báo

Tái sử dụng quest catalog/participation hiện có cho lựa chọn/theo dõi nhiệm vụ; mở rộng `targetPillar,eligibleActivityIds,criteria,policyVersion,linkedContributionIds,completionStatus`. Chọn nhiệm vụ không tạo contribution/điểm. Hoàn thành do đóng góp đã xác thực hợp lệ và dedupe theo nhiệm vụ/nguồn; một contribution không được mint thêm bởi quest. `CompleteQuestAsync` hiện cho AnyActor/StudentUserId cần hardening, không dùng làm cửa cấp verified points tùy ý.

Outbox thông báo đúng chủ thể khi submit/revision requested/approved/rejected/upgrade/correction; queue notification cho người được giao. Không gửi nội dung minh chứng nhạy cảm vào summary notification; deep link kiểm tra quyền. Tái sử dụng NotificationService, không tạo hộp thư thứ hai.

## Nghiệm thu

Author/reviewer/admin/manager khác CLB; self-review qua mọi route; account/assignment revoked; private download; pending không có điểm; APPROVE race/replay chỉ một effect; upgrade reject giữ điểm; upgrade approve chỉ delta; correction/reversal giữ lịch sử; event duplicate/outbox retry; semester snapshot; restart/reload; task completion không cộng lại; source bị khai lại qua declaration không ghi trùng.

</details>
