import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        background: '#f7f6f1',
                        color: '#1e241e',
                        fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '520px',
                            background: '#ffffff',
                            padding: '2.5rem',
                            borderRadius: '16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                            textAlign: 'center',
                            border: '1px solid #e2ded4',
                        }}
                    >
                        <div
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: '#fdf3ef',
                                color: '#d45b2e',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                            }}
                        >
                            <AlertTriangle size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                            Đã xảy ra sự cố không mong muốn
                        </h2>
                        <p style={{ color: '#687265', lineHeight: 1.6, margin: '0 0 1.75rem 0', fontSize: '0.95rem' }}>
                            Trang web gặp trục trặc khi tải giao diện. Bạn hãy thử làm mới lại trang hoặc quay lại trang
                            chủ.
                        </p>
                        {this.state.error?.message && (
                            <pre
                                style={{
                                    background: '#f7f6f1',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    color: '#8c2424',
                                    textAlign: 'left',
                                    overflowX: 'auto',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                {this.state.error.message}
                            </pre>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: '#d45b2e',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '999px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <RotateCcw size={16} /> Tải lại trang
                            </button>
                            <a
                                href="/"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0.75rem 1.5rem',
                                    background: '#f0ede4',
                                    color: '#1e241e',
                                    borderRadius: '999px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                }}
                            >
                                Về trang chủ
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
