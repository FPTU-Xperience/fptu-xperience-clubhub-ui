# Product simulation removal — 27 November 2026

## Result

Removed the unused workspace sample-record catalogue and the superseded local gift editor, lifecycle controls, automatic local awards, local gift/claim metrics and local redemption implementation. Removed hardcoded FPT Dev paid reward catalogues and the fallback that manufactured 200 club credits.

Cosmetic definitions now come from built-in free appearance options and backend cosmetic definitions. Ownership always comes from the account's server inventory cache in development and production. Old localStorage wallets, ownership and gift records cannot grant cosmetics. The existing server-backed reward catalogue, wallet, editor and redemption/receipt flow are retained.

User-authored profile appearance remains editable. Retired local cosmetic selections fall back to free designs without discarding saved display names, biography, cover text or personal fields. Reading these records does not rewrite localStorage. Isolated browser fixtures and server-grant fixtures remain test-only. This change does not delete database records or rewrite historical XP/credit.

## Verification

- Baseline before removal: 371 Node tests passed.
- After removal: 346 Node tests passed, zero failures or skips. Tests for obsolete local redemption were replaced with server-inventory ownership and legacy-profile recovery checks; obsolete simulator-only tests were removed.
- Regression coverage includes forged localStorage inventory, account isolation, refreshing/revoking ownership, free defaults, server-owned palette/frame/badge selection, gradients, SVG palette and profile transforms.
- Production build passed. Checked generated JavaScript for identifying local simulator storage keys and fictional-data markers; none were present.
- Eight browser suites passed on `http://localhost:5173`: activity tabs, registration/role management, QR/manual/GPS attendance, staffing, credit rewards, club formation, governance and report/XP editing. Tests cover desktop/mobile, API failures, stale state, duplicate submission and account isolation.
- Attendance initially timed out on QR generation during a cold fixture run; an unchanged-product rerun passed all attendance cases. Failure diagnostics now capture the page and errors.
- Report/XP checks were updated to the current unavailable-source message. Save/retry and missing/error-source guards passed.
- Main-flow browser logs are recorded separately in `E:/FPTU-Xperience/TestResults/main-flow-browser`.

Node tests and isolated browser fixtures are not deployed-site or real-account acceptance. No production data or policy was changed.
