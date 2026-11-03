import SessionExpiryGuard from './components/auth/SessionExpiryGuard';
import LogoutPage from './pages/LogoutPage';
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
import { createBrowserSession } from './services/browser-session.js';
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
            <SessionExpiryGuard session={session} loginTo="/v2">
            <Suspense
                fallback={
                    <div role="status" style={{ padding: 40 }}>
                        Đang mở giao diện...
                    </div>
                }
            >
                <Routes>
                    <Route path="/logout" element={<LogoutPage />} />
                    <Route path="/v2/*" element={<V2App />} />
                    <Route path="/reports/create" element={<LegacyReportEditorRedirect />} />
                    <Route path="/reports/:id/edit" element={<LegacyReportEditorRedirect />} />
                    <Route path="/reports/:id" element={<LegacyReportDetailRedirect />} />
                    <Route path="/*" element={<ExistingApplication />} />
                </Routes>
            </Suspense>
            </SessionExpiryGuard>
        </BrowserRouter>
    </React.StrictMode>,
);
}

async function start() {
    runtime.stop?.();
    runtime.stop = null;
    const generation = ++runtime.generation;
    const isCurrent = () => runtime.generation === generation;
    const bypass = import.meta.env.DEV && import.meta.env.VITE_DISABLE_AUTH === 'true';
    if (!bypass) {
        try {
            const browserSession = createBrowserSession({ session, isCurrent });
            await browserSession.bootstrap();
            if (!isCurrent()) return;
        } catch {
            if (!isCurrent()) return;
            runtime.root ||= ReactDOM.createRoot(document.getElementById('root'));
            runtime.root.render(<main role="alert" style={{ padding: 40 }}>
                <p>Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.</p>
                <button type="button" onClick={start}>Thử lại</button>
            </main>);
            return;
        }
    }
    if (!isCurrent()) return;
    const stopRedirect = watchSessionRedirect(session, { destination: '/v2' });
    runtime.stop = () => { stopRedirect(); };
    renderApplication();
}
start();
