'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import { KeyRound as KeyIcon, Link2Off as LinkIcon, Loader2 as LoaderIcon, Lock as LockIcon, Mail as MailIcon } from 'lucide-react'
import AuthLayout, { AuthField, PasswordInput } from '@/sections/auth/AuthLayout'

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
        <AuthLayout
            title={tokenFromQuery ? 'Choose a new password' : 'Link not valid'}
            subtitle={tokenFromQuery
                ? 'Pick a strong password you haven’t used before.'
                : 'This reset link is invalid or incomplete. Request a new one and use the latest email we send you.'}
            footer={<><Link href="/signin">Back to sign in</Link></>}
        >
            {!tokenFromQuery ? (
                <div className="nbu-state">
                    <span className="nbu-state-icon"><LinkIcon className="h-5 w-5" /></span>
                    <Link href="/forgot-password" className="nbu-submit">Request a new link</Link>
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
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            className="nbu-input"
                            placeholder="you@example.com"
                        />
                    </AuthField>

                    <AuthField label="New password" htmlFor="password" icon={LockIcon} hint="At least 8 characters.">
                        <PasswordInput
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            minLength={8}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                        />
                    </AuthField>

                    <AuthField label="Confirm new password" htmlFor="password_confirmation" icon={LockIcon}>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            minLength={8}
                            autoComplete="new-password"
                            placeholder="Repeat your new password"
                        />
                    </AuthField>

                    <div className="nbu-captcha">
                        <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />
                    </div>

                    <button type="submit" disabled={loading} className="nbu-submit">
                        {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <KeyIcon className="h-4 w-4" />}
                        {loading ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            )}
        </AuthLayout>
    )
}
