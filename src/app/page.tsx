'use client'
import{useState,useEffect,useRef}from'react'
import Link from'next/link'

const MODELS=['DeepSeek V4','GPT-5.5','Claude Opus 4','Gemini 3.5','Qwen3 Plus','Suno 4.5','Kling 2.0','Veo 3.1','Grok 4','FLUX','MiniMax M3','Runway Gen4','Pika 2.5','Midjourney','Sora 2','Stable Diffusion 3','ElevenLabs','GPT Image 2','Seedream 3','VIDU']
const WORDS=['对话','绘图','视频','创作','探索']
const FEATURES=[
  {no:'01',title:'智能对话',desc:'GPT / Claude / Gemini / DeepSeek，多模型自由切换，精准回答每一个问题。',icon:'💬'},
  {no:'02',title:'图像创作',desc:'Midjourney / FLUX / Seedream，输入文字即刻出图，写实、插画、3D 任选。',icon:'🎨'},
  {no:'03',title:'视频生成',desc:'Kling / Veo / Sora / Runway，文字或图片一键生成电影级视频。',icon:'🎬'},
  {no:'04',title:'语音合成',desc:'多语言、多音色智能配音，从旁白到对白，专业级声音触手可及。',icon:'🎵'},
]
const STATS=[{val:'500',unit:'+',label:'AI 模型集成'},{val:'10K',unit:'+',label:'全球注册用户'},{val:'99.9',unit:'%',label:'服务可用率'}]
const TICKER=[...MODELS,...MODELS]

function MagneticBtn({children,className,href,onClick}:{children:React.ReactNode;className:string;href?:string;onClick?:()=>void}){
  const ref=useRef<HTMLAnchorElement&HTMLButtonElement>(null)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const move=(e:MouseEvent)=>{
      const r=el.getBoundingClientRect()
      const x=(e.clientX-r.left-r.width/2)*.25
      const y=(e.clientY-r.top-r.height/2)*.25
      el.style.transform=`translate(${x}px,${y}px)`
    }
    const leave=()=>{el.style.transform='';el.style.transition='transform .4s cubic-bezier(.4,0,.2,1)'}
    const enter=()=>{el.style.transition='transform .1s ease'}
    el.addEventListener('mousemove',move)
    el.addEventListener('mouseleave',leave)
    el.addEventListener('mouseenter',enter)
    return()=>{el.removeEventListener('mousemove',move);el.removeEventListener('mouseleave',leave);el.removeEventListener('mouseenter',enter)}
  },[])
  if(href)return<Link ref={ref as any} href={href} className={className}>{children}</Link>
  return<button ref={ref as any} onClick={onClick} className={className}>{children}</button>
}

export default function HomePage(){
  const[wordIdx,setWordIdx]=useState(0)
  const[displayed,setDisplayed]=useState('')
  const[typing,setTyping]=useState(true)
  const[menuOpen,setMenuOpen]=useState(false)

  useEffect(()=>{
    const word=WORDS[wordIdx]
    if(typing){
      if(displayed.length<word.length){const t=setTimeout(()=>setDisplayed(word.slice(0,displayed.length+1)),100);return()=>clearTimeout(t)}
      else{const t=setTimeout(()=>setTyping(false),1600);return()=>clearTimeout(t)}
    }else{
      if(displayed.length>0){const t=setTimeout(()=>setDisplayed(displayed.slice(0,-1)),50);return()=>clearTimeout(t)}
      else{setWordIdx(i=>(i+1)%WORDS.length);setTyping(true)}
    }
  },[displayed,typing,wordIdx])

  return(
    <div className="relative z-10 min-h-screen">

      {/* NAV */}
      <nav className="sticky top-0 z-50" style={{background:'rgba(8,8,9,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
        <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-between h-[62px]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-[15px] text-black logo-glow" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-bold text-[18px]" style={{color:'var(--text)'}}>枢 AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[13.5px]" style={{color:'var(--text-2)'}}>
            <a href="#features" className="hover:text-[var(--text)] transition-colors">功能</a>
            <a href="#models" className="hover:text-[var(--text)] transition-colors">模型</a>
            <Link href="/dashboard" className="hover:text-[var(--text)] transition-colors">控制台</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-[13px] px-4 py-[8px] hidden sm:flex">登录</Link>
            <MagneticBtn href="/register" className="btn btn-primary text-[13px] px-5 py-[9px]">免费注册</MagneticBtn>
          </div>
        </div>
      </nav>

      {/* TICKER */}
      <div className="overflow-hidden border-b" style={{background:'var(--deep)',borderColor:'var(--border)',padding:'10px 0'}}>
        <div className="flex marquee-track" style={{width:'max-content',gap:0}}>
          {TICKER.map((m,i)=>(
            <div key={i} className="flex items-center gap-2 flex-shrink-0 px-4">
              <span className="w-[4px] h-[4px] rounded-full" style={{background:i%2===0?'var(--amber)':'var(--text-3)'}}/>
              <span className="text-[12px] font-mono-custom whitespace-nowrap" style={{color:'var(--text-3)'}}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="max-w-[1160px] mx-auto px-6 pt-24 pb-20">
        <div className="fade-up badge mb-8 mx-auto w-fit">
          <span className="w-[5px] h-[5px] rounded-full bg-[var(--amber)] inline-block" style={{animation:'typeWave 2s ease-in-out infinite'}}/>
          无需翻墙 · 国内直连 · 全球顶尖模型
        </div>

        <h1 className="font-display text-center mb-6 fade-up-1 leading-[1.08]" style={{fontSize:'clamp(44px,8vw,84px)',color:'var(--text)',letterSpacing:'-.02em'}}>
          让 AI 为你<br/>
          <span className="grad-text">{displayed||' '}</span>
          <span className="cursor-blink" style={{color:'var(--amber)'}}>|</span>
        </h1>

        <p className="fade-up-2 text-center text-[17px] max-w-[540px] mx-auto mb-12 leading-[1.8]" style={{color:'var(--text-2)'}}>
          聚合全球顶尖大模型，智能对话 / 图像创作 / 视频生成<br/>一个平台，释放无限可能
        </p>

        <div className="fade-up-3 flex gap-3 justify-center mb-20 flex-wrap">
          <MagneticBtn href="/register" className="btn btn-primary text-[15px] px-8 py-[13px]">
            开始使用
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7.5 2.5L12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </MagneticBtn>
          <MagneticBtn href="#features" className="btn btn-ghost text-[15px] px-8 py-[13px]">了解功能</MagneticBtn>
        </div>

        {/* Stats */}
        <div className="fade-up-4 grid grid-cols-3 gap-4 max-w-[560px] mx-auto mb-16">
          {STATS.map((s,i)=>(
            <div key={i} className="text-center p-5 rounded-[var(--r-l)] border" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
              <div className="font-display font-bold mb-1" style={{fontSize:'clamp(26px,4vw,36px)',color:'var(--amber)'}}>
                {s.val}<span style={{color:'var(--text-2)',fontSize:'0.65em'}}>{s.unit}</span>
              </div>
              <div className="text-[12px]" style={{color:'var(--text-3)'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Model pills ticker row 2 */}
        <div className="fade-up-5 overflow-hidden rounded-[var(--r-l)] border p-3" style={{background:'var(--surface)',borderColor:'var(--border)'}}>
          <div className="flex marquee-reverse" style={{width:'max-content'}}>
            {TICKER.map((m,i)=>(
              <div key={i} className="flex items-center gap-2 mx-2 px-3 py-[6px] rounded-full border flex-shrink-0" style={{background:'var(--raised)',borderColor:'var(--border)'}}>
                <span className="w-[5px] h-[5px] rounded-full" style={{background:i%3===0?'var(--amber)':i%3===1?'var(--sky)':'var(--text-3)'}}/>
                <span className="text-[11.5px] font-mono-custom whitespace-nowrap" style={{color:'var(--text-2)'}}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24" style={{background:'var(--deep)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="mb-16">
            <p className="font-mono-custom text-[11px] tracking-[.12em] uppercase mb-4" style={{color:'var(--amber)'}}>PLATFORM</p>
            <h2 className="font-display font-bold leading-[1.1]" style={{fontSize:'clamp(30px,5vw,52px)',color:'var(--text)'}}>
              四大核心能力<br/><span className="grad-text">一个平台全覆盖</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f,i)=>(
              <div key={i} className="card card-amber p-8 cursor-default group">
                <div className="flex items-start justify-between mb-6">
                  <span className="font-mono-custom text-[11px]" style={{color:'var(--text-3)'}}>{f.no}</span>
                  <div className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center text-[20px]" style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.16)'}}>
                    {f.icon}
                  </div>
                </div>
                <h3 className="font-display font-bold text-[22px] mb-3" style={{color:'var(--text)'}}>{f.title}</h3>
                <p className="text-[14px] leading-[1.75]" style={{color:'var(--text-2)'}}>{f.desc}</p>
                <div className="mt-6 flex items-center gap-1.5 text-[13px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'var(--amber)'}}>
                  了解更多
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODELS */}
      <section id="models" className="py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="font-mono-custom text-[11px] tracking-[.12em] uppercase mb-4" style={{color:'var(--amber)'}}>MODELS</p>
            <h2 className="font-display font-bold" style={{fontSize:'clamp(28px,4vw,46px)',color:'var(--text)'}}>
              <span className="grad-text">500+</span> 顶尖模型任意调用
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {MODELS.map((m,i)=>(
              <div key={m} className="btn btn-ghost text-[13px] px-4 py-[9px] cursor-default" style={{fontSize:'13px'}}>
                <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{background:i%3===0?'var(--amber)':i%3===1?'var(--sky)':'var(--text-3)'}}/>
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28" style={{background:'var(--deep)',borderTop:'1px solid var(--border)'}}>
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <div className="w-[70px] h-[70px] rounded-[18px] flex items-center justify-center font-bold text-[30px] text-black mx-auto mb-8 float logo-glow" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
          <h2 className="font-display font-bold mb-5 leading-[1.15]" style={{fontSize:'clamp(28px,5vw,50px)',color:'var(--text)'}}>
            现在就开始<br/>你的 AI 之旅
          </h2>
          <p className="mb-10 text-[16px]" style={{color:'var(--text-2)'}}>免费注册 · 无需信用卡 · 国内直连</p>
          <MagneticBtn href="/register" className="btn btn-primary text-[16px] px-10 py-[14px]">
            立即免费注册
          </MagneticBtn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t" style={{borderColor:'var(--border)'}}>
        <div className="max-w-[1160px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center font-bold text-[12px] text-black" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-semibold text-[14px]" style={{color:'var(--text)'}}>枢 AI</span>
            <span className="text-[12px] ml-1" style={{color:'var(--text-3)'}}>一站式 AI 平台</span>
          </div>
          <div className="flex gap-6 text-[12px]" style={{color:'var(--text-3)'}}>
            <a href="#" className="hover:text-[var(--text-2)] transition-colors">隐私政策</a>
            <a href="#" className="hover:text-[var(--text-2)] transition-colors">服务条款</a>
            <a href="#" className="hover:text-[var(--text-2)] transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
