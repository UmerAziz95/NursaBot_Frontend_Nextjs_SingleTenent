'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const initialForm = {
    business_client_id: '',
    name: '',
}

export default function CreateBusinessPage({ embedded = false }) {
    const router = useRouter()
    const [formData, setFormData] = useState(initialForm)
    const [loading, setLoading] = useState(false)
    const [createdBusiness, setCreatedBusiness] = useState(null)
    const [isAdmin, setIsAdmin] = useState(embedded ? true : null)

    useEffect(() => {
        if (embedded) {
            setIsAdmin(true)
            return
        }
        try {
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const role = session?.role || user?.role || ''

            if (role !== 'admin' && role !== 'super_admin') {
                router.replace('/admin/dashboard')
                return
            }

            setIsAdmin(true)
        } catch (error) {
            router.replace('/admin/signin')
        }
    }, [embedded, router])

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        setLoading(true)
        setCreatedBusiness(null)

        try {
            const response = await fetchLaravel('/api/admin/businesses', {
                method: 'POST',
                body: JSON.stringify({
                    business_client_id: formData.business_client_id.trim(),
                    name: formData.name.trim(),
                }),
            })

            const data = await response.json().catch(() => null)

            if (response.ok) {
                setCreatedBusiness(data)
                toast.success(data?.name
                    ? `${data.name} was created successfully.`
                    : 'Business created successfully.'
                )
                setFormData(initialForm)
                return
            }

            const upstreamDetail = data && (data.errors?.detail || data.errors?.message || data.detail || data.message || data.error)
            toast.error(upstreamDetail || 'Business creation failed')
        } catch (error) {
            toast.error(error.message || 'Business creation failed')
        } finally {
            setLoading(false)
        }
    }

    if (isAdmin === null) {
        return null
    }

    const createWorkspaceHref = createdBusiness?.business_client_id
        ? `/create-workspace?business_client_id=${encodeURIComponent(createdBusiness.business_client_id)}`
        : '/create-workspace'

    if (embedded) {
        return (
            <div className="mx-auto max-w-6xl space-y-3 p-4 lg:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="admin-page-desc">
                        Add the business details and continue into workspace setup.
                    </p>
                    <Link href="/manage-businesses" className="admin-btn-secondary">
                        Manage businesses
                    </Link>
                </div>
                <form onSubmit={handleSubmit} className="admin-panel mx-auto max-w-xl space-y-3">
                    <div>
                        <label htmlFor="business_client_id" className="admin-label">Business Client ID</label>
                        <input
                            type="text"
                            id="business_client_id"
                            name="business_client_id"
                            value={formData.business_client_id}
                            onChange={handleChange}
                            required
                            className="admin-input"
                            placeholder="acme"
                        />
                    </div>
                    <div>
                        <label htmlFor="name" className="admin-label">Business Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="admin-input"
                            placeholder="Acme Health"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="admin-btn-primary">
                        {loading ? 'Creating…' : 'Create business'}
                    </button>
                    {createdBusiness && (
                        <div className="rounded-lg border border-sky-100 bg-sky-50/80 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Next step</p>
                            <p className="mt-1 text-xs text-slate-700">Add the first workspace for this business.</p>
                            <Link href={createWorkspaceHref} className="admin-btn-primary mt-2">
                                Create workspace
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        )
    }

    return (
        <div className={embedded ? 'p-4 lg:p-6' : 'login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4'}>
            <div className="wrapper w-full">
                <div className={`grid grid-cols-1 gap-8 items-center ${embedded ? 'max-w-2xl' : 'lg:grid-cols-2 lg:gap-[4vw]'}`}>
                    <div className={`w-full ${embedded ? '' : 'order-2 lg:order-1'}`}>
                        <div className="rounded-2xl lg:rounded-[1.5vw] shadow-2xl border border-white/60 bg-white/95 backdrop-blur p-6 lg:p-[2vw]">
                            <div className="mb-6 lg:mb-[2vw]">
                                <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] lg:text-[0.7vw] font-semibold text-sky-700">
                                    Tenant setup
                                </span>
                                <h3 className="mt-3 mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Create Business</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                                    Add the business details here and continue into the workspace setup flow.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                                <div>
                                    <label htmlFor="business_client_id" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Business Client ID
                                    </label>
                                    <input
                                        type="text"
                                        id="business_client_id"
                                        name="business_client_id"
                                        value={formData.business_client_id}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                        placeholder="acme"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="name" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                        placeholder="Acme Health"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full block py-3 lg:py-[0.9vw] text-center font-bold shadow-lg shadow-sky-200/60 transition-transform hover:-translate-y-0.5"
                                    >
                                        {loading ? 'Creating business...' : 'Create Business'}
                                    </button>

                                    <Link
                                        href="/admin/dashboard"
                                        className="inline-flex w-full items-center justify-center rounded-[6px] lg:rounded-[0.6vw] border border-slate-200 bg-white px-4 py-3 lg:py-[0.9vw] text-center font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Back to dashboard
                                    </Link>
                                </div>

                                {createdBusiness && (
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 lg:p-[1vw]">
                                        <p className="text-[12px] lg:text-[0.75vw] font-semibold uppercase tracking-wide text-sky-700">
                                            Next step
                                        </p>
                                        <p className="mt-2 text-[13px] lg:text-[0.85vw] text-slate-700">
                                            Use the workspace page to add the first workspace for this business.
                                        </p>
                                        <Link href={createWorkspaceHref} className="mt-3 inline-flex items-center rounded-full bg-sky-700 px-4 py-2 text-[12px] lg:text-[0.75vw] font-semibold text-white transition hover:bg-sky-800">
                                            Create workspace for this business
                                        </Link>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {!embedded && (
                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none rounded-[28px] bg-[radial-gradient(circle_at_top_right,_rgba(46,170,219,0.28),_transparent_38%),linear-gradient(180deg,rgba(5,52,71,0.92),rgba(8,18,28,0.96))] p-6 lg:p-[2vw] text-white shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
                            <div className="relative z-10 space-y-6">
                                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] lg:text-[0.7vw] font-medium text-white/85 backdrop-blur-sm">
                                    Admin onboarding
                                </div>
                                <div>
                                    <h2 className="text-[26px]! lg:text-[3vw]! leading-[1.05]! font-bold text-white">
                                        Start with the foundation.
                                    </h2>
                                    <p className="mt-4 text-white/75 text-[13px] lg:text-[0.95vw] max-w-md">
                                        Keep the flow simple: capture the business name, define its client ID, and move on to the next step.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-[1vw]">
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">Required</p>
                                        <p className="mt-2 text-[14px] lg:text-[1.1vw] font-semibold">Client ID + name</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">Outcome</p>
                                        <p className="mt-2 text-[14px] lg:text-[1.1vw] font-semibold">Ready for the next step</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}