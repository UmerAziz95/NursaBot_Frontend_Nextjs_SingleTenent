'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import { Loader2 as LoaderIcon, Mail as MailIcon, MailCheck as MailCheckIcon, Send as SendIcon } from 'lucide-react'
import AuthLayout, { AuthField } from '@/sections/auth/AuthLayout'

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
        <AuthLayout
            title={sent ? 'Check your inbox' : 'Reset your password'}
            subtitle={sent
                ? 'If an account exists for that email, a reset link is on its way. The link expires in 60 minutes.'
                : 'Enter your email and we’ll send you a link to choose a new password.'}
            footer={<>Remembered it? <Link href="/signin">Back to sign in</Link></>}
        >
            {sent ? (
                <div className="nbu-state">
                    <span className="nbu-state-icon is-success"><MailCheckIcon className="h-5 w-5" /></span>
                    <p className="nbu-state-text">Didn&apos;t get it? Check your spam folder, or try again in a few minutes.</p>
                    <Link href="/signin" className="nbu-submit">Back to sign in</Link>
                </div>
            ) : (
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="nbu-input"
                            placeholder="you@example.com"
                        />
                    </AuthField>

                    <div className="nbu-captcha">
                        <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />
                    </div>

                    <button type="submit" disabled={loading} className="nbu-submit">
                        {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
                        {loading ? 'Sending…' : 'Send reset link'}
                    </button>
                </form>
            )}
        </AuthLayout>
    )
}
