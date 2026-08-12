'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus as PlusIcon, Sparkles as SparklesIcon } from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const emptyForm = {
    slug: '',
    name: '',
    description: '',
    monthly_token_limit: 1000000,
    openai_usd_per_million: 1,
    markup_multiplier: 3,
    features_text: '',
    is_highlighted: false,
    sort_order: 0,
}

const formatTokens = (value) => {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}

export default function ManagePlansPage({ embedded = false }) {
    const [plans, setPlans] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const loadPlans = async () => {
        setLoading(true)
        try {
            const res = await fetchLaravel('/api/admin/plans')
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Failed to load plans')
            setPlans(Array.isArray(data?.plans) ? data.plans : [])
        } catch (err) {
            toast.error(err.message || 'Failed to load plans')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadPlans()
    }, [])

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            try {
                const res = await fetchLaravel('/api/admin/plans/preview-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        monthly_token_limit: Number(form.monthly_token_limit) || 0,
                        openai_usd_per_million: Number(form.openai_usd_per_million) || 1,
                        markup_multiplier: Number(form.markup_multiplier) || 3,
                    }),
                })
                const data = await res.json().catch(() => null)
                if (!cancelled && res.ok) setPreview(data)
            } catch (_) {
                if (!cancelled) setPreview(null)
            }
        }
        void run()
        return () => { cancelled = true }
    }, [form.monthly_token_limit, form.openai_usd_per_million, form.markup_multiplier])

    const onChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const seedDefaults = async () => {
        setSaving(true)
        const defaults = [
            {
                slug: 'basic',
                name: 'Basic',
                description: 'Starter monthly plan for individual nursing study.',
                monthly_token_limit: 1000000,
                features: ['1,000,000 tokens / month', 'RAG chat access', 'Document-grounded answers', 'Email support'],
                is_highlighted: false,
                sort_order: 1,
            },
            {
                slug: 'pro',
                name: 'Pro',
                description: 'Most popular plan for active clinical learners.',
                monthly_token_limit: 5000000,
                features: ['5,000,000 tokens / month', 'RAG chat access', 'Voice & image questions', 'Priority support'],
                is_highlighted: true,
                sort_order: 2,
            },
            {
                slug: 'premium',
                name: 'Premium',
                description: 'High-volume plan for heavy study and team prep.',
                monthly_token_limit: 20000000,
                features: ['20,000,000 tokens / month', 'RAG chat access', 'Voice & image questions', 'Priority support', 'Highest monthly allowance'],
                is_highlighted: false,
                sort_order: 3,
            },
        ]

        try {
            for (const plan of defaults) {
                const exists = plans.some((p) => p.slug === plan.slug)
                if (exists) continue
                const res = await fetchLaravel('/api/admin/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        ...plan,
                        openai_usd_per_million: 1,
                        markup_multiplier: 3,
                        is_active: true,
                    }),
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || data?.message || `Failed creating ${plan.slug}`)
            }
            toast.success('Default Basic / Pro / Premium plans created (price = 3× OpenAI token cost).')
            await loadPlans()
        } catch (err) {
            toast.error(err.message || 'Failed to seed plans')
        } finally {
            setSaving(false)
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const features = String(form.features_text || '')
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)

            const res = await fetchLaravel('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    slug: form.slug,
                    name: form.name,
                    description: form.description,
                    monthly_token_limit: Number(form.monthly_token_limit),
                    openai_usd_per_million: Number(form.openai_usd_per_million),
                    markup_multiplier: Number(form.markup_multiplier),
                    features,
                    is_highlighted: Boolean(form.is_highlighted),
                    is_active: true,
                    sort_order: Number(form.sort_order) || 0,
                }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Failed to create plan')
            toast.success(`Created ${data.plan?.name} at ${data.plan?.price_display}/month`)
            setForm(emptyForm)
            await loadPlans()
        } catch (err) {
            toast.error(err.message || 'Failed to create plan')
        } finally {
            setSaving(false)
        }
    }

    const deactivate = async (planId) => {
        if (!window.confirm('Deactivate this plan? It will hide from site users.')) return
        try {
            const res = await fetchLaravel(`/api/admin/plans/${planId}`, { method: 'DELETE' })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || data?.message || 'Failed to deactivate')
            await loadPlans()
        } catch (err) {
            toast.error(err.message || 'Failed to deactivate plan')
        }
    }

    return (
        <div className={embedded ? 'mx-auto max-w-6xl space-y-3 p-4 lg:p-5' : 'min-h-screen bg-[#F4F7FA] px-4 py-8'}>
            <div className={embedded ? 'space-y-3' : 'mx-auto w-full max-w-6xl space-y-3'}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="admin-page-desc max-w-2xl">
                        Monthly packages with token limits. Price = (tokens ÷ 1M) × OpenAI $/M × markup.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={seedDefaults} disabled={saving} className="admin-btn-secondary">
                            <SparklesIcon className="h-3.5 w-3.5" />
                            Seed Basic / Pro / Premium
                        </button>
                        {!embedded && (
                            <Link href="/admin/chat" className="admin-btn-secondary">
                                Open chat
                            </Link>
                        )}
                    </div>
                </div>

                <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Plan</th>
                                    <th>Tokens / mo</th>
                                    <th>Price</th>
                                    <th>Markup</th>
                                    <th>Status</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="cell-empty">Loading…</td>
                                    </tr>
                                ) : plans.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="cell-empty">
                                            No plans yet. Seed the defaults or create a custom plan below.
                                        </td>
                                    </tr>
                                ) : (
                                    plans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td>
                                                <p className="font-medium text-slate-800">{plan.name}</p>
                                                <p className="cell-muted">{plan.slug}</p>
                                            </td>
                                            <td className="tabular-nums">{formatTokens(plan.monthly_token_limit)}</td>
                                            <td>{plan.price_display}/mo</td>
                                            <td>{plan.markup_multiplier}×</td>
                                            <td>
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                    plan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {plan.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="col-actions">
                                                {plan.is_active ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => deactivate(plan.id)}
                                                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <span className="cell-muted">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                </div>

                <form onSubmit={onSubmit} className="admin-panel space-y-3">
                    <h2 className="admin-section-title">Create plan</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="admin-label">
                            Slug
                            <input name="slug" value={form.slug} onChange={onChange} required placeholder="basic" className="admin-input mt-1" />
                        </label>
                        <label className="admin-label">
                            Name
                            <input name="name" value={form.name} onChange={onChange} required placeholder="Basic" className="admin-input mt-1" />
                        </label>
                        <label className="admin-label md:col-span-2">
                            Description
                            <input name="description" value={form.description} onChange={onChange} className="admin-input mt-1" />
                        </label>
                        <label className="admin-label">
                            Monthly token limit
                            <input type="number" name="monthly_token_limit" value={form.monthly_token_limit} onChange={onChange} min={1000} required className="admin-input mt-1" />
                        </label>
                        <label className="admin-label">
                            OpenAI USD / million tokens
                            <input type="number" step="0.01" name="openai_usd_per_million" value={form.openai_usd_per_million} onChange={onChange} className="admin-input mt-1" />
                        </label>
                        <label className="admin-label">
                            Markup multiplier
                            <input type="number" step="0.1" name="markup_multiplier" value={form.markup_multiplier} onChange={onChange} className="admin-input mt-1" />
                        </label>
                        <label className="admin-label">
                            Sort order
                            <input type="number" name="sort_order" value={form.sort_order} onChange={onChange} className="admin-input mt-1" />
                        </label>
                        <label className="admin-label md:col-span-2">
                            Features (one per line)
                            <textarea name="features_text" value={form.features_text} onChange={onChange} rows={4} className="admin-textarea mt-1" />
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" name="is_highlighted" checked={form.is_highlighted} onChange={onChange} className="rounded border-slate-300" />
                            Highlight as most popular
                        </label>
                    </div>

                    {preview && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            Calculated monthly price: <strong>{preview.price_display}</strong>
                            <p className="mt-0.5 text-xs text-slate-500">{preview.formula}</p>
                        </div>
                    )}

                    <button type="submit" disabled={saving} className="admin-btn-primary">
                        <PlusIcon className="h-3.5 w-3.5" />
                        {saving ? 'Saving…' : 'Create plan'}
                    </button>
                </form>
            </div>
        </div>
    )
}
