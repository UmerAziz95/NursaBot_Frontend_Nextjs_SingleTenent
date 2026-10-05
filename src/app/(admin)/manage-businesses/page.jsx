import AdminShell from '@/sections/admin/AdminShell'
import ManageBusinessesPage from '@/sections/admin/ManageBusinessesPage'

export default function ManageBusinessesRoute() {
    return (
        <AdminShell
            title="Businesses"
            subtitle="Businesses and workspaces that power the assistant."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageBusinessesPage />
        </AdminShell>
    )
}
