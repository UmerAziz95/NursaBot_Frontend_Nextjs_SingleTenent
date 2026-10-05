'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowUpRight as ArrowUpRightIcon,
    CalendarDays as CalendarIcon,
    Check as CheckIcon,
    Coins as CoinsIcon,
    Crown as CrownIcon,
    PlusCircle as PlusCircleIcon,
    ShieldCheck as ShieldCheckIcon,
    Sparkles as SparklesIcon,
    TriangleAlert as AlertIcon,
} from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { formatTokens, useSettings } from '@/sections/assistant/settings/SettingsContext'
import { PageHeader, Section, StatusPill } from '@/sections/assistant/settings/SettingsUI'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'
import './token-balance.css'

const DAY_MS = 24 * 60 * 60 * 1000

const formatDate = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return '—'
    }
}

const daysUntil = (value) => {
    if (!value) return null
    const end = new Date(value).getTime()
    if (Number.isNaN(end)) return null
    return Math.max(0, Math.ceil((end - Date.now()) / DAY_MS))
}

const usageTone = (percent) => {
    if (percent >= 95) return 'is-critical'
    if (percent >= 80) return 'is-warning'
    return ''
}

export default function AccountTab() {
    const { profile, refresh } = useSettings()
    const [busy, setBusy] = useState(false)

    if (!profile) return null

    const subscription = profile.subscription
    const plan = subscription?.plan
    const used = Number(subscription?.tokens_used || 0)
    const included = Number(subscription?.tokens_included || 0)
    const remaining = Number(subscription?.tokens_remaining || 0)
    const percent = Math.min(100, Math.max(0, Number(subscription?.usage_percent || 0)))
    const isAdmin = ['admin', 'super_admin'].includes(String(profile.role || ''))
    const isActive = Boolean(subscription?.is_active || subscription?.status === 'active')
    const needsReactivation = Boolean(
        profile.requires_reactivation
        || ['expired', 'cancelled'].includes(String(subscription?.status || ''))
    )
    const daysLeft = daysUntil(subscription?.current_period_end)
    const extraTotal = Number(subscription?.extra_tokens_total || 0)
    const extraUsed = Number(subscription?.extra_tokens_used || 0)
    const extraRemaining = Number(subscription?.extra_tokens_remaining || 0)
    const extraPercent = extraTotal > 0 ? Math.min(100, Math.round((extraUsed / extraTotal) * 100)) : 0
    const totalAvailable = (isActive ? remaining : 0) + extraRemaining

    const cancelSubscription = async () => {
        if (!window.confirm('Cancel your subscription? Chat will stop until you reactivate manually.')) return
        setBusy(true)
        try {
            const res = await fetchLaravel('/api/payments/cancel-subscription', { method: 'POST' })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not cancel subscription.')
            await refresh()
            toast.success('Subscription cancelled.')
        } catch (err) {
            toast.error(err.message || 'Could not cancel subscription.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <TabsContent value="account" className="nbs-page m-0 outline-none">
            <PageHeader
                title="Plan & usage"
                description="Your monthly subscription and token usage. Plans don't auto-renew — reactivate when a period ends."
            />

            {isAdmin && !subscription ? (
                <Section icon={ShieldCheckIcon} title="Admin access" description="Administrators can use chat without a paid subscription." />
            ) : needsReactivation && subscription ? (
                <Section
                    tone="warning"
                    icon={AlertIcon}
                    title={`Subscription ${subscription.status}`}
                    description={`Your monthly period ended and chat is paused. Reactivate${plan?.name ? ` your ${plan.name} plan` : ' your plan'} to keep chatting.`}
                    action={<StatusPill status={subscription.status} />}
                >
                    <div className="nbs-grid">
                        <div className="nbs-tile is-plain">
                            <div className="min-w-0">
                                <div className="nbs-tile-label">Last plan</div>
                                <div className="nbs-tile-value">{plan?.name || profile.plan || '—'}</div>
                            </div>
                        </div>
                        <div className="nbs-tile is-plain">
                            <div className="min-w-0">
                                <div className="nbs-tile-label">Ended</div>
                                <div className="nbs-tile-value">{formatDate(subscription.current_period_end)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="nbs-actions is-start">
                        <Link
                            href={`/plans?reason=expired&plan=${encodeURIComponent(plan?.slug || profile.plan || '')}`}
                            className="nbs-btn is-primary"
                        >
                            Reactivate subscription
                            <ArrowUpRightIcon className="size-4" />
                        </Link>
                    </div>
                </Section>
            ) : !subscription ? (
                <div className="nbs-empty is-card">
                    <span className="nbs-empty-icon"><SparklesIcon className="size-5" /></span>
                    <div className="nbs-empty-title">You don&apos;t have a plan yet</div>
                    <div className="nbs-empty-desc">Pick a monthly plan to unlock chat and document-powered answers.</div>
                    <Link href="/plans" className="nbs-btn is-primary mt-4">
                        View plans
                        <ArrowUpRightIcon className="size-4" />
                    </Link>
                </div>
            ) : (
                <>
                    <div className="nbs-plan-card">
                        <div className="nbs-plan-card-glow" aria-hidden="true" />
                        <div className="relative flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="nbs-plan-kicker">
                                    <CrownIcon className="size-3.5" />
                                    Current plan
                                </div>
                                <div className="nbs-plan-name">{plan?.name || profile.plan || 'Plan'}</div>
                                <div className="nbs-plan-price">
                                    {plan?.price_display || '—'}<span> / month</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {subscription.status ? <StatusPill status={subscription.status} className="is-on-dark" /> : null}
                                <span className="nbs-plan-chip">No auto-renew</span>
                            </div>
                        </div>

                        <div className="nbs-plan-period">
                            <div>
                                <span>Started</span>
                                <strong>{formatDate(subscription.current_period_start)}</strong>
                            </div>
                            <div>
                                <span>Renews manually on</span>
                                <strong>{formatDate(subscription.current_period_end)}</strong>
                            </div>
                            {daysLeft !== null && (
                                <div>
                                    <span>Time left</span>
                                    <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong>
                                </div>
                            )}
                        </div>

                        <div className="relative mt-5 flex flex-wrap gap-2">
                            <Link href="/plans" className="nbs-btn is-light">
                                Change plan
                            </Link>
                            {isActive ? (
                                <Link href="/tokens" className="nbs-btn is-light">
                                    <PlusCircleIcon className="size-4" />
                                    Buy tokens
                                </Link>
                            ) : null}
                            {isActive ? (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void cancelSubscription()}
                                    className="nbs-btn is-outline-light"
                                >
                                    {busy ? 'Cancelling…' : 'Cancel subscription'}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <Section
                        icon={CoinsIcon}
                        title="Token balance"
                        description={`${formatTokens(totalAvailable)} tokens available — plan tokens are used first, then extra tokens.`}
                        action={
                            isActive ? (
                                <Link href="/tokens" className="nbs-btn is-primary">
                                    <PlusCircleIcon className="size-4" />
                                    Buy tokens
                                </Link>
                            ) : null
                        }
                    >
                        <div className="nbs-token-split">
                            <div className="nbs-token-block">
                                <div className="nbs-token-head">
                                    <span className="nbs-token-label"><CrownIcon className="size-3.5" />Plan tokens</span>
                                    <span className={`nbs-usage-percent ${usageTone(percent)}`}>{percent}% used</span>
                                </div>
                                <div className="nbs-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Plan token usage">
                                    <span className={usageTone(percent)} style={{ width: `${percent}%` }} />
                                </div>
                                <div className="nbs-token-figures">
                                    <span><strong>{formatTokens(remaining)}</strong> left</span>
                                    <span>{formatTokens(used)} of {formatTokens(included)} used this period</span>
                                </div>
                            </div>

                            <div className="nbs-token-block is-extra">
                                <div className="nbs-token-head">
                                    <span className="nbs-token-label"><PlusCircleIcon className="size-3.5" />Extra tokens</span>
                                    <span className="nbs-usage-percent">{extraTotal > 0 ? `${extraPercent}% used` : 'None yet'}</span>
                                </div>
                                <div className="nbs-meter is-extra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={extraPercent} aria-label="Extra token usage">
                                    <span style={{ width: `${extraPercent}%` }} />
                                </div>
                                <div className="nbs-token-figures">
                                    <span><strong>{formatTokens(extraRemaining)}</strong> left</span>
                                    <span>
                                        {extraTotal > 0
                                            ? `${formatTokens(extraUsed)} of ${formatTokens(extraTotal)} purchased used`
                                            : 'Top up any time — they never expire'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {percent >= 80 && extraRemaining === 0 && (
                            <div className={`nbs-inline-note ${usageTone(percent)}`}>
                                <AlertIcon className="size-3.5" />
                                {percent >= 95
                                    ? 'You are almost out of tokens. Buy extra tokens to keep chatting without interruption.'
                                    : 'You have used most of this period’s plan tokens.'}
                            </div>
                        )}

                        <div className="nbs-stats">
                            {[
                                { label: 'Plan left', value: formatTokens(isActive ? remaining : 0) },
                                { label: 'Extra left', value: formatTokens(extraRemaining) },
                                { label: 'Total available', value: formatTokens(totalAvailable) },
                            ].map((stat) => (
                                <div key={stat.label} className="nbs-stat">
                                    <div className="nbs-stat-value">{stat.value}</div>
                                    <div className="nbs-stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {Array.isArray(plan?.features) && plan.features.length > 0 ? (
                        <Section icon={CalendarIcon} title="What's included">
                            <ul className="nbs-features">
                                {plan.features.map((feature, idx) => (
                                    <li key={`${feature}-${idx}`}>
                                        <span className="nbs-feature-check" aria-hidden="true">
                                            <CheckIcon className="size-3" strokeWidth={3} />
                                        </span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    ) : null}
                </>
            )}
        </TabsContent>
    )
}
