'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const readStoredAuth = () => {
    if (typeof window === 'undefined') {
        return null
    }

    try {
        const session = JSON.parse(localStorage.getItem('session') || 'null')
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        const token = session?.access_token || localStorage.getItem('token') || ''

        if (!token) {
            return null
        }

        return {
            token,
            session,
            user,
        }
    } catch (error) {
        const token = localStorage.getItem('token') || ''
        if (!token) {
            return null
        }

        return {
            token,
            session: null,
            user: null,
        }
    }
}

export default function RequireAuth({ children, redirectTo = '/login' }) {
    const router = useRouter()
    const [isReady, setIsReady] = useState(false)

    const ensureAuth = useCallback(() => {
        const authState = readStoredAuth()
        if (!authState) {
            setIsReady(false)
            router.replace(redirectTo)
            return false
        }

        setIsReady(true)
        return true
    }, [redirectTo, router])

    useEffect(() => {
        const initialCheckId = window.setTimeout(() => {
            ensureAuth()
        }, 0)

        const handleStorage = () => {
            ensureAuth()
        }

        const handlePageShow = (event) => {
            if (event?.persisted) {
                ensureAuth()
                return
            }

            ensureAuth()
        }

        const handleFocus = () => {
            ensureAuth()
        }

        window.addEventListener('storage', handleStorage)
        window.addEventListener('pageshow', handlePageShow)
        window.addEventListener('focus', handleFocus)

        return () => {
            window.clearTimeout(initialCheckId)
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('pageshow', handlePageShow)
            window.removeEventListener('focus', handleFocus)
        }
    }, [ensureAuth])

    if (!isReady) {
        return null
    }

    return children
}