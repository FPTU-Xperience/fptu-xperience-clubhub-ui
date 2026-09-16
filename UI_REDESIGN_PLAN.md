# Kế hoạch UI ClubHub — Chủ CLB & Sinh viên

Ngày: 16/09/2026. Trạng thái: đã triển khai bản preview frontend tại `/demo`, chờ duyệt UI. Chỉ thiết kế web desktop/laptop theo cập nhật của người dùng; không triển khai hay kiểm thử mobile.

## 1. Phạm vi đã chốt

- Thiết kế hai trải nghiệm: Chủ CLB và Sinh viên/thành viên.
- Chỉ frontend, dùng dữ liệu giả có liên kết và thao tác được. Không sửa BE, DB online hoặc cơ chế đăng nhập thật.
- Giữ nguyên trang riêng, route và quyền hiện hữu của các role khác; không thiết kế lại Admin/CTSV/Thủ quỹ.
- Các role khác vẫn được vào khu khám phá và hồ sơ CLB công khai. Không chặn toàn khu mới bằng điều kiện chỉ có hai role.
- Vào nội bộ một CLB theo quyền tại chính CLB đó. Có role khác không đồng nghĩa bị cấm, cũng không tự động được quyền chủ nhiệm. Giữ lối về trang riêng hiện có.
- Bộ chuyển nhân vật demo là công cụ xem mock, tách biệt với đăng nhập thật và không gọi endpoint bypass.

## 2. Kết quả đọc code hiện tại

- `src/App.jsx`: phần lớn trang nghiệp vụ nằm ở route toàn cục như `/activities`, `/reports`, `/finance`; `/clubs` dùng chung layout quản trị và yêu cầu đăng nhập.
- `src/components/Sidebar.jsx`: cùng một danh sách menu, lọc bằng quyền tổng thể; chưa có menu theo CLB đang chọn.
- `src/auth/permissions.js` và `src/context/AuthContext.jsx`: một số quyền kiểm tra `clubAccess.some(...)`, tức có quyền ở ít nhất một CLB. Không nên dùng trực tiếp kết quả này làm quyền thao tác ở mọi CLB trong UI mới.
- `src/pages/ClubsPage.jsx`: chung màn khám phá, xin tham gia, xét đơn và thao tác quản trị.
- `src/pages/ActivitiesPage.jsx`: gọi `api.getActivities()` không truyền CLB; lớp service đã có tham số `clubId` tùy chọn.
- `src/pages/ProfilePage.jsx`: hồ sơ thông thường chủ yếu là thông tin tài khoản và danh sách CLB, chưa phải portfolio đóng góp.
- Đây là nhận xét về cấu trúc frontend, không phải kết luận đã kiểm chứng việc rò dữ liệu của backend.

## 3. Cấu trúc trải nghiệm

### A. Khu khám phá

Thanh điều hướng ngang: Khám phá · Hoạt động mở · CLB của tôi · Hồ sơ/đăng nhập.

- Trang khám phá: giới thiệu ngắn, tìm kiếm, bộ lọc lĩnh vực/lịch sinh hoạt/tuyển thành viên, CLB nổi bật.
- Thẻ CLB: ảnh, logo, tên, mô tả, lĩnh vực, lịch sinh hoạt, trạng thái tuyển; nút Xem CLB.
- Trang giới thiệu từng CLB: ảnh bìa, sứ mệnh, đối tượng phù hợp, lịch sinh hoạt, thành tựu, hoạt động công khai, ban chủ nhiệm và kênh liên hệ công khai.
- Nút chính theo trạng thái: Đăng nhập để tham gia / Gửi đơn / Đang chờ duyệt / Vào CLB / Chưa mở tuyển.
- Đơn tham gia: giới thiệu, lý do, sở thích/kỹ năng phù hợp, thời gian có thể tham gia; có xem lại và rút đơn mock.
- Không đưa danh sách thành viên nội bộ, hồ sơ riêng tư, tài chính hoặc báo cáo chưa công khai ra khu khám phá.

### B. CLB của tôi

- Chỉ hiện CLB người dùng đã được duyệt tham gia hoặc đang được phân công quản lý hợp lệ.
- Mỗi thẻ ghi rõ vai trò tại CLB, lịch sắp tới và thông báo liên quan; có nút Vào CLB.
- Chủ CLB thấy nhóm Đang quản lý trước, sau đó nhóm Đang tham gia; không lặp một CLB hai lần.
- Đơn đang chờ duyệt nằm trong mục Đơn của tôi, chưa mở nội bộ CLB.
- Người chưa tham gia CLB nào có màn hướng dẫn khám phá và chọn sở thích.

### C. Không gian một CLB

Luồng: Khám phá → Giới thiệu CLB → Xin tham gia → Được duyệt → CLB của tôi → Không gian CLB.

- Đường dẫn đề xuất: `/my-clubs/:clubId/...`; CLB trong URL là nguồn xác định ngữ cảnh.
- Header luôn có logo/tên CLB, vai trò hiện tại, bộ chọn học kỳ và nút đổi CLB.
- Bộ đổi CLB chỉ chứa CLB có quyền vào. Không có lựa chọn Tất cả CLB trong không gian nghiệp vụ này.
- Đổi CLB phải đổi menu, số liệu, danh sách, thông báo và trạng thái form; cảnh báo nếu có bản nháp chưa lưu.
- Ví dụ bắt buộc: cùng một sinh viên quản lý F-Code nhưng là thành viên FStyle; vào FStyle không thấy nút duyệt đơn/tạo hoạt động.

## 4. Menu và nội dung theo hai trải nghiệm

| Mục | Chủ CLB | Sinh viên/thành viên |
| --- | --- | --- |
| Trang chủ CLB | Việc cần xử lý, đơn chờ duyệt, lịch sắp tới, đóng góp chờ xác nhận, tình hình thành viên | Bảng tin, lịch đã đăng ký, việc cần làm, tiến bộ cá nhân trong CLB |
| Hoạt động | Tạo/sửa bản nháp, lịch, đăng ký, danh sách tham dự; trạng thái rõ ràng | Khám phá hoạt động CLB, xem chi tiết, đăng ký/hủy theo thời hạn, lịch của tôi |
| Điểm danh | Mở phiên, mã/QR demo, thời gian hiệu lực, danh sách điểm danh | Check-in, kết quả, lịch sử cá nhân; thông báo chưa mở/hết hạn/đã check-in |
| Nhiệm vụ & đóng góp | Tạo nhiệm vụ, nhận minh chứng, xác nhận hoặc yêu cầu bổ sung | Nhận nhiệm vụ, theo dõi tiến độ, nộp minh chứng, xem phản hồi |
| Thành viên | Duyệt đơn, tìm/lọc danh sách, xem hồ sơ và đóng góp trong CLB | Mục Cộng đồng gọn: ban chủ nhiệm, danh bạ chỉ gồm thông tin cho phép chia sẻ |
| Điểm & thành tích | Tra cứu lịch sử ghi nhận, lý do, người xác nhận, tiến bộ thành viên trong CLB | Điểm của tôi, lý do được ghi nhận, huy hiệu, so sánh tiến bộ theo kỳ |
| Quà tặng | Kho quà, tồn kho, điều kiện, yêu cầu đổi/nhận quà | Đổi quà, số dư được dùng, lịch sử, trạng thái chờ nhận/đã nhận |
| Báo cáo | Soạn/xem/nộp bản mock, trạng thái và phản hồi theo CLB/học kỳ | Không có menu quản trị báo cáo; chỉ xem nội dung được CLB công bố |
| Tài chính (tùy chọn) | Chỉ hiện nếu CLB bật tính năng; tổng quan và luồng mock phù hợp quyền | Mặc định ẩn; nếu cần chỉ công khai bản tổng hợp đã được phép |
| Cài đặt CLB | Chỉnh giới thiệu, lịch sinh hoạt, tuyển thành viên, tùy chọn tính năng | Không hiện |

Nhóm sidebar chủ CLB: Tổng quan; Vận hành; Ghi nhận & quà; Báo cáo & cài đặt. Nhóm sidebar thành viên: Tham gia; Hành trình của tôi; Cộng đồng. Thông báo và hồ sơ ở header, tránh kéo dài sidebar.

## 5. Học kỳ và điểm: quy ước cho bản mock

- Học kỳ là bộ lọc dùng chung trong CLB, không cần thành một menu riêng của thành viên.
- Hoạt động, báo cáo và tiến bộ có kỳ; hồ sơ tích lũy và tư cách thành viên không tự mất khi chuyển kỳ.
- Kỳ đã kết thúc hiển thị trạng thái lưu trữ, các thao tác thay đổi liên quan kỳ đó bị vô hiệu hóa trong demo.
- Không xây trang quản lý lịch học kỳ cho role khác trong đợt này.
- Tách ba khái niệm: điểm ghi nhận đóng góp, chỉ số/radar trải nghiệm, số dư đổi quà. Đổi quà không trừ thành tích hay xóa đóng góp.
- Số dư đổi quà mặc định theo CLB; chuyển CLB không cộng gộp số dư. Đây là giả định UI chờ chốt nghiệp vụ.
- Hồ sơ cá nhân có thể tổng hợp hành trình nhiều CLB, nhưng mỗi đóng góp có nhãn nguồn; màn nghiệp vụ bên trong CLB chỉ hiển thị CLB đang mở.

### Khác biệt giữa tài liệu nguồn cần giữ rõ

`FA26SE224.docx` đề xuất rubric XP theo loại CLB, cấp độ và mùa giải. `FPTU_Xperience_De_xuat_he_thong.pdf` đề xuất công thức theo hoạt động, radar sáu trục và hệ số +1 trải nghiệm thực tế, nhấn mạnh tiến bộ của chính sinh viên.

Bản UI đề xuất dùng hồ sơ trải nghiệm và so sánh theo kỳ làm trung tâm; radar 6+1 là khối minh họa có thể bật/tắt, sáu trục và phần +1 tách riêng. Giá trị mẫu ghi rõ là minh họa. Chưa chốt công thức, chưa xây engine và không gộp hai mô hình thành một thang điểm. Không đặt bảng xếp hạng tổng điểm giữa mọi CLB làm trang mặc định. Quà tặng và tài chính được đưa vào theo yêu cầu người dùng, không coi là nghiệp vụ đã được hai tài liệu xác nhận đầy đủ.

## 6. Hồ sơ sinh viên kiểu portfolio

Hiểu tham chiếu akaJob theo hướng hồ sơ năng lực giàu nội dung; không cam kết sao chép bố cục chính xác khi chưa có màn tham chiếu.

- Đầu trang: ảnh bìa, avatar, tên, tiêu đề cá nhân, ngành/khóa/campus; Chỉnh sửa hồ sơ và Xem bản chia sẻ.
- Giới thiệu: mục tiêu, sở thích, kỹ năng, đường dẫn GitHub/portfolio phù hợp.
- Học vấn và kinh nghiệm: ngành, thời gian học, dự án, vai trò, sản phẩm/minh chứng, thành tích và chứng chỉ.
- Hành trình CLB: CLB đã tham gia, thời gian, lịch sử vai trò, đóng góp tiêu biểu và người xác nhận.
- Trải nghiệm: tiến bộ học kỳ hiện tại so với kỳ trước, hoạt động/nhiệm vụ hoàn thành, huy hiệu; có tab tích lũy.
- Timeline đóng góp: ngày, CLB, hoạt động, vai trò, minh chứng và trạng thái Tự khai / Chờ xác nhận / Đã xác nhận.
- Chủ hồ sơ xem đầy đủ; người khác chỉ xem thông tin được chia sẻ. Chủ CLB xem phần phục vụ quản lý tại CLB của mình, không mặc định xem hồ sơ riêng của CLB khác.
- Email, điện thoại, mã sinh viên không công khai mặc định; không yêu cầu địa chỉ nhà, giấy tờ định danh hoặc dữ liệu vị trí thật cho demo.
- Chức năng xuất/chia sẻ xác thực là giai đoạn sau; trong mock có bản xem trước, không giả là chứng nhận đã xác thực bởi trường.

## 7. Định hướng hình ảnh

- Giữ nhận diện FPT và màu cam làm điểm nhấn, nền sáng trung tính, chữ rõ ràng, dùng icon Lucide hiện có.
- Khám phá: ưu tiên ảnh CLB, hoạt động và câu chuyện cộng đồng; thẻ gọn, nội dung có thứ bậc.
- Nội bộ: header gọn, sidebar theo CLB, bảng/danh sách cho công việc quản lý, hành động chính dễ tìm.
- Hồ sơ: bố cục portfolio; desktop thông tin tóm tắt bên trái, nội dung chi tiết bên phải; mobile một cột.
- Thống nhất khoảng cách, kiểu nút, màu trạng thái và form; không dùng chữ in hoa quá nhiều hay gradient cam tràn header.
- Giữ khả năng dùng theme hiện có; kiểm tra tương phản, focus bàn phím, lỗi form, màn nhỏ và giảm chuyển động.
- Kỹ năng thiết kế frontend chỉ định hướng các trang khám phá/giới thiệu; không áp khuôn landing page vào console quản lý dày thông tin.

## 8. Mock data và tương tác

- 6 CLB khám phá, trong đó 3 CLB có dữ liệu nội bộ đủ sâu: công nghệ, nghệ thuật, tình nguyện. Tên và hồ sơ đều là dữ liệu demo, không sao chép DB online.
- Nhân vật xem thử: sinh viên mới; thành viên một CLB; thành viên nhiều CLB; chủ CLB A đồng thời là thành viên B; chủ nhiều CLB; một tài khoản role khác để kiểm tra vẫn vào khu mới và trở về trang riêng.
- 2 học kỳ; ít nhất 3 hoạt động/CLB với trạng thái sắp mở, đang diễn ra, đã hoàn thành; thêm hủy/hết chỗ/trùng lịch.
- Thành viên, đơn chờ duyệt/từ chối, nhiệm vụ và minh chứng, lịch sử điểm, quà còn/hết hàng, yêu cầu đổi quà, báo cáo nháp/chờ duyệt/cần sửa; tài chính bật ở một CLB và tắt ở CLB khác.
- Các số tổng trên dashboard tính từ cùng bộ fixture, không viết số trang trí không khớp danh sách.
- Tương tác có kết quả nhất quán: gửi đơn → chờ duyệt → đổi nhân vật chủ CLB → duyệt → thành viên thấy CLB; đăng ký → check-in → đóng góp → xác nhận → cập nhật tiến bộ; đổi quà → trừ số dư mock và cập nhật tồn kho.
- Có trạng thái loading/empty/error/forbidden và thử lại. Mã QR, vị trí và hạn check-in là mô phỏng được gắn nhãn, không khẳng định chống gian lận thật.
- Dùng mock clock/các mốc thời gian tương đối để bản demo không hết hoạt động ngay sau ngày tạo.
- Tách mock provider/repository; khu demo không gọi API sống, kể cả auth khởi tạo và notification polling. Không dùng token thật hoặc ghi đè khóa localStorage của hệ thống hiện tại.
- Nếu lưu tương tác, dùng namespace riêng và nút Reset demo. Dữ liệu truy vấn theo userId/clubId/semesterId, kiểm tra quan hệ của cả activityId/reportId/memberId trước khi trả kết quả mock.

## 9. Cách triển khai dự kiến trong code hiện có

- Giữ React 18, React Router 6, SCSS/Tailwind, Lucide, Framer Motion; chưa cần thêm framework.
- Thêm các layout riêng cho khám phá và nội bộ CLB; giữ layout/route của các role khác.
- Thêm `ClubWorkspaceContext`, quyền theo CLB và mock repository. Không sửa hàm quyền toàn cục cho các trang cũ một cách hàng loạt.
- Tách chức năng của `ClubsPage` thành khám phá, giới thiệu, CLB của tôi, đơn tham gia và quản lý thành viên theo CLB.
- Tái sử dụng phần trình bày phù hợp từ các trang hoạt động/điểm danh/báo cáo; không chỉ đổi màu trang cũ rồi để nguyên dữ liệu toàn cục.
- Xây hồ sơ thành viên mới bên cạnh `SystemAdminProfile`; không đổi hồ sơ riêng của các role ngoài phạm vi.
- Khu demo có đường vào riêng được bật bằng cấu hình preview; kiểm tra không đè các route hiện hữu, không tự chuyển toàn bộ role khác về trải nghiệm sinh viên.

## 10. Các mốc bàn giao để duyệt

1. **Chốt bố cục và luồng:** khu khám phá, giới thiệu CLB, CLB của tôi, hai homepage theo vai trò, hồ sơ portfolio; kèm đổi nhân vật/đổi CLB. Đây là bản duyệt hình ảnh đầu tiên.
2. **Hoàn thiện thao tác chính:** xin/duyệt tham gia, hoạt động, đăng ký, điểm danh, thành viên, nhiệm vụ và minh chứng.
3. **Hoàn thiện phần bổ sung:** điểm và thành tích, kho/đổi quà, báo cáo, tài chính tùy chọn, học kỳ lưu trữ.
4. **Kiểm tra demo:** dữ liệu liên kết, URL trực tiếp, responsive, bàn phím, trạng thái lỗi/rỗng, route cũ và không gọi BE trong mock.

Sau mỗi mốc duyệt UI mới đi tiếp. Chưa làm tích hợp BE hoặc data server trong bất kỳ mốc nào ở trên.

## 11. Điều kiện nghiệm thu

- Chủ A/thành viên B đổi CLB thấy đúng menu và dữ liệu; không thao tác quản lý B bằng URL trực tiếp.
- Chưa được duyệt không vào nội bộ CLB; CLB của tôi không lẫn CLB chỉ đang xin tham gia.
- Không hiển thị dữ liệu của CLB trước trong lúc đổi CLB; kiểm tra cả drawer/modal, tìm kiếm, bộ lọc và form.
- Điểm, số người tham dự, số đơn chờ, quà tồn kho khớp dữ liệu chi tiết sau thao tác mock.
- Role ngoài phạm vi vẫn truy cập khu công khai và các route riêng như trước; nếu có quyền thành viên tại CLB thì mở được trải nghiệm tương ứng.
- Kiểm tra desktop/laptop 1280px và 1440px trở lên; mobile/tablet nằm ngoài phạm vi bản này.
- Bản preview hiển thị nhãn Dữ liệu minh họa, reset được, không gửi request nghiệp vụ đến server.
- UI guard chỉ phục vụ mô phỏng và trải nghiệm. Kiểm soát truy cập và truy vấn theo CLB ở BE là công việc riêng khi triển khai thật.
