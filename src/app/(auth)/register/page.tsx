'use client'
import{useState}from'react'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'

export default function RegisterPage(){
  const[email,setEmail]=useState('')
  const[pw,setPw]=useState('')
  const[pw2,setPw2]=useState('')
  const[error,setError]=useState('')
  const[loading,setLoading]=useState(false)
  const[done,setDone]=useState(false)

  async function submit(e:React.FormEvent){
    e.preventDefault()
    if(pw!==pw2){setError('两次密码不一致');return}
    if(pw.length<6){setError('密码至少6位');return}
    setLoading(true);setError('')
    const{error}=await createClient().auth.signUp({email,password:pw,options:{emailRedirectTo:`${location.origin}/api/auth/callback`}})
    if(error){setError(error.message);setLoading(false)}else setDone(true)
  }

  if(done)return(
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="orb opacity-20" style={{width:500,height:500,top:-150,left:-150,background:'radial-gradient(circle,#34e2c4,transparent)'}}/>
      <div className="relative z-10 text-center fade-up px-4">
        <div className="w-20 h-20 rounded-full bg-[#34e2c422] border border-[#34e2c466] flex items-center justify-center text-[#34e2c4] text-3xl mx-auto mb-6 float">✓</div>
        <h2 className="font-grotesk text-[24px] font-semibold mb-3 text-[#edeff7]">验证邮件已发送</h2>
        <p className="text-[#8d93a8] text-[14px] mb-8 leading-relaxed">请检查 <span className="text-[#edeff7]">{email}</span> 的收件箱<br/>点击邮件中的链接完成注册</p>
        <Link href="/login" className="text-[#7263ff] hover:text-[#9b8aff] text-[14px] transition-colors">返回登录 →</Link>
      </div>
    </div>
  )

  return(
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="orb opacity-20" style={{width:600,height:600,top:-200,left:-200,background:'radial-gradient(circle,#7263ff,transparent)'}}/>
      <div className="orb opacity-12" style={{width:450,height:450,bottom:-150,right:-100,background:'radial-gradient(circle,#34e2c4,transparent)',animationDelay:'7s'}}/>

      <div className="relative z-10 w-full max-w-[420px] px-4 fade-up">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center text-[18px] font-bold text-white pulse-glow" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
          <span className="text-[22px] font-bold shimmer-text font-grotesk">枢 AI</span>
        </Link>

        <div className="glass-card border border-[#222838] rounded-[20px] p-8">
          <h1 className="text-[24px] font-bold text-[#edeff7] mb-1">创建账号</h1>
          <p className="text-[#8d93a8] text-sm mb-7">
            已有账号？{' '}
            <Link href="/login" className="text-[#7263ff] hover:text-[#9b8aff] transition-colors">立即登录</Link>
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[13px] text-[#8d93a8] mb-2">邮箱</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full bg-[#0a0d14] border border-[#222838] rounded-[11px] px-4 py-3 text-[#edeff7] placeholder-[#565c70] outline-none transition-all duration-200 focus:border-[#7263ff88] focus:shadow-[0_0_0_3px_rgba(114,99,255,.1)]"/>
            </div>
            <div>
              <label className="block text-[13px] text-[#8d93a8] mb-2">密码</label>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required placeholder="至少 6 位"
                className="w-full bg-[#0a0d14] border border-[#222838] rounded-[11px] px-4 py-3 text-[#edeff7] placeholder-[#565c70] outline-none transition-all duration-200 focus:border-[#7263ff88] focus:shadow-[0_0_0_3px_rgba(114,99,255,.1)]"/>
            </div>
            <div>
              <label className="block text-[13px] text-[#8d93a8] mb-2">确认密码</label>
              <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} required placeholder="再输一遍"
                className="w-full bg-[#0a0d14] border border-[#222838] rounded-[11px] px-4 py-3 text-[#edeff7] placeholder-[#565c70] outline-none transition-all duration-200 focus:border-[#7263ff88] focus:shadow-[0_0_0_3px_rgba(114,99,255,.1)]"/>
            </div>

            {error&&<div className="bg-[#ff6f5e18] border border-[#ff6f5e44] text-[#ff8a7c] text-[13px] rounded-[10px] px-4 py-3">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-[13px] rounded-[11px] text-[15px] mt-2 transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 8px 28px -6px rgba(114,99,255,.5)'}}>
              {loading?(
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  注册中...
                </span>
              ):'注册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
