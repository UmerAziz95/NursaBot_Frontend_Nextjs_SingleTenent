'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw as RetryIcon, TriangleAlert as AlertIcon } from 'lucide-react'
import { reportSiteError } from '@/components/SiteErrorReporter'

// Shown instead of a crashed page. Users see a friendly message only; the
// technical details go to Site Logs for administrators.
export default function AppError({ error, reset }) {
    useEffect(() => {
        void reportSiteError({
            message: error?.message || 'Unhandled render error',
            exceptionClass: error?.name,
            stackTrace: error?.stack,
            category: 'render',
            context: error?.digest ? { digest: error.digest } : undefined,
        })
    }, [error])

    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                background: 'radial-gradient(600px 300px at 50% 0%, rgba(46,170,219,0.12), transparent 70%), #f6f9fb',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
        >
            <div
                role="alert"
                style={{
                    maxWidth: '26rem',
                    width: '100%',
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '1.5rem',
                    boxShadow: '0 24px 48px -24px rgba(5,52,71,0.35)',
                }}
            >
                <div
                    style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '1rem',
                        color: '#b45309',
                        background: '#fef3c7',
                    }}
                >
                    <AlertIcon size={26} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#053447' }}>
                    Something went wrong
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9375rem', lineHeight: 1.6, color: '#64748b' }}>
                    We hit an unexpected problem loading this page. Please try again in a moment.
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => reset()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            height: '2.75rem',
                            padding: '0 1.25rem',
                            border: 0,
                            borderRadius: '0.875rem',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #2eaadb 0%, #053447 100%)',
                        }}
                    >
                        <RetryIcon size={16} />
                        Try again
                    </button>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '2.75rem',
                            padding: '0 1.25rem',
                            borderRadius: '0.875rem',
                            border: '1px solid #dbe4ec',
                            color: '#053447',
                            fontWeight: 600,
                            textDecoration: 'none',
                        }}
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </main>
    )
}
