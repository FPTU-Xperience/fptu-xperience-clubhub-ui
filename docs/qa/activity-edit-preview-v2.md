# Activity workspace — modal, xem trước, lưu

Ngày: 2026-10-16. Flow theo Trang CLB: **Chỉnh sửa → modal → Xem trước → Lưu thay đổi / Hủy**. Đã bỏ form ở bên trái.

- Chỉnh sửa mở V2Modal với bản nhập riêng. Gõ trong modal không thay nội dung trang và không gọi API. Modal có Hủy và Xem trước, không có nút lưu trực tiếp.
- Xem trước kiểm tra trường bắt buộc, thời gian kết thúc sau bắt đầu, rồi đóng modal và áp draft lên trang detail đầy đủ chiều ngang. Header, quick facts và Tổng quan dùng cùng preview.
- Thanh “Bản xem trước chưa lưu” dưới nội dung có Hủy và Lưu thay đổi, theo pattern Trang CLB. Hủy khôi phục dữ liệu đã lưu. Mở lại modal từ preview dùng nội dung preview hiện tại; hủy modal giữ preview trước đó.
- Lưu thay đổi gọi endpoint update hoạt động hiện có. Lỗi giữ preview để sửa/thử lại; thành công xóa preview và tải lại dữ liệu server. Không có persistence local cho nội dung hoạt động.
- Thời gian nhập theo Việt Nam UTC+7, payload UTC. Ảnh bìa tiếp tục dùng CoverImageModal hiện có. Publication bị khóa khi modal/preview còn mở hoặc có ảnh/tài nguyên chưa lưu. Không thêm lại hai nút điều hướng CLB đã bỏ.

## Verification

- Production build đạt; cảnh báo chunk >500KB hiện có.
- Chrome API fixture: modal có Xem trước/không có Save, hủy modal không đổi trang, preview đóng modal và không ghi API, mở lại giữ preview, Hủy preview khôi phục bản đã lưu; chỉ Save ghi API, lỗi giữ preview và thử lại thành công còn dữ liệu sau reload. Kèm regression publication, scope và member denial.
- Đã xem screenshot modal desktop 1440px/mobile 390px và preview toàn trang. Không có pageerror.
- Evidence trong visualization folder của chat: activity-edit-preview-browser-check.cjs, activity-edit-preview-browser-results.json, activity-edit-modal-desktop.png, activity-edit-modal-mobile.png, activity-edit-preview-desktop.png.
- Đây là kiểm tra frontend với fixture, chưa xác nhận cập nhật trên backend thật.
