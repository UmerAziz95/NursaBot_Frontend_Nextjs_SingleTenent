"use client";

import { useEffect, useState } from "react";
import Link from 'next/link'

import { UserCircle as UserCircleIcon, LogOut as ArrowRightOnRectangleIcon, Settings2 as ManageIcon } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logoutAndRedirect } from "@/lib/logout";

const readStoredJson = (key) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
    } catch (error) {
        return null
    }
}

const decodeJwtPayload = (token) => {
    if (typeof token !== 'string' || !token.includes('.')) return null
    try {
        const payloadPart = token.split('.')[1]
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
        return JSON.parse(atob(padded))
    } catch {
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
                'Accept': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        })
        if (!response.ok) return null
        return await response.json()
    } catch {
        return null
    }
}

export default function ChatbotHeader() {
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        let cancelled = false

        const syncProfile = async () => {
            const storedUser = readStoredJson('user') || {}
            const storedSession = readStoredJson('session') || {}
            const token = storedSession.access_token || localStorage.getItem('token') || ''
            const tokenPayload = decodeJwtPayload(storedSession.access_token || token)

            let resolvedUser = storedUser
            if ((!resolvedUser.email || !resolvedUser.role) && token) {
                const apiUser = await fetchCurrentUser(token)
                if (apiUser && typeof apiUser === 'object') {
                    resolvedUser = { ...resolvedUser, ...apiUser }
                }
            }

            if (cancelled) return

            const email = String(resolvedUser.email || '').trim()
            const role = normalizeRole(
                resolvedUser.role ||
                storedSession.role ||
                localStorage.getItem('role') ||
                tokenPayload?.role ||
                ''
            )
            const displayName = email || resolvedUser.username || tokenPayload?.sub || 'Account'

            setCurrentUser({ displayName, role })
        }

        syncProfile()

        const handleStorageChange = () => syncProfile()
        window.addEventListener('storage', handleStorageChange)
        return () => {
            cancelled = true
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    const isAdmin = ['admin', 'super_admin'].includes(currentUser?.role)

    return (
        <div className="chatbot-header">
            <header className="bg-(--header-bg) px-6 py-5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative">
                {/* Left – title */}
                <div className="flex items-center gap-4">
                    <div className="pl-10">
                        <h1 className="text-[20px]! font-semibold text-white mb-[2px]">
                            AI Assistant
                        </h1>
                        <p className="text-[13px]! text-white/70">
                            Powered by your documents
                        </p>
                    </div>
                </div>

                {/* Right – actions */}
                <div className="flex items-center gap-3">
                    {/* Manage – admin only. Add/delete actions for businesses, workspaces,
                        users, and documents all live in the Manage screen now. */}
                    {isAdmin && (
                        <Link
                            href="/manage"
                            className="px-3 py-2 bg-white/95 rounded-[15px] flex items-center gap-2 cursor-pointer font-medium border border-white/15 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md shrink-0 whitespace-nowrap"
                        >
                            <ManageIcon className="w-4 h-4 text-slate-600" />
                            <span className="text-sm text-slate-700">Manage</span>
                        </Link>
                    )}

                    {/* User account dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-3 bg-white rounded-[15px] flex items-center gap-2 cursor-pointer"
                                aria-label="Open user menu"
                            >
                                <UserCircleIcon className="w-6 h-6 text-slate-600" />
                                {currentUser && (
                                    <span className="text-sm font-medium text-slate-700 max-w-[140px] truncate hidden sm:block">
                                        {currentUser.displayName}
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-white text-black border border-black/10 rounded-2xl p-2 shadow-2xl"
                        >
                            {/* User info */}
                            <div className="px-3 py-2">
                                <p className="text-sm font-medium truncate">{currentUser?.displayName || 'Account'}</p>
                                {currentUser?.role && (
                                    <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
                                )}
                            </div>

                            <DropdownMenuSeparator className="bg-black/10 my-1" />

                            {/* Logout */}
                            <DropdownMenuItem
                                onClick={() => logoutAndRedirect('/login')}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </div>
    );
}
