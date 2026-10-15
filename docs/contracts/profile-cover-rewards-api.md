<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Chợ phần thưởng và cover cosmetics — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

**⏭ BỎ QUA:** Ví/đổi quà/cosmetic BỎ QUA — NGOÀI PHẠM VI; không mở tích hợp production cho route proposal lịch sử.

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: BỎ QUA — NGOÀI PHẠM VI.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

Phiếu mục4 loại chợ quà/tài chính/thanh toán. **BỎ QUA toàn bộ** rewards catalog/admin upload/wallet-me/redemption/inventory/grants/paid color-shape-bundle/FPT-DEV issuer/sample prices120-160-200/200balance/debt/fulfillment acceptance.

Experience/bậc/danh hiệu vẫn GIỮ [scoring](experience-scoring-contract.md), không phải tài sản đổi quà. Free profile/avatar có thể hỗ trợ [profile](self-profile-sync-api.md), không cần inventory. Giữ lịch sử/fixtures/code, không migrate thành điểm/grants thật.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Cover cosmetics and club point redemption

Implement Status: Not Yet

Status Scope: Backend implementation

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: Admin quest/XP models exist; no server cosmetic catalog/inventory, club wallet, redemption receipt or verified shape publication entities/endpoints. FE cosmetic ownership remains local sample state.

Frontend scope: independent cover background, stamp shape, text and temporary club rewards. ProfileCoverArt uses a 1200x300 canvas. Shapes occupy their own 240x240 local viewport at 100% scale, preserve the source aspect ratio and rotate/scale about their own center. Common vector stamps use the selected palette secondary/accent colors; their position, rotation and scale remain independent of the background. Uploaded stamps retain source colors and use independent HSL adjustments. Uploaded assets remain original PNG/SVG images, with HSL adjustments applied only to the stamp.

## Temporary data boundary

The agreed UI-first workflow uses account-scoped browser storage. All existing/common colors are free: default/sunset/horizon/forest/violet. All common shapes (petals/ribbons/circles/orbits/waves) are free. Paid shapes are distinct club-uploaded assets with unique IDs, issuer club, original label, asset URL and point price; common geometry must never become a paid shape. Only new FPT Dev exclusive palettes and club-owned designs require ownership. The temporary store starts each club at **200 sample points**, clearly labeled in UI, and subtracts only that club's sample balance on redemption. Ownership is reusable across the account's profile. Each exclusive shape can only be redeemed at its issuing club. Unique/exclusive means a club-origin design, not a single-owner or NFT supply constraint. Locked colors and shapes remain selectable for preview at 33% thumbnail opacity with a lock icon; save requires ownership. Repeat redemption does not charge twice. No production points or monetary balance is read or changed. The mock is neither a secure wallet nor a cross-device ledger and must be replaced before real redemption.

Backend source scan of fetched main `80818266f617bd5144ab1b1a6cd0e74983983a4d`: Admin quest catalog has reward-XP metadata, but no usable cosmetic inventory, club point-wallet or redemption API. A quest reward field alone is not proof of credited wallet points.

## SVG palette binding - 2026-10-14

### PNG vector conversion before saving — 2026-10-14

New PNG shape/frame uploads are traced into real SVG paths before catalog storage; this supersedes the original-PNG storage path described elsewhere in this document. The conversion uses pinned [ImageTracer 1.2.6](https://github.com/jankovicsandras/imagetracerjs) in a bundled Web Worker, not a remote conversion service and not an SVG containing an embedded raster image. Validate PNG/SVG source size <=5 MB and dimensions <=4096x4096 first. Scale PNG tracing to a maximum side of 512 pixels, quantize to up to eight visible color layers plus transparency, omit alpha below 16/255 and tiny paths, and limit output to 10,000 paths / 5 MB. Transparent regions and traced holes remain transparent; opaque PNG backgrounds are not automatically removed. Detailed/raster gradients are approximated, so show the converted preview and explain these limits before save. Prefer original SVG for detailed vector art.

Each converted painted path has `data-palette-role="primary"|"secondary"`, assigned by dark/light layer luminance. Original quantized colors remain available when palette binding is off; enabling binding recolors every converted region, including solid and advanced gradient paints. Do not infer palette roles from path ordering for converted PNGs. Circular frame crop happens after tracing and preserves paths/roles and its circular clip. Existing saved PNG catalog records remain readable; editing/resaving through the gift modal upgrades the asset to SVG without changing cosmetic ID/key or ownership. No bulk migration is performed. Existing native SVG uploads continue through the same vector-only sanitizer. Generated SVG must also pass that sanitizer; embedded images, scripts, event attributes, external links and active content stay forbidden.

Profile palette synchronization controls now appear only in the Shape and Avatar Frame tabs. The Background tab selects the background/palette without a redundant apply-colors checkbox. Selecting the palette still supplies the primary/secondary colors to cosmetics whose independent synchronization setting is enabled.

Compatibility fix: palette capability detection accepts saved base64 PNGs and SVG file URLs, not just base64 SVGs. Enabling synchronization checks the checkbox immediately, prepares legacy PNG vectors or fetches/sanitizes URL SVGs, and updates the shared preview/public render path through a cached derived asset. Preparation failures display an error and revert the toggle; failed requests can retry. Saving waits for preparation. Catalog IDs, ownership and source assets are retained; no creator permissions are needed for a member's derived rendering. Existing common shapes show an automatic-sync status rather than a disabled checkbox that looks interactive.

Verification: vector path generation, both role assignments, solid/gradient recoloring after circular crop, opaque input acceptance, rejection limits, existing SVG masks and 5 MB upload regressions pass focused tests. Browser upload/Worker execution and visual parity with arbitrary member artwork remain unverified; do not claim lossless conversion or live backend/media persistence.

Shape and avatar-frame SVG assets can store a default `svgPalette: { primary, secondary }`. Primary comes from palette `accent`, secondary from palette `secondary`; both use the shared paint model: six-digit solid hex, a basic gradient preset, or a validated club-authored gradient. The creator selects a palette and sees the two resolved colors. Render the original asset through a derived colored SVG, never overwrite its source.

SVG `var(--primary)` / `var(--secondary)` tokens explicitly bind paint roles. For ordinary SVG files the first two distinct painted colors bind to primary/secondary; additional colors, none, transparency, clip paths, mask definitions and local gradient references remain intact. Support presentation attributes, inline/class styles and gradient stop colors. Mask-based single-color tint and two-color SVG binding are separate choices. PNG stays on its existing tint/HSL path.

The equipped self-profile adds boolean `coverShapeUsePalette` and `avatarFrameUsePalette` (default false). When enabled, use the equipped cover palette for primary/secondary, so changing the cover palette updates both cosmetics. Existing color and shape/frame ownership checks still apply. When disabled, use the creator-provided SVG palette or original colors. Circular avatar-frame cropping preserves SVG vectors and the circular clip; PNG crops remain PNG. Current persistence is device-local preview storage, with no newly verified backend endpoint.

## Shared color picker and advanced club gradients - 2026-10-14

All reward color inputs (palette background/secondary/accent/ink, frame tint and SVG primary/secondary) use the same PaletteColorPicker as profile customization. Both modes offer basic solid colors, existing named gradient presets, a solid color picker and editable HEX. Club mode additionally offers a linear gradient editor with angle 0..360 degrees and 2..8 sorted stops, each a six-digit solid hex and a position 0..100 percent. Equal positions are permitted for hard transitions. Profile mode has no angle/stop editor; direct user-authored profile paints accept only solid hex and basic presets. Members may equip an unlocked club palette without modifying its authored gradient definition.

The provisional frontend encodes custom definitions as a validated gradient:custom: URI containing angle/stops JSON. Backend should use a typed paint DTO and validate the same limits rather than trusting an opaque client string. CSS, SVG and canvas renderers share the same angle and stop positions. SVG bindings generate local linearGradient definitions for gradient paint roles; masks and clipping remain independent. Frame PNG tint uses the original alpha as a mask with the selected solid/gradient background. This is still device-local preview data, with no claimed backend persistence.

## Proposed API

### Automatic activity/contest awards — 2026-10-14

The gift creation/edit form supports up to 20 enabled/disabled automatic award rules per gift. Each rule selects an issuer-club activity or references a contest ID/label, targets all verified participants or an inclusive rank interval (one rank is an interval with equal endpoints), and triggers only after completion and final results. Equal-ranked participants all qualify. Overlapping rules must not duplicate a grant to the same participant for the same gift/event. Automatic grants never debit XP or the club redemption wallet. Manual redemption remains available independently; a member who already owns a reusable cosmetic needs no duplicate grant.

Current scope is local rule configuration and a tested eligibility evaluator, not an operational automatic grant service. Activity options come from the existing workspace semester dashboard; no contest listing/final-ranking API or completion-to-award worker is present in the frontend contract. Contest IDs are entered explicitly until that catalog exists. The UI says result integration is pending. No client timer infers winners from dates, attendance order or a provisional leaderboard; no other account's inventory is changed by saving a rule. Physical rewards additionally require stock reservation and a pending handover record.

Proposed manager endpoints: GET/PUT `/api/clubs/{clubId}/rewards/{rewardId}/award-rules`, requiring `club.rewards.manage` and expectedVersion. Typed rules: `{id,eventType:ACTIVITY|CONTEST,eventId,audience:ALL_PARTICIPANTS|RANK_RANGE,rankFrom?,rankTo?,enabled}`; enforce issuer/event ownership, valid rank interval, catalog availability, and supported reward fulfillment. Attach rules before result finalization; changes after finalization must not retroactively grant without an explicit audited settlement operation.

The event service emits an outbox completion/result-finalized event with immutable resultVersion, finalizedAtUtc, event end time, issuer club ID, participating user IDs and final ranks/disqualification flags. The reward worker waits for BOTH completion/end time and finalized results, reads the applicable published reward/rule version, and creates idempotent grant receipts keyed by `(clubId,eventType,eventId,rewardId,userId)`. Persist source result/rule/catalog versions and existing-ownership outcomes; do not charge points. Duplicate delivery/retry is harmless. Use transaction/outbox and bounded batches, expose settlement state/pending/failures to managers, and notify recipients only after committed grants. Cancellation, reward retirement/unpublish before settlement, eligibility rejection, ties, already-owned cosmetics, concurrent redemption and physical stock shortage require explicit outcomes. Corrections to finalized rankings require an audited correction flow, never silently rerun mutated client rules. Grants must be server-authoritative and available when no browser is open.

### Reward lifecycle editor — 2026-10-14

Member presentation: viewers without the store-management flag see only published/available catalog cards with preview, category/name, short description, price, ownership/claim state and opening/closing times. They do not see publication badges, automatic-award setup, manager status filters, edit/create/delete or publication controls. The top-right arrow opens an accessible right-side detail panel with the full description, availability, issuing club, physical stock information where applicable, and the same claim eligibility/button as the card. Claiming updates ownership/balance in both views. The selected panel is keyed to the live catalog record and closes if that record is unpublished, deleted or expires; redemption still independently checks lifecycle state. The current workspace management flag is role-derived; future scoped `club.rewards.manage` capability must be enforced by the API and passed explicitly rather than inferred from visible controls.

The store now groups cards into independent collapsible sections: Recently Added, Hot Gifts, Physical, Avatar Frames, Cover Shapes and Color Palettes (bundles belong to Color Palettes). Category tag filtering is removed. Recently Added/Hot Gifts start expanded; type sections start collapsed. Search and manager status filters apply across all sections and expand them to reveal matches. Expand/collapse-all controls and type-specific create actions are available. Cards retain existing editing, publication, window scheduling, delete and claim behavior in every section.

Created catalog records carry `createdAt` and optional editorial `hot` metadata. Recently Added shows at most six records created in the last 30 days, newest first; editing preserves the original date, and legacy records with unknown dates are not assigned an invented creation time. Hot Gifts shows at most six published records explicitly marked featured by a manager or with positive local successful claim counts, prioritized by editorial flag then count. Counts are issuer scoped and record only a first successful claim, including zero-cost claims; repeat claims and failed claims do not increase them. UI explicitly labels the device-local data source. These are not global popularity metrics. Production should supply canonical createdAtUtc, manager-authored featured status and aggregate redemption counts through the reward catalog; never scan other members' client storage or interpret local counts as a server ledger.

Card revision: publication status reuses the existing activity status badge styles at the top left; edit is an icon button at the top right. The footer uses an adjacent Publish/Unpublish + clock split control. Automatic award rules remain in the create/edit form, with no separate card action. Clock setup defines an opening AND closing timestamp. During `[publishAtUtc, unpublishAtUtc)` the effective status is published; before start it is scheduled, at/after end it is expired/unpublished. Both UI deadlines and redemption checks use this same state evaluator. Setup allows a past opening timestamp if the closing time remains in the future, so an already-active window can be configured. Missing closing time is only supported for legacy one-time publish schedules.

Manual Publish/Unpublish applies immediately and clears the active schedule, avoiding an unexpected later timer override. Removing the schedule via its modal retains the current open/closed state. New gift schedules also require both timestamps. Backend availability reads, redemption transactions and award settlement must evaluate the same UTC interval and expectedVersion, including concurrent manual changes. The frontend timer and local configuration remain provisional; server scheduling is not newly integrated.

The manager reward store now offers edit (club-created gifts only), delete, publish/unpublish, schedule/reschedule and cancel schedule. Creation defaults to draft, with publish-now and scheduled alternatives. Manager filters include published, draft/unpublished and scheduled; members only see currently published records. Existing fixed sample designs retain publication controls but cannot edit their authored assets. Gift kind and issuer cannot change during editing; updates preserve cosmetic ID/key and inventory ownership.

Temporary lifecycle records are stored per club/reward key, separate from the asset catalog. Missing lifecycle data means published for legacy compatibility. Scheduled deadlines use an ISO UTC timestamp selected in local time; the UI wakes at the deadline or refreshes on focus, and the redemption function checks the current timestamp independently. Canceling/unpublishing clears the pending deadline. Deletion is a catalog tombstone: it hides the gift and prevents new claims while keeping assets and existing grants usable. This is browser-local scheduling, with no server job, background notification or cross-device guarantee. Production manager authorization must be enforced by the backend; local controls are a preview only.

Backend reward DTOs should include status, publishAtUtc, publishedAtUtc, retiredAtUtc and expectedVersion. Extend publication with scheduled publish and cancellation; make catalog reads and redemption eligibility evaluate the same server clock/deadline even if a scheduler job is delayed. Delete/retire stops new claims and preserves historical asset versions, receipts and owned grants. Validate future UTC deadlines and club.rewards.manage; avoid modifying an already-granted asset version in place when publishing an edit. Test scheduling boundaries, cancellation/rescheduling races, edit-version conflicts and redemption concurrent with retirement.

- `GET /api/users/me/cosmetics`: owned color/shape entitlement IDs and equipped `coverColorId`, `coverShapeId`, canonical equipped cover fields/version from the self-profile contract.
- `GET /api/clubs/{clubId}/rewards`: active club-managed catalog, cosmetic ID/type, price in credited wallet points, availability and version.
- `GET /api/clubs/{clubId}/wallet/me`: **credited, spendable** point balance and ledger version for the authenticated member.
- `POST /api/clubs/{clubId}/rewards/{rewardId}/redeem`: idempotency key, expected catalog/wallet version. Server transaction verifies active membership, catalog/price, ownership and balance; atomically debits the ledger and grants the entitlement. Return redemption receipt, updated balance and inventory. A zero-price claim grants ownership without reducing the wallet, including when the balance is zero; eligibility and issuer checks still apply. Duplicate requests return the same receipt, never debit twice. Define already-owned behavior without charging again.
- Extend canonical self-profile PATCH with `coverPreset`, `coverBackgroundColor`, `coverShape` and layout/text fields; validate default/free or owned items server-side. Uploaded images use the existing user-owned media contract. Equipping never spends points.

Catalog management requires scoped club leadership permission. Add manager-only shape upload (PNG/SVG stamp, dimensions up to 4096x4096), asset verification, and club reward publication. Upload writes an immutable cosmetic ID scoped to the issuer; same labels across clubs must not collide. Track creator, asset hash, issuer and publication version. Real uploads use authorized R2 storage and return a public asset URL; never interpret user SVG/script as executable markup. The temporary upload uses browser storage and a 5 MB limit, not live R2 publishing. Paid cosmetic definitions should reference a controlled asset catalog; do not accept arbitrary script/markup. Real point credits originate only from approved contribution/activity ledger workflows, not browser counters. Raw activity budgets, XP/experience metrics, financial money, and credited wallet points remain distinct. No administrator or club leader can equip another user's profile.

## Verification and rollout

Test preview/render parity at matching aspect ratios, uploaded image crop parity, independent color/shape edits, legacy profile defaults, ownership checks, club-specific debit and reusable account ownership. Backend must additionally test concurrent redemption, insufficient balance, inactive membership, unauthorized catalog writes, tampered price, replay, rollback and cross-device synchronization.

Replace `cover-cosmetics.js` mock storage through `src/services/api.js` after implementing the contract. Remove sample credits and labels only once real wallet reads, redemption receipts and owned-item validation are verified. Keep denied/failed redemption from changing ownership or balance. Do not migrate sample ownership into production grants.

## FPT Dev starter bundles

Three authored vector starter designs use black/green terminal palettes: Circuit Green (120 sample points), Terminal Developer </> (160), Pixel Hacker (200). The terminal overlay contains the developer </> mark. These are FPT Dev-specific designs, not paid common shapes or a claim that a club has uploaded these assets. Club upload remains available for additional original designs.

Provisional issuer code is `FPT-DEV` (normalized FPTDEV). The current repository does not establish its numeric club ID; never assign these bundles to `FPT-TECH` or another club by fallback. They appear locked in the global profile selector; redemption is offered only in a workspace with the matching issuer code. Bind the actual server club ID and catalog before live rollout.

A combo redemption is one transaction that grants both its color and shape entitlements. Equipping either part or the preset combination never charges again. API reward payload must include immutable bundle grants; the server validates all grants and debits once atomically. Existing styles are free even if they were formerly locked in the temporary UI.


## Layered cover editor

The cover editor does not show bundle/combo cards. Bundle and individual reward redemption happens in the issuing club reward store; granted colors and shapes appear as independent entries in their respective editor tabs.

The editor has three tabs: Background, Shape and Text. A shared 1200x300 canvas renders background color, optional background image, independent stamp, then editable text. Uploading or replacing a background never replaces the selected stamp. Shape controls support dragging, horizontal/vertical offsets, scale and rotation; no stamp remains available through the free none selection.

Extend the self-profile contract with `coverBackgroundColor` (retain the selected palette when background mode is image), `coverShapeTransform: { x, y, scale, rotation }`, and `coverText: { visible, eyebrow, title, subtitle, color, size, x, y }`. X/Y are offsets from the stamp center as percentages of canvas width/height (-100..100). Scale is 10..400 percent about the stamp center; rotation is -180..180 degrees. Legacy transforms default rotation to zero. Add coverShapeHsl: { hue, saturation, lightness }; hue -180..180 degrees, saturation 0..200 percent, lightness -100..100 percent. Defaults are 0/100/0. Image rendering applies hue rotation, saturation and an RGB blend toward white/black for lightness while preserving alpha. These settings do not affect the background or text. Positioning supports pointer dragging and accessible sliders. Text is plain text, eyebrow max 80 characters, title/subtitle max 60, size 24..240 canvas pixels; an empty text color uses the selected palette, otherwise a six-digit hex color. Blank lines are allowed. Text positions x/y are offsets as percentages of the canvas width/height (-100..100), default 0. The entire text group can be dragged in the Text tab or positioned with accessible sliders; font size is rendered exactly, with overflow clipped to the cover canvas. UI preview and public rendering share the same layers and transforms. Escape text instead of accepting HTML/SVG markup.

### Independent text paragraphs — 2026-10-14

Profile and club graphic covers share a paragraph editor in the Text tab. Users can add/delete up to 12 paragraphs, write multiple lines, choose each paragraph's font, size (8..240 canvas pixels), bold/italic style and color, and drag each paragraph independently. Position sliders offer an alternative to dragging. An empty paragraph color inherits the cover palette ink. Profile paragraph paints use solid colors/basic gradient presets; club graphic paragraph paints also accept advanced gradients through the shared picker.

Add optional `coverText.paragraphs: [{ id, text, font, size, x, y, color, bold, italic, opacity }]` for profile covers and `paragraphs` on the club graphic design model. IDs must be unique, 1..64 word/hyphen characters; text is plain text, max 1,000 characters per paragraph. Font references the supported font catalog. X/Y are absolute baseline positions as percentages of canvas width/height, -200..200; opacity is 0..1, default 1. Newlines use 1.25 times the paragraph font size. Clip overflow to the cover. Never interpret text as HTML or SVG markup. An explicit empty array removes all paragraphs.

Paragraph arrays supersede the legacy three-field text layout and group drag described above. Existing covers without arrays adapt eyebrow/title/subtitle into three independent paragraphs, retaining their font, size, position and styles; optional legacy `sizes` supports independent per-field sizes. Profile legacy-field patches update matching legacy paragraph IDs without changing custom paragraphs. Profile normalization and account-scoped preview storage preserve the array. Club graphic designs cache the array against the saved image URL and export the same paragraph positions/fonts/styles into the PNG used by the existing cover upload flow. Raw club image-upload mode retains its existing image workflow. These editor changes do not establish a new backend text-layout endpoint or verified cross-device persistence.

Validation: 39 focused model/storage/export regression tests pass, including independent drag, legacy adapters, multiline canvas rendering, profile account isolation, club image-URL cache binding and paint validation. Production build passes; pointer interactions and font rendering have not been verified in a live browser.

CLB upload accepts PNG or SVG, max 5 MB and 4096x4096; transparency is optional. SVG must be an independent vector design with no scripts, external references or embedded active content. Backend verification remains required before production publishing. The catalog stores default HSL with the asset; a user can override HSL on the equipped stamp without changing the catalog or other accounts. The shape creation and gift previews show the stamp on a checkerboard, not baked into a cover. Ownership is still checked when equipping a stamp on an uploaded background. Persistence and publishing remain temporary browser data; no live media/profile endpoint is added.


## Catalog, ownership and redemption completion — 2026-10-09

D08 [handoff](backend-api-implementation-handoff.md); [conventions](api-contract-conventions.md) apply. Latest main has Admin quest/XP entities, but no club spendable wallet/inventory/redemption. Reuse one wallet/ledger from D07; `/wallet/me` and `/points/me` are projections of that same ledger, never two balances.

POST `/api/clubs/{clubId}/rewards` and PATCH `/rewards/{rewardId}` with expectedVersion require `club.rewards.manage`. Body `{label,kind:"COLOR"|"SHAPE"|"BUNDLE",price,grants,assetId?,availability}`. Label 1..80, price integer 0..100000 (zero means a free claim) under server pricing policy. Grants reference immutable catalog color/shape IDs; bundle grants both. A color definition contains background/secondary/accent/ink validated paints (solid hex, basic gradient preset or club-authored gradient definition). Shape references a verified club-shape PNG or controlled authored starter asset. Issuer derived from club scope, no cross-club publication. Common styles and `none` shape remain free and cannot be republished as paid geometry. Authored FPT Dev starters are not falsely attributed to a club upload.

POST `/rewards/{rewardId}/publish` / `/retire` checks expectedVersion and retains historical grants/receipts. Draft asset/price may change; published immutable definition/version must remain recoverable for existing ownership. Retirement stops new redemption, not use of existing grants unless a separately audited moderation policy revokes unsafe assets. Cosmetic supply is reusable and not single-owner NFT stock. Physical gifts are deferred; if introduced, use separately specified stock/fulfillment/refund workflow.

GET `/api/users/me/cosmetics` -> `{version,owned:[{cosmeticId,kind,issuerClubId,acquiredAt,sourceReceiptId}],colors:[...],shapes:[...],equippedCover:{...}}`. Include free/owned/locked catalog metadata for separate color/shape choices; do not return raw local keys as entitlements. Current frontend storage ownership keys and combo codes need an adapter, not import into real grants. A selected locked preview never equips or charges.

POST `/api/clubs/{clubId}/rewards/{rewardId}/redeem`, `{expectedRewardVersion,expectedWalletVersion}`, Idempotency-Key -> `{receiptId,rewardId,grants,balance,walletVersion,inventoryVersion}`. In one transaction validate active eligible membership, issuer/publication/version, price server-side, existing ownership and sufficient balance; debit once and grant all components atomically. Already owns all grants returns no new charge; define partial ownership explicitly as full-bundle purchase with server-displayed price and only missing grants, never silent per-component double charge. Reject client price/actor/grants and stale/insufficient/conflicting state. Unique receipt/idempotency and wallet row version prevent double debit across different concurrent keys.

GET `/rewards/redemptions/me?page=...` returns own receipt history; manager oversight, if needed, is a separately authorized paged read with minimum recipient data. Notifications/outbox never expose another member's wallet. The sample 120/160/200 costs and 200 starting balance are examples only; bind actual issuer and approved prices before production mint/debit.

Acceptance: draft/publish/retire, verified PNG and cross-issuer denial, account ownership reusable across clubs, image mode ownership check, free defaults, combo grants both separate choices, duplicate/parallel redemption, insufficient credit, transaction rollback, stale versions, retired owned asset behavior, canonical profile render parity including 240px/draggable text. Live mock migration requires explicit review and must never mint sampled grants.


</details>
