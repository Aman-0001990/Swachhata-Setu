import React, { useState } from 'react'

export default function ImageWithFallback({ src, alt = '', className = '', onClick }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900/60 border border-white/10 text-slate-400 ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        No image
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setError(true)}
    />
  )
}
