import AdminShell from '@/sections/admin/AdminShell'
import ManageUsersPage from '@/sections/admin/ManageUsersPage'

export default function ManageUsersRoute() {
    return (
        <AdminShell
            title="Users"
            subtitle="Create, update, activate, or delete site users and sub-admins."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageUsersPage />
        </AdminShell>
    )
}
