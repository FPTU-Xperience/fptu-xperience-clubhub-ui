# Personal experience and terminology — 2026-10-21

Delivered: **Của tôi → Trải nghiệm cá nhân**, own server report/list/detail and direct external declaration with required private evidence. Examples are external competition results, certificates and qualifications. No sample records are imported into production. [Contract and remaining referral requirement](../contracts/personal-experience-api.md).

Admin navigation/inbox/review wording changes from Hồ sơ tự khai to Trải nghiệm tự khai. UI labels, errors and accessibility text in both clients use Xperience Point instead of XP; identifiers/API keys remain stable. Current referral mode is visible but cannot submit until its backend contract exists; direct mode is wired to declared endpoints.

Verification:

- ClubHub Node suite: 188 passed, including evidence/file/date/attribute validation, referral-boundary enforcement, private own-data parsing and stable direct-submission receipts.
- Admin Node suite: 54 passed.
- Both production builds passed, existing large-chunk warnings retained.
- `node scripts/personal-experience-smoke.mjs`: actual ApiService against intercepted fetch fixtures; own navigation/list/report, required evidence, affiliated-club selection and blocked unsupported referral, direct submit error/retry with one private upload and stable key, submitted detail, independent report/list failures and empty state.
- Browser geometry at 1440/768/414/375/320. Screenshots in system temp `clubhub-personal-experience-qa` were inspected.
- Existing report wizard browser checks rerun for longer Xperience Point labels; Admin UI smoke covers role/navigation/error/geometry and workflow interactions.

These checks use local controlled responses and source declarations. They do not prove live authorization, gateway/database/storage integration, scoring or deployment. No live student experience was created, and no commit/push was performed.
