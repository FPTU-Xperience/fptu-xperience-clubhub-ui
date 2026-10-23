# Contract FE ↔ BE — trạng thái hiện hành 23/10/2026

Implement Status: Done

Status Scope: Documentation: current contract index; not backend/FE completion

Backend Progress: PARTIAL_PROJECT

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62`, branch `feat/backend-contract-completion`; reviewed FE requirement pin `3ffd00ed03a5b8db942ed3ac3b7b6dee098d9f42`. FE worktree remains `update-contract`; no runtime code merge.

Source Evidence: [BE manifest](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/contracts/be-operation-manifest.json); existing BE suite 914 passed / 0 failed / 0 skipped, source/local SQL proof only. This sync runs documentation validation, not a new BE suite or FE/live acceptance.


Điểm bắt đầu cho người làm FE:

1. [Trạng thái từng API, actor và giới hạn](be-api-status.md), cùng [JSON hiện hành](be-api-status.json).
2. [Wire contract để tích hợp](backend-current-integration.md): đúng ID/version, retry, hồ sơ/action, roster, calendar, ảnh self và EMBED resources.
3. [Ma trận toàn bộ contract và phạm vi từng nhãn](contract-lifecycle-audit.md).

**Quan trọng:** BE đã push nhánh `feat/backend-contract-completion`; `main` và môi trường deploy có thể chưa chứa các API mới. Có 40 operation mới so với baseline b066f96; không phải tổng API hay 40 feature-group hoàn thành. BE có 914 test đạt tại commit đã pin; lượt này chỉ đồng bộ docs, chưa sửa consumer/UI hay chạy nghiệm thu live.

| Phần | BE hiện tại | Việc còn lại |
| --- | --- | --- |
| Application/publication/staffing/recruitment | ✅ Vận hành đã có | Điểm/final report/budget hoãn; adapter expectedRawXp null phải xử lý |
| Roster/invitation | ✅ Import email trường và flow core đã có | Account phải tồn tại; HR governance/live delivery còn thiếu |
| Self profile/ảnh cơ bản | ✅ Field cá nhân, avatar/cover, mã từ roster đã có | major/year chưa có nguồn; cosmetics/layout và FE/live còn thiếu |
| Lịch học/calendar | ✅ 6 API BE đã có | Chuyển FE consumer local và nghiệm thu riêng; không phải FAP sync |
| Resources | 🟡 5 API EMBED đã có | canUpload=false; DOCUMENT/MEDIA, private delivery và anonymous transport chưa có |
| Governance | ⏳ Chưa hoàn thành | Chờ chính sách migration thủ quỹ legacy, triển khai quyền đa nhóm/liên service |
| Điểm/credit/wallet/rewards mới | ⏸ Tạm hoãn theo chủ dự án | Không tự chốt công thức, cap, +1, rollover hoặc đổi thưởng |
| Directory/pins/forms/fulfillment/contest/succession | ⏭ Optional/BỎ QUA/cần đặc tả | Giữ lại tài liệu/code; không đánh Done hoặc tự đưa vào core |

Các contract cũ được giữ trong phần mở rộng lịch sử của từng file. Chỉ nhãn/đặc tả hiện hành ở đầu file và wire guide được dùng để quyết định gọi API. `Implement Status: Done` luôn phải đọc cùng `Status Scope`; không đồng nghĩa FE đã làm xong.

## Chỉ mục theo chủ đề

- [activity-action-staffing-api.md](activity-action-staffing-api.md): `PARTIAL_OPERATIONAL_SOURCE_IMPLEMENTED`.
- [activity-attendance-api.md](activity-attendance-api.md): `PARTIAL`.
- [activity-discovery-api.md](activity-discovery-api.md): `SOURCE_IMPLEMENTED`.
- [activity-profile-resources-api.md](activity-profile-resources-api.md): `PARTIAL_EMBED_GALLERY_ONLY`.
- [api-contract-conventions.md](api-contract-conventions.md): `PARTIAL`.
- [api-declaration-inventory.md](api-declaration-inventory.md): `HISTORICAL_INVENTORY`.
- [backend-api-implementation-handoff.md](backend-api-implementation-handoff.md): `PARTIAL`.
- [backend-changes-for-frontend.md](backend-changes-for-frontend.md): `PARTIAL`.
- [be-integration-guide.md](be-integration-guide.md): `DOCUMENTATION_SYNCED`.
- [capstone-scope-contract.md](capstone-scope-contract.md): `DOCUMENTATION_SYNCED`.
- [club-contributions-points-api.md](club-contributions-points-api.md): `DEFERRED_BY_PRODUCT_OWNER`.
- [club-event-operations-api.md](club-event-operations-api.md): `PARTIAL_OPERATIONAL_SOURCE_IMPLEMENTED`.
- [club-governance-groups-api.md](club-governance-groups-api.md): `NOT_IMPLEMENTED`.
- [club-governance-groups-proposal.md](club-governance-groups-proposal.md): `NOT_IMPLEMENTED`.
- [club-member-invitations-api.md](club-member-invitations-api.md): `PARTIAL_CORE_SOURCE_IMPLEMENTED`.
- [club-navigation-applications-api.md](club-navigation-applications-api.md): `PARTIAL_WITH_OPTIONAL_PINS`.
- [club-public-profile-api.md](club-public-profile-api.md): `PARTIAL_CORE_SOURCE_IMPLEMENTED`.
- [club-semester-plan-report-api.md](club-semester-plan-report-api.md): `PARTIAL_EXISTING_SOURCE_IMPLEMENTED`.
- [existing-api-hardening.md](existing-api-hardening.md): `PARTIAL`.
- [experience-scoring-contract.md](experience-scoring-contract.md): `DEFERRED_BY_PRODUCT_OWNER`.
- [frontend-api-debt-register.md](frontend-api-debt-register.md): `PARTIAL`.
- [internal-accounts-verification-api.md](internal-accounts-verification-api.md): `PARTIAL_EXISTING_SOURCE_IMPLEMENTED`.
- [my-clubs-membership-api.md](my-clubs-membership-api.md): `SOURCE_IMPLEMENTED`.
- [page-integration-checklist.md](page-integration-checklist.md): `FE_INTEGRATION_NOT_VERIFIED`.
- [personal-experience-api.md](personal-experience-api.md): `PARTIAL_EXISTING_READS_NEW_SCORING_DEFERRED`.
- [profile-cover-rewards-api.md](profile-cover-rewards-api.md): `DEFERRED_OR_NOT_IMPLEMENTED`.
- [public-image-api.md](public-image-api.md): `PARTIAL_BASIC_IMAGES_IMPLEMENTED`.
- [public-member-directory-api.md](public-member-directory-api.md): `SKIPPED_OPTIONAL_NEEDS_SPEC`.
- [self-profile-extensions-api.md](self-profile-extensions-api.md): `PARTIAL_WITH_IMPLEMENTED_SELF_FIELDS`.
- [self-profile-sync-api.md](self-profile-sync-api.md): `PARTIAL_WITH_CANONICAL_CORE_IMPLEMENTED`.
- [semester-student-roster-api.md](semester-student-roster-api.md): `SOURCE_IMPLEMENTED_EXISTING_ACCOUNTS_ONLY`.
- [study-schedule-api.md](study-schedule-api.md): `SOURCE_IMPLEMENTED`.
- [verified-contributions-api.md](verified-contributions-api.md): `PARTIAL_EXISTING_SOURCE_IMPLEMENTED`.
- [workspace-semester-context-api.md](workspace-semester-context-api.md): `PARTIAL_CATALOG_SOURCE_IMPLEMENTED`.
