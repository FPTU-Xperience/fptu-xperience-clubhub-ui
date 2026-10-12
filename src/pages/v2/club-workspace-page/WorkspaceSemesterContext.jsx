import { createContext, useContext, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { DEVELOPMENT_WORKSPACE_SEMESTERS } from './workspace-semester-data';

const WorkspaceSemesterContext = createContext({ semester: null, semesters: [], selectSemester: () => {} });
export const useWorkspaceSemester = () => useContext(WorkspaceSemesterContext);
export function useWorkspaceSemesterSelection(actorId, clubId, serverCatalog) {
    const semesters = Array.isArray(serverCatalog)
        ? serverCatalog
        : import.meta.env.DEV
          ? DEVELOPMENT_WORKSPACE_SEMESTERS
          : [];
    const scope = `${actorId}:${clubId}`;
    const [choice, setChoice] = useState(null);
    const semester =
        semesters.find((item) => choice?.scope === scope && item.id === choice.id) ||
        semesters.find((item) => item.isCurrent) ||
        semesters[0] ||
        null;
    return {
        semester,
        semesters,
        selectSemester: (id) => {
            if (semesters.some((item) => item.id === id)) setChoice({ scope, id });
        },
    };
}
export function WorkspaceSemesterProvider({ value, children }) {
    return <WorkspaceSemesterContext.Provider value={value}>{children}</WorkspaceSemesterContext.Provider>;
}
export function WorkspaceSemesterSelect() {
    const { semester, semesters, selectSemester } = useWorkspaceSemester();
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
                {!semesters.length && <option value="">Học kỳ hiện tại</option>}
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
