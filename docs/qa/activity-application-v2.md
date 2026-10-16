# Flow tạo hoạt động có action và dự toán XP — V2

Ngày: 2026-10-16. Trạng thái: **đã triển khai UI và API client contract; backend application/XP chưa triển khai trong thay đổi này**.

## Lối vào và hành vi

- `CLB của tôi → Hoạt động → Tạo hoạt động` và `Báo cáo → Tạo báo cáo → Báo cáo Tạo hoạt động` mở cùng form tại `/v2/my-clubs/:clubCode/reports/create?template=create-activity&clubId=...&period=...`.
- Standalone `/v2/reports/create` với cùng template/context cũng dùng form này. Học kỳ đi theo workspace, không thay bằng kỳ do client tự đoán.
- Bốn bước nằm trong một form, dùng chung draft; các panel luôn được mount và chỉ ẩn/hiện theo bước: thông tin hoạt động; action và dự toán; chuẩn bị tuyển nhân sự; kiểm tra và gửi CTSV duyệt lần 1. Chuyển bước tới kiểm tra các bước trước; submit kiểm tra toàn bộ và quay về đúng bước/trường thiếu, không giữ lỗi chung ở màn cuối. Nút Tiếp tục và gửi cuối dùng chung submit handler.
- Không còn gọi trực tiếp `POST /api/activities` từ nút tạo của workspace. Không gửi action vào DTO report cũ rồi bỏ mất dữ liệu. Các report `FUTURE_EVENT` đã tồn tại tiếp tục được sửa bằng editor cũ của V2, giữ compatibility với workflow tài chính; chưa chuyển dữ liệu lịch sử sang XP.

## Phần đã áp dụng

- Action mẫu có thể sửa/xóa/thêm: Check-in, Staff supporting, Hosting. Tên không quyết định hệ số vai trò.
- Điểm nền nhập trực tiếp; vai trò canonical Participant/Contributor/Product/Organizer/Leader dùng 1/1.6/2.2/3/4. Quy mô Club/Campus/FptEducation/National/International dùng 1/1.3/1.6/2.2/3. Action mặc định kế thừa quy mô; có thể khai báo ngoại lệ.
- XP/lượt = điểm nền × min(hệ số vai trò × hệ số quy mô, 8). Dự toán action = XP/lượt × người × lượt/người. Ví dụ nội bộ 100 check-in, 10 supporting, 2 hosting tương ứng 5.000 + 1.500 + 600 = 7.100 raw XP.
- Có số lượng dự kiến, giới hạn lượt/người, giới hạn lượt cấp toàn action, cách xác minh. Giới hạn phải bao phủ dự kiến. Tránh số âm, thập phân cho số lượng, NaN/Infinity/overflow, thời gian quá khứ và kết thúc trước bắt đầu.
- V1 form dùng `FULL_ONLY`, `ADDITIVE`, không thưởng kết quả. Phải xác nhận các phần việc độc lập trước lưu/gửi; chưa hỗ trợ calculator nhóm loại trừ hoặc rubric hoàn thành một phần. Không tự giả định tham dự được cộng thêm nếu hosting/supporting đã bao gồm phần đó.
- Có thể chuẩn bị một nhiệm vụ với nhiều vị trí liên kết `actionClientId`. Slot mỗi vị trí = số người dự kiến của action. Public/private tách khỏi eligibility; private trong phiên bản này dành cho thành viên CLB. Xóa action tự bỏ liên kết tuyển. Chưa công khai nhiệm vụ hoặc tạo assignment tại bước lập hồ sơ.
- UI mô tả rõ hai lần CTSV duyệt: kế hoạch trước triển khai; tổng kết sau kết thúc rồi mới có điểm chính thức. Không hiển thị bản nháp như XP được duyệt.
- Dự toán client là preview; request không gửi tổng XP/hệ số làm nguồn thẩm quyền. Tổng server được hiển thị riêng khi lưu và gửi thành công.
- Giờ nhập/hiển thị là Việt Nam UTC+7, payload UTC độc lập timezone của trình duyệt.
- Nếu `clubAccess.permissions` là array thì kiểm tra `activity.create`, `activity.edit`, `activity.application.submit`. Array rỗng không được fallback. Khi backend chưa cung cấp array, tương thích với `isManager` theo CLB. Chế độ CTSV quan sát và thành viên thường không có quyền tạo. Backend vẫn phải kiểm tra resource và principal ở mọi endpoint.
- Lưu và submit là hai mutations riêng, optimistic concurrency và idempotency riêng. Submit thất bại giữ ID đã lưu; thử lại không POST tạo bản mới. Form chỉ báo thành công khi có receipt canonical hợp lệ và trạng thái `SUBMITTED`. Có link mở lại draft/submitted bằng `applicationId`; submitted chỉ đọc.
- API chưa có trả 404/405/501 thì giải thích chưa lưu/chưa gửi. Nếu lưu được nhưng submit chưa được hỗ trợ thì thông báo đúng bản nháp đã lưu. Có xuất JSON để giữ nội dung nháp; tệp xuất không phải hồ sơ được duyệt. Không lưu hoặc cấp điểm bằng localStorage.

## Contract backend cần cung cấp

Tái sử dụng facade `src/services/api.js`. Các endpoint dưới đây là **contract mới**, chưa có ở API checkout đã kiểm tra. Phù hợp proposal `fptu-xperience-doc/feature-requests/activity-action-xp-approval-proposal.md`, mục 12.

| Endpoint | Request / response |
| --- | --- |
| `POST /api/activity-applications` | Body như bên dưới. Header `Idempotency-Key`. Trả receipt draft với ID/version và dự toán server. |
| `GET /api/activity-applications/{id}` | Full canonical application, bao gồm actions và recruitment; kiểm tra scope CLB. |
| `PATCH /api/activity-applications/{id}` | Body như tạo + `expectedVersion`; header idempotency; trả phiên bản mới. Chỉ draft/revision. |
| `POST /api/activity-applications/{id}/submit` | `{ expectedVersion }`, header idempotency; trả `SUBMITTED`, version mới, tổng server. Không start, mở tuyển hoặc cấp điểm. |

Body tạo/sửa:

```json
{
  "clubId": 7,
  "period": "FALL2026",
  "title": "Workshop thiết kế sản phẩm",
  "description": "Nội dung hoạt động",
  "objective": "Mục tiêu",
  "location": "Innovation Lab",
  "startTimeUtc": "2026-12-01T02:00:00.000Z",
  "endTimeUtc": "2026-12-01T05:00:00.000Z",
  "scale": "Club",
  "independentActionsConfirmed": true,
  "actions": [{
    "clientId": "stable-client-uuid",
    "name": "Staff supporting",
    "basePoints": 50,
    "contributionRole": "Organizer",
    "scaleSource": "ACTIVITY",
    "scale": null,
    "expectedPeople": 10,
    "expectedOccurrencesPerPerson": 1,
    "maxAwardsPerPerson": 1,
    "maxAwardCount": 10,
    "verificationMethod": "WORK_REVIEW",
    "completionMode": "FULL_ONLY",
    "stackingRule": "ADDITIVE"
  }],
  "recruitment": {
    "visibility": "PRIVATE",
    "eligibility": "CLUB_MEMBERS",
    "positions": [{ "actionClientId": "stable-client-uuid", "capacity": 10 }]
  }
}
```

`recruitment: null` khi không tuyển. `scaleSource: OVERRIDE` đi kèm canonical `scale`. `clientId` là định danh liên kết trong một hồ sơ; server cấp DB ID và giữ mapping ổn định, không coi client UUID là chứng cứ quyền sở hữu.

Receipt tối thiểu:

```json
{ "id": 91, "version": 1, "status": "DRAFT", "expectedRawXp": 1500 }
```

GET trả thêm toàn bộ body, canonical action facts, timestamps và recruitment positions có `actionClientId` để mở lại form. Trạng thái được editor hỗ trợ: `DRAFT`, `REVISION_REQUESTED`, `SUBMITTED`. Backend nên trả 409 khi version conflict, không nhận sửa total từ client; cùng key/cùng body trả lại kết quả đã commit, cùng key/khác body trả conflict. Nếu create mất response, UI giữ key cũ cho retry; không đổi nội dung rồi cấp key mới để tạo bản trùng.

Backend phải tính bằng decimal và chốt làm tròn theo policy. Hạn mức, phân quyền, giới hạn, stacking và số lượng phải validate lại server-side. Server không được đánh dấu SUBMITTED nếu chưa lưu đầy đủ action/recruitment và dự toán.

## Phạm vi còn lại trước production

Chưa triển khai migration/aggregate application, các endpoint trên, approval UI phía CTSV, snapshot policy/hạn mức, start/open-recruitment guards, actual completions, nhiệm vụ dùng chung ở hai tab, báo cáo kết thúc tự sinh, duyệt lần hai, ledger/outbox/posting hoặc radar. Category allocation, rubric và nhóm action loại trừ cần chốt contract bổ sung theo proposal trước khi mở rộng. Không thể dùng thay đổi UI này để tuyên bố backend hai bước duyệt và cộng XP đã hoạt động.

API repo có yêu cầu GitNexus impact trước chỉnh sửa; phiên làm việc này không có tool GitNexus hoặc `.gitnexus/run.cjs`, và không sửa backend. Handoff này ghi contract cho backend thay vì bỏ qua quy tắc repository.

## Kiểm tra

- `node --test --test-reporter=tap src/pages/v2/*.test.js`: 167/167 đạt, gồm 8 nhóm test mới cho formula/cap/counts/date/payload/recruitment/permissions; cập nhật regression test để cấm direct create ở ActivitiesTab.
- `npm run build`: đạt; cảnh báo bundle >500KB hiện có.
- Chrome với **API fixture cô lập**, 15 trường hợp đạt: hai lối vào, validation, preview phản ứng, responsive 1440/390px, private recruitment, export, submit retry/idempotency, reopening submitted, PATCH version, server chưa hỗ trợ, member denial permission array rỗng, submit endpoint chưa hỗ trợ và role có quyền tạo/gửi nhưng không có quyền sửa. Không có pageerror. Regression đổi tab/quay lại kiểm tra DOM field vẫn còn, dữ liệu thông tin/action được giữ và payload submit có đủ title/description/location/actions/recruitment; lỗi thông tin thiếu đưa focus về đúng input.
- Đã xem screenshot desktop/mobile. Không tràn ngang mobile; bảng review có vùng cuộn riêng.
- Chưa kiểm tra end-to-end với backend thật. Fixture chỉ chứng minh hành vi frontend theo contract.
- Evidence: `C:/Users/grisg/.codex/visualizations/2026/10/15/01a14040-6f0e-7b23-82ee-c448efc3b613/activity-application-browser-results.json` cùng script/screenshot `activity-application-*`.
