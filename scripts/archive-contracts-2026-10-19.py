"""One-time lifecycle migration for the pinned 2026-10-19 source audit.

Only moves the explicit Markdown manifest below; never deletes contract content.
"""
from pathlib import Path
import os
import re

root = Path(__file__).resolve().parents[1]
manifest = {
    'docs/contracts/backend-api-implementation-handoff.md': 'outdated',
    'docs/contracts/backend-changes-for-frontend.md': 'outdated',
    'docs/contracts/frontend-api-debt-register.md': 'outdated',
    'docs/contracts/page-integration-checklist.md': 'outdated',
    'docs/contracts/activity-discovery-api.md': 'outdated',
    'docs/contracts/personal-experience-api.md': 'outdated',
    'docs/contracts/self-profile-sync-api.md': 'outdated',
    'docs/contracts/club-event-operations-api.md': 'outdated',
    'docs/contracts/existing-api-hardening.md': 'outdated',
    'docs/contracts/club-public-profile-api.md': 'implemented',
    'specs/002-header-production/contracts/notification-summary.md': 'implemented',
}
mapping = {root / old: root / 'docs/contracts' / category / Path(old).name for old, category in manifest.items()}
link = re.compile(r'(\[[^\]]*\]\()([^\s)]+)(\))')
original_files = [p for base in [root / 'docs', root / 'specs'] for p in base.rglob('*.md')]
original_files += list(root.glob('*.md'))
changes = {}
for old_file in original_files:
    new_file = mapping.get(old_file, old_file)
    source = old_file.read_text(encoding='utf-8-sig')
    def replace(match):
        target, separator, anchor = match[2].partition('#')
        if not target or re.match(r'^(?:[a-z]+:|/)', target):
            return match[0]
        resolved = (old_file.parent / target).resolve()
        destination = mapping.get(resolved, resolved)
        if old_file == new_file and resolved == destination:
            return match[0]
        relative = os.path.relpath(destination, new_file.parent).replace('\\', '/')
        return match[1] + relative + (separator + anchor if separator else '') + match[3]
    updated = link.sub(replace, source)
    if old_file in mapping:
        assert new_file.is_relative_to(root / 'docs/contracts')
        assert not new_file.exists(), f'Archive already exists: {new_file}'
        category = manifest[str(old_file.relative_to(root)).replace('\\', '/')]
        if category == 'outdated':
            updated = re.sub(r'^Implement Status: .+$', 'Implement Status: Cancel', updated, flags=re.M)
            updated = re.sub(r'^Status Scope: .+$', 'Status Scope: Historical specification or source snapshot, superseded by the 2026-10-19 lifecycle audit; never a current implementation claim.', updated, flags=re.M)
        else:
            updated = re.sub(r'^Implement Status: .+$', 'Implement Status: Done', updated, flags=re.M)
            updated = re.sub(r'^Status Scope: .+$', 'Status Scope: Implemented backend source boundary; deployment, storage and live acceptance remain unverified.', updated, flags=re.M)
        updated = updated.replace('\n\n', '\n\nArchived on 2026-10-19. See [current lifecycle and remaining obligations](../contract-lifecycle-audit.md). The original text below records its dated scope; newer source evidence takes precedence.\n\n', 1)
    if updated != source or new_file != old_file:
        changes[old_file] = (new_file, updated)

for old_file, (new_file, updated) in changes.items():
    new_file.parent.mkdir(parents=True, exist_ok=True)
    if old_file != new_file:
        old_file.rename(new_file)
    new_file.write_text(updated, encoding='utf-8')
print(f'Moved {len(mapping)} explicit contracts; rewrote {len(changes)} Markdown files including relative links.')
