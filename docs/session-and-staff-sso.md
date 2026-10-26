> Current email/password contract: `POST /api/auth/email-login` with `{ email, password }` uses the same session/refresh/logout as Google. Passwordless dev-login and its temporary key were removed. Admin and CTSV can use PKCE SSO in both directions; roles are preserved. `VITE_LOGIN_ACCOUNT_SHORTCUTS=true` shows email-only shortcuts (default false). ClubHub's email form initially stays collapsed behind “Hoặc dùng email”. Existing accounts without a password need operator/admin setup; there is no default password. Historical dev-login sections below are superseded.

# Session and CTSV SSO — 2026-10-22

ClubHub and Admin now use the same session lifecycle: refresh after authenticated 401, one retry, one rotation for concurrent requests, and login/logout synchronization across same-origin tabs. Web Locks serialize rotations across tabs when supported. Validation/permission/server errors after retry preserve the session. Definitive auth rejection clears it; transient network/server failures retain credentials.

Every logout/session expiry goes to `/v2` on ClubHub, including redirects from Admin and legacy `/login`. The initiating tab completes server revocation before navigating. Other tabs follow sign-out; responses arriving after logout/account switching cannot restore the old account.

CTSV SSO uses a top-level roundtrip between `https://fptux-clubhub-ui.pages.dev` and `https://fptux-admin-ui.pages.dev`. State and PKCE bind a one-minute, single-use code to the requesting tab and origin. Tokens never appear in URLs, and third-party cookies are unnecessary. Only active/unlocked `STUDENT_AFFAIRS_ADMIN` accounts qualify. Existing student/admin sessions are not replaced.

Both apps have independent refresh chains in a common family. Logout revokes that family. The other origin checks on focus/visibility and every 15 seconds while visible. Background tabs reconcile when visible; offline logout cannot confirm remote revocation. Returning to an anonymous tab immediately discovers a new peer login; redundant initial probes have a 30-second cooldown.

Google popup blur/focus does not bypass that cooldown. Focus discovery waits 250 ms for the Google callback and skips an in-flight login; concurrent focus/visibility events share one probe. Known student sessions never request staff tickets. Login, identity and refresh requests have a 20-second timeout that preserves credentials and allows retry. During Vite updates, entry points retire obsolete SSO work/listeners, reuse one root and reload the auth module tree together to avoid duplicate React roots or mixed AuthContext generations.

Deploy API/AuthService migration `20261022090000_StaffSsoTickets` before either UI. SSO endpoints are `POST /api/auth/sso/tickets`, `/redeem`, `/status`. Both UIs must use the same gateway, with exact SSO and CORS origin configuration. Development defaults use localhost:5173/5174; custom hosts/ports require matching overrides.

ClubHub variables: `VITE_API_BASE_URL`, `VITE_ADMIN_APP_URL` (production default `https://fptux-admin-ui.pages.dev`), `VITE_STAFF_SSO_ENABLED` (default true), existing Google client ID. Admin uses `VITE_CLUBHUB_APP_URL`. SSO false disables only cross-origin discovery/polling; local tab sync, refresh and `/v2` redirects remain active. Dev auth bypass skips SSO.

Run `npm run test:session` and `npm run build`. The Admin repository contains `scripts/session-sso-smoke.mjs`, which checks both real UI entry points with a simulated API. Detailed backend behavior/rollout is in the API repository's `docs/session-and-staff-sso.md`. This change does not deploy or confirm Google sign-in on production.

## Local browser verification — 2026-10-22

The supplied student account completed real Google sign-in on `localhost:5173` against the public API and displayed student navigation. For CTSV, real repository AuthService and Admin actor handlers ran in an isolated SQLite Testing host on `localhost:5270`, with UI peers on `localhost:5273` and `localhost:5274`. Email login for the CTSV test identity, SSO in both directions, logout in an existing Admin tab and ClubHub, and server-expiry redirects to `/v2` passed. Distinct refresh chains shared one family, and logout revoked the prior family. The local host excludes business-service data endpoints; their 404s do not indicate an auth failure or prove full business integration. Production email-only login returns 404 by the existing environment guard; production CTSV Google sign-in remains unverified.

## Follow-up on `5173` / `5174`

The isolated QA result did not prove existing sessions on the user's actual ports were fixed. Both still target the production API. Follow-up browser evidence showed Google origin errors under the newly added `no-referrer` policy, so it was replaced by `strict-origin-when-cross-origin`, which shares only the origin and omits SSO query strings. Google SDK initialization now survives StrictMode remounts without resetting the callback. The Google button starts an authentication lease at click time; SSO probes and identity focus retries cannot interrupt the popup before credentials arrive. Fresh rendering on `5173` displayed the personalized Google iframe without the previous origin or duplicate-initialization warnings. Chrome disconnected before final credential-callback acceptance, so that exact-host end-to-end check remains pending. Production email-only login is still disabled by its existing backend environment guard.

### Verification on the retained development servers (2026-10-22)

- Stopped the extra FE servers on 5273 and 5274 (679 MB combined working set); retained only ClubHub 5173 and Admin 5174.
- Both development servers now use a git-ignored `.env.development.local` override for `http://localhost:5270`. The isolated Testing API uses the real auth/SSO endpoint handlers with exact origins 5173/5174 and the public Google client ID. Production configuration is unchanged.
- Browser checks on the retained ports: CTSV email login succeeds on ClubHub and directly on Admin; ClubHub-to-Admin CTSV SSO reaches `/ctsv/work`; Admin logout sends both tabs to ClubHub `/v2`. A prior stale Admin session was rejected after restarting the Testing API with a new ephemeral signing key; reopening Admin then completed SSO.
- Student `cuongnkce161131@fpt.edu.vn` reaches student onboarding on ClubHub; Admin stays on its login screen. No CTSV role was assigned to the student.
- Testing API covers auth/SSO only. Business-data 404 responses are expected and do not verify full application integration. Google credential callback is still pending because Chrome disconnected; email results do not prove Google completion.

## Local frontend login against the deployed API

Local ClubHub 5173 and Admin 5174 continue to use the production API and real database. Student Google login calls the production Google endpoint directly. Email dev-login uses only the local Vite proxy at `/api/auth/dev-login`, enabled with `VITE_LOCAL_DEV_LOGIN=true` and a non-VITE `LOCAL_DEV_LOGIN_KEY` in git-ignored `.env.development.local`. The proxy requires a loopback connection and its exact local browser Origin, then attaches `X-Local-Dev-Login-Key` server-side. The key must never be placed in a VITE variable or browser bundle.

Production AuthService accepts this email login only when `LOCAL_DEV_LOGIN_KEY` is at least 32 characters, matches the request key in constant time, `LOCAL_DEV_LOGIN_EMAILS` contains the email, and `LOCAL_DEV_LOGIN_EXPIRES_AT` is a future UTC timestamp. Missing, invalid, or expired configuration returns 403 with code dev_login_unavailable; older deployments returned 404. Existing active/unlocked account and actor-policy checks still apply. Deployment obtains the key from the production environment secret and the allow-list/expiry from production environment variables. Removing the secret or expiring the window disables this login method; existing sessions follow normal revocation/expiry rules.

`LOCAL_SSO_ENABLED=true` additionally permits exactly `http://localhost:5174` and `http://localhost:5173` as a separate SSO pair. Production-to-production SSO remains available; ticket issuance between a production origin and a local origin is rejected. The endpoint still requires a valid CTSV session, source refresh ownership, and PKCE. No API Testing service or synthetic user is needed for this flow.

This section documents the source change; deployment and browser verification must be recorded separately.
