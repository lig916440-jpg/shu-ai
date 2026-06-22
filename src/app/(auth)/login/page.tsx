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
    e.preventDefault();setLoading(true);setError('')
    const{error}=await createClient().auth.signInWithPassword({email,password})
    if(error){setError(error.message);setLoading(false);return}
    window.location.href='/dashboard'
  }

  return(
    <div className="min-h-screen flex" style={{background:'var(--black)'}}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden" style={{background:'var(--deep)',borderRight:'1px solid var(--border)'}}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 60% at 20% 50%,rgba(245,158,11,.07),transparent)'}}/>

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-[15px] text-black logo-glow" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
          <span className="font-display font-bold text-[18px]" style={{color:'var(--text)'}}>枢 AI</span>
        </Link>

        <div className="relative z-10">
          <p className="font-mono-custom text-[11px] tracking-[.12em] uppercase mb-5" style={{color:'var(--amber)'}}>FEATURES</p>
          <div className="space-y-5">
            {[
              {icon:'💬',t:'多模型对话',d:'DeepSeek · GPT · Claude 自由切换'},
              {icon:'🎨',t:'AI 图片生成',d:'xAI Aurora 模型驱动，秒出精美图片'},
              {icon:'🎬',t:'AI 视频生成',d:'Gemini Veo 2，文字一键变短视频'},
              {icon:'🌐',t:'全球直连',d:'国内可用，无需 VPN，低延迟访问'},
            ].map((f,i)=>(
              <div key={i} className="flex items-start gap-4 fade-up" style={{animationDelay:`${i*.1}s`}}>
                <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[16px] flex-shrink-0" style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.18)'}}>
                  {f.icon}
                </div>
                <div>
                  <div className="font-semibold text-[14px] mb-0.5" style={{color:'var(--text)'}}>{f.t}</div>
                  <div className="text-[12.5px]" style={{color:'var(--text-3)'}}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] relative z-10" style={{color:'var(--text-3)'}}>© 2025 枢 AI · 保留所有权利</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] fade-up">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center font-bold text-[14px] text-black" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-bold text-[17px]" style={{color:'var(--text)'}}>枢 AI</span>
          </Link>

          <h1 className="font-display font-bold text-[28px] mb-1.5" style={{color:'var(--text)'}}>欢迎回来</h1>
          <p className="text-[14px] mb-8" style={{color:'var(--text-2)'}}>
            还没有账号？{' '}
            <Link href="/register" className="font-semibold transition-colors hover:opacity-80" style={{color:'var(--amber)'}}>立即注册</Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium mb-2" style={{color:'var(--text-2)'}}>邮箱地址</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="input px-4 py-3 text-[14px]" placeholder="your@email.com"/>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium mb-2" style={{color:'var(--text-2)'}}>密码</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="input px-4 py-3 text-[14px]" placeholder="••••••••"/>
            </div>

            {error&&(
              <div className="px-4 py-3 rounded-[10px] text-[13px]" style={{background:'rgba(244,63,94,.08)',border:'1px solid rgba(244,63,94,.25)',color:'#f87171'}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn btn-primary w-full text-[15px] py-[13px] mt-2">
              {loading?(
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{animation:'rotate 1s linear infinite'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                  登录中...
                </span>
              ):'登录'}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{borderTop:'1px solid var(--border)'}}>
            <p className="text-[12px]" style={{color:'var(--text-3)'}}>
              登录即代表您同意我们的{' '}
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
