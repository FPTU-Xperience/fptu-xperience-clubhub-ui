import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../../src/context/ThemeContext';
import WorkspaceLeftRail from '../../src/pages/v2/club-workspace-page/WorkspaceLeftRail';
import { WorkspaceSemesterProvider, WorkspaceSemesterSelect, useWorkspaceSemesterSelection } from '../../src/pages/v2/club-workspace-page/WorkspaceSemesterContext';
import MemberManagement from '../../src/pages/v2/club-workspace-page/tabs/members/MemberManagement';
import '../../src/styles/index.scss';
import '../../src/pages/v2/club-workspace-page/ClubWorkspacePage.scss';

const observer = new URLSearchParams(location.search).has('observer');
const semesters = [{ id: 'FALL2026', label: 'Fall 2026', isCurrent: true }, { id: 'SUMMER2026', label: 'Summer 2026', editable: false }];
const base = observer ? '/ctsv/clubs/QA/workspace' : '/my-clubs/QA';
function Fixture() {
    const [calls, setCalls] = useState(0);
    const [api] = useState(() => ({
        request: async (path) => {
            if (path.endsWith('/workspace-semesters')) return { items: semesters };
            throw new Error('Fixture only: unsupported resource');
        },
        getClubMembers: async (_id, params) => ({
            items: Array.from({ length: params.page === 2 ? 3 : 10 }, (_, i) => ({ id: (params.page - 1) * 10 + i + 1, fullName: `QA thành viên ${(params.page - 1) * 10 + i + 1}`, name: `QA thành viên ${(params.page - 1) * 10 + i + 1}`, role: 'MEMBER' })),
            totalItems: 13, totalPages: 2,
        }),
        getClubMemberships: async () => { setCalls(value => value + 1); if (observer) throw new Error('Forbidden memberships fixture'); return []; },
    }));
    window.__TAB_TEST_AUTH__ = { user: { id: 202, fullName: 'QA CTSV' }, api, clubAccess: [] };
    const selection = useWorkspaceSemesterSelection(202, 1059, null, api);
    const route = useLocation();
    const members = route.pathname.endsWith('/members');
    return <WorkspaceSemesterProvider value={selection}>
        <div className="v2-production-workspace">
            <WorkspaceLeftRail workspace={{ name: 'QA Fixture · dữ liệu giả lập', clubId: 1059, clubCode: 'QA' }} selections={[]} base={base} manager={!observer} observation={observer} />
            <main className="v2-workspace-main">
                <p role="status">LOCAL FIXTURE · Không phải production · memberships requests: {calls}</p>
                <header className="v2-workspace-bar"><strong>{route.pathname.split('/').at(-1)}</strong><WorkspaceSemesterSelect /></header>
                <p data-testid="route">{route.pathname}{route.search}</p>
                {members ? <MemberManagement clubId={1059} dashboard={{ retry() {} }} readOnly={observer} /> : <h1>Học kỳ đang xem: {selection.semester?.label}</h1>}
            </main>
        </div>
    </WorkspaceSemesterProvider>;
}
createRoot(document.getElementById('root')).render(<ThemeProvider><MemoryRouter initialEntries={[`${base}/${observer ? 'members?tab=applications' : 'activities'}`]}><Fixture /></MemoryRouter></ThemeProvider>);
