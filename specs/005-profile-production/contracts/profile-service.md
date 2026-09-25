# Temporary Profile Service Contract

## Purpose

Provide the only data boundary consumed by the V2 profile page until an authorized production profile API replaces it. This contract is local and mock-only for the feature; it must not issue network requests or read demo state.

## Consumers and ownership

- Consumer: `src/pages/v2/profile-page/ProfilePage.jsx`.
- Owner: `src/pages/v2/profile-data.js`.
- Session input: the authenticated user plus its stable session/account key from `V2App`.
- Persistence: a versioned record scoped to that account key; missing account identity is an access failure, never a shared anonymous record.

## Operations

| Operation | Input | Successful result | Failure behavior |
|---|---|---|---|
| Load my profile | Current authenticated identity | A normalized profile snapshot defined in [data-model.md](../data-model.md) | Reports unauthorized when no account key is available; invalid persisted data falls back to the account's deterministic mock seed. |
| Save my profile | Current authenticated identity and editable patch | Fresh normalized snapshot with only permitted presentation fields changed | Validation errors preserve the caller's draft; persistence failures report an error and preserve the prior snapshot. |
| Retry profile load | Current authenticated identity | Re-runs the local load path | Must not return a prior account's result after a session-key change. |

## Editable patch

Only these fields may be accepted: `displayName`, `headline`, `about`, `skills`, and `interests`. Identity, email, roles, avatar source, academic information, club participation, activity counts, contribution summary, and evidence are ignored/rejected when supplied in a patch.

## State contract

The consuming hook exposes `loading`, `populated`, `empty`, `forbidden`, `unauthorized`, and `error` states in the same form used by `PageState`. It supplies a retry action and uses a session-aware request gate so a route/account change cannot render stale data.

## Future replacement boundary

A production adapter will later implement the same load/save operations against an authorized current-user profile endpoint. Its response must normalize to the same snapshot and preserve the privacy projection rules. No endpoint is added to `src/services/api.js` in this mock-data migration.
