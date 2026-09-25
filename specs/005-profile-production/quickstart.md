# Quickstart: Validate Production Profile Migration

## Prerequisites

- Run commands from `E:\FPTU-Xperience\fptu-xperience-clubhub-ui`.
- Install repository dependencies.
- Use an authenticated session, or the existing development-only authentication bypass when local browser verification requires it. Do not enable the bypass in a production build.

## Focused automated checks

1. Run the profile data-module tests:

   ```powershell
   node --test src/pages/v2/profile-data.test.js
   ```

   Expect identity-key isolation, corrupt-storage recovery, snapshot normalization, permitted-field validation, same-account reload persistence, and privacy projection coverage.

2. Run the existing V2 route smoke check:

   ```powershell
   npm run test:demo:routes
   ```

   Expect existing V2/demo route isolation to remain intact while the new `/v2/profile` production route is covered by its focused assertions.

3. Build the application:

   ```powershell
   npm run build
   ```

   Expect a successful production build; record any pre-existing unrelated warning separately.

## Browser acceptance checks

1. Open `/v2/profile` directly while authenticated. Confirm it resolves only the current account's profile and uses the V2 left rail/frame.
2. Open the account menu and choose **Hồ sơ**. Confirm the menu dismisses and navigates to the same page; verify the `Của tôi` group still contains only Câu lạc bộ and Lịch trình.
3. Compare the reference structure with the migrated screen: editorial cover, identity, details sidebar, club list, overview/evidence tabs, term selector, summary cards, radar label, and Vietnamese labels must remain recognizable.
4. Toggle shared preview. Confirm student code, contribution total, evidence records, and point values disappear; return to private view and confirm they return without a publish action.
5. Edit a permitted presentation field, save, reload, and confirm the same account's change remains. Switch to another authenticated account and confirm it cannot see that change.
6. Verify Escape/backdrop close and focus restoration for the edit dialog, keyboard operation of tabs/filter/preview, and narrow-width stacking without hidden actions.
7. Exercise missing identity, corrupt persisted record, empty term, and simulated persistence failure paths. Confirm each produces the documented state and no demo profile data appears.
