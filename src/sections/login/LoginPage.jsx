'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
            const url = BASE ? `${BASE.replace(/\/$/, '')}/api/auth/login` : '/api/auth/login'

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    remember: formData.rememberMe
                })
            })

            let data = null
            try { data = await res.json() } catch (e) { /* non-json response */ }

            if (res.ok) {
                const token = (data && (data.token || data.access_token || (data.session && data.session.access_token))) || null
                if (token) {
                    try { localStorage.setItem('token', token) } catch (e) { /* ignore */ }
                }
                if (data && data.user) {
                    try { localStorage.setItem('user', JSON.stringify(data.user)) } catch (e) { /* ignore */ }
                }
                if (data && data.session) {
                    try { localStorage.setItem('session', JSON.stringify(data.session)) } catch (e) { /* ignore */ }
                }
                router.push('/assistant')
                return
            }

            setError((data && (data.message || data.error)) || 'Login failed')
        } catch (err) {
            setError(err.message || 'Login error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-section min-h-screen flex items-center py-10 lg:py-[3.6vw] px-4">
            <div className="wrapper w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[4vw] items-center">
                    {/* Left Side - Form */}
                    <div className="w-full order-2 lg:order-1">
                        <div className="login-form rounded-2xl lg:rounded-[1.5vw] shadow-2xl p-6 lg:p-[2vw]">
                            {/* Header */}
                            <div className="mb-6 lg:mb-[2vw]">
                                <h3 className="mb-2 lg:mb-[0.5vw] text-[16px] lg:text-[2vw] font-bold">Welcome Back</h3>
                                <p className="text-gray-600 text-[13px] lg:text-[0.9vw]">
                                    Sign in to continue to your account
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-[1.5vw]">
                                {/* Email Input */}
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

                                {/* Password Input */}
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

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="rememberMe"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                            className="w-4 h-4 lg:w-[1vw] lg:h-[1vw] text-[#053447] border-gray-400 rounded focus:ring-[#053447]"
                                        />
                                        <label htmlFor="rememberMe" className="ml-2 text-[12px] lg:text-[0.75vw] text-gray-700">
                                            Remember me
                                        </label>
                                    </div>
                                    <Link
                                        href="/forgot-password"
                                        className="text-[12px] lg:text-[0.75vw] text-[#053447] hover:text-[#2EAADB] transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                {error && (
                                    <div className="text-red-600 text-[12px] lg:text-[0.75vw] mb-2">{error}</div>
                                )}
                                <div className="w-full">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary min-w-full! block py-3 lg:py-[0.9vw] text-center font-bold"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-400"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 text-gray-500 backdrop-blur-sm text-[12px] lg:text-[0.75vw]">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                {/* Social Login Buttons */}
                                <div className="grid grid-cols-2 gap-3 lg:gap-[1vw]">
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 px-4 lg:px-[1.5vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] hover:bg-gray-50 transition-colors"
                                    >
                                        <img src="/google.svg" alt="Google" className="w-5 h-5 lg:w-[1.2vw] lg:h-[1.2vw]" />
                                        <span className="text-[12px] lg:text-[0.75vw] font-medium">Google</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 px-4 lg:px-[1.5vw] py-3 lg:py-[0.8vw] border border-gray-400 rounded-lg lg:rounded-[0.8vw] hover:bg-gray-50 transition-colors"
                                    >
                                        <img src="/facebook.svg" alt="Facebook" className="w-5 h-5 lg:w-[1.2vw] lg:h-[1.2vw]" />
                                        <span className="text-[12px] lg:text-[0.75vw] font-medium">Facebook</span>
                                    </button>
                                </div>

                                <div className="text-center text-[12px] lg:text-[0.75vw] text-gray-600">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="text-[#053447] hover:text-[#2EAADB] transition-colors font-medium">
                                        Sign up
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Side - Image */}
                    <div className="w-full order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-lg lg:max-w-none">
                            <Image
                                src="/contact-image.svg"
                                alt="Login illustration"
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

