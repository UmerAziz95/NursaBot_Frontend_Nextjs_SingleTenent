'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    UserPlus as UserPlusIcon,
    Pencil as PencilIcon,
    Trash2 as TrashIcon,
    Power as PowerIcon,
    Shield as ShieldIcon,
    Search as SearchIcon,
    X as XIcon,
} from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

const emptyUserForm = {
    display_name: '',
    email: '',
    password: '',
    business_client_id: '',
    workspace_id: '',
    is_active: true,
}

const emptySubAdminForm = {
    display_name: '',
    email: '',
    password: '',
    is_active: true,
}

const roleLabel = (role) => {
    if (role === 'sub_admin') return 'Sub-admin'
    if (role === 'user') return 'Site user'
    return String(role || '').replace('_', ' ')
}

export default function ManageUsersPage() {
    const [users, setUsers] = useState([])
    const [tab, setTab] = useState('user')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [canCreateSubAdmin, setCanCreateSubAdmin] = useState(false)
    const [canCreateUser, setCanCreateUser] = useState(true)
    const [actorRole, setActorRole] = useState('')

    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])

    const [modal, setModal] = useState(null) // create-user | edit-user | create-sub | edit-sub
    const [form, setForm] = useState(emptyUserForm)
    const [selected, setSelected] = useState(null)
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState('')

    const loadUsers = useCallback(async () => {
        setLoading(true)
        try {
            const query = new URLSearchParams()
            if (tab) query.set('role', tab)
            if (search.trim()) query.set('q', search.trim())
            const res = await fetchLaravel(`/api/admin/users?${query.toString()}`)
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not load users.')
            setUsers(Array.isArray(data?.users) ? data.users : [])
            setCanCreateSubAdmin(Boolean(data?.can_create_sub_admin))
            setCanCreateUser(Boolean(data?.can_create_user))
            setActorRole(String(data?.actor_role || ''))
        } catch (err) {
            toast.error(err.message || 'Could not load users.')
            setUsers([])
        } finally {
            setLoading(false)
        }
    }, [tab, search])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadUsers()
        }, search ? 250 : 0)
        return () => window.clearTimeout(timer)
    }, [loadUsers, search])

    useEffect(() => {
        let cancelled = false
        const loadBusinesses = async () => {
            try {
                const res = await fetchLaravel('/api/admin/businesses')
                const data = await res.json().catch(() => null)
                if (!res.ok || cancelled) return
                setBusinesses(Array.isArray(data) ? data : [])
            } catch {
                if (!cancelled) setBusinesses([])
            }
        }
        void loadBusinesses()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!form.business_client_id) {
            setWorkspaces([])
            return
        }
        let cancelled = false
        const loadWorkspaces = async () => {
            try {
                const res = await fetchLaravel(
                    `/api/admin/businesses/${encodeURIComponent(form.business_client_id)}/workspaces`
                )
                const data = await res.json().catch(() => null)
                if (!res.ok || cancelled) return
                setWorkspaces(Array.isArray(data) ? data : [])
            } catch {
                if (!cancelled) setWorkspaces([])
            }
        }
        void loadWorkspaces()
        return () => {
            cancelled = true
        }
    }, [form.business_client_id])

    const openCreateUser = () => {
        setSelected(null)
        setForm({
            ...emptyUserForm,
            business_client_id: businesses[0]?.business_client_id || '',
        })
        setModal('create-user')
    }

    const openEditUser = (user) => {
        setSelected(user)
        setForm({
            display_name: user.display_name || '',
            email: user.email || '',
            password: '',
            business_client_id: user.business_client_id || '',
            workspace_id: user.workspace_id || '',
            is_active: Boolean(user.is_active),
        })
        setModal(user.role === 'sub_admin' ? 'edit-sub' : 'edit-user')
    }

    const openCreateSubAdmin = () => {
        setSelected(null)
        setForm({ ...emptySubAdminForm })
        setModal('create-sub')
    }

    const closeModal = () => {
        setModal(null)
        setSelected(null)
        setSaving(false)
    }

    const saveForm = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            if (modal === 'create-user') {
                const res = await fetchLaravel('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({
                        display_name: form.display_name.trim() || null,
                        email: form.email.trim(),
                        password: form.password,
                        business_client_id: form.business_client_id,
                        workspace_id: form.workspace_id,
                        is_active: Boolean(form.is_active),
                    }),
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not create user.')
                toast.success(`Created site user ${data?.user?.email || form.email}`)
            } else if (modal === 'create-sub') {
                const res = await fetchLaravel('/api/admin/users/sub-admins', {
                    method: 'POST',
                    body: JSON.stringify({
                        display_name: form.display_name.trim() || null,
                        email: form.email.trim(),
                        password: form.password,
                        is_active: Boolean(form.is_active),
                    }),
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not create sub-admin.')
                toast.success(`Created sub-admin ${data?.user?.email || form.email}`)
            } else if (modal === 'edit-user' || modal === 'edit-sub') {
                const body = {
                    display_name: form.display_name.trim() || null,
                    email: form.email.trim(),
                    is_active: Boolean(form.is_active),
                }
                if (form.password.trim()) body.password = form.password
                if (modal === 'edit-user') {
                    body.business_client_id = form.business_client_id
                    body.workspace_id = form.workspace_id
                }
                const res = await fetchLaravel(`/api/admin/users/${selected.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.detail || 'Could not update user.')
                toast.success(`Updated ${data?.user?.email || form.email}`)
            }
            closeModal()
            await loadUsers()
        } catch (err) {
            toast.error(err.message || 'Save failed.')
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (user) => {
        setBusyId(user.id)
        try {
            const res = await fetchLaravel(`/api/admin/users/${user.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !user.is_active }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not update status.')
            toast.success(`${user.email} is now ${!user.is_active ? 'active' : 'inactive'}.`)
            await loadUsers()
        } catch (err) {
            toast.error(err.message || 'Status update failed.')
        } finally {
            setBusyId('')
        }
    }

    const deleteUser = async (user) => {
        if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return
        setBusyId(user.id)
        try {
            const res = await fetchLaravel(`/api/admin/users/${user.id}`, { method: 'DELETE' })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.detail || 'Could not delete user.')
            toast.success(`Deleted ${user.email}`)
            await loadUsers()
        } catch (err) {
            toast.error(err.message || 'Delete failed.')
        } finally {
            setBusyId('')
        }
    }

    const tabs = useMemo(() => {
        const items = [{ id: 'user', label: 'Site users' }]
        if (canCreateSubAdmin || actorRole === 'admin' || actorRole === 'super_admin') {
            items.push({ id: 'sub_admin', label: 'Sub-admins' })
        }
        return items
    }, [canCreateSubAdmin, actorRole])

    return (
        <div className="mx-auto max-w-6xl space-y-3 p-4 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="admin-page-desc">
                    Create, update, activate, and delete site users
                    {canCreateSubAdmin ? ' and sub-admins' : ''}.
                </p>
                <div className="flex flex-wrap gap-2">
                    {canCreateUser && tab === 'user' && (
                        <button
                            type="button"
                            onClick={openCreateUser}
                            className="admin-btn-primary"
                        >
                            <UserPlusIcon className="h-3.5 w-3.5" />
                            New site user
                        </button>
                    )}
                    {canCreateSubAdmin && (
                        <button
                            type="button"
                            onClick={openCreateSubAdmin}
                            className="admin-btn-secondary"
                        >
                            <ShieldIcon className="h-3.5 w-3.5 text-[#2EAADB]" />
                            New sub-admin
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
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
                <div className="relative min-w-[200px] flex-1">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search email or name"
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-[#2EAADB] focus:ring-2 focus:ring-[#2EAADB]/15"
                    />
                </div>
            </div>

            <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Scope</th>
                                <th>Status</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="cell-empty">
                                        Loading…
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="cell-empty">
                                        No {tab === 'sub_admin' ? 'sub-admins' : 'site users'} found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <p className="font-medium text-slate-800">
                                                {user.display_name || user.email}
                                            </p>
                                            <p className="cell-muted">{user.email}</p>
                                        </td>
                                        <td>
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                                                {roleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="cell-muted">
                                            {user.role === 'user' ? (
                                                <>
                                                    <div>{user.business_name || user.business_client_id || '—'}</div>
                                                    <div>{user.workspace_name || user.workspace_id || ''}</div>
                                                </>
                                            ) : (
                                                'Admin portal'
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                    user.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="col-actions">
                                            <div className="flex items-center justify-end gap-0.5">
                                                <button
                                                    type="button"
                                                    title="Edit"
                                                    onClick={() => openEditUser(user)}
                                                    className="admin-icon-btn"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title={user.is_active ? 'Deactivate' : 'Activate'}
                                                    disabled={busyId === user.id}
                                                    onClick={() => void toggleActive(user)}
                                                    className="admin-icon-btn"
                                                >
                                                    <PowerIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Delete"
                                                    disabled={busyId === user.id}
                                                    onClick={() => void deleteUser(user)}
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
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="admin-section-title">
                                {modal === 'create-user' && 'Create site user'}
                                {modal === 'edit-user' && 'Edit site user'}
                                {modal === 'create-sub' && 'Create sub-admin'}
                                {modal === 'edit-sub' && 'Edit sub-admin'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={saveForm} className="space-y-3 px-5 py-4">
                            <div>
                                <label className="admin-label">Display name</label>
                                <input
                                    value={form.display_name}
                                    onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                                    className="admin-input"
                                />
                            </div>
                            <div>
                                <label className="admin-label">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                    className="admin-input"
                                />
                            </div>
                            <div>
                                <label className="admin-label">Password {modal.startsWith('edit') ? '(optional)' : ''}</label>
                                <input
                                    type="password"
                                    required={!modal.startsWith('edit')}
                                    minLength={6}
                                    value={form.password}
                                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                    className="admin-input"
                                />
                            </div>

                            {(modal === 'create-user' || modal === 'edit-user') && (
                                <>
                                    <div>
                                        <label className="admin-label">Business</label>
                                        <select
                                            required
                                            value={form.business_client_id}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    business_client_id: event.target.value,
                                                    workspace_id: '',
                                                }))
                                            }
                                            className="admin-input"
                                        >
                                            <option value="">Select business</option>
                                            {businesses.map((business) => (
                                                <option key={business.business_client_id} value={business.business_client_id}>
                                                    {business.name || business.business_client_id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="admin-label">Workspace</label>
                                        <select
                                            required
                                            value={form.workspace_id}
                                            onChange={(event) =>
                                                setForm((current) => ({ ...current, workspace_id: event.target.value }))
                                            }
                                            disabled={!form.business_client_id}
                                            className="admin-input"
                                        >
                                            <option value="">Select workspace</option>
                                            {workspaces.map((workspace) => (
                                                <option key={workspace.workspace_id} value={workspace.workspace_id}>
                                                    {workspace.name || workspace.workspace_id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.is_active)}
                                    onChange={(event) =>
                                        setForm((current) => ({ ...current, is_active: event.target.checked }))
                                    }
                                    className="rounded border-slate-300"
                                />
                                Active account
                            </label>

                            {(modal === 'create-sub' || modal === 'edit-sub') && (
                                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Sub-admins can manage site users only. They cannot create, update, or delete admins or other sub-admins.
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
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
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
