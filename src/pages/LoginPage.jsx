import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập thư điện tử hoặc tên đăng nhập.'
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await login(formData.email, formData.password)
      success('Chào mừng bạn quay lại ClubReportHub!')
      navigate('/dashboard')
    } catch (err) {
      error(err.message || 'Thông tin đăng nhập không đúng. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
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
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="login-identifier" className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Thư điện tử hoặc tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  name="email"
                  autoComplete="username"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@club.edu"
                  className="w-full text-white placeholder-gray-500 outline-none transition-all"
                  style={{
                    padding: '14px 18px 14px 3rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '16px',
                    background: 'rgba(10, 10, 15, 0.8)',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--neon-cyan)'
                    e.target.style.boxShadow = '0 0 15px rgba(0, 245, 255, 0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs" style={{ color: '#ff4444' }}>{errors.email}</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="login-password" className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  className="w-full text-white placeholder-gray-500 outline-none transition-all"
                  style={{
                    padding: '14px 18px 14px 3rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '16px',
                    background: 'rgba(10, 10, 15, 0.8)',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--neon-cyan)'
                    e.target.style.boxShadow = '0 0 15px rgba(0, 245, 255, 0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-xs" style={{ color: '#ff4444' }}>{errors.password}</p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              type="submit"
              disabled={isLoading}
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
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-6 text-center"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium" style={{ color: 'var(--neon-cyan)' }}>
                Tạo tài khoản
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Version */}
      </motion.div>
    </div>
  )
}
