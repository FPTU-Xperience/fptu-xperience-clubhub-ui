# Club declaration referral — ClubHub

The personal declaration form now submits `referringClubId` when the student
chooses a current club. It never silently switches that request to direct CTSV
review or a club activity contribution. Submission receipts must confirm the
chosen club, initial review stage, author and server version.

The club workspace uses a live server authority check and a scoped, searchable,
server-paged queue. BOD can request changes, endorse evidence, and forward the
endorsed revision to CTSV. Record versions, capabilities and stable idempotency
keys control actions. Failures remain visible and retry uses the same request.
Private evidence downloads remain authorized by the backend.

Students can revise a returned canonical declaration, reuse/remove uploaded
evidence, add new files and submit again. The response must confirm that the
same club route is retained and both referral stages reset. History and stage
labels distinguish club endorsement from the final CTSV/XP decision.

The unsupported standalone role-permission editor was removed. The tab links
to the actual governance editor, where `club.declarations.process` can be
delegated. Current owner/vice/Secretary authority is enforced at the server.
The unused workspace illustration-mode label was also removed.

Validation: 347 Node tests passed; production build passed. Updated browser
suites exercised submission retry, private evidence reuse, author revision,
club review retry/forwarding, scope/filter/semester and error/denial cases at
320–1440px. Mobile screenshots were inspected. Both PR CI and deployment run
these browser suites. These isolated fixtures are not real-account production
acceptance; no production records were created by them.
