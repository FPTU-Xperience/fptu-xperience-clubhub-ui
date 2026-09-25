# Data Model: Migrate Production Profile

## Identity input

| Field | Source | Rules |
|---|---|---|
| `accountKey` | Authenticated user ID, otherwise authenticated email | Required for profile access and persistence; no anonymous key is permitted. |
| `accountName` | Authenticated user name | Seeds `displayName`; never overwritten by a profile edit. |
| `email`, `roles`, `avatar` | Authenticated user | Read-only session context; only the display-safe avatar value is used as a seed/fallback. |

## Profile snapshot

The repository returns one normalized snapshot for the current account. Callers receive copies so a page cannot mutate persisted mock data accidentally.

| Group | Fields | Rules |
|---|---|---|
| `profile` | `displayName`, `avatarUrl`, `initials`, `headline`, `about`, `interests`, `skills`, `project` | `displayName`, headline, about, skills, and interests are the only editable presentation fields. Skills are trimmed, de-duplicated, and limited to a small bounded list. |
| `academic` | `campus`, `major`, `year`, `studentCode` | Read-only response data. Student code is hidden in shared preview. |
| `participations` | `clubId`, `clubName`, `clubLogoUrl`, `role` | Representative approved club relationships; display only. |
| `summary` | `clubCount`, `activityCount`, `recognizedContributionTotal`, `contributionRecordCount`, `experiencePillars` | Aggregate display values; detailed total is hidden in shared preview. The six-pillar values are numeric and bounded 0–100. |
| `evidence` | `id`, `term`, `date`, `clubId`, `clubName`, `title`, `source`, `verifier`, `points` | Read-only records; filter by selected term. Entire evidence history and point details are hidden in shared preview. |
| `terms` | `id`, `label` | Provides `All terms` plus the available term filter options. |

## Persisted mock record

| Field | Rule |
|---|---|
| `version` | Required repository schema version. Unrecognized or corrupt records are ignored and replaced by a deterministic seed for the current account. |
| `profile` | Stores only self-managed presentation fields. |
| `savedAt` | Records the last local mock update for diagnostics; it is not rendered as achievement data. |

The persistence key follows the existing V2 per-user pattern: `clubhub:v2:profile:<accountKey>`. The repository must reject reads/writes when no authenticated account key exists.

## Edit validation and transitions

| Transition | Preconditions | Result |
|---|---|---|
| Seed → Loaded | Authenticated account key exists; no valid saved record | Return account-scoped representative mock snapshot. |
| Loaded → Edited | Student opens the edit dialog | Draft contains only editable presentation fields. |
| Edited → Saved | Non-empty display name and valid bounded text/list fields | Persist sanitized editable fields under the account key and return a fresh snapshot. |
| Edited → Validation error | Required/limited field is invalid | Preserve draft and identify the field; do not change stored snapshot. |
| Loaded/Edited → Account changed | Authenticated account key changes | Discard prior view state and load only the new account's snapshot. |
| Loaded → Shared preview | Student toggles preview | No persistence change; project a privacy-safe view that removes student code, contribution total, evidence, and point detail. |

## Privacy projection

Shared preview is a pure client-side view of the loaded snapshot. It must not write a publication state, link, or visibility flag. The private snapshot remains available only to the current authenticated page session.
