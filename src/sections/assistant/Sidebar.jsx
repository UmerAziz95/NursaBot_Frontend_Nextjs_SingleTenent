"use client"

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/solid";
import SettingDialog from "@/sections/assistant/settings/Index";
import { logoutAndRedirect } from "@/lib/logout";
// import SubscriptionDialog from "@/sections/assistant/settings/SubscriptionTab";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [chatHeaders, setChatHeaders] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [activeChatId, setActiveChatId] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const generateChatId = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID()
        }

        return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    const getApiBase = () => {
        const base = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
        return base ? base.replace(/\/$/, '') : ''
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
    }

    const hideChatContextMenu = () => {
        setContextMenu(null)
    }

    const showChatContextMenu = (chat, event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!chat?.chat_id) return

        const menuWidth = 176
        const menuHeight = 56
        const x = Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12))
        const y = Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12))

        setActiveChatId(chat.chat_id)
        setContextMenu({
            chatId: chat.chat_id,
            x,
            y,
        })
    }

    const deleteChatHeader = async (chatId) => {
        const token = localStorage.getItem('token') || readStoredJson('session')?.access_token || ''
        const base = getApiBase()
        const url = base ? `${base}/api/chat/headers/${encodeURIComponent(chatId)}` : `/api/chat/headers/${encodeURIComponent(chatId)}`

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        })

        let data = null
        try {
            data = await response.json()
        } catch (error) {
            data = null
        }

        if (!response.ok) {
            const message = (data && (data.detail || data.message || data.code)) || 'Failed to delete chat.'
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

        const fetchChatHeaders = async () => {
            const token = localStorage.getItem('token') || readStoredJson('session')?.access_token || ''
            if (!token) {
                setChatHeaders([])
                return
            }

            setIsLoadingChats(true)
            setChatError(null)

            try {
                const base = getApiBase()
                const url = base ? `${base}/api/chat/headers/me` : '/api/chat/headers/me'
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: 'include',
                })

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null)
                    throw new Error((errorBody && (errorBody.detail || errorBody.message)) || 'Failed to load chats')
                }

                const data = await response.json()
                if (cancelled) return
                setChatHeaders(Array.isArray(data?.chats) ? data.chats : [])
            } catch (error) {
                if (cancelled) return
                setChatHeaders([])
                setChatError(error.message || 'Failed to load chats')
            } finally {
                if (cancelled) return
                setIsLoadingChats(false)
            }
        }

        const handleRefresh = (event) => {
            if (event?.detail?.chat_id) {
                setActiveChatId(String(event.detail.chat_id))
            }
            fetchChatHeaders()
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
        const chatTitle = 'New chat'

        setActiveChatId(chatId)

        setChatHeaders(prev => [{
            chat_id: chatId,
            title: chatTitle,
            user_id: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, ...prev.filter((chat) => chat.chat_id !== chatId)])

        window.dispatchEvent(new CustomEvent('assistant-new-chat', {
            detail: { chat_id: chatId },
        }))
    }

    const handleLogout = async () => {
        if (isLoggingOut) {
            return
        }

        setIsLoggingOut(true)

        try {
            await logoutAndRedirect('/login')
        } catch (error) {
            window.location.replace('/login')
        }
    }

    const getChatTitle = (chat) => {
        const title = String(chat?.title || '').trim()
        if (title) return title

        const chatId = String(chat?.chat_id || '').trim()
        if (!chatId) return 'Untitled chat'

        return chatId.length > 28 ? `${chatId.slice(0, 28)}...` : chatId
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-opacity-50 z-40 md:hidden"
                    onClick={() => {
                        hideChatContextMenu()
                        setIsOpen(false)
                    }}
                />
            )}

            <div className="h-screen relative flex">
                {/* Sidebar */}
                {isOpen && (
                    <aside className="w-57.5 h-full bg-white flex flex-col justify-between p-5 shadow-[2px_0_10px_rgba(0,0,0,0.05)] overflow-y-auto fixed md:relative z-50 md:z-auto">
                        <div className="flex flex-col gap-4">
                            {/* Logo */}
                            <div className="flex items-center gap-2.5 mb-10">
                                <span className="font-semibold text-[20px] text-slate-800">
                                    Logo ipsum
                                </span>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px]">
                                <MagnifyingGlassIcon className="w-8 h-8 text-(--primary-color)" />
                                <input
                                    type="text"
                                    placeholder="Search here..."
                                    className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                                />
                            </div>

                            {/* New Chat */ }
                            <button
                                type="button"
                                onClick={handleNewChat}
                                className="flex items-center justify-center gap-1 px-4 py-3 text-white rounded-[30px] font-medium bg-(--primary-color)"
                            >
                                <span className="lg:text-[1vw] sm:text-[2vw]">New Chat</span>
                                <span className="lg:text-[1.2vw]">+</span>
                            </button>

                            {/* Library */}
                            <div className="flex-1">
                                <h3 className="text-[16px] font-semibold text-black tracking-wide mb-2">
                                    LIBRARY
                                </h3>

                                {isLoadingChats && (
                                    <p className="text-[13px] text-slate-400 px-3 py-2">Loading chats...</p>
                                )}

                                {!isLoadingChats && chatError && (
                                    <p className="text-[13px] text-red-500 px-3 py-2">{chatError}</p>
                                )}

                                {!isLoadingChats && !chatError && (
                                    <ul className="space-y-1 text-[14px] text-[#918b8b]">
                                        {chatHeaders.length > 0 ? (
                                            chatHeaders.map((chat) => (
                                                <li
                                                    key={chat.chat_id}
                                                    className={`px-3 py-2.5 rounded-lg cursor-pointer ${activeChatId === chat.chat_id ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50'}`}
                                                    title={getChatTitle(chat)}
                                                    onClick={() => openChat(chat)}
                                                    onContextMenu={(event) => showChatContextMenu(chat, event)}
                                                >
                                                    {getChatTitle(chat)}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-3 py-2.5 rounded-lg text-slate-400">
                                                No chats yet
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Account */}
                        <div className="">
                            <h3 className="text-[15px] font-semibold tracking-wide">
                                ACCOUNT
                            </h3>

                            <button className="w-full flex items-center gap-2 text-left py-2.5 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50">
                                <InformationCircleIcon className="w-6 h-6" />
                                Help
                            </button>

                            <SettingDialog>
                                <button className="w-full flex items-center gap-2 mb-4 text-left py-2.5 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50">
                                    <Cog6ToothIcon className="w-6 h-6" />
                                    Settings
                                </button>
                            </SettingDialog>
{/* 
                            <SubscriptionDialog>
                                <button className="w-full flex items-center gap-2 mb-4 text-left py-2.5 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50">
                                    <CreditCardIcon className="w-6 h-6" />
                                    Subscription
                                </button>
                            </SubscriptionDialog> */}

                            {/* Logout */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex items-center justify-center gap-3 py-3 px-5 w-full bg-red-600 text-white rounded-[30px] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <ArrowLeftOnRectangleIcon className="w-6 h-6 text-white" />
                                <span className="text-sm">{isLoggingOut ? 'Logging out...' : 'logout'}</span>
                            </button>
                        </div>
                    </aside>
                )}

                {contextMenu && (
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
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                    const chatId = contextMenu.chatId
                                    hideChatContextMenu()

                                    try {
                                        await deleteChatHeader(chatId)
                                    } catch (error) {
                                        setChatError(error.message || 'Failed to delete chat.')
                                    }
                                }}
                            >
                                Delete chat
                            </button>
                        </div>
                    </div>
                )}

                {/* Toggle Button - Moves with sidebar state */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-3 bg-(--primary-color) border-2 border-white rounded-full flex items-center justify-center cursor-pointer fixed top-[2%] transition-all duration-300 z-50 ${isOpen ? 'left-[200px] md:left-[200px]' : 'left-[10px]'
                        }`}
                >
                    {isOpen ? (
                        <ChevronDoubleLeftIcon className="w-5 h-5 text-white font-extrabold" />
                    ) : (
                        <ChevronDoubleRightIcon className="w-5 h-5 text-white font-extrabold" />
                    )}
                </div>
            </div>
        </>
    );
}