'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import {
    LogOut as LogOutIcon,
    PanelLeftClose as PanelLeftCloseIcon,
    PanelLeftOpen as PanelLeftOpenIcon,
    X as XIcon,
} from 'lucide-react'
import BrandMark from '@/sections/assistant/BrandMark'
import { useAppSettings } from '@/lib/app-settings'
import { logoutAndRedirect } from '@/lib/logout'
import { isNavItemActive, navGroupsForRole } from '@/sections/admin/adminNav'
import useUnreadMessages from '@/sections/admin/useUnreadMessages'

const roleLabel = (role) => {
    if (role === 'super_admin') return 'Super admin'
    if (role === 'sub_admin') return 'Sub-admin'
    return 'Admin'
}

export default function AdminSidebar({ role = 'admin', user = null, collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) {
    const pathname = usePathname()
    const { settings } = useAppSettings()
    const groups = useMemo(() => navGroupsForRole(role), [role])
    const unreadMessages = useUnreadMessages(pathname)
    const badges = { '/manage-messages': unreadMessages }

    // Close the mobile drawer after navigating.
    useEffect(() => {
        onCloseMobile?.()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    return (
        <>
            {mobileOpen && <div className="nba-sidebar-scrim" onClick={onCloseMobile} aria-hidden="true" />}

            <aside
                className={`nba-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
                aria-label="Admin navigation"
            >
                <div className="nba-sidebar-brand">
                    <BrandMark size="md" />
                    <div className="nba-sidebar-brand-text">
                        <span className="nba-sidebar-brand-name">{settings.site_name || 'NursingAI'}</span>
                        <span className="nba-sidebar-brand-tag">{role === 'sub_admin' ? 'Sub-admin console' : 'Admin console'}</span>
                    </div>
                    <button type="button" className="nba-sidebar-close" onClick={onCloseMobile} aria-label="Close menu">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                <nav className="nba-sidebar-nav">
                    {groups.map((group) => (
                        <div key={group.label} className="nba-nav-group">
                            <div className="nba-nav-group-label">{group.label}</div>
                            {group.items.map(({ href, label, icon: Icon }) => {
                                const active = isNavItemActive(href, pathname)
                                const badge = badges[href] || 0
                                const badgeText = badge > 99 ? '99+' : String(badge)
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={`nba-nav-item ${active ? 'is-active' : ''}`}
                                        aria-current={active ? 'page' : undefined}
                                        title={collapsed ? (badge ? `${label} (${badgeText} unread)` : label) : undefined}
                                        aria-label={badge ? `${label}, ${badgeText} unread` : undefined}
                                    >
                                        <span className="nba-nav-icon-wrap">
                                            <Icon className="nba-nav-icon" />
                                            {badge > 0 && <span className="nba-nav-dot" aria-hidden="true" />}
                                        </span>
                                        <span className="nba-nav-label">{label}</span>
                                        {badge > 0 && <span className="nba-nav-badge" aria-hidden="true">{badgeText}</span>}
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                <div className="nba-sidebar-footer">
                    <div className="nba-sidebar-user">
                        <span className="nba-avatar">{user?.initials || 'AD'}</span>
                        <div className="nba-sidebar-user-text">
                            <span className="nba-sidebar-user-name">{user?.displayName || 'Admin'}</span>
                            <span className="nba-sidebar-user-role">{roleLabel(role)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => logoutAndRedirect('/admin/signin')}
                            className="nba-sidebar-signout"
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOutIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="nba-sidebar-collapse"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeftOpenIcon className="h-4 w-4" /> : <PanelLeftCloseIcon className="h-4 w-4" />}
                        <span className="nba-nav-label">Collapse</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
