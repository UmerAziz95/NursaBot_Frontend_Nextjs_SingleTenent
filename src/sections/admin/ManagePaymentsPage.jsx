'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    BarChart3 as ChartIcon,
    Check as CheckIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Coins as CoinsIcon,
    Copy as CopyIcon,
    CreditCard as CreditCardIcon,
    Download as DownloadIcon,
    Receipt as ReceiptIcon,
    RefreshCw as RefreshIcon,
    Search as SearchIcon,
    Users as UsersIcon,
    Wallet as WalletIcon,
} from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'
import './payments.css'

const TYPES = [
    { key: '', label: 'All payments' },
    { key: 'subscription', label: 'Subscriptions' },
    { key: 'tokens', label: 'Token orders' },
]

const pad = (n) => String(n).padStart(2, '0')
const isoDay = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const daysAgo = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
}

const PRESETS = [
    { key: 'today', label: 'Today', range: () => [isoDay(new Date()), isoDay(new Date())] },
    { key: '7d', label: '7 days', range: () => [isoDay(daysAgo(6)), isoDay(new Date())] },
    { key: '30d', label: '30 days', range: () => [isoDay(daysAgo(29)), isoDay(new Date())] },
    { key: 'month', label: 'This month', range: () => { const d = new Date(); return [isoDay(new Date(d.getFullYear(), d.getMonth(), 1)), isoDay(d)] } },
    { key: 'year', label: 'This year', range: () => { const d = new Date(); return [isoDay(new Date(d.getFullYear(), 0, 1)), isoDay(d)] } },
    { key: 'all', label: 'All time', range: () => ['', ''] },
]

const money = (cents) => `$${(Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const number = (value) => Number(value || 0).toLocaleString()
const compactTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}
const formatWhen = (iso) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
const shortDay = (day) => {
    const date = new Date(`${day}T00:00:00`)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function buildQuery({ from, to, type, search, page, perPage = 25 }) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (type) params.set('type', type)
    if (search) params.set('search', search)
    return params.toString()
}

async function loadPayments(filters) {
    const res = await fetchLaravel(`/api/admin/payments?${buildQuery(filters)}`)
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.detail || 'Could not load payments.')
    return data
}

function Stat({ icon: Icon, tone = 'brand', label, value, hint, loading }) {
    return (
        <div className="nba-stat">
            <div className="nba-stat-top">
                <span className={`nba-stat-icon is-${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
            </div>
            <div className="nba-stat-label">{label}</div>
            {loading ? <span className="nba-skel h-8 w-24" /> : <div className="nba-stat-value">{value}</div>}
            <div className="nba-stat-hint">{loading ? <span className="nba-skel h-3 w-28" /> : hint}</div>
        </div>
    )
}

function RevenueChart({ daily, loading }) {
    const max = Math.max(1, ...daily.map((d) => d.subscription_cents + d.token_cents))
    // Thin the x-axis labels so they never overlap.
    const labelEvery = Math.max(1, Math.ceil(daily.length / 10))

    if (loading) return <div className="nbpay-chart is-loading"><span className="nba-skel h-40 w-full" /></div>
    if (daily.length === 0) {
        return <div className="nbpay-chart-empty"><ChartIcon className="h-5 w-5" />No payments in this period.</div>
    }

    return (
        <div className="nbpay-chart" role="img" aria-label="Revenue per day">
            <div className="nbpay-chart-bars">
                {daily.map((day, index) => {
                    const total = day.subscription_cents + day.token_cents
                    return (
                        <div
                            key={day.date}
                            className="nbpay-chart-col"
                            title={`${shortDay(day.date)} · ${money(total)} (${day.count} payment${day.count === 1 ? '' : 's'})\nSubscriptions ${money(day.subscription_cents)} · Tokens ${money(day.token_cents)}`}
                        >
                            <div className="nbpay-chart-stack" style={{ height: `${(total / max) * 100}%` }}>
                                {day.token_cents > 0 && <span className="is-tokens" style={{ flexGrow: day.token_cents }} />}
                                {day.subscription_cents > 0 && <span className="is-subs" style={{ flexGrow: day.subscription_cents }} />}
                            </div>
                            <span className="nbpay-chart-label">{index % labelEvery === 0 ? shortDay(day.date) : ''}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function CopyButton({ value }) {
    const [done, setDone] = useState(false)
    if (!value) return null
    return (
        <button
            type="button"
            className="nbpay-copy"
            title="Copy"
            onClick={() => {
                navigator.clipboard?.writeText(value).then(() => {
                    setDone(true)
                    window.setTimeout(() => setDone(false), 1200)
                }).catch(() => {})
            }}
        >
            {done ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
        </button>
    )
}

export default function ManagePaymentsPage() {
    const [preset, setPreset] = useState('30d')
    const [range, setRange] = useState(() => PRESETS[2].range())
    const [type, setType] = useState('')
    const [query, setQuery] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reloadKey, setReloadKey] = useState(0)
    const [exporting, setExporting] = useState(false)

    const [from, to] = range

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(query.trim()), 300)
        return () => window.clearTimeout(timer)
    }, [query])

    useEffect(() => {
        let cancelled = false
        loadPayments({ from, to, type, search, page })
            .then((next) => {
                if (cancelled) return
                setData(next)
                setLoading(false)
            })
            .catch((err) => {
                if (cancelled) return
                toast.error(err.message)
                setLoading(false)
            })
        return () => { cancelled = true }
    }, [from, to, type, search, page, reloadKey])

    const refetch = (fn) => {
        setLoading(true)
        setPage(1)
        fn()
    }

    const stats = data?.stats || {}
    const tokens = data?.tokens || {}
    const payments = data?.payments || []
    const pagination = data?.pagination || { page: 1, last_page: 1, total: 0 }
    const daily = useMemo(() => data?.daily || [], [data])
    const subShare = stats.total_cents ? Math.round((stats.subscription_cents / stats.total_cents) * 100) : 0

    const exportCsv = async () => {
        setExporting(true)
        try {
            const rows = []
            for (let p = 1; p <= 50; p += 1) {
                const chunk = await loadPayments({ from, to, type, search, page: p, perPage: 100 })
                rows.push(...(chunk.payments || []))
                if (p >= (chunk.pagination?.last_page || 1)) break
            }
            const header = ['Paid at', 'Type', 'Reference', 'Subscription ID', 'Order number', 'Customer', 'Plan', 'Tokens', 'Amount', 'Currency', 'Stripe payment']
            const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
            const csv = [header, ...rows.map((r) => [
                r.paid_at, r.type, r.reference, r.subscription_id, r.order_number, r.user_email, r.plan_name,
                r.tokens, (r.amount_cents / 100).toFixed(2), r.currency, r.stripe_payment_intent_id,
            ])].map((line) => line.map(escape).join(',')).join('\n')
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
            const link = document.createElement('a')
            link.href = url
            link.download = `payments-${from || 'all'}-${to || 'time'}.csv`
            link.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            toast.error(err.message || 'Export failed.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="nbpay">
            <div className="nbpay-toolbar">
                <div className="nbpay-presets" role="group" aria-label="Date range">
                    {PRESETS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={`nbpay-preset ${preset === item.key ? 'is-active' : ''}`}
                            onClick={() => refetch(() => { setPreset(item.key); setRange(item.range()) })}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="nbpay-dates">
                    <label>
                        <span>From</span>
                        <input
                            type="date"
                            value={from}
                            max={to || undefined}
                            onChange={(e) => refetch(() => { setPreset('custom'); setRange([e.target.value, to]) })}
                        />
                    </label>
                    <label>
                        <span>To</span>
                        <input
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(e) => refetch(() => { setPreset('custom'); setRange([from, e.target.value]) })}
                        />
                    </label>
                </div>
            </div>

            <div className="nba-stats">
                <Stat
                    icon={WalletIcon}
                    label="Revenue"
                    loading={loading && !data}
                    value={money(stats.total_cents)}
                    hint={`${number(stats.count)} payment${stats.count === 1 ? '' : 's'} · avg ${money(stats.average_cents)}`}
                />
                <Stat
                    icon={CreditCardIcon}
                    tone="green"
                    label="Subscription revenue"
                    loading={loading && !data}
                    value={money(stats.subscription_cents)}
                    hint={`${number(stats.subscription_count)} plan payment${stats.subscription_count === 1 ? '' : 's'} · ${subShare}% of revenue`}
                />
                <Stat
                    icon={CoinsIcon}
                    tone="amber"
                    label="Token revenue"
                    loading={loading && !data}
                    value={money(stats.token_cents)}
                    hint={`${number(stats.token_count)} order${stats.token_count === 1 ? '' : 's'} · ${compactTokens(stats.tokens_sold)} tokens sold`}
                />
                <Stat
                    icon={UsersIcon}
                    label="Paying customers"
                    loading={loading && !data}
                    value={number(stats.paying_customers)}
                    hint="In the selected period"
                />
            </div>

            <div className="nbpay-grid">
                <section className="nba-card nbpay-chart-card">
                    <div className="nba-card-head">
                        <h2 className="nba-card-title">Revenue by day</h2>
                        <div className="nbpay-legend">
                            <span><i className="is-subs" />Subscriptions</span>
                            <span><i className="is-tokens" />Tokens</span>
                        </div>
                    </div>
                    <RevenueChart daily={daily} loading={loading && !data} />
                </section>

                <section className="nba-card nbpay-token-card">
                    <div className="nba-card-head">
                        <h2 className="nba-card-title">Extra tokens</h2>
                        <span className="nba-card-meta">Top-up orders</span>
                    </div>
                    <ul className="nbpay-token-list">
                        <li><span>Sold in period</span><strong>{number(tokens.sold_in_range)}</strong></li>
                        <li><span>Orders in period</span><strong>{number(tokens.orders_in_range)}</strong></li>
                        <li><span>Sold all time</span><strong>{number(tokens.sold_all_time)}</strong></li>
                        <li><span>Consumed</span><strong>{number(tokens.consumed_all_time)}</strong></li>
                        <li className="is-total"><span>Unused balance</span><strong>{number(tokens.outstanding)}</strong></li>
                        <li><span>Customers who bought tokens</span><strong>{number(tokens.buyers_all_time)}</strong></li>
                    </ul>
                    {tokens.sold_all_time > 0 && (
                        <div className="nbpay-token-meter" title="Consumed share of all purchased tokens">
                            <span style={{ width: `${Math.min(100, (tokens.consumed_all_time / tokens.sold_all_time) * 100)}%` }} />
                        </div>
                    )}
                </section>
            </div>

            <section className="nba-card nbpay-table-card">
                <div className="nbpay-table-toolbar">
                    <div className="nba-tabs" role="tablist" aria-label="Payment type">
                        {TYPES.map((item) => (
                            <button
                                key={item.key || 'all'}
                                type="button"
                                role="tab"
                                aria-selected={type === item.key}
                                className={`nba-tab ${type === item.key ? 'is-active' : ''}`}
                                onClick={() => refetch(() => setType(item.key))}
                            >
                                {item.label}
                                {item.key && (
                                    <span className="nba-tab-count">
                                        {item.key === 'tokens' ? stats.token_count ?? 0 : stats.subscription_count ?? 0}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="nbpay-search">
                        <SearchIcon className="h-4 w-4" />
                        <input
                            value={query}
                            onChange={(e) => { setLoading(true); setPage(1); setQuery(e.target.value) }}
                            placeholder="Email, order no., subscription or Stripe ID"
                            aria-label="Search payments"
                        />
                    </div>
                    <button type="button" className="admin-btn-secondary" onClick={() => { setLoading(true); setReloadKey((n) => n + 1) }} disabled={loading}>
                        <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button type="button" className="admin-btn-secondary" onClick={() => void exportCsv()} disabled={exporting || !pagination.total}>
                        <DownloadIcon className="h-4 w-4" />
                        {exporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                </div>

                <div className="nbpay-table-scroll">
                    <table className="admin-table nbpay-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Subscription ID / Order no.</th>
                                <th>Plan</th>
                                <th className="is-num">Tokens</th>
                                <th className="is-num">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && payments.length === 0 ? (
                                [0, 1, 2, 3].map((i) => (
                                    <tr key={i}><td colSpan={7}><span className="nba-skel h-5 w-full" /></td></tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="cell-empty">
                                        <ReceiptIcon className="mx-auto mb-1 h-5 w-5 text-slate-400" />
                                        {search ? 'No payments match your search.' : 'No payments in this period.'}
                                    </td>
                                </tr>
                            ) : payments.map((p) => (
                                <tr key={p.id}>
                                    <td className="cell-muted whitespace-nowrap">{formatWhen(p.paid_at)}</td>
                                    <td>
                                        <div className="nbpay-customer">{p.user_name || p.user_email || 'Deleted user'}</div>
                                        {p.user_name && <div className="nbpay-sub">{p.user_email}</div>}
                                    </td>
                                    <td>
                                        <span className={`nba-pill ${p.type === 'tokens' ? 'is-warning' : 'is-success'}`}>
                                            {p.type === 'tokens' ? 'Tokens' : 'Subscription'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="nbpay-ref">
                                            <span className="nbpay-ref-kind">{p.type === 'tokens' ? 'Order' : 'Sub'}</span>
                                            <code title={p.reference}>{p.reference || '—'}</code>
                                            <CopyButton value={p.reference} />
                                        </div>
                                        {p.stripe_payment_intent_id && <div className="nbpay-sub nbpay-mono" title="Stripe payment">{p.stripe_payment_intent_id}</div>}
                                    </td>
                                    <td className="cell-muted">{p.plan_name || '—'}</td>
                                    <td className="is-num cell-muted">{number(p.tokens)}</td>
                                    <td className="is-num nbpay-amount">{money(p.amount_cents)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="nbpay-pager">
                    <span>
                        {pagination.total
                            ? `Page ${pagination.page} of ${pagination.last_page} · ${number(pagination.total)} payment${pagination.total === 1 ? '' : 's'}`
                            : 'No results'}
                    </span>
                    <div>
                        <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label="Previous page"
                            disabled={loading || pagination.page <= 1}
                            onClick={() => { setLoading(true); setPage((n) => Math.max(1, n - 1)) }}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label="Next page"
                            disabled={loading || pagination.page >= pagination.last_page}
                            onClick={() => { setLoading(true); setPage((n) => n + 1) }}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
