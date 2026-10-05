'use client'

import Link from 'next/link'
import { ArrowRight as ArrowRightIcon, CalendarCheck as CalendarIcon, FileCheck2 as FileCheckIcon, Sparkles as SparklesIcon, Stethoscope as StethoscopeIcon } from 'lucide-react'
import { useAppSettings } from '@/lib/app-settings'
import ChatPreview from '@/sections/home/ChatPreview'

export default function HeroSection() {
    const { settings } = useAppSettings()
    const siteName = settings.site_name || 'NursingAI'
    const signupEnabled = !settings.maintenance_mode && settings.user_signup_enabled

    return (
        <section className="nbl-hero" id="top">
            <div className="nbl-hero-bg" aria-hidden="true" />
            <div className="nbl-container nbl-hero-grid">
                <div className="nbl-hero-copy">
                    <span className="nbl-eyebrow">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        AI study assistant for nursing students
                    </span>
                    <h1 className="nbl-hero-title">
                        Understand nursing concepts <span className="nbl-gradient-text">faster</span> — and walk into the NCLEX ready.
                    </h1>
                    <p className="nbl-hero-lead">
                        {siteName} answers your nursing questions in plain language, grounded in trusted study material.
                        Switch to Exam prep for NCLEX-style practice, ask by voice, or snap a photo of a chart.
                    </p>

                    <div className="nbl-hero-ctas">
                        {signupEnabled ? (
                            <Link href="/signup" className="nbl-btn is-primary is-lg">
                                Create your account
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        ) : null}
                        <Link href={signupEnabled ? '/#pricing' : '/signin'} className="nbl-btn is-secondary is-lg">
                            {signupEnabled ? 'See plans' : 'Sign in'}
                        </Link>
                    </div>

                    <ul className="nbl-hero-points">
                        <li><FileCheckIcon className="h-4 w-4" />Answers grounded in curated study material</li>
                        <li><StethoscopeIcon className="h-4 w-4" />Built only for medicine and nursing</li>
                        <li><CalendarIcon className="h-4 w-4" />Monthly plans · never auto-renew</li>
                    </ul>
                </div>

                <div className="nbl-hero-visual">
                    <div className="nbl-hero-glow" aria-hidden="true" />
                    <ChatPreview siteName={siteName} />
                </div>
            </div>
        </section>
    )
}
