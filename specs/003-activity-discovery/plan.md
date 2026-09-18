# Implementation Plan: Khám phá hoạt động

**Branch**: `003-activity-discovery` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [`spec.md`](spec.md)

## Summary

Thêm trang production V2 `/v2/activities` để hiển thị một feed hợp nhất, chỉ gồm hoạt động
`UPCOMING` hoặc `LIVE` mà người dùng hiện được phép xem: hoạt động công khai và hoạt động của các
CLB có membership hiệu lực. Thêm section tối đa sáu gợi ý trên Discover; mỗi thẻ mở chi tiết chỉ
đọc tại chỗ và chỉ cho phép đi tiếp tới ngữ cảnh mà server cho phép.

Giao diện kế thừa cấu trúc thẻ, tìm kiếm và chi tiết của demo `CLB của tôi → Hoạt động`, nhưng mọi
production page dùng adapter V2-local và API projection ít đặc quyền. Không dùng `DemoContext`,
fixture, actor switching hoặc mutation demo. Cần một contract backend mới: endpoint Activity hiện
tại trả participant/attendance PII, không có cờ public, và không thể đại diện an toàn cho union
public + active-membership đã nêu trong spec.

## Technical Context

**Language/Version**: JavaScript ES modules; React 18.2

**Primary Dependencies**: React Router 6, existing V2 authentication boundary, `lucide-react`,
Sass, Vite 5

**Storage**: Existing browser token/session storage only. The Activity and recommendation sources
remain authoritative; the UI introduces no persistent cache or local business state.

**Testing**: Node built-in tests under `src/pages/v2/*.test.js`, existing V2 demo route smoke,
focused production route/adapter tests, and `npm run build`.

**Target Platform**: Authenticated desktop/laptop browsers; 1060px desktop baseline, with usable
responsive behavior at narrower widths.

**Project Type**: Single-page web application with a dependent ClubHub API and recommendation
service contract.

**Performance Goals**: At a permitted feed of 50 activities, changing the client search term
updates visible results within one second; current route and section show loading feedback without
blocking navigation.

**Constraints**: Production lives only in `src/pages/v2` and `src/components/v2`; `/v2/demo`
remains isolated. Server enforces public/membership eligibility. No raw roster, attendance,
user-ID, application, manager-permission or demo data enters a feed/recommendation DTO. 401
continues through existing sign-in handling; 403, empty and retriable failures remain visible.

**Scale/Scope**: One protected V2 feed route, one Discover section capped at six items, one
read-only in-context detail view, and two display-safe read contracts. Feed scope is `UPCOMING` and
`LIVE` only; it deliberately excludes completed and cancelled history.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status before design | Evidence / required action |
| --- | --- | --- |
| V2-first production context | Pass | Add only V2-local production route, pages, components, styles and adapters. Demo UI is visual reference only. |
| Server-authoritative access | Pass with blocking contract dependency | Existing Activity response is not safe or semantically sufficient. Implement/agree the authorized feed and recommendation contracts before wiring UI. |
| Truthful data and states | Pass | Use explicit loading, empty, forbidden and error states; never substitute fixture data. |
| Scoped state and privacy | Pass | Bind request identity to session and route; clear/ignore stale results on session change. DTOs omit rosters, attendance and personal fields. |
| Proportional verification | Pass | Cover direct navigation, session continuity, server denials, retry, stale requests, demo isolation and build. |
| Multi-issue traceability | Pass with handoff action | Record the API field/privacy boundary and issue relationship for UI activity/recommendation work before implementation handoff; update the dependency graph if existing links do not identify the new contract. |

**Post-design check**: Pass with the same upstream contract dependency. The design defines a
least-privilege feed and recommendation projection; it does not authorize reuse of the current
`/api/activities` response or client-side filtering of its data.

## Project Structure

### Documentation (this feature)

```text
specs/003-activity-discovery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── activity-discovery-contract.md
└── tasks.md                 # created by speckit-tasks
```

### Source Code (repository root)

```text
src/
├── context/
│   └── AuthContext.jsx                    # current user/session and club access refresh
├── services/
│   └── api.js                             # authenticated request methods for approved contracts
├── pages/v2/
│   ├── V2App.jsx                          # production `/v2/activities` route ownership
│   ├── discovery-page/DiscoveryPage.jsx   # recommended-activities section composition
│   ├── activities-page/                   # new production feed page and page-scoped styles
│   ├── activity-data.js                   # display-safe mappers and request lifecycle
│   └── *.test.js                          # adapter, route and isolation coverage
└── components/v2/
    ├── activity-card/                     # production activity card derived from demo visual language
    ├── activity-detail/                   # read-only in-context detail presentation
    └── PageState.jsx                      # existing availability-state primitive

../fptu-xperience-clubhub-api/
└── src/Services/ActivityService/           # server-authoritative feed projection and authorization

../fptu-xperience-doc/
└── docs/clubhub-ui-issue-dependency-graph.md # cross-issue contract traceability, when impacted
```

**Structure Decision**: Keep all UI production behavior in V2-local modules. The API and
documentation repositories are contract/traceability dependencies, not source trees to import
from the UI. Reuse shared V2 state presentation only where it does not pull demo dependencies.

## Complexity Tracking

No constitution violation requires justification. The additional server projections are required
to preserve the authorization and privacy boundary; they are not optional client complexity.
