'use client'

import { useCallback, useEffect, useState } from 'react'
import { getLaravelApiUrl } from '@/lib/laravel-api'

const DEFAULT_SETTINGS = {
    site_name: 'NursingAI',
    support_email: '',
    maintenance_mode: false,
    maintenance_message: 'We are performing scheduled maintenance. Please try again soon.',
    user_signup_enabled: true,
    user_chat_enabled: true,
    admin_chat_enabled: true,
    help_tickets_enabled: true,
    require_plan_for_chat: true,
    voice_chat_enabled: true,
}

let cachedSettings = null
let cachedAt = 0
let inflight = null

const CACHE_MS = 15_000

export async function fetchAppSettings({ force = false } = {}) {
    const now = Date.now()
    if (!force && cachedSettings && now - cachedAt < CACHE_MS) {
        return cachedSettings
    }
    if (!force && inflight) {
        return inflight
    }

    inflight = (async () => {
        try {
            const res = await fetch(getLaravelApiUrl('/api/app-settings'), {
                headers: { Accept: 'application/json' },
                credentials: 'include',
                cache: 'no-store',
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
                throw new Error(data?.detail || 'Could not load app settings.')
            }
            cachedSettings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) }
            cachedAt = Date.now()
            return cachedSettings
        } catch {
            return cachedSettings || { ...DEFAULT_SETTINGS }
        } finally {
            inflight = null
        }
    })()

    return inflight
}

export function useAppSettings() {
    const [settings, setSettings] = useState(cachedSettings || DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(!cachedSettings)

    const refresh = useCallback(async () => {
        setLoading(true)
        const next = await fetchAppSettings({ force: true })
        setSettings(next)
        setLoading(false)
        return next
    }, [])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            const next = await fetchAppSettings()
            if (!cancelled) {
                setSettings(next)
                setLoading(false)
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [])

    return { settings, loading, refresh }
}
