import RequireAuth from '@/components/RequireAuth'
import AddDocumentPage from '@/sections/register/AddDocumentPage'

export default function AddDocumentRoute() {
    return (
        <RequireAuth>
            <AddDocumentPage />
        </RequireAuth>
    )
}