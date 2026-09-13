import { motion } from 'framer-motion'

export default function StatCard({ title, value, change, changeType, icon, color = 'primary', delay = 0 }) {
  const colorVariants = {
    primary: {
      gradient: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      bgHover: 'hover:border-cyan-500/50',
    },
    success: {
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bgHover: 'hover:border-emerald-500/50',
    },
    warning: {
      gradient: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bgHover: 'hover:border-amber-500/50',
    },
    error: {
      gradient: 'from-rose-500/20 to-rose-500/5',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bgHover: 'hover:border-rose-500/50',
    }
  }

  const variant = colorVariants[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative p-5 rounded-xl bg-gradient-to-br ${variant.gradient} border ${variant.border} ${variant.bgHover} transition-all duration-300 cursor-pointer group backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className={`text-3xl lg:text-4xl font-bold ${variant.text}`}>{value}</h3>
        </div>
        {icon && (
          <div className={`p-3 rounded-xl bg-black/20 border border-white/10`}>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
            changeType === 'positive'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {changeType === 'positive' ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {change}
          </span>
          <span className="text-xs text-gray-500">so với tháng trước</span>
        </div>
      )}

      <div className="mt-4 h-12 flex items-end gap-1">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
            className={`flex-1 rounded-t-sm bg-gradient-to-t ${variant.text} opacity-20 group-hover:opacity-40 transition-opacity`}
          />
        ))}
      </div>
    </motion.div>
  )
}
