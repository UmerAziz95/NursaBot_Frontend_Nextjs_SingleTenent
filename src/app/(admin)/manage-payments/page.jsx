import AdminShell from '@/sections/admin/AdminShell'
import ManagePaymentsPage from '@/sections/admin/ManagePaymentsPage'

export default function ManagePaymentsRoute() {
    return (
        <AdminShell
            title="Payments"
            subtitle="Every plan and token payment, with revenue stats by date."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManagePaymentsPage />
        </AdminShell>
    )
}
