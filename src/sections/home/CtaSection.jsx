'use client'

import Link from 'next/link'
import { ArrowRight as ArrowRightIcon } from 'lucide-react'
import { useAppSettings } from '@/lib/app-settings'

export default function CtaSection() {
    const { settings } = useAppSettings()
    const signupEnabled = !settings.maintenance_mode && settings.user_signup_enabled

    return (
        <section className="nbl-cta-wrap">
            <div className="nbl-container">
                <div className="nbl-cta nbl-reveal">
                    <div className="nbl-cta-glow" aria-hidden="true" />
                    <div className="nbl-cta-copy">
                        <h2 className="nbl-cta-title">Your next study session starts here.</h2>
                        <p className="nbl-cta-text">Create an account, choose a plan and ask your first question in minutes.</p>
                    </div>
                    <div className="nbl-cta-actions">
                        {signupEnabled ? (
                            <Link href="/signup" className="nbl-btn is-light is-lg">
                                Get started
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        ) : null}
                        <Link href="/signin" className="nbl-btn is-ghost-light is-lg">Sign in</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
