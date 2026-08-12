'use client'

import { useEffect } from 'react'
import { getLaravelApiUrl, getStoredAdminToken } from '@/lib/laravel-api'

const RECENT_KEY = 'site_log_recent_hashes'
const MAX_RECENT = 40
const DEDUPE_MS = 15_000

function readRecent() {
    try {
        const raw = sessionStorage.getItem(RECENT_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function remember(hash) {
    try {
        const next = [{ hash, at: Date.now() }, ...readRecent()]
            .filter((item) => Date.now() - item.at < DEDUPE_MS)
            .slice(0, MAX_RECENT)
        sessionStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
        // ignore storage failures
    }
}

function wasRecentlySent(hash) {
    return readRecent().some((item) => item.hash === hash && Date.now() - item.at < DEDUPE_MS)
}

function simpleHash(input) {
    let h = 0
    for (let i = 0; i < input.length; i += 1) {
        h = (h << 5) - h + input.charCodeAt(i)
        h |= 0
    }
    return String(h)
}

function currentUserMeta() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        const session = JSON.parse(localStorage.getItem('session') || 'null')
        return {
            user_id: user?.id || session?.user_id || undefined,
            user_email: user?.email || session?.email || undefined,
            user_role: user?.role || session?.role || localStorage.getItem('role') || undefined,
        }
    } catch {
        return {}
    }
}

export async function reportSiteError({
    message,
    severity = 'error',
    source = 'frontend',
    category = 'client',
    exceptionClass,
    stackTrace,
    context,
    statusCode,
    requestMethod,
    requestPath,
    requestUrl,
} = {}) {
    if (typeof window === 'undefined') return

    const text = String(message || 'Unknown frontend error').slice(0, 5000)
    const hash = simpleHash([severity, source, category, text, stackTrace || ''].join('|'))
    if (wasRecentlySent(hash)) return
    remember(hash)

    const payload = {
        severity,
        source,
        category,
        message: text,
        exception_class: exceptionClass || undefined,
        stack_trace: stackTrace ? String(stackTrace).slice(0, 50000) : undefined,
        context: context || undefined,
        status_code: statusCode || undefined,
        request_method: requestMethod || undefined,
        request_path: requestPath || undefined,
        request_url: requestUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
        ...currentUserMeta(),
    }

    try {
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }
        const token = getStoredAdminToken()
        if (token) headers.Authorization = `Bearer ${token}`

        // Fire-and-forget; never block UI on logging.
        void fetch(getLaravelApiUrl('/api/site-logs'), {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch(() => {})
    } catch {
        // ignore
    }
}

export default function SiteErrorReporter() {
    useEffect(() => {
        const onError = (event) => {
            void reportSiteError({
                message: event?.message || event?.error?.message || 'Unhandled window error',
                severity: 'error',
                source: 'frontend',
                category: 'window.onerror',
                exceptionClass: event?.error?.name || 'Error',
                stackTrace: event?.error?.stack || undefined,
                context: {
                    filename: event?.filename,
                    lineno: event?.lineno,
                    colno: event?.colno,
                },
            })
        }

        const onRejection = (event) => {
            const reason = event?.reason
            const message =
                (reason && typeof reason === 'object' && reason.message) ||
                (typeof reason === 'string' ? reason : 'Unhandled promise rejection')
            void reportSiteError({
                message,
                severity: 'error',
                source: 'frontend',
                category: 'unhandledrejection',
                exceptionClass: reason?.name || 'UnhandledRejection',
                stackTrace: reason?.stack || undefined,
            })
        }

        window.addEventListener('error', onError)
        window.addEventListener('unhandledrejection', onRejection)
        return () => {
            window.removeEventListener('error', onError)
            window.removeEventListener('unhandledrejection', onRejection)
        }
    }, [])

    return null
}
