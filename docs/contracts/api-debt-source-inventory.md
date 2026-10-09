# Frontend API debt source inventory

Generated on 2026-10-09 from the current uncommitted frontend tree. Literal-marker scan plus production import closure rooted at `src/main.jsx`, `src/App.jsx` and `src/pages/v2/V2App.jsx`; intentionally excludes traversal into `DemoApp.jsx`. Imports/styles, dynamic dispatch and product semantics still require manual review. This is evidence, not an automatic list of missing APIs. Auth/theme/cache local storage and network-unavailable states are not automatically API debt.

Scanned JavaScript/JSX source files: **145**. Production-import closure: **113**. Matching production source lines: **88**. API facade has **95 async public wrappers** (98 including three internal transport/error helpers).

Use [the debt register](frontend-api-debt-register.md) for classification and [the implementation handoff](backend-api-implementation-handoff.md) for actionable work.

| Source | Literal evidence |
| --- | --- |
| [src/components/v2/student-onboarding/StudentOnboarding.jsx:138](../../src/components/v2/student-onboarding/StudentOnboarding.jsx#L138) | `<p className="dx-onboarding-sync-note"><RefreshCw size={16} aria-hidden="true" />Thông tin được đồng bộ với hồ sơ và lưu trên thiết bị này.</p>` |
| [src/context/AuthContext.jsx:74](../../src/context/AuthContext.jsx#L74) | `const token = localStorage.getItem('accessToken');` |
| [src/context/AuthContext.jsx:78](../../src/context/AuthContext.jsx#L78) | `localStorage.setItem('user', JSON.stringify(currentUser));` |
| [src/context/AuthContext.jsx:84](../../src/context/AuthContext.jsx#L84) | `localStorage.removeItem('user');` |
| [src/context/AuthContext.jsx:90](../../src/context/AuthContext.jsx#L90) | `localStorage.removeItem('user');` |
| [src/context/AuthContext.jsx:105](../../src/context/AuthContext.jsx#L105) | `localStorage.setItem('user', JSON.stringify(userData));` |
| [src/context/AuthContext.jsx:124](../../src/context/AuthContext.jsx#L124) | `localStorage.setItem('user', JSON.stringify(userData));` |
| [src/context/AuthContext.jsx:145](../../src/context/AuthContext.jsx#L145) | `localStorage.removeItem('user');` |
| [src/context/AuthContext.jsx:154](../../src/context/AuthContext.jsx#L154) | `localStorage.setItem('user', JSON.stringify(updatedUser));` |
| [src/context/ThemeContext.jsx:9](../../src/context/ThemeContext.jsx#L9) | `const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)` |
| [src/context/ThemeContext.jsx:21](../../src/context/ThemeContext.jsx#L21) | `window.localStorage.setItem(THEME_STORAGE_KEY, theme)` |
| [src/features/profile/SystemAdminProfile.jsx:146](../../src/features/profile/SystemAdminProfile.jsx#L146) | `title={user?.roles?.includes("SYSTEM_ADMIN") ? "API hiện chưa hỗ trợ tự chỉnh sửa hồ sơ quản trị hệ thống." : undefined}` |
| [src/hooks/useLocalStorage.js:3](../../src/hooks/useLocalStorage.js#L3) | `export function useLocalStorage(key, initialValue) {` |
| [src/hooks/useLocalStorage.js:6](../../src/hooks/useLocalStorage.js#L6) | `const item = window.localStorage.getItem(key)` |
| [src/hooks/useLocalStorage.js:9](../../src/hooks/useLocalStorage.js#L9) | `console.warn(\`Error reading localStorage key "${key}":\`, error)` |
| [src/hooks/useLocalStorage.js:16](../../src/hooks/useLocalStorage.js#L16) | `window.localStorage.setItem(key, JSON.stringify(storedValue))` |
| [src/hooks/useLocalStorage.js:18](../../src/hooks/useLocalStorage.js#L18) | `console.warn(\`Error setting localStorage key "${key}":\`, error)` |
| [src/pages/AcademicCalendarPage.jsx:42](../../src/pages/AcademicCalendarPage.jsx#L42) | `setNotice(\`Đã lưu mốc thời gian ${formatStudyTerm(period)} trong mock.\`);` |
| [src/pages/AcademicCalendarPage.jsx:95](../../src/pages/AcademicCalendarPage.jsx#L95) | `<p className="text-sm text-muted">Chế độ mock: cấu hình chỉ lưu trong trình duyệt hiện tại. Backend chưa có API lịch học kỳ.</p>` |
| [src/pages/UsersPage.jsx:7](../../src/pages/UsersPage.jsx#L7) | `import { useDebounce } from '../hooks/useLocalStorage';` |
| [src/pages/UsersPage.jsx:209](../../src/pages/UsersPage.jsx#L209) | `title={unsupportedEditRole ? 'API hiện chưa hỗ trợ chỉnh sửa vai trò này.' : undefined}` |
| [src/pages/v2/academic-calendar-data.js:41](../../src/pages/v2/academic-calendar-data.js#L41) | `export function readAcademicCalendar(period, storage = globalThis.localStorage) {` |
| [src/pages/v2/academic-calendar-data.js:53](../../src/pages/v2/academic-calendar-data.js#L53) | `export function saveAcademicCalendar(period, value, storage = globalThis.localStorage) {` |
| [src/pages/v2/academic-calendar-repository.js:6](../../src/pages/v2/academic-calendar-repository.js#L6) | `export function createMockAcademicCalendarRepository(storageOverride) {` |
| [src/pages/v2/academic-calendar-repository.js:11](../../src/pages/v2/academic-calendar-repository.js#L11) | `storage = storageOverride ?? globalThis.localStorage;` |
| [src/pages/v2/academic-calendar-repository.js:32](../../src/pages/v2/academic-calendar-repository.js#L32) | `export const academicCalendarRepository = createMockAcademicCalendarRepository();` |
| [src/pages/v2/activity-data.js:100](../../src/pages/v2/activity-data.js#L100) | `recommendationId: \`temporary-${activity.id}\`,` |
| [src/pages/v2/club-workspace-page/tabs/ClubShapeUploadModal.jsx:124](../../src/pages/v2/club-workspace-page/tabs/ClubShapeUploadModal.jsx#L124) | `trên ảnh bìa. Dữ liệu đang lưu tạm trên thiết bị.` |
| [src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx:11](../../src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx#L11) | `sampleClubBalance,` |
| [src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx:50](../../src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx#L50) | `const balance = sampleClubBalance(inventory, clubId);` |
| [src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx:84](../../src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx#L84) | `và quà lưu trên thiết bị này.` |
| [src/pages/v2/club-workspace-page/tabs/members/MemberManagement.jsx:151](../../src/pages/v2/club-workspace-page/tabs/members/MemberManagement.jsx#L151) | `setError('Vai trò này chưa được backend hỗ trợ phân công.');` |
| [src/pages/v2/club-workspace-page/tabs/members/MemberManagement.jsx:598](../../src/pages/v2/club-workspace-page/tabs/members/MemberManagement.jsx#L598) | `Vai trò này chưa thể lưu phân công. Cần bổ sung API và quyền` |
| [src/pages/v2/club-workspace-page/tabs/PointsTab.jsx:4](../../src/pages/v2/club-workspace-page/tabs/PointsTab.jsx#L4) | `return <WorkspaceUnavailable title="Điểm & thành tích" description="Theo dõi điểm và cột mốc của bạn trong CLB." detail="Backend chưa có sổ điểm cá nhân và huy hiệu gắn với CLB này." />;` |
| [src/pages/v2/club-workspace-page/tabs/QuestsTab.jsx:4](../../src/pages/v2/club-workspace-page/tabs/QuestsTab.jsx#L4) | `return <WorkspaceUnavailable title="Nhiệm vụ & đóng góp" description="Theo dõi nhiệm vụ và đóng góp của CLB." detail="Backend chưa có API nhiệm vụ, bài nộp và duyệt đóng góp cho CLB này." />;` |
| [src/pages/v2/my-clubs-data.js:6](../../src/pages/v2/my-clubs-data.js#L6) | `export const isMyClubsMockEnabled = viteEnv.DEV && viteEnv.VITE_MOCK_MY_CLUBS === 'true';` |
| [src/pages/v2/my-clubs-data.js:8](../../src/pages/v2/my-clubs-data.js#L8) | `const mockSelection = [` |
| [src/pages/v2/my-clubs-data.js:18](../../src/pages/v2/my-clubs-data.js#L18) | `const mockApplications = [` |
| [src/pages/v2/my-clubs-data.js:19](../../src/pages/v2/my-clubs-data.js#L19) | `{ applicationId: 'mock-application-1', club: { clubId: 'fmelody', name: 'F-Melody' }, reason: 'Mình muốn tham gia ban truyền thông.', status: 'PENDING', canWithdraw: true },` |
| [src/pages/v2/my-clubs-data.js:96](../../src/pages/v2/my-clubs-data.js#L96) | `useCallback(() => (isMyClubsMockEnabled ? mockSelection : api.getMyClubSelection()), [api]),` |
| [src/pages/v2/my-clubs-data.js:104](../../src/pages/v2/my-clubs-data.js#L104) | `useCallback(() => (isMyClubsMockEnabled ? mockApplications : api.getMyMembershipApplications()), [api]),` |
| [src/pages/v2/my-clubs-page/MyClubsPage.jsx:7](../../src/pages/v2/my-clubs-page/MyClubsPage.jsx#L7) | `import { isMyClubsMockEnabled, useMyClubSelection, useMyMembershipApplications } from '../my-clubs-data';` |
| [src/pages/v2/my-clubs-page/MyClubsPage.jsx:16](../../src/pages/v2/my-clubs-page/MyClubsPage.jsx#L16) | `const [mockWithdrawnIds, setMockWithdrawnIds] = useState([]);` |
| [src/pages/v2/my-clubs-page/MyClubsPage.jsx:50](../../src/pages/v2/my-clubs-page/MyClubsPage.jsx#L50) | `if (isMyClubsMockEnabled) {` |
| [src/pages/v2/my-clubs-page/MyClubsPage.jsx:52](../../src/pages/v2/my-clubs-page/MyClubsPage.jsx#L52) | `setMockWithdrawnIds((ids) => [...ids, applicationId]);` |
| [src/pages/v2/my-clubs-page/MyClubsPage.jsx:99](../../src/pages/v2/my-clubs-page/MyClubsPage.jsx#L99) | `(application) => !mockWithdrawnIds.includes(application.applicationId),` |
| [src/pages/v2/onboarding.js:44](../../src/pages/v2/onboarding.js#L44) | `export function readOnboarding(user, storage = globalThis.localStorage) {` |
| [src/pages/v2/onboarding.js:75](../../src/pages/v2/onboarding.js#L75) | `export function saveOnboarding(user, preferences, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-data.js:43](../../src/pages/v2/profile-data.js#L43) | `function editableProfile(value, fallback, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-data.js:123](../../src/pages/v2/profile-data.js#L123) | `export function createMockProfile(user) {` |
| [src/pages/v2/profile-data.js:233](../../src/pages/v2/profile-data.js#L233) | `export function readProfile(user, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-data.js:234](../../src/pages/v2/profile-data.js#L234) | `const seed = createMockProfile(user);` |
| [src/pages/v2/profile-data.js:252](../../src/pages/v2/profile-data.js#L252) | `export function saveProfile(user, patch, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-data.js:282](../../src/pages/v2/profile-data.js#L282) | `export function readProfileFromMemberships(user, memberships, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-data.js:422](../../src/pages/v2/profile-data.js#L422) | `if (!api?.getMyMemberships \|\| savedProfileRecord(user, globalThis.localStorage)) return current;` |
| [src/pages/v2/profile-page/cover-cosmetics.js:126](../../src/pages/v2/profile-page/cover-cosmetics.js#L126) | `export function readClubShapes(storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:144](../../src/pages/v2/profile-page/cover-cosmetics.js#L144) | `export function getCoverShapes(storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:151](../../src/pages/v2/profile-page/cover-cosmetics.js#L151) | `export function getClubCoverRewards(clubId, storage = globalThis.localStorage, clubCode = '') {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:161](../../src/pages/v2/profile-page/cover-cosmetics.js#L161) | `export function publishClubShape({ clubId, clubName, label, cost, assetUrl }, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:191](../../src/pages/v2/profile-page/cover-cosmetics.js#L191) | `export function readCoverInventory(user, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:213](../../src/pages/v2/profile-page/cover-cosmetics.js#L213) | `export function canUseCoverItem(kind, id, inventory, storage = globalThis.localStorage) {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:218](../../src/pages/v2/profile-page/cover-cosmetics.js#L218) | `export function sampleClubBalance(inventory, clubId) {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:222](../../src/pages/v2/profile-page/cover-cosmetics.js#L222) | `export function redeemCoverReward(user, clubId, rewardKey, storage = globalThis.localStorage, clubCode = '') {` |
| [src/pages/v2/profile-page/cover-cosmetics.js:229](../../src/pages/v2/profile-page/cover-cosmetics.js#L229) | `const balance = sampleClubBalance(inventory, clubId);` |
| [src/pages/v2/profile-page/profile-images.js:10](../../src/pages/v2/profile-page/profile-images.js#L10) | `const request = indexedDB.open(DATABASE, 1);` |
| [src/pages/v2/profile-page/profile-images.js:56](../../src/pages/v2/profile-page/profile-images.js#L56) | `}).catch(() => { if (active) setError('Không thể đọc ảnh đã lưu trên thiết bị.'); });` |
| [src/pages/v2/profile-page/ProfileCoverModal.jsx:470](../../src/pages/v2/profile-page/ProfileCoverModal.jsx#L470) | `Thiết kế và quyền sở hữu đang lưu tạm theo tài khoản trên thiết bị này.` |
| [src/pages/v2/profile-page/ProfilePage.jsx:390](../../src/pages/v2/profile-page/ProfilePage.jsx#L390) | `note="Chưa có API tổng hợp cá nhân"` |
| [src/pages/v2/profile-page/ProfilePage.jsx:396](../../src/pages/v2/profile-page/ProfilePage.jsx#L396) | `note="Chưa có API lịch sử cá nhân"` |
| [src/pages/v2/profile-page/ProfilePage.jsx:424](../../src/pages/v2/profile-page/ProfilePage.jsx#L424) | `: 'Lịch sử minh chứng cá nhân chưa có API để hiển thị.'}` |
| [src/pages/v2/study-schedule-data.js:204](../../src/pages/v2/study-schedule-data.js#L204) | `export function readStudySchedule(user, period, week, storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-data.js:210](../../src/pages/v2/study-schedule-data.js#L210) | `export function readStudyPeriod(user, period, storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-data.js:221](../../src/pages/v2/study-schedule-data.js#L221) | `export function readLegacyStudySchedule(user, storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-data.js:231](../../src/pages/v2/study-schedule-data.js#L231) | `export function saveStudySlot(user, period, week, day, slotId, value, storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-data.js:243](../../src/pages/v2/study-schedule-data.js#L243) | `export function clearStudySlot(user, period, week, day, slotId, storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-data.js:255](../../src/pages/v2/study-schedule-data.js#L255) | `export function importLegacyStudySchedule(user, period, storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-data.js:293](../../src/pages/v2/study-schedule-data.js#L293) | `export function bulkImportStudySchedule(user, period, entries, mode = 'skip', storage = globalThis.localStorage) {` |
| [src/pages/v2/study-schedule-repository.js:15](../../src/pages/v2/study-schedule-repository.js#L15) | `export function createMockStudyScheduleRepository(storageOverride) {` |
| [src/pages/v2/study-schedule-repository.js:20](../../src/pages/v2/study-schedule-repository.js#L20) | `storage = storageOverride ?? globalThis.localStorage;` |
| [src/pages/v2/study-schedule-repository.js:57](../../src/pages/v2/study-schedule-repository.js#L57) | `export const studyScheduleRepository = createMockStudyScheduleRepository();` |
| [src/services/api.js:23](../../src/services/api.js#L23) | `return localStorage.getItem('accessToken');` |
| [src/services/api.js:27](../../src/services/api.js#L27) | `localStorage.setItem('accessToken', token);` |
| [src/services/api.js:31](../../src/services/api.js#L31) | `localStorage.setItem('refreshToken', token);` |
| [src/services/api.js:35](../../src/services/api.js#L35) | `localStorage.removeItem('accessToken');` |
| [src/services/api.js:36](../../src/services/api.js#L36) | `localStorage.removeItem('refreshToken');` |
| [src/services/api.js:104](../../src/services/api.js#L104) | `const refreshToken = localStorage.getItem('refreshToken');` |
| [src/services/api.js:179](../../src/services/api.js#L179) | `const refreshToken = localStorage.getItem('refreshToken');` |
| [src/services/api.js:267](../../src/services/api.js#L267) | `// Provisional manager-scoped contract; the current admin PUT /clubs/{id} cannot be used here.` |

## Excluded from backend debt

- `/v2/demo/*` and its isolated fixtures, `Profile.jsx`, community/workspace demo modules: intentionally demonstrative, not production API obligations.
- Auth token/session cache, theme preference, UI filters and generic `useLocalStorage`: operational/browser state, not missing persistence contracts.
- AwaitingFinance and other workflow statuses/translations: records awaiting a business review, not markers of unimplemented APIs.
- Retry/unavailable network states where a declared route exists: verify gateway/auth/environment rather than inventing a replacement endpoint.

A manual scan of all source files and route/spec documents also includes unmarked gaps such as public activity discovery, recommendation adapters, report attachment privacy and event staff/registration workflows; these appear in the debt register.
