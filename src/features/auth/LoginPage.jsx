import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectPath = searchParams.get('redirect') || '/my-clubs';
    const sessionExpired = searchParams.get('session') === 'expired';
    const { login, loginWithGoogle, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const googleButtonRef = useRef(null);

    useEffect(() => {
        if (sessionExpired) setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }, [sessionExpired]);

    useEffect(() => {
        if (isAuthenticated && !sessionExpired) navigate(redirectPath, { replace: true });
    }, [isAuthenticated, navigate, redirectPath, sessionExpired]);

    const finishLogin = useCallback(
        async (action) => {
            setError('');
            setBusy(true);
            try {
                await action();
                navigate(redirectPath, { replace: true });
            } catch (loginError) {
                setError(loginError.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản.');
            } finally {
                setBusy(false);
            }
        },
        [navigate, redirectPath],
    );

    const handleGoogleCredential = useCallback(
        (response) => {
            if (response?.credential) finishLogin(() => loginWithGoogle(response.credential));
        },
        [finishLogin, loginWithGoogle],
    );

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;

        let disposed = false;
        const initialiseGoogle = () => {
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

        const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (window.google?.accounts?.id) initialiseGoogle();
        else script?.addEventListener('load', initialiseGoogle);

        return () => {
            disposed = true;
            script?.removeEventListener('load', initialiseGoogle);
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
                    <Link className="dx-brand" to="/" aria-label="ClubHub">
                        <img src="/fptux.png" alt="" />
                        <span>
                            clubhub<span className="dx-brand-dot">.</span>
                            <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                        </span>
                    </Link>
                    <div className="dx-login-message">
                        <span className="dx-eyebrow">FPTU XPERIENCE · STUDENT COMMUNITY</span>
                        <h1>
                            Tìm nơi bạn thuộc về.
                            <br />
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

                <section className="dx-login-panel" aria-labelledby="login-title">
                    <div className="dx-login-card">
                        <span className="dx-login-icon">
                            <LogIn size={24} />
                        </span>
                        <h2 id="login-title">Chào mừng bạn</h2>
                        <p>Đăng nhập bằng tài khoản trường để tiếp tục vào ClubHub.</p>
                        {GOOGLE_CLIENT_ID ? (
                            <>
                                <div
                                    ref={googleButtonRef}
                                    className={`dx-google-button ${busy ? 'disabled' : ''}`}
                                    aria-label="Đăng nhập bằng Google"
                                    aria-busy={!googleReady || busy}
                                />
                                {!googleReady && <small>Đang tải đăng nhập Google...</small>}
                                <div className="dx-login-divider">
                                    <span>hoặc dùng email</span>
                                </div>
                            </>
                        ) : (
                            <div className="dx-login-divider">
                                <span>Đăng nhập bằng email</span>
                            </div>
                        )}
                        <form onSubmit={submitEmail} noValidate>
                            <label className="dx-field" htmlFor="login-email">
                                <span>Email FPTU</span>
                                <input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setError('');
                                    }}
                                    placeholder="student@fpt.edu.vn"
                                    disabled={busy}
                                    aria-describedby={error ? 'login-error' : undefined}
                                />
                            </label>
                            {error && (
                                <p className="dx-form-error" id="login-error" role="alert">
                                    {error}
                                </p>
                            )}
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

export default LoginPage;
