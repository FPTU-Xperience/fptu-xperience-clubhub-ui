# V2 authentication and student onboarding

Status: implemented for CLBHB-UI-03 / issue #5 on 17 September 2026.

## Source sync

This local implementation note synchronizes the relevant product flow from:

- screen-flows.md, section “Luồng Khởi tạo & Chọn Ngữ cảnh”.
- UI_DESIGN_HANDOFF.md, especially the v2 shell boundary and the rule that demo business data remains isolated from backend data.
- GitHub issue `FPTU-Xperience/fptu-xperience-clubhub-ui#5`, CLBHB-UI-03.

The source screen flow requires university login, first-user capture of interests and major, optional timetable synchronization, then entry to the student main view. Returning users should bypass preference capture.

The onboarding UI is implemented as the reusable `src/components/v2/StudentOnboarding.jsx` component. `V2Access.jsx` only decides when that component should be shown.

## Implemented flow

```text
/v2/*
  -> AuthProvider restores token/user
  -> no authenticated user: v2 login
  -> authenticated student without valid preference record: onboarding
  -> returning student or non-student admin role: v2 main page
```

Login reuses the existing `AuthContext` methods and API endpoints:

- email: `POST /api/auth/dev-login`
- Google credential: `POST /api/auth/google`

No alternate token, seeded identity, or authentication bypass is introduced.

## Preference record

Until a backend preference contract exists, onboarding is a versioned local adapter. The key is isolated per authenticated identity:

```text
clubhub:v2:onboarding:<user-id>
```

The JSON value contains:

| Field | Meaning |
| --- | --- |
| `version` | Preference schema version; currently `1` |
| `major` | Selected FPTU major |
| `interests` | At least three unique interest IDs |
| `syncTimetable` | Consent/choice to use timetable conflict filtering later |
| `completedAt` | ISO completion timestamp |

Invalid, incomplete, or older-version records do not count as completed onboarding.

## Boundaries

- Authentication is real and shared with the existing app through its established local token/user storage.
- Club, activity, points, gift, and membership interactions under v2 remain synthetic in-memory demo data.
- The UI LAB actor switcher does not change the authenticated user or server permissions.
- Timetable sync is captured as a preference only; no timetable API contract exists in this repository yet.
- Admin, System Admin, and Student Affairs Admin accounts bypass student preference capture.

## Acceptance checks

- Visiting `/v2` without a session presents the v2 login.
- Successful email or Google login advances without a manual reload.
- A first-time student cannot finish without a major and three interests.
- Completion opens the v2 main page and survives logout/login and reload for that user.
- Another user receives an independent onboarding record.
- Returning users bypass onboarding.
- v2 route smoke tests can render the demo route tree independently of the authentication boundary.
