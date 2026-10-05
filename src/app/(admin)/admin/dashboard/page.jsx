'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
    ArrowRight as ArrowRightIcon,
    ArrowUpRight as ArrowUpRightIcon,
    Bug as BugIcon,
    CreditCard as CreditCardIcon,
    LifeBuoy as LifebuoyIcon,
    MessageSquare as MessageSquareIcon,
    RefreshCw as RefreshIcon,
    Upload as UploadIcon,
    Users as UsersIcon,
} from 'lucide-react'
import AdminShell from '@/sections/admin/AdminShell'
import { fetchLaravel } from '@/lib/laravel-api'
import { navItemsForRole, readAdminRole } from '@/sections/admin/adminNav'

const FULL_ADMINS = ['admin', 'super_admin']

const getJson = async (path) => {
    const res = await fetchLaravel(path)
    if (!res.ok) throw new Error(`request_failed_${res.status}`)
    return res.json()
}

// Loads everything the dashboard shows; sections the role can't access resolve to null.
async function fetchDashboard(role) {
    const full = FULL_ADMINS.includes(role)
    const tasks = {
        users: getJson('/api/admin/users'),
        tickets: getJson('/api/help/admin/tickets'),
        logs: getJson('/api/admin/site-logs?resolved=0&per_page=10'),
        businesses: getJson('/api/admin/businesses'),
        ...(full ? {
            subscriptions: getJson('/api/admin/subscriptions'),
            openai: getJson('/api/admin/system-config/openai-api-key'),
            projectApi: getJson('/api/admin/system-config/project-api'),
            appSettings: getJson('/api/admin/system-config/app-settings'),
            stripe: getJson('/api/admin/system-config/stripe'),
        } : {}),
    }
    const keys = Object.keys(tasks)
    const settled = await Promise.allSettled(Object.values(tasks))
    const next = {}
    settled.forEach((result, i) => {
        next[keys[i]] = result.status === 'fulfilled' ? result.value : null
    })
    return next
}

const greetingFor = (date) => {
    const h = date.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
}

const formatMoney = (cents, currency = 'usd') => {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format((cents || 0) / 100)
    } catch {
        return `$${((cents || 0) / 100).toFixed(2)}`
    }
}

const timeAgo = (iso) => {
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return ''
    const s = Math.max(0, Math.round((Date.now() - t) / 1000))
    if (s < 60) return 'just now'
    const m = Math.round(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.round(h / 24)
    return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString()
}

const initials = (text) => {
    const v = String(text || '?').trim()
    const base = v.includes('@') ? v.split('@')[0] : v
    const parts = base.split(/[\s._-]+/).filter(Boolean)
    return (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 2)).toUpperCase()
}

function StatCard({ icon: Icon, label, value, hint, tone = 'brand', href, loading }) {
    const body = (
        <>
            <div className="nba-stat-top">
                <span className={`nba-stat-icon is-${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
                {href && <ArrowUpRightIcon className="nba-stat-arrow h-4 w-4" />}
            </div>
            <div className="nba-stat-label">{label}</div>
            {loading ? <span className="nba-skel h-8 w-20" /> : <div className="nba-stat-value">{value}</div>}
            <div className="nba-stat-hint">{loading ? <span className="nba-skel h-3 w-28" /> : hint}</div>
        </>
    )
    return href ? <Link href={href} className="nba-stat">{body}</Link> : <div className="nba-stat">{body}</div>
}

function Card({ title, action, children, className = '' }) {
    return (
        <section className={`nba-card ${className}`}>
            <div className="nba-card-head">
                <h2 className="nba-card-title">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    )
}

// Role and first name come from the signed-in session in localStorage.
const subscribeToIdentity = (callback) => {
    window.addEventListener('storage', callback)
    window.addEventListener('assistant-profile-updated', callback)
    return () => {
        window.removeEventListener('storage', callback)
        window.removeEventListener('assistant-profile-updated', callback)
    }
}

const identitySnapshot = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const display = String(user.display_name || user.email || '').trim()
        const first = display.includes('@') ? display.split('@')[0] : (display.split(/\s+/)[0] || '')
        return `${readAdminRole()}|${first}`
    } catch {
        return 'admin|'
    }
}

export default function AdminDashboardPage() {
    const identity = useSyncExternalStore(subscribeToIdentity, identitySnapshot, () => '')
    const [role, name] = identity ? identity.split('|') : ['admin', '']
    const [now, setNow] = useState(null)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({})

    const applyResults = useCallback((next) => {
        setData(next)
        setNow(new Date())
        setLoading(false)
    }, [])

    useEffect(() => {
        if (!identity) return undefined
        let cancelled = false
        fetchDashboard(role).then((next) => {
            if (!cancelled) applyResults(next)
        })
        return () => {
            cancelled = true
        }
    }, [identity, role, applyResults])

    const refresh = () => {
        setLoading(true)
        void fetchDashboard(role).then(applyResults)
    }

    const stats = useMemo(() => {
        const users = Array.isArray(data.users?.users) ? data.users.users : null
        const siteUsers = users ? users.filter((u) => u.role === 'user') : null
        const weekAgo = now ? now.getTime() - 7 * 86400000 : 0
        const subs = Array.isArray(data.subscriptions?.subscriptions) ? data.subscriptions.subscriptions : null
        const activeSubs = subs ? subs.filter((s) => s.is_active || s.status === 'active') : null
        const tickets = Array.isArray(data.tickets?.tickets) ? data.tickets.tickets : null
        const openTickets = tickets ? tickets.filter((t) => t.status !== 'closed') : null
        const planMix = {}
        ;(activeSubs || []).forEach((s) => {
            const plan = s.plan?.name || 'Unknown'
            planMix[plan] = (planMix[plan] || 0) + 1
        })
        return {
            users,
            siteUsers,
            newThisWeek: siteUsers ? siteUsers.filter((u) => new Date(u.created_at).getTime() >= weekAgo).length : null,
            activeUsers: siteUsers ? siteUsers.filter((u) => u.is_active !== false).length : null,
            activeSubs,
            revenueCents: activeSubs ? activeSubs.reduce((sum, s) => sum + (Number(s.amount_cents) || 0), 0) : null,
            currency: activeSubs?.[0]?.currency || 'usd',
            planMix: Object.entries(planMix).sort((a, b) => b[1] - a[1]),
            tickets,
            openTickets,
            awaitingReply: openTickets ? openTickets.filter((t) => t.status === 'open').length : null,
            unresolvedErrors: data.logs?.meta?.total ?? null,
            recentLogs: Array.isArray(data.logs?.logs) ? data.logs.logs.slice(0, 5) : [],
            recentUsers: siteUsers ? [...siteUsers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5) : [],
            businesses: Array.isArray(data.businesses) ? data.businesses : null,
        }
    }, [data, now])

    const full = FULL_ADMINS.includes(role)
    const settings = data.appSettings?.settings || null
    const health = full ? [
        { label: 'AI service', ok: Boolean(data.projectApi?.configured), detail: data.projectApi?.configured ? 'Connected' : 'Not connected' },
        { label: 'OpenAI key', ok: Boolean(data.openai?.set), detail: data.openai?.set ? 'Configured' : 'Missing' },
        {
            label: 'Payments',
            ok: data.stripe ? Boolean(data.stripe.enabled && data.stripe.configured) : null,
            detail: !data.stripe
                ? 'Unknown'
                : !data.stripe.enabled
                    ? 'Disabled'
                    : data.stripe.configured
                        ? `Enabled · ${data.stripe.environment === 'live' ? 'Live' : 'Test'} mode`
                        : 'Keys missing',
        },
        { label: 'Maintenance mode', ok: settings ? !settings.maintenance_mode : null, detail: settings ? (settings.maintenance_mode ? 'On — users are blocked' : 'Off') : 'Unknown' },
        { label: 'User sign-ups', ok: settings ? settings.user_signup_enabled : null, detail: settings ? (settings.user_signup_enabled ? 'Open' : 'Closed') : 'Unknown' },
        { label: 'User chat', ok: settings ? settings.user_chat_enabled : null, detail: settings ? (settings.user_chat_enabled ? 'Enabled' : 'Disabled') : 'Unknown' },
    ] : []
    const healthIssues = health.filter((item) => item.ok === false).length
    const maxPlan = Math.max(1, ...stats.planMix.map(([, count]) => count))
    const shortcuts = navItemsForRole(role).filter((item) => item.href !== '/admin/dashboard')

    return (
        <AdminShell title="Dashboard" subtitle="Your workspace at a glance.">
            <div className="nba-dash">
                <section className="nba-hero">
                    <div className="nba-hero-glow" aria-hidden="true" />
                    <div className="relative min-w-0">
                        <div className="nba-hero-date">
                            {now ? now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ' '}
                        </div>
                        <h2 className="nba-hero-title">
                            {now ? greetingFor(now) : 'Welcome'}{name ? `, ${name.charAt(0).toUpperCase()}${name.slice(1)}` : ''}
                        </h2>
                        <div className="nba-hero-sub">
                            {loading
                                ? 'Gathering the latest numbers…'
                                : healthIssues > 0
                                    ? `${healthIssues} system check${healthIssues === 1 ? ' needs' : 's need'} your attention.`
                                    : 'Everything is running smoothly.'}
                        </div>
                    </div>
                    <div className="nba-hero-actions">
                        <Link href="/add-document" className="nba-btn is-light">
                            <UploadIcon className="h-4 w-4" />
                            Upload document
                        </Link>
                        <Link href="/admin/chat" className="nba-btn is-ghost-light">
                            <MessageSquareIcon className="h-4 w-4" />
                            Test assistant
                        </Link>
                    </div>
                </section>

                <div className="nba-stats">
                    <StatCard
                        icon={UsersIcon}
                        label="Users"
                        loading={loading}
                        value={stats.siteUsers ? stats.siteUsers.length.toLocaleString() : '—'}
                        hint={stats.siteUsers ? `${stats.activeUsers} active · ${stats.newThisWeek} new this week` : 'Unavailable'}
                        href="/manage-users"
                    />
                    {full && (
                        <StatCard
                            icon={CreditCardIcon}
                            tone="green"
                            label="Active subscriptions"
                            loading={loading}
                            value={stats.activeSubs ? stats.activeSubs.length.toLocaleString() : '—'}
                            hint={stats.activeSubs ? `${formatMoney(stats.revenueCents, stats.currency)} this period` : 'Unavailable'}
                            href="/manage-subscriptions"
                        />
                    )}
                    <StatCard
                        icon={LifebuoyIcon}
                        tone="amber"
                        label="Open tickets"
                        loading={loading}
                        value={stats.openTickets ? stats.openTickets.length.toLocaleString() : '—'}
                        hint={stats.openTickets ? (stats.awaitingReply ? `${stats.awaitingReply} awaiting a reply` : 'All caught up') : 'Unavailable'}
                        href="/manage-help"
                    />
                    <StatCard
                        icon={BugIcon}
                        tone="red"
                        label="Unresolved errors"
                        loading={loading}
                        value={stats.unresolvedErrors !== null ? stats.unresolvedErrors.toLocaleString() : '—'}
                        hint={stats.unresolvedErrors ? 'Review in Site logs' : stats.unresolvedErrors === 0 ? 'No open issues' : 'Unavailable'}
                        href="/manage-site-logs"
                    />
                </div>

                <div className="nba-grid">
                    <Card
                        title="Newest users"
                        className="is-wide"
                        action={<Link href="/manage-users" className="nba-card-link">View all <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}
                    >
                        {loading ? (
                            <div className="space-y-3">{[0, 1, 2].map((i) => <span key={i} className="nba-skel h-10 w-full" />)}</div>
                        ) : stats.recentUsers.length === 0 ? (
                            <div className="nba-empty">No users yet.</div>
                        ) : (
                            <ul className="nba-list">
                                {stats.recentUsers.map((u) => (
                                    <li key={u.id} className="nba-list-row">
                                        <span className="nba-avatar is-sm is-soft">{initials(u.display_name || u.email)}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="nba-list-title">{u.display_name || u.email}</div>
                                            <div className="nba-list-sub">{u.email}{u.workspace_name ? ` · ${u.workspace_name}` : ''}</div>
                                        </div>
                                        <span className={`nba-pill ${u.is_active === false ? 'is-neutral' : 'is-success'}`}>
                                            {u.is_active === false ? 'Inactive' : 'Active'}
                                        </span>
                                        <span className="nba-list-meta">{timeAgo(u.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    {full && (
                        <Card title="System status">
                            {loading ? (
                                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <span key={i} className="nba-skel h-6 w-full" />)}</div>
                            ) : (
                                <ul className="nba-health">
                                    {health.map((item) => (
                                        <li key={item.label}>
                                            <span className={`nba-dot ${item.ok === null ? 'is-unknown' : item.ok ? 'is-ok' : 'is-bad'}`} />
                                            <span className="nba-health-label">{item.label}</span>
                                            <span className={`nba-health-detail ${item.ok === false ? 'is-bad' : ''}`}>{item.detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link href="/manage-settings" className="nba-card-footer-link">Open settings <ArrowRightIcon className="h-3.5 w-3.5" /></Link>
                        </Card>
                    )}

                    {full && (
                        <Card title="Plan mix" action={<span className="nba-card-meta">Active subscriptions</span>}>
                            {loading ? (
                                <div className="space-y-3">{[0, 1, 2].map((i) => <span key={i} className="nba-skel h-6 w-full" />)}</div>
                            ) : stats.planMix.length === 0 ? (
                                <div className="nba-empty">No active subscriptions yet.</div>
                            ) : (
                                <ul className="nba-bars">
                                    {stats.planMix.map(([plan, count]) => (
                                        <li key={plan}>
                                            <div className="nba-bar-head"><span>{plan}</span><strong>{count}</strong></div>
                                            <div className="nba-bar"><span style={{ width: `${(count / maxPlan) * 100}%` }} /></div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    )}

                    <Card
                        title="Recent errors"
                        className={full ? 'is-wide' : ''}
                        action={(
                            <div className="flex items-center gap-1">
                                <button type="button" className="nba-icon-btn" onClick={refresh} aria-label="Refresh" title="Refresh">
                                    <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <Link href="/manage-site-logs" className="nba-card-link">Site logs <ArrowRightIcon className="h-3.5 w-3.5" /></Link>
                            </div>
                        )}
                    >
                        {loading ? (
                            <div className="space-y-3">{[0, 1, 2].map((i) => <span key={i} className="nba-skel h-9 w-full" />)}</div>
                        ) : stats.recentLogs.length === 0 ? (
                            <div className="nba-empty">No unresolved errors. Nice!</div>
                        ) : (
                            <ul className="nba-list">
                                {stats.recentLogs.map((log) => (
                                    <li key={log.id} className="nba-list-row">
                                        <span className={`nba-pill is-${log.severity === 'critical' || log.severity === 'error' ? 'danger' : log.severity === 'warning' ? 'warning' : 'neutral'}`}>
                                            {log.severity}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="nba-list-title is-mono">{log.message}</div>
                                            <div className="nba-list-sub">{log.source}{log.request_path ? ` · ${log.request_path}` : ''}</div>
                                        </div>
                                        <span className="nba-list-meta">{timeAgo(log.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <section>
                    <h2 className="nba-section-title">Shortcuts</h2>
                    <div className="nba-shortcuts">
                        {shortcuts.map(({ href, label, description, icon: Icon }) => (
                            <Link key={href} href={href} className="nba-shortcut">
                                <span className="nba-shortcut-icon"><Icon className="h-[18px] w-[18px]" /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="nba-shortcut-label">{label}</span>
                                    <span className="nba-shortcut-desc">{description}</span>
                                </span>
                                <ArrowRightIcon className="nba-shortcut-arrow h-4 w-4" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </AdminShell>
    )
}
