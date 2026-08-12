import AdminShell from '@/sections/admin/AdminShell'
import ManageSiteLogsPage from '@/sections/admin/ManageSiteLogsPage'

export default function ManageSiteLogsRoute() {
    return (
        <AdminShell
            title="Site Logs"
            subtitle="Error and crash logs across Laravel, Python, chat, and the frontend."
            contentClassName="bg-[#F4F7FA]"
        >
            <ManageSiteLogsPage />
        </AdminShell>
    )
}
