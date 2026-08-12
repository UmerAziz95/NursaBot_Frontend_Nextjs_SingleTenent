import AdminShell from '@/sections/admin/AdminShell'
import ManageBusinessesPage from '@/sections/admin/ManageBusinessesPage'

export default function ManageBusinessesRoute() {
    return (
        <AdminShell
            title="Businesses"
            subtitle="List, create, update, and delete businesses and workspaces."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageBusinessesPage />
        </AdminShell>
    )
}
