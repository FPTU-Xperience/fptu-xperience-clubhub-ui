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
import { usePersonalMedia } from '../../components/media/PersonalMediaContext';
import { EntityMediaProvider } from '../../components/media/EntityMediaContext';
import V2Access from './V2Access';
import AffairsPage, { AffairsAccess } from './affairs-page/AffairsPage';
import AffairsClubWorkspace from './affairs-page/AffairsClubWorkspace';
import ClubGovernancePreview from './club-workspace-page/tabs/members/governance/ClubGovernancePreview';
import './V2App.scss';
import { PinnedClubsProvider } from './pinned-clubs';
const DemoApp = lazy(() => import('./DemoApp'));

function AuthenticatedV2App() {
    const { user, logout, clubAccess, api } = useAuth();
    const location = useLocation();
    const sessionKey = user?.id || user?.email || 'anonymous';
    const { profileImages, profileResult } = usePersonalMedia();

    if (location.pathname.startsWith('/v2/demo')) {
        return (
            <Suspense fallback={<div role="status">Đang mở bản demo...</div>}>
                <Routes>
                    <Route path="demo/*" element={<DemoApp sessionUser={user} onLogout={logout} />} />
                </Routes>
            </Suspense>
        );
    }

    const workspace = location.pathname.startsWith('/v2/my-clubs/') || /^\/v2\/ctsv\/clubs\/[^/]+\/workspace(?:\/|$)/.test(location.pathname);
    const directory = ['/v2/clubs', '/v2/activities'].includes(location.pathname.replace(/\/$/, ''));

    return (
        <EntityMediaProvider api={api}>
        <PinnedClubsProvider key={sessionKey} api={api} accountKey={sessionKey}>
            <div className={`v2-app${workspace ? ' v2-app--workspace' : ''}${directory ? ' v2-app--directory' : ''}`}>
                <a className="v2-skip-link" href="#v2-main">
                    Đến nội dung chính
                </a>
                {!workspace && (
                    <LeftRail user={user} profile={profileResult.data?.profile} avatarUrl={profileImages.images.avatar} onLogout={logout} api={api} />
                )}
                <main id="v2-main" className="v2-main">
                    <Routes>
                        <Route path="ctsv" element={<AffairsAccess user={user} />}>
                            <Route index element={<Navigate to="/v2/clubs" replace />} />
                            <Route path="clubs" element={<Navigate to="/v2/clubs" replace />} />
                            <Route path="clubs/:clubCode/workspace/*" element={<AffairsClubWorkspace api={api} sessionKey={sessionKey} viewer={user} />} />
                            <Route path="activities" element={<AffairsPage section="activities" />} />
                            <Route path="rewards" element={<AffairsPage section="rewards" />} />
                            <Route path="admin" element={<AffairsPage section="admin" />} />
                            <Route path="*" element={<Navigate to="/v2/clubs" replace />} />
                        </Route>
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
                        <Route path="profile" element={<ProfilePage user={user} sessionKey={sessionKey} api={api} profileImages={profileImages} profileResult={profileResult} />} />
                        <Route path="recommended" element={<Navigate to="/v2#club-directory" replace />} />
                        <Route
                            path="clubs/:clubCode"
                            element={
                                <ClubDetailPage
                                    api={api}
                                    viewer={user}
                                    viewerAccess={clubAccess}
                                    sessionKey={sessionKey}
                                />
                            }
                        />
                    </Routes>
                </main>
                {!workspace && <Footer />}
            </div>
        </PinnedClubsProvider>
        </EntityMediaProvider>
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
