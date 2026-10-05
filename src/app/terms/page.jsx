import TermsContent from '@/sections/legal/TermsContent'
import { buildPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata() {
    return buildPageMetadata({
        title: 'Terms of Service',
        description: 'The terms that apply when you use our AI study assistant.',
        path: '/terms',
    })
}

export default function TermsPage() {
    return <TermsContent />
}
