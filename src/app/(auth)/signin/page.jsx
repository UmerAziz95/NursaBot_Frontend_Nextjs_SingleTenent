import { Suspense } from 'react'
import LoginPage from '@/sections/login/LoginPage'

export default function SignInRoute() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>}>
            <LoginPage />
        </Suspense>
    )
}
