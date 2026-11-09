import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import PointsTab from '../../src/pages/v2/club-workspace-page/tabs/PointsTab';
import '../../src/styles/index.scss';
import '../../src/pages/v2/V2App.scss';
import '../../src/pages/v2/club-workspace-page/ClubWorkspacePage.scss';
const api = {
    async request(path) {
        const response = await fetch('/__points_api' + path, {
            headers: { 'X-Test-Actor': window.__TAB_TEST_AUTH__.user.id },
        });
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        return value;
    },
};
function Fixture() {
    const [actor, setActor] = useState(100),
        [clubId, setClub] = useState(1),
        [term, setTerm] = useState('FA2026'),
        [readOnly, setReadOnly] = useState(false);
    window.__TAB_TEST_AUTH__ = { api, user: { id: actor } };
    return (
        <main className="v2-app v2-app--workspace v2-production-workspace" style={{ padding: 16, display: 'block' }}>
            <button onClick={() => setActor(100)}>Vai quản lý</button>
            <button onClick={() => setActor(200)}>Vai thành viên</button>
            <button onClick={() => setClub(clubId === 1 ? 2 : 1)}>Đổi CLB</button>
            <button onClick={() => setTerm(term === 'FA2026' ? 'SU2026' : 'FA2026')}>Đổi học kỳ</button>
            <button onClick={() => setReadOnly((value) => !value)}>Đổi chế độ quan sát</button>
            <PointsTab
                manager={actor === 100}
                readOnly={readOnly}
                workspace={{ clubId, name: `CLB ${clubId}`, semester: { code: term, label: term } }}
            />
        </main>
    );
}
createRoot(document.getElementById('root')).render(<Fixture />);
