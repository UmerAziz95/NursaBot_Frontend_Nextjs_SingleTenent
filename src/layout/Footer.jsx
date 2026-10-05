'use client'

import Link from 'next/link'
import { Mail as MailIcon } from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import { useAppSettings } from '@/lib/app-settings'

// Brand marks as inline SVG paths (lucide no longer ships brand icons).
const SOCIAL = [
    { key: 'social_facebook_url', label: 'Facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { key: 'social_instagram_url', label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.414.561.218.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.821.679-1.382.896-.422.164-1.057.36-2.227.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.413a3.71 3.71 0 0 1-1.381-.896 3.71 3.71 0 0 1-.896-1.382c-.164-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.053-1.17.249-1.805.413-2.227.217-.562.477-.96.896-1.381.42-.419.819-.679 1.381-.896.422-.165 1.057-.36 2.227-.414 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.902.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.902.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.261 2.15.558 2.912.306.789.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.763.296 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.15-.262 2.912-.558.789-.305 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.763.499-1.636.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.059-1.277-.262-2.15-.558-2.913-.305-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.763-.297-1.636-.499-2.912-.558C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
    { key: 'social_linkedin_url', label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { key: 'social_x_url', label: 'X', path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
    { key: 'social_youtube_url', label: 'YouTube', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
]

export default function Footer() {
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'nclexium'
    const tagline = settings.site_tagline || 'Your AI study companion for nursing school and the NCLEX.'
    const supportEmail = String(settings.support_email || '').trim()
    const signupEnabled = !settings.maintenance_mode && settings.user_signup_enabled
    const socials = SOCIAL.filter((item) => /^https?:\/\//i.test(String(settings[item.key] || '')))
    const year = new Date().getFullYear()

    const columns = [
        {
            title: 'Product',
            links: [
                { href: '/#features', label: 'Features' },
                { href: '/#how-it-works', label: 'How it works' },
                { href: '/#answer-modes', label: 'Answer modes' },
                { href: '/#pricing', label: 'Pricing' },
            ],
        },
        {
            title: 'Account',
            links: [
                { href: '/signin', label: 'Sign in' },
                ...(signupEnabled ? [{ href: '/signup', label: 'Create account' }] : []),
                { href: '/forgot-password', label: 'Reset password' },
                { href: '/#faq', label: 'FAQ' },
                { href: '/#contact', label: 'Contact us' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/cookies', label: 'Cookie Policy' },
            ],
        },
    ]

    return (
        <footer className="nbl-footer">
            <div className="nbl-container">
                <div className="nbl-footer-grid">
                    <div className="nbl-footer-brand">
                        <Link href="/" className="nbl-logo is-light">
                            <BrandMark size="md" />
                            <span>{siteName}</span>
                        </Link>
                        <div className="nbl-footer-tagline">{tagline}</div>
                        {supportEmail && (
                            <a href={`mailto:${supportEmail}`} className="nbl-footer-email">
                                <MailIcon className="h-4 w-4" />
                                {supportEmail}
                            </a>
                        )}
                        {socials.length > 0 && (
                            <div className="nbl-socials">
                                {socials.map((item) => (
                                    <a
                                        key={item.key}
                                        href={settings[item.key]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`${siteName} on ${item.label}`}
                                        title={item.label}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={item.path} /></svg>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {columns.map((column) => (
                        <div key={column.title}>
                            <div className="nbl-footer-title">{column.title}</div>
                            <ul className="nbl-footer-links">
                                {column.links.map((link) => (
                                    <li key={link.href + link.label}><Link href={link.href}>{link.label}</Link></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="nbl-footer-bottom">
                    <div>© {year} {siteName}. All rights reserved.</div>
                    <div className="nbl-footer-note">
                        For educational use only — not a substitute for professional medical advice.
                    </div>
                </div>
            </div>
        </footer>
    )
}
