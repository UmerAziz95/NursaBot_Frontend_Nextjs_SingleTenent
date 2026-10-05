'use client';

import { useEffect, useState } from "react";
import {
    ChevronDown as ChevronDownIcon,
    Gauge as GaugeIcon,
    LifeBuoy as LifeBuoyIcon,
    LogOut as LogOutIcon,
    ShieldCheck as ShieldCheckIcon,
    SquarePen as SquarePenIcon,
    UserRound as UserRoundIcon,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logoutAndRedirect } from "@/lib/logout";
import { useAppSettings } from "@/lib/app-settings";
import HelpNotificationsBell from "@/components/HelpNotificationsBell";

const openSettingsTab = (tab) => {
    window.dispatchEvent(new CustomEvent('assistant-open-settings', { detail: { tab } }))
}

const startNewChat = () => {
    const chatId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.dispatchEvent(new CustomEvent('assistant-new-chat', { detail: { chat_id: chatId } }))
}

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
    const [conversationTitle, setConversationTitle] = useState('')

    useEffect(() => {
        const handleActivity = (event) => {
            setAssistantBusy(Boolean(event?.detail?.busy))
            setAssistantStatus(String(event?.detail?.status || 'ready'))
        }
        const handleOpenChat = (event) => {
            setConversationTitle(String(event?.detail?.chat_title || '').trim())
        }
        const handleNewChat = () => setConversationTitle('')
        const handleHeadersUpdated = (event) => {
            const title = String(event?.detail?.chat_title || '').trim()
            if (title) setConversationTitle(title)
        }

        window.addEventListener('assistant-activity', handleActivity)
        window.addEventListener('assistant-open-chat', handleOpenChat)
        window.addEventListener('assistant-new-chat', handleNewChat)
        window.addEventListener('assistant-chat-headers-updated', handleHeadersUpdated)
        return () => {
            window.removeEventListener('assistant-activity', handleActivity)
            window.removeEventListener('assistant-open-chat', handleOpenChat)
            window.removeEventListener('assistant-new-chat', handleNewChat)
            window.removeEventListener('assistant-chat-headers-updated', handleHeadersUpdated)
        }
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

    const { settings: appSettings } = useAppSettings()
    const isAdmin = ['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role)
    const initials = getInitials(currentUser?.displayName)
    const roleLabel = currentUser?.role ? currentUser.role.replace('_', ' ') : ''
    const statusLabel = assistantBusy
        ? (assistantStatus === 'loading' ? 'Loading conversation' : 'Thinking')
        : 'Ready'

    return (
        <div className="chatbot-header shrink-0 min-w-0">
            <header className="nb-topbar">
                <div className="nb-topbar-main">
                    <h1 className="nb-topbar-title" title={conversationTitle || 'New conversation'}>
                        {conversationTitle || 'New conversation'}
                    </h1>
                    <div className="nb-topbar-meta">
                        <span className={`nb-status-chip ${assistantBusy ? 'is-busy' : ''}`} role="status">
                            <span className="nb-status-chip-dot" aria-hidden="true" />
                            {statusLabel}
                            {assistantBusy && <span className="nb-status-chip-ellipsis" aria-hidden="true" />}
                        </span>
                        <span className="nb-topbar-tagline">Medical &amp; nursing knowledge assistant</span>
                    </div>
                </div>

                <div className="nb-topbar-actions">
                    <button
                        type="button"
                        className="nb-topbar-newchat"
                        onClick={startNewChat}
                        aria-label="New chat"
                        title="New chat"
                    >
                        <SquarePenIcon className="h-4 w-4" />
                        <span className="nb-topbar-newchat-label sr-only">New chat</span>
                    </button>

                    {currentUser && !isAdmin && (
                        <HelpNotificationsBell isAdmin={isAdmin} tone="light" />
                    )}

                    <span className="nb-topbar-divider" aria-hidden="true" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="nb-topbar-account"
                                aria-label="Open account menu"
                                title={currentUser?.displayName || 'Account'}
                            >
                                <span className="nb-topbar-avatar">
                                    {initials}
                                    <span className="nb-topbar-avatar-presence" aria-hidden="true" />
                                </span>
                                <span className="nb-topbar-account-text">
                                    <span className="nb-topbar-account-name">{currentUser?.displayName || 'Account'}</span>
                                    {roleLabel && <span className="nb-topbar-account-role">{roleLabel}</span>}
                                </span>
                                <ChevronDownIcon className="nb-topbar-account-chevron h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            collisionPadding={12}
                            className="nb-account-menu w-72 rounded-2xl border border-slate-200/80 bg-white p-0 text-slate-800 shadow-[0_20px_50px_-12px_rgba(5,52,71,0.28)] overflow-hidden"
                        >
                            <div className="nb-account-menu-head">
                                <span className="nb-topbar-avatar is-lg">{initials}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="nb-account-menu-name">{currentUser?.displayName || 'Account'}</p>
                                    {currentUser?.email && currentUser.email !== currentUser.displayName && (
                                        <p className="nb-account-menu-email">{currentUser.email}</p>
                                    )}
                                    {roleLabel && (
                                        <span className="nb-account-menu-role">
                                            {isAdmin && <ShieldCheckIcon className="h-3 w-3" />}
                                            {roleLabel}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-1.5">
                                <DropdownMenuItem onClick={() => openSettingsTab('profile')} className="nb-account-menu-item">
                                    <UserRoundIcon className="h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                {!isAdmin && (
                                    <DropdownMenuItem onClick={() => openSettingsTab('account')} className="nb-account-menu-item">
                                        <GaugeIcon className="h-4 w-4" />
                                        Plan &amp; usage
                                    </DropdownMenuItem>
                                )}
                                {!isAdmin && appSettings.help_tickets_enabled && (
                                    <DropdownMenuItem onClick={() => openSettingsTab('help')} className="nb-account-menu-item">
                                        <LifeBuoyIcon className="h-4 w-4" />
                                        Help &amp; support
                                    </DropdownMenuItem>
                                )}
                            </div>

                            <DropdownMenuSeparator className="m-0 bg-slate-100" />

                            <div className="p-1.5">
                                <DropdownMenuItem
                                    onClick={() => logoutAndRedirect(isAdmin ? '/admin/signin' : '/signin')}
                                    className="nb-account-menu-item is-danger"
                                >
                                    <LogOutIcon className="h-4 w-4" />
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
