import React, { useState } from 'react'

export default function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  icon,
  className = '',
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {icon}
          </span>
        )}
        <input
          name={name}
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full rounded-xl border border-white/10 bg-slate-900/70 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${icon ? 'pl-10' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute inset-y-0 right-2 grid place-items-center text-slate-400 hover:text-slate-200 px-2"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l1.843 1.843C2.887 6.42 1.9 8.02 1.36 8.96a2.2 2.2 0 0 0 0 2.08C2.69 13.96 6.87 20 12 20c2.044 0 3.926-.74 5.53-1.847l2.94 2.94a.75.75 0 0 0 1.06-1.06l-18-18Zm10.28 12.4a3.75 3.75 0 0 1-4.68-4.68l4.68 4.68Zm-6.28-6.28 2.04 2.04a2.25 2.25 0 0 0 2.8 2.8l2.042 2.041A7.5 7.5 0 0 1 12 18.5c-4.49 0-8.236-5.256-9.302-7.34a.7.7 0 0 1 0-.62c.64-1.155 1.996-3.178 3.832-4.84ZM14.25 9a2.25 2.25 0 0 1 2.25 2.25c0 .205-.03.402-.087.589l2.146 2.146c.44-.468.83-.968 1.17-1.465a.7.7 0 0 0 0-.62C18.236 9.756 14.49 4.5 10 4.5c-.714 0-1.405.132-2.067.366L9.66 6.595c.187-.057.384-.087.589-.087Z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 5.25c-4.49 0-8.236 5.256-9.302 7.34a.7.7 0 0 0 0 .62C3.764 15.294 7.51 20.55 12 20.55s8.236-5.256 9.302-7.34a.7.7 0 0 0 0-.62C20.236 10.506 16.49 5.25 12 5.25Zm0 11.25a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
