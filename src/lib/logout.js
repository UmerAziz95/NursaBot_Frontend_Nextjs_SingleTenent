const COOKIE_EXPIRES = 'Thu, 01 Jan 1970 00:00:00 GMT'

const getCookiePaths = () => {
    if (typeof window === 'undefined') {
        return ['/']
    }

    const paths = new Set(['/'])
    const segments = String(window.location.pathname || '/')
        .split('/')
        .filter(Boolean)

    let currentPath = ''
    for (const segment of segments) {
        currentPath += `/${segment}`
        paths.add(currentPath)
    }

    return [...paths]
}

const getCookieDomains = () => {
    if (typeof window === 'undefined') {
        return []
    }

    const hostname = String(window.location.hostname || '').trim()
    if (!hostname) {
        return []
    }

    const domains = new Set([hostname])
    const parts = hostname.split('.').filter(Boolean)

    if (parts.length > 2) {
        for (let index = 1; index < parts.length - 1; index += 1) {
            domains.add(parts.slice(index).join('.'))
        }
    }

    return [...domains].filter(Boolean)
}

const expireCookie = (name, path, domain) => {
    let cookie = `${name}=; expires=${COOKIE_EXPIRES}; max-age=0; path=${path}; SameSite=Lax`

    if (domain) {
        cookie += `; domain=${domain}`
    }

    document.cookie = cookie
}

export const clearBrowserAuthState = async () => {
    if (typeof window === 'undefined') {
        return
    }

    try {
        localStorage.clear()
    } catch (error) {
        // ignore storage failures during logout
    }

    try {
        sessionStorage.clear()
    } catch (error) {
        // ignore storage failures during logout
    }

    try {
        const cookieNames = document.cookie
            .split(';')
            .map((cookie) => cookie.split('=')[0].trim())
            .filter(Boolean)

        const paths = getCookiePaths()
        const domains = getCookieDomains()

        for (const name of cookieNames) {
            for (const path of paths) {
                expireCookie(name, path)

                for (const domain of domains) {
                    expireCookie(name, path, domain)
                }
            }
        }
    } catch (error) {
        // ignore cookie cleanup failures during logout
    }

    try {
        if ('caches' in window && window.caches?.keys) {
            const keys = await window.caches.keys()
            await Promise.all(keys.map((key) => window.caches.delete(key)))
        }
    } catch (error) {
        // ignore cache cleanup failures during logout
    }

    try {
        if (navigator.serviceWorker?.getRegistrations) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            await Promise.all(registrations.map((registration) => registration.unregister()))
        }
    } catch (error) {
        // ignore service worker cleanup failures during logout
    }
}

export const logoutAndRedirect = async (redirectTo = '/signin') => {
    await clearBrowserAuthState()

    if (typeof window !== 'undefined') {
        window.location.replace(redirectTo)
    }
}