# Đề xuất BQL CLB theo học kỳ và phân quyền theo group

Implement Status: Not Yet

Status Scope: Backend implementation of retained product decisions

Source Review: 2026-10-19; backend b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf, fetched current branch and origin/main equal HEAD. Source audit only; live acceptance and service tests unverified.

Source Evidence: Retained product decisions remain useful; full governance/office/group history is still missing. Existing verified-experience assignments do not implement these decisions.

## Current reconciliation — 2026-10-19

Retained product decisions remain useful; full governance/office/group history is still missing. Existing verified-experience assignments do not implement these decisions.

The specification below preserves its original proposed scope. Older dated route-absence and local-only statements are historical where superseded above; use the current lifecycle/index before implementation. Remaining obligations keep this contract Not Yet.


Ngày nghiên cứu/cập nhật: 2026-10-12. Trạng thái: **đã có bản chạy thử UI development**, backend chưa triển khai. [Contract API cho đợt BE](club-governance-groups-api.md) sở hữu endpoint/DTO; tài liệu này giữ quyết định nghiệp vụ và hướng UI. [Audit vòng đời contract](contract-lifecycle-audit.md) ghi nhận contract thay thế.

## 1. Yêu cầu và kết luận

- Tách tư cách thành viên CLB khỏi phân công trong ban quản lý (BQL).
- Mỗi CLB lập/nộp một hồ sơ BQL theo học kỳ; tra cứu được các kỳ và các lần điều chỉnh.
- BQL gồm nhiều group; sử dụng các role hiện tại làm mẫu tạo group.
- Trong màn hình Thành viên CLB, có `+ Tạo group`, chọn quyền và thêm người từ thành viên đã được duyệt.
- Mọi thay đổi phân công/quyền trong kỳ phải lưu lịch sử: promote, thêm group kiêm nhiệm, luân chuyển group, demote và thu hồi. Lịch sử phát sinh tại lúc thay đổi được áp dụng, không phụ thuộc việc nộp báo cáo.

Đề xuất dùng **group phân quyền trong phạm vi CLB + cơ cấu BQL theo kỳ có phiên bản + báo cáo BQL là snapshot độc lập**. Quyền hiệu lực phụ thuộc phân công đang hiệu lực, CLB, thời gian, tư cách thành viên và ràng buộc nghiệp vụ. Không suy quyền từ tên group hoặc global auth role.

Đã xác nhận từ người dùng: nộp BQL theo kỳ chỉ phục vụ báo cáo; CTSV chỉ duyệt các role quan trọng như Chủ nhiệm/Phó chủ nhiệm; một người có thể thuộc nhiều group và cộng quyền. Danh sách role quan trọng ban đầu gồm Chủ nhiệm/Phó chủ nhiệm; nếu mở rộng phải có quyết định nghiệp vụ riêng.

Đề xuất thời điểm áp dụng: thay đổi group chuyên môn có hiệu lực ngay sau thao tác lưu đã được backend kiểm tra; không chờ nộp báo cáo. Đây là lựa chọn triển khai để tách báo cáo khỏi vận hành, không phải phát biểu nguyên văn của người dùng.

## 2. Hiện trạng đã kiểm tra từ source local

FE HEAD: `4431029ec1d2c7016ab38379bbec0a45ec46378c`. API local HEAD: `80818266f617bd5144ab1b1a6cd0e74983983a4d`. Không fetch remote hoặc kiểm tra hệ thống đang chạy trong đợt này.

| Nguồn | Hiện trạng / hệ quả |
| --- | --- |
| `src/pages/v2/club-workspace-page/tabs/members/MemberManagement.jsx` | Màn thành viên/đơn và tab BQL chạy thử development; role trên từng dòng là nhãn chỉ đọc. Đã bỏ dropdown và mutation đổi role trực tiếp trong tab này. |
| `members/club-member-roles.js` | Có Chủ nhiệm, Phó chủ nhiệm, Content, Event, HR, Thư ký, Thủ quỹ, Thành viên. Ma trận mô tả không dùng để authorize. Đợt UI này đã sửa SECRETARY chỉ báo cáo, EVENT chỉ staff/đơn để khớp mô tả; quyền thực tế vẫn do BE. |
| `ClubWorkspacePage.jsx`, `my-clubs-data.js`, `src/auth/permissions.js` | Workspace chia MANAGER/MEMBER; nhiều chức năng dựa trên manager/treasurer. Phải mở rộng projection và kiểm tra từng action cho specialist. |
| API `ClubMembership`, `ClubMemberRoleRules` | Role thành viên/thủ quỹ; chủ nhiệm suy từ active manager assignment. Tối đa hai thủ quỹ; chủ nhiệm không kiêm thủ quỹ. |
| API `ClubManagerAssignment` | Đã có thời điểm bổ nhiệm/kết thúc chủ nhiệm; chưa có hồ sơ group BQL theo kỳ trong các model/contract đã xem. Giữ quy trình chuyển giao chủ nhiệm riêng. |
| API `FinanceExtensions`, `ReportExtensions` | Policy hiện dùng CanManage/CanManageFinance; danh sách thủ quỹ còn liên quan quy trình báo cáo sự kiện. Cần sửa đồng bộ policy/projection/recipient, không chỉ FE. |
| API `Semester`, `SemesterEndpoints` | Có bảng học kỳ AdminService; routes đã xem yêu cầu BackofficeUser. Cần projection học kỳ an toàn cho người dùng CLB; không tạo bảng học kỳ thứ hai hoặc dùng lịch localStorage làm nguồn production. |

Giới hạn nghiên cứu: runner `.gitnexus/run.cjs` không có trong checkout API và không có tool GitNexus trong phiên. Đã thử query nhưng nhận MODULE_NOT_FOUND. Các kết luận trên dựa trên đọc source/contract, chưa xác nhận đồ thị callers hoặc index freshness; trước khi sửa API cần khôi phục công cụ và chạy impact theo AGENTS.md của API.

## 3. Mô hình nghiệp vụ

Tất cả người trong BQL vẫn là thành viên CLB. “Thành viên thường” là thành viên đã duyệt không có phân công BQL đang hiệu lực. Trong UI, tách `Thành viên thường` và `Ban quản lý`; vẫn có bộ lọc `Tất cả thành viên` để quản trị roster và xem tổng số không bị đếm trùng.

Cơ cấu BQL được định danh bởi `(clubId, semesterId)`; mỗi cơ cấu có nhiều revision, tối đa một revision hiệu lực. Hồ sơ báo cáo có các bản nộp riêng, mỗi bản chụp một revision và ghi thời điểm chụp. Kỳ trước vẫn lưu dữ liệu nhưng không tự cấp quyền chuyên môn cho kỳ mới. Sao chép kỳ trước tạo bản cấu hình chưa áp dụng, cần xác nhận lại người còn đủ điều kiện. Thời hạn bổ nhiệm lãnh đạo tuân theo quyết định CTSV; không tự kết thúc hoặc gia hạn quyết định đó chỉ vì thao tác nộp báo cáo hay sao chép kỳ.

Group gồm tên, mô tả, mã preset tùy chọn, tập permission code và danh sách phân công. Preset ban đầu: Chủ nhiệm, Phó chủ nhiệm, Content, Event, Nhân sự, Thư ký, Thủ quỹ. MEMBER là tư cách nền, không phải group BQL.

Chủ nhiệm và Phó chủ nhiệm là vị trí hệ thống được bảo vệ. Group tương ứng hiển thị người có bổ nhiệm đã được CTSV duyệt; thêm người vào các vị trí này tạo yêu cầu bổ nhiệm/chuyển giao riêng, không cấp quyền lãnh đạo ngay. Group editor không được tự chỉnh phạm vi quyền lãnh đạo, đổi duty chuyên môn thành lãnh đạo hoặc xóa phân công lãnh đạo có hiệu lực. Báo cáo chỉ thể hiện lãnh đạo thực tế; thay đổi báo cáo không tạo bổ nhiệm. Với dữ liệu cũ, phải đối chiếu active manager có membership hợp lệ; không tự tạo membership Approved chỉ để migration chạy.

Đã chốt nhiều group/người: cộng các quyền cho phép, sau đó áp dụng ràng buộc nghiệp vụ. Không triển khai deny override hoặc quyền ngoại lệ riêng từng người ở phiên bản đầu. Tham gia nhiều group không bỏ qua điều kiện chủ nhiệm/thủ quỹ hoặc quyền duyệt của CTSV.

## 4. Luồng nộp và lịch sử

Tách ba luồng:

1. **Vận hành group chuyên môn:** tạo/sửa group → chọn quyền/thêm người → xem thay đổi → `Lưu thay đổi` → backend kiểm tra và tạo revision hiệu lực mới. Bản cũ trở thành lịch sử; có audit actor/thời điểm/lý do. Form chưa lưu không cấp quyền. Không có bước CTSV duyệt toàn bộ cơ cấu.
2. **Bổ nhiệm lãnh đạo:** CLB đề nghị Chủ nhiệm/Phó chủ nhiệm → `PendingApproval` → CTSV duyệt hoặc từ chối → bổ nhiệm có hiệu lực trong thời hạn được duyệt. Quyền lãnh đạo chỉ được cấp sau duyệt và đến thời điểm hiệu lực. Yêu cầu đang chờ được hiển thị riêng, không trộn vào danh sách BQL hiệu lực. Với chủ nhiệm, tái sử dụng quy trình chuyển giao hiện có.
3. **Báo cáo theo kỳ:** xem cơ cấu hiệu lực → chuẩn bị bản báo cáo → nộp → lưu snapshot `Submitted` bất biến. Không có trạng thái chờ CTSV duyệt toàn bộ báo cáo và không kích hoạt/thu hồi quyền qua thao tác nộp. Báo cáo ghi các yêu cầu lãnh đạo chờ duyệt ở phần riêng nếu cần, không trình bày là bổ nhiệm đã có hiệu lực.

Một hồ sơ báo cáo/kỳ có nhiều bản nộp bổ sung, đánh số phiên bản và ghi lý do; không ghi đè bản đã nộp. Sau khi CLB đổi group/người/quyền, quyền mới áp dụng theo luồng vận hành, còn báo cáo cũ giữ nguyên. UI hiển thị `Có thay đổi chưa cập nhật vào báo cáo` và cho nộp bổ sung từ revision hiện tại. Backend giữ sourceRevisionId/version để bảo đảm nội dung xem trước và snapshot nộp khớp; nếu cơ cấu đổi trong lúc xem trước, trả conflict để tải lại.

Thu hồi khẩn cấp / thành viên rời CLB: từ chối quyền ngay, ghi audit riêng; không chờ lần nộp tiếp theo và không sửa snapshot cũ. Lịch sử cho biết người đó từng được phân công nhưng quyền hiện tại đã bị thu hồi.

Việc đổi chủ nhiệm trong khi có yêu cầu bổ nhiệm khác đang chờ cần kiểm tra lại actor, thẩm quyền và phiên bản khi CTSV quyết định. Báo cáo đã nộp vẫn giữ thông tin đúng tại thời điểm chụp, không bị đổi hoặc trả lại tự động vì cơ cấu hôm nay khác.

### 4.1. Lịch sử thay đổi trong kỳ — yêu cầu đã xác nhận

Mỗi lần thay đổi thành công phải tạo sự kiện lịch sử bền vững cùng transaction với thay đổi phân công/quyền. Không chỉ lưu role hiện tại hoặc diff giữa các lần nộp báo cáo; phải truy được cả chuỗi thay đổi giữa hai lần nộp.

Ví dụ một thành viên trong cùng kỳ:

| Lần thay đổi | Trước | Sau | Sự kiện lịch sử |
| --- | --- | --- | --- |
| Promote | Thành viên thường | Group Content | Thêm phân công Content và quyền tương ứng |
| Luân chuyển | Content | Event | Kết thúc phân công Content, bắt đầu Event trong cùng một thao tác |
| Demote | Event | Thành viên thường | Kết thúc phân công Event; giữ tư cách thành viên CLB |

Do cho phép nhiều group, `Thêm vào group` và `Luân chuyển` phải là hai thao tác có ý nghĩa khác nhau: thêm Event khi đang ở Content giữ cả hai; luân chuyển Content → Event chỉ kết thúc Content và thêm Event, giữ nguyên những group khác. Gỡ một group chỉ làm mất quyền không còn được group khác cấp. Chỉ gọi là trở về thành viên thường khi không còn phân công BQL hiệu lực. Luân chuyển phải atomic, không tạo trạng thái mới dở dang nếu bước thêm group đích thất bại.

Sự kiện gồm: eventId/changeSetId, clubId, semesterId, membershipId/userId bị tác động, loại thay đổi, group/duty trước và sau (ID ổn định + tên tại thời điểm đó), tập group/quyền hiệu lực trước và sau, actor, occurredAtUtc, effectiveAtUtc, lý do, revision trước/sau; liên kết quyết định CTSV nếu là lãnh đạo. recorded time và effective time được phân biệt để truy chính xác thời gian giữ nhiệm vụ. Thời gian hiển thị theo Asia/Saigon.

Lưu cả thay đổi group/quyền ảnh hưởng nhiều người: sửa permission, đổi tên, giải thể group, hết hạn kỳ, thu hồi, thành viên rời CLB. Một lần sửa group tạo changeSet chung và lưu ảnh hưởng từng thành viên để timeline cá nhân vẫn giải thích được vì sao quyền thay đổi dù người đó không đổi group. Khi tác nhân là hệ thống, ghi actorType/reason rõ thay vì gán giả người thao tác. Các thay đổi có hiệu lực bởi quyết định lãnh đạo được ghi ngay khi kích hoạt/thu hồi, không chỉ lúc gửi yêu cầu.

Assignment có khoảng hiệu lực `[effectiveFrom, effectiveUntil)`; gỡ/chuyển group đóng khoảng cũ thay vì xóa dấu vết. Sự kiện lịch sử chỉ thêm mới; sửa sai bằng một thay đổi tiếp theo, không sửa/xóa sự kiện đã ghi. Retry/idempotency không tạo sự kiện trùng; thao tác thất bại không tạo lịch sử phân công thành công. Đối với expiry dự kiến, backend từ chối quyền đúng thời điểm hết hạn ngay cả khi worker ghi sự kiện chạy trễ; sự kiện vẫn ghi effectiveAt là thời điểm hết hạn thực tế.

UI có `Lịch sử phân công` trong chi tiết thành viên: timeline theo kỳ/ngày/loại thay đổi, khoảng thời gian ở mỗi group, actor, lý do, quyền tăng/giảm. `Lịch sử BQL` có bộ lọc thành viên/group; lịch sử nộp báo cáo hiển thị riêng. Có thể xem cơ cấu/quyền tại một thời điểm từ revision + assignment interval + sự kiện policy; lịch sử không làm sống lại quyền cũ.

## 5. UI tại màn hình hiện tại

- Giữ màn `Thành viên CLB`; chia màn con `Thành viên`, `Ban quản lý`, `Đơn tham gia`.
- `Thành viên`: lọc tất cả/thành viên thường/BQL; badge các group hiệu lực thay dropdown một role. Đơn tham gia và lời mời giữ quy trình riêng.
- `Ban quản lý`: mở thẳng card group; chỉ giữ một thanh tab chính của màn Thành viên CLB. Bỏ tiêu đề/thống kê lớn và thanh tab lồng bên trong. Hàng điều khiển gọn gồm chọn học kỳ, `Lịch sử`, `Báo cáo theo kỳ`, `+ Tạo group`; lịch sử/báo cáo mở modal riêng, không chồng modal. Đã bỏ mục Thành viên thường/Thành viên chưa phân công bên trong BQL; action bổ nhiệm nằm tại card lãnh đạo. Trạng thái/revision báo cáo hiện trong panel báo cáo. Sao chép kỳ trước vẫn là khả năng BE/UI tiếp theo, chưa có action trong prototype.
- Hiển thị group dạng danh sách/card: tên, số người, tóm tắt quyền, `+ Thêm người`, menu sửa/xóa. Chủ nhiệm/Phó chủ nhiệm được đánh dấu bảo vệ và có action `Đề nghị bổ nhiệm` với trạng thái CTSV duyệt riêng.
- Modal tạo/sửa group: tên, mô tả, chọn mẫu role hiện tại, checkbox quyền theo mảng nghiệp vụ. Có mô tả quyền và lý do quyền bị khóa. Chọn mẫu chỉ điền mặc định; tên group không quyết định quyền.
- Modal thêm người: tìm kiếm phân trang trên roster đã duyệt của CLB, chọn nhiều; thể hiện group khác và các xung đột. Không dùng danh sách user toàn hệ thống hoặc chỉ tìm trong trang thành viên đã tải.
- Modal chuyên môn phân biệt `Lưu thay đổi` (áp dụng quyền) và `Hủy`; bản cấu hình chưa lưu/chưa áp dụng có nhãn rõ. Form báo cáo nháp không chỉnh quyền.
- Trước lưu group: hiển thị diff người/quyền và lỗi membership/giới hạn; trước nộp báo cáo: hiển thị snapshot và thay đổi so với báo cáo trước, lãnh đạo đã duyệt/chờ duyệt được phân biệt.
- Lịch sử: lọc kỳ, xem các lần đổi cơ cấu và các bản nộp báo cáo; người thay đổi/nộp, thời điểm hiệu lực, lý do và diff. Lịch sử duyệt lãnh đạo có người duyệt/kết quả riêng. Có lịch sử phân công theo từng người, từng group.
- Kỳ cũ/bản báo cáo đã nộp chỉ đọc. Roster đầy đủ và quyền chi tiết chỉ dành cho người có quyền đọc tương ứng; không tự công khai hồ sơ với số điện thoại/email.

## 6. Permission và quy tắc cấp quyền

Catalog permission do backend quản lý. FE dùng catalog để render checkbox; chỉ cho chọn các quyền mà actor được phép ủy quyền. Tách quyền thực hiện nghiệp vụ và quyền cấp quyền; có một quyền không tự động cho phép trao quyền đó.

| Nhóm | Permission gợi ý (tên đề xuất, chưa có API) |
| --- | --- |
| Quản trị BQL | `club.governance.read`, `.groups.manage`, `.report.submit`; quyền đề nghị/duyệt lãnh đạo riêng, không cho group custom tự cấp |
| Thành viên | `club.members.read`, `.recruit`, `.remove`; không gộp tuyển mới với xóa thành viên |
| Profile CLB | `club.profile.write`, `club.media.write` |
| Sự kiện | `event.content.write`, `event.staff.assign`, `event.registrations.manage` |
| Báo cáo | `club.reports.draft.write`, `.submit`; Thư ký mặc định chỉ draft được giao |
| Tài chính | `club.finance.read`, `.draft.write`, `.submit`; quyền duyệt cuối của CTSV riêng |

Đây là catalog tối thiểu minh họa; phải map từng thao tác ở activities, attendance, quests, contributions, gifts/rewards, points, reports, finance và members trước khi gọi preset Chủ nhiệm/Phó chủ nhiệm là “đầy đủ quyền vận hành CLB”. Không sao chép nguyên ma trận mô tả đang lệch với SECRETARY/EVENT.

Preset Phó chủ nhiệm giữ định hướng full club operations trong contract hiện có, chỉ hiệu lực với bổ nhiệm được CTSV duyệt. Quyền lãnh đạo/quản lý cấp quyền được bảo vệ theo duty đã duyệt; không cho chọn các quyền đó trong group custom hoặc ghép nhiều group chuyên môn để tự nâng lên quyền quản trị BQL. Có quyền submit tài chính theo policy lãnh đạo không tự biến phó chủ nhiệm thành duty thủ quỹ hay người nhận nghiệp vụ dành riêng thủ quỹ. Mapping policy phải phân biệt hai nhánh này.

Group Thủ quỹ gắn một duty code hệ thống `TREASURER` và các quyền tối thiểu cần thiết. Backend giữ tối đa hai người duy nhất có duty này trong CLB tại cùng thời điểm và cấm chủ nhiệm kiêm nhiệm. Group custom xin quyền dành riêng thủ quỹ phải chịu cùng kiểm tra duty/giới hạn; tên khác không lách được policy. Chỉ có quyền xem tài chính không tự biến một người thành thủ quỹ.

Quyền thực tế được backend tính từ phân công trong revision hiệu lực, danh mục cho phép và policy của resource. Kiểm tra CLB, người dùng, trạng thái membership/account, thời gian hiệu lực và ràng buộc trên từng request. Xem dữ liệu kỳ cũ sử dụng quyền đọc hiện tại; từng là BQL không tự cấp quyền đọc dữ liệu nhạy cảm hôm nay. Không có quyền sửa profile cá nhân của người khác, quyền Admin hoặc CTSV thông qua group CLB.

Revocation phải được kiểm tra ở backend tại thao tác nhạy cảm; cache access có version và invalidation/outbox. Không dùng JWT chứa quyền group cố định lâu dài hoặc localStorage làm nguồn cấp quyền. Frontend cập nhật rail/tab/action theo capability; không bật toàn bộ manager UI cho bất kỳ ai thuộc BQL.

## 7. Dữ liệu và API đề xuất

Trong ClubService: `GovernanceTerm` (clubId, semesterId); `GovernanceRevision` (revisionNo, trạng thái cấu hình/hiệu lực, version, actor/timestamp, lý do, effectiveFrom/Until); `GovernanceGroup` và `GroupPermission` thuộc revision; `GroupAssignment` trỏ membership/user; `GovernanceAuditEvent`. Giữ mã group ổn định qua revision để diff và truy lịch sử, nhưng tạo dữ liệu revision độc lập. Thêm `GovernanceReportSubmission` (submissionNo, sourceRevisionId, snapshot, actor/timestamp, lý do bổ sung) và `LeadershipNomination`/quyết định bổ nhiệm riêng; Chủ nhiệm tái sử dụng mô hình bổ nhiệm/chuyển giao hiện có.

`GovernanceAuditEvent` là lịch sử nghiệp vụ persisted theo schema mục 4.1, không chỉ application log. Assignment lưu khoảng hiệu lực; sự kiện có changeSet và affected-member projection để truy timeline theo người/group/kỳ, kể cả người đã bị gỡ group hoặc membership đã xóa mềm. Chỉ mục đề xuất `(clubId, semesterId, membershipId, effectiveAtUtc, eventId)` và `(clubId, semesterId, groupId, effectiveAtUtc, eventId)`; timestamp bằng nhau vẫn có thứ tự ổn định theo revision/sequence.

Snapshot nộp lưu tên group, permission code và phiên bản catalog, danh tính/thông tin hiển thị tối thiểu của người, duty, trạng thái và thời gian tại lúc nộp. Rename group, thay preset/catalog, xóa mềm membership sau này không đổi lịch sử. Quyền bị hệ thống rút khỏi catalog không còn có hiệu lực, dù snapshot cũ vẫn ghi nhận quyền từng được nộp. Phiên bản policy cần có audit để giải thích quyền tại một thời điểm.

Ràng buộc: unique cơ cấu `(clubId, semesterId)`, revisionNo, assignment `(revisionId, groupId, membershipId)`; một revision hiệu lực trên cơ cấu và không có khoảng hiệu lực cơ cấu BQL chồng nhau trong CLB; unique submissionNo trên hồ sơ báo cáo/kỳ. Lưu/áp dụng group, duyệt bổ nhiệm và nộp snapshot dùng transaction/concurrency. Khi áp dụng hoặc duyệt kiểm tra roster/chủ nhiệm/giới hạn; khi nộp báo cáo kiểm tra revision xem trước khớp snapshot. Những ngày kỳ chưa cấu hình phải báo thiếu cấu hình, không tự đoán từ ngày máy hoặc mã kỳ. Bổ nhiệm lãnh đạo có thời hạn riêng theo quyết định CTSV; projection theo kỳ lấy các bổ nhiệm có khoảng hiệu lực giao với kỳ tương ứng.

API/DTO canonical nằm trong [club-governance-groups-api.md](club-governance-groups-api.md), **chưa tồn tại và chưa wire vào FE**. Dùng group create/update/archive, command ADD/REMOVE/TRANSFER atomic, history/revision, report submission và CTSV vice nomination. Đã bỏ phác thảo endpoint ban đầu, gồm PUT toàn cấu hình, để không có hai writer/contract cạnh tranh. Chủ nhiệm tái sử dụng ownership-transfer hiện có. Mở rộng current-user access projection/capabilities; giữ facade duy nhất `src/services/api.js`.

Response lỗi theo [api-contract-conventions.md](api-contract-conventions.md): thiếu quyền/phạm vi, membership không hợp lệ, stale version, xung đột duty/giới hạn, trạng thái không cho sửa, kỳ chưa cấu hình. Server không nhận actor/reviewer/effective capability trực tiếp từ payload client làm nguồn tin cậy.

## 8. Trình tự triển khai và kiểm chứng

1. Theo quyết định đã chốt: báo cáo không duyệt toàn bộ, CTSV duyệt Chủ nhiệm/Phó chủ nhiệm, cho phép nhiều group. Thống nhất ma trận preset, thao tác lưu áp dụng ngay, thời hạn chuyên môn theo kỳ/bổ nhiệm lãnh đạo và giới hạn duty.
2. BE persistence và semester projection; revision/audit vận hành; snapshot báo cáo riêng; bổ nhiệm/duyệt lãnh đạo riêng; giải quyết dữ liệu chủ nhiệm/treasurer hiện có. Dữ liệu cũ thiếu kỳ ghi rõ legacy, không bịa hồ sơ đã nộp hoặc quyết định đã duyệt.
3. BE policy/capability cho ClubService và các service tiêu thụ access, gồm recipient/treasurer của report-finance; bảo đảm thu hồi và giới hạn duty đồng bộ. Khi cutover, nguồn quyền governance thay legacy; không OR quyền cũ để giữ quyền đã bị thu hồi.
4. FE mở rộng api/access projection; tách `ClubGovernancePanel`, `GovernanceGroupCard`, `GroupEditorModal`, `GroupMemberPickerModal`, `GovernanceSubmitModal`, `GovernanceHistoryPanel` dưới `tabs/members/`. Route page chỉ giữ frame/routing/access.
5. Nếu BE chưa sẵn sàng, prototype có nhãn bản xem thử và không cấp quyền thật; không gọi endpoint cũ assignTreasurer khi form group chưa được lưu qua workflow cấu hình mới.
6. Kiểm tra: tạo Thủ quỹ → chọn quyền → thêm người → lưu → đúng quyền sau reload mà không cần nộp/duyệt báo cáo; nộp báo cáo không đổi quyền; sửa giữa kỳ giữ snapshot báo cáo cũ và hiện trạng thái chưa cập nhật; lãnh đạo pending không có quyền, CTSV duyệt mới hiệu lực; custom group/ghép group không tự cấp quyền lãnh đạo; nhiều group cộng quyền nhưng không vượt duty limit; kỳ trước không cấp quyền chuyên môn kỳ mới; sao chép lọc người không hợp lệ; revoke hiệu lực ngay; người ngoài CLB/tự nâng quyền bị từ chối; group đổi tên không né limit; save/approve cạnh tranh không sinh hai bản active; submit không chụp nhầm revision; specialist chỉ thấy/được gọi đúng action; chức năng báo cáo/tài chính hiện có không mất ràng buộc.
7. Kiểm tra lịch sử: trong cùng kỳ promote thành viên → Content → luân chuyển Event → demote về thành viên thường vẫn có đủ ba sự kiện/khoảng hiệu lực sau reload và sau các lần nộp báo cáo; thêm group kiêm nhiệm khác với luân chuyển; gỡ một group giữ quyền do group khác cấp; đổi quyền group tạo lịch sử ảnh hưởng từng người; đổi tên/xóa mềm group không đổi nhãn lịch sử; thao tác luân chuyển rollback không mất group cũ hoặc tạo sự kiện thành công; retry không nhân đôi sự kiện; có thể tra người đã bị demote; expiry/thu hồi ghi thời điểm và actor đúng; người ngoài CLB không đọc được timeline nội bộ.

## 9. Nguồn và phạm vi áp dụng

- [Governance groups contract](club-governance-groups-api.md): thay contract primary role đã bỏ; giữ rule profile cá nhân/chuyển giao chủ nhiệm và nghiệp vụ finance, bổ sung nhiều group và lịch sử trong kỳ.
- [Backend implementation handoff](README.md), mục expanded role/capability: nền tảng tích hợp; chưa đánh dấu hoàn thành.
- [NIST RBAC FAQ](https://csrc.nist.gov/Projects/Role-Based-Access-Control/faqs): tham khảo mô hình gán quyền qua role và ràng buộc duty. Cấu trúc group/kỳ/revision cụ thể là đề xuất cho ClubHub.
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): quyền tối thiểu, mặc định từ chối, kiểm tra từng request và xét quan hệ/thuộc tính resource. Không coi RBAC thuần theo nhãn là đủ cho phạm vi CLB và thời hạn học kỳ.
