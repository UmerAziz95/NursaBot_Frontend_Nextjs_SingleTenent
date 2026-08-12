'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus as PlusIcon, Trash2 as TrashIcon, Building2 as BuildingIcon, FolderKanban as WorkspaceIcon, Users as UsersIcon, FileText as DocumentIcon } from 'lucide-react'
import { fetchLaravel } from '@/lib/laravel-api'

function Section({ icon: Icon, title, addHref, addLabel, children }) {
    return (
        <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#2EAADB]" />
                    <h2 className="font-semibold text-gray-900">{title}</h2>
                </div>
                {addHref && (
                    <Link
                        href={addHref}
                        className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#053447] px-3 py-2 rounded-lg hover:bg-[#0a4b63] transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {addLabel}
                    </Link>
                )}
            </div>
            <div className="p-5">{children}</div>
        </section>
    )
}

function EmptyRow({ children }) {
    return <p className="text-sm text-gray-500">{children}</p>
}

function DeleteButton({ onClick, busy }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy}
            title="Delete"
            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30"
        >
            <TrashIcon className="w-4 h-4" />
        </button>
    )
}

export default function ManageDashboard() {
    const [businesses, setBusinesses] = useState([])
    const [businessesLoading, setBusinessesLoading] = useState(true)
    const [businessesError, setBusinessesError] = useState(null)
    const [deletingBusiness, setDeletingBusiness] = useState(null)

    const [selectedBusiness, setSelectedBusiness] = useState('')
    const [workspaces, setWorkspaces] = useState([])
    const [workspacesLoading, setWorkspacesLoading] = useState(false)
    const [workspacesError, setWorkspacesError] = useState(null)
    const [deletingWorkspace, setDeletingWorkspace] = useState(null)

    const [selectedWorkspace, setSelectedWorkspace] = useState('')
    const [documents, setDocuments] = useState([])
    const [documentsLoading, setDocumentsLoading] = useState(false)
    const [documentsError, setDocumentsError] = useState(null)
    const [deletingDocument, setDeletingDocument] = useState(null)

    const [users, setUsers] = useState([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [usersError, setUsersError] = useState(null)
    const [deletingUser, setDeletingUser] = useState(null)

    const loadBusinesses = async () => {
        setBusinessesLoading(true)
        setBusinessesError(null)
        try {
            const response = await fetchLaravel('/api/admin/businesses')
            if (!response.ok) throw new Error()
            const data = await response.json()
            setBusinesses(Array.isArray(data) ? data : [])
        } catch (err) {
            setBusinessesError('Unable to load businesses.')
        } finally {
            setBusinessesLoading(false)
        }
    }

    const loadUsers = async () => {
        setUsersLoading(true)
        setUsersError(null)
        try {
            const response = await fetchLaravel('/api/admin/auth/users')
            if (!response.ok) throw new Error()
            const data = await response.json()
            setUsers(Array.isArray(data) ? data : [])
        } catch (err) {
            setUsersError('Unable to load users.')
        } finally {
            setUsersLoading(false)
        }
    }

    const loadWorkspaces = async (businessClientId) => {
        if (!businessClientId) {
            setWorkspaces([])
            return
        }
        setWorkspacesLoading(true)
        setWorkspacesError(null)
        try {
            const response = await fetchLaravel(`/api/admin/businesses/${encodeURIComponent(businessClientId)}/workspaces`)
            if (!response.ok) throw new Error()
            const data = await response.json()
            setWorkspaces(Array.isArray(data) ? data : [])
        } catch (err) {
            setWorkspacesError('Unable to load workspaces.')
        } finally {
            setWorkspacesLoading(false)
        }
    }

    const loadDocuments = async (businessClientId, workspaceId) => {
        if (!businessClientId || !workspaceId) {
            setDocuments([])
            return
        }
        setDocumentsLoading(true)
        setDocumentsError(null)
        try {
            const response = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(businessClientId)}/workspaces/${encodeURIComponent(workspaceId)}/documents`
            )
            if (!response.ok) throw new Error()
            const data = await response.json()
            setDocuments(Array.isArray(data) ? data : [])
        } catch (err) {
            setDocumentsError('Unable to load documents.')
        } finally {
            setDocumentsLoading(false)
        }
    }

    useEffect(() => {
        loadBusinesses()
        loadUsers()
    }, [])

    useEffect(() => {
        setSelectedWorkspace('')
        setDocuments([])
        loadWorkspaces(selectedBusiness)
    }, [selectedBusiness])

    useEffect(() => {
        loadDocuments(selectedBusiness, selectedWorkspace)
    }, [selectedWorkspace])

    const handleDeleteBusiness = async (business) => {
        if (!window.confirm(`Delete business "${business.name}"? This removes its workspaces, users, and documents too.`)) return
        setDeletingBusiness(business.business_client_id)
        try {
            const response = await fetchLaravel(`/api/admin/businesses/${encodeURIComponent(business.business_client_id)}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error()
            if (selectedBusiness === business.business_client_id) {
                setSelectedBusiness('')
            }
            await loadBusinesses()
        } catch (err) {
            setBusinessesError('Failed to delete business.')
        } finally {
            setDeletingBusiness(null)
        }
    }

    const handleDeleteWorkspace = async (workspace) => {
        if (!window.confirm(`Delete workspace "${workspace.name}"? This removes its documents too.`)) return
        setDeletingWorkspace(workspace.workspace_id)
        try {
            const response = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(selectedBusiness)}/workspaces/${encodeURIComponent(workspace.workspace_id)}`,
                { method: 'DELETE' }
            )
            if (!response.ok) throw new Error()
            if (selectedWorkspace === workspace.workspace_id) {
                setSelectedWorkspace('')
            }
            await loadWorkspaces(selectedBusiness)
        } catch (err) {
            setWorkspacesError('Failed to delete workspace.')
        } finally {
            setDeletingWorkspace(null)
        }
    }

    const handleDeleteDocument = async (document) => {
        if (!window.confirm(`Delete document "${document.filename}"?`)) return
        setDeletingDocument(document.id)
        try {
            const response = await fetchLaravel(
                `/api/admin/businesses/${encodeURIComponent(selectedBusiness)}/workspaces/${encodeURIComponent(selectedWorkspace)}/documents/${encodeURIComponent(document.id)}`,
                { method: 'DELETE' }
            )
            if (!response.ok) throw new Error()
            await loadDocuments(selectedBusiness, selectedWorkspace)
        } catch (err) {
            setDocumentsError('Failed to delete document.')
        } finally {
            setDeletingDocument(null)
        }
    }

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Delete user "${user.email}"?`)) return
        setDeletingUser(user.id)
        try {
            const response = await fetchLaravel(`/api/admin/auth/users/${encodeURIComponent(user.id)}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error()
            await loadUsers()
        } catch (err) {
            setUsersError('Failed to delete user.')
        } finally {
            setDeletingUser(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-[#053447] text-white">
                <div className="mx-auto max-w-5xl px-6 py-6">
                    <p className="text-xs uppercase tracking-wide text-[#2EAADB] font-semibold">Admin</p>
                    <h1 className="text-xl font-bold mt-1">Manage</h1>
                    <p className="text-sm text-gray-300 mt-1">Add and remove businesses, workspaces, users, and documents.</p>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
                <Section icon={BuildingIcon} title="Businesses" addHref="/create-business" addLabel="Add business">
                    {businessesLoading && <EmptyRow>Loading businesses…</EmptyRow>}
                    {!businessesLoading && businessesError && <p className="text-sm text-red-600">{businessesError}</p>}
                    {!businessesLoading && !businessesError && businesses.length === 0 && (
                        <EmptyRow>No businesses yet.</EmptyRow>
                    )}
                    {!businessesLoading && businesses.length > 0 && (
                        <ul className="divide-y divide-gray-100">
                            {businesses.map((business) => (
                                <li key={business.business_client_id} className="py-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBusiness(business.business_client_id)}
                                        className={`text-left ${selectedBusiness === business.business_client_id ? 'text-[#053447] font-semibold' : 'text-gray-900'}`}
                                    >
                                        <p>{business.name}</p>
                                        <p className="text-xs text-gray-500">{business.business_client_id}</p>
                                    </button>
                                    <DeleteButton
                                        onClick={() => handleDeleteBusiness(business)}
                                        busy={deletingBusiness === business.business_client_id}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section
                    icon={WorkspaceIcon}
                    title="Workspaces"
                    addHref={selectedBusiness ? `/create-workspace?business_client_id=${encodeURIComponent(selectedBusiness)}` : undefined}
                    addLabel="Add workspace"
                >
                    {!selectedBusiness && <EmptyRow>Select a business above to view its workspaces.</EmptyRow>}
                    {selectedBusiness && workspacesLoading && <EmptyRow>Loading workspaces…</EmptyRow>}
                    {selectedBusiness && !workspacesLoading && workspacesError && <p className="text-sm text-red-600">{workspacesError}</p>}
                    {selectedBusiness && !workspacesLoading && !workspacesError && workspaces.length === 0 && (
                        <EmptyRow>No workspaces yet for this business.</EmptyRow>
                    )}
                    {selectedBusiness && !workspacesLoading && workspaces.length > 0 && (
                        <ul className="divide-y divide-gray-100">
                            {workspaces.map((workspace) => (
                                <li key={workspace.workspace_id} className="py-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWorkspace(workspace.workspace_id)}
                                        className={`text-left ${selectedWorkspace === workspace.workspace_id ? 'text-[#053447] font-semibold' : 'text-gray-900'}`}
                                    >
                                        <p>{workspace.name}</p>
                                        <p className="text-xs text-gray-500">{workspace.workspace_id}</p>
                                    </button>
                                    <DeleteButton
                                        onClick={() => handleDeleteWorkspace(workspace)}
                                        busy={deletingWorkspace === workspace.workspace_id}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section
                    icon={DocumentIcon}
                    title="Documents"
                    addHref={
                        selectedBusiness && selectedWorkspace
                            ? `/add-document?business_client_id=${encodeURIComponent(selectedBusiness)}&workspace_id=${encodeURIComponent(selectedWorkspace)}`
                            : undefined
                    }
                    addLabel="Add document"
                >
                    {!selectedWorkspace && <EmptyRow>Select a workspace above to view its documents.</EmptyRow>}
                    {selectedWorkspace && documentsLoading && <EmptyRow>Loading documents…</EmptyRow>}
                    {selectedWorkspace && !documentsLoading && documentsError && <p className="text-sm text-red-600">{documentsError}</p>}
                    {selectedWorkspace && !documentsLoading && !documentsError && documents.length === 0 && (
                        <EmptyRow>No documents yet in this workspace.</EmptyRow>
                    )}
                    {selectedWorkspace && !documentsLoading && documents.length > 0 && (
                        <ul className="divide-y divide-gray-100">
                            {documents.map((document) => (
                                <li key={document.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900">{document.filename}</p>
                                        <p className="text-xs text-gray-500">{document.status}</p>
                                    </div>
                                    <DeleteButton
                                        onClick={() => handleDeleteDocument(document)}
                                        busy={deletingDocument === document.id}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section icon={UsersIcon} title="Users" addHref="/create-user" addLabel="Add user">
                    {usersLoading && <EmptyRow>Loading users…</EmptyRow>}
                    {!usersLoading && usersError && <p className="text-sm text-red-600">{usersError}</p>}
                    {!usersLoading && !usersError && users.length === 0 && <EmptyRow>No workspace users yet.</EmptyRow>}
                    {!usersLoading && users.length > 0 && (
                        <ul className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <li key={user.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900">{user.email}</p>
                                        <p className="text-xs text-gray-500">
                                            {user.business_name || user.business_client_id || 'No business'}
                                            {user.workspace_name ? ` · ${user.workspace_name}` : ''}
                                        </p>
                                    </div>
                                    <DeleteButton onClick={() => handleDeleteUser(user)} busy={deletingUser === user.id} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            </main>
        </div>
    )
}
