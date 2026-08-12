import Home from './(home)/page'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  try {
    // Prefer same-origin proxy route so the server fetch is reliable in dev
    let res = await fetch('/api/setup/status', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) {
      const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://localhost:8001'
      const url = `${BASE.replace(/\/$/, '')}/api/setup/status`
      res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    }
    if (res.ok) {
      const data = await res.json()
      if (data?.needs_setup) {
        redirect('/signup')
      } else {
        // If setup is complete, send users to the login page by default
        redirect('/login')
      }
    }
  } catch (e) {
    // ignore and render client-side Home which will handle login/signup
  }

  return <Home />
}
