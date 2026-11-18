import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import Footer from '../../components/v2/common/footer/Footer';
import LeftRail from '../../components/v2/common/leftrail/LeftRail';
import AllClubsPage from './all-clubs-page/AllClubsPage';
import ClubDetailPage from './club-detail-page/ClubDetailPage';
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
import ReportDetailPage from './report-detail-page/ReportDetailPage';
import ReportEditorPage from './report-detail-page/ReportEditorPage';
import PersonalExperiencePage from './personal-experience/PersonalExperiencePage';
import './V2App.scss';
import '../../components/v2/experience/ExperienceOperations.scss';
import { PinnedClubsProvider } from './pinned-clubs';
import GuidedHelp from '../../components/guided-help/GuidedHelp';
import { clubGuidePlan } from '../../components/guided-help/guide-plans';
import { campusLabel } from './profile-options';
import usePublicGuide from '../../components/guided-help/usePublicGuide';
import { isAffairsViewer } from './affairs-access';
import DiscoveryCaptureProvider from './DiscoveryCaptureProvider';

function AuthenticatedV2App() {
    const { user, clubAccess, api } = useAuth();
    const location = useLocation();
    const sessionKey = user?.id || user?.email || 'anonymous';
    const publicGuide = usePublicGuide(sessionKey, !isAffairsViewer(user));
    const { profileImages, profileResult } = usePersonalMedia();

    const workspace = location.pathname.startsWith('/my-clubs/') || /^\/ctsv\/clubs\/[^/]+\/workspace(?:\/|$)/.test(location.pathname);
    const directory = ['/clubs', '/activities'].includes(location.pathname.replace(/\/$/, ''));

    return (
        <EntityMediaProvider api={api}>
        <DiscoveryCaptureProvider key={sessionKey} api={api} enabled={Boolean(user?.id) && !isAffairsViewer(user)}>
        <PinnedClubsProvider key={sessionKey} api={api} accountKey={sessionKey}>
            <div data-guide-route={location.pathname + location.search} className={`v2-app${workspace ? ' v2-app--workspace' : ''}${directory ? ' v2-app--directory' : ''}`}>
                <a className="v2-skip-link" href="#v2-main">
                    Đến nội dung chính
                </a>
                {!workspace && (
                    <LeftRail user={user} profile={profileResult.data?.profile} avatarUrl={profileImages.images.avatar} api={api} onStartGuide={publicGuide.start} />
                )}
                <main id="v2-main" className="v2-main">
                    <Routes>
                        <Route path="ctsv" element={<AffairsAccess user={user} />}>
                            <Route index element={<Navigate to="/clubs" replace />} />
                            <Route path="clubs" element={<Navigate to="/clubs" replace />} />
                            <Route path="clubs/:clubCode/workspace/*" element={<AffairsClubWorkspace api={api} sessionKey={sessionKey} viewer={user} />} />
                            <Route path="activities" element={<AffairsPage section="activities" />} />
                            <Route path="rewards" element={<AffairsPage section="rewards" />} />
                            <Route path="admin" element={<AffairsPage section="admin" />} />
                            <Route path="*" element={<Navigate to="/clubs" replace />} />
                        </Route>
                        <Route index element={<DiscoverPage api={api} sessionKey={sessionKey} campus={campusLabel(user?.campusCode) || 'FPTU'} />} />
                        <Route path="clubs" element={<AllClubsPage api={api} sessionKey={sessionKey} />} />
                        <Route path="activities" element={<ActivitiesPage api={api} sessionKey={sessionKey} />} />
                        <Route
                            path="activities/:activityId"
                            element={<ActivityDetailPage api={api} sessionKey={sessionKey} />}
                        />
                        <Route path="my-clubs" element={<MyClubsPage api={api} sessionKey={sessionKey} />} />
                        <Route path="personal-experience" element={<PersonalExperiencePage key={sessionKey} api={api} user={user} clubAccess={clubAccess} />} />
                        <Route path="reports/:reportId" element={<div className="v2-public-content"><ReportDetailPage key={`${sessionKey}:${location.pathname}`} api={api} sessionKey={sessionKey} /></div>} />
                        <Route path="reports/create" element={<div className="v2-public-content"><ReportEditorPage key={`${sessionKey}:${location.pathname}:${location.search}`} api={api} sessionKey={sessionKey} /></div>} />
                        <Route path="reports/:reportId/edit" element={<div className="v2-public-content"><ReportEditorPage key={`${sessionKey}:${location.pathname}`} api={api} sessionKey={sessionKey} /></div>} />
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
                        <Route path="recommended" element={<Navigate to="/#club-directory" replace />} />
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
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                {!workspace && <Footer />}
                {workspace && <GuidedHelp plan={clubGuidePlan(location.pathname)} routeKey={location.pathname + location.search} accountKey={sessionKey} />}
                {publicGuide.notice && <p className="web-guide-notice web-guide-public-notice" role="status">{publicGuide.notice}</p>}
            </div>
        </PinnedClubsProvider>
        </DiscoveryCaptureProvider>
        </EntityMediaProvider>
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
