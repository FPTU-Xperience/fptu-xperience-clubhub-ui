import { useMemo, useState } from 'react'

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function isBlockedLogoUrl(value) {
  if (!value) return true
  try {
    const url = new URL(value, globalThis.location?.origin || 'http://localhost')
    return url.hostname === 'storage.local'
  } catch {
    return true
  }
}

export default function ClubLogo({ name, logoUrl, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const initials = useMemo(() => getInitials(name), [name])

  if (!isBlockedLogoUrl(logoUrl) && failedUrl !== logoUrl) {
    return (
      <span className={`block overflow-hidden ${className}`}>
        <img
          src={logoUrl}
          alt={`Logo ${name || 'câu lạc bộ'}`}
          onError={() => setFailedUrl(logoUrl)}
          className="block h-full w-full object-cover"
        />
      </span>
    )
  }

  return (
    <div
      role="img"
      aria-label={`Logo ${name || 'câu lạc bộ'}`}
      className={`flex items-center justify-center border border-cyan-500/30 bg-slate-800 text-sm font-bold text-cyan-300 ${className}`}
    >
      {initials}
    </div>
  )
}
