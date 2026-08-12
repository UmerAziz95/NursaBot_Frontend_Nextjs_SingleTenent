import RequireAuth from '@/components/RequireAuth'
import CreateWorkspacePage from '@/sections/register/CreateWorkspacePage'

export default function CreateWorkspaceRoute() {
    return (
        <RequireAuth>
            <CreateWorkspacePage />
        </RequireAuth>
    )
}