import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LegacyReportEditorRedirect from './pages/CreateReportPage';
import LegacyReportDetailRedirect from './pages/ReportDetailPage';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/index.scss';

const V2App = lazy(() => import('./pages/v2/V2App'));
import { session } from './services/api';
import { createStaffSso } from './services/staff-sso.js';
import { watchSessionRedirect } from './services/session-client.js';

// Async SSO bootstrap can outlive a Vite update; reuse the root and retire outdated bootstrap/listeners.
const runtime = import.meta.hot?.data.authRuntime || { generation: 0, root: null, stop: null };
if (import.meta.hot) {
    import.meta.hot.data.authRuntime = runtime;
    import.meta.hot.dispose(() => { runtime.generation++; runtime.stop?.(); runtime.stop = null; });
    // The auth context and lazy route tree must come from the same module generation.
    import.meta.hot.accept(() => window.location.reload());
}

// The v2 branch owns its auth boundary; keep notification polling and other legacy providers out of it.
function ExistingApplication() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <NotificationProvider>
                    <ToastProvider>
                        <App />
                    </ToastProvider>
                </NotificationProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

function renderApplication() {
    runtime.root ||= ReactDOM.createRoot(document.getElementById('root'));
    runtime.root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Suspense
                fallback={
                    <div role="status" style={{ padding: 40 }}>
                        Đang mở giao diện...
                    </div>
                }
            >
                <Routes>
                    <Route path="/v2/*" element={<V2App />} />
                    <Route path="/reports/create" element={<LegacyReportEditorRedirect />} />
                    <Route path="/reports/:id/edit" element={<LegacyReportEditorRedirect />} />
                    <Route path="/reports/:id" element={<LegacyReportDetailRedirect />} />
                    <Route path="/*" element={<ExistingApplication />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    </React.StrictMode>,
);
}

async function start() {
    const generation = ++runtime.generation;
    const isCurrent = () => runtime.generation === generation;
    let stopSso;
    const bypass = import.meta.env.DEV && import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (!bypass && import.meta.env.VITE_STAFF_SSO_ENABLED !== 'false') {
        try {
            const sso = createStaffSso({ session, isCurrent, landingPath: '/v2', signedOutUrl: '/v2', peerUrl: import.meta.env.VITE_ADMIN_APP_URL
                || (import.meta.env.DEV ? 'http://localhost:5174' : 'https://fptux-admin-ui.pages.dev') });
            if (await sso.bootstrap() || !isCurrent()) return;
            stopSso = sso.watch();
        } catch (error) { console.error('Không thể khởi tạo SSO:', error); }
    }
    if (!isCurrent()) return;
    const stopRedirect = watchSessionRedirect(session, { destination: '/v2' });
    runtime.stop = () => { stopSso?.(); stopRedirect(); };
    renderApplication();
}
start();
