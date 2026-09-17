import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import DiscoverShell from '../../components/v2/DiscoverShell';
import AllClubsPage from './AllClubsPage';
import ClubDetailPage from './ClubDetailPage';
import DemoApp from './DemoApp';
import DiscoverPage from './DiscoverPage';
import V2Access from './V2Access';
import './demo.scss';
import './discover.scss';

function AuthenticatedV2App() {
    const { user, logout, clubAccess, api } = useAuth();
    const sessionKey = user?.id || user?.email || 'anonymous';
    return (
        <Routes>
            <Route path="demo/*" element={<DemoApp sessionUser={user} onLogout={logout} />} />
            <Route element={<DiscoverShell user={user} onLogout={logout} />}>
                <Route index element={<DiscoverPage api={api} sessionKey={sessionKey} />} />
                <Route path="clubs" element={<AllClubsPage api={api} sessionKey={sessionKey} />} />
                <Route path="recommended" element={<Navigate to="/v2#club-directory" replace />} />
                <Route
                    path="clubs/:clubId"
                    element={<ClubDetailPage api={api} viewerAccess={clubAccess} sessionKey={sessionKey} />}
                />
            </Route>
        </Routes>
    );
}

export default function V2App() {
    return (
        <AuthProvider>
            <V2Access>
                <AuthenticatedV2App />
            </V2Access>
        </AuthProvider>
    );
}
