import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ServerClubRewards from '../../src/pages/v2/club-workspace-page/tabs/ServerClubRewards';
import '../../src/styles/index.scss';
import '../../src/pages/v2/V2App.scss';
const api = {
    async request(path, options) {
        const response = await fetch('/__credit_api' + path, { ...options, headers: { ...options?.headers, 'X-Test-Actor': window.__TAB_TEST_AUTH__.user.id } });
        const value = await response.json();
        if (!response.ok) throw Object.assign(new Error(value.message || 'Fixture error'), { status: response.status });
        return value;
    },
};
function Fixture() {
    const [actor, setActor] = useState(100), [readOnly, setReadOnly] = useState(false);
    window.__TAB_TEST_AUTH__ = { api, user: { id: actor } };
    return <main className="v2-app" style={{ padding: 16 }}>
        <button onClick={() => setActor(100)}>Vai quản lý</button><button onClick={() => setActor(200)}>Thành viên A</button><button onClick={() => setActor(201)}>Thành viên B</button>
        <button onClick={() => setReadOnly((value) => !value)}>Đổi chế độ quan sát</button>
        <ServerClubRewards workspace={{ clubId: 1 }} manager={actor === 100} readOnly={readOnly} />
    </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
