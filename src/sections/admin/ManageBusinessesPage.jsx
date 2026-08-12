'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    FolderKanban as FolderIcon,
    Pencil as PencilIcon,
    Trash2 as TrashIcon,
    Eye as EyeIcon,
    Plus as PlusIcon,
    Search as SearchIcon,
    X as XIcon,
} from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const emptyBusinessForm = {
    business_client_id: '',
    name: '',
}

const emptyWorkspaceForm = {
    business_client_id: '',
    workspace_id: '',
    name: '',
}

export default function ManageBusinessesPage() {
    const [tab, setTab] = useState('businesses')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])
    const [selectedBusinessFilter, setSelectedBusinessFilter] = useState('')

    const [modal, setModal] = useState(null)
    const [form, setForm] = useState(emptyBusinessForm)
    const [selected, setSelected] = useState(null)
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState('')
    const [canManage, setCanManage] = useState(true)

    const loadBusinesses = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchLaravel('/api/admin/businesses')
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not load businesses.')
            const list = Array.isArray(data) ? data : []
            setBusinesses(list)
            setSelectedBusinessFilter((current) => {
                if (current && list.some((item) => item.business_client_id === current)) {
                    return current
                }
                return list[0]?.business_client_id || ''
            })
        } catch (err) {
            toast.error(err.message || 'Could not load businesses.')
            setBusinesses([])
        } finally {
            setLoading(false)
        }
    }, [])

    const loadWorkspaces = useCallback(async (businessClientId) => {
        if (!businessClientId) {
            setWorkspaces([])
            return
        }
        setLoading(true)
        try {
            const res = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(businessClientId)}/workspaces`
            )
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not load workspaces.')
            setWorkspaces(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error(err.message || 'Could not load workspaces.')
            setWorkspaces([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const role = String(user?.role || session?.role || '').toLowerCase()
            setCanManage(role === 'admin' || role === 'super_admin')
        } catch {
            setCanManage(true)
        }
    }, [])

    useEffect(() => {
        void loadBusinesses()
    }, [])

    useEffect(() => {
        if (tab === 'workspaces') {
            void loadWorkspaces(selectedBusinessFilter)
        }
    }, [tab, selectedBusinessFilter, loadWorkspaces])

    const filteredBusinesses = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return businesses
        return businesses.filter(
            (item) =>
                String(item.name || '').toLowerCase().includes(q) ||
                String(item.business_client_id || '').toLowerCase().includes(q)
        )
    }, [businesses, search])

    const filteredWorkspaces = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return workspaces
        return workspaces.filter(
            (item) =>
                String(item.name || '').toLowerCase().includes(q) ||
                String(item.workspace_id || '').toLowerCase().includes(q)
        )
    }, [workspaces, search])

    const closeModal = () => {
        setModal(null)
        setSelected(null)
        setSaving(false)
    }

    const openCreateBusiness = () => {
        setSelected(null)
        setForm({ ...emptyBusinessForm })
        setModal('create-business')
    }

    const openEditBusiness = (business) => {
        setSelected(business)
        setForm({
            business_client_id: business.business_client_id || '',
            name: business.name || '',
        })
        setModal('edit-business')
    }

    const openViewBusiness = async (business) => {
        try {
            const res = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(business.business_client_id)}`
            )
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not load business.')
            setSelected(data)
            setModal('view-business')
        } catch (err) {
            toast.error(err.message || 'Could not load business.')
        }
    }

    const openCreateWorkspace = () => {
        setSelected(null)
        setForm({
            ...emptyWorkspaceForm,
            business_client_id: selectedBusinessFilter || businesses[0]?.business_client_id || '',
        })
        setModal('create-workspace')
    }

    const openEditWorkspace = (workspace) => {
        setSelected(workspace)
        setForm({
            business_client_id: workspace.business_client_id || selectedBusinessFilter,
            workspace_id: workspace.workspace_id || '',
            name: workspace.name || '',
        })
        setModal('edit-workspace')
    }

    const openViewWorkspace = async (workspace) => {
        const businessId = workspace.business_client_id || selectedBusinessFilter
        try {
            const res = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(businessId)}/workspaces/${encodeURIComponent(workspace.workspace_id)}`
            )
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not load workspace.')
            setSelected(data)
            setModal('view-workspace')
        } catch (err) {
            toast.error(err.message || 'Could not load workspace.')
        }
    }

    const saveForm = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            if (modal === 'create-business') {
                const res = await fetchLaravel('/api/admin/businesses', {
                    method: 'POST',
                    body: JSON.stringify({
                        business_client_id: form.business_client_id.trim(),
                        name: form.name.trim(),
                    }),
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not create business.')
                toast.success(`${data?.name || form.name} was created successfully.`)
                closeModal()
                await loadBusinesses()
            } else if (modal === 'edit-business') {
                const res = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(selected.business_client_id)}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({ name: form.name.trim() }),
                    }
                )
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not update business.')
                toast.success(`${data?.name || form.name} was updated successfully.`)
                closeModal()
                await loadBusinesses()
            } else if (modal === 'create-workspace') {
                const businessId = form.business_client_id.trim()
                const res = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(businessId)}/workspaces`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            workspace_id: form.workspace_id.trim(),
                            name: form.name.trim(),
                        }),
                    }
                )
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not create workspace.')
                toast.success(`${data?.name || form.name} was created successfully.`)
                setSelectedBusinessFilter(businessId)
                closeModal()
                await loadBusinesses()
                if (tab === 'workspaces') await loadWorkspaces(businessId)
            } else if (modal === 'edit-workspace') {
                const businessId = form.business_client_id || selectedBusinessFilter
                const res = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(businessId)}/workspaces/${encodeURIComponent(selected.workspace_id)}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({ name: form.name.trim() }),
                    }
                )
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not update workspace.')
                toast.success(`${data?.name || form.name} was updated successfully.`)
                closeModal()
                await loadWorkspaces(businessId)
            }
        } catch (err) {
            toast.error(err.message || 'Save failed.')
        } finally {
            setSaving(false)
        }
    }

    const deleteBusiness = async (business) => {
        if (!window.confirm(`Delete business "${business.name}"? This also removes its workspaces and related users.`)) {
            return
        }
        setBusyId(business.business_client_id)
        try {
            const res = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(business.business_client_id)}`,
                { method: 'DELETE' }
            )
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not delete business.')
            toast.success(`Deleted ${business.name}.`)
            if (selectedBusinessFilter === business.business_client_id) {
                setSelectedBusinessFilter('')
            }
            await loadBusinesses()
        } catch (err) {
            toast.error(err.message || 'Delete failed.')
        } finally {
            setBusyId('')
        }
    }

    const deleteWorkspace = async (workspace) => {
        const businessId = workspace.business_client_id || selectedBusinessFilter
        if (!window.confirm(`Delete workspace "${workspace.name}"?`)) return
        setBusyId(workspace.workspace_id)
        try {
            const res = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(businessId)}/workspaces/${encodeURIComponent(workspace.workspace_id)}`,
                { method: 'DELETE' }
            )
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not delete workspace.')
            toast.success(`Deleted ${workspace.name}.`)
            await loadWorkspaces(businessId)
            await loadBusinesses()
        } catch (err) {
            toast.error(err.message || 'Delete failed.')
        } finally {
            setBusyId('')
        }
    }

    const openWorkspacesForBusiness = (business) => {
        setSelectedBusinessFilter(business.business_client_id)
        setTab('workspaces')
        setSearch('')
    }

    const modalTitle = {
        'create-business': 'Create business',
        'edit-business': 'Edit business',
        'view-business': 'Business details',
        'create-workspace': 'Create workspace',
        'edit-workspace': 'Edit workspace',
        'view-workspace': 'Workspace details',
    }[modal]

    return (
        <div className="mx-auto max-w-6xl space-y-3 p-4 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="admin-page-desc">
                    List, create, view, update, and delete businesses and workspaces.
                </p>
                <div className="flex flex-wrap gap-2">
                    {tab === 'businesses' && canManage && (
                        <button
                            type="button"
                            onClick={openCreateBusiness}
                            className="admin-btn-primary"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            New business
                        </button>
                    )}
                    {tab === 'workspaces' && (
                        <button
                            type="button"
                            onClick={openCreateWorkspace}
                            className="admin-btn-primary"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            New workspace
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {[
                        { id: 'businesses', label: 'Businesses' },
                        { id: 'workspaces', label: 'Workspaces' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setTab(item.id)
                                setSearch('')
                            }}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                                tab === item.id
                                    ? 'bg-[#053447] text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'workspaces' && (
                    <select
                        value={selectedBusinessFilter}
                        onChange={(event) => setSelectedBusinessFilter(event.target.value)}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-[#2EAADB]"
                    >
                        <option value="">Select a business</option>
                        {businesses.map((business) => (
                            <option key={business.business_client_id} value={business.business_client_id}>
                                {business.name} ({business.business_client_id})
                            </option>
                        ))}
                    </select>
                )}

                <div className="relative min-w-[200px] flex-1">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={tab === 'businesses' ? 'Search businesses' : 'Search workspaces'}
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15"
                    />
                </div>
            </div>

            <div className="admin-table-wrap">
                    {tab === 'businesses' ? (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Business</th>
                                    <th>Client ID</th>
                                    <th>Workspaces</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="cell-empty">
                                            Loading…
                                        </td>
                                    </tr>
                                ) : filteredBusinesses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="cell-empty">
                                            No businesses found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBusinesses.map((business) => (
                                        <tr key={business.business_client_id}>
                                            <td className="font-medium text-slate-800">{business.name}</td>
                                            <td className="cell-muted">{business.business_client_id}</td>
                                            <td className="cell-muted">{business.workspace_count ?? 0}</td>
                                            <td className="col-actions">
                                                <div className="flex justify-end gap-0.5">
                                                    <button type="button" title="View" onClick={() => openViewBusiness(business)} className="admin-icon-btn">
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" title="Workspaces" onClick={() => openWorkspacesForBusiness(business)} className="admin-icon-btn">
                                                        <FolderIcon className="h-4 w-4" />
                                                    </button>
                                                    {canManage && (
                                                        <>
                                                            <button type="button" title="Edit" onClick={() => openEditBusiness(business)} className="admin-icon-btn">
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Delete"
                                                                disabled={busyId === business.business_client_id}
                                                                onClick={() => deleteBusiness(business)}
                                                                className="admin-icon-btn text-red-500 hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Workspace</th>
                                    <th>Workspace ID</th>
                                    <th>Business</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!selectedBusinessFilter ? (
                                    <tr>
                                        <td colSpan={4} className="cell-empty">
                                            Select a business to view its workspaces.
                                        </td>
                                    </tr>
                                ) : loading ? (
                                    <tr>
                                        <td colSpan={4} className="cell-empty">
                                            Loading…
                                        </td>
                                    </tr>
                                ) : filteredWorkspaces.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="cell-empty">
                                            No workspaces found for this business.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWorkspaces.map((workspace) => (
                                        <tr key={workspace.workspace_id}>
                                            <td className="font-medium text-slate-800">{workspace.name}</td>
                                            <td className="cell-muted">{workspace.workspace_id}</td>
                                            <td className="cell-muted">
                                                {workspace.business_name || workspace.business_client_id || selectedBusinessFilter}
                                            </td>
                                            <td className="col-actions">
                                                <div className="flex justify-end gap-0.5">
                                                    <button type="button" title="View" onClick={() => openViewWorkspace(workspace)} className="admin-icon-btn">
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" title="Edit" onClick={() => openEditWorkspace(workspace)} className="admin-icon-btn">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        disabled={busyId === workspace.workspace_id}
                                                        onClick={() => deleteWorkspace(workspace)}
                                                        className="admin-icon-btn text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="admin-section-title">{modalTitle}</h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {modal === 'view-business' && selected && (
                            <div className="space-y-3 px-5 py-4 text-sm">
                                <div>
                                    <p className="admin-kicker">Name</p>
                                    <p className="mt-1 font-medium text-slate-800">{selected.name}</p>
                                </div>
                                <div>
                                    <p className="admin-kicker">Client ID</p>
                                    <p className="mt-1 text-slate-700">{selected.business_client_id}</p>
                                </div>
                                <div>
                                    <p className="admin-kicker">Workspaces</p>
                                    <p className="mt-1 text-slate-700">{selected.workspace_count ?? selected.workspaces?.length ?? 0}</p>
                                    {Array.isArray(selected.workspaces) && selected.workspaces.length > 0 && (
                                        <ul className="mt-2 space-y-1 text-slate-600">
                                            {selected.workspaces.map((ws) => (
                                                <li key={ws.workspace_id}>
                                                    {ws.name} <span className="text-slate-400">({ws.workspace_id})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeModal()
                                            openWorkspacesForBusiness(selected)
                                        }}
                                        className="admin-btn-secondary"
                                    >
                                        Open workspaces
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="admin-btn-primary"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {modal === 'view-workspace' && selected && (
                            <div className="space-y-3 px-5 py-4 text-sm">
                                <div>
                                    <p className="admin-kicker">Name</p>
                                    <p className="mt-1 font-medium text-slate-800">{selected.name}</p>
                                </div>
                                <div>
                                    <p className="admin-kicker">Workspace ID</p>
                                    <p className="mt-1 text-slate-700">{selected.workspace_id}</p>
                                </div>
                                <div>
                                    <p className="admin-kicker">Business</p>
                                    <p className="mt-1 text-slate-700">
                                        {selected.business_name || selected.business_client_id || selectedBusinessFilter}
                                    </p>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="admin-btn-primary"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {(modal === 'create-business' || modal === 'edit-business') && (
                            <form onSubmit={saveForm} className="space-y-3 px-5 py-4">
                                <div>
                                    <label className="admin-label">Client ID</label>
                                    <input
                                        required
                                        disabled={modal === 'edit-business'}
                                        value={form.business_client_id}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, business_client_id: event.target.value }))
                                        }
                                        className="admin-input"
                                        placeholder="acme"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">Name</label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                        className="admin-input"
                                        placeholder="Acme Health"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="admin-btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="admin-btn-primary"
                                    >
                                        {saving ? 'Saving…' : modal === 'create-business' ? 'Create' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {(modal === 'create-workspace' || modal === 'edit-workspace') && (
                            <form onSubmit={saveForm} className="space-y-3 px-5 py-4">
                                <div>
                                    <label className="admin-label">Business</label>
                                    <select
                                        required
                                        disabled={modal === 'edit-workspace'}
                                        value={form.business_client_id}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, business_client_id: event.target.value }))
                                        }
                                        className="admin-input"
                                    >
                                        <option value="">Select a business</option>
                                        {businesses.map((business) => (
                                            <option key={business.business_client_id} value={business.business_client_id}>
                                                {business.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="admin-label">Workspace ID</label>
                                    <input
                                        required
                                        disabled={modal === 'edit-workspace'}
                                        value={form.workspace_id}
                                        onChange={(event) =>
                                            setForm((prev) => ({ ...prev, workspace_id: event.target.value }))
                                        }
                                        className="admin-input"
                                        placeholder="main"
                                    />
                                </div>
                                <div>
                                    <label className="admin-label">Name</label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                        className="admin-input"
                                        placeholder="Main workspace"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="admin-btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="admin-btn-primary"
                                    >
                                        {saving ? 'Saving…' : modal === 'create-workspace' ? 'Create' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
