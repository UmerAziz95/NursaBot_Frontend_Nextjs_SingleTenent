import HomePage from '@/sections/home/HomePage'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  try {
    const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://127.0.0.1:8001'
    const url = `${BASE.replace(/\/$/, '')}/api/setup/status`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data?.needs_setup) {
        redirect('/signup')
      }
    }
  } catch (e) {
    // ignore and render Home
  }

  return <HomePage />
}
