import AdminShell from '@/sections/admin/AdminShell'
import CreateUserPage from '@/sections/register/CreateUserPage'

export default function CreateUserRoute() {
    return (
        <AdminShell
            title="New user"
            subtitle="Create a site user and assign a workspace."
            contentClassName="bg-[#F4F7FA]"
        >
            <CreateUserPage embedded />
        </AdminShell>
    )
}
