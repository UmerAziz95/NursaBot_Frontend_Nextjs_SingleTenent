'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Cookie as CookieIcon } from 'lucide-react'

const STORAGE_KEY = 'nb_cookie_notice_ack'
const ACK_EVENT = 'nb-cookie-notice-ack'

const subscribe = (callback) => {
    window.addEventListener(ACK_EVENT, callback)
    window.addEventListener('storage', callback)
    return () => {
        window.removeEventListener(ACK_EVENT, callback)
        window.removeEventListener('storage', callback)
    }
}

const isAcknowledged = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
        return true
    }
}

// Informational notice: the site only uses strictly necessary cookies and
// storage, so no consent choices are required — just transparency.
export default function CookieNotice() {
    const acknowledged = useSyncExternalStore(subscribe, isAcknowledged, () => true)
    if (acknowledged) return null

    const dismiss = () => {
        try {
            localStorage.setItem(STORAGE_KEY, '1')
        } catch {
            // If storage is blocked the notice simply shows again next visit.
        }
        window.dispatchEvent(new Event(ACK_EVENT))
    }

    return (
        <div className="nbl-cookie" role="region" aria-label="Cookie notice">
            <CookieIcon className="nbl-cookie-icon h-5 w-5" />
            <p>
                We use only essential cookies and browser storage to keep you signed in and the site working —
                no advertising or tracking. <Link href="/cookies">Learn more</Link>
            </p>
            <button type="button" className="nbl-btn is-primary is-sm" onClick={dismiss}>Got it</button>
        </div>
    )
}
