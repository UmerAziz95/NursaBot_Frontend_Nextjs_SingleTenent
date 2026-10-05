'use client'

import Link from 'next/link'
import { useAppSettings } from '@/lib/app-settings'
import SiteShell from '@/sections/home/SiteShell'

export const LEGAL_UPDATED = 'October 5, 2026'

const LEGAL_LINKS = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
]

/**
 * Shared layout for legal documents. `sections` is a function of the site context
 * ({ siteName, supportEmail, contactLink }) returning [{ id, title, body }].
 */
export default function LegalPage({ title, intro, sections, current }) {
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'nclexium'
    const supportEmail = String(settings.support_email || '').trim()
    const contactLink = supportEmail
        ? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        : <Link href="/#contact">our contact form</Link>
    const ctx = { siteName, supportEmail, contactLink }
    const items = sections(ctx)

    return (
        <SiteShell>
            <section className="nbl-legal-hero">
                <div className="nbl-container">
                    <span className="nbl-eyebrow">Legal</span>
                    <h1 className="nbl-legal-title">{title}</h1>
                    <div className="nbl-legal-meta">Last updated {LEGAL_UPDATED}</div>
                    {intro ? <p className="nbl-legal-intro">{intro(ctx)}</p> : null}
                    <nav className="nbl-legal-switch" aria-label="Legal documents">
                        {LEGAL_LINKS.map((link) => (
                            <Link key={link.href} href={link.href} className={link.href === current ? 'is-active' : ''} aria-current={link.href === current ? 'page' : undefined}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </section>

            <div className="nbl-container nbl-legal">
                <aside className="nbl-legal-toc" aria-label="On this page">
                    <div className="nbl-legal-toc-title">On this page</div>
                    <ol>
                        {items.map((item, index) => (
                            <li key={item.id}><a href={`#${item.id}`}>{index + 1}. {item.title}</a></li>
                        ))}
                    </ol>
                </aside>
                <article className="nbl-legal-body">
                    {items.map((item, index) => (
                        <section key={item.id} id={item.id} className="nbl-legal-section">
                            <h2>{index + 1}. {item.title}</h2>
                            {item.body}
                        </section>
                    ))}
                </article>
            </div>
        </SiteShell>
    )
}
