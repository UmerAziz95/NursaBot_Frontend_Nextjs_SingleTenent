import AdminShell from '@/sections/admin/AdminShell'
import CreateBusinessPage from '@/sections/register/CreateBusinessPage'

export default function CreateBusinessRoute() {
    return (
        <AdminShell
            title="New business"
            subtitle="Create a tenant business."
            contentClassName="bg-[#F4F7FA]"
        >
            <CreateBusinessPage embedded />
        </AdminShell>
    )
}
