'use client'

import { useEffect, useState } from 'react'
import { Building2 as BuildingIcon, FolderOpen as FolderOpenIcon } from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'

const readStoredJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

/**
 * Business / workspace pickers for admin RAG chat testing,
 * plus site-user default assignment.
 */
export default function AdminChatContextBar() {
    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])
    const [selectedBusinessId, setSelectedBusinessId] = useState('')
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
    const [siteUserBusinessId, setSiteUserBusinessId] = useState('')
    const [siteUserWorkspaceId, setSiteUserWorkspaceId] = useState('')
    const [siteUserWorkspaces, setSiteUserWorkspaces] = useState([])
    const [siteUserDefaultsStatus, setSiteUserDefaultsStatus] = useState('')
    const [siteUserDefaultsSaving, setSiteUserDefaultsSaving] = useState(false)

    useEffect(() => {
        let cancelled = false

        const loadBusinesses = async () => {
            try {
                const response = await fetchLaravel('/api/admin/businesses')
                const data = await response.json().catch(() => null)
                if (!response.ok) throw new Error('Failed to load businesses')
                if (cancelled) return

                const nextBusinesses = Array.isArray(data) ? data : []
                const defaults = readStoredJson('api_chat_defaults') || {}
                const matchedBusiness =
                    defaults.business_client_id &&
                    nextBusinesses.some((item) => item.business_client_id === defaults.business_client_id)
                        ? defaults.business_client_id
                        : nextBusinesses[0]?.business_client_id || ''

                setBusinesses(nextBusinesses)
                setSelectedBusinessId(matchedBusiness)
            } catch {
                if (!cancelled) {
                    setBusinesses([])
                    setSelectedBusinessId('')
                }
            }
        }

        void loadBusinesses()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!selectedBusinessId) {
            setWorkspaces([])
            setSelectedWorkspaceId('')
            return
        }
        let cancelled = false

        const loadWorkspaces = async () => {
            try {
                const response = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(selectedBusinessId)}/workspaces`
                )
                const data = await response.json().catch(() => null)
                if (!response.ok) throw new Error('Failed to load workspaces')
                if (cancelled) return

                const nextWorkspaces = Array.isArray(data) ? data : []
                const defaults = readStoredJson('api_chat_defaults') || {}
                const persistedWorkspaceId = String(defaults.workspace_id || '').trim()
                const matchedWorkspace =
                    persistedWorkspaceId &&
                    nextWorkspaces.some((item) => item.workspace_id === persistedWorkspaceId)
                        ? persistedWorkspaceId
                        : nextWorkspaces[0]?.workspace_id || ''

                setWorkspaces(nextWorkspaces)
                setSelectedWorkspaceId(matchedWorkspace)
            } catch {
                if (!cancelled) {
                    setWorkspaces([])
                    setSelectedWorkspaceId('')
                }
            }
        }

        void loadWorkspaces()
        return () => {
            cancelled = true
        }
    }, [selectedBusinessId])

    useEffect(() => {
        if (!selectedBusinessId || !selectedWorkspaceId) return
        const defaults = readStoredJson('api_chat_defaults') || {}
        localStorage.setItem(
            'api_chat_defaults',
            JSON.stringify({
                ...defaults,
                business_client_id: selectedBusinessId,
                workspace_id: selectedWorkspaceId,
            })
        )
    }, [selectedBusinessId, selectedWorkspaceId])

    useEffect(() => {
        let cancelled = false
        const loadSiteUserDefaults = async () => {
            try {
                const response = await fetchLaravel('/api/admin/system-config/site-user-defaults')
                const data = await response.json().catch(() => null)
                if (!response.ok) throw new Error('Failed to load site user defaults')
                if (cancelled) return
                setSiteUserBusinessId(String(data?.business_client_id || '').trim())
                setSiteUserWorkspaceId(String(data?.workspace_id || '').trim())
            } catch {
                if (!cancelled) {
                    setSiteUserBusinessId('')
                    setSiteUserWorkspaceId('')
                }
            }
        }
        void loadSiteUserDefaults()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!siteUserBusinessId) {
            setSiteUserWorkspaces([])
            return
        }
        let cancelled = false
        const load = async () => {
            try {
                const response = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(siteUserBusinessId)}/workspaces`
                )
                const data = await response.json().catch(() => null)
                if (!response.ok) throw new Error('Failed to load site user workspaces')
                if (cancelled) return
                const nextWorkspaces = Array.isArray(data) ? data : []
                setSiteUserWorkspaces(nextWorkspaces)
                if (siteUserWorkspaceId && !nextWorkspaces.some((item) => item.workspace_id === siteUserWorkspaceId)) {
                    setSiteUserWorkspaceId(nextWorkspaces[0]?.workspace_id || '')
                }
            } catch {
                if (!cancelled) setSiteUserWorkspaces([])
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [siteUserBusinessId, siteUserWorkspaceId])

    const startNewWorkspaceChat = () => {
        const chatId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
        window.dispatchEvent(
            new CustomEvent('assistant-new-chat', {
                detail: { chat_id: chatId },
            })
        )
    }

    const handleBusinessChange = (event) => {
        const nextBusinessId = String(event.target.value || '').trim()
        if (!nextBusinessId || nextBusinessId === selectedBusinessId) return
        setSelectedBusinessId(nextBusinessId)
        setSelectedWorkspaceId('')
        startNewWorkspaceChat()
    }

    const handleWorkspaceChange = (event) => {
        const nextWorkspaceId = String(event.target.value || '').trim()
        if (!nextWorkspaceId || nextWorkspaceId === selectedWorkspaceId) return
        setSelectedWorkspaceId(nextWorkspaceId)
        startNewWorkspaceChat()
    }

    const saveSiteUserDefaults = async () => {
        if (!siteUserBusinessId || !siteUserWorkspaceId || siteUserDefaultsSaving) return
        setSiteUserDefaultsSaving(true)
        setSiteUserDefaultsStatus('')
        try {
            const response = await fetchLaravel('/api/admin/system-config/site-user-defaults', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    business_client_id: siteUserBusinessId,
                    workspace_id: siteUserWorkspaceId,
                }),
            })
            const data = await response.json().catch(() => null)
            if (!response.ok) {
                throw new Error(data?.detail || data?.message || 'Failed to save site user defaults')
            }
            setSiteUserDefaultsStatus('Saved. New signups will use this business and workspace.')
        } catch (error) {
            setSiteUserDefaultsStatus(error.message || 'Failed to save site user defaults.')
        } finally {
            setSiteUserDefaultsSaving(false)
        }
    }

    return (
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 lg:px-5">
            <div className="grid gap-2.5 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
                    <p className="admin-kicker mb-1.5">
                        Your chat context
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-slate-600">
                            <span className="mb-1 flex items-center gap-1.5">
                                <BuildingIcon className="h-3.5 w-3.5 text-[#2EAADB]" />
                                Business
                            </span>
                            <select
                                value={selectedBusinessId}
                                onChange={handleBusinessChange}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15"
                            >
                                <option value="">Choose a business</option>
                                {businesses.map((business) => (
                                    <option key={business.business_client_id} value={business.business_client_id}>
                                        {business.name || business.business_client_id}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-600">
                            <span className="mb-1 flex items-center gap-1.5">
                                <FolderOpenIcon className="h-3.5 w-3.5 text-[#2EAADB]" />
                                Workspace
                            </span>
                            <select
                                value={selectedWorkspaceId}
                                onChange={handleWorkspaceChange}
                                disabled={!selectedBusinessId || workspaces.length === 0}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Choose a workspace</option>
                                {workspaces.map((workspace) => (
                                    <option key={workspace.workspace_id} value={workspace.workspace_id}>
                                        {workspace.name || workspace.workspace_id}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
                    <p className="admin-kicker mb-1.5">
                        Site user assignment
                    </p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <label className="block text-xs font-medium text-slate-600">
                            <span className="mb-1 flex items-center gap-1.5">
                                <BuildingIcon className="h-3.5 w-3.5 text-[#2EAADB]" />
                                Business
                            </span>
                            <select
                                value={siteUserBusinessId}
                                onChange={(event) => {
                                    setSiteUserBusinessId(String(event.target.value || '').trim())
                                    setSiteUserWorkspaceId('')
                                    setSiteUserDefaultsStatus('')
                                }}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15"
                            >
                                <option value="">Choose a business</option>
                                {businesses.map((business) => (
                                    <option key={`site-${business.business_client_id}`} value={business.business_client_id}>
                                        {business.name || business.business_client_id}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-600">
                            <span className="mb-1 flex items-center gap-1.5">
                                <FolderOpenIcon className="h-3.5 w-3.5 text-[#2EAADB]" />
                                Workspace
                            </span>
                            <select
                                value={siteUserWorkspaceId}
                                onChange={(event) => {
                                    setSiteUserWorkspaceId(String(event.target.value || '').trim())
                                    setSiteUserDefaultsStatus('')
                                }}
                                disabled={!siteUserBusinessId || siteUserWorkspaces.length === 0}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Choose a workspace</option>
                                {siteUserWorkspaces.map((workspace) => (
                                    <option key={`site-ws-${workspace.workspace_id}`} value={workspace.workspace_id}>
                                        {workspace.name || workspace.workspace_id}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={saveSiteUserDefaults}
                                disabled={!siteUserBusinessId || !siteUserWorkspaceId || siteUserDefaultsSaving}
                                className="admin-btn-primary w-full sm:w-auto"
                            >
                                {siteUserDefaultsSaving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                    {siteUserDefaultsStatus ? (
                        <p className="mt-2 text-[11px] text-slate-600">{siteUserDefaultsStatus}</p>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
