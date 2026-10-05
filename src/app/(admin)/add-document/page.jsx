import AdminShell from '@/sections/admin/AdminShell'
import ManageDocumentsPage from '@/sections/admin/ManageDocumentsPage'

export default function DocumentsRoute() {
    return (
        <AdminShell
            title="Documents"
            subtitle="Upload knowledge files and track their processing."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageDocumentsPage />
        </AdminShell>
    )
}
