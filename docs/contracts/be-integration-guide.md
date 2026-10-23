# Route và DTO BE hiện hành cho người làm FE — 14/10/2026

Implement Status: Done

Status Scope: Documentation: current wire deltas; not completed FE integration

Backend Progress: DOCUMENTATION_SYNCED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#conventions).

**Đã có BE:** Hướng dẫn hiện hành cho các API mới/đổi ở backend-current-integration.md; có đúng loại ID/version, null/omission và trạng thái chưa hỗ trợ.

**Chưa hoàn thành / giới hạn:** Phần 14/10 được giữ dưới lịch sử, không dùng nó để bỏ qua extension mới hoặc nhận mọi version là GUID.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Route và DTO BE hiện hành cho người làm FE — 14/10/2026

Đọc [trạng thái từng API](be-api-status.md) trước khi tích hợp. Đây là shape đã triển khai trong BE; DTO/route đề xuất trong phần lịch sử không được tự coi đã tồn tại. Không cần sửa giao diện để đọc tài liệu này.

Sinh viên đã hoàn thành 32/32 operation; trong mốc 74 operation có 64 COMPLETE và 10 PARTIAL. Contract cập nhật nhãn BE, không đánh dấu màn hình FE đã hoàn thành. [Bàn giao BE Sinh viên](../../../fptu-xperience-clubhub-api/docs/audit/HOAN_THIEN_API_SINH_VIEN_2026-10-13.md) ghi migration, cấu hình policy và kết quả 740/740 test.

## Authentication, ID, lỗi và gửi lại

Browser gọi Gateway theo `VITE_API_BASE_URL`, gửi `Authorization: Bearer <accessToken>` cho tài nguyên được bảo vệ. Không đưa secret nội bộ hoặc signing key QR vào FE. User/club/activity/session/membership ID là integer; contribution/evidence/assignment/upgrade/report/policy ID và version là GUID.

Gửi `Idempotency-Key` cho mutation mới của profile, plan, hoạt động/buổi, QR check-in, contribution, review, upgrade, adjustment, evidence và assignment. Key bắt buộc ở các workflow mới; một số route tương thích như PATCH profile/public-profile và upload intent vẫn cho phép thiếu key. FE nên luôn gửi key. Một hành động mới tạo một key; khi retry cùng hành động giữ nguyên key và payload. Khác payload cùng key trả 409. `expectedVersion` lấy từ response BE, không tự sinh hoặc dùng thời gian browser. 409 thì reload tài nguyên và yêu cầu người dùng xem lại trước khi gửi hành động mới.

Lỗi mới thường là `{code,message}`; không phải handler nào cũng có `traceId/errors`. Cần giữ HTTP status và JSON error. 401 xử lý session, 403 quyền/no-self, 409 version/state/duplicate, 503 dependency/policy/config chưa có. 204 không có JSON body.

Self contributions và declarations `/me` trả `{items,total,totalItems,page,pageSize,totalPages,legacySemesterAssignment}`; declarations `/me` đã đổi từ array sang envelope, FE phải đọc `items`. Ledger/manual dùng `{items,total,page,pageSize,totalPages}`. Member/attendance legacy dùng `totalItems`. Sessions là `{activityId,items,total}`. Không suy tổng điểm/người từ trang đầu. Quest catalog/mine giữ array mặc định có giới hạn; gửi `page/pageSize` để nhận envelope.

## Các khác biệt route phải sửa ở lời gọi FE

| Chức năng | Route thực tế | Body tối thiểu / ghi chú |
| --- | --- | --- |
| Register | `POST /api/auth/internal/register` | `{username,email,password,displayName}`; password 12–128 ký tự; role do server gán. Trả 201 account, không giả đã có session. |
| Login | `POST /api/auth/internal/login` | `{email,password}` → auth envelope hiện có chứa accessToken/refreshToken/user. |
| Self profile | `GET/PATCH /api/users/me/profile` | GET identity hiện có `/api/users/me` không thay canonical profile. PATCH cần key và expectedVersion. |
| Assignment | `GET/POST /api/verification-assignments`, `PATCH /{id}` | Admin; không có alias `/api/verifier-assignments`. |

`/api/auth/register` và `/api/auth/login` vẫn chỉ là proposal cũ. Dev-login chỉ Development/Test; production không dùng email-only login. Không suy account dự án là sinh viên đã được trường xác minh.

Self GET trả `{userId,version,profileSource,identityProvenance,profile:{displayName,about,skills,interests},personal:{phoneNumber},editableFields}`. Khi chưa lưu profile, version là GUID rỗng BE trả về. PATCH mẫu:

```json
{
  "expectedVersion": "<version từ GET>",
  "profile": { "displayName": "Tên hiển thị", "about": "Giới thiệu" },
  "personal": { "phoneNumber": null }
}
```

Chỉ gửi các field trong editableFields. Self profile hiện chưa có avatar/cover write; public media chỉ nhận club-logo/club-cover/activity-cover.

## Hồ sơ và ảnh CLB: phần còn thiếu cần chờ BE

`PATCH /api/clubs/{clubId}/public-profile` nhận public fields `{name,category,description,contactEmail,contactPhone,scheduleLabel,schedule,expectedVersion}` và trả canonical public detail. `schedule` nếu gửi là `{semesterId,weekdays,startTime,endTime,timezone:"Asia/Ho_Chi_Minh",repeatWeekly:true}`; ngày 1–7, giờ HH:mm ở khung 30 phút.

**API-033 và SUP-02 CHƯA HOÀN THIỆN:** manager GET `/api/clubs/{id}` nhận `ClubFullResponse` chưa có version; `ClubPublicDetailResponse` có version nhưng là projection khác. BE phải bổ sung read version cho manager để form lấy expectedVersion lần đầu. Không dùng GUID ngẫu nhiên/GUID rỗng để thử lưu, không chuyển token người khác hoặc bỏ authorization để lách việc này.

Upload ảnh công khai đã có: POST `/api/media/upload-intents` `{kind,ownerId:"<integer dưới dạng string>",contentType,sizeBytes}` →201 `{uploadUrl,publicUrl,key,expiresAt}`. PUT bytes tới uploadUrl với đúng Content-Type, không gửi app token tới storage. Sau đó gắn bằng `PUT /api/clubs/{id}/public-images` `{logoUrl,coverImageUrl,expectedVersion}` hoặc `PUT /api/activities/{id}/cover-image` `{coverImageUrl,expectedVersion}`. Dùng URL canonical trả từ lần gắn; server kiểm tra object và ownership. Cần R2/CORS thật. JPEG/PNG/WebP, tối đa 5 MiB; chưa có kind avatar/student-cover/reward assets.

## Hoạt động và buổi

GET management `/api/activities` và `/{id}` trả ActivityResponse, gồm `version,publicationStatus,semesterId,effortTier,scale,pillarWeights,policyVersion,capacity,registrationOpensAt,registrationClosesAt,eligibility,evidenceRequirements,registeredCount,verifiedAttendanceCount,discoveryVisibility`. Discovery đã có route riêng bên dưới. `discoveryVisibility` mặc định `CLUB_ONLY`, manager có thể chọn `CAMPUS_PUBLIC` khi tạo/cập nhật hoạt động; quyền xem không tự cấp quyền đăng ký.

| Thao tác | Request hiện hành |
| --- | --- |
| Create draft `POST /api/activities` | clubId, clubName, title, description, startTimeUtc/endTimeUtc, location, meetingDays; có thể kèm semesterId/effortTier/scale/pillarWeights/policyVersion/capacity/registrationOpensAt/registrationClosesAt/eligibility/evidenceRequirements. Server resolve tên CLB từ authority. |
| Update/publish/close `PUT /api/activities/{id}` | `{expectedVersion,operation:"UPDATE"/"PUBLISH"/"CLOSE",...fields}`. Chưa có lịch sử mới được sửa blueprint; PUBLISH cần policyVersion đã duyệt đúng kỳ/môi trường. |
| Cancel `DELETE /api/activities/{id}` | Với nguồn mới gửi JSON `{expectedVersion,reason}` và key, không chỉ gửi DELETE rỗng. |
| Complete `PATCH /api/activities/{id}/complete` | `{expectedVersion,reason}` và key; đợi kết thúc và đóng/xử lý các buổi. Không tự cộng điểm. |
| Create sessions `POST /api/activities/{id}/sessions` | `{expectedVersion,attendancePolicy,startAt,endAt,timezone,location?}` cho buổi đơn; hoặc weekdays/startTime/endTime/rangeStartDate/rangeEndDate/excludedDates cho lịch lặp. expectedVersion ở đây là **activity version**. |
| Update session `PATCH /api/activities/{id}/sessions/{sessionId}` | `{expectedVersion,startAt?,endAt?,location?,attendancePolicy?}`; version của session, không phải activity. |
| Close/cancel session | POST `/close` hoặc `/cancel`, `{expectedVersion,reason}`; version session. |

AttendancePolicy: `{mode:"ONSITE"/"ONLINE",opensAt,closesAt,geofence:{latitude,longitude,radiusMeters}?,manualConfirmationEnabled,qrRotationSeconds:30}`. Recurrence timezone là `Asia/Ho_Chi_Minh`, weekdays 1=thứ Hai đến 7=Chủ nhật. Timestamp có offset; ngày lặp YYYY-MM-DD. Session response dùng `startTime/endTime` dù request dùng `startAt/endAt`.

Lifecycle là hai trường: publicationStatus DRAFT/PUBLISHED/CLOSED/COMPLETED/CANCELLED/LEGACY và status Scheduled/Completed/Cancelled. Không gửi LIVE làm status; nếu cần hiển thị đang diễn ra thì dựa thời gian và server clock. Semester lấy từ catalog, không tự suy FA26 từ ngày trên máy người dùng. PolicyVersion là GUID approved policy, khác version benchmark đang sửa. Các route benchmark/policy metadata thuộc Backoffice/Admin; manager không tự gọi `/student-affairs` để cấp quyền. Cần Admin cung cấp cấu hình policy được duyệt cho kỳ.

## Đăng ký, QR và xác nhận thủ công

Registration hiện theo **activity**, không có endpoint register riêng từng session. POST `/api/activities/{id}/participants` gửi `{}` hoặc body tương thích không target người khác; BE lấy user từ principal, kiểm tra capacity/window/eligibility. Registration không phải attendance và không xác nhận role Leader.

Manager GET `/api/activities/{id}/sessions/{sessionId}/attendance-challenge` rồi hiển thị challenge theo serverTime/expiresAt, đổi 30 giây. Student POST `/api/activities/{id}/check-in`:

```json
{
  "sessionId": 123,
  "challenge": "<challenge BE vừa cấp>",
  "location": { "latitude": 10.0, "longitude": 106.0, "accuracyMeters": 10.0 }
}
```

Tọa độ trên chỉ minh họa shape; gửi tọa độ thật khi ONSITE cần vị trí. QR check-in có key. Không gửi userId/fullName để tự chọn người điểm danh. Dùng `/my-attendance` để đọc chính chủ theo activity; không suy confirmed points từ đăng ký hay presence UI.

Manual POST `/api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests` nhận `{reason,evidenceRefs:["<evidence GUID>"]}`. GET cùng path trả paged requests, reviewer đúng assignment hoặc author chỉ đọc request của mình. Review POST `/{requestId}/review` dùng `{decision:"APPROVE"/"REJECT"/"REQUEST_REVISION",reason,expectedVersion}`. Approval có thể còn `APPROVED_PENDING`; đọc receipt/recognition lại, không cộng điểm ngay trên FE.

Manager attendance list GET `/api/clubs/{clubId}/activities/{activityId}/attendance?sessionId=...` trả `{activityId,sessionId,sessionVersion,items:[{memberId,userId,fullName,role,attendance}],page,pageSize,totalItems,totalPages,verifiedCount}` cho nguồn mới. Single PUT `/{memberId}` gửi `{status,note,sessionId,expectedVersion,expectedSessionVersion,reason}`; bulk PUT gửi `{items:[{memberId,status,note,expectedVersion}],sessionId,expectedSessionVersion,reason}`. Dòng chưa có attendance dùng expectedVersion=null; dòng đã có lấy attendance.version. Cần attendance.verify và không tự xác nhận mình. `memberId` là membership ID, không phải userId.

## Contribution, private evidence và review

Attributes hiện hành: `{tier,role,scale,result,pillarWeights:[{pillar,weight}]}`. Pillar chính xác: Academic/Research/Global/CultureSports/Community/Entrepreneurship/RealWorldWork; không gửi ACAD/ETHI/COMM alias UI. Tối đa 3 pillar, weight >0 và tổng đúng 1. Tier T1–T5; role Participant/Contributor/Product/Organizer/Leader; scale Club/Campus/FptEducation/National/International; result None/Finalist/Prize/RealWorldOutput. BE tính điểm, FE không tự chọn rawPoints.

| Thao tác | Body hiện hành |
| --- | --- |
| Upload private evidence | POST `/api/contributions/evidence`, FormData chứa **một file**; key; không gán Content-Type JSON cho multipart. PDF/PNG/JPEG tối đa 10 MiB → attachmentId/evidenceId/name/contentType/sizeBytes/createdAtUtc. |
| Submit CLUB | POST `/api/activities/{id}/contributions`: `{sessionId,contributionKind,proposedAttributes,message,evidenceRefs,expectedActivityVersion}`. |
| Revise | PATCH `/api/contributions/{id}`: `{expectedVersion,proposedAttributes,message,evidenceRefs}`. |
| Review | POST `/api/contributions/{id}/reviews`: `{decision,reason,expectedVersion,verifiedAttributes?}`; APPROVE cần verifiedAttributes. |
| Request upgrade | POST `/{id}/role-upgrade-requests`: `{proposedRole,proposedResult,evidenceRefs,reason,expectedVersion}`. |
| Review upgrade | POST `/{id}/role-upgrade-requests/{requestId}/reviews`: review body; expectedVersion là **upgrade request version**, giữ contribution blueprint. |
| Adjust | POST `/{id}/adjustments`: `{kind:"CORRECT"/"REVOKE",reason,expectedVersion,correctedAttributes?}`. |

Tất cả mutation contribution/review ở bảng dùng key. Canonical ContributionResponse có `id,userId,sourceType,sourceId,sourceKey,clubId,activityId,sessionId,semesterId,occurredAt,title,message,status,version,currentRevisionId,proposedAttributes,verifiedAttributes,evidenceRefs,rawPoints,recognitionStatus,updatedAt,calculationBreakdown`. Detail trả `{contribution,revisions,decisions,roleUpgradeRequests,calculationBreakdown,ledgerEffects}`. `ledgerEffects` có delta/allocation/revision/policy/formula/verification và calculationAvailable/provenance. Snapshot mới bất biến; lịch sử cũ chỉ reconstruct nếu dữ liệu gốc khớp, thiếu căn cứ thì unavailable. Không dùng policy hiện tại để giả cách tính lịch sử.

Self contributions đã hợp nhất canonical và legacy có nhãn, dedup mirror, lọc semesterId/status/pillar và SQL count/paging. Legacy có isAuthoritative=false/semesterId=null/legacyRawPointsPreview, không cộng vào điểm verified hoặc tự gán kỳ. Self ledger thêm sourceType. Private evidence download `/api/contributions/evidence/{id}/download` phải gửi app token, stream blob; không dùng `<img src>` công khai hoặc storage path thay quyền download.

External/+1 nộp qua POST `/api/v1/declarations`: payload hiện có dùng title/category/organizationSource/isOutsideClub=true/clubId=null/evidenceUrl=""/evidenceDescription/roleProposed/startDate/endDate, cộng **semesterId/occurredAt/proposedAttributes/evidenceRefs** để vào luồng canonical mới, optional policyVersion. Toàn bộ weights RealWorldWork thì sourceType=REAL_WORLD, còn nguồn ngoài khác là EXTERNAL. Không gửi CLUB effort qua legacy declaration để khai thêm điểm. Canonical update qua PUT cần expectedVersion/proposedAttributes/evidenceRefs/evidenceDescription; canonical detail giống contribution detail.

Declarations `/me` đã trả envelope items/page/pageSize/total/totalItems/totalPages, lọc kỳ/status/pillar và dedup. Canonical detail qua `/api/contributions/{id}`; detail legacy vẫn qua route declarations cũ. Review canonical có assignment/version và ledger; nhánh legacy outside review của actor Người xác minh vẫn PARTIAL. FE nhận diện namespace/version/shape và không gắn legacy preview là verified ledger.

Queue `/api/verifications/me/queue` chỉ nhận clubId/page/pageSize; trả `items,total,totalPages,roleUpgradeRequests,manualAttendanceRequests,assignedClubIds`. Ba nhóm tách biệt, total chỉ của items; không giả một paginator bao cả ba, không gửi sourceType/status rồi giả là BE đã lọc. Assignment POST dùng userId/sourceType/clubId/capabilities/startsAt/expiresAt/reason; PATCH dùng expectedVersion/isRevoked/reason/expiresAt. Capability là contribution.review/attendance.verify/experience.adjust; owner không tự có quyền review, reviewer không duyệt mình.

## Plan, thống kê, PDF và radar

GET/PUT `/api/clubs/{id}/semester-plans/{semesterId}`: PUT `{title,targetActivityCount,targetSessionCount,targetUniqueParticipantCount,expectedVersion}`; plan mới expectedVersion=null, sửa dùng version đã đọc. Không có budget. GET chưa có plan trả 404; FE hiển thị chưa lập kế hoạch, không coi đó là lỗi tải dữ liệu khác.

Statistics `/api/clubs/{id}/experience-statistics?semesterId=...` có aliases `asOf,planVersion,ledgerRevision,activityCount,sessionCount,uniqueParticipantCount,firstTimeParticipantCount,roleDistribution,pillarDistribution,targets,progress,definitionsVersion`, cùng native fields activities/plan/effectiveRoleCounts/netPointsByPillar. Target 0 → ratio=null. First-time là phạm vi dự án; raw points khác số đóng góp và khác radar đã bão hòa.

POST `/api/clubs/{id}/experience-reports` gửi `{semesterId,expectedPlanVersion,expectedLedgerRevision}` từ statistics đang hiển thị + key. Trả 202 `{reportId,status,statusUrl,downloadUrl,...}`; poll GET `/api/club-experience-reports/{reportId}`. Chỉ khi Completed mới tải URL có token dưới dạng blob. File giữ snapshot lúc tạo; correction sau đó không sửa file cũ. Mất quyền owner thì tải/replay bị chặn.

Radar đã hỗ trợ PERIOD qua `/api/v1/declarations/me/radar?semester=<canonicalCode>` và CUMULATIVE qua `?scope=CUMULATIVE`. Response có radarAxes sáu trục, plusOne=RealWorldWork, pillars bảy phần, D/J/M/ERI/profileTitle/scope/semesterId/policyVersion/formulaVersion/contributionFormulaVersion/ledgerRevision/asOf/version/ledgerBasis/isAuthoritative. Cumulative dùng approved policy scope riêng; thiếu policy =>503 SCORE_POLICY_UNAPPROVED. Không clamp ERI về100, không fallback FA26 hoặc nguồn lỗi thành điểm0. Chi tiết các API Sinh viên đã hoàn thành xem phần tiếp theo.

## API Sinh viên đã hoàn thành — request và response hiện hành


### Đóng góp và khai báo

GET /api/users/me/contributions và GET /api/v1/declarations/me:

- Query: semesterId=canonicalCode, status, pillar, page>=1, pageSize=1..100.
- Response: items/page/pageSize/total/totalItems/totalPages.
- **declarations/me hiện trả envelope, thay array cũ**. FE phải đọc items.
- sourceNamespace=CONTRIBUTION cho canonical, LEGACY_DECLARATION cho lịch sử cũ.
- Legacy có isAuthoritative=false, semesterId=null, legacyRawPointsPreview riêng; không cộng nó vào điểm xác thực.
- Filter semester chỉ áp dụng nguồn có kỳ xác định. Không tự gán kỳ cho legacy.
- Detail của legacy vẫn dùng route declarations cũ; không gọi /contributions/{legacyId} để coi nó là canonical.

Detail canonical giữ contribution/revisions/decisions/roleUpgradeRequests và bổ sung calculationBreakdown/ledgerEffects.
Effect mới có immutable calculation snapshot. Effect cũ được dựng lại khi revision, policy gốc, tổng bút toán và phân bổ khớp hoàn toàn; provenance=RECONSTRUCTED_FROM_IMMUTABLE_LEDGER_AND_REVISION. Nếu không đủ căn cứ hoặc formula chưa hỗ trợ, calculationAvailable=false; không dùng policy hiện tại để giả cách tính lịch sử.
RecognitionStatus REVOKED được thể hiện đúng, không tiếp tục hiển thị RECORDED.

### Radar/tổng quan

Theo kỳ: GET /api/v1/declarations/me/radar?semester=FA26.
Tích lũy: GET /api/v1/declarations/me/radar?scope=CUMULATIVE.

- PERIOD cần semester hợp lệ hoặc đúng một active semester; không fallback FA26.
- CUMULATIVE không nhận đồng thời semester.
- Có scope/semesterId/policyVersion/formulaVersion/contributionFormulaVersion/ledgerRevision/asOf/version.
- radarAxes đúng sáu trụ cột, plusOne là RealWorldWork riêng; pillars bảy phần vẫn giữ để compatibility.
- Cumulative cộng điểm thô net đã ghi, chuẩn hóa bằng approved cumulative policy; không cộng X đã bão hòa theo từng kỳ.
- Legacy chỉ có legacyPreviewCount, không vào điểm chính thức.
- Policy chưa duyệt: 503 SCORE_POLICY_UNAPPROVED. P01–P06 vẫn cần cấu hình/căn cứ thống nhất thực tế; test fixture không phải phê duyệt production.
- GET /api/users/me/experience-summary?semesterId=FA26 tách recognizedContributionCount khỏi rawExperiencePoints.
- Attendance/clubs source lỗi: count=null + availability=false, không fake0.
- asOf lịch sử được hỗ trợ bởi ledger/radar; membership/attendance hiện trạng chưa có historical projection, summary gắn HISTORICAL_SNAPSHOT_UNSUPPORTED và null cho hai nguồn khi yêu cầu asOf. Không khẳng định atomic snapshot xuyên nhiều service.

Admin approval hiện hỗ trợ Scope PERIOD/CUMULATIVE và EffectiveAt trong body của route approval đã có. Cumulative scope không được dùng làm policy xác thực nguồn activity.

### Khám phá/gợi ý/lịch sử

Feed/detail yêu cầu đăng nhập. discoveryVisibility mặc định CLUB_ONLY, có thể chọn CAMPUS_PUBLIC qua authoring BE của manager.
Dữ liệu đã có không tự đổi thành public trong migration. Quyền xem và quyền đăng ký tách biệt.

Feed: clubId/search/status=UPCOMING|LIVE/semesterId/page/pageSize; mặc định50, tối đa100.
Item có id/club info/title/description/coverImageUrl/startTime/endTime/location/status/nextAction/isEligible/canRegister/version/nextSessionId/sessionVersion/policyVersion/pillarWeights.
nextAction là gợi ý trình bày; action đăng ký/điểm danh vẫn kiểm tra lại quyền. Không có participants, attendance của người khác, email/phone, private evidence hoặc QR secret.

Recommendation: limit=1..6, semesterId hoặc scope. sourceLabel=LOW_AXIS_RULE, ruleVersion=LOW_AXIS_UNROUNDED_START_ID_V1.
Trục thấp tính từ X chưa làm tròn; tie theo CoreSix rồi startTime rồi activity ID. Không dùng +1 làm trục thứ bảy. Có recommendationId/rank/targetPillar/reason/radarSnapshot/sourceAsOf/scopeVersion.
Không có candidate => items=[]; dependency lỗi =>503. GET không mint điểm hoặc bắt buộc telemetry.

History: page/pageSize/semesterId/verificationStatus. Envelope items/page/pageSize/totalItems/totalPages/asOf.
Giữ activity/session/attendance versions, contributionId và sourceNamespace. Legacy chưa có session vẫn UNVERIFIED, không suy Present thành verified.

### Nhiệm vụ

Create/update của backoffice bổ sung criteria:
targetPillar (CoreSix), eligibleActivityIds (1..100), policyVersion (approved PERIOD),
minimumVerifiedContributions, minimumAllocatedPoints, eligibleSessionIds tùy chọn, ruleVersion=LOW_AXIS_QUEST_V1.
Update criteria cần expectedVersion; criteria/semester/campus/deadline đã được join không sửa trực tiếp.

Catalog/mine mặc định giữ array có giới hạn trang đầu để compatibility; gửi page/pageSize để nhận envelope.
Catalog có X-Total-Count. GET không tự tạo nhiệm vụ demo.
Với Sinh viên đã đăng nhập, GET catalog mặc định xếp nhiệm vụ phù hợp theo trục thấp, lọc campus/kỳ/deadline/nguồn hợp lệ và loại nhiệm vụ đã chọn trước khi phân trang. Có targetPillar/eligibleActivityIds/policyVersion/rank/reason/ruleVersion/radarSnapshot/sourceLabel=LOW_AXIS_RULE. recommended=false đọc catalog thông thường với sourceLabel=CATALOG. Khách chưa đăng nhập gọi recommended=true nhận401. Radar/policy/nguồn unavailable trả lỗi rõ, không fallback thành danh sách giả được cá nhân hóa.
rewardXp/reward là LEGACY_DISPLAY_ONLY; extraPointsAwarded=false.
completedCountBasis=RECORDED_COMPLETION_HISTORY; số này là lịch sử completion đã ghi, không phải bút toán điểm.

Join chỉ principal, lấy identity canonical, đóng băng criteria/period/campus/deadline vào participation.
Hoạt động đã đăng ký vẫn được dùng cho join dù đủ chỗ/đóng đăng ký; buổi nguồn phải còn phía trước. eligibleSessionIds được resolve đúng buổi, kể cả buổi sau của chuỗi. Criteria/session selector rỗng hoặc trùng bị từ chối. Quest đổi version trong lúc kiểm tra nguồn =>409 STALE_QUEST.
Complete body: expectedVersion của participation, linkedContributionIds tùy chọn, note.
note tối đa500 ký tự, khớp schema SQL. Complete kiểm tra nguồn Activity hiện tại cả trước idempotency replay; không chờ inbox hủy nguồn mới ngăn completion. Nguồn unavailable =>503 và khi đọc mine có progressAvailable=false/effectiveStatus=UNAVAILABLE. Không sửa các completion record cũ.
StudentUserId legacy có thể cùng principal; giá trị khác =>403, không có chức năng complete cho người khác.
Chưa join =>409 QUEST_NOT_JOINED. Chưa có verified proof phù hợp =>409 QUEST_PROOF_REQUIRED.
Pending/rejected/revoked/legacy/khác tác giả/khác source/kỳ/trụ cột không đủ proof.
Idempotency-Key được hỗ trợ; nên gửi cho join/complete để retry an toàn.
Bằng chứng bị revoke phải đọc effectiveStatus=REQUIRES_REVALIDATION. Status/CompletedAt cũ và completion record được giữ cho lịch sử.
Không có ledger effect phát sinh từ join/complete; điểm thuộc contribution nguồn.

### Gia nhập CLB

POST /api/clubs/{id}/join vẫn giữ route.
Name/email/phone trong body không được ghi đè danh tính Auth. FullName/Email/canonical phone được resolve từ server.
Nhập reason, category-specific additionalInfo và consent. DOB/Gender/Address là thông tin đơn nếu cần, không ép nộp lại để tạo điểm.
Tài khoản inactive/locked hoặc khác campus bị chặn; Auth chưa cấu hình/lỗi trả503.
Idempotency-Key tùy chọn; pending/approved hiện có không tạo thêm record. Rejected/deleted có quy trình gửi lại.

</details>
