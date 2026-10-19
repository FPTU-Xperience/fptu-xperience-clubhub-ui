# Club public-profile text and schedule — implemented source contract

Implement Status: Done

Status Scope: Existing manager public text/structured schedule persistence and FE version integration; live service/browser acceptance remains unverified.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Evidence: ClubService/Endpoints/ClubPublicProfileEndpoints.cs, Models/Club.cs, ClubDbContext, ClubMappers.ToPublicDetailResponse and service registration. GET /api/clubs/{id} returns GUID version and parsed schedule.

PATCH `/api/clubs/{clubId}/public-profile` requires BusinessAccess and server CanManageMemberships for that club. It rejects inactive/deleted targets. Body is a partial object containing expectedVersion and only name/category/description/contactEmail/contactPhone/scheduleLabel/schedule. Unknown/duplicate fields, image URLs, identity/assignments/active status are rejected; stale version is 409. Omitted fields are preserved. Category must be a persisted code. Email max 200, name 200, description 1000, phone 20, schedule label 500; server validation is authoritative.

Structured schedule contains canonical semesterId, unique weekdays 1–7, startTime/endTime in 30-minute slots, repeatWeekly=true and Asia/Ho_Chi_Minh. Cannot send schedule and scheduleLabel together. Null clears structured schedule; a label is metadata, never activity generation. SemesterCatalogClient validates the semester on the server.

```json
{"expectedVersion":"00000000-0000-0000-0000-000000000001","description":"Giới thiệu CLB"}
```

FE ClubPageTab retains Preview/Cancel and writes only on Save changes with the version from its current club read. Image saves remain separate, using their own owner-bound media attachment routes and the same current club version. No fallback to the privileged admin club PUT is used. Source handlers return updated canonical detail/version; errors retain the draft.

User avatar/academic/profile extensions, media live verification, and specialist governance are outside this implemented text/schedule subset. See [current index](../README.md) and [lifecycle](../contract-lifecycle-audit.md).
