'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ensureFreshToken,
    getStoredExpiresAtMs,
    getStoredToken,
    handleSessionExpired,
    refreshAuthSession,
} from '@/lib/auth-session'

const readStoredAuth = () => {
    if (typeof window === 'undefined') {
        return null
    }

    const token = getStoredToken()
    if (!token) {
        return null
    }

    try {
        const session = JSON.parse(localStorage.getItem('session') || 'null')
        const user = JSON.parse(localStorage.getItem('user') || 'null')

        return {
            token,
            session,
            user,
        }
    } catch (error) {
        return {
            token,
            session: null,
            user: null,
        }
    }
}

export default function RequireAuth({ children, redirectTo = '/signin' }) {
    const router = useRouter()
    const [isReady, setIsReady] = useState(false)

    const ensureAuth = useCallback(async () => {
        const authState = readStoredAuth()
        if (!authState) {
            setIsReady(false)
            router.replace(redirectTo)
            return false
        }

        const expiresAtMs = getStoredExpiresAtMs()
        const tokenExpired = Boolean(expiresAtMs && Date.now() >= expiresAtMs)
        const refreshed = await refreshAuthSession({ force: tokenExpired })
        if (!refreshed) {
            await handleSessionExpired(redirectTo.includes('admin') ? '/admin/signin?reason=session_expired' : '/signin?reason=session_expired')
            return false
        }

        const fresh = await ensureFreshToken()
        if (!fresh) {
            await handleSessionExpired(redirectTo.includes('admin') ? '/admin/signin?reason=session_expired' : '/signin?reason=session_expired')
            return false
        }

        setIsReady(true)
        return true
    }, [redirectTo, router])

    useEffect(() => {
        let cancelled = false

        const run = async () => {
            if (cancelled) {
                return
            }

            await ensureAuth()
        }

        const initialCheckId = window.setTimeout(() => {
            void run()
        }, 0)

        const handleStorage = () => {
            void run()
        }

        const handlePageShow = (event) => {
            if (event?.persisted) {
                void run()
                return
            }

            void run()
        }

        const handleFocus = () => {
            void run()
        }

        window.addEventListener('storage', handleStorage)
        window.addEventListener('pageshow', handlePageShow)
        window.addEventListener('focus', handleFocus)

        return () => {
            cancelled = true
            window.clearTimeout(initialCheckId)
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('pageshow', handlePageShow)
            window.removeEventListener('focus', handleFocus)
        }
    }, [ensureAuth])

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
                Checking session…
            </div>
        )
    }

    return children
}
