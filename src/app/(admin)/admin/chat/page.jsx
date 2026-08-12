'use client'

import AdminShell from '@/sections/admin/AdminShell'
import AdminChatContextBar from '@/sections/admin/AdminChatContextBar'
import Sidebar from '@/sections/assistant/Sidebar'
import ChatContent from '@/sections/assistant/ChatContent'
import { useAppSettings } from '@/lib/app-settings'

export default function AdminChatPage() {
    const { settings, loading } = useAppSettings()

    return (
        <AdminShell
            title="Chat"
            subtitle="Test the assistant against a business and workspace."
            contentClassName="overflow-hidden flex flex-col"
        >
            {loading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                    Loading chat settings…
                </div>
            ) : settings.maintenance_mode ? (
                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-center text-amber-900">
                        <p className="text-sm font-semibold">Maintenance mode is on</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-amber-800/90">
                            {settings.maintenance_message || 'Chat is paused while maintenance is active.'}
                        </p>
                    </div>
                </div>
            ) : !settings.admin_chat_enabled ? (
                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="max-w-md rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">Admin chat is disabled</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                            Turn on Admin chat in Settings to use this console again.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <AdminChatContextBar />
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        <Sidebar />
                        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                            <ChatContent />
                        </div>
                    </div>
                </>
            )}
        </AdminShell>
    )
}
