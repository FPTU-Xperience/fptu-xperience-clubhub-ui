# Cover cosmetics and club point redemption

Frontend scope: independent background-color and shape selection, identical preview/live renderer, uploaded cover mode, and a temporary club reward store. `ProfileCoverArt` renders a scalable 1400×270 composition everywhere; colors change the palette, shapes change the geometry. Existing profiles retain the petal shape by default.

## Temporary data boundary

The agreed UI-first workflow uses account-scoped browser storage. All existing/common colors are free: default/sunset/horizon/forest/violet. All common shapes (petals/ribbons/circles/orbits/waves) are free. Paid shapes are distinct club-uploaded assets with unique IDs, issuer club, original label, asset URL and point price; common geometry must never become a paid shape. Only new FPT Dev exclusive palettes and club-owned designs require ownership. The temporary store starts each club at **200 sample points**, clearly labeled in UI, and subtracts only that club's sample balance on redemption. Ownership is reusable across the account's profile. Each exclusive shape can only be redeemed at its issuing club. Unique/exclusive means a club-origin design, not a single-owner or NFT supply constraint. Locked colors and shapes remain selectable for preview at 33% thumbnail opacity with a lock icon; save requires ownership. Repeat redemption does not charge twice. No production points or monetary balance is read or changed. The mock is neither a secure wallet nor a cross-device ledger and must be replaced before real redemption.

Backend source scan of fetched main `80818266f617bd5144ab1b1a6cd0e74983983a4d`: Admin quest catalog has reward-XP metadata, but no usable cosmetic inventory, club point-wallet or redemption API. A quest reward field alone is not proof of credited wallet points.

## Proposed API

- `GET /api/users/me/cosmetics`: owned color/shape entitlement IDs and equipped `coverColorId`, `coverShapeId`, canonical equipped cover fields/version from the self-profile contract.
- `GET /api/clubs/{clubId}/rewards`: active club-managed catalog, cosmetic ID/type, price in credited wallet points, availability and version.
- `GET /api/clubs/{clubId}/wallet/me`: **credited, spendable** point balance and ledger version for the authenticated member.
- `POST /api/clubs/{clubId}/rewards/{rewardId}/redeem`: idempotency key, expected catalog/wallet version. Server transaction verifies active membership, catalog/price, ownership and balance; atomically debits the ledger and grants the entitlement. Return redemption receipt, updated balance and inventory. Duplicate requests return the same receipt, never debit twice. Define already-owned behavior without charging again.
- Extend canonical self-profile PATCH with `coverPreset`, `coverBackgroundColor`, `coverShape` and layout/text fields; validate default/free or owned items server-side. Uploaded images use the existing user-owned media contract. Equipping never spends points.

Catalog management requires scoped club leadership permission. Add manager-only shape upload (transparent PNG overlay, dimensions up to 4096x4096), asset verification, and club reward publication. Upload writes an immutable cosmetic ID scoped to the issuer; same labels across clubs must not collide. Track creator, asset hash, issuer and publication version. Real uploads use authorized R2 storage and return a public asset URL; never interpret user SVG/script as executable markup. The temporary upload uses browser storage and a 1 MB limit, not live R2 publishing. Paid cosmetic definitions should reference a controlled asset catalog; do not accept arbitrary script/markup. Real point credits originate only from approved contribution/activity ledger workflows, not browser counters. Raw activity budgets, XP/experience metrics, financial money, and credited wallet points remain distinct. No administrator or club leader can equip another user's profile.

## Verification and rollout

Test preview/render parity at matching aspect ratios, uploaded image crop parity, independent color/shape edits, legacy profile defaults, ownership checks, club-specific debit and reusable account ownership. Backend must additionally test concurrent redemption, insufficient balance, inactive membership, unauthorized catalog writes, tampered price, replay, rollback and cross-device synchronization.

Replace `cover-cosmetics.js` mock storage through `src/services/api.js` after implementing the contract. Remove sample credits and labels only once real wallet reads, redemption receipts and owned-item validation are verified. Keep denied/failed redemption from changing ownership or balance. Do not migrate sample ownership into production grants.

## FPT Dev starter bundles

Three authored vector starter designs use black/green terminal palettes: Circuit Green (120 sample points), Terminal Developer </> (160), Pixel Hacker (200). The terminal overlay contains the developer </> mark. These are FPT Dev-specific designs, not paid common shapes or a claim that a club has uploaded these assets. Club upload remains available for additional original designs.

Provisional issuer code is `FPT-DEV` (normalized FPTDEV). The current repository does not establish its numeric club ID; never assign these bundles to `FPT-TECH` or another club by fallback. They appear locked in the global profile selector; redemption is offered only in a workspace with the matching issuer code. Bind the actual server club ID and catalog before live rollout.

A combo redemption is one transaction that grants both its color and shape entitlements. Equipping either part or the preset combination never charges again. API reward payload must include immutable bundle grants; the server validates all grants and debits once atomically. Existing styles are free even if they were formerly locked in the temporary UI.


## Layered cover editor

The cover editor does not show bundle/combo cards. Bundle and individual reward redemption happens in the issuing club reward store; granted colors and shapes appear as independent entries in their respective editor tabs.

The editor has three tabs: Background (catalog colors and user-uploaded background images in one tab), Shape, and Text. Render with a shared 1400x270 canvas in this order: background color, optional background image with centered cover crop, transparent shape overlay, editable text. Uploaded backgrounds do not replace or hide the shape/text layers. A free `none` shape is available. Existing records default to the original text and shape transform.

Extend the self-profile contract with `coverBackgroundColor` (retain the selected palette when background mode is image), `coverShapeTransform: { x, y, scale }`, and `coverText: { visible, eyebrow, title, subtitle, color, size, x, y }`. X is a percentage of canvas width (-50..50), Y a percentage of canvas height (-100..100); scale is 25..200 percent about the canvas center. Positioning supports pointer dragging and accessible sliders. Text is plain text, eyebrow max 80 characters, title/subtitle max 60, size 24..240 canvas pixels; an empty text color uses the selected palette, otherwise a six-digit hex color. Blank lines are allowed. Text positions x/y are offsets as percentages of the canvas width/height (-100..100), default 0. The entire text group can be dragged in the Text tab or positioned with accessible sliders; font size is rendered exactly, with overflow clipped to the cover canvas. UI preview and public rendering share the same layers and transforms. Escape text instead of accepting HTML/SVG markup.

CLB upload now accepts only PNG, max 1 MB and 4096x4096, and checks for transparent pixels before publication. The backend must independently decode, verify transparency, validate dimensions, remove metadata and authorize publication through the media contract. Shape ownership must be checked even when equipping an uploaded background, so image mode cannot bypass locked cosmetics. User background images remain separate from club-issued shape assets. Current persistence and publishing remain temporary browser data; no live media/profile endpoint is added in this UI-first change.


## Catalog, ownership and redemption completion — 2026-10-09

D08 [handoff](backend-api-implementation-handoff.md); [conventions](api-contract-conventions.md) apply. Latest main has Admin quest/XP entities, but no club spendable wallet/inventory/redemption. Reuse one wallet/ledger from D07; `/wallet/me` and `/points/me` are projections of that same ledger, never two balances.

POST `/api/clubs/{clubId}/rewards` and PATCH `/rewards/{rewardId}` with expectedVersion require `club.rewards.manage`. Body `{label,kind:"COLOR"|"SHAPE"|"BUNDLE",price,grants,assetId?,availability}`. Label 1..80, price positive integer <=100000 under server pricing policy. Grants reference immutable catalog color/shape IDs; bundle grants both. A color definition contains background/secondary/accent/ink validated hex values. Shape references a verified club-shape PNG or controlled authored starter asset. Issuer derived from club scope, no cross-club publication. Common styles and `none` shape remain free and cannot be republished as paid geometry. Authored FPT Dev starters are not falsely attributed to a club upload.

POST `/rewards/{rewardId}/publish` / `/retire` checks expectedVersion and retains historical grants/receipts. Draft asset/price may change; published immutable definition/version must remain recoverable for existing ownership. Retirement stops new redemption, not use of existing grants unless a separately audited moderation policy revokes unsafe assets. Cosmetic supply is reusable and not single-owner NFT stock. Physical gifts are deferred; if introduced, use separately specified stock/fulfillment/refund workflow.

GET `/api/users/me/cosmetics` -> `{version,owned:[{cosmeticId,kind,issuerClubId,acquiredAt,sourceReceiptId}],colors:[...],shapes:[...],equippedCover:{...}}`. Include free/owned/locked catalog metadata for separate color/shape choices; do not return raw local keys as entitlements. Current frontend storage ownership keys and combo codes need an adapter, not import into real grants. A selected locked preview never equips or charges.

POST `/api/clubs/{clubId}/rewards/{rewardId}/redeem`, `{expectedRewardVersion,expectedWalletVersion}`, Idempotency-Key -> `{receiptId,rewardId,grants,balance,walletVersion,inventoryVersion}`. In one transaction validate active eligible membership, issuer/publication/version, price server-side, existing ownership and sufficient balance; debit once and grant all components atomically. Already owns all grants returns no new charge; define partial ownership explicitly as full-bundle purchase with server-displayed price and only missing grants, never silent per-component double charge. Reject client price/actor/grants and stale/insufficient/conflicting state. Unique receipt/idempotency and wallet row version prevent double debit across different concurrent keys.

GET `/rewards/redemptions/me?page=...` returns own receipt history; manager oversight, if needed, is a separately authorized paged read with minimum recipient data. Notifications/outbox never expose another member's wallet. The sample 120/160/200 costs and 200 starting balance are examples only; bind actual issuer and approved prices before production mint/debit.

Acceptance: draft/publish/retire, verified PNG and cross-issuer denial, account ownership reusable across clubs, image mode ownership check, free defaults, combo grants both separate choices, duplicate/parallel redemption, insufficient credit, transaction rollback, stale versions, retired owned asset behavior, canonical profile render parity including 240px/draggable text. Live mock migration requires explicit review and must never mint sampled grants.
