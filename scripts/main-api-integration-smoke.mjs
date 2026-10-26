import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
    const { default: api } = await vite.ssrLoadModule('/src/services/api.js');
    const { default: ResourceEditor } = await vite.ssrLoadModule(
        '/src/pages/v2/club-workspace-page/tabs/activities/ActivityResourceEditor.jsx',
    );
    const { default: ProfileEditor } = await vite.ssrLoadModule('/src/pages/v2/profile-page/EditProfileModal.jsx');
    const { createMockProfile } = await vite.ssrLoadModule('/src/pages/v2/profile-data.js');
    const { clubSchedulePayload, persistedClubScheduleLabel } = await vite.ssrLoadModule(
        '/src/pages/v2/club-workspace-page/tabs/club-page/club-schedule-data.js',
    );
    const noop = () => {};
    const html = renderToStaticMarkup(
        React.createElement(ResourceEditor, {
            kind: 'MEDIA',
            resources: [],
            drafts: [],
            onAdd: noop,
            onRemove: noop,
            onSave: noop,
            capabilities: { canManage: true, canUpload: false, supportedKinds: ['EMBED'] },
            canSave: true,
            busy: false,
        }),
    );
    assert.match(html, /type="file"[^>]*disabled/);
    assert.match(html, /<button[^>]*(?<!disabled)>[\s\S]*?Thêm liên kết/);
    const profile = renderToStaticMarkup(
        React.createElement(ProfileEditor, {
            snapshot: createMockProfile({ id: 4, fullName: 'Student' }),
            onClose: noop,
            onPreview: noop,
        }),
    );
    for (const field of ['campus', 'major', 'year', 'studentCode'])
        assert.match(profile.match(new RegExp(`<(?:input|select)[^>]*name="${field}"[^>]*>`))?.[0] || '', /disabled/);
    const semester = { invitationCode: 'FALL2026', year: 2026, term: 'FA' };
    const schedule = clubSchedulePayload('FA2026 · T2, T7 · 18:00–20:30 · Hằng tuần', semester);
    assert.deepEqual(schedule, {
        semesterId: 'FALL2026',
        weekdays: [1, 6],
        startTime: '18:00',
        endTime: '20:30',
        repeatWeekly: true,
        timezone: 'Asia/Ho_Chi_Minh',
    });
    assert.equal(persistedClubScheduleLabel(schedule, semester), 'FA2026 · T2, T7 · 18:00–20:30 · Hằng tuần');
    assert.throws(() => clubSchedulePayload('FA2026 · T2 · 18:00–20:00 · Hằng tuần', { ...semester, term: 'SU' }));
    const originalRequest = api.request;
    const captured = [];
    api.request = async (path, options) => {
        captured.push([path, options]);
        return { id: 4, version: 'server-version' };
    };
    const previousWindow = globalThis.window;
    globalThis.window = { dispatchEvent: noop, localStorage: { setItem: noop } };
    try {
        await api.updateActivityCoverImage(4, 'https://fixture.test/cover.png', 'read-version');
        assert.deepEqual(JSON.parse(captured[0][1].body), {
            coverImageUrl: 'https://fixture.test/cover.png',
            expectedVersion: 'read-version',
        });
        await api.updateClubPublicImages(4, {
            logoUrl: 'https://fixture.test/logo.png',
            expectedVersion: 'club-version',
        });
        assert.deepEqual(JSON.parse(captured[1][1].body), {
            logoUrl: 'https://fixture.test/logo.png',
            expectedVersion: 'club-version',
        });
        await api.getMyMembershipApplications();
        assert.equal(captured[2][0], '/api/clubs/me/membership-applications');
    } finally {
        api.request = originalRequest;
        globalThis.window = previousWindow;
    }
    console.log(
        'PASS: API versions, canonical self inbox, read-only academic fields, EMBED-only controls, structured semester schedule.',
    );
} finally {
    await vite.close();
}
