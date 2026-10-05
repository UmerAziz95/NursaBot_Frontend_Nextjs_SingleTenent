'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs } from '@/components/ui/tabs'
import {
    UserCircle as UserCircleIcon,
    CreditCard as CreditCardIcon,
    Gauge as GaugeIcon,
    LifeBuoy as LifebuoyIcon,
    RotateCcw as RetryIcon,
    TriangleAlert as AlertIcon,
    X as XIcon,
} from 'lucide-react'
import { SettingsProvider, initialsFrom, useSettings } from '@/sections/assistant/settings/SettingsContext'
import { resolveDisplayName } from '@/sections/assistant/settings/displayName'
import { SkeletonPage } from '@/sections/assistant/settings/SettingsUI'
import ProfileTab from '@/sections/assistant/settings/ProfileTab'
import PaymentTab from '@/sections/assistant/settings/PaymentTab'
import AccountTab from '@/sections/assistant/settings/AccountTab'
import HelpTab from '@/sections/assistant/settings/HelpTab'
import { fetchLaravel, getStoredAdminToken } from '@/lib/laravel-api'
import { useAppSettings } from '@/lib/app-settings'

const ALL_NAV = [
    { value: 'profile', label: 'Profile', description: 'Name, workspace & password', icon: UserCircleIcon },
    { value: 'account', label: 'Plan & usage', description: 'Subscription and tokens', icon: GaugeIcon, staffHidden: true },
    { value: 'payment', label: 'Payment', description: 'Saved card', icon: CreditCardIcon, staffHidden: true },
    { value: 'help', label: 'Help & support', description: 'Tickets with our team', icon: LifebuoyIcon, staffHidden: true, feature: 'help_tickets_enabled' },
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

function SettingsBody({ onClose, helpUnread = 0, navItems, tab, onTabChange }) {
    const { profile, loading, error, refresh } = useSettings()
    const profileOnly = navItems.length === 1 && navItems[0]?.value === 'profile'
    const name = resolveDisplayName(profile?.display_name) || profile?.email || ''
    const contentRef = useRef(null)

    // Each tab starts at the top instead of inheriting the previous tab's scroll.
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0 })
    }, [tab])

    return (
        <div className="nbs-shell">
            <aside className="nbs-nav">
                <div className="nbs-nav-top">
                    <div className="nbs-nav-kicker">Settings</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="nbs-close nbs-close-nav"
                        aria-label="Close settings"
                    >
                        <XIcon className="size-4" />
                    </button>
                </div>

                <div className="nbs-nav-user">
                    {profile ? (
                        <>
                            <span className="nbs-avatar">{initialsFrom(name, profile.email)}</span>
                            <div className="min-w-0">
                                <div className="nbs-nav-user-name">{name}</div>
                                <div className="nbs-nav-user-email">{profile.email}</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="nbs-skel size-10 rounded-full" />
                            <div className="flex-1 space-y-1.5">
                                <span className="nbs-skel h-3 w-24" />
                                <span className="nbs-skel h-3 w-32" />
                            </div>
                        </>
                    )}
                </div>

                {!profileOnly && (
                    <nav className="nbs-nav-list" aria-label="Settings sections">
                        {navItems.map(({ value, label, description, icon: Icon }) => {
                            const active = tab === value
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => onTabChange(value)}
                                    className={`nbs-nav-item ${active ? 'is-active' : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <span className="nbs-nav-item-icon" aria-hidden="true">
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-left">
                                        <span className="nbs-nav-item-label">{label}</span>
                                        <span className="nbs-nav-item-desc">{description}</span>
                                    </span>
                                    {value === 'help' && helpUnread > 0 && (
                                        <span className="nbs-nav-badge">{helpUnread > 9 ? '9+' : helpUnread}</span>
                                    )}
                                </button>
                            )
                        })}
                    </nav>
                )}
            </aside>

            <section ref={contentRef} className="nbs-content">
                <button
                    type="button"
                    onClick={onClose}
                    className="nbs-close nbs-close-floating"
                    aria-label="Close settings"
                    title="Close"
                >
                    <XIcon className="size-4" />
                </button>

                {loading ? (
                    <SkeletonPage />
                ) : error ? (
                    <div className="nbs-page">
                        <div className="nbs-empty">
                            <span className="nbs-empty-icon is-warning"><AlertIcon className="size-5" /></span>
                            <div className="nbs-empty-title">We couldn&apos;t load your settings</div>
                            <div className="nbs-empty-desc">Check your connection and try again.</div>
                            <button type="button" onClick={() => void refresh()} className="nbs-btn is-primary mt-4">
                                <RetryIcon className="size-4" />
                                Try again
                            </button>
                        </div>
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
                className="user-portal nbs-dialog fixed top-1/2 left-1/2 z-50 flex h-[min(760px,92vh)] w-[min(1000px,96vw)] max-w-[1000px] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-0 shadow-[0_30px_80px_-20px_rgba(5,52,71,0.45)] sm:max-w-[1000px]"
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
                            tab={tab}
                            onTabChange={setTab}
                        />
                    </SettingsProvider>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
