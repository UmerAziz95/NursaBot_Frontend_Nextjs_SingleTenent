'use client'

import Link from 'next/link'
import {
    MessageSquare as MessageSquareIcon,
    LifeBuoy as LifebuoyIcon,
    Building2 as BuildingIcon,
    Users as UsersIcon,
    Sparkles as SparklesIcon,
    CreditCard as CreditCardIcon,
    Upload as UploadIcon,
    ScrollText as ScrollTextIcon,
    Settings as SettingsIcon,
} from 'lucide-react'
import AdminShell from '@/sections/admin/AdminShell'

const QUICK_LINKS = [
    {
        href: '/manage-businesses',
        title: 'Businesses',
        description: 'List, create, update, and delete businesses and workspaces.',
        icon: BuildingIcon,
    },
    {
        href: '/manage-users',
        title: 'Users',
        description: 'Create, update, activate, or delete site users and sub-admins.',
        icon: UsersIcon,
    },
    {
        href: '/add-document',
        title: 'Add document',
        description: 'Upload knowledge documents into a workspace.',
        icon: UploadIcon,
    },
    {
        href: '/admin/chat',
        title: 'Chat',
        description: 'Test the assistant as admin with any business and workspace.',
        icon: MessageSquareIcon,
    },
    {
        href: '/manage-plans',
        title: 'Plans',
        description: 'Configure monthly subscription plans and pricing.',
        icon: SparklesIcon,
    },
    {
        href: '/manage-subscriptions',
        title: 'Subscriptions',
        description: 'View, update, cancel, and manually reactivate user subscriptions.',
        icon: CreditCardIcon,
    },
    {
        href: '/manage-help',
        title: 'Help',
        description: 'Answer user support tickets in real time.',
        icon: LifebuoyIcon,
    },
    {
        href: '/manage-site-logs',
        title: 'Site Logs',
        description: 'Inspect application errors from Laravel, Python, chat, and the frontend.',
        icon: ScrollTextIcon,
    },
    {
        href: '/manage-settings',
        title: 'Settings',
        description: 'Toggle signup, chat, help, maintenance, site defaults, and API keys.',
        icon: SettingsIcon,
    },
]

export default function AdminDashboardPage() {
    return (
        <AdminShell
            title="Dashboard"
            subtitle="Admin controls and shortcuts."
            contentClassName="bg-[#F4F7FA]"
        >
            <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-5">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-[#053447] via-[#0a4a63] to-[#2EAADB] px-4 py-4 text-white shadow-sm lg:px-5 lg:py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                        Admin console
                    </p>
                    <h2 className="mt-1 max-w-xl text-[15px] font-semibold tracking-tight text-white">
                        Manage tenants, support, and knowledge from one place.
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-xs text-white/75">
                        Use the left sidebar for every admin action. Open Chat when you need to test the assistant against a business and workspace.
                    </p>
                    <Link
                        href="/admin/chat"
                        className="mt-3 inline-flex h-8 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-[#053447] transition hover:bg-slate-100"
                    >
                        Open admin chat
                    </Link>
                </section>

                <section>
                    <h3 className="admin-section-title mb-2">
                        Quick actions
                    </h3>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {QUICK_LINKS.map(({ href, title, description, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-[#2EAADB]/40 hover:shadow-md"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF7FC] text-[#2EAADB] transition group-hover:bg-[#2EAADB] group-hover:text-white">
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                <p className="admin-section-title mt-2">{title}</p>
                                <p className="mt-0.5 text-xs leading-snug text-slate-500">{description}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </AdminShell>
    )
}
