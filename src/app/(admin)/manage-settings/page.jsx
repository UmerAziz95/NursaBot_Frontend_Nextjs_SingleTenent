import AdminShell from '@/sections/admin/AdminShell'
import ManageSettingsPage from '@/sections/admin/ManageSettingsPage'

export default function ManageSettingsRoute() {
    return (
        <AdminShell
            title="Settings"
            subtitle="Application controls for user and admin experiences."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageSettingsPage />
        </AdminShell>
    )
}
