import RequireAuth from "@/components/RequireAuth";
import CreateAdminPage from "@/sections/register/CreateAdminPage";

export default function CreateAdminRoute() {
    return (
        <RequireAuth>
            <CreateAdminPage />
        </RequireAuth>
    )
}