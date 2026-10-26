import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentOnboarding from '../../components/v2/student-onboarding/StudentOnboarding';
import { useAuth } from '../../context/AuthContext';
import { readOnboarding } from './onboarding';
import { isAffairsViewer } from './affairs-access';
import { session } from '../../services/api';
import { bindGoogleSignIn } from '../../services/google-signin.js';

import './V2Access.scss';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LoadingScreen() {
    return (
        <div className="v2-access-shell v2-access-page" role="status">
            <div className="v2-access-loading">
                <span className="v2-access-spinner" />
                <p>Đang mở ClubHub...</p>
            </div>
        </div>
    );
}

function V2Login() {
    const { login, loginWithGoogle, authError } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailExpanded, setEmailExpanded] = useState(false);
    const shortcuts = import.meta.env.VITE_LOGIN_ACCOUNT_SHORTCUTS === 'true';
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const googleButtonRef = useRef(null);
    const popupAuthEnd = useRef(null);

    const finishLogin = useCallback(
        async (action) => {
            setError('');
            setBusy(true);
            try {
                await action();
                navigate('/v2', { replace: true });
            } catch (loginError) {
                setError(loginError.message || 'Không thể đăng nhập. Vui lòng thử lại.');
            } finally {
                setBusy(false);
            }
        },
        [navigate],
    );

    const handleGoogleCredential = useCallback(
        (response) => {
            if (response?.credential) finishLogin(async () => {
                try { return await loginWithGoogle(response.credential); }
                finally { popupAuthEnd.current?.(); popupAuthEnd.current = null; }
            });
        },
        [finishLogin, loginWithGoogle],
    );

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;
        let disposed = false;
        let unbind;
        const initialise = () => {
            if (disposed || !googleButtonRef.current || !window.google?.accounts?.id) return;
            unbind?.();
            unbind = bindGoogleSignIn(window.google.accounts.id, GOOGLE_CLIENT_ID, handleGoogleCredential);
            googleButtonRef.current.replaceChildren();
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: Math.min(390, googleButtonRef.current.clientWidth || 390),
                click_listener: () => {
                    popupAuthEnd.current?.();
                    popupAuthEnd.current = session.beginAuthentication();
                },
            });
            setGoogleReady(true);
        };
        if (window.google?.accounts?.id) initialise();
        else
            document
                .querySelector('script[src="https://accounts.google.com/gsi/client"]')
                ?.addEventListener('load', initialise);
        return () => {
            disposed = true;
            unbind?.();
            popupAuthEnd.current?.();
            popupAuthEnd.current = null;
            document
                .querySelector('script[src="https://accounts.google.com/gsi/client"]')
                ?.removeEventListener('load', initialise);
        };
    }, [handleGoogleCredential]);

    const submitEmail = (event) => {
        event.preventDefault();
        const normalizedEmail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError('Vui lòng nhập một địa chỉ email hợp lệ.');
            return;
        }
        if (!password) { setError('Vui lòng nhập mật khẩu.'); return; }
        finishLogin(() => login(normalizedEmail, password));
    };

    return (
        <div className="v2-access-shell v2-access-page v2-access-login-page">
            <main className="v2-access-login-layout">
                <section className="v2-access-login-story">
                    <a className="v2-access-brand" href="/v2" aria-label="ClubHub">
                        <img src="/fptux.png" alt="" />
                        <span>
                            clubhub<span className="v2-access-brand-dot">.</span>
                            <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                        </span>
                    </a>
                    <div>
                        <span className="v2-access-eyebrow">FPTU XPERIENCE · STUDENT COMMUNITY</span>
                        <h1>
                            Tìm nơi bạn thuộc về.
                            <br />
                            <em>Bắt đầu từ đây.</em>
                        </h1>
                        <p>Khám phá câu lạc bộ, hoạt động và những người bạn cùng sở thích trong campus.</p>
                    </div>
                    <div className="v2-access-login-proof"></div>
                </section>
                <section className="v2-access-login-panel" aria-labelledby="v2-login-title">
                    <div className="v2-access-login-card">
                        <span className="v2-access-login-icon">
                            <LogIn size={24} />
                        </span>
                        <h2 id="v2-login-title">Chào mừng bạn</h2>
                        <p>Đăng nhập bằng Google hoặc email và mật khẩu để tiếp tục vào ClubHub.</p>
                        {GOOGLE_CLIENT_ID ? (
                            <>
                                <div
                                    ref={googleButtonRef}
                                    className={`v2-access-google-button ${busy ? 'disabled' : ''}`}
                                    aria-label="Đăng nhập bằng Google"
                                />
                                {!googleReady && <small>Đang tải đăng nhập Google...</small>}
                            </>
                        ) : (
                            <small>Đăng nhập Google chưa sẵn sàng.</small>
                        )}
                        <button className="v2-access-login-divider v2-access-email-toggle" type="button"
                            aria-expanded={emailExpanded} aria-controls="v2-email-login" disabled={busy}
                            onClick={() => setEmailExpanded(expanded => !expanded)}>
                            <span>Hoặc dùng email <ChevronDown size={14} aria-hidden="true" /></span>
                        </button>
                        {(error || authError) && (
                            <p className="v2-access-form-error" id="v2-login-error" role="alert">
                                {error || authError}
                            </p>
                        )}
                        <form id="v2-email-login" onSubmit={submitEmail} noValidate hidden={!emailExpanded}>
                            {shortcuts && (
                                <div className="v2-access-shortcuts">
                                    <span className="v2-access-shortcuts-label">Điền nhanh email</span>
                                    <div className="v2-access-shortcuts-buttons" role="group" aria-label="Điền nhanh email">
                                        <button type="button" disabled={busy} onClick={() => setEmail('admin@fpt.edu.vn')}>Admin</button>
                                        <button type="button" disabled={busy} onClick={() => setEmail('ctsv.an@fpt.edu.vn')}>CTSV</button>
                                    </div>
                                </div>
                            )}
                            <label className="v2-access-field">
                                <span>Email tài khoản</span>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setError('');
                                    }}
                                    placeholder="email@example.com"
                                    disabled={busy}
                                    aria-describedby={error || authError ? 'v2-login-error' : undefined}
                                />
                            </label>
                            <label className="v2-access-field" htmlFor="v2-password">
                                <span>Mật khẩu</span>
                                <input id="v2-password" type="password" required maxLength={128} autoComplete="current-password"
                                    value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
                            </label>
                                <button className="v2-access-button primary full" type="submit" disabled={busy}>
                                {busy ? 'Đang xác thực...' : 'Tiếp tục'} <ArrowRight size={17} />
                            </button>
                        </form>
                        <small className="v2-access-login-note">
                            Bằng việc tiếp tục, bạn đồng ý sử dụng tài khoản theo quy định của Trường Đại học FPT.
                        </small>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default function V2Access({ children }) {
    const { user, isAuthenticated, loading } = useAuth();
    const [preferences, setPreferences] = useState(undefined);
    const needsOnboarding = !isAffairsViewer(user);

    useEffect(() => {
        setPreferences(isAuthenticated && needsOnboarding ? readOnboarding(user) : null);
    }, [isAuthenticated, user, needsOnboarding]);

    if (loading) return <LoadingScreen />;
    if (!isAuthenticated) return <V2Login />;
    if (needsOnboarding && preferences === undefined) return <LoadingScreen />;
    if (needsOnboarding && !preferences)
        return <StudentOnboarding key={user?.id || user?.email} user={user} onComplete={setPreferences} />;
    return children;
}
