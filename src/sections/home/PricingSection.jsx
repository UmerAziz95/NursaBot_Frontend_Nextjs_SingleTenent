'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ArrowRight as ArrowRightIcon,
    Check as CheckIcon,
    Coins as CoinsIcon,
    Crown as CrownIcon,
    Gem as GemIcon,
    RotateCcw as RetryIcon,
    Sparkles as SparklesIcon,
    Zap as ZapIcon,
} from 'lucide-react'
import { useAppSettings } from '@/lib/app-settings'
import useSessionKind from '@/lib/use-session-kind'
import SectionHeading from '@/sections/home/SectionHeading'

const PLAN_ICONS = [ZapIcon, CrownIcon, GemIcon]

const formatTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}

export default function PricingSection() {
    const { settings } = useAppSettings()
    const signupEnabled = !settings.maintenance_mode && settings.user_signup_enabled
    const [plans, setPlans] = useState(null)
    const [failed, setFailed] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const signedInUser = useSessionKind() === 'user'

    useEffect(() => {
        let cancelled = false
        fetch('/backend/api/plans', { headers: { Accept: 'application/json' } })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('plans_unavailable'))))
            .then((data) => {
                if (cancelled) return
                const list = Array.isArray(data?.plans) ? data.plans : []
                setPlans(list.filter((plan) => plan.is_active !== false))
                setFailed(false)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })
        return () => {
            cancelled = true
        }
    }, [attempt])

    const ctaFor = (plan) => {
        if (signedInUser) return { href: `/plans?plan=${encodeURIComponent(plan.slug)}`, label: `Choose ${plan.name}` }
        if (signupEnabled) return { href: '/signup', label: `Get ${plan.name}` }
        return { href: '/signin', label: 'Sign in to subscribe' }
    }

    return (
        <section className="nbl-section is-tinted" id="pricing">
            <div className="nbl-container">
                <SectionHeading
                    eyebrow="Pricing"
                    title="Simple monthly plans"
                    text="Pay for one month at a time. Plans never renew automatically — you stay in control of every charge."
                />

                {failed ? (
                    <div className="nbl-pricing-empty">
                        <div>We couldn&apos;t load plans right now.</div>
                        <button type="button" className="nbl-btn is-secondary is-sm" onClick={() => setAttempt((n) => n + 1)}>
                            <RetryIcon className="h-4 w-4" />
                            Try again
                        </button>
                    </div>
                ) : plans === null ? (
                    <div className="nbl-plans" aria-busy="true">
                        {[0, 1, 2].map((i) => <div key={i} className="nbl-plan is-skeleton" />)}
                    </div>
                ) : plans.length === 0 ? (
                    <div className="nbl-pricing-empty">Plans are coming soon — check back shortly.</div>
                ) : (
                    <div className={`nbl-plans count-${Math.min(plans.length, 4)}`}>
                        {plans.map((plan, index) => {
                            const Icon = PLAN_ICONS[index % PLAN_ICONS.length]
                            const cta = ctaFor(plan)
                            return (
                                <article key={plan.id} className={`nbl-plan nbl-reveal ${plan.is_highlighted ? 'is-featured' : ''}`}>
                                    {plan.is_highlighted && (
                                        <span className="nbl-plan-ribbon"><SparklesIcon className="h-3 w-3" />Most popular</span>
                                    )}
                                    <div className="nbl-plan-head">
                                        <span className="nbl-plan-icon"><Icon className="h-5 w-5" /></span>
                                        <h3 className="nbl-plan-name">{plan.name}</h3>
                                    </div>
                                    {plan.description ? <p className="nbl-plan-desc">{plan.description}</p> : null}
                                    <div className="nbl-plan-price">
                                        <span className="nbl-plan-amount">{plan.price_display}</span>
                                        <span className="nbl-plan-period">/ month</span>
                                    </div>
                                    <div className="nbl-plan-tokens">
                                        <CoinsIcon className="h-4 w-4" />
                                        <span><strong>{formatTokens(plan.monthly_token_limit)}</strong> tokens every month</span>
                                    </div>
                                    <ul className="nbl-plan-features">
                                        {(plan.features || []).map((feature) => (
                                            <li key={feature}>
                                                <span className="nbl-check" aria-hidden="true"><CheckIcon className="h-3 w-3" strokeWidth={3} /></span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={cta.href} className={`nbl-btn ${plan.is_highlighted ? 'is-light' : 'is-outline'} is-block`}>
                                        {cta.label}
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                </article>
                            )
                        })}
                    </div>
                )}

                <p className="nbl-pricing-note">
                    Prices in {String(plans?.[0]?.currency || 'usd').toUpperCase()}. Payments are processed securely by Stripe.
                </p>
            </div>
        </section>
    )
}
