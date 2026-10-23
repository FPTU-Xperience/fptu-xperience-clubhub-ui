# Contract tính điểm Trải nghiệm 6+1 — 2026-10-12

Implement Status: Not Yet

Status Scope: Product-owner-approved future scoring policy; legacy calculators preserved

Backend Progress: DEFERRED_BY_PRODUCT_OWNER

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#decisions).

**Đã có BE:** Giữ source/ledger/calculator legacy đã có làm bằng chứng; completion mới không cộng điểm.

**Chưa hoàn thành / giới hạn:** Chủ dự án chưa chốt ai duyệt cuối, công thức/caps/+1/rollover/reversal. expectedRawXp=null, scoringStatus=DEFERRED_BY_PRODUCT_OWNER, canAwardPoints=false; không thay bằng 0.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Contract tính điểm Trải nghiệm 6+1 — 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-014 | `GET /api/users/me/experience-ledger` | **✅ HOÀN THÀNH** | Paged self net ledger với sourceType/sourceId/sourceKey/sourceNamespace, policy/formula/revision/verification; không đưa XP mẫu vào ledger. |
| API-026 | `GET /api/v1/declarations/me/radar` | **✅ HOÀN THÀNH** | VERIFIED_NET_LEDGER theo PERIOD và CUMULATIVE; six radarAxes + plusOne, ERI/D/J/M và leader proof theo trụ cột; approved policy/version/asOf/ledgerRevision. Cumulative cần policy scope riêng, thiếu trả503. |
| API-069 | `GET /api/v1/student-affairs/benchmarks` | **🟡 CHƯA HOÀN THIỆN** | List benchmark có sẵn; DTO legacy chưa có đủ approvalStatus/version/formula/precision/cumulative metadata. Đọc policy snapshot qua route bổ sung, không suy từ isActive. |
| API-070 | `GET /api/v1/student-affairs/benchmarks/active` | **🟡 CHƯA HOÀN THIỆN** | active vẫn có thể tự tạo fallback FA26 khi DB trống và không đồng nghĩa APPROVED. FE không dùng response này làm bằng chứng policy đã được duyệt. |
| API-071 | `POST /api/v1/student-affairs/benchmarks` | **🟡 CHƯA HOÀN THIỆN** | Create benchmark draft và approval workflow đã có; /approval hỗ trợ scope PERIOD/CUMULATIVE, effectiveAt và snapshot version. DTO create benchmark legacy chưa thể hiện đầy đủ cấu hình P01–P06/formula/precision và metadata phê duyệt; giữ PARTIAL cho operation quản trị này. |
| API-072 | `PUT /api/v1/student-affairs/benchmarks/{id}` | **🟡 CHƯA HOÀN THIỆN** | Đã chặn update approved/locked, bump version; có draft mới giữ approved snapshot cũ. DTO update legacy chưa có CAS expectedVersion và đầy đủ chính sách tích lũy/effective. |
| API-073 | `POST /api/v1/student-affairs/benchmarks/{id}/lock` | **🟡 CHƯA HOÀN THIỆN** | Lock/version có sẵn; isLocked chưa thay approval và snapshot ledger kỳ. Dùng /approval cho approved policy, không dùng lock để cấp quyền ghi điểm. |

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| ADD-03 | `GET /api/v1/student-affairs/benchmarks/{id}/policy` | **✅ HOÀN THÀNH** | Đọc benchmarkId/version/approvalStatus/versions (metadata approved policy). Không trả full snapshot/coefficients; không đọc /active để suy APPROVED. |
| ADD-04 | `POST /api/v1/student-affairs/benchmarks/{id}/approval` | **✅ HOÀN THÀNH** | Technical approval snapshot có scope PERIOD/CUMULATIVE và effectiveAt; expectedVersion/environment/approvalBasis/parametersP01ThroughP06Agreed. Cumulative reader đã triển khai; vẫn cần cấu hình P06 được phê duyệt thật. |
| ADD-05 | `POST /api/v1/student-affairs/benchmarks/{id}/draft` | **✅ HOÀN THÀNH** | Tạo draft tiếp theo, giữ approved snapshot cũ; version/reason/key. |

<!-- BE_STATUS_2026_10_14_END -->

**GIỮ — BẮT BUỘC.** Nguồn: PDF trang 2–5; phiếu v1.4 mục 3.1 và mục 4. [Phạm vi](capstone-scope-contract.md) quyết định phần phải làm; tham số demo/chi tiết chưa nêu trong PDF phải được giảng viên thống nhất, không phải quy định trường.

## Trụ cột và vector

Giữ mã BE hiện có, sửa nhãn hiển thị theo phiếu:

| Mã | Nhãn | Hiển thị |
| --- | --- | --- |
| Academic | Học tập | Radar trục 1 |
| Research | Nghiên cứu | Radar trục 2 |
| Global | Quốc tế | Radar trục 3 |
| CultureSports | Thể thao và Văn hóa | Radar trục 4 |
| Community | Cộng đồng | Radar trục 5 |
| Entrepreneurship | Khởi nghiệp | Radar trục 6 |
| RealWorldWork | +1 Trải nghiệm Thực tế | Chỉ số/hệ số riêng ngoài radar |

Mỗi hoạt động/khai báo có `pillarWeights:[{pillar,weight}]`, 1–3 mã khác nhau trong bảy mã; mỗi weight >0, tổng =1. Dùng số thập phân; server kiểm tra tổng ở precision cấu hình, không để FE âm thầm chuẩn hóa dữ liệu sai. Ví dụ hackathon: Academic 0.4, Entrepreneurship 0.4, Global 0.2. Vector được xác nhận và lưu snapshot phiên bản khi ghi đóng góp; sửa cấu hình hoạt động không tự sửa điểm cũ.

Với điểm thô P của đóng góp, phân bổ `allocatedPoints_j = P * weight_j`. Tổng phân bổ bằng P theo precision đã chốt; không làm tròn nguyên từng phần, không cộng toàn bộ P vào mỗi trụ cột. Khi lượng tử hóa từng phần, phải bảo toàn tổng bằng quy tắc phần dư có phiên bản; phương án chờ duyệt là gán phần dư cho trọng số lớn nhất, hòa thì theo thứ tự mã trụ cột. Nếu có phần +1 thì phần đó vào RealWorldWork riêng, không vẽ trục thứ bảy, không nhân trực tiếp lên sáu điểm radar. Khai báo chỉ +1 có thể dùng vector RealWorldWork=1; không tự tạo thêm sáu phần điểm.

## Công thức điểm thô đã có trong PDF

`P = B(tier) × min(R(role) × Q(scale), 8) × (1 + K(result))`.

| Thuộc tính | Mã hiện có / giá trị |
| --- | --- |
| Công sức | T1=10 (≤2 giờ); T2=25 (nửa ngày); T3=60 (8–30 giờ); T4=150 (30–100 giờ); T5=400 (dự án cả kỳ) |
| Vai trò đóng góp | Participant=1.0; Contributor=1.6 (tham gia tích cực); Product=2.2 (đóng góp sản phẩm); Organizer=3.0; Leader=4.0 |
| Quy mô | Club=1.0; Campus=1.3 (cấp trường); FptEducation=1.6; National=2.2; International=3.0 |
| Kết quả | None=0; Finalist=0.30; Prize=0.60; RealWorldOutput=1.00 |

Chỉ có kết quả thưởng khi đầu ra tương ứng được xác thực. `RealWorldOutput` là loại kết quả (+100%), khác trụ cột `RealWorldWork` (+1). Quốc tế/quốc gia là **quy mô hoạt động**, không phải quyền đăng nhập/campus. Vai trò tính điểm không suy ra từ chức vụ CLB.

PDF không giải quyết hết khoảng giờ (2 giờ đến nửa ngày, ranh giới 30 giờ). Người tạo khai báo tier và căn cứ công sức; người xác minh chốt. **BỎ QUA** tự suy ra tier bằng số giờ theo các ranh giới chưa thống nhất. Thiết kế mặc định: một kết quả cuối cùng cao nhất đã duyệt, không cộng Finalist+Prize+RealWorldOutput; đây là quy tắc hoàn thiện cần ghi trong chính sách được duyệt.

Client chỉ gửi đề xuất/nguồn minh chứng. Server tính điểm từ thuộc tính đã xác thực + policy snapshot. Không nhận `rawPoints`, `ERI`, số dư hoặc multiplier tùy ý do sinh viên gửi.

## Bão hòa và ERI

Điểm thô hợp lệ của trụ cột trong phạm vi đọc: `S_j = Σ(allocatedPoints_j của đóng góp đã xác thực + các bút toán điều chỉnh hợp lệ)`. Chưa duyệt/từ chối/yêu cầu bổ sung không ghi điểm mới. `tau_j > 0` theo trụ cột và phiên bản chính sách.

`X_j = 100 × (1 − exp(−S_j / tau_j))` (PDF trang 3). S=0 → X=0; tăng S làm X tăng với lợi ích giảm dần. Điểm trục nằm [0,100], +1 được tính riêng.

`ERI = D × (0.5 + 0.5 × J) × M` (PDF trang 4), trong đó D=độ sâu của **sáu trục**, J=độ đều Pielou của **sáu trục**, M=hệ số Thực tế trong [1,1.30]. Không xếp hạng cạnh tranh. ERI có thể lớn hơn 100, tối đa 130 với D≤100; ví dụ PDF trang 1 có ERI 100.1. FE không clamp ERI về 100.

PDF không ghi rõ toàn bộ D, xác suất đưa vào Pielou và cách chuyển điểm +1 thành M. Phiếu mục 4 yêu cầu thống nhất các phần này. Cách BE hiện đang dùng được giữ làm **phương án kỹ thuật chờ duyệt**, không coi là công thức đã được PDF chốt:

```text
D = (X_Academic + X_Research + X_Global + X_CultureSports
     + X_Community + X_Entrepreneurship) / 6
Nếu Σ X_core = 0: J = 0
Nếu Σ X_core > 0:
  p_j = X_j / Σ X_core
  J = −Σ(p_j × ln(p_j)) / ln(6); quy ước 0×ln(0)=0
M = 1 + 0.30 × X_RealWorldWork / 100
ERI = D × (0.5 + 0.5 × J) × M
```

Mẫu trên dùng `ln(6)` cố định kể cả chỉ một trục có điểm, để một trục cho J=0, sáu trục bằng nhau dương cho J=1. Chỉ +1 nhưng sáu trục bằng 0 → D=0, ERI=0; +1 bổ trợ, không thay thế radar. Đổi cách định nghĩa phải tạo phiên bản công thức mới và có kế hoạch hiệu lực, không sửa kết quả cũ âm thầm.

## Tham số chờ giảng viên duyệt

| ID | Phần thiếu/chưa chốt | Phương án để thiết kế, trạng thái |
| --- | --- | --- |
| P01 | tau cho 6 trụ cột và +1, theo kỳ | BE đang mặc định 1000; **CHỜ GIẢNG VIÊN DUYỆT**, không đủ dữ liệu để suy ra từ các đồ thị PDF |
| P02 | Định nghĩa D và đầu vào Pielou | Trung bình sáu X, p từ sáu X như trên; **CHỜ GIẢNG VIÊN DUYỆT** |
| P03 | Chuyển +1 thành M và trọng số +1 | M=1+0.30×X_work/100 là cách BE hiện dùng; **CHỜ GIẢNG VIÊN DUYỆT**. Trần1.30 đã nêu trong PDF/phiếu |
| P04 | Ngưỡng năm bậc và danh hiệu | BE đang dùng 20/50/80; Toàn Diện: minX≥20 và J≥0.90; **CHỜ GIẢNG VIÊN DUYỆT** |
| P05 | Precision/tie-break/kết quả cao nhất và quy tắc công sức biên | Đề xuất lưu điểm/vector 4 số lẻ, X/ERI hiển thị 2; làm tròn AwayFromZero ở ranh giới cuối; **CHỜ GIẢNG VIÊN DUYỆT** |
| P06 | Radar tích lũy qua nhiều phiên bản tau | Đề xuất policy tích lũy riêng có phiên bản, dùng điểm thô snapshot hợp lệ, giữ mọi snapshot kỳ cũ; **CHỜ GIẢNG VIÊN DUYỆT** trước ghi điểm thật |

Có thể tiếp tục thiết kế bằng các phương án được gắn nhãn; trước khi ghi điểm thật cần cấu hình đã được thống nhất. Cấu hình có `approvalStatus:DRAFT|APPROVED`, `environment:DEMO|PROJECT`, người/ngày/căn cứ thống nhất. Nếu thiếu policy APPROVED thì trả `503 SCORE_POLICY_UNAPPROVED`; không tự fallback 1000/FA26 hoặc biến thiếu cấu hình thành 0. Dữ liệu demo phải gắn nhãn và tách môi trường.

## Bậc, danh hiệu, nhiệm vụ

Năm bậc của **mỗi trụ cột radar**: Chưa khám phá → Khởi động → Thực hành → Đóng góp → Dẫn dắt. Ngưỡng thuộc policy, có thứ tự tăng hợp lệ. Bậc Dẫn dắt bắt buộc có đóng góp `Leader` đã duyệt, chưa bị thu hồi, phân bổ vào **chính trụ cột đó**, ngoài đạt ngưỡng; chức vụ owner và bằng chứng ở trụ cột khác không đủ. Thu hồi proof thì ghi snapshot mới cho hiện trạng, giữ snapshot lịch sử.

Danh hiệu mô tả dạng radar, không tạo leaderboard/ví/quà. Danh mục và quy tắc cấp/tie-break do admin cấu hình có phiên bản. Không bắt buộc đủ mọi tên ví dụ trong PDF nếu chưa có luật được duyệt; không tự gán ngẫu nhiên. +1 không bắt buộc có năm bậc giống sáu trục.

Nhiệm vụ gợi ý chọn từ hoạt động đã công bố, còn thời gian, đủ điều kiện đăng ký và có trọng số vào trục thấp; trả trụ cột mục tiêu/căn cứ/quy tắc. Sinh viên chọn nhiệm vụ; hoàn thành chỉ khi liên kết đóng góp đã xác thực đáp ứng tiêu chí. Hoàn thành **không ghi thêm điểm** ngoài đóng góp nguồn. Không yêu cầu engine ML, ghép lịch học, ví `walletPoints` hay thưởng đổi quà.

## Chính sách phiên bản và học kỳ

Tái sử dụng `Semester.Id`/`SemesterCode` hiện có. Mỗi đóng góp có semesterId xác định theo policy lúc xác thực, occurredAt/sessionId, policyVersion, formulaVersion, điểm và vector snapshot. Đọc kỳ phải lọc **đúng kỳ của đóng góp**, không chỉ đổi tau theo query trong khi cộng toàn bộ lịch sử. Hoạt động qua ranh giới kỳ phải có quy tắc phân bổ thời điểm được ghi trong thiết kế; không ghi lại cùng một công sức vào hai kỳ.

Policy đã dùng ghi điểm bất biến; thay đổi tạo version mới, có effectiveAt và audit. Snapshot radar kỳ chứa policy/formula/asOf/ledgerRevision; sau đóng kỳ lưu snapshot. Điều chỉnh hồi tố là thao tác có lý do, append bút toán và phiên bản snapshot mới, vẫn truy được trước/sau. Radar tích lũy không reset; không cộng các X đã bão hòa từng kỳ để giả làm radar tích lũy.

Tái sử dụng `/api/v1/semesters`, `/api/v1/student-affairs/benchmarks` và declarations/radar, nâng DTO/migration nếu cần; không tạo hệ học kỳ/bộ máy điểm thứ hai. Thiết kế mở rộng benchmark: `policyVersion,formulaVersion,approvalStatus,effectiveAt,tauByPillar,tierThresholds,titleRules,precision,cumulativePolicy`. Quản trị cấu hình; namespace student-affairs là tên legacy, quyền theo actor nội bộ. Khóa/snapshot không đồng nghĩa đã được giảng viên duyệt. Sửa bản đã dùng → 409 `POLICY_IMMUTABLE`.

## API và DTO yêu cầu

- GIỮ và nâng GET `/api/v1/declarations/me/radar?semester={canonicalCode}` cho theo kỳ, quyền self-only. Trả chính xác kỳ được yêu cầu; kỳ không hợp lệ/thiếu policy báo lỗi rõ, không fallback sang kỳ khác.
- Đề xuất mở rộng cùng route với `scope:CUMULATIVE` và `asOf` (qua query `scope=CUMULATIVE` thay cho semester), không thêm nguồn dữ liệu riêng. Không nhận đồng thời scope CUMULATIVE và semester.
- Trả `radarAxes` đúng sáu mã theo thứ tự, `plusOne` riêng; có `rawPoints,tau,score,tier,hasLeaderProof` cho trục, `D,J,M,ERI,title,policyVersion,formulaVersion,ledgerRevision,asOf,scope,semesterId?`. DTO cũ `pillars` bảy phần được adapter tách rõ khi chuyển đổi, không ép FE vẽ bảy trục.
- GET `/api/users/me/experience-summary` và `/api/users/me/contributions` theo [personal experience](personal-experience-api.md), [đóng góp](verified-contributions-api.md) cung cấp lịch sử/căn cứ. Drill-down theo `pillar` phải giữ nguồn/phiên bản, paging và tổng server-side.
- Mỗi phép tính có `calculationBreakdown:{tierBase,roleMultiplier,scaleMultiplier,cappedRoleScale,resultBonus,rawPoints,pillarWeights,allocatedPoints,policyVersion,formulaVersion,verificationId}`. Snapshot định danh người/nguồn xác thực hiển thị theo quyền; không phát URL minh chứng công khai.

## Đối chiếu số trong PDF

| Ví dụ PDF trang 3 | Điểm chính xác theo công thức | Số in PDF |
| --- | --- | --- |
| T1, Participant, Club, None | 10 | 10 |
| T2, Contributor, Campus, None | 52 | 52 |
| T3, Product, Campus, None | 171.6 | 172 |
| T3, Leader, Campus, None | 312 | 312 |
| T3, Contributor, Campus, None | 124.8 | 125 |
| T4, Contributor, National, Finalist | 686.4 | 686 |
| T5, Contributor, International, None | 1920 | 1920 |
| T5, Product, National, None | 1936 | 1936 |
| T5, Leader, International, RealWorldOutput | 6400 (vai trò×quy mô 12 chặn còn 8) | 6400 |

Các số nguyên trong bảng là hiển thị làm tròn; không sửa công thức để lưu 172 thay 171.6. Ba hồ sơ/đồ thị PDF là minh họa, không có sổ cái/tau đầy đủ để tái tạo chính xác, không dùng làm fixture người thật hoặc suy ra ngưỡng bậc.

## Hiện trạng BE cần sửa trước nghiệm thu

[ExperienceScoringCalculator](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/src/Shared/ClubReportHub.Shared/Experience/ExperienceScoringCalculator.cs#L7) đã có hệ số/điểm thô đúng PDF. [ExperienceIndexCalculator](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/src/Shared/ClubReportHub.Shared/Experience/ExperienceIndexCalculator.cs#L22) đã có bão hòa, D/J/M/ERI và bậc, nhưng ngưỡng/title/default tau là phương án đang có, không phải bằng chứng P01–P06 đã được duyệt.

[BuildStudentRadarAsync](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/src/Services/AdminService/Endpoints/BenchmarkEndpoints.cs#L360) hiện chọn benchmark theo query, đọc mọi khai báo Approved của sinh viên mà chưa lọc kỳ; cộng vào một `FinalCategory ?? Category`; dùng Role để xác định leader proof. Phải thêm liên kết kỳ, vector nhiều trụ cột, thuộc tính đã xác thực và nguồn sổ cái/snapshot. Không coi endpoint tồn tại là F05–F08 đã hoàn thành.

## Ca nghiệm thu

Đối chiếu chín phép tính trên; role×scale bị chặn trước thưởng kết quả; vector 0.4/0.4/0.2 bảo toàn tổng; 4 trụ cột/trùng mã/tổng sai bị từ chối; tau≤0 bị từ chối cấu hình; S=0; sáu trục bằng nhau; một trục duy nhất; chỉ +1; ERI>100 hợp lệ; bổ sung/upgrade bị từ chối giữ điểm cũ; replay/race một nguồn không ghi hai lần; nhiệm vụ hoàn thành không cộng thêm; kỳ trước không bị query kỳ sau cộng lẫn; đổi policy không tính lại lịch sử; Leader proof đúng trụ cột và bị thu hồi; không lộ minh chứng/hồ sơ khác.

</details>
