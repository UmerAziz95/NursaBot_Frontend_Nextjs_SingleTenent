import AdminShell from '@/sections/admin/AdminShell'
import ManageSubscriptionsPage from '@/sections/admin/ManageSubscriptionsPage'

export default function ManageSubscriptionsRoute() {
    return (
        <AdminShell
            title="Subscriptions"
            subtitle="View, update, cancel, and reactivate monthly plans."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageSubscriptionsPage />
        </AdminShell>
    )
}
