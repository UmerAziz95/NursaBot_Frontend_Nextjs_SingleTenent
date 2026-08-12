'use client';

import { useEffect, useState } from "react";
import { User as UserIcon, LogOut as ArrowRightOnRectangleIcon, ShieldCheck as ShieldCheckIcon, Sparkles as SparklesIcon } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logoutAndRedirect } from "@/lib/logout";
import HelpNotificationsBell from "@/components/HelpNotificationsBell";

const readStoredJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
    } catch (error) {
        return null
    }
}

const decodeJwtPayload = (token) => {
    if (typeof token !== 'string' || !token.includes('.')) return null
    try {
        const payloadPart = token.split('.')[1]
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
        return JSON.parse(atob(padded))
    } catch {
        return null
    }
}

const normalizeRole = (value) => String(value || '').trim().toLowerCase()

const fetchCurrentUser = async (token) => {
    const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
    const url = BASE ? `${BASE.replace(/\/$/, '')}/api/auth/me` : '/api/auth/me'
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        })
        if (!response.ok) return null
        return await response.json()
    } catch {
        return null
    }
}

const getInitials = (value) => {
    const text = String(value || '').trim()
    if (!text) return 'AI'
    if (text.includes('@')) {
        const local = text.split('@')[0]
        const parts = local.split(/[._-]+/).filter(Boolean)
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        return local.slice(0, 2).toUpperCase()
    }
    const words = text.split(/\s+/).filter(Boolean)
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
    return text.slice(0, 2).toUpperCase()
}

export default function ChatbotHeader() {
    const [currentUser, setCurrentUser] = useState(null)
    const [assistantBusy, setAssistantBusy] = useState(false)
    const [assistantStatus, setAssistantStatus] = useState('ready')

    useEffect(() => {
        const handleActivity = (event) => {
            setAssistantBusy(Boolean(event?.detail?.busy))
            setAssistantStatus(String(event?.detail?.status || 'ready'))
        }

        window.addEventListener('assistant-activity', handleActivity)
        return () => window.removeEventListener('assistant-activity', handleActivity)
    }, [])

    useEffect(() => {
        let cancelled = false

        const syncProfile = async () => {
            const storedUser = readStoredJson('user') || {}
            const storedSession = readStoredJson('session') || {}
            const token = storedSession.access_token || localStorage.getItem('token') || ''
            const tokenPayload = decodeJwtPayload(storedSession.access_token || token)

            let resolvedUser = storedUser
            if ((!resolvedUser.email || !resolvedUser.role) && token) {
                const apiUser = await fetchCurrentUser(token)
                if (apiUser && typeof apiUser === 'object') {
                    resolvedUser = { ...resolvedUser, ...apiUser }
                }
            }

            if (cancelled) return

            const email = String(resolvedUser.email || '').trim()
            const role = normalizeRole(
                resolvedUser.role ||
                storedSession.role ||
                localStorage.getItem('role') ||
                tokenPayload?.role ||
                ''
            )
            const displayName =
                String(resolvedUser.display_name || '').trim() ||
                email ||
                resolvedUser.username ||
                tokenPayload?.sub ||
                'Account'

            setCurrentUser({ displayName, role, email })
        }

        syncProfile()

        const handleStorageChange = () => syncProfile()
        const handleProfileUpdated = () => syncProfile()
        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('assistant-profile-updated', handleProfileUpdated)
        return () => {
            cancelled = true
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('assistant-profile-updated', handleProfileUpdated)
        }
    }, [])

    const isAdmin = ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)

    return (
        <div className="chatbot-header shrink-0 min-w-0">
            <header className="user-portal-topbar relative min-w-0">
                <div className="user-portal-topbar-start">
                    <div className="user-portal-topbar-heading">
                        <h1 className="user-portal-topbar-title">NursingAI</h1>
                        <p className="user-portal-topbar-subtitle">
                            Medical & nursing knowledge assistant
                        </p>
                    </div>
                </div>

                <div className="user-portal-topbar-actions">
                    {currentUser && !isAdmin && (
                        <HelpNotificationsBell isAdmin={isAdmin} />
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={`user-portal-topbar-account ${assistantBusy ? 'is-busy' : ''}`}
                                aria-label="Open account menu"
                                title={currentUser?.displayName || 'Account'}
                            >
                                {assistantBusy && (
                                    <span className="pointer-events-none absolute inset-0 overflow-hidden">
                                        <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[assistant-ticker_1.4s_linear_infinite]" />
                                    </span>
                                )}

                                <span className="user-portal-topbar-account-avatar">
                                    {getInitials(currentUser?.displayName)}
                                    <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#053447] ${
                                            assistantBusy
                                                ? 'bg-[#2EAADB] animate-pulse'
                                                : 'bg-emerald-400'
                                        }`}
                                    />
                                </span>

                                <span className="user-portal-topbar-account-text">
                                    <span className="user-portal-topbar-account-label">Account</span>
                                    <span className={`user-portal-topbar-account-name ${assistantBusy ? 'is-busy' : ''}`}>
                                        {assistantBusy
                                            ? (assistantStatus === 'loading' ? 'Loading chat…' : 'Assistant working…')
                                            : (currentUser?.displayName || 'Signed in')}
                                    </span>
                                </span>

                                <SparklesIcon
                                    className={`relative w-3.5 h-3.5 shrink-0 ${
                                        assistantBusy ? 'text-[#9ad8ef] animate-pulse' : 'text-white/45'
                                    }`}
                                />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            collisionPadding={12}
                            className="w-64 rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl overflow-y-auto overscroll-contain"
                        >
                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2EAADB] to-[#053447] text-xs font-semibold text-white">
                                        {getInitials(currentUser?.displayName)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {currentUser?.role && (
                                            <div className="inline-flex items-center gap-1 rounded-md bg-[#2EAADB]/10 px-1.5 py-0.5">
                                                {isAdmin && <ShieldCheckIcon className="w-3 h-3 text-[#2EAADB] shrink-0" />}
                                                <span className="user-portal-caption capitalize text-[#1f7fa8]!">
                                                    {currentUser.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                {isAdmin && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('assistant-open-settings', {
                                                detail: { tab: 'profile' },
                                            }))
                                        }}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-slate-700 focus:bg-slate-50"
                                    >
                                        <UserIcon className="w-4 h-4" />
                                        Profile
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => logoutAndRedirect(isAdmin ? '/admin/signin' : '/signin')}
                                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                >
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </div>
    );
}
