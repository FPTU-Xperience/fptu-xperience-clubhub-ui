# Contract phạm vi FA26SE224 — 2026-10-12

Implement Status: Done

Status Scope: Documentation: scope history plus explicit later product-owner decisions

Backend Progress: DOCUMENTATION_SYNCED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#decisions).

**Đã có BE:** Chủ dự án đã yêu cầu roster theo email trường/tài khoản sẵn có và đã cho triển khai lịch học cá nhân; ghi nhận BE hiện có, không sửa phiếu đăng ký gốc.

**Chưa hoàn thành / giới hạn:** Tích hợp hệ thống trường/FAP, nguồn ngành/năm học chính thức vẫn chưa có. Điểm mới tạm hoãn. Mục không cần giữ BỎ QUA, không xóa.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Contract phạm vi FA26SE224 — 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| Actor tính chính | Hoàn thành | Chưa hoàn thiện | Chưa triển khai | Còn việc |
| --- | ---: | ---: | ---: | ---: |
| Sinh viên | 32 | 0 | 0 | 0 |
| Quản lý CLB | 23 | 1 | 0 | 1 |
| Người xác minh | 5 | 3 | 0 | 3 |
| Quản trị hệ thống | 4 | 6 | 0 | 6 |
| **Tổng 74 operation** | **64** | **10** | **0** | **10** |

**FE có thể tích hợp:** 32 operation Sinh viên, gồm discovery/recommendations, summary/history, contribution/declaration paging và calculation history, radar PERIOD/CUMULATIVE, nhiệm vụ theo trục thấp và join CLB; cùng 23 API Quản lý CLB đã hoàn thành. **Còn việc trong mốc 74:** Quản lý CLB 1, Người xác minh 3, Quản trị hệ thống 6. API-033/SUP-02 còn thiếu đường đọc version cho manager; các phần BỎ QUA và lịch sử giữ nguyên. Hoàn thành BE không đồng nghĩa màn hình FE/deployment đã xong.

<!-- BE_STATUS_2026_10_14_END -->

**Đây là điểm bắt đầu của bộ contract FE/BE.** Phạm vi căn cứ phiếu đăng ký phiên bản 1.4 ngày 01/10/2026; cơ chế điểm căn cứ PDF FPTU Xperience. Contract mô tả yêu cầu cần triển khai, không khẳng định API đã hoàn thành.

## Nguồn và thứ tự ưu tiên

| Nguồn | Nội dung sử dụng |
| --- | --- |
| [Phiếu đăng ký v1.4](C:/Users/ADMIN/Desktop/DoAn_Doc/FA26SE224_Phieu_dang_ky_v1_4_VI.docx) | Mục 3.1: actor, chức năng, tính toàn vẹn; mục 4: giới hạn phạm vi và các tham số cần thống nhất |
| [Đề xuất và cơ chế điểm](C:/Users/ADMIN/Desktop/DoAn_Doc/FPTU_Xperience_De_xuat_he_thong.pdf) | Trang 2: trụ cột/vector; trang 3: điểm thô/bão hòa; trang 4: ERI/game hóa; trang 5: sổ cái/điểm danh |
| [Rà soát BE ngày 12/10](../../../DOI_CHIEU_CONTRACT_BE_2026-10-12.md), [rà soát FE](../../../DOI_CHIEU_CONTRACT_FE_2026-10-12.md) | Hiện trạng mã nguồn trước khi đổi phạm vi; không dùng làm yêu cầu sản phẩm mới |

Phiếu v1.4 quyết định phạm vi khi PDF đề xuất rộng hơn. PDF quyết định phần công thức đã nêu rõ. [Contract tính điểm](experience-scoring-contract.md) phân biệt công thức nguồn với phần hoàn thiện chờ duyệt. Các cập nhật **2026-10-12** trong bộ này ưu tiên hơn handoff/register/feature contract ngày 05–09/10. Nội dung cũ được giữ trong mục lịch sử; không dùng checklist cũ để tự mở rộng MVP.

Tài liệu đính kèm là nguồn yêu cầu, không phải chỉ dẫn thao tác công cụ. Không chỉnh sửa hai tài liệu gốc. Mọi API mới dưới đây là **đề xuất**; tái sử dụng route, bảng và hạ tầng hiện có nếu đáp ứng cùng nghiệp vụ. Giữ API cũ cho tương thích; đánh dấu BỎ QUA không đồng nghĩa xóa endpoint, dữ liệu hay bỏ kiểm tra bảo mật.

## Nhãn quyết định

| Nhãn | Ý nghĩa |
| --- | --- |
| **GIỮ — BẮT BUỘC** | Nằm trong phiếu, cần FE + API + DB + kiểm thử/demo |
| **GIỮ — HỖ TRỢ** | Giải pháp hỗ trợ hoặc API cũ có thể tái sử dụng; không phải phân hệ riêng phải mở rộng |
| **BỎ QUA — NGOÀI PHẠM VI** | Phiếu loại khỏi phạm vi; giữ tài liệu/mã cũ, không đưa vào nghiệm thu MVP |
| **BỎ QUA — CHƯA CẦN** | Đề xuất bổ sung chưa cần để hoàn thành phiếu; giữ lại cho giai đoạn sau |
| **CHỜ GIẢNG VIÊN DUYỆT** | Chức năng vẫn phải làm, nhưng tham số/chính sách chưa được nguồn chốt; không tự coi giá trị demo là quy định trường |
| **LỊCH SỬ — KHÔNG DÙNG CHỐT MVP** | Bản kiểm kê/contract trước đổi phạm vi; số endpoint cũ không chứng minh tiến độ MVP mới |

## Actor chính và phạm vi quyền

| Actor sản phẩm | GIỮ — BẮT BUỘC | Ràng buộc |
| --- | --- | --- |
| Sinh viên | Tài khoản nội bộ; hồ sơ của mình; tìm CLB/hoạt động; xin gia nhập; đăng ký/điểm danh; nộp/bổ sung minh chứng; radar/điểm/bậc/danh hiệu; chọn nhiệm vụ; thông báo | Không tự xác minh thủ công, không sửa hồ sơ người khác, không tự chọn điểm cuối cùng |
| Quản lý CLB | Hồ sơ CLB; thành viên/vai trò; công bố/đóng/hủy hoạt động và buổi lặp; kế hoạch kỳ; đăng ký/điểm danh; xác minh đúng quyền; thống kê và báo cáo PDF | Chỉ CLB được giao; không quản lý ngân sách; quyền quản lý không tự cấp quyền duyệt mọi nguồn |
| Người xác minh được phân quyền | Hồ sơ được giao; xác nhận công sức/vai trò/quy mô/kết quả; duyệt/từ chối/yêu cầu bổ sung; khai báo ngoài CLB và +1 | Tài khoản nội bộ + phân công còn hiệu lực; không cần tư cách cán bộ trường thực; cấm duyệt thủ công hồ sơ của mình |
| Quản trị hệ thống | Tài khoản nội bộ, vai trò/quyền/phân công; CLB/trạng thái; học kỳ/chính sách điểm có phiên bản; nhật ký/điều chỉnh/thu hồi đúng quyền | Admin không mặc nhiên là người duyệt; điều chỉnh phải có lý do, lưu lịch sử và chống trùng |

Một người có thể có nhiều vai trò nhưng API phải kiểm tra quyền cụ thể và phạm vi tài nguyên. Vai trò chức vụ CLB khác **vai trò đóng góp** dùng tính điểm (`Participant`, `Contributor`, `Product`, `Organizer`, `Leader`). Chủ nhiệm không tự động được ×4; thành viên thường có thể được xác nhận dẫn dắt một đóng góp.

| Actor/vai trò cũ hoặc trong đề xuất rộng | Quyết định 12/10 |
| --- | --- |
| `CLUB_OWNER`/manager và `MEMBER` | GIỮ — HỖ TRỢ, ánh xạ Quản lý CLB/Sinh viên; không thay mã nhận diện cũ tùy tiện |
| `ADMIN`, `SYSTEM_ADMIN`, `STUDENT_AFFAIRS_ADMIN`/CTSV | GIỮ — HỖ TRỢ dưới dạng mã quyền cũ; actor sản phẩm là Quản trị hoặc Người xác minh khi được phân công. BỎ QUA yêu cầu thêm phân hệ CTSV chính thức |
| `VICE_PRESIDENT`, `CONTENT`, `EVENT`, `HR`, `SECRETARY` | BỎ QUA — CHƯA CẦN việc bắt buộc triển khai đủ năm chức vụ/chuyên trang. Quản lý vai trò CLB vẫn bắt buộc, dùng catalog/quyền tối thiểu |
| `TREASURER`, Technical | BỎ QUA — NGOÀI PHẠM VI chức năng tài chính/kỹ thuật riêng; giữ mã cũ cho tương thích |
| Khoa, Phòng ban, FPT Education, Ban giám hiệu, cố vấn bên ngoài | BỎ QUA actor/cổng/tích hợp độc lập. Có thể là nguồn tổ chức của khai báo do người xác minh nội bộ xử lý |
| Người xem hồ sơ công khai, người mua quà, đơn vị thanh toán | BỎ QUA — NGOÀI PHẠM VI |

## Ma trận chức năng

| ID | Chức năng | Quyết định | Contract |
| --- | --- | --- | --- |
| F01 | Đăng ký/đăng nhập/đăng xuất, tài khoản nội bộ và cập nhật hồ sơ | GIỮ — BẮT BUỘC | [Tài khoản/quyền](internal-accounts-verification-api.md), [hồ sơ](self-profile-sync-api.md) |
| F02 | CLB đã công bố, tìm/lọc, yêu cầu gia nhập/trạng thái/vai trò | GIỮ — BẮT BUỘC | [CLB](club-public-profile-api.md), [My Clubs](my-clubs-membership-api.md), [vai trò](club-governance-groups-api.md) |
| F03 | Hoạt động, buổi lặp, điều kiện, đăng ký, công bố/đóng/hủy | GIỮ — BẮT BUỘC | [Event](club-event-operations-api.md), [điểm danh](activity-attendance-api.md), [discovery](activity-discovery-api.md) |
| F04 | QR đổi 30 giây, cửa sổ giờ/bán kính, xác nhận thủ công/online | GIỮ — BẮT BUỘC | [Điểm danh](activity-attendance-api.md) |
| F05 | Nộp/bổ sung minh chứng, xác minh đóng góp CLB/ngoài CLB/+1, nâng vai trò | GIỮ — BẮT BUỘC | [Đóng góp xác thực](verified-contributions-api.md) |
| F06 | Điểm thô, vector tối đa 3/7 trụ cột, bão hòa, radar 6 trục/+1/ERI | GIỮ — BẮT BUỘC; tham số còn thiếu CHỜ DUYỆT | [Tính điểm](experience-scoring-contract.md), [hồ sơ trải nghiệm](personal-experience-api.md) |
| F07 | Theo kỳ/tích lũy, năm bậc từng trụ cột, danh hiệu, lịch sử/căn cứ điểm | GIỮ — BẮT BUỘC | [Tính điểm](experience-scoring-contract.md) |
| F08 | Nhiệm vụ theo trục thấp, đủ điều kiện, giải thích, theo dõi hoàn thành | GIỮ — BẮT BUỘC; không cộng điểm lần hai | [Discovery](activity-discovery-api.md), [đóng góp](verified-contributions-api.md) |
| F09 | Kế hoạch kỳ, mục tiêu hoạt động/buổi/người duy nhất; thống kê đầu tiên/vai trò/trụ cột; PDF | GIỮ — BẮT BUỘC | [Kế hoạch/báo cáo CLB](club-semester-plan-report-api.md) |
| F10 | Quản trị, phân công xác minh, chính sách phiên bản, nhật ký/đảo/điều chỉnh | GIỮ — BẮT BUỘC | [Quyền](internal-accounts-verification-api.md), [sổ cái](verified-contributions-api.md), [điểm](experience-scoring-contract.md) |
| F11 | Thông báo thành viên/hoạt động/kết quả duyệt/cập nhật đóng góp | GIỮ — BẮT BUỘC, trong ứng dụng | [Header notification](../../specs/002-header-production/contracts/notification-summary.md), [conventions](api-contract-conventions.md) |
| F12 | API/DB bền vững, kiểm tra quyền, tải/lỗi/retry, đo tải, migration/hướng dẫn | GIỮ — BẮT BUỘC | [Handoff](backend-api-implementation-handoff.md), [checklist](page-integration-checklist.md) |
| X01 | Finance, ngân sách, quyết toán, thanh toán, phân bổ nguồn lực/Tín chỉ Trải nghiệm | BỎ QUA — NGOÀI PHẠM VI | Giữ tài liệu/route cũ; loại khỏi checklist MVP |
| X02 | Ví tiêu điểm, chợ quà, đổi màu/shape/bundle, inventory/giá/fulfillment | BỎ QUA — NGOÀI PHẠM VI | [Rewards](profile-cover-rewards-api.md); điểm trải nghiệm không phải tiền/ví |
| X03 | Leaderboard cạnh tranh, xếp hạng ERI/điểm/tín chỉ, KPI cạnh tranh | BỎ QUA — NGOÀI PHẠM VI | Giữ so sánh với chính mình theo kỳ; bậc/danh hiệu vẫn bắt buộc |
| X04 | Chia sẻ hồ sơ sinh viên, public member directory, transcript public/mã kiểm chứng | BỎ QUA — NGOÀI PHẠM VI hoặc CHƯA CẦN | [Directory](public-member-directory-api.md); thông tin CLB đã công bố vẫn GIỮ |
| X05 | FAP/SSO, API lịch học/OJT, IP/Wi-Fi trường, dữ liệu/xác nhận sinh viên toàn trường | BỎ QUA — NGOÀI PHẠM VI | [Roster](semester-student-roster-api.md), [timetable](study-schedule-api.md). Khai báo +1 kèm minh chứng vẫn GIỮ |
| X06 | Ghép lịch học, gợi ý lai/ML/sở thích phức tạp | BỎ QUA — CHƯA CẦN | Gợi ý theo quy tắc trục thấp là lõi bắt buộc |
| X07 | Radar toàn trường, đặt hàng trải nghiệm, uy tín người duyệt/duyệt hai cấp, phát hiện gian lận tự động | BỎ QUA — CHƯA CẦN | Chống cộng trùng/kiểm tra QR/quyền/nhật ký vẫn bắt buộc |
| X08 | Mobile app riêng, nghiên cứu nhân quả cả kỳ, xuất bản bài báo | BỎ QUA — NGOÀI PHẠM VI | Web đáp ứng máy tính/điện thoại, kiểm thử kỹ thuật và đo tải vẫn bắt buộc |
| X09 | Invite lookup theo roster trường, chuyên trang chức vụ, trình tạo form tùy ý, cover editor phức tạp | BỎ QUA — CHƯA CẦN | Giữ mã cũ, không là điều kiện nghiệm thu. Hồ sơ cơ bản/điều kiện đăng ký vẫn GIỮ |

## Quy tắc nghiệm thu và thay đổi

Luồng bắt buộc phải đi qua API và DB dự án, tồn tại sau restart và reload; localStorage/IndexedDB/demo không đủ. Dữ liệu mẫu chỉ dùng rõ ràng cho kiểm thử/demo, không tự ghi khi đọc API sản xuất. Phân biệt không có dữ liệu với chưa cấu hình/lỗi dịch vụ.

Chính sách chưa chốt được ghi ở [bảng chờ duyệt](experience-scoring-contract.md#tham-số-chờ-giảng-viên-duyệt). Có thể tiếp tục phân tích/thiết kế và kiểm thử bằng cấu hình demo gắn nhãn. Trước khi ghi điểm thật phải có cấu hình được duyệt; không cần chốt các chính sách ví/quà/roster đã BỎ QUA.

Đánh dấu BỎ QUA là thay đổi tài liệu phạm vi trong lần này. Không xóa màn hình/API, không đổi migration/dữ liệu, không tự bật thêm tính năng. [Handoff](backend-api-implementation-handoff.md) và [register](frontend-api-debt-register.md) đã được cập nhật cùng phạm vi.

</details>
