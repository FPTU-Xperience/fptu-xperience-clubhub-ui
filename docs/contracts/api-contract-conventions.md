# API debt: shared implementation conventions

Audit date: 2026-10-09. These conventions apply to the **proposed** endpoints in this package; existing production routes retain their compatibility until an explicit migration. See [implementation handoff](backend-api-implementation-handoff.md).

## Authority and transport

- Browser calls the existing `src/services/api.js` facade through `VITE_API_BASE_URL`/Gateway. Only presigned object PUT bypasses the gateway; it never sends an application bearer token to R2. No second client or direct browser calls to internal services.
- Identity comes from the principal. Cross-service roster/profile/access reads require authenticated internal service communication with purpose, campus and club scope. Never trust submitted names, role names, prices or client permission flags.
- Dates for instants are ISO-8601 UTC/offset values. Calendar dates are `YYYY-MM-DD`; local club/timetable times are `HH:mm` in `Asia/Ho_Chi_Minh`. `24:00` is permitted only as a same-day schedule end, never a start.
- Existing user/club/activity/membership IDs remain positive integers. New resources may use opaque GUIDs. JSON uses camelCase; versions are opaque strings, never client-generated timestamps.
- Semester authority is existing AdminService `Semester.Id` (GUID) and `SemesterCode`. FE `SP/SU/FA` and calendar year are UI aliases, not a second semester catalog. Resolve aliases through explicit server metadata; do not assume every `SemesterCode` fits `FALL2026` or infer current semester from browser time.

## Standard responses

Paged new reads return `{ items, page, pageSize, totalItems, totalPages }`, page starts at 1, pageSize 1..100 unless a narrower route specifies otherwise; use deterministic ordering plus ID tie-breaker. Eligible-member lookup retains its existing `semesterId` echo. Empty success is an empty collection, not 404. Unconfigured/unavailable resources use explicit error codes, not fabricated zero values.

Errors retain a human-readable `message` compatible with the current FE client and add stable `code`, `traceId`, and optional field `errors`:

```json
{"message":"The resource changed. Reload and retry.","code":"VERSION_CONFLICT","traceId":"opaque","errors":{}}
```

400 invalid request/unknown fields, 401 invalid session, 403 disallowed operation/field, 404 nonexistent or intentionally undiscoverable resource, 409 stale version/state/duplicate/insufficient points, 422 roster eligibility failure, 429 rate limit, 503 dependency/config unavailable. Return `Retry-After` when appropriate. Redact secrets, private record data and existence details. FE currently retains `status` and formatted message only; a follow-up must retain structured `code/errors` before relying on code-specific UI behavior.

Partial PATCH: omitted values preserve existing values; explicit `null` clears nullable fields, empty strings clear optional text. Reject unknown fields and writable identity/authority fields. Each mutation returns the canonical updated record with `version` unless its contract specifies 204. Use `expectedVersion` on mutable resources; verify state and ownership again at commit.

## Transactions, events and privacy

Idempotency-Key applies to irreversible awards/redemptions/import commits/invitations and append-only evidence/registration submissions. Persist `(actor, route, key, requestHash)` with the committed response for at least 24 hours; same key + changed payload is 409, same request returns original result. Database constraints and transactions still prevent races with different keys.

Cross-service side effects use an outbox committed alongside the source mutation; consumers deduplicate `eventId`. Award/redemption must not succeed halfway through a debit/grant. Notification delivery failure never rolls back an already committed invitation; retry delivery independently.

Self-profile and timetable are self-only. Club leadership never edits another member's personal profile. Scoped organizational roles never grant global admin/CTSV rights. Public DTOs exclude rosters, contacts, user IDs, ledger internals and storage paths. Spendable club credit, raw experience points, Admin XP ledger and financial money are separate quantities; no implicit conversion.

## Required proof per implementation batch

Migrations and upgrade/backfill; endpoint/DTO contracts; principal/campus/club tests; stale-version/concurrent/replay tests; service-failure behavior; outbox/consumer tests where applicable; gateway route precedence and verbs; authenticated FE integration after deployment. Source existence is not a live integration sign-off. Never promote browser fixtures, sample wallets or locally acquired cosmetic ownership into real server grants.
