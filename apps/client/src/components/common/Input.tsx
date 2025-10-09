import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-gray-300 text-sm font-medium mb-2">{label}</label>}
      <input
        className={`w-full px-4 py-3 bg-neutral-900 border-none rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary transition-all ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}

export default Input
