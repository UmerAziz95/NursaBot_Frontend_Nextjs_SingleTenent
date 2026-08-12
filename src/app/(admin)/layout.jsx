'use client'

import RequireAuth from '@/components/RequireAuth'
import RequireAdmin from '@/components/RequireAdmin'

export default function AdminLayout({ children }) {
    return (
        <RequireAuth redirectTo="/admin/signin">
            <RequireAdmin redirectTo="/admin/signin">
                {children}
            </RequireAdmin>
        </RequireAuth>
    )
}
