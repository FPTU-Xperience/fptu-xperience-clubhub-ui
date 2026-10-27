# Student study schedule and academic calendar API contract

Implement Status: Implemented in backend source; frontend uses the API exclusively.

Source Review: 2026-10-27. Backend revision bbf736798c4109cdd29d879b538eaa279a07fa39.
Source/test integration is separate from authenticated production acceptance and deployment configuration.

## Ownership and implementations

- AuthService owns private study schedules: [StudyScheduleEndpoints](../../../fptu-xperience-clubhub-api/src/Services/AuthService/Endpoints/StudyScheduleEndpoints.cs).
- AdminService owns campus academic calendar configuration linked to an official semester: [AcademicCalendarEndpoints](../../../fptu-xperience-clubhub-api/src/Services/AdminService/Endpoints/AcademicCalendarEndpoints.cs).
- DTOs and validation: [AcademicCalendarContracts](../../../fptu-xperience-clubhub-api/src/Shared/ClubReportHub.Shared/Schedules/AcademicCalendarContracts.cs).
- Persistence migrations: AuthService PrivateStudySchedules and AdminService AcademicCalendarBySemester, both dated 2026-10-22.
- Backend acceptance scenarios: [StudyScheduleContractTests](../../../fptu-xperience-clubhub-api/tests/Backend.StabilizationTests/StudyScheduleContractTests.cs); route selection: ClubManagerGatewayTests.
- ClubHub uses [schedule-api.js](../../src/services/schedule-api.js) through the existing authenticated API client. Admin UI uses its existing API client in [AcademicCalendar](../../../fptu-xperience-admin-ui/src/pages/seasons/AcademicCalendar.jsx).

No browser timetable/calendar repository, mock fallback or automatic local-data migration remains. Missing authority/configuration returns the API error rather than an empty local success.

## Identifiers

Year: 2000–2100. Term: SP, SU or FA. Block: 10W or 3W. Day: mon through sun.
Weeks are block-local: 1–10 for 10W and 1–3 for 3W. Display labels such as FA26 do not replace separate year/term fields.

| Slot | 10W | 3W |
| --- | --- | --- |
| slot-1 | 07:00–09:15 | 07:00–08:30 |
| slot-2 | 09:30–11:45 | 08:45–10:15 |
| slot-3 | 12:30–14:45 | 10:30–12:00 |
| slot-4 | 15:00–17:15 | 12:30–14:00 |
| slot-5 | 17:30–19:45 | 14:15–15:45 |
| slot-6 | Invalid | 16:00–17:30 |
| slot-7 | Invalid | 17:45–19:15 |

Subject is trimmed, required, 1–120 characters. Room is optional, trimmed, up to 80 characters.

## Academic calendar

GET /api/academic-calendar/{year}/{term} requires an active authenticated account. Campus defaults to its authoritative profile campus. An authorized global Admin can select an explicit campusCode query; a campus-scoped actor cannot cross campuses. Supported campuses: HAN, HCM, DAN, CAN, QNH.

Response fields:

| Field | Meaning |
| --- | --- |
| year, term | Requested alias |
| semesterId, semesterKey | Official semester GUID and code |
| campusCode | Resolved authoritative campus |
| version | Opaque GUID; use exactly as returned |
| isActive, canWrite | Semester state and write eligibility |
| availability | UNCONFIGURED, AVAILABLE or STALE_CONFIGURATION |
| termStartDate, block10StartDate, block3StartDate | YYYY-MM-DD dates; empty strings when the known semester has no configuration |

PUT to the same path requires the server backoffice policy, campus authorization, an Idempotency-Key header, and this body:

~~~json
{
  "expectedVersion": "<version from GET>",
  "termStartDate": "2026-08-30",
  "block10StartDate": "2026-08-31",
  "block3StartDate": "2026-11-09"
}
~~~

Returns the full GET DTO with the new version. Dates must be real; termStartDate equals the official semester start. Both block starts must be Mondays, block3StartDate must be at least 70 days after block10StartDate, and all 13 teaching weeks must fit within the official semester bounds. Inactive semesters are read-only. Changes append an audit revision and do not move/delete private timetable cells.

### Required semester alias configuration

The backend resolves Workspace:SemesterAliases:{semester-guid}:Year and :Term against existing official semester records. Neither frontend nor backend guesses that mapping from dates or code strings. An absent mapping returns 404 SEMESTER_UNCONFIGURED; duplicate mappings return 409 SEMESTER_ALIAS_AMBIGUOUS. A known semester without block dates is different from an unknown alias. Configure aliases through the deployment-managed backend configuration before expecting a selected year/term to load.

## Private study schedule

Root: /api/users/me/study-schedule/{year}/{term}/{block}. Ownership comes exclusively from the bearer identity; no userId is sent in the payload. All operations revalidate the active/unlocked account and calendar authority. Responses are private/no-store.

GET root returns:

~~~json
{
  "year": 2026,
  "term": "FA",
  "block": "3W",
  "version": "<block GUID, empty GUID for a new block>",
  "calendarVersion": "<calendar GUID>",
  "calendar": {
    "termStartDate": "2026-08-30",
    "block10StartDate": "2026-08-31",
    "block3StartDate": "2026-11-09"
  },
  "semesterKey": "<official semester code>",
  "semesterId": "<official semester GUID>",
  "campusCode": "HAN",
  "availability": "AVAILABLE",
  "canWrite": true,
  "entries": []
}
~~~

Each entry is {week, day, slotId, subject, room}. Entries are ordered by week, day and slot. Historical own reads remain available when a semester is inactive; new writes do not.

### PUT one cell

PUT root/{week}/{day}/{slotId}, with Idempotency-Key:

~~~json
{
  "subject": "SWP391",
  "room": "AL-R101",
  "expectedVersion": "<current block version>",
  "expectedCalendarVersion": "<current calendar version>"
}
~~~

Returns {week, day, slotId, subject, room, version, calendarVersion}. Creates/replaces only this cell. Frontend remembers the returned versions for the next mutation.

### DELETE one cell

DELETE root/{week}/{day}/{slotId}?expectedVersion=...&expectedCalendarVersion=..., with Idempotency-Key and no body. Returns 204. Frontend reloads GET to obtain the new block version before the next edit.

### Bulk import

POST root/bulk-import, with Idempotency-Key:

~~~json
{
  "mode": "skip",
  "entries": [{"day": "mon", "slotId": "slot-1", "subject": "SWP391", "room": "AL-R101"}],
  "expectedVersion": "<current block version>",
  "expectedCalendarVersion": "<current calendar version>"
}
~~~

The body is one weekly template, expanded to all weeks of this block. At most 35 template cells for 10W or 49 for 3W. Duplicate day/slot, empty templates, invalid slot/text or mode fail before writing. skip retains occupied cells; replace overwrites matching cells. The entire import is atomic.

Returns {imported, skipped, replaced, entries, version, calendarVersion}. Counters count week cells; entries is the complete updated block. Two template rows fill 20 cells in 10W or 6 in 3W when empty.

## Conflict and failure handling

- 400: invalid period/week/day/slot/text, unsupported or duplicate JSON fields, missing required versions, invalid calendar dates/template.
- 401/403: missing identity, ineligible account, unauthorized campus/calendar write or internal access.
- 404: unknown official semester alias.
- 409: ambiguous alias, inactive/stale semester, calendar or block version conflict. Frontend invalidates cached block versions and requires a fresh GET after conflicts.
- 413: bounded JSON payload exceeded.
- 503: calendar authority/internal credential unavailable. Do not fall back to browser storage or treat it as invalid student input.

Existing backend tests cover owner isolation, campus policy, version replay, invalid payloads, atomic bulk import, calendar changes, inactive history, alias failures, append-only history, migrations and SQL concurrency. Frontend tests cover the request DTO/version boundary and calendar/week/template presentation. These tests do not establish that production semester aliases or a real authenticated round trip have been configured and verified.
