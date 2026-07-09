'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        const redirect = async () => {
            // Check whether any users exist – if not, show signup (first-run)
            try {
                const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://localhost:8001'
                const url = BASE ? `${BASE.replace(/\/$/, '')}/api/setup/status` : '/api/setup/status'
                const res = await fetch(url, { headers: { Accept: 'application/json' } })
                if (res.ok) {
                    const data = await res.json()
                    if (data.needs_setup) {
                        router.replace('/signup')
                        return
                    }
                }
            } catch {
                // If the API is unreachable, fall through to next checks
            }

            // After setup check, route users to login (root should not auto-navigate
            // to `/assistant`). The app can still navigate to `/assistant` after
            // successful login or by direct link.
            router.replace('/login')
        }

        redirect()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#053447] border-t-transparent rounded-full animate-spin" />
        </div>
    )
}
