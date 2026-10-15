import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { Route, Routes } from 'react-router-dom';
import { createServer } from 'vite';

// Isolate authenticated actor input; render the real gate, rail and route guard.
const vite = await createServer({
    server: { middlewareMode: true, open: false },
    appType: 'custom',
    plugins: [
        {
            name: 'affairs-auth-input',
            enforce: 'pre',
            load(id) {
                if (id.replaceAll('\\', '/').endsWith('/src/context/AuthContext.jsx')) {
                    return 'export const useAuth = () => globalThis.__affairsAuth;';
                }
            },
        },
    ],
});

try {
    const { default: LeftRail } = await vite.ssrLoadModule('/src/components/v2/common/leftrail/LeftRail.jsx');
    const { default: Gate } = await vite.ssrLoadModule('/src/pages/v2/V2Access.jsx');
    const { default: HeaderActions } = await vite.ssrLoadModule('/src/components/v2/club-detail/ClubHeaderActions.jsx');
    const { ClubWorkspaceView } = await vite.ssrLoadModule('/src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx');
    const { getWorkspaceSections } = await vite.ssrLoadModule(
        '/src/pages/v2/club-workspace-page/WorkspaceLeftRail.jsx',
    );
    const { ThemeProvider } = await vite.ssrLoadModule('/src/context/ThemeContext.jsx');
    const { default: AffairsPage, AffairsAccess } = await vite.ssrLoadModule(
        '/src/pages/v2/affairs-page/AffairsPage.jsx',
    );
    const render = (element, location = '/v2/ctsv/clubs') =>
        renderToStaticMarkup(
            React.createElement(StaticRouter, { location }, React.createElement(ThemeProvider, null, element)),
        );

    for (const role of ['ADMIN', 'SYSTEM_ADMIN', 'STUDENT_AFFAIRS_ADMIN', 'CLUB_MEMBER', 'CLUB_MANAGER']) {
        const user = { id: role, name: role, roles: [role] };
        const staff = ['ADMIN', 'SYSTEM_ADMIN', 'STUDENT_AFFAIRS_ADMIN'].includes(role);
        const rail = render(React.createElement(LeftRail, { user }), '/v2/my-clubs');
        for (const label of ['Khám phá', 'Câu lạc bộ', 'Hoạt động']) assert.ok(rail.includes(label));
        assert.equal(rail.includes('Công tác sinh viên'), staff);
        assert.equal(rail.includes('Của tôi'), !staff);
        assert.ok(!rail.includes('Quan sát CLB'));
        for (const label of ['Hoạt động cấp trường', 'Phần thưởng cấp trường', 'Trang quản trị']) {
            assert.equal(rail.includes(label), staff);
        }
        globalThis.__affairsAuth = { user, isAuthenticated: true, loading: false };
        const gate = render(React.createElement(Gate, null, React.createElement('p', null, 'AUTHENTICATED_CONTENT')));
        assert.equal(
            gate.includes('AUTHENTICATED_CONTENT'),
            staff,
            'Staff pass first render without onboarding preferences',
        );
        const guarded = render(
            React.createElement(
                Routes,
                null,
                React.createElement(
                    Route,
                    { path: '/v2/ctsv', element: React.createElement(AffairsAccess, { user }) },
                    React.createElement(Route, {
                        path: 'clubs',
                        element: React.createElement('p', null, 'OBSERVATION_CONTENT'),
                    }),
                ),
            ),
        );
        assert.equal(guarded.includes('OBSERVATION_CONTENT'), staff);
        assert.equal(guarded.includes('Bạn không có quyền'), !staff);
        const actions = render(
            React.createElement(HeaderActions, {
                club: { id: 12, code: 'FPT-TECH', isRecruiting: true, viewerRelationship: 'NONE' },
                viewer: user,
            }),
        );
        assert.equal(actions.includes('Xem ở Admin'), staff);
        assert.equal(actions.includes('Ghé thăm CLB'), staff);
        assert.equal(actions.includes('Nộp hồ sơ gia nhập'), !staff);
        if (staff) {
            assert.ok(actions.includes('/#/ctsv/clubs?club=12'));
            assert.ok(actions.includes('/v2/ctsv/clubs/FPT-TECH/workspace'));
            assert.ok(!actions.includes('v2-button--primary'));
        }
    }
    const observer = { id: 'staff', name: 'Staff', roles: ['STUDENT_AFFAIRS_ADMIN'] };
    globalThis.__affairsAuth = { user: observer, isAuthenticated: true, loading: false };
    assert.deepEqual(
        getWorkspaceSections(true, true).map(([path]) => path),
        ['', 'activities', 'quests', 'members', 'points', 'gifts', 'reports', 'finance'],
    );
    const workspace = render(
        React.createElement(ClubWorkspaceView, {
            api: {},
            viewer: observer,
            sessionKey: 'staff',
            observation: true,
            result: {
                status: 'populated',
                clubId: '12',
                data: [],
                workspace: {
                    clubId: '12',
                    clubCode: 'FPT-TECH',
                    name: 'CLB Công nghệ',
                    role: 'MANAGER',
                    semesters: [],
                },
            },
        }),
        '/v2/ctsv/clubs/FPT-TECH/workspace',
    );
    assert.ok(workspace.includes('CTSV · Chỉ xem'));
    for (const forbidden of ['Tạo hoạt động', 'Quản lý trang CLB', 'CẦN XỬ LÝ', 'Chuyển câu lạc bộ']) {
        assert.ok(!workspace.includes(forbidden), `Observer must not expose ${forbidden}`);
    }
    for (const [path] of getWorkspaceSections(false, true)) {
        const html = render(
            React.createElement(ClubWorkspaceView, {
                api: {},
                viewer: observer,
                sessionKey: 'staff',
                observation: true,
                result: {
                    status: 'populated',
                    clubId: '12',
                    data: [],
                    workspace: {
                        clubId: '12',
                        clubCode: 'FPT-TECH',
                        name: 'CLB Công nghệ',
                        role: 'OBSERVER',
                        semesters: [],
                    },
                },
            }),
            `/v2/ctsv/clubs/FPT-TECH/workspace${path ? '/' + path : ''}`,
        );
        for (const action of [
            'Tạo hoạt động',
            'Tạo báo cáo',
            'Tạo quà',
            '+ Thêm thành viên',
            'v2-gift-manager-actions',
            '/reports/create',
            'ĐIỂM MẪU CỦA BẠN',
            'Tùy chỉnh cá nhân',
        ]) {
            assert.ok(!html.includes(action), `Read-only ${path} exposes ${action}`);
        }
        assert.ok(!html.includes('/workspace/club-page'));
    }
    const { default: GiftClaim } = await vite.ssrLoadModule(
        '/src/pages/v2/club-workspace-page/tabs/GiftClaimButton.jsx',
    );
    assert.equal(render(React.createElement(GiftClaim, { readOnly: true })), '');
    const memberActions = render(
        React.createElement(HeaderActions, {
            club: { id: 12, code: 'FPT-TECH', viewerRelationship: 'MEMBER' },
            viewer: { roles: ['CLUB_MEMBER'] },
        }),
    );
    assert.ok(memberActions.includes('/v2/my-clubs/FPT-TECH'));
    assert.ok(!memberActions.includes('Xem ở Admin'));
    for (const section of ['activities', 'rewards']) {
        const html = render(React.createElement(AffairsPage, { section }));
        assert.ok(html.includes('chưa khả dụng'));
        assert.ok(!html.includes('v2-event-card') && !html.includes('sample'));
    }
    console.log(
        'PASS: staff/student rails, first-login onboarding bypass, guarded observation routes, honest unavailable states.',
    );
} finally {
    delete globalThis.__affairsAuth;
    await vite.close();
}
