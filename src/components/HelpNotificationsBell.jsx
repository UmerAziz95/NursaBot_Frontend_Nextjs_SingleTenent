'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell as BellIcon, CheckCheck as CheckCheckIcon, LifeBuoy as LifebuoyIcon } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchLaravel, getStoredAdminToken } from '@/lib/laravel-api'
import useHelpTicketPolling from '@/hooks/useHelpTicketPolling'

const formatRelative = (value) => {
    if (!value) return ''
    try {
        const date = new Date(value)
        const diffMs = Date.now() - date.getTime()
        const mins = Math.floor(diffMs / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    } catch {
        return ''
    }
}

export default function HelpNotificationsBell({ isAdmin = false, tone = 'dark' }) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [items, setItems] = useState([])
    const [toast, setToast] = useState(null)
    const prevUnreadRef = useRef(0)
    const toastTimerRef = useRef(null)

    const loadSummary = useCallback(async () => {
        if (!getStoredAdminToken()) {
            setUnreadCount(0)
            setItems([])
            return
        }

        try {
            const res = await fetchLaravel('/api/help/notifications?limit=20')
            const data = await res.json().catch(() => null)
            if (!res.ok) return

            const nextItems = Array.isArray(data?.notifications) ? data.notifications : []
            const nextUnread = Number(data?.unread_count || 0)
            setItems(nextItems)
            setUnreadCount(nextUnread)

            if (nextUnread > prevUnreadRef.current) {
                const newest = nextItems.find((item) => item.is_unread) || nextItems[0]
                if (newest) {
                    setToast({
                        title: newest.title,
                        body: newest.body,
                    })
                    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
                    toastTimerRef.current = window.setTimeout(() => setToast(null), 4500)
                }
            }
            prevUnreadRef.current = nextUnread
        } catch {
            // Keep the last known state if polling fails briefly.
        }
    }, [])

    useEffect(() => {
        void loadSummary()
        return () => {
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
        }
    }, [loadSummary])

    useHelpTicketPolling(loadSummary, {
        enabled: true,
        intervalMs: 4000,
    })

    const markAllRead = async () => {
        try {
            await fetchLaravel('/api/help/notifications/read-all', { method: 'POST' })
            setUnreadCount(0)
            setItems((current) => current.map((item) => ({ ...item, is_unread: false, read_at: new Date().toISOString() })))
            prevUnreadRef.current = 0
        } catch {
            // Ignore mark-all failures; list will refresh on next poll.
        }
    }

    const openNotification = async (item) => {
        if (item?.id && item.is_unread) {
            try {
                await fetchLaravel(`/api/help/notifications/${item.id}/read`, { method: 'POST' })
                setUnreadCount((count) => Math.max(0, count - 1))
                setItems((current) =>
                    current.map((row) =>
                        row.id === item.id
                            ? { ...row, is_unread: false, read_at: new Date().toISOString() }
                            : row
                    )
                )
            } catch {
                // Navigation still proceeds.
            }
        }

        if (isAdmin) {
            window.location.href = '/manage-help'
            return
        }

        window.dispatchEvent(
            new CustomEvent('assistant-open-settings', {
                detail: { tab: 'help' },
            })
        )
    }

    const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)
    const isLight = tone === 'light'

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={`relative inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                            isLight
                                ? 'border-slate-200 bg-slate-50 text-[#2EAADB] hover:bg-[#EAF7FC] hover:text-[#1f7fa8]'
                                : 'h-9 w-9 rounded-xl border-white/12 bg-white/8 text-white/85 hover:bg-white/12'
                        }`}
                        aria-label="Help notifications"
                        title="Help notifications"
                    >
                        <BellIcon className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold leading-4 text-white">
                                {badgeLabel}
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    collisionPadding={12}
                    className="w-[340px] rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-3">
                        <DropdownMenuLabel className="p-0 text-sm font-semibold text-slate-800">
                            Help notifications
                        </DropdownMenuLabel>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => void markAllRead()}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-[#1f7fa8] hover:bg-[#2EAADB]/10"
                            >
                                <CheckCheckIcon className="h-3.5 w-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto overscroll-contain py-1">
                        {items.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <LifebuoyIcon className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                                <p className="text-sm text-slate-500">No help notifications yet.</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <DropdownMenuItem
                                    key={item.id}
                                    className={`cursor-pointer rounded-none px-3.5 py-2.5 focus:bg-slate-50 ${
                                        item.is_unread ? 'bg-[#2EAADB]/6' : ''
                                    }`}
                                    onSelect={(event) => {
                                        event.preventDefault()
                                        void openNotification(item)
                                    }}
                                >
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[13px] font-semibold leading-snug text-slate-800">
                                                {item.title}
                                            </p>
                                            {item.is_unread && (
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2EAADB]" />
                                            )}
                                        </div>
                                        {item.body && (
                                            <p className="line-clamp-2 text-[12px] leading-snug text-slate-500">
                                                {item.body}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-slate-400">
                                            {item.ticket_number ? `${item.ticket_number} · ` : ''}
                                            {formatRelative(item.created_at)}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>

                    <DropdownMenuSeparator className="bg-slate-100" />
                    <div className="p-2">
                        {isAdmin ? (
                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
                                <Link href="/manage-help" className="flex items-center gap-2 text-sm text-slate-700">
                                    <LifebuoyIcon className="h-4 w-4 text-slate-500" />
                                    Open help inbox
                                </Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg px-2 py-2 text-sm text-slate-700"
                                onSelect={(event) => {
                                    event.preventDefault()
                                    window.dispatchEvent(
                                        new CustomEvent('assistant-open-settings', {
                                            detail: { tab: 'help' },
                                        })
                                    )
                                }}
                            >
                                <LifebuoyIcon className="mr-2 h-4 w-4 text-slate-500" />
                                Open help tickets
                            </DropdownMenuItem>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {toast && (
                <div className="pointer-events-none fixed right-4 top-16 z-[80] w-[min(360px,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                        <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
                        {toast.body && (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">{toast.body}</p>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
