'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock as ClockIcon, Loader2 as LoaderIcon, Lock as LockIcon, LogIn as LogInIcon, Mail as MailIcon } from 'lucide-react'
import { persistAuthSession } from '@/lib/auth-session'
import { toast } from '@/lib/toast'
import { useAppSettings } from '@/lib/app-settings'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import AuthLayout, { AuthField, PasswordInput } from '@/sections/auth/AuthLayout'

// Google sign-in isn't wired up yet; flip to true once it is.
const SHOW_GOOGLE_SIGNIN = false

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    })
    const [honeypot, setHoneypot] = useState(emptyHoneypot)
    const [captcha, setCaptcha] = useState(null)
    const [captchaKey, setCaptchaKey] = useState(0)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionExpired = searchParams.get('reason') === 'session_expired'
    const { settings } = useAppSettings()
    const signupEnabled = !settings.maintenance_mode && settings.user_signup_enabled

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const captchaError = assertCaptchaReady(captcha)
        if (captchaError) {
            toast.error(captchaError)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/backend/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    remember: formData.rememberMe,
                    ...buildAuthProtectionPayload(honeypot, captcha),
                })
            })

            let data = null
            try { data = await res.json() } catch (e) { /* non-json response */ }

            if (res.ok) {
                const token = (data && (data.token || data.access_token || (data.session && data.session.access_token))) || null
                const session = data?.session || (token ? { access_token: token } : null)

                persistAuthSession({
                    access_token: token,
                    expires_at: session?.expires_at,
                    expires_in: session?.expires_in,
                    role: data?.user?.role,
                    user: data?.user || null,
                    session,
                })

                if (data?.user?.business_client_id) {
                    try { localStorage.setItem('business_client_id', data.user.business_client_id) } catch (e) { /* ignore */ }
                }
                if (data?.user?.workspace_id) {
                    try { localStorage.setItem('workspace_id', data.user.workspace_id) } catch (e) { /* ignore */ }
                }
                if (String(data?.user?.role || '').toLowerCase() === 'user') {
                    try { localStorage.removeItem('api_chat_defaults') } catch (e) { /* ignore */ }
                }
                if (data?.subscription) {
                    try { localStorage.setItem('subscription', JSON.stringify(data.subscription)) } catch (e) { /* ignore */ }
                }

                router.push(
                    data?.requires_plan
                        ? (data?.requires_reactivation ? '/plans?reason=expired' : '/plans')
                        : '/assistant'
                )
                return
            }

            setCaptchaKey((key) => key + 1)
            toast.error((data && (data.detail || data.message || data.error)) || 'Login failed')
        } catch (err) {
            setCaptchaKey((key) => key + 1)
            toast.error(err.message || 'Login error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to continue your studies."
            footer={signupEnabled ? (
                <>New here? <Link href="/signup">Create an account</Link></>
            ) : null}
        >
            {sessionExpired && (
                <div className="nbu-notice" role="status">
                    <ClockIcon className="h-4 w-4 shrink-0" />
                    Your session expired. Please sign in again.
                </div>
            )}

            <form onSubmit={handleSubmit} className="nbu-form" autoComplete="on">
                <HoneypotFields
                    values={honeypot}
                    onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                />

                <AuthField label="Email address" htmlFor="email" icon={MailIcon}>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                        className="nbu-input"
                        placeholder="you@example.com"
                    />
                </AuthField>

                <AuthField
                    label="Password"
                    htmlFor="password"
                    icon={LockIcon}
                    trailing={<Link href="/forgot-password" className="nbu-link-sm">Forgot password?</Link>}
                >
                    <PasswordInput
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                    />
                </AuthField>

                <label htmlFor="rememberMe" className="nbu-check">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                    />
                    <span>Keep me signed in</span>
                </label>

                <div className="nbu-captcha">
                    <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />
                </div>

                <button type="submit" disabled={loading} className="nbu-submit">
                    {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <LogInIcon className="h-4 w-4" />}
                    {loading ? 'Signing in…' : 'Sign in'}
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
