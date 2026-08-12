'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/components/RequireAuth'
import RequireUser from '@/components/RequireUser'
import RequirePlan from '@/components/RequirePlan'
import Sidebar from '@/sections/assistant/Sidebar'
import ChatbotHeader from '@/sections/assistant/ChatbotHeader'
import ChatContent from '@/sections/assistant/ChatContent'
import { isAdminRole } from '@/components/RequireAdmin'
import { useAppSettings } from '@/lib/app-settings'

function AssistantBlocked({ title, message }) {
    return (
        <div className="user-portal flex h-screen w-full items-center justify-center bg-[#F4F7FA] px-4">
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
            </div>
        </div>
    )
}

function AssistantInner() {
    const router = useRouter()
    const [ready, setReady] = useState(false)
    const { settings, loading } = useAppSettings()

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const role = user?.role || session?.role || localStorage.getItem('role') || ''
            if (isAdminRole(role)) {
                router.replace('/admin/chat')
                return
            }
        } catch {
            // Continue as regular user if role cannot be read.
        }
        setReady(true)
    }, [router])

    if (!ready || loading) {
        return (
            <div className="flex h-screen items-center justify-center user-portal-page-desc">
                Opening assistant…
            </div>
        )
    }

    if (settings.maintenance_mode) {
        return (
            <AssistantBlocked
                title="Maintenance in progress"
                message={settings.maintenance_message || 'Please try again soon.'}
            />
        )
    }

    if (!settings.user_chat_enabled) {
        return (
            <AssistantBlocked
                title="Chat is temporarily unavailable"
                message="The assistant is currently disabled by the site administrator."
            />
        )
    }

    return (
        <div className="user-portal assistant-page flex h-screen w-full overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
                <ChatbotHeader />
                <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                    <ChatContent />
                </div>
            </div>
        </div>
    )
}

export default function AssistantPage() {
    return (
        <RequireAuth>
            <RequireUser redirectTo="/admin/chat">
                <RequirePlan>
                    <AssistantInner />
                </RequirePlan>
            </RequireUser>
        </RequireAuth>
    )
}
