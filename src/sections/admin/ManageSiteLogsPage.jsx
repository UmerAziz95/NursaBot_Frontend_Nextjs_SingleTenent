'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'
import {
    RefreshCw as RefreshIcon,
    Search as SearchIcon,
    ScrollText as ScrollTextIcon,
    Check as CheckIcon,
    Trash2 as TrashIcon,
    X as XIcon,
} from 'lucide-react'

const SEVERITIES = ['critical', 'error', 'warning', 'info', 'debug']
const SOURCES = ['laravel', 'python', 'frontend', 'chat', 'admin', 'user', 'system']

const formatDate = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
        })
    } catch {
        return '—'
    }
}

const severityClass = (severity) => {
    switch (severity) {
        case 'critical':
            return 'bg-red-100 text-red-800'
        case 'error':
            return 'bg-rose-50 text-rose-700'
        case 'warning':
            return 'bg-amber-50 text-amber-800'
        case 'info':
            return 'bg-sky-50 text-sky-700'
        default:
            return 'bg-slate-100 text-slate-600'
    }
}

const sourceClass = (source) => {
    switch (source) {
        case 'python':
            return 'bg-emerald-50 text-emerald-700'
        case 'frontend':
            return 'bg-violet-50 text-violet-700'
        case 'chat':
            return 'bg-cyan-50 text-cyan-700'
        case 'admin':
            return 'bg-indigo-50 text-indigo-700'
        case 'user':
            return 'bg-orange-50 text-orange-700'
        case 'system':
            return 'bg-slate-100 text-slate-700'
        default:
            return 'bg-[#EAF7FC] text-[#053447]'
    }
}

export default function ManageSiteLogsPage() {
    const [logs, setLogs] = useState([])
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 50 })
    const [loading, setLoading] = useState(true)
    const [severity, setSeverity] = useState('')
    const [source, setSource] = useState('')
    const [resolved, setResolved] = useState('0')
    const [q, setQ] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [busyId, setBusyId] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            setQ(searchInput.trim())
            setPage(1)
        }, 250)
        return () => clearTimeout(timer)
    }, [searchInput])

    const queryString = useMemo(() => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('per_page', '50')
        if (severity) params.set('severity', severity)
        if (source) params.set('source', source)
        if (resolved !== '') params.set('resolved', resolved)
        if (q) params.set('q', q)
        return params.toString()
    }, [page, severity, source, resolved, q])

    const loadLogs = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true)
        }
        try {
            const res = await fetchLaravel(`/api/admin/site-logs?${queryString}`)
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not load site logs.')
            }
            setLogs(Array.isArray(data?.logs) ? data.logs : [])
            setMeta(data?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 50 })
        } catch (err) {
            if (!silent) {
                toast.error(err.message || 'Could not load site logs.')
                setLogs([])
            }
        } finally {
            if (!silent) setLoading(false)
        }
    }, [queryString])

    useEffect(() => {
        void loadLogs()
    }, [loadLogs])

    const openDetail = async (logId) => {
        setDetailLoading(true)
        setSelected(null)
        try {
            const res = await fetchLaravel(`/api/admin/site-logs/${logId}`)
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not load log detail.')
            }
            setSelected(data?.log || null)
        } catch (err) {
            toast.error(err.message || 'Could not load log detail.')
        } finally {
            setDetailLoading(false)
        }
    }

    const resolveLog = async (logId) => {
        setBusyId(logId)
        try {
            const res = await fetchLaravel(`/api/admin/site-logs/${logId}/resolve`, { method: 'POST' })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not resolve log.')
            }
            toast.success('Log marked as resolved.')
            if (selected?.id === logId) setSelected(data?.log || selected)
            await loadLogs({ silent: true })
        } catch (err) {
            toast.error(err.message || 'Could not resolve log.')
        } finally {
            setBusyId('')
        }
    }

    const deleteLog = async (logId) => {
        if (!window.confirm('Delete this log entry permanently?')) return
        setBusyId(logId)
        try {
            const res = await fetchLaravel(`/api/admin/site-logs/${logId}`, { method: 'DELETE' })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not delete log.')
            }
            toast.success('Log deleted.')
            if (selected?.id === logId) setSelected(null)
            await loadLogs({ silent: true })
        } catch (err) {
            toast.error(err.message || 'Could not delete log.')
        } finally {
            setBusyId('')
        }
    }

    const clearResolved = async () => {
        if (!window.confirm('Clear all resolved logs? This cannot be undone.')) return
        setBusyId('clear')
        try {
            const res = await fetchLaravel('/api/admin/site-logs', {
                method: 'DELETE',
                body: JSON.stringify({ resolved_only: true }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not clear logs.')
            }
            toast.success(`Cleared ${data?.deleted ?? 0} resolved log(s).`)
            setSelected(null)
            setPage(1)
            await loadLogs({ silent: true })
        } catch (err) {
            toast.error(err.message || 'Could not clear logs.')
        } finally {
            setBusyId('')
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 lg:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="admin-page-desc">
                        Application errors from Laravel, Python, chat, admin actions, and the frontend.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="admin-btn-secondary inline-flex items-center gap-1.5"
                        onClick={() => void loadLogs()}
                        disabled={loading}
                    >
                        <RefreshIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        className="admin-btn-secondary inline-flex items-center gap-1.5 text-rose-700"
                        onClick={() => void clearResolved()}
                        disabled={busyId === 'clear'}
                    >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Clear resolved
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <label className="relative min-w-[220px] flex-1">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search message, path, email, correlation…"
                        className="admin-input w-full pl-8"
                    />
                </label>
                <select
                    value={severity}
                    onChange={(e) => {
                        setSeverity(e.target.value)
                        setPage(1)
                    }}
                    className="admin-input w-auto"
                >
                    <option value="">All severities</option>
                    {SEVERITIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
                <select
                    value={source}
                    onChange={(e) => {
                        setSource(e.target.value)
                        setPage(1)
                    }}
                    className="admin-input w-auto"
                >
                    <option value="">All sources</option>
                    {SOURCES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
                <select
                    value={resolved}
                    onChange={(e) => {
                        setResolved(e.target.value)
                        setPage(1)
                    }}
                    className="admin-input w-auto"
                >
                    <option value="0">Unresolved</option>
                    <option value="1">Resolved</option>
                    <option value="">All</option>
                </select>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="admin-table-wrap overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <p className="p-5 text-sm text-slate-500">Loading site logs…</p>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-10 text-center">
                            <ScrollTextIcon className="h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">No logs match these filters.</p>
                            <p className="text-xs text-slate-400">New errors from the app will appear here automatically.</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Severity</th>
                                    <th>Source</th>
                                    <th>Message</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className={`cursor-pointer ${selected?.id === log.id ? 'bg-[#EAF7FC]/60' : ''}`}
                                        onClick={() => void openDetail(log.id)}
                                    >
                                        <td className="whitespace-nowrap text-xs text-slate-500">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${severityClass(log.severity)}`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${sourceClass(log.source)}`}>
                                                {log.source}
                                            </span>
                                        </td>
                                        <td className="max-w-[320px]">
                                            <p className="truncate text-sm text-slate-800">{log.message}</p>
                                            <p className="truncate text-[11px] text-slate-400">
                                                {[log.request_method, log.request_path].filter(Boolean).join(' ') || log.category || '—'}
                                                {log.user_email ? ` · ${log.user_email}` : ''}
                                            </p>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                {!log.resolved_at && (
                                                    <button
                                                        type="button"
                                                        title="Resolve"
                                                        className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                                                        disabled={busyId === log.id}
                                                        onClick={() => void resolveLog(log.id)}
                                                    >
                                                        <CheckIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    title="Delete"
                                                    className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                                                    disabled={busyId === log.id}
                                                    onClick={() => void deleteLog(log.id)}
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                            <span>
                                Page {meta.current_page} of {meta.last_page} · {meta.total} total
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    disabled={page >= meta.last_page}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {detailLoading ? (
                        <p className="text-sm text-slate-500">Loading detail…</p>
                    ) : !selected ? (
                        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center">
                            <ScrollTextIcon className="h-7 w-7 text-slate-300" />
                            <p className="text-sm text-slate-500">Select a log to view stack trace and context.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${severityClass(selected.severity)}`}>
                                            {selected.severity}
                                        </span>
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${sourceClass(selected.source)}`}>
                                            {selected.source}
                                        </span>
                                        {selected.resolved_at && (
                                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                resolved
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mt-2 text-sm font-semibold text-[#053447]">{selected.message}</h3>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                    onClick={() => setSelected(null)}
                                    aria-label="Close detail"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>

                            <dl className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                <div>
                                    <dt className="font-semibold text-slate-400">When</dt>
                                    <dd>{formatDate(selected.created_at)}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">Status code</dt>
                                    <dd>{selected.status_code ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">Exception</dt>
                                    <dd className="break-all">{selected.exception_class || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">Category</dt>
                                    <dd>{selected.category || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">User</dt>
                                    <dd>{selected.user_email || selected.user_id || '—'}{selected.user_role ? ` (${selected.user_role})` : ''}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">Correlation</dt>
                                    <dd className="break-all">{selected.correlation_id || '—'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="font-semibold text-slate-400">Request</dt>
                                    <dd className="break-all">
                                        {[selected.request_method, selected.request_path || selected.request_url].filter(Boolean).join(' ') || '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">IP</dt>
                                    <dd>{selected.ip_address || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-400">User agent</dt>
                                    <dd className="line-clamp-2 break-all">{selected.user_agent || '—'}</dd>
                                </div>
                            </dl>

                            {selected.context && (
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Context</p>
                                    <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-700">
                                        {JSON.stringify(selected.context, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selected.stack_trace && (
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stack trace</p>
                                    <pre className="max-h-72 overflow-auto rounded-lg bg-[#0f172a] p-2.5 text-[11px] leading-relaxed text-slate-100">
                                        {selected.stack_trace}
                                    </pre>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                                {!selected.resolved_at && (
                                    <button
                                        type="button"
                                        className="admin-btn-primary inline-flex items-center gap-1.5"
                                        disabled={busyId === selected.id}
                                        onClick={() => void resolveLog(selected.id)}
                                    >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        Mark resolved
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="admin-btn-secondary inline-flex items-center gap-1.5 text-rose-700"
                                    disabled={busyId === selected.id}
                                    onClick={() => void deleteLog(selected.id)}
                                >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
