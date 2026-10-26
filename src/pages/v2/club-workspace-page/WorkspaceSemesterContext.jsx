import { createContext, useContext, useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

const WorkspaceSemesterContext = createContext({ semester: null, semesters: [], selectSemester: () => {} });
export const useWorkspaceSemester = () => useContext(WorkspaceSemesterContext);
export function useWorkspaceSemesterSelection(actorId, clubId, serverCatalog, api) {
    const [catalog, setCatalog] = useState(null);
    const scope = `${actorId}:${clubId}`;
    useEffect(() => {
        let active = true;
        setCatalog(null);
        if (api && clubId)
            api.request(`/api/clubs/${encodeURIComponent(clubId)}/workspace-semesters`)
                .then((value) => {
                    if (!Array.isArray(value?.items)) throw new Error('Danh sách học kỳ không hợp lệ.');
                    if (active) setCatalog({ scope, items: value.items, error: '' });
                })
                .catch((error) => {
                    if (active) setCatalog({ scope, items: [], error: error.message });
                });
        return () => {
            active = false;
        };
    }, [api, clubId, actorId]);
    const semesters = api
        ? catalog?.scope === scope
            ? catalog.items
            : []
        : Array.isArray(serverCatalog)
          ? serverCatalog
          : [];
    const [choice, setChoice] = useState(null);
    const semester =
        semesters.find((item) => choice?.scope === scope && item.id === choice.id) ||
        semesters.find((item) => item.isCurrent) ||
        semesters[0] ||
        null;
    return {
        semester,
        semesters,
        error: catalog?.scope === scope ? catalog.error : '',
        selectSemester: (id) => {
            if (semesters.some((item) => item.id === id)) setChoice({ scope, id });
        },
    };
}
export function WorkspaceSemesterProvider({ value, children }) {
    return <WorkspaceSemesterContext.Provider value={value}>{children}</WorkspaceSemesterContext.Provider>;
}
export function WorkspaceSemesterSelect() {
    const { semester, semesters, selectSemester, error } = useWorkspaceSemester();
    return (
        <label className="v2-workspace-term">
            <CalendarDays size={16} />
            <span className="governance-sr-only">Học kỳ của workspace</span>
            <select
                aria-label="Học kỳ của workspace"
                value={semester?.id || ''}
                disabled={!semesters.length}
                onChange={(event) => selectSemester(event.target.value)}
            >
                {!semesters.length && <option value="">{error || 'Chưa có học kỳ từ máy chủ'}</option>}
                {semesters.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.label}
                        {item.editable === false ? ' · Lưu trữ' : ''}
                    </option>
                ))}
            </select>
        </label>
    );
}
