# Safe source projections still required for complete FE flows

Implement Status: Not Yet

Status Scope: Missing role-safe read metadata needed to finish existing activity/session/policy/media flows without guessing IDs or broadening permissions.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Inspected `StudentActivityEndpoints`, `ActivitySessionEndpoints.ListAsync`, `ActivityExperienceSourceEndpoints`, `SemesterEndpoints`, `ExperiencePolicyEndpoints`, `PublicMediaEndpoints` and Gateway.

## Registered campus students and contribution source context

Student feed/detail supports campus-visible activities and gives `nextSessionId`, activity/session version, policy version and pillar weights. It does not expose effort tier/scale or a full immutable session scoring snapshot. GET `/api/activities/{activityId}/sessions` currently requires club-view access or a reviewer role. A registered campus student outside the club can therefore register/check in through the student endpoints but cannot reliably obtain the same public session source for a later contribution submission. Internal workflow endpoints require internal tokens and must never be called from FE.

Extend the existing student detail or add a self-authorized session-context read: derive the principal, validate published visibility/registration/campus and return only eligible session IDs/times/status/versions, allowed actions, published tier/scale/allocation/policy snapshot and whether manual confirmation/submission is available. No attendance roster, hidden session management policy or other students' evidence. Completed authorized source history must remain usable; cancellation makes new writes unavailable. Keep management session reads separate.

Current FE session/contribution form is wired where the existing session API authorizes access. A 403 for a campus nonmember remains a truthful denial until this projection exists. Never solicit an internal token, spoof manager access, invent the blueprint, or ask the user to enter arbitrary source IDs.

## Manager-safe semester and approved-policy metadata

Semester list and benchmark/policy reads are backoffice-scoped. Existing lifecycle publishing and club-plan writes validate canonical semester/policy on the server, but managers lack a complete safe catalog for choosing them. Reuse the [workspace semester contract](workspace-semester-context-api.md): expose minimal allowed semester identifiers/dates/current/editability and approved policy identifiers/environment/effective range, scoped to the actor and club. Do not relax the Admin endpoint's authorization or derive canonical codes by concatenating a year/term label. Creation/publish forms should consume this read before presenting a complete catalog workflow.

## Unsupported media owners

Current upload intents accept only `club-logo`, `club-cover`, `activity-cover` with a positive existing owner ID and active club management. `club-application-logo` with no persisted club owner, student avatar/cover and club shape are not implemented by that handler. Keep these obligations in [public images](public-image-api.md) and [profile extensions](self-profile-extensions-api.md). Add specific owner validation/intents rather than coercing an application ID into a club ID.

Acceptance: a registered campus nonmember can read only their allowed session/source and submit against exact versions; no roster/PII leakage; cross-campus/private/unregistered denials; cancelled and expired policy behavior; manager-safe catalog excludes administration fields; unsupported media kinds cannot use another owner's signing scope. Test Gateway precedence and both frontend consumers once the read contract exists.
