'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { fetchLaravel } from '@/lib/laravel-api'

const initialForm = {
    business_client_id: '',
    workspace_id: '',
    name: '',
}

export default function CreateWorkspacePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialBusinessId = searchParams.get('business_client_id') || ''
    const selectedBusinessId = initialBusinessId

    const [formData, setFormData] = useState({
        ...initialForm,
        business_client_id: initialBusinessId,
    })
    const [businesses, setBusinesses] = useState([])
    const [loadingBusinesses, setLoadingBusinesses] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [isAdmin, setIsAdmin] = useState(null)

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const role = session?.role || user?.role || ''

            if (role !== 'admin' && role !== 'super_admin') {
                router.replace('/assistant')
                return
            }

            setIsAdmin(true)
        } catch (error) {
            router.replace('/assistant')
        }
    }, [router])

    useEffect(() => {
        let cancelled = false

        const loadBusinesses = async () => {
            setLoadingBusinesses(true)
            try {
                const response = await fetchLaravel('/api/admin/businesses')
                const data = await response.json().catch(() => null)

                if (!response.ok) {
                    throw new Error((data && (data.detail || data.message)) || 'Failed to load businesses')
                }

                if (!cancelled) {
                    setBusinesses(Array.isArray(data) ? data : [])
                    if (!selectedBusinessId && Array.isArray(data) && data.length === 1) {
                        const singleBusinessId = data[0]?.business_client_id || ''
                        if (singleBusinessId) {
                            setFormData((previous) => ({
                                ...previous,
                                business_client_id: singleBusinessId,
                            }))
                        }
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    setBusinesses([])
                }
            } finally {
                if (!cancelled) {
                    setLoadingBusinesses(false)
                }
            }
        }

        loadBusinesses()

        return () => {
            cancelled = true
        }
    }, [selectedBusinessId])

    const businessSuggestions = useMemo(() => businesses.map((business) => ({
        business_client_id: business.business_client_id || '',
        name: business.name || business.business_client_id || '',
    })).filter((business) => business.business_client_id), [businesses])

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
        setError(null)
        setSuccess(null)

        try {
            const response = await fetchLaravel(`/api/admin/businesses/${encodeURIComponent(formData.business_client_id.trim())}/workspaces`, {
                method: 'POST',
                body: JSON.stringify({
                    workspace_id: formData.workspace_id.trim(),
                    name: formData.name.trim(),
                }),
            })

            const data = await response.json().catch(() => null)

            if (response.ok) {
                setSuccess(data?.name
                    ? `${data.name} was created successfully and linked to ${formData.business_client_id.trim()}.`
                    : 'Workspace created successfully and synced to Laravel/FastAPI.'
                )
                setFormData((previous) => ({
                    ...initialForm,
                    business_client_id: previous.business_client_id,
                }))
                return
            }

            const upstreamDetail = data && (data.errors?.detail || data.errors?.message || data.detail || data.message || data.error)
            setError(upstreamDetail || 'Workspace creation failed')
        } catch (error) {
            setError(error.message || 'Workspace creation failed')
        } finally {
            setLoading(false)
        }
    }

    if (isAdmin === null) {
        return null
    }

    return (
        <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
            <div className="wrapper w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[4vw] items-center">
                    <div className="w-full order-2 lg:order-1">
                        <div className="rounded-2xl lg:rounded-[1.5vw] shadow-2xl border border-white/60 bg-white/95 backdrop-blur p-6 lg:p-[2vw]">
                            <div className="mb-6 lg:mb-[2vw]">
                                <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-[11px] lg:text-[0.7vw] font-semibold text-teal-700">
                                    Workspace setup
                                </span>
                                <h3 className="mt-3 mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Create Workspace</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                                    Choose a business, name the workspace, and keep the tenant flow moving.
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
                                        list="business-client-options"
                                        value={formData.business_client_id}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                        placeholder="acme"
                                    />
                                    <datalist id="business-client-options">
                                        {businessSuggestions.map((business) => (
                                            <option key={business.business_client_id} value={business.business_client_id}>
                                                {business.name}
                                            </option>
                                        ))}
                                    </datalist>
                                    <p className="mt-2 text-[11px] lg:text-[0.7vw] text-gray-500">
                                        {loadingBusinesses ? 'Loading business suggestions...' : 'Choose from the available businesses or paste a client ID.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-[1vw]">
                                    <div>
                                        <label htmlFor="workspace_id" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                            Workspace ID
                                        </label>
                                        <input
                                            type="text"
                                            id="workspace_id"
                                            name="workspace_id"
                                            value={formData.workspace_id}
                                            onChange={handleChange}
                                            required
                                            className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                            placeholder="main"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="name" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                            Workspace Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                            placeholder="Main Workspace"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-[12px] lg:text-[0.75vw]">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-[12px] lg:text-[0.75vw]">
                                        {success}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full block py-3 lg:py-[0.9vw] text-center font-bold shadow-lg shadow-teal-200/60 transition-transform hover:-translate-y-0.5"
                                    >
                                        {loading ? 'Creating workspace...' : 'Create Workspace'}
                                    </button>

                                    <Link
                                        href="/assistant"
                                        className="inline-flex w-full items-center justify-center rounded-[6px] lg:rounded-[0.6vw] border border-slate-200 bg-white px-4 py-3 lg:py-[0.9vw] text-center font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Back to assistant
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(75,185,174,0.3),_transparent_40%),linear-gradient(180deg,rgba(5,52,71,0.94),rgba(9,17,28,0.97))] p-6 lg:p-[2vw] text-white shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
                            <div className="relative z-10 space-y-6">
                                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] lg:text-[0.7vw] font-medium text-white/85 backdrop-blur-sm">
                                    Tenant setup
                                </div>
                                <div>
                                    <h2 className="text-[26px]! lg:text-[3vw]! leading-[1.05]! font-bold text-white">
                                        Shape the workspace next.
                                    </h2>
                                    <p className="mt-4 text-white/75 text-[13px] lg:text-[0.95vw] max-w-md">
                                        Give the new area a business context, a workspace ID, and a clear name.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-[1vw]">
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">1</p>
                                        <p className="mt-2 text-[14px] lg:text-[1vw] font-semibold">Business ID</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">2</p>
                                        <p className="mt-2 text-[14px] lg:text-[1vw] font-semibold">Workspace ID</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">3</p>
                                        <p className="mt-2 text-[14px] lg:text-[1vw] font-semibold">Clear name</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}