import AdminShell from '@/sections/admin/AdminShell'
import CreateWorkspacePage from '@/sections/register/CreateWorkspacePage'

export default function CreateWorkspaceRoute() {
    return (
        <AdminShell
            title="New workspace"
            subtitle="Add a workspace under a business."
            contentClassName="bg-[#F4F7FA]"
        >
            <CreateWorkspacePage embedded />
        </AdminShell>
    )
}
