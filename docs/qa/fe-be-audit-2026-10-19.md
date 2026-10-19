# FE–BE audit validation — 2026-10-19

Backend source baseline: `b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf`. ClubHub FE start: `82e5e63ca9061cae5f287cb93d8d03f34f96ad5b`. Admin FE start: `0326552c36d7d513af60e1d6fbc441c9bed271ed`. Existing dirty changes were preserved; no commit/push or deployment was requested/performed.

## Executed checks

Final results are recorded after the last code change below. Initial sandbox `node --test` failed with Windows spawn EPERM before running tests; running with `--test-isolation=none` avoids subprocess isolation and executes the suite. Vite builds/transport smoke require permitted esbuild subprocesses. These environment failures are not application-test failures.

| Check | Result |
| --- | --- |
| Git fetch/fast-forward-only update, seven repositories | Completed; current remote heads recorded in the cross-repo audit; doc local-ahead commits preserved |
| ClubHub unit/data/service tests | 199 passed, 0 failed |
| Admin tests | 21 passed, 0 failed |
| Mocked contract transport and component SSR smoke | 12 transport scenarios and 6 integration surfaces passed; existing test:club-page smoke also passed |
| ClubHub production build | Passed final production build; bundle-size warnings only |
| Admin production build | Passed final production build; bundle-size warnings only |
| Contract status/scope/hash/link/JSON check | 39 files: 7 Done, 23 Not Yet, 9 Cancel/historical; 322 local links, 36 JSON examples valid |
| Source route/facade inventory regeneration | 285 resolved declarations / 269 public API declarations; 113 wrappers = 104 declared + 2 composed + 7 absent; 0 unresolved wrappers/receivers |
| Git diff whitespace check | Passed for ClubHub UI, Admin UI and documentation tracked diffs |

## Reproducible commands

From ClubHub UI: `node --test --test-isolation=none src/services/*.test.js src/pages/v2/*.test.js`; `node scripts/integration-contract-smoke.mjs`; `npm run build`; `node scripts/check-contract-docs.mjs`; `node scripts/audit-api-contracts.mjs ../fptu-xperience-clubhub-api 2026-10-19`; `node scripts/audit-workspace-sources.mjs`; `git diff --check`.

From Admin UI: `node --test --test-isolation=none tests/*.test.js`; `npm run build`; `git diff --check`.

The mocked transport smoke executes real transformed API methods with a fake fetch, validating student versus management URLs, radar semester query, profile/media GUID payloads, private evidence multipart behavior and structured 409 error metadata. Mapper/data tests cover draft visibility, canonical/local precedence, cross-account rejection, private member snapshot separation and versioned review decisions. These are not authenticated running-service tests.

## Live acceptance still required

- Apply/verify current Auth, Activity, Admin, Club and Export migrations; verify configured policy/environment and cross-service internal credentials through controlled service tests.
- Two accounts, separate campus/club/role/grant; expired/revoked grants, self-review denial, stale versions, duplicate POST/retry and outbox replay.
- Student feed/detail/recommendations pagination/eligibility; member versus campus-nonmember session projection (active contract gap), registration, real QR window/geofence and manual attendance.
- Canonical profile across tabs/devices, private member current projection versus immutable join answers, save failure preserving draft and sharing preview hiding private values.
- Private file upload/download type/size/signature and ownership; contribution review/upgrades/corrections and immutable allocation history.
- Club plan/statistics/PDF snapshot version consistency, status refresh and authenticated download.
- R2 signing, PUT CORS, decoded object verification, attachment ownership and public delivery; unsupported media kinds remain explicit gaps.
- Browser interaction/responsive/accessibility walkthrough of new forms and retained user changes. No screenshot-level/live browser acceptance is claimed by compilation or SSR.

GitNexus runner/index was missing; no graph analysis or BE logic edit. No .NET SDK was found in PATH, so no newly run backend test result is claimed. Bundle-size warnings must be distinguished from a failed build.
