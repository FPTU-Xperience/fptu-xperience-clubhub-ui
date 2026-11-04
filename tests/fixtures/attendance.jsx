import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import ActivitySessionManagement from '../../src/components/v2/activity-detail/ActivitySessionManagement';
import StudentSessionSources from '../../src/components/v2/activity-detail/StudentSessionSources';
import '../../src/styles/index.scss';
import '../../src/pages/v2/V2App.scss';
const api = {
    async request(path, options) {
        const response = await fetch('/__attendance_api' + path, {
            ...options,
            headers: { ...options?.headers, 'X-Test-Actor': window.__TAB_TEST_AUTH__.user.id },
        });
        const value = await response.json();
        if (!response.ok)
            throw Object.assign(new Error(value.message || 'Fixture request failed'), { status: response.status });
        return value;
    },
};
const activity = {
    id: 1,
    clubId: 1,
    startTime: '2026-11-01T00:00:00Z',
    endTime: '2026-12-01T00:00:00Z',
    location: 'Hall',
};
window.__ATTENDANCE_CHANGES__ = 0;
function Fixture() {
    const [actor, setActor] = useState(100);
    window.__TAB_TEST_AUTH__ = { api, user: { id: actor } };
    const changed = () => {
        window.__ATTENDANCE_CHANGES__++;
    };
    return (
        <MemoryRouter>
            <main className="v2-app">
                <div className="v2-session-actions">
                    <button onClick={() => setActor(100)}>Vai quản lý</button>
                    <button onClick={() => setActor(104)}>Vai sinh viên A</button>
                    <button onClick={() => setActor(105)}>Vai sinh viên B</button>
                </div>
                {actor === 100 ? (
                    <ActivitySessionManagement key={actor} activity={activity} onChanged={changed} />
                ) : (
                    <StudentSessionSources key={actor} api={api} activityId={1} onChanged={changed} />
                )}
            </main>
        </MemoryRouter>
    );
}
createRoot(document.getElementById('root')).render(<Fixture />);
