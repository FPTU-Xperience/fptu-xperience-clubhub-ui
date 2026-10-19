# Event registration and specialist-content extensions

Implement Status: Not Yet

Status Scope: Remaining optional specialist content and versioned registration-form resources, not existing participant/session endpoints.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Existing `ActivityWriteEndpoints`, `ActivitySessionEndpoints`, `SessionAttendanceEndpoints` provide participants, sessions and attendance. Custom form versions and reviewed registration applications are not declared. Staffing is owned by [action/staffing](activity-action-staffing-api.md), which replaces the older role/staff endpoint proposal.

If confirmed as product scope, extend activity DTOs with server-scoped content/registration capabilities. Versioned forms need stable question IDs, required validation and an immutable answer snapshot on submission. Own submit/withdraw and authorized review need expectedVersion, idempotency and capacity reservation in a transaction. Approval creates/deduplicates a participant; it does not verify attendance or award experience. Public discovery must not include applicants or answers.

Do not replace the existing participant API merely to add a form. Define migration/compatibility and decide which activities need approval versus direct registration. Acceptance covers own withdrawal, form revision, duplicate registration, last-seat races, closed/cancelled sources, specialist cross-club denial and privacy.
