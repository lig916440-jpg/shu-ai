'use client'
import{useState,useRef,useEffect,useCallback}from'react'
import Link from'next/link'
import{createClient}from'@/lib/supabase/client'
import{useRouter}from'next/navigation'

interface Model{id:string;name:string;provider:string;price_per_unit:number}
interface Message{role:'user'|'assistant';content:string;model?:string;elapsed?:number}
interface Session{id:string;title:string;messages:Message[];modelName:string}
interface Props{user:{id:string;email:string};initialCredits:number;models:Model[]}

function genId(){return Math.random().toString(36).slice(2)}

/* ─── Particle Canvas ─── */
function ParticleCanvas(){
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const mouse=useRef({x:-9999,y:-9999})
  useEffect(()=>{
    const canvas=canvasRef.current!
    const ctx=canvas.getContext('2d')!
    let animId:number
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight}
    resize()
    window.addEventListener('resize',resize)
    const onMove=(e:MouseEvent)=>{mouse.current={x:e.clientX,y:e.clientY}}
    window.addEventListener('mousemove',onMove)
    const N=90
    const pts=Array.from({length:N},()=>({
      x:Math.random()*window.innerWidth,
      y:Math.random()*window.innerHeight,
      vx:(Math.random()-.5)*.5,
      vy:(Math.random()-.5)*.5,
      r:Math.random()*1.8+.6,
      hue:Math.random()>.5?263:174,
    }))
    const CONN=130,REPEL=110
    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height)
      for(const p of pts){
        const dx=mouse.current.x-p.x,dy=mouse.current.y-p.y
        const d=Math.sqrt(dx*dx+dy*dy)
        if(d<REPEL&&d>0){const f=(REPEL-d)/REPEL*.6;p.vx-=(dx/d)*f;p.vy-=(dy/d)*f}
        p.vx*=.97;p.vy*=.97
        p.x+=p.vx;p.y+=p.vy
        if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0
        if(p.y<0)p.y=canvas.height;if(p.y>canvas.height)p.y=0
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`hsla(${p.hue},80%,65%,.75)`
        ctx.shadowBlur=8;ctx.shadowColor=`hsla(${p.hue},80%,65%,1)`
        ctx.fill()
        ctx.restore()
      }
      for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y
        const d=Math.sqrt(dx*dx+dy*dy)
        if(d<CONN){
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(pts[i].x,pts[i].y)
          ctx.lineTo(pts[j].x,pts[j].y)
          const a=(1-d/CONN)*.18
          ctx.strokeStyle=`rgba(114,99,255,${a})`
          ctx.lineWidth=.7
          ctx.stroke()
          ctx.restore()
        }
      }
      animId=requestAnimationFrame(tick)
    }
    tick()
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',onMove)}
  },[])
  return<canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60"/>
}

/* ─── Scan Line ─── */
function ScanLine(){
  return(
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div style={{position:'absolute',width:'100%',height:'2px',background:'linear-gradient(90deg,transparent,rgba(114,99,255,.18),rgba(52,226,196,.22),transparent)',animation:'scanline 8s linear infinite',top:0}}/>
    </div>
  )
}

const QUICK_PROMPTS=[
  {icon:'🔍',label:'深度分析',text:'请对以下内容进行深度分析：'},
  {icon:'💻',label:'代码设计',text:'帮我设计并实现以下功能的代码：'},
  {icon:'✍️',label:'创意写作',text:'帮我创作一篇关于'},
  {icon:'📚',label:'知识问答',text:'请详细解释一下'},
]

const FEATURE_CARDS=[
  {icon:'🌐',title:'联网搜索',desc:'实时获取最新信息，回答更准确',hue:263},
  {icon:'🤖',title:'多模型',desc:'DeepSeek / GPT / Claude 自由切换',hue:174},
  {icon:'⚡',title:'极速响应',desc:'流式输出，毫秒级实时回复',hue:250},
  {icon:'🔒',title:'安全可靠',desc:'数据加密，隐私保护，稳定运行',hue:10},
]

export default function ChatApp({user,initialCredits,models}:Props){
  const router=useRouter()
  const[credits,setCredits]=useState(initialCredits)
  const[sessions,setSessions]=useState<Session[]>([])
  const[activeId,setActiveId]=useState<string|null>(null)
  const[selectedModel,setSelectedModel]=useState(models[0]?.name??'deepseek-chat')
  const[input,setInput]=useState('')
  const[streaming,setStreaming]=useState(false)
  const[webSearch,setWebSearch]=useState(true)
  const[tick,setTick]=useState(0)
  const bottomRef=useRef<HTMLDivElement>(null)
  const textareaRef=useRef<HTMLTextAreaElement>(null)
  const activeSession=sessions.find(s=>s.id===activeId)??null

  // blinking cursor tick
  useEffect(()=>{const t=setInterval(()=>setTick(v=>v+1),500);return()=>clearInterval(t)},[])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[activeSession?.messages])

  function newSession(){
    const id=genId()
    setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p])
    setActiveId(id);setInput('')
    setTimeout(()=>textareaRef.current?.focus(),100)
  }

  function handleQuickPrompt(text:string){
    setInput(text)
    if(!activeId){const id=genId();setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p]);setActiveId(id)}
    setTimeout(()=>textareaRef.current?.focus(),50)
  }

  const send=useCallback(async(overrideInput?:string)=>{
    const msg=(overrideInput??input).trim()
    if(!msg||streaming||credits<=0)return
    let sid=activeId
    if(!sid){const id=genId();setSessions(p=>[{id,title:msg.slice(0,20),messages:[],modelName:selectedModel},...p]);setActiveId(id);sid=id}
    const userMsg:Message={role:'user',content:msg}
    setSessions(p=>p.map(s=>s.id===sid?{...s,title:s.messages.length===0?msg.slice(0,24):s.title,messages:[...s.messages,userMsg],modelName:selectedModel}:s))
    setInput('');setStreaming(true)
    if(textareaRef.current)textareaRef.current.style.height='auto'
    const msgs=[...(activeSession?.messages??[]),userMsg]
    const t0=Date.now()
    try{
      const{data:{session:cs}}=await createClient().auth.getSession()
      const headers:Record<string,string>={'Content-Type':'application/json'}
      if(cs?.access_token)headers['Authorization']=`Bearer ${cs.access_token}`
      const res=await fetch('/api/chat',{method:'POST',headers,body:JSON.stringify({model:selectedModel,messages:msgs,enableSearch:webSearch})})
      if(!res.ok){const e=await res.json();setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:`错误：${e.error??'请求失败'}`}]}:s));return}
      const reader=res.body!.getReader();const dec=new TextDecoder();let content=''
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:'',model:selectedModel}]}:s))
      while(true){
        const{done,value}=await reader.read();if(done)break
        const chunk=dec.decode(value)
        for(const line of chunk.split('\n')){
          if(!line.startsWith('data: '))continue
          const data=line.slice(6).trim();if(data==='[DONE]')continue
          try{
            const j=JSON.parse(data);const d=j.choices?.[0]?.delta?.content??''
            if(d){content+=d;setSessions(p=>p.map(s=>s.id===sid?{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,content}:m)}:s))}
            if(j.usage?.total_tokens)setCredits(p=>Math.max(0,p-Math.max(1,Math.ceil(j.usage.total_tokens/1000))))
          }catch{}
        }
      }
      const el=((Date.now()-t0)/1000).toFixed(1)
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:s.messages.map((m,i)=>i===s.messages.length-1?{...m,elapsed:parseFloat(el)}:m)}:s))
    }catch{
      setSessions(p=>p.map(s=>s.id===sid?{...s,messages:[...s.messages,{role:'assistant',content:'网络错误，请重试。'}]}:s))
    }finally{setStreaming(false)}
  },[input,streaming,credits,activeId,activeSession,selectedModel])

  async function logout(){await createClient().auth.signOut();router.push('/');router.refresh()}

  const pct=Math.min(100,(credits/5000)*100)
  const hasMessages=activeSession&&activeSession.messages.length>0

  return(
    <>
    <style>{`
      @keyframes scanline{0%{top:-2px}100%{top:100%}}
      @keyframes logoSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes logoPulse{0%,100%{box-shadow:0 0 18px rgba(114,99,255,.5),0 0 36px rgba(114,99,255,.2)}50%{box-shadow:0 0 26px rgba(114,99,255,.8),0 0 54px rgba(114,99,255,.35)}}
      @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:1}}
      @keyframes neonFlicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.7}96%{opacity:1}98%{opacity:.8}}
      @keyframes orbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
      @keyframes ringRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes typing{0%{width:0}100%{width:20px}}
      .typing-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#34e2c4;animation:glowPulse 1.1s ease-in-out infinite;margin:0 1.5px}
      .typing-dot:nth-child(2){animation-delay:.22s}
      .typing-dot:nth-child(3){animation-delay:.44s}
      .msg-in{animation:msgIn .25s ease both}
      .card-glow:hover{box-shadow:0 0 0 1px rgba(114,99,255,.4),0 8px 32px rgba(114,99,255,.18)!important}
      .teal-glow:hover{box-shadow:0 0 0 1px rgba(52,226,196,.4),0 8px 32px rgba(52,226,196,.15)!important}
      .sidebar-item-active{background:rgba(114,99,255,.1);border-left:2px solid #7263ff;box-shadow:inset 2px 0 12px rgba(114,99,255,.15)}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222838;border-radius:4px}::-webkit-scrollbar-thumb:hover{background:#7263ff55}
    `}</style>

    <div className="h-screen flex flex-col" style={{background:'#080b12'}}>

      {/* Particle canvas */}
      <ParticleCanvas/>
      {/* Scan line */}
      <ScanLine/>
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage:'linear-gradient(rgba(114,99,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(114,99,255,.025) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      {/* Ambient orbs */}
      <div className="fixed pointer-events-none z-0" style={{width:600,height:600,top:-200,left:-200,borderRadius:'50%',background:'radial-gradient(circle,rgba(114,99,255,.08),transparent 70%)',filter:'blur(40px)',animation:'orbFloat 12s ease-in-out infinite'}}/>
      <div className="fixed pointer-events-none z-0" style={{width:500,height:500,bottom:-150,right:-150,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,226,196,.06),transparent 70%)',filter:'blur(40px)',animation:'orbFloat 15s ease-in-out infinite reverse'}}/>

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-[10px] flex-shrink-0" style={{background:'rgba(8,11,18,.9)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(114,99,255,.15)',boxShadow:'0 1px 24px rgba(114,99,255,.06)'}}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {/* Logo with ring */}
            <div className="relative w-[34px] h-[34px] flex-shrink-0">
              <div className="absolute inset-0 rounded-[10px]" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)',animation:'logoPulse 3s ease-in-out infinite'}}/>
              <div className="absolute inset-[-4px] rounded-[14px]" style={{border:'1px solid rgba(114,99,255,.3)',animation:'ringRotate 8s linear infinite'}}/>
              <div className="relative w-full h-full rounded-[10px] flex items-center justify-center text-[15px] font-bold text-white z-10" style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)'}}>枢</div>
            </div>
            <span className="font-bold text-[17px] hidden sm:block" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(90deg,#9b8aff,#34e2c4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'neonFlicker 6s ease-in-out infinite'}}>枢 AI</span>
          </Link>

          <div className="w-px h-5" style={{background:'linear-gradient(180deg,transparent,rgba(114,99,255,.4),transparent)'}}/>

          <button onClick={newSession} className="flex items-center gap-1.5 px-3 py-[7px] rounded-[9px] text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.03] active:scale-[.97]"
            style={{background:'linear-gradient(100deg,#7263ff,#9b8aff)',boxShadow:'0 3px 14px rgba(114,99,255,.4),inset 0 1px 0 rgba(255,255,255,.1)'}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            新建对话
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Model select */}
          <div className="relative">
            <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}
              className="appearance-none bg-transparent border rounded-[8px] pl-3 pr-7 py-[6px] text-[12px] text-[#c8cfe0] outline-none cursor-pointer transition-all"
              style={{borderColor:'rgba(114,99,255,.25)',background:'rgba(114,99,255,.07)'}}>
              {models.map(m=><option key={m.id} value={m.name} style={{background:'#0e1220'}}>{m.name}</option>)}
              {models.length===0&&<option value="deepseek-chat" style={{background:'#0e1220'}}>deepseek-chat</option>}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#7263ff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>

          {/* Credits */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-[6px] rounded-[8px]" style={{background:'rgba(52,226,196,.06)',border:'1px solid rgba(52,226,196,.18)'}}>
            <span className="w-[6px] h-[6px] rounded-full bg-[#34e2c4]" style={{boxShadow:'0 0 6px #34e2c4',animation:'glowPulse 2s ease-in-out infinite'}}/>
            <span className="text-[11.5px] text-[#34e2c4] font-mono font-medium">{credits.toLocaleString()}</span>
            <span className="text-[10px] text-[#8d93a8]">pts</span>
          </div>

          <Link href="/redeem" className="hidden md:flex items-center gap-1 px-2.5 py-[5px] rounded-[7px] text-[11.5px] transition-all hover:opacity-90" style={{color:'#9b8aff',border:'1px solid rgba(114,99,255,.25)',background:'rgba(114,99,255,.07)'}}>
            ⚡ 充值
          </Link>
          <span className="text-[11px] text-[#565c70] hidden lg:block truncate max-w-[120px]">{user.email}</span>
          <button onClick={logout} className="text-[11.5px] transition-colors px-2 py-1 rounded-[6px] hover:bg-[#ff6f5e15]" style={{color:'#565c70'}}>退出</button>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-[220px] border-r flex-col hidden md:flex flex-shrink-0" style={{background:'rgba(8,11,18,.7)',backdropFilter:'blur(12px)',borderColor:'rgba(114,99,255,.1)'}}>

          {/* Credits bar */}
          <div className="p-4 border-b" style={{borderColor:'rgba(114,99,255,.1)'}}>
            <div className="flex justify-between text-[11px] mb-2">
              <span style={{color:'#565c70'}}>账户额度</span>
              <span className="font-mono font-semibold" style={{color:'#34e2c4'}}>{credits.toLocaleString()}</span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{background:'rgba(255,255,255,.05)'}}>
              <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:'linear-gradient(90deg,#7263ff,#34e2c4)',boxShadow:'0 0 8px rgba(52,226,196,.6)'}}/>
            </div>
            {credits===0&&<Link href="/redeem" className="block mt-2 text-center text-[11px] hover:underline" style={{color:'#7263ff'}}>去充值 →</Link>}
          </div>

          {/* AI Tools */}
          <div className="p-3 border-b" style={{borderColor:'rgba(114,99,255,.08)'}}>
            <p className="text-[9.5px] uppercase tracking-[.12em] mb-2 px-1 font-medium" style={{color:'#7263ff99'}}>AI 工具</p>
            <Link href="/dashboard/image-gen" className="flex items-center gap-2 w-full px-3 py-[8px] rounded-[9px] text-[12.5px] transition-all duration-200 hover:bg-[rgba(114,99,255,.1)] group mb-1" style={{color:'#8d93a8'}}>
              <span className="text-[15px] group-hover:scale-110 transition-transform duration-200">🎨</span>
              <span className="group-hover:text-[#edeff7] transition-colors">图片生成</span>
            </Link>
            <Link href="/dashboard/video-gen" className="flex items-center gap-2 w-full px-3 py-[8px] rounded-[9px] text-[12.5px] transition-all duration-200 hover:bg-[rgba(52,226,196,.08)] group" style={{color:'#8d93a8'}}>
              <span className="text-[15px] group-hover:scale-110 transition-transform duration-200">🎬</span>
              <span className="group-hover:text-[#edeff7] transition-colors">视频生成</span>
            </Link>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[9.5px] uppercase tracking-[.12em] mb-3 px-1 font-medium" style={{color:'#7263ff99'}}>对话记录</p>
            {sessions.length===0&&(
              <div className="text-center py-10">
                <div className="text-[26px] mb-2" style={{filter:'grayscale(1)',opacity:.25}}>💬</div>
                <p className="text-[11.5px]" style={{color:'#565c70'}}>暂无对话</p>
              </div>
            )}
            <div className="space-y-[2px]">
              {sessions.map(s=>(
                <button key={s.id} onClick={()=>setActiveId(s.id)}
                  className={`w-full text-left px-3 py-[9px] rounded-[9px] text-[12px] truncate transition-all duration-150 ${s.id===activeId?'sidebar-item-active text-[#edeff7]':'text-[#8d93a8] hover:bg-[rgba(114,99,255,.07)] hover:text-[#c8cfe0]'}`}>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">

            {!hasMessages?(
              /* ── WELCOME ── */
              <div className="max-w-[800px] mx-auto px-6 py-10" style={{animation:'fadeSlideUp .5s ease both'}}>

                {/* Hero */}
                <div className="text-center mb-10">
                  {/* Animated logo */}
                  <div className="relative w-[76px] h-[76px] mx-auto mb-6">
                    <div className="absolute inset-0 rounded-[20px]" style={{background:'linear-gradient(135deg,rgba(114,99,255,.15),rgba(52,226,196,.15))',border:'1px solid rgba(114,99,255,.3)',boxShadow:'0 0 40px rgba(114,99,255,.15)'}}/>
                    <div className="absolute inset-[-8px] rounded-[28px]" style={{border:'1px solid rgba(114,99,255,.15)',animation:'ringRotate 10s linear infinite'}}/>
                    <div className="absolute inset-[-16px] rounded-[36px]" style={{border:'1px dashed rgba(52,226,196,.08)',animation:'ringRotate 20s linear infinite reverse'}}/>
                    <div className="relative w-full h-full rounded-[20px] flex items-center justify-center text-[30px] font-bold text-white" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(135deg,#7263ff,#34e2c4)',boxShadow:'0 0 20px rgba(114,99,255,.4)'}}>枢</div>
                  </div>
                  <h2 className="font-bold text-[30px] mb-3" style={{fontFamily:'Space Grotesk,sans-serif',background:'linear-gradient(90deg,#c4bdff,#edeff7,#6ee8d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                    有什么可以帮你的？
                  </h2>
                  <p className="text-[13.5px]" style={{color:'#565c70'}}>
                    当前模型：<span className="font-mono" style={{color:'#9b8aff'}}>{selectedModel}</span>
                    <span className="mx-2" style={{color:'#222838'}}>·</span>
                    联网搜索
                    {webSearch
                      ?<span className="ml-1" style={{color:'#34e2c4'}}>已开启 ●</span>
                      :<span className="ml-1" style={{color:'#565c70'}}>已关闭 ○</span>}
                  </p>
                </div>

                {/* AI Tool cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <Link href="/dashboard/image-gen"
                    className="group rounded-[18px] p-5 border transition-all duration-300 cursor-pointer card-glow hover:-translate-y-1"
                    style={{background:'linear-gradient(135deg,rgba(114,99,255,.1),rgba(114,99,255,.04))',border:'1px solid rgba(114,99,255,.22)',backdropFilter:'blur(8px)'}}>
                    <div className="text-[34px] mb-3 group-hover:scale-110 transition-transform duration-300">🎨</div>
                    <div className="font-bold text-[15px] mb-1" style={{color:'#edeff7'}}>图片生成</div>
                    <p className="text-[11.5px] leading-relaxed" style={{color:'#8d93a8'}}>xAI Aurora · 输入描述，秒出图</p>
                    <div className="mt-3 flex items-center gap-1 text-[11px]" style={{color:'#7263ff99'}}>
                      <span>立即使用</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </Link>
                  <Link href="/dashboard/video-gen"
                    className="group rounded-[18px] p-5 border transition-all duration-300 cursor-pointer teal-glow hover:-translate-y-1"
                    style={{background:'linear-gradient(135deg,rgba(52,226,196,.08),rgba(52,226,196,.03))',border:'1px solid rgba(52,226,196,.2)',backdropFilter:'blur(8px)'}}>
                    <div className="text-[34px] mb-3 group-hover:scale-110 transition-transform duration-300">🎬</div>
                    <div className="font-bold text-[15px] mb-1" style={{color:'#edeff7'}}>视频生成</div>
                    <p className="text-[11.5px] leading-relaxed" style={{color:'#8d93a8'}}>Gemini Veo 2 · 时长/比例自选</p>
                    <div className="mt-3 flex items-center gap-1 text-[11px]" style={{color:'#34e2c499'}}>
                      <span>立即使用</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </Link>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {FEATURE_CARDS.map((f,i)=>(
                    <div key={i} className="rounded-[14px] p-4 border transition-all duration-300 hover:-translate-y-[2px]"
                      style={{background:'rgba(14,18,32,.8)',border:'1px solid rgba(255,255,255,.05)',backdropFilter:'blur(8px)'}}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[15px] flex-shrink-0"
                          style={{background:`hsla(${f.hue},70%,60%,.12)`,border:`1px solid hsla(${f.hue},70%,60%,.2)`}}>
                          {f.icon}
                        </div>
                        <span className="font-semibold text-[13.5px]" style={{color:'#d8dde8'}}>{f.title}</span>
                      </div>
                      <p className="text-[12px] leading-[1.65]" style={{color:'#6b7280'}}>{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Quick prompts */}
                <p className="text-[10px] uppercase tracking-[.1em] font-medium mb-3" style={{color:'#7263ff80'}}>快速开始</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((q,i)=>(
                    <button key={i} onClick={()=>handleQuickPrompt(q.text)}
                      className="flex items-center gap-2 px-4 py-[8px] rounded-full text-[12.5px] transition-all duration-200 hover:-translate-y-[1px]"
                      style={{border:'1px solid rgba(114,99,255,.2)',color:'#8d93a8',background:'rgba(114,99,255,.06)'}}>
                      <span>{q.icon}</span>{q.label}
                    </button>
                  ))}
                </div>
              </div>
            ):(
              /* ── MESSAGES ── */
              <div className="max-w-[840px] mx-auto px-6 py-6 flex flex-col gap-5">
                {activeSession.messages.map((msg,i)=>(
                  <div key={i} className={`flex msg-in ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    {msg.role==='assistant'&&(
                      <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 mr-3 mt-1"
                        style={{background:'linear-gradient(135deg,#7263ff,#34e2c4)',boxShadow:'0 0 10px rgba(114,99,255,.3)'}}>枢</div>
                    )}
                    <div className={`max-w-[76%] ${msg.role==='user'?'':'flex-1'}`}>
                      {msg.role==='assistant'&&(
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-[2px] rounded-[4px]"
                            style={{color:'#34e2c4',background:'rgba(52,226,196,.1)',border:'1px solid rgba(52,226,196,.15)'}}>
                            {msg.model??selectedModel}
                          </span>
                          {msg.elapsed&&<span className="text-[10.5px]" style={{color:'#565c70'}}>· {msg.elapsed}s</span>}
                        </div>
                      )}
                      <div className={`px-4 py-3 text-[14.5px] leading-[1.75] ${msg.role==='user'?'rounded-[14px] rounded-br-[4px]':'rounded-[14px] rounded-bl-[4px]'}`}
                        style={msg.role==='user'
                          ?{background:'linear-gradient(135deg,#6355e8,#7263ff)',boxShadow:'0 4px 18px rgba(114,99,255,.3)',color:'#fff'}
                          :{background:'rgba(14,18,32,.85)',border:'1px solid rgba(114,99,255,.1)',backdropFilter:'blur(8px)',color:'#d8dde8',boxShadow:'0 2px 12px rgba(0,0,0,.3)'}}>
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                        {msg.role==='assistant'&&streaming&&i===activeSession.messages.length-1&&(
                          <span className="inline-flex items-center gap-[3px] ml-2 align-middle">
                            <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                          </span>
                        )}
                      </div>
                    </div>
                    {msg.role==='user'&&(
                      <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ml-3 mt-1"
                        style={{background:'rgba(114,99,255,.12)',border:'1px solid rgba(114,99,255,.25)',color:'#9b8aff'}}>我</div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>
            )}
          </div>

          {/* ── INPUT ── */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <div className="max-w-[840px] mx-auto">
              <div className="rounded-[18px] overflow-hidden transition-all duration-300 focus-within:shadow-[0_0_0_1px_rgba(114,99,255,.4),0_0_32px_rgba(114,99,255,.12)]"
                style={{background:'rgba(12,16,26,.96)',backdropFilter:'blur(16px)',border:'1px solid rgba(114,99,255,.18)'}}>
                <textarea
                  ref={textareaRef}
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                  disabled={streaming||credits<=0}
                  placeholder={credits<=0?'额度不足，请先充值...':'输入消息，Enter 发送 · Shift+Enter 换行'}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-[14px] placeholder-[#3a4058] resize-none px-5 pt-4 pb-2 max-h-[180px] leading-relaxed"
                  style={{color:'#d8dde8'}}
                  onInput={e=>{const el=e.currentTarget;el.style.height='auto';el.style.height=`${Math.min(el.scrollHeight,180)}px`}}
                />
                <div className="flex items-center justify-between px-4 pb-3 pt-1 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Web search toggle */}
                    <button onClick={()=>setWebSearch(v=>!v)}
                      className="flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[11.5px] transition-all duration-200"
                      style={webSearch
                        ?{border:'1px solid rgba(52,226,196,.35)',color:'#34e2c4',background:'rgba(52,226,196,.1)'}
                        :{border:'1px solid rgba(255,255,255,.08)',color:'#565c70',background:'transparent'}}>
                      <span className={`w-[5px] h-[5px] rounded-full ${webSearch?'bg-[#34e2c4]':'bg-[#565c70]'}`}
                        style={webSearch?{boxShadow:'0 0 5px #34e2c4',animation:'glowPulse 1.8s ease-in-out infinite'}:{}}/>
                      联网搜索
                    </button>
                    {/* Model pill */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[11px]"
                      style={{border:'1px solid rgba(114,99,255,.18)',color:'#7263ff',background:'rgba(114,99,255,.07)'}}>
                      🤖 {selectedModel.length>16?selectedModel.slice(0,16)+'…':selectedModel}
                    </div>
                  </div>
                  {/* Send */}
                  <button onClick={()=>send()} disabled={streaming||!input.trim()||credits<=0}
                    className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-white flex-shrink-0 disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{background:'linear-gradient(135deg,#7263ff,#9b8aff)',boxShadow:input.trim()?'0 4px 16px rgba(114,99,255,.5)':'none'}}>
                    {streaming
                      ?<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      :<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 14V2M3 7l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                </div>
              </div>
              <p className="text-center text-[10.5px] mt-2" style={{color:'#3a4058'}}>枢 AI 可能出错，重要信息请自行核实</p>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  )
}
