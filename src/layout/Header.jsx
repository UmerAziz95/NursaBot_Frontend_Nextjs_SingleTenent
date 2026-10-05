'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight as ArrowRightIcon, Menu as MenuIcon, X as XIcon } from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import { useAppSettings } from '@/lib/app-settings'
import useSessionKind from '@/lib/use-session-kind'

export const SITE_NAV = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/#contact', label: 'Contact' },
]

export default function Header() {
    const { settings } = useAppSettings()
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const signedIn = useSessionKind()
    const signupEnabled = !settings.maintenance_mode && settings.user_signup_enabled
    const siteName = settings.site_name || 'nclexium'

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [menuOpen])

    const appHref = signedIn === 'staff' ? '/admin/dashboard' : '/assistant'

    const actions = signedIn && signedIn !== 'guest' ? (
        <Link href={appHref} className="nbl-btn is-primary is-sm">
            {signedIn === 'staff' ? 'Open console' : 'Open chat'}
            <ArrowRightIcon className="h-4 w-4" />
        </Link>
    ) : (
        <>
            <Link href="/signin" className="nbl-btn is-ghost is-sm">Sign in</Link>
            {signupEnabled ? (
                <Link href="/signup" className="nbl-btn is-primary is-sm">Get started</Link>
            ) : null}
        </>
    )

    return (
        <header className={`nbl-header ${scrolled ? 'is-scrolled' : ''}`}>
            <div className="nbl-container nbl-header-inner">
                <Link href="/" className="nbl-logo" aria-label={`${siteName} home`}>
                    <BrandMark size="md" />
                    <span>{siteName}</span>
                </Link>

                <nav className="nbl-nav" aria-label="Main">
                    {SITE_NAV.map((item) => (
                        <Link key={item.href} href={item.href} className="nbl-nav-link">{item.label}</Link>
                    ))}
                </nav>

                <div className="nbl-header-actions">{signedIn !== null && actions}</div>

                <button
                    type="button"
                    className="nbl-menu-btn"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                >
                    <MenuIcon className="h-5 w-5" />
                </button>
            </div>

            {menuOpen && (
                <div className="nbl-mobile" role="dialog" aria-modal="true" aria-label="Menu">
                    <div className="nbl-mobile-head">
                        <Link href="/" className="nbl-logo" onClick={() => setMenuOpen(false)}>
                            <BrandMark size="md" />
                            <span>{siteName}</span>
                        </Link>
                        <button type="button" className="nbl-menu-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <nav className="nbl-mobile-nav" aria-label="Mobile">
                        {SITE_NAV.map((item) => (
                            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
                        ))}
                    </nav>
                    <div className="nbl-mobile-actions" onClick={() => setMenuOpen(false)}>{signedIn !== null && actions}</div>
                </div>
            )}
        </header>
    )
}
