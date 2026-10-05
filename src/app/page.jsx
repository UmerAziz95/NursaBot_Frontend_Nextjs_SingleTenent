import HomePage from '@/sections/home/HomePage'
import { redirect } from 'next/navigation'
import { buildPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata() {
  return buildPageMetadata({ path: '/' })
}

export default async function RootPage() {
  let needsSetup = false
  try {
    const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://127.0.0.1:8001'
    const url = `${BASE.replace(/\/$/, '')}/api/setup/status`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      needsSetup = Boolean(data?.needs_setup)
    }
  } catch (e) {
    // ignore and render Home
  }

  // redirect() throws a control-flow signal, so it must run outside the try/catch.
  if (needsSetup) {
    redirect('/signup')
  }

  return <HomePage />
}
