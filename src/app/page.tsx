import Link from 'next/link'

const MODELS=[
  {name:'DeepSeek R2',c:'#34e2c4'},{name:'GPT-4o',c:'#7263ff'},
  {name:'Claude 3.7',c:'#9b8aff'},{name:'Gemini 2.5',c:'#34e2c4'},
  {name:'Qwen3',c:'#34e2c4'},{name:'Seedream 3',c:'#34e2c4'},
  {name:'Kling 2.0',c:'#ff6f5e'},{name:'Veo 3',c:'#ff6f5e'},
]

export default function HomePage() {
  return (
    <div className="relative z-10 min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="orb opacity-25" style={{width:700,height:700,top:-250,left:-250,background:'radial-gradient(circle,#7263ff,transparent)'}}/>
      <div className="orb opacity-15" style={{width:550,height:550,top:'8%',right:-180,background:'radial-gradient(circle,#34e2c4,transparent)',animationDelay:'5s'}}/>
      <div className="orb opacity-10" style={{width:450,height:450,bottom:'-5%',left:'35%',background:'radial-gradient(circle,#ff6f5e,transparent)',animationDelay:'9s'}}/>

      {/* Sticky glass nav */}
      <nav className="glass sticky top-0 z-50 border-b border-[#1b2030]">
        <div className="max-w-[1180px] mx-auto px-8 flex items-center justify-between py-[17px]">
          <div className="flex items-center gap-[10px] font-grotesk font-bold text-[20px]">
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] font-bold text-white pulse-glow" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
            <span className="shimmer-text">枢 AI</span>
          </div>
          <div className="hidden md:flex gap-9 text-sm text-[#8d93a8]">
            <a href="#models" className="hover:text-[#edeff7] transition-colors duration-200">模型广场</a>
            <Link href="/dashboard" className="hover:text-[#edeff7] transition-colors duration-200">控制台</Link>
          </div>
          <Link href="/login" className="relative overflow-hidden text-white px-5 py-[9px] rounded-[8px] text-sm font-semibold hover:opacity-90 hover:shadow-lg transition-all duration-200" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 4px 20px -4px rgba(114,99,255,.5)'}}>登录</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[1180px] mx-auto px-8 pt-[96px] pb-[52px] text-center">
        <div className="fade-up inline-flex items-center gap-2 font-mono text-[12px] text-[#34e2c4] bg-[#34e2c422] border border-[#34e2c444] rounded-full px-[14px] py-[6px] mb-8">
          <span className="w-[6px] h-[6px] rounded-full bg-[#34e2c4] animate-pulse"/>无需翻墙 · 直连全球模型
        </div>
        <h1 className="fade-up-1 font-grotesk font-semibold leading-[1.14] mb-6" style={{fontSize:'clamp(38px,6vw,62px)'}}>
          多款大模型<br/><span className="grad-text">一站直达</span>
        </h1>
        <p className="fade-up-2 text-[17px] text-[#8d93a8] max-w-[560px] mx-auto mb-11 leading-[1.72]">
          对话、绘图、视频生成，统一接入全球顶尖模型。<br/>一个账号，一条线路，国内随时可用。
        </p>
        <div className="fade-up-3 flex gap-4 justify-center mb-24">
          <Link href="/register" className="relative px-8 py-[14px] rounded-[10px] text-[15px] font-semibold text-white overflow-hidden group transition-all duration-200 hover:scale-[1.02]" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 10px 36px -8px rgba(114,99,255,.55)'}}>
            <span className="relative z-10">免费开始使用</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"/>
          </Link>
          <a href="#models" className="bg-[#161b29] border border-[#222838] hover:border-[#7263ff66] text-[#edeff7] px-8 py-[14px] rounded-[10px] text-[15px] font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#7263ff]/10">查看全部模型</a>
        </div>

        {/* Architecture diagram */}
        <div className="fade-up-4 max-w-[900px] mx-auto mb-[96px] float">
          <svg viewBox="0 0 920 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <circle cx="60" cy="160" r="26" fill="#161b29" stroke="#2a3146" strokeWidth="1.5"/>
            <text x="60" y="165" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fill:'#8d93a8'}}>YOU</text>
            <path d="M86,160 L 376,160" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M86,160 L 376,160" stroke="#9b8aff" strokeWidth="1.5" fill="none"/>
            <circle cx="420" cy="160" r="44" fill="#10141f" stroke="#7263ff" strokeWidth="2"/>
            <circle cx="420" cy="160" r="52" fill="none" stroke="#7263ff" strokeWidth="8" opacity="0.07"/>
            <circle cx="420" cy="160" r="62" fill="none" stroke="#7263ff" strokeWidth="1" opacity="0.15" strokeDasharray="4 6"/>
            <text x="420" y="167" textAnchor="middle" style={{fontFamily:'Space Grotesk,sans-serif',fontSize:22,fill:'#fff',fontWeight:700}}>枢</text>
            <path d="M464,150 C 560,110 620,75 700,60" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path d="M464,160 L 700,160" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path d="M464,170 C 560,210 620,245 700,260" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M464,150 C 560,110 620,75 700,60" stroke="#7263ff" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M464,160 L 700,160" stroke="#34e2c4" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M464,170 C 560,210 620,245 700,260" stroke="#ff6f5e" strokeWidth="1.5" fill="none"/>
            <text x="712" y="58" style={{fontFamily:'Inter,sans-serif',fontSize:12.5,fontWeight:600,fill:'#a89aff'}}>对话</text>
            <text x="712" y="164" style={{fontFamily:'Inter,sans-serif',fontSize:12.5,fontWeight:600,fill:'#34e2c4'}}>绘图</text>
            <text x="712" y="264" style={{fontFamily:'Inter,sans-serif',fontSize:12.5,fontWeight:600,fill:'#ff8a7c'}}>视频</text>
            <rect x="700" y="28" width="94" height="22" rx="11" fill="#161b29" stroke="#3a3360"/>
            <text x="747" y="42" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:10.5,fill:'#8d93a8'}}>GPT · Claude</text>
            <rect x="700" y="134" width="94" height="22" rx="11" fill="#161b29" stroke="#235f54"/>
            <text x="747" y="148" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:10.5,fill:'#8d93a8'}}>Seedream</text>
            <rect x="700" y="234" width="94" height="22" rx="11" fill="#161b29" stroke="#5f3530"/>
            <text x="747" y="248" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:10.5,fill:'#8d93a8'}}>Kling · Veo</text>
          </svg>
        </div>

        {/* Models section */}
        <p id="models" className="font-mono text-[11px] text-[#565c70] tracking-[.1em] mb-6 uppercase">已接入模型</p>
        <div className="flex flex-wrap justify-center gap-3 mb-32">
          {MODELS.map((m)=>(
            <div key={m.name} className="group flex items-center gap-2 bg-[#10141f] border border-[#222838] hover:border-[#7263ff55] px-[18px] py-[10px] rounded-full text-[13.5px] cursor-default transition-all duration-200 hover:bg-[#161b29] hover:-translate-y-[2px] hover:shadow-md" style={{boxShadow:'none'}}>
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{background:m.c,boxShadow:`0 0 6px ${m.c}88`}}/>
              <span className="font-semibold text-[#edeff7]">{m.name}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-[1180px] mx-auto px-8 text-center py-8 text-[#565c70] text-[13px] border-t border-[#1b2030]">
        枢 AI · 一站式，直连全球大模型
      </footer>
    </div>
  )
}
