import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-8 py-4 rounded-full border-none font-semibold transition-all duration-300'

  const variants = {
    primary: 'bg-secondary text-neutral-950 hover:bg-orange-500',
    secondary: 'bg-neutral-900 hover:bg-neutral-800 text-white',
    outline:
      'bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-neutral-950',
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
