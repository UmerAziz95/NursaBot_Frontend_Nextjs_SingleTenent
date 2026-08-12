'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredRole } from '@/lib/auth-session'

const normalizeRole = (value) => String(value || '').trim().toLowerCase()

const readRole = () => normalizeRole(getStoredRole())

export const isAdminRole = (role) =>
    ['admin', 'super_admin', 'sub_admin'].includes(normalizeRole(role))

export const isElevatedAdminRole = (role) =>
    ['admin', 'super_admin'].includes(normalizeRole(role))

export default function RequireAdmin({ children, redirectTo = '/admin/signin' }) {
    const router = useRouter()
    const [isReady, setIsReady] = useState(false)

    const ensureAdmin = useCallback(() => {
        const role = readRole()
        if (!isAdminRole(role)) {
            setIsReady(false)
            router.replace(redirectTo)
            return false
        }
        setIsReady(true)
        return true
    }, [redirectTo, router])

    useEffect(() => {
        const id = window.setTimeout(() => ensureAdmin(), 0)
        const onStorage = () => ensureAdmin()
        window.addEventListener('storage', onStorage)
        return () => {
            window.clearTimeout(id)
            window.removeEventListener('storage', onStorage)
        }
    }, [ensureAdmin])

    if (!isReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] text-sm text-slate-500">
                Checking admin access…
            </div>
        )
    }

    return children
}
