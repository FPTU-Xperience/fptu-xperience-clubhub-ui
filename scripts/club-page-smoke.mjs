import assert from 'node:assert/strict';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server.js';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const path = '/src/pages/v2/club-workspace-page/tabs/club-page/';
try {
    const { default: Preview } = await vite.ssrLoadModule(`${path}ClubPagePreview.jsx`);
    const { default: Info } = await vite.ssrLoadModule(`${path}ClubPageInfoModal.jsx`);
    const { default: Images } = await vite.ssrLoadModule(`${path}ClubPageImageModal.jsx`);
    const { default: CoverImageModal } = await vite.ssrLoadModule('/src/components/media/CoverImageModal.jsx');
    const { default: GraphicBanner } = await vite.ssrLoadModule('/src/components/media/GraphicBanner.jsx');
    const { default: ClubCard } = await vite.ssrLoadModule('/src/components/v2/club-card/ClubCard.jsx');
    const { default: MyClubCard } = await vite.ssrLoadModule('/src/components/v2/my-clubs/MyClubCard.jsx');
    const { default: ActivityCard } = await vite.ssrLoadModule('/src/components/v2/activity-card/ActivityCard.jsx');
    const { default: clientApi } = await vite.ssrLoadModule('/src/services/api.js');
    const { EntityMediaProvider } = await vite.ssrLoadModule('/src/components/media/EntityMediaContext.jsx');
    const { ACTIVITY_BANNER_SIZE } = await vite.ssrLoadModule('/src/components/media/graphic-banner.js');
    const { default: GraphicBannerEditor } = await vite.ssrLoadModule('/src/components/media/GraphicBannerEditor.jsx');
    const { defaultGraphicBanner, saveGraphicBanner } = await vite.ssrLoadModule(
        '/src/components/media/graphic-banner.js',
    );
    const { default: Schedule } = await vite.ssrLoadModule(`${path}ClubScheduleEditor.jsx`);
    const { CLUB_PAGE_FIELDS, CLUB_PAGE_TABS } = await vite.ssrLoadModule(`${path}club-page-fields.js`);
    const { default: Members } = await vite.ssrLoadModule('/src/pages/v2/club-workspace-page/tabs/MembersTab.jsx');
    const { ClubRolesInfoModal } = await vite.ssrLoadModule(
        '/src/pages/v2/club-workspace-page/tabs/members/ClubRolesInfo.jsx',
    );
    const { default: EditProfile } = await vite.ssrLoadModule('/src/pages/v2/profile-page/EditProfileModal.jsx');
    const { createMockProfile } = await vite.ssrLoadModule('/src/pages/v2/profile-data.js');
    const { default: CoverArt } = await vite.ssrLoadModule('/src/pages/v2/profile-page/ProfileCoverArt.jsx');
    const { default: CoverModal } = await vite.ssrLoadModule('/src/pages/v2/profile-page/ProfileCoverModal.jsx');
    const { AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx');
    const { default: Invite } = await vite.ssrLoadModule(
        '/src/pages/v2/club-workspace-page/tabs/members/InviteMemberModal.jsx',
    );
    const { default: MyApplications } = await vite.ssrLoadModule(
        '/src/components/v2/my-clubs/MyMembershipApplications.jsx',
    );
    const club = {
        name: 'CLB kiểm thử',
        category: 'TECHNOLOGY',
        description: 'Nội dung đã lưu',
        contactEmail: 'club@example.edu',
        contactPhone: '0123456789',
        scheduleLabel: 'Thứ bảy',
    };
    const noop = () => {};
    const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
    {
        const publicCard = renderToStaticMarkup(
            React.createElement(
                StaticRouter,
                { location: '/v2' },
                React.createElement(ClubCard, {
                    club: {
                        id: '7',
                        name: 'Club',
                        tags: [],
                        destination: '/v2/clubs/C7',
                        logoUrl: 'https://example.com/saved-logo.png',
                        coverImageUrl: 'https://example.com/saved-cover.png',
                    },
                }),
            ),
        );
        assert.ok(publicCard.includes('saved-logo.png') && publicCard.includes('saved-cover.png'));
        const publicActivity = render(ActivityCard, {
            activity: {
                id: '1',
                title: 'Activity',
                status: 'UPCOMING',
                coverImageUrl: 'https://example.com/saved-activity.png',
            },
            onOpen: noop,
        });
        assert.ok(publicActivity.includes('saved-activity.png'));
        const myClub = renderToStaticMarkup(React.createElement(StaticRouter, { location: '/v2/my-clubs' },
            React.createElement(MyClubCard, {
                club: { clubId: '7', clubCode: 'C7', name: 'My club', role: 'MANAGER', pendingApplications: null,
                    workspacePath: '/v2/my-clubs/C7', logoUrl: 'https://example.com/my-logo.png', coverImageUrl: 'https://example.com/my-cover.png' },
                pinned: true, onTogglePin: noop,
            })));
        assert.equal((myClub.match(/class="v2-club-card-logo /g) || []).length, 1);
        assert.equal((myClub.match(/src="https:\/\/example.com\/my-logo.png"/g) || []).length, 1);
        assert.ok(myClub.includes('my-cover.png') && myClub.includes('v2-my-club-identity'));
        assert.ok(myClub.includes('href="/v2/my-clubs/C7"') && myClub.includes('aria-pressed="true"'));
        const previousWindow = globalThis.window,
            originalRequest = clientApi.request;
        const events = [];
        globalThis.window = { dispatchEvent: (event) => events.push(event.detail), localStorage: { setItem: noop } };
        try {
            clientApi.request = async () => {
                throw new Error('Save rejected');
            };
            await assert.rejects(() => clientApi.updateClubPublicImages(7, {}));
            await assert.rejects(() => clientApi.updateActivityCoverImage(1, 'https://example.com/cover.png'));
            assert.equal(events.length, 0);
            clientApi.request = async () => ({ saved: true });
            await clientApi.updateClubPublicImages(7, {});
            await clientApi.updateActivityCoverImage(1, 'https://example.com/cover.png');
            assert.deepEqual(
                events.map(({ kind, id }) => [kind, id]),
                [
                    ['club', '7'],
                    ['activity', '1'],
                ],
            );
            await clientApi.updateClub(7, { logoUrl: 'https://example.com/latest-logo.png' });
            await clientApi.updateClubPublicImages(7, { coverImageUrl: 'https://example.com/latest-cover.png' });
            await clientApi.updateActivity(1, { coverImageUrl: 'https://example.com/latest-activity.png' });
            const staleCard = renderToStaticMarkup(React.createElement(StaticRouter, { location: '/v2' },
                React.createElement(EntityMediaProvider, { api: clientApi }, React.createElement(ClubCard, {
                    club: { id: '7', name: 'Club', tags: [], destination: '/v2/clubs/C7', logoUrl: 'old-logo', coverImageUrl: 'old-cover' },
                }))));
            assert.ok(staleCard.includes('latest-logo.png') && staleCard.includes('latest-cover.png'));
            assert.equal(staleCard.includes('src="old-'), false);
            clientApi.request = async () => [{ id: 7, name: 'Club' }];
            assert.equal((await clientApi.getClubs())[0].coverImageUrl, 'https://example.com/latest-cover.png');
            clientApi.request = async () => { throw new Error('Save rejected'); };
            await assert.rejects(() => clientApi.updateClub(7, { logoUrl: 'rejected-logo' }));
            await assert.rejects(() => clientApi.updateActivity(1, { coverImageUrl: 'rejected-cover' }));
            assert.equal(clientApi.media.select('club', { id: 7 }).logoUrl, 'https://example.com/latest-logo.png');
            assert.equal(clientApi.media.select('activity', { id: 1 }).coverImageUrl, 'https://example.com/latest-activity.png');
            let finish;
            clientApi.request = () => new Promise((resolve) => { finish = resolve; });
            const eventCount = events.length;
            const oldAccountSave = clientApi.updateClubPublicImages(7, { logoUrl: 'old-account' });
            clientApi.media.reset();
            finish({ saved: true });
            await oldAccountSave;
            assert.equal(events.length, eventCount);
            assert.equal(clientApi.media.select('club', { id: 7 }).logoUrl, undefined);
        } finally {
            globalThis.window = previousWindow;
            clientApi.request = originalRequest;
        }
        const activityGraphic = render(GraphicBanner, { design: defaultGraphicBanner('activity'), size: ACTIVITY_BANNER_SIZE });
        assert.ok(activityGraphic.includes('viewBox="0 0 1200 500"'));
        const activityModal = render(CoverImageModal, { kind: 'activity', title: 'Ảnh bìa hoạt động', onChange: noop, onClose: noop, onSave: noop });
        assert.ok(activityModal.includes('1200 × 500px (12:5)') && activityModal.includes('aspect-ratio:1200 / 500'));
    }
    const profileEditor = render(EditProfile, {
        snapshot: createMockProfile({ id: 1, name: 'Student' }),
        onClose: noop,
        onPreview: noop,
    });
    assert.equal((profileEditor.match(/role="tab"/g) || []).length, 3);
    assert.equal((profileEditor.match(/role="tabpanel"/g) || []).length, 3);
    assert.ok(profileEditor.includes('Xem trước') && !profileEditor.includes('Lưu thay đổi'));
    assert.ok(!profileEditor.includes('type="file"'));
    const cover = render(CoverArt, { color: 'horizon', shape: 'ribbons' });
    assert.ok(cover.includes('viewBox="0 0 1200 300"') && cover.includes('data-shape="ribbons"'));
    const coverModal = renderToStaticMarkup(
        React.createElement(
            StaticRouter,
            { location: '/v2/profile' },
            React.createElement(CoverModal, {
                user: { id: 1 },
                profile: createMockProfile({ id: 1, name: 'Student' }).profile,
                savedImage: '',
                onClose: noop,
                onSave: noop,
            }),
        ),
    );
    assert.ok(coverModal.includes('Màu nền') && coverModal.includes('Ảnh nền'));
    assert.equal((coverModal.match(/role="tab"/g) || []).length, 3);
    const layeredCover = render(CoverArt, {
        imageUrl: 'https://example.com/background.png',
        shape: 'ribbons',
        shapeTransform: { x: 10, y: 20, scale: 75 },
        coverText: { title: '<My cover>', subtitle: 'Hello' },
    });
    assert.ok(layeredCover.indexOf('background.png') < layeredCover.indexOf('data-layer="shape"'));
    assert.ok(layeredCover.indexOf('data-layer="shape"') < layeredCover.indexOf('data-layer="text"'));
    assert.ok(layeredCover.includes('scale(0.75)') && layeredCover.includes('&lt;My cover&gt;'));
    const movedText = render(CoverArt, { coverText: { title: 'Large heading', size: 240, x: 10, y: 20 } });
    const movedHeading = [...movedText.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].find((match) => match[2].includes('Large heading'));
    assert.ok(movedHeading && movedHeading[1].includes('font-size="240"'));
    assert.ok(Math.abs(Number(movedHeading[1].match(/\bx="([^"]+)"/)[1]) - 160) < 0.001);
    assert.ok(Math.abs(Number(movedHeading[1].match(/\by="([^"]+)"/)[1]) - 196) < 0.001);
    const noText = render(CoverArt, { coverText: { visible: false } });
    assert.ok(!noText.includes('data-layer="text"'));
    const gradientProfileCover = render(CoverArt, {
        backgroundPaint: 'gradient:ocean',
        coverText: { color: 'gradient:sunset' },
    });
    assert.ok((gradientProfileCover.match(/<linearGradient/g) || []).length >= 2);
    assert.ok(
        gradientProfileCover.includes('stop-color="#06b6d4"') && gradientProfileCover.includes('stop-color="#ec4899"'),
    );
    assert.ok(coverModal.includes('Màu nền tùy chọn'));
    assert.ok(coverModal.includes('Kho quà') && coverModal.includes('Lưu ảnh bìa'));
    const dashboard = {
        status: 'ready',
        data: { memberCount: 1, publicLeaders: [{ name: 'Chủ nhiệm công khai', role: 'Chủ nhiệm' }] },
        retry: noop,
    };
    const publicMembers = render(Members, { manager: false, dashboard, workspace: { clubId: 7 } });
    assert.ok(publicMembers.includes('Chủ nhiệm công khai'));
    assert.ok(!publicMembers.includes('Quản lý thành viên') && !publicMembers.includes('Quản lý đơn'));
    const managedMembers = renderToStaticMarkup(
        React.createElement(
            AuthProvider,
            null,
            React.createElement(Members, { manager: true, dashboard, workspace: { clubId: 7 } }),
        ),
    );
    assert.ok(managedMembers.includes('Quản lý thành viên') && managedMembers.includes('Quản lý đơn'));
    assert.ok(managedMembers.includes('Thêm thành viên'));
    assert.ok(managedMembers.includes('Xem trách nhiệm và quyền hạn của các vai trò'));
    assert.ok(publicMembers.includes('Xem trách nhiệm và quyền hạn của các vai trò'));
    const roleInfo = render(ClubRolesInfoModal, { onClose: noop });
    assert.equal((roleInfo.match(/scope="row"/g) || []).length, 8);
    assert.ok(
        roleInfo.includes('Phó chủ nhiệm') &&
            roleInfo.includes('Nội dung (Content)') &&
            roleInfo.includes('Sự kiện (Event)'),
    );
    assert.ok(!roleInfo.includes('Đề xuất') && !roleInfo.includes('đề xuất'));
    assert.ok(roleInfo.includes('v2-club-role-check'));
    assert.ok(!managedMembers.includes('href='), 'member management stays inside the V2 tab');
    const invitationForm = render(Invite, { api: {}, clubId: 7, onClose: noop, onInvited: noop });
    assert.ok(invitationForm.includes('Học kỳ tra cứu') && invitationForm.includes('Tìm sinh viên để mời'));
    assert.ok(
        invitationForm.match(/type="submit"[^>]*disabled=""/),
        'cannot send before selecting an eligible student',
    );
    const inbox = render(MyApplications, {
        applications: [
            { applicationId: 1, club: { name: 'Club', clubId: 7 }, status: 'PENDING', canAcceptInvitation: true },
        ],
        onAcceptInvitation: noop,
    });
    assert.ok(inbox.includes('Xem lời mời') && inbox.includes('Lời mời tham gia'));
    const readOnly = render(Preview, { club, manager: false, onEdit: noop });
    assert.ok(readOnly.includes(club.name));
    assert.ok(!readOnly.includes('<button'), 'read-only preview must not expose editing controls');
    const manager = render(Preview, { club, manager: true, onEdit: noop });
    assert.equal((manager.match(/<button/g) || []).length, 3, 'one information edit and two image edits');
    assert.ok(!manager.includes('<input'), 'preview must not expose the full form');
    assert.ok(
        manager.match(/class="club-page-name-row"[\s\S]*?<h2>[\s\S]*?club-page-edit-button/),
        'edit button belongs beside the club name',
    );
    const previewHeading = manager.match(/class="club-page-preview-heading"[^>]*>(.*?)<\/div>/s)?.[1] || '';
    assert.ok(!previewHeading.includes('<button'), 'preview heading must not contain the edit button');
    {
        const html = render(Info, { club, saving: false, error: 'Lỗi lưu mẫu', onClose: noop, onPreview: noop });
        assert.ok(!html.includes('type="file"'), 'information dialog must not include image uploads');
        for (const field of CLUB_PAGE_FIELDS) assert.ok(html.includes(`name="${field.name}"`));
        assert.equal((html.match(/role="tab"/g) || []).length, 4);
        assert.equal((html.match(/role="tabpanel"/g) || []).length, 4);
        assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
        for (const tab of CLUB_PAGE_TABS) {
            assert.ok(html.includes(`aria-controls="club-page-panel-${tab.id}"`));
            assert.ok(html.includes(`aria-labelledby="club-page-tab-${tab.id}"`));
        }
        assert.equal((html.match(/<form/g) || []).length, 1);
        const footer = html.match(/<footer>(.*?)<\/footer>/s)?.[1] || '';
        assert.equal((footer.match(/<button/g) || []).length, 2, 'one shared preview/cancel pair');
        assert.ok(footer.includes('Xem trước'));
        assert.ok(!footer.includes('Lưu thông tin'));
        assert.ok(html.includes('role="alert"'));
        assert.ok(html.includes('disabled=""'), 'unchanged draft cannot be saved');
    }
    for (const kind of ['logo', 'cover']) {
        const html = render(Images, {
            kind,
            file: null,
            saving: false,
            error: '',
            onChange: noop,
            onClose: noop,
            onSave: noop,
        });
        assert.equal((html.match(/type="file"/g) || []).length, 1, 'one upload per image dialog');
        assert.ok(!html.includes('name="description"'));
        assert.ok(html.includes(kind === 'logo' ? 'Lưu logo' : 'Lưu ảnh bìa'));
    }
    {
        const design = {
            ...defaultGraphicBanner('activity'),
            title: '<Graphic & title>',
            decoration: 'waves',
            color: 'gradient:gold',
        };
        const html = render(GraphicBanner, { design });
        assert.ok(html.includes('&lt;Graphic &amp; title&gt;'));
        assert.ok(
            html.includes('viewBox="0 0 1200 300"') && html.includes('<linearGradient') && html.includes('<path'),
        );
        const values = new Map();
        const previousStorage = globalThis.localStorage;
        globalThis.localStorage = {
            getItem: (key) => values.get(key) || null,
            setItem: (key, value) => values.set(key, value),
        };
        try {
            saveGraphicBanner('test-graphic', 'https://example.com/banner.png', design);
            const editor = render(CoverImageModal, {
                kind: 'activity',
                storageKey: 'test-graphic',
                value: 'https://example.com/banner.png',
                onClose: noop,
                onSave: noop,
            });
            assert.equal((editor.match(/role="tab"/g) || []).length, 3);
            assert.ok(
                editor.includes('Nền') &&
                    editor.includes('Shape') &&
                    editor.includes('Chữ') &&
                    editor.includes('Lưu ảnh bìa'),
            );
            assert.ok(editor.includes('&lt;Graphic &amp; title&gt;'));
            assert.ok(editor.includes('preserveAspectRatio="xMinYMid meet"'));
            assert.ok(
                editor.match(/<\/form><\/div><footer class="v2-modal-footer">/),
                'footer must sit outside the scrollable form',
            );
            const formId = editor.match(/<form id="([^"]+)"/)?.[1];
            assert.ok(
                formId && editor.includes(`type="submit" form="${formId}"`),
                'external save button must submit the editor form',
            );
            const textPanel = render(GraphicBannerEditor, {
                value: design,
                tab: 'text',
                kind: 'activity',
                onChange: noop,
                selectedParagraphId: 'title',
                onSelectParagraph: noop,
            });
            assert.ok(/<textarea[^>]*>&lt;Graphic &amp; title&gt;<\/textarea>/.test(textPanel));
            assert.ok(textPanel.includes('+ Thêm đoạn chữ'));
            assert.equal((textPanel.match(/<select/g) || []).length, 1);
            assert.equal((textPanel.match(/type="range"/g) || []).length, 2);
            assert.ok(textPanel.includes('type="checkbox"'));
            const shapePanel = render(GraphicBannerEditor, { value: design, tab: 'shape', onChange: noop });
            assert.equal((shapePanel.match(/type="range"/g) || []).length, 3);
            assert.ok(shapePanel.includes('Shape trang trí') && shapePanel.includes('Không dùng shape'));
        } finally {
            globalThis.localStorage = previousStorage;
        }
    }
    const schedule = render(Schedule, { value: 'FA2026 · T2, T7 · 18:00–20:00 · Lặp lại hàng tuần', onChange: noop });
    assert.equal((schedule.match(/type="range"/g) || []).length, 2);
    assert.equal((schedule.match(/step="30"/g) || []).length, 2);
    assert.equal((schedule.match(/aria-pressed="true"/g) || []).length, 2);
    assert.ok(schedule.includes('type="checkbox"'));
    assert.ok(!schedule.includes('<table'));
    assert.ok(!schedule.includes('10W') && !schedule.includes('3W'));
    assert.ok(schedule.includes('<p>FA2026 · T2, T7 · 18:00–20:00 · Hằng tuần</p>'));
    const weeklyPreview = render(Preview, {
        club: { ...club, scheduleLabel: 'FA2026 · T2 · 18:00–20:00 · Lặp lại hàng tuần' },
        manager: false,
    });
    assert.ok(weeklyPreview.includes('Hằng tuần'));
    assert.ok(!weeklyPreview.includes('Lặp lại hàng tuần'));
    console.log(
        'PASS: V2-local member management, role-gated public leaders, preview/cancel dialog, weekly labels, and isolated image dialogs.',
    );
} finally {
    await vite.close();
}
