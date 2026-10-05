'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import {
    ChevronDown as ChevronDownIcon,
    ChevronRight as ChevronRightIcon,
    LogOut as LogOutIcon,
    Menu as MenuIcon,
    Search as SearchIcon,
    ShieldCheck as ShieldCheckIcon,
    UserRound as UserIcon,
} from 'lucide-react'
import HelpNotificationsBell from '@/components/HelpNotificationsBell'
import AdminSidebar from '@/sections/admin/AdminSidebar'
import AdminCommandPalette from '@/sections/admin/AdminCommandPalette'
import SettingDialog from '@/sections/assistant/settings/Index'
import { logoutAndRedirect } from '@/lib/logout'
import { findNavItem, readAdminRole } from '@/sections/admin/adminNav'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import '@/sections/admin/admin.css'

const COLLAPSE_KEY = 'nb_admin_sidebar_collapsed'

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

const PREFS_EVENT = 'nb-admin-prefs'

const readCurrentUser = () => {
    const user = readStoredJson('user') || {}
    const email = String(user.email || '').trim()
    const displayName = String(user.display_name || '').trim() || email || 'Admin'
    return { displayName, email, initials: getInitials(displayName) }
}

// Identity and sidebar preference live in localStorage; subscribe to it instead of
// copying it into state from an effect.
const subscribeToStorage = (callback) => {
    window.addEventListener('storage', callback)
    window.addEventListener('assistant-profile-updated', callback)
    window.addEventListener(PREFS_EVENT, callback)
    return () => {
        window.removeEventListener('storage', callback)
        window.removeEventListener('assistant-profile-updated', callback)
        window.removeEventListener(PREFS_EVENT, callback)
    }
}

const storageSnapshot = () => {
    try {
        return JSON.stringify([
            localStorage.getItem('user'),
            localStorage.getItem('session'),
            localStorage.getItem('role'),
            localStorage.getItem(COLLAPSE_KEY),
        ])
    } catch {
        return ''
    }
}

const serverSnapshot = () => ''
const noopSubscribe = () => () => {}

export default function AdminShell({ children, title = 'Admin', subtitle = null, contentClassName = '', showHelpBell = true }) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useState(false)

    const snapshot = useSyncExternalStore(subscribeToStorage, storageSnapshot, serverSnapshot)
    const { currentUser, role, collapsed } = useMemo(() => {
        if (!snapshot) return { currentUser: null, role: 'admin', collapsed: false }
        let isCollapsed = false
        try {
            isCollapsed = localStorage.getItem(COLLAPSE_KEY) === '1'
        } catch {
            isCollapsed = false
        }
        return { currentUser: readCurrentUser(), role: readAdminRole(), collapsed: isCollapsed }
    }, [snapshot])
    const isMac = useSyncExternalStore(
        noopSubscribe,
        () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || ''),
        () => false
    )

    useEffect(() => {
        const onKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault()
                setPaletteOpen((open) => !open)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    const toggleCollapsed = () => {
        try {
            localStorage.setItem(COLLAPSE_KEY, collapsed ? '0' : '1')
        } catch {
            // Preference only.
        }
        window.dispatchEvent(new Event(PREFS_EVENT))
    }

    const openProfile = () => {
        window.dispatchEvent(new CustomEvent('assistant-open-settings', {
            detail: { tab: 'profile' },
        }))
    }

    const navItem = findNavItem(pathname)
    const roleText = role.replace('_', ' ')

    return (
        <div className="admin-console nba-shell">
            <AdminSidebar
                role={role}
                user={currentUser}
                collapsed={collapsed}
                onToggleCollapse={toggleCollapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />
            <SettingDialog />
            {paletteOpen && <AdminCommandPalette onClose={() => setPaletteOpen(false)} role={role} />}

            <div className="nba-main">
                <header className="admin-topbar nba-topbar">
                    <button
                        type="button"
                        className="nba-icon-btn nba-menu-btn"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <MenuIcon className="h-5 w-5" />
                    </button>

                    <div className="admin-topbar-start">
                        <div className="nba-breadcrumb" aria-label="Breadcrumb">
                            <span>Admin</span>
                            {navItem && (
                                <>
                                    <ChevronRightIcon className="h-3 w-3" />
                                    <span>{navItem.group}</span>
                                </>
                            )}
                        </div>
                        <h1 className="admin-topbar-title">{title}</h1>
                        {subtitle ? <p className="admin-topbar-subtitle">{subtitle}</p> : null}
                    </div>

                    <div className="admin-topbar-actions">
                        <button
                            type="button"
                            className="nba-search-btn"
                            onClick={() => setPaletteOpen(true)}
                            aria-label="Search pages"
                        >
                            <SearchIcon className="h-4 w-4" />
                            <span className="nba-search-label">Search…</span>
                            <kbd className="nba-search-kbd">{isMac ? '⌘' : 'Ctrl'} K</kbd>
                        </button>

                        {showHelpBell ? <HelpNotificationsBell isAdmin tone="light" /> : null}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="nba-account" aria-label="Open account menu" title="Account">
                                    <span className="nba-avatar is-sm">{currentUser?.initials || 'AD'}</span>
                                    <span className="nba-account-text">
                                        <span className="nba-account-name">{currentUser?.displayName || 'Admin'}</span>
                                        <span className="nba-account-role">{roleText}</span>
                                    </span>
                                    <ChevronDownIcon className="nba-account-chevron h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                collisionPadding={12}
                                className="nba-account-menu w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-[0_20px_50px_-12px_rgba(5,52,71,0.28)]"
                            >
                                <div className="nba-account-menu-head">
                                    <span className="nba-avatar is-lg">{currentUser?.initials || 'AD'}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="nba-account-menu-name">{currentUser?.displayName || 'Admin'}</div>
                                        {currentUser?.email && currentUser.email !== currentUser.displayName && (
                                            <div className="nba-account-menu-email">{currentUser.email}</div>
                                        )}
                                        <span className="nba-role-pill">
                                            <ShieldCheckIcon className="h-3 w-3" />
                                            {roleText}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-1.5">
                                    <DropdownMenuItem onClick={openProfile} className="nba-menu-item">
                                        <UserIcon className="h-4 w-4" />
                                        Profile &amp; password
                                    </DropdownMenuItem>
                                </div>
                                <DropdownMenuSeparator className="m-0 bg-slate-100" />
                                <div className="p-1.5">
                                    <DropdownMenuItem onClick={() => logoutAndRedirect('/admin/signin')} className="nba-menu-item is-danger">
                                        <LogOutIcon className="h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className={`admin-page nba-content min-h-0 flex-1 overflow-y-auto ${contentClassName}`}>
                    {children}
                </main>
            </div>
        </div>
    )
}
