'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { persistAuthSession } from '@/lib/auth-session'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import { useAppSettings } from '@/lib/app-settings'

export default function UserSignupPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [honeypot, setHoneypot] = useState(emptyHoneypot)
  const [captcha, setCaptcha] = useState(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { settings, loading: settingsLoading } = useAppSettings()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    const captchaError = assertCaptchaReady(captcha)
    if (captchaError) {
      toast.error(captchaError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/backend/api/admin/auth/user-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          ...buildAuthProtectionPayload(honeypot, captcha),
        }),
      })

      let data = null
      try {
        data = await res.json()
      } catch (_) {
        // ignore non-json
      }

      if (res.ok) {
          try {
            const loginRes = await fetch('/backend/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                email: formData.email,
                password: formData.password,
                signup_ticket: data?.signup_ticket || undefined,
                website: '',
                company_url: '',
                fax_number: '',
              }),
            })
            const loginData = await loginRes.json().catch(() => null)
            if (loginRes.ok && loginData) {
              const token = loginData.session?.access_token || loginData.access_token || loginData.token || null
              const apiUser = loginData.user || {}
              const businessClientId = apiUser.business_client_id || data.business_client_id || ''
              const workspaceId = apiUser.workspace_id || data.workspace_id || ''
              const role = apiUser.role || data.role || 'user'
              const session = loginData.session || (token ? { access_token: token } : null)

              persistAuthSession({
                access_token: token,
                expires_at: session?.expires_at,
                expires_in: session?.expires_in,
                role,
                user: {
                  ...apiUser,
                  email: apiUser.email || formData.email,
                  role,
                  business_client_id: businessClientId || apiUser.business_client_id,
                  workspace_id: workspaceId || apiUser.workspace_id,
                },
                session,
              })

              if (businessClientId) {
                try { localStorage.setItem('business_client_id', businessClientId) } catch (_) { /* ignore */ }
              }
              if (workspaceId) {
                try { localStorage.setItem('workspace_id', workspaceId) } catch (_) { /* ignore */ }
              }
              if (loginData.subscription) {
                try { localStorage.setItem('subscription', JSON.stringify(loginData.subscription)) } catch (_) { /* ignore */ }
              }
              try { localStorage.removeItem('api_chat_defaults') } catch (_) { /* ignore */ }

              toast.success('Account created! Redirecting…')
              setTimeout(() => {
                router.push(
                  loginData?.requires_plan
                    ? (loginData?.requires_reactivation ? '/plans?reason=expired' : '/plans')
                    : '/assistant'
                )
              }, 800)
              return
            }
          } catch (_) {
            // fall through to sign-in redirect
          }

          toast.success('Account created! Please sign in.')
          setTimeout(() => router.push('/signin'), 800)
        return
      }

      setCaptchaKey((key) => key + 1)
      toast.error((data && (data.message || data.detail || data.error)) || 'Registration failed')
    } catch (err) {
      setCaptchaKey((key) => key + 1)
      toast.error(err.message || 'Registration error')
    } finally {
      setLoading(false)
    }
  }

  if (settingsLoading) {
    return (
      <div className="login-section min-h-screen flex items-center justify-center px-4 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (settings.maintenance_mode || !settings.user_signup_enabled) {
    return (
      <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
        <div className="wrapper w-full max-w-lg mx-auto">
          <div className="login-form rounded-2xl shadow-2xl p-6 lg:p-8 text-center">
            <h3 className="mb-2 text-[16px] lg:text-xl font-bold">
              {settings.maintenance_mode ? 'Maintenance in progress' : 'Registration closed'}
            </h3>
            <p className="text-gray-600 text-sm">
              {settings.maintenance_mode
                ? (settings.maintenance_message || 'Please try again soon.')
                : 'New user registration is currently disabled. Please sign in if you already have an account.'}
            </p>
            <Link href="/signin" className="mt-5 inline-flex h-9 items-center justify-center rounded-full bg-[#053447] px-4 text-sm font-semibold text-white">
              Sign in
            </Link>
          </div>
        </div>
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
                <Link href="/" className="mb-3 inline-block text-[12px] text-[#053447] hover:text-[#2EAADB] lg:mb-[0.8vw] lg:text-[0.75vw]">
                  ← Back to home
                </Link>
                <h3 className="mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Create Account</h3>
                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">Create your site-user account to get started</p>
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-4 lg:space-y-[1.5vw]" autoComplete="on">
                <HoneypotFields
                  values={honeypot}
                  onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                />

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

                <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />

                <div className="w-full">
                  <button type="submit" disabled={loading} className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold">{loading ? 'Creating account…' : 'Sign Up'}</button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-400" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-gray-500 backdrop-blur-sm text-[12px] lg:text-[0.75vw]">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 px-4 lg:px-[1.5vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] hover:bg-gray-50 transition-colors"
                >
                  <img src="/google.svg" alt="Google" className="w-5 h-5 lg:w-[1.2vw] lg:h-[1.2vw]" />
                  <span className="text-[12px] lg:text-[0.75vw] font-medium">Continue with Google</span>
                </button>

                <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">Already have a user account?{' '}<Link href="/signin" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">Sign in</Link></div>
                <div className="text-center text-[11px] text-gray-500">Administrator? <Link href="/admin/signin" className="font-medium text-[#053447] hover:text-[#2EAADB]">Admin sign in</Link></div>
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
