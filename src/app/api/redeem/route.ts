import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: '请输入兑换码' }, { status: 400 })

    // Try to get user from Authorization header first
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let userId: string | null = null

    if (token) {
      const { data: { user } } = await serviceClient.auth.getUser(token)
      userId = user?.id ?? null
    }

    if (!userId) {
      // Fallback: try cookie-based auth
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      userId = session?.user?.id ?? null
    }

    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // Call the redeem_code RPC
    const { data, error } = await serviceClient.rpc('redeem_code', {
      p_code: code,
      p_user_id: userId,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data?.success) return NextResponse.json({ error: data?.message ?? '兑换失败' }, { status: 400 })

    return NextResponse.json({ credits: data.credits_added })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? '服务器错误' }, { status: 500 })
  }
}
