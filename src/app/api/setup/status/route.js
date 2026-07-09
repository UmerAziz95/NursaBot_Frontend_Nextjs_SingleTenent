export async function GET() {
  try {
    const BASE = process.env.NEXT_PUBLIC_LARAVEL_URL || 'http://localhost:8001'
    const url = `${BASE.replace(/\/$/, '')}/api/setup/status`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await res.json()
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'content-type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ needs_setup: false }), { status: 502, headers: { 'content-type': 'application/json' } })
  }
}
