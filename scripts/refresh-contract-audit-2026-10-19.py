"""Refresh retained partial specifications with explicit current source evidence."""
from pathlib import Path
import os
import re

root = Path(__file__).resolve().parents[1]
head = 'b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf'
notes = {
    'api-contract-conventions.md': 'Newer ApiOperations-based workflows already implement GUID concurrency and transactional idempotency. Package-wide adoption and all proposed endpoints remain incomplete; do not rebuild those existing foundations.',
    'activity-profile-resources-api.md': 'Activity cover persistence and owner-verified media exist. Resource galleries, upload-intents/commit resources and resourceCapabilities projection remain absent.',
    'club-contributions-points-api.md': 'VerifiedContributionEndpoints, private evidence, reviewer assignments and append-only raw effects/allocations now exist. They do not implement a spendable club wallet, action task catalog, raw activity budget or final-report award gate.',
    'club-governance-groups-api.md': 'Club ownership/membership and scoped verification assignments exist. Governance groups/terms/change sets/report snapshots/office rollover remain absent; a verification grant is not a governance group.',
    'club-governance-groups-proposal.md': 'Retained product decisions remain useful; full governance/office/group history is still missing. Existing verified-experience assignments do not implement these decisions.',
    'club-member-invitations-api.md': 'Existing invitation and personal-consent flows remain. School-semester roster/eligible lookup and validated invite semester are still missing. Canonical self-profile and private member projections now exist separately.',
    'club-navigation-applications-api.md': 'Own access/membership composition remains valid. GUID membership version and review timestamps exist; self withdrawal, WITHDRAWN lifecycle, explicit source/action metadata and server account pins remain incomplete.',
    'my-clubs-membership-api.md': 'The existing own access/membership/directory composition is integrated. No self-withdrawal route or WITHDRAWN state was found; dedicated selection reads remain optional rather than mandatory duplicates.',
    'profile-cover-rewards-api.md': 'Canonical profile text, private experience reads and club/activity media now exist. Server cosmetics/catalog/inventory/redemption/equip and spendable club wallet remain absent.',
    'public-image-api.md': 'PublicMediaEndpoints and verified club/activity image attachment routes now exist and FE sends GUID expectedVersion. Only club-logo/club-cover/activity-cover with existing owner are supported. Application logos/student media/club shapes and live R2 verification remain open.',
    'public-member-directory-api.md': 'Private member list/detail uses canonical profile projections and separate applicationSnapshot. No opt-in public member route/consent store exists; this optional contract remains active.',
    'semester-student-roster-api.md': 'Admin semester CRUD and calendar validation exist. Semester roster revisions/import/preview/carry-forward and inactive-student/leadership rollover are absent.',
    'study-schedule-api.md': 'Student activity sessions/history and semester persistence now exist. A private academic timetable/calendar/import store is still missing; browser storage is not server persistence.',
    'workspace-semester-context-api.md': 'Admin semester list remains BackofficeUser-scoped. Club period plans/statistics/PDF now exist; manager-safe catalog/policy metadata and full period attribution still require a contract.',
    'discover-ui-contract.md': 'Directory/public detail/access foundations exist; student activity feed/detail/recommendations are now integrated separately. Full minimal-directory privacy and the original club recommendation projection remain partial.',
    'activity-discovery-contract.md': 'Student feed/detail/recommendation source and FE consumers now exist. The older full display DTO/action/publication/resource specification is not fully equivalent; retain remaining obligations rather than declaring all proposed fields implemented.',
    'workspace-ui-contract.md': 'Authorized shell, current access composition, activity/session operations, personal experience and club plans/statistics/PDF now have consumers. Governance, wallet, safe semester catalog and action/staffing backend remain missing.',
    'profile-service.md': 'Five canonical text/phone fields, own summary/radar/contribution/ledger/activity history and basic private member projection exist. Academic/media/cosmetic extensions and target credited-wallet policies remain partial.',
}
files = list((root / 'docs/contracts').glob('*.md')) + list((root / 'specs').glob('*/contracts/*.md'))
for file in files:
    if file.name not in notes:
        continue
    source = file.read_text(encoding='utf-8-sig')
    review = f'Source Review: 2026-10-19; backend {head}, fetched current branch and origin/main equal HEAD. Source audit only; live acceptance and service tests unverified.'
    source = re.sub(r'^Source Review:.*$', review, source, flags=re.M)
    source = re.sub(r'^Source Evidence:.*$', 'Source Evidence: ' + notes[file.name], source, flags=re.M)
    marker = '## Current reconciliation — 2026-10-19'
    if marker not in source:
        prefix = f'\n\n{marker}\n\n{notes[file.name]}\n\nThe specification below preserves its original proposed scope. Older dated route-absence and local-only statements are historical where superseded above; use the current lifecycle/index before implementation. Remaining obligations keep this contract Not Yet.\n'
        index = source.find('\n\n', source.find('Source Evidence:')) if 'Source Evidence:' in source else -1
        if index >= 0:
            source = source[:index] + prefix + source[index:]
        else:
            source += prefix
    file.write_text(source, encoding='utf-8')

# Current documents should use the new owner, while archives keep historical links.
replacement_names = {
    'backend-api-implementation-handoff.md': 'README.md', 'backend-changes-for-frontend.md': 'README.md',
    'frontend-api-debt-register.md': 'contract-lifecycle-audit.md', 'page-integration-checklist.md': 'contract-lifecycle-audit.md',
    'existing-api-hardening.md': 'contract-lifecycle-audit.md',
    'activity-discovery-api.md': 'implemented/student-experience-reads-api.md',
    'personal-experience-api.md': 'implemented/student-experience-reads-api.md',
    'self-profile-sync-api.md': 'self-profile-extensions-api.md',
    'club-event-operations-api.md': 'event-registration-extensions-api.md',
}
mapping = {root / 'docs/contracts/outdated' / old: root / 'docs/contracts' / new for old, new in replacement_names.items()}
for base in [root / 'docs', root / 'specs']:
    for file in base.rglob('*.md'):
        if 'outdated' in file.parts or file.name == 'contract-lifecycle-audit.md':
            continue
        source = file.read_text(encoding='utf-8-sig')
        def replace(match):
            target, sep, anchor = match[2].partition('#')
            if not target or re.match(r'^(?:[a-z]+:|/)', target): return match[0]
            destination = mapping.get((file.parent / target).resolve())
            if destination is None: return match[0]
            return match[1] + os.path.relpath(destination, file.parent).replace('\\', '/') + (sep + anchor if sep else '') + match[3]
        updated = re.sub(r'(\[[^\]]*\]\()([^\s)]+)(\))', replace, source)
        if updated != source: file.write_text(updated, encoding='utf-8')
print(f'Reconciled {len(notes)} retained partial specifications against {head}.')
