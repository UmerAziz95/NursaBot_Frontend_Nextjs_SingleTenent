// Server-side helpers for page metadata (titles, descriptions, social previews).

const DEFAULT_SITE = {
    site_name: 'NursingAI',
    site_tagline: 'Your AI study companion for nursing school and the NCLEX.',
}

export async function fetchPublicSettings() {
    const base = (process.env.NEXT_PUBLIC_LARAVEL_URL || process.env.LARAVEL_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')
    try {
        const res = await fetch(`${base}/api/app-settings`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 300 },
        })
        if (!res.ok) return DEFAULT_SITE
        const data = await res.json()
        return { ...DEFAULT_SITE, ...(data?.settings || {}) }
    } catch {
        return DEFAULT_SITE
    }
}

export async function buildPageMetadata({ title, description, path = '/' } = {}) {
    const settings = await fetchPublicSettings()
    const siteName = settings.site_name || DEFAULT_SITE.site_name
    const fullTitle = title ? `${title} · ${siteName}` : `${siteName} — AI study assistant for nursing students`
    const desc = description || settings.site_tagline || DEFAULT_SITE.site_tagline

    return {
        title: fullTitle,
        description: desc,
        alternates: { canonical: path },
        openGraph: { title: fullTitle, description: desc, siteName, type: 'website', url: path },
        twitter: { card: 'summary', title: fullTitle, description: desc },
    }
}
