'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Settings as SettingsIcon,
    RefreshCw as RefreshIcon,
    Save as SaveIcon,
    KeyRound as KeyIcon,
    Building2 as BuildingIcon,
    ToggleLeft as ToggleIcon,
    Activity as ActivityIcon,
    CreditCard as CreditCardIcon,
    ShieldCheck as ShieldCheckIcon,
    ShieldAlert as ShieldIcon,
    Mail as MailIcon,
} from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'features', label: 'Features', icon: ToggleIcon },
    { id: 'site-users', label: 'Site users', icon: BuildingIcon },
    { id: 'ai', label: 'AI & keys', icon: KeyIcon },
    { id: 'payments', label: 'Payments', icon: CreditCardIcon },
    { id: 'email', label: 'Email / SMTP', icon: MailIcon },
    { id: 'captcha', label: 'Captcha', icon: ShieldCheckIcon },
    { id: 'status', label: 'System status', icon: ActivityIcon },
]

const emptySettings = {
    site_name: 'NursingAI',
    support_email: '',
    maintenance_mode: false,
    maintenance_message: 'We are performing scheduled maintenance. Please try again soon.',
    user_signup_enabled: true,
    user_chat_enabled: true,
    admin_chat_enabled: true,
    help_tickets_enabled: true,
    require_plan_for_chat: true,
    voice_chat_enabled: true,
}

const Toggle = ({ checked, onChange, label, description, disabled = false }) => (
    <label className={`flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3.5 py-3 ${disabled ? 'opacity-60' : ''}`}>
        <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-800">{label}</span>
            {description ? <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span> : null}
        </span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                checked ? 'bg-[#2EAADB]' : 'bg-slate-300'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </label>
)

const Field = ({ label, children, hint }) => (
    <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {children}
        {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
)

const inputClass =
    'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15'

const StatusRow = ({ label, value, ok }) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span
            className={`inline-flex max-w-[60%] items-center truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                ok === true
                    ? 'bg-emerald-50 text-emerald-700'
                    : ok === false
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
            }`}
        >
            {value ?? '—'}
        </span>
    </div>
)

export default function ManageSettingsPage() {
    const [tab, setTab] = useState('general')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState(emptySettings)
    const [openai, setOpenai] = useState(null)
    const [openaiValue, setOpenaiValue] = useState('')
    const [openaiSaving, setOpenaiSaving] = useState(false)
    const [stripe, setStripe] = useState(null)
    const [stripeForm, setStripeForm] = useState({
        enabled: true,
        environment: 'test',
        test_publishable_key: '',
        test_secret_key: '',
        live_publishable_key: '',
        live_secret_key: '',
    })
    const [stripeSaving, setStripeSaving] = useState(false)
    const [turnstile, setTurnstile] = useState(null)
    const [turnstileForm, setTurnstileForm] = useState({
        enabled: true,
        site_key: '',
        secret_key: '',
    })
    const [turnstileSaving, setTurnstileSaving] = useState(false)
    const [mail, setMail] = useState(null)
    const [mailForm, setMailForm] = useState({
        enabled: true,
        mailer: 'smtp',
        host: '',
        port: '587',
        username: '',
        password: '',
        encryption: 'tls',
        from_address: '',
        from_name: '',
        frontend_url: '',
        test_to: '',
    })
    const [mailSaving, setMailSaving] = useState(false)
    const [mailTesting, setMailTesting] = useState(false)
    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])
    const [siteUserBusinessId, setSiteUserBusinessId] = useState('')
    const [siteUserWorkspaceId, setSiteUserWorkspaceId] = useState('')
    const [siteUserSaving, setSiteUserSaving] = useState(false)
    const [status, setStatus] = useState({
        projectApi: null,
        runtime: null,
        database: null,
        authMode: null,
        storage: null,
    })

    const loadAll = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true)
        try {
            const [
                settingsRes,
                openaiRes,
                defaultsRes,
                businessesRes,
                projectApiRes,
                runtimeRes,
                databaseRes,
                authModeRes,
                storageRes,
                stripeRes,
                turnstileRes,
                mailRes,
            ] = await Promise.all([
                fetchLaravel('/api/admin/system-config/app-settings'),
                fetchLaravel('/api/admin/system-config/openai-api-key'),
                fetchLaravel('/api/admin/system-config/site-user-defaults'),
                fetchLaravel('/api/admin/businesses'),
                fetchLaravel('/api/admin/system-config/project-api'),
                fetchLaravel('/api/admin/system-config/runtime'),
                fetchLaravel('/api/admin/system-config/database'),
                fetchLaravel('/api/admin/system-config/auth-mode'),
                fetchLaravel('/api/admin/system-config/storage'),
                fetchLaravel('/api/admin/system-config/stripe'),
                fetchLaravel('/api/admin/system-config/turnstile'),
                fetchLaravel('/api/admin/system-config/mail'),
            ])

            const settingsData = await settingsRes.json().catch(() => null)
            if (!settingsRes.ok) throw new Error(settingsData?.detail || 'Could not load settings.')
            setSettings({ ...emptySettings, ...(settingsData?.settings || {}) })

            const openaiData = await openaiRes.json().catch(() => null)
            if (openaiRes.ok) setOpenai(openaiData)

            const stripeData = await stripeRes.json().catch(() => null)
            if (stripeRes.ok) {
                setStripe(stripeData)
                setStripeForm((prev) => ({
                    ...prev,
                    enabled: !!stripeData?.enabled,
                    environment: stripeData?.environment === 'live' ? 'live' : 'test',
                    test_publishable_key: '',
                    test_secret_key: '',
                    live_publishable_key: '',
                    live_secret_key: '',
                }))
            }

            const turnstileData = await turnstileRes.json().catch(() => null)
            if (turnstileRes.ok) {
                setTurnstile(turnstileData)
                setTurnstileForm((prev) => ({
                    ...prev,
                    enabled: !!turnstileData?.enabled,
                    site_key: '',
                    secret_key: '',
                }))
            }

            const mailData = await mailRes.json().catch(() => null)
            if (mailRes.ok) {
                setMail(mailData)
                setMailForm((prev) => ({
                    ...prev,
                    enabled: mailData?.enabled !== false,
                    mailer: mailData?.mailer || 'smtp',
                    host: mailData?.host || '',
                    port: String(mailData?.port || 587),
                    username: '',
                    password: '',
                    encryption: mailData?.encryption || 'tls',
                    from_address: mailData?.from_address || '',
                    from_name: mailData?.from_name || '',
                    frontend_url: mailData?.frontend_url || '',
                }))
            }

            const defaultsData = await defaultsRes.json().catch(() => null)
            if (defaultsRes.ok) {
                setSiteUserBusinessId(String(defaultsData?.business_client_id || '').trim())
                setSiteUserWorkspaceId(String(defaultsData?.workspace_id || '').trim())
            }

            const businessesData = await businessesRes.json().catch(() => null)
            if (businessesRes.ok) {
                setBusinesses(Array.isArray(businessesData) ? businessesData : [])
            }

            setStatus({
                projectApi: projectApiRes.ok ? await projectApiRes.json().catch(() => null) : null,
                runtime: runtimeRes.ok ? await runtimeRes.json().catch(() => null) : null,
                database: databaseRes.ok ? await databaseRes.json().catch(() => null) : null,
                authMode: authModeRes.ok ? await authModeRes.json().catch(() => null) : null,
                storage: storageRes.ok ? await storageRes.json().catch(() => null) : null,
            })
        } catch (err) {
            if (!silent) toast.error(err.message || 'Could not load settings.')
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadAll()
    }, [loadAll])

    useEffect(() => {
        if (!siteUserBusinessId) {
            setWorkspaces([])
            return
        }
        let cancelled = false
        const load = async () => {
            try {
                const res = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(siteUserBusinessId)}/workspaces`
                )
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not load workspaces.')
                if (cancelled) return
                const list = Array.isArray(data) ? data : []
                setWorkspaces(list)
                if (siteUserWorkspaceId && !list.some((item) => item.workspace_id === siteUserWorkspaceId)) {
                    setSiteUserWorkspaceId(list[0]?.workspace_id || '')
                }
            } catch {
                if (!cancelled) setWorkspaces([])
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [siteUserBusinessId, siteUserWorkspaceId])

    const patchSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }))
    }

    const saveAppSettings = async () => {
        setSaving(true)
        try {
            const res = await fetchLaravel('/api/admin/system-config/app-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    site_name: settings.site_name,
                    support_email: settings.support_email ? settings.support_email : '',
                    maintenance_mode: !!settings.maintenance_mode,
                    maintenance_message: settings.maintenance_message,
                    user_signup_enabled: !!settings.user_signup_enabled,
                    user_chat_enabled: !!settings.user_chat_enabled,
                    admin_chat_enabled: !!settings.admin_chat_enabled,
                    help_tickets_enabled: !!settings.help_tickets_enabled,
                    require_plan_for_chat: !!settings.require_plan_for_chat,
                    voice_chat_enabled: !!settings.voice_chat_enabled,
                }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not save settings.')
            setSettings({ ...emptySettings, ...(data?.settings || {}) })
            toast.success(data?.message || 'Settings saved.')
        } catch (err) {
            toast.error(err.message || 'Could not save settings.')
        } finally {
            setSaving(false)
        }
    }

    const saveSiteUserDefaults = async () => {
        if (!siteUserBusinessId || !siteUserWorkspaceId) {
            toast.error('Select both a business and a workspace.')
            return
        }
        setSiteUserSaving(true)
        try {
            const res = await fetchLaravel('/api/admin/system-config/site-user-defaults', {
                method: 'PUT',
                body: JSON.stringify({
                    business_client_id: siteUserBusinessId,
                    workspace_id: siteUserWorkspaceId,
                }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not save site user defaults.')
            toast.success(data?.message || 'Site user defaults saved.')
        } catch (err) {
            toast.error(err.message || 'Could not save site user defaults.')
        } finally {
            setSiteUserSaving(false)
        }
    }

    const saveOpenAiKey = async () => {
        const value = openaiValue.trim()
        if (!value) {
            toast.error('Enter an OpenAI API key.')
            return
        }
        setOpenaiSaving(true)
        try {
            const res = await fetchLaravel('/api/admin/system-config/openai-api-key', {
                method: 'PUT',
                body: JSON.stringify({ value }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not save API key.')
            setOpenaiValue('')
            toast.success(data?.message || 'OpenAI API key saved.')
            await loadAll({ silent: true })
        } catch (err) {
            toast.error(err.message || 'Could not save API key.')
        } finally {
            setOpenaiSaving(false)
        }
    }

    const clearOpenAiKey = async () => {
        setOpenaiSaving(true)
        try {
            const res = await fetchLaravel('/api/admin/system-config/openai-api-key', { method: 'DELETE' })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not clear API key.')
            toast.success(data?.message || 'OpenAI override cleared.')
            await loadAll({ silent: true })
        } catch (err) {
            toast.error(err.message || 'Could not clear API key.')
        } finally {
            setOpenaiSaving(false)
        }
    }

    const saveStripeSettings = async () => {
        setStripeSaving(true)
        try {
            const payload = {
                enabled: !!stripeForm.enabled,
                environment: stripeForm.environment === 'live' ? 'live' : 'test',
            }
            if (stripeForm.test_publishable_key.trim()) payload.test_publishable_key = stripeForm.test_publishable_key.trim()
            if (stripeForm.test_secret_key.trim()) payload.test_secret_key = stripeForm.test_secret_key.trim()
            if (stripeForm.live_publishable_key.trim()) payload.live_publishable_key = stripeForm.live_publishable_key.trim()
            if (stripeForm.live_secret_key.trim()) payload.live_secret_key = stripeForm.live_secret_key.trim()

            const res = await fetchLaravel('/api/admin/system-config/stripe', {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not save Stripe settings.')
            setStripe(data)
            setStripeForm((prev) => ({
                ...prev,
                enabled: !!data?.enabled,
                environment: data?.environment === 'live' ? 'live' : 'test',
                test_publishable_key: '',
                test_secret_key: '',
                live_publishable_key: '',
                live_secret_key: '',
            }))
            toast.success(data?.message || 'Stripe settings saved.')
        } catch (err) {
            toast.error(err.message || 'Could not save Stripe settings.')
        } finally {
            setStripeSaving(false)
        }
    }

    const saveTurnstileSettings = async () => {
        setTurnstileSaving(true)
        try {
            const payload = { enabled: !!turnstileForm.enabled }
            if (turnstileForm.site_key.trim()) payload.site_key = turnstileForm.site_key.trim()
            if (turnstileForm.secret_key.trim()) payload.secret_key = turnstileForm.secret_key.trim()

            const res = await fetchLaravel('/api/admin/system-config/turnstile', {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not save Turnstile settings.')
            setTurnstile(data)
            setTurnstileForm((prev) => ({
                ...prev,
                enabled: !!data?.enabled,
                site_key: '',
                secret_key: '',
            }))
            toast.success(data?.message || 'Turnstile settings saved.')
        } catch (err) {
            toast.error(err.message || 'Could not save Turnstile settings.')
        } finally {
            setTurnstileSaving(false)
        }
    }

    const saveMailSettings = async () => {
        setMailSaving(true)
        try {
            const payload = {
                enabled: !!mailForm.enabled,
                mailer: mailForm.mailer || 'smtp',
                host: mailForm.host.trim(),
                port: Number(mailForm.port) || 587,
                encryption: mailForm.encryption || 'tls',
                from_address: mailForm.from_address.trim(),
                from_name: mailForm.from_name.trim(),
            }
            if (mailForm.username.trim()) payload.username = mailForm.username.trim()
            if (mailForm.password.trim()) payload.password = mailForm.password.trim()
            if (mailForm.frontend_url.trim()) payload.frontend_url = mailForm.frontend_url.trim()

            const res = await fetchLaravel('/api/admin/system-config/mail', {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not save SMTP settings.')
            setMail(data)
            setMailForm((prev) => ({
                ...prev,
                enabled: data?.enabled !== false,
                mailer: data?.mailer || 'smtp',
                host: data?.host || '',
                port: String(data?.port || 587),
                username: '',
                password: '',
                encryption: data?.encryption || 'tls',
                from_address: data?.from_address || '',
                from_name: data?.from_name || '',
                frontend_url: data?.frontend_url || '',
            }))
            toast.success(data?.message || 'SMTP settings saved.')
        } catch (err) {
            toast.error(err.message || 'Could not save SMTP settings.')
        } finally {
            setMailSaving(false)
        }
    }

    const sendTestMail = async () => {
        setMailTesting(true)
        try {
            const payload = {}
            if (mailForm.test_to.trim()) payload.to = mailForm.test_to.trim()
            const res = await fetchLaravel('/api/admin/system-config/mail/test', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Could not send test email.')
            toast.success(data?.message || 'Test email sent.')
        } catch (err) {
            toast.error(err.message || 'Could not send test email.')
        } finally {
            setMailTesting(false)
        }
    }

    const activeTab = useMemo(() => TABS.find((item) => item.id === tab) || TABS[0], [tab])

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                Loading settings…
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-5">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-[#053447] via-[#0a4a63] to-[#2EAADB] px-4 py-4 text-white shadow-sm lg:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                            Application settings
                        </p>
                        <h2 className="mt-1 text-[15px] font-semibold tracking-tight">
                            Control user and admin behavior from one place
                        </h2>
                        <p className="mt-1.5 max-w-2xl text-xs text-white/75">
                            Changes apply immediately to signup, chat, help, plans, and related controls.
                            Add more settings here as new requirements come in.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadAll()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                        <RefreshIcon className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>
            </section>

            {settings.maintenance_mode ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-900">
                    <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">Maintenance mode is on</p>
                        <p className="mt-0.5 text-xs text-amber-800/90">
                            Signup and chat are blocked for end users until you turn this off.
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
                <aside className="h-fit rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const active = tab === id
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition ${
                                    active
                                        ? 'bg-[#EAF7FC] text-[#053447]'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {label}
                            </button>
                        )
                    })}
                </aside>

                <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                            <p className="admin-kicker">{activeTab.label}</p>
                            <h3 className="admin-section-title mt-0.5">
                                {tab === 'general' && 'Branding and maintenance'}
                                {tab === 'features' && 'Feature toggles'}
                                {tab === 'site-users' && 'Default tenant for new signups'}
                                {tab === 'ai' && 'OpenAI configuration'}
                                {tab === 'status' && 'Read-only environment status'}
                            </h3>
                        </div>
                        {(tab === 'general' || tab === 'features') && (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void saveAppSettings()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#053447] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0a4a63] disabled:opacity-60"
                            >
                                <SaveIcon className="h-3.5 w-3.5" />
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        )}
                    </div>

                    {tab === 'general' && (
                        <div className="space-y-3.5">
                            <Field label="Site name" hint="Shown in public and portal surfaces that read app settings.">
                                <input
                                    className={inputClass}
                                    value={settings.site_name || ''}
                                    onChange={(e) => patchSetting('site_name', e.target.value)}
                                    maxLength={120}
                                />
                            </Field>
                            <Field label="Support email" hint="Optional contact used when help or support links need an address.">
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={settings.support_email || ''}
                                    onChange={(e) => patchSetting('support_email', e.target.value)}
                                    placeholder="support@example.com"
                                />
                            </Field>
                            <Toggle
                                checked={!!settings.maintenance_mode}
                                onChange={(value) => patchSetting('maintenance_mode', value)}
                                label="Maintenance mode"
                                description="Blocks user signup and chat while you perform upgrades."
                            />
                            <Field label="Maintenance message">
                                <textarea
                                    className={`${inputClass} h-24 py-2`}
                                    value={settings.maintenance_message || ''}
                                    onChange={(e) => patchSetting('maintenance_message', e.target.value)}
                                    maxLength={1000}
                                />
                            </Field>
                        </div>
                    )}

                    {tab === 'features' && (
                        <div className="space-y-2.5">
                            <Toggle
                                checked={!!settings.user_signup_enabled}
                                onChange={(value) => patchSetting('user_signup_enabled', value)}
                                label="User signup"
                                description="Allow new site users to register from the public signup page."
                            />
                            <Toggle
                                checked={!!settings.user_chat_enabled}
                                onChange={(value) => patchSetting('user_chat_enabled', value)}
                                label="User chat"
                                description="Enable the assistant chat experience for site users."
                            />
                            <Toggle
                                checked={!!settings.admin_chat_enabled}
                                onChange={(value) => patchSetting('admin_chat_enabled', value)}
                                label="Admin chat"
                                description="Enable chat testing for admin and sub-admin accounts."
                            />
                            <Toggle
                                checked={!!settings.voice_chat_enabled}
                                onChange={(value) => patchSetting('voice_chat_enabled', value)}
                                label="Voice chat"
                                description="Allow voice input on chat when the feature is available."
                            />
                            <Toggle
                                checked={!!settings.help_tickets_enabled}
                                onChange={(value) => patchSetting('help_tickets_enabled', value)}
                                label="Help tickets"
                                description="Show and accept user help tickets from account settings."
                            />
                            <Toggle
                                checked={!!settings.require_plan_for_chat}
                                onChange={(value) => patchSetting('require_plan_for_chat', value)}
                                label="Require plan for chat"
                                description="When off, site users can chat without an active subscription."
                            />
                        </div>
                    )}

                    {tab === 'site-users' && (
                        <div className="space-y-3.5">
                            <p className="text-xs leading-relaxed text-slate-500">
                                New self-serve signups are assigned to this business and workspace automatically.
                            </p>
                            <Field label="Business">
                                <select
                                    className={inputClass}
                                    value={siteUserBusinessId}
                                    onChange={(e) => {
                                        setSiteUserBusinessId(e.target.value)
                                        setSiteUserWorkspaceId('')
                                    }}
                                >
                                    <option value="">Choose a business</option>
                                    {businesses.map((business) => (
                                        <option key={business.business_client_id} value={business.business_client_id}>
                                            {business.name || business.business_client_id}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Workspace">
                                <select
                                    className={inputClass}
                                    value={siteUserWorkspaceId}
                                    onChange={(e) => setSiteUserWorkspaceId(e.target.value)}
                                    disabled={!siteUserBusinessId}
                                >
                                    <option value="">Choose a workspace</option>
                                    {workspaces.map((workspace) => (
                                        <option key={workspace.workspace_id} value={workspace.workspace_id}>
                                            {workspace.name || workspace.workspace_id}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <button
                                type="button"
                                disabled={siteUserSaving || !siteUserBusinessId || !siteUserWorkspaceId}
                                onClick={() => void saveSiteUserDefaults()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#053447] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0a4a63] disabled:opacity-60"
                            >
                                <SaveIcon className="h-3.5 w-3.5" />
                                {siteUserSaving ? 'Saving…' : 'Save site user defaults'}
                            </button>
                        </div>
                    )}

                    {tab === 'ai' && (
                        <div className="space-y-3.5">
                            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Current key
                                </p>
                                <p
                                    className="mt-1 max-w-full truncate font-mono text-sm text-slate-800"
                                    title={openai?.masked_key || undefined}
                                >
                                    {openai?.masked_key || 'Not configured'}
                                </p>
                                <p className="mt-1 break-words text-xs text-slate-500">
                                    Source: {openai?.source || 'none'}
                                    {openai?.has_database_override ? ' (database override)' : ''}
                                </p>
                            </div>
                            <Field label="Set / replace OpenAI API key" hint="Saved in system_config and used ahead of the env fallback.">
                                <input
                                    type="password"
                                    className={inputClass}
                                    value={openaiValue}
                                    onChange={(e) => setOpenaiValue(e.target.value)}
                                    placeholder="sk-…"
                                    autoComplete="off"
                                />
                            </Field>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={openaiSaving}
                                    onClick={() => void saveOpenAiKey()}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#053447] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0a4a63] disabled:opacity-60"
                                >
                                    <SaveIcon className="h-3.5 w-3.5" />
                                    {openaiSaving ? 'Saving…' : 'Save API key'}
                                </button>
                                <button
                                    type="button"
                                    disabled={openaiSaving || !openai?.has_database_override}
                                    onClick={() => void clearOpenAiKey()}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                >
                                    Clear database override
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'payments' && (
                        <div className="space-y-3.5">
                            <Toggle
                                checked={!!stripeForm.enabled}
                                onChange={(value) => setStripeForm((prev) => ({ ...prev, enabled: value }))}
                                label="Enable Stripe payments"
                                description="When off, checkout and card setup are unavailable even if keys exist."
                            />
                            <Field label="Active Stripe environment" hint="Checkout uses the keys for the selected environment.">
                                <select
                                    className={inputClass}
                                    value={stripeForm.environment}
                                    onChange={(e) => setStripeForm((prev) => ({
                                        ...prev,
                                        environment: e.target.value === 'live' ? 'live' : 'test',
                                    }))}
                                >
                                    <option value="test">Test</option>
                                    <option value="live">Live</option>
                                </select>
                            </Field>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-xs text-slate-600">
                                <p>
                                    Status:{' '}
                                    <span className="font-semibold text-slate-800">
                                        {stripe?.configured ? 'Configured' : 'Not configured'}
                                    </span>
                                    {' · '}Active publishable:{' '}
                                    <span className="font-mono">{stripe?.active_publishable_masked || '—'}</span>
                                </p>
                                <p className="mt-1">
                                    Test keys: {stripe?.test?.publishable_masked || '—'} / {stripe?.test?.secret_masked || '—'}
                                    {stripe?.test?.source ? ` (${stripe.test.source})` : ''}
                                </p>
                                <p className="mt-1">
                                    Live keys: {stripe?.live?.publishable_masked || '—'} / {stripe?.live?.secret_masked || '—'}
                                    {stripe?.live?.source ? ` (${stripe.live.source})` : ''}
                                </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Test publishable key" hint="Leave blank to keep the current value.">
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={stripeForm.test_publishable_key}
                                        onChange={(e) => setStripeForm((prev) => ({ ...prev, test_publishable_key: e.target.value }))}
                                        placeholder="pk_test_…"
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Test secret key" hint="Leave blank to keep the current value.">
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={stripeForm.test_secret_key}
                                        onChange={(e) => setStripeForm((prev) => ({ ...prev, test_secret_key: e.target.value }))}
                                        placeholder="sk_test_…"
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Live publishable key" hint="Leave blank to keep the current value.">
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={stripeForm.live_publishable_key}
                                        onChange={(e) => setStripeForm((prev) => ({ ...prev, live_publishable_key: e.target.value }))}
                                        placeholder="pk_live_…"
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Live secret key" hint="Leave blank to keep the current value.">
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={stripeForm.live_secret_key}
                                        onChange={(e) => setStripeForm((prev) => ({ ...prev, live_secret_key: e.target.value }))}
                                        placeholder="sk_live_…"
                                        autoComplete="off"
                                    />
                                </Field>
                            </div>
                            <button
                                type="button"
                                disabled={stripeSaving}
                                onClick={() => void saveStripeSettings()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#053447] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0a4a63] disabled:opacity-60"
                            >
                                <SaveIcon className="h-3.5 w-3.5" />
                                {stripeSaving ? 'Saving…' : 'Save Stripe settings'}
                            </button>
                        </div>
                    )}

                    {tab === 'email' && (
                        <div className="space-y-3.5">
                            <Toggle
                                checked={!!mailForm.enabled}
                                onChange={(value) => setMailForm((prev) => ({ ...prev, enabled: value }))}
                                label="Enable outbound email"
                                description="Required for forgot-password and other transactional mail."
                            />
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-xs text-slate-600">
                                <p>
                                    Status:{' '}
                                    <span className="font-semibold text-slate-800">
                                        {mail?.configured ? 'Configured' : 'Not configured'}
                                    </span>
                                    {mail?.username_masked ? ` · User: ${mail.username_masked}` : ''}
                                    {mail?.has_password ? ' · Password set' : ' · Password missing'}
                                </p>
                                <p className="mt-1">
                                    From: {mail?.from_name || '—'} &lt;{mail?.from_address || '—'}&gt;
                                </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Mailer">
                                    <select
                                        className={inputClass}
                                        value={mailForm.mailer}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, mailer: e.target.value }))}
                                    >
                                        <option value="smtp">SMTP</option>
                                        <option value="log">Log (dev)</option>
                                        <option value="array">Array (test)</option>
                                    </select>
                                </Field>
                                <Field label="Encryption">
                                    <select
                                        className={inputClass}
                                        value={mailForm.encryption || 'tls'}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, encryption: e.target.value }))}
                                    >
                                        <option value="tls">TLS</option>
                                        <option value="ssl">SSL</option>
                                        <option value="none">None</option>
                                    </select>
                                </Field>
                                <Field label="SMTP host">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={mailForm.host}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, host: e.target.value }))}
                                        placeholder="smtp.example.com"
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Port">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={mailForm.port}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, port: e.target.value }))}
                                        placeholder="587"
                                    />
                                </Field>
                                <Field label="Username" hint="Leave blank to keep the current value.">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={mailForm.username}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, username: e.target.value }))}
                                        placeholder={mail?.username_masked || 'smtp user'}
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Password" hint="Leave blank to keep the current value.">
                                    <input
                                        type="password"
                                        className={inputClass}
                                        value={mailForm.password}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, password: e.target.value }))}
                                        placeholder={mail?.has_password ? '••••••••' : 'SMTP password'}
                                        autoComplete="new-password"
                                    />
                                </Field>
                                <Field label="From address">
                                    <input
                                        type="email"
                                        className={inputClass}
                                        value={mailForm.from_address}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, from_address: e.target.value }))}
                                        placeholder="noreply@example.com"
                                    />
                                </Field>
                                <Field label="From name">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={mailForm.from_name}
                                        onChange={(e) => setMailForm((prev) => ({ ...prev, from_name: e.target.value }))}
                                        placeholder="NursingAI"
                                    />
                                </Field>
                            </div>
                            <Field
                                label="Frontend URL"
                                hint="Used in password-reset email links (e.g. http://127.0.0.1:8002)."
                            >
                                <input
                                    type="url"
                                    className={inputClass}
                                    value={mailForm.frontend_url}
                                    onChange={(e) => setMailForm((prev) => ({ ...prev, frontend_url: e.target.value }))}
                                    placeholder="http://127.0.0.1:8002"
                                />
                            </Field>
                            <button
                                type="button"
                                disabled={mailSaving}
                                onClick={() => void saveMailSettings()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#053447] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0a4a63] disabled:opacity-60"
                            >
                                <SaveIcon className="h-3.5 w-3.5" />
                                {mailSaving ? 'Saving…' : 'Save SMTP settings'}
                            </button>
                            <div className="rounded-xl border border-dashed border-slate-200 px-3.5 py-3">
                                <p className="mb-2 text-xs font-semibold text-slate-700">Send test email</p>
                                <div className="flex flex-wrap items-end gap-2">
                                    <div className="min-w-[220px] flex-1">
                                        <Field label="Destination" hint="Defaults to your admin email if blank.">
                                            <input
                                                type="email"
                                                className={inputClass}
                                                value={mailForm.test_to}
                                                onChange={(e) => setMailForm((prev) => ({ ...prev, test_to: e.target.value }))}
                                                placeholder="you@example.com"
                                            />
                                        </Field>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={mailTesting}
                                        onClick={() => void sendTestMail()}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        <MailIcon className="h-3.5 w-3.5" />
                                        {mailTesting ? 'Sending…' : 'Send test'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'captcha' && (
                        <div className="space-y-3.5">
                            <Toggle
                                checked={!!turnstileForm.enabled}
                                onChange={(value) => setTurnstileForm((prev) => ({ ...prev, enabled: value }))}
                                label="Enable Cloudflare Turnstile"
                                description="When off, auth forms fall back to the math captcha challenge."
                            />
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-xs text-slate-600">
                                <p>
                                    Status:{' '}
                                    <span className="font-semibold text-slate-800">
                                        {turnstile?.configured ? 'Configured' : 'Not configured'}
                                    </span>
                                    {turnstile?.source ? ` · Source: ${turnstile.source}` : ''}
                                </p>
                                <p className="mt-1 font-mono">Site key: {turnstile?.site_key_masked || '—'}</p>
                                <p className="mt-1 font-mono">Secret: {turnstile?.secret_masked || '—'}</p>
                            </div>
                            <Field label="Turnstile site key" hint="Leave blank to keep the current value.">
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={turnstileForm.site_key}
                                    onChange={(e) => setTurnstileForm((prev) => ({ ...prev, site_key: e.target.value }))}
                                    placeholder="0x4AAAAA…"
                                    autoComplete="off"
                                />
                            </Field>
                            <Field label="Turnstile secret key" hint="Leave blank to keep the current value.">
                                <input
                                    type="password"
                                    className={inputClass}
                                    value={turnstileForm.secret_key}
                                    onChange={(e) => setTurnstileForm((prev) => ({ ...prev, secret_key: e.target.value }))}
                                    placeholder="0x4AAAAA…"
                                    autoComplete="off"
                                />
                            </Field>
                            <button
                                type="button"
                                disabled={turnstileSaving}
                                onClick={() => void saveTurnstileSettings()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#053447] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0a4a63] disabled:opacity-60"
                            >
                                <SaveIcon className="h-3.5 w-3.5" />
                                {turnstileSaving ? 'Saving…' : 'Save Turnstile settings'}
                            </button>
                        </div>
                    )}

                    {tab === 'status' && (
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 px-3.5 py-2">
                                <p className="admin-kicker mb-1">Project API</p>
                                <StatusRow
                                    label="Configured"
                                    value={status.projectApi?.configured ? 'Yes' : 'No'}
                                    ok={!!status.projectApi?.configured}
                                />
                                <StatusRow label="Host" value={status.projectApi?.host} />
                            </div>
                            <div className="rounded-xl border border-slate-200 px-3.5 py-2">
                                <p className="admin-kicker mb-1">Runtime</p>
                                <StatusRow label="Environment" value={status.runtime?.app_env} />
                                <StatusRow
                                    label="Debug"
                                    value={status.runtime?.app_debug ? 'On' : 'Off'}
                                    ok={!status.runtime?.app_debug}
                                />
                                <StatusRow label="Queue" value={status.runtime?.queue_connection} />
                            </div>
                            <div className="rounded-xl border border-slate-200 px-3.5 py-2">
                                <p className="admin-kicker mb-1">Database</p>
                                <StatusRow label="Connection" value={status.database?.default_connection} />
                                <StatusRow label="Driver" value={status.database?.default_driver} />
                                <StatusRow label="Database" value={status.database?.default_database} />
                            </div>
                            <div className="rounded-xl border border-slate-200 px-3.5 py-2">
                                <p className="admin-kicker mb-1">Storage / auth</p>
                                <StatusRow label="Default disk" value={status.storage?.default_disk} />
                                <StatusRow
                                    label="Public link"
                                    value={status.storage?.public_storage_link_exists ? 'Present' : 'Missing'}
                                    ok={!!status.storage?.public_storage_link_exists}
                                />
                                <StatusRow label="Your role" value={status.authMode?.current_admin_role} />
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
