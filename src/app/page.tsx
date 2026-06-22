import Link from 'next/link'
const MODELS=[{name:'GPT-4o',c:'#7263ff'},{name:'Claude',c:'#9b8aff'},{name:'Gemini',c:'#7263ff'},{name:'DeepSeek',c:'#34e2c4'},{name:'Qwen',c:'#34e2c4'},{name:'Seedream',c:'#34e2c4'},{name:'Kling',c:'#ff6f5e'},{name:'Veo',c:'#ff6f5e'}]
export default function HomePage() {
  return (
    <div className="relative z-10">
      <nav className="max-w-[1180px] mx-auto px-8 flex items-center justify-between py-[22px] border-b border-[#1b2030]">
        <div className="flex items-center gap-[10px] font-grotesk font-bold text-[20px]">
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] font-bold text-[#0a0d14]" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>枢 AI
        </div>
        <div className="hidden md:flex gap-9 text-sm text-muted">
          <a href="#models" className="hover:text-primary transition-colors">模型广场</a>
          <Link href="/dashboard" className="hover:text-primary transition-colors">控制台</Link>
        </div>
        <Link href="/login" className="bg-primary text-bg px-5 py-[9px] rounded-[8px] text-sm font-semibold">登录</Link>
      </nav>
      <section className="max-w-[1180px] mx-auto px-8 pt-[90px] pb-[50px] text-center">
        <div className="inline-flex items-center gap-2 font-mono text-[12px] text-teal bg-[#34e2c433] border border-[#34e2c44d] rounded-full px-[14px] py-[6px] mb-7">
          <span className="w-[6px] h-[6px] rounded-full bg-teal shadow-[0_0_8px_#34e2c4]"/>国内直连 · 无需 VPN
        </div>
        <h1 className="font-grotesk font-semibold text-[clamp(36px,6vw,58px)] leading-[1.18] mb-[22px]">
          所有大模型<br/><span className="grad-text">一站直达</span>
        </h1>
        <p className="text-[17px] text-muted max-w-[560px] mx-auto mb-9 leading-[1.7]">聊天、绘图、视频生成，统一接入全球顶尖模型。<br/>一个账号，一条线路，电脑手机都能用。</p>
        <div className="flex gap-[14px] justify-center mb-20">
          <Link href="/register" className="px-7 py-[13px] rounded-[9px] text-[15px] font-semibold text-white" style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 8px 24px -8px #7263ff55'}}>立即体验</Link>
          <a href="#models" className="bg-elevated border border-[#222838] text-primary px-7 py-[13px] rounded-[9px] text-[15px] font-semibold">查看接入模型</a>
        </div>
        <div className="max-w-[920px] mx-auto mb-[90px]">
          <svg viewBox="0 0 920 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <circle cx="60" cy="160" r="26" fill="#161b29" stroke="#2a3146" strokeWidth="1.5"/>
            <text x="60" y="165" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fill:'#8d93a8'}}>YOU</text>
            <path d="M86,160 L 380,160" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M86,160 L 380,160" stroke="#9b8aff" strokeWidth="1.5" fill="none"/>
            <circle cx="420" cy="160" r="44" fill="#10141f" stroke="#7263ff" strokeWidth="2"/>
            <circle cx="420" cy="160" r="44" fill="none" stroke="#7263ff" strokeWidth="8" opacity="0.12"/>
            <text x="420" y="167" textAnchor="middle" style={{fontFamily:'Space Grotesk,sans-serif',fontSize:20,fill:'#fff',fontWeight:700}}>枢</text>
            <path d="M464,150 C 560,110 620,75 700,60" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path d="M464,160 L 700,160" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path d="M464,170 C 560,210 620,245 700,260" stroke="#2a3146" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M464,150 C 560,110 620,75 700,60" stroke="#7263ff" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M464,160 L 700,160" stroke="#34e2c4" strokeWidth="1.5" fill="none"/>
            <path className="flow-line" d="M464,170 C 560,210 620,245 700,260" stroke="#ff6f5e" strokeWidth="1.5" fill="none"/>
            <text x="710" y="58" style={{fontFamily:'Inter,sans-serif',fontSize:12.5,fontWeight:600,fill:'#a89aff'}}>对话</text>
            <text x="710" y="164" style={{fontFamily:'Inter,sans-serif',fontSize:12.5,fontWeight:600,fill:'#34e2c4'}}>绘图</text>
            <text x="710" y="264" style={{fontFamily:'Inter,sans-serif',fontSize:12.5,fontWeight:600,fill:'#ff8a7c'}}>视频</text>
            <rect x="700" y="30" width="86" height="22" rx="11" fill="#161b29" stroke="#3a3360"/>
            <text x="743" y="44" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fill:'#8d93a8'}}>GPT · Claude</text>
            <rect x="700" y="136" width="86" height="22" rx="11" fill="#161b29" stroke="#235f54"/>
            <text x="743" y="150" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fill:'#8d93a8'}}>Seedream</text>
            <rect x="700" y="236" width="86" height="22" rx="11" fill="#161b29" stroke="#5f3530"/>
            <text x="743" y="250" textAnchor="middle" style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fill:'#8d93a8'}}>Kling · Veo</text>
          </svg>
        </div>
        <p id="models" className="font-mono text-[12px] text-dim tracking-[.05em] mb-[22px]">已接入模型</p>
        <div className="flex flex-wrap justify-center gap-3 mb-28">
          {MODELS.map(m=>(
            <div key={m.name} className="flex items-center gap-2 bg-surface border border-[#222838] px-[18px] py-[10px] rounded-full text-[13.5px] text-muted">
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{background:m.c}}/><span className="font-semibold text-primary">{m.name}</span>
            </div>
          ))}
        </div>
      </section>
      <footer className="max-w-[1180px] mx-auto px-8 text-center py-[30px] text-dim text-[13px] border-t border-[#1b2030]">枢 AI · 一个入口，直达全球大模型</footer>
    </div>
  )
}
