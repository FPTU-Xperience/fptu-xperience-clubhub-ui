# Activity navigation and registered state — 2026-11-03

- Restored the original ActivityProfileLayout header actions position and stylesheet rules for the two club links. Only registration is rendered below metadata via a separate registrationActions slot.
- StudentActivityActions now displays "Đã đăng ký" when the authenticated detail DTO says isRegistered=true, or after this page receives successful registration.
- Removed the successful-registration server-confirmation sentence. Already registered state does not show the generic unavailable-registration sentence.
- Activity mapper retains explicit isRegistered; canRegister=false is never treated as proof of registration.
- Source: d28657475e8d3e3798221da76c552a02eb6798a6.
- Build, 312 unit tests, tab suites, notification suite, preview and deployed browser scenarios: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41671227513
- Deployment: https://26ee5adb.fptux-clubhub-ui.pages.dev. Production entry and bundle hashes matched build; API health 200.
- Twelve scenarios at 1440/1024/390 pixels cover public/internal, enabled/disabled registration, original header navigation, registration row below metadata, successful submit then reload retaining "Đã đăng ký", absence of confirmation text, schedule navigation and no registration button on directory.
- Browser API traffic is intercepted: no real student account or production write was exercised. Backend isRegistered implementation, graph checks and rollout evidence are tracked in the API repository.
- Existing manual-only workflow restored; no new workflow files.
