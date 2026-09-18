import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <Suspense
                    fallback={
                        <div role="status" style={{ padding: 40, fontFamily: 'sans-serif' }}>
                            Đang tải FPTU ClubHub...
                        </div>
                    }
                >
                    <App />
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
