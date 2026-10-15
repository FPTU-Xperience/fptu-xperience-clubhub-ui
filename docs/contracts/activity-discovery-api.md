<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Khám phá và nhiệm vụ theo trục thấp — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-005 | `GET /api/v2/activities/feed` | **✅ HOÀN THÀNH** | Feed authenticated, display-safe; campus/member visibility, private-by-default, search/status/semester/SQL paging và buổi kế tiếp. Không roster/contact/minh chứng. |
| API-006 | `GET /api/v2/activities/{activityId}` | **✅ HOÀN THÀNH** | Deep link đọc trực tiếp, kiểm tra campus/visibility như feed, DTO an toàn; không dùng management detail cho discovery. |
| API-007 | `GET /api/v2/recommendations/activities` | **✅ HOÀN THÀNH** | LOW_AXIS_RULE từ sáu trục X chưa làm tròn; eligible upcoming candidates qua toàn bộ các trang, thứ tự trục/start/ID, radar/policy snapshot. Outage503, không ghi điểm. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ — BẮT BUỘC; BỎ QUA ML/ghép lịch.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

GIỮ GET /api/v2/activities/feed và /api/v2/activities/{activityId}, display-safe/paged/search/filter/server-clock/publication/eligibility; không participants/evidence/contacts. Private-by-default migration giữ; management list không là public feed.

GIỮ GET /api/v2/recommendations/activities?limit=6 bằng **quy tắc trục thấp**: published/upcoming/registration available/đủ quyền/trọng số trục mục tiêu>0. Trả recommendationId/rank/reason/targetPillar/ruleVersion/sourceLabel=LOW_AXIS_RULE/activity và radar/policy snapshot căn cứ. Thứ tự đề xuất: X trục thấp trước, start trước rồi ID, versioned tie-break. modelVersion legacy có thể alias ruleVersion, không giả ML engine.

GET chỉ gợi ý; chọn qua quest participation, completion liên kết verified contribution theo [contributions](verified-contributions-api.md), không mint lại. Radar/config unavailable phải rõ; curated subset có nhãn có thể hỗ trợ nhưng không thay nhiệm vụ trục thấp nghiệm thu.

**BỎ QUA** rankingengine/ML/hybrid/academic interests/ghép timetable/feedback telemetry bắt buộc. Low-axis quest vẫn GIỮ; first6 list không là personalized đúng phiếu. Closed/cancelled/expired/full candidates không gợi ý action không làm được.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Privacy-safe activity discovery and recommendations

Implement Status: Not Yet

Status Scope: Backend implementation

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: ActivityService activity list/detail remain access-scoped management reads; no /api/v2 feed, published-visibility model or recommendation Gateway route. Inspect ActivityEndpoints.cs, ActivityContracts.cs and Gateway/ApiGateway/yarp.json.

D11; 2026-10-09 main 80818266. Refines the existing [activity feature contract](../../specs/003-activity-discovery/contracts/activity-discovery-contract.md). Canonical route names below retain its `/api/v2` prefix. New Gateway routing is required; `/v2` browser routes do not imply `/api/v2` already exists.

Current FE uses `getActivities()` and ranks the first six as temporary recommendations. Existing ActivityService list/detail are membership-scoped and contain participant/attendance data. They remain management reads. Club directory has dynamic categories and can still provide a clearly non-personalized curated subset.

## Feed and detail

GET `/api/v2/activities/feed?clubId=...&status=...&search=...&page=1&pageSize=50` returns `{items,page,pageSize,totalItems,totalPages}`; the optional page defaults cover the feature contract's 50-item case. Existing `mapActivityFeed` accepts `items`; FE must add page handling before relying on totals beyond the first page.

GET `/api/v2/activities/{activityId}` returns the same display-safe item or 404/403. Resolve cold deep links directly; do not download the whole feed to find a detail record. No roster, participant IDs, attendance, submissions or raw ranking scores.

Item: `{id,clubId,clubCode,clubName,title,description,coverImageUrl,startTime,endTime,location,status,nextAction}`. IDs preserve server values (FE may stringify). `nextAction` is a presentation hint, not permission. Scheduled maps to UPCOMING before start and LIVE for `start <= now < end` while the activity remains scheduled; use server clock. Exclude completed, cancelled and ended records from the upcoming/live feed. End must follow start.

Implementation default visibility: authenticated users may view only activities explicitly published for campus-wide discovery in an active club in their permitted campus, or activities permitted by existing club membership. Add `discoveryVisibility` (`CLUB_ONLY` default / `CAMPUS_PUBLIC`) and auditable publication under leadership authority; do not make all existing private activities public in a migration. A campus-public view does not permit registration/attendance/staff reads automatically. Cross-campus/public-anonymous policy is deferred, not inferred.

## Recommendations

GET `/api/v2/recommendations/activities?limit=6` -> `{items:[{recommendationId,rank,reason?,modelVersion,sourceLabel,activity}],available:true}`. Clamp 1..6, deterministic order, authorize candidates before serialization and recheck detail/actions. Persisted self preferences/academic fields are purpose-limited input from D02; no private roster/contact leakage to the browser/engine.

If ranking is unavailable, return an explicit availability outcome or an explicitly labeled `sourceLabel:"Curated"` authorized subset; never call temporary first-six ordering personalized. Failure must not break the ordinary feed/directory. Existing recommendation-engine is an internal dependency, not a browser origin. Read-only GET requires no telemetry write. Optional recommendation feedback has no current FE caller and is not part of this batch.

## Acceptance

Unaffiliated user sees only explicitly published eligible activities; existing member sees allowed club context; other campus/club denial; 0/50/>50 paging; exact start/end boundaries; no roster fields; cancelled records absent; direct deep links; recommendation outage/isolation; gateway precedence and authorization; card image and allowed action behavior. No duplication of existing activity creation/attendance APIs.


</details>
