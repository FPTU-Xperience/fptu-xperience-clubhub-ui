import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const { success, error } = useToast()
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors({})
    }
  }

  const validate = () => {
    const newErrors = {}
    const trimmed = email.trim()
    if (!trimmed) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      newErrors.email = 'Định dạng email không hợp lệ.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await login(email.trim())
      success('Chào mừng bạn quay lại ClubReportHub!')
      navigate('/dashboard')
    } catch (err) {
      error(err.message || 'Bạn không có quyền truy cập.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowEmailLogin(true)
        }
      })
    } else {
      setShowEmailLogin(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative w-full max-w-md"
      >
        <div className="cyber-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative inline-block mb-4"
            >
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 p-1">
                <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                  <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold gradient-text mb-2"
            >
              ClubReportHub
            </motion.h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Đăng nhập hệ thống quản lý câu lạc bộ FPTU
            </p>
          </div>

          {/* Login Actions */}
          <div className="space-y-4">
            {/* Google Sign-in Button */}
            <motion.button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-lg font-medium text-sm transition-all cursor-pointer"
              style={{
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.18)'
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </motion.button>

            {/* Small text to toggle other login methods */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailLogin(prev => !prev)
                  setErrors({})
                }}
                className="text-xs transition-colors hover:underline cursor-pointer"
                style={{ color: showEmailLogin ? 'var(--theme-accent)' : 'var(--text-muted)' }}
              >
                {showEmailLogin ? '← Quay lại đăng nhập bằng Google' : 'Đăng nhập bằng cách khác'}
              </button>
            </div>

            {/* Collapsible Email Input Form */}
            <AnimatePresence>
              {showEmailLogin && (
                <motion.form
                  onSubmit={handleEmailSubmit}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-4 overflow-hidden"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <div>
                    <label htmlFor="login-email" className="block text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Email tài khoản
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input
                        id="login-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={handleChange}
                        placeholder="Nhập email của bạn..."
                        className="w-full text-white placeholder-gray-500 outline-none transition-all"
                        style={{
                          padding: '14px 18px 14px 3rem',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          background: 'var(--theme-input)',
                          border: '2px solid var(--border-color)',
                          borderRadius: '8px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--theme-accent)'
                          e.target.style.boxShadow = 'var(--theme-focus-shadow)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-color)'
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-xs" style={{ color: 'var(--theme-error)' }}>{errors.email}</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="cyber-btn cyber-btn-primary w-full py-3"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang xác thực...
                      </span>
                    ) : (
                      <span>Đăng nhập</span>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 pt-6 text-center"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Hệ thống xác thực theo danh sách cấp quyền của nhà trường.<br />
              Nếu chưa có quyền truy cập, vui lòng liên hệ Quản trị viên.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
