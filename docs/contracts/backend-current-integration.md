# Wire contract hiện hành để tích hợp FE — 23/10/2026

Implement Status: Done

Status Scope: Documentation: current BE-supported wire subset; not all backend/features/FE complete

Backend Progress: PARTIAL_PROJECT

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62`, branch `feat/backend-contract-completion`; reviewed FE requirement pin `3ffd00ed03a5b8db942ed3ac3b7b6dee098d9f42`. FE worktree remains `update-contract`; no runtime code merge.

Source Evidence: [BE manifest](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/contracts/be-operation-manifest.json); existing BE suite 914 passed / 0 failed / 0 skipped, source/local SQL proof only. This sync runs documentation validation, not a new BE suite or FE/live acceptance.


<a id="overview"></a>

## Phạm vi và thứ tự ưu tiên


Đọc [bảng API hiện hành](be-api-status.md) và [JSON cùng mốc](be-api-status.json). Các trích đoạn dưới đây lấy từ handoff BE tại commit đã pin, mô tả phần source đã triển khai. Không lấy ví dụ đề xuất trong lịch sử làm bằng chứng endpoint đã có. Backend main cũ không có toàn bộ thay đổi của nhánh này; cần chạy đúng nhánh/migration/cấu hình trước khi nối FE.

40 operation mới so với baseline `b066f96` và 13 operation có extension/fix được liệt kê riêng. Nhóm 16 consumer từng thiếu route đã có handler; đây không phải tổng mọi API hay kết luận toàn bộ contract hoàn thành. Không sửa runtime, adapter, UI hoặc package-lock trong lượt đồng bộ này.

<a id="conventions"></a>

## ID, version, lỗi và retry


| Resource | ID / version dùng khi ghi |
| --- | --- |
| Account/club/activity/session và application/action | ID integer dương; không đổi resource legacy sang GUID |
| Application / staffing / publication | Version integer dương, riêng theo resource; publicationVersion khác staffing version |
| Recruitment / position / assignment / action completion | ID GUID; lấy expectedVersion theo envelope hiện hành |
| Profile / legacy activity / calendar / schedule block / EMBED resource | Version GUID; giữ nguyên token do GET trả |
| Calendar source và private schedule block | Hai token độc lập: expectedCalendarVersion và expectedVersion |
| Roster | Semester GUID hoặc canonical code; revision/import GUID, expectedRosterVersion GUID |

Gửi JWT qua API client/Gateway hiện có. Không đưa internal workflow token vào browser, không gọi `/api/internal/*`. Các mutation application/staffing/publication, roster commit, lịch học và resources dùng `Idempotency-Key` 1–100 ký tự ASCII; retry giữ nguyên method/path/body/key. Không áp quy tắc đó bằng suy đoán lên mọi route legacy: profile PATCH/withdraw/invite có hỗ trợ key tùy chọn, FE nên gửi key khi làm lại cùng hành động.

Quyền hiện tại được kiểm tra trước replay. `409` yêu cầu reload resource/version; không tự sinh GUID/int version hoặc retry khác nội dung với cùng key. Một số route dùng code/message, một số paging total hoặc totalItems: đọc đúng DTO của endpoint. `null` do chưa có nguồn/chờ chính sách khác 0; mảng rỗng authoritative khác availability unavailable.

<a id="actions"></a>

## Application, publication, staffing và tuyển người

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md).

### Điểm đang tạm hoãn: lưu ý cho người làm FE

Hồ sơ trả `expectedRawXp:null`, `scoringStatus:"DEFERRED_BY_PRODUCT_OWNER"`, `canAwardPoints:false`. Các giá trị basePoints trong hồ sơ chỉ là đề xuất được lưu lại, không phải chính sách tính điểm được duyệt. Giới hạn độ dài/số lượng là giới hạn kỹ thuật của request, không phải mức thưởng được phê duyệt.

**FE hiện kiểm tra expectedRawXp phải là số; phần adapter này chưa tương thích khi bỏ tính điểm.** FE cần nhận trạng thái chờ chính sách và không hiển thị/null thành điểm 0. BE không trả số giả để vượt validation. Không đánh toàn bộ action contract hoàn thành chỉ vì các route vận hành đã có.

APPROVED chỉ tạo đúng một hoạt động chưa công bố và action rules bất biến. Xác minh completion chỉ đổi trạng thái thành VERIFIED, giữ người/thời gian/version; không ghi raw XP, CLUB_CREDIT, ngân sách hoặc hiệu ứng ledger. API lifecycle cũ không được chỉnh/publish vòng qua hồ sơ action đã duyệt. Legacy attendance/contribution vẫn dùng cơ chế cũ; không dùng nó để tự cấp điểm cho action mới.

### Hợp đồng hồ sơ và phân công

ID hồ sơ/action là integer dương; version hồ sơ/staffing/publication là integer dương. API legacy giữ GUID version. ID recruitment/position/assignment/completion là GUID. Lấy version hiện tại từ GET rồi gửi `expectedVersion` đúng resource. `publicationVersion` khác version staffing; mọi thay đổi publication cũng tăng version staffing.

GET `/api/activities/{id}` và danh sách `/api/activities` giữ `version` GUID cũ; với hoạt động từ hồ sơ mới, bổ sung `isPublished`, `publicationVersion`, `sourceApplicationId`, `publicationCapabilities.canManage` và bỏ field `publicationStatus`. Cách này giúp adapter FE chọn PATCH publication bool thay vì nhánh PUBLISH/CLOSE legacy. Hoạt động legacy vẫn giữ response cũ. Khả năng công bố kiểm tra lại học kỳ active và thời gian nguồn; không chỉ dựa trên quyền ở thời điểm duyệt.

`completions` chỉ nhận WORK_REVIEW, còn `attendance-claims` chỉ nhận ATTENDANCE và luôn có minh chứng. Đây là xác minh thủ công độc lập, không phải QR check-in; không tạo ActivityAttendance hoặc thưởng qua luồng legacy. Người chỉ có contribution.review không được duyệt attendance.

Các mutation hồ sơ/publication/staffing cần `Idempotency-Key` (ASCII 1–100 ký tự). Gửi lại cùng method/path/body/key trả receipt đã commit; đổi body cùng key trả 409. Quyền hiện tại được kiểm tra trước replay. Sửa draft gửi đủ payload theo applicationPayload; trường ngoài DTO/JSON trùng tên bị từ chối. Payload tối đa 256 KiB, tối đa 100 actions/positions.

Chỉ quản lý hiện tại của CLB được ghi; CTSV/Admin đọc và xét duyệt theo campus, không tự duyệt hồ sơ do mình tạo. Public viewer chỉ nhận phân công của chính mình, không nhận eligibleAssignees hoặc minh chứng người khác. Verifier chỉ nhận minh chứng trong capability tương ứng; HOST/STAFF không cấp quyền quản lý, tài chính hoặc xác minh.

Không ẩn hoạt động đã có đăng ký hay phân công đang hiệu lực; trả 409 PUBLICATION_IN_USE. Hủy phân công vẫn giữ completion và lịch sử; nhận lại không xóa giới hạn occurrence. Vị trí đã có người không được xóa/đổi loại hoặc giảm sức chứa xuống dưới số người đã nhận. Thay scope tuyển dụng khi có phân công đang hiệu lực bị từ chối.

**Việc adapter FE còn thiếu:** chấp nhận `expectedRawXp:null` cùng `scoringStatus` và tắt thao tác điểm; `validReceipt` chỉ nhận number có thể từ chối response BE hợp lệ. Không sửa adapter trong lượt này, không trả/hiển thị 0 giả để vượt validation.

<a id="roster"></a>

## Roster học kỳ, eligible search và lời mời

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md).

**Quyết định chủ dự án:** ghép bằng email trường với tài khoản đã có, **không tự tạo account khi import**. Roster này là snapshot quản trị trong dự án, không phải kết nối FAP hay xác nhận ngành/năm học chính thức. Ghi chú BỎ QUA import của mốc 12–14/10 không còn áp dụng cho phạm vi đã được cho triển khai này.

### Roster và lời mời

CSV UTF-8 có exact headers `email,studentCode,campusCode,status`, hoặc thêm `userId` cuối. `status` là ACTIVE/INACTIVE; campus dùng HAN/HCM/DAN/CAN/QNH. Tối đa 5 MiB request và 10.000 dòng. JSON tương đương:

```json
{"schemaVersion":1,"rows":[{"email":"student@fpt.edu.vn","studentCode":"SE000000","campusCode":"HAN","status":"ACTIVE"}],"expectedRosterVersion":"00000000-0000-0000-0000-000000000000","mode":"replace"}
```

Đây là ví dụ schema, không tạo tài khoản mẫu. Account phải tồn tại, là actor Sinh viên/Quản lý CLB hợp lệ, có school email, đúng campus; ACTIVE còn yêu cầu active/unlocked. `Roster:SchoolEmailDomains` ở Auth cấu hình domain trường, mặc định `fpt.edu.vn`; không dùng danh sách Google sign-in có gmail làm school roster.

Preview trả importId/baseVersion/errors/canCommit, tồn tại một giờ. Commit cần `expectedRosterVersion` và Idempotency-Key; không cho người khác/campus khác commit preview. Version ban đầu là Guid.Empty. Dòng lỗi, email/code trùng, userId/email/campus không khớp, account không tồn tại hoặc đổi sau preview đều không thay roster thật.

Thiếu roster trả ROSTER_UNAVAILABLE, không thay bằng toàn bộ account active. Roster có revision rỗng là dữ liệu hợp lệ. Khi khởi tạo lười kỳ chưa có roster, chỉ kế thừa revision của kỳ có ngày bắt đầu trước gần nhất trong cùng campus; lưu source revision, source CARRY_FORWARD và actor hệ thống 0. Không đoán học kỳ từ code, không reset điểm hoặc tự cấp membership/office. Import rỗng rõ ràng ghi đè dữ liệu kế thừa và không bị kế thừa lại.

Eligible search yêu cầu search 2–100 ký tự, pageSize 1–50. Kết quả chỉ gồm userId/fullName/studentCode/flags, không email/phone. Roster revision và tài khoản được tra lại lúc mời, đồng ý và duyệt. Có thể gửi `expectedRosterVersion` từ search khi mời để từ chối nguồn đã đổi. Với CLB GLOBAL, manager dùng roster campus của mình; không mở danh bạ toàn trường.

POST `/api/clubs/{clubId}/members` nay bắt buộc `semesterId`; giữ fullName như field tương thích nhưng tên lưu lấy từ Auth. Có thể dùng Idempotency-Key; không tự approve. Lưu riêng InvitedRosterRevisionId/InvitedRosterVersion lúc mời và RosterRevisionId/RosterVersion lần xác nhận gần nhất. Lời mời nguồn INVITATION cũ thiếu semester/campus cần đối soát, trả INVITATION_REQUIRES_RECONCILIATION; không tự đoán. UNKNOWN vẫn giữ UNKNOWN. Consent vẫn Pending đến khi quản lý duyệt.

Lời mời và notification outbox cho đúng người nhận commit cùng transaction. Import có notification outbox cho người import; không có email/push hay kiểm chứng delivery live trong lượt này.

<a id="schedule"></a>

## Lịch học riêng và academic calendar

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_LICH_HOC_BE_2026-10-22.md).

**Đã có 6 API BE.** BỎ QUA cũ không mô tả trạng thái source của 6 API này; FAP/OJT/schedule matching vẫn ngoài phần đã triển khai. FE consumer vẫn cần chuyển từ repository local, không tự nhập dữ liệu mẫu vào server.

### API đã có

| Method | Route | Quyền và kết quả |
| --- | --- | --- |
| GET | `/api/academic-calendar/{year}/{term}` | Account hiện tại active/unlocked; lịch của campus hiện tại |
| PUT | `/api/academic-calendar/{year}/{term}` | CTSV cùng campus hoặc Admin; lưu lịch chung và revision bất biến |
| GET | `/api/users/me/study-schedule/{year}/{term}/{block}` | Lịch riêng của principal; toàn bộ tuần của block, đã sắp xếp |
| PUT | `/api/users/me/study-schedule/{year}/{term}/{block}/{week}/{day}/{slotId}` | Tạo/thay đúng một ô; không đổi tuần khác |
| DELETE | Cùng route một ô | Xóa riêng ô đó; 204 nếu chưa có ô, không xóa period/history calendar |
| POST | `/api/users/me/study-schedule/{year}/{term}/{block}/bulk-import` | Weekly template, skip/replace; transaction toàn block |

Thêm `GET /api/internal/academic-calendar/{year}/{term}` chỉ cho service: cần bearer hợp lệ và internal token. Gateway không mở prefix này. Auth dùng projection nội bộ của Admin, không tạo catalog học kỳ thứ hai.

Tất cả mutation cần `Idempotency-Key` 1–100 ký tự ASCII. Khóa gửi lại với cùng request trả receipt; đổi request cùng key trả 409. Account, campus và nguồn học kỳ được kiểm tra trước replay. Không nhận userId từ body để chọn người sở hữu.

### Nguồn học kỳ và campus

Admin là nguồn Semester GUID/code/ngày/active. Cấu hình alias tường minh giống workspace catalog:

```text
Workspace:SemesterAliases:<Semester.Id>:Year = 2026
Workspace:SemesterAliases:<Semester.Id>:Term = FA
```

Không suy ra term/năm từ code, tháng hiện tại hoặc AcademicYear. Không có alias: 404 SEMESTER_UNCONFIGURED. Nhiều Semester cùng alias: 409 SEMESTER_ALIAS_AMBIGUOUS. Kỳ đã biết nhưng chưa cấu hình block trả ba ngày `""`, có version thật; lịch block-local vẫn nhập được nếu kỳ active và ngày nguồn hợp lệ.

Mỗi cấu hình lịch gắn với Semester.Id và campus. GET dùng campus của account Auth hiện tại. Query `campusCode` chỉ cho chọn campus khác khi là Admin; CTSV/sinh viên không vượt campus của mình. Admin có account GLOBAL phải chọn một campus cụ thể; có thể dùng `?campusCode=HAN` ở lịch chung và các API lịch cá nhân. Query này không đổi chủ sở hữu lịch cá nhân.

Ngày là chuỗi local calendar `yyyy-MM-dd`, không chuyển múi giờ. termStartDate phải bằng ngày bắt đầu Semester chính thức. Hai block bắt đầu thứ Hai, termStartDate <= block10StartDate, block3StartDate >= block10StartDate + 70 ngày; ba tuần của block 3W phải kết thúc trong học kỳ. 3W dùng tuần 1–3; 10W dùng tuần 1–10. Slot 1–5 cho 10W, slot 1–7 cho 3W.

### Version và request

GET lịch chung trả các field cũ cùng `semesterKey`, `semesterId`, `campusCode`, `version`, `isActive`, `canWrite`, `availability`. Version là GUID opaque tính từ nguồn Semester và cấu hình hiện hành; lấy nguyên từ GET, kể cả cấu hình đang trống. PUT:

```json
{"termStartDate":"2026-08-30","block10StartDate":"2026-08-31","block3StartDate":"2026-11-09","expectedVersion":"<calendar-version-from-GET>"}
```

Ví dụ chỉ hợp lệ khi ngày Semester và alias thật khớp. Không seed học kỳ từ ví dụ này.

GET lịch cá nhân trả thêm `version` của block và `calendarVersion` nguồn. `version` là Guid.Empty khi chưa có block, khác với version lịch chung. Thêm hai field vào body PUT ô hoặc bulk import:

```json
{"subject":"SWP391","room":"AL-R101","expectedVersion":"<block-version>","expectedCalendarVersion":"<calendar-version>"}
```

Bulk giữ cấu trúc `mode:"skip"|"replace"`, `entries:[{day,slotId,subject,room}]` và hai expected-version trên. Template không có week; mỗi hàng áp dụng cho mọi tuần của block. Count imported/skipped/replaced tính theo ô tuần, không tính theo số hàng template. Response có toàn bộ entries và version block mới. Đọc version này cho lần ghi tiếp theo.

DELETE không có body; gửi query `expectedVersion=<block-guid>&expectedCalendarVersion=<calendar-guid>`. Sau 204, GET lại để lấy version hiện tại cho thao tác mới. Retry cùng Idempotency-Key vẫn trả 204.

`canWrite` của projection nguồn phản ánh khả năng ghi lịch cá nhân; CTSV/Admin vẫn có thể PUT để sửa cấu hình block đã cũ nếu học kỳ còn active.

Version cũ của block hoặc lịch chung trả 409. Mọi ô trong một block cùng dùng version aggregate, nên import và sửa thủ công không được âm thầm ghi đè nhau. Sửa ngày lịch chung chỉ đổi nhãn ngày/version nguồn, không dịch/xóa các ô tuần đã lưu. Semester inactive hoặc cấu hình block cũ không còn hợp lệ khiến ghi mới bị chặn; lịch sử riêng vẫn đọc được.

### Validation và riêng tư

- year 2000–2100; term chính xác SP/SU/FA; day mon…sun; block và tuần/slot đúng phạm vi.
- Subject trim 1–120 ký tự; room trim tối đa 80, thiếu/null thành `""`; không nhận ký tự điều khiển.
- Tối đa 35 hoặc 49 hàng template, không trùng day+slot. JSON trùng field/field lạ, thiếu version, sai kiểu, payload quá lớn đều bị từ chối trước ghi. PUT/calendar tối đa 8 KiB, bulk tối đa 64 KiB.
- Không trả DB/account ID trong entries. Không ghi subject/room vào log nghiệp vụ. User khác không đọc/sửa được lịch riêng; quản lý CLB không có endpoint đọc lịch của sinh viên.
- Token nội bộ sai hoặc response authority không hợp lệ trả 503; không biến sự cố service thành lỗi nhập liệu của sinh viên. Thông tin campus/học kỳ không hợp lệ giữ mã 400/403/404/409 tương ứng.

<a id="profile"></a>

## Canonical self fields, học vụ chỉ đọc và ảnh cơ bản

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HO_SO_CA_NHAN_BE_2026-10-22.md).

### Phần đã triển khai

- Thêm `profile.headline` (trim, tối đa 160), `personal.dateOfBirth` (ngày thực `yyyy-MM-dd`, không ở tương lai theo ngày Việt Nam) và `personal.address` (trim, tối đa 300). Headline không nhận ký tự điều khiển; address cho xuống dòng địa chỉ, không nhận các control khác.
- Bỏ field giữ nguyên; null xóa các field mới. Headline trống/null đọc lại là `""`; ngày sinh/địa chỉ đã xóa đọc lại null. Ngày sinh/địa chỉ là thông tin tự khai, không phải học vụ đã được xác nhận.
- GET self trả editableFields gồm ba field mới, cùng năm field cũ. Cần GUID expectedVersion của profile khi PATCH; version cũ 409, request không có field chỉnh sửa 400. Idempotency-Key vẫn tùy chọn như API cũ; nếu dùng, gửi lại cùng payload/key trả receipt và luôn kiểm tra account hiện tại.
- PATCH giới hạn 32 KiB, JSON trùng tên field kể cả khác hoa/thường bị từ chối; field lạ không thành dữ liệu được phép. Identity/roles/email/campus/studentCode/major/year không cho tự sửa. Tài khoản inactive/locked không đọc/ghi self profile qua endpoint này.
- Ba field mới chỉ xuất hiện ở self projection. Internal user-profile projection cho service/manager giữ subset cũ; không có headline, ngày sinh, địa chỉ hoặc dữ liệu học vụ. Không thêm danh bạ công khai.

Ví dụ PATCH (lấy version thật từ GET):

```json
{"expectedVersion":"<profile-guid>","profile":{"headline":"Điều phối CLB"},"personal":{"dateOfBirth":"2004-02-29","address":"Địa chỉ tự khai"}}
```

### Học vụ chỉ đọc từ roster

GET/PATCH self trả thêm `academic` độc lập với version profile:

```json
{"availability":"AVAILABLE","studentCode":"SE100","source":"IMPORT","semesterKey":"<semester-guid>","semesterId":"FALL2026","rosterRevisionId":"<revision-guid>","sourceVersion":"<roster-guid>","major":null,"year":null,"majorAvailability":"NO_AUTHORITATIVE_SOURCE","yearAvailability":"NO_AUTHORITATIVE_SOURCE"}
```

Ví dụ thể hiện schema, không tạo dữ liệu mẫu. Mã sinh viên phải đến từ snapshot roster thực, đối chiếu userId **và email trường hiện tại**, đúng campus/account/actor; không suy từ email/MSSV để tạo ngành, năm học hoặc campus. `academic` không nằm trong editableFields.

- Dùng đúng một Semester active trong Admin. Không có hoặc nhiều hơn một kỳ trả SEMESTER_UNCONFIGURED/SEMESTER_AMBIGUOUS, không tự đoán theo tháng/code.
- Roster chưa có: ROSTER_UNAVAILABLE; roster có revision nhưng thiếu user: NOT_IN_ROSTER. Email/campus đã đổi sau import: IDENTITY_CHANGED, không trả mã cũ.
- Roster row inactive: ROSTER_INACTIVE; thông tin mã và nguồn vẫn được gắn nhãn. Nonstudent: NOT_APPLICABLE. Không có school identity chuẩn: NO_CANONICAL_SCHOOL_IDENTITY.
- Admin/roster lỗi: AUTHORITY_UNAVAILABLE, các trường nguồn không có dữ liệu; phần text self đã lưu vẫn đọc được. Không cấu hình client trong host test/host riêng: UNCONFIGURED.
- Ngành/năm học chưa có cột/nguồn học vụ đã chốt: luôn null và NO_AUTHORITATIVE_SOURCE; không nhận client tự khai làm dữ liệu chính thức.

Nội bộ thêm `GET /api/internal/academic-profiles/me` ở Admin: cần bearer và internal workflow token, user lấy từ principal. Gateway không mở route này cho browser. Auth kiểm tra userId của envelope trước khi gắn vào self response. Projection học vụ được đọc **sau** transaction PATCH/receipt, tránh gọi ngược vào Auth khi transaction đang giữ khóa profile và tránh cache mã học vụ trong receipt cũ.

### Ảnh đại diện và ảnh bìa cơ bản

Đã thêm `profile.avatarUrl` và `profile.coverImageUrl` vào GET/PATCH self và editableFields. Bỏ field giữ nguyên; null xóa đúng ảnh. Hai field này cũng không đi vào projection nội bộ cho quản lý/thành viên khác.

1. POST `/api/media/upload-intents` với kind `student-avatar` hoặc `student-cover`, ownerId là ID tài khoản hiện tại dạng chuỗi, contentType PNG/JPEG/WebP và sizeBytes >0, <=5 MiB. Server đối chiếu principal và account active/unlocked; không dùng ownerId client để cấp quyền.
2. PUT bytes lên uploadUrl do server ký; không gửi app bearer token cho R2. Giữ publicUrl trong receipt intent.
3. PATCH canonical self profile với expectedVersion và `profile.avatarUrl` hoặc `profile.coverImageUrl` là publicUrl vừa được cấp. Server tra đúng actor/kind/owner, kiểm tra expiry, object bytes/MIME/size/dimensions, rồi gắn URL bản verified bất biến. GET sau lưu trả URL verified, khác staging URL.

Không nhận URL tùy ý, blob/data URL, ảnh của người khác hoặc lấy avatar intent gắn sang cover. Storage lỗi/timeout trả 503, dữ liệu sai 400, nguồn không khớp/hết hạn hoặc version cũ 409; transaction thất bại không lưu profile dở. Retry receipt không verify/attach hai lần và vẫn kiểm tra account hiện tại. Các kind CLB/hoạt động vẫn kiểm tra quyền CLB hiện hành; mở self media không cấp quyền chỉnh ảnh CLB.

Auth migration bổ sung `20261022161555_SelfProfileOwnedImages`: hai cột URL nullable, giữ các trường text/private cũ. Nhóm media có 7 test SQL bổ sung (cùng 12 test text/private là 19); storage fixture dùng decoder thật để kiểm tra ảnh và mô phỏng immutable copy, không gọi R2 live. Có regression đỏ trước sửa cho timeout. R2/CORS/signing origin/delivery và cleanup object bỏ dở chưa được nghiệm thu live; không đánh Done toàn bộ media/resources vì luồng ảnh cơ bản đã có.

**Phần còn thiếu:** cosmetics/layout, application-logo/club-shape và nguồn major/year chính thức. Self avatar/cover có source flow không đồng nghĩa inventory/equip/redeem hay R2/CORS/cleanup live đã được nghiệm thu.

<a id="resources"></a>

## Gallery EMBED, capabilities và gỡ có lịch sử

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TAI_NGUYEN_HOAT_DONG_BE_2026-10-23.md).

### API và actor

| API | Trạng thái / actor |
| --- | --- |
| `GET /api/activities/{activityId}/resources` | **Đã triển khai cho EMBED**. Quản lý hiện tại, thành viên đã duyệt đọc tài nguyên của CLB; người cùng campus chỉ đọc `PUBLIC` khi hoạt động có `CAMPUS_PUBLIC` và publication `PUBLISHED`/`CLOSED`. CTSV/Admin chỉ đọc phần PUBLIC trong phạm vi; không tự có quyền sửa hoặc đọc CLUB. |
| `POST /api/activities/{activityId}/resources` | **Đã triển khai EMBED; DOCUMENT/MEDIA chưa hoàn thành**. Chỉ quản lý đúng CLB hiện tại được tạo; không suy quyền từ nhãn BQL phía FE. |
| `PATCH /api/activities/{activityId}/resources/{resourceId}` | **Đã triển khai** tiêu đề, thứ tự, visibility; cần version và quản lý hiện tại. |
| `DELETE /api/activities/{activityId}/resources/{resourceId}` | **Đã triển khai gỡ có lịch sử**; body chứa version/lý do. Không xóa dữ liệu lịch sử. |
| `GET /api/activities/{activityId}/resources/history?page=1&pageSize=50` | **Đã triển khai**; chỉ quản lý hiện tại; phân trang tối đa 100, mới nhất trước. |
| `GET /api/activities/{id}` | **Đã bổ sung projection ở detail**: `resources`, `resourceCapabilities`, `resourceAvailability`. Các trường và policy hiện có được giữ; danh sách hoạt động không tải toàn bộ gallery. |
| `POST /api/activities/{id}/resources/upload-intents` | **CHƯA TRIỂN KHAI upload**. Có phản hồi `501 RESOURCE_UPLOAD_NOT_IMPLEMENTED` sau kiểm tra quyền; đây không phải operation hoàn thành, không phát URL tải lên/receipt. |
| `GET /api/public/activities/{id}` | **CHƯA TRIỂN KHAI**. `CAMPUS_PUBLIC` yêu cầu tài khoản cùng campus, không đồng nghĩa xem ẩn danh. Chưa bổ sung chính sách xuất bản ẩn danh. |

Mọi route thư viện đều yêu cầu JWT và quyền từ nguồn hiện tại: tài khoản active/unlocked, CLB active, campus, membership và management. Quyền được kiểm tra trước cả khi phát lại kết quả idempotent. Quản lý CLB A không sửa hoạt động B; resource ID phải thuộc đúng activity ID. Hoạt động draft chỉ quản lý hoặc reviewer có phạm vi được đọc; hoạt động hủy giữ lịch sử đọc và chặn thay đổi mới.

Hiện chưa cấp thêm quyền CONTENT/event specialist từ nhóm governance mới. Report BQL không cấp quyền. Quản lý hiện tại dùng nguồn quyền đã có; cutover governance vẫn là phần riêng chưa hoàn thành.

### Request/response cho FE

Tạo, sửa và gỡ bắt buộc header `Idempotency-Key` (1–100 ký tự ASCII có thể in, không khoảng trắng). Gửi lại cùng key/body trả đúng receipt; cùng key khác body trả `409 IDEMPOTENCY_KEY_REUSED`. Mỗi operation có phạm vi actor + HTTP method/path. Quyền bị thu hồi vẫn bị từ chối khi gửi lại.

```http
POST /api/activities/123/resources
Content-Type: application/json
Idempotency-Key: draft-link-123

{"kind":"EMBED","title":"Tài liệu workshop","visibility":"CLUB","url":"https://docs.google.com/document/d/example/edit"}
```

`visibility` bỏ qua mặc định `CLUB`; giá trị hợp lệ là `PUBLIC`/`CLUB`. `kind` phải là `EMBED`; không nhận `uploadIntentId` cho liên kết. `position` có thể bỏ qua để thêm cuối, hoặc số nguyên 0–9999. Tối đa 100 tài nguyên đang gắn trong một hoạt động, sắp xếp theo position rồi ID. Tiêu đề 1–160 ký tự sau trim, không chứa control characters; URL tối đa 2000 ký tự. Body JSON tối đa 256 KiB, không nhận field lạ, field trùng kể cả khác hoa/thường, key lưu trữ, iframe HTML hay blob URL.

Response tạo là `201`, có `id` GUID ổn định, `version` GUID, `kind`, `title`, `visibility`, `url`, `provider`, `position`, `createdAtUtc`, `updatedAtUtc`. `uploadedByUserId` chỉ có trong projection dành cho quản lý. Gallery trả:

```json
{"items":[],"availability":"AVAILABLE","resourceCapabilities":{"canManage":true,"canUpload":false,"supportedKinds":["EMBED"],"uploadStatus":"NOT_IMPLEMENTED"}}
```

FE chỉ bật lưu liên kết khi `canManage=true` và có `EMBED` trong `supportedKinds`; **không bật upload tệp** vì `canUpload=false`. Có `canManage` không có nghĩa đã hỗ trợ mọi kind. Gallery rỗng với `AVAILABLE` là kết quả có thẩm quyền, khác với không xác minh được nguồn.

Detail trả `resourceAvailability:"AVAILABLE"` sau xác minh nguồn. Khi nguồn quyền không sẵn sàng, trả `resources:null`, capabilities false và `AUTHORITY_UNAVAILABLE`; khi bị từ chối quyền tài nguyên thì `ACCESS_DENIED`. Endpoint gallery riêng trả lỗi 403/503 tương ứng, không giả mảng rỗng. Endpoint activity detail vẫn dùng chính sách đọc activity hiện tại; chưa mở rộng nó cho campus nonmember. Người chỉ xem cùng campus dùng route discovery hiện có và gallery read có phạm vi nêu trên.

```http
PATCH /api/activities/123/resources/RESOURCE_GUID
Idempotency-Key: edit-resource-123
Content-Type: application/json

{"expectedVersion":"CURRENT_VERSION_GUID","title":"Tiêu đề mới","position":2}
```

Trường bỏ qua giữ nguyên; `null` bị từ chối cho title/visibility/position. Không sửa URL/kind qua PATCH; tạo liên kết mới rồi gỡ liên kết cũ. Version sai trả `409 STALE_RESOURCE`; CAS và transaction bảo vệ hai người sửa cùng lúc. Thứ tự trùng hợp lệ và luôn có ID làm khóa phụ ổn định.

```http
DELETE /api/activities/123/resources/RESOURCE_GUID
Idempotency-Key: detach-resource-123
Content-Type: application/json

{"expectedVersion":"CURRENT_VERSION_GUID","reason":"Thay tài liệu cập nhật"}
```

Lý do 1–500 ký tự sau trim. Gỡ trả 200 với id/version/detachedAtUtc; tài nguyên không còn trong gallery nhưng audit CREATE/UPDATE/DETACH và snapshot trước/sau còn nguyên. Resource audit chỉ append, DbContext từ chối sửa/xóa. Mutation, audit và idempotency receipt cùng transaction; payload không hợp lệ không để lại thay đổi dở dang. Kiểm tra trạng thái hủy được thực hiện lại trong transaction.

### Liên kết và quyền riêng tư

Chỉ HTTPS, cổng 443, không credentials, không IP literal và chỉ hostname chính xác trong danh sách hỗ trợ. Hiện có YouTube (`youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`, `youtube-nocookie.com`, `www.youtube-nocookie.com`) cùng các liên kết external `docs.google.com`, `drive.google.com`, `forms.gle`, `onedrive.live.com`, `1drv.ms`, `github.com`, `www.figma.com`, `www.canva.com`. Chưa hỗ trợ host khác/subdomain tự do; thêm provider phải cập nhật policy và kiểm thử, không dùng wildcard.

YouTube phải có video ID hợp lệ 11 ký tự và định dạng watch/embed/shorts hoặc youtu.be; lưu URL chuẩn `https://www.youtube-nocookie.com/embed/{videoId}`, bỏ tham số autoplay/tracking. BE không tải URL từ xa, không tạo thumbnail/preview bằng việc fetch URL bất kỳ. `provider:EXTERNAL` mở như liên kết, không có HTML nhúng. FE chỉ bật player YouTube khi người dùng yêu cầu xem theo contract.

`PUBLIC` ở tài nguyên chỉ là phạm vi trong activity mà người gọi được phép đọc; chưa có route ẩn danh. `CLUB` URL không trả cho người ngoài CLB, kể cả campus visitor/reviewer chỉ có quyền xem PUBLIC. Nó không thay ACL của Google Drive/nhà cung cấp ngoài: chủ CLB vẫn phải cấu hình quyền truy cập tại nguồn; chưa có private file delivery do BE quản lý. API không nhận tài liệu riêng để gửi đến dịch vụ preview bên thứ ba.

<a id="workspace"></a>

## Shared workspace semester catalog

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md).

#### Chọn học kỳ và policy

Workspace catalog trả `{clubId,items,currentAvailability,asOf,timezone,startInclusive,endInclusive}`. Mỗi item có `id`/`semesterKey` là GUID, `code`/`semesterId`/`invitationCode` là code Admin, label, ngày UTC, isCurrent, editable, canInvite và availability.

Admin là một nguồn duy nhất. Không đoán năm/term/kỳ báo cáo từ code, kể cả code có dạng quen thuộc. Alias tùy chọn đặt tại `Workspace:SemesterAliases:<Semester.Id>:Year`, `Term` (`SP|SU|FA`) và `ReportPeriod`. Không có cấu hình thì trả null và `PARTIAL_OR_UNCONFIGURED`.

Muốn `editable:true`, cần đúng một kỳ active và cấu hình `EditableFromUtc`/`EditableUntilUtc` dưới cùng alias; cửa sổ phải nằm trong ngày của học kỳ và thời điểm gọi nằm trong `[from,until)`. Đây là metadata cửa sổ chung; endpoint ghi từng nghiệp vụ vẫn phải kiểm tra quyền/quy tắc riêng. Thành viên chỉ đọc có editable=false. Nhiều kỳ active trả `currentAvailability:"AMBIGUOUS"`, không tự chọn một kỳ.

`startUtc`/`endUtc` là các mốc Admin được chuyển sang UTC; metadata biên học kỳ hiện là inclusive. Không cấu hình giả ngày hay kỳ báo cáo. Report-period alias không tự thêm semester attribution cho Finance, không tạo governance authority và không reset thành viên/điểm.

Policy read yêu cầu `semesterId` code/GUID; response echo code chuẩn và semesterKey, `items:[{policy,effectiveAt}]`. Không có policy phù hợp trả `availability:"NO_APPROVED_POLICY"`; nguồn Admin hỏng/mất kết nối trả 503, không giả danh sách hợp lệ.

<a id="membership"></a>

## Rút đơn, nộp lại và metadata nguồn

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md).

#### Rút đơn và nộp lại

Đơn mới tự nộp có source APPLICATION; lời mời mới có source INVITATION. Dữ liệu cũ được migration gán UNKNOWN vì không đủ bằng chứng xác định nguồn; không suy luận chỉ từ cờ consent. `canWithdraw` chỉ true ở response của chính người nộp, source APPLICATION, Pending, chưa lưu trữ. Response quản lý không cấp capability tự rút đơn người khác.

Rút đơn POST không có body, hỗ trợ Idempotency-Key tùy chọn. Response 200 `{applicationId,clubId,status:"WITHDRAWN",version,canWithdraw:false,withdrawnAt}`. Rút lại đơn đã rút trả cùng kết quả; approved/rejected/removed/invitation/UNKNOWN trả 409. Người khác và ID không tồn tại trả 404. Quản lý DELETE vẫn là thao tác quản lý riêng.

Nộp lại tạo ID mới. Hồ sơ trước, câu trả lời và người/thời điểm xét duyệt được giữ lại; mỗi hồ sơ trả version hiện tại riêng, `previousApplicationId` liên kết chuỗi lần nộp. Version là token đồng bộ của bản ghi, không phải số revision nghiệp vụ. Unique index chỉ áp dụng bản ghi chưa lưu trữ, vẫn ngăn hai membership/đơn hiện hành. Lời mời đã đồng ý vẫn Pending cho đến khi quản lý duyệt; không auto-enroll. Đơn Pending cũ có source UNKNOWN chưa được phép tự rút cho đến khi có căn cứ phân loại nguồn.

<a id="existing"></a>

## Projection nguồn và các bản sửa tương thích

[Source BE chi tiết](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md).


- F01: `GET /api/clubs/{id}` cho manager và own managed list có cùng version/coverImageUrl/schedule; dùng version từ HTTP để lưu tiếp.
- F02: `PUT /api/clubs/{id}/public-images` phân biệt bỏ trường với null. Gửi riêng logo không xóa cover; null xóa đúng trường. Có owner/kind verification và CAS.
- F03: roster-backed invitation đã có revalidation/outbox; không dùng userId/fullName client làm bằng chứng identity.
- F05: sinh viên đã đăng ký dùng `GET /api/v2/activities/{activityId}/sessions` cho nguồn session phù hợp campus/visibility; không gọi management sessions để đọc nguồn public/student. Projection này không bảo đảm mọi submission sẽ được chấp nhận; authority ghi vẫn kiểm tra lại evidence/duplicate/policy.
- F06: memberships và own application history có source/capability/version/code/logo/reapply. Legacy thiếu căn cứ giữ UNKNOWN, không tự suy từ consent để bật withdraw.
- F04: cơ chế action-final-report scoring chưa chốt, không được đánh hoàn thành bởi việc có handler vận hành.

Các route ledger/contribution/quest/QR cũ giữ cơ chế hiện có, không bị xóa bởi trạng thái điểm mới deferred. Không dùng chúng để tự tạo thưởng cho action mới hoặc thay credit/wallet.

<a id="decisions"></a>

## Quyết định đang mở, optional và nghiệm thu


| Phần | Quyết định hiện tại |
| --- | --- |
| Tính điểm mới | TẠM HOÃN theo chủ dự án: approver cuối, công thức/caps/+1/rollover/reversal/final report/budget/credit chưa chốt. Không xóa spec, không fake số. |
| Roster identity | ĐÃ CHỐT: email trường, account Auth sẵn có; không tự tạo account khi import. |
| Governance | Terms/groups/union/expiry/history/report/nominations và quyền xuyên service chưa xong. Chuyển thủ quỹ legacy sang kỳ đang chờ chọn chính sách; không tự kế thừa hoặc mở OR grant cũ/mới. |
| Resource files/public transport | Chưa triển khai DOCUMENT/MEDIA/private download/scan/quarantine/cleanup hoặc public activity anonymous. canUpload=false, chỉ supportedKinds=EMBED. |
| Official academic fields | major/year null NO_AUTHORITATIVE_SOURCE; không biến dữ liệu tự khai/localStorage thành học vụ chính thức. |
| Cosmetics/shape | Inventory/equip/layout/application-logo/club-shape chưa xong; policy định dạng asset Q04 chưa chốt. |
| Optional | Public directory, pins, custom forms, physical fulfillment, contest, office succession giữ BỎ QUA/optional/cần đặc tả. Không xóa code/tài liệu, không tính như đã hoàn thành. |
| Live/FE | Chưa nghiệm thu adapter/browser/storage/delivery/deploy/shared migrations. 914 test là proof BE đã chạy tại commit đã pin, không phải proof các màn hình FE đã chuyển consumer. |
