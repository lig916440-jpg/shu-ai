'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Use hard redirect so middleware can read the new session cookie
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0d14]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg">枢</div>
          <span className="text-2xl font-semibold text-white">枢 AI</span>
        </div>

        <div className="bg-[#10141f] border border-[#222838] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">登录账号</h1>
          <p className="text-[#8d93a8] text-sm mb-6">
            还没有账号？{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300">
              立即注册
            </Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8d93a8] mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#161b29] border border-[#222838] rounded-xl px-4 py-3 text-white placeholder-[#8d93a8] focus:outline-none focus:border-violet-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8d93a8] mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#161b29] border border-[#222838] rounded-xl px-4 py-3 text-white placeholder-[#8d93a8] focus:outline-none focus:border-violet-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
