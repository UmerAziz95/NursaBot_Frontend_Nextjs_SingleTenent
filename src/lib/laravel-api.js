const normalizeBase = () => {
    const configured =
        process.env.NEXT_PUBLIC_LARAVEL_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.LARAVEL_URL ||
        ''

    return configured ? configured.replace(/\/$/, '') : ''
}

export const getLaravelBaseUrl = () => normalizeBase()

export const getLaravelApiUrl = (path) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const base = getLaravelBaseUrl()
    return base ? `${base}${normalizedPath}` : normalizedPath
}

export const getStoredAdminToken = () => {
    if (typeof window === 'undefined') {
        return ''
    }

    try {
        const session = JSON.parse(localStorage.getItem('session') || 'null')
        return session?.access_token || localStorage.getItem('token') || ''
    } catch (error) {
        return localStorage.getItem('token') || ''
    }
}

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

    return fetch(getLaravelApiUrl(path), {
        credentials: 'include',
        ...options,
        headers,
    })
}