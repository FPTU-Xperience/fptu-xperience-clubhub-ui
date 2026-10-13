import {
    WorkspaceSemesterProvider,
    WorkspaceSemesterSelect,
    useWorkspaceSemesterSelection,
} from './club-workspace-page/WorkspaceSemesterContext';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import Footer from '../../components/v2/common/footer/Footer';
import LeftRail from '../../components/v2/common/leftrail/LeftRail';
import AllClubsPage from './all-clubs-page/AllClubsPage';
import ClubDetailPage from './club-detail-page/ClubDetailPage';
import { lazy, Suspense } from 'react';
import DiscoverPage from './discovery-page/DiscoveryPage';
import ActivitiesPage from './activities-page/ActivitiesPage';
import ActivityDetailPage from './activities-page/ActivityDetailPage';
import MyClubsPage from './my-clubs-page/MyClubsPage';
import ClubWorkspacePage from './club-workspace-page/ClubWorkspacePage';
import { MySchedulePage } from './personal-pages/PersonalPages';
import StudySchedulePage from './personal-pages/StudySchedulePage';
import ProfilePage from './profile-page/ProfilePage';
import { useProfileImages } from './profile-page/profile-images';
import V2Access from './V2Access';
import ClubGovernancePreview from './club-workspace-page/tabs/members/governance/ClubGovernancePreview';
import './V2App.scss';
const DemoApp = lazy(() => import('./DemoApp'));

function AuthenticatedV2App() {
    const { user, logout, clubAccess, api } = useAuth();
    const location = useLocation();
    const sessionKey = user?.id || user?.email || 'anonymous';
    const profileImages = useProfileImages(user, sessionKey);

    if (location.pathname.startsWith('/v2/demo')) {
        return (
            <Suspense fallback={<div role="status">Đang mở bản demo...</div>}>
                <Routes>
                    <Route path="demo/*" element={<DemoApp sessionUser={user} onLogout={logout} />} />
                </Routes>
            </Suspense>
        );
    }

    const workspace = location.pathname.startsWith('/v2/my-clubs/');

    return (
        <div className={`v2-app${workspace ? ' v2-app--workspace' : ''}`}>
            <a className="v2-skip-link" href="#v2-main">
                Đến nội dung chính
            </a>
            {!workspace && <LeftRail user={user} avatarUrl={profileImages.images.avatar} onLogout={logout} api={api} />}
            <main id="v2-main" className="v2-main">
                <Routes>
                    <Route index element={<DiscoverPage api={api} sessionKey={sessionKey} />} />
                    <Route path="clubs" element={<AllClubsPage api={api} sessionKey={sessionKey} />} />
                    <Route path="activities" element={<ActivitiesPage api={api} sessionKey={sessionKey} />} />
                    <Route
                        path="activities/:activityId"
                        element={<ActivityDetailPage api={api} sessionKey={sessionKey} />}
                    />
                    <Route path="my-clubs" element={<MyClubsPage api={api} sessionKey={sessionKey} />} />
                    <Route
                        path="my-clubs/:clubCode/*"
                        element={<ClubWorkspacePage api={api} sessionKey={sessionKey} viewer={user} />}
                    />
                    <Route
                        path="my-schedule"
                        element={<MySchedulePage api={api} sessionKey={sessionKey} clubAccess={clubAccess} />}
                    />
                    <Route path="study-schedule" element={<StudySchedulePage key={sessionKey} user={user} />} />
                    <Route path="profile" element={<ProfilePage user={user} sessionKey={sessionKey} api={api} profileImages={profileImages} />} />
                    <Route path="recommended" element={<Navigate to="/v2#club-directory" replace />} />
                    <Route
                        path="clubs/:clubCode"
                        element={
                            <ClubDetailPage api={api} viewer={user} viewerAccess={clubAccess} sessionKey={sessionKey} />
                        }
                    />
                </Routes>
            </main>
            {!workspace && <Footer />}
        </div>
    );
}

export default function V2App() {
    const location = useLocation();
    const previewSemester = useWorkspaceSemesterSelection('synthetic-ui-reviewer', 'synthetic-preview-club');
    // Public developer rehearsal uses synthetic people only, never a live auth provider.
    if (import.meta.env.DEV && location.pathname === '/v2/preview/club-governance') {
        return (
            <ThemeProvider>
                <div className="v2-app v2-app--workspace">
                    <WorkspaceSemesterProvider value={previewSemester}>
                        <main className="governance-preview-page">
                            <a className="governance-preview-back" href="/v2">
                                ← Về ClubHub
                            </a>
                            <WorkspaceSemesterSelect />
                            <ClubGovernancePreview
                                actorId="synthetic-ui-reviewer"
                                clubId="synthetic-preview-club"
                                actorName="Chủ nhiệm"
                            />
                        </main>
                    </WorkspaceSemesterProvider>
                </div>
            </ThemeProvider>
        );
    }
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
