# Current contracts — 2026-10-19

Implement Status: Not Yet

Status Scope: Index of remaining backend and integration obligations; source audit is not production acceptance.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf.

Start with [lifecycle audit](contract-lifecycle-audit.md), [workspace business-flow audit](../../../fptu-xperience-doc/docs/fe-be-audit-2026-10-19.md), [all parsed source routes](../qa/workspace-source-inventory.md), and [facade inventory](api-declaration-inventory.md).

- This directory: active missing or partial contracts.
- `implemented/`: the stated source contract exists. Live authorization, migrations, configuration and browser acceptance are separate gates.
- `outdated/`: historical snapshots or replaced proposals. Do not implement these without reading their replacement and the remaining-obligations ledger.
- Keep partial contracts active. A route declaration or one implemented subsection does not complete a whole contract.

## Current owners

| Flow | Owner |
| --- | --- |
| Activity application, action XP, final report approval, staffing/recruitment | [Activity/action/staffing gap](activity-action-staffing-api.md) |
| Server profile text already available; remaining academic/media/projection | [Profile extensions](self-profile-extensions-api.md), [implemented profile](implemented/canonical-self-profile-api.md) |
| Student feed/detail/recommendation, personal summary/radar/history/ledger | [Implemented student reads](implemented/student-experience-reads-api.md) |
| Evidence/contributions/review/assignments/policy/sessions/club reporting | [Implemented operations](implemented/verified-experience-operations-api.md) |
| Safe session/source and semester/policy metadata still missing | [Source projection gaps](experience-source-projections-api.md) |
| Club text/schedule | [Implemented public profile](implemented/club-public-profile-api.md) |
| Club/activity image attachment | [Public images](public-image-api.md): source foundations now exist; user images/cosmetics and live R2 still open |
| Resource galleries and attachments | [Activity resources](activity-profile-resources-api.md) |
| Invitations and eligible school roster | [Invitations](club-member-invitations-api.md), [roster](semester-student-roster-api.md) |
| Membership withdrawal and pins | [Membership](my-clubs-membership-api.md), [navigation addendum](club-navigation-applications-api.md) |
| Governance and history | [Groups](club-governance-groups-api.md), [product decisions](club-governance-groups-proposal.md) |
| Wallet, raw activity budgets, spending and rewards | [Points](club-contributions-points-api.md), [cosmetics](profile-cover-rewards-api.md) |
| Timetable, semester metadata, optional public directory | [Study schedule](study-schedule-api.md), [workspace semester](workspace-semester-context-api.md), [public directory](public-member-directory-api.md) |
| Custom registration forms and specialist content access | [Event extensions](event-registration-extensions-api.md) |
| Final-product items without both implementations | [Document-only TODO register](../../../fptu-xperience-doc/docs/fe-be-audit-2026-10-19.md#document-only-and-product-policy-todos) |

The action-based XP proposal is not an approved replacement of every numeric rule in the final-product baseline. Preserve O-01–O-14 until product decisions resolve them. Existing FinanceService money and verified experience raw allocations are neither an activity raw-budget wallet nor spendable club credit.
