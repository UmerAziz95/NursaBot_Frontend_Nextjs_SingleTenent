import {
    Building2 as BuildingIcon,
    CreditCard as CreditCardIcon,
    Inbox as InboxIcon,
    LayoutDashboard as LayoutDashboardIcon,
    LifeBuoy as LifebuoyIcon,
    MessageSquare as MessageSquareIcon,
    ScrollText as ScrollTextIcon,
    Settings as SettingsIcon,
    Receipt as ReceiptIcon,
    Sparkles as SparklesIcon,
    Upload as UploadIcon,
    Users as UsersIcon,
} from 'lucide-react'

const ALL_ADMINS = ['admin', 'super_admin', 'sub_admin']
const FULL_ADMINS = ['admin', 'super_admin']

// Single source for the admin sidebar, breadcrumbs, quick search and dashboard shortcuts.
export const ADMIN_NAV_GROUPS = [
    {
        label: 'Overview',
        items: [
            { href: '/admin/dashboard', label: 'Dashboard', description: 'Key numbers and system status', icon: LayoutDashboardIcon, roles: ALL_ADMINS },
            { href: '/admin/chat', label: 'Chat', description: 'Test the assistant against any workspace', icon: MessageSquareIcon, roles: ALL_ADMINS },
        ],
    },
    {
        label: 'Knowledge',
        items: [
            { href: '/manage-businesses', label: 'Businesses', description: 'Businesses and their workspaces', icon: BuildingIcon, roles: ALL_ADMINS },
            { href: '/add-document', label: 'Documents', description: 'Upload knowledge into a workspace', icon: UploadIcon, roles: ALL_ADMINS },
        ],
    },
    {
        label: 'Customers',
        items: [
            { href: '/manage-users', label: 'Users', description: 'Site users and sub-admins', icon: UsersIcon, roles: ALL_ADMINS },
            { href: '/manage-subscriptions', label: 'Subscriptions', description: 'Active plans, usage and renewals', icon: CreditCardIcon, roles: FULL_ADMINS },
            { href: '/manage-plans', label: 'Plans', description: 'Pricing, token allowances and top-up rate', icon: SparklesIcon, roles: FULL_ADMINS },
            { href: '/manage-payments', label: 'Payments', description: 'Plan and token payments, revenue by date', icon: ReceiptIcon, roles: FULL_ADMINS },
        ],
    },
    {
        label: 'Operations',
        items: [
            { href: '/manage-help', label: 'Help desk', description: 'Answer support tickets', icon: LifebuoyIcon, roles: ALL_ADMINS },
            { href: '/manage-messages', label: 'Messages', description: 'Website contact-form messages', icon: InboxIcon, roles: ALL_ADMINS },
            { href: '/manage-site-logs', label: 'Site logs', description: 'Application errors and events', icon: ScrollTextIcon, roles: ALL_ADMINS },
            { href: '/manage-settings', label: 'Settings', description: 'Features, keys and integrations', icon: SettingsIcon, roles: FULL_ADMINS },
        ],
    },
]

export const navGroupsForRole = (role) =>
    ADMIN_NAV_GROUPS
        .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
        .filter((group) => group.items.length > 0)

export const navItemsForRole = (role) => navGroupsForRole(role).flatMap((group) => group.items)

export const isNavItemActive = (href, pathname = '') => {
    if (href === '/admin/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
}

export const findNavItem = (pathname = '') =>
    ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
        .find((item) => isNavItemActive(item.href, pathname)) || null

export const readAdminRole = () => {
    try {
        const session = JSON.parse(localStorage.getItem('session') || 'null')
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        return String(user?.role || session?.role || localStorage.getItem('role') || 'admin').toLowerCase()
    } catch {
        return 'admin'
    }
}
