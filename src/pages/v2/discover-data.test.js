import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    classifyApiError,
    createCuratedClubSet,
    createRequestGate,
    filterClubDirectory,
    mapClubDirectoryEntry,
    mapClubPublicDetail,
    paginateClubDirectory,
} from './discover-data.js';

test('directory adapter exposes only the V2 card model and preserves unavailable recruitment state', () => {
    const mapped = mapClubDirectoryEntry({
        id: 7,
        code: 'F-CODE',
        name: 'F-Code',
        category: 'TECHNOLOGY',
        description: 'Programming club',
        logoUrl: 'https://cdn.example.edu/f-code.png',
        members: [{ userId: 'private', fullName: 'Private Student' }],
    });
    assert.equal(mapped.id, '7');
    assert.equal(mapped.destination, '/v2/clubs/7');
    assert.equal(mapped.category, 'Công nghệ');
    assert.equal(mapped.logoUrl, 'https://cdn.example.edu/f-code.png');
    assert.equal(mapped.hasRecruitmentStatus, false);
    assert.equal(mapped.isRecruiting, null);
    assert.equal('members' in mapped, false);
});

test('directory criteria combine query, category, and recruitment with AND semantics', () => {
    const entries = [
        mapClubDirectoryEntry({ id: 'a', name: 'Alpha Code', category: 'TECHNOLOGY', isRecruiting: true }),
        mapClubDirectoryEntry({ id: 'b', name: 'Alpha Art', category: 'ARTS', isRecruiting: true }),
        mapClubDirectoryEntry({ id: 'c', name: 'Closed Code', category: 'TECHNOLOGY', isRecruiting: false }),
    ];
    assert.deepEqual(
        filterClubDirectory(entries, { query: 'code', category: 'Công nghệ', recruitingOnly: true }).map(
            (club) => club.id,
        ),
        ['a'],
    );
});

test('detail adapter strips roster data and maps viewer-scoped access', () => {
    const detail = mapClubPublicDetail(
        { id: 'a', name: 'Alpha', members: [{ userId: 'private' }], contactEmail: 'club@example.edu' },
        [{ clubId: 'a', isApprovedMember: true }],
    );
    assert.equal(detail.viewerRelationship, 'MEMBER');
    assert.equal(detail.contact.email, 'club@example.edu');
    assert.equal('members' in detail, false);
});

test('request gate rejects stale request identities', () => {
    const gate = createRequestGate();
    const first = gate.next();
    const second = gate.next();
    assert.equal(gate.isCurrent(first), false);
    assert.equal(gate.isCurrent(second), true);
    gate.invalidate();
    assert.equal(gate.isCurrent(second), false);
});

test('error outcomes remain distinct', () => {
    assert.equal(classifyApiError({ status: 401 }), 'unauthorized');
    assert.equal(classifyApiError({ status: 403 }), 'forbidden');
    assert.equal(classifyApiError({ status: 404 }), 'not-found');
    assert.equal(classifyApiError(new Error('offline')), 'error');
});

test('curated fallback is deterministic and explicitly based on permitted entries', () => {
    const entries = ['Zulu', 'Alpha', 'Beta'].map((name) => mapClubDirectoryEntry({ id: name, name }));
    assert.deepEqual(
        createCuratedClubSet(entries, 2).map((club) => club.name),
        ['Alpha', 'Beta'],
    );
});

test('club directory pagination returns six clubs per page and clamps invalid pages', () => {
    const entries = Array.from({ length: 13 }, (_, index) => ({ id: String(index + 1) }));
    assert.deepEqual(
        paginateClubDirectory(entries, 2).items.map((club) => club.id),
        ['7', '8', '9', '10', '11', '12'],
    );
    assert.equal(paginateClubDirectory(entries, 99).currentPage, 3);
    assert.equal(paginateClubDirectory(entries, 3).items.length, 1);
    assert.equal(paginateClubDirectory(entries, 1, 12).items.length, 12);
});

test('production V2 modules do not import demo state and demo links stay under /v2/demo', () => {
    const productionFiles = ['DiscoverPage.jsx', 'AllClubsPage.jsx', 'ClubDetailPage.jsx'];
    for (const file of productionFiles) {
        const source = readFileSync(new URL(file, import.meta.url), 'utf8');
        assert.doesNotMatch(source, /DemoContext|\.\/model|UI LAB/);
    }
    for (const file of ['DemoApp.jsx', 'Discovery.jsx', 'Workspace.jsx', 'Profile.jsx', 'ui.jsx']) {
        const source = readFileSync(new URL(file, import.meta.url), 'utf8');
        const paths = source.match(/\/v2[^'"`\s}]*/g) || [];
        assert.equal(
            paths.every((path) => path.startsWith('/v2/demo')),
            true,
            `${file} contains production V2 path`,
        );
    }
});

test('production routing isolates demo, all-clubs, and club-detail pages', () => {
    const routes = readFileSync(new URL('V2App.jsx', import.meta.url), 'utf8');
    assert.match(routes, /path="demo\/\*"/);
    assert.match(routes, /<Route index element={<DiscoverPage/);
    assert.match(routes, /path="clubs"/);
    assert.match(routes, /path="recommended"/);
    assert.match(routes, /path="clubs\/:clubId"/);
    assert.match(routes, /AllClubsPage/);
    assert.doesNotMatch(routes, /RecommendedClubsPage/);

    assert.match(routes, /<Header user={user}/);
    assert.match(routes, /<main id="v2-main"/);
    assert.match(routes, /<Footer \/>/);
    assert.doesNotMatch(routes, /DiscoverShell|DiscoverRail/);
});

test('production header is V2-local, production-routed, and accessible', () => {
    const app = readFileSync(new URL('V2App.jsx', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../../components/v2/Header.jsx', import.meta.url), 'utf8');
    const headerStyles = readFileSync(new URL('../../components/v2/Header.scss', import.meta.url), 'utf8');

    assert.match(app, /import Header from '..\/..\/components\/v2\/Header'/);
    assert.match(header, /to="\/v2"/);
    assert.match(header, /to="\/v2\/clubs"/);
    assert.match(header, /useHeaderNotifications/);
    assert.match(header, /aria-expanded/);
    assert.match(header, /aria-controls="v2-notification-popover"/);
    assert.match(header, /event\.key === 'Escape'/);
    assert.match(header, /aria-label="Đóng thông báo"/);
    assert.match(header, /onLogout/);
    assert.doesNotMatch(header, /DemoContext|NotificationContext|fixture|\/v2\/demo/);
    assert.doesNotMatch(header, /className="[^"]*dx-/);
    assert.match(header, /className="v2-header"/);
    assert.match(headerStyles, /\.v2-notification-popover/);
    assert.match(headerStyles, /top: calc\(100% - 12px\)/);
    assert.doesNotMatch(headerStyles, /\.dx-/);
});

test('production Discover composes the complete demo layout instead of a redesigned page', () => {
    const page = readFileSync(new URL('DiscoverPage.jsx', import.meta.url), 'utf8');
    for (const component of ['DiscoverHero', 'DirectoryFilters', 'DirectoryPagination', 'ClubCard', 'BottomCallout']) {
        assert.match(page, new RegExp(component));
    }
    assert.match(page, /PAGE_SIZE = 6/);
    assert.match(page, /MAX_PAGES = 4/);
    assert.match(page, /showRecruiting={false}/);
    assert.match(page, /CLB dành cho bạn/);

    const allClubsPage = readFileSync(new URL('AllClubsPage.jsx', import.meta.url), 'utf8');
    assert.match(allClubsPage, /PAGE_SIZE = 12/);
    assert.match(allClubsPage, /onlyRecruiting/);

    const layout = readFileSync(new URL('../../components/v2/DiscoveryLayout.jsx', import.meta.url), 'utf8');
    const filters = readFileSync(new URL('../../components/v2/DirectoryFilters.jsx', import.meta.url), 'utf8');
    const card = readFileSync(new URL('../../components/v2/ClubCard.jsx', import.meta.url), 'utf8');
    assert.match(card, /ClubLogo/);
    assert.doesNotMatch(card, /ClubArt/);
    assert.match(layout, /failedUrl === club\.logoUrl/);
    assert.match(layout, /onError/);
    assert.match(layout, /return <ClubArt club={club} hero={hero} \/>/);
    assert.match(layout, /to="\/v2\/clubs"/);
    for (const className of [
        'dx-discover-hero',
        'dx-discovery-strip',
        'dx-bottom-callout',
        'dx-filter-bar',
        'dx-directory-label',
        'dx-club-card',
    ]) {
        assert.equal(`${layout}${filters}${card}`.includes(className), true, `${className} must remain demo-derived`);
    }

    const productionStyles = readFileSync(new URL('discover.scss', import.meta.url), 'utf8');
    assert.doesNotMatch(productionStyles, /\.v2-hero|\.v2-club-card|\.v2-directory-tools/);
});

test('every production availability outcome has a distinct presentation', () => {
    const states = readFileSync(new URL('../../components/v2/PageState.jsx', import.meta.url), 'utf8');
    for (const status of ['loading', 'empty', 'forbidden', 'unauthorized', 'not-found', 'error']) {
        assert.match(states, new RegExp(`['\"]?${status}['\"]?\\s*:`));
    }
    assert.match(states, /onRetry/);
});
