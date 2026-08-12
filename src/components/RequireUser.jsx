'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredRole } from '@/lib/auth-session'

const isUserRole = (role) => String(role || '').trim().toLowerCase() === 'user'

export default function RequireUser({ children, redirectTo = '/admin/chat' }) {
    const router = useRouter()
    const [isReady, setIsReady] = useState(false)

    const ensureUser = useCallback(() => {
        const role = getStoredRole()
        if (!isUserRole(role)) {
            setIsReady(false)
            router.replace(redirectTo)
            return false
        }

        setIsReady(true)
        return true
    }, [redirectTo, router])

    useEffect(() => {
        const id = window.setTimeout(() => ensureUser(), 0)
        const onStorage = () => ensureUser()
        window.addEventListener('storage', onStorage)

        return () => {
            window.clearTimeout(id)
            window.removeEventListener('storage', onStorage)
        }
    }, [ensureUser])

    if (!isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] text-sm text-slate-500">
                Checking user access…
            </div>
        )
    }

    return children
}
