'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchLaravel } from '@/lib/laravel-api'
import { fetchAppSettings } from '@/lib/app-settings'

export default function RequirePlan({ children }) {
    const router = useRouter()
    const [allowed, setAllowed] = useState(false)

    useEffect(() => {
        let cancelled = false

        const check = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}')
                const role = String(user.role || localStorage.getItem('role') || '').toLowerCase()

                if (['admin', 'super_admin', 'sub_admin'].includes(role)) {
                    if (!cancelled) setAllowed(true)
                    return
                }

                const appSettings = await fetchAppSettings()
                if (cancelled) return

                if (appSettings.maintenance_mode || !appSettings.user_chat_enabled) {
                    if (!cancelled) setAllowed(true)
                    return
                }

                if (!appSettings.require_plan_for_chat) {
                    if (!cancelled) setAllowed(true)
                    return
                }

                const res = await fetchLaravel('/api/payments/my-subscription')
                const data = await res.json().catch(() => null)
                if (cancelled) return

                const canChat = data?.can_chat === true || (data?.subscription?.is_active === true)
                const needsPlan = Boolean(data?.requires_plan) || !canChat

                if (!res.ok || needsPlan) {
                    if (data?.subscription) {
                        localStorage.setItem('subscription', JSON.stringify(data.subscription))
                    }
                    const reason = data?.requires_reactivation ? 'expired' : 'required'
                    router.replace(`/plans?reason=${reason}`)
                    return
                }

                if (data?.subscription) {
                    localStorage.setItem('subscription', JSON.stringify(data.subscription))
                }
                setAllowed(true)
            } catch (_) {
                if (!cancelled) router.replace('/plans?reason=required')
            }
        }

        void check()
        return () => { cancelled = true }
    }, [router])

    if (!allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
                Checking subscription…
            </div>
        )
    }

    return children
}
