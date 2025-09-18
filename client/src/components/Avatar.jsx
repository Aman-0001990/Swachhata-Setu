import React from 'react'

export default function Avatar({ name = '', seed = '', size = 32, className = '' }) {
  const initials = String(name || '').trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()).join('') || 'U'
  const s = Number(size)
  // Use a free avatar generator; falls back to initials if network blocks
  const src = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(seed || name || initials)}&radius=50&backgroundType=gradientLinear`
  return (
    <div className={`relative inline-flex items-center ${className}`} style={{ width: s, height: s }}>
      <img
        src={src}
        alt={name || 'avatar'}
        width={s}
        height={s}
        className="rounded-full border border-white/10 shadow-sm object-cover transition-transform duration-300 ease-out hover:scale-[1.05]"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          const fallback = e.currentTarget.nextSibling
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <div
        className="hidden rounded-full border border-white/10 bg-slate-800 text-slate-200 text-xs font-semibold items-center justify-center"
        style={{ width: s, height: s }}
        aria-hidden
      >
        {initials}
      </div>
    </div>
  )
}
