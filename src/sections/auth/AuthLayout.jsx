'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft as ArrowLeftIcon,
    BookOpenCheck as BookIcon,
    Eye as EyeIcon,
    EyeOff as EyeOffIcon,
    GraduationCap as GraduationIcon,
    ShieldCheck as ShieldIcon,
} from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import { useAppSettings } from '@/lib/app-settings'
import '@/sections/auth/auth.css'

/**
 * Split-screen frame for the user sign-in / sign-up / password pages:
 * form on the left, brand panel on the right (hidden on small screens).
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'NursingAI'

    return (
        <div className="user-portal nbu-auth">
            <div className="nbu-auth-main">
                <div className="nbu-auth-top">
                    <Link href="/" className="nbu-logo" aria-label={`${siteName} home`}>
                        <BrandMark size="md" />
                        <span>{siteName}</span>
                    </Link>
                    <Link href="/" className="nbu-back">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to home
                    </Link>
                </div>

                <div className="nbu-auth-center">
                    <div className="nbu-card">
                        <h1 className="nbu-title">{title}</h1>
                        {subtitle ? <p className="nbu-subtitle">{subtitle}</p> : null}
                        {children}
                    </div>
                    {footer ? <div className="nbu-card-footer">{footer}</div> : null}
                </div>

                <div className="nbu-legal">
                    <Link href="/terms">Terms</Link>
                    <span aria-hidden="true">·</span>
                    <Link href="/privacy">Privacy</Link>
                    <span aria-hidden="true">·</span>
                    <Link href="/cookies">Cookies</Link>
                </div>
            </div>

            <aside className="nbu-brand" aria-hidden="true">
                <div className="nbu-brand-glow" />
                <div className="nbu-brand-inner">
                    <div className="nbu-brand-headline">Study smarter for nursing school and the NCLEX.</div>
                    <div className="nbu-brand-sub">Clear answers, practice questions and explanations — whenever you need them.</div>

                    <div className="nbu-chat">
                        <div className="nbu-chat-user">Why does insulin lower potassium?</div>
                        <div className="nbu-chat-ai">
                            <BrandMark size="sm" />
                            <div>
                                <div className="nbu-chat-name">{siteName} <span>Simple</span></div>
                                Insulin moves glucose <strong>and potassium</strong> into your cells — so blood potassium drops.
                                That&apos;s why nurses monitor K⁺ closely during insulin therapy.
                            </div>
                        </div>
                    </div>

                    <ul className="nbu-points">
                        <li><BookIcon className="h-4 w-4" />Answers grounded in curated study material</li>
                        <li><GraduationIcon className="h-4 w-4" />Exam prep mode with NCLEX-style questions</li>
                        <li><ShieldIcon className="h-4 w-4" />Monthly plans that never auto-renew</li>
                    </ul>
                </div>
            </aside>
        </div>
    )
}

/** Labelled input with an optional leading icon and trailing slot. */
export function AuthField({ label, htmlFor, icon: Icon, trailing, hint, error, children }) {
    return (
        <div className="nbu-field">
            <div className="nbu-field-top">
                <label htmlFor={htmlFor} className="nbu-label">{label}</label>
                {trailing}
            </div>
            <div className={`nbu-input-wrap ${Icon ? 'has-icon' : ''} ${error ? 'is-invalid' : ''}`}>
                {Icon ? <Icon className="nbu-input-icon h-4 w-4" aria-hidden="true" /> : null}
                {children}
            </div>
            {error ? <div className="nbu-error" role="alert">{error}</div> : hint ? <div className="nbu-hint">{hint}</div> : null}
        </div>
    )
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ id, name, value, onChange, placeholder, autoComplete, minLength, required = true }) {
    const [visible, setVisible] = useState(false)
    return (
        <>
            <input
                id={id}
                name={name}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                minLength={minLength}
                required={required}
                className="nbu-input has-toggle"
            />
            <button
                type="button"
                className="nbu-toggle"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                title={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
        </>
    )
}
