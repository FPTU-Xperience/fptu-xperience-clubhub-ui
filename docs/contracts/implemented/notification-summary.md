# UI Contract: Header Notification Summary

Archived on 2026-10-19. See [current lifecycle and remaining obligations](../contract-lifecycle-audit.md). The original text below records its dated scope; newer source evidence takes precedence.

Implement Status: Done

Status Scope: Implemented backend source boundary; deployment, storage and live acceptance remain unverified.

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: NotificationEndpoints.cs GetNotificationsAsync uses authenticated actor and scoped recipients; NotificationExtensions.cs applies access filtering and safe DTO mapping; notification persistence and Gateway route exist. Bounded six-item presentation is FE-only; no live or newly executed service-test claim.

## Scope

The V2 production header reads a bounded presentation of notifications belonging to the current authenticated user. This is a UI-consumption contract; server-side identity and authorization remain authoritative.

## Request

`GET /api/notifications`

- Requires the existing authenticated session.
- The client requests only when the user opens the notification control or explicitly retries.
- The client does not send another user's identifier, club identifier, role, or semester as a means of authorization.

## Successful response

The response may be an array, or an envelope containing an item collection. Each displayable notification should provide:

```json
{
  "id": "notification-id",
  "title": "Short authorized title",
  "message": "Display-safe message",
  "createdAtUtc": "2026-09-17T12:00:00Z",
  "isRead": false
}
```

The V2 adapter accepts equivalent existing timestamp field names but exposes only `id`, `title`, `message`, `createdAt`, and `isRead` to the header. It excludes entries with no stable id and displays at most six mapped summaries, ordered newest first when a trustworthy timestamp is available.

## Status behavior

| Server outcome | Header behavior |
| --- | --- |
| 200 with summaries | Show only mapped summaries for the active session. |
| 200 with no summaries | Show the explicit empty state. |
| 401 | Clear header notification data and follow established sign-in/session handling. |
| 403 | Show notification-unavailable state without prior-user content. |
| Network failure or other non-success | Show error state and Retry action. |

## Privacy and compatibility constraints

- The server must filter notifications to the authenticated user before responding.
- The response must not rely on client-side role checks for authorization.
- The header must not use demo notices, fixture actors, cached entries from another session, or local mutation behavior as a fallback.
- Marking notifications read and navigating to a notification-management page are outside this header migration; the popover is read-only.

## API rescan — 2026-10-09

Notification list and read mutations already exist on main 80818266; no replacement notification service is requested. New invitation, role, contribution and redemption notifications should use source outbox events and recipient deduplication under [shared conventions](../api-contract-conventions.md). Preserve this header's bounded safe projection and session isolation; full inbox pagination is a separate existing-API integration task (D14). See [handoff](../README.md).
