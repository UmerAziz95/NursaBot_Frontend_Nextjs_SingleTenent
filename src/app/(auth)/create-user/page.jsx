import RequireAuth from '@/components/RequireAuth'
import CreateUserPage from '@/sections/register/CreateUserPage'

export default function CreateUserRoute() {
    return (
        <RequireAuth>
            <CreateUserPage />
        </RequireAuth>
    )
}
