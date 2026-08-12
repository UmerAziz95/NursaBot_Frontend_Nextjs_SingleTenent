'use client'

import { useEffect } from 'react'
import { ensureFreshToken, getStoredToken } from '@/lib/auth-session'

const REFRESH_INTERVAL_MS = 2 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 60 * 1000

export default function SessionKeeper() {
    useEffect(() => {
        let cancelled = false
        let lastActivityRefreshAt = 0

        const tick = async (force = false) => {
            if (cancelled || !getStoredToken()) {
                return
            }

            await ensureFreshToken({ force })
        }

        const handleActivity = () => {
            const now = Date.now()
            if (now - lastActivityRefreshAt < ACTIVITY_THROTTLE_MS) {
                return
            }

            lastActivityRefreshAt = now
            void tick()
        }

        void tick(true)

        const intervalId = window.setInterval(() => {
            void tick()
        }, REFRESH_INTERVAL_MS)

        const handleFocus = () => {
            void tick(true)
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void tick(true)
            }
        }

        window.addEventListener('focus', handleFocus)
        document.addEventListener('visibilitychange', handleVisibility)
        window.addEventListener('pointerdown', handleActivity, { passive: true })
        window.addEventListener('keydown', handleActivity, { passive: true })

        return () => {
            cancelled = true
            window.clearInterval(intervalId)
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('pointerdown', handleActivity)
            window.removeEventListener('keydown', handleActivity)
        }
    }, [])

    return null
}
