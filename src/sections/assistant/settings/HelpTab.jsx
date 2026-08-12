'use client'

import { useEffect, useMemo, useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Paperclip as PaperclipIcon, Trash2 as TrashIcon } from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { useSettings } from '@/sections/assistant/settings/SettingsContext'
import useHelpTicketPolling from '@/hooks/useHelpTicketPolling'
import { toast } from '@/lib/toast'

const fieldClass = 'user-portal-input'
const labelClass = 'user-portal-label'
const panelClass = 'user-portal-panel'

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

export default function HelpTab() {
    const { profile } = useSettings()
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [file, setFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [tickets, setTickets] = useState([])
    const [loadingTickets, setLoadingTickets] = useState(true)
    const [followUps, setFollowUps] = useState({})
    const [followBusy, setFollowBusy] = useState({})
    const [closeBusy, setCloseBusy] = useState({})

    const activeTicket = useMemo(
        () => tickets.find((ticket) => ticket.status === 'open' || ticket.status === 'answered') || null,
        [tickets]
    )

    useEffect(() => {
        if (profile?.email) setEmail(profile.email)
    }, [profile?.email])

    const loadTickets = async ({ silent = false } = {}) => {
        if (!silent) setLoadingTickets(true)
        try {
            const res = await fetchLaravel('/api/help/tickets/me')
            const data = await res.json().catch(() => null)
            if (res.ok) {
                setTickets(Array.isArray(data?.tickets) ? data.tickets : [])
            }
        } catch {
            // Keep the form usable even if history fails to load.
        } finally {
            if (!silent) setLoadingTickets(false)
        }
    }

    useEffect(() => {
        void loadTickets()
    }, [])

    useHelpTicketPolling(loadTickets, {
        enabled: true,
        intervalMs: 3000,
    })

    const resetForm = () => {
        setSubject('')
        setMessage('')
        setFile(null)
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (activeTicket) {
            toast.error(`You already have an active ticket (${activeTicket.ticket_number}). Close it before opening a new one.`)
            return
        }

        setSubmitting(true)

        try {
            const body = new FormData()
            body.append('email', email.trim())
            body.append('subject', subject.trim())
            body.append('message', message.trim())
            if (file) body.append('attachment', file)

            const res = await fetchLaravel('/api/help/tickets', {
                method: 'POST',
                body,
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not submit your request.')
            }

            toast.success(`Ticket ${data?.ticket?.ticket_number || ''} created. Continue the conversation in the ticket chat below.`)
            resetForm()
            await loadTickets()
        } catch (err) {
            toast.error(err.message || 'Could not submit your request.')
        } finally {
            setSubmitting(false)
        }
    }

    const sendFollowUp = async (ticketId) => {
        const nextMessage = String(followUps[ticketId] || '').trim()
        if (!nextMessage) return

        setFollowBusy((prev) => ({ ...prev, [ticketId]: true }))

        try {
            const res = await fetchLaravel(`/api/help/tickets/${ticketId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ message: nextMessage }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not send your reply.')
            }
            setFollowUps((prev) => ({ ...prev, [ticketId]: '' }))
            toast.success('Reply posted in the ticket chat.')
            await loadTickets()
        } catch (err) {
            toast.error(err.message || 'Could not send your reply.')
        } finally {
            setFollowBusy((prev) => ({ ...prev, [ticketId]: false }))
        }
    }

    const closeTicket = async (ticketId) => {
        setCloseBusy((prev) => ({ ...prev, [ticketId]: true }))
        try {
            const res = await fetchLaravel(`/api/help/tickets/${ticketId}/close`, {
                method: 'POST',
                body: '{}',
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not close the ticket.')
            }
            toast.success('Ticket closed.')
            await loadTickets()
        } catch (err) {
            toast.error(err.message || 'Could not close the ticket.')
        } finally {
            setCloseBusy((prev) => ({ ...prev, [ticketId]: false }))
        }
    }

    return (
        <TabsContent value="help" className="m-0 block w-full space-y-5 p-5 outline-none md:p-7">
            <header className="border-b border-slate-100 pb-4">
                <h2 className="user-portal-page-title">Help</h2>
                <p className="user-portal-page-desc mt-1">
                    Open one support ticket at a time and chat with an administrator inside the ticket.
                    New messages refresh automatically.
                </p>
            </header>

            {activeTicket ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    You have an active ticket <span className="font-mono font-semibold">{activeTicket.ticket_number}</span>.
                    Close it before creating a new one.
                </div>
            ) : (
                <form onSubmit={onSubmit} className={`${panelClass} space-y-4 bg-slate-50/50`}>
                    <h3 className="text-sm font-semibold text-slate-900">Open a ticket</h3>

                    <label className="block">
                        <span className={labelClass}>Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={fieldClass}
                            required
                        />
                    </label>

                    <label className="block">
                        <span className={labelClass}>Subject</span>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className={fieldClass}
                            placeholder="Brief summary of the issue"
                            maxLength={255}
                            required
                        />
                    </label>

                    <label className="block">
                        <span className={labelClass}>Message</span>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={`${fieldClass} min-h-[140px] resize-y`}
                            placeholder="Describe what happened and what you need help with"
                            maxLength={5000}
                            required
                        />
                    </label>

                    <div>
                        <span className={labelClass}>Attachment (optional)</span>
                        {!file ? (
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-600 transition hover:border-[#2EAADB] hover:text-[#053447]">
                                <PaperclipIcon className="size-4 shrink-0" />
                                <span>Attach image, PDF, or document (max 5 MB)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf,.txt,.doc,.docx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        ) : (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600"
                                    aria-label="Remove attachment"
                                >
                                    <TrashIcon className="size-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="user-portal-btn-primary disabled:opacity-50"
                        >
                            {submitting ? 'Opening…' : 'Open ticket'}
                        </button>
                    </div>
                </form>
            )}

            <div className={panelClass}>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Ticket chat</h3>
                {loadingTickets ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                ) : tickets.length === 0 ? (
                    <p className="text-sm text-slate-500">No help tickets yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {tickets.map((ticket) => (
                            <li key={ticket.id} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3.5">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-mono text-[11px] font-semibold tracking-wide text-[#2EAADB]">
                                            {ticket.ticket_number || ticket.id}
                                        </p>
                                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{ticket.subject}</p>
                                        <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(ticket.created_at)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        {ticket.status !== 'closed' ? (
                                            <button
                                                type="button"
                                                disabled={closeBusy[ticket.id]}
                                                onClick={() => void closeTicket(ticket.id)}
                                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                {closeBusy[ticket.id] ? 'Closing…' : 'Close ticket'}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{ticket.message}</p>
                                {ticket.has_attachment ? (
                                    <p className="mt-2 text-[11px] text-slate-500">
                                        Attachment: {ticket.attachment?.name || 'file'}
                                    </p>
                                ) : null}
                                {Array.isArray(ticket.replies) && ticket.replies.length > 0 ? (
                                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                        {ticket.replies.map((reply) => {
                                            const fromUser = reply.author_role === 'user'
                                            return (
                                                <div key={reply.id} className="rounded-md bg-white px-3 py-2">
                                                    <p className={`text-[11px] font-medium ${fromUser ? 'text-slate-500' : 'text-[#2EAADB]'}`}>
                                                        {fromUser ? 'You' : 'Admin'} · {formatDate(reply.created_at)}
                                                    </p>
                                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{reply.message}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : null}

                                {ticket.status === 'closed' ? (
                                    <p className="mt-3 text-[11px] text-slate-500">
                                        This ticket is closed. Chat replies are disabled.
                                    </p>
                                ) : (
                                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                        <textarea
                                            value={followUps[ticket.id] || ''}
                                            onChange={(e) => setFollowUps((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                            className="min-h-[72px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/20"
                                            placeholder="Write a chat reply…"
                                            maxLength={5000}
                                        />
                                        <button
                                            type="button"
                                            disabled={followBusy[ticket.id] || !String(followUps[ticket.id] || '').trim()}
                                            onClick={() => void sendFollowUp(ticket.id)}
                                            className="user-portal-btn-dark h-8 px-4 text-xs disabled:opacity-50"
                                        >
                                            {followBusy[ticket.id] ? 'Sending…' : 'Send chat reply'}
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </TabsContent>
    )
}
