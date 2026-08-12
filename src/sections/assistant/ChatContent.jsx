"use client"

import { ArrowUp as ArrowUpIcon, Camera as CameraIcon, Mic as MicrophoneIcon, Clipboard as ClipboardIcon, Square as StopIcon, Trash2 as TrashIcon, X as CloseIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import {
    extractApiErrorMessage,
    friendlyChatError,
    friendlyLoadChatError,
    friendlyVoiceError,
} from "@/lib/friendly-assistant-error"
import { toast } from "@/lib/toast"
import { useAppSettings } from "@/lib/app-settings"

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const formatDuration = (totalSeconds) => {
    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
    const minutes = Math.floor(safeSeconds / 60)
    const seconds = safeSeconds % 60

    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

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
    const { settings: appSettings } = useAppSettings()
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [selectedImages, setSelectedImages] = useState([])
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [recordingSeconds, setRecordingSeconds] = useState(0)
    const [pendingAudio, setPendingAudio] = useState(null)
    const [isLoadingThread, setIsLoadingThread] = useState(false)
    const [chatId, setChatId] = useState("")
    const [chatTitle, setChatTitle] = useState("")
    const messagesEndRef = useRef(null)
    const imageInputRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])
    const mediaStreamRef = useRef(null)
    const threadLoadSeqRef = useRef(0)
    const recordingTimerRef = useRef(null)
    const recordingSecondsRef = useRef(0)
    const discardRecordingRef = useRef(false)
    const pendingAudioUrlRef = useRef("")
    const sendRecordedAudioRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isSending])

    useEffect(() => {
        const busy = Boolean(isSending || isLoadingThread)
        window.dispatchEvent(new CustomEvent('assistant-activity', {
            detail: {
                busy,
                status: isSending ? 'thinking' : (isLoadingThread ? 'loading' : 'ready'),
            },
        }))
    }, [isSending, isLoadingThread])

    useEffect(() => {
        return () => {
            window.dispatchEvent(new CustomEvent('assistant-activity', {
                detail: { busy: false, status: 'ready' },
            }))
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }
            if (pendingAudioUrlRef.current) {
                URL.revokeObjectURL(pendingAudioUrlRef.current)
                pendingAudioUrlRef.current = ""
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                discardRecordingRef.current = true
                mediaRecorderRef.current.stop()
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const stopRecordingTimer = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
    }

    const clearPendingAudio = () => {
        if (pendingAudioUrlRef.current) {
            URL.revokeObjectURL(pendingAudioUrlRef.current)
            pendingAudioUrlRef.current = ""
        }
        setPendingAudio(null)
    }

    const resetComposerState = () => {
        discardRecordingRef.current = true
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        mediaRecorderRef.current = null
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }

        stopRecordingTimer()
        recordedChunksRef.current = []
        recordingSecondsRef.current = 0
        clearPendingAudio()
        setRecordingSeconds(0)
        setIsSending(false)
        setSelectedImages([])
        setIsRecordingAudio(false)
    }

    const loadChatThread = async (nextChatId, nextChatTitle = '') => {
        const requestSeq = ++threadLoadSeqRef.current

        resetComposerState()
        setIsLoadingThread(true)
        setMessages([])
        setInputValue("")
        setChatId(nextChatId)
        setChatTitle(nextChatTitle)

        try {
            const session = parseStoredJson('session') || {}
            const token = localStorage.getItem('token') || session.access_token || ''
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
                const message = friendlyLoadChatError(extractApiErrorMessage(data), {
                    code: data?.code,
                })
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
                    imageDataUrls: [],
                }))
                : []

            setMessages(threadMessages)
            setChatTitle(data?.title || nextChatTitle || '')
        } catch (error) {
            if (threadLoadSeqRef.current !== requestSeq) {
                return
            }

            setMessages([{
                text: friendlyLoadChatError(error.message),
                sender: 'ai',
                time: currentTime(),
            }])
            toast.error(friendlyLoadChatError(error.message))
            setChatTitle(nextChatTitle || '')
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
        const user = parseStoredJson('user') || {}
        const sessionUser = session.user || session.admin || {}
        const role = String(user.role || sessionUser.role || session.role || '').trim().toLowerCase()
        const isAdminUser = ['admin', 'super_admin'].includes(role)

        // Admins chat against the tenant they pick in Account settings.
        // Site users always chat against the business/workspace they were assigned at signup.
        const businessClientId = String(
            isAdminUser
                ? (
                    defaults.business_client_id ||
                    session.business_client_id ||
                    sessionUser.business_client_id ||
                    user.business_client_id ||
                    'default'
                )
                : (
                    user.business_client_id ||
                    session.business_client_id ||
                    sessionUser.business_client_id ||
                    localStorage.getItem('business_client_id') ||
                    'default'
                )
        ).trim()

        const workspaceId = String(
            isAdminUser
                ? (
                    defaults.workspace_id ||
                    session.workspace_id ||
                    sessionUser.workspace_id ||
                    user.workspace_id ||
                    'default'
                )
                : (
                    user.workspace_id ||
                    session.workspace_id ||
                    sessionUser.workspace_id ||
                    localStorage.getItem('workspace_id') ||
                    'default'
                )
        ).trim()

        const userId = String(
            user.email ||
            session.email ||
            sessionUser.email ||
            defaults.user_id ||
            ''
        ).trim().toLowerCase()

        return {
            business_client_id: businessClientId,
            workspace_id: workspaceId,
            user_id: userId,
        }
    }

    const clearSelectedImage = () => {
        setSelectedImages([])
        if (imageInputRef.current) {
            imageInputRef.current.value = ""
        }
    }

    const removeSelectedImage = (imageId) => {
        setSelectedImages(prev => prev.filter(image => image.id !== imageId))
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
        if (isLoadingThread || selectedImages.length >= MAX_IMAGES) {
            return
        }

        imageInputRef.current?.click()
    }

    const readImageFile = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
        reader.readAsDataURL(file)
    })

    const handleImageSelected = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        const remainingSlots = MAX_IMAGES - selectedImages.length
        if (remainingSlots <= 0) {
            toast.error(`You can attach up to ${MAX_IMAGES} images.`)
            if (imageInputRef.current) imageInputRef.current.value = ""
            return
        }

        const problems = []
        const accepted = []

        for (const file of files) {
            if (accepted.length >= remainingSlots) {
                problems.push(`Only ${MAX_IMAGES} images can be attached at once.`)
                break
            }
            if (!file.type.startsWith('image/')) {
                problems.push(`${file.name} is not an image.`)
                continue
            }
            if (file.size > MAX_IMAGE_BYTES) {
                problems.push(`${file.name} is larger than 5MB.`)
                continue
            }
            accepted.push(file)
        }

        try {
            const loaded = await Promise.all(accepted.map(async (file) => ({
                id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: file.name,
                dataUrl: await readImageFile(file),
            })))

            if (loaded.length) {
                setSelectedImages(prev => [...prev, ...loaded].slice(0, MAX_IMAGES))
            }
        } catch (error) {
            problems.push(error.message || 'Failed to read selected image.')
        }

        if (problems.length) {
            toast.error(problems.join(' '))
        }

        if (imageInputRef.current) {
            imageInputRef.current.value = ""
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()

        if (isSending || isLoadingThread) {
            return
        }

        if (isRecordingAudio) {
            stopAudioRecording({ autoSend: true })
            return
        }

        if (pendingAudio?.blob) {
            const audioBlob = pendingAudio.blob
            clearPendingAudio()
            await handleSendRecordedAudio(audioBlob)
            return
        }

        const query = inputValue.trim()

        if (!query) {
            return
        }
        const attachedImages = selectedImages.map(image => image.dataUrl)

        setMessages(prev => [...prev, {
            text: query,
            sender: "user",
            time: currentTime(),
            imageDataUrls: attachedImages,
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
                ...(attachedImages.length
                    ? { image_data_url: attachedImages[0], image_data_urls: attachedImages }
                    : {}),
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
                const code = String(data?.code || '').toLowerCase()
                if (code === 'subscription_expired' || code === 'subscription_required') {
                    const reason = code === 'subscription_expired' ? 'expired' : 'required'
                    window.location.href = `/plans?reason=${reason}`
                    return
                }
                const message = friendlyChatError(extractApiErrorMessage(data), { code })
                throw new Error(message)
            }

            const answer = (data && (data.answer || data.message)) || 'No answer returned from assistant.'
            const savedChatId = String(data?.chat_id || nextChatId).trim() || nextChatId
            const savedChatTitle = String(data?.chat_title || nextChatTitle).trim() || nextChatTitle

            if (savedChatId !== chatId) {
                setChatId(savedChatId)
            }
            if (savedChatTitle && savedChatTitle !== chatTitle) {
                setChatTitle(savedChatTitle)
            }

            setMessages(prev => [...prev, { text: answer, sender: 'ai', time: currentTime() }])
            clearSelectedImage()
            notifyChatHeadersUpdated(savedChatId, savedChatTitle)
        } catch (error) {
            const message = friendlyChatError(error.message)
            setMessages(prev => [...prev, {
                text: message,
                sender: 'ai',
                time: currentTime(),
            }])
            toast.error(message)
        } finally {
            setIsSending(false)
        }
    }

    const handleSendRecordedAudio = async (audioBlob) => {
        if (!audioBlob || isSending || isLoadingThread) {
            return
        }
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
                const message = friendlyVoiceError(extractApiErrorMessage(data), {
                    code: data?.code,
                })
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
            const message = friendlyVoiceError(error.message)
            setMessages(prev => [...prev, {
                text: message,
                sender: 'ai',
                time: currentTime(),
            }])
            toast.error(message)
        } finally {
            setIsSending(false)
        }
    }

    useEffect(() => {
        sendRecordedAudioRef.current = handleSendRecordedAudio
    })

    const pickRecorderMimeType = () => {
        if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
            return ''
        }

        const candidates = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
        ]

        return candidates.find(type => MediaRecorder.isTypeSupported(type)) || ''
    }

    const startAudioRecording = async () => {
        if (isSending || isLoadingThread || isRecordingAudio) {
            return
        }

        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            toast.error('Voice recording is not supported in this browser.')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaStreamRef.current = stream

            const mimeType = pickRecorderMimeType()
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream)

            clearPendingAudio()
            recordedChunksRef.current = []
            discardRecordingRef.current = false

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data)
                }
            }

            recorder.onerror = () => {
                discardRecordingRef.current = true
                toast.error('Recording stopped unexpectedly. Please try again.')
            }

            recorder.onstop = () => {
                const chunks = recordedChunksRef.current
                const discarded = discardRecordingRef.current
                const autoSend = Boolean(recorder.autoSendOnStop)
                const duration = recordingSecondsRef.current

                recordedChunksRef.current = []
                discardRecordingRef.current = false
                recordingSecondsRef.current = 0
                stopRecordingTimer()
                setRecordingSeconds(0)
                setIsRecordingAudio(false)

                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop())
                    mediaStreamRef.current = null
                }

                if (discarded || !chunks.length) {
                    if (!discarded) {
                        toast.error('No audio was captured. Please try recording again.')
                    }
                    return
                }

                const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })

                if (audioBlob.size < 1024) {
                    toast.error('Recording was too short. Hold on a bit longer before stopping.')
                    return
                }

                if (autoSend) {
                    sendRecordedAudioRef.current?.(audioBlob)
                    return
                }

                const previewUrl = URL.createObjectURL(audioBlob)
                pendingAudioUrlRef.current = previewUrl
                setPendingAudio({ blob: audioBlob, url: previewUrl, duration })
            }

            recorder.start(250)
            mediaRecorderRef.current = recorder

            recordingSecondsRef.current = 0
            setRecordingSeconds(0)
            setIsRecordingAudio(true)

            stopRecordingTimer()
            recordingTimerRef.current = setInterval(() => {
                recordingSecondsRef.current += 1
                setRecordingSeconds(recordingSecondsRef.current)
            }, 1000)
        } catch (error) {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop())
                mediaStreamRef.current = null
            }
            toast.error(
                error?.name === 'NotAllowedError'
                    ? 'Microphone access was blocked. Allow microphone permission for this site and try again.'
                    : 'Microphone is unavailable right now. Check that a mic is connected and not in use.'
            )
        }
    }

    const stopAudioRecording = ({ discard = false, autoSend = false } = {}) => {
        const recorder = mediaRecorderRef.current
        if (!recorder) {
            setIsRecordingAudio(false)
            return
        }

        discardRecordingRef.current = discard
        recorder.autoSendOnStop = autoSend && !discard

        if (recorder.state !== 'inactive') {
            recorder.requestData?.()
            recorder.stop()
        }
        mediaRecorderRef.current = null
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

    const composerDisabled = isSending || isLoadingThread
    const canSubmit = !composerDisabled && (isRecordingAudio || Boolean(pendingAudio) || Boolean(inputValue.trim()))

    const renderComposer = ({ className = '' } = {}) => (
        <div className={className}>
            {isRecordingAudio && (
                <div className="mb-2 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                    <span className="text-sm font-medium text-red-600">Recording</span>
                    <span className="flex items-end gap-0.5" aria-hidden="true">
                        {[0, 1, 2, 3, 4].map((bar) => (
                            <span
                                key={bar}
                                className="w-0.5 rounded-full bg-red-400"
                                style={{
                                    height: '14px',
                                    animation: `recording-bar 1s ease-in-out ${bar * 0.12}s infinite`,
                                }}
                            />
                        ))}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-red-600">{formatDuration(recordingSeconds)}</span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => stopAudioRecording({ discard: true })}
                            className="rounded-full p-1.5 text-red-500 transition hover:bg-red-100"
                            aria-label="Discard recording"
                            title="Discard recording"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => stopAudioRecording()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                        >
                            <StopIcon className="w-3 h-3 fill-current" />
                            Stop
                        </button>
                    </div>
                </div>
            )}

            {!isRecordingAudio && pendingAudio && (
                <div className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                    <MicrophoneIcon className="w-4 h-4 shrink-0 text-[#10a37f]" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700">Voice note ready</p>
                        <p className="text-xs text-slate-500">{formatDuration(pendingAudio.duration)} · press send to submit</p>
                    </div>
                    <audio src={pendingAudio.url} controls className="ml-auto h-8 max-w-[220px]" />
                    <button
                        type="button"
                        onClick={clearPendingAudio}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                        aria-label="Discard voice note"
                        title="Discard voice note"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm transition focus-within:border-slate-300 focus-within:shadow-md">
                {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pt-3">
                        {selectedImages.map((image) => (
                            <div key={image.id} className="group relative">
                                <img
                                    src={image.dataUrl}
                                    alt={image.name}
                                    className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSelectedImage(image.id)}
                                    className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-slate-700"
                                    aria-label={`Remove ${image.name}`}
                                    title="Remove image"
                                >
                                    <CloseIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-2 px-4 py-3"
                >
                    <input
                        type="text"
                        placeholder={isRecordingAudio ? 'Recording voice note...' : (pendingAudio ? 'Voice note attached' : 'Message NursingAI...')}
                        className="min-w-0 flex-1 bg-transparent outline-none user-portal-chat-message text-slate-800 placeholder:text-slate-400 py-0.5"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={composerDisabled || isRecordingAudio || Boolean(pendingAudio)}
                    />
                    <div className="flex items-center gap-1 shrink-0 pb-0.5">
                        {appSettings.voice_chat_enabled ? (
                            <button
                                type="button"
                                onClick={handleMicClick}
                                disabled={composerDisabled}
                                className={`p-2 rounded-full transition disabled:opacity-50 ${isRecordingAudio ? 'bg-red-500 text-white hover:bg-red-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                aria-label={isRecordingAudio ? 'Stop recording' : 'Record voice note'}
                                title={isRecordingAudio ? 'Stop recording' : (pendingAudio ? 'Record again' : 'Record voice note')}
                            >
                                <MicrophoneIcon className="w-4 h-4" />
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={handlePickImage}
                            disabled={composerDisabled || isRecordingAudio || selectedImages.length >= MAX_IMAGES}
                            className="p-2 rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                            aria-label="Attach image"
                            title={
                                selectedImages.length >= MAX_IMAGES
                                    ? `Maximum ${MAX_IMAGES} images`
                                    : `Attach images (${selectedImages.length}/${MAX_IMAGES})`
                            }
                        >
                            <CameraIcon className="w-4 h-4" />
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-8 h-8 rounded-full bg-slate-900 text-white inline-flex items-center justify-center transition hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <ArrowUpIcon className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )

    return (
        <div className="chat-content w-full h-full min-h-0 min-w-0 overflow-hidden bg-[#f7f7f8]">
            <div className="chatbox w-full h-full min-h-0 flex flex-col overflow-hidden">
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelected}
                />

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-6 space-y-6">
                        {isLoadingThread && messages.length === 0 && (
                            <div className="py-16 text-center text-sm text-slate-500">
                                Loading conversation...
                            </div>
                        )}
                        {!isLoadingThread && messages.length === 0 && (
                            <div className="min-h-[280px] flex flex-col items-center justify-center text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-[#10a37f] text-white text-sm font-semibold inline-flex items-center justify-center mb-4">
                                    N
                                </div>
                                <p className="user-portal-chat-empty-title mb-2">
                                    How can I help you today?
                                </p>
                                <p className="user-portal-chat-empty-desc">
                                    Ask about NCLEX topics, nursing concepts, or exam prep.
                                </p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            message.sender === 'user' ? (
                                <div key={index} className="flex justify-end">
                                    <div className="max-w-[85%] md:max-w-[75%] rounded-[22px] bg-[#f4f4f4] px-4 py-2.5 user-portal-chat-message text-slate-800 whitespace-pre-wrap">
                                        {message.text}
                                        {Array.isArray(message.imageDataUrls) && message.imageDataUrls.length > 0 && (
                                            <div className={`mt-2 grid gap-2 ${message.imageDataUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {message.imageDataUrls.map((dataUrl, imageIndex) => (
                                                    <img
                                                        key={imageIndex}
                                                        src={dataUrl}
                                                        alt={`Attachment ${imageIndex + 1}`}
                                                        className="rounded-xl border border-slate-200 max-h-[220px] w-full object-cover"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div key={index} className="flex items-start gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white text-sm font-semibold inline-flex items-center justify-center shrink-0 mt-0.5">
                                        N
                                    </div>
                                    <div className="min-w-0 flex-1 rounded-2xl bg-[#eaf7f2] px-4 py-3">
                                        <p className="user-portal-chat-message text-slate-800 whitespace-pre-wrap">
                                            {message.text}
                                        </p>
                                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-white/70 hover:text-slate-700"
                                                onClick={() => {
                                                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                                        void navigator.clipboard.writeText(message.text || '')
                                                    }
                                                }}
                                            >
                                                <ClipboardIcon className="w-3.5 h-3.5" />
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                        {isSending && (
                            <div className="flex items-start gap-3" aria-live="polite" aria-label="Assistant is responding">
                                <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white text-sm font-semibold inline-flex items-center justify-center shrink-0">
                                    N
                                </div>
                                <div className="rounded-2xl bg-[#eaf7f2] px-4 py-3 inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[typing-dot_1.2s_ease-in-out_infinite]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[typing-dot_1.2s_ease-in-out_0.2s_infinite]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[typing-dot_1.2s_ease-in-out_0.4s_infinite]" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="shrink-0 bg-[#f7f7f8] px-4 md:px-6 pb-4 pt-2">
                    <div className="max-w-3xl mx-auto">
                        {renderComposer()}
                        <p className="user-portal-chat-footnote">
                            NursingAI can make mistakes. Verify important clinical information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}