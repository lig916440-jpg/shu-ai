'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccess(false)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code }),
    })
    const data = await res.json()

    if (res.ok) {
      setSuccess(true)
      setMessage(`兑换成功！获得 ${data.credits} 点额度`)
    } else {
      setMessage(data.error ?? '兑换失败')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0d14]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
          <span className="text-2xl font-semibold text-white">枢 AI</span>
        </div>
        <div className="bg-[#10141f] border border-[#222838] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">兑换额度</h1>
          <p className="text-[#8d93a8] text-sm mb-6">输入卡密兑换码，添加使用额度。</p>
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8d93a8] mb-1.5">兑换码</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                required
                className="w-full bg-[#161b29] border border-[#222838] rounded-xl px-4 py-3 text-white placeholder-[#8d93a8] focus:outline-none focus:border-teal-400 font-mono"
                placeholder="XXXX-XXXX-XXXX-XXXX"
              />
            </div>
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${success ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}
            >
              {loading ? '兑换中...' : '立即兑换'}
            </button>
          </form>
          <Link href="/dashboard" className="block mt-4 text-center text-sm text-[#8d93a8] hover:text-white">
            ← 返回控制台
          </Link>
        </div>
      </div>
    </div>
  )
}
