'use client'

import { useSyncExternalStore } from 'react'
import { getStoredToken, isStaffRole } from '@/lib/auth-session'

const subscribe = (callback) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
}

const snapshot = () => {
    try {
        if (!getStoredToken()) return 'guest'
        return isStaffRole() ? 'staff' : 'user'
    } catch {
        return 'guest'
    }
}

/**
 * Who is viewing a public page: 'guest' | 'user' | 'staff'.
 * Returns null during server rendering so buttons don't flash the wrong state.
 */
export default function useSessionKind() {
    return useSyncExternalStore(subscribe, snapshot, () => null)
}
