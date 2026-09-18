import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useClubHub } from '../../context/ClubHubContext';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { Toast } from '../ui/Toast';

export function AppShell({ sessionUser, onLogout }) {
    const location = useLocation();
    const { actorId } = useClubHub();
    const isWorkspace = location.pathname.includes('/my-clubs/') && location.pathname.split('/').length > 3;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname, actorId]);

    return (
        <div className="dx-app">
            <a className="dx-skip" href="#main-content">
                Đến nội dung chính
            </a>

            <AppHeader sessionUser={sessionUser} onLogout={onLogout} isWorkspace={isWorkspace} />

            {isWorkspace ? (
                <Outlet />
            ) : (
                <main id="main-content">
                    <Outlet />
                </main>
            )}

            {!isWorkspace && <AppFooter />}

            <Toast />
        </div>
    );
}

export default AppShell;
