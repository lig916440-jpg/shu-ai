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

const QUICK=[
  {label:'深度分析',text:'请对以下内容进行深度分析：'},
  {label:'代码实现',text:'帮我设计并实现以下功能：'},
  {label:'创意写作',text:'帮我创作一篇关于'},
  {label:'知识问答',text:'请详细解释一下'},
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
  const[sidebarOpen,setSidebarOpen]=useState(true)
  const bottomRef=useRef<HTMLDivElement>(null)
  const textareaRef=useRef<HTMLTextAreaElement>(null)
  const activeSession=sessions.find(s=>s.id===activeId)??null

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[activeSession?.messages])

  function newSession(){
    const id=genId()
    setSessions(p=>[{id,title:'新对话',messages:[],modelName:selectedModel},...p])
    setActiveId(id);setInput('')
    setTimeout(()=>textareaRef.current?.focus(),100)
  }

  function handleQuick(text:string){
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
        for(const line of dec.decode(value).split('\n')){
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
    <div className="h-screen flex flex-col" style={{background:'var(--black)'}}>
      <div className="fixed inset-0 pointer-events-none z-0" style={{background:'radial-gradient(ellipse 70% 50% at 0% 0%,rgba(245,158,11,.04),transparent),radial-gradient(ellipse 50% 40% at 100% 100%,rgba(245,158,11,.03),transparent)'}}/>

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-5 h-[58px] flex-shrink-0" style={{background:'var(--deep)',borderBottom:'1px solid var(--border)'}}>
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <button onClick={()=>setSidebarOpen(v=>!v)} className="btn btn-icon hidden md:flex">
            <svg width="15" height="12" viewBox="0 0 15 12" fill="none"><rect x="0" y="0" width="15" height="1.8" rx="1" fill="currentColor"/><rect x="0" y="5.1" width="11" height="1.8" rx="1" fill="currentColor"/><rect x="0" y="10.2" width="7" height="1.8" rx="1" fill="currentColor"/></svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center font-bold text-[13px] text-black" style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
            <span className="font-display font-bold text-[16px] hidden sm:block" style={{color:'var(--text)'}}>枢 AI</span>
          </Link>
          <div className="w-px h-4 hidden sm:block" style={{background:'var(--border-h)'}}/>
          <button onClick={newSession} className="btn btn-primary text-[13px] px-4 py-[7px] hidden sm:flex">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            新建对话
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Model */}
          <div className="relative hidden md:block">
            <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}
              className="appearance-none pl-3 pr-7 py-[6px] rounded-[8px] text-[12px] font-medium outline-none cursor-pointer transition-all"
              style={{background:'var(--raised)',border:'1px solid var(--border)',color:'var(--text-2)'}}>
              {models.map(m=><option key={m.id} value={m.name} style={{background:'var(--deep)'}}>{m.name}</option>)}
              {models.length===0&&<option value="deepseek-chat" style={{background:'var(--deep)'}}>deepseek-chat</option>}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="9" height="5" viewBox="0 0 9 5" fill="none"><path d="M1 1l3.5 3L8 1" stroke="var(--text-3)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-1.5 px-3 py-[6px] rounded-[8px]" style={{background:'var(--raised)',border:'1px solid var(--border)'}}>
            <span className="w-[5px] h-[5px] rounded-full" style={{background:'var(--amber)',boxShadow:'0 0 5px var(--amber)',animation:'typeWave 2s ease-in-out infinite'}}/>
            <span className="text-[12px] font-mono-custom font-medium" style={{color:'var(--amber)'}}>{credits.toLocaleString()}</span>
            <span className="text-[10px] hidden sm:inline" style={{color:'var(--text-3)'}}>pts</span>
          </div>

          <Link href="/redeem" className="btn btn-amber-ghost text-[12px] px-3 py-[6px] hidden md:flex">充值</Link>
          <button onClick={logout} className="btn btn-ghost text-[12px] px-3 py-[6px]">退出</button>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        {sidebarOpen&&(
          <aside className="w-[216px] flex-col hidden md:flex flex-shrink-0" style={{background:'var(--deep)',borderRight:'1px solid var(--border)'}}>

            {/* Credits bar */}
            <div className="p-4" style={{borderBottom:'1px solid var(--border)'}}>
              <div className="flex justify-between text-[11.5px] mb-2">
                <span style={{color:'var(--text-3)'}}>账户额度</span>
                <span className="font-mono-custom font-semibold" style={{color:'var(--amber)'}}>{credits.toLocaleString()}</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{background:'var(--raised)'}}>
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:'var(--amber)',boxShadow:'0 0 6px rgba(245,158,11,.6)'}}/>
              </div>
              {credits===0&&<Link href="/redeem" className="block mt-2 text-center text-[11px] hover:opacity-80 transition-opacity" style={{color:'var(--amber)'}}>去充值 →</Link>}
            </div>

            {/* AI Tools */}
            <div className="p-3" style={{borderBottom:'1px solid var(--border)'}}>
              <p className="text-[10px] uppercase tracking-[.1em] font-semibold mb-2 px-1" style={{color:'var(--text-3)'}}>AI 工具</p>
              <Link href="/dashboard/image-gen" className="sidebar-item mb-0.5">
                <span className="text-[15px]">🎨</span> 图片生成
              </Link>
              <Link href="/dashboard/video-gen" className="sidebar-item">
                <span className="text-[15px]">🎬</span> 视频生成
              </Link>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-[10px] uppercase tracking-[.1em] font-semibold mb-2 px-1" style={{color:'var(--text-3)'}}>对话记录</p>
              {sessions.length===0&&(
                <div className="text-center py-8">
                  <div className="text-[24px] mb-2 opacity-20">💬</div>
                  <p className="text-[11.5px]" style={{color:'var(--text-3)'}}>暂无对话</p>
                </div>
              )}
              {sessions.map(s=>(
                <button key={s.id} onClick={()=>setActiveId(s.id)}
                  className={`sidebar-item w-full text-left truncate ${s.id===activeId?'active':''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 opacity-40"><path d="M2 2h8a1 1 0 011 1v5a1 1 0 01-1 1H4L1 11V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/></svg>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {!hasMessages?(
              /* ── WELCOME ── */
              <div className="max-w-[780px] mx-auto px-6 py-10 fade-up">

                {/* Greeting */}
                <div className="mb-10">
                  <h2 className="font-display font-bold mb-3" style={{fontSize:'clamp(26px,4vw,38px)',color:'var(--text)'}}>
                    你好，有什么可以帮你的？
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="tag">🤖 {selectedModel}</span>
                    <span className="tag" style={{color:webSearch?'var(--amber)':'var(--text-3)',borderColor:webSearch?'rgba(245,158,11,.25)':'var(--border)'}}>
                      {webSearch?'🌐 联网开启':'🌐 联网关闭'}
                    </span>
                  </div>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-3 grid-rows-2 gap-3 mb-8" style={{gridTemplateRows:'auto auto'}}>
                  {/* Image gen - tall left card */}
                  <Link href="/dashboard/image-gen"
                    className="card card-amber col-span-1 row-span-2 p-5 flex flex-col justify-between cursor-pointer group"
                    style={{minHeight:'200px'}}>
                    <div>
                      <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[18px] mb-4" style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.16)'}}>🎨</div>
                      <div className="font-display font-bold text-[16px] mb-1.5" style={{color:'var(--text)'}}>图片生成</div>
                      <p className="text-[12.5px] leading-[1.6]" style={{color:'var(--text-2)'}}>xAI Aurora · 输入描述，秒出图</p>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'var(--amber)'}}>
                      立即使用
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </Link>

                  {/* Video gen - top right wide */}
                  <Link href="/dashboard/video-gen"
                    className="card card-amber col-span-2 p-5 flex items-start gap-4 cursor-pointer group">
                    <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0" style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.16)'}}>🎬</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[15px] mb-1" style={{color:'var(--text)'}}>视频生成</div>
                      <p className="text-[12.5px]" style={{color:'var(--text-2)'}}>Gemini Veo 2 · 时长/比例自选</p>
                    </div>
                    <svg className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{color:'var(--amber)'}}><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>

                  {/* Feature pills row */}
                  {[{i:'🌐',t:'联网搜索',d:'实时信息'},{i:'⚡',t:'极速响应',d:'毫秒输出'}].map((f,i)=>(
                    <div key={i} className="card p-4 flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[15px] flex-shrink-0" style={{background:'var(--raised)'}}>
                        {f.i}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold" style={{color:'var(--text)'}}>{f.t}</div>
                        <div className="text-[11px]" style={{color:'var(--text-3)'}}>{f.d}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick prompts */}
                <p className="text-[10px] uppercase tracking-[.1em] font-semibold mb-3" style={{color:'var(--text-3)'}}>快速开始</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q,i)=>(
                    <button key={i} onClick={()=>handleQuick(q.text)}
                      className="btn btn-ghost text-[13px] px-4 py-[8px]">
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            ):(
              /* ── MESSAGES ── */
              <div className="max-w-[820px] mx-auto px-6 py-8 flex flex-col gap-6">
                {activeSession.messages.map((msg,i)=>(
                  <div key={i} className={`flex msg-in ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    {msg.role==='assistant'&&(
                      <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center font-bold text-[12px] text-black flex-shrink-0 mr-3 mt-1"
                        style={{background:'var(--amber)',fontFamily:'Syne,sans-serif'}}>枢</div>
                    )}
                    <div className={`max-w-[78%] ${msg.role==='user'?'':'flex-1'}`}>
                      {msg.role==='assistant'&&(
                        <div className="flex items-center gap-2 mb-2">
                          <span className="tag" style={{fontSize:'10.5px'}}>{msg.model??selectedModel}</span>
                          {msg.elapsed&&<span className="text-[10.5px]" style={{color:'var(--text-3)'}}>· {msg.elapsed}s</span>}
                        </div>
                      )}
                      <div className={`px-4 py-3 text-[14.5px] leading-[1.8] ${msg.role==='user'?'rounded-[14px] rounded-br-[4px]':'rounded-[14px] rounded-bl-[4px]'}`}
                        style={msg.role==='user'
                          ?{background:'var(--amber)',color:'#07070a',fontWeight:500}
                          :{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)'}}>
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                        {msg.role==='assistant'&&streaming&&i===activeSession.messages.length-1&&(
                          <span className="inline-flex items-center gap-[3px] ml-2 align-middle">
                            <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                          </span>
                        )}
                      </div>
                    </div>
                    {msg.role==='user'&&(
                      <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ml-3 mt-1"
                        style={{background:'var(--raised)',border:'1px solid var(--border-h)',color:'var(--text-2)'}}>我</div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>
            )}
          </div>

          {/* ── INPUT ── */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <div className="max-w-[820px] mx-auto">
              <div className="rounded-[16px] overflow-hidden transition-all duration-250 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,.35),0_0_24px_rgba(245,158,11,.08)]"
                style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
                <textarea
                  ref={textareaRef}
                  value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                  disabled={streaming||credits<=0}
                  placeholder={credits<=0?'额度不足，请先充值...':'输入消息，Enter 发送 · Shift+Enter 换行'}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-[14px] resize-none px-5 pt-4 pb-2 max-h-[180px] leading-relaxed"
                  style={{color:'var(--text)'}}
                  onInput={e=>{const el=e.currentTarget;el.style.height='auto';el.style.height=`${Math.min(el.scrollHeight,180)}px`}}
                />
                <div className="flex items-center justify-between px-4 pb-3 pt-1 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={()=>setWebSearch(v=>!v)}
                      className="btn text-[11.5px] px-3 py-[5px]"
                      style={webSearch
                        ?{background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.3)',color:'var(--amber)',borderRadius:'var(--r-s)'}
                        :{background:'transparent',border:'1px solid var(--border)',color:'var(--text-3)',borderRadius:'var(--r-s)'}}>
                      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{background:webSearch?'var(--amber)':'var(--text-3)',boxShadow:webSearch?'0 0 5px var(--amber)':''}}/>
                      联网搜索
                    </button>
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-[5px] rounded-[var(--r-s)] text-[11.5px]"
                      style={{background:'var(--raised)',border:'1px solid var(--border)',color:'var(--text-3)'}}>
                      🤖 {selectedModel.length>16?selectedModel.slice(0,16)+'…':selectedModel}
                    </div>
                  </div>
                  <button onClick={()=>send()} disabled={streaming||!input.trim()||credits<=0}
                    className="btn btn-primary w-[38px] h-[38px] rounded-[10px] flex-shrink-0 p-0"
                    style={{minWidth:'38px'}}>
                    {streaming
                      ?<svg className="w-4 h-4" style={{animation:'rotate 1s linear infinite'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                      :<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 13V2M3 6l4.5-4 4.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                </div>
              </div>
              <p className="text-center text-[10.5px] mt-2" style={{color:'var(--text-3)'}}>枢 AI 可能出错，重要内容请自行核实</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
