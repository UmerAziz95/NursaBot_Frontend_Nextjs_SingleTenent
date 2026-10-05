import { userFacingError } from '@/lib/user-facing-error'

const DEFAULT_CHAT_ERROR = 'Sorry, I could not respond right now. Please try again in a moment.'
const DEFAULT_VOICE_ERROR = 'Sorry, I could not process your voice note. Please try again.'
const DEFAULT_LOAD_ERROR = 'Unable to load this conversation. Please try again.'

const CODE_MESSAGES = {
    subscription_expired: 'Your subscription has ended. Please reactivate your plan to continue chatting.',
    subscription_required: 'An active plan is required to use chat.',
    validation_error: 'Please check your message and try again.',
    token_quota_exceeded: 'You have used all of your tokens. Buy extra tokens in Settings → Plan & usage, or upgrade your plan to keep chatting.',
    token_expired: 'Your session expired. Please sign in again.',
    token_invalid: 'Your session is invalid. Please sign in again.',
    token_missing: 'Please sign in to continue.',
}

const TECHNICAL_PATTERNS = [
    /chat failed/i,
    /voice chat failed/i,
    /errno\s*\d+/i,
    /invalid argument/i,
    /traceback/i,
    /\bexception\b/i,
    /upstream/i,
    /fastapi/i,
    /httpexception/i,
    /connection refused/i,
    /assistant_proxy/i,
    /invalid_upstream/i,
    /non-json/i,
    /project api/i,
    /ai_gateway_error/i,
    /upstream_/i,
]

const isTechnicalMessage = (text) => {
    const value = String(text || '').trim()
    if (!value) return false
    if (value.length > 160) return true
    if (/[{[\]\\<>]/.test(value)) return true
    return TECHNICAL_PATTERNS.some((pattern) => pattern.test(value))
}

export function friendlyAssistantError(message, { code, fallback = DEFAULT_CHAT_ERROR } = {}) {
    const normalizedCode = String(code || '').toLowerCase()
    if (CODE_MESSAGES[normalizedCode]) {
        return CODE_MESSAGES[normalizedCode]
    }

    const text = String(message || '').trim()
    if (!text || isTechnicalMessage(text)) {
        return fallback
    }

    // Shared filter: hides keys/config/internals and maps network failures.
    return userFacingError(text, fallback)
}

export function friendlyChatError(message, options = {}) {
    return friendlyAssistantError(message, { ...options, fallback: DEFAULT_CHAT_ERROR })
}

export function friendlyVoiceError(message, options = {}) {
    return friendlyAssistantError(message, { ...options, fallback: DEFAULT_VOICE_ERROR })
}

export function friendlyLoadChatError(message, options = {}) {
    return friendlyAssistantError(message, { ...options, fallback: DEFAULT_LOAD_ERROR })
}

export function extractApiErrorMessage(data) {
    if (!data || typeof data !== 'object') return ''
    return String(data.message || data.detail || data.error || '').trim()
}
