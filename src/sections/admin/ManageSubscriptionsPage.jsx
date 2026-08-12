'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Ban as BanIcon,
    Eye as EyeIcon,
    Pencil as PencilIcon,
    Plus as PlusIcon,
    RefreshCw as RefreshIcon,
    RotateCcw as RotateCcwIcon,
    Search as SearchIcon,
    Trash2 as TrashIcon,
    X as XIcon,
} from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'replaced', label: 'Replaced' },
]

const emptyAssignForm = {
    user_id: '',
    plan_id: '',
}

const emptyEditForm = {
    plan_id: '',
    status: 'active',
    tokens_included: '',
    tokens_used: '',
    current_period_start: '',
    current_period_end: '',
}

const formatDate = (value, withTime = false) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
        })
    } catch {
        return '—'
    }
}

const formatTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}

const toInputDate = (value) => {
    if (!value) return ''
    try {
        return new Date(value).toISOString().slice(0, 16)
    } catch {
        return ''
    }
}

const statusClass = (status) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700'
        case 'expired':
            return 'bg-amber-50 text-amber-800'
        case 'cancelled':
            return 'bg-rose-50 text-rose-700'
        case 'replaced':
            return 'bg-slate-100 text-slate-600'
        default:
            return 'bg-slate-100 text-slate-600'
    }
}

export default function ManageSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState([])
    const [plans, setPlans] = useState([])
    const [users, setUsers] = useState([])
    const [status, setStatus] = useState('')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState('')
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [assignForm, setAssignForm] = useState(emptyAssignForm)
    const [editForm, setEditForm] = useState(emptyEditForm)
    const [saving, setSaving] = useState(false)

    const loadSubscriptions = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchLaravel('/api/admin/subscriptions')
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not load subscriptions.')
            setSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : [])
        } catch (err) {
            toast.error(err.message || 'Could not load subscriptions.')
            setSubscriptions([])
        } finally {
            setLoading(false)
        }
    }, [])

    const loadLookups = useCallback(async () => {
        try {
            const [plansRes, usersRes] = await Promise.all([
                fetchLaravel('/api/admin/plans'),
                fetchLaravel('/api/admin/users?role=user'),
            ])
            const plansData = await plansRes.json().catch(() => null)
            const usersData = await usersRes.json().catch(() => null)
            if (plansRes.ok) setPlans(Array.isArray(plansData?.plans) ? plansData.plans : [])
            if (usersRes.ok) setUsers(Array.isArray(usersData?.users) ? usersData.users : [])
        } catch {
            /* lookups are optional for list view */
        }
    }, [])

    useEffect(() => {
        void loadLookups()
    }, [loadLookups])

    useEffect(() => {
        void loadSubscriptions()
    }, [loadSubscriptions])

    const counts = useMemo(() => {
        const base = { active: 0, expired: 0, cancelled: 0, replaced: 0 }
        for (const item of subscriptions) {
            if (base[item.status] !== undefined) base[item.status] += 1
        }
        return base
    }, [subscriptions])

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase()
        return subscriptions.filter((item) => {
            if (status && item.status !== status) return false
            if (!q) return true
            const email = String(item.user?.email || '').toLowerCase()
            const name = String(item.user?.display_name || '').toLowerCase()
            const plan = String(item.plan?.name || '').toLowerCase()
            return email.includes(q) || name.includes(q) || plan.includes(q)
        })
    }, [subscriptions, status, search])

    const openView = (item) => {
        setSelected(item)
        setModal('view')
    }

    const openAssign = () => {
        setAssignForm(emptyAssignForm)
        setModal('assign')
    }

    const openEdit = (item) => {
        setSelected(item)
        setEditForm({
            plan_id: item.plan_id || item.plan?.id || '',
            status: item.status || 'active',
            tokens_included: String(item.tokens_included ?? ''),
            tokens_used: String(item.tokens_used ?? ''),
            current_period_start: toInputDate(item.current_period_start),
            current_period_end: toInputDate(item.current_period_end),
        })
        setModal('edit')
    }

    const runAction = async (item, action) => {
        const labels = {
            activate: 'Activate this subscription?',
            reactivate: 'Reactivate for a new monthly period? Chat will unlock for this user.',
            cancel: 'Cancel this subscription? Chat will stop until reactivation.',
            delete: 'Permanently delete this subscription record?',
        }
        if (!window.confirm(labels[action] || 'Continue?')) return

        setBusyId(`${item.id}:${action}`)
        try {
            const path =
                action === 'delete'
                    ? `/api/admin/subscriptions/${item.id}`
                    : `/api/admin/subscriptions/${item.id}/${action}`
            const res = await fetchLaravel(path, {
                method: action === 'delete' ? 'DELETE' : 'POST',
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || `Could not ${action} subscription.`)
            toast.success(data?.message || `Subscription ${action}d.`)
            setModal(null)
            await loadSubscriptions()
        } catch (err) {
            toast.error(err.message || `Could not ${action} subscription.`)
        } finally {
            setBusyId('')
        }
    }

    const submitAssign = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            const res = await fetchLaravel('/api/admin/subscriptions', {
                method: 'POST',
                body: JSON.stringify(assignForm),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not assign subscription.')
            toast.success('Monthly subscription activated. Chat is unlocked for this user.')
            setModal(null)
            await loadSubscriptions()
        } catch (err) {
            toast.error(err.message || 'Could not assign subscription.')
        } finally {
            setSaving(false)
        }
    }

    const submitEdit = async (event) => {
        event.preventDefault()
        if (!selected) return
        setSaving(true)
        try {
            const body = {
                plan_id: editForm.plan_id || undefined,
                status: editForm.status,
                tokens_included: editForm.tokens_included === '' ? undefined : Number(editForm.tokens_included),
                tokens_used: editForm.tokens_used === '' ? undefined : Number(editForm.tokens_used),
                current_period_start: editForm.current_period_start
                    ? new Date(editForm.current_period_start).toISOString()
                    : undefined,
                current_period_end: editForm.current_period_end
                    ? new Date(editForm.current_period_end).toISOString()
                    : undefined,
            }
            const res = await fetchLaravel(`/api/admin/subscriptions/${selected.id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not update subscription.')
            toast.success('Subscription updated.')
            setModal(null)
            await loadSubscriptions()
        } catch (err) {
            toast.error(err.message || 'Could not update subscription.')
        } finally {
            setSaving(false)
        }
    }

    const usagePercent = (item) => {
        const included = Number(item.tokens_included) || 0
        const used = Number(item.tokens_used) || 0
        if (included <= 0) return 0
        return Math.min(100, Math.round((used / included) * 100))
    }

    return (
        <div className="mx-auto max-w-6xl space-y-3 p-4 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="admin-page-desc max-w-2xl">
                    Monthly plans only — no auto-renew. Chat stops when a period ends until the user or an admin reactivates.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void loadSubscriptions()} className="admin-btn-secondary">
                        <RefreshIcon className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                    <button type="button" onClick={openAssign} className="admin-btn-primary">
                        <PlusIcon className="h-3.5 w-3.5" />
                        Assign plan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {[
                    { key: '', label: 'All', value: subscriptions.length, active: 'text-slate-800', ring: 'ring-slate-200' },
                    { key: 'active', label: 'Active', value: counts.active, active: 'text-emerald-700', ring: 'ring-emerald-200' },
                    { key: 'expired', label: 'Expired', value: counts.expired, active: 'text-amber-700', ring: 'ring-amber-200' },
                    { key: 'cancelled', label: 'Cancelled', value: counts.cancelled, active: 'text-rose-700', ring: 'ring-rose-200' },
                ].map((card) => (
                    <button
                        key={card.label}
                        type="button"
                        onClick={() => setStatus(card.key)}
                        className={`rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm transition ${
                            status === card.key
                                ? `border-[#2EAADB] ring-2 ${card.ring}`
                                : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <p className="admin-kicker">{card.label}</p>
                        <p className={`mt-0.5 text-lg font-semibold tabular-nums ${card.active}`}>{card.value}</p>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search email or name"
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15"
                    />
                </div>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-8 min-w-[140px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15"
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Usage</th>
                                <th>Period</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="cell-empty">Loading…</td>
                                </tr>
                            ) : visible.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="cell-empty">No subscriptions found.</td>
                                </tr>
                            ) : (
                                visible.map((item) => {
                                    const percent = usagePercent(item)
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <p className="max-w-[180px] truncate font-medium text-slate-800">
                                                    {item.user?.display_name || item.user?.email || '—'}
                                                </p>
                                                <p className="cell-muted max-w-[180px] truncate">{item.user?.email}</p>
                                            </td>
                                            <td>
                                                <p className="font-medium text-slate-800">{item.plan?.name || '—'}</p>
                                                <p className="cell-muted">{item.plan?.price_display || '—'} / month</p>
                                            </td>
                                            <td>
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>
                                                <p className="tabular-nums">
                                                    {formatTokens(item.tokens_used)} / {formatTokens(item.tokens_included)}
                                                </p>
                                                <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${percent >= 90 ? 'bg-rose-500' : 'bg-[#2EAADB]'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap">
                                                <p>{formatDate(item.current_period_start)}</p>
                                                <p className="cell-muted">ends {formatDate(item.current_period_end)}</p>
                                            </td>
                                            <td className="col-actions">
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <button type="button" title="View" onClick={() => openView(item)} className="admin-icon-btn">
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" title="Edit" onClick={() => openEdit(item)} className="admin-icon-btn">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    {item.status !== 'active' ? (
                                                        <button
                                                            type="button"
                                                            title="Reactivate"
                                                            disabled={busyId.startsWith(item.id)}
                                                            onClick={() => void runAction(item, 'reactivate')}
                                                            className="admin-icon-btn text-emerald-600 hover:bg-emerald-50"
                                                        >
                                                            <RotateCcwIcon className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            title="Cancel"
                                                            disabled={busyId.startsWith(item.id)}
                                                            onClick={() => void runAction(item, 'cancel')}
                                                            className="admin-icon-btn text-amber-600 hover:bg-amber-50"
                                                        >
                                                            <BanIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        disabled={busyId.startsWith(item.id)}
                                                        onClick={() => void runAction(item, 'delete')}
                                                        className="admin-icon-btn text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="admin-section-title">
                                {modal === 'view' && 'Subscription details'}
                                {modal === 'assign' && 'Assign monthly plan'}
                                {modal === 'edit' && 'Update subscription'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {modal === 'view' && selected && (
                            <div className="space-y-3 px-5 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Detail label="User" value={selected.user?.display_name || selected.user?.email || '—'} />
                                    <Detail label="Email" value={selected.user?.email || '—'} />
                                    <Detail label="Plan" value={`${selected.plan?.name || '—'} · ${selected.plan?.price_display || '—'}/mo`} />
                                    <Detail label="Status" value={selected.status} />
                                    <Detail label="Period start" value={formatDate(selected.current_period_start, true)} />
                                    <Detail label="Period end" value={formatDate(selected.current_period_end, true)} />
                                    <Detail
                                        label="Tokens"
                                        value={`${formatTokens(selected.tokens_used)} used / ${formatTokens(selected.tokens_included)} included`}
                                    />
                                    <Detail label="Auto-renew" value="Off — manual reactivation" />
                                </div>
                                <div className="flex flex-wrap justify-end gap-2 pt-2">
                                    {selected.status !== 'active' ? (
                                        <button
                                            type="button"
                                            onClick={() => void runAction(selected, 'reactivate')}
                                            className="admin-btn-primary"
                                        >
                                            Reactivate month
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => void runAction(selected, 'cancel')}
                                            className="admin-btn-secondary"
                                        >
                                            Cancel subscription
                                        </button>
                                    )}
                                    <button type="button" onClick={() => openEdit(selected)} className="admin-btn-secondary">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        )}

                        {modal === 'assign' && (
                            <form onSubmit={submitAssign} className="space-y-3 px-5 py-4">
                                <label className="admin-label">
                                    Site user
                                    <select
                                        required
                                        value={assignForm.user_id}
                                        onChange={(e) => setAssignForm((current) => ({ ...current, user_id: e.target.value }))}
                                        className="admin-input mt-1"
                                    >
                                        <option value="">Select user</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.display_name || user.email} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="admin-label">
                                    Monthly plan
                                    <select
                                        required
                                        value={assignForm.plan_id}
                                        onChange={(e) => setAssignForm((current) => ({ ...current, plan_id: e.target.value }))}
                                        className="admin-input mt-1"
                                    >
                                        <option value="">Select plan</option>
                                        {plans.filter((plan) => plan.is_active).map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} · {plan.price_display}/mo · {formatTokens(plan.monthly_token_limit)} tokens
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    Starts a new 1-month period with this plan&apos;s token quota. Chat unlocks immediately.
                                </p>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setModal(null)} className="admin-btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className="admin-btn-primary">
                                        {saving ? 'Saving…' : 'Activate'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {modal === 'edit' && (
                            <form onSubmit={submitEdit} className="space-y-3 px-5 py-4">
                                <label className="admin-label">
                                    Plan
                                    <select
                                        value={editForm.plan_id}
                                        onChange={(e) => setEditForm((current) => ({ ...current, plan_id: e.target.value }))}
                                        className="admin-input mt-1"
                                    >
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} · {plan.price_display}/mo
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="admin-label">
                                    Status
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm((current) => ({ ...current, status: e.target.value }))}
                                        className="admin-input mt-1"
                                    >
                                        {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="admin-label min-w-0">
                                        Tokens included
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.tokens_included}
                                            onChange={(e) => setEditForm((current) => ({ ...current, tokens_included: e.target.value }))}
                                            className="admin-input mt-1"
                                        />
                                    </label>
                                    <label className="admin-label min-w-0">
                                        Tokens used
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.tokens_used}
                                            onChange={(e) => setEditForm((current) => ({ ...current, tokens_used: e.target.value }))}
                                            className="admin-input mt-1"
                                        />
                                    </label>
                                    <label className="admin-label min-w-0">
                                        Period start
                                        <input
                                            type="datetime-local"
                                            value={editForm.current_period_start}
                                            onChange={(e) => setEditForm((current) => ({ ...current, current_period_start: e.target.value }))}
                                            className="admin-input mt-1 min-w-0"
                                        />
                                    </label>
                                    <label className="admin-label min-w-0">
                                        Period end
                                        <input
                                            type="datetime-local"
                                            value={editForm.current_period_end}
                                            onChange={(e) => setEditForm((current) => ({ ...current, current_period_end: e.target.value }))}
                                            className="admin-input mt-1 min-w-0"
                                        />
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setModal(null)} className="admin-btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className="admin-btn-primary">
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function Detail({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="admin-kicker">{label}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{value}</p>
        </div>
    )
}
