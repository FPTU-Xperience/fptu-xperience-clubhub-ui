# User corrections — 2026-11-05

User instruction: record all comments, then fix them sequentially. Implement directly in repository source against implemented API contracts. Do not inject UI/DOM fixes, substitute mock persistence for real data, or replace an established UI when integrating its data.

Local port rule: use only the existing `http://localhost:5173` dev server. Do not start additional local fixture, preview or development ports. Run subsequent local browser checks against this server; do not spawn test servers on 418x/419x/5174/etc.

## 1. Kho quà — restore the existing UI

- Request: the data-integrity integration replaced the UI without approval; restore the existing presentation.
- Keep grouped gifts, search/sort, original avatar/shape/cover previews, gift detail panel, create/edit type cards, input/preview columns and footer.
- Keep real API catalog, inventory, wallet and version/idempotency safeguards. Do not restore the local 200-point sample wallet.
- Status: implemented, committed, pushed and deployed at UI `27de3c0`; workflow `41996264657` completed successfully on retry. The first attempt timed out in the unrelated wrong-session QR browser check; an independent rerun and full CI rerun passed without weakening assertions.
- Validation: 333 tests, production build, component and built/deployed browser checks at 1440px/390px. Synthetic API traffic in automated browser checks is explicitly isolated, not real-account acceptance.
- Details: [rewards/points restoration](2026-11-05-rewards-points-ui-restoration.md).

## 2. Điểm & thành tích — meaningful personal scope and two manager tabs

- Request: the personal points display did not make sense; managers need separate club scoring and personal-in-this-club tabs.
- Managers: **Tính điểm CLB** and **Điểm cá nhân trong CLB**. Members: own club-scoped view.
- Show verified XP for the chosen semester, lifetime XP in this club and the separate spendable credit balance. Exclude revoked XP from current totals while retaining history.
- Status: implemented/deployed with item 1. Club/actor/semester isolation, XP versus spent credit, revoked entries and read-only privacy passed automated checks.

## 3. Member/governance names — use current display name

- Request: the screenshot's member/treasurer list shows a username such as `mr28042005`; use the current profile display name.
- Apply the requirement to the member/governance UI retained after item 5 removes the standalone role section.
- Preserve immutable historical snapshots and protected role authorization. Do not rewrite membership/audit history just to update presentation names.
- Status: implemented, committed, pushed and deployed. The role reader uses live profile names; the governance term returns a separate current-name projection for visible assignees/leaders. UI cards/actions use that projection while persisted configurations/reports retain their historical names. Four targeted API tests, full API CI and final deployed governance browser checks at 1440px/390px passed. See final release evidence below.

## 4. Member tab spacing

- Request: fix spacing in the Member tab.
- Normalize separation between sections, tabs, filters, member rows and action groups; keep desktop/mobile layouts usable.
- Status: implemented, committed, pushed and deployed; final desktop/mobile browser checks and screenshot review passed. Member sections use a consistent 24px gap; tabs no longer add a second bottom gap, action rows/pagination have explicit spacing, and header actions wrap. The removed standalone role section is absent.

## 5. Ban quản lý — reuse old UI; remove standalone role section

- Request: reuse the existing Ban quản lý UI rather than the new presentation; remove the entire **Vai trò trong CLB** section shown in the screenshot, including its separate treasurer rows/reload block.
- Existing presentation reference: `ClubGovernancePreview.jsx` and `ClubGovernancePreview.scss`. Reuse its presentation with canonical governance API state/actions; do not reactivate its localStorage preview state, demo members or fake permissions.
- Preserve current groups, multi-group assignments, protected leadership, scoped capabilities, revisions/history and report snapshots.
- Status: implemented, committed, pushed and deployed. The old preview and production board now share the same `GovernanceGroupCards` presentation and established stylesheet, with the production component supplying server data/actions. The standalone role section is removed from manager and member pages. Thirteen focused governance tests passed; actual application checks on localhost:5173 and the final deployed site passed at 1440px/390px for assignments, immutable reports, read-only actors, member spacing and removal of the old section. Browser contract checks intercept test API traffic; no DOM fixes or local preview state are injected into the product.

## 6. Nhiệm vụ & đóng góp — aggregate event recruitment and assignments

- Request: load recruitment and staffing/assignments from the club's actual events.
- Include events with direct assignments even when no recruitment notice exists. Keep recruitment/application/assignment actions attached to their real event and current actor's permissions.
- Respect club, semester, pagination and private-event boundaries. Distinguish empty data from failed/unavailable sources.
- Status: implemented, committed, pushed and deployed. `QuestsTab` now composes the complete authorized event and recruitment lists with real per-event staffing data, using bounded parallel reads. It includes direct assignments without recruitment notices, filters current-account assignments unless the server grants management capability, and opens the existing event recruitment/assignment panels. Actor/club/semester changes reset the view. Partial failures remain visible instead of becoming an empty-success state. Three source tests and actual-application browser checks at 1440px/390px passed on localhost:5173 and the final deployed site; browser test API traffic is isolated. Mobile refresh-button spacing was also reviewed after deployment.

## Release validation follow-up

The final mobile-spacing release at `cab63c4` failed the QR image roundtrip in both CI attempts. Reproducing the same generation/decoder path on the existing localhost:5173 found real failures dependent on the encoded payload, rather than a timeout alone. Uploaded images now try the normal photo detector first, then the library's pure-image decoder for exported, axis-aligned QR images; session/challenge/expiry validation remains unchanged. An explicit direct dependency pins the already-installed ZXing core version. 1,200 generated images across three sizes decoded successfully after the fix; the actual application attendance check passed at 1440px/390px on localhost:5173. CI retains the original image roundtrip and adds the known failing exported image with expired-token rejection. The fix was deployed at `749d152`; CI and independent final online attendance checks passed.

## Final release evidence — 2026-11-05

- All six user corrections are implemented, committed, pushed and deployed. This checklist records the user comments and their individual implementation evidence.
- UI product revision: `749d152e9c18d5a5614a383d18a21b42a2fd792a`, including `c7b1d58` event tasks and `cab63c4` mobile spacing. [Deployment 42039951286](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/42039951286) completed successfully, including every component/browser check, post-deploy browser checks and production bundle SHA-256 comparison. Production: https://fptux-clubhub-ui.pages.dev; deployed preview: https://ed3f72a6.fptux-clubhub-ui.pages.dev.
- API product revision: `9ffd046fc70b95f3b941646d02da696a05c94c3e`. [ClubService-only deployment 42007447193](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/actions/runs/42007447193) succeeded from rollout revision `cc1e6f7`, preserving runtime configuration. Active image: `sha256:5745feab89dec772fb50ef818c7707c730647f4d1300b84e764f64db429b1a99`. The original manual deployment workflow was restored exactly at `d89ecd5e4c233606e53dc089c2b4f7be90e42d0f`; [restoration CI 42009685420](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/actions/runs/42009685420) passed.
- Full API SQL suite: 1,060 passed, zero failures/skips (Core 130, Admin integration 85, backend stabilization 845). Complete UI/service/session suite across all 65 test files: 375 passed, zero failures/skips. Production build passed. Earlier focused UI evidence used a smaller 338-test selection.
- Independent final browser rerun on the deployed site: governance, cancellation/member layout, event recruitment/direct assignments, wallet/rewards/personal-versus-club points, and attendance QR/GPS all passed at 1440px and 390px. Screenshots under `TestResults/event-tasks`, `TestResults/registration-roles-online`, `TestResults/credit`, and `TestResults/attendance-online` were reviewed. Logs: workspace `.tools/final-user-corrections-{governance,members,tasks,rewards-points,attendance}.log`.
- Separate real-network anonymous browser validation passed across five guarded routes and email-form validation at both widths, without JavaScript/HTTP errors or horizontal overflow. It does not authenticate a real user.
- Independent live check confirmed CI entry `/assets/index-DbO0QsXV.js` and its URL return 200, API `/health` returns 200, protected roles/governance/wallet routes return 401 anonymously, and session GET with exact Origin `http://localhost:5173` returns 204. A first comparison against the separate Windows local-build hash failed; final parity uses the successful CI build and its workflow's downloaded-bundle hash comparison, not an assumption that separate builds are byte-identical.
- Local browser work after the port instruction used only the existing localhost:5173 server. No additional local fixture/preview ports were started. The explicit memory note is saved at `C:/Users/grisg/.codex/memories/extensions/ad_hoc/notes/2026-11-05-clubhub-ui-corrections-localhost-5173.md`.
- Evidence boundary: authenticated-flow browser tests intercept all synthetic API traffic; they validate real application rendering/actions against isolated contracts and are not real-account acceptance. No injected DOM fixes, production demo persistence or changes to immutable governance snapshots were used. The original IDE checkout and unrelated user changes were preserved.
