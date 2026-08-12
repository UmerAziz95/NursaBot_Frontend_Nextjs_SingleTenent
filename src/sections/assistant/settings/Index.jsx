'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    UserCircle as UserCircleIcon,
    CreditCard as CreditCardIcon,
    Gauge as GaugeIcon,
    LifeBuoy as LifebuoyIcon,
    X as XIcon,
} from 'lucide-react'
import { SettingsProvider, useSettings } from '@/sections/assistant/settings/SettingsContext'
import ProfileTab from '@/sections/assistant/settings/ProfileTab'
import PaymentTab from '@/sections/assistant/settings/PaymentTab'
import AccountTab from '@/sections/assistant/settings/AccountTab'
import HelpTab from '@/sections/assistant/settings/HelpTab'
import { fetchLaravel, getStoredAdminToken } from '@/lib/laravel-api'
import { useAppSettings } from '@/lib/app-settings'

const ALL_NAV = [
    { value: 'profile', label: 'Profile', icon: UserCircleIcon },
    { value: 'account', label: 'Plan & usage', icon: GaugeIcon, staffHidden: true },
    { value: 'payment', label: 'Payment', icon: CreditCardIcon, staffHidden: true },
    { value: 'help', label: 'Help', icon: LifebuoyIcon, staffHidden: true, feature: 'help_tickets_enabled' },
]

const STAFF_ROLES = new Set(['admin', 'super_admin', 'sub_admin'])

const readRole = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        const session = JSON.parse(localStorage.getItem('session') || 'null')
        return String(user?.role || session?.role || localStorage.getItem('role') || '').toLowerCase()
    } catch {
        return ''
    }
}

function SettingsBody({ onClose, helpUnread = 0, navItems }) {
    const { loading, error, refresh } = useSettings()
    const profileOnly = navItems.length === 1 && navItems[0]?.value === 'profile'

    return (
        <div className="flex h-full min-h-0 w-full flex-col md:flex-row">
            <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-[#F7FAFC] px-4 py-4 md:w-[220px] md:border-b-0 md:border-r md:px-5 md:py-5">
                <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
                    <div>
                        <p className="user-portal-kicker user-portal-kicker-accent">
                            Settings
                        </p>
                        <p className="user-portal-section-title mt-0.5">
                            {profileOnly ? 'Profile' : 'Your account'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close settings"
                    >
                        <XIcon className="size-4" />
                    </button>
                </div>

                {!profileOnly && (
                    <TabsList
                        variant="line"
                        className="flex h-auto w-full flex-row gap-1 bg-transparent p-0 md:flex-col md:items-stretch"
                    >
                        {navItems.map(({ value, label, icon: Icon }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="user-portal-settings-nav h-auto flex-none justify-start gap-2 rounded-lg border border-transparent px-3 py-2.5 text-slate-600 after:hidden data-[state=active]:!border-[#2EAADB]/20 data-[state=active]:!bg-white data-[state=active]:!font-semibold data-[state=active]:!text-[#053447] data-[state=active]:!shadow-sm"
                            >
                                <Icon className="size-4 shrink-0" />
                                <span className="flex-1 text-left">{label}</span>
                                {value === 'help' && helpUnread > 0 && (
                                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#F97316] px-1.5 text-[10px] font-bold leading-5 text-white">
                                        {helpUnread > 9 ? '9+' : helpUnread}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                )}
            </aside>

            <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white">
                {loading ? (
                    <div className="space-y-4 p-6 md:p-8">
                        <div className="h-7 w-36 animate-pulse rounded-md bg-slate-100" />
                        <div className="h-4 w-64 animate-pulse rounded-md bg-slate-100" />
                        <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
                        <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                ) : error ? (
                    <div className="flex h-full flex-col items-start justify-center gap-4 p-6 md:p-8">
                        <p className="user-portal-page-desc">Could not load settings.</p>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            className="user-portal-btn-primary"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <>
                        <ProfileTab />
                        {navItems.some((item) => item.value === 'account') && <AccountTab />}
                        {navItems.some((item) => item.value === 'payment') && <PaymentTab />}
                        {navItems.some((item) => item.value === 'help') && <HelpTab />}
                    </>
                )}
            </section>
        </div>
    )
}

export default function SettingDialog({ children }) {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState('profile')
    const [helpUnread, setHelpUnread] = useState(0)
    const [isStaff, setIsStaff] = useState(false)
    const skipProfileResetRef = useRef(false)
    const { settings } = useAppSettings()

    useEffect(() => {
        setIsStaff(STAFF_ROLES.has(readRole()))
    }, [open])

    const navItems = useMemo(
        () =>
            ALL_NAV.filter((item) => {
                if (isStaff && item.staffHidden) return false
                if (item.feature === 'help_tickets_enabled' && !settings.help_tickets_enabled) return false
                return true
            }),
        [isStaff, settings.help_tickets_enabled]
    )

    useEffect(() => {
        const handleOpen = (event) => {
            const staff = STAFF_ROLES.has(readRole())
            setIsStaff(staff)
            const requested = String(event?.detail?.tab || 'profile')
            const helpAllowed = settings.help_tickets_enabled
            const allowed = staff
                ? 'profile'
                : (ALL_NAV.some((item) => {
                    if (item.value !== requested) return false
                    if (item.feature === 'help_tickets_enabled' && !helpAllowed) return false
                    return true
                }) ? requested : 'profile')
            skipProfileResetRef.current = true
            setTab(allowed)
            setOpen(true)
        }

        window.addEventListener('assistant-open-settings', handleOpen)
        return () => window.removeEventListener('assistant-open-settings', handleOpen)
    }, [settings.help_tickets_enabled])

    useEffect(() => {
        if (!open || tab !== 'help' || isStaff) return

        const markHelpRead = async () => {
            try {
                await fetchLaravel('/api/help/notifications/read-all', { method: 'POST' })
                setHelpUnread(0)
            } catch {
                // Non-blocking.
            }
        }

        void markHelpRead()
    }, [open, tab, isStaff])

    useEffect(() => {
        if (isStaff) return undefined
        if (!settings.help_tickets_enabled) {
            setHelpUnread(0)
            return undefined
        }

        let cancelled = false

        const loadUnread = async () => {
            try {
                if (!getStoredAdminToken()) return
                const res = await fetchLaravel('/api/help/notifications/summary')
                const data = await res.json().catch(() => null)
                if (!res.ok || cancelled) return
                setHelpUnread(Number(data?.unread_count || 0))
            } catch {
                // Ignore.
            }
        }

        void loadUnread()
        const timer = window.setInterval(() => void loadUnread(), 8000)
        return () => {
            cancelled = true
            window.clearInterval(timer)
        }
    }, [isStaff, settings.help_tickets_enabled])

    useEffect(() => {
        if (isStaff && tab !== 'profile') {
            setTab('profile')
        }
    }, [isStaff, tab])

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (next && !skipProfileResetRef.current) {
                    setTab('profile')
                }
                skipProfileResetRef.current = false
            }}
        >
            {children ? (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            ) : null}

            <DialogContent
                showCloseButton={false}
                className="user-portal fixed top-1/2 left-1/2 z-50 flex h-[min(760px,92vh)] w-[min(960px,96vw)] max-w-[960px] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[960px]"
            >
                <DialogTitle className="sr-only">Account settings</DialogTitle>
                <DialogDescription className="sr-only">
                    {isStaff
                        ? 'Manage your profile.'
                        : 'Manage your profile, subscription plan, token usage, and payment method.'}
                </DialogDescription>

                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    orientation="vertical"
                    className="flex h-full min-h-0 w-full flex-col gap-0 data-[orientation=vertical]:flex-col md:data-[orientation=vertical]:flex-row"
                >
                    <SettingsProvider open={open}>
                        <SettingsBody
                            onClose={() => setOpen(false)}
                            helpUnread={helpUnread}
                            navItems={navItems}
                        />
                    </SettingsProvider>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
