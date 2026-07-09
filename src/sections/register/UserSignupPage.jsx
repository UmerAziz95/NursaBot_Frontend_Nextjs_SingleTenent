'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UserSignupPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [accountType, setAccountType] = useState('user')
  const [allowAdmin, setAllowAdmin] = useState(false)
  const [setupChecked, setSetupChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const checkSetup = async () => {
      try {
        const res = await fetch('/api/setup/status', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (cancelled) return
        if (data && data.needs_setup) {
          setAllowAdmin(true)
          setAccountType('admin')
        } else {
          setAllowAdmin(false)
          setAccountType('user')
        }
      } catch (err) {
        // ignore
      }
      if (!cancelled) setSetupChecked(true)
    }

    checkSetup()
    return () => { cancelled = true }
  }, [])

  const handleTypeChange = (type) => {
    setAccountType(type)
    setError(null)
    setSuccess(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setSuccess(null)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      const base = BASE.replace(/\/$/, '')

      const finalAccountType = accountType === 'admin' && allowAdmin ? 'admin' : 'user'
      const endpoint = finalAccountType === 'admin' ? `${base}/api/admin/auth/create-admin` : `${base}/api/admin/auth/user-signup`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        }),
      })

      let data = null
      try {
        data = await res.json()
      } catch (_) {
        // ignore non-json
      }

      if (res.ok) {
        if (accountType === 'admin') {
          setSuccess((data && (data.message || data.detail)) || 'Admin account created! Please log in.')
          setFormData({ username: '', email: '', password: '', confirmPassword: '' })
        } else {
          try {
            const loginRes = await fetch(`${base}/api/admin/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ email: formData.email, password: formData.password }),
            })
            const loginData = await loginRes.json().catch(() => null)
            if (loginRes.ok && loginData) {
              const token = loginData.access_token || loginData.token || null
              if (token) localStorage.setItem('token', token)
              if (loginData.business_client_id) localStorage.setItem('business_client_id', loginData.business_client_id)
              if (loginData.workspace_id) localStorage.setItem('workspace_id', loginData.workspace_id)
              if (loginData.role) localStorage.setItem('role', loginData.role)
            }
          } catch (_) {
            // continue even if auto-login fails
          }

          setSuccess('Account created! Redirecting…')
          setTimeout(() => router.push('/assistant'), 800)
        }
        return
      }

      setError((data && (data.message || data.detail || data.error)) || 'Registration failed')
    } catch (err) {
      setError(err.message || 'Registration error')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = accountType === 'admin'
  if (!setupChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#053447] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
      <div className="wrapper w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[4vw] items-center">
          <div className="w-full order-2 lg:order-1">
            <div className="login-form rounded-2xl lg:rounded-[1.5vw] shadow-2xl p-6 lg:p-[2vw]">
              <div className="mb-6 lg:mb-[2vw]">
                <h3 className="mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Create Account</h3>
                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">{isAdmin ? 'Set up a new admin account to manage your workspace' : 'Sign up to get started'}</p>
              </div>

              {allowAdmin ? (
                <div className="mb-4">
                  <div className="rounded-lg lg:rounded-[0.6vw] border border-gray-300 overflow-hidden mb-3">
                    <button type="button" className={`w-full py-3 text-[14px] font-semibold bg-[#053447] text-white`}>Admin Account</button>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">This is the initial setup — creating this account will make it the workspace admin.</p>
                </div>
              ) : (
                <>
                  <div className="flex rounded-lg lg:rounded-[0.6vw] border border-gray-300 overflow-hidden mb-5 lg:mb-[1.5vw]">
                    <button type="button" onClick={() => handleTypeChange('user')} className={`flex-1 py-2 lg:py-[0.6vw] text-[12px] lg:text-[0.8vw] font-semibold transition-colors ${!isAdmin ? 'bg-[#053447] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      User Account
                    </button>
                    <button type="button" onClick={() => { if (allowAdmin) handleTypeChange('admin') }} disabled={!allowAdmin} className={`flex-1 py-2 lg:py-[0.6vw] text-[12px] lg:text-[0.8vw] font-semibold transition-colors ${isAdmin ? 'bg-[#053447] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} ${!allowAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      Admin Account
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Admin account creation is disabled after initial setup.</p>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                <div>
                  <label htmlFor="username" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Username</label>
                  <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="Your name" />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="your.email@example.com" />
                </div>

                <div>
                  <label htmlFor="password" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Password</label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="Enter your password" />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Confirm Password</label>
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="Repeat your password" />
                </div>

                {error && <div className="text-red-600 text-[12px] lg:text-[0.75vw] mb-2">{error}</div>}
                {success && <div className="text-green-700 text-[12px] lg:text-[0.75vw] mb-2">{success}</div>}

                <div className="w-full">
                  <button type="submit" disabled={loading} className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold">{loading ? 'Creating account…' : isAdmin ? 'Create Admin Account' : 'Sign Up'}</button>
                </div>

                {!allowAdmin && (
                  <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">Already have an account?{' '}<Link href="/login" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">Login</Link></div>
                )}
              </form>
            </div>
          </div>

          <div className="w-full order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              <Image src="/contact-image.svg" alt="Sign up illustration" width={600} height={600} className="w-full h-auto object-contain" priority />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
