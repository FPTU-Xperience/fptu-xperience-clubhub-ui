import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentOnboarding from '../../components/v2/StudentOnboarding';
import { useAuth } from '../../context/AuthContext';
import { readOnboarding } from './onboarding';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ADMIN_ROLES = new Set(['ADMIN', 'SYSTEM_ADMIN', 'STUDENT_AFFAIRS_ADMIN']);

function LoadingScreen() {
    return (
        <div className="dx-app dx-access-page" role="status">
            <div className="dx-access-loading">
                <span className="dx-access-spinner" />
                <p>Đang mở ClubHub...</p>
            </div>
        </div>
    );
}

function V2Login() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const googleButtonRef = useRef(null);

    const finishLogin = useCallback(async (action) => {
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
    }, [navigate]);

    const handleGoogleCredential = useCallback(
        (response) => {
            if (response?.credential) finishLogin(() => loginWithGoogle(response.credential));
        },
        [finishLogin, loginWithGoogle],
    );

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;
        let disposed = false;
        const initialise = () => {
            if (disposed || !googleButtonRef.current || !window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential,
                ux_mode: 'popup',
                auto_select: false,
            });
            googleButtonRef.current.replaceChildren();
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: Math.min(390, googleButtonRef.current.clientWidth || 390),
            });
            setGoogleReady(true);
        };
        if (window.google?.accounts?.id) initialise();
        else document.querySelector('script[src="https://accounts.google.com/gsi/client"]')?.addEventListener('load', initialise);
        return () => {
            disposed = true;
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
        finishLogin(() => login(normalizedEmail));
    };

    return (
        <div className="dx-app dx-access-page">
            <main className="dx-login-layout">
                <section className="dx-login-story">
                    <a className="dx-brand" href="/v2" aria-label="ClubHub">
                        <img src="/fptux.png" alt="" />
                        <span>
                            clubhub<span className="dx-brand-dot">.</span>
                            <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                        </span>
                    </a>
                    <div>
                        <span className="dx-eyebrow">FPTU XPERIENCE · STUDENT COMMUNITY</span>
                        <h1>
                            Tìm nơi bạn thuộc về.<br />
                            <em>Bắt đầu từ đây.</em>
                        </h1>
                        <p>Khám phá câu lạc bộ, hoạt động và những người bạn cùng sở thích trong campus.</p>
                    </div>
                    <div className="dx-login-proof">
                        <Sparkles size={18} />
                        <span>
                            <strong>Một tài khoản FPTU</strong>
                            <small>Cho toàn bộ hành trình trải nghiệm sinh viên</small>
                        </span>
                    </div>
                </section>
                <section className="dx-login-panel" aria-labelledby="v2-login-title">
                    <div className="dx-login-card">
                        <span className="dx-login-icon">
                            <LogIn size={24} />
                        </span>
                        <h2 id="v2-login-title">Chào mừng bạn</h2>
                        <p>Đăng nhập bằng tài khoản trường để tiếp tục vào ClubHub.</p>
                        {GOOGLE_CLIENT_ID ? (
                            <>
                                <div
                                    ref={googleButtonRef}
                                    className={`dx-google-button ${busy ? 'disabled' : ''}`}
                                    aria-label="Đăng nhập bằng Google"
                                />
                                {!googleReady && <small>Đang tải đăng nhập Google...</small>}
                                <div className="dx-login-divider"><span>hoặc dùng email</span></div>
                            </>
                        ) : (
                            <div className="dx-login-divider"><span>Đăng nhập bằng email</span></div>
                        )}
                        <form onSubmit={submitEmail} noValidate>
                            <label className="dx-field">
                                <span>Email FPTU</span>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setError('');
                                    }}
                                    placeholder="student@fpt.edu.vn"
                                    disabled={busy}
                                    aria-describedby={error ? 'v2-login-error' : undefined}
                                />
                            </label>
                            {error && <p className="dx-form-error" id="v2-login-error" role="alert">{error}</p>}
                            <button className="dx-button primary full" type="submit" disabled={busy}>
                                {busy ? 'Đang xác thực...' : 'Tiếp tục'} <ArrowRight size={17} />
                            </button>
                        </form>
                        <small className="dx-login-note">
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
    const needsOnboarding = !user?.roles?.some((role) => ADMIN_ROLES.has(role));

    useEffect(() => {
        setPreferences(isAuthenticated ? readOnboarding(user) : null);
    }, [isAuthenticated, user]);

    if (loading) return <LoadingScreen />;
    if (!isAuthenticated) return <V2Login />;
    if (preferences === undefined) return <LoadingScreen />;
    if (needsOnboarding && !preferences) return <StudentOnboarding user={user} onComplete={setPreferences} />;
    return children;
}
