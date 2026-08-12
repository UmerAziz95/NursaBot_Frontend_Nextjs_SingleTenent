'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard as LayoutDashboardIcon,
    MessageSquare as MessageSquareIcon,
    Building2 as BuildingIcon,
    Users as UsersIcon,
    Sparkles as SparklesIcon,
    CreditCard as CreditCardIcon,
    LifeBuoy as LifebuoyIcon,
    Upload as UploadIcon,
    ScrollText as ScrollTextIcon,
    Settings as SettingsIcon,
    LogOut as LogOutIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { logoutAndRedirect } from '@/lib/logout'
import { isElevatedAdminRole } from '@/components/RequireAdmin'

const ALL_NAV = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/manage-businesses', label: 'Businesses', icon: BuildingIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/manage-users', label: 'Users', icon: UsersIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/add-document', label: 'Add document', icon: UploadIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/admin/chat', label: 'Chat', icon: MessageSquareIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/manage-plans', label: 'Plans', icon: SparklesIcon, roles: ['admin', 'super_admin'] },
    { href: '/manage-subscriptions', label: 'Subscriptions', icon: CreditCardIcon, roles: ['admin', 'super_admin'] },
    { href: '/manage-help', label: 'Help', icon: LifebuoyIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/manage-site-logs', label: 'Site Logs', icon: ScrollTextIcon, roles: ['admin', 'super_admin', 'sub_admin'] },
    { href: '/manage-settings', label: 'Settings', icon: SettingsIcon, roles: ['admin', 'super_admin'] },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [role, setRole] = useState('admin')

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            setRole(String(user?.role || session?.role || localStorage.getItem('role') || 'admin').toLowerCase())
        } catch {
            setRole('admin')
        }
    }, [])

    const nav = useMemo(
        () => ALL_NAV.filter((item) => item.roles.includes(role)),
        [role]
    )

    const isActive = (href) => {
        if (href === '/admin/dashboard') return pathname === href
        return pathname === href || pathname.startsWith(`${href}/`)
    }

    return (
        <aside
            className={`flex h-full shrink-0 flex-col border-r border-white/10 bg-[#053447] text-white transition-[width] duration-200 ${
                collapsed ? 'w-[72px]' : 'w-[248px]'
            }`}
        >
            <div className={`flex items-center gap-2 border-b border-white/10 px-3 py-3 ${collapsed ? 'justify-center' : 'px-3.5'}`}>
                {!collapsed && (
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7ec8e0]">
                            NursingAI
                        </p>
                        <p className="truncate text-xs font-semibold text-white">
                            {role === 'sub_admin' ? 'Sub-admin console' : 'Admin console'}
                        </p>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => setCollapsed((value) => !value)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronLeftIcon className="h-3.5 w-3.5" />}
                </button>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2.5">
                {!collapsed && (
                    <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                        Menu
                    </p>
                )}
                {nav.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href)
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={label}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                                active
                                    ? 'bg-[#2EAADB] text-white shadow-sm'
                                    : 'text-white/75 hover:bg-white/8 hover:text-white'
                            } ${collapsed ? 'justify-center px-2' : ''}`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{label}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-white/10 p-2">
                {!collapsed && isElevatedAdminRole(role) && (
                    <p className="mb-2 px-2 text-[10px] leading-snug text-white/40">
                        You can create sub-admins from Users.
                    </p>
                )}
                <button
                    type="button"
                    onClick={() => logoutAndRedirect('/admin/signin')}
                    title="Sign out"
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-red-200 transition hover:bg-red-500/15 hover:text-red-100 ${
                        collapsed ? 'justify-center px-2' : ''
                    }`}
                >
                    <LogOutIcon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>
        </aside>
    )
}
