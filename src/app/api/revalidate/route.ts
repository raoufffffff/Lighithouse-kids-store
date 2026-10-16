import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { getProducts, SUPABASE_KEY, SUPABASE_URL } from '@/lib/data'

export const dynamic = 'force-dynamic'

const cors = () => ({
  'Access-Control-Allow-Origin': process.env.ADMIN_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
})

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() })
}

/**
 * Rebuilds every static page. Only a signed-in store admin may call it: the caller's
 * Supabase access token is checked against the database function lh_is_admin().
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!/^Bearer .{20,}$/.test(auth)) {
    return Response.json({ ok: false }, { status: 401, headers: cors() })
  }

  let isAdmin = false
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lh_is_admin`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: auth, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    })
    isAdmin = res.ok && (await res.json()) === true
  } catch {
    isAdmin = false
  }
  if (!isAdmin) return Response.json({ ok: false }, { status: 403, headers: cors() })

  revalidatePath('/', 'layout')

  // Re-render in the background so the next visitor already gets fresh pages.
  const origin = new URL(req.url).origin
  after(async () => {
    try {
      await fetch(`${origin}/`, { cache: 'no-store' })
      const products = await getProducts()
      await Promise.all(
        products.slice(0, 30).map((p) => fetch(`${origin}/p/${encodeURIComponent(p.slug)}`, { cache: 'no-store' })),
      )
    } catch {
      /* warming is best-effort */
    }
  })

  return Response.json({ ok: true }, { headers: cors() })
}
