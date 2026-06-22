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
    if(pw.length<6){setError('密码至少 6 位');return}
    setLoading(true);setError('')
    const{error}=await createClient().auth.signUp({email,password:pw,options:{emailRedirectTo:`${location.origin}/api/auth/callback`}})
    if(error){setError(error.message);setLoading(false)}else setDone(true)
  }

  if(done)return(
    <div className="min-h-screen flex items-center justify-center px-6" style={{background:'var(--black)'}}>
      <div className="text-center scale-in max-w-[400px]">
        <div className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center text-[30px] mx-auto mb-6 float"
          style={{background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.3)'}}>✓</div>
        <h2 className="font-display font-bold text-[26px] mb-3" style={{color:'var(--text)'}}>验证邮件已发送</h2>
        <p className="text-[14.5px] leading-[1.8] mb-8" style={{color:'var(--text-2)'}}>
          请检查 <span style={{color:'var(--text)'}}>{email}</span> 的收件箱<br/>
          点击邮件中的链接完成注册
        </p>
        <Link href="/login" className="btn btn-ghost text-[14px] px-6 py-[10px]">返回登录</Link>
      </div>
    </div>
  )

  return(
    <div className="min-h-screen flex" style={{background:'var(--black)'}}>

      {/* Left decorative */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden" style={{background:'var(--deep)',borderRight:'1px solid var(--border)'}}>
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 60% at 20% 50%,rgba(245,158,11,.07),transparent)'}}/>

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-[15px] text-black logo-glow" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
          <span className="font-display font-bold text-[18px]" style={{color:'var(--text)'}}>枢 AI</span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display font-bold text-[32px] leading-[1.2] mb-4" style={{color:'var(--text)'}}>
            加入 <span className="grad-text">枢 AI</span><br/>开启 AI 新体验
          </h2>
          <p className="text-[15px] leading-[1.8] mb-8" style={{color:'var(--text-2)'}}>
            注册即可免费使用多款顶尖 AI 模型，<br/>智能对话、图像创作、视频生成一站搞定。
          </p>
          <div className="flex items-center gap-3 p-4 rounded-[14px]" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
            <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0" style={{background:'rgba(245,158,11,.1)'}}>🎁</div>
            <div>
              <div className="text-[13px] font-semibold" style={{color:'var(--text)'}}>新用户专属赠送</div>
              <div className="text-[12px]" style={{color:'var(--text-3)'}}>注册即送体验额度，立即开始创作</div>
            </div>
          </div>
        </div>

        <p className="text-[12px] relative z-10" style={{color:'var(--text-3)'}}>© 2025 枢 AI · 保留所有权利</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] fade-up">

          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center font-bold text-[14px] text-black" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-bold text-[17px]" style={{color:'var(--text)'}}>枢 AI</span>
          </Link>

          <h1 className="font-display font-bold text-[28px] mb-1.5" style={{color:'var(--text)'}}>创建账号</h1>
          <p className="text-[14px] mb-8" style={{color:'var(--text-2)'}}>
            已有账号？{' '}
            <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{color:'var(--amber)'}}>立即登录</Link>
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium mb-2" style={{color:'var(--text-2)'}}>邮箱地址</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="input px-4 py-3" placeholder="you@example.com"/>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium mb-2" style={{color:'var(--text-2)'}}>密码</label>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required
                className="input px-4 py-3" placeholder="至少 6 位"/>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium mb-2" style={{color:'var(--text-2)'}}>确认密码</label>
              <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} required
                className="input px-4 py-3" placeholder="再输一遍"/>
            </div>

            {error&&(
              <div className="px-4 py-3 rounded-[10px] text-[13px]" style={{background:'rgba(244,63,94,.08)',border:'1px solid rgba(244,63,94,.25)',color:'#f87171'}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full text-[15px] py-[13px] mt-2">
              {loading?(
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{animation:'rotate 1s linear infinite'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                  注册中...
                </span>
              ):'注册'}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{borderTop:'1px solid var(--border)'}}>
            <p className="text-[12px]" style={{color:'var(--text-3)'}}>
              注册即代表您同意我们的{' '}
              <a href="#" className="hover:text-[var(--text-2)] transition-colors">服务条款</a>
              {' '}与{' '}
              <a href="#" className="hover:text-[var(--text-2)] transition-colors">隐私政策</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
