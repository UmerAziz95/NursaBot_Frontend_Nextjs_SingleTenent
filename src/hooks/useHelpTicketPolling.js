'use client'

import { useEffect, useRef } from 'react'

/**
 * Polls a loader while the page/tab is visible so ticket chat stays near-realtime
 * without requiring WebSockets.
 */
export default function useHelpTicketPolling(loader, {
    enabled = true,
    intervalMs = 3000,
} = {}) {
    const loaderRef = useRef(loader)

    useEffect(() => {
        loaderRef.current = loader
    }, [loader])

    useEffect(() => {
        if (!enabled) return undefined

        let cancelled = false
        let timer = null

        const tick = async () => {
            if (cancelled || document.visibilityState === 'hidden') return
            try {
                await loaderRef.current?.({ silent: true })
            } catch {
                // Keep polling; transient failures should not stop live updates.
            }
        }

        const schedule = () => {
            timer = window.setInterval(() => {
                void tick()
            }, intervalMs)
        }

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void tick()
            }
        }

        schedule()
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            cancelled = true
            if (timer) window.clearInterval(timer)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [enabled, intervalMs])
}
