import { Suspense } from 'react'
import ResetPasswordPage from '@/sections/login/ResetPasswordPage'

export default function ResetPasswordRoute() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>}>
            <ResetPasswordPage />
        </Suspense>
    )
}
