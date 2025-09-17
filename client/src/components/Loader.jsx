import React from 'react'

export default function Loader({ label = 'Loading' }) {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>
        </div>
        <div className="text-slate-300 font-medium">
          {label}
          <span className="inline-flex w-10">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-150">.</span>
            <span className="animate-bounce delay-300">.</span>
          </span>
        </div>
        <div className="text-xs text-slate-500">Please wait while we fetch your data</div>
      </div>
    </div>
  )
}
