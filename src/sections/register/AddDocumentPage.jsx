'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { fetchLaravel } from '@/lib/laravel-api'

const initialForm = {
    business_client_id: '',
    workspace_id: '',
    file: null,
    chunk_words: '',
    overlap_words: '',
}

const readStoredJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
    } catch (error) {
        return null
    }
}

const normalizeRole = (value) => String(value || '').trim().toLowerCase()

const fetchCurrentUser = async (token) => {
    const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
    const url = BASE ? `${BASE.replace(/\/$/, '')}/api/auth/me` : '/api/auth/me'

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        return null
    }
}

export default function AddDocumentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialBusinessId = searchParams.get('business_client_id') || ''
    const initialWorkspaceId = searchParams.get('workspace_id') || ''

    const [formData, setFormData] = useState({
        ...initialForm,
        business_client_id: initialBusinessId,
        workspace_id: initialWorkspaceId,
    })
    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])
    const [loadingBusinesses, setLoadingBusinesses] = useState(false)
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [createdDocument, setCreatedDocument] = useState(null)
    const [isAdmin, setIsAdmin] = useState(null)

    useEffect(() => {
        try {
            const session = readStoredJson('session')
            const user = readStoredJson('user')

            const syncAccess = async () => {
                const token = session?.access_token || localStorage.getItem('token') || ''
                let resolvedUser = user || {}

                if ((!resolvedUser.email || !resolvedUser.role) && token) {
                    const apiUser = await fetchCurrentUser(token)
                    if (apiUser && typeof apiUser === 'object') {
                        resolvedUser = { ...resolvedUser, ...apiUser }
                    }
                }

                const role = normalizeRole(
                    resolvedUser.role ||
                    session?.role ||
                    user?.role ||
                    ''
                )

                if (!['admin', 'super_admin'].includes(role)) {
                    router.replace('/assistant')
                    return
                }

                if (!initialBusinessId || !initialWorkspaceId) {
                    const defaults = readStoredJson('api_chat_defaults') || {}
                    setFormData((previous) => ({
                        ...previous,
                        business_client_id: previous.business_client_id || defaults.business_client_id || session?.business_client_id || resolvedUser?.business_client_id || user?.business_client_id || 'acme',
                        workspace_id: previous.workspace_id || defaults.workspace_id || session?.workspace_id || resolvedUser?.workspace_id || user?.workspace_id || 'main',
                    }))
                }

                setIsAdmin(true)
            }

            void syncAccess()
        } catch (error) {
            router.replace('/assistant')
        }
    }, [initialBusinessId, initialWorkspaceId, router])

    useEffect(() => {
        if (isAdmin !== true) {
            return
        }

        let cancelled = false

        const loadBusinesses = async () => {
            setLoadingBusinesses(true)

            try {
                const response = await fetchLaravel('/api/admin/businesses')
                const data = await response.json().catch(() => null)

                if (!response.ok) {
                    throw new Error((data && (data.detail || data.message)) || 'Failed to load businesses')
                }

                if (cancelled) return

                const nextBusinesses = Array.isArray(data) ? data : []
                setBusinesses(nextBusinesses)

                setFormData((previous) => {
                    const currentBusiness = previous.business_client_id.trim()
                    if (currentBusiness && nextBusinesses.some((business) => business.business_client_id === currentBusiness)) {
                        return previous
                    }

                    const nextBusinessId = nextBusinesses[0]?.business_client_id || previous.business_client_id
                    return {
                        ...previous,
                        business_client_id: nextBusinessId || '',
                        workspace_id: '',
                    }
                })
            } catch (error) {
                if (!cancelled) {
                    setBusinesses([])
                    setError(error.message || 'Failed to load businesses')
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
    }, [isAdmin])

    useEffect(() => {
        if (!formData.business_client_id) {
            setWorkspaces([])
            setFormData((previous) => ({
                ...previous,
                workspace_id: '',
            }))
            return
        }

        let cancelled = false

        const loadWorkspaces = async () => {
            setLoadingWorkspaces(true)

            try {
                const response = await fetchLaravel(`/api/admin/businesses/${encodeURIComponent(formData.business_client_id.trim())}/workspaces`)
                const data = await response.json().catch(() => null)

                if (!response.ok) {
                    throw new Error((data && (data.detail || data.message)) || 'Failed to load workspaces')
                }

                if (cancelled) return

                const nextWorkspaces = Array.isArray(data) ? data : []
                setWorkspaces(nextWorkspaces)

                setFormData((previous) => {
                    const currentWorkspace = previous.workspace_id.trim()
                    if (currentWorkspace && nextWorkspaces.some((workspace) => workspace.workspace_id === currentWorkspace)) {
                        return previous
                    }

                    return {
                        ...previous,
                        workspace_id: nextWorkspaces[0]?.workspace_id || '',
                    }
                })
            } catch (error) {
                if (!cancelled) {
                    setWorkspaces([])
                    setError(error.message || 'Failed to load workspaces')
                }
            } finally {
                if (!cancelled) {
                    setLoadingWorkspaces(false)
                }
            }
        }

        loadWorkspaces()

        return () => {
            cancelled = true
        }
    }, [formData.business_client_id])

    const canSubmit = useMemo(() => {
        return Boolean(
            formData.business_client_id.trim() &&
            formData.workspace_id.trim() &&
            formData.file
        )
    }, [formData.business_client_id, formData.workspace_id, formData.file])

    const handleChange = (event) => {
        const { name, value, type, files } = event.target

        setError(null)
        setSuccess(null)

        setFormData((previous) => {
            if (name === 'business_client_id') {
                return {
                    ...previous,
                    business_client_id: value,
                    workspace_id: '',
                }
            }

            return {
                ...previous,
                [name]: type === 'file' ? (files && files[0] ? files[0] : null) : value,
            }
        })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!canSubmit) {
            setError('Business, workspace, and file are required.')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)
        setCreatedDocument(null)

        try {
            const formDataPayload = new FormData()
            formDataPayload.append('file', formData.file)

            const chunkWords = Number.parseInt(formData.chunk_words, 10)
            const overlapWords = Number.parseInt(formData.overlap_words, 10)

            if (Number.isFinite(chunkWords) && chunkWords > 0) {
                formDataPayload.append('chunk_words', String(chunkWords))
            }

            if (Number.isFinite(overlapWords) && overlapWords >= 0) {
                formDataPayload.append('overlap_words', String(overlapWords))
            }

            const response = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(formData.business_client_id.trim())}/workspaces/${encodeURIComponent(formData.workspace_id.trim())}/documents/upload`,
                {
                    method: 'POST',
                    body: formDataPayload,
                }
            )

            const data = await response.json().catch(() => null)

            if (response.ok) {
                setCreatedDocument(data)
                setSuccess(data?.document_id
                    ? `Document uploaded successfully and queued for RAG ingestion. Status: ${data.status || 'processing'}.`
                    : 'Document uploaded successfully and queued for RAG ingestion.'
                )
                setFormData((previous) => ({
                    ...initialForm,
                    business_client_id: previous.business_client_id,
                    workspace_id: previous.workspace_id,
                }))
                return
            }

            const upstreamDetail = data && (data.errors?.detail || data.errors?.message || data.detail || data.message || data.error)
            setError(upstreamDetail || 'Document upload failed')
        } catch (error) {
            setError(error.message || 'Document upload failed')
        } finally {
            setLoading(false)
        }
    }

    if (isAdmin === null) {
        return null
    }

    const selectedBusiness = businesses.find((business) => business.business_client_id === formData.business_client_id) || null
    const workspaceSuggestions = workspaces
        .map((workspace) => ({
            workspace_id: workspace.workspace_id || '',
            name: workspace.name || workspace.workspace_id || '',
        }))
        .filter((workspace) => workspace.workspace_id)

    return (
        <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
            <div className="wrapper w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[4vw] items-center">
                    <div className="w-full order-2 lg:order-1">
                        <div className="rounded-2xl lg:rounded-[1.5vw] shadow-2xl border border-white/60 bg-white/95 backdrop-blur p-6 lg:p-[2vw]">
                            <div className="mb-6 lg:mb-[2vw]">
                                <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] lg:text-[0.7vw] font-semibold text-sky-700">
                                    RAG ingestion
                                </span>
                                <h3 className="mt-3 mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Add Document</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                                    Upload a PDF or TXT file and send it into the FastAPI RAG pipeline.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-[1vw]">
                                    <div>
                                        <label htmlFor="business_client_id" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                            Business
                                        </label>
                                        <select
                                            id="business_client_id"
                                            name="business_client_id"
                                            value={formData.business_client_id}
                                            onChange={handleChange}
                                            required
                                            disabled={loadingBusinesses || businesses.length === 0}
                                            className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white disabled:cursor-not-allowed disabled:bg-slate-50"
                                        >
                                            <option value="">{loadingBusinesses ? 'Loading businesses...' : 'Select a business'}</option>
                                            {businesses.map((business) => (
                                                <option key={business.business_client_id} value={business.business_client_id}>
                                                    {business.name ? `${business.name} (${business.business_client_id})` : business.business_client_id}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-2 text-[11px] lg:text-[0.7vw] text-gray-500">
                                            {selectedBusiness
                                                ? `Showing workspaces for ${selectedBusiness.name || selectedBusiness.business_client_id}.`
                                                : 'Only businesses you manage will appear here.'}
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="workspace_id" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                            Workspace
                                        </label>
                                        <select
                                            id="workspace_id"
                                            name="workspace_id"
                                            value={formData.workspace_id}
                                            onChange={handleChange}
                                            required
                                            disabled={!formData.business_client_id || loadingWorkspaces || workspaces.length === 0}
                                            className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white disabled:cursor-not-allowed disabled:bg-slate-50"
                                        >
                                            <option value="">{loadingWorkspaces ? 'Loading workspaces...' : 'Select a workspace'}</option>
                                            {workspaceSuggestions.map((workspace) => (
                                                <option key={workspace.workspace_id} value={workspace.workspace_id}>
                                                    {workspace.name ? `${workspace.name} (${workspace.workspace_id})` : workspace.workspace_id}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-2 text-[11px] lg:text-[0.7vw] text-gray-500">
                                            {formData.business_client_id
                                                ? 'Workspace options update automatically when the business changes.'
                                                : 'Pick a business first to load its workspaces.'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="file" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Document File
                                    </label>
                                    <input
                                        type="file"
                                        id="file"
                                        name="file"
                                        onChange={handleChange}
                                        accept=".pdf,.txt"
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] bg-white focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    <p className="mt-2 text-[11px] lg:text-[0.7vw] text-gray-500">
                                        Supported formats: PDF or TXT. Maximum size: 50MB.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-[1vw]">
                                    <div>
                                        <label htmlFor="chunk_words" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                            Chunk Words
                                        </label>
                                        <input
                                            type="number"
                                            id="chunk_words"
                                            name="chunk_words"
                                            min="1"
                                            value={formData.chunk_words}
                                            onChange={handleChange}
                                            className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                            placeholder="Optional"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="overlap_words" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                            Overlap Words
                                        </label>
                                        <input
                                            type="number"
                                            id="overlap_words"
                                            name="overlap_words"
                                            min="0"
                                            value={formData.overlap_words}
                                            onChange={handleChange}
                                            className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-300 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-white"
                                            placeholder="Optional"
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
                                        disabled={loading || !canSubmit}
                                        className="btn-primary w-full block py-3 lg:py-[0.9vw] text-center font-bold shadow-lg shadow-sky-200/60 transition-transform hover:-translate-y-0.5"
                                    >
                                        {loading ? 'Uploading document...' : 'Add to RAG'}
                                    </button>

                                    <Link
                                        href="/assistant"
                                        className="inline-flex w-full items-center justify-center rounded-[6px] lg:rounded-[0.6vw] border border-slate-200 bg-white px-4 py-3 lg:py-[0.9vw] text-center font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Back to assistant
                                    </Link>
                                </div>

                                {createdDocument && (
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 lg:p-[1vw]">
                                        <p className="text-[12px] lg:text-[0.75vw] font-semibold uppercase tracking-wide text-sky-700">
                                            Uploaded
                                        </p>
                                        <p className="mt-2 text-[13px] lg:text-[0.85vw] text-slate-700">
                                            Document ID: {createdDocument.document_id || 'Pending'}
                                        </p>
                                        <p className="mt-1 text-[12px] lg:text-[0.75vw] text-slate-600">
                                            Business: {createdDocument.business_client_id || formData.business_client_id} · Workspace: {createdDocument.workspace_id || formData.workspace_id}
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none rounded-[28px] bg-[radial-gradient(circle_at_top_right,_rgba(46,170,219,0.3),_transparent_38%),linear-gradient(180deg,rgba(5,52,71,0.94),rgba(9,17,28,0.97))] p-6 lg:p-[2vw] text-white shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
                            <div className="relative z-10 space-y-6">
                                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] lg:text-[0.7vw] font-medium text-white/85 backdrop-blur-sm">
                                    Knowledge base
                                </div>
                                <div>
                                    <h2 className="text-[26px]! lg:text-[3vw]! leading-[1.05]! font-bold text-white">
                                        Feed the assistant better context.
                                    </h2>
                                    <p className="mt-4 text-white/75 text-[13px] lg:text-[0.95vw] max-w-md">
                                        Add source documents here so the next chat answers can be grounded in uploaded material.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-[1vw]">
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">File types</p>
                                        <p className="mt-2 text-[14px] lg:text-[1vw] font-semibold">PDF or TXT</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">Limit</p>
                                        <p className="mt-2 text-[14px] lg:text-[1vw] font-semibold">50 MB max</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                                        <p className="text-[11px] lg:text-[0.7vw] uppercase tracking-[0.2em] text-white/60">Result</p>
                                        <p className="mt-2 text-[14px] lg:text-[1vw] font-semibold">RAG-ready chunks</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}