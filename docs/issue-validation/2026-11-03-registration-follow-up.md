# C02/C04 — registration follow-up, 2026-11-03

Reported URL: https://fptux-clubhub-ui.pages.dev/v2/activities/4

## Changes
- Removed the workspace-read guard that suppressed StudentActivityActions.
- Ordinary member workspace detail now uses the authorized student detail endpoint, including canRegister, rather than the management DTO that does not expose registration eligibility.
- Workspace reader tab changes refresh detail; tabs and registration state stay mounted while the same activity refreshes. Manager editing continues using the management contract.
- Expanded browser fixture to execute the actual ActivityManagementPage reader and public ActivityDetailPage, with all V2 application style imports.

## Evidence
- UI source: 5dbe8d200f22bce3bbfaef64ed77e98819dfce50.
- Validation/deployment: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41661114349
- 310 unit tests passed; notification browser validation and public/internal reader tab suites passed at 1440/390px.
- Cloudflare deployment: https://c5f4bfa2.fptux-clubhub-ui.pages.dev. Production entry JS content hash matched the build; API health returned 200.
- Exact production URL browser verification: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41661629941
- Eight scenarios used the actual deployed application bundle on /v2/activities/4: public/internal x canRegister true/false x desktop/mobile. Header registration button visible in all; enabled only when permitted; intercepted submit exactly once when permitted.
- All API requests in the online browser test were intercepted. Synthetic session token never reached an API; no production participant was created.
- Source route fixtures additionally cover tab reloads, late responses, retry, account switching, duplicate submission, and idle request stability.

## Backend finding
Production activity 4 is IsInternal=true, PublicationStatus=LEGACY, Status=Scheduled. Reader previously rejected LEGACY for canRegister while existing registration writer supports it. Backend fix tracked separately in API repository.

## Limits
Cloud executor is offline: checks ran on GitHub Actions, not this local machine. Real student account registration and that account's production eligibility have not been exercised.
