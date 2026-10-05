'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    CheckCircle2 as CheckCircleIcon,
    Loader2 as LoaderIcon,
    Mail as MailIcon,
    MessageSquareText as MessageIcon,
    Send as SendIcon,
} from 'lucide-react'
import { useAppSettings } from '@/lib/app-settings'
import { toast } from '@/lib/toast'
import { userFacingError } from '@/lib/user-facing-error'
import HoneypotFields, { emptyHoneypot } from '@/components/auth/HoneypotFields'
import CaptchaWidget from '@/components/auth/CaptchaWidget'
import { assertCaptchaReady, buildAuthProtectionPayload } from '@/lib/auth-protection'
import SectionHeading from '@/sections/home/SectionHeading'

const MESSAGE_MAX = 5000
const EMPTY_FORM = { name: '', email: '', subject: '', message: '', consent: false }

export default function ContactSection() {
    const { settings } = useAppSettings()
    const supportEmail = String(settings.support_email || '').trim()
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const [honeypot, setHoneypot] = useState(emptyHoneypot)
    const [captcha, setCaptcha] = useState(null)
    const [captchaKey, setCaptchaKey] = useState(0)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const update = (event) => {
        const { name, value, type, checked } = event.target
        setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
    }

    const validate = () => {
        const next = {}
        if (form.name.trim().length < 2) next.name = 'Please enter your name.'
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Please enter a valid email address.'
        if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters.'
        if (!form.consent) next.consent = 'Please agree so we can reply to you.'
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const submit = async (event) => {
        event.preventDefault()
        if (!validate()) return

        const captchaError = assertCaptchaReady(captcha)
        if (captchaError) {
            toast.error(captchaError)
            return
        }

        setSending(true)
        try {
            const res = await fetch('/backend/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    subject: form.subject.trim() || null,
                    message: form.message.trim(),
                    ...buildAuthProtectionPayload(honeypot, captcha),
                }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                setCaptchaKey((key) => key + 1)
                const fieldErrors = data?.context?.errors || data?.details?.errors || data?.errors
                if (fieldErrors && typeof fieldErrors === 'object') {
                    const mapped = {}
                    Object.entries(fieldErrors).forEach(([field, messages]) => {
                        mapped[field] = userFacingError(Array.isArray(messages) ? messages[0] : messages, 'Please check this field.')
                    })
                    setErrors(mapped)
                }
                if (res.status === 429) {
                    throw new Error('You have sent several messages in a short time. Please wait a minute and try again.')
                }
                throw new Error(data?.detail || data?.message || 'We could not send your message. Please try again.')
            }
            setSent(true)
            setForm(EMPTY_FORM)
        } catch (err) {
            toast.error(userFacingError(err?.message, 'We could not send your message. Please try again.'))
        } finally {
            setSending(false)
        }
    }

    return (
        <section className="nbl-section is-tinted" id="contact">
            <div className="nbl-container nbl-contact">
                <div className="nbl-contact-copy">
                    <SectionHeading
                        align="left"
                        eyebrow="Contact"
                        title="Questions before you start?"
                        text="Ask about plans, group access for your program, or anything else. We read every message."
                    />
                    <ul className="nbl-contact-points">
                        <li><MessageIcon className="h-4 w-4" />Replies go to the email you provide</li>
                        {supportEmail && (
                            <li>
                                <MailIcon className="h-4 w-4" />
                                Prefer email? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="nbl-contact-card">
                    {sent ? (
                        <div className="nbl-contact-success" role="status">
                            <CheckCircleIcon className="h-12 w-12" />
                            <h3>Message sent</h3>
                            <p>Thanks for reaching out — we will get back to you at the email you provided as soon as possible.</p>
                            <button type="button" className="nbl-btn is-secondary is-sm" onClick={() => { setSent(false); setCaptchaKey((key) => key + 1) }}>
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submit} noValidate className="nbl-form">
                            <HoneypotFields
                                values={honeypot}
                                onChange={(name, value) => setHoneypot((prev) => ({ ...prev, [name]: value }))}
                            />
                            <div className="nbl-form-row">
                                <label className="nbl-field">
                                    <span className="nbl-label">Name</span>
                                    <input name="name" value={form.name} onChange={update} maxLength={120} autoComplete="name" className={`nbl-input ${errors.name ? 'is-invalid' : ''}`} placeholder="Your name" aria-invalid={Boolean(errors.name)} />
                                    {errors.name && <span className="nbl-error">{errors.name}</span>}
                                </label>
                                <label className="nbl-field">
                                    <span className="nbl-label">Email</span>
                                    <input name="email" type="email" value={form.email} onChange={update} maxLength={255} autoComplete="email" className={`nbl-input ${errors.email ? 'is-invalid' : ''}`} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} />
                                    {errors.email && <span className="nbl-error">{errors.email}</span>}
                                </label>
                            </div>
                            <label className="nbl-field">
                                <span className="nbl-label">Subject <em>(optional)</em></span>
                                <input name="subject" value={form.subject} onChange={update} maxLength={160} className="nbl-input" placeholder="What is this about?" />
                            </label>
                            <label className="nbl-field">
                                <span className="nbl-label-row">
                                    <span className="nbl-label">Message</span>
                                    <span className="nbl-counter">{form.message.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}</span>
                                </span>
                                <textarea name="message" value={form.message} onChange={update} maxLength={MESSAGE_MAX} rows={5} className={`nbl-input nbl-textarea ${errors.message ? 'is-invalid' : ''}`} placeholder="How can we help?" aria-invalid={Boolean(errors.message)} />
                                {errors.message && <span className="nbl-error">{errors.message}</span>}
                            </label>

                            <div className="nbl-captcha">
                                <CaptchaWidget refreshKey={captchaKey} onChange={setCaptcha} />
                            </div>

                            <label className="nbl-consent">
                                <input type="checkbox" name="consent" checked={form.consent} onChange={update} />
                                <span>
                                    I agree that my details will be used to respond to my message, as described in the{' '}
                                    <Link href="/privacy">Privacy Policy</Link>.
                                </span>
                            </label>
                            {errors.consent && <span className="nbl-error">{errors.consent}</span>}

                            <button type="submit" disabled={sending} className="nbl-btn is-primary is-block">
                                {sending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
                                {sending ? 'Sending…' : 'Send message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}
