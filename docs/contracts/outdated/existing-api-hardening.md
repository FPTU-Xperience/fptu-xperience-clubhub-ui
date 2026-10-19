# Existing API contracts requiring changes, not duplicate endpoints

Archived on 2026-10-19. See [current lifecycle and remaining obligations](../contract-lifecycle-audit.md). The original text below records its dated scope; newer source evidence takes precedence.

Implement Status: Cancel

Status Scope: Historical specification or source snapshot, superseded by the 2026-10-19 lifecycle audit; never a current implementation claim.

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: MemberManagementEndpoints.cs still permits managed personal snapshot writes; ManagerEndpoints.cs trusts client ManagerName; QuestEndpoints.cs accepts target StudentUserId; ReportContracts.cs exposes StoragePath. Existing routes are not proof of the required fixes.

D14; source audit 2026-10-09, main 80818266. Follow [conventions](../api-contract-conventions.md). The following are explicit backend or FE integration tasks rather than evidence that every route is absent.

| Finding and source | Required change | Acceptance |
| --- | --- | --- |
| Auth UserEndpoints management PUT rejects SYSTEM_ADMIN target; legacy SystemAdminProfile disabled | Canonical D02 self PATCH for mutable display/presentation fields; preserve identity/email/roles/locks. Migrate legacy editor, no parallel self PUT contract | admin/student self edits; cross-user/role/email writes denied; reload canonical |
| Club MemberManagementEndpoints UpdateMemberProfile authorizes CanManageMemberships and edits personal snapshot | Revoke manager writes to other members; self edits through D02, immutable application snapshot and private canonical projections. Legacy ClubMembersPage still has this caller | owner/vice/manager cannot edit another user's name/contact; historical application unchanged |
| ManagerEndpoints AssignClubManager trusts ManagerName and does not resolve canonical account | Internal Auth lookup verifies exists/active/unlocked/eligible role/campus; derive name; enforce one active managed club and current ownership workflow atomically | forged name/unknown account/locked account/race/cross-campus denied |
| QuestEndpoints CompleteQuestAsync uses AnyActor and accepts request StudentUserId without a scoped verifier guard in that handler | Self completion may only create a self submission, not verified completion/points; trusted verification requires CTSV scope and target campus. Reuse existing quest catalog, tighten write instead of exposing it as club task award | arbitrary target and self-verified credit denied; two actors, duplicate review |
| Admin anomaly/XP ledger helper seeds example entries on reads | Ensure production reads never create illustrative ledger/anomaly awards; seed only explicit development fixtures; do not promote them into club wallet | empty production DB stays empty after GET; counters never debit/mint samples |
| ReportContracts ReportAttachmentResponse exposes StoragePath | Remove/redact path from read DTO, retain opaque ID and metadata; protected download path unchanged | JSON contains no internal path; author/reviewer authorization and denial tested |
| ClubCategories now persist, but application mapper normalizes through static ValidationExtensions | Validate canonical active category **code** against persisted catalog across club create/update/public-profile/application. Preserve unknown historical code; do not collapse valid custom category to OTHER | new category round-trip all flows; invalid/disabled category denied |
| Reports/Finance/Notifications FE filter only first 100 rows | Extend existing query params/paging where unsupported; switch FE to server-side search/status/period filters and total counts | >100 rows, page boundaries and server-role scope; no extra duplicate list API |
| CreateReportPage author fetches admin reporting deadlines and catches 403 | Reuse existing `/api/deadlines/me`, not another deadline endpoint | ordinary author receives own applicable dates; admin directory remains protected |
| ActivityDetailPage finds detail through whole feed | Use D11 display-safe direct detail; management GET stays protected | cold direct URL, 403/404, private records absent |
| Invite POST already exists, semesterId ignored and client FullName trusted | D05 roster revalidation/source/outbox; migration and compatibility documented | selection-to-invite race, false consent, manager cannot personally accept |

Structured error `code/errors` are currently lost by the FE client after message formatting. Add non-breaking Error metadata when wiring new contracts; retain existing status handling and refresh logic. Endpoint existence is not production proof. Read/write authorization, campus policy, DB migration and gateway behavior must be validated separately.

Backend-only existing workflows (disband/transfer/reviews, global roles, audit, manual finance adjustment, approved-report activity creation) are FE work if adding screens; do not duplicate them as missing endpoints. Finance submit routes whose existing handler is acknowledgment-only require lifecycle verification before a button is treated as a state transition.

## Compatibility notes retained from the retired facade audit — 2026-10-13

- User create/update management supports its existing restricted role catalog; Google sign-in is the credential flow, not a client-supplied password. SYSTEM_ADMIN self editing must use the future canonical self profile, not broaden management PUT.
- Admin club PUT accepts logoUrl and can default isActive to true; preserve state in existing callers. Assigned club managers require the scoped public-profile/media writers rather than admin PUT. Activity generic PUT has no cover-image field.
- Activity registration/check-in/completion return action results, not ActivityResponse. Existing FE reloads authorized detail after actions, does not send status in the core edit request, and maps attendance's paged response. Keep that response compatibility when extending resources.
- Existing authenticated report downloads are the attachment transport; never use StoragePath as a browser URL. D14 still must redact the JSON storage path.
- Dashboard counts/next activity compose existing club, activity, manager-membership and report reads. No contribution-review total is fabricated; D07 owns that missing projection. Upcoming/pending card summaries remain optional richer selection data.
- Existing owner transfer/disband/reviews, roles/audit, manual finance adjustments and approved-report activity creation are established backend workflows, not missing APIs just because there is no UI facade/screen. Keep final lifecycle verification separate from route declarations.
