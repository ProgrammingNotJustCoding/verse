import React, { useState } from 'react'
import { FaGithub, FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

import Button from '../common/Button'
import Input from '../common/Input'
import {
  signUp,
  login,
  isAuthError,
  getAuthErrorMessage,
  type SignUpData,
  type LoginData,
} from '../../services/auth.service'
import { signUpValidator, loginValidator } from '../../validators/auth.validators'
import { useUserStore } from '../../store/users'
import { useValidate } from '../../hooks/useValidate'

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useUserStore(state => state.setUser)

  const validator = isSignUp ? signUpValidator : loginValidator

  const { validateField, validateForm } = useValidate(validator, setErrors, isSignUp, formData)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    validateField(e.target.name as 'name' | 'email' | 'password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix the errors!', { style: { background: '#171717', color: '#ff8800' } })
      return
    }
    setLoading(true)
    try {
      const authData = isSignUp
        ? ({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          } as SignUpData)
        : ({ email: formData.email, password: formData.password } as LoginData)

      const res = isSignUp
        ? await signUp(authData as SignUpData)
        : await login(authData as LoginData)

      if (isAuthError(res)) {
        const errorMessage = getAuthErrorMessage(res)
        toast.error(errorMessage, { style: { background: '#171717', color: '#ff8800' } })
      } else if (res.data?.token) {
        
        setUser({ id: 0, name: formData.name, email: formData.email })
        toast.success('Success!', { style: { background: '#171717', color: '#00ff00' } })
        navigate('/dash')
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('Something went wrong!', { style: { background: '#171717', color: '#ff8800' } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full bg-neutral-950 p-12 flex flex-col justify-center">
      <Toaster position="top-center" />
      <div className="max-w-md w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400 font-light">
            {isSignUp
              ? 'Sign up to start transforming your meetings'
              : 'Sign in to continue to Verse'}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-3 px-6 py-3"
          >
            <FaGithub size={20} />
            Continue with GitHub
          </Button>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-3 px-6 py-3"
          >
            <FaGoogle size={20} />
            Continue with Google
          </Button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-neutral-950 text-gray-400">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="pl-12"
                required
                onBlur={() => validateField('name')}
              />
              {errors.name && <p className="text-xs text-orange-500 mt-1">{errors.name}</p>}
            </div>
          )}

          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="pl-12"
              required
              onBlur={() => validateField('email')}
            />
            {errors.email && <p className="text-xs text-orange-500 mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="pl-12"
              required
              onBlur={() => validateField('password')}
            />
            {errors.password && <p className="text-xs text-orange-500 mt-1">{errors.password}</p>}
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <a
                href="#"
                className="text-sm text-secondary hover:text-orange-500 transition-colors"
              >
                Forgot password?
              </a>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 font-light">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-secondary hover:text-orange-500 font-normal transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {isSignUp && (
          <p className="mt-6 text-center text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <a href="#" className="text-secondary hover:text-orange-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-secondary hover:text-orange-500">
              Privacy Policy
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthForm
