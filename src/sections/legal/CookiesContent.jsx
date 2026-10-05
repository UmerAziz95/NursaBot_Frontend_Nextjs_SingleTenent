'use client'

import Link from 'next/link'
import LegalPage from '@/sections/legal/LegalPage'

// Mirrors what the app actually stores (audited from the codebase).
const STORAGE_ROWS = [
    { name: 'Sign-in session', where: 'Browser storage', purpose: 'Keeps you signed in and identifies your account to our servers (access token, account and plan details).', type: 'Essential' },
    { name: 'Preferences', where: 'Browser storage', purpose: 'Remembers choices such as the answer mode per conversation and whether you dismissed this cookie notice.', type: 'Essential' },
    { name: 'Server session', where: 'Cookie', purpose: 'Maintains a secure session with our servers when needed.', type: 'Essential' },
    { name: 'Spam protection', where: 'Cookie / storage', purpose: 'Captcha checks on sign-in, sign-up and contact forms to block automated abuse.', type: 'Essential' },
    { name: 'Stripe', where: 'Cookie (checkout only)', purpose: 'Set by Stripe on payment pages to process payments securely and prevent fraud.', type: 'Essential' },
]

const sections = ({ siteName, contactLink }) => [
    {
        id: 'overview',
        title: 'Overview',
        body: (
            <p>
                {siteName} uses only <strong>strictly necessary</strong> cookies and browser storage. They keep you signed in,
                remember basic preferences and protect the service from abuse. We do <strong>not</strong> use advertising,
                analytics or cross-site tracking cookies.
            </p>
        ),
    },
    {
        id: 'what-we-use',
        title: 'What we use',
        body: (
            <div className="nbl-legal-table">
                <table>
                    <thead>
                        <tr><th>Name</th><th>Stored in</th><th>Purpose</th><th>Type</th></tr>
                    </thead>
                    <tbody>
                        {STORAGE_ROWS.map((row) => (
                            <tr key={row.name}>
                                <td><strong>{row.name}</strong></td>
                                <td>{row.where}</td>
                                <td>{row.purpose}</td>
                                <td><span className="nbl-tag">{row.type}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
    },
    {
        id: 'consent',
        title: 'Why we do not ask for consent',
        body: <p>Because everything listed above is required for the service to work and keep your account secure, these cookies do not require consent under most privacy laws. If we ever add optional cookies, we will ask for your permission first.</p>,
    },
    {
        id: 'control',
        title: 'Managing cookies',
        body: (
            <p>
                You can clear or block cookies and site data in your browser settings at any time. Blocking essential storage will
                sign you out and some features — such as staying signed in or completing a payment — will not work. Signing out
                of {siteName} also clears your session from this browser.
            </p>
        ),
    },
    {
        id: 'more',
        title: 'More information',
        body: <p>See our <Link href="/privacy">Privacy Policy</Link> for how we handle personal information, or reach us via {contactLink}.</p>,
    },
]

export default function CookiesContent() {
    return (
        <LegalPage
            current="/cookies"
            title="Cookie Policy"
            intro={({ siteName }) => `What ${siteName} stores in your browser, and why.`}
            sections={sections}
        />
    )
}
