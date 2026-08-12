'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [honeypot, setHoneypot] = useState(emptyHoneypot)
    const [captcha, setCaptcha] = useState(null)
    const [captchaKey, setCaptchaKey] = useState(0)
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        const captchaError = assertCaptchaReady(captcha)
        if (captchaError) {
            toast.error(captchaError)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/backend/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
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
                setSent(true)
                toast.success(data?.message || 'If an account exists, a reset link has been sent.')
                return
            }

            setCaptchaKey((key) => key + 1)
            toast.error((data && (data.detail || data.message || data.error)) || 'Could not send reset email')
        } catch (err) {
            setCaptchaKey((key) => key + 1)
            toast.error(err.message || 'Could not send reset email')
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
                                    Forgot password
                                </h3>
                                <p className="text-[13px] text-gray-600 lg:text-[0.9vw]">
                                    Enter your email and we&apos;ll send a reset link if an account exists.
                                </p>
                            </div>

                            {sent ? (
                                <div className="space-y-4 lg:space-y-[1.5vw]">
                                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800 lg:text-[0.75vw]">
                                        Check your inbox for a password reset link. It expires in 60 minutes.
                                    </p>
                                    <Link
                                        href="/signin"
                                        className="btn-primary block min-w-full! py-3 text-center font-bold lg:py-[0.9vw]"
                                    >
                                        Back to sign in
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
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-gray-400 px-4 py-3 text-[12px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#053447] lg:rounded-[0.8vw] lg:px-[1.2vw] lg:py-[0.8vw] lg:text-[0.75vw]"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary block min-w-full! py-3 text-center font-bold lg:py-[0.9vw]"
                                    >
                                        {loading ? 'Sending…' : 'Send reset link'}
                                    </button>

                                    <div className="text-center text-[12px] text-gray-600 lg:text-[0.75vw]">
                                        Remembered your password?{' '}
                                        <Link href="/signin" className="font-medium text-[#053447] hover:text-[#2EAADB]">
                                            Sign in
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
                                alt="Forgot password illustration"
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
