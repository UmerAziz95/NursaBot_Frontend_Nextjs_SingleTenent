import AdminShell from '@/sections/admin/AdminShell'
import ManageHelpPage from '@/sections/register/ManageHelpPage'

export default function ManageHelpRoute() {
    return (
        <AdminShell
            title="Help"
            subtitle="Review support requests and reply in ticket chat."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageHelpPage embedded />
        </AdminShell>
    )
}
