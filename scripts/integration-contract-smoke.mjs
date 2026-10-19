import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const requests = [];
const oldFetch = globalThis.fetch,
    oldStorage = globalThis.localStorage;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.fetch = async (url, options = {}) => {
    requests.push({
        url: String(url),
        ...options,
        payload: options.body instanceof FormData ? options.body : options.body ? JSON.parse(options.body) : undefined,
    });
    if (String(url).includes('/missing'))
        return new Response(
            JSON.stringify({ code: 'STALE_VERSION', message: 'Reload', errors: { expectedVersion: ['stale'] } }),
            { status: 409, headers: { 'Content-Type': 'application/json' } },
        );
    return new Response(JSON.stringify({ id: 7, evidenceId: 'e1', version: 'new-version', items: [], totalPages: 1 }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
try {
    const { api } = await server.ssrLoadModule('/src/services/api.js');
    await api.getStudentActivities({ clubId: 7, page: 2, pageSize: 100 });
    assert.equal(new URL(requests.at(-1).url).pathname, '/api/v2/activities/feed');
    assert.equal(new URL(requests.at(-1).url).searchParams.get('page'), '2');
    await api.getStudentActivity(7);
    assert.equal(new URL(requests.at(-1).url).pathname, '/api/v2/activities/7');
    await api.getActivity(7);
    assert.equal(new URL(requests.at(-1).url).pathname, '/api/activities/7');
    await api.getRecommendedActivities();
    assert.equal(new URL(requests.at(-1).url).pathname, '/api/v2/recommendations/activities');
    await api.getMyRadar({ semesterId: 'FALL2026', scope: 'PERIOD' });
    assert.equal(new URL(requests.at(-1).url).searchParams.get('semester'), 'FALL2026');
    assert.equal(new URL(requests.at(-1).url).searchParams.has('semesterId'), false);
    await api.updateMyProfile({ expectedVersion: 'v1', profile: { about: 'Edited' } });
    assert.equal(requests.at(-1).method, 'PATCH');
    assert.equal(requests.at(-1).payload.expectedVersion, 'v1');
    await api.updateClubPublicProfile(7, { description: 'Edited', expectedVersion: 'v2' });
    assert.equal(requests.at(-1).payload.expectedVersion, 'v2');
    await api.updateClubPublicImages(7, { logoUrl: 'https://cdn.example/logo.png', expectedVersion: 'v3' });
    assert.equal(requests.at(-1).payload.expectedVersion, 'v3');
    await api.updateActivityCoverImage(7, 'https://cdn.example/cover.png', 'v4');
    assert.equal(requests.at(-1).payload.expectedVersion, 'v4');
    await api.uploadPrivateEvidence(
        new File(['%PDF-test'], 'test.pdf', { type: 'application/pdf' }),
        'stable-evidence-key',
    );
    assert.equal(requests.at(-1).payload instanceof FormData, true);
    assert.equal(requests.at(-1).headers['Content-Type'], undefined);
    assert.equal(requests.at(-1).headers['Idempotency-Key'], 'stable-evidence-key');
    await assert.rejects(api.uploadPrivateEvidence(new File(['x'], 'test.txt', { type: 'text/plain' }), 'key'));
    await assert.rejects(
        api.request('/api/missing'),
        (issue) =>
            issue.status === 409 && issue.code === 'STALE_VERSION' && issue.errors.expectedVersion[0] === 'stale',
    );
    console.log('Contract transport smoke: 12 scenarios passed (mock fetch; no live backend claim).');
    const { AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.jsx');
    const components = [
        ['/src/components/v2/experience/ExternalDeclarationForm.jsx', { api }, 'Tự khai trải nghiệm ngoài CLB'],
        ['/src/components/v2/experience/ContributionDetails.jsx', { api, id: 'c1', onClose() {} }, 'Chi tiết đóng góp'],
        ['/src/components/v2/experience/VerificationQueue.jsx', { api }, 'Hàng chờ xác minh'],
        ['/src/components/v2/activity-detail/ActivitySessionsPanel.jsx', { api, activity: { id: 7, version: 'v1' }, onChanged() {} }, 'Buổi hoạt động'],
        ['/src/components/v2/activity-detail/StudentActivityActions.jsx', { api, activity: { id: 7, canRegister: true }, onChanged() {} }, 'Đăng ký tham gia'],
        ['/src/pages/v2/club-workspace-page/tabs/ClubExperiencePanel.jsx', { clubId: 7 }, 'Kế hoạch'],
    ];
    const beforeRender = requests.length;
    for (const [file, props, expected] of components) {
        const { default: Component } = await server.ssrLoadModule(file);
        const html = renderToStaticMarkup(React.createElement(AuthProvider, null, React.createElement(Component, props)));
        assert.ok(html.includes(expected), `${file}: expected rendered shell`);
    }
    assert.equal(requests.length, beforeRender, 'Rendering does not submit API writes');
    console.log('Component SSR smoke: 6 integration surfaces rendered; no live/browser interaction claim.');
} finally {
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
    await server.close();
}
