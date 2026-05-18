"use client"

import { MagnifyingGlassIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline"
import { CameraIcon, MicrophoneIcon } from "@heroicons/react/24/solid"
import { HandThumbUpIcon, HandThumbDownIcon, ClipboardIcon } from "@heroicons/react/24/outline"
import { PencilIcon } from "@heroicons/react/24/solid"
import { useState, useRef, useEffect } from "react"

const generateChatId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const buildChatTitle = (text) => {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim()
    if (!normalized) return 'New chat'

    return normalized.slice(0, 80)
}

const formatMessageTime = (timestamp) => {
    if (!timestamp) {
        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const parsed = new Date(timestamp)
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function ChatContent() {
    const [isChatActive, setIsChatActive] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [selectedImageDataUrl, setSelectedImageDataUrl] = useState("")
    const [selectedImageName, setSelectedImageName] = useState("")
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [isLoadingThread, setIsLoadingThread] = useState(false)
    const [chatId, setChatId] = useState("")
    const [chatTitle, setChatTitle] = useState("")
    const messagesEndRef = useRef(null)
    const imageInputRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])
    const mediaStreamRef = useRef(null)
    const threadLoadSeqRef = useRef(0)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop()
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const resetComposerState = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }

        recordedChunksRef.current = []
        setIsSending(false)
        setSelectedImageDataUrl("")
        setSelectedImageName("")
        setIsRecordingAudio(false)
    }

    const loadChatThread = async (nextChatId, nextChatTitle = '') => {
        const requestSeq = ++threadLoadSeqRef.current

        resetComposerState()
        setIsLoadingThread(true)
        setIsChatActive(true)
        setMessages([])
        setInputValue("")
        setChatId(nextChatId)
        setChatTitle(nextChatTitle)

        try {
            const token = localStorage.getItem('token')
            const base = process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.NEXT_PUBLIC_API_URL || ''
            const url = base
                ? `${base.replace(/\/$/, '')}/api/chat/threads/${encodeURIComponent(nextChatId)}`
                : `/api/chat/threads/${encodeURIComponent(nextChatId)}`

            const response = await fetch(url, {
                method: 'GET',
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
                if (response.status === 404) {
                    if (threadLoadSeqRef.current === requestSeq) {
                        setChatTitle(nextChatTitle)
                        setMessages([])
                    }
                    return
                }

                const message = (data && (data.detail || data.message || data.code)) || 'Unable to load conversation.'
                throw new Error(message)
            }

            if (threadLoadSeqRef.current !== requestSeq) {
                return
            }

            const threadMessages = Array.isArray(data?.messages)
                ? data.messages.map((message, index) => ({
                    id: `${nextChatId}-${index}`,
                    text: message.content || '',
                    sender: message.role === 'assistant' ? 'ai' : 'user',
                    time: formatMessageTime(message.timestamp),
                    imageDataUrl: '',
                }))
                : []

            setMessages(threadMessages)
            setChatTitle(data?.title || nextChatTitle || '')
            setIsChatActive(true)
        } catch (error) {
            if (threadLoadSeqRef.current !== requestSeq) {
                return
            }

            setMessages([{
                text: error.message || 'Unable to load conversation.',
                sender: 'ai',
                time: currentTime(),
            }])
            setChatTitle(nextChatTitle || '')
            setIsChatActive(true)
        } finally {
            if (threadLoadSeqRef.current === requestSeq) {
                setIsLoadingThread(false)
            }
        }
    }

    useEffect(() => {
        const handleNewChat = (event) => {
            const nextChatId = String(event?.detail?.chat_id || '').trim() || generateChatId()

            threadLoadSeqRef.current += 1
            resetComposerState()
            setIsLoadingThread(false)
            setIsChatActive(false)
            setMessages([])
            setInputValue("")
            setChatId(nextChatId)
            setChatTitle("")
        }

        const handleOpenChat = (event) => {
            const nextChatId = String(event?.detail?.chat_id || '').trim()
            if (!nextChatId) return

            void loadChatThread(nextChatId, String(event?.detail?.chat_title || '').trim())
        }

        window.addEventListener('assistant-new-chat', handleNewChat)
        window.addEventListener('assistant-open-chat', handleOpenChat)

        return () => {
            window.removeEventListener('assistant-new-chat', handleNewChat)
            window.removeEventListener('assistant-open-chat', handleOpenChat)
        }
    }, [])

    const currentTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    const parseStoredJson = (key) => {
        try {
            const raw = localStorage.getItem(key)
            if (!raw) return null
            return JSON.parse(raw)
        } catch (error) {
            return null
        }
    }

    const resolveChatContext = () => {
        const defaults = parseStoredJson('api_chat_defaults') || {}
        const session = parseStoredJson('session') || {}
        const sessionUser = session.user || session.admin || {}

        const businessClientId = String(
            defaults.business_client_id ||
            session.business_client_id ||
            sessionUser.business_client_id ||
            'acme'
        ).trim()

        const workspaceId = String(
            defaults.workspace_id ||
            session.workspace_id ||
            sessionUser.workspace_id ||
            'main'
        ).trim()

        const userId = String(
            defaults.user_id ||
            session.email ||
            sessionUser.email ||
            'admin@admin.com'
        ).trim().toLowerCase()

        return {
            business_client_id: businessClientId,
            workspace_id: workspaceId,
            user_id: userId,
        }
    }

    const clearSelectedImage = () => {
        setSelectedImageDataUrl("")
        setSelectedImageName("")
        if (imageInputRef.current) {
            imageInputRef.current.value = ""
        }
    }

    const notifyChatHeadersUpdated = (nextChatId, nextChatTitle) => {
        if (typeof window === 'undefined') return

        window.dispatchEvent(new CustomEvent('assistant-chat-headers-updated', {
            detail: {
                chat_id: nextChatId,
                chat_title: nextChatTitle,
            },
        }))
    }

    const handlePickImage = () => {
        if (isLoadingThread) {
            return
        }

        imageInputRef.current?.click()
    }

    const handleImageSelected = (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setMessages(prev => [...prev, {
                text: 'Only image files are supported.',
                sender: 'ai',
                time: currentTime(),
            }])
            clearSelectedImage()
            return
        }

        const maxBytes = 5 * 1024 * 1024
        if (file.size > maxBytes) {
            setMessages(prev => [...prev, {
                text: 'Image too large. Max size is 5MB.',
                sender: 'ai',
                time: currentTime(),
            }])
            clearSelectedImage()
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const result = String(reader.result || "")
            setSelectedImageDataUrl(result)
            setSelectedImageName(file.name)
        }
        reader.onerror = () => {
            setMessages(prev => [...prev, {
                text: 'Failed to read selected image.',
                sender: 'ai',
                time: currentTime(),
            }])
            clearSelectedImage()
        }
        reader.readAsDataURL(file)
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        const query = inputValue.trim()

        if (!query || isSending || isLoadingThread) {
            return
        }

        setIsChatActive(true)
        setMessages(prev => [...prev, {
            text: query,
            sender: "user",
            time: currentTime(),
            imageDataUrl: selectedImageDataUrl || "",
        }])
        setInputValue("")
        setIsSending(true)

        try {
            const nextChatId = chatId || generateChatId()
            const nextChatTitle = chatTitle || buildChatTitle(query)

            if (!chatId) {
                setChatId(nextChatId)
            }
            if (!chatTitle) {
                setChatTitle(nextChatTitle)
            }

            const token = localStorage.getItem('token')
            const payload = {
                ...resolveChatContext(),
                query,
                chat_id: nextChatId,
                chat_title: nextChatTitle,
                ...(selectedImageDataUrl ? { image_data_url: selectedImageDataUrl } : {}),
            }

            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            })

            let data = null
            try {
                data = await response.json()
            } catch (error) {
                data = null
            }

            if (!response.ok) {
                const message = (data && (data.message || data.error || data.code)) || 'Chat request failed.'
                throw new Error(message)
            }

            const answer = (data && (data.answer || data.message)) || 'No answer returned from assistant.'
            setMessages(prev => [...prev, { text: answer, sender: 'ai', time: currentTime() }])
            clearSelectedImage()
            notifyChatHeadersUpdated(nextChatId, nextChatTitle)
        } catch (error) {
            setMessages(prev => [...prev, {
                text: error.message || 'Unable to reach assistant service right now.',
                sender: 'ai',
                time: currentTime(),
            }])
        } finally {
            setIsSending(false)
        }
    }

    const handleSendRecordedAudio = async (audioBlob) => {
        if (!audioBlob || isSending || isLoadingThread) {
            return
        }

        setIsChatActive(true)
        setIsSending(true)
        const voiceMessageId = `voice-${Date.now()}-${Math.random().toString(36).slice(2)}`
        setMessages(prev => [...prev, {
            id: voiceMessageId,
            text: 'Voice note sent',
            sender: "user",
            time: currentTime(),
        }])

        try {
            const nextChatId = chatId || generateChatId()
            const nextChatTitle = chatTitle || ''

            if (!chatId) {
                setChatId(nextChatId)
            }

            const token = localStorage.getItem('token')
            const context = resolveChatContext()
            const formData = new FormData()
            formData.append('audio_file', audioBlob, `voice-note-${Date.now()}.webm`)
            formData.append('business_client_id', context.business_client_id)
            formData.append('workspace_id', context.workspace_id)
            formData.append('user_id', context.user_id)
            formData.append('chat_id', nextChatId)
            if (nextChatTitle) {
                formData.append('chat_title', nextChatTitle)
            }

            const response = await fetch('/api/assistant/chat-voice', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            })

            let data = null
            try {
                data = await response.json()
            } catch (error) {
                data = null
            }

            if (!response.ok) {
                const message = (data && (data.message || data.error || data.code)) || 'Voice chat request failed.'
                throw new Error(message)
            }

            const answer = (data && (data.answer || data.message)) || 'No answer returned from assistant.'
            const transcript = (data && (data.transcript || data.query || '')).trim()
            const resolvedChatTitle = chatTitle || buildChatTitle(transcript || 'Voice note')

            if (!chatTitle) {
                setChatTitle(resolvedChatTitle)
            }

            setMessages(prev => prev.map((message) => {
                if (message.id !== voiceMessageId) {
                    return message
                }
                return {
                    ...message,
                    text: transcript || message.text,
                }
            }))

            setMessages(prev => [...prev, { text: answer, sender: 'ai', time: currentTime() }])
            notifyChatHeadersUpdated(nextChatId, resolvedChatTitle)
        } catch (error) {
            setMessages(prev => [...prev, {
                text: error.message || 'Unable to process voice note right now.',
                sender: 'ai',
                time: currentTime(),
            }])
        } finally {
            setIsSending(false)
        }
    }

    const startAudioRecording = async () => {
        if (isSending || isLoadingThread) {
            return
        }

        if (typeof window === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder) {
            setMessages(prev => [...prev, {
                text: 'Voice recording is not supported in this browser.',
                sender: 'ai',
                time: currentTime(),
            }])
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaStreamRef.current = stream

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : ''
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream)

            recordedChunksRef.current = []
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data)
                }
            }

            recorder.onstop = async () => {
                const chunks = recordedChunksRef.current
                recordedChunksRef.current = []

                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop())
                    mediaStreamRef.current = null
                }

                if (!chunks.length) {
                    return
                }

                const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
                await handleSendRecordedAudio(audioBlob)
            }

            recorder.start()
            mediaRecorderRef.current = recorder
            setIsRecordingAudio(true)
            setIsChatActive(true)
        } catch (error) {
            setMessages(prev => [...prev, {
                text: 'Microphone permission was denied or unavailable.',
                sender: 'ai',
                time: currentTime(),
            }])
        }
    }

    const stopAudioRecording = () => {
        const recorder = mediaRecorderRef.current
        if (!recorder) {
            return
        }

        if (recorder.state !== 'inactive') {
            recorder.stop()
        }
        mediaRecorderRef.current = null
        setIsRecordingAudio(false)
    }

    const handleMicClick = async () => {
        if (isLoadingThread) {
            return
        }

        if (isRecordingAudio) {
            stopAudioRecording()
            return
        }
        await startAudioRecording()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(e)
        }
    }

    return (
        <div className="chat-content bg-gray-300 p-3 w-full h-full">
            <div className="chatbox w-full h-full bg-white rounded-2xl relative flex flex-col">
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageSelected}
                />

                {/* logo */}
                <div className="flex justify-center w-full pt-3">
                    <img
                        src="/assets/images/chatlogo.png"
                        alt="User"
                        className="object-cover"
                    />
                </div>

                {/* center Content - only shows when chat is not active */}
                {!isChatActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 flex-col justify-center items-center w-full px-4">
                        <div className="text-center">
                            <h1 className="text-[30px]! md:text-[30px]! text-xl! mb-2">Discover the information you need in a snap!</h1>
                            <p className="text-sm md:text-base">Your Digital AI-Powered NCLEX Prep Awaits</p>
                        </div>

                        {/* input box */}
                        <div
                            className="w-full max-w-[578px] flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px] cursor-text"
                            onClick={() => setIsChatActive(true)}
                        >
                            <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Discover the information you need in a snap!"
                                className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                                onFocus={() => setIsChatActive(true)}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <MicrophoneIcon
                                className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 cursor-pointer ${isRecordingAudio ? 'text-red-500' : 'text-(--primary-color)'}`}
                                onClick={handleMicClick}
                            />
                            <CameraIcon
                                className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0 cursor-pointer"
                                onClick={handlePickImage}
                            />
                        </div>

                        {selectedImageName && (
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                {selectedImageDataUrl && (
                                    <img
                                        src={selectedImageDataUrl}
                                        alt="Selected upload"
                                        className="w-8 h-8 rounded object-cover border border-slate-200"
                                    />
                                )}
                                <span className="max-w-[320px] truncate">Attached: {selectedImageName}</span>
                                <button
                                    type="button"
                                    className="text-red-500 cursor-pointer"
                                    onClick={clearSelectedImage}
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        {/* Suggestions */}
                        <div className="flex flex-wrap justify-center items-center gap-4">
                            <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl cursor-pointer">
                                <p className="text-[10px]! md:text-[10px] text-[9px] whitespace-nowrap">Lorem Ipsum Dolor Sit</p>
                                <ArrowUpRightIcon className="w-3 h-2 text-black flex-shrink-0" />
                            </div>
                            <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl cursor-pointer">
                                <p className="text-[10px]! md:text-[10px] text-[9px] whitespace-nowrap">Lorem Ipsum Dolor Sit</p>
                                <ArrowUpRightIcon className="w-3 h-2 text-black flex-shrink-0" />
                            </div>
                            <div className="box flex items-center gap-3 bg-slate-100 p-3 rounded-xl cursor-pointer">
                                <p className="text-[10px]! md:text-[10px] text-[9px] whitespace-nowrap">Lorem Ipsum Dolor Sit</p>
                                <ArrowUpRightIcon className="w-3 h-2 text-black flex-shrink-0" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat messages area - shows when chat is active */}
                {isChatActive && (
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        {isLoadingThread && messages.length === 0 && (
                            <div className="py-8 text-center text-sm text-slate-500">
                                Loading conversation...
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={index}>
                                {message.sender === 'user' ? (
                                    // User message
                                    <div className="flex justify-end items-start gap-3 mb-6">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500">You</span>
                                                <span className="text-xs text-gray-400">{message.time}</span>
                                            </div>
                                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[600px] shadow-sm">
                                                <p className="text-sm text-gray-800">{message.text}</p>
                                                {message.imageDataUrl && (
                                                    <img
                                                        src={message.imageDataUrl}
                                                        alt="Sent upload"
                                                        className="mt-2 rounded-lg border border-gray-200 max-w-[220px] max-h-[220px] object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <ClipboardIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <PencilIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-pink-300 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm">👤</span>
                                        </div>
                                    </div>
                                ) : (
                                    // AI message
                                    <div className="flex justify-start items-start gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg">N</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500">Sohpia</span>
                                                <span className="text-xs text-gray-400">{message.time}</span>
                                            </div>
                                            <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[600px]">
                                                <p className="text-sm text-teal-400">{message.text}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <ClipboardIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <HandThumbUpIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <HandThumbDownIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                <PencilIcon className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Bottom input box - shows when chat is active */}
                {isChatActive && (
                    <div className="w-full px-4 pb-4">
                        <div className="w-full flex items-center gap-2 px-3.5 py-2.5 border border-gray-400 rounded-[30px]">
                            <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Discover the information you need in a snap!"
                                className="w-full outline-none text-[15px] text-slate-500 placeholder:text-slate-400"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                disabled={isSending || isLoadingThread}
                            />
                            <MicrophoneIcon
                                className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 cursor-pointer ${isRecordingAudio ? 'text-red-500' : 'text-(--primary-color)'}`}
                                onClick={handleMicClick}
                            />
                            <CameraIcon
                                className="w-5 h-5 md:w-6 md:h-6 text-(--primary-color) flex-shrink-0 cursor-pointer"
                                onClick={handlePickImage}
                            />
                        </div>

                        {isRecordingAudio && (
                            <div className="mt-2 text-xs text-red-500 px-2">
                                Recording voice note... tap microphone again to send.
                            </div>
                        )}

                        {selectedImageName && (
                            <div className="mt-2 text-xs text-slate-500 flex items-center gap-2 px-2">
                                {selectedImageDataUrl && (
                                    <img
                                        src={selectedImageDataUrl}
                                        alt="Selected upload"
                                        className="w-8 h-8 rounded object-cover border border-slate-200"
                                    />
                                )}
                                <span className="max-w-[300px] truncate">Attached: {selectedImageName}</span>
                                <button
                                    type="button"
                                    className="text-red-500 cursor-pointer"
                                    onClick={clearSelectedImage}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}