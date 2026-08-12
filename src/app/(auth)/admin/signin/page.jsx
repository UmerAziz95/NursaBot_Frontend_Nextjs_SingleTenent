import { Suspense } from 'react'
import AdminSignInPage from '@/sections/login/AdminSignInPage'

export default function AdminSignInRoute() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>}>
            <AdminSignInPage />
        </Suspense>
    )
}
