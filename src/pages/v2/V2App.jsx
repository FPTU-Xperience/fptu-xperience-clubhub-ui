import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import Footer from '../../components/v2/common/footer/Footer';
import LeftRail from '../../components/v2/common/leftrail/LeftRail';
import AllClubsPage from './all-clubs-page/AllClubsPage';
import ClubDetailPage from './club-detail-page/ClubDetailPage';
import DemoApp from './DemoApp';
import DiscoverPage from './discovery-page/DiscoveryPage';
import ActivitiesPage from './activities-page/ActivitiesPage';
import ActivityDetailPage from './activities-page/ActivityDetailPage';
import MyClubsPage from './my-clubs-page/MyClubsPage';
import ClubWorkspacePage from './club-workspace-page/ClubWorkspacePage';
import { MySchedulePage } from './personal-pages/PersonalPages';
import ProfilePage from './profile-page/ProfilePage';
import V2Access from './V2Access';
import './V2App.scss';
// The legacy demo and access styles remain available while their rules are
// progressively moved beside the components that own them.
import './demo.scss';

function AuthenticatedV2App() {
    const { user, logout, clubAccess, api } = useAuth();
    const location = useLocation();
    const sessionKey = user?.id || user?.email || 'anonymous';

    if (location.pathname.startsWith('/v2/demo')) {
        return (
            <Routes>
                <Route path="demo/*" element={<DemoApp sessionUser={user} onLogout={logout} />} />
            </Routes>
        );
    }

    const workspace = location.pathname.startsWith('/v2/my-clubs/');

    return (
        <div className={`v2-app${workspace ? ' v2-app--workspace' : ''}`}>
            <a className="v2-skip-link" href="#v2-main">
                Đến nội dung chính
            </a>
            {!workspace && <LeftRail user={user} onLogout={logout} api={api} />}
            <main id="v2-main" className="v2-main">
                <Routes>
                    <Route index element={<DiscoverPage api={api} sessionKey={sessionKey} />} />
                    <Route path="clubs" element={<AllClubsPage api={api} sessionKey={sessionKey} />} />
                    <Route path="activities" element={<ActivitiesPage api={api} sessionKey={sessionKey} />} />
                    <Route path="activities/:activityId" element={<ActivityDetailPage api={api} sessionKey={sessionKey} />} />
                    <Route path="my-clubs" element={<MyClubsPage api={api} sessionKey={sessionKey} />} />
                    <Route path="my-clubs/:clubId/*" element={<ClubWorkspacePage api={api} sessionKey={sessionKey} viewer={user} />} />
                    <Route path="my-schedule" element={<MySchedulePage api={api} sessionKey={sessionKey} clubAccess={clubAccess} />} />
                    <Route path="profile" element={<ProfilePage user={user} sessionKey={sessionKey} />} />
                    <Route path="recommended" element={<Navigate to="/v2#club-directory" replace />} />
                    <Route
                        path="clubs/:clubId"
                        element={<ClubDetailPage api={api} viewerAccess={clubAccess} sessionKey={sessionKey} />}
                    />
                </Routes>
            </main>
            {!workspace && <Footer />}
        </div>
    );
}

export default function V2App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <V2Access>
                    <AuthenticatedV2App />
                </V2Access>
            </AuthProvider>
        </ThemeProvider>
    );
}
