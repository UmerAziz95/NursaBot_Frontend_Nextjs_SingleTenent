import RequireAuth from '@/components/RequireAuth'
import CreateBusinessPage from '@/sections/register/CreateBusinessPage'

export default function CreateBusinessRoute() {
    return (
        <RequireAuth>
            <CreateBusinessPage />
        </RequireAuth>
    )
}