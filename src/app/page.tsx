'use client'
import{useState,useEffect,useRef}from'react'
import Link from'next/link'

const ALL_MODELS=[
  'DeepSeek V4','GPT-5.5','Claude Opus 4','Gemini 3.5','Qwen3 Plus',
  'Suno 4.5','Kling 2.0','Veo 3.1','Seedream 3','Grok 4',
  'MiniMax M3','VIDU','GPT Image 2','Midjourney','FLUX',
  'Stable Diffusion 3','Runway Gen4','Pika 2.5','ElevenLabs','Sora 2',
]
const WORDS=['对话','绘图','视频','音乐','创作']
const FEATURES=[
  {icon:'💬',title:'智能对话',desc:'GPT / Claude / Gemini / DeepSeek，多模型自由切换，精准回答每一个问题。',color:'#7263ff'},
  {icon:'🎨',title:'图像创作',desc:'Midjourney / FLUX / Seedream，输入文字即刻出图，写实、插画、3D 任选。',color:'#34e2c4'},
  {icon:'🎬',title:'视频生成',desc:'Kling / Veo / Sora / Runway，文字或图片一键生成电影级视频。',color:'#9b8aff'},
  {icon:'🎵',title:'语音合成',desc:'多语言、多音色智能配音，从旁白到对白，让内容拥有专业级声音。',color:'#ff6f5e'},
]
const STATS=[{num:'500',suffix:'+',label:'AI 模型'},{num:'10K',suffix:'+',label:'注册用户'},{num:'∞',suffix:'',label:'创造可能'}]

// Duplicate for seamless loop
const TICKER1=[...ALL_MODELS,...ALL_MODELS]
const TICKER2=[...ALL_MODELS.slice(10),...ALL_MODELS,...ALL_MODELS.slice(10)]

export default function HomePage(){
  const[wordIdx,setWordIdx]=useState(0)
  const[displayed,setDisplayed]=useState('')
  const[typing,setTyping]=useState(true)

  useEffect(()=>{
    const word=WORDS[wordIdx]
    if(typing){
      if(displayed.length<word.length){
        const t=setTimeout(()=>setDisplayed(word.slice(0,displayed.length+1)),110)
        return()=>clearTimeout(t)
      }else{
        const t=setTimeout(()=>setTyping(false),1800)
        return()=>clearTimeout(t)
      }
    }else{
      if(displayed.length>0){
        const t=setTimeout(()=>setDisplayed(displayed.slice(0,-1)),55)
        return()=>clearTimeout(t)
      }else{
        setWordIdx(i=>(i+1)%WORDS.length)
        setTyping(true)
      }
    }
  },[displayed,typing,wordIdx])

  return(
    <div className="relative z-10 min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="orb opacity-20" style={{width:700,height:700,top:-250,left:-250,background:'radial-gradient(circle,#7263ff,transparent)'}}/>
      <div className="orb opacity-12" style={{width:550,height:550,top:'5%',right:-200,background:'radial-gradient(circle,#34e2c4,transparent)',animationDelay:'6s'}}/>
      <div className="orb opacity-08" style={{width:400,height:400,bottom:'10%',left:'40%',background:'radial-gradient(circle,#9b8aff,transparent)',animationDelay:'10s'}}/>

      {/* ── STICKY NAV ── */}
      <nav className="glass sticky top-0 z-50 border-b border-[#1b2030]">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between py-4">
          <div className="flex items-center gap-[10px]">
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] font-bold text-white pulse-glow" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
            <span className="shimmer-text font-bold text-[20px]" style={{fontFamily:'Space Grotesk,sans-serif'}}>枢 AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#8d93a8]">
            <a href="#features" className="hover:text-white transition-colors">功能</a>
            <a href="#models" className="hover:text-white transition-colors">模型</a>
            <Link href="/dashboard" className="hover:text-white transition-colors">控制台</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#8d93a8] hover:text-white transition-colors px-3 py-2">登录</Link>
            <Link href="/register" className="text-sm text-white font-semibold px-5 py-[9px] rounded-[9px] transition-all hover:opacity-90 hover:shadow-lg hover:scale-[1.02]" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 4px 20px rgba(114,99,255,.4)'}}>免费注册</Link>
          </div>
        </div>
      </nav>

      {/* ── TICKER ROW 1 ── */}
      <div className="relative overflow-hidden py-3 border-b border-[#1b2030]" style={{background:'rgba(16,20,31,.6)'}}>
        <div className="flex marquee-track" style={{width:'max-content'}}>
          {TICKER1.map((m,i)=>(
            <div key={i} className="flex items-center gap-2 mx-3 flex-shrink-0">
              <span className="w-[5px] h-[5px] rounded-full" style={{background: i%3===0?'#7263ff':i%3===1?'#34e2c4':'#ff6f5e',boxShadow:`0 0 6px ${i%3===0?'#7263ff':i%3===1?'#34e2c4':'#ff6f5e'}`}}/>
              <span className="text-[12.5px] text-[#8d93a8] whitespace-nowrap font-mono">{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 text-center">
        <div className="fade-up inline-flex items-center gap-2 text-[12px] font-mono text-[#34e2c4] bg-[#34e2c41a] border border-[#34e2c433] rounded-full px-4 py-[6px] mb-8">
          <span className="w-[6px] h-[6px] rounded-full bg-[#34e2c4] animate-pulse"/>无需翻墙 · 直连全球顶尖模型
        </div>

        <h1 className="fade-up-1 font-bold leading-[1.12] mb-4" style={{fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(42px,7vw,72px)'}}>
          让 AI 为你
          <br/>
          <span className="grad-text">{displayed}</span>
          <span className="cursor-blink text-[#7263ff]">|</span>
        </h1>

        <p className="fade-up-2 text-[17px] text-[#8d93a8] max-w-[580px] mx-auto mb-10 leading-[1.75]">
          聚合全球顶尖大模型，智能对话 / 图像创作 / 视频生成<br/>一个平台，释放无限可能
        </p>

        <div className="fade-up-3 flex gap-4 justify-center mb-16">
          <Link href="/register" className="relative px-8 py-[14px] rounded-[11px] text-[15px] font-semibold text-white overflow-hidden group hover:scale-[1.02] transition-all" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 10px 36px -8px rgba(114,99,255,.55)'}}>
            <span className="relative z-10">开始使用 →</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"/>
          </Link>
          <a href="#features" className="px-8 py-[14px] rounded-[11px] text-[15px] font-semibold text-[#edeff7] border border-[#222838] hover:border-[#7263ff66] hover:bg-[#161b29] transition-all">了解功能</a>
        </div>

        {/* Stats row */}
        <div className="fade-up-4 flex justify-center gap-12 mb-20">
          {STATS.map((s,i)=>(
            <div key={i} className="text-center">
              <div className="font-bold text-[36px] leading-none mb-1" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(135deg,#edeff7,#8d93a8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                {s.num}<span className="text-[#7263ff]">{s.suffix}</span>
              </div>
              <div className="text-[13px] text-[#565c70]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Model ticker row 2 - reverse direction */}
        <div className="fade-up-5 relative overflow-hidden rounded-[16px] py-3 border border-[#1b2030]" style={{background:'rgba(16,20,31,.5)'}}>
          <div className="flex marquee-reverse" style={{width:'max-content'}}>
            {TICKER2.map((m,i)=>(
              <div key={i} className="flex items-center gap-[10px] mx-4 px-3 py-[6px] rounded-full border border-[#222838] flex-shrink-0" style={{background:'rgba(22,27,41,.8)'}}>
                <span className="w-[6px] h-[6px] rounded-full" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}/>
                <span className="text-[12px] text-[#8d93a8] font-mono whitespace-nowrap">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="font-mono text-[11px] text-[#565c70] tracking-[.1em] uppercase mb-4">Platform</p>
          <h2 className="font-bold text-[clamp(28px,4vw,42px)] mb-4" style={{fontFamily:'Space Grotesk,sans-serif'}}>
            四大核心能力，<span className="grad-text">一个平台</span>
          </h2>
          <p className="text-[16px] text-[#8d93a8] max-w-[480px] mx-auto">从对话到创作，覆盖 AI 全场景需求</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((f,i)=>(
            <div key={i} className="glass-card border border-[#222838] rounded-[18px] p-7 hover-lift grad-border group cursor-default">
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[24px] mb-5" style={{background:`${f.color}22`,border:`1px solid ${f.color}44`}}>{f.icon}</div>
              <h3 className="font-bold text-[18px] mb-2 text-[#edeff7]" style={{fontFamily:'Space Grotesk,sans-serif'}}>{f.title}</h3>
              <p className="text-[14px] text-[#8d93a8] leading-[1.7]">{f.desc}</p>
              <div className="mt-4 text-[13px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{color:f.color}}>了解更多 →</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODELS SECTION ── */}
      <section id="models" className="py-20 border-t border-[#1b2030]" style={{background:'rgba(16,20,31,.4)'}}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] text-[#565c70] tracking-[.1em] uppercase mb-4">Models</p>
            <h2 className="font-bold text-[clamp(28px,4vw,42px)]" style={{fontFamily:'Space Grotesk,sans-serif'}}>
              <span className="grad-text">500+</span> 顶尖模型
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {ALL_MODELS.map((m,i)=>(
              <div key={m} className="flex items-center gap-2 border border-[#222838] hover:border-[#7263ff55] px-4 py-[9px] rounded-full text-[13px] cursor-default transition-all hover:bg-[#161b29] hover:-translate-y-[2px]" style={{background:'rgba(10,13,20,.6)'}}>
                <span className="w-[5px] h-[5px] rounded-full" style={{background:i%3===0?'#7263ff':i%3===1?'#34e2c4':'#9b8aff',boxShadow:`0 0 5px ${i%3===0?'#7263ff':i%3===1?'#34e2c4':'#9b8aff'}`}}/>
                <span className="font-semibold text-[#edeff7]">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-24 text-center relative overflow-hidden">
        <div className="orb opacity-25" style={{width:500,height:500,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,#7263ff,transparent)'}}/>
        <div className="relative z-10 max-w-[600px] mx-auto px-6">
          <h2 className="font-bold text-[clamp(28px,4vw,48px)] mb-6 leading-[1.2]" style={{fontFamily:'Space Grotesk,sans-serif'}}>
            现在就开始<br/><span className="grad-text">你的 AI 之旅</span>
          </h2>
          <p className="text-[#8d93a8] text-[16px] mb-10">免费注册 · 无需信用卡 · 国内直连</p>
          <Link href="/register" className="inline-block px-10 py-[15px] rounded-[12px] text-[16px] font-semibold text-white hover:scale-[1.03] hover:shadow-2xl transition-all" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 12px 40px -8px rgba(114,99,255,.6)'}}>
            立即免费注册 →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1b2030] py-8" style={{background:'rgba(10,13,20,.8)'}}>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center text-[14px] font-bold text-white" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
            <span className="text-[14px] font-semibold text-[#edeff7]">枢 AI</span>
            <span className="text-[#565c70] text-[13px] ml-2">一站式 AI 平台</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-[#565c70]">
            <a href="#" className="hover:text-[#8d93a8] transition-colors">隐私政策</a>
            <a href="#" className="hover:text-[#8d93a8] transition-colors">服务条款</a>
            <a href="#" className="hover:text-[#8d93a8] transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
