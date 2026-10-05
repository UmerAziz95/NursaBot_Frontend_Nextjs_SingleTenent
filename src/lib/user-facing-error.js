/**
 * Decides whether an error message is safe to show users.
 *
 * Server responses can carry implementation details (missing API keys, config
 * names, "X not found", stack traces, raw JSON). Those are replaced with a
 * generic message; ordinary user-facing messages ("Incorrect password",
 * "Your card was declined") pass through unchanged.
 */

export const GENERIC_ERROR = 'Something went wrong. Please try again.'
export const UNAVAILABLE_ERROR = 'The system is not responding right now. Please try again in a moment.'

const NETWORK_PATTERNS = [
    /failed to fetch/i,
    /networkerror/i,
    /network request failed/i,
    /load failed/i,
    /\btimed? ?out\b/i,
    /timeout/i,
    /econn(refused|reset|aborted)/i,
    /connection (refused|reset|closed|error)/i,
    /service unavailable/i,
    /bad gateway/i,
    /gateway time/i,
    /not responding/i,
]

const TECHNICAL_PATTERNS = [
    // Keys, secrets and configuration.
    /api[ _-]?key/i,
    /\bkeys?\b.{0,40}\b(expired|not found|invalid|missing|revoked|configured|incorrect|provided)\b/i,
    /\b(expired|invalid|missing|incorrect)\b.{0,20}\bkeys?\b/i,
    /\b(secret|credential|publishable)s?\b/i,
    /\bsk_(test|live)|pk_(test|live)|whsec_/i,
    /not configured|misconfigur|configuration|\bconfig\b|\.env\b|environment variable/i,
    /\bseed(ed)?\b/i,
    /\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/, // ENV_STYLE_NAMES
    /\b[a-z]+(?:_[a-z0-9]+)+\b/, // snake_case identifiers (chat_id, business_client_id)
    /\bjwt\b|\bbearer\b|\btoken\b.{0,25}\b(expired|invalid|missing|malformed|signature|has no|decode)/i,
    // Internals and infrastructure.
    /openai|whisper|gpt-|embedding|fastapi|laravel|uvicorn|pgvector|postgres|mysql|sqlite|redis/i,
    /\bsql(state)?\b|database|\bdb\b|query exception|integrity constraint|duplicate entry/i,
    /exception|traceback|stack trace|errno|segfault|fatal error/i,
    /\b(type|reference|syntax|range)error\b/i,
    /undefined|\bnull\b|\bNaN\b|cannot read propert/i,
    /unexpected token|json|non-json|invalid response|parse error/i,
    /upstream|proxy|internal server|server error|status code|\bhttp\s?\d{3}\b|\b5\d\d\b/i,
    /correlation|request id|\buuid\b/i,
    /\b(business|workspace|resource|chat|header|config|admin|record|model|row|document)s?\b.{0,20}\bnot found\b/i,
    /speech-to-text service|transcri(be|ption) (failed|service)/i,
    /\bendpoint\b|\broute\b|\bmiddleware\b|\bcontroller\b/i,
]

const looksLikeNetworkFailure = (text) => NETWORK_PATTERNS.some((pattern) => pattern.test(text))

export const looksTechnical = (text) => {
    const value = String(text || '').trim()
    if (!value) return false
    if (value.length > 180) return true
    if (/[{}[\]<>\\]|=>|::|\/\w+\/\w+/.test(value)) return true
    return TECHNICAL_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * Returns `message` when it is safe to show, otherwise a friendly fallback.
 * Network/timeout failures get the "not responding" message.
 */
export function userFacingError(message, fallback = GENERIC_ERROR) {
    const text = String(message ?? '').trim()
    if (!text) return fallback
    if (looksLikeNetworkFailure(text)) return UNAVAILABLE_ERROR
    if (looksTechnical(text)) return fallback
    return text
}

/** Stripe errors: only card/validation problems are meaningful to the user. */
export function userFacingStripeError(error, fallback = GENERIC_ERROR) {
    if (!error) return fallback
    if (error.type === 'card_error' || error.type === 'validation_error') {
        return userFacingError(error.message, fallback)
    }
    return fallback
}
