'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check as CheckIcon,
  Loader2 as LoaderIcon,
  Lock as LockIcon,
  Mail as MailIcon,
  UserPlus as UserPlusIcon,
  UserRound as UserIcon,
  Wrench as WrenchIcon,
  X as XIcon,
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { persistAuthSession } from '@/lib/auth-session'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import { useAppSettings } from '@/lib/app-settings'
import AuthLayout, { AuthField, PasswordInput } from '@/sections/auth/AuthLayout'

// Google sign-in isn't wired up yet; flip to true once it is.
const SHOW_GOOGLE_SIGNIN = false

// Matches the backend rule (min 6); the meter nudges toward stronger passwords.
const PASSWORD_MIN = 6

const passwordStrength = (value) => {
  if (!value) return { score: 0, label: '' }
  if (value.length < PASSWORD_MIN) return { score: 0, label: 'Too short' }
  let score = 1
  if (value.length >= 10) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1
  return { score, label: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score] }
}

export default function UserSignupPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [honeypot, setHoneypot] = useState(emptyHoneypot)
  const [captcha, setCaptcha] = useState(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { settings, loading: settingsLoading } = useAppSettings()
  const siteName = settings.site_name || 'NursingAI'

  const strength = passwordStrength(formData.password)
  const confirmTouched = formData.confirmPassword.length > 0
  const passwordsMatch = confirmTouched && formData.password === formData.confirmPassword

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (formData.username.trim().length < 2) next.username = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) next.email = 'Please enter a valid email address.'
    if (formData.password.length < PASSWORD_MIN) next.password = `Use at least ${PASSWORD_MIN} characters.`
    if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    if (!agreed) next.agreed = 'Please accept the Terms and Privacy Policy to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

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
      <AuthLayout title="Create your account" subtitle="Loading…">
        <div className="space-y-3 pt-2">
          <span className="nbu-skel h-11 w-full" />
          <span className="nbu-skel h-11 w-full" />
          <span className="nbu-skel h-11 w-full" />
        </div>
      </AuthLayout>
    )
  }

  if (settings.maintenance_mode || !settings.user_signup_enabled) {
    return (
      <AuthLayout
        title={settings.maintenance_mode ? 'We’ll be right back' : 'Sign-ups are closed'}
        subtitle={settings.maintenance_mode
          ? (settings.maintenance_message || 'We are performing scheduled maintenance. Please try again soon.')
          : 'New accounts are not being created right now. If you already have an account, you can sign in.'}
      >
        <div className="nbu-state">
          <span className="nbu-state-icon"><WrenchIcon className="h-5 w-5" /></span>
          <Link href="/signin" className="nbu-submit">Go to sign in</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={`Join ${siteName} and start studying in minutes.`}
      footer={<>Already have an account? <Link href="/signin">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="nbu-form" autoComplete="on" noValidate>
        <HoneypotFields
          values={honeypot}
          onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
        />

        <AuthField label="Full name" htmlFor="username" icon={UserIcon} error={errors.username}>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            maxLength={120}
            autoComplete="name"
            className="nbu-input"
            placeholder="Your name"
          />
        </AuthField>

        <AuthField label="Email address" htmlFor="email" icon={MailIcon} error={errors.email}>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="nbu-input"
            placeholder="you@example.com"
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="password"
          icon={LockIcon}
          error={errors.password}
          trailing={strength.label ? <span className={`nbu-strength-label is-${strength.score}`}>{strength.label}</span> : null}
        >
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            placeholder={`At least ${PASSWORD_MIN} characters`}
          />
        </AuthField>
        <div className="nbu-strength" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={formData.password && strength.score >= step ? `is-on is-${strength.score}` : ''} />
          ))}
        </div>

        <AuthField
          label="Confirm password"
          htmlFor="confirmPassword"
          icon={LockIcon}
          error={errors.confirmPassword}
          trailing={confirmTouched ? (
            passwordsMatch
              ? <span className="nbu-match is-ok"><CheckIcon className="h-3 w-3" /> Matches</span>
              : <span className="nbu-match is-bad"><XIcon className="h-3 w-3" /> Doesn&apos;t match</span>
          ) : null}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            placeholder="Repeat your password"
          />
        </AuthField>

        <div className="nbu-captcha">
          <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />
        </div>

        <label className="nbu-check is-top">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: undefined }))
            }}
          />
          <span>
            I agree to the <Link href="/terms" target="_blank">Terms of Service</Link> and{' '}
            <Link href="/privacy" target="_blank">Privacy Policy</Link>.
          </span>
        </label>
        {errors.agreed && <div className="nbu-error" role="alert">{errors.agreed}</div>}

        <button type="submit" disabled={loading} className="nbu-submit">
          {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <UserPlusIcon className="h-4 w-4" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        {SHOW_GOOGLE_SIGNIN && (
          <>
            <div className="nbu-divider"><span>Or continue with</span></div>
            <button type="button" className="nbu-oauth">
              <img src="/google.svg" alt="" className="h-5 w-5" />
              Continue with Google
            </button>
          </>
        )}
      </form>
    </AuthLayout>
  )
}
