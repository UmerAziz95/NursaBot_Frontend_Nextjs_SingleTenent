import { Suspense } from 'react'
import RequireAuth from "@/components/RequireAuth";
import RequireUser from "@/components/RequireUser";
import PlansPage from "@/sections/plans/PlansPage";

export default function PlansRoute() {
    return (
        <RequireAuth>
            <RequireUser redirectTo="/admin/chat">
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading plans…</div>}>
                    <PlansPage />
                </Suspense>
            </RequireUser>
        </RequireAuth>
    )
}
