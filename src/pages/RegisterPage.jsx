import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateStep = (currentStep) => {
    const newErrors = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Vui lòng nhập họ và tên.'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự.'
      }
      if (!formData.email) {
        newErrors.email = 'Vui lòng nhập địa chỉ thư điện tử.'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Định dạng thư điện tử không hợp lệ.'
      }
    }

    if (currentStep === 2) {
      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu.'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
      } else if (
        !/[A-Z]/.test(formData.password)
        || !/[a-z]/.test(formData.password)
        || !/\d/.test(formData.password)
        || !/[^A-Za-z0-9]/.test(formData.password)
      ) {
        newErrors.password = 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.'
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(2)) return

    setIsLoading(true)
    try {
      await register(formData.email, formData.name, formData.email, formData.password)
      success('Đã tạo tài khoản. Hãy chọn câu lạc bộ và gửi đơn đăng ký thành viên.')
      navigate('/clubs')
    } catch (err) {
      error(err.message || 'Không thể đăng ký. Vui lòng thử lại.')
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
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Registration Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        <div className="cyber-card p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative inline-block mb-4"
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 p-1">
                <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                  <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold gradient-text mb-2">
              Tạo tài khoản
            </h1>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: s <= step ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)',
                      borderColor: s <= step ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.2)'
                    }}
                    className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all"
                    style={{ color: s <= step ? '#000' : 'var(--text-secondary)' }}
                  >
                    {s < step ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s}
                  </motion.div>
                  {s < 2 && (
                    <div
                      className="w-12 h-0.5 mx-1"
                      style={{ background: s < step ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="register-name" className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Họ và tên</label>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn An"
                    className="cyber-input"
                  />
                  {errors.name && <p className="mt-2 text-xs" style={{ color: '#ff4444' }}>{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Địa chỉ thư điện tử</label>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="sinhvien@truong.edu.vn"
                    className="cyber-input"
                  />
                  {errors.email && <p className="mt-2 text-xs" style={{ color: '#ff4444' }}>{errors.email}</p>}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="cyber-btn cyber-btn-primary w-full py-3"
                >
                  Tiếp tục
                </button>
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="register-password" className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Mật khẩu</label>
                  <input
                    id="register-password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 8 ký tự"
                    className="cyber-input"
                  />
                  {errors.password && <p className="mt-2 text-xs" style={{ color: '#ff4444' }}>{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Xác nhận mật khẩu</label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    className="cyber-input"
                  />
                  {errors.confirmPassword && <p className="mt-2 text-xs" style={{ color: '#ff4444' }}>{errors.confirmPassword}</p>}
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Tài khoản mới chưa thuộc câu lạc bộ nào. Sau khi đăng nhập, hãy chọn câu lạc bộ và gửi đơn để chủ nhiệm xét duyệt.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="cyber-btn flex-1 py-3"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="cyber-btn cyber-btn-primary flex-1 py-3"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Đang tạo...
                      </span>
                    ) : 'Tạo tài khoản'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          {/* Footer */}
          <div
            className="mt-6 pt-6 text-center"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium" style={{ color: 'var(--neon-cyan)' }}>
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
