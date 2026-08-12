import { authorizedFetch, getStoredToken } from '@/lib/auth-session'

export { authorizedFetch } from '@/lib/auth-session'

const normalizeBase = () => {
    const configured =
        process.env.NEXT_PUBLIC_LARAVEL_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.LARAVEL_URL ||
        ''

    return configured ? configured.replace(/\/$/, '') : ''
}

/**
 * In the browser, always go through the Next.js `/backend` rewrite so requests
 * are same-origin and avoid CORS "Failed to fetch" issues (e.g. network IP hosts).
 * On the server, call Laravel directly.
 */
export const getLaravelBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return '/backend'
    }
    return normalizeBase()
}

export const getLaravelApiUrl = (path) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const base = getLaravelBaseUrl()
    return base ? `${base}${normalizedPath}` : normalizedPath
}

export const getStoredAdminToken = getStoredToken

export async function fetchLaravel(path, options = {}) {
    const headers = new Headers(options.headers || {})
    const token = getStoredAdminToken()

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    const url = getLaravelApiUrl(path)

    try {
        const response = await authorizedFetch(url, {
            credentials: 'include',
            ...options,
            headers,
        })

        // Report server/network application failures to Site Logs (skip the ingest endpoint itself).
        if (!response.ok && response.status >= 500 && !String(path).includes('/site-logs')) {
            try {
                const { reportSiteError } = await import('@/components/SiteErrorReporter')
                const cloned = response.clone()
                const data = await cloned.json().catch(() => null)
                void reportSiteError({
                    message: data?.detail || `API error ${response.status} on ${path}`,
                    severity: response.status >= 500 ? 'error' : 'warning',
                    source: String(path).includes('/chat') || String(path).includes('/ai') ? 'chat' : 'frontend',
                    category: 'fetchLaravel',
                    statusCode: response.status,
                    requestMethod: (options.method || 'GET').toUpperCase(),
                    requestPath: path,
                    requestUrl: url,
                    context: data?.code ? { code: data.code } : undefined,
                })
            } catch {
                // ignore reporting failures
            }
        }

        return response
    } catch (error) {
        if (!String(path).includes('/site-logs')) {
            try {
                const { reportSiteError } = await import('@/components/SiteErrorReporter')
                void reportSiteError({
                    message: error?.message || `Network failure calling ${path}`,
                    severity: 'error',
                    source: 'frontend',
                    category: 'fetchLaravel.network',
                    exceptionClass: error?.name || 'TypeError',
                    stackTrace: error?.stack,
                    requestMethod: (options.method || 'GET').toUpperCase(),
                    requestPath: path,
                    requestUrl: url,
                })
            } catch {
                // ignore
            }
        }
        throw error
    }
}
