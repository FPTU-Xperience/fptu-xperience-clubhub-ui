# Feature Specification: Chọn câu lạc bộ của tôi

**Feature Branch**: `004-my-club-selection`  
**Created**: 2026-09-18  
**Status**: Draft  
**Input**: User description: "migrate page chọn câu lạc bộ của page 'CLB của tôi' từ demo UI sang v2 UI, follow theo các component khác, giữ nguyên UI của bản demo, follow theo các component đã migrate trước đó rồi"

## Clarifications

### Session 2026-09-18

- Q: Khi đơn tham gia còn chờ duyệt, người dùng có được rút đơn trực tiếp từ trang “CLB của tôi” không? → A: Giữ nút rút đơn và thực hiện rút đơn qua production API.
- Q: Khi người dùng chọn “Vào không gian CLB” nhưng workspace production của CLB chưa được migrate, feature này cần xử lý thế nào? → A: Điều hướng tới route workspace production theo CLB, kể cả khi route hiện là trang trống; nội dung workspace sẽ được migrate sau.
- Q: Khi một CLB có nhiều hoạt động sắp tới, thẻ CLB nên hiển thị hoạt động nào? → A: Hoạt động sắp diễn ra gần nhất trong phạm vi quyền xem.
- Q: Nếu production chưa trả được số đơn đang chờ của một quản lý CLB, thẻ CLB phải hiển thị thế nào? → A: Hiển thị thông điệp “Đơn tham gia đang cập nhật”, không hiển thị số đoán.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chọn không gian CLB đang tham gia (Priority: P1)

Người dùng đã đăng nhập mở mục “CLB của tôi” để nhìn thấy các CLB mà mình đang có tư cách thành viên hợp lệ, nhận biết vai trò tại từng CLB và chọn đúng không gian CLB để tiếp tục công việc.

**Why this priority**: Đây là điểm vào riêng tư từ điều hướng chính tới các không gian CLB của người dùng; thiếu màn này khiến người dùng không biết CLB nào mình có thể truy cập.

**Independent Test**: Với một tài khoản có ít nhất hai tư cách thành viên được phê duyệt, mở `/v2/my-clubs`, xác nhận mỗi CLB được phép xem xuất hiện một lần với vai trò đúng, rồi chọn một CLB và xác nhận đi đến điểm đến production hợp lệ của CLB đó.

**Acceptance Scenarios**:

1. **Given** người dùng có một hoặc nhiều tư cách thành viên được phê duyệt, **When** mở “CLB của tôi”, **Then** hệ thống hiển thị một thẻ cho mỗi CLB trong phạm vi quyền hiện hành của người dùng.
2. **Given** người dùng có vai trò quản lý tại một CLB, **When** xem thẻ CLB đó, **Then** thẻ thể hiện vai trò quản lý và thông tin tác vụ liên quan mà người dùng được phép biết; nếu số đơn chờ chưa được production cấp, thẻ hiển thị “Đơn tham gia đang cập nhật” thay vì một số suy đoán.
3. **Given** người dùng có vai trò thành viên tại một CLB, **When** xem thẻ CLB đó, **Then** thẻ thể hiện vai trò thành viên mà không hiển thị số liệu quản lý hoặc dữ liệu của CLB khác.
4. **Given** người dùng chọn “Vào không gian CLB” trên một thẻ, **When** người dùng vẫn được cấp quyền, **Then** hệ thống điều hướng đến route workspace production của CLB đã chọn, kể cả khi nội dung workspace chưa được migrate, và không mở `/v2/demo`.

---

### User Story 2 - Theo dõi hoạt động và đơn tham gia cá nhân (Priority: P2)

Người dùng xem nhanh hoạt động sắp tới của từng CLB đang tham gia và các đơn tham gia do mình gửi, để biết việc nào cần chú ý mà không phải vào dữ liệu của cộng đồng khác.

**Why this priority**: Các tín hiệu ngắn gọn này là một phần của UI demo được giữ lại và giúp người dùng chọn CLB với đủ ngữ cảnh.

**Independent Test**: Với dữ liệu có hoạt động sắp tới và các đơn ở nhiều trạng thái, mở trang và xác nhận chỉ hoạt động/đơn thuộc người dùng hiện tại được hiển thị, với trạng thái dễ phân biệt.

**Acceptance Scenarios**:

1. **Given** một CLB có một hoặc nhiều hoạt động sắp tới mà người dùng được phép xem, **When** người dùng xem thẻ CLB, **Then** thẻ hiển thị hoạt động sắp diễn ra gần nhất cùng tiêu đề, thời gian và địa điểm khi các thông tin đó có sẵn; nếu không có hoạt động khả dụng, thẻ thể hiện rằng lịch đang cập nhật.
2. **Given** người dùng có đơn tham gia, **When** mở trang, **Then** khu vực “Đơn tham gia của tôi” chỉ liệt kê các đơn của người dùng đó cùng CLB và trạng thái hiện hành.
3. **Given** người dùng không có đơn tham gia, **When** mở trang, **Then** khu vực đơn có trạng thái trống thân thiện.
4. **Given** người dùng có đơn đang chờ duyệt và server xác nhận đơn còn có thể rút, **When** người dùng chọn rút đơn, **Then** hệ thống rút đúng đơn qua production API và làm mới trạng thái đơn mà không tác động đến đơn khác.

---

### User Story 3 - Hiểu trạng thái truy cập và dữ liệu (Priority: P3)

Người dùng nhận được phản hồi rõ ràng khi danh sách CLB, hoạt động tóm tắt hoặc đơn tham gia đang tải, trống, không được phép xem hay không thể tải, thay vì nhìn thấy dữ liệu minh họa hoặc dữ liệu từ phiên trước.

**Why this priority**: Màn hình xử lý dữ liệu riêng tư theo người dùng; trạng thái trung thực bảo vệ quyền riêng tư và giảm nhầm lẫn.

**Independent Test**: Mô phỏng lần lượt trạng thái tải, trống, không được phép và lỗi cho dữ liệu của trang, rồi xác nhận thông điệp tương ứng và thao tác thử lại (nếu phù hợp) hoạt động mà không làm mất ngữ cảnh.

**Acceptance Scenarios**:

1. **Given** người dùng không có tư cách thành viên được phê duyệt, **When** mở “CLB của tôi”, **Then** hệ thống hiển thị trạng thái trống theo UI tham chiếu và lối đi production để khám phá CLB.
2. **Given** nguồn dữ liệu không cấp quyền hoặc trả lỗi, **When** người dùng mở trang, **Then** hệ thống hiển thị trạng thái không được phép hoặc lỗi riêng biệt và không thay thế bằng fixture demo.
3. **Given** người dùng đổi tài khoản, đăng xuất hoặc quyền thành viên thay đổi, **When** trang được tải lại hoặc làm mới ngữ cảnh, **Then** dữ liệu của người dùng/ngữ cảnh trước không còn hiển thị.

### Edge Cases

- Một người dùng vừa là thành viên vừa là quản lý ở các CLB khác nhau chỉ thấy vai trò và dữ liệu tương ứng với từng CLB.
- CLB bị thu hồi tư cách thành viên hoặc không còn khả dụng giữa hai lần tải không còn xuất hiện như một lựa chọn truy cập.
- Không có hoạt động sắp tới, thiếu địa điểm/thời gian, hoặc không có đơn tham gia là trạng thái dữ liệu hợp lệ, khác với lỗi tải.
- Một route workspace production chưa có nội dung migrated có thể là trang trống tạm thời; route đó vẫn không được chuyển người dùng sang demo. Nếu quyền bị từ chối sau khi chọn, route production phải cung cấp phản hồi rõ ràng.
- Thay đổi phiên trong khi dữ liệu đang tải không được phép hiển thị kết quả trả muộn của phiên cũ.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp trang production V2 “CLB của tôi” tại `/v2/my-clubs` cho người dùng đã đăng nhập.
- **FR-002**: Trang MUST giữ nguyên cấu trúc trực quan, nội dung định hướng, thẻ CLB, nhãn vai trò, khối hoạt động sắp tới, khu vực đơn tham gia và trạng thái trống của UI demo đã được duyệt, phù hợp với các component production V2 đã migrate.
- **FR-003**: Trang MUST chỉ hiển thị CLB mà người dùng hiện tại có tư cách thành viên được phê duyệt hoặc quyền quản lý hợp lệ; quyền phải do nguồn dữ liệu có thẩm quyền quyết định.
- **FR-004**: Mỗi thẻ CLB MUST hiển thị tối thiểu nhận diện CLB, tên, vai trò hiện hành, lời nhắc phù hợp với vai trò và tóm tắt hoạt động sắp tới khi được phép/có sẵn; khi có nhiều hoạt động, tóm tắt MUST dùng hoạt động sắp diễn ra gần nhất trong phạm vi quyền xem.
- **FR-005**: Thẻ của quản lý MUST chỉ hiển thị số đơn đang chờ của chính CLB đó khi nguồn dữ liệu cho phép; nếu số này chưa được cấp, thẻ MUST hiển thị “Đơn tham gia đang cập nhật” thay vì số suy đoán. Thẻ thành viên MUST NOT suy ra hoặc lộ số liệu quản lý.
- **FR-006**: Tác vụ vào không gian CLB MUST điều hướng đến route workspace production theo CLB đã chọn, kể cả khi route đó chưa có nội dung migrated; route MUST kiểm tra quyền ở phía nguồn dữ liệu và MUST NOT liên kết, chuyển hướng hoặc dựa vào route, actor, fixture hay mutation của `/v2/demo`.
- **FR-007**: Trang MUST hiển thị khu vực đơn tham gia chỉ của người dùng hiện tại, gồm nhận diện CLB, lý do khi có thể hiển thị an toàn và trạng thái hiện hành; với đơn đang chờ mà backend xác nhận còn có thể rút, trang MUST hiển thị thao tác rút đơn và thực hiện thao tác đó qua production API.
- **FR-008**: Trang MUST cung cấp các trạng thái tải, trống, không được phép, hết phiên và lỗi riêng biệt cho dữ liệu riêng tư; lỗi có thể thử lại MUST cho phép thử lại mà không sử dụng dữ liệu demo làm fallback.
- **FR-009**: Khi tài khoản, phiên, quyền CLB hoặc route thay đổi, trang MUST làm mới hoặc cô lập danh sách CLB, hoạt động tóm tắt và đơn để không hiển thị dữ liệu của người dùng hoặc CLB trước.
- **FR-010**: Lối đi “Khám phá thêm” và lối đi từ trạng thái trống MUST chỉ dẫn đến các trang production có sẵn, phù hợp quyền xem của người dùng.
- **FR-011**: Mọi điều khiển và lối đi trên trang MUST có nhãn có nghĩa, dùng được bằng bàn phím và không bị che khuất hoặc cần cuộn ngang ở baseline desktop 1060px.
- **FR-012**: Production MUST chỉ yêu cầu/hiển thị thông tin tối thiểu để người dùng chọn CLB, xem tóm tắt hoạt động và theo dõi đơn của mình; không lộ danh sách thành viên, thông tin liên hệ riêng tư hay dữ liệu vận hành không cần thiết.

### Key Entities

- **Lựa chọn CLB của tôi**: Một CLB mà người dùng hiện tại được phép vào, gồm nhận diện hiển thị an toàn, vai trò hiện hành, tóm tắt hoạt động và điểm đến production.
- **Tư cách thành viên hợp lệ**: Quan hệ hiện hành do server xác nhận giữa người dùng và một CLB, xác định CLB có thể xuất hiện và vai trò hiển thị.
- **Tóm tắt hoạt động sắp tới**: Thông tin tối thiểu, trong phạm vi quyền xem, về hoạt động sắp diễn ra gần nhất của một CLB để hỗ trợ quyết định vào không gian CLB.
- **Đơn tham gia của tôi**: Đơn do người dùng hiện tại gửi tới một CLB, cùng trạng thái hiện hành và thông tin hiển thị được phép.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong kiểm thử với các CLB có vai trò khác nhau, 100% thẻ CLB hiển thị đúng CLB và vai trò của người dùng hiện tại; 0 CLB hoặc số liệu quản lý ngoài quyền bị lộ.
- **SC-002**: Ít nhất 95% người dùng thử nghiệm có thể xác định một CLB của mình và mở điểm đến production hợp lệ trong vòng 30 giây.
- **SC-003**: Trong kiểm thử dữ liệu có/không có hoạt động và đơn, 100% trạng thái lịch đang cập nhật, không có đơn và không có CLB được phân biệt với trạng thái lỗi hoặc không được phép.
- **SC-004**: Trong kiểm thử đổi tài khoản/quyền khi yêu cầu đang chạy, 100% lần chuyển ngữ cảnh không hiển thị kết quả từ người dùng hoặc CLB trước.
- **SC-005**: Ở viewport desktop từ 1060px, 100% điều khiển và điểm đến chính trên trang có thể nhìn thấy, thao tác được bằng chuột hoặc bàn phím, không cần cuộn ngang.

## Assumptions

- UI demo “CLB của tôi” là tham chiếu trực quan được duyệt; migration giữ trải nghiệm này thay vì thiết kế lại.
- Chỉ các tư cách thành viên đã được phê duyệt/còn hiệu lực và quyền quản lý hợp lệ cấp quyền xuất hiện trên trang; đơn chờ duyệt không cấp quyền vào workspace.
- Các component production V2 hiện có về shell, header, page state, card và dữ liệu có thẩm quyền là convention cần theo; không import component/state demo vào production.
- `getMyMemberships`, quyền CLB hiện có và dữ liệu CLB công khai là các nguồn hiện hữu để xác định danh sách/nhận diện; contract cần bổ sung hoặc xác nhận trước planning cho tóm tắt hoạt động, số đơn đang chờ theo CLB, quyền rút đơn và thao tác rút đơn production. Nếu số đơn chờ không khả dụng, UI dùng trạng thái “Đơn tham gia đang cập nhật”.
- Workspace production `/v2/my-clubs/:clubId` là điểm đến của lối đi chính. Feature này chỉ cần điều hướng production đến route đó; nội dung workspace có thể là trang trống tạm thời và sẽ được migrate sau, không thay bằng `/v2/demo`.

## Out of Scope

- Migration hoặc xây mới toàn bộ workspace vận hành bên trong từng CLB.
- Tạo, duyệt, từ chối, chỉnh sửa hoặc quản lý đơn thành viên; việc rút đơn đang chờ của chính người dùng theo FR-007 là ngoại lệ duy nhất.
- Định nghĩa thuật toán hoặc lịch sử đầy đủ của hoạt động.
- Đưa UI lab, actor switching, fixture, demo notification hay demo mutation vào production.
