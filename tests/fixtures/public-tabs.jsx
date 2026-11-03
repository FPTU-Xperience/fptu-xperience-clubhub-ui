import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ActivityDetailPage from '../../src/pages/v2/activities-page/ActivityDetailPage';
import '../../src/styles/index.scss';
import '../../src/pages/v2/V2App.scss';
window.__TAB_TEST_ACCOUNT__ = 'student-a';
const api = {
    async request(path, options) {
        const response = await fetch('/__tabs_api' + path, { ...options, headers: { ...options?.headers, 'X-Test-Account': window.__TAB_TEST_ACCOUNT__ } });
        const value = await response.json();
        if (!response.ok) throw Object.assign(new Error(value.message || 'Test API failed'), { status: response.status });
        return value;
    },
    getMyClubSelection: async () => [],
    getMyMemberships: async () => [],
    getClubs: async () => [{ id: 1, code: 'TEST', name: 'Test Club' }],
    getMyActivityAttendance: (id) => api.request('/api/activities/' + id + '/my-attendance'),
};
function Fixture() {
    const [sessionKey, setSessionKey] = useState('student-a');
    window.__TAB_TEST_AUTH__ = { api, user: { id: sessionKey === 'student-a' ? 104 : 205 }, clubAccess: [] };
    return <MemoryRouter initialEntries={['/v2/activities/1']}>
        <button onClick={() => { window.__TAB_TEST_ACCOUNT__ = 'student-b'; setSessionKey('student-b'); }}>Đổi tài khoản kiểm thử</button>
        <Routes><Route path="/v2/activities/:activityId" element={<ActivityDetailPage api={api} sessionKey={sessionKey} />} /></Routes>
    </MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
