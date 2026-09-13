# ClubReportHub - Tài liệu Tổng hợp Chức năng

## Mục lục

1. [Tổng quan dự án](#tổng-quan-dự-án)
2. [Cấu trúc Frontend](#cấu-trúc-frontend)
3. [Các chức năng chính](#các-chức-năng-chính)
4. [API Integration](#api-integration)
5. [Authentication & Authorization](#authentication--authorization)

---

## Tổng quan dự án

**ClubReportHub** là hệ thống quản lý câu lạc bộ (Club Management System) dành cho trường học/đại học. Hệ thống cho phép:

- Quản lý câu lạc bộ (CLUB MANAGEMENT)
- Quản lý báo cáo hoạt động (REPORT MANAGEMENT)
- Quản lý tài chính (FINANCE MANAGEMENT)
- Quản lý hoạt động/sự kiện (ACTIVITY MANAGEMENT)
- Theo dõi KPIs và thống kê
- Thông báo và cập nhật tin tức

---

## Cấu trúc Frontend

```
src/
├── components/     # Reusable UI components
│   ├── Header.jsx       # Navigation header
│   ├── Layout.jsx       # Main layout wrapper
│   ├── Modal.jsx        # Reusable modal
│   ├── Sidebar.jsx      # Sidebar navigation
│   └── StatCard.jsx     # Statistics card
├── pages/         # Page components
│   ├── LoginPage.jsx         # Đăng nhập
│   ├── RegisterPage.jsx       # Đăng ký
│   ├── DashboardPage.jsx     # Trang chủ/Tổng quan
│   ├── ClubsPage.jsx         # Quản lý CLB
│   ├── ReportsPage.jsx       # Quản lý báo cáo
│   ├── ActivitiesPage.jsx    # Quản lý hoạt động
│   ├── FinancePage.jsx       # Quản lý tài chính
│   ├── ProfilePage.jsx       # Hồ sơ cá nhân
│   └── NotificationsPage.jsx # Thông báo
├── services/
│   └── api.js         # API service layer
├── contexts/
│   ├── AuthContext.jsx  # Authentication state
│   └── ToastContext.jsx # Toast notifications
├── hooks/
│   └── useLocalStorage.js
└── utils/
```

---

## Các chức năng chính

### 1. Authentication (Xác thực)

#### Đăng nhập (LoginPage)
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Email/Password** | Nhập email và mật khẩu để truy cập hệ thống |
| **Validation** | Kiểm tra định dạng email, bắt buộc nhập password |
| **Remember Me** | Lưu trạng thái đăng nhập (checkbox) |
| **Error Handling** | Hiển thị thông báo lỗi khi đăng nhập thất bại |
| **Loading State** | Trạng thái loading khi đang xử lý |
| **Redirect** | Chuyển hướng sang Dashboard sau khi đăng nhập thành công |

#### Đăng ký (RegisterPage)
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Multi-step Form** | Form 3 bước: Thông tin cá nhân → Mật khẩu → Chọn Club |
| **Validation từng bước** | Validate từng step trước khi chuyển tiếp |
| **Password Requirements** | Yêu cầu password tối thiểu 8 ký tự |
| **Password Confirmation** | Xác nhận mật khẩu khớp nhau |
| **Club Selection** | Chọn club muốn tham gia từ danh sách có sẵn |
| **Progress Indicator** | Hiển thị tiến trình đăng ký (3 bước) |

#### AuthContext
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Token Management** | Lưu trữ và quản lý accessToken/refreshToken |
| **User State** | Lưu thông tin user vào localStorage |
| **Auto-login** | Tự động đăng nhập khi có token hợp lệ |
| **Role Checking** | Kiểm tra quyền: ADMIN, CLUB_MANAGER, v.v. |
| **Logout** | Xóa token và chuyển về trang login |

---

### 2. Dashboard (Trang chủ)

#### DashboardPage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Welcome Section** | Hiển thị lời chào với tên user |
| **Stats Cards** | 4 thẻ thống kê: Total Reports, Active Clubs, Total Budget, Activities |
| **Change Indicators** | Hiển thị % thay đổi so với kỳ trước (positive/negative) |
| **Recent Activity** | Danh sách hoạt động gần đây của các user |
| **Quick Stats** | Thống kê nhanh: Reports Today, Pending Approval, Active Members, Events This Week |
| **Upcoming Events** | Danh sách sự kiện sắp tới với ngày và số người tham dự |
| **Report Trends Chart** | Biểu đồ cột thể hiện xu hướng báo cáo theo tháng |
| **Budget Allocation Chart** | Biểu đồ donut thể hiện phân bổ ngân sách |
| **Online Users** | Hiển thị số user đang online |

---

### 3. Clubs Management (Quản lý Câu lạc bộ)

#### ClubsPage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Club Listing** | Hiển thị danh sách clubs dạng grid card |
| **Search** | Tìm kiếm clubs theo tên |
| **Category Filter** | Lọc theo danh mục: Technology, Arts, Academic, Sports, Social |
| **Sort** | Sắp xếp theo: Tên, Số thành viên, Số báo cáo |
| **Club Card Display** | Hiển thị: Tên, Chủ nhiệm, Số thành viên, Số báo cáo, Ngân sách, Trạng thái |
| **Status Badge** | Trạng thái active/inactive với màu sắc khác nhau |
| **Add Club** | Thêm club mới qua Modal |
| **Edit Club** | Chỉnh sửa thông tin club |
| **Delete Club** | Xóa club khỏi hệ thống |
| **Stats Summary** | Tổng hợp: Total Clubs, Active Clubs, Total Members, Total Reports |

---

### 4. Reports Management (Quản lý Báo cáo)

#### ReportsPage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Reports Table** | Hiển thị danh sách báo cáo dạng bảng |
| **Search** | Tìm kiếm theo tiêu đề hoặc tên club |
| **Status Filter** | Lọc theo trạng thái: All, Pending, Review, Approved, Rejected |
| **Priority Levels** | Hiển thị ưu tiên: High (đỏ), Medium (vàng), Low (xanh) |
| **Report Types** | Các loại báo cáo: Quarterly, Event, Financial, Annual, Procurement, Membership, Social, Maintenance |
| **Bulk Selection** | Chọn nhiều báo cáo cùng lúc |
| **Bulk Actions** | Duyệt/Từ chối nhiều báo cáo cùng lúc |
| **Approve** | Phê duyệt báo cáo (chuyển status thành approved) |
| **Reject** | Từ chối báo cáo (chuyển status thành rejected) |
| **View Details** | Xem chi tiết báo cáo trong Modal |
| **Create Report** | Tạo báo cáo mới với các trường: Title, Club, Type, Priority, Date, Description |
| **Pagination** | Phân trang danh sách báo cáo |

---

### 5. Activities Management (Quản lý Hoạt động)

#### ActivitiesPage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Timeline View** | Hiển thị hoạt động theo timeline |
| **Status Filter** | Lọc: All, Upcoming, Completed, Cancelled |
| **Search** | Tìm kiếm theo tên hoặc club |
| **Activity Card** | Hiển thị: Tên, Club, Ngày, Giờ, Địa điểm, Số người tham dự, Ngân sách |
| **Status Badge** | Trạng thái: Upcoming (xanh), Completed (xanh lá), Cancelled (đỏ) |
| **Timeline Visualization** | Hiển thị đường timeline nối các hoạt động |
| **Create Activity** | Tạo hoạt động mới: Tên, Club, Ngày, Giờ, Địa điểm, Ngân sách |
| **Edit Activity** | Chỉnh sửa thông tin hoạt động |
| **Delete Activity** | Xóa hoạt động |
| **View Details** | Xem chi tiết hoạt động trong Modal |
| **Stats Cards** | Tổng hợp: Total Activities, Upcoming, Completed, Total Attendees |

---

### 6. Finance Management (Quản lý Tài chính)

#### FinancePage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Financial Overview** | 3 thẻ tổng quan: Total Income, Total Expenses, Current Balance |
| **Change Indicators** | % thay đổi so với tháng trước |
| **Budget Allocation** | Hiển thị ngân sách phân bổ theo từng hạng mục |
| **Progress Bars** | Thanh tiến trình cho biết % ngân sách đã sử dụng |
| **Categories** | Events & Activities, Equipment & Supplies, Marketing & Promotion, Venue & Facilities, Training & Development |
| **Transactions Table** | Danh sách giao dịch dạng bảng |
| **Type Filter** | Lọc: All, Income, Expense |
| **Search** | Tìm kiếm theo mô tả hoặc tên club |
| **Transaction Display** | Hiển thị: Mô tả, Club, Loại (Income/Expense), Số tiền, Ngày, Trạng thái, Danh mục |
| **Income/Expense Icons** | Biểu tượng mũi tên lên/xuống phân biệt thu/chi |
| **Add Transaction** | Thêm giao dịch mới |
| **Status Badges** | Trạng thái: Completed (xanh), Pending (vàng) |

---

### 7. Notifications (Thông báo)

#### NotificationsPage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Notifications List** | Danh sách thông báo dạng card |
| **Unread Count** | Hiển thị số thông báo chưa đọc |
| **Type Filter** | Lọc theo loại: All, Success, Info, Warning, Error |
| **Mark as Read** | Đánh dấu đã đọc từng thông báo |
| **Mark All Read** | Đánh dấu tất cả đã đọc |
| **Delete** | Xóa từng thông báo |
| **Clear All** | Xóa tất cả thông báo |
| **Notification Types** | Các loại: Success (thành công), Error (lỗi), Warning (cảnh báo), Info (thông tin) |
| **Unread Indicator** | Đường kẻ màu bên trái cho thông báo chưa đọc |
| **New Badge** | Badge "New" cho thông báo chưa đọc |
| **Sort** | Ưu tiên hiển thị thông báo chưa đọc lên đầu |

---

### 8. Profile (Hồ sơ cá nhân)

#### ProfilePage
| Chức năng | Mô tả chi tiết |
|-----------|-----------------|
| **Profile Card** | Hiển thị thông tin cơ bản: Avatar, Tên, Role, Club, Ngày tham gia |
| **Online Status** | Trạng thái online/offline |
| **Quick Stats** | Số liệu: Reports, Events, Members |
| **Edit Mode** | Cho phép chỉnh sửa thông tin cá nhân |
| **Editable Fields** | Name, Email, Role, Club, Phone, Bio |
| **Save Changes** | Lưu thay đổi vào localStorage |
| **Activity History** | Lịch sử hoạt động: Đăng nhập, Nộp báo cáo, Cập nhật profile, Phê duyệt ngân sách |
| **Security Section** | Cài đặt bảo mật |
| **Change Password** | Chức năng đổi mật khẩu |
| **Two-Factor Authentication** | Bật/tắt xác thực 2 bước |
| **Active Sessions** | Quản lý các thiết bị đang đăng nhập |
| **Danger Zone** | Xóa tài khoản vĩnh viễn |

---

## API Integration

### Base URL
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';
```

### Authentication Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Đăng xuất |

### Club Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/clubs` | Lấy danh sách clubs |
| GET | `/api/clubs/:id` | Lấy chi tiết club |
| GET | `/api/clubs/me/memberships` | Lấy membership của user hiện tại |
| POST | `/api/clubs/:id/join` | Join club |

### Report Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/reports` | Lấy danh sách báo cáo |
| GET | `/api/reports/:id` | Lấy chi tiết báo cáo |
| POST | `/api/reports` | Tạo báo cáo mới |
| POST | `/api/reports/:id/submit` | Submit báo cáo |
| POST | `/api/reports/:id/review` | Review báo cáo |
| POST | `/api/reports/:id/approve` | Phê duyệt báo cáo |
| POST | `/api/reports/:id/reject` | Từ chối báo cáo |
| GET | `/api/reports/summary` | Thống kê tóm tắt |
| GET | `/api/reports/aggregate` | Tổng hợp báo cáo |

### Activity Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/activities` | Lấy danh sách hoạt động |
| POST | `/api/activities` | Tạo hoạt động mới |
| POST | `/api/activities/:id/participants` | Đăng ký tham gia |

### Finance Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/finance/proposals` | Lấy danh sách đề xuất ngân sách |
| POST | `/api/finance/proposals` | Tạo đề xuất ngân sách |
| POST | `/api/finance/proposals/:id/approve` | Phê duyệt ngân sách |
| POST | `/api/finance/proposals/:id/settlements` | Tạo thanh toán |

### KPI Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/kpis/rules` | Lấy quy tắc KPI |
| GET | `/api/kpis/leaderboard` | Bảng xếp hạng KPI |

### Notification Endpoints
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/notifications` | Lấy danh sách thông báo |
| PUT | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| PUT | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |

---

## Authentication & Authorization

### Token Management
- **Access Token**: Lưu trong localStorage, gửi kèm mỗi request
- **Refresh Token**: Dùng để lấy access token mới khi hết hạn
- **Auto-refresh**: Tự động refresh khi gặp 401 Unauthorized

### Roles
| Role | Mô tả |
|------|-------|
| ADMIN | Quản trị viên hệ thống |
| SYSTEM_ADMIN | Quản trị viên hệ thống cao cấp |
| STUDENT_AFFAIRS_ADMIN | Quản lý công tác sinh viên |
| CLUB_MANAGER | Quản lý câu lạc bộ |

### Protected Routes
- Kiểm tra `isAuthenticated` trước khi cho phép truy cập
- Redirect về `/login` nếu chưa đăng nhập

---

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|-----------|----------|
| React 18 | UI Framework |
| React Router | Routing |
| Framer Motion | Animations |
| Tailwind CSS | Styling |
| Vite | Build tool |
| Fetch API | HTTP Client |

---

## Build & Run

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm run build
```

### Docker
```bash
docker build -t clubreport-frontend .
docker run -p 3000:80 clubreport-frontend
```
