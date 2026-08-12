'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const SettingsContext = createContext(null)

const syncLocalUser = (profile) => {
    if (typeof window === 'undefined' || !profile) return
    try {
        const existing = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({
            ...existing,
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name,
            role: profile.role,
            plan: profile.plan,
            business_client_id: profile.business_client_id,
            workspace_id: profile.workspace_id,
            business_name: profile.business_name,
            workspace_name: profile.workspace_name,
        }))
        if (profile.subscription) {
            localStorage.setItem('subscription', JSON.stringify(profile.subscription))
        }
        window.dispatchEvent(new CustomEvent('assistant-profile-updated', { detail: profile }))
    } catch (_) { /* ignore */ }
}

export function SettingsProvider({ children, open }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [stripeKey, setStripeKey] = useState('')

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [meRes, keyRes] = await Promise.all([
                fetchLaravel('/api/auth/me'),
                fetchLaravel('/api/payments/publishable-key'),
            ])
            const meData = await meRes.json().catch(() => null)
            const keyData = await keyRes.json().catch(() => null)

            if (!meRes.ok) {
                throw new Error('profile_load_failed')
            }

            setProfile(meData)
            syncLocalUser(meData)
            setStripeKey(
                keyData?.publishable_key
                || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                || ''
            )
        } catch (err) {
            console.error('settings.refresh_failed', err)
            const message = 'We could not load your account settings. Please try again.'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (open) {
            void refresh()
        }
    }, [open, refresh])

    const updateProfile = useCallback(async (displayName) => {
        const res = await fetchLaravel('/api/auth/me', {
            method: 'PATCH',
            body: JSON.stringify({ display_name: displayName }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
            throw new Error(data?.detail || 'Could not update profile')
        }
        setProfile(data)
        syncLocalUser(data)
        return data
    }, [])

    const changePassword = useCallback(async ({ currentPassword, password, passwordConfirmation }) => {
        const res = await fetchLaravel('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
            throw new Error(data?.detail || 'Could not change password')
        }
        return data
    }, [])

    const setPaymentMethod = useCallback((paymentMethod) => {
        setProfile((prev) => {
            if (!prev) return prev
            const next = { ...prev, payment_method: paymentMethod }
            syncLocalUser(next)
            return next
        })
    }, [])

    const value = useMemo(() => ({
        profile,
        loading,
        error,
        stripeKey,
        refresh,
        updateProfile,
        changePassword,
        setPaymentMethod,
    }), [profile, loading, error, stripeKey, refresh, updateProfile, changePassword, setPaymentMethod])

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const ctx = useContext(SettingsContext)
    if (!ctx) {
        throw new Error('useSettings must be used within SettingsProvider')
    }
    return ctx
}

export const formatTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}

export const initialsFrom = (name, email) => {
    const source = String(name || email || 'U').trim()
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
}
