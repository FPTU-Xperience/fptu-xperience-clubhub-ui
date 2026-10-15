# Contract kế hoạch kỳ, thống kê và báo cáo CLB — 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-040 | `GET /api/clubs/{clubId}/semester-plans/{semesterId}` | **✅ HOÀN THÀNH** | Đọc kế hoạch kỳ đúng scope, canonical semester code và version. |
| API-041 | `PUT /api/clubs/{clubId}/semester-plans/{semesterId}` | **✅ HOÀN THÀNH** | Một kế hoạch hiện hành cho mỗi CLB/kỳ; mục tiêu không âm; CAS/version, revision history và idempotency. |
| API-042 | `GET /api/clubs/{clubId}/experience-statistics` | **✅ HOÀN THÀNH** | Tính toàn dữ liệu: hoạt động/buổi, người duy nhất, lần đầu toàn dự án, vai trò hiệu lực, net raw points từng trụ cột và tiến độ mục tiêu. |
| API-043 | `POST /api/clubs/{clubId}/experience-reports` | **✅ HOÀN THÀNH** | Chốt snapshot thống kê đã đối chiếu planVersion/ledgerRevision; trả 202 và job PDF lưu trong DB. |
| API-044 | `GET /api/clubs/{clubId}/experience-reports/{reportId}/download` | **✅ HOÀN THÀNH** | Tải PDF thực tế sau khi hoàn thành; private/no-store; kiểm tra quyền quản lý hiện tại, kể cả file đã tạo trước đó. |

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| ADD-01 | `GET /api/club-experience-reports/{reportId}` | **✅ HOÀN THÀNH** | Theo dõi job Pending/Processing/Completed/Failed và downloadUrl. |
| ADD-02 | `GET /api/club-experience-reports/{reportId}/download` | **✅ HOÀN THÀNH** | Alias tải PDF theo reportId; current owner, private/no-store. |

<!-- BE_STATUS_2026_10_14_END -->

**GIỮ — BẮT BUỘC (F09).** Phiếu v1.4 mục Quản lý CLB yêu cầu mục tiêu số hoạt động/số buổi/số người duy nhất, thống kê người lần đầu/vai trò/trụ cột, đối chiếu mục tiêu và xuất PDF; **không quản lý ngân sách**. PDF trang5 hỗ trợ khái niệm độ phủ/độ sâu nhưng các tầng trường/tín chỉ ngoài phạm vi.

## Kế hoạch học kỳ

Tái sử dụng semester catalog; plan gồm `id,clubId,semesterId,title,targetActivityCount,targetSessionCount,targetUniqueParticipantCount,status,version,createdBy,createdAt,updatedAt`. Mục tiêu integer≥0, không có ngân sách/nguồn tiền/quyết toán. Đề xuất GET/PUT `/api/clubs/{clubId}/semester-plans/{semesterId}` cho manager đúng CLB và capability; PUT `{title,targetActivityCount,targetSessionCount,targetUniqueParticipantCount,expectedVersion}`.

Một plan hiện hành/club/semester; update optimistic version, audit history. Có thể tái sử dụng report/plan entity nếu đủ nghĩa và không bắt buộc tạo budget proposal. Phê duyệt tài chính/CTSV kế hoạch không tự trở thành bước bắt buộc; phiếu yêu cầu manager lập/đối chiếu, không cấp nguồn lực.

## Thống kê cùng nguồn đóng góp

Đề xuất GET `/api/clubs/{clubId}/experience-statistics?semesterId={canonicalCode}`: manager/capability trong CLB, trả `{clubId,semesterId,asOf,ledgerRevision,planVersion,activityCount,sessionCount,uniqueParticipantCount,firstTimeParticipantCount,roleDistribution,pillarDistribution,targets,progress,definitionsVersion}`. Counts do server tính trên toàn dữ liệu, không đếm từ trang đầu100 dòng.

Định nghĩa thiết kế đề xuất, cần ghi vào data dictionary và dùng thống nhất trong kiểm thử/báo cáo:

- `activityCount`: distinct activity đã công bố thuộc kỳ, không DRAFT/CANCELLED; `sessionCount`: distinct buổi đã diễn ra/completed hợp lệ trong kỳ, không buổi bị hủy. Lưu rõ tiêu chí và ngày chốt `asOf`, không nhập nhằng planned sessions với completed sessions.
- `uniqueParticipantCount`: distinct user có attendance hoặc đóng góp **đã xác thực** ở CLB trong kỳ. Đăng ký chưa tham gia không tính. Nhiều buổi/multiple proofs cùng người chỉ đếm1.
- `firstTimeParticipantCount`: tập trên nhưng chưa có bất kỳ đóng góp/attendance xác thực **toàn dự án** trước lần tham gia đầu tiên trong kỳ. Đây là cách hiểu PDF “bất kỳ hoạt động nào”; không tuyên bố dữ liệu toàn trường. Nếu cần số lần đầu riêng CLB thì trả thêm `firstTimeInClubCount` với tên riêng, không tráo nghĩa.
- `roleDistribution`: số contribution nguồn hiệu lực theo vai trò đã xác nhận; khi upgrade thay effective role của cùng contribution, không đếm role cũ+role mới như hai công sức. Có `unit:CONTRIBUTIONS` và tổng; nếu thêm unique users by role thì tên riêng vì một người có thể có nhiều role.
- `pillarDistribution`: tổng allocated raw points xác thực net của CLB, tách sáu trụ cột/+1, kèm policy/ledgerRevision; có thể thêm count. Không cộng các radar cá nhân đã bão hòa hoặc gọi đây là ví/tín chỉ ngân sách.
- `targets/progress`: cùng định nghĩa activity/session/unique; denominator0 cho ratio=null với targetReached theo quy tắc đã ghi, không chia0 hoặc dựng0% giả.

Counts trong báo cáo tổng hợp không lộ user contacts/evidence. Drill-down cá nhân chỉ cho scope quản lý/xác minh cần thiết. Các phép correction thay hiện trạng và snapshot báo cáo mới, không sửa file lịch sử đã chốt.

## Báo cáo PDF

Tái sử dụng ReportService list/detail/protected download/export infrastructure khi phù hợp; thêm kiểu báo cáo trải nghiệm CLB không bắt buộc finance/receipt/settlement. Đề xuất POST `/api/clubs/{clubId}/experience-reports` `{semesterId,expectedPlanVersion,expectedLedgerRevision}`, Idempotency-Key; trả `{reportId,status,asOf,planVersion,ledgerRevision,exportId?}`. Generation có snapshot dữ liệu; khi async trả PENDING, không giả file sẵn.

Đề xuất GET `/api/clubs/{clubId}/experience-reports/{reportId}/download`: đúng club/capability, file PDF protected, không public storage URL. Export job hiện có được dùng thay route mới nếu đáp ứng cùng bảo mật/metadata. PDF chứa mục tiêu/thực tế/người duy nhất/người lần đầu/role/pillar/policy/định nghĩa/asOf; không có ngân sách/ranking/PII/minh chứng riêng tư. UI download chỉ bật khi artifactREADY, lỗi có retry.

**BỎ QUA — NGOÀI PHẠM VI:** budget proposals/finance targets, settlement/transactions, cấp phòng/nguồn lực, competitive KPI/leaderboard, radar/nhóm ERI toàn trường, báo cáo bất thường tự động. Giữ code/API cũ cho tương thích, không là tiền đề bắt buộc để xuất báo cáo trải nghiệm.

## Nghiệm thu

Một người5 buổi→unique1; hai club không tự lẫn; người đã tham gia kỳ trước không tính firstTime; ngoài CLB trước đó được xử lý theo definitionsVersion; đăng ký/chưa verified không tính; canceled/revoked không tăng thực tế; upgrade không đếm đôi; >100 bản ghi; target0; stale plan/ledger snapshot; PDF đúng snapshot/quyền/download/không lộ dữ liệu riêng; restart giữ plan/report/export status.
