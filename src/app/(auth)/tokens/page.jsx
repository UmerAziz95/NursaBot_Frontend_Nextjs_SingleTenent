import { Suspense } from 'react'
import RequireAuth from '@/components/RequireAuth'
import RequireUser from '@/components/RequireUser'
import TokensPage from '@/sections/plans/TokensPage'

export const metadata = { title: 'Buy tokens' }

export default function TokensRoute() {
    return (
        <RequireAuth>
            <RequireUser redirectTo="/admin/chat">
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>}>
                    <TokensPage />
                </Suspense>
            </RequireUser>
        </RequireAuth>
    )
}
