'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Archive as ArchiveIcon,
    ArchiveRestore as RestoreIcon,
    Inbox as InboxIcon,
    Mail as MailIcon,
    MailOpen as MailOpenIcon,
    RefreshCw as RefreshIcon,
    Reply as ReplyIcon,
    Search as SearchIcon,
    Trash2 as TrashIcon,
} from 'lucide-react'
import AdminShell from '@/sections/admin/AdminShell'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'
import { notifyMessagesChanged } from '@/sections/admin/useUnreadMessages'

const TABS = [
    { key: 'new', label: 'New' },
    { key: 'read', label: 'Read' },
    { key: 'archived', label: 'Archived' },
    { key: '', label: 'All' },
]

const formatWhen = (iso) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

async function loadMessages(status, q) {
    const params = new URLSearchParams({ per_page: '50' })
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    const res = await fetchLaravel(`/api/admin/contact-messages?${params.toString()}`)
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.detail || 'Could not load messages.')
    return data
}

export default function ManageMessagesPage() {
    const [status, setStatus] = useState('new')
    const [query, setQuery] = useState('')
    const [search, setSearch] = useState('')
    const [messages, setMessages] = useState([])
    const [counts, setCounts] = useState({ new: 0, read: 0, archived: 0 })
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [busy, setBusy] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)

    // Debounce the search box.
    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(query.trim()), 300)
        return () => window.clearTimeout(timer)
    }, [query])

    useEffect(() => {
        let cancelled = false
        loadMessages(status, search)
            .then((data) => {
                if (cancelled) return
                setMessages(Array.isArray(data?.messages) ? data.messages : [])
                setCounts(data?.counts || { new: 0, read: 0, archived: 0 })
                setLoading(false)
            })
            .catch((err) => {
                if (cancelled) return
                toast.error(err.message)
                setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [status, search, reloadKey])

    const reload = useCallback(() => {
        setLoading(true)
        setReloadKey((n) => n + 1)
    }, [])

    const selected = useMemo(() => messages.find((m) => m.id === selectedId) || null, [messages, selectedId])

    const setMessageStatus = useCallback(async (message, nextStatus, { silent = false } = {}) => {
        setBusy(true)
        try {
            const res = await fetchLaravel(`/api/admin/contact-messages/${message.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: nextStatus }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not update the message.')
            setMessages((list) => list.map((m) => (m.id === message.id ? data.message : m)))
            setCounts((c) => ({ ...c, [message.status]: Math.max(0, (c[message.status] || 0) - 1), [nextStatus]: (c[nextStatus] || 0) + 1 }))
            notifyMessagesChanged()
            if (!silent) toast.success(nextStatus === 'archived' ? 'Message archived.' : nextStatus === 'new' ? 'Marked as unread.' : 'Message restored.')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setBusy(false)
        }
    }, [])

    const open = (message) => {
        setSelectedId(message.id)
        if (message.status === 'new') void setMessageStatus(message, 'read', { silent: true })
    }

    const remove = async (message) => {
        if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return
        setBusy(true)
        try {
            const res = await fetchLaravel(`/api/admin/contact-messages/${message.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Could not delete the message.')
            setMessages((list) => list.filter((m) => m.id !== message.id))
            setCounts((c) => ({ ...c, [message.status]: Math.max(0, (c[message.status] || 0) - 1) }))
            notifyMessagesChanged()
            setSelectedId(null)
            toast.success('Message deleted.')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setBusy(false)
        }
    }

    const replyHref = selected
        ? `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Re: ${selected.subject || 'Your message'}`)}`
        : '#'

    return (
        <AdminShell title="Messages" subtitle="Messages sent through the website contact form.">
            <div className="nba-messages">
                <div className="nba-messages-toolbar">
                    <div className="nba-tabs" role="tablist" aria-label="Filter messages">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key || 'all'}
                                type="button"
                                role="tab"
                                aria-selected={status === tab.key}
                                className={`nba-tab ${status === tab.key ? 'is-active' : ''}`}
                                onClick={() => { setLoading(true); setStatus(tab.key); setSelectedId(null) }}
                            >
                                {tab.label}
                                {tab.key && <span className="nba-tab-count">{counts[tab.key] ?? 0}</span>}
                            </button>
                        ))}
                    </div>
                    <div className="nba-messages-search">
                        <SearchIcon className="h-4 w-4" />
                        <input
                            value={query}
                            onChange={(e) => { setLoading(true); setQuery(e.target.value) }}
                            placeholder="Search name, email or message"
                            aria-label="Search messages"
                        />
                    </div>
                    <button type="button" className="admin-btn-secondary" onClick={reload} disabled={loading}>
                        <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="nba-messages-layout">
                    <ul className="nba-messages-list admin-panel" aria-label="Messages">
                        {loading && messages.length === 0 ? (
                            [0, 1, 2, 3].map((i) => <li key={i} className="p-4"><span className="nba-skel h-12 w-full" /></li>)
                        ) : messages.length === 0 ? (
                            <li className="nba-messages-empty">
                                <InboxIcon className="h-6 w-6" />
                                <span>{search ? 'No messages match your search.' : 'No messages here yet.'}</span>
                            </li>
                        ) : messages.map((message) => (
                            <li key={message.id}>
                                <button
                                    type="button"
                                    className={`nba-message-row ${selectedId === message.id ? 'is-selected' : ''} ${message.status === 'new' ? 'is-unread' : ''}`}
                                    onClick={() => open(message)}
                                >
                                    <span className="nba-message-row-top">
                                        <span className="nba-message-row-name">{message.name}</span>
                                        <span className="nba-message-row-time">{formatWhen(message.created_at)}</span>
                                    </span>
                                    <span className="nba-message-row-subject">{message.subject || 'No subject'}</span>
                                    <span className="nba-message-row-preview">{message.message}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <section className="nba-message-detail admin-panel" aria-live="polite">
                        {!selected ? (
                            <div className="nba-messages-empty is-tall">
                                <MailIcon className="h-7 w-7" />
                                <span>Select a message to read it.</span>
                            </div>
                        ) : (
                            <>
                                <div className="nba-message-head">
                                    <div className="min-w-0">
                                        <div className="nba-message-subject">{selected.subject || 'No subject'}</div>
                                        <div className="nba-message-from">
                                            <strong>{selected.name}</strong> · <a href={`mailto:${selected.email}`}>{selected.email}</a>
                                        </div>
                                        <div className="nba-message-time">{formatWhen(selected.created_at)}</div>
                                    </div>
                                    <span className={`nba-pill ${selected.status === 'new' ? 'is-warning' : selected.status === 'archived' ? 'is-neutral' : 'is-success'}`}>
                                        {selected.status}
                                    </span>
                                </div>
                                <div className="nba-message-body">{selected.message}</div>
                                <div className="nba-message-actions">
                                    <a href={replyHref} className="admin-btn-primary">
                                        <ReplyIcon className="h-4 w-4" />
                                        Reply by email
                                    </a>
                                    {selected.status !== 'new' && (
                                        <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void setMessageStatus(selected, 'new')}>
                                            <MailOpenIcon className="h-4 w-4" />
                                            Mark unread
                                        </button>
                                    )}
                                    {selected.status === 'archived' ? (
                                        <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void setMessageStatus(selected, 'read')}>
                                            <RestoreIcon className="h-4 w-4" />
                                            Restore
                                        </button>
                                    ) : (
                                        <button type="button" className="admin-btn-secondary" disabled={busy} onClick={() => void setMessageStatus(selected, 'archived')}>
                                            <ArchiveIcon className="h-4 w-4" />
                                            Archive
                                        </button>
                                    )}
                                    <button type="button" className="admin-btn-secondary nba-danger" disabled={busy} onClick={() => void remove(selected)}>
                                        <TrashIcon className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </AdminShell>
    )
}
