"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function CreateUserPage() {
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
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const hasBusinessSelection = Boolean(formData.business_client_id)

    useEffect(() => {
        // Fetch businesses for the admin
        const fetchBusinesses = async () => {
            try {
                const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
                const url = BASE ? `${BASE.replace(/\/$/, '')}/api/admin/businesses` : '/api/admin/businesses'
                const res = await fetch(url, { credentials: 'include' })
                if (!res.ok) return
                const data = await res.json()
                setBusinesses(Array.isArray(data) ? data : (data.businesses || []))
                if (Array.isArray(data) && data.length === 1) {
                    const clientId = data[0].business_client_id || data[0].client_id || data[0].id
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
                const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
                const biz = encodeURIComponent(formData.business_client_id)
                const url = BASE ? `${BASE.replace(/\/$/, '')}/api/admin/businesses/${biz}/workspaces` : `/api/admin/businesses/${biz}/workspaces`
                const res = await fetch(url, { credentials: 'include' })
                if (!res.ok) return
                const data = await res.json()
                setWorkspaces(Array.isArray(data) ? data : (data.workspaces || []))
                if (Array.isArray(data) && data.length === 1) {
                    const wsId = data[0].workspace_id || data[0].client_id || data[0].id
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
            setError('Passwords do not match.')
            setSuccess(null)
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
            const url = BASE ? `${BASE.replace(/\/$/, '')}/api/admin/auth/create-user` : '/api/admin/auth/create-user'

            const body = {
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            }
            if (formData.business_client_id) body.business_client_id = formData.business_client_id
            if (formData.workspace_id) body.workspace_id = formData.workspace_id

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(body),
            })

            let data = null
            try { data = await res.json() } catch (e) { }

            if (res.ok) {
                setSuccess((data && (data.message || data.detail)) || 'User created successfully.')
                setFormData({ email: '', password: '', confirmPassword: '', business_client_id: '', workspace_id: '' })
                setWorkspaces([])
                return
            }

            setError((data && (data.message || data.detail || data.error)) || 'Creation failed')
        } catch (err) {
            setError(err.message || 'Creation error')
        } finally {
            setLoading(false)
        }
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

                                {error && (<div className="text-red-600 text-[12px] lg:text-[0.75vw] mb-2">{error}</div>)}
                                {success && (<div className="text-green-700 text-[12px] lg:text-[0.75vw] mb-2">{success}</div>)}

                                <div className="w-full">
                                    <button type="submit" disabled={loading} className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold">{loading ? 'Creating user...' : 'Create User'}</button>
                                </div>

                                <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">
                                    Back to{' '}
                                    <Link href="/assistant" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">dashboard</Link>
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
