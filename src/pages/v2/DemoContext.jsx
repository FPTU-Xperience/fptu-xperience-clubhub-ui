import { createContext, useContext, useRef, useState } from 'react';
import { createInitialState, PEOPLE, transition } from './model';

const DemoContext = createContext(null);
export function DemoProvider({ children }) {
    const [state, setState] = useState(createInitialState);
    const current = useRef(state);
    const [actorId, setActorId] = useState('linh');
    const [toast, setToast] = useState(null);
    const [scenario, setScenario] = useState('normal');
    const actor = PEOPLE.find((p) => p.id === actorId);
    function act(type, clubId, term, payload) {
        const result = transition(current.current, { type, userId: actorId, clubId, term, payload });
        if (!result.error) {
            current.current = result.state;
            setState(result.state);
        }
        setToast({ text: result.error || result.message, error: Boolean(result.error) });
        return !result.error;
    }
    function reset() {
        const fresh = createInitialState();
        current.current = fresh;
        setState(fresh);
        setScenario('normal');
        setToast({ text: 'Đã khôi phục dữ liệu demo ban đầu.' });
    }
    return (
        <DemoContext.Provider
            value={{ state, actor, actorId, setActorId, act, reset, toast, setToast, scenario, setScenario }}
        >
            {children}
        </DemoContext.Provider>
    );
}
export const useDemo = () => useContext(DemoContext);
