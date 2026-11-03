# Activity detail spacing — 2026-11-03

- Tightened identity bottom padding 20 -> 12px.
- Tightened metadata-to-registration and registration-to-tabs margins 24 -> 12px.
- Kept original club navigation in the identity header, and registration below metadata. No API or registration behavior changes.
- Source: 011ca66db5d0ba80c8c6b06f07f82fc9d04c808f.
- Build/deploy: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41676017266
- 312 unit tests, notification/tab suites and twelve built browser scenarios passed before deployment.
- Deployed https://ac30f023.fptux-clubhub-ui.pages.dev. First post-deploy browser attempt timed out before any API requests with an empty page; no cause asserted from that timeout.
- Independent online verification: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41676739797 — success.
- Expected production entry index-CG1OEQWD.js and HTML-referenced assets returned 200; API health 200.
- Twelve online scenarios at 1440/1024/390 (public/internal, registerable/unavailable, including registered after reload) measured 12px before and after the registration container.
- Existing navigation positions, no horizontal overflow, retained registered state, schedule and directory checks also passed.
- Browser checks use intercepted API fixtures and make no real registration writes. Checks ran on GitHub Actions; local execution unavailable.
- Existing manual-only deployment workflow restored; no new workflow files.
