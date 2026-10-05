'use client'

import { useEffect, useMemo, useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import {
    FileText as FileIcon,
    Inbox as InboxIcon,
    LifeBuoy as LifebuoyIcon,
    Lock as LockIcon,
    MessagesSquare as MessageIcon,
    Paperclip as PaperclipIcon,
    SendHorizontal as SendIcon,
    Trash2 as TrashIcon,
} from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { useSettings } from '@/sections/assistant/settings/SettingsContext'
import { Field, PageHeader, Section, StatusPill } from '@/sections/assistant/settings/SettingsUI'
import useHelpTicketPolling from '@/hooks/useHelpTicketPolling'
import { toast } from '@/lib/toast'


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

    const openTickets = tickets.filter((ticket) => ticket.status !== 'closed').length

    return (
        <TabsContent value="help" className="nbs-page m-0 outline-none">
            <PageHeader
                title="Help & support"
                description="Open a ticket and chat with our team inside it. New replies appear automatically."
            />

            {activeTicket ? (
                <div className="nbs-banner">
                    <MessageIcon className="size-4 shrink-0" />
                    <div>
                        You have an active ticket <span className="nbs-ticket-no">{activeTicket.ticket_number}</span>.
                        Continue the conversation below, or close it to open a new one.
                    </div>
                </div>
            ) : (
                <Section
                    as="form"
                    onSubmit={onSubmit}
                    icon={LifebuoyIcon}
                    title="Open a ticket"
                    description="Tell us what happened — we usually reply within one business day."
                >
                    <div className="nbs-grid">
                        <Field label="Email" htmlFor="nbs-help-email">
                            <input
                                id="nbs-help-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="nbs-input"
                                required
                            />
                        </Field>
                        <Field label="Subject" htmlFor="nbs-help-subject">
                            <input
                                id="nbs-help-subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="nbs-input"
                                placeholder="Brief summary of the issue"
                                maxLength={255}
                                required
                            />
                        </Field>
                    </div>

                    <Field label="Message" htmlFor="nbs-help-message" trailing={`${message.length}/5000`}>
                        <textarea
                            id="nbs-help-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="nbs-input nbs-textarea"
                            placeholder="Describe what happened and what you need help with"
                            maxLength={5000}
                            required
                        />
                    </Field>

                    <Field label="Attachment" hint="Optional · image, PDF or document up to 5 MB">
                        {!file ? (
                            <label className="nbs-dropzone">
                                <span className="nbs-dropzone-icon"><PaperclipIcon className="size-4" /></span>
                                <span>
                                    <strong>Choose a file</strong> to attach
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf,.txt,.doc,.docx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        ) : (
                            <div className="nbs-file">
                                <span className="nbs-dropzone-icon"><FileIcon className="size-4" /></span>
                                <div className="min-w-0 flex-1">
                                    <div className="nbs-file-name">{file.name}</div>
                                    <div className="nbs-file-size">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="nbs-icon-btn is-danger"
                                    aria-label="Remove attachment"
                                    title="Remove attachment"
                                >
                                    <TrashIcon className="size-4" />
                                </button>
                            </div>
                        )}
                    </Field>

                    <div className="nbs-actions">
                        <button type="button" onClick={resetForm} className="nbs-btn is-ghost" disabled={submitting}>
                            Clear
                        </button>
                        <button type="submit" disabled={submitting} className="nbs-btn is-primary">
                            <SendIcon className="size-4" />
                            {submitting ? 'Opening…' : 'Open ticket'}
                        </button>
                    </div>
                </Section>
            )}

            <Section
                icon={MessageIcon}
                title="Your tickets"
                description={tickets.length ? `${tickets.length} total · ${openTickets} open` : 'Conversations with our support team.'}
            >
                {loadingTickets ? (
                    <div className="space-y-3">
                        <span className="nbs-skel h-20 w-full rounded-xl" />
                        <span className="nbs-skel h-20 w-full rounded-xl" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="nbs-empty">
                        <span className="nbs-empty-icon"><InboxIcon className="size-5" /></span>
                        <div className="nbs-empty-title">No tickets yet</div>
                        <div className="nbs-empty-desc">When you open a ticket, the conversation will appear here.</div>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {tickets.map((ticket) => {
                            const closed = ticket.status === 'closed'
                            return (
                                <li key={ticket.id} className={`nbs-ticket ${closed ? 'is-closed' : ''}`}>
                                    <div className="nbs-ticket-head">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="nbs-ticket-no">{ticket.ticket_number || ticket.id}</span>
                                                <StatusPill status={ticket.status} />
                                            </div>
                                            <div className="nbs-ticket-subject">{ticket.subject}</div>
                                            <div className="nbs-ticket-date">Opened {formatDate(ticket.created_at)}</div>
                                        </div>
                                        {!closed ? (
                                            <button
                                                type="button"
                                                disabled={closeBusy[ticket.id]}
                                                onClick={() => void closeTicket(ticket.id)}
                                                className="nbs-btn is-secondary is-sm"
                                            >
                                                {closeBusy[ticket.id] ? 'Closing…' : 'Close ticket'}
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="nbs-thread">
                                        <div className="nbs-bubble is-user">
                                            <div className="nbs-bubble-meta">You · {formatDate(ticket.created_at)}</div>
                                            <div className="nbs-bubble-text">{ticket.message}</div>
                                            {ticket.has_attachment ? (
                                                <div className="nbs-bubble-attachment">
                                                    <PaperclipIcon className="size-3" />
                                                    {ticket.attachment?.name || 'Attachment'}
                                                </div>
                                            ) : null}
                                        </div>
                                        {(Array.isArray(ticket.replies) ? ticket.replies : []).map((reply) => {
                                            const fromUser = reply.author_role === 'user'
                                            return (
                                                <div key={reply.id} className={`nbs-bubble ${fromUser ? 'is-user' : 'is-support'}`}>
                                                    <div className="nbs-bubble-meta">
                                                        {fromUser ? 'You' : 'Support team'} · {formatDate(reply.created_at)}
                                                    </div>
                                                    <div className="nbs-bubble-text">{reply.message}</div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {closed ? (
                                        <div className="nbs-ticket-closed">
                                            <LockIcon className="size-3.5" />
                                            This ticket is closed. Open a new ticket if you need more help.
                                        </div>
                                    ) : (
                                        <div className="nbs-reply">
                                            <textarea
                                                value={followUps[ticket.id] || ''}
                                                onChange={(e) => setFollowUps((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                        e.preventDefault()
                                                        void sendFollowUp(ticket.id)
                                                    }
                                                }}
                                                className="nbs-reply-input"
                                                placeholder="Write a reply…  (Ctrl + Enter to send)"
                                                maxLength={5000}
                                                rows={2}
                                            />
                                            <button
                                                type="button"
                                                disabled={followBusy[ticket.id] || !String(followUps[ticket.id] || '').trim()}
                                                onClick={() => void sendFollowUp(ticket.id)}
                                                className="nbs-reply-send"
                                                aria-label="Send reply"
                                                title="Send reply"
                                            >
                                                <SendIcon className="size-4" />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </Section>
        </TabsContent>
    )
}
