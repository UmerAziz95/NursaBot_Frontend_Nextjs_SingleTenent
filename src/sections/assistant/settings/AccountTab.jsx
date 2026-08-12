'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TabsContent } from '@/components/ui/tabs'
import { Check as CheckIcon } from 'lucide-react'
import { formatTokens, useSettings } from '@/sections/assistant/settings/SettingsContext'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const panelClass = 'user-portal-panel'

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

const statusBadgeClass = (status) => {
    if (status === 'active') return 'bg-emerald-50 text-emerald-700'
    if (status === 'expired') return 'bg-amber-50 text-amber-800'
    if (status === 'cancelled') return 'bg-rose-50 text-rose-700'
    return 'bg-slate-100 text-slate-600'
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
        <TabsContent value="account" className="m-0 block w-full space-y-5 p-5 outline-none md:p-7">
            <header className="border-b border-slate-100 pb-4">
                <h2 className="user-portal-page-title">Plan &amp; usage</h2>
                <p className="user-portal-page-desc mt-1">
                    Monthly subscription and token usage. Plans do not auto-renew — reactivate manually when a period ends.
                </p>
            </header>

            {isAdmin && !subscription ? (
                <div className={`${panelClass} bg-slate-50`}>
                    <h3 className="user-portal-section-title">Admin access</h3>
                    <p className="user-portal-page-desc mt-2">
                        Administrators can use chat without a paid subscription.
                    </p>
                </div>
            ) : needsReactivation && subscription ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="user-portal-section-title text-amber-900!">
                            Subscription {subscription.status}
                        </h3>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${statusBadgeClass(subscription.status)}`}>
                            {subscription.status}
                        </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                        Your monthly period ended and chat is paused. There is no auto-renewal — reactivate
                        {plan?.name ? ` your ${plan.name} plan` : ' your plan'} to continue chatting.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                            <p className="user-portal-kicker">Last plan</p>
                            <p className="text-sm font-medium text-amber-950">{plan?.name || profile.plan || '—'}</p>
                        </div>
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                            <p className="user-portal-kicker">Ended</p>
                            <p className="text-sm font-medium text-amber-950">{formatDate(subscription.current_period_end)}</p>
                        </div>
                    </div>
                    <Link
                        href={`/plans?reason=expired&plan=${encodeURIComponent(plan?.slug || profile.plan || '')}`}
                        className="user-portal-btn-primary mt-4"
                    >
                        Reactivate subscription
                    </Link>
                </div>
            ) : !subscription ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <h3 className="user-portal-section-title text-amber-900!">No active plan</h3>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                        Purchase a monthly plan to unlock chat and document-powered answers.
                    </p>
                    <Link
                        href="/plans"
                        className="user-portal-btn-primary mt-4"
                    >
                        View plans
                    </Link>
                </div>
            ) : (
                <>
                    <div className={panelClass}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="user-portal-kicker">
                                    Subscribed plan
                                </p>
                                <h3 className="user-portal-plans-card-title mt-1 truncate">
                                    {plan?.name || profile.plan || 'Plan'}
                                </h3>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {plan?.price_display || '—'} / month
                                    </span>
                                    {subscription.status ? (
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${statusBadgeClass(subscription.status)}`}>
                                            {subscription.status}
                                        </span>
                                    ) : null}
                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                                        No auto-renew
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/plans"
                                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Change plan
                                </Link>
                                {isActive ? (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void cancelSubscription()}
                                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                                    >
                                        {busy ? 'Cancelling…' : 'Cancel'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-50 px-3.5 py-3">
                                <p className="user-portal-kicker">
                                    Period start
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {formatDate(subscription.current_period_start)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3.5 py-3">
                                <p className="user-portal-kicker">
                                    Period ends
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {formatDate(subscription.current_period_end)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={panelClass}>
                        <div className="mb-3 flex items-end justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="user-portal-section-title">Token consumption</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {formatTokens(used)} used of {formatTokens(included)} this month
                                </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-slate-800">{percent}%</p>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#2EAADB] transition-all"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {[
                                { label: 'Used', value: formatTokens(used) },
                                { label: 'Remaining', value: formatTokens(remaining) },
                                { label: 'Included', value: formatTokens(included) },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-lg bg-slate-50 px-3 py-3 text-center">
                                    <p className="user-portal-page-title tabular-nums">{stat.value}</p>
                                    <p className="user-portal-caption mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {Array.isArray(plan?.features) && plan.features.length > 0 ? (
                        <div className={panelClass}>
                            <h3 className="user-portal-section-title mb-3">Plan features</h3>
                            <ul className="space-y-2.5">
                                {plan.features.map((feature, idx) => (
                                    <li key={`${feature}-${idx}`} className="flex items-start gap-2.5 text-sm text-slate-600">
                                        <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#2EAADB]/15 text-[#2EAADB]">
                                            <CheckIcon className="size-2.5" strokeWidth={3} />
                                        </span>
                                        <span className="leading-snug">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </>
            )}
        </TabsContent>
    )
}
