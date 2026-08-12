'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailFromQuery = useMemo(() => String(searchParams.get('email') || '').trim(), [searchParams])
    const tokenFromQuery = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams])

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirmation: '',
    })
    const [honeypot, setHoneypot] = useState(emptyHoneypot)
    const [captcha, setCaptcha] = useState(null)
    const [captchaKey, setCaptchaKey] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (emailFromQuery) {
            setFormData((prev) => (prev.email ? prev : { ...prev, email: emailFromQuery }))
        }
    }, [emailFromQuery])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!tokenFromQuery) {
            toast.error('This reset link is missing a token. Request a new one.')
            return
        }

        if (formData.password !== formData.password_confirmation) {
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
            const res = await fetch('/backend/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    token: tokenFromQuery,
                    password: formData.password,
                    password_confirmation: formData.password_confirmation,
                    ...buildAuthProtectionPayload(honeypot, captcha),
                }),
            })

            let data = null
            try {
                data = await res.json()
            } catch {
                data = null
            }

            if (res.ok) {
                toast.success(data?.message || 'Password updated. You can sign in now.')
                router.push('/signin')
                return
            }

            setCaptchaKey((key) => key + 1)
            toast.error((data && (data.detail || data.message || data.error)) || 'Could not reset password')
        } catch (err) {
            setCaptchaKey((key) => key + 1)
            toast.error(err.message || 'Could not reset password')
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
                            <div className="mb-6 lg:mb-[2vw]">
                                <h3 className="mb-2 text-[16px] font-bold lg:mb-[0.5vw] lg:text-[2vw]">
                                    Reset password
                                </h3>
                                <p className="text-[13px] text-gray-600 lg:text-[0.9vw]">
                                    Choose a new password for your account.
                                </p>
                            </div>

                            {!tokenFromQuery ? (
                                <div className="space-y-4">
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900 lg:text-[0.75vw]">
                                        This reset link is invalid or incomplete. Request a new one from the forgot password page.
                                    </p>
                                    <Link
                                        href="/forgot-password"
                                        className="btn-primary block min-w-full! py-3 text-center font-bold lg:py-[0.9vw]"
                                    >
                                        Request reset link
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="relative space-y-4 lg:space-y-[1.5vw]" autoComplete="on">
                                    <HoneypotFields
                                        values={honeypot}
                                        onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                                    />

                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-[13px] font-medium lg:text-[0.8vw]">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-lg border border-gray-400 px-4 py-3 text-[12px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#053447] lg:rounded-[0.8vw] lg:px-[1.2vw] lg:py-[0.8vw] lg:text-[0.75vw]"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="mb-2 block text-[13px] font-medium lg:text-[0.8vw]">
                                            New password
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={8}
                                            className="w-full rounded-lg border border-gray-400 px-4 py-3 text-[12px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#053447] lg:rounded-[0.8vw] lg:px-[1.2vw] lg:py-[0.8vw] lg:text-[0.75vw]"
                                            placeholder="At least 8 characters"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password_confirmation" className="mb-2 block text-[13px] font-medium lg:text-[0.8vw]">
                                            Confirm password
                                        </label>
                                        <input
                                            type="password"
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            value={formData.password_confirmation}
                                            onChange={handleChange}
                                            required
                                            minLength={8}
                                            className="w-full rounded-lg border border-gray-400 px-4 py-3 text-[12px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#053447] lg:rounded-[0.8vw] lg:px-[1.2vw] lg:py-[0.8vw] lg:text-[0.75vw]"
                                            placeholder="Repeat your new password"
                                        />
                                    </div>

                                    <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary block min-w-full! py-3 text-center font-bold lg:py-[0.9vw]"
                                    >
                                        {loading ? 'Updating…' : 'Update password'}
                                    </button>

                                    <div className="text-center text-[12px] text-gray-600 lg:text-[0.75vw]">
                                        <Link href="/signin" className="font-medium text-[#053447] hover:text-[#2EAADB]">
                                            Back to sign in
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="order-1 flex w-full items-center justify-center lg:order-2">
                        <div className="relative w-full max-w-lg lg:max-w-none">
                            <Image
                                src="/contact-image.svg"
                                alt="Reset password illustration"
                                width={600}
                                height={600}
                                className="h-auto w-full object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
