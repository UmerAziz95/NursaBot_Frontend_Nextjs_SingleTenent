import AdminShell from '@/sections/admin/AdminShell'
import ManagePlansPage from '@/sections/register/ManagePlansPage'

export default function ManagePlansRoute() {
    return (
        <AdminShell
            title="Plans"
            subtitle="Configure monthly subscription plans and pricing."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManagePlansPage embedded />
        </AdminShell>
    )
}
