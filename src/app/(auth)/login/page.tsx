'use client'
import{useState}from'react'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'

export default function LoginPage(){
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[error,setError]=useState('')
  const[loading,setLoading]=useState(false)

  const handleLogin=async(e:React.FormEvent)=>{
    e.preventDefault()
    setLoading(true);setError('')
    const supabase=createClient()
    const{error}=await supabase.auth.signInWithPassword({email,password})
    if(error){setError(error.message);setLoading(false);return}
    window.location.href='/dashboard'
  }

  return(
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb opacity-20" style={{width:600,height:600,top:-200,left:-200,background:'radial-gradient(circle,#7263ff,transparent)'}}/>
      <div className="orb opacity-15" style={{width:500,height:500,bottom:-150,right:-150,background:'radial-gradient(circle,#34e2c4,transparent)',animationDelay:'6s'}}/>

      <div className="relative z-10 w-full max-w-[420px] px-4 fade-up">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center text-[18px] font-bold text-white pulse-glow" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
          <span className="text-[22px] font-bold shimmer-text font-grotesk">枢 AI</span>
        </Link>

        {/* Card */}
        <div className="glass-card border border-[#222838] rounded-[20px] p-8">
          <h1 className="text-[24px] font-bold text-[#edeff7] mb-1">欢迎回来</h1>
          <p className="text-[#8d93a8] text-sm mb-7">
            还没有账号？{' '}
            <Link href="/register" className="text-[#7263ff] hover:text-[#9b8aff] transition-colors">立即注册</Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] text-[#8d93a8] mb-2">邮箱</label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full bg-[#0a0d14] border border-[#222838] rounded-[11px] px-4 py-3 text-[#edeff7] placeholder-[#565c70] outline-none transition-all duration-200 focus:border-[#7263ff88] focus:shadow-[0_0_0_3px_rgba(114,99,255,.1)]"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#8d93a8] mb-2">密码</label>
              <input
                type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="w-full bg-[#0a0d14] border border-[#222838] rounded-[11px] px-4 py-3 text-[#edeff7] placeholder-[#565c70] outline-none transition-all duration-200 focus:border-[#7263ff88] focus:shadow-[0_0_0_3px_rgba(114,99,255,.1)]"
                placeholder="••••••••"
              />
            </div>

            {error&&(
              <div className="bg-[#ff6f5e18] border border-[#ff6f5e44] rounded-[10px] px-4 py-3 text-[#ff8a7c] text-[13px]">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-[13px] rounded-[11px] text-[15px] transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 8px 28px -6px rgba(114,99,255,.5)'}}>
              {loading?(
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  登录中...
                </span>
              ):'登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
