# Student study schedule API contract

Status: **proposed for backend implementation**, updated 2026-10-07. `/v2/study-schedule` currently uses an account-scoped browser mock repository. These endpoints do not exist in the backend yet. Keep `dev-login` unchanged.

## Scope and ownership

- A student selects a calendar year, one of three terms (`SP` Spring, `SU` Summer, `FA` Fall), and a block (`10W` or `3W`). **Within each term, Block 10W is the first phase (10 teaching weeks), followed by Block 3W as the second phase (3 teaching weeks); they do not run in parallel.** Each week can have a different schedule. A cell stores one subject and optional room for a day and timeslot.
- The bulk import form accepts a **weekly template**: subject, day, slot, and optional room for each class. It applies each template row to **every week of the selected block** in one operation. A student can edit or clear an individual week's cell afterward.
- Admin UI configures `termStartDate`, `block10StartDate`, and `block3StartDate` once per year and term. The two block starts must be Mondays; 3W may follow a break but cannot begin until the 10W block has completed ten teaching weeks. Students only read these shared dates. The FE derives calendar week numbers and Monday–Sunday column dates from the start of the selected block and keeps block-local week identifiers for edits. Attendance, activity registration, FAP import, and public sharing are outside this contract. `/v2/my-schedule` remains the separate club activity schedule.
- The private timetable can live in AuthService: map self-service routes outside the management-only `/api/users` group, use `AuthPolicies.AllActors`, derive owner ID from the bearer token, and never accept a client-supplied user ID as authority. The gateway already forwards `/api/users/{**catch-all}` to AuthService. The shared academic calendar needs a gateway route and server authorization independent of timetable ownership.

## Identifiers and timetable

`year` is an integer from 2000 to 2100. `term` is exactly `SP`, `SU`, or `FA`; `block` is exactly `10W` or `3W`; `day` is `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, or `sun`. `week` is **block-local**: **1–10** in 10W and **1–3** in the following 3W block. The FE shows the 3W weeks as `Tuần 1–3`, as requested. These identifiers match [the FE constants](../../src/pages/v2/study-schedule-data.js). Times are local campus display times; clients send slot IDs, not timestamps.

The FE displays term names as the term code plus the last two year digits, for example `FA26` and `SP27`. API fields remain separate (`term: "FA"`, `year: 2026`).

| Slot ID  | Block 10W   | Block 3W    |
| -------- | ----------- | ----------- |
| `slot-1` | 07:00–09:15 | 07:00–08:30 |
| `slot-2` | 09:30–11:45 | 08:45–10:15 |
| `slot-3` | 12:30–14:45 | 10:30–12:00 |
| `slot-4` | 15:00–17:15 | 12:30–14:00 |
| `slot-5` | 17:30–19:45 | 14:15–15:45 |
| `slot-6` | —           | 16:00–17:30 |
| `slot-7` | —           | 17:45–19:15 |

Block 3W has seven 90-minute slots, 15-minute breaks between slots, and a 30-minute lunch break from 12:00 to 12:30. `slot-6` and `slot-7` are invalid for 10W. A single week has at most 35 cells in 10W or 49 in 3W. One full block holds at most 350 or 147 cells respectively.

## Endpoints and JSON DTOs

All routes require the existing bearer token. Use camelCase JSON. The path identifies the selected period; timetable mutations identify the week where relevant.

### `GET /api/academic-calendar/{year}/{term}`

Any authenticated student or admin can read the shared configuration. Return `200 OK` with:

```json
{
    "year": 2026,
    "term": "FA",
    "termStartDate": "2026-05-30",
    "block10StartDate": "2026-06-01",
    "block3StartDate": "2026-08-17"
}
```

Return all three date fields as `""` when the term is not configured. Dates use campus local calendar dates in `YYYY-MM-DD` format, without time zone conversion.

### `PUT /api/academic-calendar/{year}/{term}`

Only `ADMIN`, `SYSTEM_ADMIN`, or `STUDENT_AFFAIRS_ADMIN` may update. Request body contains exactly the three date fields above. Require real dates, Monday for both block starts, `termStartDate <= block10StartDate`, and `block3StartDate >= block10StartDate + 70 days`. Return `200 OK` with the full GET DTO. Store one configuration per `(Year, Term)` with an update timestamp and updating admin ID for audit. Editing dates changes calendar labels but must not move or erase student entries associated with block-local weeks. Reject invalid dates/order with `400`, non-admin writes with `403`. The server must enforce authorization; FE route gating is only presentation.

### `GET /api/users/me/study-schedule/{year}/{term}/{block}`

`200 OK`, including when empty:

```json
{
    "year": 2026,
    "term": "FA",
    "block": "3W",
    "calendar": {
        "termStartDate": "2026-05-30",
        "block10StartDate": "2026-06-01",
        "block3StartDate": "2026-08-17"
    },
    "entries": [{ "week": 1, "day": "mon", "slotId": "slot-1", "subject": "SWP391", "room": "AL-R101" }]
}
```

Return **all weeks** of this period in one response, sorted by week, day, then slot number. `entries: []` means empty. `calendar` is the same shared configuration returned by the academic-calendar GET endpoint, including empty strings before admin configuration. `room` is always a string, `""` if omitted. Do not expose database IDs or account IDs.

### `PUT /api/users/me/study-schedule/{year}/{term}/{block}/{week}/{day}/{slotId}`

Request: `{ "subject": "SWP391", "room": "AL-R101" }`.

Trim both strings. `subject` is required, 1–120 characters after trimming; `room` is optional, 0–80 characters after trimming. Return `200 OK` with `{ "week", "day", "slotId", "subject", "room" }`. PUT creates or replaces **only** this cell and is idempotent for the same body. Other weeks and periods stay unchanged.

### `DELETE /api/users/me/study-schedule/{year}/{term}/{block}/{week}/{day}/{slotId}`

Return `204 No Content` whether or not the cell exists. Delete only the selected user's cell in that week.

### `POST /api/users/me/study-schedule/{year}/{term}/{block}/bulk-import`

The body is a **weekly template**, without a week field. The server expands it to every week in the selected block:

```json
{
    "mode": "skip",
    "entries": [
        { "day": "mon", "slotId": "slot-1", "subject": "SWP391", "room": "AL-R101" },
        { "day": "wed", "slotId": "slot-3", "subject": "Tiếng Anh", "room": "" }
    ]
}
```

`mode` is `skip` or `replace`. `skip` keeps an existing cell and fills only empty cells; `replace` overwrites the matching cell in each week. Reject a blank template, invalid day/slot, duplicate day+slot rows, invalid text, or more than 35/49 template rows with `400` **before** writing. Apply the whole import in one transaction so no partial block is saved on failure. Return `200 OK`:

```json
{
    "imported": 6,
    "skipped": 0,
    "replaced": 0,
    "entries": [
        { "week": 1, "day": "mon", "slotId": "slot-1", "subject": "SWP391", "room": "AL-R101" },
        { "week": 1, "day": "wed", "slotId": "slot-3", "subject": "Tiếng Anh", "room": "" },
        { "week": 2, "day": "mon", "slotId": "slot-1", "subject": "SWP391", "room": "AL-R101" },
        { "week": 2, "day": "wed", "slotId": "slot-3", "subject": "Tiếng Anh", "room": "" },
        { "week": 3, "day": "mon", "slotId": "slot-1", "subject": "SWP391", "room": "AL-R101" },
        { "week": 3, "day": "wed", "slotId": "slot-3", "subject": "Tiếng Anh", "room": "" }
    ]
}
```

`imported`, `skipped`, and `replaced` count **week cells**, not template rows. `entries` contains the complete updated period in the same entry shape/order as GET. An identical second request with `skip` skips those cells; with `replace` it produces the same timetable. The FE preview reports collisions and defaults to `skip` before the user confirms.

## Validation and persistence

- Reject invalid year/term/block/week/day/slot combinations, malformed JSON, and invalid field lengths with `400 Bad Request` and field-oriented validation consistent with AuthService. An unauthenticated/expired session returns `401 Unauthorized`.
- Key persistent cells by `(UserId, Year, Term, Block, Week, Day, SlotId)` with a unique constraint. Store `Subject`, `Room`, and update timestamp. Store the shared calendar separately by `(Year, Term)`. Different-week writes must not erase each other. Do not log subject or room values.
- Enforce the existing active-account/session policy. The schedule remains private across role changes and account switching. BE must not infer or change a selected term based on the current date.

## FE mock and migration handoff

[The temporary timetable repository](../../src/pages/v2/study-schedule-repository.js) exposes `get`, per-week `putSlot`/`deleteSlot`, and block-wide `bulkImport`. It persists private cells by account, year, term, block, and week under `clubhub:v2:study-schedule:<authenticated-id>` in `localStorage`. [The admin calendar repository](../../src/pages/v2/academic-calendar-repository.js) stores shared dates under `clubhub:v2:academic-calendar` in the same browser and only allows admin roles to save via its UI API. This mock does not synchronize across devices or provide a security boundary. The initial student term selection is only a navigation convenience based on the browser month. Without configured block dates, the FE displays block-local weeks without calendar dates.

Version-2 local records represented a repeating schedule for the whole block. The mock reads those entries into **every week** on upgrade, preserving their meaning. Version-1 local records had no term; they remain unassigned until the user explicitly transfers them into an empty 10W period, which fills all 10 weeks. These local migrations are not BE endpoints.

Any student-entered `termStarts` from the earlier browser mock are ignored. They must not become shared academic calendar configuration; an admin enters the three dates explicitly.

When BE is deployed, replace repository methods with calls through [the existing API client](../../src/services/api.js), retaining auth, base URL, refresh/error handling, and camelCase conversion. Treat the server schedule as authoritative. Do not silently upload local mock records; any import into BE requires an explicit review/confirm flow.

## Acceptance checks

- [ ] New account: empty GET. PUT, GET, second PUT, DELETE, GET round-trip one week cell with normalized text.
- [ ] A cell in week 1 does not appear in another week unless bulk import put it there. SP/SU/FA, years, blocks, and users remain isolated.
- [ ] Admin GET/PUT round-trip the three shared dates; student can GET but receives 403 on PUT. Invalid weekdays/order fail before persistence.
- [ ] FE and BE preserve the fixed phase order 10W then 3W within a term; 3W weeks are numbered 1–3 inside that block and begin after the 10W teaching period ends, with an optional break.
- [ ] Admin-configured block Mondays produce correct ISO calendar weeks and day headers, including a year boundary. Changing dates leaves existing weekly entries intact. The two arrows beside the week heading above the timetable move one block-local week and stop at the first/last week.
- [ ] Bulk template with two rows fills 20 cells in 10W or 6 in 3W. `skip` preserves conflicts; `replace` overwrites them. Invalid or duplicate rows cause no partial writes.
- [ ] Invalid week (`0`, `11` for 10W, `4` for 3W), 10W `slot-6`/`slot-7`, invalid period, and overlong fields return 400.
- [ ] Unauthenticated calls return 401; one user cannot see or modify another user's entries.
- [ ] Gateway GET/PUT/DELETE/POST and FE week switching, reload, account switching, preview, conflict handling, and error states work on authenticated sessions.
