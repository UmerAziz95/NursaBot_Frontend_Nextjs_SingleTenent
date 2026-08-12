import { redirect } from 'next/navigation'

/** Keep /admin as the portal entry; signed-in admins land on the dashboard via client auth. */
export default function AdminRedirect() {
    redirect('/admin/signin')
}
