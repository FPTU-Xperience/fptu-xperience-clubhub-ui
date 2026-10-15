# V2 UI review — Hallmark

Reviewed: 15 October 2026 (Asia/Saigon). Source baseline: `b189daf` plus the current working tree.

This is a source-based design and interaction review followed by a live UI recheck of the accessible production V2 pages. Scope includes every page registered by `V2App.jsx`, every workspace section selected by `WorkspaceLeftRail.jsx` / `WorkspaceTabView.jsx`, the manager activity detail page, and login/onboarding. No application code was changed.

The initial source pass could not capture Chrome. On the subsequent UI recheck, the stopped Vite server was restarted and a fresh tab connected successfully. Live inspection used the existing authenticated localhost session: manager access to FPT-TECH and member access to FPT-AI. Login was inspected separately at `127.0.0.1`, which had no authenticated session. Screenshots, DOM state, and computed styles were checked at the normal viewport and targeted 1100×800, 1280×800, and 1440×900 desktop sizes. The viewport override was reset afterward.

No backend record was created, updated, approved, deleted, uploaded, or redeemed. One temporary club-text preview was created solely in component state to test navigation loss; it was never saved, and returning to the editor confirmed the original content and no pending preview. Onboarding was not reset or re-run. Dark mode and deliberate request failures were not exercised. The live recheck status table below is authoritative about what was actually reproduced.

## How the review was graded
 HOa
Hallmark's audit, named anti-patterns, and execution gates were used. Findings marked **UX** supplement its taste rules with concrete navigation, state, and interaction defects. Severity reflects this application: **critical** means a shared execution gate fails; **major** means a material interaction or design problem; **minor** means polish or a contextual taste issue.

There is no root `design.md` / `DESIGN.md` and no Hallmark system stamp governing these pages. The older `UI_REDESIGN_PLAN.md` records a desktop/laptop scope. Its historical mock-data description is superseded by the current production implementations; its desktop scope is retained for this review. The 1060px minimum app width is therefore recorded as a mobile limitation, not graded as a newly introduced defect.

Shared sidebars, consistent typography on operational screens, semantic cards, and repeated directory layouts are appropriate for one application. They are not automatically marketing-template violations. User-selected cover designs and gift palettes are also not treated as accidental brand drift.

## Page coverage

Every row received a source review. A row without a unique finding still inherits applicable shared findings; it is not a browser-verified pass. `W` below means `/v2/my-clubs/:clubCode`.

| Page / route | Implementation reviewed | Assessment and finding IDs |
| --- | --- | --- |
| V2 login, shown on unauthenticated V2 routes | `src/pages/v2/V2Access.jsx`, `V2Access.scss` | Clear split layout and field label; emphasis is roman, not italic. Hard-coded light styling: M02, M13. |
| Student onboarding, three steps | `src/components/v2/student-onboarding/StudentOnboarding.jsx`, fields/autofill and stylesheet | Actual ordered steps justify the step indicator. Focus is moved to the current step heading and local storage is disclosed. Its emphasis CSS also specifies normal font style. M02, M13. Not re-run in the live account. |
| `/v2` — discovery | `discovery-page/DiscoveryPage.jsx`, `DiscoveryLayout.jsx` / `.scss` | Asymmetric hero avoids the centered landing-page fingerprint. Filtered recommendations can disappear without an empty state: M03. Hero placeholder identities and static term: m02. M02, M13 also apply. |
| `/v2/clubs` — directory | `all-clubs-page/AllClubsPage.jsx` / `.scss`, shared cards/filters/pagination | Search, recruiting filter, count, pagination, and no-match copy exist. No unique confirmed defect beyond shared M02/M13. |
| `/v2/clubs/:clubCode` — club profile and application/rules dialogs | `club-detail-page/ClubDetailPage.jsx` / `.scss`, `ClubProfileHeader` | Relationship-aware CTA and separate rules dialog exist. Generic repeated benefits weaken club identity: m01. C01, M02, M10, M13 apply. |
| `/v2/activities` — public activities | `activities-page/ActivitiesPage.jsx` / `.scss`, `ActivityCard` | Correctly supplies no-match copy and clear-filters action. This is the behavior discovery should reuse. M02/M13 apply. |
| `/v2/activities/:activityId` — overview, documents, media, own attendance | `activities-page/ActivityDetailPage.jsx`, `ActivityProfileLayout`, `ActivityResources`, `ActivityAttendance` | Distinct tabs and resource empty states exist; attendance is scoped to the current user. M02/M13 and language polish m03 apply. Cover-load failure needs browser verification. |
| `/v2/my-clubs` — memberships, applications, invitations | `my-clubs-page/MyClubsPage.jsx` / `.scss`, `MyClubCard`, `MyMembershipApplications` | Full-width cover and one identity logo are present. Application expiry and an empty result message are explicit. C01, M02, M13 apply. |
| `/v2/my-schedule` — club activity schedule | `personal-pages/PersonalPages.jsx` / `.scss`, schedule variant of `ActivityCard` | Dates and a real empty-state CTA are present. Copy says clubs being followed, but selection uses access membership: m04. M02/M13 apply. |
| `/v2/study-schedule` — timetable and bulk/slot dialogs | `personal-pages/StudySchedulePage.jsx` / `.scss`, bulk import modal | Scoped table headers, descriptive cell labels, week controls, and a horizontally scrollable table region are present. Storage boundary is not explained on the page: M11. C01, M02, M13 apply. |
| `/v2/profile` — overview, evidence, sharing preview, text/avatar/cover editors | `profile-page/ProfilePage.jsx` / `.scss` and its modal implementations | Text editing is separate from avatar/cover flows. Preview and unavailable metrics are labeled. Tab semantics are incomplete, drafts can be lost, and membership failures lack recovery: M06, M10, M14. C01, M02, M11, M13 apply. |
| `W` — workspace home | `club-workspace-page/ClubWorkspacePage.jsx` / `.scss` | Four real summary metrics and asymmetric dashboard composition; not the three-feature marketing template. Review rows imply links but are not interactive: M04. M02/M13 apply. |
| `W/activities` — manager/member lists, manager create dialog | `tabs/ActivitiesTab.jsx`, shared activity components | Role-aware creation and search/reset exist. Create form lacks the time ordering check already present in edit: M09. C01, M02, M13 apply. |
| `W/activities/:activityId` — manager activity detail/edit/resources/attendance | `tabs/activities/ActivityManagementPage.jsx`, resource editor and shared detail components | Club ownership and manager checks exist; edit validates end after start. Local resource and cover drafts lack navigation protection: M10. C01, M02, M13 apply. |
| `W/quests` | `tabs/QuestsTab.jsx`, `WorkspaceUnavailable` | Unavailable feature is presented as a missing-data screen with backend details: M11. M02/M13 apply. |
| `W/members` — member view | `tabs/MembersTab.jsx`, roles information | Private roster is withheld; publicly supplied leadership is separated. Its role/status fields are hidden at a desktop breakpoint: M05. M02/M13 apply. |
| `W/members` — manager roster, applications, invitation/member dialogs | `tabs/members/MemberManagement.jsx` / `.scss` and invitation modal | Search, role filter, pagination, confirmations, and inline operation results exist. No additional unique confirmed taste finding; C01, M02, M13 apply. Runtime permission/error branches remain unverified. |
| `W/points` | `tabs/PointsTab.jsx`, `WorkspaceUnavailable` | Same unavailable-feature problem as quests: M11. M02/M13 apply. |
| `W/gifts` — catalog, ownership, creation, scheduling, auto-rule/detail dialogs | `tabs/GiftsTab.jsx` / `.scss` and gift components | Sample balance/device storage and disabled physical redemption are disclosed. The sections, search, and sorting have distinct functions. Mixed Vietnamese/English labels: m03. C01, M02, M13 apply. |
| `W/reports` — manager only | `tabs/ReportsTab.jsx`, operation-row styles | Create action drops club context; desktop breakpoint removes status/due date: M07, M05. C01, M02, M13 apply. |
| `W/finance` — manager only | `tabs/FinanceTab.jsx`, operation-row styles | Partial load failures disappear without their own errors; desktop breakpoint hides status/type and amounts: M08, M05. M02, M13, m03 apply. |
| `W/club-page` — manager preview/text/image/schedule editing | `tabs/ClubPageTab.jsx` / `.scss`, `tabs/club-page/*` | Independent image/text flows, explicit preview, retained input on save failure, and permission messages exist. Semester changes and navigation can discard drafts: M10. C01, M02, M13 apply. |

Additional route handling reviewed:

- `/v2/recommended` redirects to the discovery directory anchor; no separate page to grade.
- `W/attendance` redirects to activities; attendance now lives in activity detail.
- Unknown public/workspace paths are covered by M01.
- `/v2/preview/club-governance` is a DEV-only synthetic rehearsal, not a production page. Its source and gating were checked; its visual/action behavior was not exercised.
- `/v2/demo/*` is a separately lazy-loaded demonstration app. Its route ownership was inventoried in `DemoApp.jsx`; its independent mock screens are outside this production review and are not claimed to pass.

## Critical findings

### C01 — Contrast gate: small white primary-button text on orange

**Tell:** Hallmark execution gate 40, contrast thresholds. **Severity:** critical, because the shared base style affects essential form actions.

**Where:** `src/pages/v2/V2App.scss:37–78`, particularly the 12px font and primary fill/text pair; affected button examples include `ClubDetailPage.jsx:147–149`, `ProfilePage.jsx:243–258`, and `tabs/ActivitiesTab.jsx:96–107`.

The declared pair `#ffffff` on `#f97316` calculates to **2.803:1**, below Hallmark's 4.5:1 threshold for small text. This is a calculation from source declarations, not a claim that every rendered link/button has this computed pair: link specificity, hover, and page overrides require browser confirmation.

**Fix:** Define a dedicated primary-action fill/text token pair that clears 4.5:1, retaining orange as the brand accent, and use it for small primary-button text.

## Major findings

### M01 — UX: unknown URLs have no useful recovery page

**Where:** `src/pages/v2/V2App.jsx:59–90`; `src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx:241–247, 284–302`; `tabs/WorkspaceTabView.jsx:22–26`.

The production routes have no wildcard fallback. Workspace paths with an unknown first segment label the breadcrumb “Trang không khả dụng,” but the view lookup returns `null`. A mistyped/stale link can therefore leave only the shell or breadcrumb instead of a recoverable not-found page. This follows the routing branches; browser appearance remains unverified.

**Fix:** Render an explicit not-found state with a context-aware return link for unknown public and workspace paths.

### M02 — UX / token coherence: dark-mode control is disconnected from V2 surfaces

**Where:** `src/context/ThemeContext.jsx:14–22`; `src/components/v2/common/leftrail/RailAccountSection.jsx:140–144`; `src/pages/v2/V2App.scss:1–4, 44–46`; `ClubWorkspacePage.scss:1–7`; `profile-page/ProfilePage.scss:68–70`.

The account control changes the root theme and color scheme, while V2 still declares light-only ink, white panels, and hard-coded control colors. There is no corresponding V2 palette mapping in the reviewed theme rules. Native controls and the global canvas can switch while cards/ink remain light. The exact mixed-theme appearance needs a browser check.

**Fix:** Map V2 semantic surface/ink/control tokens to both root themes and remove hard-coded light colors from shared chrome and page panels.

### M03 — UX: filtered recommendations can show a blank section

**Where:** `src/pages/v2/discovery-page/DiscoveryPage.jsx:28, 67–72`.

`PageState` receives the unfiltered recommendation status. If that status is populated but a status filter produces zero activities, it renders an empty grid without an explanation or reset action. The public activities page already handles this case correctly.

**Fix:** Add a filtered-empty state and “Xóa bộ lọc” action when the recommendation source is populated but the visible list is empty.

### M04 — UX: arrow affordances on noninteractive workspace review rows

**Where:** `src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx:43–55, 144–174`.

The review rows end in `ArrowUpRight` but are plain `div` elements with no navigation or handler. They visually suggest opening new applications/reports, yet do nothing and are not keyboard actionable. Do not make reports navigable for member roles that lack that destination.

**Fix:** Use a real link to the permitted destination, or remove the arrow when the row is informational.

### M05 — UX: a desktop breakpoint hides the meaning of operational rows

**Where:** `src/pages/v2/club-workspace-page/ClubWorkspacePage.scss:1035–1051`; `tabs/ReportsTab.jsx:33–45`; `tabs/FinanceTab.jsx:36–59`; `tabs/MembersTab.jsx:59–91`.

At a viewport width of 1100px or less, operation/member row `span` and `em` fields and the headers are hidden. Reports lose status/due date; finance loses status/type and amounts; member leadership rows lose role/status. This breakpoint falls within the documented desktop scope and above the app's 1060px minimum.

**Fix:** Reflow metadata below each primary row label instead of hiding it; retain a clearly named amount/status at every supported desktop width.

### M06 — UX: profile declares tabs without completing the tab interaction

**Where:** `src/pages/v2/profile-page/ProfilePage.jsx:314–381`.

The profile uses `tablist` / `tab` roles and `aria-selected`, but has no linked tab-panel IDs, `aria-controls`, roving tab index, or arrow-key handling. Switching is implemented only through button click. Other V2 filter buttons use simpler pressed-button semantics, so there is an easy consistent alternative.

**Fix:** Complete the tab/panel keyboard pattern, or use a pressed-button group consistently until a shared tabs component exists.

### M07 — UX: creating a report loses the selected club

**Where:** `src/pages/v2/club-workspace-page/tabs/ReportsTab.jsx:26, 50`; `src/pages/CreateReportPage.jsx:58, 108–115`.

The workspace sends users to `/reports/create` without club/semester context. The receiving page initializes an empty club selection and then chooses the first managed club. A manager creating a report from a second club's workspace can arrive with another club selected. The list escape link also drops the workspace context.

**Fix:** Pass and validate the current club/report period into the existing report flow, and provide an explicit return to that workspace.

### M08 — UX: finance hides partial failures

**Where:** `src/pages/v2/club-workspace-page/tabs/FinanceTab.jsx:13–32, 35–66`.

Both requests are settled independently, but rejected sources are reduced to `null`. The UI displays an error only when both are missing (or the overall resource fails). If proposals load and transactions fail, the transaction section disappears with no indication that it failed; the inverse also occurs.

**Fix:** Preserve separate source statuses/errors and render a compact retryable error for the unavailable section while keeping successful data visible.

### M09 — UX: activity creation lacks the edit form's date-order feedback

**Where:** `src/pages/v2/club-workspace-page/tabs/ActivitiesTab.jsx:57–83, 197–205`; compare `tabs/activities/ActivityManagementPage.jsx:95–105`.

The create form requires both dates but sends them without checking that end is after start. The edit form performs this check and supplies a clear message. Backend validation may still reject invalid dates; this finding concerns inconsistent local form feedback, not acceptance of an invalid record.

**Fix:** Reuse the edit form's date-order validation for creation and associate the message with the relevant inputs.

### M10 — UX: visible drafts can be discarded without a navigation warning

**Where:** `src/pages/v2/profile-page/ProfilePage.jsx:106–108, 383–415`; `src/pages/v2/club-workspace-page/tabs/ClubPageTab.jsx:45–75, 214–240`; `tabs/activities/ActivityManagementPage.jsx:41–51, 64–80`.

Profile/text previews and activity resource drafts live in component state. Navigating away unmounts that state; the club editor also explicitly clears its text preview on semester changes. No route-leave/before-unload protection was found in the reviewed V2 code. These are explicitly presented as “chưa lưu,” so silent loss is consequential to the editing flow.

**Fix:** Protect dirty drafts when leaving the page, switching clubs, or changing semester, with a save/discard choice appropriate to the existing flow.

### M11 — UX: feature/storage explanations are aimed at developers

**Where:** `src/pages/v2/club-workspace-page/tabs/QuestsTab.jsx:3–4`, `PointsTab.jsx:3–4`, `WorkspaceUnavailable.jsx:6–10`; `profile-page/ProfilePage.jsx:339–377`; `personal-pages/StudySchedulePage.jsx:173–180, 232–237`.

Quests/points explain missing backend APIs under a “Chưa có dữ liệu” heading, confusing an unavailable feature with an empty record set. Profile stats also mention missing APIs. Conversely, the manually entered study timetable does not clearly tell students that it is device-local. Gifts and onboarding already provide a better student-facing storage disclosure.

**Fix:** State what users can currently do (“Tính năng đang được hoàn thiện”; “Chưa có lịch sử để hiển thị”) and put a concise device-local disclosure beside timetable editing; retain technical contract details in documentation.

### M13 — Mid-render token improvisation

**Tell:** Hallmark named anti-pattern “Mid-render token improvisation.” **Where:** `src/pages/v2/V2App.scss:1–4, 60–77`; `ClubWorkspacePage.scss:34–77, 156–175`; `profile-page/ProfilePage.scss:54–107`; `src/components/v2/DiscoveryLayout.scss:1–50`.

Only a small set of V2 colors is tokenized, while ink, orange variants, muted text, borders, controls, and status palettes are redeclared throughout page styles. This makes a single contrast/theme correction incomplete and encourages slightly different treatments for the same semantic state. Personalization palettes are an intentional exception, not the target of this finding.

**Fix:** Consolidate semantic action, ink, surface, border, focus, and status tokens using the existing theme system, then replace page-specific duplicates.

### M14 — UX: profile membership-load failure offers no recovery

**Where:** `src/pages/v2/profile-page/ProfilePage.jsx:298–303`; compare shared `src/components/v2/PageState.jsx:53–57`.

The club-membership subsection shows “Không thể tải câu lạc bộ lúc này” when its own request fails, but has no retry action. The main profile can remain populated, so retrying its parent state is not available as a substitute.

**Fix:** Add a retry path to `useProfileMemberships` and expose it through a local “Thử lại” action without resetting the profile/editor state.

### M15 — UX: past activities are labeled upcoming and counted inconsistently

**Where:** live discovery, `/v2/activities`, `/v2/my-schedule`, FPT-AI/FPT-TECH workspace activity lists and overview; presentation entrypoints `src/components/v2/activity-card/ActivityCard.jsx:9–15, 21–29` and `src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx:93–99`.

On 15 October 2026, the UI labels activities dated 15 September, 25 September, and 3 October 2026 as “Sắp diễn ra.” The AI seminar detail confirms its full date and end time on 25 September. FPT-AI's rail shows one upcoming/live activity while its overview says zero upcoming activities; FPT-TECH similarly shows two in the rail but no upcoming appointment. This is an observed data/presentation inconsistency, not proof that the frontend should override authoritative workflow statuses.

**Fix:** Agree how time-derived phase and lifecycle status interact, reconcile stale records/statuses, and use the same upcoming definition for cards, filters, rail counts, schedules, and overview summaries.

### M16 — UX: physical gift availability contradicts the disabled action

**Where:** live FPT-AI gift catalog after “Mở tất cả”; `src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx:532–556`, `GiftAvailability.jsx`, `GiftClaimButton.jsx`.

All three sample physical gifts display “Đang mở đổi · Không đặt thời hạn,” but their action says “Chưa mở đổi” and is disabled. The page footnote correctly says physical redemption is unavailable. The card therefore presents mutually conflicting answers before a user reaches that explanation.

**Fix:** Make the physical-preview availability label reflect the unavailable redemption capability; reserve “Đang mở đổi” for gifts the current flow can actually claim.

### M17 — UX: the same club has three incompatible fallback identities

**Where:** `src/components/v2/club-card/ClubCardMedia.jsx:20–24`; `src/pages/v2/club-workspace-page/tabs/club-page/ClubPagePreview.jsx:51–57`; workspace identity in `WorkspaceLeftRail.jsx:46–54`.

For FPT-TECH, My Clubs and directory cards display `FPT`, the workspace rail displays `FPT-TECH`, and the club editor displays `CÂ` from the start of the Vietnamese club name. Multiple unrelated clubs also share the truncated `FPT` fallback. This was visible in screenshots and DOM text, even though the full code is present in the underlying club identity.

**Fix:** Reuse one logo component with the full canonical club code as fallback across cards, public profiles, workspace rails, and editor previews.

### M18 — UX / responsive execution: poster activity cards overlap at laptop widths

**Where:** live `/v2/activities`; shared `src/components/v2/activity-card/ActivityCard.scss:1–5, 265–270`, also used by discovery and workspace activity grids.

At 1280×800, the measured grid has two 431px tracks, but each poster card is 540px wide. The first spans x=324–864 and the second starts at x=781: an **83px overlap**. The second extends to x=1321, beyond the 1280px viewport. At 1440×900, the tracks are 511px and the same 540px cards still overlap by 3px. The source combines a 3:2 card aspect ratio with a 360px minimum height, which imposes a 540px ratio-derived width despite narrower parent tracks.

**Fix:** Remove the ratio/min-height conflict or switch to one column before two cards cease to fit; verify the shared poster grids at all supported desktop widths.

## Minor findings

### m01 — The 3-column feature grid, in a generic benefits variant

**Tell:** Hallmark's three-feature structural fingerprint, applied contextually. **Where:** `src/pages/v2/club-detail-page/ClubDetailPage.jsx:173–197`; `ClubDetailPage.scss:229–258`.

Every club repeats the same three numbered benefits in equal columns. These are not the exact icon-card template and the overall page is asymmetric, so this is a minor concern rather than a critical whole-page structural violation. The repeated copy nevertheless communicates little about the particular club.

**Fix:** Prefer club-supplied benefits or a compact, clearly generic “Cách tham gia” section when no specific benefit content exists.

### m02 — Placeholder identities and a fixed campaign term in discovery

**Tell:** Hallmark “Placeholder names” / decorative content hygiene. **Where:** `src/components/v2/DiscoveryLayout.jsx:99–104, 128`.

The avatar-style stack contains `KL`, `NM`, `HA` without real people behind it, and the ticket hard-codes `FALL 2026`. The stack is not marked decorative; the term will become stale if the layout survives that campaign.

**Fix:** Mark illustrative identity shapes decorative or remove them; derive the term from actual campaign context or omit the dated label.

### m03 — Mixed-language control vocabulary

**Where:** `src/pages/v2/profile-page/ProfilePage.jsx:238`; `activities-page/ActivityDetailPage.jsx:16`; `tabs/GiftsTab.jsx:207–216, 345–353, 572–583`; `tabs/FinanceTab.jsx:42, 60`.

“view công khai,” “Media,” “Publish/Unpublish,” and raw finance status/type values sit beside Vietnamese task labels.

**Fix:** Use consistent Vietnamese labels for public preview, media, publication state, and finance enums; retain original enum values in adapters, not visible copy.

### m04 — Schedule copy describes following rather than access membership

**Where:** `src/pages/v2/personal-pages/PersonalPages.jsx:24–36`.

The description says activities come from clubs the user is following, but the list filters by `clubAccess`. It is also a club-activity schedule, not a feed filtered by the user's activity registration.

**Fix:** Label it explicitly as activities from clubs the user belongs to; add an actual participation filter only when the corresponding data contract exists.

### m05 — Empty gift groups take precedence over available items

**Where:** live FPT-AI gift landing page at 1280×800; `src/pages/v2/club-workspace-page/tabs/GiftsTab.jsx:138, 393–437` and its default section ordering.

The catalog has three physical samples, but the initial viewport is occupied by the expanded, empty “Vừa thêm” and “Quà hot” groups. The actual physical group is farther down and initially collapsed. This makes a nonempty catalog look empty on first arrival.

**Fix:** Collapse empty discovery groups by default and prioritize/expand the first nonempty gift category.

## Live UI recheck status

The recheck covered discovery, directory/no-match, member club profile, public activities/no-match/reset, public activity overview/documents/media/own-attendance, My Clubs, personal schedule, timetable, profile overview/evidence/keyboard tabs, member workspace home/activities/members/quests/points/gifts, and manager home/activities/create-form/detail/resources/attendance/members/applications/governance-preview/reports/finance/club editor. Screens were inspected without submitting business actions. The manager report-create link was followed into its existing legacy screen.

| Finding | Live evidence / remaining boundary |
| --- | --- |
| C01 | Confirmed: profile “Chỉnh sửa” computes to white text on `rgb(249,115,22)`, 12px, weight 550. The resulting ratio is 2.803:1. This is now a computed-style check for that button, not just a source declaration. |
| M01 | Confirmed: `/v2/ui-review-not-found` renders an empty main region. The equivalent unknown FPT-TECH workspace path renders only the breadcrumb “Trang không khả dụng,” with no recovery content. |
| M02 | Source-supported, not reproduced by toggling the persisted theme. The session was reviewed in light mode. |
| M03 | Confirmed: choosing “Đang diễn ra” in discovery leaves zero recommendation cards and no no-match/reset content. The full activities page supplies both. |
| M04 | Confirmed: overview review rows render arrows but are DIVs with no link, role, or tabindex. Checked in the accessible member/manager workspace surfaces. |
| M05 | Confirmed at 1100px: member role/status, report status/due date, and finance status/type/amount elements compute to `display:none`; screenshots show the resulting loss. |
| M06 | Confirmed: ArrowRight on profile “Tổng quan” leaves focus and selection unchanged; both tab buttons lack panel linkage and no tabpanel exists. Mouse switching to evidence works. |
| M07 | Partially checked: the action goes to `/reports/create` without parameters and opens the legacy layout. The one available managed club is correctly preselected in this session; the wrong-club case needs an account managing multiple clubs. The destination defaults to Quarter III 2026 rather than carrying the displayed workspace semester. |
| M08 | Source-supported, not failure-injected. Both finance sections loaded successfully in this session. |
| M09 | Create dialog inspected; both native date inputs have no ordering constraint. An invalid record was not submitted, so the source conclusion about local validation remains the evidence. |
| M10 | Confirmed for club-text preview: preview marker visible, navigation to Reports succeeds without a warning, returning shows original content and no pending preview. Profile/resource/semester-switch variants remain source-supported. |
| M11 | Confirmed visible developer copy on profile, quests, and points; timetable shows no device-local disclosure. |
| M12 | **Withdrawn.** Login `<em>` computes to `font-style:normal`, Inter, weight 650. Onboarding also explicitly sets `font-style:normal` in `StudentOnboarding.scss:48–50`. The previous markup-based finding was incorrect. |
| M13 | Source-supported token-maintenance issue. It does not claim that a new visual drift was independently measured in every component. |
| M14 | Source-supported, not reproduced: profile memberships loaded successfully. |
| M15–M18 | Newly confirmed UI findings: stale upcoming status/counts, conflicting physical gift availability, inconsistent identity fallback, and overlapping activity posters. |
| m01–m04 | Confirmed visible generic benefits, hero placeholders/date, mixed-language labels (including raw finance enums), and follow-vs-membership schedule copy. |
| m05 | Newly confirmed gift landing-order issue. |

DEV-only observation: the manager “Ban quản lý” tab embeds the synthetic governance rehearsal in the live workspace shell. It displays synthetic people and an apparent owner different from the live roster, without an obvious sample-data banner. Source gating in `MemberManagement.jsx:210–220` confirms this entry is DEV-only; it is not evidence that production grants synthetic permissions. Add a clear rehearsal label for local review. This is recorded separately from the production finding count.

## What should be retained

- The discovery hero is asymmetric, and the operational app has a legitimate shared navigation system. There is no reason to invent a different site structure for every workspace tab.
- Directory/activity filters have labels and selected-state semantics; the full activity list supplies a useful filtered-empty recovery flow.
- The footer is a compact brand close, not the four-column marketing sitemap pattern.
- The shared modal includes dialog naming, a modal stack, Escape handling, body scroll locking, and focus return. These are source positives, not proof of a complete runtime accessibility pass.
- Club cards use shared media/identity components. My Clubs uses a full-width cover with a single logo rather than a second decorative identity.
- Profile evidence and gift samples are explicitly marked unavailable/sample; do not replace them with invented achievements, real-point claims, or decorative metrics.
- Separate public/manager activity surfaces, role-aware workspace sections, and synthetic DEV rehearsal gating should remain separate.

## Prioritized follow-up and verification

1. Correct the shared action contrast and unknown-route recovery (C01, M01). Verify actual button/link colors in all relevant states.
2. Preserve task context and data meaning: report club selection, partial finance failure, desktop metadata, filtered recommendation emptiness, and draft loss (M03, M05, M07–M10).
3. Complete profile tab/retry interactions and remove misleading arrow affordances (M04, M06, M14).
4. Fix poster overlap and reconcile activity/gift/identity semantics exposed by the live recheck (M15–M18).
5. Consolidate light/dark tokens and user-facing availability/storage copy, then make targeted taste corrections (M02, M11, M13, m01–m05).

Browser checks still required: the untested 1060px boundary; dark mode; additional long-name cases; deliberate error/forbidden branches; complete keyboard/nested-modal coverage; the remaining profile/resource/semester-switch draft variants; and multiple-managed-club report creation. Profile/avatar/cover persistence and gift redemption/ownership require separate focused flow checks; they were not established by this review.

No build or mutation tests were run because this deliverable changes documentation only. The live recheck establishes the observed states above, not complete integration, production deployment verification, or screenshot parity across all states.

**1 critical · 17 major · 5 minor** (23 active findings; M12 withdrawn).
