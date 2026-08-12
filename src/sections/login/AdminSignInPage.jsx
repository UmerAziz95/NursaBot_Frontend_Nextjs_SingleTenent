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

export default function AdminSignInPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionExpired = searchParams.get('reason') === 'session_expired'
    const [form, setForm] = useState({ email: '', password: '' })
    const [honeypot, setHoneypot] = useState(emptyHoneypot)
    const [captcha, setCaptcha] = useState(null)
    const [captchaKey, setCaptchaKey] = useState(0)
    const [loading, setLoading] = useState(false)

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
                throw new Error(data?.detail || 'Admin sign in failed.')
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
            const message = err?.message || 'Admin sign in failed.'
            toast.error(
                message === 'Failed to fetch'
                    ? 'Cannot reach the API. Make sure Laravel is running on port 8001.'
                    : message
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-section flex min-h-screen items-center px-4 py-10 lg:py-[3.6vw]">
            <div className="wrapper w-full">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-[4vw]">
                    <div className="order-2 w-full lg:order-1">
                        <div className="login-form rounded-2xl p-6 shadow-2xl lg:rounded-[1.5vw] lg:p-[2vw]">
                            <div className="mb-6">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2EAADB]">
                                    Admin portal
                                </p>
                                <h1 className="text-2xl font-bold text-[#053447]">Administrator sign in</h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Sign in to manage businesses, workspaces, users, and plans.
                                </p>
                            </div>

                            <form onSubmit={submit} className="relative space-y-4" autoComplete="on">
                                <HoneypotFields
                                    values={honeypot}
                                    onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                                />

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium">Email address</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={update}
                                        required
                                        className="w-full rounded-lg border border-gray-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#053447]"
                                        placeholder="admin@example.com"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium">Password</span>
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={update}
                                        required
                                        minLength={6}
                                        className="w-full rounded-lg border border-gray-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#053447]"
                                        placeholder="Enter your password"
                                    />
                                </label>

                                <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />

                                <button type="submit" disabled={loading} className="btn-primary min-w-full! py-3 font-bold">
                                    {loading ? 'Signing in…' : 'Sign in as administrator'}
                                </button>

                                <p className="text-center text-xs text-gray-500">
                                    Site user?{' '}
                                    <Link href="/signin" className="font-medium text-[#053447] hover:text-[#2EAADB]">
                                        Go to user sign in
                                    </Link>
                                </p>
                            </form>
                        </div>
                    </div>
                    <div className="order-1 flex w-full items-center justify-center lg:order-2">
                        <Image
                            src="/contact-image.svg"
                            alt="Admin sign in"
                            width={600}
                            height={600}
                            className="h-auto w-full max-w-lg object-contain"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
