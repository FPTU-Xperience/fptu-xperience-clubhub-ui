# Contract hoạt động, buổi lặp và điểm danh — 2026-10-12

Implement Status: Not Yet

Status Scope: BE attendance/session source; action attendance is a separate reviewed claim

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#actions).

**Đã có BE:** Buổi lặp, registration, QR/self attendance hiện có; thêm attendance-claims và verify cho action ATTENDANCE, có quyền độc lập.

**Chưa hoàn thành / giới hạn:** Claim không phải QR check-in, không tạo ActivityAttendance hoặc điểm qua legacy; điểm action/final report đang tạm hoãn.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Contract hoạt động, buổi lặp và điểm danh — 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-008 | `POST /api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests` | **✅ HOÀN THÀNH** | Xin xác nhận cho session đã diễn ra, có reason/evidenceRefs; yêu cầu ban đầu PENDING, không tự có điểm. |
| API-019 | `POST /api/activities/{id}/participants` | **✅ HOÀN THÀNH** | Registration theo activity, kiểm tra publish/window/capacity/current eligibility và self identity; nguồn session dùng registration này. Không có registration riêng cho mỗi session. |
| API-020 | `POST /api/activities/{id}/check-in` | **✅ HOÀN THÀNH** | Body sessionId/challenge/location; QR 30 giây, cửa sổ và geofence; trả verification/recognition trung thực. Không nhận userId từ FE. |
| API-021 | `GET /api/activities/{id}/my-attendance` | **✅ HOÀN THÀNH** | Xem attendance chính chủ; nguồn mới có session/version/method/contributionId/recognition. Legacy lịch ngày được giữ riêng. |
| API-034 | `POST /api/activities/{activityId}/sessions` | **✅ HOÀN THÀNH** | Tạo buổi đơn/lịch lặp theo giờ Việt Nam, ngày loại trừ, occurrence ID ổn định; dời cửa sổ điểm danh theo từng buổi; chống tạo lặp và kiểm tra version. |
| API-035 | `GET /api/activities/{activityId}/sessions` | **✅ HOÀN THÀNH** | Trả các buổi cùng version, semester, attendancePolicy và snapshot nguồn điểm. |
| API-036 | `PATCH /api/activities/{activityId}/sessions/{sessionId}` | **✅ HOÀN THÀNH** | Sửa buổi đúng quyền và version; bảo vệ buổi đã có lịch sử điểm danh. |
| API-037 | `POST /api/activities/{activityId}/sessions/{sessionId}/close` | **✅ HOÀN THÀNH** | Đóng buổi theo trạng thái hợp lệ; lưu lịch sử, version và lý do. |
| API-038 | `POST /api/activities/{activityId}/sessions/{sessionId}/cancel` | **✅ HOÀN THÀNH** | Hủy có lý do/audit/outbox; thu hồi attendance và đảo điểm bằng bút toán mới. |
| API-039 | `GET /api/activities/{activityId}/sessions/{sessionId}/attendance-challenge` | **✅ HOÀN THÀNH** | QR ký HMAC, đổi mỗi 30 giây, ràng buộc activity/session/version; trả serverTime và hết hạn; chỉ manager đúng CLB được phát. |
| API-045 | `GET /api/activities` | **✅ HOÀN THÀNH** | Dữ liệu quản lý có publication/semester/version/capacity/cấu hình điểm và điểm danh; người không quản lý chỉ nhận dữ liệu cá nhân được phép. |
| API-046 | `GET /api/activities/{id}` | **✅ HOÀN THÀNH** | Chi tiết gồm cấu hình nguồn đã công bố; không lộ danh sách người khác cho thành viên thông thường. Các occurrence được lấy qua API-035. |
| API-047 | `POST /api/activities` | **✅ HOÀN THÀNH** | Tạo draft đúng CLB, lấy tên CLB từ authority; giữ cấu hình đăng ký, semester và điểm để công bố sau khi có policy hợp lệ. |
| API-048 | `PUT /api/activities/{id}` | **✅ HOÀN THÀNH** | UPDATE/PUBLISH/CLOSE có version và idempotency; PUBLISH yêu cầu policy đã duyệt và snapshot; bảo vệ dữ liệu đã có lịch sử. |
| API-049 | `DELETE /api/activities/{id}` | **✅ HOÀN THÀNH** | Hủy hoạt động mới bằng expectedVersion/reason/key; giữ lịch sử, hủy các buổi và phát sự kiện đảo điểm. |
| API-050 | `PATCH /api/activities/{id}/complete` | **✅ HOÀN THÀNH** | Hoàn thành khi hoạt động kết thúc và các buổi đã được xử lý; version, lý do, audit; không tự cộng điểm. |
| API-054 | `GET /api/clubs/{clubId}/activities/{activityId}/attendance` | **✅ HOÀN THÀNH** | Trả dữ liệu theo session, verification/recognition/version và nguồn; kiểm tra đúng CLB/hoạt động. |
| API-055 | `PUT /api/clubs/{clubId}/activities/{activityId}/attendance/{memberId}` | **✅ HOÀN THÀNH** | Xác nhận theo buổi với version/lý do/minh chứng, capability attendance.verify và no-self; ghi outbox cho ledger. |
| API-056 | `PUT /api/clubs/{clubId}/activities/{activityId}/attendance` | **✅ HOÀN THÀNH** | Kiểm tra toàn bộ batch trước khi ghi, gồm no-self từng người; source/session/row versions và cùng giao dịch. |
| API-061 | `GET /api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests` | **✅ HOÀN THÀNH** | List theo activity/session: reviewer đọc phạm vi được giao, author chỉ đọc request của mình; paging. |
| API-062 | `POST /api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests/{requestId}/review` | **✅ HOÀN THÀNH** | Review manual có assignment/no-self/version/reason; APPROVED_PENDING chờ source confirmation rồi recognition receipt. |

<!-- BE_STATUS_2026_10_14_END -->

**GIỮ — BẮT BUỘC (F03, F04).** Phiếu v1.4 yêu cầu QR đổi mỗi30 giây, khung giờ/bán kính cấu hình, và xác nhận thay thế khi không GPS/online; PDF trang5 yêu cầu sổ cái gắn nguồn. Xem [phạm vi](capstone-scope-contract.md), [đóng góp](verified-contributions-api.md), [điểm](experience-scoring-contract.md).

## Hoạt động và buổi

Tái sử dụng ActivityService CRUD, `/participants`, `/check-in`, `/my-attendance` và attendance management; không tạo một bảng điểm danh song song. Nâng mô hình `ActivitySession` cho từng buổi/occurrence có ID ổn định, `activityId,semesterId,startTime,endTime,timezone,location,mode,status,version,attendancePolicy,scoringSnapshot`. Lịch trình riêng từng buổi; label lịch CLB không tự sinh buổi.

Hoạt động có trạng thái thiết kế `DRAFT|PUBLISHED|CLOSED|CANCELLED|COMPLETED`; adapter rõ với BE Scheduled/Completed/Cancelled. Công bố yêu cầu giờ bắt đầu<kết thúc, điều kiện đăng ký, tier/scale/vector/evidence requirements được xác nhận, policy phiên bản hợp lệ. CLOSED đóng đăng ký, không tự xóa người đã đăng ký hoặc attendance/ledger; CANCELLED không nhận đăng ký/check-in mới. Nếu có điểm đã ghi trước khi hủy phải xử lý correction có lý do, không DELETE điểm.

Đề xuất POST/GET `/api/activities/{activityId}/sessions`, PATCH `.../sessions/{sessionId}`, POST `.../sessions/{sessionId}/close` và POST `.../sessions/{sessionId}/cancel`; manager đúng CLB/capability. Tạo buổi lặp nhận `{weekdays,startTime,endTime,timezone:"Asia/Ho_Chi_Minh",rangeStartDate,rangeEndDate,excludedDates,expectedVersion}`; server tạo danh sách occurrence xác định và chống tạo trùng khi replay. Preview danh sách buổi không ghi. Giới hạn số buổi một lần được cấu hình; sửa series không thay lịch sử buổi đã điểm danh, mọi hủy/sửa có version/audit/notification.

## Đăng ký

GIỮ POST `/api/activities/{id}/participants`, GET `/api/activities/{id}/my-attendance`; identity self-only khi sinh viên đăng ký. Kiểm tra published/registration window/điều kiện thành viên hoặc nguồn campus-public/capacity/cancelled. Đăng ký không là điểm danh hay đóng góp xác thực. Unique current activity+user; nếu đăng ký theo buổi thì unique session+user. Last-seat race không vượt capacity.

MVP giữ điều kiện cơ bản và các yêu cầu minh chứng. **BỎ QUA — CHƯA CẦN** trình dựng form20 fields, staff duty catalog hoặc review application tùy ý; nếu một hoạt động có điều kiện phải duyệt, reviewer xử lý theo quyền/state rõ, không tự approve do UI thiếu tính năng.

## Chính sách điểm danh

```json
{
  "mode": "ONSITE",
  "qrRotationSeconds": 30,
  "opensAt": "2026-10-20T08:00:00Z",
  "closesAt": "2026-10-20T09:00:00Z",
  "geofence": { "latitude": 10.84, "longitude": 106.81, "radiusMeters": 100 },
  "manualConfirmationEnabled": true,
  "version": "opaque"
}
```

Số giờ/tọa độ/bán kính trên chỉ minh họa. `qrRotationSeconds=30` theo phiếu; opensAt<closesAt, latitude[-90,90], longitude[-180,180], radius>0 trong giới hạn cấu hình dự án. ONSITE yêu cầu vị trí đã khai báo; ONLINE không ép GPS giả. Chỉ xin vị trí khi người dùng thực hiện điểm danh, không theo dõi nền/IP/Wi-Fi trường; giữ tối thiểu dữ liệu cần cho audit theo retention thiết kế.

## QR và check-in server

Đề xuất GET `/api/activities/{activityId}/sessions/{sessionId}/attendance-challenge`: quản lý/bên được cấp quyền hiển thị QR, trả `{challenge,issuedAt,expiresAt,serverTime,sessionId}`. QR là opaque signed token/nonce có session/audience/expiry/slot30s; không chứa roster/PII. Server kiểm tra chữ ký/intent, giờ và session; không tin giờ trình duyệt hoặc mã hoạt động dễ đoán.

Nâng POST `/api/activities/{activityId}/check-in` hiện có với `{sessionId,challenge,location:{latitude,longitude,accuracyMeters}?}`, Idempotency-Key. Server lấy user từ principal, kiểm tra registration/eligibility/session window `opensAt <= now < closesAt`, challenge còn hiệu lực đúng slot/session, policy hiện hành và khoảng cách<=radius cho ONSITE. Không nhận `userId,attendanceStatus,verified:true` từ self client. Race unique `(sessionId,userId)`; trả canonical attendance không tạo lần2.

Một QR trên màn hình dùng được cho nhiều người đủ điều kiện trong30s; **không** consume token toàn cục ngay sau người đầu tiên. Replay bởi cùng người không tạo attendance/điểm mới. QR cũ/sửa chữ ký/sai buổi/ngoài giờ/ngoài bán kính bị từ chối. Quy tắc clock skew/độ chính xác GPS phải cấu hình và ghi trong thiết kế; không mở grace không giới hạn. GPS client không phải bằng chứng chống mọi gian lận; phát hiện gian lận tự động **BỎ QUA**.

Response `{attendanceId,activityId,sessionId,status:"VERIFIED",verificationMethod:"ROTATING_QR",verifiedAt,contributionId?,recognitionStatus,version}`. Trường contribution/recognition chỉ báo khi nguồn đã ghi/chờ ghi thật theo [đóng góp](verified-contributions-api.md), không mặc định cộng điểm khi nhận HTTP200.

## Không GPS và online

Đề xuất POST `/api/activities/{activityId}/sessions/{sessionId}/manual-attendance-requests`: self `{reason,evidenceRefs?}`, Idempotency-Key; trả PENDING, không ghi điểm. GET same collection cho reviewer đúng scope; POST `.../manual-attendance-requests/{requestId}/review`, `{decision:APPROVE|REJECT|REQUEST_REVISION,reason,expectedVersion}`.

Người xác nhận phải được quyền/đúng CLB hoặc được phân công; không self-review. Online cũng phải có căn cứ tham gia đã kiểm tra, không đánh dấu cả danh sách thành Verified vì là online. APPROVE cập nhật/dedupe attendance cùng `(sessionId,userId)` và cùng contribution source mà QR dùng; QR thành công rồi manual approve không ghi lần2. Reject/request revision có reason và thông báo sinh viên. UI khi từ chối location/không GPS cho phép gửi đề nghị, không khóa toàn bộ luồng.

Bulk attendance PUT cũ giữ cho người có quyền; phải kiểm tra từng user/session, lưu verifier/reason/version và chuyển qua cùng ràng buộc ledger. Không dùng bulk để vượt kiểm tra self-review hoặc điều kiện ghi điểm. Kết quả từng mục/transaction rõ, không fake all-success.

## Nghiệm thu và đo tải

QR tại ranh giới30s/opensAt/closesAt; server clock; cùng token nhiều người; token sai/hết hạn; đủ/thiếu location và rìa geofence; từ chối GPS→manual; online; unrelated club/revoked permission; duplicate race/retry; QR+manual cùng nguồn; session lặp không lẫn buổi; hủy hoạt động; restart giữ attendance/history.

Đo tải API danh sách và check-in với số tài khoản/buổi/request/concurrency/dữ liệu được ghi rõ; báo latency p50/p95/p99, throughput, tỷ lệ lỗi và số duplicate/ledger net. Không tự nhận ngưỡng SLA chưa có trong phiếu. Kiểm tra toàn vẹn DB sau tải, không chỉ đo HTTP200.

</details>
