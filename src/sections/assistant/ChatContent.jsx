"use client"

import {
    ArrowDown as ArrowDownIcon,
    ArrowUp as ArrowUpIcon,
    BookOpenCheck as BookOpenCheckIcon,
    Check as CheckIcon,
    ChevronDown as ChevronDownIcon,
    ClipboardList as ClipboardListIcon,
    Copy as CopyIcon,
    GitCompareArrows as CompareIcon,
    ImagePlus as ImagePlusIcon,
    Loader2 as LoaderIcon,
    Mic as MicrophoneIcon,
    RotateCcw as RetryIcon,
    ShieldAlert as ShieldAlertIcon,
    Square as StopIcon,
    Trash2 as TrashIcon,
    TriangleAlert as AlertIcon,
    X as CloseIcon,
} from "lucide-react"
import { useState, useRef, useEffect, useLayoutEffect } from "react"
import BrandMark from "@/sections/assistant/BrandMark"
import ChatMarkdown from "@/sections/assistant/ChatMarkdown"
import {
    ANSWER_MODES,
    DEFAULT_ANSWER_MODE,
    answerModeByKey,
    loadChatAnswerMode,
    saveChatAnswerMode,
} from "@/sections/assistant/answerModes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
const MAX_QUERY_CHARS = 5000
const QUERY_COUNTER_FROM = 4000
const MAX_VOICE_SECONDS = 120
const VOICE_WARNING_SECONDS = 105
const MAX_AUDIO_BYTES = 5 * 1024 * 1024
const COMPOSER_MAX_HEIGHT = 200

const SUGGESTIONS = [
    {
        icon: ShieldAlertIcon,
        label: "Clinical priorities",
        prompt: "What are the priority nursing interventions for a patient in diabetic ketoacidosis?",
    },
    {
        icon: BookOpenCheckIcon,
        label: "Practice quiz",
        prompt: "Quiz me with 3 NCLEX-style questions on cardiac medications, then explain each answer.",
    },
    {
        icon: CompareIcon,
        label: "Compare concepts",
        prompt: "Compare left-sided and right-sided heart failure in a simple table.",
    },
    {
        icon: ClipboardListIcon,
        label: "Care planning",
        prompt: "Help me write a nursing care plan for a post-op patient at risk for infection.",
    },
]

const greetingForHour = (hour) => {
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
}

const firstNameFrom = (value) => {
    const text = String(value || "").trim()
    if (!text) return ""
    const base = text.includes("@") ? text.split("@")[0].split(/[._-]+/)[0] : text.split(/\s+/)[0]
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : ""
}

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
    // New chats start on the default mode; a changed mode is remembered per chat.
    const [answerMode, setAnswerMode] = useState(DEFAULT_ANSWER_MODE)
    const [copiedKey, setCopiedKey] = useState("")
    const [showJumpToLatest, setShowJumpToLatest] = useState(false)
    const [greeting, setGreeting] = useState({ salutation: "Hello", name: "" })
    const messagesEndRef = useRef(null)
    const scrollContainerRef = useRef(null)
    const textareaRef = useRef(null)
    const copiedTimerRef = useRef(null)
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
        if (messages.length === 0 && !isSending) {
            scrollContainerRef.current?.scrollTo({ top: 0 })
            return
        }
        scrollToBottom()
    }, [messages, isSending])

    useEffect(() => {
        const updateGreeting = () => {
            let name = ""
            try {
                const user = JSON.parse(localStorage.getItem("user") || "null") || {}
                name = firstNameFrom(user.display_name || user.name || user.email)
            } catch {
                name = ""
            }
            setGreeting({ salutation: greetingForHour(new Date().getHours()), name })
        }

        updateGreeting()
        window.addEventListener("assistant-profile-updated", updateGreeting)
        return () => {
            window.removeEventListener("assistant-profile-updated", updateGreeting)
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        }
    }, [])

    // Grow the composer with its content, up to a cap, then scroll inside it.
    // Re-measure on width changes too (e.g. the sidebar collapsing).
    const resizeComposer = () => {
        const el = textareaRef.current
        if (!el) return
        if (!el.value) {
            // An empty textarea's scrollHeight includes a wrapped placeholder; use the CSS min-height.
            el.style.height = ""
            el.style.overflowY = "hidden"
            return
        }
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`
        el.style.overflowY = el.scrollHeight > COMPOSER_MAX_HEIGHT ? "auto" : "hidden"
    }

    useLayoutEffect(() => {
        resizeComposer()
    }, [inputValue])

    useEffect(() => {
        const el = textareaRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        let lastWidth = el.clientWidth
        const observer = new ResizeObserver(() => {
            if (el.clientWidth !== lastWidth) {
                lastWidth = el.clientWidth
                resizeComposer()
            }
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const handleThreadScroll = () => {
        const el = scrollContainerRef.current
        if (!el) return
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        setShowJumpToLatest(distanceFromBottom > 240)
    }

    const handleInputChange = (value) => {
        if (value.length > MAX_QUERY_CHARS) {
            setInputValue(value.slice(0, MAX_QUERY_CHARS))
            toast.warning(`Messages can be up to ${MAX_QUERY_CHARS.toLocaleString()} characters. Extra text was removed.`)
            return
        }
        setInputValue(value)
    }

    const changeAnswerMode = (modeKey) => {
        setAnswerMode(modeKey)
        // A brand-new chat has no id until its first message; that send saves the mode.
        saveChatAnswerMode(chatId, modeKey)
        textareaRef.current?.focus()
    }

    const copyMessage = (key, text) => {
        if (typeof navigator === "undefined" || !navigator.clipboard) return
        void navigator.clipboard.writeText(text || "").then(() => {
            setCopiedKey(key)
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
            copiedTimerRef.current = setTimeout(() => setCopiedKey(""), 1600)
        }).catch(() => toast.error("Couldn't copy to clipboard."))
    }

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
        setAnswerMode(loadChatAnswerMode(nextChatId))

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
                isError: true,
            }])
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
            setAnswerMode(DEFAULT_ANSWER_MODE)
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

        if (query.length > MAX_QUERY_CHARS) {
            toast.error(`Messages can be up to ${MAX_QUERY_CHARS.toLocaleString()} characters. Please shorten your message.`)
            return
        }

        await submitQuery(query, selectedImages.map(image => image.dataUrl))
    }

    // Sends a text query. `echo` controls whether the user's message is appended
    // (false when retrying, since the original message is already on screen).
    const submitQuery = async (query, attachedImages = [], { echo = true } = {}) => {
        if (!query || isSending || isLoadingThread) {
            return
        }

        if (echo) {
            setMessages(prev => [...prev, {
                text: query,
                sender: "user",
                time: currentTime(),
                imageDataUrls: attachedImages,
            }])
            setInputValue("")
        }
        setIsSending(true)
        const modeAtSend = answerMode

        try {
            const nextChatId = chatId || generateChatId()
            const nextChatTitle = chatTitle || buildChatTitle(query)

            if (!chatId) {
                setChatId(nextChatId)
            }
            if (!chatTitle) {
                setChatTitle(nextChatTitle)
            }
            if (!chatId) {
                saveChatAnswerMode(nextChatId, modeAtSend)
            }

            const token = localStorage.getItem('token')
            const payload = {
                ...resolveChatContext(),
                query,
                chat_id: nextChatId,
                chat_title: nextChatTitle,
                answer_mode: modeAtSend,
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
                if (code === 'token_quota_exceeded') {
                    window.location.href = '/tokens?reason=quota'
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

            setMessages(prev => [...prev, { text: answer, sender: 'ai', time: currentTime(), mode: modeAtSend }])
            clearSelectedImage()
            notifyChatHeadersUpdated(savedChatId, savedChatTitle)
        } catch (error) {
            const message = friendlyChatError(error.message)
            setMessages(prev => [...prev, {
                text: message,
                sender: 'ai',
                time: currentTime(),
                isError: true,
                retry: { query, images: attachedImages },
            }])
        } finally {
            setIsSending(false)
        }
    }

    const retryMessage = (failedMessage) => {
        if (!failedMessage?.retry?.query || isSending || isLoadingThread) return
        setMessages(prev => prev.filter(message => message !== failedMessage))
        void submitQuery(failedMessage.retry.query, failedMessage.retry.images || [], { echo: false })
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
        const modeAtSend = answerMode

        try {
            const nextChatId = chatId || generateChatId()
            const nextChatTitle = chatTitle || ''

            if (!chatId) {
                setChatId(nextChatId)
                saveChatAnswerMode(nextChatId, modeAtSend)
            }

            const token = localStorage.getItem('token')
            const context = resolveChatContext()
            const formData = new FormData()
            formData.append('audio_file', audioBlob, `voice-note-${Date.now()}.webm`)
            formData.append('business_client_id', context.business_client_id)
            formData.append('workspace_id', context.workspace_id)
            formData.append('user_id', context.user_id)
            formData.append('chat_id', nextChatId)
            formData.append('answer_mode', modeAtSend)
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

            setMessages(prev => [...prev, { text: answer, sender: 'ai', time: currentTime(), mode: modeAtSend }])
            notifyChatHeadersUpdated(nextChatId, resolvedChatTitle)
        } catch (error) {
            const message = friendlyVoiceError(error.message)
            setMessages(prev => [...prev, {
                text: message,
                sender: 'ai',
                time: currentTime(),
                isError: true,
            }])
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

                if (audioBlob.size > MAX_AUDIO_BYTES) {
                    toast.error('This voice note is larger than 5 MB. Please record a shorter message.')
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
                if (recordingSecondsRef.current >= MAX_VOICE_SECONDS) {
                    stopAudioRecording()
                    toast.info('Voice notes are limited to 2 minutes. Recording stopped — review it and press send.')
                }
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
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
            e.preventDefault()
            handleSendMessage(e)
        }
    }

    const siteName = appSettings.site_name || 'nclexium'
    const composerDisabled = isSending || isLoadingThread
    const canSubmit = !composerDisabled && (isRecordingAudio || Boolean(pendingAudio) || Boolean(inputValue.trim()))
    const showWelcome = !isLoadingThread && messages.length === 0
    const currentMode = answerModeByKey(answerMode)
    const CurrentModeIcon = currentMode.icon

    const renderComposer = () => (
        <div className="nb-composer-wrap">
            {isRecordingAudio && (
                <div className="nb-composer-banner is-recording">
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
                    <span className={`font-mono text-sm tabular-nums ${recordingSeconds >= VOICE_WARNING_SECONDS ? 'font-semibold text-amber-600' : 'text-red-600'}`}>
                        {formatDuration(recordingSeconds)} / {formatDuration(MAX_VOICE_SECONDS)}
                    </span>
                    {recordingSeconds >= VOICE_WARNING_SECONDS && (
                        <span className="hidden text-xs font-medium text-amber-600 sm:inline">
                            Stops in {MAX_VOICE_SECONDS - recordingSeconds}s
                        </span>
                    )}
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
                <div className="nb-composer-banner">
                    <span className="nb-composer-banner-icon">
                        <MicrophoneIcon className="w-4 h-4" />
                    </span>
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

            <form onSubmit={handleSendMessage} className={`nb-composer ${composerDisabled ? 'is-busy' : ''}`}>
                {selectedImages.length > 0 && (
                    <div className="nb-composer-attachments">
                        {selectedImages.map((image) => (
                            <div key={image.id} className="group relative">
                                <img src={image.dataUrl} alt={image.name} className="nb-composer-thumb" />
                                <button
                                    type="button"
                                    onClick={() => removeSelectedImage(image.id)}
                                    className="nb-composer-thumb-remove"
                                    aria-label={`Remove ${image.name}`}
                                    title="Remove image"
                                >
                                    <CloseIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={isRecordingAudio ? 'Recording voice note…' : (pendingAudio ? 'Voice note attached' : `Ask ${siteName} anything about nursing…`)}
                    className="nb-composer-input user-portal-chat-message"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={composerDisabled || isRecordingAudio || Boolean(pendingAudio)}
                    aria-label="Message"
                />

                <div className="nb-composer-toolbar">
                    <div className="flex min-w-0 items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={`nb-mode-trigger ${answerMode !== DEFAULT_ANSWER_MODE ? 'is-custom' : ''}`}
                                    aria-label={`Answer mode: ${currentMode.label}. Change answer mode`}
                                    title="Answer mode"
                                >
                                    <CurrentModeIcon className="h-4 w-4" />
                                    <span className="nb-mode-trigger-label">{currentMode.label}</span>
                                    <ChevronDownIcon className="nb-mode-trigger-chevron h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                sideOffset={10}
                                collisionPadding={12}
                                className="nb-mode-menu w-72 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(5,52,71,0.28)]"
                            >
                                <DropdownMenuLabel className="nb-mode-menu-label">Answer mode</DropdownMenuLabel>
                                {ANSWER_MODES.map(({ key, label, description, icon: Icon }) => {
                                    const selected = key === answerMode
                                    return (
                                        <DropdownMenuItem
                                            key={key}
                                            onSelect={() => changeAnswerMode(key)}
                                            className={`nb-mode-option ${selected ? 'is-selected' : ''}`}
                                        >
                                            <span className="nb-mode-option-icon"><Icon className="h-4 w-4" /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="nb-mode-option-label">
                                                    {label}
                                                    {key === DEFAULT_ANSWER_MODE && <span className="nb-mode-option-default">Default</span>}
                                                </span>
                                                <span className="nb-mode-option-desc">{description}</span>
                                            </span>
                                            {selected && <CheckIcon className="nb-mode-option-check h-4 w-4" />}
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="nb-composer-toolbar-sep" aria-hidden="true" />
                        <button
                            type="button"
                            onClick={handlePickImage}
                            disabled={composerDisabled || isRecordingAudio || selectedImages.length >= MAX_IMAGES}
                            className="nb-composer-tool"
                            aria-label="Attach image"
                            title={
                                selectedImages.length >= MAX_IMAGES
                                    ? `Maximum ${MAX_IMAGES} images`
                                    : `Attach images (${selectedImages.length}/${MAX_IMAGES})`
                            }
                        >
                            <ImagePlusIcon className="w-[18px] h-[18px]" />
                        </button>
                        {appSettings.voice_chat_enabled ? (
                            <button
                                type="button"
                                onClick={handleMicClick}
                                disabled={composerDisabled}
                                className={`nb-composer-tool ${isRecordingAudio ? 'is-recording' : ''}`}
                                aria-label={isRecordingAudio ? 'Stop recording' : 'Record voice note'}
                                title={isRecordingAudio ? 'Stop recording' : (pendingAudio ? 'Record again' : 'Record voice note')}
                            >
                                <MicrophoneIcon className="w-[18px] h-[18px]" />
                            </button>
                        ) : null}
                        {selectedImages.length > 0 && (
                            <span className="nb-composer-count">{selectedImages.length}/{MAX_IMAGES} images</span>
                        )}
                        {inputValue.length >= QUERY_COUNTER_FROM && (
                            <span
                                className={`nb-composer-count ${inputValue.length >= MAX_QUERY_CHARS ? 'is-limit' : 'is-near'}`}
                                aria-live="polite"
                            >
                                {inputValue.length.toLocaleString()} / {MAX_QUERY_CHARS.toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="nb-composer-hint">
                            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> new line
                        </span>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="nb-composer-send"
                            aria-label="Send message"
                            title="Send message"
                        >
                            {isSending
                                ? <LoaderIcon className="w-4 h-4 animate-spin" />
                                : <ArrowUpIcon className="w-4 h-4" strokeWidth={2.5} />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )

    const renderWelcome = () => (
        <div className="nb-welcome">
            <BrandMark size="lg" />
            <h2 className="nb-welcome-title">
                {greeting.salutation}{greeting.name ? `, ${greeting.name}` : ''}
            </h2>
            <p className="nb-welcome-desc">
                I&apos;m {siteName}, your nursing study companion. Ask about NCLEX topics,
                clinical reasoning, medications or care plans.
            </p>

            <div className="nb-suggestions">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                    <button
                        key={label}
                        type="button"
                        className="nb-suggestion"
                        onClick={() => void submitQuery(prompt)}
                        disabled={composerDisabled}
                    >
                        <span className="nb-suggestion-icon">
                            <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                            <span className="nb-suggestion-label">{label}</span>
                            <span className="nb-suggestion-prompt">{prompt}</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )

    const renderMessage = (message, index) => {
        const key = message.id || `msg-${index}`

        if (message.sender === 'user') {
            const images = Array.isArray(message.imageDataUrls) ? message.imageDataUrls : []
            return (
                <div key={key} className="nb-msg nb-msg-user">
                    <div className="nb-msg-user-bubble user-portal-chat-message">
                        {images.length > 0 && (
                            <div className={`mb-2 grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {images.map((dataUrl, imageIndex) => (
                                    <img
                                        key={imageIndex}
                                        src={dataUrl}
                                        alt={`Attachment ${imageIndex + 1}`}
                                        className="max-h-[220px] w-full rounded-xl object-cover"
                                    />
                                ))}
                            </div>
                        )}
                        {message.text}
                    </div>
                    <span className="nb-msg-meta">{message.time}</span>
                </div>
            )
        }

        return (
            <div key={key} className={`nb-msg nb-msg-ai ${message.isError ? 'is-error' : ''}`}>
                {message.isError ? (
                    <span className="nb-msg-error-avatar" aria-hidden="true">
                        <AlertIcon className="w-3.5 h-3.5" />
                    </span>
                ) : (
                    <BrandMark size="sm" />
                )}
                <div className="min-w-0 flex-1">
                    <div className="nb-msg-head">
                        <span className="nb-msg-author">{message.isError ? 'Something went wrong' : siteName}</span>
                        <span className="nb-msg-time">{message.time}</span>
                        {!message.isError && message.mode && (
                            <span className="nb-msg-mode">{answerModeByKey(message.mode).label}</span>
                        )}
                    </div>

                    {message.isError ? (
                        <p className="nb-msg-error-text">{message.text}</p>
                    ) : (
                        <ChatMarkdown>{message.text}</ChatMarkdown>
                    )}

                    <div className="nb-msg-actions">
                        {message.isError ? (
                            message.retry ? (
                                <button
                                    type="button"
                                    className="nb-msg-action is-strong"
                                    onClick={() => retryMessage(message)}
                                    disabled={composerDisabled}
                                >
                                    <RetryIcon className="w-3.5 h-3.5" />
                                    Try again
                                </button>
                            ) : null
                        ) : (
                            <button
                                type="button"
                                className="nb-msg-action"
                                onClick={() => copyMessage(key, message.text)}
                                aria-label="Copy response"
                            >
                                {copiedKey === key ? (
                                    <>
                                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <CopyIcon className="w-3.5 h-3.5" />
                                        Copy
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="nb-chat chat-content">
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelected}
            />

            <div ref={scrollContainerRef} onScroll={handleThreadScroll} className="nb-chat-scroll">
                <div className={`nb-chat-thread ${showWelcome ? 'is-empty' : ''}`}>
                    {isLoadingThread && messages.length === 0 && (
                        <div className="nb-skeleton" role="status" aria-label="Loading conversation">
                            <div className="nb-skeleton-row is-user"><span style={{ width: '42%' }} /></div>
                            <div className="nb-skeleton-row">
                                <span className="nb-skeleton-avatar" />
                                <div className="flex-1 space-y-2">
                                    <span style={{ width: '88%' }} />
                                    <span style={{ width: '72%' }} />
                                    <span style={{ width: '54%' }} />
                                </div>
                            </div>
                            <div className="nb-skeleton-row is-user"><span style={{ width: '30%' }} /></div>
                        </div>
                    )}

                    {showWelcome && renderWelcome()}

                    {messages.map(renderMessage)}

                    {isSending && (
                        <div className="nb-msg nb-msg-ai" aria-live="polite" aria-label="Assistant is responding">
                            <BrandMark size="sm" pulse />
                            <div className="nb-thinking">
                                <span className="nb-thinking-dots" aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                </span>
                                Thinking…
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="nb-chat-dock">
                {showJumpToLatest && (
                    <button
                        type="button"
                        className="nb-jump"
                        onClick={scrollToBottom}
                        aria-label="Jump to latest message"
                        title="Jump to latest"
                    >
                        <ArrowDownIcon className="w-4 h-4" />
                    </button>
                )}
                <div className="nb-chat-dock-inner">
                    {renderComposer()}
                    <p className="nb-chat-footnote">
                        {siteName} can make mistakes. Verify important clinical information.
                    </p>
                </div>
            </div>
        </div>
    )
}
