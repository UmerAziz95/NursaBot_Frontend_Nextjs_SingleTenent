import AdminShell from '@/sections/admin/AdminShell'
import AddDocumentPage from '@/sections/register/AddDocumentPage'

export default function AddDocumentRoute() {
    return (
        <AdminShell
            title="Add document"
            subtitle="Upload a knowledge file into a workspace."
            contentClassName="bg-[#F4F7FA]"
        >
            <AddDocumentPage embedded />
        </AdminShell>
    )
}
