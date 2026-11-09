# Club workspace student declarations — 2026-10-22

Added **Trải nghiệm tự khai** next to Báo cáo in the production club workspace at `/v2/my-clubs/:clubCode/student-declarations`.

## Behavior and access

- List student experience title/identity, evidence availability, status, occurrence date and assigned semester. Search covers the complete authorized current-club result, with status and workspace/unassigned/all-period filters and local paging.
- Detail shows submitted narrative, private evidence download or safe historical evidence link, available review history and server-provided raw Xperience Point results. Club review controls are visible to processing roles, but production writes remain unavailable until backend support exists.
One permission: **Xử lý trải nghiệm tự khai trong CLB**, ID `club.declarations.process`, covers reading records/private evidence, club review/requesting changes and forwarding an endorsed record to CTSV. President/vice president in the current club receive it automatically. Every other role requires the explicit unified grant in `studentDeclarationPermissions`; obsolete `canViewStudentDeclarations` and split read/review/submit grants do not grant processing. Leadership administers grants, with two checked/locked rows and one checkbox for each other role. Processing rights do not grant unrelated management permissions. Observation mode stays blocked; server authorization remains authoritative.

Production has no permission policy persistence, club review or forwarding API. The UI exposes this boundary and keeps real writes disabled. Temporary checkbox choices never grant actual rights. Club endorsement is separate from final CTSV approval and never posts official Xperience Point. Existing declaration reads and private evidence downloads retain server scope checks.

## Inspected source integration

Reused GET `/api/v1/student-affairs/declarations/` and GET `/api/v1/declarations/{id}` from `DeclarationEndpoints`. The queue authorizes the principal's assigned scopes but does not accept a clubId filter. The adapter traverses all server pages, checks totals and duplicates, discards other-club/external-unassigned records, then computes the current club's filters/paging. It does not read the student's `/me` endpoint or join the club roster to infer evidence-sharing consent. Detail response identity and club are checked again before display.

The current endpoint exposes legacy declarations linked by `ClubId`; it does **not** implement the newer external referral/endorsement flow. Experiences sent directly to CTSV are not automatically shared with the club. The existing [personal experience contract](../contracts/personal-experience-api.md) still owns the pending referral extension. Historical records without a canonical semester remain explicitly unassigned; date proximity is not treated as an authoritative semester assignment.

A 403 is an access-denied state; API failures, empty lists and scope errors remain distinct. No mock fallback, fabricated name/score, endpoint or production sample is introduced.

## Verification

- V2 unit suite: 202 passed (V2 plus governance), including unified grants, leadership defaults, obsolete-grant rejection and delegated/denied/member/observer gates, all-page traversal, cross-club/external exclusion, stale totals, detail mismatch and historical semester handling.
- Production build passed with the existing chunk warning.
- `node scripts/club-declarations-smoke.mjs`: full workspace/sidebar, single-checkbox editor, president/vice/delegated guards, list/filter/detail, private download, ordinary/delegated member guards, 403/error/empty states, malicious mismatched detail, 320/375/414/768/1440 geometry and no writes. Browser-only controlled fixtures; screenshots in system temp `clubhub-club-declarations-qa` were visually inspected.
- `node scripts/affairs-smoke.mjs`: passed after supplying the existing `clubAccess: []` dependency in its auth fixture; observer route/sidebar/write separation remains intact.

These checks establish frontend behavior against fixtures and source declarations, not live API deployment, production authorization grants or storage acceptance. Existing worktree changes are retained. No commit/push.
