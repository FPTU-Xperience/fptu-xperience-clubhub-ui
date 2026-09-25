# Feature Specification: Migrate Production Profile

**Feature Branch**: `feat/CLBHB-UI-port-profile-page`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "migrate trang profile của phần demo ở nhánh code demo origin/UI-TO-PRODUCT sang code production ở nhánh hiện tại, follow theo các pattern hiện tại"

## Clarifications

### Session 2026-09-25

- Q: Khi profile service chưa có đủ dữ liệu, phạm vi migrate nên xử lý thế nào? → A: Tạo profile services tạm thời trả về mock data thay vì data từ API.
- Q: Sau khi sinh viên lưu chỉnh sửa vào profile mock, thay đổi nên được giữ trong bao lâu? → A: Giữ sau khi tải lại trên cùng thiết bị.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View my production profile (Priority: P1)

An authenticated student opens **Hồ sơ** from the V2 account menu and sees their own profile in the established V2 application frame. During this migration, a dedicated temporary profile service supplies representative mock data; the page retains the reference profile's information hierarchy: cover, identity, introduction, academic information, skills, club involvement, experience summary, and term-filtered contribution evidence.

**Why this priority**: A student needs one trustworthy place to review the information and participation history that represents them; an accurate read-only profile is useful before editing is available.

**Independent Test**: With a signed-in account and temporary profile-service data, open the profile directly and through the account menu, then confirm the data is scoped to that session and that the reference hierarchy is present.

**Acceptance Scenarios**:

1. **Given** an authenticated student with a profile, **When** they open the V2 Profile destination, **Then** they see their name, avatar or initials fallback, headline, campus and academic context, and profile sections using the production V2 frame and the reference visual hierarchy.
2. **Given** an authenticated student with mock club memberships, attendance, and recognized contributions, **When** they view the profile, **Then** the club, activity, and evidence summaries reflect the temporary profile-service response scoped to that student.
3. **Given** the profile is opened directly or refreshed, **When** the session remains valid, **Then** the same authenticated profile is resolved without relying on prior navigation state.
4. **Given** a field is absent from the temporary profile-service response, **When** the profile renders, **Then** the field is presented as intentionally incomplete rather than filled from demo state or an unrelated mock record.

---

### User Story 2 - Preview privacy-safe shared profile (Priority: P2)

An authenticated student can switch to the reference page's shared-profile preview to understand which details are appropriate to expose, then return to their private view.

**Why this priority**: The source interaction makes privacy boundaries visible before a student chooses to share profile information elsewhere.

**Independent Test**: Toggle the preview on a profile containing a student code and contribution evidence; verify the private details are hidden, the privacy message is shown, and returning restores the private view.

**Acceptance Scenarios**:

1. **Given** a student is on their private profile, **When** they select the shared-profile preview, **Then** the page clearly indicates preview mode and hides student code, detailed points, and private history.
2. **Given** a student is in shared-profile preview, **When** they return to the personal profile, **Then** private information is visible only within the authenticated personal view.
3. **Given** a user opens the profile, **When** they have not explicitly activated preview, **Then** preview mode is off and no sharing or publication occurs.

---

### User Story 3 - Update self-managed profile details (Priority: P3)

An authenticated student edits the self-managed details represented in the reference profile, reviews the values, and saves them when the profile service confirms the update.

**Why this priority**: Personal context and skills become useful only when students can keep them current, but this must not weaken identity or academic-data authority.

**Independent Test**: Change a permitted profile field, save, reload the profile, and confirm the saved value persists; attempt to alter a protected field and confirm it is not editable.

**Acceptance Scenarios**:

1. **Given** the temporary profile service supports self-service updates, **When** a student saves valid changes to permitted personal details, **Then** the confirmation is shown and the refreshed profile on the same device displays the saved values.
2. **Given** a save fails or the update service is unavailable, **When** the student submits changes, **Then** their unsaved input remains available for correction and a clear failure state is shown without altering the last confirmed profile.
3. **Given** a student opens the editor, **When** they view identity, enrollment, membership, attendance, or recognized-contribution data, **Then** those server-authoritative values cannot be altered through the personal-profile editor.

### Edge Cases

- The session expires while profile, history, or an update is loading; the person is returned to the normal authentication experience without exposing cached private values.
- The profile source returns no record, partial information, forbidden access, or an error; each case has a distinct, understandable state and does not use demo actors, fixtures, or invented personal information.
- A term has no attendance or contribution records; the profile shows an explicit empty state while preserving the selected term.
- A student changes route or account while a request is pending; stale results must not appear in the new account or profile view.
- Two different people use the same device; a saved mock profile change is scoped to the authenticated account and must not appear in the other person's profile.
- The profile is viewed at the desktop baseline and at narrower widths; cover, identity actions, columns, tabs, and editor remain usable without content overlap or hidden controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST provide an authenticated V2 route for the current user's profile and connect the existing V2 account-menu Profile destination to it.
- **FR-002**: The profile page MUST preserve the source reference's Vietnamese information hierarchy and visual language: editorial cover, identity block, private/shared view control, sidebar profile information, club list, overview/evidence tabs, term filter, summary cards, and experience visualization.
- **FR-003**: The profile page MUST resolve a single profile from the current authenticated session and MUST NOT accept a user identifier that could expose another person's private profile.
- **FR-004**: The page MUST obtain its profile, participation summary, and evidence data through V2-local temporary profile services that return representative mock records until the production API contract is available; it MUST show an initials or neutral avatar fallback when no avatar is available.
- **FR-005**: The page MUST treat identity, enrollment, club membership, attendance, and recognized-contribution records as server-authoritative and must not allow the profile editor to change them.
- **FR-006**: The profile page MUST present club participation, activity count, recognized contribution total, and term-filtered evidence from the temporary profile-service response scoped to the authenticated user.
- **FR-007**: The shared-profile control MUST be a local privacy preview by default; it MUST not publish, expose, or create a public profile link. In preview, student code, detailed point values, and private history MUST be hidden.
- **FR-008**: The product MUST offer editing only for permitted self-managed fields: name, headline, introduction, skills, and interests. It MUST validate required name input and provide an understandable save result.
- **FR-009**: The temporary profile services MUST retain permitted saved mock-profile changes after a page reload on the same device, scoped to the authenticated account, until the future API contract replaces the service boundary.
- **FR-010**: The page MUST expose distinct loading, empty, forbidden, and failure states for profile and dependent participation information, preserving the V2 frame and avoiding direct demo fallback content.
- **FR-011**: The page MUST support direct navigation, refresh, keyboard operation of tabs, filters, preview, and editing controls, and accessible labels for non-text visualizations.
- **FR-012**: The production implementation MUST remain isolated from the demo route, demo context, demo actors, fixtures, and in-memory mutation mechanisms; it may use the demo branch only as a visual and interaction reference.
- **FR-013**: The migration MUST retain current V2 navigation, authenticated-session behavior, account-menu dismissal behavior, and existing non-profile V2 routes.

### Key Entities *(include if feature involves data)*

- **Personal Profile**: The display-safe personal information owned by the signed-in student, including name, avatar reference, headline, introduction, academic context, skills, and interests.
- **Profile Privacy View**: A temporary viewing mode that determines which profile information is visible without changing the stored profile or publishing it.
- **Participation Summary**: Authorized, aggregate counts for the student's clubs, activities, and recognized contributions.
- **Contribution Evidence**: A term-associated record of an activity or contribution, including a safe description, associated club, date, and verifier display information when permitted.
- **Club Participation**: The signed-in student's approved relationship with a club and its display-safe role label.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in student can reach their profile from the V2 account menu or a direct URL and see the first temporary profile-service state within 3 seconds for 95% of successful loads under normal development conditions.
- **SC-002**: In focused acceptance testing, 100% of displayed profile fields and participation records come from the V2-local temporary profile service for the authenticated test account; no demo context or demo route data appear in the profile.
- **SC-003**: In focused acceptance testing, 100% of shared-profile previews hide student code, detailed point values, and private history before the view is shown.
- **SC-004**: At least 90% of representative students can identify their basic profile information and one contribution or empty-state outcome on their first visit without assistance.
- **SC-005**: In focused testing, valid permitted profile edits persist after reload in 100% of successful save responses, while failed saves leave the last confirmed profile unchanged.

## Assumptions

- The existing V2 authenticated session is the source of the current user's identity and remains the required access boundary.
- The source profile in `origin/UI-TO-PRODUCT` is the visual and interaction reference; its demo state, sample actors, and in-memory updates are not production dependencies.
- The reference's shared-profile interaction is a local preview for this migration, not a public publishing or discovery feature.
- A V2-local temporary profile service will return representative mock data instead of calling a production API during this migration. It is the sole temporary data source and is designed to be replaced by a production profile contract later.
- The eventual production profile contract must provide only the display-safe fields needed by this page and enforce current-user scope server-side; replacing the temporary service is a follow-up integration task.
- This feature covers the signed-in user's profile only. Viewing other users' profiles, public profile URLs, social sharing, profile search, credential verification, and changes to account settings are out of scope.
