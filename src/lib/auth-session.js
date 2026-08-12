import { clearBrowserAuthState } from '@/lib/logout'

const getRefreshUrl = () => {
    if (typeof window !== 'undefined') {
        return '/backend/api/auth/refresh'
    }

    const base = (
        process.env.NEXT_PUBLIC_LARAVEL_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.LARAVEL_URL ||
        ''
    ).replace(/\/$/, '')

    return base ? `${base}/api/auth/refresh` : '/api/auth/refresh'
}

/** Refresh at most every 2 minutes while the app is open (sliding session). */
const REFRESH_THROTTLE_MS = 2 * 60 * 1000
/** Always refresh when the token expires within this window. */
const EXPIRY_BUFFER_MS = 30 * 60 * 1000
const LAST_REFRESH_KEY = 'token_last_refresh_at'

let refreshInFlight = null
let sessionExpiredHandled = false

const readJson = (key) => {
    if (typeof window === 'undefined') {
        return null
    }

    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const decodeJwtExpMs = (token) => {
    try {
        const payloadPart = String(token || '').split('.')[1]
        if (!payloadPart) {
            return null
        }

        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
        const payload = JSON.parse(atob(padded))
        const exp = Number(payload?.exp || 0)
        return exp > 0 ? exp * 1000 : null
    } catch {
        return null
    }
}

const getLastRefreshAtMs = () => {
    if (typeof window === 'undefined') {
        return 0
    }

    return Number(localStorage.getItem(LAST_REFRESH_KEY) || 0)
}

const markRefreshed = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()))
    }
}

export const getStoredToken = () => {
    if (typeof window === 'undefined') {
        return ''
    }

    const session = readJson('session')
    return session?.access_token || localStorage.getItem('token') || ''
}

export const getStoredRole = () => {
    if (typeof window === 'undefined') {
        return ''
    }

    const user = readJson('user')
    const session = readJson('session')
    return String(user?.role || session?.role || localStorage.getItem('role') || '').toLowerCase()
}

export const getStoredExpiresAtMs = () => {
    if (typeof window === 'undefined') {
        return null
    }

    const session = readJson('session')
    const stored = Number(session?.expires_at || localStorage.getItem('token_expires_at') || 0)
    if (stored > 0) {
        return stored < 1_000_000_000_000 ? stored * 1000 : stored
    }

    return decodeJwtExpMs(getStoredToken())
}

export const isStaffRole = (role = getStoredRole()) => (
    ['admin', 'super_admin', 'sub_admin'].includes(String(role || '').toLowerCase())
)

export const persistAuthSession = ({
    access_token: accessToken,
    expires_at: expiresAt,
    expires_in: expiresIn,
    role,
    user,
    session,
} = {}) => {
    if (typeof window === 'undefined' || !accessToken) {
        return
    }

    sessionExpiredHandled = false

    const token = String(accessToken)
    const expiresAtMs = Number(expiresAt || 0) > 0
        ? (Number(expiresAt) < 1_000_000_000_000 ? Number(expiresAt) * 1000 : Number(expiresAt))
        : (Number(expiresIn || 0) > 0
            ? Date.now() + (Number(expiresIn) * 1000)
            : decodeJwtExpMs(token))

    const previousSession = readJson('session') || {}
    const nextSession = {
        ...previousSession,
        ...(session && typeof session === 'object' ? session : {}),
        access_token: token,
        ...(role ? { role } : {}),
        ...(expiresAtMs ? { expires_at: Math.floor(expiresAtMs / 1000) } : {}),
        ...(expiresIn ? { expires_in: Number(expiresIn) } : {}),
    }

    localStorage.setItem('token', token)
    localStorage.setItem('session', JSON.stringify(nextSession))

    if (expiresAtMs) {
        localStorage.setItem('token_expires_at', String(Math.floor(expiresAtMs / 1000)))
    }

    if (role) {
        localStorage.setItem('role', role)
    }

    if (user && typeof user === 'object') {
        const previousUser = readJson('user') || {}
        localStorage.setItem('user', JSON.stringify({ ...previousUser, ...user }))
    }

    markRefreshed()
}

export const getSignInPath = (role = getStoredRole()) => (
    isStaffRole(role) ? '/admin/signin' : '/signin'
)

export const handleSessionExpired = async (redirectTo) => {
    if (typeof window === 'undefined' || sessionExpiredHandled) {
        return
    }

    sessionExpiredHandled = true
    const destination = redirectTo || `${getSignInPath()}?reason=session_expired`

    await clearBrowserAuthState()
    window.location.replace(destination)
}

const shouldRefreshNow = (expiresAtMs) => {
    const now = Date.now()
    const lastRefreshAt = getLastRefreshAtMs()

    if (!expiresAtMs) {
        return now - lastRefreshAt >= REFRESH_THROTTLE_MS
    }

    const nearExpiry = now >= expiresAtMs - EXPIRY_BUFFER_MS
    const throttled = now - lastRefreshAt < REFRESH_THROTTLE_MS

    return nearExpiry || !throttled
}

export const refreshAuthSession = async ({ force = false } = {}) => {
    const token = getStoredToken()
    if (!token) {
        return false
    }

    const expiresAtMs = getStoredExpiresAtMs()
    if (!force && !shouldRefreshNow(expiresAtMs)) {
        return true
    }

    if (refreshInFlight) {
        return refreshInFlight
    }

    refreshInFlight = (async () => {
        try {
            const response = await fetch(getRefreshUrl(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${getStoredToken()}`,
                },
                credentials: 'include',
            })

            if (!response.ok) {
                return false
            }

            const data = await response.json().catch(() => null)
            const session = data?.session
            if (!session?.access_token) {
                return false
            }

            persistAuthSession({
                access_token: session.access_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in,
                session,
            })

            return true
        } catch {
            return false
        } finally {
            refreshInFlight = null
        }
    })()

    return refreshInFlight
}

/**
 * Keeps the session alive while the user is in the app. Issues a new token on a
 * sliding schedule so expiry only happens after logout or prolonged inactivity.
 */
export const ensureFreshToken = async ({ force = false } = {}) => {
    const token = getStoredToken()
    if (!token) {
        return false
    }

    return refreshAuthSession({ force })
}

export const authorizedFetch = async (url, options = {}) => {
    const { _authRetry = false, ...fetchOptions } = options

    await ensureFreshToken()

    const headers = new Headers(fetchOptions.headers || {})
    const token = getStoredToken()

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(url, {
        credentials: 'include',
        ...fetchOptions,
        headers,
    })

    let data = null
    try {
        data = await response.clone().json()
    } catch {
        data = null
    }

    if (response.status !== 401) {
        return response
    }

    const code = String(data?.code || '').toLowerCase()
    if (code === 'token_missing') {
        await handleSessionExpired()
        return response
    }

    if (!_authRetry) {
        const refreshed = await refreshAuthSession({ force: true })
        if (refreshed) {
            return authorizedFetch(url, { ...options, _authRetry: true })
        }
    }

    await handleSessionExpired()
    return response
}
