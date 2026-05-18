"use client";

import { useEffect, useState } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import Link from 'next/link'

import SettingDialog from "@/sections/assistant/settings/Index";
import SubscriptionDialog from "@/sections/assistant/settings/SubscriptionTab";

import {
    LifebuoyIcon,
    SparklesIcon,
    UserCircleIcon,
    SquaresPlusIcon,
    UserPlusIcon,
    ArrowUpTrayIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                'Accept': 'application/json',
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

export default function ChatbotHeader() {
    const [subscriptionOpen, setSubscriptionOpen] = useState(false);
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
                storedUser.role ||
                tokenPayload?.role ||
                tokenPayload?.user_role ||
                ''
            )
            const localPart = email.includes('@') ? email.split('@')[0] : ''
            const displayName = email || resolvedUser.username || tokenPayload?.sub || 'Account'
            const username = resolvedUser.username || (email ? `@${localPart || email}` : tokenPayload?.sub ? `@${tokenPayload.sub}` : '@account')

            setCurrentUser({
                displayName,
                username,
                role,
            })
        }

        syncProfile()

        const handleStorageChange = () => syncProfile()
        window.addEventListener('storage', handleStorageChange)

        return () => {
            cancelled = true
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    const canManageTenantSetup = ['admin', 'super_admin'].includes(currentUser?.role)

    if (currentUser === null) {
        return (
            <div className="chatbot-header">
                <header className="bg-(--header-bg) px-6 py-5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative">
                    <div className="flex items-center gap-4">
                        <div className="pl-10">
                            <h1 className="text-[20px]! font-semibold text-white mb-[2px]">
                                AI Study Companion
                            </h1>
                            <p className="text-[13px]! text-white/70">
                                AI-Powered NCLEX Prep
                            </p>
                        </div>
                    </div>
                </header>
            </div>
        )
    }

    return (
        <div className="chatbot-header">
            <header className="bg-(--header-bg) px-6 py-5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.1)] relative">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <div className="pl-10">
                        <h1 className="text-[20px]! font-semibold text-white mb-[2px]">
                            AI Study Companion
                        </h1>
                        <p className="text-[13px]! text-white/70">
                            AI-Powered NCLEX Prep
                        </p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3 flex-wrap justify-end max-w-full">
                    {canManageTenantSetup && (
                        <>
                            <Link href="/create-business" className="px-3 py-2 bg-white/95 rounded-[15px] flex items-center gap-2 justify-center cursor-pointer font-medium border border-white/15 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md shrink-0 whitespace-nowrap">
                                <SquaresPlusIcon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm text-slate-700">Create business</span>
                            </Link>
                            <Link href="/create-workspace" className="px-3 py-2 bg-white/95 rounded-[15px] flex items-center gap-2 justify-center cursor-pointer font-medium border border-white/15 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md shrink-0 whitespace-nowrap">
                                <SparklesIcon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm text-slate-700">Create workspace</span>
                            </Link>
                            <Link href="/add-document" className="px-3 py-2 bg-white/95 rounded-[15px] flex items-center gap-2 justify-center cursor-pointer font-medium border border-white/15 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md shrink-0 whitespace-nowrap">
                                <ArrowUpTrayIcon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm text-slate-700">Add document</span>
                            </Link>
                            <Link href="/create-user" className="px-3 py-2 bg-white rounded-[15px] flex items-center gap-2 justify-center cursor-pointer font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md shrink-0 whitespace-nowrap">
                                <UserPlusIcon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm text-slate-700">Create a user</span>
                            </Link>
                        </>
                    )}
                    {/* Settings Button */}
                    <SettingDialog>
                        <button className="p-3 bg-white border-none rounded-[15px] flex items-center justify-center cursor-pointer">
                            <Cog6ToothIcon className="w-5 h-5 text-slate-600" />
                        </button>
                    </SettingDialog>

                    {/* User Avatar Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-3 bg-white rounded-[15px] flex items-center justify-center cursor-pointer" aria-label="Open user menu">
                                <UserCircleIcon className="w-6 h-6 text-slate-600" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-64 bg-white text-black border border-black/10 rounded-2xl p-3 shadow-2xl"
                        >
                            {/* User Info */}
                            <div className="flex items-center gap-3 px-2 py-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <UserCircleIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{currentUser?.displayName || 'Account'}</p>
                                    <p className="text-xs text-gray-400">{currentUser?.username || '@account'}</p>
                                </div>
                            </div>

                            <DropdownMenuSeparator className="bg-black/10 my-2" />

                            {/* Upgrade Plan */}
                            <DropdownMenuItem
                                onClick={() => setSubscriptionOpen(true)}
                                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                Upgrade plan
                            </DropdownMenuItem>

                            <DropdownMenuItem className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer">
                                <UserCircleIcon className="w-4 h-4" />
                                Personalization
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-black/10 my-2" />

                            <DropdownMenuItem className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-black/5 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <LifebuoyIcon className="w-4 h-4" />
                                    Help
                                </div>
                                <ChevronRightIcon className="w-4 h-4 text-black/60" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Controlled Subscription Dialog */}
                    <SubscriptionDialog
                        open={subscriptionOpen}
                        onOpenChange={setSubscriptionOpen}
                    />
                </div>
            </header>
        </div>
    );
}
