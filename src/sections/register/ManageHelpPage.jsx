'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import RequireAuth from '@/components/RequireAuth'
import { fetchLaravel, getLaravelApiUrl, getStoredAdminToken } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'
import {
    ArrowLeft as ArrowLeftIcon,
    Paperclip as PaperclipIcon,
    LifeBuoy as LifebuoyIcon,
} from 'lucide-react'
import useHelpTicketPolling from '@/hooks/useHelpTicketPolling'

const formatDate = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    } catch {
        return '—'
    }
}

const statusClass = (status) => {
    if (status === 'answered') return 'bg-emerald-50 text-emerald-700'
    if (status === 'closed') return 'bg-slate-100 text-slate-600'
    return 'bg-amber-50 text-amber-800'
}

function ManageHelpInner({ embedded = false }) {
    const [tickets, setTickets] = useState([])
    const [filter, setFilter] = useState('')
    const [selectedId, setSelectedId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reply, setReply] = useState('')
    const [sending, setSending] = useState(false)
    const [statusBusy, setStatusBusy] = useState(false)
    const selectedIdRef = useRef(selectedId)

    useEffect(() => {
        selectedIdRef.current = selectedId
    }, [selectedId])

    const loadTickets = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true)
        }
        try {
            const currentSelectedId = selectedIdRef.current
            const query = filter ? `?status=${encodeURIComponent(filter)}` : ''
            const [listRes, detailRes] = await Promise.all([
                fetchLaravel(`/api/help/admin/tickets${query}`),
                currentSelectedId
                    ? fetchLaravel(`/api/help/admin/tickets/${currentSelectedId}`)
                    : Promise.resolve(null),
            ])
            const data = await listRes.json().catch(() => null)
            if (!listRes.ok) {
                throw new Error(data?.detail || 'Could not load help requests.')
            }
            let next = Array.isArray(data?.tickets) ? data.tickets : []

            if (detailRes) {
                const detailData = await detailRes.json().catch(() => null)
                if (detailRes.ok && detailData?.ticket) {
                    const fresh = detailData.ticket
                    const idx = next.findIndex((t) => t.id === fresh.id)
                    if (idx >= 0) next = next.map((t) => (t.id === fresh.id ? fresh : t))
                    else next = [fresh, ...next]
                }
            }

            setTickets(next)
            setSelectedId((current) => {
                if (current && next.some((t) => t.id === current)) return current
                if (silent && current) return current
                return next[0]?.id || null
            })
        } catch (err) {
            if (!silent) {
                toast.error(err.message || 'Could not load help requests.')
                setTickets([])
            }
        } finally {
            if (!silent) setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        void loadTickets()
        // Clear inbox notifications when admin opens the help inbox.
        void fetchLaravel('/api/help/notifications/read-all', { method: 'POST' }).catch(() => null)
    }, [loadTickets])

    useHelpTicketPolling(loadTickets, {
        enabled: true,
        intervalMs: 3000,
    })

    const selected = useMemo(
        () => tickets.find((ticket) => ticket.id === selectedId) || null,
        [tickets, selectedId]
    )

    const downloadAttachment = async (ticket) => {
        if (!ticket?.has_attachment) return
        const token = getStoredAdminToken()
        const url = getLaravelApiUrl(ticket.attachment.download_url)
        const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
        })
        if (!res.ok) {
            toast.error('Could not download the attachment.')
            return
        }
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = ticket.attachment?.name || 'attachment'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(objectUrl)
    }

    const sendReply = async (e) => {
        e.preventDefault()
        if (!selected) return
        if (selected.status === 'closed') {
            toast.error('This ticket is closed. Reopen it before replying.')
            return
        }
        setSending(true)
        try {
            const res = await fetchLaravel(`/api/help/admin/tickets/${selected.id}/reply`, {
                method: 'POST',
                body: JSON.stringify({ message: reply.trim() }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not send the reply.')
            }
            setReply('')
            toast.success('Reply posted in the ticket chat.')
            if (data?.ticket) {
                setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)))
            } else {
                await loadTickets()
            }
        } catch (err) {
            toast.error(err.message || 'Could not send the reply.')
        } finally {
            setSending(false)
        }
    }

    const setTicketStatus = async (action) => {
        if (!selected) return
        setStatusBusy(true)
        try {
            const res = await fetchLaravel(`/api/help/admin/tickets/${selected.id}/${action}`, {
                method: 'POST',
                body: '{}',
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || `Could not ${action} the ticket.`)
            }
            toast.success(action === 'close' ? 'Ticket closed. Chat replies are disabled.' : 'Ticket reopened.')
            if (data?.ticket) {
                setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)))
            } else {
                await loadTickets()
            }
        } catch (err) {
            toast.error(err.message || `Could not ${action} the ticket.`)
        } finally {
            setStatusBusy(false)
        }
    }

    return (
        <div className={embedded ? '' : 'min-h-screen bg-[#F4F7FA]'}>
            <div className={`mx-auto max-w-6xl ${embedded ? 'space-y-3 p-4 lg:p-5' : 'space-y-3 px-4 py-8 lg:px-6'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        {!embedded && (
                            <>
                                <Link href="/admin/chat" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#053447]">
                                    <ArrowLeftIcon className="size-3.5" />
                                    Back to chat
                                </Link>
                                <h1 className="admin-console-title flex items-center gap-2">
                                    <LifebuoyIcon className="size-4 text-[#2EAADB]" />
                                    Help
                                </h1>
                                <p className="admin-page-desc mt-1">
                                    Review support requests and reply in ticket chat. Messages refresh automatically.
                                </p>
                            </>
                        )}
                        {embedded && (
                            <p className="admin-page-desc">
                                Messages refresh automatically.
                            </p>
                        )}
                    </div>
                    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                        {['open', 'answered', 'closed', ''].map((value) => {
                            const label = value || 'all'
                            const active = filter === value
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setFilter(value)}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                                        active
                                            ? 'bg-[#053447] text-white'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
                    <aside className="admin-table-wrap max-h-[70vh] overflow-y-auto">
                        <table className="admin-table admin-table-compact">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={2} className="cell-empty">Loading…</td>
                                    </tr>
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="cell-empty">No requests in this filter.</td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            className={selectedId === ticket.id ? 'is-selected' : ''}
                                        >
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedId(ticket.id)
                                                    }}
                                                    className="w-full text-left"
                                                >
                                                    <p className="font-mono text-[10px] font-semibold tracking-wide text-[#2EAADB]">
                                                        {ticket.ticket_number || ticket.id}
                                                    </p>
                                                    <p className="mt-0.5 line-clamp-1 font-medium text-slate-800">
                                                        {ticket.subject}
                                                    </p>
                                                    <p className="cell-muted mt-0.5 truncate">
                                                        {ticket.user?.display_name || ticket.email}
                                                    </p>
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <p className="cell-muted mt-1 whitespace-nowrap">{formatDate(ticket.created_at)}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </aside>

                    <section className="admin-panel">
                        {!selected ? (
                            <p className="admin-page-desc">Select a request to view details and reply.</p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-mono text-[10px] font-semibold tracking-wide text-[#2EAADB]">
                                                {selected.ticket_number || selected.id}
                                            </p>
                                            <h2 className="admin-section-title mt-1">{selected.subject}</h2>
                                            <p className="admin-page-desc mt-1">
                                                From {selected.user?.display_name || selected.email} · {selected.email}
                                            </p>
                                            <p className="admin-page-desc mt-0.5">{formatDate(selected.created_at)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(selected.status)}`}>
                                                {selected.status}
                                            </span>
                                            {selected.status === 'closed' ? (
                                                <button
                                                    type="button"
                                                    disabled={statusBusy}
                                                    onClick={() => void setTicketStatus('reopen')}
                                                    className="admin-btn-secondary"
                                                >
                                                    {statusBusy ? 'Working…' : 'Reopen ticket'}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={statusBusy}
                                                    onClick={() => void setTicketStatus('close')}
                                                    className="admin-btn-secondary"
                                                >
                                                    {statusBusy ? 'Working…' : 'Close ticket'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <p className="admin-kicker">Message</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                        {selected.message}
                                    </p>
                                    {selected.has_attachment ? (
                                        <button
                                            type="button"
                                            onClick={() => void downloadAttachment(selected)}
                                            className="admin-btn-secondary mt-3"
                                        >
                                            <PaperclipIcon className="size-3.5" />
                                            {selected.attachment?.name || 'Download attachment'}
                                        </button>
                                    ) : null}
                                </div>

                                {Array.isArray(selected.replies) && selected.replies.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="admin-kicker">Replies</p>
                                        {selected.replies.map((item) => {
                                            const fromUser = item.author_role === 'user'
                                            const label = fromUser
                                                ? (item.author?.display_name || item.author?.email || 'User')
                                                : (item.author?.display_name || item.admin?.display_name || item.admin?.email || 'Admin')
                                            return (
                                                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                                                    <p className={`text-xs ${fromUser ? 'text-slate-500' : 'text-[#2EAADB]'}`}>
                                                        {label} · {formatDate(item.created_at)}
                                                    </p>
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.message}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : null}

                                {selected.status === 'closed' ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                        This ticket is closed. Chat replies are disabled for both admin and user.
                                        {selected.closed_at ? ` Closed ${formatDate(selected.closed_at)}.` : ''}
                                    </div>
                                ) : (
                                    <form onSubmit={sendReply} className="space-y-3 border-t border-slate-100 pt-5">
                                        <label className="block">
                                            <span className="admin-label">
                                                Reply in ticket chat
                                            </span>
                                            <textarea
                                                value={reply}
                                                onChange={(e) => setReply(e.target.value)}
                                                className="admin-textarea min-h-[120px]"
                                                placeholder="Write your reply…"
                                                required
                                                maxLength={5000}
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={sending || !reply.trim()}
                                            className="admin-btn-primary"
                                        >
                                            {sending ? 'Sending…' : 'Send reply'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default function ManageHelpPage({ embedded = false }) {
    if (embedded) {
        return <ManageHelpInner embedded />
    }

    return (
        <RequireAuth>
            <ManageHelpInner />
        </RequireAuth>
    )
}
