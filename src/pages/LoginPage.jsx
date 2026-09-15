import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();
    const { success, error } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const googleButtonRef = useRef(null);

    const handleEmailSubmit = async (event) => {
        event.preventDefault();
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            setEmailError('Vui lòng nhập địa chỉ email.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setEmailError('Định dạng email không hợp lệ.');
            return;
        }

        setEmailError('');
        setIsLoading(true);
        try {
            await login(normalizedEmail);
            success('Chào mừng bạn quay lại FPTU-Xperience ClubHub!');
            navigate('/dashboard');
        } catch (err) {
            error(err.message || 'Bạn không có quyền truy cập.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleCredential = useCallback(
        async (response) => {
            if (!response?.credential) return;

            setIsLoading(true);
            try {
                await loginWithGoogle(response.credential);
                success('Chào mừng bạn quay lại FPTU-Xperience ClubHub!');
                navigate('/dashboard');
            } catch (err) {
                error(err.message || 'Không thể xác thực tài khoản Google.');
            } finally {
                setIsLoading(false);
            }
        },
        [error, loginWithGoogle, navigate, success],
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
                width: Math.min(360, googleButtonRef.current.clientWidth || 360),
            });
            setGoogleReady(true);
        };

        if (window.google?.accounts?.id) {
            initialiseGoogle();
        } else {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            script?.addEventListener('load', initialiseGoogle);
        }

        return () => {
            disposed = true;
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            script?.removeEventListener('load', initialiseGoogle);
        };
    }, [handleGoogleCredential]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 grid-pattern" />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="relative w-full max-w-md"
            >
                <div className="cyber-card p-8">
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="relative inline-block mb-4"
                        >
                            <div className="w-24 h-24 mx-auto rounded-xl">
                                <img src={`${import.meta.env.BASE_URL}fptux.png`} />
                            </div>
                        </motion.div>
                        <h1 className="text-2xl font-bold gradient-text mb-2">FPTU-Xperience ClubHub</h1>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Đăng nhập hệ thống quản lý câu lạc bộ FPTU
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div
                            ref={googleButtonRef}
                            className={`flex justify-center min-h-10 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
                            aria-busy={isLoading}
                            aria-label="Đăng nhập bằng Google"
                        />
                        {!GOOGLE_CLIENT_ID && (
                            <p className="text-center text-xs" style={{ color: 'var(--theme-error)' }}>
                                Google Sign-In chưa được cấu hình. Vui lòng đặt VITE_GOOGLE_CLIENT_ID.
                            </p>
                        )}
                        {GOOGLE_CLIENT_ID && !googleReady && (
                            <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Đang tải xác thực Google...
                            </p>
                        )}
                        {isLoading && (
                            <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Đang xác thực tài khoản...
                            </p>
                        )}

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmailLogin((previous) => !previous);
                                    setEmailError('');
                                }}
                                className="text-xs transition-colors hover:underline cursor-pointer"
                                style={{ color: showEmailLogin ? 'var(--theme-accent)' : 'var(--text-muted)' }}
                            >
                                {showEmailLogin ? '← Quay lại đăng nhập bằng Google' : 'Đăng nhập bằng email'}
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {showEmailLogin && (
                                <motion.form
                                    onSubmit={handleEmailSubmit}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-3 pt-4 overflow-hidden"
                                    style={{ borderTop: '1px solid var(--border-color)' }}
                                >
                                    <div>
                                        <label
                                            htmlFor="login-email"
                                            className="block text-xs uppercase tracking-wider mb-2 font-medium"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            Email tài khoản
                                        </label>
                                        <input
                                            id="login-email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(event) => {
                                                setEmail(event.target.value);
                                                setEmailError('');
                                            }}
                                            placeholder="Nhập email của bạn..."
                                            disabled={isLoading}
                                            className="w-full text-white placeholder-gray-500 outline-none transition-all"
                                            style={{
                                                padding: '14px 18px',
                                                fontFamily: 'Inter, sans-serif',
                                                fontSize: '15px',
                                                background: 'var(--theme-input)',
                                                border: '2px solid var(--border-color)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        {emailError && (
                                            <p className="mt-2 text-xs" style={{ color: 'var(--theme-error)' }}>
                                                {emailError}
                                            </p>
                                        )}
                                    </div>
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="cyber-btn cyber-btn-primary w-full py-3 rounded-md"
                                    >
                                        {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
                                    </motion.button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-6 pt-6 text-center"
                        style={{ borderTop: '1px solid var(--border-color)' }}
                    >
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Tài khoản phải nằm trong danh sách được cấp quyền.
                            <br />
                            Nếu chưa có quyền truy cập, vui lòng liên hệ Quản trị viên.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
