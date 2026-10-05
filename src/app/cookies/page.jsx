import CookiesContent from '@/sections/legal/CookiesContent'
import { buildPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata() {
    return buildPageMetadata({
        title: 'Cookie Policy',
        description: 'The essential cookies and browser storage we use, and why.',
        path: '/cookies',
    })
}

export default function CookiesPage() {
    return <CookiesContent />
}
