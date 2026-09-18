import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClubHubProvider } from '../context/ClubHubContext';
import { AppShell } from '../components/layout/AppShell';
import { Empty } from '../components/ui/Empty';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import StudentOnboardingGate from './StudentOnboardingGate';

// Feature Pages
import { LoginPage } from '../features/auth';
import { DiscoverPage, ClubDetailPage, PublicEventsPage } from '../features/discovery';
import { MyClubsPage } from '../features/my-clubs';
import { ClubWorkspaceLayout, ClubHomePage } from '../features/workspace';
import { ActivitiesPage, AttendancePage } from '../features/activities';
import {
    MembersPage,
    QuestsPage,
    PointsPage,
    GiftsPage,
    ReportsPage,
    FinancePage,
    ClubSettingsPage,
} from '../features/community';
import { ProfilePage } from '../features/profile';

import '../styles/clubhub.scss';

function RouteHierarchy({ sessionUser, onLogout }) {
    return (
        <Routes>
            {/* Standalone Authentication Route */}
            <Route path="login" element={<LoginPage />} />

            <Route element={<AppShell sessionUser={sessionUser} onLogout={onLogout} />}>
                {/* Public / Student Portal */}
                <Route index element={<DiscoverPage />} />
                <Route path="clubs" element={<DiscoverPage />} />
                <Route path="events" element={<PublicEventsPage />} />
                <Route path="activities" element={<PublicEventsPage />} />
                <Route path="clubs/:clubId" element={<ClubDetailPage />} />

                {/* Protected Student Portal */}
                <Route
                    path="my-clubs"
                    element={
                        <ProtectedRoute>
                            <MyClubsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* Protected Club Officer & Member Workspace */}
                <Route
                    path="my-clubs/:clubId"
                    element={
                        <ProtectedRoute>
                            <ClubWorkspaceLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ClubHomePage />} />
                    <Route path="activities" element={<ActivitiesPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="members" element={<MembersPage />} />
                    <Route path="quests" element={<QuestsPage />} />
                    <Route path="points" element={<PointsPage />} />
                    <Route path="gifts" element={<GiftsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="finance" element={<FinancePage />} />
                    <Route path="settings" element={<ClubSettingsPage />} />
                    <Route path="*" element={<Empty title="Trang không tồn tại trong CLB" />} />
                </Route>

                {/* 404 Fallback */}
                <Route
                    path="*"
                    element={
                        <Empty title="Không tìm thấy trang">
                            <Link className="dx-button" to="/">
                                Về trang khám phá
                            </Link>
                        </Empty>
                    }
                />
            </Route>
        </Routes>
    );
}

export function AppRoutes({ sessionUser, onLogout }) {
    let auth = null;
    try {
        auth = useAuth();
    } catch (_) {
        // Fallback when rendered without AuthProvider in tests
    }
    const activeUser = sessionUser || auth?.user;
    const handleLogout = onLogout || auth?.logout;

    return (
        <ErrorBoundary>
            <ClubHubProvider>
                <StudentOnboardingGate>
                    <RouteHierarchy sessionUser={activeUser} onLogout={handleLogout} />
                </StudentOnboardingGate>
            </ClubHubProvider>
        </ErrorBoundary>
    );
}

export default AppRoutes;
