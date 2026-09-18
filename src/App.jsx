import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';

function LegacyRedirect() {
    const location = useLocation();
    const cleanPath = location.pathname.replace(/^\/v2(\/demo)?/, '') || '/';
    return <Navigate to={`${cleanPath}${location.search}${location.hash}`} replace />;
}

export default function App() {
    return (
        <Routes>
            {/* Redirect any legacy /v2 URLs cleanly to standard root paths */}
            <Route path="/v2/*" element={<LegacyRedirect />} />

            {/* Enterprise Root Application for Students, Club Members & CTSV */}
            <Route path="/*" element={<AppRoutes />} />
        </Routes>
    );
}
