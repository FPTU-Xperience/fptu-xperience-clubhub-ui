import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ActivityStaffingPanel from '../../src/components/v2/activity-detail/ActivityStaffingPanel';
import '../../src/styles/index.scss';
import '../../src/pages/v2/V2App.scss';
const api = { async request(path, options) {
    const response = await fetch('/__staffing_api' + path, options);
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message), { status: response.status });
    return data;
} };
function Fixture() {
    const [actor, setActor] = useState('student');
    const [mode, setMode] = useState('recruitment');
    window.__TAB_TEST_AUTH__ = { api, user: { id: actor === 'student' ? 100 : 200 } };
    return <main className="v2-app"><button onClick={() => setActor(actor === 'student' ? 'manager' : 'student')}>Đổi vai kiểm thử</button>
        <button onClick={() => setMode(mode === 'recruitment' ? 'assignments' : 'recruitment')}>Đổi nội dung kiểm thử</button>
        <ActivityStaffingPanel key={actor + mode} activityId={1} manager={actor === 'manager'} mode={mode} /></main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
