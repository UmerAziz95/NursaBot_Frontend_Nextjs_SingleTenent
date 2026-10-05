"use client"

import { useEffect, useMemo, useState } from "react";
import { Search as MagnifyingGlassIcon, LogOut as ArrowLeftOnRectangleIcon, Settings as Cog6ToothIcon, PanelLeftClose as PanelLeftCloseIcon, PanelLeftOpen as PanelLeftOpenIcon, SquarePen as SquarePenIcon, Pencil as PencilIcon, Trash2 as TrashIcon, Check as CheckIcon, X as XIcon, MessagesSquare as MessagesSquareIcon } from "lucide-react";
import SettingDialog from "@/sections/assistant/settings/Index";
import BrandMark from "@/sections/assistant/BrandMark";
import { useAppSettings } from "@/lib/app-settings";
import { logoutAndRedirect } from "@/lib/logout";
import { fetchLaravel } from "@/lib/laravel-api";
import { friendlyChatError } from "@/lib/friendly-assistant-error";
import { toast } from "@/lib/toast";
// import SubscriptionDialog from "@/sections/assistant/settings/SubscriptionTab";

const DAY_MS = 24 * 60 * 60 * 1000;

// Buckets chats into recency groups (Today, Yesterday, ...) by last activity.
const groupChatsByRecency = (chats) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = startOfToday.getTime();

    const groups = [
        { label: 'Today', chats: [] },
        { label: 'Yesterday', chats: [] },
        { label: 'Previous 7 days', chats: [] },
        { label: 'Previous 30 days', chats: [] },
        { label: 'Older', chats: [] },
    ];

    chats.forEach((chat) => {
        const stamp = new Date(chat?.updated_at || chat?.created_at || 0).getTime();
        const at = Number.isNaN(stamp) ? 0 : stamp;
        if (at >= today) groups[0].chats.push(chat);
        else if (at >= today - DAY_MS) groups[1].chats.push(chat);
        else if (at >= today - 7 * DAY_MS) groups[2].chats.push(chat);
        else if (at >= today - 30 * DAY_MS) groups[3].chats.push(chat);
        else groups[4].chats.push(chat);
    });

    return groups.filter((group) => group.chats.length > 0);
};

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768;

// True when two chat lists would render identically (same chats, order and titles).
const sameChatList = (a, b) => (
    a.length === b.length
    && a.every((chat, index) => chat.chat_id === b[index].chat_id && chat.title === b[index].title)
);

export default function Sidebar() {
    const { settings: appSettings } = useAppSettings();
    const [isOpen, setIsOpen] = useState(true);
    const [chatHeaders, setChatHeaders] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [activeChatId, setActiveChatId] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [editingChatId, setEditingChatId] = useState('');
    const [editingTitle, setEditingTitle] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const session = JSON.parse(localStorage.getItem('session') || 'null')
            const role = String(user?.role || session?.role || localStorage.getItem('role') || '').toLowerCase()
            setIsStaff(['admin', 'super_admin', 'sub_admin'].includes(role))
        } catch {
            setIsStaff(false)
        }
        if (isMobileViewport()) {
            setIsOpen(false)
        }
    }, [])

    const closeOnMobile = () => {
        if (isMobileViewport()) {
            setIsOpen(false)
        }
    }

    const generateChatId = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID()
        }

        return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    const readStoredJson = (key) => {
        try {
            const raw = localStorage.getItem(key)
            if (!raw) return null
            return JSON.parse(raw)
        } catch (error) {
            return null
        }
    }

    const openChat = (chat) => {
        if (!chat?.chat_id) return

        setActiveChatId(chat.chat_id)
        window.dispatchEvent(new CustomEvent('assistant-open-chat', {
            detail: {
                chat_id: chat.chat_id,
                chat_title: chat.title || 'New chat',
            },
        }))
        closeOnMobile()
    }

    const hideChatContextMenu = () => {
        setContextMenu(null)
    }

    const showChatContextMenu = (chat, event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!chat?.chat_id) return

        const menuWidth = 176
        const menuHeight = 96
        const x = Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12))
        const y = Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12))

        setActiveChatId(chat.chat_id)
        setContextMenu({
            chatId: chat.chat_id,
            title: getChatTitle(chat),
            x,
            y,
        })
    }

    const startRenameChat = (chat) => {
        if (!chat?.chat_id) return
        hideChatContextMenu()
        setEditingChatId(chat.chat_id)
        setEditingTitle(getChatTitle(chat))
    }

    const cancelRenameChat = () => {
        setEditingChatId('')
        setEditingTitle('')
        setIsRenaming(false)
    }

    const renameChatHeader = async (chatId, nextTitle) => {
        const title = String(nextTitle || '').trim()
        if (!chatId || !title) {
            throw new Error('Chat name is required.')
        }

        const response = await fetchLaravel(`/api/chat/headers/${encodeURIComponent(chatId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ title }),
        })

        let data = null
        try {
            data = await response.json()
        } catch (error) {
            data = null
        }

        if (!response.ok) {
            const message = friendlyChatError((data && (data.detail || data.message || data.code)) || 'Failed to rename chat.', {
                code: data?.code,
            })
            throw new Error(message)
        }

        const savedTitle = String(data?.title || title).trim()
        setChatHeaders((prev) => prev.map((chat) => (
            chat.chat_id === chatId
                ? { ...chat, title: savedTitle, updated_at: new Date().toISOString() }
                : chat
        )))
        cancelRenameChat()
        return data
    }

    const saveRenameChat = async () => {
        if (!editingChatId || isRenaming) return
        setIsRenaming(true)
        try {
            await renameChatHeader(editingChatId, editingTitle)
        } catch (error) {
            toast.error(error.message || 'Failed to rename chat.')
        } finally {
            setIsRenaming(false)
        }
    }

    const deleteChatHeader = async (chatId) => {
        const response = await fetchLaravel(`/api/chat/headers/${encodeURIComponent(chatId)}`, {
            method: 'DELETE',
        })

        let data = null
        try {
            data = await response.json()
        } catch (error) {
            data = null
        }

        if (!response.ok) {
            const message = friendlyChatError((data && (data.detail || data.message || data.code)) || 'Failed to delete chat.', {
                code: data?.code,
            })
            throw new Error(message)
        }

        const remainingChats = chatHeaders.filter((chat) => chat.chat_id !== chatId)
        const nextActiveChatId = activeChatId === chatId
            ? (remainingChats[0]?.chat_id || generateChatId())
            : activeChatId

        setChatHeaders(remainingChats)

        if (activeChatId === chatId) {
            const nextChat = remainingChats[0] || null
            if (nextChat) {
                setActiveChatId(nextChat.chat_id)
                window.dispatchEvent(new CustomEvent('assistant-open-chat', {
                    detail: {
                        chat_id: nextChat.chat_id,
                        chat_title: nextChat.title || 'Conversation',
                    },
                }))
            } else {
                setActiveChatId(nextActiveChatId)
                window.dispatchEvent(new CustomEvent('assistant-new-chat', {
                    detail: { chat_id: nextActiveChatId },
                }))
            }
        }

        window.dispatchEvent(new CustomEvent('assistant-chat-headers-updated', {
            detail: { chat_id: nextActiveChatId },
        }))

        return data
    }

    useEffect(() => {
        let cancelled = false
        let latestRequest = 0

        // `silent` refreshes (after each answer) update the list in place: no loading
        // skeleton, and a failure keeps the current list instead of clearing it.
        const fetchChatHeaders = async ({ silent = false } = {}) => {
            if (!readStoredJson('session')?.access_token && !localStorage.getItem('token')) {
                setChatHeaders([])
                return
            }

            const requestId = ++latestRequest
            if (!silent) {
                setIsLoadingChats(true)
            }

            try {
                const response = await fetchLaravel('/api/chat/headers/me')

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null)
                    throw new Error(friendlyChatError((errorBody && (errorBody.detail || errorBody.message)) || 'Failed to load chats', {
                        code: errorBody?.code,
                    }))
                }

                const data = await response.json()
                // Ignore responses that arrive after a newer request was started.
                if (cancelled || requestId !== latestRequest) return
                const chats = Array.isArray(data?.chats) ? data.chats : []
                // Hide empty draft chats; only show saved conversations.
                const visible = chats.filter((chat) => {
                    const title = String(chat?.title || '').trim().toLowerCase()
                    return title !== '' && title !== 'new chat' && title !== 'untitled chat'
                })
                setChatHeaders((prev) => (sameChatList(prev, visible) ? prev : visible))
            } catch (error) {
                if (cancelled || requestId !== latestRequest) return
                if (!silent) {
                    setChatHeaders([])
                    toast.error(error.message || 'Failed to load chats')
                }
            } finally {
                if (!cancelled && !silent && requestId === latestRequest) {
                    setIsLoadingChats(false)
                }
            }
        }

        const handleRefresh = (event) => {
            if (event?.detail?.chat_id) {
                setActiveChatId(String(event.detail.chat_id))
            }
            // Optimistically upsert returned chat into sidebar before refetch.
            const nextChatId = String(event?.detail?.chat_id || '').trim()
            const nextChatTitle = String(event?.detail?.chat_title || '').trim()
            if (nextChatId && nextChatTitle && nextChatTitle.toLowerCase() !== 'new chat') {
                setChatHeaders((prev) => {
                    const existing = prev.find((chat) => chat.chat_id === nextChatId)
                    // Already the newest chat with this title: leave the list untouched.
                    if (existing && prev[0]?.chat_id === nextChatId && existing.title === nextChatTitle) {
                        return prev
                    }
                    const others = prev.filter((chat) => chat.chat_id !== nextChatId)
                    return [{
                        ...existing,
                        chat_id: nextChatId,
                        title: nextChatTitle,
                        user_id: existing?.user_id || '',
                        created_at: existing?.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }, ...others]
                })
            }
            fetchChatHeaders({ silent: true })
        }

        const handleOpenChatSync = (event) => {
            const nextChatId = String(event?.detail?.chat_id || '').trim()
            if (nextChatId) {
                setActiveChatId(nextChatId)
            }
        }

        const handleNewChatSync = (event) => {
            const nextChatId = String(event?.detail?.chat_id || '').trim()
            if (nextChatId) {
                setActiveChatId(nextChatId)
            }
        }

        fetchChatHeaders()
        window.addEventListener('assistant-chat-headers-updated', handleRefresh)
        window.addEventListener('assistant-open-chat', handleOpenChatSync)
        window.addEventListener('assistant-new-chat', handleNewChatSync)

        return () => {
            cancelled = true
            window.removeEventListener('assistant-chat-headers-updated', handleRefresh)
            window.removeEventListener('assistant-open-chat', handleOpenChatSync)
            window.removeEventListener('assistant-new-chat', handleNewChatSync)
        }
    }, [])

    const handleNewChat = () => {
        const chatId = generateChatId()
        setActiveChatId(chatId)

        // Keep at most one draft "New chat" in the sidebar (empty conversations).
        setChatHeaders((prev) => {
            const withoutEmptyDrafts = prev.filter((chat) => {
                const title = String(chat?.title || '').trim().toLowerCase()
                return title !== 'new chat' && title !== 'untitled chat'
            })
            return withoutEmptyDrafts
        })

        window.dispatchEvent(new CustomEvent('assistant-new-chat', {
            detail: { chat_id: chatId },
        }))
        closeOnMobile()
    }

    const handleLogout = async () => {
        if (isLoggingOut) {
            return
        }

        setIsLoggingOut(true)

        const role = String(
            readStoredJson('user')?.role ||
            readStoredJson('session')?.role ||
            localStorage.getItem('role') ||
            ''
        ).toLowerCase()
        const redirectTo = ['admin', 'super_admin', 'sub_admin'].includes(role) ? '/admin/signin' : '/signin'

        try {
            await logoutAndRedirect(redirectTo)
        } catch (error) {
            window.location.replace(redirectTo)
        }
    }

    const getChatTitle = (chat) => {
        const title = String(chat?.title || '').trim()
        if (title) return title

        const chatId = String(chat?.chat_id || '').trim()
        if (!chatId) return 'Untitled chat'

        return chatId.length > 28 ? `${chatId.slice(0, 28)}...` : chatId
    }

    const filteredChatHeaders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return chatHeaders
        return chatHeaders.filter((chat) => getChatTitle(chat).toLowerCase().includes(query))
    }, [chatHeaders, searchQuery])

    const renderChatTitle = (title) => {
        const query = searchQuery.trim()
        if (!query) return title

        const index = title.toLowerCase().indexOf(query.toLowerCase())
        if (index < 0) return title

        return (
            <>
                {title.slice(0, index)}
                <mark className="rounded-[3px] bg-[#D7F0F8] px-0.5 text-[#053447]">{title.slice(index, index + query.length)}</mark>
                {title.slice(index + query.length)}
            </>
        )
    }

    const sidebarToggleButtonClass = "user-portal-sidebar-icon-btn"

    // The dialog is mounted once below and opened via this event, so it also
    // works from the top bar menu while the sidebar is collapsed.
    const openSettings = (tab = 'profile') => {
        window.dispatchEvent(new CustomEvent('assistant-open-settings', { detail: { tab } }))
    }

    return (
        <>
            {isStaff ? null : <SettingDialog />}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                    onClick={() => {
                        hideChatContextMenu()
                        setIsOpen(false)
                    }}
                />
            )}

            <div className={`h-full shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-[268px]' : 'w-14'}`}>
                <aside className={`user-portal-sidebar h-full w-full flex flex-col overflow-hidden ${isOpen ? 'fixed inset-y-0 left-0 z-50 md:static md:z-auto' : ''}`}>
                    {isOpen ? (
                        <>
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="user-portal-sidebar-header">
                                <BrandMark size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="user-portal-sidebar-brand">{appSettings.site_name || 'nclexium'}</p>
                                    <p className="user-portal-sidebar-subtitle">Nursing study assistant</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Collapse sidebar"
                                    title="Collapse sidebar"
                                    onClick={() => setIsOpen(false)}
                                    className={sidebarToggleButtonClass}
                                >
                                    <PanelLeftCloseIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="shrink-0 px-3 pt-3 pb-2 space-y-2.5">
                                <button
                                    type="button"
                                    onClick={handleNewChat}
                                    className="user-portal-sidebar-btn"
                                >
                                    <SquarePenIcon className="w-4 h-4" />
                                    New chat
                                </button>

                                <label className="user-portal-sidebar-search">
                                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search chats..."
                                        aria-label="Search chats"
                                        autoComplete="off"
                                    />
                                    {searchQuery ? (
                                        <button
                                            type="button"
                                            className="user-portal-sidebar-icon-btn !h-6 !w-6"
                                            aria-label="Clear search"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    ) : null}
                                </label>
                            </div>

                            <div className="flex-1 min-h-0 flex flex-col px-2 pb-2">
                                <div className="flex-1 min-h-0 overflow-y-auto nb-sidebar-scroll">
                                    {isLoadingChats && (
                                        <div className="space-y-1.5 px-2 py-2" role="status" aria-label="Loading chats">
                                            {[78, 64, 86, 58, 70].map((width, index) => (
                                                <span key={index} className="nb-sidebar-skeleton" style={{ width: `${width}%` }} />
                                            ))}
                                        </div>
                                    )}

                                    {!isLoadingChats && chatHeaders.length === 0 && (
                                        <div className="nb-sidebar-empty">
                                            <span className="nb-sidebar-empty-icon">
                                                <MessagesSquareIcon className="w-4 h-4" />
                                            </span>
                                            <p className="nb-sidebar-empty-title">No conversations yet</p>
                                            <p className="user-portal-caption">Your chats will appear here.</p>
                                        </div>
                                    )}

                                    {!isLoadingChats && chatHeaders.length > 0 && filteredChatHeaders.length === 0 && (
                                        <p className="user-portal-caption px-2 py-3">
                                            No chats match “{searchQuery.trim()}”.
                                        </p>
                                    )}

                                    {!isLoadingChats && filteredChatHeaders.length > 0 && (
                                        (searchQuery.trim()
                                            ? [{ label: `Results · ${filteredChatHeaders.length}`, chats: filteredChatHeaders }]
                                            : groupChatsByRecency(filteredChatHeaders)
                                        ).map((group) => (
                                        <div key={group.label} className="nb-sidebar-group">
                                        <p className="user-portal-sidebar-section-label px-2 pb-1">{group.label}</p>
                                        <ul className="w-full space-y-0.5">
                                            {group.chats.map((chat) => {
                                                const title = getChatTitle(chat)
                                                const isActive = activeChatId === chat.chat_id

                                                return (
                                                    <li key={chat.chat_id} className="group relative w-full">
                                                        {editingChatId === chat.chat_id ? (
                                                            <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white border border-slate-200">
                                                                <input
                                                                    type="text"
                                                                    value={editingTitle}
                                                                    autoFocus
                                                                    disabled={isRenaming}
                                                                    onChange={(event) => setEditingTitle(event.target.value)}
                                                                    onKeyDown={(event) => {
                                                                        if (event.key === 'Enter') {
                                                                            event.preventDefault()
                                                                            void saveRenameChat()
                                                                        }
                                                                        if (event.key === 'Escape') {
                                                                            event.preventDefault()
                                                                            cancelRenameChat()
                                                                        }
                                                                    }}
                                                                    className="min-w-0 flex-1 bg-transparent outline-none text-[13px] text-slate-800 px-1"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                                                    disabled={isRenaming}
                                                                    onClick={() => void saveRenameChat()}
                                                                    aria-label="Save chat name"
                                                                >
                                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                                                                    disabled={isRenaming}
                                                                    onClick={cancelRenameChat}
                                                                    aria-label="Cancel rename"
                                                                >
                                                                    <XIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className={`user-portal-sidebar-chat ${isActive ? 'is-active' : ''}`}>
                                                                <button
                                                                    type="button"
                                                                    className={`user-portal-sidebar-item min-w-0 flex-1 text-left truncate ${isActive ? 'is-active' : ''}`}
                                                                    title={title}
                                                                    onClick={() => openChat(chat)}
                                                                    onContextMenu={(event) => showChatContextMenu(chat, event)}
                                                                    onDoubleClick={() => startRenameChat(chat)}
                                                                >
                                                                    <span className="min-w-0 truncate">{renderChatTitle(title)}</span>
                                                                </button>
                                                                <div className="flex items-center pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                                                                    <button
                                                                        type="button"
                                                                        className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-700"
                                                                        title="Rename chat"
                                                                        aria-label="Rename chat"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation()
                                                                            startRenameChat(chat)
                                                                        }}
                                                                    >
                                                                        <PencilIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-red-600"
                                                                        title="Delete chat"
                                                                        aria-label="Delete chat"
                                                                        onClick={async (event) => {
                                                                            event.stopPropagation()
                                                                            hideChatContextMenu()
                                                                            if (!window.confirm('Delete this chat? It will be hidden from the sidebar.')) {
                                                                                return
                                                                            }
                                                                            try {
                                                                                await deleteChatHeader(chat.chat_id)
                                                                            } catch (error) {
                                                                                toast.error(error.message || 'Failed to delete chat.')
                                                                            }
                                                                        }}
                                                                    >
                                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                        </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {isStaff ? null : (
                            <div className="user-portal-sidebar-footer">
                                <p className="user-portal-sidebar-section-label px-2 mb-1.5">
                                    Account
                                </p>

                                <button
                                    type="button"
                                    onClick={() => openSettings()}
                                    className="user-portal-sidebar-footer-link"
                                >
                                    <Cog6ToothIcon className="w-4 h-4 shrink-0" />
                                    Settings
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="user-portal-sidebar-footer-link is-danger disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-4 h-4 shrink-0" />
                                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                                </button>
                            </div>
                        )}
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center gap-1.5 py-3 px-1.5">
                            <BrandMark size="sm" className="mb-2" />
                            <button
                                type="button"
                                aria-label="Expand sidebar"
                                title="Expand sidebar"
                                onClick={() => setIsOpen(true)}
                                className={sidebarToggleButtonClass}
                            >
                                <PanelLeftOpenIcon className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                aria-label="New chat"
                                title="New chat"
                                onClick={handleNewChat}
                                className={sidebarToggleButtonClass}
                            >
                                <SquarePenIcon className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                aria-label="Search chats"
                                title="Search chats"
                                onClick={() => setIsOpen(true)}
                                className={sidebarToggleButtonClass}
                            >
                                <MagnifyingGlassIcon className="w-4 h-4" />
                            </button>
                            {isStaff ? null : (
                                <button
                                    type="button"
                                    aria-label="Settings"
                                    title="Settings"
                                    onClick={() => openSettings()}
                                    className={`${sidebarToggleButtonClass} mt-auto`}
                                >
                                    <Cog6ToothIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </aside>

                {contextMenu && isOpen && (
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={hideChatContextMenu}
                        onContextMenu={(event) => {
                            event.preventDefault()
                            hideChatContextMenu()
                        }}
                    >
                        <div
                            className="absolute min-w-44 bg-white rounded-xl shadow-2xl border border-black/10 py-2 overflow-hidden"
                            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                            onClick={(event) => event.stopPropagation()}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                    const chat = chatHeaders.find((item) => item.chat_id === contextMenu.chatId) || {
                                        chat_id: contextMenu.chatId,
                                        title: contextMenu.title,
                                    }
                                    startRenameChat(chat)
                                }}
                            >
                                Rename chat
                            </button>
                            <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                    const chatId = contextMenu.chatId
                                    hideChatContextMenu()

                                    if (!window.confirm('Delete this chat? It will be hidden from the sidebar.')) {
                                        return
                                    }

                                    try {
                                        await deleteChatHeader(chatId)
                                    } catch (error) {
                                        toast.error(error.message || 'Failed to delete chat.')
                                    }
                                }}
                            >
                                Delete chat
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}