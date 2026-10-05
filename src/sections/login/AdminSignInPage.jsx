'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { persistAuthSession } from '@/lib/auth-session'
import { toast } from '@/lib/toast'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import { useAppSettings } from '@/lib/app-settings'
import BrandMark from '@/sections/assistant/BrandMark'
import {
    Activity as ActivityIcon,
    BookOpen as BookOpenIcon,
    Eye as EyeIcon,
    EyeOff as EyeOffIcon,
    Loader2 as LoaderIcon,
    Lock as LockIcon,
    LogIn as LogInIcon,
    Mail as MailIcon,
    ShieldCheck as ShieldCheckIcon,
    Users as UsersIcon,
} from 'lucide-react'
import '@/sections/admin/admin.css'

export default function AdminSignInPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionExpired = searchParams.get('reason') === 'session_expired'
    const [form, setForm] = useState({ email: '', password: '' })
    const [honeypot, setHoneypot] = useState(emptyHoneypot)
    const [captcha, setCaptcha] = useState(null)
    const [captchaKey, setCaptchaKey] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { settings } = useAppSettings()

    useEffect(() => {
        if (sessionExpired) {
            toast.warning('Your session expired. Please sign in again.')
        }
    }, [sessionExpired])

    const update = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const submit = async (event) => {
        event.preventDefault()

        const captchaError = assertCaptchaReady(captcha)
        if (captchaError) {
            toast.error(captchaError)
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/backend/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    ...buildAuthProtectionPayload(honeypot, captcha),
                }),
            })
            const data = await response.json().catch(() => null)
            if (!response.ok) {
                setCaptchaKey((key) => key + 1)
                throw new Error(data?.detail || 'Sign in failed. Please try again.')
            }

            const token = data?.access_token || ''
            const role = data?.role || 'admin'
            persistAuthSession({
                access_token: token,
                expires_at: data?.expires_at,
                expires_in: data?.expires_in,
                role,
                user: {
                    email: form.email,
                    role,
                    business_client_id: data?.business_client_id || null,
                    workspace_id: data?.workspace_id || null,
                },
            })
            if (data?.business_client_id) localStorage.setItem('business_client_id', data.business_client_id)
            if (data?.workspace_id) localStorage.setItem('workspace_id', data.workspace_id)

            router.push('/admin/dashboard')
        } catch (err) {
            toast.error(err?.message || 'Sign in failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="admin-console nba-auth">
            <aside className="nba-auth-brand">
                <div className="nba-auth-brand-glow" aria-hidden="true" />
                <div className="nba-auth-brand-top">
                    <BrandMark size="md" />
                    <div>
                        <div className="nba-auth-brand-name">{settings.site_name || 'nclexium'}</div>
                        <div className="nba-auth-brand-tag">Admin console</div>
                    </div>
                </div>
                <div className="nba-auth-brand-body">
                    <div className="nba-auth-headline">Run your nursing assistant with confidence.</div>
                    <ul className="nba-auth-points">
                        <li><BookOpenIcon className="h-4 w-4" /><span><strong>Curate knowledge</strong>Upload documents and organize workspaces.</span></li>
                        <li><UsersIcon className="h-4 w-4" /><span><strong>Support learners</strong>Manage users, plans and help tickets.</span></li>
                        <li><ActivityIcon className="h-4 w-4" /><span><strong>Stay in control</strong>Monitor usage, errors and system status.</span></li>
                    </ul>
                </div>
                <div className="nba-auth-brand-foot">Restricted area · Authorized staff only</div>
            </aside>

            <main className="nba-auth-main">
                <div className="nba-auth-card">
                    <div className="nba-auth-mobile-brand">
                        <BrandMark size="md" />
                        <span>{settings.site_name || 'nclexium'}</span>
                    </div>
                    <span className="nba-auth-kicker"><ShieldCheckIcon className="h-3.5 w-3.5" />Admin sign in</span>
                    <h1 className="nba-auth-title">Welcome back</h1>
                    <div className="nba-auth-sub">Sign in to manage your workspaces, users and plans.</div>

                    <form onSubmit={submit} className="nba-auth-form" autoComplete="on">
                        <HoneypotFields
                            values={honeypot}
                            onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                        />

                        <label className="nba-auth-field">
                            <span className="admin-label">Email address</span>
                            <span className="nba-auth-input-wrap">
                                <MailIcon className="nba-auth-input-icon h-4 w-4" />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={update}
                                    required
                                    autoComplete="username"
                                    className="admin-input nba-auth-input"
                                    placeholder="you@company.com"
                                />
                            </span>
                        </label>
                        <label className="nba-auth-field">
                            <span className="admin-label">Password</span>
                            <span className="nba-auth-input-wrap">
                                <LockIcon className="nba-auth-input-icon h-4 w-4" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={update}
                                    required
                                    minLength={6}
                                    autoComplete="current-password"
                                    className="admin-input nba-auth-input has-toggle"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="nba-auth-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                </button>
                            </span>
                        </label>

                        <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />

                        <button type="submit" disabled={loading} className="admin-btn-primary nba-auth-submit">
                            {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <LogInIcon className="h-4 w-4" />}
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className="nba-auth-foot">
                        Not an administrator?{' '}
                        <Link href="/signin">Go to the main sign in</Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
