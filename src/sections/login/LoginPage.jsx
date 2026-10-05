'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { persistAuthSession } from '@/lib/auth-session'
import { toast } from '@/lib/toast'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'

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

    useEffect(() => {
        if (sessionExpired) {
            toast.warning('Your session expired. Please sign in again.')
        }
    }, [sessionExpired])

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
        <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
            <div className="wrapper w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[4vw] items-center">
                    <div className="w-full order-2 lg:order-1">
                        <div className="login-form rounded-2xl lg:rounded-[1.5vw] shadow-2xl p-6 lg:p-[2vw]">
                            <div className="mb-6 lg:mb-[2vw]">
                                <Link href="/" className="mb-3 inline-block text-[12px] text-[#053447] hover:text-[#2EAADB] lg:mb-[0.8vw] lg:text-[0.75vw]">
                                    ← Back to home
                                </Link>
                                <h3 className="mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Welcome Back</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                                    Sign in to continue to your account
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="relative space-y-4 lg:space-y-[1.5vw]" autoComplete="on">
                                <HoneypotFields
                                    values={honeypot}
                                    onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                                />

                                <div>
                                    <label htmlFor="email" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="Enter your password"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <label
                                        htmlFor="rememberMe"
                                        className="inline-flex cursor-pointer items-center gap-2 select-none"
                                    >
                                        <input
                                            type="checkbox"
                                            id="rememberMe"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                            className="h-4 w-4 shrink-0 rounded border-gray-400 text-[#053447] accent-[#053447] focus:ring-2 focus:ring-[#053447]/30"
                                        />
                                        <span className="text-[12px] leading-none text-gray-700 lg:text-[0.75vw]">
                                            Remember me
                                        </span>
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-[12px] leading-none text-[#053447] transition-colors hover:text-[#2EAADB] lg:text-[0.75vw]"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />

                                <div className="w-full">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-400"></div>
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

                                <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">
                                        Sign up
                                    </Link>
                                </div>
                                <div className="text-center text-[11px] text-gray-500">
                                    Administrator?{' '}
                                    <Link href="/admin/signin" className="font-medium text-[#053447] hover:text-[#2EAADB]">
                                        Admin sign in
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none">
                            <Image
                                src="/contact-image.svg"
                                alt="Login illustration"
                                width={600}
                                height={600}
                                className="w-full h-auto object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
