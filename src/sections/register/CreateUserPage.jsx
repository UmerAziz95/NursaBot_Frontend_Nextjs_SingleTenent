"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { fetchLaravel } from '@/lib/laravel-api'
import { toast } from '@/lib/toast'

export default function CreateUserPage({ embedded = false }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        business_client_id: '',
        workspace_id: '',
    })
    const [businesses, setBusinesses] = useState([])
    const [workspaces, setWorkspaces] = useState([])
    const [loading, setLoading] = useState(false)
    const hasBusinessSelection = Boolean(formData.business_client_id)

    useEffect(() => {
        // Fetch businesses for the admin
        const fetchBusinesses = async () => {
            try {
                const res = await fetchLaravel('/api/admin/businesses')
                if (!res.ok) return
                const data = await res.json()
                const list = Array.isArray(data) ? data : (data.businesses || [])
                setBusinesses(list)
                if (list.length === 1) {
                    const clientId = list[0].business_client_id || list[0].client_id || list[0].id
                    setFormData(f => ({ ...f, business_client_id: clientId }))
                }
            } catch (err) {
                // ignore
            }
        }

        fetchBusinesses()
    }, [])

    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (!formData.business_client_id) {
                setWorkspaces([])
                setFormData(f => ({ ...f, workspace_id: '' }))
                return
            }
            try {
                const biz = encodeURIComponent(formData.business_client_id)
                const res = await fetchLaravel(`/api/admin/businesses/${biz}/workspaces`)
                if (!res.ok) return
                const data = await res.json()
                const list = Array.isArray(data) ? data : (data.workspaces || [])
                setWorkspaces(list)
                if (list.length === 1) {
                    const wsId = list[0].workspace_id || list[0].client_id || list[0].id
                    setFormData(f => ({ ...f, workspace_id: wsId }))
                }
            } catch (err) {
                // ignore
            }
        }

        fetchWorkspaces()
    }, [formData.business_client_id])

    const handleChange = (e) => {
        const { name, value } = e.target
        // normalize select names to our state keys
        if (name === 'businessId') {
            setFormData(prev => ({ ...prev, business_client_id: value, workspace_id: '' }))
        } else if (name === 'workspaceId') {
            setFormData(prev => ({ ...prev, workspace_id: value }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        setLoading(true)

        try {
            const body = {
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            }
            if (formData.business_client_id) body.business_client_id = formData.business_client_id
            if (formData.workspace_id) body.workspace_id = formData.workspace_id

            const res = await fetchLaravel('/api/admin/auth/create-user', {
                method: 'POST',
                body: JSON.stringify(body),
            })

            let data = null
            try { data = await res.json() } catch (e) { }

            if (res.ok) {
                toast.success((data && (data.message || data.detail)) || 'User created successfully.')
                setFormData({ email: '', password: '', confirmPassword: '', business_client_id: '', workspace_id: '' })
                setWorkspaces([])
                return
            }

            toast.error((data && (data.message || data.detail || data.error)) || 'Creation failed')
        } catch (err) {
            toast.error(err.message || 'Creation error')
        } finally {
            setLoading(false)
        }
    }

    const businessSelect = (
        <>
            {businesses && businesses.length > 1 ? (
                <div>
                    <label htmlFor="businessId" className="admin-label">Business</label>
                    <select id="businessId" name="businessId" value={formData.business_client_id} onChange={handleChange} className="admin-input">
                        <option value="">Select business</option>
                        {businesses.map((b) => (
                            <option key={b.id || b.business_client_id} value={b.business_client_id || b.client_id || b.id}>
                                {b.name || b.title || b.business_client_id || b.id}
                            </option>
                        ))}
                    </select>
                </div>
            ) : businesses && businesses.length === 1 ? (
                <div>
                    <label className="admin-label">Business</label>
                    <input
                        type="text"
                        value={businesses[0].name || businesses[0].title || businesses[0].business_client_id || businesses[0].id}
                        disabled
                        className="admin-input"
                    />
                </div>
            ) : null}

            {hasBusinessSelection ? (
                workspaces && workspaces.length > 1 ? (
                    <div>
                        <label htmlFor="workspaceId" className="admin-label">Workspace</label>
                        <select id="workspaceId" name="workspaceId" value={formData.workspace_id} onChange={handleChange} className="admin-input">
                            <option value="">Select workspace</option>
                            {workspaces.map((w) => (
                                <option key={w.id || w.workspace_id} value={w.workspace_id || w.client_id || w.id}>
                                    {w.name || w.title || w.workspace_id || w.id}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : workspaces && workspaces.length === 1 ? (
                    <div>
                        <label className="admin-label">Workspace</label>
                        <input
                            type="text"
                            value={workspaces[0].name || workspaces[0].title || workspaces[0].workspace_id || workspaces[0].id}
                            disabled
                            className="admin-input"
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="workspaceId" className="admin-label">Workspace</label>
                        <select id="workspaceId" name="workspaceId" value={formData.workspace_id} onChange={handleChange} className="admin-input" disabled>
                            <option value="">No workspaces available</option>
                        </select>
                    </div>
                )
            ) : null}
        </>
    )

    if (embedded) {
        return (
            <div className="mx-auto max-w-6xl space-y-3 p-4 lg:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="admin-page-desc">
                        Create a site user and assign them to a business workspace.
                    </p>
                    <Link href="/manage-users" className="admin-btn-secondary">
                        Manage users
                    </Link>
                </div>
                <form onSubmit={handleSubmit} className="admin-panel mx-auto max-w-xl space-y-3">
                    <div>
                        <label htmlFor="email" className="admin-label">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="admin-input" placeholder="user@example.com" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="password" className="admin-label">Password</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="admin-input" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="admin-label">Confirm password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="admin-input" />
                        </div>
                    </div>
                    {businessSelect}
                    <button type="submit" disabled={loading} className="admin-btn-primary">
                        {loading ? 'Creating…' : 'Create user'}
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
            <div className="wrapper w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[4vw] items-center">
                    <div className="w-full order-2 lg:order-1">
                        <div className="login-form rounded-2xl lg:rounded-[1.5vw] shadow-2xl p-6 lg:p-[2vw]">
                            <div className="mb-6 lg:mb-[2vw]">
                                <h3 className="mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Create User</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">Create a regular user account and assign to business/workspace</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                                <div>
                                    <label htmlFor="email" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Email Address</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="your.email@example.com" />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Password</label>
                                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="Enter a password" />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Confirm Password</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all" placeholder="Repeat the password" />
                                </div>

                                {businesses && businesses.length > 1 ? (
                                    <div>
                                        <label htmlFor="businessId" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Business</label>
                                        <select id="businessId" name="businessId" value={formData.business_client_id} onChange={handleChange} className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all">
                                            <option value="">Select business</option>
                                            {businesses.map(b => (
                                                <option key={b.id || b.business_client_id} value={b.business_client_id || b.client_id || b.id}>{b.name || b.title || b.business_client_id || b.id}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : businesses && businesses.length === 1 ? (
                                    <div>
                                        <label className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Business</label>
                                        <input type="text" value={businesses[0].name || businesses[0].title || businesses[0].business_client_id || businesses[0].id} disabled className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-gray-100 cursor-not-allowed" />
                                        <input type="hidden" name="business_client_id" value={businesses[0].business_client_id || businesses[0].client_id || businesses[0].id} />
                                    </div>
                                ) : null}

                                {hasBusinessSelection ? (
                                    workspaces && workspaces.length > 1 ? (
                                        <div>
                                            <label htmlFor="workspaceId" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Workspace</label>
                                            <select id="workspaceId" name="workspaceId" value={formData.workspace_id} onChange={handleChange} className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all">
                                                <option value="">Select workspace</option>
                                                {workspaces.map(w => (
                                                    <option key={w.id || w.workspace_id} value={w.workspace_id || w.client_id || w.id}>{w.name || w.title || w.workspace_id || w.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : workspaces && workspaces.length === 1 ? (
                                        <div>
                                            <label className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Workspace</label>
                                            <input type="text" value={workspaces[0].name || workspaces[0].title || workspaces[0].workspace_id || workspaces[0].id} disabled className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-gray-100 cursor-not-allowed" />
                                            <input type="hidden" name="workspace_id" value={workspaces[0].workspace_id || workspaces[0].client_id || workspaces[0].id} />
                                        </div>
                                    ) : (
                                        <div>
                                            <label htmlFor="workspaceId" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">Workspace</label>
                                            <select id="workspaceId" name="workspaceId" value={formData.workspace_id} onChange={handleChange} className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all bg-gray-50" disabled>
                                                <option value="">No workspaces available for the selected business</option>
                                            </select>
                                        </div>
                                    )
                                ) : null}

                                <div className="w-full">
                                    <button type="submit" disabled={loading} className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold">{loading ? 'Creating user...' : 'Create User'}</button>
                                </div>

                                <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">
                                    Back to{' '}
                                    <Link href="/admin/dashboard" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">dashboard</Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none">
                            <Image src="/contact-image.svg" alt="Create user illustration" width={600} height={600} className="w-full h-auto object-contain" priority />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
