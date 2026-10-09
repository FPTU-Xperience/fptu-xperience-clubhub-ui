# Event content, staff and registration applications

D12; proposed gap behind the agreed role matrix. Existing ActivityService CRUD, participant registration, check-in and attendance remain available. There is no staff/form/submitted-answer approval contract in main 80818266. Do not replace attendance with application records. Shared [conventions](api-contract-conventions.md) apply.

## Content

PATCH `/api/activities/{activityId}/content`: CONTENT or leadership for owning club, `{title?,description?,expectedVersion}` plus separately authorized cover attachment under D01. Validate title/description with existing activity constraints. Content permission does not grant dates/location/cancellation/finance/attendance administration. Existing management PUT stays for leadership workflow; extend service authorization intentionally instead of granting global CLUB_MANAGER to content writers.

## Staff

GET `/api/activities/{activityId}/staff`: EVENT/leadership and assigned staff can read their permitted view. PUT `/staff/{membershipId}`, `{duty,expectedVersion}` assigns approved active member of the same club; duty 1..120 characters. DELETE same resource with expectedVersion removes assignment. Reject other-club/inactive/unapproved membership, cancelled/closed event mutation and duplicate active assignment. Persist event/membership/user reference, duty, actor, audit and version; unique event+membership. Minimal public feed never exposes staff IDs. Assigned staff get only the actual event permissions named in the server capability response, not blanket club access.

## Registration form and applications

GET/PUT `/api/activities/{activityId}/registration-form`: public safe published read; EVENT/leadership write `{fields:[{id,label,type,required,options?}],capacity,opensAt,closesAt,requiresReview,expectedVersion}`. Types `TEXT|SINGLE_CHOICE|MULTI_CHOICE`, max 20 fields, label <=200, text answer <=2000, max 20 options each. Stable field IDs; reject HTML and identity/contact fields that duplicate private profile unnecessarily. Persist immutable published form version; updates never reinterpret existing answers. Event scope/eligibility remains server policy. Capacity positive <=100000 or null; opens < closes <= event end. Limits are implementation defaults, not proof of existing BE support.

POST `/api/activities/{activityId}/registrations`, self-only `{formVersion,answers,acceptedRules}`, Idempotency-Key -> `{id,status:"PENDING"|"APPROVED",version,submittedAt}`. Validate open window, published visibility and eligible active principal; server derives identity. Unique active event+user registration. Auto-approval only if the form explicitly configures `requiresReview:false`; never infer it from a missing review feature.

GET `/registrations/me`: own status/answers. POST `/registrations/{registrationId}/withdraw`: self owner, permitted pending/approved state before configured cutoff; retain history and release reserved capacity atomically. GET `/registrations?status=...&page=...` and POST `/registrations/{registrationId}/review`, `{decision:"APPROVE"|"REJECT",note,expectedVersion}`: EVENT/leadership scoped review. Approve reserves a capacity slot and creates/deduplicates the existing participant record; reject requires note. Concurrent last-seat approvals cannot overbook. Application approval is not attendance verification.

Notifications use source outbox/recipient dedupe for assignment and registration decisions; never email another applicant's answers. Explicit server action capability controls whether specialist roles can review versus write forms. Preserve platform report/approval and attendance policies.

Tests: CONTENT cannot assign staff; EVENT cannot rewrite personal profiles/finance; cross-club staff; form version/required answer; duplicate registration; closed/cancelled event; owner-only withdraw; last-seat race; no participant duplication; private answers absent from discovery. FE only currently promises these responsibilities in the role popup; full operations UI still requires an integration task after backend contracts exist.
