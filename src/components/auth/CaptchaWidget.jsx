'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getLaravelApiUrl } from '@/lib/laravel-api'

const loadTurnstileScript = () => {
    if (typeof window === 'undefined') return Promise.resolve()
    if (window.turnstile?.render) return Promise.resolve()

    const existing = document.querySelector('script[data-turnstile="true"]')
    if (existing) {
        return new Promise((resolve, reject) => {
            if (window.turnstile?.render) {
                resolve()
                return
            }
            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener('error', () => reject(new Error('Failed to load Cloudflare captcha')), { once: true })
        })
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.dataset.turnstile = 'true'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Cloudflare captcha'))
        document.head.appendChild(script)
    })
}

/**
 * Captcha widget:
 * - Cloudflare Turnstile when TURNSTILE keys are configured on the API
 * - Math challenge fallback otherwise (works locally without Cloudflare keys)
 */
export default function CaptchaWidget({ onChange, refreshKey = 0 }) {
    const [mode, setMode] = useState('loading')
    const [question, setQuestion] = useState('')
    const [challengeId, setChallengeId] = useState('')
    const [answer, setAnswer] = useState('')
    const [siteKey, setSiteKey] = useState('')
    const [error, setError] = useState('')
    const widgetRef = useRef(null)
    const widgetIdRef = useRef(null)
    const requestIdRef = useRef(0)

    const emit = useCallback((payload) => {
        onChange?.(payload)
    }, [onChange])

    const applyMathChallenge = useCallback((data) => {
        setMode('math')
        setSiteKey('')
        setChallengeId(data?.challenge_id || '')
        setQuestion(data?.question || 'Solve the challenge')
        emit({
            mode: 'math',
            challenge_id: data?.challenge_id || '',
            captcha_answer: '',
        })
    }, [emit])

    const loadChallenge = useCallback(async () => {
        const requestId = ++requestIdRef.current
        setError('')
        setAnswer('')
        setMode('loading')
        emit({ mode: 'loading' })

        try {
            const res = await fetch(getLaravelApiUrl('/api/auth/challenge'), {
                method: 'GET',
                headers: { Accept: 'application/json' },
                credentials: 'include',
            })
            const data = await res.json().catch(() => null)
            if (requestId !== requestIdRef.current) return

            if (!res.ok) {
                throw new Error(data?.detail || 'Could not load captcha.')
            }

            if ((data?.mode === 'turnstile' || data?.mode === 'recaptcha') && data?.site_key) {
                setMode('turnstile')
                setSiteKey(data.site_key)
                emit({ mode: 'turnstile', captcha_token: '' })
                return
            }

            applyMathChallenge(data)
        } catch (err) {
            if (requestId !== requestIdRef.current) return
            setMode('error')
            setError(err.message || 'Could not load captcha.')
            emit({ mode: 'error' })
        }
    }, [applyMathChallenge, emit])

    useEffect(() => {
        void loadChallenge()
    }, [loadChallenge, refreshKey])

    useEffect(() => {
        if (mode !== 'turnstile' || !siteKey) return undefined

        let cancelled = false
        let renderTimer = null

        const render = async () => {
            try {
                await loadTurnstileScript()
                if (cancelled) return

                // Wait one frame so the widget container is mounted after mode switch.
                await new Promise((resolve) => {
                    renderTimer = window.setTimeout(resolve, 0)
                })
                if (cancelled || !widgetRef.current || !window.turnstile?.render) return

                if (widgetIdRef.current !== null && window.turnstile?.remove) {
                    try {
                        window.turnstile.remove(widgetIdRef.current)
                    } catch {
                        // ignore
                    }
                    widgetIdRef.current = null
                }

                widgetRef.current.innerHTML = ''
                widgetIdRef.current = window.turnstile.render(widgetRef.current, {
                    sitekey: siteKey,
                    theme: 'light',
                    callback: (token) => emit({ mode: 'turnstile', captcha_token: token }),
                    'expired-callback': () => emit({ mode: 'turnstile', captcha_token: '' }),
                    'error-callback': (code) => {
                        const detail = code
                            ? `Cloudflare captcha failed (code ${code}). The site key may be invalid or this domain is not allowed.`
                            : 'Cloudflare captcha failed to load.'
                        setError(detail)
                        setMode('error')
                        emit({ mode: 'error' })
                    },
                    'timeout-callback': () => emit({ mode: 'turnstile', captcha_token: '' }),
                })
            } catch (err) {
                if (cancelled) return
                setError(err.message || 'Captcha failed to load.')
                setMode('error')
                emit({ mode: 'error' })
            }
        }

        void render()
        return () => {
            cancelled = true
            if (renderTimer) window.clearTimeout(renderTimer)
            if (widgetIdRef.current !== null && window.turnstile?.remove) {
                try {
                    window.turnstile.remove(widgetIdRef.current)
                } catch {
                    // ignore
                }
                widgetIdRef.current = null
            }
        }
    }, [mode, siteKey, emit, refreshKey])

    if (mode === 'loading') {
        return <p className="text-xs text-slate-500">Loading captcha…</p>
    }

    if (mode === 'error') {
        return (
            <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                <p className="text-xs text-rose-700">{error || 'Captcha unavailable.'}</p>
                <button
                    type="button"
                    className="text-xs font-semibold text-[#053447] underline"
                    onClick={() => void loadChallenge()}
                >
                    Retry captcha
                </button>
            </div>
        )
    }

    if (mode === 'turnstile') {
        return (
            <div className="space-y-1">
                <div ref={widgetRef} />
                <p className="text-[11px] text-slate-400">Protected by Cloudflare Turnstile</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Captcha: {question}
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={answer}
                    onChange={(event) => {
                        const next = event.target.value
                        setAnswer(next)
                        emit({
                            mode: 'math',
                            challenge_id: challengeId,
                            captcha_answer: next,
                        })
                    }}
                    required
                    className="w-full rounded-lg border border-gray-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#053447]"
                    placeholder="Enter the answer"
                />
            </label>
            <button
                type="button"
                className="text-[11px] font-medium text-[#053447] hover:text-[#2EAADB]"
                onClick={() => void loadChallenge()}
            >
                Refresh captcha
            </button>
        </div>
    )
}
