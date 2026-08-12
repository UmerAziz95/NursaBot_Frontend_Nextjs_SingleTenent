'use client'

import { useEffect, useState } from 'react'
import { ChevronDown as ChevronDownIcon, LogOut as LogOutIcon, User as UserIcon } from 'lucide-react'
import HelpNotificationsBell from '@/components/HelpNotificationsBell'
import AdminSidebar from '@/sections/admin/AdminSidebar'
import SettingDialog from '@/sections/assistant/settings/Index'
import { logoutAndRedirect } from '@/lib/logout'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const readStoredJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

const getInitials = (value) => {
    const text = String(value || '').trim()
    if (!text) return 'AD'
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

export default function AdminShell({ children, title = 'Admin', subtitle = null, contentClassName = '', showHelpBell = true }) {
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = readStoredJson('user') || {}
        const session = readStoredJson('session') || {}
        const email = String(user.email || '').trim()
        const role = String(user.role || session.role || localStorage.getItem('role') || 'admin').trim()
        const displayName = String(user.display_name || '').trim() || email || 'Admin'
        setCurrentUser({ displayName, role, email })

        const sync = () => {
            const nextUser = readStoredJson('user') || {}
            const nextSession = readStoredJson('session') || {}
            const nextEmail = String(nextUser.email || '').trim()
            const nextRole = String(nextUser.role || nextSession.role || localStorage.getItem('role') || 'admin').trim()
            const nextName = String(nextUser.display_name || '').trim() || nextEmail || 'Admin'
            setCurrentUser({ displayName: nextName, role: nextRole, email: nextEmail })
        }

        window.addEventListener('assistant-profile-updated', sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener('assistant-profile-updated', sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    const openProfile = () => {
        window.dispatchEvent(new CustomEvent('assistant-open-settings', {
            detail: { tab: 'profile' },
        }))
    }

    return (
        <div className="admin-console flex h-screen w-full overflow-hidden bg-[#F4F7FA] text-sm text-slate-700">
            <AdminSidebar />
            <SettingDialog />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="admin-topbar">
                    <div className="admin-topbar-start">
                        <div className="admin-topbar-heading">
                            <h1 className="admin-topbar-title">{title}</h1>
                            {subtitle ? (
                                <p className="admin-topbar-subtitle">{subtitle}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="admin-topbar-actions">
                        {showHelpBell ? <HelpNotificationsBell isAdmin tone="light" /> : null}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="admin-topbar-account"
                                    aria-label="Open account menu"
                                    title="Account"
                                >
                                    <span className="admin-topbar-account-avatar">
                                        {getInitials(currentUser?.displayName)}
                                    </span>
                                    <span className="admin-topbar-account-text hidden sm:block">
                                        <span className="admin-topbar-account-label">Account</span>
                                        <span className="admin-topbar-account-name">
                                            {currentUser?.displayName || 'Admin'}
                                        </span>
                                    </span>
                                    <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                collisionPadding={12}
                                className="w-60 rounded-xl border border-slate-200 bg-white p-0 shadow-xl"
                            >
                                <div className="border-b border-slate-100 bg-slate-50 px-3 py-3">
                                    <p className="admin-section-title truncate">
                                        {currentUser?.displayName || 'Admin'}
                                    </p>
                                    {currentUser?.email ? (
                                        <p className="admin-page-desc mt-0.5 truncate">{currentUser.email}</p>
                                    ) : null}
                                    <p className="admin-kicker mt-1 capitalize text-[#1f7fa8]!">
                                        {(currentUser?.role || 'admin').replace('_', ' ')}
                                    </p>
                                </div>

                                <div className="p-1.5">
                                    <DropdownMenuItem
                                        onClick={openProfile}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 focus:bg-slate-50"
                                    >
                                        <UserIcon className="h-3.5 w-3.5" />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => logoutAndRedirect('/admin/signin')}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-600"
                                    >
                                        <LogOutIcon className="h-3.5 w-3.5" />
                                        Sign out
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className={`admin-page min-h-0 flex-1 overflow-y-auto ${contentClassName}`}>
                    {children}
                </main>
            </div>
        </div>
    )
}
