'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { userFacingError } from '@/lib/user-facing-error'

export default function CreateAdminPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
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
            const url = BASE ? `${BASE.replace(/\/$/, '')}/api/admin/auth/create-admin` : '/api/admin/auth/create-admin'

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    password_confirmation: formData.confirmPassword,
                }),
            })

            let data = null
            try { data = await res.json() } catch (e) { /* non-json response */ }

            if (res.ok) {
                setSuccess((data && (data.message || data.detail)) || 'Admin account created successfully. Please log in.')
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                })
                return
            }

            setError(userFacingError(data && (data.message || data.detail || data.error), 'Registration failed. Please try again.'))
        } catch (err) {
            setError(userFacingError(err.message, 'Registration failed. Please try again.'))
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
                                <h3 className="mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Create Admin</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                                    Set up a new admin account to get started
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                                <div>
                                    <label htmlFor="username" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="Enter your password"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block mb-2 font-medium text-[13px] lg:text-[0.8vw]">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="text-[12px] lg:text-[0.75vw] w-full px-4 lg:px-[1.2vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] focus:outline-none focus:ring-2 focus:ring-[#053447] focus:border-transparent transition-all"
                                        placeholder="Repeat your password"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-600 text-[12px] lg:text-[0.75vw] mb-2">{error}</div>
                                )}
                                {success && (
                                    <div className="text-green-700 text-[12px] lg:text-[0.75vw] mb-2">{success}</div>
                                )}

                                <div className="w-full">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold"
                                    >
                                        {loading ? 'Creating account...' : 'Register'}
                                    </button>
                                </div>

                                <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">
                                        Login
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none">
                            <Image
                                src="/contact-image.svg"
                                alt="Create admin illustration"
                                width={600}
                                height={600}
                                className="w-full h-auto object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}