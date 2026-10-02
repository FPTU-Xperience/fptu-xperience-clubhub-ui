# FPTUX ClubHub final product requirements

Status: target product artifact, 2026-10-02. This is not an implementation-status report. Source authority: registration v1.3, the owner-confirmed decision register and Report 3 SRS draft in `capstone-documents`. See FR-001–FR-048 and O-01–O-14 there for detailed acceptance and unresolved rules.

## Place in the product

ClubHub is one of four final deliverables: ClubHub web, Admin web, FPTUX API server and Mobile. This web app serves students, Club BOD and Student Affair (SA). FPTUX Admin owns central roster, coefficients and system configuration. The designated API repository is `fptu-xperience-clubhub-api`; the API is authoritative for identity, role scope, decisions, point records and history. Mobile is a separate student client and has no repo artifact here yet.

## Student journeys

| Journey | Target behavior | SRS |
| --- | --- | --- |
| Clubs and applications | Discover clubs, inspect a club, submit a membership application, follow its status, and see memberships/offices separately for each club. | FR-001–FR-007 |
| My Applications | Show ordinary application status and any SA emergency-president nomination. Acceptance of a nomination adds membership if needed, grants office and reactivates a paused club; decline leaves it paused. | FR-005–FR-006 |
| Experience | Show current-semester six-category radar and ERI, the separate real-world-work points column, verified record drill-down and lifetime graph. Raw input, credited output and policy version must be understandable. | FR-036–FR-048 |
| Self-declaration | Student enters effort and evidence, chooses exactly one of seven categories and no proposed amount. Outside-club claims go to SA; in-club claims use a club referral. | FR-021–FR-027 |

Mobile displays a student's own club applications/status and opens the ClubHub club page through **View Club**. ClubHub remains the application-submission and review surface; Mobile does not duplicate that workflow.

## Club BOD workspace

- Scope every member, office, application, activity, bonus and contribution view to the **selected club**. A role in one club grants no authority in another; member, president, vice president and delegated offices remain distinct. The exact delegated role matrix remains O-05.
- Manage club membership and ordinary president-transfer applications. Ordinary transfer takes effect only after SA approval and preserves prior office history.
- Submit activity content, category allocation and proposed **raw-point** budget as one dossier. Show SA approval, rejection or revision feedback, including a specific suggested budget. Revision is a request to edit/resubmit, not an approval.
- After approval, add available SA-granted raw bonus points to the activity without another review. Show the allocation ledger and raw budget, separately from credited wallet points.
- During an activity, view attendance and create separate raw contribution records for a student. Every record uses the approved activity category allocation and becomes visible in that student's event history. Club BOD cannot freely select a category per record.
- For an in-club self-declaration, confirm as a **referrer**, optionally recommend a raw amount and forward to SA. This does not award points or spend club raw budget.
- Display inactive members during their one-semester grace, acting/promotion state, and a paused club's **Not Held** planned activities. A pause never deletes the club or its history.

## SA global workspace

SA reviews club establishment/closure and ordinary president-transfer applications, and manages presidents and emergency nominations. SA decides club activity dossiers with approve/reject/revise, creates global activities directly, grants raw club bonuses, inspects club allocations, and makes the final decision on both self-declaration routes. SA may edit a declaration's category and raw amount directly before approval. A global activity has no club owner and does not wait for another approver.

## UI and API acceptance boundaries

- Fetch protected data from the API with actor, target-club, resource and semester scope. Never treat demo actor switches, fixtures or browser storage as production identity or persistence.
- Represent pending, approved, rejected, revision-requested, paused and Not Held states with plain labels and actor/time history. Do not silently show a prior club's data after navigation or account change.
- A valid check-in and later contributions are **separate** event-history records. ClubHub may link to the student's history, while Mobile is the primary check-in client.
- The activity budget is measured in **raw** points. The wallet and ERI use credited points. Money finance proposals and ClubReportHub KPI totals are different domains.
- If an API contract is absent, show a truthful unavailable state; an existing `/demo` control is not evidence that the final workflow is complete.

Quests, rewards, personalized recommendations, portfolio export/sharing, timetable/OJT integration and automatic external experience imports remain optional O-12/O-13 proposals. Numeric scoring, category allocation, evidence, role details and quality targets remain open O-01–O-14 as recorded in the decision register.
