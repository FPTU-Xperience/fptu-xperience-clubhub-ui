# Saved public media display

ClubCardMedia renders a club cover (or the shared default GraphicBanner) and a separate club logo. Public directory/discovery cards and My Clubs cards share this component. Activity poster cards show the saved cover or the same activity graphic used by the detail/editor; schedule variants retain their compact date layout.

Directory and membership adapters retain both `coverImageUrl` and `logoUrl`. Cropped uploads, generated logos, and generated graphic covers all use the same saved image URL fields.

`api.updateClubPublicImages` and `api.updateActivityCoverImage` publish invalidation only after their save request succeeds. Club directory/detail/My Clubs and activity feed/recommendation/detail hooks reload their authorized API data on the relevant signal. A localStorage signal notifies other open tabs on the same origin; it carries only entity kind, ID, and revision, never image bytes or a substitute authoritative record. Failed saves publish nothing. Other browsers/devices see changes when fetching the persisted backend record.

Current sibling backend source boundary: `ClubDirectoryResponse` in ClubService/Contracts/ClubContracts.cs omits `CoverImageUrl`; the public detail response includes it, while the manager/private response does not. Upload-intent, club public-image-save, and activity cover-image-save routes were not found in the current source scan. These backend contracts must persist and expose the returned image URLs before live cross-user display can be asserted. This change completes frontend mapping, rendering, and successful-save invalidation; it does not implement those backend routes.

Verification covers URL mapping through public and membership projections, event kind filtering and cross-tab invalidation, card markup with saved URLs, and failure/success publication at the API boundary. Live backend upload/save and cross-device behavior remain unverified.

All production selectors now share ApiService.media for acknowledged logo/cover values, with stale-read and logout guards. Personal media is owned by the account-scoped PersonalMediaProvider. See media-source-audit.md for the full surface audit. Activity banners use 1200 × 500 (12:5); profile/club covers retain 1200 × 300 (4:1).
