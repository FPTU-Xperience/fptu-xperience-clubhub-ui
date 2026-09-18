# Feature Specification: Khám phá hoạt động

**Feature Branch**: `003-activity-discovery`  
**Created**: 2026-09-18  
**Status**: Draft  
**Input**: User description: "tạo một page show tất cả các hoạt động public và những hoạt động của câu lạc bộ mà user đang tham gia, dùng UI của bản demo, page CLB của tôi -> hoạt động, đồng thời add thêm 1 section ở page Khám phá, show các hoạt động mà recommend cho user"

## Clarifications

### Session 2026-09-18

- Q: Trang Hoạt động nên hiển thị phạm vi thời gian/trạng thái nào? → A: Chỉ hoạt động sắp diễn ra hoặc đang diễn ra.
- Q: Section hoạt động đề xuất trên Khám phá nên hiển thị bao nhiêu mục trước khi người dùng đi đến danh sách Hoạt động đầy đủ? → A: Tối đa 6 hoạt động, có nút xem tất cả.
- Q: Khi sinh viên chọn một thẻ hoạt động, họ nên xem chi tiết ở đâu? → A: Mở chi tiết trong danh sách, có nút đi tiếp phù hợp.
- Q: Trong chi tiết hoạt động mở tại chỗ, sinh viên có nên đăng ký hoặc hủy đăng ký trực tiếp không? → A: Chỉ xem chi tiết và đi tiếp.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem danh sách hoạt động phù hợp (Priority: P1)

Sinh viên đã đăng nhập mở trang Hoạt động để xem trong một danh sách thống nhất các hoạt động công khai và các hoạt động của những CLB mà mình đang là thành viên, khi hoạt động đó sắp diễn ra hoặc đang diễn ra. Sinh viên có thể tìm kiếm, nhận biết CLB sở hữu hoạt động, thời gian, địa điểm, trạng thái và cách đi tiếp đến ngữ cảnh phù hợp của hoạt động.

**Why this priority**: Đây là giá trị cốt lõi: sinh viên không phải lần lượt mở từng CLB để biết các hoạt động có thể tham gia.

**Independent Test**: Với một tài khoản là thành viên của ít nhất một CLB và có cả hoạt động công khai lẫn hoạt động nội bộ của CLB đó, mở trang Hoạt động và xác nhận từng loại xuất hiện đúng; không xuất hiện hoạt động nội bộ của CLB không tham gia.

**Acceptance Scenarios**:

1. **Given** sinh viên đã đăng nhập, **When** mở trang Hoạt động, **Then** hệ thống hiển thị hoạt động công khai đang được phép xem cùng hoạt động của các CLB mà sinh viên có tư cách thành viên hợp lệ.
2. **Given** một hoạt động chỉ dành cho CLB khác, **When** sinh viên không phải thành viên CLB đó mở trang Hoạt động, **Then** hoạt động không được hiển thị hay suy ra từ kết quả.
3. **Given** danh sách có nhiều hoạt động, **When** sinh viên tìm theo tên, CLB hoặc thông tin hiển thị liên quan, **Then** danh sách chỉ giữ lại các hoạt động khớp trong phạm vi sinh viên được phép xem.
4. **Given** sinh viên chọn một hoạt động, **When** hoạt động thuộc CLB đã tham gia hoặc là công khai, **Then** hệ thống mở chi tiết chỉ đọc ngay trong ngữ cảnh danh sách và chỉ hiển thị lối đi đến ngữ cảnh phù hợp của hoạt động hoặc CLB sở hữu hoạt động, không đăng ký hay hủy đăng ký trực tiếp tại đây.

---

### User Story 2 - Nhận gợi ý hoạt động trên Khám phá (Priority: P2)

Sinh viên mở trang Khám phá và thấy một section hoạt động được đề xuất cho mình, để có thể đi từ gợi ý đến hoạt động hoặc CLB liên quan mà không phải tìm kiếm trước.

**Why this priority**: Gợi ý giúp trang Khám phá dẫn người dùng đến trải nghiệm cụ thể, thay vì chỉ giới thiệu CLB.

**Independent Test**: Với một tài khoản có gợi ý, mở Khám phá và xác nhận section chỉ hiển thị hoạt động được gợi ý mà tài khoản có quyền xem; chọn một thẻ để đi đến điểm đến hợp lệ.

**Acceptance Scenarios**:

1. **Given** sinh viên có hoạt động được đề xuất, **When** mở Khám phá, **Then** section đề xuất hiển thị tối đa 6 hoạt động cùng thông tin đủ để quyết định xem thêm và một lối đi đến danh sách Hoạt động đầy đủ.
2. **Given** sinh viên không có gợi ý khả dụng, **When** mở Khám phá, **Then** section thể hiện trạng thái trống thân thiện và không hiển thị hoạt động ngoài quyền truy cập.
3. **Given** một hoạt động được đề xuất đã không còn khả dụng hoặc quyền thành viên thay đổi, **When** trang được tải lại, **Then** hoạt động đó không còn được hiển thị như một gợi ý khả dụng.

---

### User Story 3 - Hiểu trạng thái dữ liệu (Priority: P3)

Sinh viên nhận được phản hồi rõ ràng khi danh sách đang tải, không có hoạt động, không có quyền xem hoặc không thể tải dữ liệu, và có thể thử lại khi phù hợp.

**Why this priority**: Trạng thái minh bạch tránh việc sinh viên nhầm lỗi dữ liệu với việc không có hoạt động.

**Independent Test**: Mô phỏng lần lượt trạng thái tải, trống, không được phép và lỗi cho trang Hoạt động hoặc section đề xuất, rồi xác nhận mỗi trạng thái có thông điệp phù hợp và thao tác thử lại khi có thể.

**Acceptance Scenarios**:

1. **Given** dữ liệu đang được nạp, **When** sinh viên vào trang hoặc section, **Then** hệ thống thể hiện trạng thái đang tải thay vì dữ liệu cũ hoặc dữ liệu minh họa.
2. **Given** không thể tải dữ liệu, **When** sinh viên xem trang hoặc section, **Then** hệ thống giải thích ngắn gọn và cung cấp cách thử lại mà không thay thế kết quả bằng dữ liệu demo.

### Edge Cases

- Sinh viên chưa tham gia CLB nào vẫn xem được hoạt động công khai nhưng không thấy hoạt động chỉ dành cho thành viên.
- Một hoạt động vừa công khai vừa thuộc CLB sinh viên tham gia chỉ xuất hiện một lần trong danh sách thống nhất.
- Hoạt động bị hủy, kết thúc hoặc bị gỡ giữa hai lần tải được thể hiện theo trạng thái hiện hành hoặc không xuất hiện nếu không còn được phép xem.
- Tìm kiếm không có kết quả, danh sách rỗng và không có gợi ý là các trạng thái phân biệt được với lỗi hoặc không có quyền.
- Việc đổi tài khoản, quyền thành viên hoặc ngữ cảnh phiên làm việc không để lại hoạt động/gợi ý từ người dùng trước.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp trang Hoạt động trong khu vực production V2 cho người dùng đã đăng nhập.
- **FR-002**: Trang Hoạt động MUST hiển thị một danh sách thống nhất gồm (a) mọi hoạt động công khai mà người dùng được phép xem và (b) hoạt động của các CLB mà người dùng hiện là thành viên hợp lệ, với trạng thái sắp diễn ra hoặc đang diễn ra.
- **FR-003**: Hệ thống MUST loại trừ khỏi danh sách mọi hoạt động nội bộ của CLB mà người dùng không có tư cách thành viên hoặc quyền xem hợp lệ.
- **FR-004**: Mỗi hoạt động hiển thị MUST cho biết tối thiểu tên hoạt động, CLB sở hữu, thời gian, địa điểm khi có, trạng thái và thông tin cần thiết để người dùng quyết định xem tiếp.
- **FR-005**: Trang Hoạt động MUST cho phép người dùng tìm kiếm trong tập hoạt động đã được cấp quyền và hiển thị trạng thái khi không có kết quả phù hợp.
- **FR-006**: Khi người dùng chọn một hoạt động, hệ thống MUST mở chi tiết chỉ đọc ngay trong ngữ cảnh danh sách và chỉ hiển thị lối đi đến điểm đến hợp lệ theo quyền của người dùng; trang này MUST NOT đăng ký hoặc hủy đăng ký trực tiếp, và quyền thành viên không được suy diễn chỉ từ giao diện.
- **FR-007**: Bố cục, thẻ hoạt động và hành vi tương tác của trang Hoạt động MUST kế thừa trải nghiệm trực quan của luồng `CLB của tôi -> Hoạt động` trong bản demo, nhưng production MUST không dùng dữ liệu, nhân vật, điều khiển hay thay đổi trạng thái chỉ có ở demo.
- **FR-008**: Trang Khám phá MUST có một section riêng cho tối đa 6 hoạt động được đề xuất cho người dùng hiện tại, đặt sao cho người dùng nhận thấy trước hoặc cùng hành trình khám phá CLB phù hợp, và có lối đi đến danh sách Hoạt động đầy đủ.
- **FR-009**: Section đề xuất MUST chỉ hiển thị hoạt động còn khả dụng và trong phạm vi quyền xem hiện hành của người dùng; mỗi mục MUST dẫn tới điểm đến hợp lệ.
- **FR-010**: Hệ thống MUST nhận danh sách đề xuất đã được sắp xếp/lựa chọn theo người dùng từ nguồn có thẩm quyền; nếu nguồn không trả gợi ý khả dụng, section MUST có trạng thái trống thay vì tự tạo gợi ý không rõ cơ sở.
- **FR-011**: Trang Hoạt động và section đề xuất MUST có các trạng thái tải, trống, không được phép và lỗi riêng biệt; lỗi tải dữ liệu MUST có cách thử lại khi phù hợp và MUST NOT dùng dữ liệu demo thay thế.
- **FR-012**: Dữ liệu hoạt động và gợi ý hiển thị MUST được làm mới hoặc cô lập khi tài khoản, quyền thành viên hay ngữ cảnh phiên thay đổi, để không tiết lộ dữ liệu của người dùng trước.
- **FR-013**: Production MUST chỉ yêu cầu và hiển thị dữ liệu tối thiểu phục vụ việc khám phá hoạt động; không hiển thị danh sách thành viên, thông tin liên hệ riêng tư hoặc dữ liệu nội bộ không cần thiết.

### Key Entities

- **Hoạt động**: Cơ hội hoặc sự kiện do một CLB tổ chức; có tên, CLB sở hữu, thời gian, địa điểm, trạng thái, mức độ công khai và điểm đến hợp lệ cho người xem.
- **Quyền xem hoạt động**: Quyết định phía nguồn dữ liệu xác định một người dùng hiện có được xem một hoạt động hay không, dựa trên tính công khai và tư cách thành viên/quyền liên quan.
- **Tư cách thành viên CLB**: Quan hệ hiện hành giữa người dùng và CLB, quyết định việc hoạt động không công khai của CLB có thể được đưa vào danh sách.
- **Gợi ý hoạt động**: Tập hoạt động cá nhân hóa, đã được nguồn có thẩm quyền chọn và xếp hạng cho một người dùng; chỉ gồm mục người dùng được phép xem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong kiểm thử với dữ liệu có cả hoạt động công khai, hoạt động CLB đã tham gia và hoạt động CLB không tham gia, 100% hoạt động hiển thị nằm trong quyền xem của người dùng và 0 hoạt động nội bộ ngoài quyền bị lộ.
- **SC-002**: Ít nhất 95% người dùng thử nghiệm xác định được hoạt động công khai hoặc hoạt động của CLB mình tham gia và mở được điểm đến hợp lệ trong vòng 60 giây.
- **SC-003**: Với 50 hoạt động được phép xem, thao tác tìm kiếm và chuyển trạng thái kết quả được phản ánh cho người dùng trong vòng 1 giây trong điều kiện sử dụng thông thường.
- **SC-004**: 100% trạng thái tải, trống, không được phép và lỗi đã xác định có thông điệp phân biệt được; không trạng thái lỗi nào hiển thị dữ liệu minh họa như dữ liệu thực.
- **SC-005**: Trong kiểm thử tài khoản có gợi ý, 100% mục ở section đề xuất dẫn tới hoạt động hoặc CLB mà tài khoản vẫn có quyền truy cập tại thời điểm mở.

## Assumptions

- Người dùng đã đăng nhập trước khi truy cập khu vực V2; hoạt động công khai trong phạm vi feature vẫn cần tuân theo chính sách xem của phiên hiện hành.
- “Đang tham gia” nghĩa là tư cách thành viên đã được phê duyệt và còn hiệu lực; đơn đăng ký chờ duyệt không cấp quyền xem hoạt động nội bộ.
- Trang mới là danh mục hoạt động cấp người dùng, khác với không gian quản trị/vận hành hoạt động bên trong từng CLB.
- Thứ tự và lý do chọn gợi ý là trách nhiệm của nguồn dữ liệu có thẩm quyền; feature này không xác định hay tự suy luận thuật toán đề xuất.
- Giao diện demo là tham chiếu về trải nghiệm, không phải nguồn dữ liệu hoặc hành vi production.
- Feature phụ thuộc vào nguồn dữ liệu có thể trả tập hoạt động đã được lọc quyền, trạng thái/điểm đến cần thiết và gợi ý cá nhân hóa; mọi thay đổi hợp đồng hoặc phân quyền cần được thỏa thuận trước khi lập kế hoạch triển khai.

## Out of Scope

- Tạo, chỉnh sửa, hủy, phê duyệt hoặc điểm danh hoạt động.
- Đăng ký hoặc hủy đăng ký hoạt động trực tiếp từ trang Hoạt động hay section đề xuất.
- Định nghĩa thuật toán, tín hiệu hoặc chính sách xếp hạng gợi ý.
- Hiển thị thông tin nội bộ của CLB, danh sách thành viên hoặc dữ liệu liên hệ riêng tư.
- Chuyển các fixture, actor switching, UI lab hay mutation của `/v2/demo` vào production.
