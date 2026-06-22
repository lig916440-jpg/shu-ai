'use client'
import{useState}from'react'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'
export default function RegisterPage(){
  const[email,setEmail]=useState('');const[pw,setPw]=useState('');const[pw2,setPw2]=useState('')
  const[error,setError]=useState('');const[loading,setLoading]=useState(false);const[done,setDone]=useState(false)
  async function submit(e:React.FormEvent){
    e.preventDefault()
    if(pw!==pw2){setError('两次密码不一致');return}
    if(pw.length<6){setError('密码至少6位');return}
    setLoading(true);setError('')
    const{error}=await createClient().auth.signUp({email,password:pw,options:{emailRedirectTo:`${location.origin}/api/auth/callback`}})
    if(error){setError(error.message);setLoading(false)}else setDone(true)
  }
  if(done)return(
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#34e2c422] border border-teal flex items-center justify-center text-teal text-2xl mx-auto mb-6">✓</div>
        <h2 className="font-grotesk text-[22px] font-semibold mb-3">验证邮件已发送</h2>
        <p className="text-muted text-[14px] mb-6">请检查 {email} 的收件箱，点击链接后即可登录。</p>
        <Link href="/login" className="text-violet text-[14px] hover:underline">返回登录</Link>
      </div>
    </div>
  )
  return(
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="flex items-center justify-center gap-[10px] font-grotesk font-bold text-[20px] mb-10">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] font-bold text-[#0a0d14]" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>枢 AI
        </Link>
        <div className="bg-surface border border-[#222838] rounded-[16px] p-8">
          <h1 className="font-grotesk font-semibold text-[22px] mb-1">创建账号</h1>
          <p className="text-muted text-[14px] mb-7">已有账号？<Link href="/login" className="text-violet hover:underline">立即登录</Link></p>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div><label className="block text-[13px] text-muted mb-1.5">邮箱</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" className="w-full bg-elevated border border-[#222838] rounded-[10px] px-4 py-[11px] text-[14px] text-primary placeholder:text-dim outline-none focus:border-violet transition-colors"/></div>
            <div><label className="block text-[13px] text-muted mb-1.5">密码</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} required placeholder="至少6位" className="w-full bg-elevated border border-[#222838] rounded-[10px] px-4 py-[11px] text-[14px] text-primary placeholder:text-dim outline-none focus:border-violet transition-colors"/></div>
            <div><label className="block text-[13px] text-muted mb-1.5">确认密码</label><input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} required placeholder="再输一遍" className="w-full bg-elevated border border-[#222838] rounded-[10px] px-4 py-[11px] text-[14px] text-primary placeholder:text-dim outline-none focus:border-violet transition-colors"/></div>
            {error&&<div className="bg-[#ff6f5e22] border border-[#ff6f5e55] text-coral text-[13px] rounded-[9px] px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading} className="mt-2 py-[12px] rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-60" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)'}}>
              {loading?'注册中...':'注册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
