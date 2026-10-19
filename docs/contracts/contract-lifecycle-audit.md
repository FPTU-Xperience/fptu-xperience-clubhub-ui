# Contract lifecycle audit — 2026-10-19

Implement Status: Done

Status Scope: Completed source/documentation classification and move ledger only; listed missing implementations and live verification are not complete.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf; fetched current remote branch and origin/main equal local HEAD. FE audit baseline: 82e5e63ca9061cae5f287cb93d8d03f34f96ad5b plus preserved local edits and this integration batch.

See [current index](README.md), [workspace flow/FR matrix](../../../fptu-xperience-doc/docs/fe-be-audit-2026-10-19.md), [facade inventory](api-declaration-inventory.md), and [all parsed endpoints/consumers](../qa/workspace-source-inventory.md). Match routes, DTOs, capabilities, versions and business effects separately. Existing BE source does not close a larger product contract automatically.

## Move ledger

The migration preserves obsolete Markdown under outdated, refreshes implemented contract text, rebases local links, and never deletes a feature obligation. `outdated` means superseded source snapshot/proposal, not cancellation of the underlying product requirement. `implemented` means the stated source subset exists, not live acceptance. Original statuses inside archived text are historical; the archive header and current replacement govern.

| Moved contract | Destination | Current owner / evidence |
| --- | --- | --- |
| backend-api-implementation-handoff.md | [outdated](outdated/backend-api-implementation-handoff.md) | Old dependency waves falsely called profile/media/student reads absent; current README and workspace audit replace it |
| backend-changes-for-frontend.md | [outdated](outdated/backend-changes-for-frontend.md) | D01–D14 blanket pending snapshot; each remaining gap has its own active owner |
| frontend-api-debt-register.md | [outdated](outdated/frontend-api-debt-register.md) | Old wrapper counts and source absence assertions; regenerated inventory + current flow matrix |
| page-integration-checklist.md | [outdated](outdated/page-integration-checklist.md) | Old page-level snapshot; current FE consumers and validation are in workspace audit/QA |
| activity-discovery-api.md | [outdated](outdated/activity-discovery-api.md) | Actual student endpoints and DTOs are recorded in implemented/student-experience-reads-api.md; exact old draft shape is not claimed implemented |
| personal-experience-api.md | [outdated](outdated/personal-experience-api.md) | Proposed credited totals differ from actual raw summary/ledger; current implemented read contract plus active wallet gap replace it |
| self-profile-sync-api.md | [outdated](outdated/self-profile-sync-api.md) | Five text/phone fields now implemented; broad academic/media/projection obligations move to self-profile-extensions-api.md |
| club-event-operations-api.md | [outdated](outdated/club-event-operations-api.md) | New action/staffing UI has another shared aggregate contract; custom form/content obligations retained in event-registration-extensions-api.md |
| existing-api-hardening.md | [outdated](outdated/existing-api-hardening.md) | Mixed dated findings include fixed detail/profile issues; current unresolved hardening findings are below, not treated as reverified vulnerabilities |
| club-public-profile-api.md | [implemented](implemented/club-public-profile-api.md) | ClubPublicProfileEndpoints, ScheduleJson, GUID concurrency; FE sends expectedVersion |
| specs/002-header-production/contracts/notification-summary.md | [implemented](implemented/notification-summary.md) | Authenticated recipient-filtered notification reads and existing FE header consumer; no new delivery/live claim |

Archive moves are explicitly listed by `scripts/archive-contracts-2026-10-19.py`, a one-time migration that refuses to overwrite an existing archive. Do not rerun it as a future status classifier. Source changes require a fresh audit.

## Retained active contracts, every file

| Contract | Status and current remaining obligation |
| --- | --- |
| [Conventions](api-contract-conventions.md) | Not Yet: package-wide adoption/migration and all proposed endpoints; existing ApiOperations already provides transactional idempotency on newer workflows |
| [Activity resources](activity-profile-resources-api.md) | Not Yet: resources/gallery/upload-intents/commit and specialist capability projection absent; cover persistence now exists separately |
| [Club points](club-contributions-points-api.md) | Not Yet: verified contribution/effect foundations now exist, but no spendable club wallet/raw-budget consumption/task award lifecycle |
| [Governance groups](club-governance-groups-api.md) | Not Yet: multi-groups, terms/change sets/office/report snapshot absent; verification assignments are not club governance |
| [Governance proposal](club-governance-groups-proposal.md) | Not Yet: retained product decisions, not a competing implemented API; keep until canonical groups/history obligations are fulfilled |
| [Member invitations](club-member-invitations-api.md) | Not Yet: invite/consent foundations exist; eligible school roster, authoritative invitation semester and delivery remaining |
| [Navigation/applications](club-navigation-applications-api.md) | Not Yet: withdrawal/source capabilities/version/pins remaining; canonical directory code/logo and review time foundations exist |
| [My Clubs membership](my-clubs-membership-api.md) | Not Yet: composed reads exist; own withdrawal/WITHDRAWN/reapply and account pin authority not found |
| [Rewards/cosmetics](profile-cover-rewards-api.md) | Not Yet: no authoritative cosmetic catalog/inventory/redemption/equip persistence; browser sample state is not ownership |
| [Public images](public-image-api.md) | Not Yet: club/activity signing/verification/attachment source now exists; profile/shape kinds, full contract compatibility and live R2 still open |
| [Public member directory](public-member-directory-api.md) | Not Yet: optional/deferred opt-in directory and consent persistence absent; private roster does not satisfy it |
| [Semester roster](semester-student-roster-api.md) | Not Yet: semester CRUD exists; roster revisions/import/preview/carry-forward/history absent |
| [Study schedule](study-schedule-api.md) | Not Yet: private timetable and academic calendar persistence absent; FE repository remains device-local |
| [Workspace semester](workspace-semester-context-api.md) | Not Yet: Admin semester catalog is backoffice-scoped; manager-safe metadata and unified attribution remain absent |
| [Action/staffing](activity-action-staffing-api.md) | Not Yet: new exact FE application/recruitment/assignment/completion/publication contract; do not substitute current T-tier contribution pipeline |
| [Profile extensions](self-profile-extensions-api.md) | Not Yet: academic/media/additional personal fields; basic canonical member projection and separate applicationSnapshot now exist |
| [Source projections](experience-source-projections-api.md) | Not Yet: student-safe session/source, manager-safe catalog and unsupported media owners |
| [Event extensions](event-registration-extensions-api.md) | Not Yet: versioned registration forms/reviewed registration resources and specialist content boundaries |
| [Index](README.md) | Not Yet: tracks outstanding obligations; not itself a backend endpoint contract |

## Other retained specifications and generated files

| File | Decision |
| --- | --- |
| api-declaration-inventory.md | Done for generated method/path declarations only. Helper readMedia is excluded from business wrappers; media-backed facade methods are resolved. Nested groups and aliases are resolved explicitly; no runtime/DTO proof inferred |
| contract-lifecycle-audit.md | Done for this classification/move ledger only |
| specs/001-discover-production/contracts/discover-ui-contract.md | Not Yet: directory foundations present; minimal privacy/personalization obligations remain; student activity reads are now separately integrated |
| specs/003-activity-discovery/contracts/activity-discovery-contract.md | Not Yet: original full UI specification is not exactly the current BE DTO/policy; new reads available, residual publication/resources/action behavior remains |
| specs/004-club-workspace/contracts/workspace-ui-contract.md | Not Yet: authorized shell exists; governance/wallet/semester and specialist operations remain |
| specs/005-profile-production/contracts/profile-service.md | Not Yet: text/phone and experience reads now available; full media/academic/cosmetic/projection contract remains incomplete |
| implemented/canonical-self-profile-api.md | Done for canonical text/phone subset and consumer integration |
| implemented/verified-experience-operations-api.md | Done for current evidence/contribution/reviewer/policy/session/club-report source integrations; live acceptance unverified |
| implemented/student-experience-reads-api.md | Done for current student read subset and consumers, not the target credited-wallet model |

## Unresolved compatibility / hardening follow-ups

- Current API publication lifecycle is GUID DRAFT/PUBLISHED/CLOSED. The FE action publication toggle is integer/bool and requests a missing PATCH. Closing registration must never be described as hiding a published activity.
- Current verified contribution source allocation is raw points, not credited spendable wallet. Final report approval in the action proposal is another gate; do not silently award at completion verification.
- Admin canonical declaration queue responses differ from legacy title/student/capability/score shapes. The FE mapper and review version/attributes were updated; full private evidence/detail/reviewer assignment workflows remain separately tracked in the workspace audit.
- Source extraction lists aliases and dynamic-call limitations; no exact literal consumer is a review candidate, not proof of unused/dead endpoints.
- Historical hardening findings about manager-provided names, target quest completion, membership personal writes, seeded anomaly reads, report storage paths, category validation and first-page truncation need dedicated handler/security regression evidence before closing. This audit does not re-label all old findings as confirmed current vulnerabilities.
- Current product policy conflicts (including +1 linear cap versus source saturation) remain O-01–O-14 decisions; no calculator/policy approval was performed.

## Verification boundary

Read [audit QA](../qa/fe-be-audit-2026-10-19.md) for executed commands/results. Contract checks validate status/scope/hash, local links and JSON examples. They do not verify backend tests, SQL migrations, configured auth, running Gateway/CORS, media storage, outbox, deployment or browser E2E. GitNexus runner/index is unavailable; no graph claim or BE logic change was made.
