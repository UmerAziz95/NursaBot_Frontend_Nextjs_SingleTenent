import PrivacyContent from '@/sections/legal/PrivacyContent'
import { buildPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata() {
    return buildPageMetadata({
        title: 'Privacy Policy',
        description: 'How we collect, use and protect your personal information.',
        path: '/privacy',
    })
}

export default function PrivacyPage() {
    return <PrivacyContent />
}
