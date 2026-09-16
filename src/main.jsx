import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/index.scss';

const DemoApp = lazy(() => import('./demo/DemoApp'));

// Keep server-connected providers out of the mock route, including auth and polling.
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

ReactDOM.createRoot(document.getElementById('root')).render(
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
                    <Route path="/demo/*" element={<DemoApp />} />
                    <Route path="/*" element={<ExistingApplication />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    </React.StrictMode>,
);
