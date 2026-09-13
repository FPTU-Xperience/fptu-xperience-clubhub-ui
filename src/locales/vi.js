export const vi = Object.freeze({
  common: {
    all: 'Tất cả',
    cancel: 'Hủy',
    close: 'Đóng',
    confirm: 'Xác nhận',
    create: 'Tạo',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    loading: 'Đang tải...',
    processing: 'Đang xử lý...',
    refresh: 'Làm mới',
    save: 'Lưu',
    search: 'Tìm kiếm',
    submit: 'Gửi',
    update: 'Cập nhật',
    view: 'Xem',
    previous: 'Trước',
    next: 'Tiếp',
    page: 'Trang',
    noData: 'Chưa có dữ liệu.',
    notUpdated: 'Chưa cập nhật',
    notAvailable: 'Không khả dụng',
    unknown: 'Không xác định',
  },
  roles: {
    ADMIN: 'Quản trị viên',
    SYSTEM_ADMIN: 'Quản trị hệ thống',
    STUDENT_AFFAIRS_ADMIN: 'Quản trị công tác sinh viên',
    CLUB_MANAGER: 'Chủ nhiệm câu lạc bộ',
    TREASURER: 'Thủ quỹ',
    CLUB_MEMBER: 'Thành viên câu lạc bộ',
  },
  categories: {
    SPORTS: 'Thể thao',
    ARTS: 'Nghệ thuật',
    ACADEMIC: 'Học thuật',
    VOLUNTEER: 'Tình nguyện',
    TECHNOLOGY: 'Công nghệ',
    OTHER: 'Khác',
  },
  genders: {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
  },
  clubStatuses: {
    PENDING: 'Chờ xét duyệt',
    SUBMITTED: 'Đã gửi',
    NEEDSREVISION: 'Cần chỉnh sửa',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  },
  reportStatuses: {
    DRAFT: 'Bản nháp',
    AWAITINGFINANCE: 'Chờ thủ quỹ',
    SUBMITTED: 'Đã nộp',
    UNDERREVIEW: 'Đang xét duyệt',
    TREASURERAPPROVED: 'Thủ quỹ đã duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Cần chỉnh sửa',
  },
  activityStatuses: {
    PLANNED: 'Đã lên kế hoạch',
    SCHEDULED: 'Đã lên lịch',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
  },
  attendanceStatuses: {
    NOTMARKED: 'Chưa đánh dấu',
    PRESENT: 'Có mặt',
    ABSENT: 'Vắng mặt',
    EXCUSED: 'Có phép',
    LATE: 'Đến muộn',
  },
  financeStatuses: {
    SUBMITTED: 'Chờ chủ nhiệm duyệt',
    MANAGERAPPROVED: 'Chờ duyệt cuối',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    SETTLED: 'Đã quyết toán',
  },
  reportTypes: {
    QUARTERLY: 'Báo cáo quý',
    MONTHLY: 'Báo cáo tháng',
    SEMESTER: 'Báo cáo học kỳ',
    ANNUAL: 'Báo cáo năm',
    AD_HOC: 'Báo cáo đột xuất',
    FUTURE_EVENT: 'Báo cáo sự kiện sắp tới',
  },
  eventTypes: {
    'club.created': 'Tạo câu lạc bộ',
    'user.registered': 'Đăng ký người dùng',
    'activity.created': 'Tạo hoạt động',
    'report.created': 'Tạo báo cáo',
    'report.submitted': 'Nộp báo cáo',
    'report.approved': 'Phê duyệt báo cáo',
    'report.rejected': 'Yêu cầu sửa báo cáo',
    'report.deadline.reminder': 'Nhắc hạn báo cáo',
    'kpi.calculated': 'Cập nhật KPI',
    'budget.proposal.submitted': 'Nộp đề xuất ngân sách',
    'budget.approved': 'Phê duyệt ngân sách',
    'settlement.overdue': 'Quyết toán quá hạn',
    'export.requested': 'Yêu cầu xuất báo cáo',
    'export.completed': 'Hoàn tất xuất báo cáo',
  },
  errors: {
    network: 'Không thể kết nối đến hệ thống. Vui lòng thử lại.',
    unauthorized: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    credentials: 'Thư điện tử, tên đăng nhập hoặc mật khẩu không đúng.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    notFound: 'Không tìm thấy dữ liệu được yêu cầu.',
    conflict: 'Tên đăng nhập hoặc thư điện tử đã tồn tại.',
    validation: 'Thông tin gửi lên chưa hợp lệ.',
    rateLimited: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
    server: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  },
})

function normalize(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s_-]+/g, '')
}

const ERROR_MESSAGE_TRANSLATIONS = Object.freeze({
  'select at least one weekly meeting day.': 'Vui lòng chọn ít nhất một ngày họp trong tuần.',
  'end time must be after start time.': 'Thời gian kết thúc phải sau thời gian bắt đầu.',
  'activity title and location are required.': 'Tên hoạt động và địa điểm là bắt buộc.',
  'the approved report does not contain valid event information.': 'Báo cáo đã duyệt không chứa thông tin sự kiện hợp lệ.',
  'completed activities no longer accept participants.': 'Hoạt động đã hoàn thành không nhận thêm người tham gia.',
  'this activity is no longer accepting attendance.': 'Hoạt động này không còn nhận điểm danh.',
  'this activity does not have a weekly attendance schedule.': 'Hoạt động này chưa có lịch điểm danh hằng tuần.',
  'provide between 0 and 500 valid members.': 'Vui lòng cung cấp từ 0 đến 500 thành viên hợp lệ.',
  'provide between 1 and 500 unique member ids.': 'Vui lòng cung cấp từ 1 đến 500 mã thành viên không trùng lặp.',
  'the member and pagination values are invalid.': 'Thông tin thành viên hoặc phân trang không hợp lệ.',
  'activity not found in this club.': 'Không tìm thấy hoạt động trong câu lạc bộ này.',
  'attendance cannot be recorded for a cancelled activity.': 'Không thể ghi nhận điểm danh cho hoạt động đã hủy.',
  'the member is not eligible for this activity.': 'Thành viên không đủ điều kiện tham gia hoạt động này.',
  'the activity belongs to another club.': 'Hoạt động thuộc một câu lạc bộ khác.',
  'one or more members do not belong to this club or joined after the activity started.': 'Một hoặc nhiều thành viên không thuộc câu lạc bộ này hoặc tham gia sau khi hoạt động bắt đầu.',
  'username, full name, email and password are required.': 'Tên đăng nhập, họ tên, thư điện tử và mật khẩu là bắt buộc.',
  'username, full name or email exceeds the allowed length.': 'Tên đăng nhập, họ tên hoặc thư điện tử vượt quá độ dài cho phép.',
  'email address is invalid.': 'Địa chỉ thư điện tử không hợp lệ.',
  'password must be at least 8 characters.': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'password must contain uppercase, lowercase, digit, and special character.': 'Mật khẩu phải có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
  'each account must have exactly one predefined actor role.': 'Mỗi tài khoản phải có đúng một vai trò được định nghĩa trước.',
  'the requested actor role is not available.': 'Vai trò được yêu cầu không khả dụng.',
  'full name and email are required.': 'Họ tên và thư điện tử là bắt buộc.',
  'one or more requested roles are invalid.': 'Một hoặc nhiều vai trò được yêu cầu không hợp lệ.',
  'you cannot deactivate your own account or change your own actor role.': 'Bạn không thể vô hiệu hóa tài khoản hoặc thay đổi vai trò của chính mình.',
  'you cannot lock your own account.': 'Bạn không thể khóa tài khoản của chính mình.',
  'you cannot unlock your own account.': 'Bạn không thể mở khóa tài khoản của chính mình.',
  'only predefined clubreporthub actor roles are supported.': 'Hệ thống chỉ hỗ trợ các vai trò ClubReportHub đã được định nghĩa.',
  'username or email already exists.': 'Tên đăng nhập hoặc thư điện tử đã tồn tại.',
  'email already belongs to another account.': 'Địa chỉ thư điện tử đã thuộc về một tài khoản khác.',
  'the final active admin account cannot be deactivated or reassigned.': 'Không thể vô hiệu hóa hoặc đổi vai trò của tài khoản quản trị viên hoạt động cuối cùng.',
  'the final active admin account cannot be locked.': 'Không thể khóa tài khoản quản trị viên hoạt động cuối cùng.',
  'role already exists.': 'Vai trò đã tồn tại.',
  'requested amount must be greater than zero.': 'Số tiền đề xuất phải lớn hơn 0.',
  'a proposal can link either an existing activity or a future event report, not both.': 'Đề xuất chỉ được liên kết với một hoạt động hoặc một báo cáo sự kiện sắp tới.',
  'the selected future event report does not belong to this club.': 'Báo cáo sự kiện đã chọn không thuộc câu lạc bộ này.',
  'only a future event report awaiting its budget can be linked.': 'Chỉ có thể liên kết báo cáo sự kiện sắp tới đang chờ lập ngân sách.',
  'this future event report is no longer awaiting a budget.': 'Báo cáo sự kiện này không còn chờ lập ngân sách.',
  'the selected activity does not belong to this club.': 'Hoạt động đã chọn không thuộc câu lạc bộ này.',
  'weekly, monthly, or attendance activities cannot be linked to a budget proposal.': 'Không thể liên kết hoạt động hằng tuần, hằng tháng hoặc điểm danh với đề xuất ngân sách.',
  'a cancelled activity cannot be linked to a budget proposal.': 'Không thể liên kết hoạt động đã hủy với đề xuất ngân sách.',
  'proposal title and description are required.': 'Tên và mô tả đề xuất là bắt buộc.',
  'review this budget together with its future event report.': 'Vui lòng xét duyệt ngân sách cùng với báo cáo sự kiện sắp tới liên quan.',
  'only proposals awaiting club owner review can be approved.': 'Chỉ có thể duyệt đề xuất đang chờ chủ nhiệm xét duyệt.',
  'only proposals awaiting club owner review can be rejected.': 'Chỉ có thể từ chối đề xuất đang chờ chủ nhiệm xét duyệt.',
  'the proposal creator cannot approve their own proposal.': 'Người tạo đề xuất không thể tự phê duyệt đề xuất của mình.',
  'the proposal creator cannot reject their own proposal.': 'Người tạo đề xuất không thể tự từ chối đề xuất của mình.',
  'the club owner must approve this proposal before final approval.': 'Chủ nhiệm phải duyệt đề xuất trước bước phê duyệt cuối.',
  'the club owner must review this proposal before final rejection.': 'Chủ nhiệm phải xét duyệt đề xuất trước bước từ chối cuối.',
  'approved amount must be greater than zero.': 'Số tiền được duyệt phải lớn hơn 0.',
  'only approved budget proposals can be settled.': 'Chỉ đề xuất ngân sách đã duyệt mới có thể quyết toán.',
  'total spent must be greater than zero.': 'Tổng chi thực tế phải lớn hơn 0.',
  'receipt url must be a valid url.': 'Đường dẫn hóa đơn không hợp lệ.',
  'receipt url must use https.': 'Đường dẫn hóa đơn phải sử dụng HTTPS.',
  'total spent exceeds maximum allowed amount.': 'Tổng chi vượt quá mức tối đa cho phép.',
  'only submitted settlements can be approved.': 'Chỉ quyết toán đã nộp mới có thể được phê duyệt.',
  'this proposal already has an active settlement.': 'Đề xuất này đã có một quyết toán đang hoạt động.',
  'the proposal creator cannot approve its settlement.': 'Người tạo đề xuất không thể tự duyệt quyết toán của đề xuất đó.',
  'the review note cannot exceed 1,000 characters.': 'Nhận xét xét duyệt không được vượt quá 1.000 ký tự.',
  'please specify the required changes.': 'Vui lòng nêu rõ nội dung cần chỉnh sửa.',
  'the review content exceeds the allowed length.': 'Nội dung xét duyệt vượt quá độ dài cho phép.',
  'please provide a rejection reason.': 'Vui lòng cung cấp lý do từ chối.',
  'treasurer must be an approved member of this club.': 'Thủ quỹ phải là thành viên đã được duyệt của câu lạc bộ này.',
  'club not found.': 'Không tìm thấy câu lạc bộ.',
  'club not found': 'Không tìm thấy câu lạc bộ.',
  'member not found in this club.': 'Không tìm thấy thành viên trong câu lạc bộ này.',
  'club is already inactive': 'Câu lạc bộ đã ngừng hoạt động.',
  'club is inactive': 'Câu lạc bộ đang ngừng hoạt động.',
  'club is already deleted': 'Câu lạc bộ đã bị xóa.',
  'a pending disband request already exists for this club': 'Câu lạc bộ đã có một yêu cầu giải thể đang chờ xử lý.',
  'disband request not found': 'Không tìm thấy yêu cầu giải thể.',
  'new owner must be an approved club member': 'Chủ nhiệm mới phải là thành viên đã được duyệt của câu lạc bộ.',
  'cannot transfer ownership to yourself': 'Không thể chuyển quyền chủ nhiệm cho chính mình.',
  'a pending transfer request already exists for this club': 'Câu lạc bộ đã có một yêu cầu chuyển quyền đang chờ xử lý.',
  'transfer request not found': 'Không tìm thấy yêu cầu chuyển quyền.',
  'request content type must be multipart/form-data.': 'Định dạng nội dung yêu cầu phải là multipart/form-data.',
  'only draft or rejected reports can be edited.': 'Chỉ có thể chỉnh sửa báo cáo nháp hoặc báo cáo bị yêu cầu sửa.',
  'attachments can only be changed on draft or rejected reports.': 'Chỉ có thể thay đổi tệp đính kèm của báo cáo nháp hoặc báo cáo bị yêu cầu sửa.',
  'report detail does not belong to this report.': 'Chi tiết báo cáo không thuộc báo cáo này.',
  'evidence file is required.': 'Tệp minh chứng là bắt buộc.',
  'invalid storage path.': 'Đường dẫn lưu trữ không hợp lệ.',
  'invalid file path.': 'Đường dẫn tệp không hợp lệ.',
  'attachment file is not available.': 'Tệp đính kèm không khả dụng.',
  'assign at least one club treasurer before submitting a future event report.': 'Vui lòng chỉ định ít nhất một thủ quỹ trước khi nộp báo cáo sự kiện sắp tới.',
  'only future event reports can receive a linked budget.': 'Chỉ báo cáo sự kiện sắp tới mới có thể liên kết ngân sách.',
  'this future event report is not awaiting a budget.': 'Báo cáo sự kiện này không ở trạng thái chờ ngân sách.',
  'only submitted reports can enter review.': 'Chỉ báo cáo đã nộp mới có thể chuyển sang xét duyệt.',
  'the treasurer must submit the event budget before club owner review.': 'Thủ quỹ phải nộp ngân sách sự kiện trước khi chủ nhiệm xét duyệt.',
  'only reports forwarded by the club manager can be approved.': 'Chỉ báo cáo do chủ nhiệm chuyển tiếp mới có thể được phê duyệt.',
  'the future event package is incomplete.': 'Hồ sơ sự kiện sắp tới chưa đầy đủ.',
  'only submitted or under-review reports can be rejected.': 'Chỉ báo cáo đã nộp hoặc đang xét duyệt mới có thể bị từ chối.',
  'reportid is required.': 'Mã báo cáo là bắt buộc.',
  'exporttype must be pdf, xlsx, or docx.': 'Định dạng xuất phải là PDF, XLSX hoặc DOCX.',
  'unable to generate the export file. the system will retry automatically.': 'Không thể tạo tệp xuất. Hệ thống sẽ tự động thử lại.',
})

const SYSTEM_TEXT_TRANSLATIONS = Object.freeze({
  'Approved by the club owner.': 'Đã được chủ nhiệm câu lạc bộ phê duyệt.',
  'Rejected by the club owner.': 'Đã bị chủ nhiệm câu lạc bộ từ chối.',
  'Budget approved.': 'Ngân sách đã được phê duyệt.',
  'Budget rejected.': 'Ngân sách đã bị từ chối.',
  'Settlement approved.': 'Quyết toán đã được phê duyệt.',
  'The report has been approved.': 'Báo cáo đã được phê duyệt.',
})

export function formatRole(role) {
  return vi.roles[role] || 'Khách'
}

export function formatCategory(category) {
  return vi.categories[category] || vi.categories.OTHER
}

export function formatClubStatus(status) {
  const key = normalize(status)
  return vi.clubStatuses[key] || vi.common.unknown
}

export function formatReportStatus(status) {
  const key = normalize(status)
  return vi.reportStatuses[key] || vi.common.unknown
}

export function formatActivityStatus(status) {
  const key = normalize(status)
  return vi.activityStatuses[key] || vi.common.unknown
}

export function formatAttendanceStatus(status) {
  const key = normalize(status)
  return vi.attendanceStatuses[key] || vi.common.unknown
}

export function formatFinanceStatus(status) {
  const key = normalize(status)
  return vi.financeStatuses[key] || vi.common.unknown
}

export function formatReportType(type) {
  const key = String(type || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  return vi.reportTypes[key] || vi.common.unknown
}

export function formatEventType(type) {
  return vi.eventTypes[type] || vi.common.unknown
}

export function formatSystemText(value) {
  return SYSTEM_TEXT_TRANSLATIONS[value] || value || ''
}

export function formatDate(value, { time = false, fallback = '-' } = {}) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return fallback
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    ...(time ? { timeStyle: 'short' } : {}),
  }).format(date)
}

export function formatDateTime(value, fallback = '-') {
  return formatDate(value, { time: true, fallback })
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatErrorMessage(error, fallback = vi.errors.server) {
  const raw = typeof error === 'string' ? error : error?.message
  if (!raw) return fallback
  const message = String(raw).trim()
  const lower = message.toLowerCase()

  if (ERROR_MESSAGE_TRANSLATIONS[lower]) return ERROR_MESSAGE_TRANSLATIONS[lower]

  const totalSpentMatch = message.match(/^Total spent \((.*?)\) exceeds approved amount \((.*?)\)\.$/i)
  if (totalSpentMatch) {
    return `Tổng chi (${totalSpentMatch[1]}) vượt quá số tiền được duyệt (${totalSpentMatch[2]}).`
  }

  const requestStatusMatch = message.match(/^Request is already (.*?)$/i)
  if (requestStatusMatch) {
    return `Yêu cầu đã ở trạng thái ${translateStatus(requestStatusMatch[1])}.`
  }

  if (lower.includes('failed to fetch') || lower.includes('network error')) return vi.errors.network
  if (lower.includes('invalid credential') || lower.includes('email/username') || lower.includes('password is incorrect')) return vi.errors.credentials
  if (lower.includes('unauthorized') || lower.includes('token expired') || lower.includes('phiên đăng nhập')) return vi.errors.unauthorized
  if (lower.includes('forbidden') || lower.includes('permission')) return vi.errors.forbidden
  if (lower.includes('not found') || lower.includes('resource was not found')) return vi.errors.notFound
  if (lower.includes('already exists') || lower.includes('duplicate')) return vi.errors.conflict
  if (lower.includes('too many') || lower.includes('rate limit')) return vi.errors.rateLimited
  if (/^request failed \(\d+\)/i.test(message)) return fallback
  if (/^preview response/i.test(message)) return 'Không thể tải bản xem trước tài liệu.'
  if (/^\d{3}$/.test(message)) return fallback

  return message
}

export function translateStatus(value, fallback = vi.common.unknown) {
  const normalized = normalize(value)
  return vi.reportStatuses[normalized]
    || vi.clubStatuses[normalized]
    || vi.activityStatuses[normalized]
    || vi.attendanceStatuses[normalized]
    || vi.financeStatuses[normalized]
    || fallback
}
