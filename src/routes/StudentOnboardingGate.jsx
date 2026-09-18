import { useEffect, useState } from 'react';
import { useOptionalAuth } from '../context/AuthContext';
import { ROLES } from '../auth/permissions';
import StudentOnboarding from '../features/onboarding/StudentOnboarding';
import { readOnboarding } from '../features/onboarding/onboarding';

const BYPASS_ROLES = new Set([ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.STUDENT_AFFAIRS_ADMIN]);

function LoadingScreen() {
    return (
        <div className="dx-app dx-access-page" role="status">
            <div className="dx-access-loading">
                <span className="dx-access-spinner" />
                <p>Đang mở ClubHub...</p>
            </div>
        </div>
    );
}

export default function StudentOnboardingGate({ children }) {
    const auth = useOptionalAuth();
    const user = auth?.user;
    const isAuthenticated = auth?.isAuthenticated ?? false;
    const loading = auth?.loading ?? false;
    const [preferences, setPreferences] = useState(undefined);
    const bypassOnboarding = user?.roles?.some((role) => BYPASS_ROLES.has(role));

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || !user || bypassOnboarding) {
            setPreferences(null);
            return;
        }
        setPreferences(readOnboarding(user));
    }, [bypassOnboarding, isAuthenticated, loading, user]);

    if (!auth) return children;
    if (loading) return <LoadingScreen />;
    if (!isAuthenticated || bypassOnboarding) return children;
    if (preferences === undefined) return <LoadingScreen />;
    if (!preferences) return <StudentOnboarding user={user} onComplete={setPreferences} />;
    return children;
}
