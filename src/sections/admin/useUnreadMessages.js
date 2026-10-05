'use client'

import { useEffect, useState } from 'react'
import { fetchLaravel } from '@/lib/laravel-api'

const MESSAGES_CHANGED_EVENT = 'nb-contact-messages-changed'
const POLL_MS = 60_000

/** Tell the sidebar badge that contact-message statuses changed. */
export function notifyMessagesChanged() {
    window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT))
}

/**
 * Number of unread ("new") website contact messages, for the admin sidebar badge.
 * Refreshes on navigation, every minute, and whenever the Messages page changes a status.
 */
export default function useUnreadMessages(refreshKey) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let cancelled = false

        const load = () => {
            fetchLaravel('/api/admin/contact-messages?status=new&per_page=10')
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (!cancelled && data?.counts) setCount(Number(data.counts.new) || 0)
                })
                .catch(() => {
                    // Badge is informational; keep the last known value on failure.
                })
        }

        load()
        const timer = window.setInterval(load, POLL_MS)
        window.addEventListener(MESSAGES_CHANGED_EVENT, load)
        return () => {
            cancelled = true
            window.clearInterval(timer)
            window.removeEventListener(MESSAGES_CHANGED_EVENT, load)
        }
    }, [refreshKey])

    return count
}
