# Remaining self-profile extensions and membership projections

Implement Status: Not Yet

Status Scope: BE extended self fields/basic media implemented; official academic source/cosmetics incomplete

Backend Progress: PARTIAL_WITH_IMPLEMENTED_SELF_FIELDS

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HO_SO_CA_NHAN_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#profile).

**Đã có BE:** Headline, dateOfBirth, address, avatar/cover và academic.studentCode từ roster đã có qua self GET/PATCH.

**Chưa hoàn thành / giới hạn:** Ngành/năm học chính thức vẫn null NO_AUTHORITATIVE_SOURCE; cosmetics/layout và live R2/FE acceptance chưa hoàn thành.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Remaining self-profile extensions and membership projections

Historical Implement Status: Not Yet

Historical Status Scope: Backend and FE work beyond the implemented canonical text/phone subset.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. `CanonicalProfileEndpoints.Response/PatchAsync` exposes five editable text/list/phone fields. It does not persist headline, date of birth, address, student code, major/year, profile avatar/background/cosmetic layout. `PublicMediaEndpoints` does not make these profile fields writable.

Reuse [canonical GET/PATCH](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/blob/3ffd00ed03a5b8db942ed3ac3b7b6dee098d9f42/docs/contracts/implemented/canonical-self-profile-api.md). Extend its returned editable-field metadata and version; do not introduce another PUT or arbitrary-user public profile endpoint. Academic identity must have an authoritative Admin/roster source and read-only provenance, not a client assertion. Define validation, clear/null semantics and a migration/import preview before accepting older browser-local fields.

The basic private club member projection is now present: MemberManagementEndpoints resolves current account/profile values, returns separate applicationSnapshot/currentProfile/profileSource, fails unavailable profile authority with 503, and refuses manager personal writes with PERSONAL_PROFILE_SELF_ONLY. FE displays these sources separately. Reuse this mechanism for further fields. Extended-field visibility, live propagation and privacy acceptance still require verification.

Profile media needs owner-bound upload/verification and explicit profile attachment. Existing club/activity media verification can be reused; a public URL alone is not ownership. Cosmetics/catalog/inventory are owned by [the rewards contract](profile-cover-rewards-api.md).

Acceptance: cross-device read after save; two-account isolation; stale GUID rejection; immutable application answers; manager personal writes denied; academic/identity forgery denied; local import requires a deliberate user action; sharing preview hides all private fields. Frontend-only persistence remains labelled device-local until these obligations pass.

</details>
