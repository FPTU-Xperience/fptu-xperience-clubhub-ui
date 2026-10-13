# Media source audit

Production media has two owners: acknowledged public API records, and the existing account-scoped personal media repository. Preview files/designs belong only to their open editor. Demo fixtures remain isolated.

| Surface | Canonical source and subscription |
| --- | --- |
| V2 profile and left rail avatar | One PersonalMediaProvider under AuthProvider owns useProfile and useProfileImages; both render ProfileAvatar with the same saved mode, image, initials design and overlay frame. |
| Legacy header, sidebar and profile avatar | AccountAvatar consumes that same provider; AuthContext preserves API avatarUrl as the initial fallback. |
| Profile custom cover | Provider-owned IndexedDB blob and saved account-scoped cover design; image notifications refresh other tabs. |
| Club directory/discovery and My Clubs cards | API media store keyed by club ID; shared ClubCardMedia displays cover/graphic and logo. |
| Public club header, workspace rail/switcher, club editor | The same club media selector, including existing mounted snapshots. Unsaved file preview overrides only its editor. |
| Profile memberships and membership applications/invitations | Club ID selects canonical logo; membership lookup refreshes actual club data even if an older membership supplied a logo. Explicit removal cannot revive that older URL. |
| Activity cards, detail/modal and workspace editor | Activity ID selects API cover; uploaded/generated covers use the same field. Editor preview stays separate. Dashboard/feed/detail loaders also subscribe to successful-save signals. |
| Legacy club administration | API reads and saves use the same store. The directory reloads on successful club changes; an old failed logo URL cannot prevent a later URL rendering. |

`ApiService.media` is an in-memory projection, not another persistent database. Reads ingest only supplied media fields, retain known values for omitted DTO fields, and treat explicit null as removal. Read tickets prevent a response begun before a save from overwriting newer fields. Logout clears the store and rejects earlier-session completions. Public updates enter the store and emit invalidation only after API acknowledgement, including admin updateClub and general updateActivity/createActivity paths. No uploaded-but-unsaved URL becomes public.

Profile image bytes stay in the existing account-keyed IndexedDB store. A tiny account/kind/revision signal refreshes them in other tabs; no URL/image bytes are copied into localStorage. Per-kind read generations and provider lifetimes prevent stale reads or account changes from replacing current object URLs. Replaced URLs are revoked.

Club image saves send only the edited field. This avoids erasing a cover when a manager DTO omitted it. The provisional backend contract must preserve omitted fields (see media-storage-integration.md).

Activity banners now use 1200 × 500px (12:5) for cropping, generated PNGs, SVG previews, palette previews, cards and detail/editor display at all breakpoints. Club/profile covers remain 1200 × 300px; avatars/logos remain 300 × 300px. Shared geometry keeps percentage drags, gradient paint and PNG output consistent with each SVG canvas.

## Persistence boundary

The sibling backend still lacks the upload-intent/public-image/cover-image routes in this source scan. Its club directory and manager DTOs omit CoverImageUrl. A known acknowledged URL can therefore fill an omitted field during the current session, but a fresh session needs backend list/detail DTOs to expose persisted media. Personal avatar/cover and appearance are still device-local until a profile-media backend contract exists. This frontend audit does not establish live R2 persistence, cross-device sync or image delivery.

## Verification

109 V2 tests, 23 service/cosmetic tests, Vite SSR smoke and production build passed. Tests cover partial DTOs, numeric/string ID alignment, explicit removal, stale reads, logout isolation, failed saves, account-filtered image signals and both banner geometries. Vite SSR checks acknowledged API saves and rendering from stale card props. Browser DOM checks confirmed profile/rail avatar markup matches, all four navigation rows share their left edge and height, and activity preview/palette/detail SVGs use 1200 × 500 with a footer outside the scroll area.

Activity display height is independent of upload dimensions. Poster cards keep a 3:2 overall ratio with a 360px minimum and reserve at least 200px for the banner row; body/actions occupy their own content-sized row. Detail/workspace headers use clamp(220px, 25vw, 340px). Image/SVG thumbnails fill these bounds from the left center; crop/export/editor previews retain the full 1200 × 500 canvas.

Public club card thumbnails use a 12:5 frame bounded to 160–210px high, with explicit 100% width so minimum height cannot widen the cover beyond its card. Image/SVG previews fill from the left center and retain the logo overlap below the banner. Club crop/export dimensions stay 1200 × 300; My Clubs shares the same bounded banner frame.

Public club cards now place their logo inline in a two-column identity header (64px logo, flexible text column) beneath the banner. Badge group, name and schedule align left in the text column; descriptions show up to three lines and the footer contains only club code plus the discover link. ClubCardLogo is shared with ClubCardMedia and reads the same canonical media selector. My Clubs uses a stacked banner and inline logo identity header.

My Clubs repair: the old 140px vertical artwork column was removed after the shared horizontal banner exposed its incompatible grid. Cards now use a full-width 12:5 banner (160–210px), one canonical ClubCardLogo in the identity header, and content-sized activity/actions rows below. SSR checks enforce one logo and preserve workspace destination and pin accessibility state; browser inspection verified a full-width 210px banner and contained actions.
